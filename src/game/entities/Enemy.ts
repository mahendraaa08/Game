import Phaser from 'phaser';
import { ENEMY_CONFIGS, EnemyBehavior, EnemyClass, EnemyDefinition } from '../config/EnemyConfig';
import { ProjectileManager } from './ProjectileManager';
import { Targetable } from './Targetable';

export class EnemyEntity implements Targetable {
  scene: Phaser.Scene;
  sprite: Phaser.GameObjects.Sprite;
  private hpBarGfx: Phaser.GameObjects.Graphics;
  private telegraphGfx: Phaser.GameObjects.Graphics;

  def: EnemyDefinition;
  behavior: EnemyBehavior = 'straight';
  active = false;
  hp = 0;
  maxHp = 0;
  damage = 10;
  radius = 20;
  scoreReward = 100;

  private age = 0;
  private startX = 0;
  private fireTimerMs = 0;
  private windupMs = 0;
  private diveTriggered = false;
  private formationTargetY = 180;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.def = ENEMY_CONFIGS.scout;
    this.sprite = scene.add.sprite(-200, -200, 'enemy_scout').setDepth(9);
    this.hpBarGfx = scene.add.graphics().setDepth(12);
    this.telegraphGfx = scene.add.graphics().setDepth(10);
    this.sprite.setActive(false).setVisible(false);
  }

  get x(): number {
    return this.sprite.x;
  }

  get y(): number {
    return this.sprite.y;
  }

  setActive(v: boolean): this {
    this.active = v;
    this.sprite.setActive(v);
    return this;
  }

  setVisible(v: boolean): this {
    this.sprite.setVisible(v);
    return this;
  }

  spawn(
    enemyClass: EnemyClass,
    x: number,
    y: number,
    behavior?: EnemyBehavior,
    difficultyMult = 1
  ): void {
    this.def = ENEMY_CONFIGS[enemyClass];
    this.behavior = behavior ?? this.def.defaultBehavior;
    this.active = true;
    this.age = 0;
    this.startX = x;
    this.diveTriggered = false;
    this.formationTargetY = 120 + Math.random() * 140;

    this.maxHp = Math.round(this.def.maxHp * difficultyMult);
    this.hp = this.maxHp;
    this.damage = Math.round(this.def.damage * (0.9 + difficultyMult * 0.1));
    this.radius = this.def.radius;
    this.scoreReward = this.def.scoreReward;
    this.fireTimerMs = 650 + Math.random() * this.def.fireCooldownMs;
    this.windupMs = 0;

    this.sprite.setTexture(this.def.textureKey);
    this.sprite.setPosition(x, y);
    this.sprite.clearTint().setTintMode(Phaser.TintModes.MULTIPLY);
    this.sprite.setRotation(0);
    this.sprite.setScale(1);
    this.sprite.setActive(true).setVisible(true);
    this.hpBarGfx.clear();
    this.telegraphGfx.clear();
  }

  takeDamage(amount: number): boolean {
    if (!this.active) return false;
    this.hp -= amount;
    this.sprite.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
    this.scene.time.delayedCall(55, () => {
      if (this.active && this.sprite.active) {
        this.sprite.clearTint().setTintMode(Phaser.TintModes.MULTIPLY);
      }
    });

    if (this.hp <= 0) {
      this.hp = 0;
      this.deactivate();
      return true;
    }
    return false;
  }

  update(dt: number, playerX: number, playerY: number, projectiles: ProjectileManager): void {
    if (!this.active) return;
    this.age += dt;
    const dtMs = dt * 1000;
    const spd = this.def.speed;
    const w = this.scene.scale.width;
    const h = this.scene.scale.height;

    // Movement behaviors
    switch (this.behavior) {
      case 'straight':
        this.sprite.y += spd * dt;
        break;
      case 'zigzag':
        this.sprite.y += spd * 0.85 * dt;
        this.sprite.x = this.startX + Math.sin(this.age * 3.6) * 88;
        break;
      case 'sine':
        this.sprite.y += spd * 0.82 * dt;
        this.sprite.x = this.startX + Math.sin(this.age * 2.2) * 120;
        break;
      case 'diving':
        if (!this.diveTriggered && this.sprite.y > h * 0.24) {
          this.diveTriggered = true;
        }
        if (this.diveTriggered) {
          const dx = playerX - this.sprite.x;
          this.sprite.x += Phaser.Math.Clamp(dx * 1.4, -spd * 0.9, spd * 0.9) * dt;
          this.sprite.y += spd * 1.45 * dt;
        } else {
          this.sprite.y += spd * 0.9 * dt;
        }
        break;
      case 'formation':
        if (this.sprite.y < this.formationTargetY) {
          this.sprite.y += spd * 1.05 * dt;
        } else {
          this.sprite.x += Math.sin(this.age * 1.8) * 75 * dt;
          this.sprite.y += 18 * dt;
        }
        break;
      case 'tracking': {
        const dx = playerX - this.sprite.x;
        this.sprite.x += Phaser.Math.Clamp(dx * 1.6, -spd * 0.85, spd * 0.85) * dt;
        if (this.sprite.y < h * 0.34) {
          this.sprite.y += spd * 0.88 * dt;
        } else {
          this.sprite.y += (24 + Math.sin(this.age * 3) * 35) * dt;
        }
        break;
      }
    }

    this.sprite.x = Phaser.Math.Clamp(this.sprite.x, 30, w - 30);

    // Attack cooldown & readable windup flash
    this.telegraphGfx.clear();
    if (this.sprite.y > 30 && this.sprite.y < h * 0.72) {
      this.fireTimerMs -= dtMs;
      if (this.fireTimerMs <= 280 && this.fireTimerMs > 0) {
        this.windupMs = this.fireTimerMs;
        const pulse = 1 - this.windupMs / 280;
        this.telegraphGfx.lineStyle(1.5, this.def.accentColor, 0.75 * pulse);
        this.telegraphGfx.strokeCircle(this.sprite.x, this.sprite.y + 12, 8 + pulse * 8);
      }
      if (this.fireTimerMs <= 0) {
        this.fireTimerMs = this.def.fireCooldownMs;
        this.fireAttack(playerX, playerY, projectiles);
      }
    }

    // Health bar when damaged
    this.hpBarGfx.clear();
    if (this.hp < this.maxHp) {
      const bw = 38;
      const ratio = Math.max(0, this.hp / this.maxHp);
      this.hpBarGfx.fillStyle(0x0f172a, 0.85);
      this.hpBarGfx.fillRect(this.sprite.x - bw / 2, this.sprite.y - this.radius - 10, bw, 4);
      this.hpBarGfx.fillStyle(this.def.accentColor, 1);
      this.hpBarGfx.fillRect(this.sprite.x - bw / 2, this.sprite.y - this.radius - 10, bw * ratio, 4);
    }

    if (this.sprite.y > h + 60) {
      this.deactivate();
    }
  }

  private fireAttack(playerX: number, playerY: number, projectiles: ProjectileManager): void {
    const sx = this.sprite.x;
    const sy = this.sprite.y + 16;
    const spd = this.def.projectileSpeed;
    const dmg = this.damage;

    switch (this.def.attackPattern) {
      case 'single':
        projectiles.spawnEnemyBullet(sx, sy, 0, spd, dmg);
        break;
      case 'aimed': {
        const ang = Math.atan2(playerY - sy, playerX - sx);
        projectiles.spawnEnemyBullet(sx, sy, Math.cos(ang) * spd, Math.sin(ang) * spd, dmg);
        break;
      }
      case 'radial_bomb': {
        for (let i = 0; i < 6; i++) {
          const ang = (Math.PI * 2 * i) / 6 + 0.25;
          projectiles.spawnEnemyBullet(
            sx,
            sy,
            Math.cos(ang) * spd,
            Math.sin(ang) * spd,
            dmg,
            'proj_enemy_bomb',
            9
          );
        }
        break;
      }
      case 'burst_triple': {
        const angles = [-0.25, 0, 0.25];
        angles.forEach((off) => {
          const ang = Math.PI / 2 + off;
          projectiles.spawnEnemyBullet(sx, sy, Math.cos(ang) * spd, Math.sin(ang) * spd, dmg);
        });
        break;
      }
      case 'spread_fan': {
        const base = Math.atan2(playerY - sy, playerX - sx);
        [-0.24, 0, 0.24].forEach((off) => {
          const ang = base + off;
          projectiles.spawnEnemyBullet(
            sx,
            sy,
            Math.cos(ang) * spd,
            Math.sin(ang) * spd,
            dmg,
            'proj_enemy_bolt',
            7,
            0xf43f5e
          );
        });
        break;
      }
    }
  }

  deactivate(): void {
    this.active = false;
    this.sprite.setActive(false).setVisible(false);
    this.hpBarGfx.clear();
    this.telegraphGfx.clear();
  }

  destroy(): void {
    this.sprite.destroy();
    this.hpBarGfx.destroy();
    this.telegraphGfx.destroy();
  }
}
