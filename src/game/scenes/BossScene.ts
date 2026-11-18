import Phaser from 'phaser';
import { BOSS_CONFIGS, BossId } from '../config/BossConfig';
import { SoundManager } from '../audio/SoundManager';
import { EventBus } from '../utils/EventBus';

interface BossSceneData {
  bossId: BossId;
}

export class BossScene extends Phaser.Scene {
  private alertGfx!: Phaser.GameObjects.Graphics;
  private activeTimer = 0;

  constructor() {
    super('BossScene');
  }

  create(data: BossSceneData): void {
    const boss = BOSS_CONFIGS[data.bossId];
    this.alertGfx = this.add.graphics().setDepth(50);
    this.activeTimer = 2.6;

    SoundManager.playBossWarning();
    EventBus.emit('boss:warning', { name: boss.name, title: boss.title });

    this.time.delayedCall(2600, () => {
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
    this.activeTimer -= dt;
    if (this.activeTimer <= 0) return;

    const w = this.scale.width;
    const h = this.scale.height;
    const pulse = Math.abs(Math.sin(this.activeTimer * 8)) * 0.22;

    this.alertGfx.clear();
    this.alertGfx.fillStyle(0xf43f5e, pulse * 0.45);
    this.alertGfx.fillRect(0, 0, w, 12);
    this.alertGfx.fillRect(0, h - 12, w, 12);
    this.alertGfx.lineStyle(2, 0xf43f5e, pulse * 1.4);
    this.alertGfx.strokeRect(8, 8, w - 16, h - 16);
  }
}
