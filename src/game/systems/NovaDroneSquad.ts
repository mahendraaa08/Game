import Phaser from 'phaser';
import { NOVA_DRONE_WEAPON_CONFIGS, NovaDroneWeaponConfig } from '../config/AircraftEvolutionConfig';
import { WeaponId } from '../config/WeaponConfig';
import { ProjectileManager } from '../entities/ProjectileManager';
import { Targetable } from '../entities/Targetable';

const ALL_PRIMARY_WEAPONS: readonly WeaponId[] = [
  'plasma',
  'dual_laser',
  'spread',
  'beam',
  'homing',
  'lightning',
];

const FORMATION_OFFSETS: ReadonlyArray<{ dx: number; dy: number; phase: number }> = [
  { dx: -56, dy: -16, phase: 0 },
  { dx: 56, dy: -16, phase: 1.5 },
  { dx: -36, dy: 26, phase: 3.1 },
  { dx: 36, dy: 26, phase: 4.7 },
];

interface DroneUnit {
  index: number;
  weaponId: WeaponId;
  cfg: NovaDroneWeaponConfig;
  sprite: Phaser.GameObjects.Sprite;
  fireTimerMs: number;
  lockedTarget: Targetable | null;
  beamRampStacks: number;
  beamVisible: boolean;
  beamTargetX: number;
  beamTargetY: number;
}

export class NovaDroneSquad {
  private scene: Phaser.Scene;
  private gfx: Phaser.GameObjects.Graphics;
  private drones: DroneUnit[] = [];
  private active = false;
  private ageSec = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.gfx = scene.add.graphics().setDepth(13);
  }

  private pickDistinctFourWeapons(): WeaponId[] {
    const pool: WeaponId[] = [...ALL_PRIMARY_WEAPONS];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = pool[i];
      pool[i] = pool[j];
      pool[j] = tmp;
    }
    return pool.slice(0, 4);
  }

  activate(playerX: number, playerY: number): WeaponId[] {
    this.deactivate();
    const chosen = this.pickDistinctFourWeapons();
    this.active = true;
    this.ageSec = 0;

    for (let i = 0; i < 4; i++) {
      const wId = chosen[i];
      const cfg = NOVA_DRONE_WEAPON_CONFIGS[wId];
      const off = FORMATION_OFFSETS[i];
      const sx = Phaser.Math.Clamp(playerX + off.dx, 24, this.scene.scale.width - 24);
      const sy = Phaser.Math.Clamp(playerY + off.dy, 64, this.scene.scale.height - 40);

      const sprite = this.scene.add
        .sprite(sx, sy, 'drone_nova_evo')
        .setDepth(11)
        .setScale(0.95)
        .setAlpha(0.15);

      const pulse = this.scene.add.circle(sx, sy, 8, cfg.colorNum, 0.22).setDepth(14);
      pulse.setStrokeStyle(1.8, 0xf8fafc, 0.9);
      this.scene.tweens.add({
        targets: pulse,
        scaleX: 2.3,
        scaleY: 2.3,
        alpha: 0,
        duration: 240,
        onComplete: () => pulse.destroy(),
      });

      this.drones.push({
        index: i,
        weaponId: wId,
        cfg,
        sprite,
        fireTimerMs: 90 + i * 55,
        lockedTarget: null,
        beamRampStacks: 0,
        beamVisible: false,
        beamTargetX: sx,
        beamTargetY: sy - 120,
      });
    }

    return chosen;
  }

  getActiveWeaponIds(): WeaponId[] {
    return this.active ? this.drones.map((d) => d.weaponId) : [];
  }

  isActive(): boolean {
    return this.active;
  }

  update(
    dt: number,
    playerX: number,
    playerY: number,
    targets: Targetable[],
    projectiles: ProjectileManager,
    onInstantHit: (target: Targetable, dmg: number, isCrit?: boolean) => void,
    rollCrit: () => { isCrit: boolean; mult: number }
  ): void {
    this.gfx.clear();
    if (!this.active || this.drones.length === 0) return;

    this.ageSec += dt;
    const dtMs = dt * 1000;
    const w = this.scene.scale.width;
    const h = this.scene.scale.height;
    const lerp = 1 - Math.exp(-13 * dt);

    for (let i = 0; i < this.drones.length; i++) {
      const d = this.drones[i];
      const off = FORMATION_OFFSETS[d.index];
      const bobY = Math.sin(this.ageSec * 4.2 + off.phase) * 4;
      const targetX = Phaser.Math.Clamp(playerX + off.dx, 22, w - 22);
      const targetY = Phaser.Math.Clamp(playerY + off.dy + bobY, 60, h - 34);

      d.sprite.x = Phaser.Math.Linear(d.sprite.x, targetX, lerp);
      d.sprite.y = Phaser.Math.Linear(d.sprite.y, targetY, lerp);
      d.sprite.setAlpha(Math.min(1, this.ageSec / 0.22));

      // Subtle tactical link line + colored ring per drone weapon identity
      this.gfx.lineStyle(1, 0x22d3ee, 0.22);
      this.gfx.lineBetween(playerX, playerY, d.sprite.x, d.sprite.y);
      this.gfx.lineStyle(1.6, d.cfg.colorNum, 0.65);
      this.gfx.strokeCircle(d.sprite.x, d.sprite.y, 13);

      // Acquire best valid target within weapon range (with hysteresis)
      const target = this.selectTarget(d, targets);

      if (target && target.active) {
        const aimAngle = Math.atan2(target.y - d.sprite.y, target.x - d.sprite.x);
        d.sprite.setRotation(
          Phaser.Math.Angle.RotateTo(d.sprite.rotation, aimAngle + Math.PI / 2, 12 * dt)
        );
      } else {
        d.sprite.setRotation(Phaser.Math.Angle.RotateTo(d.sprite.rotation, 0, 8 * dt));
      }

      if (d.weaponId === 'beam') {
        this.updateBeamDrone(d, dtMs, target, onInstantHit, rollCrit);
      } else {
        d.beamVisible = false;
        d.fireTimerMs -= dtMs;
        if (d.fireTimerMs <= 0 && target && target.active) {
          d.fireTimerMs = d.cfg.fireIntervalMs;
          this.fireBaseWeapon(d, target, targets, projectiles, onInstantHit, rollCrit);
        }
      }
    }
  }

  private selectTarget(d: DroneUnit, targets: Targetable[]): Targetable | null {
    const sx = d.sprite.x;
    const sy = d.sprite.y;
    const maxRange = d.cfg.rangePx;
    const dropRange = maxRange + 75;

    let locked = d.lockedTarget;
    let lockedDist = Infinity;
    if (locked && locked.active && !('entering' in locked && (locked as { entering?: boolean }).entering)) {
      lockedDist = Math.hypot(locked.x - sx, locked.y - sy);
      if (lockedDist > dropRange) {
        locked = null;
        lockedDist = Infinity;
      }
    } else {
      locked = null;
    }

    let nearest: Targetable | null = null;
    let nearestDist = maxRange;
    for (let i = 0; i < targets.length; i++) {
      const cand = targets[i];
      if (!cand.active) continue;
      if ('entering' in cand && (cand as { entering?: boolean }).entering) continue;
      const dist = Math.hypot(cand.x - sx, cand.y - sy);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = cand;
      }
    }

    if (!locked) {
      locked = nearest;
    } else if (nearest && nearest !== locked && nearestDist + 55 < lockedDist) {
      locked = nearest;
    }

    if (locked !== d.lockedTarget) {
      d.beamRampStacks = 0;
    }
    d.lockedTarget = locked;
    return locked;
  }

  private updateBeamDrone(
    d: DroneUnit,
    dtMs: number,
    target: Targetable | null,
    onInstantHit: (target: Targetable, dmg: number, isCrit?: boolean) => void,
    rollCrit: () => { isCrit: boolean; mult: number }
  ): void {
    if (!target || !target.active) {
      d.beamVisible = false;
      d.beamRampStacks = 0;
      return;
    }

    d.beamVisible = true;
    d.beamTargetX = target.x;
    d.beamTargetY = target.y;

    const w = d.cfg.beamWidthPx ?? 4;
    this.gfx.lineStyle(w + 3, d.cfg.colorNum, 0.34);
    this.gfx.lineBetween(d.sprite.x, d.sprite.y, d.beamTargetX, d.beamTargetY);
    this.gfx.lineStyle(Math.max(1.8, w * 0.52), 0xf8fafc, 0.92);
    this.gfx.lineBetween(d.sprite.x, d.sprite.y, d.beamTargetX, d.beamTargetY);
    this.gfx.fillStyle(d.cfg.colorNum, 0.55);
    this.gfx.fillCircle(d.beamTargetX, d.beamTargetY, 5.5);

    d.fireTimerMs -= dtMs;
    if (d.fireTimerMs <= 0) {
      d.fireTimerMs = d.cfg.beamTickIntervalMs ?? d.cfg.fireIntervalMs;
      const crit = rollCrit();
      const rampMult = 1 + d.beamRampStacks;
      const dmg = Math.max(2, Math.round(d.cfg.damage * rampMult * crit.mult));
      onInstantHit(target, dmg, crit.isCrit);
      if (target.active) {
        const maxRamp = d.cfg.beamMaxRampBonus ?? 0.35;
        const step = d.cfg.beamRampPerTick ?? 0.05;
        d.beamRampStacks = Math.min(maxRamp, d.beamRampStacks + step);
      } else {
        d.beamRampStacks = 0;
      }
    }
  }

  private fireBaseWeapon(
    d: DroneUnit,
    target: Targetable,
    targets: Targetable[],
    projectiles: ProjectileManager,
    onInstantHit: (target: Targetable, dmg: number, isCrit?: boolean) => void,
    rollCrit: () => { isCrit: boolean; mult: number }
  ): void {
    const sx = d.sprite.x;
    const sy = d.sprite.y;
    const aimAngle = Math.atan2(target.y - sy, target.x - sx);
    const crit = rollCrit();
    const dmg = Math.max(2, Math.round(d.cfg.damage * crit.mult));

    switch (d.weaponId) {
      case 'plasma': {
        // Base Plasma: 1 balanced plasma bolt (no Evo shards/burst)
        const spd = d.cfg.projectileSpeed;
        projectiles.spawnPlayerBullet(
          sx,
          sy - 8,
          Math.cos(aimAngle) * spd,
          Math.sin(aimAngle) * spd,
          dmg,
          'proj_plasma',
          {
            isCrit: crit.isCrit,
            radius: d.cfg.projectileRadius,
            scale: 0.82,
            trailColor: d.cfg.colorNum,
            trailWidth: 2,
            trailLength: 12,
          }
        );
        break;
      }

      case 'dual_laser': {
        // Base Dual Laser: 2 parallel bolts (no Evo central barrage)
        const spd = d.cfg.projectileSpeed;
        const perpX = -Math.sin(aimAngle) * 6;
        const perpY = Math.cos(aimAngle) * 6;
        projectiles.spawnPlayerBullet(
          sx - perpX,
          sy - perpY,
          Math.cos(aimAngle) * spd,
          Math.sin(aimAngle) * spd,
          dmg,
          'proj_laser',
          {
            isCrit: crit.isCrit,
            radius: d.cfg.projectileRadius,
            scale: 0.76,
            trailColor: d.cfg.colorNum,
            trailWidth: 1.8,
            trailLength: 14,
          }
        );
        projectiles.spawnPlayerBullet(
          sx + perpX,
          sy + perpY,
          Math.cos(aimAngle) * spd,
          Math.sin(aimAngle) * spd,
          dmg,
          'proj_laser',
          {
            isCrit: crit.isCrit,
            radius: d.cfg.projectileRadius,
            scale: 0.76,
            trailColor: d.cfg.colorNum,
            trailWidth: 1.8,
            trailLength: 14,
          }
        );
        break;
      }

      case 'spread': {
        // Base Spread: 4-way fan (strictly Base Form 4 bolts, never Evo2 6-way)
        const spd = d.cfg.projectileSpeed;
        const offsets = d.cfg.spreadAnglesRad ?? [-0.3, -0.1, 0.1, 0.3];
        for (let i = 0; i < offsets.length; i++) {
          const ang = aimAngle + offsets[i];
          projectiles.spawnPlayerBullet(
            sx,
            sy - 6,
            Math.cos(ang) * spd,
            Math.sin(ang) * spd,
            dmg,
            'proj_spread',
            {
              isCrit: crit.isCrit,
              radius: d.cfg.projectileRadius,
              scale: 0.76,
              trailColor: d.cfg.colorNum,
              trailWidth: 1.8,
              trailLength: 11,
            }
          );
        }
        break;
      }

      case 'homing': {
        // Base Homing: 2 homing missiles with mild AoE splash (no Heavy Missile proc)
        const spd = d.cfg.projectileSpeed;
        const splashRad = d.cfg.splashRadiusPx ?? 42;
        const splashRatio = d.cfg.splashDamageRatio ?? 0.3;
        [-0.22, 0.22].forEach((angOff) => {
          const ang = aimAngle + angOff;
          projectiles.spawnPlayerBullet(
            sx,
            sy - 6,
            Math.cos(ang) * spd,
            Math.sin(ang) * spd,
            dmg,
            'proj_missile',
            {
              homing: true,
              isCrit: crit.isCrit,
              radius: d.cfg.projectileRadius,
              scale: 0.8,
              trailColor: d.cfg.colorNum,
              trailWidth: 2.2,
              trailLength: 14,
              splashRadius: splashRad,
              splashDamageRatio: splashRatio,
              splashColor: d.cfg.colorNum,
            }
          );
        });
        break;
      }

      case 'lightning': {
        // Base Lightning: instant chain across nearby enemies with hop decay (no Paralyze stun)
        const maxJumps = d.cfg.lightningMaxJumps ?? 3;
        const chainRange = d.cfg.lightningChainRangePx ?? 145;
        const decay = d.cfg.lightningBounceDecay ?? 0.72;
        const chain: Array<{ x: number; y: number }> = [{ x: sx, y: sy }];
        const hitSet = new Set<Targetable>();

        let currX = sx;
        let currY = sy;
        let first = target;

        for (let jump = 0; jump < maxJumps; jump++) {
          let chosenTarget: Targetable | null = jump === 0 ? first : null;
          if (!chosenTarget) {
            let bestDist = chainRange;
            for (let tIdx = 0; tIdx < targets.length; tIdx++) {
              const cand = targets[tIdx];
              if (!cand.active || hitSet.has(cand)) continue;
              if ('entering' in cand && (cand as { entering?: boolean }).entering) continue;
              const dist = Math.hypot(cand.x - currX, cand.y - currY);
              if (dist < bestDist) {
                bestDist = dist;
                chosenTarget = cand;
              }
            }
          }
          if (!chosenTarget || !chosenTarget.active) break;
          hitSet.add(chosenTarget);
          chain.push({ x: chosenTarget.x, y: chosenTarget.y });
          onInstantHit(chosenTarget, Math.max(2, Math.round(dmg * Math.pow(decay, jump))), crit.isCrit);
          currX = chosenTarget.x;
          currY = chosenTarget.y;
          first = chosenTarget;
        }
        if (chain.length >= 2) {
          projectiles.addLightningArc(chain, false, false);
        }
        break;
      }
    }
  }

  deactivate(): void {
    this.active = false;
    this.ageSec = 0;
    for (let i = 0; i < this.drones.length; i++) {
      const d = this.drones[i];
      if (d.sprite && d.sprite.scene) {
        const px = d.sprite.x;
        const py = d.sprite.y;
        const color = d.cfg.colorNum;
        d.sprite.destroy();
        if (this.scene?.sys?.isActive()) {
          const ring = this.scene.add.circle(px, py, 10, color, 0.16).setDepth(14);
          ring.setStrokeStyle(1.6, 0xf8fafc, 0.8);
          this.scene.tweens.add({
            targets: ring,
            scaleX: 0.25,
            scaleY: 0.25,
            alpha: 0,
            duration: 200,
            onComplete: () => ring.destroy(),
          });
        }
      }
    }
    this.drones = [];
    this.gfx?.clear();
  }

  destroy(): void {
    this.deactivate();
    this.gfx.destroy();
  }
}
