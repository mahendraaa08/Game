import {
  calculateEquipmentUpgradeCost,
  EQUIPMENT_PRICING,
  RARITY_ECONOMY,
} from './EconomyConfig';

export type EquipmentSlot = 'offensive' | 'defensive' | 'utility' | 'special';

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';

export interface RarityStyle {
  id: Rarity;
  label: string;
  colorHex: string;
  borderClass: string;
  textClass: string;
  statMultiplier: number;
}

export const RARITY_CONFIG: Record<Rarity, RarityStyle> = {
  common: {
    id: 'common',
    label: 'Common',
    colorHex: '#94A3B8',
    borderClass: 'border-slate-600/80',
    textClass: 'text-slate-300',
    statMultiplier: RARITY_ECONOMY.common.statMultiplier,
  },
  rare: {
    id: 'rare',
    label: 'Rare',
    colorHex: '#38BDF8',
    borderClass: 'border-sky-500/70',
    textClass: 'text-sky-300',
    statMultiplier: RARITY_ECONOMY.rare.statMultiplier,
  },
  epic: {
    id: 'epic',
    label: 'Epic',
    colorHex: '#A855F7',
    borderClass: 'border-purple-500/75',
    textClass: 'text-purple-300',
    statMultiplier: RARITY_ECONOMY.epic.statMultiplier,
  },
  legendary: {
    id: 'legendary',
    label: 'Legendary',
    colorHex: '#F59E0B',
    borderClass: 'border-amber-400/80',
    textClass: 'text-amber-300',
    statMultiplier: RARITY_ECONOMY.legendary.statMultiplier,
  },
  mythic: {
    id: 'mythic',
    label: 'Mythic',
    colorHex: '#F43F5E',
    borderClass: 'border-rose-500/85',
    textClass: 'text-rose-300',
    statMultiplier: RARITY_ECONOMY.mythic.statMultiplier,
  },
};

export interface EquipmentStatsBonus {
  damagePct?: number;
  fireRatePct?: number;
  critChancePct?: number;
  critDamagePct?: number;
  maxHpFlat?: number;
  maxShieldFlat?: number;
  shieldRegenPct?: number;
  damageReductionPct?: number;
  moveSpeedFlat?: number;
  pickupRangePct?: number;
  creditBonusPct?: number;
  specialPowerPct?: number;
  specialCooldownPct?: number;
  dashCooldownPct?: number;
  dronePowerPct?: number;
}

export type RarityEffectTrigger =
  | 'on_kill'
  | 'on_crit'
  | 'on_hit'
  | 'on_shield_break'
  | 'on_pickup'
  | 'on_dash'
  | 'on_special';

export interface EquipmentRarityEffect {
  id: string;
  trigger: RarityEffectTrigger;
  label: string;
  description: string;
  cooldownMs: number;
  durationMs?: number;
  shieldRestore?: number;
  hpRestore?: number;
  specialCdTrimMs?: number;
  dashCdTrimMs?: number;
  tempDamagePct?: number;
  tempFireRatePct?: number;
  tempCritDamagePct?: number;
  tempDamageReductionPct?: number;
  tempShieldRegenPct?: number;
  tempMoveSpeedPct?: number;
}

export interface EquipmentDefinition {
  id: string;
  name: string;
  slot: EquipmentSlot;
  rarity: Rarity;
  description: string;
  passiveText: string;
  costCredits: number;
  costCrystals: number;
  maxLevel: number;
  bonuses: EquipmentStatsBonus; // Tier-neutral base units; multiplied by RARITY_CONFIG.statMultiplier and (1 + (level-1)*0.20)
  rarityEffect?: EquipmentRarityEffect;
}

export const EQUIPMENT_LIST: EquipmentDefinition[] = [
  // =========================================================================
  // OFFENSIVE (5: Common, Rare, Epic, Legendary, Mythic)
  // =========================================================================
  {
    id: 'off_plasma_coil',
    name: 'Pulse Capacitor',
    slot: 'offensive',
    rarity: 'common',
    description: 'Stabilizes plasma discharge chambers for steady damage output.',
    passiveText: '+10% Weapon Damage',
    costCredits: EQUIPMENT_PRICING.off_plasma_coil.credits,
    costCrystals: EQUIPMENT_PRICING.off_plasma_coil.crystals,
    maxLevel: 5,
    bonuses: { damagePct: 10 },
  },
  {
    id: 'off_cryo_accelerator',
    name: 'Cryo Accelerator',
    slot: 'offensive',
    rarity: 'rare',
    description: 'Supercools weapon rails to raise fire cadence and cycling stability.',
    passiveText: '+11% Fire Rate · +5% Weapon Damage',
    costCredits: EQUIPMENT_PRICING.off_cryo_accelerator.credits,
    costCrystals: EQUIPMENT_PRICING.off_cryo_accelerator.crystals,
    maxLevel: 5,
    bonuses: { fireRatePct: 9, damagePct: 4 },
    rarityEffect: {
      id: 'off_rare_chill',
      trigger: 'on_kill',
      label: 'Cryo Vent',
      description: 'Kills vent rail heat to trim 0.35s Special cooldown (6s ICD).',
      cooldownMs: 6000,
      specialCdTrimMs: 350,
    },
  },
  {
    id: 'off_quantum_sight',
    name: 'Quantum Targeting Lens',
    slot: 'offensive',
    rarity: 'epic',
    description: 'Predictive lock-on optics exposing structural weak points.',
    passiveText: '+11% Crit Chance · +25% Crit Damage',
    costCredits: EQUIPMENT_PRICING.off_quantum_sight.credits,
    costCrystals: EQUIPMENT_PRICING.off_quantum_sight.crystals,
    maxLevel: 5,
    bonuses: { critChancePct: 7, critDamagePct: 16 },
    rarityEffect: {
      id: 'off_epic_precision',
      trigger: 'on_crit',
      label: 'Weakpoint Lock',
      description: 'Critical strikes grant +8% Fire Rate for 2.5s (6s ICD).',
      cooldownMs: 6000,
      tempFireRatePct: 8,
      durationMs: 2500,
    },
  },
  {
    id: 'off_overclock_rail',
    name: 'Overclocked Rail Matrix',
    slot: 'offensive',
    rarity: 'legendary',
    description: 'High-voltage magnetic accelerator built for sustained heavy suppression.',
    passiveText: '+17% Weapon DMG · +11% Fire Rate · +10% Crit Chance',
    costCredits: EQUIPMENT_PRICING.off_overclock_rail.credits,
    costCrystals: EQUIPMENT_PRICING.off_overclock_rail.crystals,
    maxLevel: 5,
    bonuses: { damagePct: 9, fireRatePct: 6, critChancePct: 5 },
    rarityEffect: {
      id: 'off_leg_rail',
      trigger: 'on_crit',
      label: 'Rail Surge',
      description: 'Critical strikes trigger a +12% Weapon Damage surge for 3s (5s ICD).',
      cooldownMs: 5000,
      tempDamagePct: 12,
      durationMs: 3000,
    },
  },
  {
    id: 'off_singularity_core',
    name: 'Singularity Warhead Core',
    slot: 'offensive',
    rarity: 'mythic',
    description: 'Zero-point energy amplifier forged from Void Emperor wreckage.',
    passiveText: '+24% Weapon DMG · +12% Fire Rate · +9% Crit · +24% Crit DMG',
    costCredits: EQUIPMENT_PRICING.off_singularity_core.credits,
    costCrystals: EQUIPMENT_PRICING.off_singularity_core.crystals,
    maxLevel: 5,
    bonuses: { damagePct: 10, fireRatePct: 5, critChancePct: 4, critDamagePct: 10 },
    rarityEffect: {
      id: 'off_mythic_collapse',
      trigger: 'on_crit',
      label: 'Void Resonance',
      description: 'Critical strikes restore +3 Shield & boost Crit DMG +15% for 3s (4.5s ICD).',
      cooldownMs: 4500,
      shieldRestore: 3,
      tempCritDamagePct: 15,
      durationMs: 3000,
    },
  },

  // =========================================================================
  // DEFENSIVE (5: Common, Rare, Epic, Legendary, Mythic)
  // =========================================================================
  {
    id: 'def_titanium_hull',
    name: 'Reactive Titanium Plates',
    slot: 'defensive',
    rarity: 'common',
    description: 'Modular hull plating protecting core avionics.',
    passiveText: '+28 Max HP',
    costCredits: EQUIPMENT_PRICING.def_titanium_hull.credits,
    costCrystals: EQUIPMENT_PRICING.def_titanium_hull.crystals,
    maxLevel: 5,
    bonuses: { maxHpFlat: 28 },
  },
  {
    id: 'def_aegis_emitter',
    name: 'Harmonic Shield Emitter',
    slot: 'defensive',
    rarity: 'rare',
    description: 'Projects a denser layered deflector barrier.',
    passiveText: '+33 Max Shield · +15 Max HP',
    costCredits: EQUIPMENT_PRICING.def_aegis_emitter.credits,
    costCrystals: EQUIPMENT_PRICING.def_aegis_emitter.crystals,
    maxLevel: 5,
    bonuses: { maxShieldFlat: 26, maxHpFlat: 12 },
    rarityEffect: {
      id: 'def_rare_pulse',
      trigger: 'on_hit',
      label: 'Deflector Stabilizer',
      description: 'Taking fire boosts Shield Regen by +20% for 3s (8s ICD).',
      cooldownMs: 8000,
      tempShieldRegenPct: 20,
      durationMs: 3000,
    },
  },
  {
    id: 'def_phase_armor',
    name: 'Void-Weave Deflector',
    slot: 'defensive',
    rarity: 'epic',
    description: 'Refracts hostile plasma energy before hull contact.',
    passiveText: '11% DMG Reduction · +34 Max Shield · +12% Shield Regen',
    costCredits: EQUIPMENT_PRICING.def_phase_armor.credits,
    costCrystals: EQUIPMENT_PRICING.def_phase_armor.crystals,
    maxLevel: 5,
    bonuses: { damageReductionPct: 7, maxShieldFlat: 22, shieldRegenPct: 8 },
    rarityEffect: {
      id: 'def_epic_phase',
      trigger: 'on_shield_break',
      label: 'Phase Evasion',
      description: 'When Shield breaks, gain +15% Damage Reduction for 3.5s (14s ICD).',
      cooldownMs: 14000,
      tempDamageReductionPct: 15,
      durationMs: 3500,
    },
  },
  {
    id: 'def_immortal_bulwark',
    name: 'Celestial Bulwark Matrix',
    slot: 'defensive',
    rarity: 'legendary',
    description: 'Orbital-grade defensive fortress array miniaturized for fighters.',
    passiveText: '+53 Max HP · +53 Max Shield · 15% DR · +19% Shield Regen',
    costCredits: EQUIPMENT_PRICING.def_immortal_bulwark.credits,
    costCrystals: EQUIPMENT_PRICING.def_immortal_bulwark.crystals,
    maxLevel: 5,
    bonuses: { maxHpFlat: 28, maxShieldFlat: 28, damageReductionPct: 8, shieldRegenPct: 10 },
    rarityEffect: {
      id: 'def_leg_bastion',
      trigger: 'on_shield_break',
      label: 'Aegis Counter-Pulse',
      description: 'On Shield break, restore +14 Shield and gain +10% Move Speed for 3s (13s ICD).',
      cooldownMs: 13000,
      shieldRestore: 14,
      tempMoveSpeedPct: 10,
      durationMs: 3000,
    },
  },
  {
    id: 'def_phoenix_barrier',
    name: 'Phoenix Core Barrier',
    slot: 'defensive',
    rarity: 'mythic',
    description: 'Self-regenerating stellar containment shell engineered to survive dreadnought sieges.',
    passiveText: '+71 Max HP · +75 Max Shield · 19% DR · +33% Shield Regen',
    costCredits: EQUIPMENT_PRICING.def_phoenix_barrier.credits,
    costCrystals: EQUIPMENT_PRICING.def_phoenix_barrier.crystals,
    maxLevel: 5,
    bonuses: { maxHpFlat: 30, maxShieldFlat: 32, damageReductionPct: 8, shieldRegenPct: 14 },
    rarityEffect: {
      id: 'def_mythic_phoenix',
      trigger: 'on_shield_break',
      label: 'Phoenix Reconstitution',
      description: 'On Shield break, unleashes emergency +22 Shield & +8 Hull HP surge (16s ICD).',
      cooldownMs: 16000,
      shieldRestore: 22,
      hpRestore: 8,
    },
  },

  // =========================================================================
  // UTILITY (5: Common, Rare, Epic, Legendary, Mythic)
  // =========================================================================
  {
    id: 'util_ion_thruster',
    name: 'Ion Vector Thrusters',
    slot: 'utility',
    rarity: 'common',
    description: 'Micro-gimbal nozzles improving lateral dodging.',
    passiveText: '+30 Movement Speed',
    costCredits: EQUIPMENT_PRICING.util_ion_thruster.credits,
    costCrystals: EQUIPMENT_PRICING.util_ion_thruster.crystals,
    maxLevel: 5,
    bonuses: { moveSpeedFlat: 30 },
  },
  {
    id: 'util_salvage_magnet',
    name: 'Graviton Salvage Array',
    slot: 'utility',
    rarity: 'rare',
    description: 'Pulls battlefield drops from farther away and boosts credit yield.',
    passiveText: '+43% Pickup Range · +11% Credits Earned',
    costCredits: EQUIPMENT_PRICING.util_salvage_magnet.credits,
    costCrystals: EQUIPMENT_PRICING.util_salvage_magnet.crystals,
    maxLevel: 5,
    bonuses: { pickupRangePct: 34, creditBonusPct: 9 },
    rarityEffect: {
      id: 'util_rare_salvage',
      trigger: 'on_pickup',
      label: 'Tractor Pulse',
      description: 'Collecting field drops restores +3 Shield (5s ICD).',
      cooldownMs: 5000,
      shieldRestore: 3,
    },
  },
  {
    id: 'util_warp_actuator',
    name: 'Subspace Dash Actuator',
    slot: 'utility',
    rarity: 'epic',
    description: 'Compresses dash capacitor recovery time.',
    passiveText: '-22% Dash Cooldown · +40 Movement Speed',
    costCredits: EQUIPMENT_PRICING.util_warp_actuator.credits,
    costCrystals: EQUIPMENT_PRICING.util_warp_actuator.crystals,
    maxLevel: 5,
    bonuses: { dashCooldownPct: 14, moveSpeedFlat: 26 },
    rarityEffect: {
      id: 'util_epic_slip',
      trigger: 'on_dash',
      label: 'Afterburner Trail',
      description: 'Dashing grants +12% Fire Rate for 2.2s (7s ICD).',
      cooldownMs: 7000,
      tempFireRatePct: 12,
      durationMs: 2200,
    },
  },
  {
    id: 'util_astral_navigator',
    name: 'Astral Chrono-Gyro',
    slot: 'utility',
    rarity: 'legendary',
    description: 'Quantum gyroscopic stabilizer maximizing agility and salvage.',
    passiveText: '+53 Speed · +61% Magnet · +19% Credits · -21% Dash CD',
    costCredits: EQUIPMENT_PRICING.util_astral_navigator.credits,
    costCrystals: EQUIPMENT_PRICING.util_astral_navigator.crystals,
    maxLevel: 5,
    bonuses: { moveSpeedFlat: 28, pickupRangePct: 32, creditBonusPct: 10, dashCooldownPct: 11 },
    rarityEffect: {
      id: 'util_leg_slip',
      trigger: 'on_pickup',
      label: 'Momentum Relay',
      description: 'Collecting field drops trims 0.6s Special & Dash cooldown (6s ICD).',
      cooldownMs: 6000,
      specialCdTrimMs: 600,
      dashCdTrimMs: 600,
    },
  },
  {
    id: 'util_quantum_slipstream',
    name: 'Quantum Slipstream Array',
    slot: 'utility',
    rarity: 'mythic',
    description: 'Subspace field generator linking thruster evasion, salvage magnetism, and cooldown cycling.',
    passiveText: '+66 Speed · +80% Magnet · +26% Credits · -28% Dash CD · -12% Special CD',
    costCredits: EQUIPMENT_PRICING.util_quantum_slipstream.credits,
    costCrystals: EQUIPMENT_PRICING.util_quantum_slipstream.crystals,
    maxLevel: 5,
    bonuses: {
      moveSpeedFlat: 28,
      pickupRangePct: 34,
      creditBonusPct: 11,
      dashCooldownPct: 12,
      specialCooldownPct: 5,
    },
    rarityEffect: {
      id: 'util_mythic_slipstream',
      trigger: 'on_dash',
      label: 'Quantum Slipstream',
      description: 'Dashing grants +18% Move Speed & +10% Weapon Damage for 3s (6.5s ICD).',
      cooldownMs: 6500,
      tempMoveSpeedPct: 18,
      tempDamagePct: 10,
      durationMs: 3000,
    },
  },

  // =========================================================================
  // SPECIAL (5: Common, Rare, Epic, Legendary, Mythic)
  // =========================================================================
  {
    id: 'spec_emp_inducer',
    name: 'Overdrive Inducer',
    slot: 'special',
    rarity: 'common',
    description: 'Amplifies discharge burst output of active Special systems.',
    passiveText: '+14% Special Power',
    costCredits: EQUIPMENT_PRICING.spec_emp_inducer.credits,
    costCrystals: EQUIPMENT_PRICING.spec_emp_inducer.crystals,
    maxLevel: 5,
    bonuses: { specialPowerPct: 14 },
  },
  {
    id: 'spec_chrono_cell',
    name: 'Chrono-Recycle Cell',
    slot: 'special',
    rarity: 'rare',
    description: 'Captures waste heat to cycle Special abilities sooner.',
    passiveText: '-14% Special Cooldown · +10% Special Power',
    costCredits: EQUIPMENT_PRICING.spec_chrono_cell.credits,
    costCrystals: EQUIPMENT_PRICING.spec_chrono_cell.crystals,
    maxLevel: 5,
    bonuses: { specialCooldownPct: 11, specialPowerPct: 8 },
    rarityEffect: {
      id: 'spec_rare_flux',
      trigger: 'on_special',
      label: 'Flux Recovery',
      description: 'Activating Special restores +8 Shield (10s ICD).',
      cooldownMs: 10000,
      shieldRestore: 8,
    },
  },
  {
    id: 'spec_nova_prism',
    name: 'Hyper-Prism Resonator',
    slot: 'special',
    rarity: 'epic',
    description: 'Synchronizes EMP, Chrono, Gravity, and Drone modules for cohesive tactical pressure.',
    passiveText: '+25% Special Power · -17% Special CD · +12% Drone Power',
    costCredits: EQUIPMENT_PRICING.spec_nova_prism.credits,
    costCrystals: EQUIPMENT_PRICING.spec_nova_prism.crystals,
    maxLevel: 5,
    bonuses: { specialPowerPct: 16, specialCooldownPct: 11, dronePowerPct: 8 },
    rarityEffect: {
      id: 'spec_epic_sync',
      trigger: 'on_special',
      label: 'Tactical Resonance',
      description: 'Activating Special grants +12% Fire Rate for 3.5s (10s ICD).',
      cooldownMs: 10000,
      tempFireRatePct: 12,
      durationMs: 3500,
    },
  },
  {
    id: 'spec_drone_command',
    name: 'Tactical Drone Command Link',
    slot: 'special',
    rarity: 'legendary',
    description: 'Dedicated tactical uplink amplifying autonomous Companion Drones and Special timing.',
    passiveText: '+27% Drone Power · +23% Special Power · -17% Special CD',
    costCredits: EQUIPMENT_PRICING.spec_drone_command.credits,
    costCrystals: EQUIPMENT_PRICING.spec_drone_command.crystals,
    maxLevel: 5,
    bonuses: { dronePowerPct: 14, specialPowerPct: 12, specialCooldownPct: 9 },
    rarityEffect: {
      id: 'spec_leg_command',
      trigger: 'on_special',
      label: 'Drone Overclock',
      description: 'Activating Special surges Weapon & Drone output by +14% for 4s (10s ICD).',
      cooldownMs: 10000,
      tempDamagePct: 14,
      durationMs: 4000,
    },
  },
  {
    id: 'spec_omega_relayer',
    name: 'Omega Astral Conduit',
    slot: 'special',
    rarity: 'mythic',
    description: 'Apex alien energy relay empowering Specials, Companion Drones, and main weapons.',
    passiveText: '+38% Special Power · -24% Special CD · +24% Drone Power · +12% DMG',
    costCredits: EQUIPMENT_PRICING.spec_omega_relayer.credits,
    costCrystals: EQUIPMENT_PRICING.spec_omega_relayer.crystals,
    maxLevel: 5,
    bonuses: { specialPowerPct: 16, specialCooldownPct: 10, dronePowerPct: 10, damagePct: 5 },
    rarityEffect: {
      id: 'spec_mythic_omega',
      trigger: 'on_special',
      label: 'Astral Overdrive',
      description: 'Activating Special restores +14 Shield and boosts Damage & Crit DMG +15% for 4s (10s ICD).',
      cooldownMs: 10000,
      shieldRestore: 14,
      tempDamagePct: 15,
      tempCritDamagePct: 15,
      durationMs: 4000,
    },
  },
];

export const EQUIPMENT_BY_ID: Record<string, EquipmentDefinition> = Object.fromEntries(
  EQUIPMENT_LIST.map((item) => [item.id, item])
);

export function getEquipmentUpgradeCost(def: EquipmentDefinition, currentLevel: number): { credits: number; crystals: number } {
  return calculateEquipmentUpgradeCost(def.rarity, currentLevel);
}

export function scaleEquipmentBonuses(def: EquipmentDefinition, level: number): EquipmentStatsBonus {
  const clampedLevel = Math.max(1, Math.min(def.maxLevel, Math.floor(level)));
  const levelFactor = 1 + (clampedLevel - 1) * 0.2;
  const rarityMult = RARITY_CONFIG[def.rarity]?.statMultiplier ?? 1;
  const totalFactor = rarityMult * levelFactor;
  const b = def.bonuses;
  return {
    damagePct: b.damagePct ? Math.round(b.damagePct * totalFactor) : 0,
    fireRatePct: b.fireRatePct ? Math.round(b.fireRatePct * totalFactor) : 0,
    critChancePct: b.critChancePct ? Math.round(b.critChancePct * totalFactor) : 0,
    critDamagePct: b.critDamagePct ? Math.round(b.critDamagePct * totalFactor) : 0,
    maxHpFlat: b.maxHpFlat ? Math.round(b.maxHpFlat * totalFactor) : 0,
    maxShieldFlat: b.maxShieldFlat ? Math.round(b.maxShieldFlat * totalFactor) : 0,
    shieldRegenPct: b.shieldRegenPct ? Math.round(b.shieldRegenPct * totalFactor) : 0,
    damageReductionPct: b.damageReductionPct ? Math.round(b.damageReductionPct * totalFactor) : 0,
    moveSpeedFlat: b.moveSpeedFlat ? Math.round(b.moveSpeedFlat * totalFactor) : 0,
    pickupRangePct: b.pickupRangePct ? Math.round(b.pickupRangePct * totalFactor) : 0,
    creditBonusPct: b.creditBonusPct ? Math.round(b.creditBonusPct * totalFactor) : 0,
    specialPowerPct: b.specialPowerPct ? Math.round(b.specialPowerPct * totalFactor) : 0,
    specialCooldownPct: b.specialCooldownPct ? Math.round(b.specialCooldownPct * totalFactor) : 0,
    dashCooldownPct: b.dashCooldownPct ? Math.round(b.dashCooldownPct * totalFactor) : 0,
    dronePowerPct: b.dronePowerPct ? Math.round(b.dronePowerPct * totalFactor) : 0,
  };
}
