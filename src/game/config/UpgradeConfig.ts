import {
  calculateFleetUpgradeCost,
  calculateWeaponUpgradeCost,
  FLEET_UPGRADE_ECONOMY,
} from './EconomyConfig';
import type { WeaponId } from './WeaponConfig';

export type UpgradeId =
  | 'weapon_damage'
  | 'fire_rate'
  | 'max_health'
  | 'shield_capacity'
  | 'movement_speed'
  | 'critical_chance'
  | 'critical_damage'
  | 'special_cooldown';

export type CurrencyType = 'credits' | 'crystals';

export interface UpgradeDefinition {
  id: UpgradeId;
  name: string;
  description: string;
  maxLevel: number;
  baseCost: number;
  costMultiplier: number;
  crystalCostAtLevel?: number; // level >= this adds crystal cost
  baseCrystalCost?: number;
  perLevelBonus: number;
  unitLabel: string;
  formatValue: (level: number) => string;
}

export const UPGRADES: Record<UpgradeId, UpgradeDefinition> = {
  weapon_damage: {
    id: 'weapon_damage',
    name: 'Weapon Damage',
    description: 'Increases primary weapon output across all six weapon modules.',
    maxLevel: 20,
    ...FLEET_UPGRADE_ECONOMY.weapon_damage,
    perLevelBonus: 0.025,
    unitLabel: '% DMG',
    formatValue: (lvl) => `+${Number((lvl * 2.5).toFixed(1))}%`,
  },
  fire_rate: {
    id: 'fire_rate',
    name: 'Fire Rate',
    description: 'Reduces weapon cycle delay for faster sustained fire.',
    maxLevel: 20,
    ...FLEET_UPGRADE_ECONOMY.fire_rate,
    perLevelBonus: 0.02,
    unitLabel: '% Rate',
    formatValue: (lvl) => `+${lvl * 2}%`,
  },
  max_health: {
    id: 'max_health',
    name: 'Maximum Health',
    description: 'Reinforces titanium hull plating to survive heavier impacts.',
    maxLevel: 20,
    ...FLEET_UPGRADE_ECONOMY.max_health,
    perLevelBonus: 5,
    unitLabel: 'HP',
    formatValue: (lvl) => `+${lvl * 5} HP`,
  },
  shield_capacity: {
    id: 'shield_capacity',
    name: 'Shield Capacity',
    description: 'Expands energy barrier reserve and passive recharge buffer.',
    maxLevel: 20,
    ...FLEET_UPGRADE_ECONOMY.shield_capacity,
    perLevelBonus: 4,
    unitLabel: 'SHD',
    formatValue: (lvl) => `+${lvl * 4} SHD`,
  },
  movement_speed: {
    id: 'movement_speed',
    name: 'Movement Speed',
    description: 'Boosts thruster response and top maneuver speed.',
    maxLevel: 20,
    ...FLEET_UPGRADE_ECONOMY.movement_speed,
    perLevelBonus: 4.5,
    unitLabel: 'SPD',
    formatValue: (lvl) => `+${Math.round(lvl * 4.5)} SPD`,
  },
  critical_chance: {
    id: 'critical_chance',
    name: 'Critical Chance',
    description: 'Improves targeting telemetry for high-multiplier critical strikes.',
    maxLevel: 20,
    ...FLEET_UPGRADE_ECONOMY.critical_chance,
    perLevelBonus: 0.008,
    unitLabel: '% Crit',
    formatValue: (lvl) => `+${Number((lvl * 0.8).toFixed(1))}%`,
  },
  critical_damage: {
    id: 'critical_damage',
    name: 'Critical Damage',
    description: 'Amplifies critical strike damage multiplier across weapons and specials.',
    maxLevel: 20,
    ...FLEET_UPGRADE_ECONOMY.critical_damage,
    perLevelBonus: 0.02,
    unitLabel: '% Crit DMG',
    formatValue: (lvl) => `+${lvl * 2}%`,
  },
  special_cooldown: {
    id: 'special_cooldown',
    name: 'Special Power Cooldown Reduction',
    description: 'Accelerates Special Power recharge speed for faster tactical deployment.',
    maxLevel: 20,
    ...FLEET_UPGRADE_ECONOMY.special_cooldown,
    perLevelBonus: 0.012,
    unitLabel: '% CDR',
    formatValue: (lvl) => {
      const clampedLevel = Math.max(0, Math.min(20, Math.floor(lvl)));
      const totalCdrPct = Number((clampedLevel * 1.2).toFixed(1));
      return `+${totalCdrPct}%`;
    },
  },
};

export const UPGRADE_LIST: UpgradeDefinition[] = [
  UPGRADES.weapon_damage,
  UPGRADES.fire_rate,
  UPGRADES.max_health,
  UPGRADES.shield_capacity,
  UPGRADES.movement_speed,
  UPGRADES.critical_chance,
  UPGRADES.critical_damage,
  UPGRADES.special_cooldown,
];

export function getUpgradeCost(def: UpgradeDefinition, currentLevel: number): { credits: number; crystals: number } {
  return calculateFleetUpgradeCost(def.id, currentLevel, def.maxLevel);
}

export function getWeaponUpgradeCost(
  currentLevel: number,
  weaponId: WeaponId = 'plasma'
): { credits: number; crystals: number } {
  return calculateWeaponUpgradeCost(currentLevel, weaponId);
}
