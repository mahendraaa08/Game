import { WEAPON_ECONOMY } from './EconomyConfig';
import {
  getWeaponEvolutionStage,
  WEAPON_RUNTIME_TUNING,
} from './WeaponEvolutionConfig';

export type WeaponId =
  | 'plasma'
  | 'dual_laser'
  | 'spread'
  | 'beam'
  | 'homing'
  | 'lightning';

export type SpecialId = 'emp_nova' | 'chrono_singularity' | 'gravity_well';

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
  durationMs?: number;
  radiusPx?: number;
  tickIntervalMs?: number;
  colorHex: string;
  colorNum: number;
}

export const MAX_WEAPON_LEVEL = 20;

export const WEAPONS: Record<WeaponId, WeaponDefinition> = {
  plasma: {
    id: 'plasma',
    hotkey: 1,
    name: 'Plasma Cannon',
    shortName: 'Plasma',
    typeLabel: 'Energy Bolt',
    description: 'Balanced single-bolt plasma cannon built for reliable precision at any range.',
    fireRateMs: 180,
    damage: 18,
    projectileSpeed: WEAPON_RUNTIME_TUNING.plasma.baseSpeed,
    rangeLabel: 'Long',
    specialProperty: 'Balanced single bolt · Lv12 Enhanced · Lv20 Plasma Burst',
    colorHex: '#38BDF8',
    colorNum: 0x38bdf8,
    glowNum: 0x0284c7,
    unlockLevel: WEAPON_ECONOMY.plasma.unlockLevel,
    unlockCredits: WEAPON_ECONOMY.plasma.unlockCredits,
    unlockCrystals: WEAPON_ECONOMY.plasma.unlockCrystals,
    maxWeaponLevel: MAX_WEAPON_LEVEL,
  },
  dual_laser: {
    id: 'dual_laser',
    hotkey: 2,
    name: 'Dual Laser',
    shortName: 'Dual Laser',
    typeLabel: 'Twin Laser',
    description: 'Twin rapid-cycle coherent wing lasers delivering relentless sustained fire.',
    fireRateMs: 135,
    damage: 8,
    projectileSpeed: WEAPON_RUNTIME_TUNING.dual_laser.baseSpeed,
    rangeLabel: 'Full Screen',
    specialProperty: 'Ultra-high fire rate · Lv12 Enhanced · Lv20 Central Rapid Barrage',
    colorHex: '#22D3EE',
    colorNum: 0x22d3ee,
    glowNum: 0x06b6d4,
    unlockLevel: WEAPON_ECONOMY.dual_laser.unlockLevel,
    unlockCredits: WEAPON_ECONOMY.dual_laser.unlockCredits,
    unlockCrystals: WEAPON_ECONOMY.dual_laser.unlockCrystals,
    maxWeaponLevel: MAX_WEAPON_LEVEL,
  },
  spread: {
    id: 'spread',
    hotkey: 3,
    name: 'Spread Shot',
    shortName: 'Spread',
    typeLabel: 'Scatter Fan',
    description: 'Symmetrical multi-bolt energy fan engineered for swarm control and flank coverage.',
    fireRateMs: 340,
    damage: 13,
    projectileSpeed: WEAPON_RUNTIME_TUNING.spread.baseSpeed,
    rangeLabel: 'Wide Fan',
    specialProperty: '4-way fan · Lv12 Enhanced · Lv20 Six-Way Spread',
    colorHex: '#A855F7',
    colorNum: 0xa855f7,
    glowNum: 0x7e22ce,
    unlockLevel: WEAPON_ECONOMY.spread.unlockLevel,
    unlockCredits: WEAPON_ECONOMY.spread.unlockCredits,
    unlockCrystals: WEAPON_ECONOMY.spread.unlockCrystals,
    maxWeaponLevel: MAX_WEAPON_LEVEL,
  },
  beam: {
    id: 'beam',
    hotkey: 4,
    name: 'Energy Beam',
    shortName: 'Beam',
    typeLabel: 'Continuous Rail',
    description: 'Continuous piercing laser column whose lock-on heat ramps damage over time.',
    fireRateMs: WEAPON_RUNTIME_TUNING.beam.baseDamageIntervalMs,
    damage: 12,
    projectileSpeed: 0,
    rangeLabel: 'Continuous Line',
    specialProperty: 'Lock-on ramp (+45%→+58%) · Lv12 Enhanced · Lv20 Autonomous Drone',
    colorHex: '#60A5FA',
    colorNum: 0x60a5fa,
    glowNum: 0x3b82f6,
    unlockLevel: WEAPON_ECONOMY.beam.unlockLevel,
    unlockCredits: WEAPON_ECONOMY.beam.unlockCredits,
    unlockCrystals: WEAPON_ECONOMY.beam.unlockCrystals,
    maxWeaponLevel: MAX_WEAPON_LEVEL,
  },
  homing: {
    id: 'homing',
    hotkey: 5,
    name: 'Homing Missile',
    shortName: 'Missiles',
    typeLabel: 'Guided AoE',
    description: 'Autonomous twin seeker warheads that track hostiles and detonate with AoE shockwaves.',
    fireRateMs: 410,
    damage: 22,
    projectileSpeed: WEAPON_RUNTIME_TUNING.homing.baseSpeed,
    rangeLabel: 'Seek 500px · AoE',
    specialProperty: 'Twin AoE seekers · Lv12 Enhanced Blast · Lv20 Heavy Missile',
    colorHex: '#F59E0B',
    colorNum: 0xf59e0b,
    glowNum: 0xd97706,
    unlockLevel: WEAPON_ECONOMY.homing.unlockLevel,
    unlockCredits: WEAPON_ECONOMY.homing.unlockCredits,
    unlockCrystals: WEAPON_ECONOMY.homing.unlockCrystals,
    maxWeaponLevel: MAX_WEAPON_LEVEL,
  },
  lightning: {
    id: 'lightning',
    hotkey: 6,
    name: 'Chain Lightning',
    shortName: 'Lightning',
    typeLabel: 'Voltaic Arc',
    description: 'Instant voltaic arc jumping across multiple hostiles with cascading crowd control.',
    fireRateMs: 255,
    damage: 20,
    projectileSpeed: 0,
    rangeLabel: 'Arc 540–600px',
    specialProperty: '4→6 chain jumps · Lv12 Enhanced · Lv20 Paralyzing Stun',
    colorHex: '#67E8F9',
    colorNum: 0x67e8f9,
    glowNum: 0x0ea5e9,
    unlockLevel: WEAPON_ECONOMY.lightning.unlockLevel,
    unlockCredits: WEAPON_ECONOMY.lightning.unlockCredits,
    unlockCrystals: WEAPON_ECONOMY.lightning.unlockCrystals,
    maxWeaponLevel: MAX_WEAPON_LEVEL,
  },
};

export const WEAPON_LIST: WeaponDefinition[] = [
  WEAPONS.plasma,
  WEAPONS.dual_laser,
  WEAPONS.spread,
  WEAPONS.beam,
  WEAPONS.homing,
  WEAPONS.lightning,
];

export const SPECIAL_ATTACKS: Record<SpecialId, SpecialDefinition> = {
  emp_nova: {
    id: 'emp_nova',
    name: 'EMP Nova',
    description:
      'Releases an expanding electromagnetic pulse across the arena, erasing all active enemy projectiles and dealing heavy instant AoE shock.',
    cooldownMs: 10000,
    damage: 145,
    radiusPx: 520,
    colorHex: '#38BDF8',
    colorNum: 0x38bdf8,
  },
  chrono_singularity: {
    id: 'chrono_singularity',
    name: 'Chrono Singularity',
    description:
      'Freezes enemies, bosses, and hostile projectiles in selective stasis for 3.6s while your ship, weapons, and drones fight at full speed.',
    cooldownMs: 13500,
    damage: 55,
    durationMs: 3600,
    radiusPx: 9999,
    colorHex: '#A855F7',
    colorNum: 0xa855f7,
  },
  gravity_well: {
    id: 'gravity_well',
    name: 'Gravity Well',
    description:
      'Creates an upper-arena black hole for 4.2s that pulls standard enemies inward and inflicts rapid periodic AoE damage (bosses take full damage without pull).',
    cooldownMs: 12000,
    damage: 34,
    durationMs: 4200,
    radiusPx: 235,
    tickIntervalMs: 280,
    colorHex: '#F59E0B',
    colorNum: 0xf59e0b,
  },
};

export const SPECIAL_LIST: SpecialDefinition[] = [
  SPECIAL_ATTACKS.emp_nova,
  SPECIAL_ATTACKS.chrono_singularity,
  SPECIAL_ATTACKS.gravity_well,
];

export function getWeaponDamageAtLevel(def: WeaponDefinition, level: number): number {
  const clamped = Math.max(1, Math.min(def.maxWeaponLevel, Math.floor(level)));
  const maxSteps = Math.max(1, def.maxWeaponLevel - 1);
  const ratio = (clamped - 1) / maxSteps;
  const stage = getWeaponEvolutionStage(clamped);
  const evoBonus = stage === 2 ? 0.14 : stage === 1 ? 0.08 : 0;
  return Math.round(def.damage * (1 + ratio * 0.52 + evoBonus));
}

export function getWeaponFireRateAtLevel(def: WeaponDefinition, level: number): number {
  const clamped = Math.max(1, Math.min(def.maxWeaponLevel, Math.floor(level)));
  const maxSteps = Math.max(1, def.maxWeaponLevel - 1);
  const ratio = (clamped - 1) / maxSteps;
  const stage = getWeaponEvolutionStage(clamped);

  if (def.id === 'beam') {
    const baseMs =
      stage >= 1
        ? WEAPON_RUNTIME_TUNING.beam.evo1DamageIntervalMs
        : WEAPON_RUNTIME_TUNING.beam.baseDamageIntervalMs;
    const rateScale = 1 + ratio * 0.12 + (stage === 2 ? 0.04 : 0);
    return Math.max(WEAPON_RUNTIME_TUNING.beam.minDamageIntervalMs, Math.round(baseMs / rateScale));
  }

  const evoRateBonus = stage === 2 ? 0.08 : stage === 1 ? 0.05 : 0;
  return Math.round(def.fireRateMs / (1 + ratio * 0.18 + evoRateBonus));
}

/**
 * Single authoritative Beam damage-tick cadence calculation integrating Fire Rate modifiers
 * cleanly with minimum interval cap (no double-dipping on damage).
 */
export function getEffectiveBeamTickIntervalMs(
  weaponLevel: number,
  totalFireRateMult: number
): number {
  const levelIntervalMs = getWeaponFireRateAtLevel(WEAPONS.beam, weaponLevel);
  const safeMult = Math.max(0.5, totalFireRateMult);
  return Math.max(
    WEAPON_RUNTIME_TUNING.beam.minDamageIntervalMs,
    Math.round(levelIntervalMs / safeMult)
  );
}
