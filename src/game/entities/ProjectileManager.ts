import Phaser from 'phaser';
import { getWeaponDamageAtLevel, WeaponId, WEAPONS } from '../config/WeaponConfig';
import { ObjectPool } from '../utils/ObjectPool';
import { Targetable } from './Targetable';

export interface PlayerBullet {
  sprite: Phaser.GameObjects.Sprite;
  active: boolean;
  vx: number;
  vy: number;
  damage: number;
  isCrit: boolean;
  homing: boolean;
  piercing: boolean;
  age: number;
  radius: number;
  setActive(v: boolean): this;
  setVisible(v: boolean): this;
}

export interface EnemyBullet {
  sprite: Phaser.GameObjects.Sprite;
  active: boolean;
  vx: number;
  vy: number;
  ax: number;
  ay: number;
  turnRate: number;
  turnDuration: number;
  homingTurnRate: number;
  homingDelay: number;
  homingDuration: number;
  waveAmp: number;
  waveFreq: number;
  wavePhase: number;
  splitAfterSec: number;
  splitCount: number;
  splitSpeed: number;
  splitSpreadRad: number;
  splitAimed: boolean;
  splitTextureKey: string;
  splitTint?: number;
  splitDamage: number;
  splitRadius: number;
  baseScale: number;
  spinRate: number;
  age: number;
  damage: number;
  radius: number;
  setActive(v: boolean): this;
  setVisible(v: boolean): this;
}

interface VisualBeam {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: number;
  width: number;
  life: number;
  maxLife: number;
}

interface LightningBolt {
  points: Array<{ x: number; y: number }>;
  life: number;
  maxLife: number;
}

export interface WeaponFireOptions {
  weaponLevel?: number;
  extraChainTargets?: number;
  hasAstralWingBolts?: boolean;
  heavyScaleMult?: number;
  rollCrit?: () => { isCrit: boolean; mult: number };
}

export class ProjectileManager {
  private scene: Phaser.Scene;
  private playerPool: ObjectPool<PlayerBullet>;
  private enemyPool: ObjectPool<EnemyBullet>;
  private fxGraphics: Phaser.GameObjects.Graphics;
  private beams: VisualBeam[] = [];
  private lightningBolts: LightningBolt[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.fxGraphics = scene.add.graphics().setDepth(14);

    this.playerPool = new ObjectPool<PlayerBullet>(
      () => {
        const sprite = scene.add.sprite(-200, -200, 'proj_plasma').setDepth(12);
        const obj: PlayerBullet = {
          sprite,
          active: false,
          vx: 0,
          vy: 0,
          damage: 10,
          isCrit: false,
          homing: false,
          piercing: false,
          age: 0,
          radius: 8,
          setActive(v: boolean) {
            this.active = v;
            sprite.setActive(v);
            return this;
          },
          setVisible(v: boolean) {
            sprite.setVisible(v);
            return this;
          },
        };
        return obj;
      },
      48,
      280
    );

    this.enemyPool = new ObjectPool<EnemyBullet>(
      () => {
        const sprite = scene.add.sprite(-200, -200, 'proj_enemy_bolt').setDepth(11);
        const obj: EnemyBullet = {
          sprite,
          active: false,
          vx: 0,
          vy: 0,
          ax: 0,
          ay: 0,
          turnRate: 0,
          turnDuration: 0,
          homingTurnRate: 0,
          homingDelay: 0,
          homingDuration: 0,
          waveAmp: 0,
          waveFreq: 0,
          wavePhase: 0,
          splitAfterSec: 0,
          splitCount: 0,
          splitSpeed: 240,
          splitSpreadRad: 0,
          splitAimed: false,
          splitTextureKey: 'proj_enemy_shard',
          splitTint: undefined,
          splitDamage: 12,
          splitRadius: 6,
          baseScale: 1,
          spinRate: 0,
          damage: 12,
          age: 0,
          radius: 7,
          setActive(v: boolean) {
            this.active = v;
            sprite.setActive(v);
            return this;
          },
          setVisible(v: boolean) {
            sprite.setVisible(v);
            return this;
          },
        };
        return obj;
      },
      80,
      420
    );
  }

  spawnPlayerBullet(
    x: number,
    y: number,
    vx: number,
    vy: number,
    damage: number,
    textureKey: string,
    options?: {
      homing?: boolean;
      piercing?: boolean;
      radius?: number;
      scale?: number;
      isCrit?: boolean;
      tint?: number;
    }
  ): void {
    const b = this.playerPool.acquire();
    if (!b) return;
    b.setActive(true).setVisible(true);
    b.sprite.setTexture(textureKey);
    b.sprite.setPosition(x, y);
    b.sprite.setScale(options?.scale ?? 1);
    if (options?.tint !== undefined) {
      b.sprite.setTint(options.tint);
    } else if (options?.isCrit) {
      b.sprite.setTint(0xfef08a);
    } else {
      b.sprite.clearTint();
    }
    b.sprite.setRotation(Math.atan2(vy, vx) + Math.PI / 2);
    b.vx = vx;
    b.vy = vy;
    b.damage = damage;
    b.isCrit = options?.isCrit ?? false;
    b.homing = options?.homing ?? false;
    b.piercing = options?.piercing ?? false;
    b.age = 0;
    b.radius = options?.radius ?? 8;
  }

  spawnEnemyBullet(
    x: number,
    y: number,
    vx: number,
    vy: number,
    damage: number,
    textureKey = 'proj_enemy_bolt',
    radius = 7,
    tint?: number,
    options?: {
      ax?: number;
      ay?: number;
      turnRate?: number;
      turnDuration?: number;
      homingTurnRate?: number;
      homingDelay?: number;
      homingDuration?: number;
      waveAmp?: number;
      waveFreq?: number;
      wavePhase?: number;
      splitAfterSec?: number;
      splitCount?: number;
      splitSpeed?: number;
      splitSpreadRad?: number;
      splitAimed?: boolean;
      splitTextureKey?: string;
      splitTint?: number;
      splitDamage?: number;
      splitRadius?: number;
      spinRate?: number;
      scale?: number;
    }
  ): void {
    const b = this.enemyPool.acquire();
    if (!b) return;
    const baseScale = options?.scale ?? 1;
    b.setActive(true).setVisible(true);
    b.sprite.setTexture(textureKey);
    b.sprite.setPosition(x, y);
    b.sprite.setScale(baseScale);
    if (tint !== undefined) {
      b.sprite.setTint(tint);
    } else {
      b.sprite.clearTint();
    }
    b.vx = vx;
    b.vy = vy;
    b.ax = options?.ax ?? 0;
    b.ay = options?.ay ?? 0;
    b.turnRate = options?.turnRate ?? 0;
    b.turnDuration = options?.turnDuration ?? 0;
    b.homingTurnRate = options?.homingTurnRate ?? 0;
    b.homingDelay = options?.homingDelay ?? 0.14;
    b.homingDuration = options?.homingDuration ?? 1.65;
    b.waveAmp = options?.waveAmp ?? 0;
    b.waveFreq = options?.waveFreq ?? 5.5;
    b.wavePhase = options?.wavePhase ?? 0;
    b.splitAfterSec = options?.splitAfterSec ?? 0;
    b.splitCount = options?.splitCount ?? 0;
    b.splitSpeed = options?.splitSpeed ?? 240;
    b.splitSpreadRad = options?.splitSpreadRad ?? 0;
    b.splitAimed = options?.splitAimed ?? false;
    b.splitTextureKey = options?.splitTextureKey ?? 'proj_enemy_shard';
    b.splitTint = options?.splitTint;
    b.splitDamage = options?.splitDamage ?? Math.max(8, Math.round(damage * 0.78));
    b.splitRadius = options?.splitRadius ?? 6;
    b.baseScale = baseScale;
    b.spinRate = options?.spinRate ?? 0;
    b.damage = damage;
    b.age = 0;
    b.radius = radius;
    b.sprite.setRotation(Math.atan2(vy, vx) + Math.PI / 2);
  }

  fireWeapon(
    weapon: WeaponId,
    x: number,
    y: number,
    damageMult: number,
    targets: Targetable[],
    onInstantHit: (target: Targetable, dmg: number, isCrit?: boolean) => void,
    options?: WeaponFireOptions
  ): void {
    const wLevel = options?.weaponLevel ?? 1;
    const baseWeaponDmg = getWeaponDamageAtLevel(WEAPONS[weapon], wLevel);
    const scaleMult = options?.heavyScaleMult ?? 1;
    const rollCrit = options?.rollCrit ?? (() => ({ isCrit: false, mult: 1 }));

    switch (weapon) {
      case 'plasma': {
        const crit = rollCrit();
        const dmg = Math.round(baseWeaponDmg * damageMult * crit.mult);
        if (wLevel >= 8) {
          this.spawnPlayerBullet(x - 8, y - 22, -18, -840, Math.round(dmg * 0.58), 'proj_plasma', {
            isCrit: crit.isCrit,
            scale: scaleMult,
          });
          this.spawnPlayerBullet(x + 8, y - 22, 18, -840, Math.round(dmg * 0.58), 'proj_plasma', {
            isCrit: crit.isCrit,
            scale: scaleMult,
          });
        } else {
          this.spawnPlayerBullet(x, y - 24, 0, -840, dmg, 'proj_plasma', {
            isCrit: crit.isCrit,
            scale: scaleMult,
          });
        }
        break;
      }
      case 'dual_laser': {
        const crit = rollCrit();
        const dmg = Math.round(baseWeaponDmg * damageMult * crit.mult);
        this.spawnPlayerBullet(x - 14, y - 16, 0, -980, dmg, 'proj_laser', {
          isCrit: crit.isCrit,
          scale: scaleMult,
        });
        this.spawnPlayerBullet(x + 14, y - 16, 0, -980, dmg, 'proj_laser', {
          isCrit: crit.isCrit,
          scale: scaleMult,
        });
        if (wLevel >= 12) {
          this.spawnPlayerBullet(x, y - 24, 0, -1040, Math.round(dmg * 0.6), 'proj_laser', {
            isCrit: crit.isCrit,
            scale: scaleMult,
          });
        }
        break;
      }
      case 'spread': {
        const crit = rollCrit();
        const dmg = Math.round(baseWeaponDmg * damageMult * crit.mult);
        const angles =
          wLevel >= 12
            ? [-0.45, -0.3, -0.15, 0, 0.15, 0.3, 0.45]
            : [-0.36, -0.18, 0, 0.18, 0.36];
        angles.forEach((ang) => {
          const speed = 740;
          this.spawnPlayerBullet(
            x,
            y - 18,
            Math.sin(ang) * speed,
            -Math.cos(ang) * speed,
            dmg,
            'proj_spread',
            { radius: 7, isCrit: crit.isCrit, scale: scaleMult }
          );
        });
        break;
      }
      case 'homing': {
        const crit = rollCrit();
        const dmg = Math.round(baseWeaponDmg * damageMult * crit.mult);
        this.spawnPlayerBullet(x - 16, y - 12, -70, -520, dmg, 'proj_missile', {
          homing: true,
          radius: 9 * scaleMult,
          scale: scaleMult,
          isCrit: crit.isCrit,
        });
        this.spawnPlayerBullet(x + 16, y - 12, 70, -520, dmg, 'proj_missile', {
          homing: true,
          radius: 9 * scaleMult,
          scale: scaleMult,
          isCrit: crit.isCrit,
        });
        if (wLevel >= 12) {
          this.spawnPlayerBullet(x, y - 22, 0, -560, Math.round(dmg * 0.75), 'proj_missile', {
            homing: true,
            radius: 9 * scaleMult,
            scale: scaleMult,
            isCrit: crit.isCrit,
          });
        }
        break;
      }
      case 'beam': {
        const crit = rollCrit();
        const dmg = Math.round(baseWeaponDmg * damageMult * crit.mult);
        const ratio = Math.min(
          1,
          Math.max(0, wLevel - 1) / Math.max(1, WEAPONS.beam.maxWeaponLevel - 1)
        );
        const beamWidth = 13 + Math.round(ratio * 4);
        const beamHalfSpan = 16 + Math.round(ratio * 8);
        this.addVisualBeam(x, y - 26, x, 0, crit.isCrit ? 0xfef08a : 0x60a5fa, beamWidth, 0.085);
        for (let i = 0; i < targets.length; i++) {
          const t = targets[i];
          if (!t.active) continue;
          if (Math.abs(t.x - x) <= t.radius + beamHalfSpan && t.y < y) {
            onInstantHit(t, dmg, crit.isCrit);
          }
        }
        break;
      }
      case 'lightning': {
        const crit = rollCrit();
        const baseDmg = Math.round(baseWeaponDmg * damageMult * crit.mult);
        const maxJumps = (wLevel >= 12 ? 5 : 4) + (options?.extraChainTargets ?? 0);
        const sorted = targets
          .filter((t) => t.active && t.y < y + 40)
          .sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y));

        if (sorted.length === 0) {
          this.addLightningArc([
            { x, y: y - 24 },
            { x: x + (Math.random() - 0.5) * 40, y: Math.max(20, y - 280) },
          ]);
          return;
        }

        const chain: Array<{ x: number; y: number }> = [{ x, y: y - 24 }];
        const hitSet = new Set<Targetable>();
        let currX = x;
        let currY = y - 24;

        for (let jump = 0; jump < maxJumps; jump++) {
          let best: Targetable | null = null;
          let bestDist = jump === 0 ? 540 : 270;
          for (let i = 0; i < sorted.length; i++) {
            const cand = sorted[i];
            if (!cand.active || hitSet.has(cand)) continue;
            const d = Math.hypot(cand.x - currX, cand.y - currY);
            if (d < bestDist) {
              bestDist = d;
              best = cand;
            }
          }
          if (!best) break;
          hitSet.add(best);
          chain.push({ x: best.x, y: best.y });
          onInstantHit(best, Math.round(baseDmg * Math.pow(0.82, jump)), crit.isCrit);
          currX = best.x;
          currY = best.y;
        }
        this.addLightningArc(chain);
        break;
      }
    }

    // Celestial ship passive: Twin Astral Wing-Bolts on every shot cycle
    if (options?.hasAstralWingBolts) {
      const wingDmg = Math.max(4, Math.round(baseWeaponDmg * damageMult * 0.35));
      this.spawnPlayerBullet(x - 24, y - 8, -45, -860, wingDmg, 'proj_spread', {
        radius: 6,
        scale: 0.78,
        tint: 0xe879f9,
      });
      this.spawnPlayerBullet(x + 24, y - 8, 45, -860, wingDmg, 'proj_spread', {
        radius: 6,
        scale: 0.78,
        tint: 0xe879f9,
      });
    }
  }

  addVisualBeam(x1: number, y1: number, x2: number, y2: number, color: number, width: number, life = 0.12): void {
    this.beams.push({ x1, y1, x2, y2, color, width, life, maxLife: life });
  }

  addLightningArc(anchors: Array<{ x: number; y: number }>): void {
    if (anchors.length < 2) return;
    const points: Array<{ x: number; y: number }> = [anchors[0]];
    for (let i = 0; i < anchors.length - 1; i++) {
      const a = anchors[i];
      const b = anchors[i + 1];
      const steps = 4;
      for (let s = 1; s < steps; s++) {
        const t = s / steps;
        points.push({
          x: Phaser.Math.Linear(a.x, b.x, t) + (Math.random() - 0.5) * 24,
          y: Phaser.Math.Linear(a.y, b.y, t) + (Math.random() - 0.5) * 20,
        });
      }
      points.push(b);
    }
    this.lightningBolts.push({ points, life: 0.14, maxLife: 0.14 });
  }

  update(dt: number, targets: Targetable[], playerX?: number, playerY?: number): void {
    const w = this.scene.scale.width;
    const h = this.scene.scale.height;

    this.playerPool.forEachActive((b) => {
      b.age += dt;
      if (b.homing && b.age > 0.06) {
        let nearest: Targetable | null = null;
        let bestDist = 480;
        for (let i = 0; i < targets.length; i++) {
          const t = targets[i];
          if (!t.active) continue;
          const d = Math.hypot(t.x - b.sprite.x, t.y - b.sprite.y);
          if (d < bestDist) {
            bestDist = d;
            nearest = t;
          }
        }
        if (nearest) {
          const desiredAngle = Math.atan2(nearest.y - b.sprite.y, nearest.x - b.sprite.x);
          const speed = Math.hypot(b.vx, b.vy) || 560;
          const currAngle = Math.atan2(b.vy, b.vx);
          const nextAngle = Phaser.Math.Angle.RotateTo(currAngle, desiredAngle, 6.2 * dt);
          b.vx = Math.cos(nextAngle) * speed;
          b.vy = Math.sin(nextAngle) * speed;
          b.sprite.setRotation(nextAngle + Math.PI / 2);
        }
      }

      b.sprite.x += b.vx * dt;
      b.sprite.y += b.vy * dt;

      if (b.sprite.y < -50 || b.sprite.y > h + 50 || b.sprite.x < -50 || b.sprite.x > w + 50) {
        b.setActive(false).setVisible(false);
      }
    });

    this.enemyPool.forEachActive((b) => {
      b.age += dt;

      // 1. Splitting projectile swell telegraph & split detonation
      if (b.splitAfterSec > 0 && b.splitCount > 0) {
        const remaining = b.splitAfterSec - b.age;
        if (remaining <= 0) {
          const sx = b.sprite.x;
          const sy = b.sprite.y;
          const canSplitInView = sy > 24 && sy < h - 75 && sx > 18 && sx < w - 18;
          const count = b.splitCount;
          const childSpeed = b.splitSpeed;
          const childDmg = b.splitDamage;
          const childTex = b.splitTextureKey;
          const childTint = b.splitTint;
          const childRad = b.splitRadius;
          const spreadRad = b.splitSpreadRad;
          const baseAng =
            b.splitAimed && playerX !== undefined && playerY !== undefined
              ? Math.atan2(playerY - sy, playerX - sx)
              : Math.atan2(b.vy, b.vx);

          b.splitAfterSec = 0;
          b.splitCount = 0;
          b.setActive(false).setVisible(false);

          if (canSplitInView) {
            for (let i = 0; i < count; i++) {
              const ang =
                spreadRad > 0
                  ? baseAng +
                    (count > 1 ? ((i / (count - 1)) - 0.5) * spreadRad : 0)
                  : baseAng + (Math.PI * 2 * i) / count;
              this.spawnEnemyBullet(
                sx,
                sy,
                Math.cos(ang) * childSpeed,
                Math.sin(ang) * childSpeed,
                childDmg,
                childTex,
                childRad,
                childTint,
                { scale: 0.92 }
              );
            }
          }
          return;
        } else if (remaining <= 0.24) {
          const swell = 1 - remaining / 0.24;
          b.sprite.setScale(b.baseScale * (1 + swell * 0.48));
        }
      }

      // 2. Acceleration
      if (b.ax !== 0 || b.ay !== 0) {
        b.vx += b.ax * dt;
        b.vy += b.ay * dt;
      }

      // 3. Fixed-rate angular curve
      if (b.turnRate !== 0 && (b.turnDuration <= 0 || b.age <= b.turnDuration)) {
        const dAng = b.turnRate * dt;
        const cos = Math.cos(dAng);
        const sin = Math.sin(dAng);
        const nvx = b.vx * cos - b.vy * sin;
        const nvy = b.vx * sin + b.vy * cos;
        b.vx = nvx;
        b.vy = nvy;
      }

      // 4. Gentle Homing Seeker steering (fair limited turn rate & duration)
      if (
        b.homingTurnRate > 0 &&
        playerX !== undefined &&
        playerY !== undefined &&
        b.age >= b.homingDelay &&
        b.age <= b.homingDelay + b.homingDuration
      ) {
        const desiredAngle = Math.atan2(playerY - b.sprite.y, playerX - b.sprite.x);
        const speed = Math.hypot(b.vx, b.vy) || 260;
        const currAngle = Math.atan2(b.vy, b.vx);
        const nextAngle = Phaser.Math.Angle.RotateTo(currAngle, desiredAngle, b.homingTurnRate * dt);
        b.vx = Math.cos(nextAngle) * speed;
        b.vy = Math.sin(nextAngle) * speed;
      }

      // 5. Perpendicular sinusoidal wave offset
      let stepVx = b.vx;
      let stepVy = b.vy;
      if (b.waveAmp !== 0) {
        const speed = Math.hypot(b.vx, b.vy) || 1;
        const perpX = -b.vy / speed;
        const perpY = b.vx / speed;
        const osc = Math.cos(b.age * b.waveFreq + b.wavePhase) * b.waveAmp;
        stepVx += perpX * osc;
        stepVy += perpY * osc;
      }

      b.sprite.x += stepVx * dt;
      b.sprite.y += stepVy * dt;

      if (b.spinRate !== 0) {
        b.sprite.rotation += b.spinRate * dt;
      } else if (
        b.homingTurnRate > 0 ||
        b.waveAmp !== 0 ||
        b.turnRate !== 0 ||
        b.ax !== 0 ||
        b.ay !== 0
      ) {
        b.sprite.setRotation(Math.atan2(stepVy, stepVx) + Math.PI / 2);
      }

      if (b.sprite.y < -60 || b.sprite.y > h + 60 || b.sprite.x < -60 || b.sprite.x > w + 60) {
        b.setActive(false).setVisible(false);
      }
    });

    // Render visual beams and lightning
    this.fxGraphics.clear();
    for (let i = this.beams.length - 1; i >= 0; i--) {
      const bm = this.beams[i];
      bm.life -= dt;
      if (bm.life <= 0) {
        this.beams.splice(i, 1);
        continue;
      }
      const alpha = bm.life / bm.maxLife;
      this.fxGraphics.lineStyle(bm.width * alpha, bm.color, 0.4 * alpha);
      this.fxGraphics.lineBetween(bm.x1, bm.y1, bm.x2, bm.y2);
      this.fxGraphics.lineStyle(Math.max(2, bm.width * 0.35 * alpha), 0xffffff, 0.9 * alpha);
      this.fxGraphics.lineBetween(bm.x1, bm.y1, bm.x2, bm.y2);
    }

    for (let i = this.lightningBolts.length - 1; i >= 0; i--) {
      const bolt = this.lightningBolts[i];
      bolt.life -= dt;
      if (bolt.life <= 0) {
        this.lightningBolts.splice(i, 1);
        continue;
      }
      const alpha = bolt.life / bolt.maxLife;
      this.fxGraphics.lineStyle(4.5 * alpha, 0x22d3ee, 0.6 * alpha);
      this.fxGraphics.beginPath();
      this.fxGraphics.moveTo(bolt.points[0].x, bolt.points[0].y);
      for (let p = 1; p < bolt.points.length; p++) {
        this.fxGraphics.lineTo(bolt.points[p].x, bolt.points[p].y);
      }
      this.fxGraphics.strokePath();

      this.fxGraphics.lineStyle(1.8 * alpha, 0xffffff, 0.95 * alpha);
      this.fxGraphics.beginPath();
      this.fxGraphics.moveTo(bolt.points[0].x, bolt.points[0].y);
      for (let p = 1; p < bolt.points.length; p++) {
        this.fxGraphics.lineTo(bolt.points[p].x, bolt.points[p].y);
      }
      this.fxGraphics.strokePath();
    }
  }

  forEachPlayerBullet(cb: (b: PlayerBullet) => void): void {
    this.playerPool.forEachActive(cb);
  }

  forEachEnemyBullet(cb: (b: EnemyBullet) => void): void {
    this.enemyPool.forEachActive(cb);
  }

  clearEnemyBullets(): number {
    let cleared = 0;
    this.enemyPool.forEachActive((b) => {
      b.setActive(false).setVisible(false);
      cleared++;
    });
    return cleared;
  }

  clearAll(): void {
    this.playerPool.releaseAll();
    this.enemyPool.releaseAll();
    this.beams = [];
    this.lightningBolts = [];
    this.fxGraphics.clear();
  }

  destroy(): void {
    this.clearAll();
    this.fxGraphics.destroy();
  }
}
