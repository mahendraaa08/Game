import { Rarity } from './EquipmentConfig';

export type DroneId = 'assault' | 'shield' | 'repair' | 'collector';

export interface DroneDefinition {
  id: DroneId;
  name: string;
  role: string;
  rarity: Rarity;
  textureKey: string;
  colorHex: string;
  colorNum: number;
  description: string;
  abilitySummary: string;
  costCredits: number;
  costCrystals: number;
  maxLevel: number;
  baseCooldownMs: number;
  basePower: number; // Assault: bullet dmg; Shield: shield regen/sec; Repair: heal HP; Collector: magnet radius bonus
}

export const DRONES: Record<DroneId, DroneDefinition> = {
  assault: {
    id: 'assault',
    name: 'ASSAULT DRONE',
    role: 'Autonomous Striker',
    rarity: 'rare',
    textureKey: 'drone_assault',
    colorHex: '#F43F5E',
    colorNum: 0xf43f5e,
    description:
      'Twin-wing combat sentinel that automatically tracks nearby hostiles and fires piercing plasma bolts.',
    abilitySummary: 'Fires aimed bolts every 0.55s scaling with upgrade level.',
    costCredits: 900,
    costCrystals: 4,
    maxLevel: 5,
    baseCooldownMs: 560,
    basePower: 14,
  },
  shield: {
    id: 'shield',
    name: 'SHIELD DRONE',
    role: 'Barrier Projection',
    rarity: 'rare',
    textureKey: 'drone_shield',
    colorHex: '#38BDF8',
    colorNum: 0x38bdf8,
    description:
      'Orbital emitter reinforcing deflector capacity and pulsing emergency shield restoration.',
    abilitySummary: '+18 Max Shield and restores +10 Shield every 6.5s.',
    costCredits: 950,
    costCrystals: 4,
    maxLevel: 5,
    baseCooldownMs: 6500,
    basePower: 10,
  },
  repair: {
    id: 'repair',
    name: 'REPAIR DRONE',
    role: 'Nanite Field Medic',
    rarity: 'epic',
    textureKey: 'drone_repair',
    colorHex: '#22C55E',
    colorNum: 0x22c55e,
    description:
      'Deploys nanite hull patches on a controlled tactical cooldown during extended waves and boss fights.',
    abilitySummary: 'Restores +12 Hull HP every 11s when hull is damaged.',
    costCredits: 1400,
    costCrystals: 8,
    maxLevel: 5,
    baseCooldownMs: 11000,
    basePower: 12,
  },
  collector: {
    id: 'collector',
    name: 'COLLECTOR DRONE',
    role: 'Graviton Salvager',
    rarity: 'epic',
    textureKey: 'drone_collector',
    colorHex: '#F59E0B',
    colorNum: 0xf59e0b,
    description:
      'Projects a wide magnetic tractor field pulling battlefield power-ups and harvesting extra Credits.',
    abilitySummary: '+110px Drop Magnet Radius & +18% Credits earned.',
    costCredits: 1250,
    costCrystals: 6,
    maxLevel: 5,
    baseCooldownMs: 0,
    basePower: 110,
  },
};

export const DRONE_LIST: DroneDefinition[] = [
  DRONES.assault,
  DRONES.shield,
  DRONES.repair,
  DRONES.collector,
];

export function getDroneUpgradeCost(def: DroneDefinition, currentLevel: number): { credits: number; crystals: number } {
  const credits = Math.round(520 * Math.pow(1.55, currentLevel - 1));
  const crystals = currentLevel >= 2 ? currentLevel * 2 : 2;
  return { credits, crystals };
}

export function getDronePowerAtLevel(def: DroneDefinition, level: number): number {
  return Math.round(def.basePower * (1 + (Math.max(1, level) - 1) * 0.25));
}
