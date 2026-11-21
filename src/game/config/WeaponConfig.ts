import { WEAPON_ECONOMY } from './EconomyConfig';

export type WeaponId =
  | 'plasma'
  | 'dual_laser'
  | 'spread'
  | 'homing'
  | 'beam'
  | 'lightning';

export type SpecialId = 'emp_nova' | 'orbital_strike' | 'photon_barrage';

export interface WeaponDefinition {
  id: WeaponId;
  hotkey: number;
  name: string;
  shortName: string;
  typeLabel: string;
  description: string;
  fireRateMs: number;
  damage: number;
  projectileSpeed: number;
  rangeLabel: string;
  specialProperty: string;
  colorHex: string;
  colorNum: number;
  glowNum: number;
  unlockLevel: number;
  unlockCredits: number;
  unlockCrystals: number;
  maxWeaponLevel: number;
}

export interface SpecialDefinition {
  id: SpecialId;
  name: string;
  description: string;
  cooldownMs: number;
  damage: number;
  colorHex: string;
  colorNum: number;
}

export const WEAPONS: Record<WeaponId, WeaponDefinition> = {
  plasma: {
    id: 'plasma',
    hotkey: 1,
    name: 'Plasma Cannon',
    shortName: 'Plasma',
    typeLabel: 'Energy Bolt',
    description: 'Balanced high-energy plasma bolts with crisp single-target impact.',
    fireRateMs: 175,
    damage: 16,
    projectileSpeed: 840,
    rangeLabel: 'Long',
    specialProperty: 'Balanced velocity + Lv8+ twin bolts',
    colorHex: '#38BDF8',
    colorNum: 0x38bdf8,
    glowNum: 0x0284c7,
    unlockLevel: WEAPON_ECONOMY.plasma.unlockLevel,
    unlockCredits: WEAPON_ECONOMY.plasma.unlockCredits,
    unlockCrystals: WEAPON_ECONOMY.plasma.unlockCrystals,
    maxWeaponLevel: 15,
  },
  dual_laser: {
    id: 'dual_laser',
    hotkey: 2,
    name: 'Dual Laser',
    shortName: 'Dual Laser',
    typeLabel: 'Twin Laser',
    description: 'Twin rapid-cycle coherent beams for steady sustained DPS.',
    fireRateMs: 145,
    damage: 9,
    projectileSpeed: 980,
    rangeLabel: 'Full Screen',
    specialProperty: 'Ultra-fast bolt velocity + Lv12+ triple lane',
    colorHex: '#22D3EE',
    colorNum: 0x22d3ee,
    glowNum: 0x06b6d4,
    unlockLevel: WEAPON_ECONOMY.dual_laser.unlockLevel,
    unlockCredits: WEAPON_ECONOMY.dual_laser.unlockCredits,
    unlockCrystals: WEAPON_ECONOMY.dual_laser.unlockCrystals,
    maxWeaponLevel: 15,
  },
  beam: {
    id: 'beam',
    hotkey: 3,
    name: 'Energy Beam',
    shortName: 'Beam',
    typeLabel: 'Piercing Rail',
    description: 'Piercing hyper-focused rail beam slicing entire vertical columns.',
    fireRateMs: 105,
    damage: 9,
    projectileSpeed: 0,
    rangeLabel: 'Instant Column',
    specialProperty: 'Pierces all enemies in line instantaneously',
    colorHex: '#60A5FA',
    colorNum: 0x60a5fa,
    glowNum: 0x3b82f6,
    unlockLevel: WEAPON_ECONOMY.beam.unlockLevel,
    unlockCredits: WEAPON_ECONOMY.beam.unlockCredits,
    unlockCrystals: WEAPON_ECONOMY.beam.unlockCrystals,
    maxWeaponLevel: 15,
  },
  homing: {
    id: 'homing',
    hotkey: 4,
    name: 'Homing Missile',
    shortName: 'Missiles',
    typeLabel: 'Guided Warhead',
    description: 'Autonomous thermal warheads that lock onto hostile ships.',
    fireRateMs: 380,
    damage: 21,
    projectileSpeed: 540,
    rangeLabel: 'Auto-Seek 480px',
    specialProperty: 'Twin auto-lock seekers · 3rd warhead at Lv12+',
    colorHex: '#F59E0B',
    colorNum: 0xf59e0b,
    glowNum: 0xd97706,
    unlockLevel: WEAPON_ECONOMY.homing.unlockLevel,
    unlockCredits: WEAPON_ECONOMY.homing.unlockCredits,
    unlockCrystals: WEAPON_ECONOMY.homing.unlockCrystals,
    maxWeaponLevel: 15,
  },
  spread: {
    id: 'spread',
    hotkey: 5,
    name: 'Spread Shot',
    shortName: 'Spread',
    typeLabel: 'Scatter Cone',
    description: 'Wide multi-bolt fan salvo built for swarm control and close burst.',
    fireRateMs: 300,
    damage: 9,
    projectileSpeed: 740,
    rangeLabel: 'Medium-Wide',
    specialProperty: '5-way cone (7-way at Lv12+)',
    colorHex: '#A855F7',
    colorNum: 0xa855f7,
    glowNum: 0x7e22ce,
    unlockLevel: WEAPON_ECONOMY.spread.unlockLevel,
    unlockCredits: WEAPON_ECONOMY.spread.unlockCredits,
    unlockCrystals: WEAPON_ECONOMY.spread.unlockCrystals,
    maxWeaponLevel: 15,
  },
  lightning: {
    id: 'lightning',
    hotkey: 6,
    name: 'Chain Lightning',
    shortName: 'Lightning',
    typeLabel: 'Voltaic Arc',
    description: 'Arcing voltaic discharge jumping across multiple hostile craft.',
    fireRateMs: 325,
    damage: 19,
    projectileSpeed: 0,
    rangeLabel: 'Arc 540px',
    specialProperty: 'Chains up to 4 targets (5 at Lv12+) · 82% bounce',
    colorHex: '#67E8F9',
    colorNum: 0x67e8f9,
    glowNum: 0x0ea5e9,
    unlockLevel: WEAPON_ECONOMY.lightning.unlockLevel,
    unlockCredits: WEAPON_ECONOMY.lightning.unlockCredits,
    unlockCrystals: WEAPON_ECONOMY.lightning.unlockCrystals,
    maxWeaponLevel: 15,
  },
};

export const WEAPON_LIST: WeaponDefinition[] = [
  WEAPONS.plasma,
  WEAPONS.dual_laser,
  WEAPONS.beam,
  WEAPONS.homing,
  WEAPONS.spread,
  WEAPONS.lightning,
];

export const SPECIAL_ATTACKS: Record<SpecialId, SpecialDefinition> = {
  emp_nova: {
    id: 'emp_nova',
    name: 'EMP Nova',
    description: 'Expands an electromagnetic ring erasing enemy projectiles and dealing heavy radial shock.',
    cooldownMs: 10000,
    damage: 140,
    colorHex: '#38BDF8',
    colorNum: 0x38bdf8,
  },
  orbital_strike: {
    id: 'orbital_strike',
    name: 'Orbital Strike',
    description: 'Calls down twin orbital lance beams that sweep across the battlefield.',
    cooldownMs: 12000,
    damage: 185,
    colorHex: '#A855F7',
    colorNum: 0xa855f7,
  },
  photon_barrage: {
    id: 'photon_barrage',
    name: 'Photon Barrage',
    description: 'Launches 14 rapid micro-seeker warheads prioritizing high-value hostiles.',
    cooldownMs: 11000,
    damage: 165,
    colorHex: '#F59E0B',
    colorNum: 0xf59e0b,
  },
};

export const SPECIAL_LIST: SpecialDefinition[] = [
  SPECIAL_ATTACKS.emp_nova,
  SPECIAL_ATTACKS.orbital_strike,
  SPECIAL_ATTACKS.photon_barrage,
];

export function getWeaponDamageAtLevel(def: WeaponDefinition, level: number): number {
  const maxSteps = Math.max(1, def.maxWeaponLevel - 1);
  const ratio = Math.min(1, Math.max(0, Math.max(1, level) - 1) / maxSteps);
  return Math.round(def.damage * (1 + ratio * 0.45));
}

export function getWeaponFireRateAtLevel(def: WeaponDefinition, level: number): number {
  const maxSteps = Math.max(1, def.maxWeaponLevel - 1);
  const ratio = Math.min(1, Math.max(0, Math.max(1, level) - 1) / maxSteps);
  return Math.round(def.fireRateMs / (1 + ratio * 0.15));
}
