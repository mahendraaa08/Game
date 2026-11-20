import Phaser from 'phaser';
import { POWERUP_CONFIGS, PowerUpType } from '../config/PowerUpConfig';

const TARGET_FALL_SPEED = 95;
const SPAWN_INITIAL_VY = 26;
const MARGIN_X = 28;

export class PowerUpEntity {
  sprite: Phaser.GameObjects.Sprite;
  private auraSprite: Phaser.GameObjects.Sprite;
  type: PowerUpType = 'health';
  active = false;
  private vx = 0;
  private vy = TARGET_FALL_SPEED;
  private phaseOffset = 0;
  private age = 0;
  private maxAge = 12;

  constructor(scene: Phaser.Scene) {
    this.auraSprite = scene.add
      .sprite(-100, -100, 'particle_glow')
      .setDepth(7)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.auraSprite.setActive(false).setVisible(false);

    this.sprite = scene.add.sprite(-100, -100, 'powerup_health').setDepth(8);
    this.sprite.setActive(false).setVisible(false);
  }

  spawn(x: number, y: number, type: PowerUpType): void {
    this.type = type;
    this.active = true;
    this.age = 0;
    this.vx = (Math.random() - 0.5) * 32;
    this.vy = SPAWN_INITIAL_VY;
    this.phaseOffset = Math.random() * Math.PI * 2;

    const def = POWERUP_CONFIGS[type];
    const sceneWidth = this.sprite.scene.scale.width;
    const clampedX = sceneWidth > MARGIN_X * 2 ? Phaser.Math.Clamp(x, MARGIN_X, sceneWidth - MARGIN_X) : x;

    this.sprite.setTexture(def.textureKey);
    this.sprite.setPosition(clampedX, y);
    this.sprite.setScale(0.75);
    this.sprite.setRotation(0);
    this.sprite.setAlpha(0.2);
    this.sprite.setActive(true).setVisible(true);

    this.auraSprite.setPosition(clampedX, y);
    this.auraSprite.setTint(def.colorNum);
    this.auraSprite.setScale(1.1);
    this.auraSprite.setAlpha(0.15);
    this.auraSprite.setActive(true).setVisible(true);
  }

  update(
    dt: number,
    playerX: number,
    playerY: number,
    sceneHeight: number,
    magnetBonus = 0,
    sceneWidth?: number
  ): void {
    if (!this.active) return;
    this.age += dt;

    const width = sceneWidth ?? this.sprite.scene.scale.width;
    const minX = width > MARGIN_X * 2 ? MARGIN_X : 12;
    const maxX = width > MARGIN_X * 2 ? width - MARGIN_X : Math.max(12, width - 12);

    // Smoothly interpolate base drift toward steady descent & gentle horizontal harmonic float
    const blend = 1 - Math.exp(-6.5 * dt);
    const swayVx = Math.cos(this.age * 2.4 + this.phaseOffset) * 18;
    const driftVy = TARGET_FALL_SPEED;

    const magnetRange = 140 + magnetBonus;
    const dx = playerX - this.sprite.x;
    const dy = playerY - this.sprite.y;
    const dist = Math.hypot(dx, dy);

    let targetVx = swayVx;
    let targetVy = driftVy;
    let magnetFactor = 0;

    if (dist < magnetRange && dist > 1) {
      const normalized = Phaser.Math.Clamp(1 - dist / magnetRange, 0, 1);
      // Smoothstep blend so magnet gently curves the falling trajectory without mid-air stalling
      magnetFactor = normalized * normalized * (3 - 2 * normalized);
      const pullSpeed = 285 + magnetBonus * 1.1;
      const pullVx = (dx / dist) * pullSpeed;
      const pullVy = (dy / dist) * pullSpeed;
      targetVx = Phaser.Math.Linear(swayVx, pullVx, magnetFactor);
      targetVy = Phaser.Math.Linear(driftVy, pullVy, magnetFactor);
    }

    // Gentle margin cushion so floating power-ups never drift off-screen
    if (this.sprite.x <= minX + 10 && targetVx < 0) {
      targetVx *= 0.2;
    } else if (this.sprite.x >= maxX - 10 && targetVx > 0) {
      targetVx *= 0.2;
    }

    this.vx = Phaser.Math.Linear(this.vx, targetVx, blend);
    this.vy = Phaser.Math.Linear(this.vy, targetVy, blend);

    this.sprite.x = Phaser.Math.Clamp(this.sprite.x + this.vx * dt, minX, maxX);
    this.sprite.y += this.vy * dt;

    // Smooth pop-in over first 0.22s + light floating breathing scale & tilt
    const appear = Math.min(1, this.age / 0.22);
    const easeOutAppear = 1 - (1 - appear) * (1 - appear);
    const breath = 1 + 0.055 * Math.sin(this.age * 4.4 + this.phaseOffset);
    const visualScale = (0.75 + 0.25 * easeOutAppear) * breath;
    this.sprite.setScale(visualScale);
    this.sprite.setRotation(
      Math.sin(this.age * 2.4 + this.phaseOffset) * 0.08 * (1 - magnetFactor * 0.7)
    );

    // Smooth fade-out warning pulse during final 2.5s instead of harsh square blink
    let fadeAlpha = appear;
    if (this.age > this.maxAge - 2.5) {
      const expireWave = 0.5 + 0.5 * Math.cos((this.age - (this.maxAge - 2.5)) * 10.5);
      fadeAlpha = 0.38 + 0.62 * expireWave;
    }
    this.sprite.setAlpha(fadeAlpha);

    // Synchronize subtle type-colored aura sprite cleanly behind main sprite
    this.auraSprite.setPosition(this.sprite.x, this.sprite.y);
    this.auraSprite.setScale((1.38 + 0.16 * Math.sin(this.age * 4.4 + this.phaseOffset)) * easeOutAppear);
    this.auraSprite.setAlpha(fadeAlpha * (0.26 + 0.12 * Math.sin(this.age * 5.2 + this.phaseOffset)));

    if (this.age >= this.maxAge || this.sprite.y > sceneHeight + 40) {
      this.deactivate();
    }
  }

  deactivate(): void {
    this.active = false;
    this.sprite.setActive(false).setVisible(false);
    this.auraSprite.setActive(false).setVisible(false);
  }

  destroy(): void {
    this.auraSprite.destroy();
    this.sprite.destroy();
  }
}
