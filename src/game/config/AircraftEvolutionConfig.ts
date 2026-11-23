import type { ShipId } from './ShipConfig';
import type { WeaponId } from './WeaponConfig';

export type EvolutionCategory = 'momentum' | 'accumulative';

export interface NovaDroneWeaponConfig {
  weaponId: WeaponId;
  shortLabel: string;
  colorNum: number;
  colorHex: string;
  fireIntervalMs: number;
  damage: number;
  projectileSpeed: number;
  projectileRadius: number;
  rangePx: number;
  // Spread
  spreadAnglesRad?: readonly number[];
  // Homing
  missileCount?: number;
  homingTurnRateRadPerSec?: number;
  splashRadiusPx?: number;
  splashDamageRatio?: number;
  // Beam
  beamTickIntervalMs?: number;
  beamMaxRampBonus?: number;
  beamRampPerTick?: number;
  beamWidthPx?: number;
  // Lightning
  lightningMaxJumps?: number;
  lightningChainRangePx?: number;
  lightningBounceDecay?: number;
}

export interface EvolutionConfig {
  shipId: ShipId;
  name: string;
  shortLabel: string;
  category: EvolutionCategory;
  durationSec: number;
  primaryColorHex: string;
  accentColorHex: string;
  primaryColorNum: number;
  accentColorNum: number;
  chargeTriggerSummary: string;
  evolutionAbilitySummary: string;
  chargeMechanics: {
    // Momentum decay tuning (only applies when category === 'momentum')
    decayDelaySec: number;
    decayPerSec: number;
    // Falcon X: low HP/Shield charge
    hpThresholdRatio?: number;
    shieldThresholdRatio?: number;
    chargePerSecMin?: number;
    chargePerSecMax?: number;
    // Phantom: Dash charge
    chargePerDash?: number;
    // Destroyer: nearby enemy count + capped hit damage
    nearbyRadiusPx?: number;
    maxCountedEnemies?: number;
    chargePerEnemyPerSec?: number;
    // Thunderbolt: continuous hit charge
    chargePerHit?: number;
    hitGrantIntervalMs?: number;
    streakWindowSec?: number;
    maxStreakMult?: number;
    // Aegis: full shield sustain + shield pickup + hit damage
    fullShieldChargePerSec?: number;
    shieldPickupCharge?: number;
    shieldPickupCooldownMs?: number;
    // Shared hit damage charge (Destroyer, Aegis, Nova Prime, Celestial)
    chargePerHitBase?: number;
    chargePerDamage?: number;
    maxChargePerHit?: number;
    hitChargeCooldownMs?: number;
    // Shared kill charge (Specter, Nova Prime, Celestial)
    chargePerStandardKill?: number;
    chargePerHeavyKill?: number;
    chargePerBossKill?: number;
    // Specter fair boss-fight tick so pure boss duels still fill Charge
    chargePerBossHit?: number;
    bossHitCooldownMs?: number;
  };
  effects: {
    // Falcon X
    shieldRegenPerSecBonus?: number;
    hpRegenPerSec?: number;
    maxHpHealFraction?: number;
    // Phantom
    moveSpeedBonus?: number;
    maxTotalMoveSpeed?: number;
    handlingBoost?: number;
    earlyImmunitySec?: number;
    // Destroyer & Celestial DR
    damageMultBonus?: number;
    damageReductionBonus?: number;
    maxTotalDamageReduction?: number;
    // Thunderbolt
    fireRateMultBonus?: number;
    maxTotalFireRateMult?: number;
    // Aegis
    barrierBaseHp?: number;
    barrierShieldScale?: number;
    barrierRadiusPx?: number;
    // Specter
    critChanceBonus?: number;
    maxTotalCritChance?: number;
    critDamageBonus?: number;
    maxTotalCritDamage?: number;
    // Nova Prime
    droneCount?: number;
    // Celestial
    allStatsMaxHpPct?: number;
    allStatsMaxShieldPct?: number;
    allStatsMoveSpeedBonus?: number;
    allStatsDamageMultBonus?: number;
    allStatsFireRateMultBonus?: number;
    allStatsCritChanceBonus?: number;
    allStatsCritDamageBonus?: number;
    astralBlastRadiusPx?: number;
    astralBlastDamage?: number;
    astralBlastSlowSec?: number;
    astralDomainRadiusPx?: number;
    astralDomainEnemySpeedMult?: number;
    astralDomainBulletSpeedMult?: number;
  };
}

export const EVOLUTION_NEAR_FULL_THRESHOLD = 85;

/**
 * Independent Base-Form-only combat parameters for Nova Prime's 4 Evolution Support Drones.
 * Strictly zero Evolution I / II perks (no Plasma Burst, Central Barrage, 6-Way Spread,
 * Beam Auto-Drone, Heavy Missile, or Lightning Paralyze).
 */
export const NOVA_DRONE_WEAPON_CONFIGS: Record<WeaponId, NovaDroneWeaponConfig> = {
  plasma: {
    weaponId: 'plasma',
    shortLabel: 'PLASMA',
    colorNum: 0x38bdf8,
    colorHex: '#38BDF8',
    fireIntervalMs: 360,
    damage: 14,
    projectileSpeed: 760,
    projectileRadius: 6,
    rangePx: 540,
  },
  dual_laser: {
    weaponId: 'dual_laser',
    shortLabel: 'DUAL',
    colorNum: 0x22d3ee,
    colorHex: '#22D3EE',
    fireIntervalMs: 300,
    damage: 8,
    projectileSpeed: 840,
    projectileRadius: 5.5,
    rangePx: 540,
  },
  spread: {
    weaponId: 'spread',
    shortLabel: 'SPREAD',
    colorNum: 0xc084fc,
    colorHex: '#C084FC',
    fireIntervalMs: 490,
    damage: 7,
    projectileSpeed: 680,
    projectileRadius: 5.5,
    rangePx: 460,
    spreadAnglesRad: [-0.3, -0.1, 0.1, 0.3],
  },
  beam: {
    weaponId: 'beam',
    shortLabel: 'BEAM',
    colorNum: 0x60a5fa,
    colorHex: '#60A5FA',
    fireIntervalMs: 140,
    damage: 7,
    projectileSpeed: 0,
    projectileRadius: 0,
    rangePx: 430,
    beamTickIntervalMs: 140,
    beamMaxRampBonus: 0.35,
    beamRampPerTick: 0.05,
    beamWidthPx: 4,
  },
  homing: {
    weaponId: 'homing',
    shortLabel: 'HOMING',
    colorNum: 0xf59e0b,
    colorHex: '#F59E0B',
    fireIntervalMs: 680,
    damage: 12,
    projectileSpeed: 480,
    projectileRadius: 6.5,
    rangePx: 560,
    missileCount: 2,
    homingTurnRateRadPerSec: 4.8,
    splashRadiusPx: 42,
    splashDamageRatio: 0.3,
  },
  lightning: {
    weaponId: 'lightning',
    shortLabel: 'ARC',
    colorNum: 0x67e8f9,
    colorHex: '#67E8F9',
    fireIntervalMs: 560,
    damage: 13,
    projectileSpeed: 0,
    projectileRadius: 0,
    rangePx: 410,
    lightningMaxJumps: 3,
    lightningChainRangePx: 145,
    lightningBounceDecay: 0.72,
  },
};

export const EVOLUTION_CONFIGS: Record<ShipId, EvolutionConfig> = {
  falcon_x: {
    shipId: 'falcon_x',
    name: 'FALCON CHARGE',
    shortLabel: 'Adaptive Recovery',
    category: 'momentum',
    durationSec: 8,
    primaryColorHex: '#38BDF8',
    accentColorHex: '#E2E8F0',
    primaryColorNum: 0x38bdf8,
    accentColorNum: 0xe2e8f0,
    chargeTriggerSummary:
      'Charges rapidly when Shield (<55%) or Hull (<60%) drops; slows/decays slowly once vitals recover.',
    evolutionAbilitySummary:
      'Activates 8s Adaptive Recovery: accelerates Shield regeneration (+9/s) and restores limited Hull HP (capped at 28% Max HP per activation).',
    chargeMechanics: {
      decayDelaySec: 2.6,
      decayPerSec: 3.5,
      hpThresholdRatio: 0.62,
      shieldThresholdRatio: 0.56,
      chargePerSecMin: 6.5,
      chargePerSecMax: 16.5,
    },
    effects: {
      shieldRegenPerSecBonus: 9,
      hpRegenPerSec: 4.5,
      maxHpHealFraction: 0.28,
    },
  },
  phantom: {
    shipId: 'phantom',
    name: 'PHANTOM CHARGE',
    shortLabel: 'Phase Overdrive',
    category: 'momentum',
    durationSec: 6,
    primaryColorHex: '#A855F7',
    accentColorHex: '#0F172A',
    primaryColorNum: 0xa855f7,
    accentColorNum: 0x1e1b4b,
    chargeTriggerSummary:
      'Gains Charge each valid Dash (cooldown-gated); decays gently after extended inactivity without dashing.',
    evolutionAbilitySummary:
      'Activates 6s Phase Overdrive: +105 Thruster Speed, sharp agile handling, and an initial 1.1s Phase Immunity window on trigger.',
    chargeMechanics: {
      decayDelaySec: 4.8,
      decayPerSec: 3.2,
      chargePerDash: 24,
    },
    effects: {
      moveSpeedBonus: 105,
      maxTotalMoveSpeed: 620,
      handlingBoost: 0.35,
      earlyImmunitySec: 1.1,
    },
  },
  destroyer: {
    shipId: 'destroyer',
    name: 'DESTROYER CHARGE',
    shortLabel: 'Siege Reactor',
    category: 'momentum',
    durationSec: 8,
    primaryColorHex: '#EF4444',
    accentColorHex: '#C2410C',
    primaryColorNum: 0xef4444,
    accentColorNum: 0xc2410c,
    chargeTriggerSummary:
      'Charges from combat intensity: close hostile presence (capped) and taking enemy fire (rate-limited); decays outside combat.',
    evolutionAbilitySummary:
      'Activates 8s Siege Reactor: +28% Weapon Power and +20% Damage Reduction (capped) with heavy crimson core overdrive.',
    chargeMechanics: {
      decayDelaySec: 3.0,
      decayPerSec: 3.0,
      nearbyRadiusPx: 300,
      maxCountedEnemies: 4,
      chargePerEnemyPerSec: 2.3,
      chargePerHitBase: 4,
      chargePerDamage: 0.3,
      maxChargePerHit: 10,
      hitChargeCooldownMs: 650,
    },
    effects: {
      damageMultBonus: 0.28,
      damageReductionBonus: 0.2,
      maxTotalDamageReduction: 0.48,
    },
  },
  thunderbolt: {
    shipId: 'thunderbolt',
    name: 'THUNDER CHARGE',
    shortLabel: 'Hyper Cadence',
    category: 'momentum',
    durationSec: 7,
    primaryColorHex: '#0EA5E9',
    accentColorHex: '#FACC15',
    primaryColorNum: 0x0ea5e9,
    accentColorNum: 0xfacc15,
    chargeTriggerSummary:
      'Charges on continuous valid weapon hits across all 6 arms (rate-limited with streak bonus); decays quickly when hits pause.',
    evolutionAbilitySummary:
      'Activates 7s Hyper Cadence: +38% capped Fire Cadence surge across all weapons with electric arc discharge.',
    chargeMechanics: {
      decayDelaySec: 1.8,
      decayPerSec: 4.2,
      chargePerHit: 3.4,
      hitGrantIntervalMs: 110,
      streakWindowSec: 1.5,
      maxStreakMult: 1.45,
    },
    effects: {
      fireRateMultBonus: 0.38,
      maxTotalFireRateMult: 3.1,
    },
  },
  aegis: {
    shipId: 'aegis',
    name: 'AEGIS BARRIER',
    shortLabel: 'Energy Barrier',
    category: 'accumulative',
    durationSec: 8,
    primaryColorHex: '#3B82F6',
    accentColorHex: '#F8FAFC',
    primaryColorNum: 0x3b82f6,
    accentColorNum: 0xf8fafc,
    chargeTriggerSummary:
      'Retained Charge: accumulates by holding Full Shield, collecting Shield Power-Ups, or absorbing hostile hits.',
    evolutionAbilitySummary:
      'Projects an 8s Circular Energy Barrier with finite durability that intercepts enemy projectiles and impacts until broken or expired.',
    chargeMechanics: {
      decayDelaySec: 999,
      decayPerSec: 0,
      fullShieldChargePerSec: 5.5,
      shieldPickupCharge: 20,
      shieldPickupCooldownMs: 800,
      chargePerHitBase: 6,
      chargePerDamage: 0.28,
      maxChargePerHit: 15,
      hitChargeCooldownMs: 600,
    },
    effects: {
      barrierBaseHp: 140,
      barrierShieldScale: 0.65,
      barrierRadiusPx: 44,
    },
  },
  specter: {
    shipId: 'specter',
    name: 'SPECTER EXECUTION',
    shortLabel: 'Fatal Precision',
    category: 'accumulative',
    durationSec: 8,
    primaryColorHex: '#F43F5E',
    accentColorHex: '#090D16',
    primaryColorNum: 0xf43f5e,
    accentColorNum: 0x18181b,
    chargeTriggerSummary:
      'Retained Charge: fills on confirmed enemy eliminations (weighted by elite/boss tier) and sustained boss-hit milestones.',
    evolutionAbilitySummary:
      'Activates 8s Execution Protocol: +22% Crit Rate (max 75%) and +55% Crit Damage multiplier (max 325%) with crimson strike trails.',
    chargeMechanics: {
      decayDelaySec: 999,
      decayPerSec: 0,
      chargePerStandardKill: 10,
      chargePerHeavyKill: 16,
      chargePerBossKill: 45,
      chargePerBossHit: 3.5,
      bossHitCooldownMs: 550,
    },
    effects: {
      critChanceBonus: 0.22,
      maxTotalCritChance: 0.75,
      critDamageBonus: 0.55,
      maxTotalCritDamage: 3.25,
    },
  },
  nova_prime: {
    shipId: 'nova_prime',
    name: 'NOVA DRONE SUPPORT',
    shortLabel: 'Quad Drone Array',
    category: 'accumulative',
    durationSec: 10,
    primaryColorHex: '#22D3EE',
    accentColorHex: '#F8FAFC',
    primaryColorNum: 0x22d3ee,
    accentColorNum: 0xf8fafc,
    chargeTriggerSummary:
      'Retained Charge: fills cleanly from confirmed enemy kills and taking incoming combat damage (capped per hit).',
    evolutionAbilitySummary:
      'Deploys 4 Support Drones for 10s armed with 4 unique randomized Base-Form weapons (Plasma, Dual, Spread, Beam, Homing, or Lightning).',
    chargeMechanics: {
      decayDelaySec: 999,
      decayPerSec: 0,
      chargePerStandardKill: 9,
      chargePerHeavyKill: 14,
      chargePerBossKill: 40,
      chargePerHitBase: 5,
      chargePerDamage: 0.26,
      maxChargePerHit: 14,
      hitChargeCooldownMs: 600,
    },
    effects: {
      droneCount: 4,
    },
  },
  celestial: {
    shipId: 'celestial',
    name: 'CELESTIAL ASTRAL MODE',
    shortLabel: 'Astral Sovereign',
    category: 'accumulative',
    durationSec: 8,
    primaryColorHex: '#FACC15',
    accentColorHex: '#FEF9C3',
    primaryColorNum: 0xfacc15,
    accentColorNum: 0xfef9c3,
    chargeTriggerSummary:
      'Retained Charge: accumulates from confirmed eliminations and incoming damage (rate-capped).',
    evolutionAbilitySummary:
      'Triggers 8s Astral Mode: 1x Astral Explosion (blast + bullet clear), balanced boost to all 7 stats, Astral Damage Reduction, and Astral Domain slow aura.',
    chargeMechanics: {
      decayDelaySec: 999,
      decayPerSec: 0,
      chargePerStandardKill: 8,
      chargePerHeavyKill: 13,
      chargePerBossKill: 40,
      chargePerHitBase: 5,
      chargePerDamage: 0.24,
      maxChargePerHit: 13,
      hitChargeCooldownMs: 650,
    },
    effects: {
      allStatsMaxHpPct: 0.15,
      allStatsMaxShieldPct: 0.15,
      allStatsMoveSpeedBonus: 45,
      allStatsDamageMultBonus: 0.16,
      allStatsFireRateMultBonus: 0.16,
      allStatsCritChanceBonus: 0.08,
      allStatsCritDamageBonus: 0.22,
      damageReductionBonus: 0.22,
      maxTotalDamageReduction: 0.5,
      maxTotalMoveSpeed: 610,
      maxTotalCritChance: 0.72,
      maxTotalCritDamage: 3.1,
      astralBlastRadiusPx: 380,
      astralBlastDamage: 165,
      astralBlastSlowSec: 0.9,
      astralDomainRadiusPx: 245,
      astralDomainEnemySpeedMult: 0.56,
      astralDomainBulletSpeedMult: 0.5,
    },
  },
};
