import Phaser from 'phaser';
import { getWeaponFireRateAtLevel, WeaponId, WEAPONS } from '../config/WeaponConfig';
import { getWeaponEvolutionStage, WEAPON_RUNTIME_TUNING } from '../config/WeaponEvolutionConfig';
import { isTargetValidOnScreen } from '../systems/PassiveSystem';
import { Player } from './Player';
import { ProjectileManager } from './ProjectileManager';
import { Targetable } from './Targetable';

export interface CloneHitCallback {
  (target: Targetable, dmg: number, cloneActionId: number, countsForFiringAction: boolean): void;
}

/**
 * NOVA PRIME Passive 1: Quantum Replication
 * Persistent immortal companion replica mirroring Player's active Weapon, Level, and Evolution
 * at exactly 50% of final Player Fire Rate and 20% of corresponding normal attack damage (no Crit).
 */
export class QuantumClone {
  private scene: Phaser.Scene;
  private sprite: Phaser.GameObjects.Sprite;
  private auraGfx: Phaser.GameObjects.Graphics;
  private age = 0;

  private fireTimerMs = 120;
  private lastWeaponId: WeaponId | null = null;
  private plasmaBurstCooldownMs = 0;
  private heavyMissileCooldownMs = 0;
  private dualBarrageActiveMs = 0;
  private dualBarrageCooldownMs = 0;
  private dualBarrageShotTimerMs = 0;

  // Clone firing-action tracking for Continuous Beam pacing
  private beamActionAccumMs = 0;
  private currentBeamCloneActionId = 0;
  private nextLocalActionSeq = 1;

  constructor(scene: Phaser.Scene, startX: number, startY: number) {
    this.scene = scene;
    this.auraGfx = scene.add.graphics().setDepth(9);
    this.sprite = scene.add
      .sprite(startX, startY, 'ship_nova_prime')
      .setDepth(10)
      .setScale(0.76)
      .setAlpha(0.76)
      .setTint(0xa5b4fc);
  }

  get x(): number {
    return this.sprite.x;
  }

  get y(): number {
    return this.sprite.y;
  }

  private pickValidTarget(player: Player, targets: Targetable[]): Targetable | null {
    const w = this.scene.scale.width;
    const h = this.scene.scale.height;
    let best: Targetable | null = null;
    let bestScore = Infinity;

    for (let i = 0; i < targets.length; i++) {
      const t = targets[i];
      if (!isTargetValidOnScreen(t, w, h)) continue;
      // Prefer targets near the player's forward lane and close to the clone/player
      const distPlayer = Math.hypot(t.x - player.x, t.y - player.y);
      const lanePenalty = Math.abs(t.x - player.x) * 0.45;
      const score = distPlayer + lanePenalty;
      if (score < bestScore) {
        bestScore = score;
        best = t;
      }
    }
    return best;
  }

  update(
    dt: number,
    player: Player,
    projectiles: ProjectileManager,
    targets: Targetable[],
    allocateCloneActionId: () => number,
    onCloneInstantHit: CloneHitCallback
  ): void {
    const dtMs = Math.max(0, dt * 1000);
    this.age += dt;
    this.fireTimerMs = Math.max(0, this.fireTimerMs - dtMs);
    this.plasmaBurstCooldownMs = Math.max(0, this.plasmaBurstCooldownMs - dtMs);
    this.heavyMissileCooldownMs = Math.max(0, this.heavyMissileCooldownMs - dtMs);
    this.dualBarrageCooldownMs = Math.max(0, this.dualBarrageCooldownMs - dtMs);

    // Reset weapon-specific Evo II timers if player swapped weapons
    if (this.lastWeaponId !== player.weaponId) {
      this.lastWeaponId = player.weaponId;
      this.dualBarrageActiveMs = 0;
      this.beamActionAccumMs = 0;
      this.currentBeamCloneActionId = 0;
    }

    // Smooth offset wingman following behind/beside Player
    const offsetX = Math.sin(this.age * 2.1) * 6 - 46;
    const offsetY = 18 + Math.cos(this.age * 3.2) * 4;
    const desiredX = Phaser.Math.Clamp(
      player.x + offsetX,
      24,
      Math.max(24, this.scene.scale.width - 24)
    );
    const desiredY = Phaser.Math.Clamp(
      player.y + offsetY,
      74,
      Math.max(74, this.scene.scale.height - 46)
    );
    const lerp = 1 - Math.exp(-13 * dt);
    this.sprite.x = Phaser.Math.Linear(this.sprite.x, desiredX, lerp);
    this.sprite.y = Phaser.Math.Linear(this.sprite.y, desiredY, lerp);

    // Holographic pulse visual (zero object allocation per frame)
    this.auraGfx.clear();
    const pulse = 0.55 + 0.25 * Math.sin(this.age * 6);
    this.auraGfx.lineStyle(1.5, 0x818cf8, 0.45 * pulse);
    this.auraGfx.strokeCircle(this.sprite.x, this.sprite.y, 24);
    this.auraGfx.fillStyle(0x6366f1, 0.12 * pulse);
    this.auraGfx.fillCircle(this.sprite.x, this.sprite.y, 21);

    const wId = player.weaponId;
    const wLevel = player.weaponLevel;
    const wStage = getWeaponEvolutionStage(wLevel);
    const weaponDef = WEAPONS[wId];

    // Mirror Player's final Fire Rate * 0.50 and normal damageMult * 0.20 (no Crit!)
    const playerFireRateMult = player.getEffectiveFireRateMult();
    const cloneFireRateMult = playerFireRateMult * 0.5;
    const normalDmgMult = player.getNormalDamageMult();

    const target = this.pickValidTarget(player, targets);
    const wantFire = player.isWantingFire() && target !== null;

    if (wId === 'beam') {
      const aimX = target ? target.x : this.x;
      const aimY = target ? target.y : Math.max(0, this.y - 300);
      projectiles.updateCloneContinuousBeam(dt, {
        firing: wantFire,
        x: this.x,
        y: this.y,
        aimX,
        aimY,
        weaponLevel: wLevel,
        damageMult: normalDmgMult,
        totalFireRateMult: playerFireRateMult,
        targets,
        acquireCloneAction: (tickMs, effectivePlayerFireRate) => {
          const cycleWindowMs = Math.max(
            260,
            Math.round(500 / Math.max(0.5, effectivePlayerFireRate))
          );
          this.beamActionAccumMs += tickMs;
          if (this.currentBeamCloneActionId === 0 || this.beamActionAccumMs >= cycleWindowMs) {
            this.beamActionAccumMs = 0;
            this.currentBeamCloneActionId = allocateCloneActionId() || this.nextLocalActionSeq++;
            return { cloneActionId: this.currentBeamCloneActionId, countsForFiringAction: true };
          }
          return { cloneActionId: this.currentBeamCloneActionId, countsForFiringAction: false };
        },
        onCloneInstantHit,
      });
      this.sprite.setRotation(
        wantFire && target
          ? Phaser.Math.Clamp((target.x - this.x) * 0.0008, -0.18, 0.18)
          : 0
      );
      return;
    }

    // Ensure Clone Beam turns off when switching away from Beam
    projectiles.updateCloneContinuousBeam(dt, {
      firing: false,
      x: this.x,
      y: this.y,
      aimX: this.x,
      aimY: this.y - 100,
      weaponLevel: wLevel,
      damageMult: normalDmgMult,
      totalFireRateMult: playerFireRateMult,
      targets,
      acquireCloneAction: () => ({ cloneActionId: 0, countsForFiringAction: false }),
      onCloneInstantHit,
    });
    this.beamActionAccumMs = 0;
    this.currentBeamCloneActionId = 0;

    if (wantFire && target) {
      const aimAngle = Math.atan2(target.y - this.y, target.x - this.x);
      this.sprite.setRotation(Phaser.Math.Clamp((aimAngle + Math.PI / 2) * 0.35, -0.22, 0.22));

      if (this.fireTimerMs <= 0) {
        const baseCycleMs = getWeaponFireRateAtLevel(weaponDef, wLevel);
        // Exact 50% of Player's final Fire Rate => 2x interval
        this.fireTimerMs = Math.max(110, baseCycleMs / cloneFireRateMult);
        const cloneActionId = allocateCloneActionId() || this.nextLocalActionSeq++;

        projectiles.fireWeapon(
          wId,
          this.x,
          this.y,
          normalDmgMult,
          targets,
          (hitTarget, hitDmg) => onCloneInstantHit(hitTarget, hitDmg, cloneActionId, true),
          {
            weaponLevel: wLevel,
            source: 'clone',
            cloneActionId,
            countsForFiringAction: true,
            damageScale: 0.2,
            aimAngleRad: aimAngle,
            plasmaBurstProcReady: this.plasmaBurstCooldownMs <= 0,
            onPlasmaBurstTriggered: () => {
              this.plasmaBurstCooldownMs =
                WEAPON_RUNTIME_TUNING.plasma.evo2BurstCooldownMs * 2;
            },
            heavyMissileProcReady: this.heavyMissileCooldownMs <= 0,
            onHeavyMissileTriggered: () => {
              this.heavyMissileCooldownMs =
                WEAPON_RUNTIME_TUNING.homing.evo2HeavyCooldownMs * 2;
            },
            rollCrit: () => ({ isCrit: false, mult: 1 }),
          }
        );

        // Mirror Dual Laser Evolution II Central Rapid Barrage window at 50% cadence & 20% dmg
        if (
          wId === 'dual_laser' &&
          wStage === 2 &&
          this.dualBarrageActiveMs <= 0 &&
          this.dualBarrageCooldownMs <= 0 &&
          Math.random() < WEAPON_RUNTIME_TUNING.dual_laser.evo2BarrageProcChance
        ) {
          this.dualBarrageActiveMs = WEAPON_RUNTIME_TUNING.dual_laser.evo2BarrageDurationMs;
          this.dualBarrageShotTimerMs = 0;
        }
      }
    } else {
      this.sprite.setRotation(0);
    }

    // Clone Dual Laser Evolution II Barrage emitter
    if (wId === 'dual_laser' && wStage === 2 && this.dualBarrageActiveMs > 0) {
      this.dualBarrageActiveMs -= dtMs;
      if (wantFire && target) {
        this.dualBarrageShotTimerMs -= dtMs;
        if (this.dualBarrageShotTimerMs <= 0) {
          this.dualBarrageShotTimerMs = Math.max(
            104,
            WEAPON_RUNTIME_TUNING.dual_laser.evo2BarrageFireIntervalMs / cloneFireRateMult
          );
          const aimAngle = Math.atan2(target.y - this.y, target.x - this.x);
          const cloneActionId = allocateCloneActionId() || this.nextLocalActionSeq++;
          projectiles.fireDualCentralBarrageBolt(
            this.x,
            this.y,
            wLevel,
            normalDmgMult,
            () => ({ isCrit: false, mult: 1 }),
            {
              source: 'clone',
              cloneActionId,
              countsForFiringAction: false,
              damageScale: 0.2,
              aimAngleRad: aimAngle,
            }
          );
        }
      }
      if (this.dualBarrageActiveMs <= 0) {
        this.dualBarrageActiveMs = 0;
        this.dualBarrageCooldownMs =
          WEAPON_RUNTIME_TUNING.dual_laser.evo2BarrageCooldownMs * 2;
      }
    }
  }

  destroy(): void {
    this.sprite.destroy();
    this.auraGfx.destroy();
  }
}
