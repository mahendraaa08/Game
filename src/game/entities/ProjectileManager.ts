import Phaser from 'phaser';
import {
  getEffectiveBeamTickIntervalMs,
  getWeaponDamageAtLevel,
  WeaponId,
  WEAPONS,
} from '../config/WeaponConfig';
import {
  getWeaponEvolutionStage,
  WEAPON_RUNTIME_TUNING,
} from '../config/WeaponEvolutionConfig';
import { ObjectPool } from '../utils/ObjectPool';
import { DamageSource } from '../systems/PassiveSystem';
import { allocateEnemyAttackId, Targetable } from './Targetable';

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
  trailColor: number;
  trailWidth: number;
  trailLength: number;
  splashRadius: number;
  splashDamageRatio: number;
  splashColor: number;
  burstShardCount: number;
  burstShardDamage: number;
  impactScale: number;
  impactColor: number;
  isHeavyMissile: boolean;
  ignoreTarget: Targetable | null;
  source: DamageSource;
  firingActionId: number;
  cloneActionId: number;
  countsForFiringAction: boolean;
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
  attackId: number;
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
  branches: Array<Array<{ x: number; y: number }>>;
  life: number;
  maxLife: number;
  thickness: number;
  color: number;
}

interface BeamRampEntry {
  stacks: number;
  lastHitSec: number;
}

interface ContinuousBeamState {
  active: boolean;
  x: number;
  y: number;
  stage: 0 | 1 | 2;
  tickTimerMs: number;
  actionCycleAccumMs: number;
  currentBeamActionId: number;
  maxRampVisual: number;
  contactPoints: Array<{ x: number; y: number; intensity: number }>;
  ramps: Map<Targetable, BeamRampEntry>;
}

interface CloneBeamState {
  active: boolean;
  x: number;
  y: number;
  endX: number;
  endY: number;
  stage: 0 | 1 | 2;
  tickTimerMs: number;
  cycleElapsedMs: number;
  contactPoints: Array<{ x: number; y: number }>;
  ramps: Map<Targetable, BeamRampEntry>;
}

interface BeamDroneState {
  sprite: Phaser.GameObjects.Sprite;
  active: boolean;
  remainingMs: number;
  cooldownMs: number;
  checkTimerMs: number;
  fireTimerMs: number;
  lockedTarget: Targetable | null;
  beamTargetX: number;
  beamTargetY: number;
  beamVisible: boolean;
  age: number;
}

export interface WeaponFireOptions {
  weaponLevel?: number;
  source?: DamageSource;
  firingActionId?: number;
  cloneActionId?: number;
  countsForFiringAction?: boolean;
  damageScale?: number;
  aimAngleRad?: number;
  plasmaBurstProcReady?: boolean;
  onPlasmaBurstTriggered?: () => void;
  heavyMissileProcReady?: boolean;
  onHeavyMissileTriggered?: () => void;
  onLightningStunApplied?: (target: Targetable) => void;
  rollCrit?: () => { isCrit: boolean; mult: number };
}

export interface BeamHitMeta {
  source: DamageSource;
  firingActionId: number;
  countsForFiringAction: boolean;
}

export interface BeamFrameContext {
  firing: boolean;
  x: number;
  y: number;
  weaponLevel: number;
  damageMult: number;
  totalFireRateMult: number;
  targets: Targetable[];
  acquireBeamAction?: (
    dtMs: number,
    effectiveFireRateMult: number
  ) => { firingActionId: number; actionDamageMult: number; isCycleStart: boolean };
  onInstantHit: (
    target: Targetable,
    dmg: number,
    isCrit?: boolean,
    hitMeta?: BeamHitMeta
  ) => void;
  rollCrit: () => { isCrit: boolean; mult: number };
}

export interface CloneBeamFrameContext {
  firing: boolean;
  x: number;
  y: number;
  aimX: number;
  aimY: number;
  weaponLevel: number;
  damageMult: number;
  totalFireRateMult: number;
  targets: Targetable[];
  acquireCloneAction: (
    dtMs: number,
    effectivePlayerFireRate: number
  ) => { cloneActionId: number; countsForFiringAction: boolean };
  onCloneInstantHit: (
    target: Targetable,
    dmg: number,
    cloneActionId: number,
    countsForFiringAction: boolean
  ) => void;
}

export class ProjectileManager {
  private scene: Phaser.Scene;
  private playerPool: ObjectPool<PlayerBullet>;
  private enemyPool: ObjectPool<EnemyBullet>;
  private fxGraphics: Phaser.GameObjects.Graphics;
  private beams: VisualBeam[] = [];
  private lightningBolts: LightningBolt[] = [];
  private simTimeSec = 0;

  private continuousBeam: ContinuousBeamState;
  private cloneBeam: CloneBeamState;
  private beamDrone: BeamDroneState;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.fxGraphics = scene.add.graphics().setDepth(14);

    this.continuousBeam = {
      active: false,
      x: 0,
      y: 0,
      stage: 0,
      tickTimerMs: 0,
      actionCycleAccumMs: 0,
      currentBeamActionId: 0,
      maxRampVisual: 0,
      contactPoints: [],
      ramps: new Map<Targetable, BeamRampEntry>(),
    };

    this.cloneBeam = {
      active: false,
      x: 0,
      y: 0,
      endX: 0,
      endY: 0,
      stage: 0,
      tickTimerMs: 0,
      cycleElapsedMs: 0,
      contactPoints: [],
      ramps: new Map<Targetable, BeamRampEntry>(),
    };

    const droneSprite = scene.add
      .sprite(-200, -200, 'drone_beam_evo')
      .setDepth(11)
      .setVisible(false)
      .setActive(false);

    this.beamDrone = {
      sprite: droneSprite,
      active: false,
      remainingMs: 0,
      cooldownMs: 0,
      checkTimerMs: 0,
      fireTimerMs: 0,
      lockedTarget: null,
      beamTargetX: 0,
      beamTargetY: 0,
      beamVisible: false,
      age: 0,
    };

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
          trailColor: 0,
          trailWidth: 2.5,
          trailLength: 0,
          splashRadius: 0,
          splashDamageRatio: 0,
          splashColor: 0xf59e0b,
          burstShardCount: 0,
          burstShardDamage: 0,
          impactScale: 1,
          impactColor: 0,
          isHeavyMissile: false,
          ignoreTarget: null,
          source: 'player_weapon',
          firingActionId: 0,
          cloneActionId: 0,
          countsForFiringAction: true,
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
      300
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
          attackId: 0,
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
      trailColor?: number;
      trailWidth?: number;
      trailLength?: number;
      splashRadius?: number;
      splashDamageRatio?: number;
      splashColor?: number;
      burstShardCount?: number;
      burstShardDamage?: number;
      impactScale?: number;
      impactColor?: number;
      isHeavyMissile?: boolean;
      ignoreTarget?: Targetable | null;
      source?: DamageSource;
      firingActionId?: number;
      cloneActionId?: number;
      countsForFiringAction?: boolean;
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
    b.trailColor = options?.trailColor ?? 0;
    b.trailWidth = options?.trailWidth ?? 2.5;
    b.trailLength = options?.trailLength ?? 0;
    b.splashRadius = options?.splashRadius ?? 0;
    b.splashDamageRatio = options?.splashDamageRatio ?? 0;
    b.splashColor = options?.splashColor ?? 0xf59e0b;
    b.burstShardCount = options?.burstShardCount ?? 0;
    b.burstShardDamage = options?.burstShardDamage ?? 0;
    b.impactScale = options?.impactScale ?? 1;
    b.impactColor = options?.impactColor ?? 0;
    b.isHeavyMissile = options?.isHeavyMissile ?? false;
    b.ignoreTarget = options?.ignoreTarget ?? null;
    b.source = options?.source ?? 'player_weapon';
    b.firingActionId = options?.firingActionId ?? 0;
    b.cloneActionId = options?.cloneActionId ?? 0;
    b.countsForFiringAction = options?.countsForFiringAction ?? true;
  }

  spawnPlasmaBurstShards(
    x: number,
    y: number,
    count: number,
    shardDamage: number,
    isCrit: boolean,
    ignoreTarget: Targetable | null,
    source: DamageSource = 'player_weapon',
    firingActionId = 0,
    cloneActionId = 0
  ): void {
    const speed = WEAPON_RUNTIME_TUNING.plasma.evo2MiniBoltSpeed;
    const rotOff = Math.random() * Math.PI * 0.35;
    for (let i = 0; i < count; i++) {
      const ang = (Math.PI * 2 * i) / count + rotOff;
      this.spawnPlayerBullet(
        x + Math.cos(ang) * 10,
        y + Math.sin(ang) * 10,
        Math.cos(ang) * speed,
        Math.sin(ang) * speed,
        shardDamage,
        'proj_plasma_shard',
        {
          radius: 7,
          scale: 1,
          isCrit,
          trailColor: 0x7dd3fc,
          trailWidth: 2.6,
          trailLength: 16,
          impactScale: 0.9,
          impactColor: 0x38bdf8,
          ignoreTarget,
          source,
          firingActionId,
          cloneActionId,
          countsForFiringAction: false,
        }
      );
    }
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
      attackId?: number;
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
    b.attackId = options?.attackId ?? allocateEnemyAttackId();
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
    const stage = getWeaponEvolutionStage(wLevel);
    const baseWeaponDmg = getWeaponDamageAtLevel(WEAPONS[weapon], wLevel);
    const dmgScale = options?.damageScale ?? 1;
    const source: DamageSource = options?.source ?? 'player_weapon';
    const firingActionId = options?.firingActionId ?? 0;
    const cloneActionId = options?.cloneActionId ?? 0;
    const countsForFiringAction = options?.countsForFiringAction ?? true;
    const aimAngle = options?.aimAngleRad ?? -Math.PI / 2;
    const dirX = Math.cos(aimAngle);
    const dirY = Math.sin(aimAngle);
    const perpX = -dirY;
    const perpY = dirX;
    const rollCrit = options?.rollCrit ?? (() => ({ isCrit: false, mult: 1 }));
    const bulletTint = source === 'clone' ? 0xa5b4fc : undefined;

    switch (weapon) {
      case 'plasma': {
        const crit = rollCrit();
        const dmg = Math.max(1, Math.round(baseWeaponDmg * damageMult * dmgScale * crit.mult));
        const cfg = WEAPON_RUNTIME_TUNING.plasma;

        // Evolution II (Lv20): Plasma Burst special sphere proc
        if (
          stage === 2 &&
          options?.plasmaBurstProcReady &&
          Math.random() < cfg.evo2BurstProcChance
        ) {
          options.onPlasmaBurstTriggered?.();
          const burstDmg = Math.max(1, Math.round(dmg * cfg.evo2BurstMainDamageMult));
          const shardDmg = Math.max(2, Math.round(dmg * cfg.evo2MiniBoltDamageRatio));
          this.spawnPlayerBullet(
            x + dirX * 26,
            y + dirY * 26,
            dirX * cfg.evo1Speed,
            dirY * cfg.evo1Speed,
            burstDmg,
            'proj_plasma_burst',
            {
              isCrit: crit.isCrit,
              radius: 13,
              scale: source === 'clone' ? 0.85 : 1,
              tint: bulletTint,
              trailColor: source === 'clone' ? 0x818cf8 : 0x7dd3fc,
              trailWidth: 5.5,
              trailLength: 34,
              splashRadius: cfg.evo2BurstSplashRadius,
              splashDamageRatio: cfg.evo2BurstSplashDamageRatio,
              splashColor: 0x38bdf8,
              burstShardCount: cfg.evo2MiniBoltCount,
              burstShardDamage: shardDmg,
              impactScale: 1.55,
              impactColor: 0x7dd3fc,
              source,
              firingActionId,
              cloneActionId,
              countsForFiringAction,
            }
          );
        } else if (stage >= 1) {
          // Evolution I (Lv12–19) & Lv20 standard bolts: Enhanced Plasma
          this.spawnPlayerBullet(
            x + dirX * 24,
            y + dirY * 24,
            dirX * cfg.evo1Speed,
            dirY * cfg.evo1Speed,
            dmg,
            'proj_plasma_evo1',
            {
              isCrit: crit.isCrit,
              radius: 10,
              scale: source === 'clone' ? 0.85 : 1,
              tint: bulletTint,
              trailColor: source === 'clone' ? 0x818cf8 : 0x38bdf8,
              trailWidth: 4.2,
              trailLength: 26,
              impactScale: 1.25,
              impactColor: 0x38bdf8,
              source,
              firingActionId,
              cloneActionId,
              countsForFiringAction,
            }
          );
        } else {
          // Base Form (Lv1–11): single balanced Plasma Bolt
          this.spawnPlayerBullet(
            x + dirX * 24,
            y + dirY * 24,
            dirX * cfg.baseSpeed,
            dirY * cfg.baseSpeed,
            dmg,
            'proj_plasma',
            {
              isCrit: crit.isCrit,
              radius: 8,
              scale: source === 'clone' ? 0.85 : 1,
              tint: bulletTint,
              trailColor: source === 'clone' ? 0x6366f1 : 0x0284c7,
              trailWidth: 2.4,
              trailLength: 14,
              impactColor: 0x38bdf8,
              source,
              firingActionId,
              cloneActionId,
              countsForFiringAction,
            }
          );
        }
        break;
      }

      case 'dual_laser': {
        const crit = rollCrit();
        const dmg = Math.max(1, Math.round(baseWeaponDmg * damageMult * dmgScale * crit.mult));
        const cfg = WEAPON_RUNTIME_TUNING.dual_laser;
        const speed = stage >= 1 ? cfg.evo1Speed : cfg.baseSpeed;
        const tex = stage >= 1 ? 'proj_laser_evo1' : 'proj_laser';
        const trailLen = stage >= 1 ? 28 : 16;
        const trailW = stage >= 1 ? 3.5 : 2.2;
        const impactScale = stage >= 1 ? 1.22 : 0.95;
        const off = source === 'clone' ? cfg.wingOffsetPx * 0.8 : cfg.wingOffsetPx;

        this.spawnPlayerBullet(
          x - perpX * off + dirX * 16,
          y - perpY * off + dirY * 16,
          dirX * speed,
          dirY * speed,
          dmg,
          tex,
          {
            isCrit: crit.isCrit,
            radius: stage >= 1 ? 9 : 8,
            scale: source === 'clone' ? 0.85 : 1,
            tint: bulletTint,
            trailColor: source === 'clone' ? 0x818cf8 : stage >= 1 ? 0x67e8f9 : 0x22d3ee,
            trailWidth: trailW,
            trailLength: trailLen,
            impactScale,
            impactColor: 0x22d3ee,
            source,
            firingActionId,
            cloneActionId,
            countsForFiringAction,
          }
        );
        this.spawnPlayerBullet(
          x + perpX * off + dirX * 16,
          y + perpY * off + dirY * 16,
          dirX * speed,
          dirY * speed,
          dmg,
          tex,
          {
            isCrit: crit.isCrit,
            radius: stage >= 1 ? 9 : 8,
            scale: source === 'clone' ? 0.85 : 1,
            tint: bulletTint,
            trailColor: source === 'clone' ? 0x818cf8 : stage >= 1 ? 0x67e8f9 : 0x22d3ee,
            trailWidth: trailW,
            trailLength: trailLen,
            impactScale,
            impactColor: 0x22d3ee,
            source,
            firingActionId,
            cloneActionId,
            countsForFiringAction,
          }
        );
        break;
      }

      case 'spread': {
        const crit = rollCrit();
        const cfg = WEAPON_RUNTIME_TUNING.spread;
        const rawDmg = Math.max(1, Math.round(baseWeaponDmg * damageMult * dmgScale * crit.mult));
        const boltDmg =
          stage === 2 ? Math.max(2, Math.round(rawDmg * cfg.evo2PerBoltDamageMult)) : rawDmg;
        const angles =
          stage === 2
            ? cfg.evo2AnglesRad
            : stage === 1
            ? cfg.evo1AnglesRad
            : cfg.baseAnglesRad;
        const speed =
          stage === 2 ? cfg.evo2Speed : stage === 1 ? cfg.evo1Speed : cfg.baseSpeed;
        const tex = stage >= 1 ? 'proj_spread_evo1' : 'proj_spread';

        for (let i = 0; i < angles.length; i++) {
          const shotAngle = aimAngle + angles[i];
          this.spawnPlayerBullet(
            x + dirX * 18,
            y + dirY * 18,
            Math.cos(shotAngle) * speed,
            Math.sin(shotAngle) * speed,
            boltDmg,
            tex,
            {
              radius: stage >= 1 ? 8.5 : 7,
              isCrit: crit.isCrit,
              scale: source === 'clone' ? 0.85 : 1,
              tint: bulletTint,
              trailColor: source === 'clone' ? 0x818cf8 : stage >= 1 ? 0xc084fc : 0xa855f7,
              trailWidth: stage >= 1 ? 3.4 : 2.1,
              trailLength: stage >= 1 ? 22 : 12,
              impactScale: stage >= 1 ? 1.25 : 0.95,
              impactColor: 0xc084fc,
              source,
              firingActionId,
              cloneActionId,
              countsForFiringAction,
            }
          );
        }
        break;
      }

      case 'homing': {
        const crit = rollCrit();
        const dmg = Math.max(1, Math.round(baseWeaponDmg * damageMult * dmgScale * crit.mult));
        const cfg = WEAPON_RUNTIME_TUNING.homing;
        const speed = stage >= 1 ? cfg.evo1Speed : cfg.baseSpeed;
        const tex = stage >= 1 ? 'proj_missile_evo1' : 'proj_missile';
        const splashRad = stage >= 1 ? cfg.evo1SplashRadiusPx : cfg.baseSplashRadiusPx;
        const splashRatio = stage >= 1 ? cfg.evo1SplashDamageRatio : cfg.baseSplashDamageRatio;
        const leftAng = aimAngle - 0.14;
        const rightAng = aimAngle + 0.14;

        this.spawnPlayerBullet(
          x - perpX * 16 + dirX * 12,
          y - perpY * 16 + dirY * 12,
          Math.cos(leftAng) * speed,
          Math.sin(leftAng) * speed,
          dmg,
          tex,
          {
            homing: true,
            radius: stage >= 1 ? 10 : 9,
            scale: source === 'clone' ? 0.85 : 1,
            tint: bulletTint,
            isCrit: crit.isCrit,
            trailColor: source === 'clone' ? 0x818cf8 : stage >= 1 ? 0xfde047 : 0xf59e0b,
            trailWidth: stage >= 1 ? 4.2 : 2.8,
            trailLength: stage >= 1 ? 28 : 18,
            splashRadius: splashRad,
            splashDamageRatio: splashRatio,
            splashColor: stage >= 1 ? 0xfbbf24 : 0xf59e0b,
            impactScale: stage >= 1 ? 1.35 : 1.05,
            impactColor: 0xf59e0b,
            source,
            firingActionId,
            cloneActionId,
            countsForFiringAction,
          }
        );
        this.spawnPlayerBullet(
          x + perpX * 16 + dirX * 12,
          y + perpY * 16 + dirY * 12,
          Math.cos(rightAng) * speed,
          Math.sin(rightAng) * speed,
          dmg,
          tex,
          {
            homing: true,
            radius: stage >= 1 ? 10 : 9,
            scale: source === 'clone' ? 0.85 : 1,
            tint: bulletTint,
            isCrit: crit.isCrit,
            trailColor: source === 'clone' ? 0x818cf8 : stage >= 1 ? 0xfde047 : 0xf59e0b,
            trailWidth: stage >= 1 ? 4.2 : 2.8,
            trailLength: stage >= 1 ? 28 : 18,
            splashRadius: splashRad,
            splashDamageRatio: splashRatio,
            splashColor: stage >= 1 ? 0xfbbf24 : 0xf59e0b,
            impactScale: stage >= 1 ? 1.35 : 1.05,
            impactColor: 0xf59e0b,
            source,
            firingActionId,
            cloneActionId,
            countsForFiringAction,
          }
        );

        // Evolution II (Lv20): Heavy Homing Missile proc
        if (
          stage === 2 &&
          options?.heavyMissileProcReady &&
          Math.random() < cfg.evo2HeavyProcChance
        ) {
          options.onHeavyMissileTriggered?.();
          const heavyDmg = Math.max(1, Math.round(dmg * cfg.evo2HeavyDamageMult));
          this.spawnPlayerBullet(
            x + dirX * 24,
            y + dirY * 24,
            dirX * cfg.evo2HeavySpeed,
            dirY * cfg.evo2HeavySpeed,
            heavyDmg,
            'proj_missile_heavy',
            {
              homing: true,
              radius: 14,
              scale: source === 'clone' ? 0.85 : 1,
              tint: bulletTint,
              isCrit: crit.isCrit,
              trailColor: source === 'clone' ? 0x818cf8 : 0xf97316,
              trailWidth: 6,
              trailLength: 38,
              splashRadius: cfg.evo2HeavySplashRadiusPx,
              splashDamageRatio: cfg.evo2HeavySplashDamageRatio,
              splashColor: 0xf97316,
              impactScale: 1.8,
              impactColor: 0xf97316,
              isHeavyMissile: true,
              source,
              firingActionId,
              cloneActionId,
              countsForFiringAction,
            }
          );
        }
        break;
      }

      case 'beam': {
        // Handled continuously via updateContinuousBeam() / updateCloneContinuousBeam()
        break;
      }

      case 'lightning': {
        const crit = rollCrit();
        const cfg = WEAPON_RUNTIME_TUNING.lightning;
        const baseDmg = Math.max(1, Math.round(baseWeaponDmg * damageMult * dmgScale * crit.mult));
        const maxJumps = stage >= 1 ? cfg.evo1MaxJumps : cfg.baseMaxJumps;
        const initRange = stage >= 1 ? cfg.evo1InitialRangePx : cfg.baseInitialRangePx;
        const chainRange = stage >= 1 ? cfg.evo1ChainRangePx : cfg.baseChainRangePx;
        const decay = stage >= 1 ? cfg.evo1BounceDecay : cfg.baseBounceDecay;

        const sorted = targets
          .filter((t) => t.active && !t.entering && (source === 'clone' || t.y < y + 50))
          .sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y));

        if (sorted.length === 0) {
          this.addLightningArc(
            [
              { x, y: y - 24 },
              { x: x + (Math.random() - 0.5) * 40, y: Math.max(20, y - 280) },
            ],
            stage >= 1,
            false,
            source === 'clone' ? 0x818cf8 : undefined
          );
          break;
        }

        const chain: Array<{ x: number; y: number }> = [{ x, y: y - 24 }];
        const hitSet = new Set<Targetable>();
        let currX = x;
        let currY = y - 24;

        for (let jump = 0; jump < maxJumps; jump++) {
          let best: Targetable | null = null;
          let bestDist = jump === 0 ? initRange : chainRange;
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
          onInstantHit(best, Math.max(1, Math.round(baseDmg * Math.pow(decay, jump))), crit.isCrit);

          // Evolution II (Lv20): Paralyzing Lightning stun proc
          if (stage === 2 && best.active) {
            const stunChance = jump === 0 ? cfg.evo2PrimaryStunChance : cfg.evo2ChainStunChance;
            if (Math.random() < stunChance && best.applyParalyze?.(cfg.evo2StunDurationSec)) {
              options?.onLightningStunApplied?.(best);
            }
          }

          currX = best.x;
          currY = best.y;
        }
        this.addLightningArc(
          chain,
          stage >= 1,
          stage === 2,
          source === 'clone' ? 0x818cf8 : undefined
        );
        break;
      }
    }
  }

  /**
   * Fires a single Dual Laser Evolution II Central Rapid Barrage bonus bolt
   */
  fireDualCentralBarrageBolt(
    x: number,
    y: number,
    weaponLevel: number,
    damageMult: number,
    rollCrit: () => { isCrit: boolean; mult: number },
    options?: {
      source?: DamageSource;
      firingActionId?: number;
      cloneActionId?: number;
      countsForFiringAction?: boolean;
      damageScale?: number;
      aimAngleRad?: number;
    }
  ): void {
    const cfg = WEAPON_RUNTIME_TUNING.dual_laser;
    const baseDmg = getWeaponDamageAtLevel(WEAPONS.dual_laser, weaponLevel);
    const crit = rollCrit();
    const dmgScale = options?.damageScale ?? 1;
    const source = options?.source ?? 'player_weapon';
    const aimAngle = options?.aimAngleRad ?? -Math.PI / 2;
    const dirX = Math.cos(aimAngle);
    const dirY = Math.sin(aimAngle);
    const dmg = Math.max(
      2,
      Math.round(baseDmg * damageMult * dmgScale * cfg.evo2BarrageBoltDamageRatio * crit.mult)
    );
    this.spawnPlayerBullet(
      x + dirX * 28,
      y + dirY * 28,
      dirX * cfg.evo2BarrageBoltSpeed,
      dirY * cfg.evo2BarrageBoltSpeed,
      dmg,
      'proj_laser_barrage',
      {
        isCrit: crit.isCrit,
        radius: 10,
        scale: source === 'clone' ? 0.85 : 1,
        tint: source === 'clone' ? 0xa5b4fc : undefined,
        trailColor: source === 'clone' ? 0x818cf8 : 0xa5f3fc,
        trailWidth: 4.5,
        trailLength: 34,
        impactScale: 1.35,
        impactColor: 0x67e8f9,
        source,
        firingActionId: options?.firingActionId ?? 0,
        cloneActionId: options?.cloneActionId ?? 0,
        countsForFiringAction: options?.countsForFiringAction ?? false,
      }
    );
  }

  /**
   * Drives Continuous Energy Beam rendering, target damage accumulation, Fire Rate tick scaling,
   * and Evolution II Autonomous Laser Drone.
   */
  updateContinuousBeam(dt: number, ctx: BeamFrameContext): void {
    const dtMs = dt * 1000;
    const cfg = WEAPON_RUNTIME_TUNING.beam;
    const stage = getWeaponEvolutionStage(ctx.weaponLevel);

    // Prune expired or dead target ramp entries
    for (const [target, entry] of this.continuousBeam.ramps.entries()) {
      if (!target.active || this.simTimeSec - entry.lastHitSec > cfg.rampResetGraceSec) {
        this.continuousBeam.ramps.delete(target);
      }
    }

    this.continuousBeam.contactPoints.length = 0;

    if (!ctx.firing) {
      this.continuousBeam.active = false;
      this.continuousBeam.tickTimerMs = 0;
      this.continuousBeam.actionCycleAccumMs = 0;
      this.continuousBeam.currentBeamActionId = 0;
      this.continuousBeam.maxRampVisual = 0;
      this.updateBeamDrone(dt, dtMs, ctx, false);
      return;
    }

    this.continuousBeam.active = true;
    this.continuousBeam.x = ctx.x;
    this.continuousBeam.y = ctx.y - 26;
    this.continuousBeam.stage = stage;
    this.continuousBeam.actionCycleAccumMs += dtMs;

    const halfSpan = stage >= 1 ? cfg.evo1HalfSpanPx : cfg.baseHalfSpanPx;
    const maxRamp = stage >= 1 ? cfg.evo1MaxRampBonus : cfg.baseMaxRampBonus;
    const rampStep = stage >= 1 ? cfg.evo1RampPerTick : cfg.baseRampPerTick;

    // Gather live targets currently inside the continuous beam column
    let highestRampRatio = 0;
    const hitTargets: Targetable[] = [];
    for (let i = 0; i < ctx.targets.length; i++) {
      const t = ctx.targets[i];
      if (!t.active) continue;
      if (Math.abs(t.x - ctx.x) <= t.radius + halfSpan && t.y < ctx.y) {
        hitTargets.push(t);
        const entry = this.continuousBeam.ramps.get(t);
        const ratio = entry ? Math.min(1, entry.stacks / maxRamp) : 0;
        if (ratio > highestRampRatio) highestRampRatio = ratio;
        this.continuousBeam.contactPoints.push({
          x: Phaser.Math.Clamp(ctx.x, t.x - t.radius * 0.5, t.x + t.radius * 0.5),
          y: t.y + t.radius * 0.35,
          intensity: 0.35 + ratio * 0.65,
        });
      }
    }
    this.continuousBeam.maxRampVisual = highestRampRatio;

    // Tick damage smoothly based on single authoritative Fire Rate interval formula
    this.continuousBeam.tickTimerMs -= dtMs;
    if (this.continuousBeam.tickTimerMs <= 0) {
      const intervalMs = getEffectiveBeamTickIntervalMs(ctx.weaponLevel, ctx.totalFireRateMult);
      this.continuousBeam.tickTimerMs = intervalMs;

      // Only promote a firing action when the beam actually contacts >= 1 valid target
      let firingActionId = this.continuousBeam.currentBeamActionId;
      let actionDamageMult = 1;
      let countsForFiringAction = false;

      if (hitTargets.length > 0 && ctx.acquireBeamAction) {
        const promo = ctx.acquireBeamAction(
          this.continuousBeam.actionCycleAccumMs,
          ctx.totalFireRateMult
        );
        this.continuousBeam.actionCycleAccumMs = 0;
        firingActionId = promo.firingActionId;
        this.continuousBeam.currentBeamActionId = firingActionId;
        actionDamageMult = promo.isCycleStart ? promo.actionDamageMult : 1;
        countsForFiringAction = promo.isCycleStart;
      }

      const baseTickDmg = getWeaponDamageAtLevel(WEAPONS.beam, ctx.weaponLevel);
      for (let i = 0; i < hitTargets.length; i++) {
        const t = hitTargets[i];
        let entry = this.continuousBeam.ramps.get(t);
        if (!entry) {
          entry = { stacks: 0, lastHitSec: this.simTimeSec };
          this.continuousBeam.ramps.set(t, entry);
        } else {
          entry.lastHitSec = this.simTimeSec;
        }

        const crit = ctx.rollCrit();
        const rampMult = 1 + entry.stacks;
        const dmg = Math.max(
          1,
          Math.round(baseTickDmg * ctx.damageMult * actionDamageMult * rampMult * crit.mult)
        );
        ctx.onInstantHit(t, dmg, crit.isCrit, {
          source: 'player_weapon',
          firingActionId,
          countsForFiringAction,
        });

        if (t.active) {
          entry.stacks = Math.min(maxRamp, entry.stacks + rampStep);
        } else {
          this.continuousBeam.ramps.delete(t);
        }
      }
    }

    this.updateBeamDrone(dt, dtMs, ctx, stage === 2);
  }

  /**
   * Quantum Clone Beam Replication:
   * - Fires at exact 50% of Player's Beam tick rate (2x intervalMs)
   * - Deals 20% of normal Beam tick damage (no Crit)
   * - Emits Clone firing action at paced cycle windows rather than every tick
   */
  updateCloneContinuousBeam(dt: number, ctx: CloneBeamFrameContext): void {
    const dtMs = dt * 1000;
    const cfg = WEAPON_RUNTIME_TUNING.beam;
    const stage = getWeaponEvolutionStage(ctx.weaponLevel);

    for (const [target, entry] of this.cloneBeam.ramps.entries()) {
      if (!target.active || this.simTimeSec - entry.lastHitSec > cfg.rampResetGraceSec) {
        this.cloneBeam.ramps.delete(target);
      }
    }

    this.cloneBeam.contactPoints.length = 0;

    if (!ctx.firing) {
      this.cloneBeam.active = false;
      this.cloneBeam.tickTimerMs = 0;
      this.cloneBeam.cycleElapsedMs = 0;
      return;
    }

    const dx = ctx.aimX - ctx.x;
    const dy = ctx.aimY - (ctx.y - 22);
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len;
    const uy = dy / len;
    const rayLen = 960;

    this.cloneBeam.active = true;
    this.cloneBeam.x = ctx.x;
    this.cloneBeam.y = ctx.y - 22;
    this.cloneBeam.endX = this.cloneBeam.x + ux * rayLen;
    this.cloneBeam.endY = this.cloneBeam.y + uy * rayLen;
    this.cloneBeam.stage = stage;
    this.cloneBeam.cycleElapsedMs += dtMs;

    const halfSpan = (stage >= 1 ? cfg.evo1HalfSpanPx : cfg.baseHalfSpanPx) * 0.85;
    const maxRamp = stage >= 1 ? cfg.evo1MaxRampBonus : cfg.baseMaxRampBonus;
    const rampStep = stage >= 1 ? cfg.evo1RampPerTick : cfg.baseRampPerTick;

    const hitTargets: Targetable[] = [];
    for (let i = 0; i < ctx.targets.length; i++) {
      const t = ctx.targets[i];
      if (!t.active || t.entering) continue;
      const px = t.x - this.cloneBeam.x;
      const py = t.y - this.cloneBeam.y;
      const proj = px * ux + py * uy;
      if (proj < -t.radius || proj > rayLen) continue;
      const perp = Math.abs(px * uy - py * ux);
      if (perp <= t.radius + halfSpan) {
        hitTargets.push(t);
        this.cloneBeam.contactPoints.push({
          x: this.cloneBeam.x + ux * Math.max(0, proj),
          y: this.cloneBeam.y + uy * Math.max(0, proj),
        });
      }
    }

    this.cloneBeam.tickTimerMs -= dtMs;
    if (this.cloneBeam.tickTimerMs <= 0) {
      const playerIntervalMs = getEffectiveBeamTickIntervalMs(ctx.weaponLevel, ctx.totalFireRateMult);
      // 50% Fire Rate -> 2x interval
      this.cloneBeam.tickTimerMs = playerIntervalMs * 2;

      if (hitTargets.length > 0) {
        const promo = ctx.acquireCloneAction(this.cloneBeam.cycleElapsedMs, ctx.totalFireRateMult);
        this.cloneBeam.cycleElapsedMs = 0;
        const baseTickDmg = getWeaponDamageAtLevel(WEAPONS.beam, ctx.weaponLevel);

        for (let i = 0; i < hitTargets.length; i++) {
          const t = hitTargets[i];
          let entry = this.cloneBeam.ramps.get(t);
          if (!entry) {
            entry = { stacks: 0, lastHitSec: this.simTimeSec };
            this.cloneBeam.ramps.set(t, entry);
          } else {
            entry.lastHitSec = this.simTimeSec;
          }

          const rampMult = 1 + entry.stacks;
          const dmg = Math.max(1, Math.round(baseTickDmg * ctx.damageMult * rampMult * 0.2));
          ctx.onCloneInstantHit(t, dmg, promo.cloneActionId, promo.countsForFiringAction);

          if (t.active) {
            entry.stacks = Math.min(maxRamp, entry.stacks + rampStep);
          } else {
            this.cloneBeam.ramps.delete(t);
          }
        }
      }
    }
  }

  private updateBeamDrone(
    dt: number,
    dtMs: number,
    ctx: BeamFrameContext,
    evo2Enabled: boolean
  ): void {
    const cfg = WEAPON_RUNTIME_TUNING.beam;
    const drone = this.beamDrone;
    drone.cooldownMs = Math.max(0, drone.cooldownMs - dtMs);

    // If player switches off Beam or is no longer on Evo II, cleanly vanish
    if (!evo2Enabled || !ctx.firing) {
      if (drone.active) {
        this.deactivateBeamDrone();
      }
      return;
    }

    // Proc check to summon Autonomous Laser Drone when off cooldown
    if (!drone.active && drone.cooldownMs <= 0) {
      drone.checkTimerMs -= dtMs;
      if (drone.checkTimerMs <= 0) {
        drone.checkTimerMs = cfg.evo2DroneCheckIntervalMs;
        if (Math.random() < cfg.evo2DroneProcChance) {
          this.activateBeamDrone(ctx.x - 52, ctx.y - 10);
        }
      }
    }

    if (!drone.active) return;

    drone.age += dt;
    drone.remainingMs -= dtMs;
    if (drone.remainingMs <= 0) {
      this.deactivateBeamDrone();
      return;
    }

    // Smoothly follow beside player hull
    const followX = Math.max(26, ctx.x - 52);
    const followY = ctx.y - 10 + Math.sin(drone.age * 4.5) * 5;
    const lerp = 1 - Math.exp(-12 * dt);
    drone.sprite.x = Phaser.Math.Linear(drone.sprite.x, followX, lerp);
    drone.sprite.y = Phaser.Math.Linear(drone.sprite.y, followY, lerp);

    // Fade in/out alpha smoothly near start and expiry
    if (drone.remainingMs < 450) {
      drone.sprite.setAlpha(Math.max(0, drone.remainingMs / 450));
    } else if (drone.age < 0.25) {
      drone.sprite.setAlpha(Math.min(1, drone.age / 0.25));
    } else {
      drone.sprite.setAlpha(1);
    }

    // Nearest-target lock with hysteresis to avoid rapid target thrashing
    const sx = drone.sprite.x;
    const sy = drone.sprite.y;
    const maxRange = cfg.evo2DroneRangePx;
    const dropRange = maxRange + cfg.evo2DroneHysteresisPx;

    let locked = drone.lockedTarget;
    let lockedDist = Infinity;
    if (locked && locked.active) {
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
    for (let i = 0; i < ctx.targets.length; i++) {
      const cand = ctx.targets[i];
      if (!cand.active) continue;
      const d = Math.hypot(cand.x - sx, cand.y - sy);
      if (d < nearestDist) {
        nearestDist = d;
        nearest = cand;
      }
    }

    if (!locked) {
      locked = nearest;
    } else if (nearest && nearest !== locked && nearestDist + cfg.evo2DroneHysteresisPx < lockedDist) {
      locked = nearest;
    }
    drone.lockedTarget = locked;

    if (locked && locked.active) {
      const aimAng = Math.atan2(locked.y - sy, locked.x - sx);
      drone.sprite.setRotation(
        Phaser.Math.Angle.RotateTo(drone.sprite.rotation, aimAng + Math.PI / 2, 14 * dt)
      );
      drone.beamTargetX = locked.x;
      drone.beamTargetY = locked.y;
      drone.beamVisible = true;

      drone.fireTimerMs -= dtMs;
      if (drone.fireTimerMs <= 0) {
        drone.fireTimerMs = cfg.evo2DroneDamageIntervalMs;
        const baseDmg = getWeaponDamageAtLevel(WEAPONS.beam, ctx.weaponLevel);
        const crit = ctx.rollCrit();
        const droneDmg = Math.max(
          2,
          Math.round(baseDmg * ctx.damageMult * cfg.evo2DroneDamageRatio * crit.mult)
        );
        ctx.onInstantHit(locked, droneDmg, crit.isCrit, {
          source: 'player_weapon',
          firingActionId: this.continuousBeam.currentBeamActionId,
          countsForFiringAction: false,
        });
      }
    } else {
      drone.beamVisible = false;
      drone.sprite.setRotation(Phaser.Math.Angle.RotateTo(drone.sprite.rotation, 0, 8 * dt));
    }
  }

  private activateBeamDrone(x: number, y: number): void {
    const drone = this.beamDrone;
    const cfg = WEAPON_RUNTIME_TUNING.beam;
    drone.active = true;
    drone.remainingMs = cfg.evo2DroneDurationMs;
    drone.fireTimerMs = 80;
    drone.lockedTarget = null;
    drone.beamVisible = false;
    drone.age = 0;
    drone.sprite.setPosition(x, y).setAlpha(0.1).setScale(1).setActive(true).setVisible(true);

    const pulse = this.scene.add.circle(x, y, 10, 0x60a5fa, 0.2).setDepth(14);
    pulse.setStrokeStyle(2, 0x93c5fd, 0.9);
    this.scene.tweens.add({
      targets: pulse,
      scaleX: 2.5,
      scaleY: 2.5,
      alpha: 0,
      duration: 280,
      onComplete: () => pulse.destroy(),
    });
  }

  private deactivateBeamDrone(): void {
    const drone = this.beamDrone;
    if (!drone.active) return;
    const vanishX = drone.sprite.x;
    const vanishY = drone.sprite.y;
    drone.active = false;
    drone.remainingMs = 0;
    drone.beamVisible = false;
    drone.lockedTarget = null;
    drone.cooldownMs = WEAPON_RUNTIME_TUNING.beam.evo2DroneCooldownMs;
    drone.sprite.setActive(false).setVisible(false);

    if (vanishX > 0 && vanishY > 0) {
      const fadeRing = this.scene.add.circle(vanishX, vanishY, 14, 0x60a5fa, 0.16).setDepth(14);
      fadeRing.setStrokeStyle(2, 0xbae6fd, 0.85);
      this.scene.tweens.add({
        targets: fadeRing,
        scaleX: 0.2,
        scaleY: 0.2,
        alpha: 0,
        duration: 240,
        onComplete: () => fadeRing.destroy(),
      });
    }
  }

  addVisualBeam(x1: number, y1: number, x2: number, y2: number, color: number, width: number, life = 0.12): void {
    this.beams.push({ x1, y1, x2, y2, color, width, life, maxLife: life });
  }

  addLightningArc(
    anchors: Array<{ x: number; y: number }>,
    enhanced = false,
    paralyzing = false,
    overrideColor?: number
  ): void {
    if (anchors.length < 2) return;
    const points: Array<{ x: number; y: number }> = [anchors[0]];
    const branches: Array<Array<{ x: number; y: number }>> = [];
    for (let i = 0; i < anchors.length - 1; i++) {
      const a = anchors[i];
      const b = anchors[i + 1];
      const steps = enhanced ? 5 : 4;
      for (let s = 1; s < steps; s++) {
        const t = s / steps;
        const px = Phaser.Math.Linear(a.x, b.x, t) + (Math.random() - 0.5) * (enhanced ? 28 : 22);
        const py = Phaser.Math.Linear(a.y, b.y, t) + (Math.random() - 0.5) * (enhanced ? 24 : 18);
        points.push({ x: px, y: py });
        if (enhanced && Math.random() < 0.45) {
          const ang = Math.random() * Math.PI * 2;
          const len = 16 + Math.random() * 18;
          branches.push([
            { x: px, y: py },
            { x: px + Math.cos(ang) * len, y: py + Math.sin(ang) * len },
          ]);
        }
      }
      points.push(b);
    }
    this.lightningBolts.push({
      points,
      branches,
      life: enhanced ? 0.17 : 0.14,
      maxLife: enhanced ? 0.17 : 0.14,
      thickness: enhanced ? 6.5 : 4.2,
      color: overrideColor ?? (paralyzing ? 0x67e8f9 : 0x22d3ee),
    });
  }

  update(
    dt: number,
    targets: Targetable[],
    playerX?: number,
    playerY?: number,
    freezeEnemyBullets = false
  ): void {
    this.simTimeSec += dt;
    const w = this.scene.scale.width;
    const h = this.scene.scale.height;
    const homingCfg = WEAPON_RUNTIME_TUNING.homing;

    this.playerPool.forEachActive((b) => {
      b.age += dt;
      if (b.homing && b.age > 0.055) {
        let nearest: Targetable | null = null;
        let bestDist = homingCfg.seekRadiusPx;
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
          const speed = Math.hypot(b.vx, b.vy) || homingCfg.baseSpeed;
          const currAngle = Math.atan2(b.vy, b.vx);
          const nextAngle = Phaser.Math.Angle.RotateTo(
            currAngle,
            desiredAngle,
            homingCfg.turnRateRadPerSec * dt
          );
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

    if (!freezeEnemyBullets) {
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

      // 4. Gentle Homing Seeker steering
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
    }

    // Render pooled projectile trails, continuous beam, autonomous drone laser, visual beams & lightning
    this.fxGraphics.clear();

    // Player bullet energy trails (zero-allocation vector streaks)
    this.playerPool.forEachActive((b) => {
      if (b.trailColor === 0 || b.trailLength <= 0) return;
      const spd = Math.hypot(b.vx, b.vy);
      if (spd < 10) return;
      const nx = b.vx / spd;
      const ny = b.vy / spd;
      const len = Math.min(b.trailLength, spd * Math.min(b.age, 0.08) + 6);
      const tx = b.sprite.x - nx * len;
      const ty = b.sprite.y - ny * len;
      this.fxGraphics.lineStyle(b.trailWidth, b.trailColor, 0.42);
      this.fxGraphics.lineBetween(b.sprite.x, b.sprite.y, tx, ty);
      this.fxGraphics.lineStyle(Math.max(1.2, b.trailWidth * 0.45), 0xffffff, 0.55);
      this.fxGraphics.lineBetween(
        b.sprite.x,
        b.sprite.y,
        b.sprite.x - nx * (len * 0.55),
        b.sprite.y - ny * (len * 0.55)
      );
    });

    // Continuous Beam rendering
    if (this.continuousBeam.active) {
      const bx = this.continuousBeam.x;
      const by = this.continuousBeam.y;
      const cfg = WEAPON_RUNTIME_TUNING.beam;
      const isEvo1 = this.continuousBeam.stage >= 1;
      const baseW = isEvo1 ? cfg.evo1WidthPx : cfg.baseWidthPx;
      const pulse = 1 + Math.sin(this.simTimeSec * 28) * 0.1 + this.continuousBeam.maxRampVisual * 0.25;
      const wOuter = baseW * pulse;

      this.fxGraphics.lineStyle(wOuter, isEvo1 ? 0x3b82f6 : 0x2563eb, 0.28 + this.continuousBeam.maxRampVisual * 0.16);
      this.fxGraphics.lineBetween(bx, by, bx, 0);
      this.fxGraphics.lineStyle(wOuter * 0.56, isEvo1 ? 0x93c5fd : 0x60a5fa, 0.65);
      this.fxGraphics.lineBetween(bx, by, bx, 0);
      this.fxGraphics.lineStyle(Math.max(2.5, wOuter * 0.22), 0xffffff, 0.95);
      this.fxGraphics.lineBetween(bx, by, bx, 0);

      // Emitter muzzle glow
      this.fxGraphics.fillStyle(0x93c5fd, 0.65);
      this.fxGraphics.fillCircle(bx, by, isEvo1 ? 9 : 6.5);
      this.fxGraphics.fillStyle(0xffffff, 0.95);
      this.fxGraphics.fillCircle(bx, by, isEvo1 ? 4.5 : 3);

      // Contact glow flares amplifying with target accumulation
      for (let i = 0; i < this.continuousBeam.contactPoints.length; i++) {
        const cp = this.continuousBeam.contactPoints[i];
        const flareR = (isEvo1 ? 11 : 8) + cp.intensity * (isEvo1 ? 10 : 7);
        this.fxGraphics.fillStyle(0x60a5fa, 0.38 * cp.intensity);
        this.fxGraphics.fillCircle(cp.x, cp.y, flareR);
        this.fxGraphics.fillStyle(0xffffff, 0.85 * cp.intensity);
        this.fxGraphics.fillCircle(cp.x, cp.y, flareR * 0.42);
      }
    }

    // Quantum Clone Continuous Beam rendering
    if (this.cloneBeam.active) {
      const cbx = this.cloneBeam.x;
      const cby = this.cloneBeam.y;
      const cex = this.cloneBeam.endX;
      const cey = this.cloneBeam.endY;
      const isEvo1 = this.cloneBeam.stage >= 1;
      const wOuter = (isEvo1 ? 14 : 10) * (1 + Math.sin(this.simTimeSec * 22) * 0.08);
      this.fxGraphics.lineStyle(wOuter, 0x6366f1, 0.25);
      this.fxGraphics.lineBetween(cbx, cby, cex, cey);
      this.fxGraphics.lineStyle(wOuter * 0.52, 0xa5b4fc, 0.55);
      this.fxGraphics.lineBetween(cbx, cby, cex, cey);
      this.fxGraphics.lineStyle(Math.max(1.8, wOuter * 0.2), 0xe0e7ff, 0.85);
      this.fxGraphics.lineBetween(cbx, cby, cex, cey);
      for (let i = 0; i < this.cloneBeam.contactPoints.length; i++) {
        const cp = this.cloneBeam.contactPoints[i];
        this.fxGraphics.fillStyle(0x818cf8, 0.42);
        this.fxGraphics.fillCircle(cp.x, cp.y, 8);
      }
    }

    // Beam Evolution II: Autonomous Laser Drone beam + aura
    if (this.beamDrone.active) {
      this.fxGraphics.lineStyle(1.4, 0x60a5fa, 0.42);
      this.fxGraphics.strokeCircle(this.beamDrone.sprite.x, this.beamDrone.sprite.y, 17);
      if (this.beamDrone.beamVisible) {
        const dx = this.beamDrone.sprite.x;
        const dy = this.beamDrone.sprite.y;
        const tx = this.beamDrone.beamTargetX;
        const ty = this.beamDrone.beamTargetY;
        this.fxGraphics.lineStyle(6.5, 0x3b82f6, 0.35);
        this.fxGraphics.lineBetween(dx, dy, tx, ty);
        this.fxGraphics.lineStyle(2.4, 0xbae6fd, 0.95);
        this.fxGraphics.lineBetween(dx, dy, tx, ty);
        this.fxGraphics.fillStyle(0x93c5fd, 0.65);
        this.fxGraphics.fillCircle(tx, ty, 6);
        this.fxGraphics.fillStyle(0xffffff, 0.9);
        this.fxGraphics.fillCircle(tx, ty, 2.5);
      }
    }

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
      this.fxGraphics.lineStyle(bolt.thickness * alpha, bolt.color, 0.6 * alpha);
      this.fxGraphics.beginPath();
      this.fxGraphics.moveTo(bolt.points[0].x, bolt.points[0].y);
      for (let p = 1; p < bolt.points.length; p++) {
        this.fxGraphics.lineTo(bolt.points[p].x, bolt.points[p].y);
      }
      this.fxGraphics.strokePath();

      this.fxGraphics.lineStyle(Math.max(1.5, bolt.thickness * 0.38) * alpha, 0xffffff, 0.95 * alpha);
      this.fxGraphics.beginPath();
      this.fxGraphics.moveTo(bolt.points[0].x, bolt.points[0].y);
      for (let p = 1; p < bolt.points.length; p++) {
        this.fxGraphics.lineTo(bolt.points[p].x, bolt.points[p].y);
      }
      this.fxGraphics.strokePath();

      for (let b = 0; b < bolt.branches.length; b++) {
        const br = bolt.branches[b];
        this.fxGraphics.lineStyle(2.2 * alpha, bolt.color, 0.55 * alpha);
        this.fxGraphics.lineBetween(br[0].x, br[0].y, br[1].x, br[1].y);
        this.fxGraphics.lineStyle(1.0 * alpha, 0xffffff, 0.8 * alpha);
        this.fxGraphics.lineBetween(br[0].x, br[0].y, br[1].x, br[1].y);
      }
    }
  }

  forEachPlayerBullet(cb: (b: PlayerBullet) => void): void {
    this.playerPool.forEachActive(cb);
  }

  forEachEnemyBullet(cb: (b: EnemyBullet) => void): void {
    this.enemyPool.forEachActive(cb);
  }

  getActiveEnemyBulletCount(): number {
    let count = 0;
    this.enemyPool.forEachActive(() => {
      count++;
    });
    return count;
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
    this.continuousBeam.active = false;
    this.continuousBeam.actionCycleAccumMs = 0;
    this.continuousBeam.currentBeamActionId = 0;
    this.continuousBeam.contactPoints.length = 0;
    this.continuousBeam.ramps.clear();
    this.cloneBeam.active = false;
    this.cloneBeam.cycleElapsedMs = 0;
    this.cloneBeam.contactPoints.length = 0;
    this.cloneBeam.ramps.clear();
    this.beamDrone.active = false;
    this.beamDrone.beamVisible = false;
    this.beamDrone.lockedTarget = null;
    this.beamDrone.sprite.setActive(false).setVisible(false);
    this.fxGraphics.clear();
  }

  destroy(): void {
    this.clearAll();
    this.beamDrone.sprite.destroy();
    this.fxGraphics.destroy();
  }
}
