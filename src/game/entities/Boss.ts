import Phaser from 'phaser';
import { BOSS_CONFIGS, BossDefinition, BossId } from '../config/BossConfig';
import { EnemyClass } from '../config/EnemyConfig';
import { WEAPON_RUNTIME_TUNING } from '../config/WeaponEvolutionConfig';
import { SoundManager } from '../audio/SoundManager';
import { ProjectileManager } from './ProjectileManager';
import { allocateTargetId, Targetable } from './Targetable';

type BossMoveMode = 'patrol' | 'reposition' | 'stalk' | 'surge_dip' | 'phase_glide';

export interface BossCombatModifiers {
  damageMult?: number;
  attackRateMult?: number;
  projectileSpeedMult?: number;
  aggressionMult?: number;
}

interface PendingBossBeat {
  delayMs: number;
  fn: (playerX: number, playerY: number, projectiles: ProjectileManager) => void;
}

interface BossLaserTelegraph {
  originOffsetX: number;
  originOffsetY: number;
  targetX: number;
  targetY: number;
  timerMs: number;
  maxTimerMs: number;
  lockThresholdMs: number;
  trackSpeed: number;
  damage: number;
  width: number;
  color: number;
}

export class BossEntity implements Targetable {
  scene: Phaser.Scene;
  def: BossDefinition;
  sprite: Phaser.GameObjects.Sprite;
  private telegraphGfx: Phaser.GameObjects.Graphics;
  private auraGfx: Phaser.GameObjects.Graphics;

  readonly targetId: number = allocateTargetId();
  active = false;
  hp = 1000;
  maxHp = 1000;
  radius = 68;
  phase: 1 | 2 | 3 = 1;
  entering = true;
  invulnerable = true;

  private age = 0;
  private targetY = 148;
  private vx = 0;
  private vy = 0;
  private moveDir = 1;
  private moveMode: BossMoveMode = 'patrol';
  private moveModeTimerMs = 3200;
  private anchorX = 0;
  private anchorY = 148;
  private phaseGlideAlpha = 1;

  private attackTimerMs = 1350;
  private spiralAngle = 0;
  private patternIndex = 0;
  private phaseTransitionMs = 0;

  private pendingBeats: PendingBossBeat[] = [];
  private activeLasers: BossLaserTelegraph[] = [];

  private paralyzeTimerMs = 0;
  private paralyzeImmunityMs = 0;
  private entranceTween?: Phaser.Tweens.Tween;

  private damageMult = 1;
  private attackRateMult = 1;
  private projectileSpeedMult = 1;
  private aggressionMult = 1;

  private onSpawnMinion: (enemyClass: EnemyClass, x: number, y: number) => void;
  private onPhaseShift: (newPhase: 1 | 2 | 3) => void;
  private onBossDefeated: (boss: BossEntity) => void;

  constructor(
    scene: Phaser.Scene,
    bossId: BossId,
    onSpawnMinion: (enemyClass: EnemyClass, x: number, y: number) => void,
    onPhaseShift: (newPhase: 1 | 2 | 3) => void,
    onBossDefeated: (boss: BossEntity) => void,
    hpMultiplier = 1,
    combatMods?: BossCombatModifiers
  ) {
    this.scene = scene;
    this.def = BOSS_CONFIGS[bossId];
    this.onSpawnMinion = onSpawnMinion;
    this.onPhaseShift = onPhaseShift;
    this.onBossDefeated = onBossDefeated;
    this.damageMult = Phaser.Math.Clamp(combatMods?.damageMult ?? 1, 0.5, 3.0);
    this.attackRateMult = Phaser.Math.Clamp(combatMods?.attackRateMult ?? 1, 0.65, 2.0);
    this.projectileSpeedMult = Phaser.Math.Clamp(combatMods?.projectileSpeedMult ?? 1, 0.7, 1.65);
    this.aggressionMult = Phaser.Math.Clamp(combatMods?.aggressionMult ?? 1, 0.7, 1.8);

    this.maxHp = Math.max(1, Math.round(this.def.maxHp * hpMultiplier));
    this.hp = this.maxHp;
    this.radius = Math.round(this.def.width * 0.42);
    this.active = true;

    this.targetY =
      scene.scale.width < 1024
        ? Math.round(Math.max(135, Math.min(190, scene.scale.height * 0.24)))
        : 148;

    const startX = scene.scale.width / 2;
    this.anchorX = startX;
    this.anchorY = this.targetY;
    this.auraGfx = scene.add.graphics().setDepth(8);
    this.sprite = scene.add.sprite(startX, -130, this.def.textureKey).setDepth(10);
    this.telegraphGfx = scene.add.graphics().setDepth(13);

    // Smooth dramatic entrance
    this.entranceTween = this.scene.tweens.add({
      targets: this.sprite,
      y: this.targetY,
      duration: 2100,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        this.entranceTween = undefined;
        if (!this.active || !this.sprite.active) return;
        this.entering = false;
        this.invulnerable = false;
        const lockRing = this.scene.add
          .circle(this.x, this.y, this.radius * 0.65, this.def.primaryColor, 0.08)
          .setDepth(7);
        lockRing.setStrokeStyle(2, this.def.secondaryColor, 0.65);
        this.scene.tweens.add({
          targets: lockRing,
          scaleX: 2.35,
          scaleY: 2.35,
          alpha: 0,
          duration: 460,
          ease: 'Cubic.easeOut',
          onComplete: () => lockRing.destroy(),
        });
      },
    });
  }

  setChronoPaused(paused: boolean): void {
    if (!this.entranceTween) return;
    if (paused && this.entranceTween.isPlaying()) {
      this.entranceTween.pause();
    } else if (!paused && this.entranceTween.isPaused()) {
      this.entranceTween.resume();
    }
  }

  get x(): number {
    return this.sprite.x;
  }

  get y(): number {
    return this.sprite.y;
  }

  get ageSec(): number {
    return this.age;
  }

  applyParalyze(baseDurationSec: number): boolean {
    if (
      !this.active ||
      this.entering ||
      this.invulnerable ||
      this.phaseTransitionMs > 0 ||
      this.paralyzeTimerMs > 0 ||
      this.paralyzeImmunityMs > 0
    ) {
      return false;
    }
    this.paralyzeTimerMs = Math.max(
      180,
      Math.round(baseDurationSec * 1000 * WEAPON_RUNTIME_TUNING.lightning.evo2BossResistance)
    );
    return true;
  }

  takeDamage(amount: number): boolean {
    if (!this.active || this.invulnerable || this.entering) return false;

    this.hp = Math.max(0, this.hp - amount);
    this.sprite.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
    this.scene.time.delayedCall(50, () => {
      if (this.active && this.sprite.active) {
        this.sprite.clearTint().setTintMode(Phaser.TintModes.MULTIPLY);
      }
    });

    const ratio = this.hp / this.maxHp;
    if (this.phase === 1 && ratio <= 0.66 && this.hp > 0) {
      this.enterPhase(2);
    } else if (this.phase === 2 && ratio <= 0.33 && this.hp > 0) {
      this.enterPhase(3);
    }

    if (this.hp <= 0) {
      this.triggerDefeat();
      return true;
    }
    return false;
  }

  private enterPhase(nextPhase: 2 | 3): void {
    this.phase = nextPhase;
    this.phaseTransitionMs = 1100;
    this.invulnerable = true;
    this.patternIndex = 0;
    this.attackTimerMs = 820;
    this.pendingBeats.length = 0;
    this.activeLasers.length = 0;
    this.moveMode = 'reposition';
    this.anchorX = this.scene.scale.width * 0.5;
    this.anchorY = this.targetY;
    this.moveModeTimerMs = 1500;
    this.phaseGlideAlpha = 1;

    SoundManager.playBossPhaseShift();
    this.scene.cameras.main.shake(320, 0.01);

    const ring = this.scene.add.circle(this.x, this.y, 24, this.def.primaryColor, 0.2).setDepth(15);
    ring.setStrokeStyle(5, this.def.secondaryColor, 0.95);
    this.scene.tweens.add({
      targets: ring,
      scaleX: 16,
      scaleY: 16,
      alpha: 0,
      duration: 600,
      onComplete: () => ring.destroy(),
    });

    const innerRing = this.scene.add.circle(this.x, this.y, 16, 0xffffff, 0.12).setDepth(15);
    innerRing.setStrokeStyle(3, nextPhase === 3 ? 0xf43f5e : this.def.primaryColor, 0.9);
    this.scene.tweens.add({
      targets: innerRing,
      scaleX: 10,
      scaleY: 10,
      alpha: 0,
      duration: 420,
      onComplete: () => innerRing.destroy(),
    });

    this.onPhaseShift(nextPhase);
  }

  private triggerDefeat(): void {
    this.active = false;
    this.invulnerable = true;
    this.pendingBeats.length = 0;
    this.activeLasers.length = 0;
    this.telegraphGfx.clear();
    this.auraGfx.clear();
    this.onBossDefeated(this);
  }

  update(
    dt: number,
    playerX: number,
    playerY: number,
    projectiles: ProjectileManager,
    onLaserHitPlayer: (dmg: number) => void
  ): void {
    if (!this.active) return;
    this.age += dt;
    const dtMs = dt * 1000;
    const w = this.scene.scale.width;
    const h = this.scene.scale.height;

    this.auraGfx.clear();
    this.telegraphGfx.clear();

    // Boss core & phase aura visuals
    const pulse = 0.2 + 0.12 * Math.sin(this.age * (3 + this.phase * 2));
    const auraColor = this.phase === 3 ? 0xf43f5e : this.def.primaryColor;
    this.auraGfx.fillStyle(auraColor, pulse);
    this.auraGfx.fillCircle(this.x, this.y, this.radius + 16);

    if (this.phase >= 2) {
      const spin = this.age * (this.phase === 3 ? 2.8 : 1.6);
      const orbitR = this.radius + 22;
      this.auraGfx.lineStyle(2, this.phase === 3 ? 0xfda4af : this.def.secondaryColor, 0.45);
      this.auraGfx.beginPath();
      this.auraGfx.arc(this.x, this.y, orbitR, spin, spin + Math.PI * 0.65);
      this.auraGfx.strokePath();
      this.auraGfx.beginPath();
      this.auraGfx.arc(this.x, this.y, orbitR, spin + Math.PI, spin + Math.PI * 1.65);
      this.auraGfx.strokePath();
    }

    if (this.entering) return;

    if (this.phaseTransitionMs > 0) {
      this.phaseTransitionMs -= dtMs;
      // Smoothly glide back toward upper center during transition shockwave
      const recenterAlpha = 1 - Math.exp(-3.5 * dt);
      this.vx = Phaser.Math.Linear(this.vx, (w * 0.5 - this.sprite.x) * 1.6, recenterAlpha);
      this.vy = Phaser.Math.Linear(this.vy, (this.targetY - this.sprite.y) * 1.6, recenterAlpha);
      this.sprite.x += this.vx * dt;
      this.sprite.y += this.vy * dt;
      this.sprite.setRotation(Phaser.Math.Linear(this.sprite.rotation, 0, Math.min(1, 8 * dt)));
      this.sprite.setAlpha(Math.sin(this.age * 35) > 0 ? 1 : 0.48);

      if (this.phaseTransitionMs <= 0) {
        this.invulnerable = false;
        this.sprite.setAlpha(1);
        this.moveMode = 'patrol';
        this.moveModeTimerMs = 2600;
      }
      return;
    }

    if (this.paralyzeTimerMs > 0) {
      this.paralyzeTimerMs -= dtMs;
      // Strong boss resistance: brief overload slow & attack pause rather than full lock
      this.updateMovement(dt * 0.18, dtMs * 0.18, w, h, playerX);
      const r = this.radius + 10;
      for (let a = 0; a < 4; a++) {
        const ang1 = (Math.PI * 2 * a) / 4 + this.age * 18 + Math.random() * 0.5;
        const ang2 = ang1 + 0.85;
        const x1 = this.x + Math.cos(ang1) * (r * 0.72);
        const y1 = this.y + Math.sin(ang1) * (r * 0.55);
        const xm = this.x + Math.cos((ang1 + ang2) * 0.5) * (r * 1.12);
        const ym = this.y + Math.sin((ang1 + ang2) * 0.5) * (r * 0.85);
        const x2 = this.x + Math.cos(ang2) * (r * 0.72);
        const y2 = this.y + Math.sin(ang2) * (r * 0.55);
        this.telegraphGfx.lineStyle(3, 0x38bdf8, 0.8);
        this.telegraphGfx.lineBetween(x1, y1, xm, ym);
        this.telegraphGfx.lineBetween(xm, ym, x2, y2);
        this.telegraphGfx.lineStyle(1.4, 0xffffff, 0.95);
        this.telegraphGfx.lineBetween(x1, y1, xm, ym);
        this.telegraphGfx.lineBetween(xm, ym, x2, y2);
      }
      if (this.paralyzeTimerMs <= 0) {
        this.paralyzeTimerMs = 0;
        this.paralyzeImmunityMs = WEAPON_RUNTIME_TUNING.lightning.evo2BossImmunityMs;
      }
      return;
    }

    this.paralyzeImmunityMs = Math.max(0, this.paralyzeImmunityMs - dtMs);

    // 1. Dynamic smooth steering per Boss personality & phase
    this.updateMovement(dt, dtMs, w, h, playerX);

    // 2. Active multi-lance Laser Telegraphs (smooth tracking then lock before firing)
    this.updateLasers(dt, dtMs, playerX, playerY, h, projectiles, onLaserHitPlayer);

    // 3. Pending multi-beat attack callbacks (zero orphaned timers)
    const scaledProj = this.createScaledProjectileAdapter(projectiles);
    for (let i = this.pendingBeats.length - 1; i >= 0; i--) {
      const beat = this.pendingBeats[i];
      beat.delayMs -= dtMs;
      if (beat.delayMs <= 0) {
        this.pendingBeats.splice(i, 1);
        beat.fn(playerX, playerY, scaledProj);
      }
    }

    // 4. Primary Attack Cadence & Weapon Pod Windup Glow
    this.attackTimerMs -= dtMs * this.attackRateMult;
    if (this.attackTimerMs <= 380 && this.attackTimerMs > 0) {
      const glow = 1 - this.attackTimerMs / 380;
      const podColor = this.phase === 3 ? 0xfda4af : 0xfef08a;
      this.telegraphGfx.fillStyle(podColor, 0.55 * glow);
      this.telegraphGfx.fillCircle(this.x - 42, this.y + 24, 9 + glow * 8);
      this.telegraphGfx.fillCircle(this.x + 42, this.y + 24, 9 + glow * 8);
    }

    if (this.attackTimerMs <= 0) {
      this.executeAttackPattern(playerX, playerY, scaledProj);
      const baseCd =
        this.def.id === 'void_emperor'
          ? 1120
          : this.def.id === 'shadow_titan'
          ? 1280
          : 1420;
      this.attackTimerMs = Math.max(540, baseCd - (this.phase - 1) * 230);
    }
  }

  private createScaledProjectileAdapter(projectiles: ProjectileManager): ProjectileManager {
    if (
      Math.abs(this.damageMult - 1) < 0.001 &&
      Math.abs(this.projectileSpeedMult - 1) < 0.001
    ) {
      return projectiles;
    }
    const dmgMult = this.damageMult;
    const spdMult = this.projectileSpeedMult;
    return {
      spawnEnemyBullet: (
        x: number,
        y: number,
        vx: number,
        vy: number,
        damage: number,
        textureKey?: string,
        radius?: number,
        tint?: number,
        options?: Parameters<ProjectileManager['spawnEnemyBullet']>[8]
      ) => {
        const scaledOpts = options
          ? {
              ...options,
              splitSpeed:
                options.splitSpeed !== undefined ? options.splitSpeed * spdMult : undefined,
              splitDamage:
                options.splitDamage !== undefined
                  ? Math.max(1, Math.round(options.splitDamage * dmgMult))
                  : undefined,
            }
          : undefined;
        projectiles.spawnEnemyBullet(
          x,
          y,
          vx * spdMult,
          vy * spdMult,
          Math.max(1, Math.round(damage * dmgMult)),
          textureKey,
          radius,
          tint,
          scaledOpts
        );
      },
    } as ProjectileManager;
  }

  private updateMovement(dt: number, dtMs: number, w: number, h: number, playerX: number): void {
    const margin = Math.max(115, this.def.width * 0.62);
    const speedMult = this.phase === 1 ? 1 : this.phase === 2 ? 1.28 : 1.54;
    const baseSpd = this.def.moveSpeed * speedMult * this.aggressionMult;

    this.moveModeTimerMs -= dtMs * Math.min(1.3, Math.max(0.8, this.aggressionMult));
    if (this.moveModeTimerMs <= 0) {
      this.pickNextMoveMode(w);
    }

    let targetVx = 0;
    let targetVy = 0;
    let steerRate = 4.6;
    let desiredAlpha = 1;

    switch (this.moveMode) {
      case 'patrol': {
        if (this.def.id === 'venom_queen') {
          // Organic figure-8 Lissajous weave
          const ampX = Math.max(80, w * 0.32 - margin * 0.25);
          const desiredX = w * 0.5 + Math.sin(this.age * (1.1 + this.phase * 0.15)) * ampX;
          const desiredY = this.targetY + Math.sin(this.age * 2.2) * 26;
          targetVx = (desiredX - this.sprite.x) * 2.4;
          targetVy = (desiredY - this.sprite.y) * 2.6;
          steerRate = 5.0;
        } else {
          if (this.sprite.x > w - margin - 18) this.moveDir = -1;
          else if (this.sprite.x < margin + 18) this.moveDir = 1;
          targetVx = this.moveDir * baseSpd;
          const bobAmp = this.def.id === 'iron_guardian' ? 14 : 24;
          const desiredY = this.targetY + Math.sin(this.age * 1.7) * bobAmp;
          targetVy = (desiredY - this.sprite.y) * 2.5;
          steerRate = this.def.id === 'iron_guardian' ? 3.8 : 5.2;
        }
        break;
      }

      case 'reposition': {
        targetVx = Phaser.Math.Clamp((this.anchorX - this.sprite.x) * 2.4, -baseSpd * 1.35, baseSpd * 1.35);
        targetVy = Phaser.Math.Clamp((this.anchorY - this.sprite.y) * 2.5, -140, 140);
        steerRate = 5.8;
        break;
      }

      case 'stalk': {
        const dx = playerX - this.sprite.x;
        targetVx = Phaser.Math.Clamp(dx * 1.8, -baseSpd * 1.25, baseSpd * 1.25);
        const hoverY = this.targetY + Math.sin(this.age * 2.4) * 20;
        targetVy = (hoverY - this.sprite.y) * 2.6;
        steerRate = 6.2;
        break;
      }

      case 'surge_dip': {
        // Brief tactical forward push (safely capped in upper arena) + strafe
        const dipY = Math.min(h * 0.36, this.targetY + 58);
        if (this.sprite.x > w - margin - 18) this.moveDir = -1;
        else if (this.sprite.x < margin + 18) this.moveDir = 1;
        targetVx = this.moveDir * baseSpd * 0.85;
        targetVy = (dipY - this.sprite.y) * 2.4;
        steerRate = 4.4;
        break;
      }

      case 'phase_glide': {
        // Shadow Titan / Void Emperor translucent stealth reposition glide
        desiredAlpha = 0.32;
        targetVx = Phaser.Math.Clamp((this.anchorX - this.sprite.x) * 4.2, -baseSpd * 2.25, baseSpd * 2.25);
        targetVy = Phaser.Math.Clamp((this.anchorY - this.sprite.y) * 3.8, -180, 180);
        steerRate = 9.0;
        if (Math.hypot(this.anchorX - this.sprite.x, this.anchorY - this.sprite.y) < 36) {
          this.moveMode = 'stalk';
          this.moveModeTimerMs = 2000;
        }
        break;
      }
    }

    // Gentle edge turnaround repulsion so movement never stutters at borders
    if (this.sprite.x < margin && targetVx < 0) {
      targetVx = Math.abs(targetVx) * 0.5 + 40;
      this.moveDir = 1;
    } else if (this.sprite.x > w - margin && targetVx > 0) {
      targetVx = -Math.abs(targetVx) * 0.5 - 40;
      this.moveDir = -1;
    }

    const alpha = 1 - Math.exp(-steerRate * dt);
    this.vx = Phaser.Math.Linear(this.vx, targetVx, alpha);
    this.vy = Phaser.Math.Linear(this.vy, targetVy, alpha);

    this.sprite.x = Phaser.Math.Clamp(this.sprite.x + this.vx * dt, margin * 0.72, w - margin * 0.72);
    this.sprite.y = Phaser.Math.Clamp(this.sprite.y + this.vy * dt, 90, Math.min(h * 0.4, this.targetY + 76));

    // Smooth banking tilt & subtle stealth alpha transition
    const targetRot = Phaser.Math.Clamp(-this.vx / Math.max(950, baseSpd * 7.5), -0.11, 0.11);
    this.sprite.setRotation(Phaser.Math.Linear(this.sprite.rotation, targetRot, Math.min(1, 9 * dt)));
    const scaleCompress = 1 - Math.min(0.055, Math.abs(this.vx) / 3600);
    this.sprite.setScale(scaleCompress, 1);

    this.phaseGlideAlpha = Phaser.Math.Linear(this.phaseGlideAlpha, desiredAlpha, Math.min(1, 10 * dt));
    this.sprite.setAlpha(this.phaseGlideAlpha);
  }

  private pickNextMoveMode(w: number): void {
    const margin = Math.max(120, this.def.width * 0.65);
    const leftAnchor = margin + (w - margin * 2) * 0.2;
    const rightAnchor = margin + (w - margin * 2) * 0.8;
    const centerAnchor = w * 0.5;

    switch (this.def.id) {
      case 'iron_guardian': {
        if (this.moveMode === 'patrol' && this.phase >= 2) {
          this.moveMode = 'surge_dip';
          this.moveModeTimerMs = 2100;
        } else if (this.moveMode === 'surge_dip') {
          this.moveMode = 'reposition';
          this.anchorX = centerAnchor;
          this.anchorY = this.targetY;
          this.moveModeTimerMs = 1800;
        } else {
          this.moveMode = 'patrol';
          this.moveModeTimerMs = 3400;
        }
        break;
      }
      case 'venom_queen': {
        if (this.moveMode === 'patrol') {
          this.moveMode = this.phase >= 2 ? 'stalk' : 'reposition';
          this.anchorX = this.sprite.x < centerAnchor ? rightAnchor : leftAnchor;
          this.anchorY = this.targetY - 10;
          this.moveModeTimerMs = 2200;
        } else {
          this.moveMode = 'patrol';
          this.moveModeTimerMs = 3800;
        }
        break;
      }
      case 'shadow_titan': {
        if (this.moveMode !== 'phase_glide' && (this.phase >= 2 || Math.random() < 0.55)) {
          this.moveMode = 'phase_glide';
          this.anchorX = this.sprite.x < centerAnchor ? rightAnchor : leftAnchor;
          this.anchorY = this.targetY + (Math.random() - 0.5) * 32;
          this.moveModeTimerMs = 1500;
          this.spawnAfterimageRing();
        } else {
          this.moveMode = this.moveMode === 'stalk' ? 'patrol' : 'stalk';
          this.moveModeTimerMs = 2500;
        }
        break;
      }
      case 'cyber_leviathan': {
        if (this.moveMode === 'patrol') {
          this.moveMode = 'reposition';
          const lane = Math.floor(Math.random() * 3);
          this.anchorX = lane === 0 ? leftAnchor : lane === 1 ? centerAnchor : rightAnchor;
          this.anchorY = this.targetY + (lane === 1 ? 18 : -8);
          this.moveModeTimerMs = 2000;
        } else {
          this.moveMode = 'patrol';
          this.moveModeTimerMs = 3000;
        }
        break;
      }
      case 'void_emperor': {
        if (this.phase === 3 && this.moveMode !== 'phase_glide') {
          this.moveMode = 'phase_glide';
          this.anchorX = this.sprite.x < centerAnchor ? rightAnchor : leftAnchor;
          this.anchorY = this.targetY;
          this.moveModeTimerMs = 1350;
          this.spawnAfterimageRing();
        } else if (this.moveMode === 'patrol') {
          this.moveMode = this.phase >= 2 ? 'stalk' : 'surge_dip';
          this.moveModeTimerMs = 2200;
        } else {
          this.moveMode = 'patrol';
          this.moveModeTimerMs = 2800;
        }
        break;
      }
    }
  }

  private spawnAfterimageRing(): void {
    const ghost = this.scene.add.circle(this.x, this.y, this.radius * 0.72, this.def.primaryColor, 0.14).setDepth(7);
    ghost.setStrokeStyle(2, this.def.secondaryColor, 0.8);
    this.scene.tweens.add({
      targets: ghost,
      scaleX: 1.85,
      scaleY: 1.85,
      alpha: 0,
      duration: 360,
      ease: 'Cubic.easeOut',
      onComplete: () => ghost.destroy(),
    });
  }

  private updateLasers(
    dt: number,
    dtMs: number,
    playerX: number,
    playerY: number,
    h: number,
    projectiles: ProjectileManager,
    onLaserHitPlayer: (dmg: number) => void
  ): void {
    for (let i = this.activeLasers.length - 1; i >= 0; i--) {
      const l = this.activeLasers[i];
      l.timerMs -= dtMs;
      const sx = this.x + l.originOffsetX;
      const sy = this.y + l.originOffsetY;

      // Track smoothly until lockThresholdMs remains, then freeze target so dodging is 100% fair
      if (l.trackSpeed > 0 && l.timerMs > l.lockThresholdMs) {
        l.targetX = Phaser.Math.Linear(l.targetX, playerX, Math.min(1, l.trackSpeed * dt));
      }

      const locked = l.timerMs <= l.lockThresholdMs;
      const warnAlpha = locked
        ? 0.55 + 0.4 * Math.sin(this.age * 44)
        : 0.28 + 0.35 * Math.sin(this.age * 24);
      const lineW = locked ? 3.5 : 2.2;

      this.telegraphGfx.lineStyle(lineW, l.color, warnAlpha);
      this.telegraphGfx.lineBetween(sx, sy, l.targetX, l.targetY);
      this.telegraphGfx.strokeCircle(l.targetX, Math.min(h - 32, l.targetY - 28), locked ? 24 : 18);

      if (l.timerMs <= 0) {
        this.activeLasers.splice(i, 1);
        projectiles.addVisualBeam(sx, sy, l.targetX, l.targetY, l.color, l.width, 0.28);
        SoundManager.playBossLaser();
        const dist = this.pointToSegmentDist(playerX, playerY, sx, sy, l.targetX, l.targetY);
        if (dist < Math.max(24, l.width * 0.85)) {
          onLaserHitPlayer(l.damage);
        }
      }
    }
  }

  private queueLaser(
    originOffsetX: number,
    originOffsetY: number,
    targetX: number,
    options?: {
      timerMs?: number;
      lockThresholdMs?: number;
      trackSpeed?: number;
      damage?: number;
      width?: number;
      color?: number;
    }
  ): void {
    const h = this.scene.scale.height;
    const paceScale = Phaser.Math.Clamp(this.aggressionMult, 0.85, 1.25);
    const timerMs = Math.max(560, Math.round((options?.timerMs ?? 820) / paceScale));
    const lockThresholdMs = Math.max(240, Math.round((options?.lockThresholdMs ?? 330) / paceScale));
    this.activeLasers.push({
      originOffsetX,
      originOffsetY,
      targetX,
      targetY: h + 12,
      timerMs,
      maxTimerMs: timerMs,
      lockThresholdMs,
      trackSpeed: (options?.trackSpeed ?? 2.2) * Phaser.Math.Clamp(this.aggressionMult, 0.85, 1.25),
      damage: Math.max(1, Math.round((options?.damage ?? 28) * this.damageMult)),
      width: options?.width ?? 30,
      color: options?.color ?? 0xf43f5e,
    });
  }

  private scheduleBeat(
    delayMs: number,
    fn: (playerX: number, playerY: number, projectiles: ProjectileManager) => void
  ): void {
    this.pendingBeats.push({ delayMs, fn });
  }

  private executeAttackPattern(playerX: number, playerY: number, projectiles: ProjectileManager): void {
    const patternCount = this.phase >= 2 ? 4 : 3;
    const pattern = this.patternIndex % patternCount;
    this.patternIndex++;

    const sx = this.x;
    const sy = this.y + 36;
    const w = this.scene.scale.width;
    const tint = this.def.primaryColor;

    switch (this.def.id) {
      case 'iron_guardian': {
        if (pattern === 0) {
          // P1: Siege Bomb Fan · P2: 2-beat staggered + twin Homing Siege Seekers · P3: Twin Splitters + Fan
          for (let i = -2; i <= 2; i++) {
            const ang = Math.PI / 2 + i * 0.22;
            projectiles.spawnEnemyBullet(sx, sy, Math.cos(ang) * 280, Math.sin(ang) * 280, 18, 'proj_enemy_bomb', 9);
          }
          if (this.phase >= 2) {
            this.scheduleBeat(340, (_px, _py, proj) => {
              const bx = this.x;
              const by = this.y + 36;
              for (let i = -2; i <= 2; i++) {
                const ang = Math.PI / 2 + (i + 0.5) * 0.2;
                proj.spawnEnemyBullet(bx, by, Math.cos(ang) * 260, Math.sin(ang) * 260, 17, 'proj_enemy_bomb', 9, 0xf59e0b);
              }
              [-54, 54].forEach((dx, idx) => {
                const sAng = Math.PI / 2 + (idx === 0 ? -0.3 : 0.3);
                proj.spawnEnemyBullet(bx + dx, by, Math.cos(sAng) * 235, Math.sin(sAng) * 235, 16, 'proj_enemy_seeker', 8, 0xf59e0b, {
                  homingTurnRate: 1.45,
                  homingDelay: 0.18,
                  homingDuration: 1.45,
                });
              });
            });
          }
        } else if (pattern === 1) {
          // Twin Pod Aimed Burst (2-beat salvo in P2/P3)
          const fireTwinPods = (px: number, py: number, proj: ProjectileManager, speed: number) => {
            const bx = this.x;
            const by = this.y + 36;
            const ang = Math.atan2(py - by, px - bx);
            [-0.14, 0, 0.14].forEach((off) => {
              proj.spawnEnemyBullet(bx - 44, by, Math.cos(ang + off) * speed, Math.sin(ang + off) * speed, 16);
              proj.spawnEnemyBullet(bx + 44, by, Math.cos(ang + off) * speed, Math.sin(ang + off) * speed, 16);
            });
          };
          fireTwinPods(playerX, playerY, projectiles, 335);
          if (this.phase >= 2) {
            this.scheduleBeat(280, (px, py, proj) => fireTwinPods(px, py, proj, 355));
          }
        } else if (pattern === 2) {
          // Siege Hyper-Lance (P3 fires Twin Wing Lances framing the lane)
          if (this.phase === 3) {
            this.queueLaser(-48, 36, Math.max(70, playerX - 88), { color: 0xf59e0b, trackSpeed: 1.5, width: 26 });
            this.queueLaser(48, 36, Math.min(w - 70, playerX + 88), { color: 0xf59e0b, trackSpeed: 1.5, width: 26 });
          } else {
            this.queueLaser(0, 38, playerX, { color: 0xf59e0b, trackSpeed: 2.0 });
          }
        } else {
          // P2: Twin Shoulder Homing Mortar + Nova · P3: Splitting Mortar Orbs + 12-Orb Siege Nova
          if (this.phase === 3) {
            [-0.36, 0, 0.36].forEach((off) => {
              const ang = Math.PI / 2 + off;
              projectiles.spawnEnemyBullet(sx, sy, Math.cos(ang) * 235, Math.sin(ang) * 235, 18, 'proj_enemy_splitter', 10, 0xf59e0b, {
                splitAfterSec: 0.72,
                splitCount: 4,
                splitSpeed: 255,
                splitTextureKey: 'proj_enemy_shard',
                splitTint: 0xfef08a,
                spinRate: 4.5,
              });
            });
          }
          for (let i = 0; i < (this.phase === 3 ? 12 : 8); i++) {
            const ang = (Math.PI * 2 * i) / (this.phase === 3 ? 12 : 8) + this.spiralAngle;
            projectiles.spawnEnemyBullet(sx, sy, Math.cos(ang) * 245, Math.sin(ang) * 245, 18, 'proj_enemy_bomb', 9, 0xef4444);
          }
          this.spiralAngle += 0.28;
        }
        break;
      }

      case 'venom_queen': {
        if (pattern === 0) {
          // Corrosive Bio-Ring (P2/P3 adds counter-curving inner wave)
          const count = 10 + this.phase * 2;
          for (let i = 0; i < count; i++) {
            const ang = (Math.PI * 2 * i) / count + this.spiralAngle;
            projectiles.spawnEnemyBullet(sx, sy, Math.cos(ang) * 240, Math.sin(ang) * 240, 18, 'proj_enemy_bomb', 8, 0x22c55e);
          }
          this.spiralAngle += 0.35;
          if (this.phase >= 2) {
            this.scheduleBeat(310, (_px, _py, proj) => {
              const bx = this.x;
              const by = this.y + 36;
              for (let i = 0; i < count; i++) {
                const ang = (Math.PI * 2 * i) / count - this.spiralAngle;
                proj.spawnEnemyBullet(bx, by, Math.cos(ang) * 225, Math.sin(ang) * 225, 17, 'proj_enemy_bomb', 8, 0xa855f7, {
                  turnRate: 0.45,
                  turnDuration: 0.7,
                });
              }
            });
          }
        } else if (pattern === 1) {
          // Hive Brood Summon + Homing Bio-Seekers in P2/P3
          this.onSpawnMinion(this.phase >= 2 ? 'interceptor' : 'scout', Math.max(60, sx - 90), sy);
          this.onSpawnMinion(this.phase >= 3 ? 'fighter' : 'scout', Math.min(w - 60, sx + 90), sy);
          if (this.phase >= 2) {
            [-48, 48].forEach((dx, idx) => {
              const sAng = Math.PI / 2 + (idx === 0 ? -0.35 : 0.35);
              projectiles.spawnEnemyBullet(sx + dx, sy, Math.cos(sAng) * 245, Math.sin(sAng) * 245, 16, 'proj_enemy_seeker', 8, 0x22c55e, {
                homingTurnRate: 1.6,
                homingDelay: 0.16,
                homingDuration: 1.5,
              });
            });
          } else {
            const ang = Math.atan2(playerY - sy, playerX - sx);
            [-0.25, 0.25].forEach((off) => {
              projectiles.spawnEnemyBullet(sx, sy, Math.cos(ang + off) * 300, Math.sin(ang + off) * 300, 15, 'proj_enemy_bolt', 7, 0x22c55e);
            });
          }
        } else if (pattern === 2) {
          // 5-to-7 Bolt Wave-Weaving Venom Fan
          const span = this.phase >= 2 ? 3 : 2;
          const ang = Math.atan2(playerY - sy, playerX - sx);
          for (let i = -span; i <= span; i++) {
            projectiles.spawnEnemyBullet(sx, sy, Math.cos(ang + i * 0.13) * 315, Math.sin(ang + i * 0.13) * 315, 16, 'proj_enemy_bolt', 7, 0xa855f7, {
              waveAmp: this.phase >= 2 ? 62 : 0,
              waveFreq: 5.5,
              wavePhase: i % 2 === 0 ? 0 : Math.PI,
            });
          }
        } else {
          // P2: Twin Splitting Spore Pods · P3: Splitting Spore Pods + Crossfire Wing Arcs
          [-0.28, 0.28].forEach((off) => {
            const ang = Math.PI / 2 + off;
            projectiles.spawnEnemyBullet(sx, sy, Math.cos(ang) * 235, Math.sin(ang) * 235, 17, 'proj_enemy_splitter', 10, 0x22c55e, {
              splitAfterSec: 0.72,
              splitCount: this.phase === 3 ? 5 : 4,
              splitSpeed: 265,
              splitTextureKey: 'proj_enemy_shard',
              splitTint: 0xa855f7,
              spinRate: 4.8,
            });
          });
          if (this.phase === 3) {
            [-70, 70].forEach((dx) => {
              const ang = Math.atan2(playerY - sy, playerX - (sx + dx));
              [-0.16, 0, 0.16].forEach((off) => {
                projectiles.spawnEnemyBullet(sx + dx, sy, Math.cos(ang + off) * 335, Math.sin(ang + off) * 335, 17, 'proj_enemy_bolt', 7, 0x22c55e);
              });
            });
          }
        }
        break;
      }

      case 'shadow_titan': {
        if (pattern === 0) {
          // Cryo Hyper-Lance (P3 unleashes Twin V-Angle Lances)
          if (this.phase === 3) {
            this.queueLaser(-36, 36, Math.max(60, playerX - 95), { color: 0x38bdf8, trackSpeed: 1.7 });
            this.queueLaser(36, 36, Math.min(w - 60, playerX + 95), { color: 0x818cf8, trackSpeed: 1.7 });
          } else {
            this.queueLaser(0, 38, playerX, { color: 0x38bdf8, trackSpeed: 2.3 });
          }
        } else if (pattern === 1) {
          // Rotating Cryo Spiral Nova + Homing Cryo Seekers in P2/P3
          const count = this.phase >= 2 ? 14 : 12;
          const turnRate = this.phase >= 2 ? (this.patternIndex % 2 === 0 ? 0.55 : -0.55) : 0;
          for (let i = 0; i < count; i++) {
            const ang = (Math.PI * 2 * i) / count + this.spiralAngle;
            projectiles.spawnEnemyBullet(sx, sy, Math.cos(ang) * 290, Math.sin(ang) * 290, 18, 'proj_enemy_shard', 7, 0x38bdf8, {
              turnRate,
              turnDuration: 0.75,
            });
          }
          if (this.phase >= 2) {
            [-55, 55].forEach((dx, idx) => {
              const sAng = Math.PI / 2 + (idx === 0 ? -0.4 : 0.4);
              projectiles.spawnEnemyBullet(sx + dx, sy, Math.cos(sAng) * 260, Math.sin(sAng) * 260, 18, 'proj_enemy_seeker', 8, 0x67e8f9, {
                homingTurnRate: 1.7,
                homingDelay: 0.14,
                homingDuration: 1.5,
              });
            });
          }
          this.spiralAngle += 0.42;
        } else if (pattern === 2) {
          // Tri-Node High-Velocity Sniper Shards (2-beat burst + Crisscross Wave Curtain in P2/P3)
          const fireSniper = (px: number, py: number, proj: ProjectileManager) => {
            const bx = this.x;
            const by = this.y + 36;
            [-60, 0, 60].forEach((dx) => {
              const ang = Math.atan2(py - by, px - (bx + dx));
              proj.spawnEnemyBullet(bx + dx, by, Math.cos(ang) * 425, Math.sin(ang) * 425, 19, 'proj_enemy_shard', 7, 0x818cf8);
            });
          };
          fireSniper(playerX, playerY, projectiles);
          if (this.phase >= 2) {
            this.scheduleBeat(240, (px, py, proj) => fireSniper(px, py, proj));
            [-0.25, 0.25].forEach((off, idx) => {
              const ang = Math.PI / 2 + off;
              projectiles.spawnEnemyBullet(sx, sy, Math.cos(ang) * 285, Math.sin(ang) * 285, 17, 'proj_enemy_bolt', 7, 0x38bdf8, {
                waveAmp: 85,
                waveFreq: 5.8,
                wavePhase: idx === 0 ? 0 : Math.PI,
              });
            });
          }
        } else {
          // P2/P3: Stealth Phase-Blink + 3-Beat Precision Volley + Splitting Cryo Cores in P3
          this.moveMode = 'phase_glide';
          this.anchorX = this.x < w * 0.5 ? w * 0.76 : w * 0.24;
          this.anchorY = this.targetY;
          this.spawnAfterimageRing();
          if (this.phase === 3) {
            [-45, 45].forEach((dx) => {
              projectiles.spawnEnemyBullet(sx + dx, sy, dx * 0.8, 240, 19, 'proj_enemy_splitter', 10, 0x67e8f9, {
                splitAfterSec: 0.68,
                splitCount: 6,
                splitSpeed: 270,
                splitTextureKey: 'proj_enemy_shard',
                splitTint: 0x38bdf8,
                spinRate: 5.2,
              });
            });
          }
          const beats = this.phase === 3 ? 3 : 2;
          for (let beat = 0; beat < beats; beat++) {
            this.scheduleBeat(beat * 185, (px, py, proj) => {
              const bx = this.x;
              const by = this.y + 36;
              const ang = Math.atan2(py - by, px - bx);
              [-0.14, 0, 0.14].forEach((off) => {
                proj.spawnEnemyBullet(bx, by, Math.cos(ang + off) * 400, Math.sin(ang + off) * 400, 18, 'proj_enemy_shard', 7, 0x38bdf8);
              });
            });
          }
        }
        break;
      }

      case 'cyber_leviathan': {
        if (pattern === 0) {
          // Emerald Weaving Spiral Matrix (accelerating & sinusoidal in P2/P3)
          const count = 12 + this.phase * 2;
          for (let i = 0; i < count; i++) {
            const ang = (Math.PI * 2 * i) / count + this.spiralAngle;
            projectiles.spawnEnemyBullet(sx, sy, Math.cos(ang) * 265, Math.sin(ang) * 265, 19, 'proj_enemy_bomb', 8, 0x10b981, {
              ay: this.phase >= 2 ? 45 : 0,
              waveAmp: this.phase >= 2 ? 48 : 0,
              waveFreq: 5.0,
              wavePhase: i % 2 === 0 ? 0 : Math.PI,
            });
          }
          this.spiralAngle += 0.32;
        } else if (pattern === 1) {
          // Orbital Security Beams (P1: 1, P2: 2, P3: 3-lane vertical grid + Splitting Data Orbs in safe gaps)
          if (this.phase === 1) {
            this.queueLaser(0, 38, playerX, { color: 0x10b981, trackSpeed: 2.0 });
          } else if (this.phase === 2) {
            this.queueLaser(-56, 36, Math.max(70, playerX - 105), { color: 0x10b981, trackSpeed: 1.4, width: 26 });
            this.queueLaser(56, 36, Math.min(w - 70, playerX + 105), { color: 0x06b6d4, trackSpeed: 1.4, width: 26 });
          } else {
            this.queueLaser(-68, 36, w * 0.22, { color: 0x10b981, trackSpeed: 0, width: 28, timerMs: 880 });
            this.queueLaser(0, 38, w * 0.5, { color: 0x06b6d4, trackSpeed: 0, width: 28, timerMs: 880 });
            this.queueLaser(68, 36, w * 0.78, { color: 0x10b981, trackSpeed: 0, width: 28, timerMs: 880 });
            [-0.25, 0.25].forEach((off) => {
              const ang = Math.PI / 2 + off;
              projectiles.spawnEnemyBullet(sx, sy, Math.cos(ang) * 245, Math.sin(ang) * 245, 19, 'proj_enemy_splitter', 10, 0x22d3ee, {
                splitAfterSec: 0.78,
                splitCount: 5,
                splitSpeed: 260,
                splitSpreadRad: 1.5,
                splitTextureKey: 'proj_enemy_shard',
                splitTint: 0x10b981,
                spinRate: 5.0,
              });
            });
          }
        } else if (pattern === 2) {
          // Escort Deployment (Sniper / Bastion / Interceptor) & Seeker Fan
          this.onSpawnMinion(this.phase >= 2 ? 'sniper' : 'fighter', Math.max(70, sx - 110), sy);
          if (this.phase === 3) {
            this.onSpawnMinion('interceptor', Math.min(w - 70, sx + 110), sy);
          }
          const ang = Math.atan2(playerY - sy, playerX - sx);
          [-0.22, -0.11, 0, 0.11, 0.22].forEach((off) => {
            projectiles.spawnEnemyBullet(sx, sy, Math.cos(ang + off) * 355, Math.sin(ang + off) * 355, 18, 'proj_enemy_bolt', 7, 0x22d3ee);
          });
          if (this.phase >= 2) {
            [-64, 64].forEach((dx, idx) => {
              const sAng = Math.PI / 2 + (idx === 0 ? -0.35 : 0.35);
              projectiles.spawnEnemyBullet(sx + dx, sy, Math.cos(sAng) * 255, Math.sin(sAng) * 255, 18, 'proj_enemy_seeker', 8, 0x10b981, {
                homingTurnRate: 1.75,
                homingDelay: 0.14,
                homingDuration: 1.6,
              });
            });
          }
        } else {
          // P2/P3 Pattern 4: Multi-Beat Cyber Matrix Wave + Lock-On Seekers
          const span = this.phase === 3 ? 3 : 2;
          for (let beat = 0; beat < 2; beat++) {
            this.scheduleBeat(beat * 280, (px, py, proj) => {
              const bx = this.x;
              const by = this.y + 36;
              const base = Math.atan2(py - by, px - bx);
              for (let i = -span; i <= span; i++) {
                const ang = base + i * 0.13 + (beat === 1 ? 0.065 : 0);
                proj.spawnEnemyBullet(bx, by, Math.cos(ang) * 340, Math.sin(ang) * 340, 18, 'proj_enemy_shard', 7, 0x10b981);
              }
            });
          }
          if (this.phase === 3) {
            [-1, 0, 1].forEach((lane) => {
              const sAng = Math.PI / 2 + lane * 0.36;
              projectiles.spawnEnemyBullet(sx + lane * 45, sy, Math.cos(sAng) * 250, Math.sin(sAng) * 250, 19, 'proj_enemy_seeker', 8, 0x22d3ee, {
                homingTurnRate: 1.7,
                homingDelay: 0.15,
                homingDuration: 1.55,
              });
            });
          }
        }
        break;
      }

      case 'void_emperor': {
        if (pattern === 0) {
          // Imperial Spiral Storm (P2/P3 adds counter-curving inner ring + Splitting Void Rifts in P3)
          const count = 14 + this.phase * 4;
          for (let i = 0; i < count; i++) {
            const ang = (Math.PI * 2 * i) / count + this.spiralAngle;
            projectiles.spawnEnemyBullet(sx, sy, Math.cos(ang) * 265, Math.sin(ang) * 265, 20, 'proj_enemy_bomb', 9, tint);
          }
          this.spiralAngle += 0.36;
          if (this.phase >= 2) {
            this.scheduleBeat(320, (_px, _py, proj) => {
              const bx = this.x;
              const by = this.y + 36;
              const turnSign = this.patternIndex % 2 === 0 ? 1 : -1;
              for (let i = 0; i < 14; i++) {
                const ang = (Math.PI * 2 * i) / 14 - this.spiralAngle;
                proj.spawnEnemyBullet(bx, by, Math.cos(ang) * 255, Math.sin(ang) * 255, 19, 'proj_enemy_bomb', 8, 0xa855f7, {
                  turnRate: turnSign * 0.52,
                  turnDuration: 0.75,
                });
              }
              if (this.phase === 3) {
                [-0.42, 0, 0.42].forEach((off) => {
                  const ang = Math.PI / 2 + off;
                  proj.spawnEnemyBullet(bx, by, Math.cos(ang) * 240, Math.sin(ang) * 240, 20, 'proj_enemy_splitter', 10, 0xf43f5e, {
                    splitAfterSec: 0.72,
                    splitCount: 6,
                    splitSpeed: 270,
                    splitTextureKey: 'proj_enemy_shard',
                    splitTint: 0xe879f9,
                    spinRate: 5.5,
                  });
                });
              }
            });
          }
        } else if (pattern === 1) {
          // Apocalypse Hyper-Lance (P1: 1, P2: Dual Beams, P3: Tri-Beam Void Crown)
          if (this.phase === 1) {
            this.queueLaser(0, 40, playerX, { color: 0xf43f5e, trackSpeed: 2.1, width: 32 });
          } else if (this.phase === 2) {
            this.queueLaser(-64, 38, Math.max(70, playerX - 110), { color: 0xf43f5e, trackSpeed: 1.5, width: 28 });
            this.queueLaser(64, 38, Math.min(w - 70, playerX + 110), { color: 0xa855f7, trackSpeed: 1.5, width: 28 });
          } else {
            this.queueLaser(-76, 38, Math.max(60, playerX - 155), { color: 0xf43f5e, trackSpeed: 1.2, width: 26, timerMs: 880 });
            this.queueLaser(0, 40, playerX, { color: 0xfda4af, trackSpeed: 1.6, width: 30, timerMs: 880 });
            this.queueLaser(76, 38, Math.min(w - 60, playerX + 155), { color: 0xa855f7, trackSpeed: 1.2, width: 26, timerMs: 880 });
          }
        } else if (pattern === 2) {
          // Twin-Wing Crimson Salvo + Homing Void Seekers in P2/P3
          const fireWings = (px: number, py: number, proj: ProjectileManager, speed: number) => {
            const bx = this.x;
            const by = this.y + 36;
            [-80, 80].forEach((dx) => {
              const ang = Math.atan2(py - by, px - (bx + dx));
              [-0.22, -0.11, 0, 0.11, 0.22].forEach((off) => {
                proj.spawnEnemyBullet(bx + dx, by, Math.cos(ang + off) * speed, Math.sin(ang + off) * speed, 19, 'proj_enemy_shard', 7, 0xf43f5e);
              });
            });
          };
          fireWings(playerX, playerY, projectiles, 375);
          if (this.phase >= 2) {
            this.scheduleBeat(260, (px, py, proj) => {
              fireWings(px, py, proj, 395);
              [-55, 55].forEach((dx, idx) => {
                const sAng = Math.PI / 2 + (idx === 0 ? -0.35 : 0.35);
                proj.spawnEnemyBullet(this.x + dx, this.y + 36, Math.cos(sAng) * 265, Math.sin(sAng) * 265, 20, 'proj_enemy_seeker', 8, 0xe879f9, {
                  homingTurnRate: 1.8,
                  homingDelay: 0.14,
                  homingDuration: 1.6,
                });
              });
            });
          }
        } else {
          // P2/P3 Special: High-Tier Escort + Staggered Splitting Void Curtain & Geometric Weave
          this.onSpawnMinion(this.phase === 3 ? 'harbinger' : 'splitter', sx < w / 2 ? sx + 130 : sx - 130, sy + 10);
          const cols = this.phase === 3 ? 8 : 6;
          for (let i = 0; i < cols; i++) {
            const px = (w / (cols + 1)) * (i + 1);
            const isCenterSplit = i === Math.floor(cols / 2) || i === Math.floor(cols / 2) - 1;
            if (isCenterSplit) {
              projectiles.spawnEnemyBullet(px, 20, 0, 240, 20, 'proj_enemy_splitter', 10, 0xa855f7, {
                splitAfterSec: 0.85,
                splitCount: 4,
                splitSpeed: 255,
                splitTextureKey: 'proj_enemy_shard',
                splitTint: 0xf43f5e,
                spinRate: 5.0,
              });
            } else {
              projectiles.spawnEnemyBullet(px, 20, 0, 260, 20, 'proj_enemy_bomb', 9, 0xa855f7, {
                waveAmp: this.phase === 3 ? 52 : 0,
                waveFreq: 4.5,
                wavePhase: i % 2 === 0 ? 0 : Math.PI,
              });
            }
          }
          if (this.phase === 3) {
            this.scheduleBeat(460, (_px, _py, proj) => {
              const offsetCols = 7;
              for (let i = 0; i < offsetCols; i++) {
                const px = (w / (offsetCols + 1)) * (i + 1);
                proj.spawnEnemyBullet(px, 20, 0, 285, 20, 'proj_enemy_bomb', 9, 0xf43f5e);
              }
            });
          }
        }
        break;
      }
    }
  }

  private pointToSegmentDist(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
    const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
    if (l2 === 0) return Math.hypot(px - x1, py - y1);
    const t = Math.max(0, Math.min(1, ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2));
    return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
  }

  destroy(): void {
    this.entranceTween?.stop();
    this.entranceTween = undefined;
    this.pendingBeats.length = 0;
    this.activeLasers.length = 0;
    this.sprite.destroy();
    this.telegraphGfx.destroy();
    this.auraGfx.destroy();
  }
}
