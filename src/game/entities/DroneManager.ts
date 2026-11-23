import Phaser from 'phaser';
import {
  DRONE_SLOT_IDS,
  DroneId,
  DRONES,
  DroneSlotId,
  getDronePowerAtLevel,
  getPrismTuningAtLevel,
  PRISM_MODE_SPECS,
  PrismMode,
  PrismModeSpec,
} from '../config/DroneConfig';
import { Player, PrismActiveModifiers } from './Player';
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

export interface DroneUpdateContext {
  dronePowerBonusPct: number;
  activeEnemyCount: number;
  enemyBulletCount: number;
  activeDropCount: number;
  bossActive: boolean;
  onPrismModeChanged?: (mode: PrismMode, spec: PrismModeSpec) => void;
}

export class DroneManager {
  private scene: Phaser.Scene;
  private slots: ActiveDroneSlot[] = [];
  private fxGfx: Phaser.GameObjects.Graphics;
  private age = 0;

  // Prism Adaptive Drone state (strictly single mode active at a time)
  private prismMode: PrismMode = 'offensive';
  private prismEvalTimerMs = 350;
  private prismDwellMs = 0;
  private prismRecoveryPulseTimerMs = 1500;
  private prismBadgeText: Phaser.GameObjects.Text | null = null;
  private hasPrism = false;

  constructor(
    scene: Phaser.Scene,
    equippedDroneSlots: Record<DroneSlotId, DroneId | null>,
    ownedLevels: Partial<Record<DroneId, number>>,
    startX: number,
    startY: number
  ) {
    this.scene = scene;
    this.fxGfx = scene.add.graphics().setDepth(11);

    const seen = new Set<DroneId>();
    DRONE_SLOT_IDS.forEach((slotId, idx) => {
      const id = equippedDroneSlots[slotId];
      if (!id || seen.has(id) || !DRONES[id]) return;
      seen.add(id);
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

      if (id === 'prism') {
        this.hasPrism = true;
        this.prismBadgeText = scene.add
          .text(startX + side * 44, startY + 26, PRISM_MODE_SPECS[this.prismMode].shortLabel, {
            fontFamily: 'Chakra Petch, sans-serif',
            fontSize: '10px',
            fontStyle: 'bold',
            color: PRISM_MODE_SPECS[this.prismMode].colorHex,
            stroke: '#040711',
            strokeThickness: 3,
          })
          .setOrigin(0.5)
          .setDepth(12);
      }
    });
  }

  getPrismMode(): PrismMode | null {
    return this.hasPrism ? this.prismMode : null;
  }

  private evaluatePrismMode(player: Player, ctx: DroneUpdateContext): PrismMode {
    const hpRatio = player.maxHp > 0 ? player.hp / player.maxHp : 1;
    const shieldRatio = player.maxShield > 0 ? player.shield / player.maxShield : 1;

    // Priority 1: Low Hull HP (with hysteresis to prevent flicker)
    const lowHpThreshold = this.prismMode === 'recovery' ? 0.52 : 0.45;
    if (hpRatio <= lowHpThreshold) {
      return 'recovery';
    }

    // Priority 2: High Attack Pressure
    const highPressure =
      ctx.enemyBulletCount >= 10 ||
      player.getTimeSinceHitMs() < 1800 ||
      (player.maxShield > 0 && shieldRatio <= 0.3);
    if (highPressure) {
      return 'defensive';
    }

    // Priority 3: High Enemy Count / Boss Threat
    if (ctx.activeEnemyCount >= 5 || ctx.bossActive) {
      return 'offensive';
    }

    // Priority 4: Many Item Drops Available
    if (ctx.activeDropCount >= 2) {
      return 'collection';
    }

    // Calm fallback: switch away from recovery once healthy, otherwise default offensive
    return this.prismMode === 'recovery' ? 'offensive' : 'offensive';
  }

  private buildPrismModifiers(mode: PrismMode, level: number, bonusPct: number): PrismActiveModifiers {
    const t = getPrismTuningAtLevel(level, bonusPct);
    switch (mode) {
      case 'recovery':
        return {
          damagePct: 0,
          fireRatePct: 0,
          damageReductionPct: 0,
          shieldRegenPct: 15,
          pickupRangePx: 0,
          creditBonusPct: 0,
        };
      case 'defensive':
        return {
          damagePct: 0,
          fireRatePct: 0,
          damageReductionPct: t.damageReductionPct,
          shieldRegenPct: t.shieldRegenBonusPct,
          pickupRangePx: 0,
          creditBonusPct: 0,
        };
      case 'offensive':
        return {
          damagePct: t.damageBonusPct,
          fireRatePct: t.fireRateBonusPct,
          damageReductionPct: 0,
          shieldRegenPct: 0,
          pickupRangePx: 0,
          creditBonusPct: 0,
        };
      case 'collection':
        return {
          damagePct: 0,
          fireRatePct: 0,
          damageReductionPct: 0,
          shieldRegenPct: 0,
          pickupRangePx: t.pickupRangeBonusPx,
          creditBonusPct: t.creditBonusPct,
        };
    }
  }

  update(
    dt: number,
    player: Player,
    projectiles: ProjectileManager,
    targets: Targetable[],
    onCritRoll: () => { isCrit: boolean; mult: number },
    context?: DroneUpdateContext
  ): void {
    if (this.slots.length === 0) {
      player.setPrismActiveModifiers(null);
      return;
    }
    this.age += dt;
    const dtMs = dt * 1000;
    const dronePowerBonusPct = context?.dronePowerBonusPct ?? player.stats.dronePowerBonusPct ?? 0;
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

      if (slot.id === 'prism') {
        const modeSpec = PRISM_MODE_SPECS[this.prismMode];
        const ringPulse = 0.52 + 0.25 * Math.sin(this.age * 6);
        this.fxGfx.lineStyle(1.8, modeSpec.colorNum, ringPulse);
        this.fxGfx.strokeCircle(slot.sprite.x, slot.sprite.y, 18);

        if (this.prismBadgeText) {
          this.prismBadgeText.setPosition(slot.sprite.x, slot.sprite.y + 20);
          this.prismBadgeText.setText(modeSpec.shortLabel);
          this.prismBadgeText.setColor(modeSpec.colorHex);
        }

        // Evaluate adaptive mode on controlled interval with minimum dwell guard
        this.prismDwellMs += dtMs;
        this.prismEvalTimerMs -= dtMs;
        if (this.prismEvalTimerMs <= 0 && context) {
          this.prismEvalTimerMs = def.baseCooldownMs;
          const desiredMode = this.evaluatePrismMode(player, context);
          if (desiredMode !== this.prismMode && this.prismDwellMs >= 2000) {
            this.prismMode = desiredMode;
            this.prismDwellMs = 0;
            const newSpec = PRISM_MODE_SPECS[desiredMode];
            context.onPrismModeChanged?.(desiredMode, newSpec);
            this.spawnPulseLine(slot.sprite.x, slot.sprite.y, player.x, player.y, newSpec.colorNum);
          }
        }

        // Apply strictly ONE mode's active modifiers
        player.setPrismActiveModifiers(
          this.buildPrismModifiers(this.prismMode, slot.level, dronePowerBonusPct)
        );

        // Recovery Enhancement active nanite pulse when in recovery mode
        if (this.prismMode === 'recovery') {
          this.prismRecoveryPulseTimerMs -= dtMs;
          if (this.prismRecoveryPulseTimerMs <= 0) {
            const tuning = getPrismTuningAtLevel(slot.level, dronePowerBonusPct);
            let pulsed = false;
            if (player.hp < player.maxHp) {
              player.healHp(tuning.recoveryHpPulse);
              pulsed = true;
            }
            if (player.maxShield > 0 && player.shield < player.maxShield) {
              player.restoreShield(tuning.recoveryShieldPulse);
              pulsed = true;
            }
            if (pulsed) {
              this.spawnPulseLine(
                slot.sprite.x,
                slot.sprite.y,
                player.x,
                player.y,
                PRISM_MODE_SPECS.recovery.colorNum
              );
              this.prismRecoveryPulseTimerMs = tuning.recoveryIntervalMs;
            } else {
              this.prismRecoveryPulseTimerMs = 600;
            }
          }
        }
        continue;
      }

      // Subtle glow ring for standard drones
      this.fxGfx.lineStyle(1, def.colorNum, 0.35);
      this.fxGfx.strokeCircle(slot.sprite.x, slot.sprite.y, 16);

      if (def.baseCooldownMs <= 0) continue; // Collector works passively via magnet & credit bonus

      slot.cooldownMs -= dtMs;
      if (slot.cooldownMs > 0) continue;

      const power = getDronePowerAtLevel(def, slot.level, dronePowerBonusPct);

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
          const baseInterval = Math.max(320, def.baseCooldownMs - (slot.level - 1) * 40);
          slot.cooldownMs = Math.max(270, Math.round(baseInterval / (1 + dronePowerBonusPct * 0.35)));
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
            {
              radius: 7,
              scale: 0.85,
              isCrit: crit.isCrit,
              source: 'drone',
              countsForFiringAction: false,
            }
          );
        } else {
          slot.cooldownMs = 150;
        }
      } else if (slot.id === 'shield') {
        if (player.shield < player.maxShield) {
          player.restoreShield(power);
          this.spawnPulseLine(slot.sprite.x, slot.sprite.y, player.x, player.y, def.colorNum);
          const baseInterval = Math.max(4200, def.baseCooldownMs - (slot.level - 1) * 400);
          slot.cooldownMs = Math.max(3600, Math.round(baseInterval / (1 + dronePowerBonusPct * 0.2)));
        } else {
          slot.cooldownMs = 400;
        }
      } else if (slot.id === 'repair') {
        if (player.hp < player.maxHp) {
          player.healHp(power);
          this.spawnPulseLine(slot.sprite.x, slot.sprite.y, player.x, player.y, def.colorNum);
          const baseInterval = Math.max(7500, def.baseCooldownMs - (slot.level - 1) * 600);
          slot.cooldownMs = Math.max(6400, Math.round(baseInterval / (1 + dronePowerBonusPct * 0.2)));
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
    this.prismBadgeText?.destroy();
    this.prismBadgeText = null;
    this.fxGfx.destroy();
  }
}
