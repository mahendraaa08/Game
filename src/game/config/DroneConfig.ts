import { calculateDroneUpgradeCost, DRONE_PRICING } from './EconomyConfig';
import type { Rarity } from './EquipmentConfig';

export type DroneId = 'assault' | 'shield' | 'repair' | 'collector';

export type DroneSlotId = 'slot1' | 'slot2';

export const DRONE_SLOT_IDS: DroneSlotId[] = ['slot1', 'slot2'];

export interface DroneDefinition {
  id: DroneId;
  name: string;
  role: string;
  rarity: Rarity;
  compatibleSlots: DroneSlotId[];
  textureKey: string;
  colorHex: string;
  colorNum: number;
  description: string;
  abilitySummary: string;
  costCredits: number;
  costCrystals: number;
  maxLevel: number;
  baseCooldownMs: number;
  basePower: number; // Assault: bullet dmg; Shield: shield regen pulse; Repair: heal HP; Collector: magnet radius bonus
}

export const DRONES: Record<DroneId, DroneDefinition> = {
  assault: {
    id: 'assault',
    name: 'ASSAULT DRONE',
    role: 'Autonomous Striker',
    rarity: 'rare',
    compatibleSlots: ['slot1', 'slot2'],
    textureKey: 'drone_assault',
    colorHex: '#F43F5E',
    colorNum: 0xf43f5e,
    description:
      'Twin-wing combat sentinel that automatically tracks nearby hostiles and fires piercing plasma bolts.',
    abilitySummary: 'Fires aimed bolts every 0.56s scaling with upgrade level.',
    costCredits: DRONE_PRICING.assault.credits,
    costCrystals: DRONE_PRICING.assault.crystals,
    maxLevel: 5,
    baseCooldownMs: 560,
    basePower: 14,
  },
  shield: {
    id: 'shield',
    name: 'SHIELD DRONE',
    role: 'Barrier Projection',
    rarity: 'rare',
    compatibleSlots: ['slot1', 'slot2'],
    textureKey: 'drone_shield',
    colorHex: '#38BDF8',
    colorNum: 0x38bdf8,
    description:
      'Orbital emitter reinforcing deflector capacity and pulsing emergency shield restoration.',
    abilitySummary: '+18 Max Shield and restores +10 Shield every 6.5s.',
    costCredits: DRONE_PRICING.shield.credits,
    costCrystals: DRONE_PRICING.shield.crystals,
    maxLevel: 5,
    baseCooldownMs: 6500,
    basePower: 10,
  },
  repair: {
    id: 'repair',
    name: 'REPAIR DRONE',
    role: 'Nanite Field Medic',
    rarity: 'epic',
    compatibleSlots: ['slot1', 'slot2'],
    textureKey: 'drone_repair',
    colorHex: '#22C55E',
    colorNum: 0x22c55e,
    description:
      'Deploys nanite hull patches on a controlled tactical cooldown during extended waves and boss fights.',
    abilitySummary: 'Restores +12 Hull HP every 11s when hull is damaged.',
    costCredits: DRONE_PRICING.repair.credits,
    costCrystals: DRONE_PRICING.repair.crystals,
    maxLevel: 5,
    baseCooldownMs: 11000,
    basePower: 12,
  },
  collector: {
    id: 'collector',
    name: 'COLLECTOR DRONE',
    role: 'Graviton Salvager',
    rarity: 'epic',
    compatibleSlots: ['slot1', 'slot2'],
    textureKey: 'drone_collector',
    colorHex: '#F59E0B',
    colorNum: 0xf59e0b,
    description:
      'Projects a wide magnetic tractor field pulling battlefield power-ups and harvesting extra Credits.',
    abilitySummary: '+110px Drop Magnet Radius & +14% Credits earned.',
    costCredits: DRONE_PRICING.collector.credits,
    costCrystals: DRONE_PRICING.collector.crystals,
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

export function isDroneCompatibleWithSlot(def: DroneDefinition, slotId: DroneSlotId): boolean {
  return def.compatibleSlots.includes(slotId);
}

export function getDroneUpgradeCost(def: DroneDefinition, currentLevel: number): { credits: number; crystals: number } {
  return calculateDroneUpgradeCost(def.rarity, currentLevel);
}

export function getDronePowerAtLevel(def: DroneDefinition, level: number): number {
  return Math.round(def.basePower * (1 + (Math.max(1, level) - 1) * 0.25));
}

export function getCollectorCreditBonus(level: number): number {
  const lvl = Math.max(1, level);
  return 0.14 + (lvl - 1) * 0.025;
}

export function getDroneModifierTags(def: DroneDefinition, level: number): string[] {
  const lvl = Math.max(1, level);
  const power = getDronePowerAtLevel(def, lvl);
  switch (def.id) {
    case 'assault': {
      const intervalSec = (Math.max(320, def.baseCooldownMs - (lvl - 1) * 40) / 1000).toFixed(2);
      return [`${power} Bolt DMG`, `${intervalSec}s Fire Interval`];
    }
    case 'shield': {
      const maxShieldBonus = 18 + (lvl - 1) * 8;
      const regenSec = (Math.max(4200, def.baseCooldownMs - (lvl - 1) * 400) / 1000).toFixed(1);
      return [`+${maxShieldBonus} Max Shield`, `+${power} Shield / ${regenSec}s`];
    }
    case 'repair': {
      const cooldownSec = (Math.max(7500, def.baseCooldownMs - (lvl - 1) * 600) / 1000).toFixed(1);
      return [`+${power} Hull Repair`, `${cooldownSec}s Repair CD`];
    }
    case 'collector': {
      const magnetRadius = 110 + (lvl - 1) * 24;
      const creditPct = Math.round(getCollectorCreditBonus(lvl) * 100);
      return [`+${magnetRadius}px Pickup Magnet`, `+${creditPct}% Credit Bonus`];
    }
  }
}
