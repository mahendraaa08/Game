import Phaser from 'phaser';
import {
  DRONE_SLOT_IDS,
  DroneId,
  DRONES,
  DroneSlotId,
  getDronePowerAtLevel,
} from '../config/DroneConfig';
import { Player } from './Player';
import { ProjectileManager } from './ProjectileManager';
import { Targetable } from './Targetable';

interface ActiveDroneSlot {
  id: DroneId;
  level: number;
  sprite: Phaser.GameObjects.Sprite;
  cooldownMs: number;
  sideOffset: number; // -1 left (slot1), +1 right (slot2)
  angle: number;
}

export class DroneManager {
  private scene: Phaser.Scene;
  private slots: ActiveDroneSlot[] = [];
  private fxGfx: Phaser.GameObjects.Graphics;
  private age = 0;

  constructor(
    scene: Phaser.Scene,
    equippedDroneSlots: Record<DroneSlotId, DroneId | null>,
    ownedLevels: Partial<Record<DroneId, number>>,
    startX: number,
    startY: number
  ) {
    this.scene = scene;
    this.fxGfx = scene.add.graphics().setDepth(11);

    DRONE_SLOT_IDS.forEach((slotId, idx) => {
      const id = equippedDroneSlots[slotId];
      if (!id) return;
      const def = DRONES[id];
      const level = Math.max(1, ownedLevels[id] ?? 1);
      const side = slotId === 'slot1' ? -1 : 1;
      const sprite = scene.add
        .sprite(startX + side * 44, startY + 8, def.textureKey)
        .setDepth(11)
        .setScale(0.95);
      this.slots.push({
        id,
        level,
        sprite,
        cooldownMs: def.baseCooldownMs * 0.6,
        sideOffset: side,
        angle: idx * Math.PI,
      });
    });
  }

  update(
    dt: number,
    player: Player,
    projectiles: ProjectileManager,
    targets: Targetable[],
    onCritRoll: () => { isCrit: boolean; mult: number }
  ): void {
    if (this.slots.length === 0) return;
    this.age += dt;
    const dtMs = dt * 1000;
    this.fxGfx.clear();

    for (let i = 0; i < this.slots.length; i++) {
      const slot = this.slots[i];
      const def = DRONES[slot.id];

      // Smooth orbit/wingman positioning without touching player hitbox
      const bobY = Math.sin(this.age * 4 + i * 2) * 7;
      const targetX = player.x + slot.sideOffset * 44;
      const targetY = player.y + 8 + bobY;
      const lerp = 1 - Math.exp(-16 * dt);
      slot.sprite.x = Phaser.Math.Linear(slot.sprite.x, targetX, lerp);
      slot.sprite.y = Phaser.Math.Linear(slot.sprite.y, targetY, lerp);
      slot.sprite.setRotation(Math.sin(this.age * 3 + i) * 0.12);

      // Subtle glow ring
      this.fxGfx.lineStyle(1, def.colorNum, 0.35);
      this.fxGfx.strokeCircle(slot.sprite.x, slot.sprite.y, 16);

      if (def.baseCooldownMs <= 0) continue; // Collector works passively via magnet & credit bonus

      slot.cooldownMs -= dtMs;
      if (slot.cooldownMs > 0) continue;

      const power = getDronePowerAtLevel(def, slot.level);

      if (slot.id === 'assault') {
        let nearest: Targetable | null = null;
        let bestDist = 520;
        for (let tIdx = 0; tIdx < targets.length; tIdx++) {
          const t = targets[tIdx];
          if (!t.active) continue;
          const d = Math.hypot(t.x - slot.sprite.x, t.y - slot.sprite.y);
          if (d < bestDist) {
            bestDist = d;
            nearest = t;
          }
        }
        if (nearest) {
          slot.cooldownMs = Math.max(320, def.baseCooldownMs - (slot.level - 1) * 40);
          const ang = Math.atan2(nearest.y - slot.sprite.y, nearest.x - slot.sprite.x);
          const spd = 760;
          const crit = onCritRoll();
          const dmg = Math.round(power * crit.mult);
          projectiles.spawnPlayerBullet(
            slot.sprite.x,
            slot.sprite.y - 10,
            Math.cos(ang) * spd,
            Math.sin(ang) * spd,
            dmg,
            'proj_laser',
            { radius: 7, scale: 0.85, isCrit: crit.isCrit }
          );
        } else {
          slot.cooldownMs = 150;
        }
      } else if (slot.id === 'shield') {
        if (player.shield < player.maxShield) {
          player.restoreShield(power);
          this.spawnPulseLine(slot.sprite.x, slot.sprite.y, player.x, player.y, def.colorNum);
          slot.cooldownMs = Math.max(4200, def.baseCooldownMs - (slot.level - 1) * 400);
        } else {
          slot.cooldownMs = 400;
        }
      } else if (slot.id === 'repair') {
        if (player.hp < player.maxHp) {
          player.healHp(power);
          this.spawnPulseLine(slot.sprite.x, slot.sprite.y, player.x, player.y, def.colorNum);
          slot.cooldownMs = Math.max(7500, def.baseCooldownMs - (slot.level - 1) * 600);
        } else {
          slot.cooldownMs = 500;
        }
      }
    }
  }

  private spawnPulseLine(x1: number, y1: number, x2: number, y2: number, color: number): void {
    const pulse = this.scene.add.circle(x2, y2, 18, color, 0.18).setDepth(14);
    pulse.setStrokeStyle(2, color, 0.85);
    this.scene.tweens.add({
      targets: pulse,
      scaleX: 1.9,
      scaleY: 1.9,
      alpha: 0,
      duration: 280,
      onComplete: () => pulse.destroy(),
    });
    this.fxGfx.lineStyle(2, color, 0.85);
    this.fxGfx.lineBetween(x1, y1, x2, y2);
  }

  destroy(): void {
    this.slots.forEach((s) => s.sprite.destroy());
    this.slots = [];
    this.fxGfx.destroy();
  }
}
