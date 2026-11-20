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
  damageReductionPct?: number;
  moveSpeedFlat?: number;
  pickupRangePct?: number;
  creditBonusPct?: number;
  specialPowerPct?: number;
  specialCooldownPct?: number;
  dashCooldownPct?: number;
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
  bonuses: EquipmentStatsBonus; // Base level 1 values; each level adds +20%
}

export const EQUIPMENT_LIST: EquipmentDefinition[] = [
  // OFFENSIVE (4)
  {
    id: 'off_plasma_coil',
    name: 'Pulse Capacitor',
    slot: 'offensive',
    rarity: 'common',
    description: 'Stabilizes plasma discharge chambers for steady damage.',
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
    description: 'Supercools weapon rails to raise fire cadence and precision.',
    passiveText: '+12% Fire Rate · +6% Weapon Damage',
    costCredits: EQUIPMENT_PRICING.off_cryo_accelerator.credits,
    costCrystals: EQUIPMENT_PRICING.off_cryo_accelerator.crystals,
    maxLevel: 5,
    bonuses: { fireRatePct: 12, damagePct: 6 },
  },
  {
    id: 'off_quantum_sight',
    name: 'Quantum Targeting Lens',
    slot: 'offensive',
    rarity: 'epic',
    description: 'Predictive lock-on optics exposing structural weak points.',
    passiveText: '+10% Critical Chance · +25% Critical Damage',
    costCredits: EQUIPMENT_PRICING.off_quantum_sight.credits,
    costCrystals: EQUIPMENT_PRICING.off_quantum_sight.crystals,
    maxLevel: 5,
    bonuses: { critChancePct: 10, critDamagePct: 25 },
  },
  {
    id: 'off_singularity_core',
    name: 'Singularity Warhead Core',
    slot: 'offensive',
    rarity: 'mythic',
    description: 'Zero-point energy amplifier forged from Void Emperor wreckage.',
    passiveText: '+24% Weapon Damage · +12% Fire Rate · +8% Crit',
    costCredits: EQUIPMENT_PRICING.off_singularity_core.credits,
    costCrystals: EQUIPMENT_PRICING.off_singularity_core.crystals,
    maxLevel: 5,
    bonuses: { damagePct: 24, fireRatePct: 12, critChancePct: 8 },
  },

  // DEFENSIVE (4)
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
    passiveText: '+35 Max Shield · +15 Max HP',
    costCredits: EQUIPMENT_PRICING.def_aegis_emitter.credits,
    costCrystals: EQUIPMENT_PRICING.def_aegis_emitter.crystals,
    maxLevel: 5,
    bonuses: { maxShieldFlat: 35, maxHpFlat: 15 },
  },
  {
    id: 'def_phase_armor',
    name: 'Void-Weave Deflector',
    slot: 'defensive',
    rarity: 'epic',
    description: 'Refracts hostile plasma energy before hull contact.',
    passiveText: '12% Damage Reduction · +35 Max Shield',
    costCredits: EQUIPMENT_PRICING.def_phase_armor.credits,
    costCrystals: EQUIPMENT_PRICING.def_phase_armor.crystals,
    maxLevel: 5,
    bonuses: { damageReductionPct: 12, maxShieldFlat: 35 },
  },
  {
    id: 'def_immortal_bulwark',
    name: 'Celestial Bulwark Matrix',
    slot: 'defensive',
    rarity: 'legendary',
    description: 'Orbital-grade defensive fortress array miniaturized for fighters.',
    passiveText: '+55 Max HP · +55 Max Shield · 16% Damage Reduction',
    costCredits: EQUIPMENT_PRICING.def_immortal_bulwark.credits,
    costCrystals: EQUIPMENT_PRICING.def_immortal_bulwark.crystals,
    maxLevel: 5,
    bonuses: { maxHpFlat: 55, maxShieldFlat: 55, damageReductionPct: 16 },
  },

  // UTILITY (4)
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
    passiveText: '+45% Pickup Range · +12% Credits Earned',
    costCredits: EQUIPMENT_PRICING.util_salvage_magnet.credits,
    costCrystals: EQUIPMENT_PRICING.util_salvage_magnet.crystals,
    maxLevel: 5,
    bonuses: { pickupRangePct: 45, creditBonusPct: 12 },
  },
  {
    id: 'util_warp_actuator',
    name: 'Subspace Dash Actuator',
    slot: 'utility',
    rarity: 'epic',
    description: 'Compresses dash capacitor recovery time.',
    passiveText: '-24% Dash Cooldown · +40 Movement Speed',
    costCredits: EQUIPMENT_PRICING.util_warp_actuator.credits,
    costCrystals: EQUIPMENT_PRICING.util_warp_actuator.crystals,
    maxLevel: 5,
    bonuses: { dashCooldownPct: 24, moveSpeedFlat: 40 },
  },
  {
    id: 'util_astral_navigator',
    name: 'Astral Chrono-Gyro',
    slot: 'utility',
    rarity: 'legendary',
    description: 'Quantum gyroscopic stabilizer maximizing agility and salvage.',
    passiveText: '+55 Speed · +60% Magnet Range · +20% Credits · -20% Dash CD',
    costCredits: EQUIPMENT_PRICING.util_astral_navigator.credits,
    costCrystals: EQUIPMENT_PRICING.util_astral_navigator.crystals,
    maxLevel: 5,
    bonuses: { moveSpeedFlat: 55, pickupRangePct: 60, creditBonusPct: 20, dashCooldownPct: 20 },
  },

  // SPECIAL (4)
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
    passiveText: '-15% Special Cooldown · +10% Special Power',
    costCredits: EQUIPMENT_PRICING.spec_chrono_cell.credits,
    costCrystals: EQUIPMENT_PRICING.spec_chrono_cell.crystals,
    maxLevel: 5,
    bonuses: { specialCooldownPct: 15, specialPowerPct: 10 },
  },
  {
    id: 'spec_nova_prism',
    name: 'Hyper-Prism Resonator',
    slot: 'special',
    rarity: 'epic',
    description: 'Synchronizes EMP, Orbital, and Photon arrays for devastating bursts.',
    passiveText: '+28% Special Power · -18% Special Cooldown',
    costCredits: EQUIPMENT_PRICING.spec_nova_prism.credits,
    costCrystals: EQUIPMENT_PRICING.spec_nova_prism.crystals,
    maxLevel: 5,
    bonuses: { specialPowerPct: 28, specialCooldownPct: 18 },
  },
  {
    id: 'spec_omega_relayer',
    name: 'Omega Astral Conduit',
    slot: 'special',
    rarity: 'mythic',
    description: 'Apex alien energy relay empowering Specials and main weapons.',
    passiveText: '+40% Special Power · -25% Special Cooldown · +10% Damage',
    costCredits: EQUIPMENT_PRICING.spec_omega_relayer.credits,
    costCrystals: EQUIPMENT_PRICING.spec_omega_relayer.crystals,
    maxLevel: 5,
    bonuses: { specialPowerPct: 40, specialCooldownPct: 25, damagePct: 10 },
  },
];

export const EQUIPMENT_BY_ID: Record<string, EquipmentDefinition> = Object.fromEntries(
  EQUIPMENT_LIST.map((item) => [item.id, item])
);

export function getEquipmentUpgradeCost(def: EquipmentDefinition, currentLevel: number): { credits: number; crystals: number } {
  return calculateEquipmentUpgradeCost(def.rarity, currentLevel);
}

export function scaleEquipmentBonuses(def: EquipmentDefinition, level: number): EquipmentStatsBonus {
  const factor = 1 + (Math.max(1, level) - 1) * 0.2;
  const b = def.bonuses;
  return {
    damagePct: b.damagePct ? Math.round(b.damagePct * factor) : 0,
    fireRatePct: b.fireRatePct ? Math.round(b.fireRatePct * factor) : 0,
    critChancePct: b.critChancePct ? Math.round(b.critChancePct * factor) : 0,
    critDamagePct: b.critDamagePct ? Math.round(b.critDamagePct * factor) : 0,
    maxHpFlat: b.maxHpFlat ? Math.round(b.maxHpFlat * factor) : 0,
    maxShieldFlat: b.maxShieldFlat ? Math.round(b.maxShieldFlat * factor) : 0,
    damageReductionPct: b.damageReductionPct ? Math.round(b.damageReductionPct * factor) : 0,
    moveSpeedFlat: b.moveSpeedFlat ? Math.round(b.moveSpeedFlat * factor) : 0,
    pickupRangePct: b.pickupRangePct ? Math.round(b.pickupRangePct * factor) : 0,
    creditBonusPct: b.creditBonusPct ? Math.round(b.creditBonusPct * factor) : 0,
    specialPowerPct: b.specialPowerPct ? Math.round(b.specialPowerPct * factor) : 0,
    specialCooldownPct: b.specialCooldownPct ? Math.round(b.specialCooldownPct * factor) : 0,
    dashCooldownPct: b.dashCooldownPct ? Math.round(b.dashCooldownPct * factor) : 0,
  };
}
