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
  | 'missile_power'
  | 'special_power';

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
    maxLevel: 10,
    ...FLEET_UPGRADE_ECONOMY.weapon_damage,
    perLevelBonus: 0.08,
    unitLabel: '% DMG',
    formatValue: (lvl) => `+${lvl * 8}%`,
  },
  fire_rate: {
    id: 'fire_rate',
    name: 'Fire Rate',
    description: 'Reduces weapon cycle delay for faster sustained fire.',
    maxLevel: 10,
    ...FLEET_UPGRADE_ECONOMY.fire_rate,
    perLevelBonus: 0.06,
    unitLabel: '% Rate',
    formatValue: (lvl) => `+${lvl * 6}%`,
  },
  max_health: {
    id: 'max_health',
    name: 'Maximum Health',
    description: 'Reinforces titanium hull plating to survive heavier impacts.',
    maxLevel: 10,
    ...FLEET_UPGRADE_ECONOMY.max_health,
    perLevelBonus: 14,
    unitLabel: 'HP',
    formatValue: (lvl) => `+${lvl * 14} HP`,
  },
  shield_capacity: {
    id: 'shield_capacity',
    name: 'Shield Capacity',
    description: 'Expands energy barrier reserve and passive recharge strength.',
    maxLevel: 10,
    ...FLEET_UPGRADE_ECONOMY.shield_capacity,
    perLevelBonus: 12,
    unitLabel: 'SHD',
    formatValue: (lvl) => `+${lvl * 12} SHD`,
  },
  movement_speed: {
    id: 'movement_speed',
    name: 'Movement Speed',
    description: 'Boosts thruster response and top maneuver speed.',
    maxLevel: 8,
    ...FLEET_UPGRADE_ECONOMY.movement_speed,
    perLevelBonus: 16,
    unitLabel: 'SPD',
    formatValue: (lvl) => `+${lvl * 16} SPD`,
  },
  critical_chance: {
    id: 'critical_chance',
    name: 'Critical Chance',
    description: 'Improves targeting telemetry for high-multiplier critical strikes.',
    maxLevel: 10,
    ...FLEET_UPGRADE_ECONOMY.critical_chance,
    perLevelBonus: 0.025,
    unitLabel: '% Crit',
    formatValue: (lvl) => `+${(lvl * 2.5).toFixed(1)}%`,
  },
  missile_power: {
    id: 'missile_power',
    name: 'Missile Power',
    description: 'Amplifies Homing Missile and Photon Barrage warhead damage.',
    maxLevel: 8,
    ...FLEET_UPGRADE_ECONOMY.missile_power,
    perLevelBonus: 0.1,
    unitLabel: '% Warhead',
    formatValue: (lvl) => `+${lvl * 10}%`,
  },
  special_power: {
    id: 'special_power',
    name: 'Special Attack Power',
    description: 'Boosts Special damage and shaves cooldown duration.',
    maxLevel: 8,
    ...FLEET_UPGRADE_ECONOMY.special_power,
    perLevelBonus: 0.1,
    unitLabel: '% Special',
    formatValue: (lvl) => `+${lvl * 10}%`,
  },
};

export const UPGRADE_LIST: UpgradeDefinition[] = [
  UPGRADES.weapon_damage,
  UPGRADES.fire_rate,
  UPGRADES.max_health,
  UPGRADES.shield_capacity,
  UPGRADES.movement_speed,
  UPGRADES.critical_chance,
  UPGRADES.missile_power,
  UPGRADES.special_power,
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
