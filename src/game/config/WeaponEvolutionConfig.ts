import type { WeaponId } from './WeaponConfig';

export type WeaponEvolutionStage = 0 | 1 | 2;

export const WEAPON_EVOLUTION_LEVELS = {
  BASE_MAX: 11,
  EVO_1: 12,
  EVO_1_MAX: 19,
  EVO_2: 20,
} as const;

export interface WeaponEvolutionTierMeta {
  stage: WeaponEvolutionStage;
  tierLabel: 'Base Form' | 'Evolution I' | 'Evolution II';
  unlockLevel: number;
  formName: string;
  summary: string;
  mechanicNotes: string[];
  accentHex: string;
}

export interface WeaponRuntimeTuning {
  plasma: {
    baseSpeed: number;
    evo1Speed: number;
    evo2BurstProcChance: number;
    evo2BurstCooldownMs: number;
    evo2BurstMainDamageMult: number;
    evo2BurstSplashRadius: number;
    evo2BurstSplashDamageRatio: number;
    evo2MiniBoltCount: number;
    evo2MiniBoltSpeed: number;
    evo2MiniBoltDamageRatio: number;
  };
  dual_laser: {
    baseSpeed: number;
    evo1Speed: number;
    wingOffsetPx: number;
    evo2BarrageProcChance: number;
    evo2BarrageDurationMs: number;
    evo2BarrageCooldownMs: number;
    evo2BarrageFireIntervalMs: number;
    evo2BarrageBoltSpeed: number;
    evo2BarrageBoltDamageRatio: number;
  };
  spread: {
    baseSpeed: number;
    evo1Speed: number;
    evo2Speed: number;
    baseAnglesRad: readonly number[];
    evo1AnglesRad: readonly number[];
    evo2AnglesRad: readonly number[];
    evo2PerBoltDamageMult: number;
  };
  beam: {
    baseDamageIntervalMs: number;
    evo1DamageIntervalMs: number;
    minDamageIntervalMs: number;
    baseHalfSpanPx: number;
    evo1HalfSpanPx: number;
    baseWidthPx: number;
    evo1WidthPx: number;
    baseRampPerTick: number;
    evo1RampPerTick: number;
    baseMaxRampBonus: number;
    evo1MaxRampBonus: number;
    rampResetGraceSec: number;
    evo2DroneProcChance: number;
    evo2DroneCheckIntervalMs: number;
    evo2DroneDurationMs: number;
    evo2DroneCooldownMs: number;
    evo2DroneRangePx: number;
    evo2DroneHysteresisPx: number;
    evo2DroneDamageIntervalMs: number;
    evo2DroneDamageRatio: number;
  };
  homing: {
    baseSpeed: number;
    evo1Speed: number;
    seekRadiusPx: number;
    turnRateRadPerSec: number;
    baseSplashRadiusPx: number;
    evo1SplashRadiusPx: number;
    baseSplashDamageRatio: number;
    evo1SplashDamageRatio: number;
    evo2HeavyProcChance: number;
    evo2HeavyCooldownMs: number;
    evo2HeavySpeed: number;
    evo2HeavyDamageMult: number;
    evo2HeavySplashRadiusPx: number;
    evo2HeavySplashDamageRatio: number;
  };
  lightning: {
    baseMaxJumps: number;
    evo1MaxJumps: number;
    baseInitialRangePx: number;
    evo1InitialRangePx: number;
    baseChainRangePx: number;
    evo1ChainRangePx: number;
    baseBounceDecay: number;
    evo1BounceDecay: number;
    evo2PrimaryStunChance: number;
    evo2ChainStunChance: number;
    evo2StunDurationSec: number;
    evo2EliteResistance: number;
    evo2BossResistance: number;
    evo2StunImmunityMs: number;
    evo2EliteImmunityMs: number;
    evo2BossImmunityMs: number;
  };
}

export const WEAPON_RUNTIME_TUNING: WeaponRuntimeTuning = {
  plasma: {
    baseSpeed: 850,
    evo1Speed: 910,
    evo2BurstProcChance: 0.24,
    evo2BurstCooldownMs: 950,
    evo2BurstMainDamageMult: 1.25,
    evo2BurstSplashRadius: 72,
    evo2BurstSplashDamageRatio: 0.42,
    evo2MiniBoltCount: 6,
    evo2MiniBoltSpeed: 640,
    evo2MiniBoltDamageRatio: 0.34,
  },
  dual_laser: {
    baseSpeed: 980,
    evo1Speed: 1050,
    wingOffsetPx: 14,
    evo2BarrageProcChance: 0.22,
    evo2BarrageDurationMs: 2600,
    evo2BarrageCooldownMs: 4600,
    evo2BarrageFireIntervalMs: 115,
    evo2BarrageBoltSpeed: 1120,
    evo2BarrageBoltDamageRatio: 0.62,
  },
  spread: {
    baseSpeed: 790,
    evo1Speed: 830,
    evo2Speed: 850,
    baseAnglesRad: [-0.30, -0.10, 0.10, 0.30],
    evo1AnglesRad: [-0.32, -0.105, 0.105, 0.32],
    evo2AnglesRad: [-0.44, -0.264, -0.088, 0.088, 0.264, 0.44],
    evo2PerBoltDamageMult: 0.86,
  },
  beam: {
    baseDamageIntervalMs: 132,
    evo1DamageIntervalMs: 115,
    minDamageIntervalMs: 52,
    baseHalfSpanPx: 17,
    evo1HalfSpanPx: 23,
    baseWidthPx: 13,
    evo1WidthPx: 20,
    baseRampPerTick: 0.022,
    evo1RampPerTick: 0.028,
    baseMaxRampBonus: 0.45,
    evo1MaxRampBonus: 0.58,
    rampResetGraceSec: 0.68,
    evo2DroneProcChance: 0.42,
    evo2DroneCheckIntervalMs: 450,
    evo2DroneDurationMs: 5200,
    evo2DroneCooldownMs: 8200,
    evo2DroneRangePx: 460,
    evo2DroneHysteresisPx: 48,
    evo2DroneDamageIntervalMs: 165,
    evo2DroneDamageRatio: 0.56,
  },
  homing: {
    baseSpeed: 510,
    evo1Speed: 545,
    seekRadiusPx: 500,
    turnRateRadPerSec: 6.4,
    baseSplashRadiusPx: 68,
    evo1SplashRadiusPx: 92,
    baseSplashDamageRatio: 0.52,
    evo1SplashDamageRatio: 0.62,
    evo2HeavyProcChance: 0.30,
    evo2HeavyCooldownMs: 1600,
    evo2HeavySpeed: 470,
    evo2HeavyDamageMult: 2.3,
    evo2HeavySplashRadiusPx: 134,
    evo2HeavySplashDamageRatio: 0.72,
  },
  lightning: {
    baseMaxJumps: 4,
    evo1MaxJumps: 6,
    baseInitialRangePx: 540,
    evo1InitialRangePx: 600,
    baseChainRangePx: 270,
    evo1ChainRangePx: 335,
    baseBounceDecay: 0.80,
    evo1BounceDecay: 0.83,
    evo2PrimaryStunChance: 0.30,
    evo2ChainStunChance: 0.18,
    evo2StunDurationSec: 1.15,
    evo2EliteResistance: 0.55,
    evo2BossResistance: 0.32,
    evo2StunImmunityMs: 2600,
    evo2EliteImmunityMs: 3400,
    evo2BossImmunityMs: 6500,
  },
};

export const WEAPON_EVOLUTIONS: Record<WeaponId, [WeaponEvolutionTierMeta, WeaponEvolutionTierMeta, WeaponEvolutionTierMeta]> = {
  plasma: [
    {
      stage: 0,
      tierLabel: 'Base Form',
      unlockLevel: 1,
      formName: 'Plasma Bolt',
      summary: 'Balanced single plasma bolt with dependable speed and crisp impact.',
      mechanicNotes: [
        'Fires 1 focused plasma bolt along center line',
        'Balanced damage & cadence baseline across all ranges',
      ],
      accentHex: '#38BDF8',
    },
    {
      stage: 1,
      tierLabel: 'Evolution I',
      unlockLevel: WEAPON_EVOLUTION_LEVELS.EVO_1,
      formName: 'Enhanced Plasma',
      summary: 'Overcharged larger plasma orb with radiant core, energetic trail & faster fire.',
      mechanicNotes: [
        'Larger denser plasma sphere with bright outer aura',
        'Extended plasma wake & stronger impact burst',
        'Boosted bolt velocity, damage & firing cadence',
      ],
      accentHex: '#7DD3FC',
    },
    {
      stage: 2,
      tierLabel: 'Evolution II',
      unlockLevel: WEAPON_EVOLUTION_LEVELS.EVO_2,
      formName: 'Plasma Burst',
      summary: 'Chance to launch an unstable Plasma Burst orb that detonates into 6 radial bolts.',
      mechanicNotes: [
        '24% proc chance (0.95s CD) to launch a massive Plasma Burst sphere',
        'Hit triggers spherical blast + 6 radial mini-plasma shards',
        'Mini-bolts deal 34% damage with independent trails & impacts',
      ],
      accentHex: '#E0F2FE',
    },
  ],
  dual_laser: [
    {
      stage: 0,
      tierLabel: 'Base Form',
      unlockLevel: 1,
      formName: 'Dual Rapid Shot',
      summary: 'High-cadence twin coherent bolts fired simultaneously from wing emitters.',
      mechanicNotes: [
        'Fires 2 parallel rapid laser bolts per volley',
        'Lower damage per bolt offset by highest fire rate',
      ],
      accentHex: '#22D3EE',
    },
    {
      stage: 1,
      tierLabel: 'Evolution I',
      unlockLevel: WEAPON_EVOLUTION_LEVELS.EVO_1,
      formName: 'Enhanced Dual Shot',
      summary: 'Reinforced dual laser lances with thicker energy sheath, sharper trail & faster rate.',
      mechanicNotes: [
        'Larger, brighter dual coherent beams with outer halo',
        'Faster bolt velocity & upgraded sustained rapid fire',
      ],
      accentHex: '#67E8F9',
    },
    {
      stage: 2,
      tierLabel: 'Evolution II',
      unlockLevel: WEAPON_EVOLUTION_LEVELS.EVO_2,
      formName: 'Central Rapid Barrage',
      summary: 'Procs a glowing central hyper-cannon firing rapid bonus bolts for a burst window.',
      mechanicNotes: [
        '22% proc chance (4.6s CD) activates Central Rapid Barrage for 2.6s',
        'Central cannon streams high-velocity bonus bolts alongside twin lasers',
        'Reverts smoothly to Enhanced Dual Shot after duration ends',
      ],
      accentHex: '#A5F3FC',
    },
  ],
  beam: [
    {
      stage: 0,
      tierLabel: 'Base Form',
      unlockLevel: 1,
      formName: 'Continuous Beam',
      summary: 'Unbroken forward laser column whose damage intensifies the longer it stays locked.',
      mechanicNotes: [
        'True continuous piercing laser while firing',
        'Accumulates up to +45% bonus damage while locked on target',
        'Fire Rate boosts smoothly accelerate damage tick cadence',
      ],
      accentHex: '#60A5FA',
    },
    {
      stage: 1,
      tierLabel: 'Evolution I',
      unlockLevel: WEAPON_EVOLUTION_LEVELS.EVO_1,
      formName: 'Enhanced Beam',
      summary: 'Wider high-luminance rail beam with faster ticks and amplified lock-on ramp.',
      mechanicNotes: [
        'Thicker twin-layered plasma rail column with intense core',
        'Shorter damage interval & up to +58% target lock ramp',
        'Contact flare brightens as accumulated heat climbs',
      ],
      accentHex: '#93C5FD',
    },
    {
      stage: 2,
      tierLabel: 'Evolution II',
      unlockLevel: WEAPON_EVOLUTION_LEVELS.EVO_2,
      formName: 'Autonomous Laser Drone',
      summary: 'Deploys an autonomous laser wingman drone that tracks and sears nearby hostiles.',
      mechanicNotes: [
        'Summons a temporary Beam Support Drone beside ship for 5.2s',
        'Auto-locks nearest target (with stability hysteresis) up to 460px',
        'Fires crisp tracking laser beam before fading out on expiry',
      ],
      accentHex: '#DBEAFE',
    },
  ],
  homing: [
    {
      stage: 0,
      tierLabel: 'Base Form',
      unlockLevel: 1,
      formName: 'Homing Missile',
      summary: 'Twin guided high-payload warheads that track enemies and detonate with AoE splash.',
      mechanicNotes: [
        'Launches 2 agile guided missiles at slower fire cadence',
        'Each missile detonates in a 68px AoE blast (52% splash)',
      ],
      accentHex: '#F59E0B',
    },
    {
      stage: 1,
      tierLabel: 'Evolution I',
      unlockLevel: WEAPON_EVOLUTION_LEVELS.EVO_1,
      formName: 'Enhanced Homing Missile',
      summary: 'Heavier twin warheads with brighter thruster plumes and wider shockwave blasts.',
      mechanicNotes: [
        'Bulkier dual seekers with vivid plasma exhaust trail',
        'Expanded 92px AoE explosion radius (62% splash) & shockwave',
      ],
      accentHex: '#FBBF24',
    },
    {
      stage: 2,
      tierLabel: 'Evolution II',
      unlockLevel: WEAPON_EVOLUTION_LEVELS.EVO_2,
      formName: 'Heavy Homing Missile',
      summary: 'Periodically launches a massive armored heavy missile with devastating AoE blast.',
      mechanicNotes: [
        '30% proc chance (1.6s CD) fires 1 Heavy Homing Missile',
        'Deals 2.3x single-missile damage with armored warhead silhouette',
        'Triggers a 134px heavy shockwave explosion (72% splash)',
      ],
      accentHex: '#FDE68A',
    },
  ],
  spread: [
    {
      stage: 0,
      tierLabel: 'Base Form',
      unlockLevel: 1,
      formName: 'Four-Way Spread',
      summary: 'Symmetrical 4-bolt fan salvo tailored for sweeping formations and close burst.',
      mechanicNotes: [
        'Fires 4 energy bolts in a balanced symmetrical fan',
        'Consistent crowd pressure across mid-to-close range',
      ],
      accentHex: '#A855F7',
    },
    {
      stage: 1,
      tierLabel: 'Evolution I',
      unlockLevel: WEAPON_EVOLUTION_LEVELS.EVO_1,
      formName: 'Enhanced Spread',
      summary: 'Four empowered larger scatter orbs with thick violet rings and crisp trails.',
      mechanicNotes: [
        'Upgrades 4 fan bolts with denser core & thicker energy rim',
        'Clearer projectile trails & heavier impact sparks',
      ],
      accentHex: '#C084FC',
    },
    {
      stage: 2,
      tierLabel: 'Evolution II',
      unlockLevel: WEAPON_EVOLUTION_LEVELS.EVO_2,
      formName: 'Six-Way Spread',
      summary: 'Expands into a dense symmetrical 6-way energy fan covering wide combat lanes.',
      mechanicNotes: [
        'Fires 6 symmetrical bolts in a wider ±0.44 rad fan',
        'Per-bolt damage tuned (86%) for fair multi-target dominance',
      ],
      accentHex: '#E9D5FF',
    },
  ],
  lightning: [
    {
      stage: 0,
      tierLabel: 'Base Form',
      unlockLevel: 1,
      formName: 'Chain Lightning',
      summary: 'Instant voltaic arc that leaps between nearby enemies with moderate bounce decay.',
      mechanicNotes: [
        'Instant hitscan arc chaining up to 4 targets (80% per bounce)',
        'Mid-tier fire cadence tuned for crowd clearing over single target',
      ],
      accentHex: '#67E8F9',
    },
    {
      stage: 1,
      tierLabel: 'Evolution I',
      unlockLevel: WEAPON_EVOLUTION_LEVELS.EVO_1,
      formName: 'Enhanced Chain Lightning',
      summary: 'High-voltage thicker arcs with 6 chain jumps, extended jump range & fork sparks.',
      mechanicNotes: [
        'Chains up to 6 targets across wider 600px/335px reach',
        'Thicker crackling multi-layer arcs with branching sparks',
      ],
      accentHex: '#A5F3FC',
    },
    {
      stage: 2,
      tierLabel: 'Evolution II',
      unlockLevel: WEAPON_EVOLUTION_LEVELS.EVO_2,
      formName: 'Paralyzing Lightning',
      summary: 'Voltaic arcs gain a chance to paralyze hostiles with crackling stun overload.',
      mechanicNotes: [
        '30% primary / 18% chain chance to Paralyze hit targets (1.15s)',
        'Paralyzed ships halt movement & fire with crackling hull arcs',
        'Elites & Bosses resist stun duration + carry cooldown immunity',
      ],
      accentHex: '#ECFEFF',
    },
  ],
};

export function getWeaponEvolutionStage(level: number): WeaponEvolutionStage {
  const clean = Math.max(1, Math.floor(level));
  if (clean >= WEAPON_EVOLUTION_LEVELS.EVO_2) return 2;
  if (clean >= WEAPON_EVOLUTION_LEVELS.EVO_1) return 1;
  return 0;
}

export function getWeaponEvolutionMeta(weaponId: WeaponId, level: number): WeaponEvolutionTierMeta {
  const stage = getWeaponEvolutionStage(level);
  return WEAPON_EVOLUTIONS[weaponId][stage];
}

export function getNextWeaponEvolutionMeta(
  weaponId: WeaponId,
  level: number
): WeaponEvolutionTierMeta | null {
  const stage = getWeaponEvolutionStage(level);
  if (stage === 0) return WEAPON_EVOLUTIONS[weaponId][1];
  if (stage === 1) return WEAPON_EVOLUTIONS[weaponId][2];
  return null;
}
