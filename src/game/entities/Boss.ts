import Phaser from 'phaser';
import { BOSS_CONFIGS, BossDefinition, BossId } from '../config/BossConfig';
import { EnemyClass } from '../config/EnemyConfig';
import { SoundManager } from '../audio/SoundManager';
import { ProjectileManager } from './ProjectileManager';
import { Targetable } from './Targetable';

export class BossEntity implements Targetable {
  scene: Phaser.Scene;
  def: BossDefinition;
  sprite: Phaser.GameObjects.Sprite;
  private telegraphGfx: Phaser.GameObjects.Graphics;
  private auraGfx: Phaser.GameObjects.Graphics;

  active = false;
  hp = 1000;
  maxHp = 1000;
  radius = 68;
  phase: 1 | 2 | 3 = 1;
  entering = true;
  invulnerable = true;

  private age = 0;
  private targetY = 148;
  private moveDir = 1;
  private attackTimerMs = 1400;
  private spiralAngle = 0;
  private patternIndex = 0;
  private phaseTransitionMs = 0;
  private laserTelegraphMs = 0;
  private laserTargetX = 0;

  private onSpawnMinion: (enemyClass: EnemyClass, x: number, y: number) => void;
  private onPhaseShift: (newPhase: 1 | 2 | 3) => void;
  private onBossDefeated: (boss: BossEntity) => void;

  constructor(
    scene: Phaser.Scene,
    bossId: BossId,
    onSpawnMinion: (enemyClass: EnemyClass, x: number, y: number) => void,
    onPhaseShift: (newPhase: 1 | 2 | 3) => void,
    onBossDefeated: (boss: BossEntity) => void
  ) {
    this.scene = scene;
    this.def = BOSS_CONFIGS[bossId];
    this.onSpawnMinion = onSpawnMinion;
    this.onPhaseShift = onPhaseShift;
    this.onBossDefeated = onBossDefeated;

    this.maxHp = this.def.maxHp;
    this.hp = this.maxHp;
    this.radius = Math.round(this.def.width * 0.42);
    this.active = true;

    this.targetY =
      scene.scale.width < 1024
        ? Math.round(Math.max(135, Math.min(190, scene.scale.height * 0.24)))
        : 148;

    const startX = scene.scale.width / 2;
    this.auraGfx = scene.add.graphics().setDepth(8);
    this.sprite = scene.add.sprite(startX, -130, this.def.textureKey).setDepth(10);
    this.telegraphGfx = scene.add.graphics().setDepth(13);

    // Smooth dramatic entrance
    this.scene.tweens.add({
      targets: this.sprite,
      y: this.targetY,
      duration: 2100,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        this.entering = false;
        this.invulnerable = false;
      },
    });
  }

  get x(): number {
    return this.sprite.x;
  }

  get y(): number {
    return this.sprite.y;
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
    this.attackTimerMs = 800;
    SoundManager.playBossWarning();
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

    this.onPhaseShift(nextPhase);
  }

  private triggerDefeat(): void {
    this.active = false;
    this.invulnerable = true;
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

    // Boss core aura
    const pulse = 0.22 + 0.12 * Math.sin(this.age * (3 + this.phase * 2));
    this.auraGfx.fillStyle(this.phase === 3 ? 0xf43f5e : this.def.primaryColor, pulse);
    this.auraGfx.fillCircle(this.x, this.y, this.radius + 16);

    if (this.entering) return;

    if (this.phaseTransitionMs > 0) {
      this.phaseTransitionMs -= dtMs;
      this.sprite.setAlpha(Math.sin(this.age * 35) > 0 ? 1 : 0.45);
      if (this.phaseTransitionMs <= 0) {
        this.invulnerable = false;
        this.sprite.setAlpha(1);
      }
      return;
    }

    // Horizontal & vertical weaving movement
    const speedMult = this.phase === 1 ? 1 : this.phase === 2 ? 1.28 : 1.55;
    this.sprite.x += this.moveDir * this.def.moveSpeed * speedMult * dt;
    const margin = Math.max(120, this.def.width * 0.65);
    if (this.sprite.x > w - margin) {
      this.sprite.x = w - margin;
      this.moveDir = -1;
    } else if (this.sprite.x < margin) {
      this.sprite.x = margin;
      this.moveDir = 1;
    }
    this.sprite.y = this.targetY + Math.sin(this.age * 1.6) * 22;

    // Active Laser Telegraph Handling
    if (this.laserTelegraphMs > 0) {
      this.laserTelegraphMs -= dtMs;
      const warnAlpha = 0.35 + 0.45 * Math.sin(this.age * 30);
      this.telegraphGfx.lineStyle(3, 0xf43f5e, warnAlpha);
      this.telegraphGfx.lineBetween(this.x, this.y + 40, this.laserTargetX, h);
      this.telegraphGfx.strokeCircle(this.laserTargetX, h - 40, 22);

      if (this.laserTelegraphMs <= 0) {
        // Fire piercing boss hyper-lance
        projectiles.addVisualBeam(this.x, this.y + 38, this.laserTargetX, h, 0xf43f5e, 32, 0.28);
        SoundManager.playSpecial();
        // Check line distance to player
        const dist = this.pointToSegmentDist(playerX, playerY, this.x, this.y + 38, this.laserTargetX, h);
        if (dist < 28) {
          onLaserHitPlayer(28);
        }
      }
    }

    // Attack cadence
    this.attackTimerMs -= dtMs;
    if (this.attackTimerMs <= 340 && this.attackTimerMs > 0) {
      // Visual warning glow on weapon pods before attack
      const glow = 1 - this.attackTimerMs / 340;
      this.telegraphGfx.fillStyle(0xfef08a, 0.55 * glow);
      this.telegraphGfx.fillCircle(this.x - 42, this.y + 24, 10 + glow * 8);
      this.telegraphGfx.fillCircle(this.x + 42, this.y + 24, 10 + glow * 8);
    }

    if (this.attackTimerMs <= 0) {
      this.executeAttackPattern(playerX, playerY, projectiles);
      const baseCd = this.def.id === 'void_emperor' ? 1150 : 1450;
      this.attackTimerMs = Math.max(580, baseCd - (this.phase - 1) * 240);
    }
  }

  private executeAttackPattern(playerX: number, playerY: number, projectiles: ProjectileManager): void {
    const pattern = this.patternIndex % (this.phase === 3 ? 4 : 3);
    this.patternIndex++;
    const sx = this.x;
    const sy = this.y + 36;
    const tint = this.def.primaryColor;

    switch (this.def.id) {
      case 'iron_guardian': {
        if (pattern === 0) {
          for (let i = -2; i <= 2; i++) {
            const ang = Math.PI / 2 + i * 0.22;
            projectiles.spawnEnemyBullet(sx, sy, Math.cos(ang) * 290, Math.sin(ang) * 290, 18, 'proj_enemy_bomb', 9);
          }
        } else if (pattern === 1) {
          const ang = Math.atan2(playerY - sy, playerX - sx);
          [-0.14, 0, 0.14].forEach((off) => {
            projectiles.spawnEnemyBullet(sx - 44, sy, Math.cos(ang + off) * 340, Math.sin(ang + off) * 340, 16);
            projectiles.spawnEnemyBullet(sx + 44, sy, Math.cos(ang + off) * 340, Math.sin(ang + off) * 340, 16);
          });
        } else {
          this.triggerLaserTelegraph(playerX);
        }
        break;
      }

      case 'venom_queen': {
        if (pattern === 0) {
          const count = 10 + this.phase * 2;
          for (let i = 0; i < count; i++) {
            const ang = (Math.PI * 2 * i) / count + this.spiralAngle;
            projectiles.spawnEnemyBullet(sx, sy, Math.cos(ang) * 240, Math.sin(ang) * 240, 18, 'proj_enemy_bomb', 8, 0x22c55e);
          }
          this.spiralAngle += 0.35;
        } else if (pattern === 1) {
          this.onSpawnMinion('scout', Math.max(60, sx - 90), sy);
          this.onSpawnMinion('scout', Math.min(this.scene.scale.width - 60, sx + 90), sy);
        } else {
          const ang = Math.atan2(playerY - sy, playerX - sx);
          for (let i = -3; i <= 3; i++) {
            projectiles.spawnEnemyBullet(sx, sy, Math.cos(ang + i * 0.12) * 320, Math.sin(ang + i * 0.12) * 320, 16, 'proj_enemy_bolt', 7, 0xa855f7);
          }
        }
        break;
      }

      case 'shadow_titan': {
        if (pattern === 0) {
          this.triggerLaserTelegraph(playerX);
        } else if (pattern === 1) {
          for (let i = 0; i < 12; i++) {
            const ang = (Math.PI * 2 * i) / 12 + this.spiralAngle;
            projectiles.spawnEnemyBullet(sx, sy, Math.cos(ang) * 300, Math.sin(ang) * 300, 18, 'proj_enemy_bolt', 7, 0x38bdf8);
          }
          this.spiralAngle += 0.42;
        } else {
          [-60, 0, 60].forEach((dx) => {
            const ang = Math.atan2(playerY - sy, playerX - (sx + dx));
            projectiles.spawnEnemyBullet(sx + dx, sy, Math.cos(ang) * 410, Math.sin(ang) * 410, 20, 'proj_enemy_bolt', 7, 0x818cf8);
          });
        }
        break;
      }

      case 'cyber_leviathan': {
        if (pattern === 0) {
          for (let i = 0; i < 14; i++) {
            const ang = (Math.PI * 2 * i) / 14 + this.spiralAngle;
            projectiles.spawnEnemyBullet(sx, sy, Math.cos(ang) * 280, Math.sin(ang) * 280, 19, 'proj_enemy_bomb', 8, 0x10b981);
          }
          this.spiralAngle += 0.3;
        } else if (pattern === 1) {
          this.triggerLaserTelegraph(playerX);
        } else {
          this.onSpawnMinion('fighter', Math.max(70, sx - 110), sy);
          const ang = Math.atan2(playerY - sy, playerX - sx);
          [-0.2, -0.1, 0, 0.1, 0.2].forEach((off) => {
            projectiles.spawnEnemyBullet(sx, sy, Math.cos(ang + off) * 360, Math.sin(ang + off) * 360, 18, 'proj_enemy_bolt', 7, 0x22d3ee);
          });
        }
        break;
      }

      case 'void_emperor': {
        if (pattern === 0) {
          const count = 16 + this.phase * 4;
          for (let i = 0; i < count; i++) {
            const ang = (Math.PI * 2 * i) / count + this.spiralAngle;
            projectiles.spawnEnemyBullet(sx, sy, Math.cos(ang) * 270, Math.sin(ang) * 270, 20, 'proj_enemy_bomb', 9, tint);
          }
          this.spiralAngle += 0.36;
        } else if (pattern === 1) {
          this.triggerLaserTelegraph(playerX);
        } else if (pattern === 2) {
          [-80, 80].forEach((dx) => {
            const ang = Math.atan2(playerY - sy, playerX - (sx + dx));
            [-0.22, -0.11, 0, 0.11, 0.22].forEach((off) => {
              projectiles.spawnEnemyBullet(sx + dx, sy, Math.cos(ang + off) * 380, Math.sin(ang + off) * 380, 19, 'proj_enemy_bolt', 8, 0xf43f5e);
            });
          });
        } else {
          // Phase 3 Void Summon + Curtain
          this.onSpawnMinion('elite', sx < this.scene.scale.width / 2 ? sx + 130 : sx - 130, sy + 10);
          for (let i = 0; i < 8; i++) {
            const px = (this.scene.scale.width / 9) * (i + 1);
            projectiles.spawnEnemyBullet(px, 20, 0, 265, 20, 'proj_enemy_bomb', 9, 0xa855f7);
          }
        }
        break;
      }
    }
  }

  private triggerLaserTelegraph(playerX: number): void {
    this.laserTelegraphMs = 760;
    this.laserTargetX = playerX;
  }

  private pointToSegmentDist(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
    const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
    if (l2 === 0) return Math.hypot(px - x1, py - y1);
    const t = Math.max(0, Math.min(1, ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2));
    return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
  }

  destroy(): void {
    this.sprite.destroy();
    this.telegraphGfx.destroy();
    this.auraGfx.destroy();
  }
}
