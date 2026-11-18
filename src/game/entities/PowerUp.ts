import Phaser from 'phaser';
import { POWERUP_CONFIGS, PowerUpType } from '../config/PowerUpConfig';

export class PowerUpEntity {
  sprite: Phaser.GameObjects.Sprite;
  type: PowerUpType = 'health';
  active = false;
  private vy = 95;
  private age = 0;
  private maxAge = 12;

  constructor(scene: Phaser.Scene) {
    this.sprite = scene.add.sprite(-100, -100, 'powerup_health').setDepth(8);
    this.sprite.setActive(false).setVisible(false);
  }

  spawn(x: number, y: number, type: PowerUpType): void {
    this.type = type;
    this.active = true;
    this.age = 0;
    this.vy = 95;
    const def = POWERUP_CONFIGS[type];
    this.sprite.setTexture(def.textureKey);
    this.sprite.setPosition(x, y);
    this.sprite.setScale(1);
    this.sprite.setAlpha(1);
    this.sprite.setActive(true).setVisible(true);
  }

  update(dt: number, playerX: number, playerY: number, sceneHeight: number, magnetBonus = 0): void {
    if (!this.active) return;
    this.age += dt;

    // Gentle magnetic pull when player approaches (boosted by Collector Drone / Utility gear)
    const magnetRange = 140 + magnetBonus;
    const dx = playerX - this.sprite.x;
    const dy = playerY - this.sprite.y;
    const dist = Math.hypot(dx, dy);
    if (dist < magnetRange && dist > 1) {
      const pull = (280 + magnetBonus * 1.1) * (1 - dist / magnetRange);
      this.sprite.x += (dx / dist) * pull * dt;
      this.sprite.y += (dy / dist) * pull * dt;
    } else {
      this.sprite.y += this.vy * dt;
      this.sprite.x += Math.sin(this.age * 4) * 28 * dt;
    }

    const pulse = 1 + 0.09 * Math.sin(this.age * 6);
    this.sprite.setScale(pulse);

    if (this.age > this.maxAge - 2.5) {
      this.sprite.setAlpha(Math.sin(this.age * 18) > 0 ? 1 : 0.35);
    }

    if (this.age >= this.maxAge || this.sprite.y > sceneHeight + 40) {
      this.deactivate();
    }
  }

  deactivate(): void {
    this.active = false;
    this.sprite.setActive(false).setVisible(false);
  }

  destroy(): void {
    this.sprite.destroy();
  }
}
