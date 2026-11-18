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
  damage: number;
  age: number;
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
  missilePowerMult?: number;
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
      50,
      280
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
    tint?: number
  ): void {
    const b = this.enemyPool.acquire();
    if (!b) return;
    b.setActive(true).setVisible(true);
    b.sprite.setTexture(textureKey);
    b.sprite.setPosition(x, y);
    if (tint !== undefined) {
      b.sprite.setTint(tint);
    } else {
      b.sprite.clearTint();
    }
    b.vx = vx;
    b.vy = vy;
    b.damage = damage;
    b.age = 0;
    b.radius = radius;
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
        if (wLevel >= 3) {
          this.spawnPlayerBullet(x - 8, y - 22, -18, -840, Math.round(dmg * 0.62), 'proj_plasma', {
            isCrit: crit.isCrit,
            scale: scaleMult,
          });
          this.spawnPlayerBullet(x + 8, y - 22, 18, -840, Math.round(dmg * 0.62), 'proj_plasma', {
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
        if (wLevel >= 4) {
          this.spawnPlayerBullet(x, y - 24, 0, -1040, Math.round(dmg * 0.7), 'proj_laser', {
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
          wLevel >= 4
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
        const missileMult = options?.missilePowerMult ?? 1;
        const dmg = Math.round(baseWeaponDmg * damageMult * missileMult * crit.mult);
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
        if (wLevel >= 4) {
          this.spawnPlayerBullet(x, y - 22, 0, -560, Math.round(dmg * 0.85), 'proj_missile', {
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
        this.addVisualBeam(x, y - 26, x, 0, crit.isCrit ? 0xfef08a : 0x60a5fa, 12 + wLevel, 0.085);
        for (let i = 0; i < targets.length; i++) {
          const t = targets[i];
          if (!t.active) continue;
          if (Math.abs(t.x - x) <= t.radius + 14 + wLevel * 2 && t.y < y) {
            onInstantHit(t, dmg, crit.isCrit);
          }
        }
        break;
      }
      case 'lightning': {
        const crit = rollCrit();
        const baseDmg = Math.round(baseWeaponDmg * damageMult * crit.mult);
        const maxJumps = (wLevel >= 4 ? 5 : 4) + (options?.extraChainTargets ?? 0);
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
          onInstantHit(best, Math.round(baseDmg * Math.pow(0.86, jump)), crit.isCrit);
          currX = best.x;
          currY = best.y;
        }
        this.addLightningArc(chain);
        break;
      }
    }

    // Celestial ship passive: Twin Astral Wing-Bolts on every shot cycle
    if (options?.hasAstralWingBolts) {
      const wingDmg = Math.max(6, Math.round(baseWeaponDmg * damageMult * 0.35));
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

  update(dt: number, targets: Targetable[]): void {
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
      b.sprite.x += b.vx * dt;
      b.sprite.y += b.vy * dt;
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
