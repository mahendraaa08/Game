import Phaser from 'phaser';
import { BOSS_CONFIGS, BossId } from '../config/BossConfig';
import { SoundManager } from '../audio/SoundManager';
import { EventBus } from '../utils/EventBus';
import { StorageManager } from '../utils/StorageManager';

interface BossSceneData {
  bossId: BossId;
}

const WARNING_DURATION_SEC = 2.75;

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

export class BossScene extends Phaser.Scene {
  private alertGfx!: Phaser.GameObjects.Graphics;
  private elapsedSec = 0;
  private lowFx = false;
  private allowShake = true;
  private bossPrimaryColor = 0xf43f5e;
  private peakRingFired = false;

  constructor() {
    super('BossScene');
  }

  create(data: BossSceneData): void {
    const boss = BOSS_CONFIGS[data.bossId];
    const settings = StorageManager.load().settings;
    this.lowFx = settings.fxQuality === 'low';
    this.allowShake = settings.screenShake;
    this.bossPrimaryColor = boss.primaryColor;
    this.elapsedSec = 0;
    this.peakRingFired = false;

    this.alertGfx = this.add.graphics().setDepth(50);

    SoundManager.playBossWarning();
    EventBus.emit('boss:warning', {
      name: boss.name,
      title: boss.title,
      accentHex: boss.accentHex,
      durationMs: WARNING_DURATION_SEC * 1000,
    });

    if (this.allowShake) {
      this.time.delayedCall(160, () => {
        if (this.scene.isActive('BossScene')) {
          this.cameras.main.shake(180, 0.003);
        }
      });
      this.time.delayedCall(960, () => {
        if (this.scene.isActive('BossScene')) {
          this.cameras.main.shake(260, 0.0042);
        }
      });
    }

    this.time.delayedCall(WARNING_DURATION_SEC * 1000, () => {
      EventBus.emit('boss:warning', null);
      if (this.scene.isActive('BossScene')) {
        this.scene.stop('BossScene');
      }
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      EventBus.emit('boss:warning', null);
      this.alertGfx?.destroy();
    });
  }

  update(_time: number, rawDelta: number): void {
    const dt = Math.min(rawDelta / 1000, 0.05);
    this.elapsedSec += dt;
    if (this.elapsedSec >= WARNING_DURATION_SEC) return;

    const p = this.elapsedSec / WARNING_DURATION_SEC; // 0 -> 1
    const w = this.scale.width;
    const h = this.scale.height;

    // Structured intensity envelope:
    // 0.00..0.12 fade-in -> 0.12..0.46 escalating pulse + subtle flicker -> 0.46..1.00 smooth fade-out
    const fadeIn = smoothstep(0, 0.12, p);
    const fadeOut = 1 - smoothstep(0.48, 1.0, p);
    const pulseWave = 0.72 + 0.28 * Math.sin(this.elapsedSec * 10.5);
    const microFlicker = this.lowFx
      ? 1
      : 0.92 + 0.08 * Math.sin(this.elapsedSec * 38) * (1 - smoothstep(0.45, 0.75, p));
    const envelope = fadeIn * fadeOut * pulseWave * microFlicker;

    // Peak arrival shockwave at boss descent midpoint (t ~ 0.96s)
    if (!this.peakRingFired && this.elapsedSec >= 0.96) {
      this.peakRingFired = true;
      if (!this.lowFx) {
        const targetY = w < 1024 ? Math.round(Math.max(135, Math.min(190, h * 0.24))) : 148;
        const flare = this.add.circle(w * 0.5, targetY, 26, 0xf43f5e, 0.1).setDepth(48);
        flare.setStrokeStyle(2.5, this.bossPrimaryColor, 0.55);
        this.tweens.add({
          targets: flare,
          scaleX: 4.5,
          scaleY: 2.8,
          alpha: 0,
          duration: 540,
          ease: 'Cubic.easeOut',
          onComplete: () => flare.destroy(),
        });
      }
    }

    this.alertGfx.clear();
    if (envelope <= 0.01) return;

    // 1. Subtle tapered crimson edge rails (thin perimeter accents, zero obstruction)
    const railThickness = Math.max(3, Math.round(Math.min(w, h) * 0.006));
    this.alertGfx.fillStyle(0xf43f5e, 0.28 * envelope);
    this.alertGfx.fillRect(0, 0, w, railThickness);
    this.alertGfx.fillRect(0, h - railThickness, w, railThickness);
    this.alertGfx.fillRect(0, railThickness, railThickness, h - railThickness * 2);
    this.alertGfx.fillRect(w - railThickness, railThickness, railThickness, h - railThickness * 2);

    // 2. Crisp inner tactical perimeter hairline & corner brackets
    const inset = 10;
    const bracketLen = Math.min(34, Math.round(Math.min(w, h) * 0.06));
    this.alertGfx.lineStyle(1.5, 0xfb7185, 0.34 * envelope);
    this.alertGfx.strokeRect(inset, inset, w - inset * 2, h - inset * 2);

    this.alertGfx.lineStyle(2.5, 0xf43f5e, 0.72 * envelope);
    // Top-left bracket
    this.alertGfx.lineBetween(inset, inset + bracketLen, inset, inset);
    this.alertGfx.lineBetween(inset, inset, inset + bracketLen, inset);
    // Top-right bracket
    this.alertGfx.lineBetween(w - inset - bracketLen, inset, w - inset, inset);
    this.alertGfx.lineBetween(w - inset, inset, w - inset, inset + bracketLen);
    // Bottom-left bracket
    this.alertGfx.lineBetween(inset, h - inset - bracketLen, inset, h - inset);
    this.alertGfx.lineBetween(inset, h - inset, inset + bracketLen, h - inset);
    // Bottom-right bracket
    this.alertGfx.lineBetween(w - inset - bracketLen, h - inset, w - inset, h - inset);
    this.alertGfx.lineBetween(w - inset, h - inset - bracketLen, w - inset, h - inset);
  }
}
