import { calculateDroneUpgradeCost, DRONE_PRICING } from './EconomyConfig';
import type { Rarity } from './EquipmentConfig';

export type DroneId = 'assault' | 'shield' | 'repair' | 'collector' | 'prism';

export type DroneSlotId = 'slot1' | 'slot2';

export type PrismMode = 'recovery' | 'defensive' | 'offensive' | 'collection';

export const DRONE_SLOT_IDS: DroneSlotId[] = ['slot1', 'slot2'];

export interface PrismModeSpec {
  id: PrismMode;
  shortLabel: string;
  label: string;
  colorHex: string;
  colorNum: number;
}

export const PRISM_MODE_SPECS: Record<PrismMode, PrismModeSpec> = {
  recovery: {
    id: 'recovery',
    shortLabel: 'REC',
    label: 'Recovery Enhancement',
    colorHex: '#22C55E',
    colorNum: 0x22c55e,
  },
  defensive: {
    id: 'defensive',
    shortLabel: 'DEF',
    label: 'Defensive Enhancement',
    colorHex: '#38BDF8',
    colorNum: 0x38bdf8,
  },
  offensive: {
    id: 'offensive',
    shortLabel: 'OFF',
    label: 'Offensive Enhancement',
    colorHex: '#F43F5E',
    colorNum: 0xf43f5e,
  },
  collection: {
    id: 'collection',
    shortLabel: 'COL',
    label: 'Collection Enhancement',
    colorHex: '#F59E0B',
    colorNum: 0xf59e0b,
  },
};

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
  basePower: number; // Assault: bullet dmg; Shield: shield regen pulse; Repair: heal HP; Collector: magnet radius bonus; Prism: adaptive base power
}

export const DRONES: Record<DroneId, DroneDefinition> = {
  assault: {
    id: 'assault',
    name: 'ASSAULT DRONE',
    role: 'Offensive Support',
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
    role: 'Defensive Support',
    rarity: 'rare',
    compatibleSlots: ['slot1', 'slot2'],
    textureKey: 'drone_shield',
    colorHex: '#38BDF8',
    colorNum: 0x38bdf8,
    description:
      'Orbital emitter reinforcing deflector capacity and pulsing periodic shield restoration.',
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
    role: 'Hull Recovery',
    rarity: 'epic',
    compatibleSlots: ['slot1', 'slot2'],
    textureKey: 'drone_repair',
    colorHex: '#22C55E',
    colorNum: 0x22c55e,
    description:
      'Deploys nanite hull patches on a controlled tactical cooldown only when hull integrity is below maximum.',
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
    role: 'Resource Support',
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
  prism: {
    id: 'prism',
    name: 'PRISM DRONE',
    role: 'Adaptive Support',
    rarity: 'legendary',
    compatibleSlots: ['slot1', 'slot2'],
    textureKey: 'drone_prism',
    colorHex: '#C084FC',
    colorNum: 0xc084fc,
    description:
      'Adaptive tactical AI that scans combat conditions every 2.2s and projects strictly one focused enhancement mode at a time.',
    abilitySummary: 'Dynamically switches between Recovery, Defensive, Offensive, or Collection focus.',
    costCredits: DRONE_PRICING.prism.credits,
    costCrystals: DRONE_PRICING.prism.crystals,
    maxLevel: 5,
    baseCooldownMs: 2200,
    basePower: 10,
  },
};

export const DRONE_LIST: DroneDefinition[] = [
  DRONES.assault,
  DRONES.shield,
  DRONES.repair,
  DRONES.collector,
  DRONES.prism,
];

export function isDroneCompatibleWithSlot(def: DroneDefinition, slotId: DroneSlotId): boolean {
  return def.compatibleSlots.includes(slotId);
}

export function getDroneUpgradeCost(def: DroneDefinition, currentLevel: number): { credits: number; crystals: number } {
  return calculateDroneUpgradeCost(def.rarity, currentLevel);
}

export function getDronePowerAtLevel(def: DroneDefinition, level: number, dronePowerBonusPct = 0): number {
  const levelScale = 1 + (Math.max(1, level) - 1) * 0.25;
  const gearScale = 1 + Math.max(0, Math.min(0.45, dronePowerBonusPct));
  return Math.round(def.basePower * levelScale * gearScale);
}

export function getCollectorCreditBonus(level: number, dronePowerBonusPct = 0): number {
  const lvl = Math.max(1, level);
  const base = 0.14 + (lvl - 1) * 0.025;
  const gearScale = 1 + Math.max(0, Math.min(0.45, dronePowerBonusPct)) * 0.35;
  return base * gearScale;
}

export interface PrismModeTuning {
  damageBonusPct: number;
  fireRateBonusPct: number;
  damageReductionPct: number;
  shieldRegenBonusPct: number;
  recoveryHpPulse: number;
  recoveryShieldPulse: number;
  recoveryIntervalMs: number;
  pickupRangeBonusPx: number;
  creditBonusPct: number;
}

export function getPrismTuningAtLevel(level: number, dronePowerBonusPct = 0): PrismModeTuning {
  const lvl = Math.max(1, Math.min(5, Math.floor(level)));
  const gearScale = 1 + Math.max(0, Math.min(0.45, dronePowerBonusPct));
  return {
    damageBonusPct: Math.round((10 + (lvl - 1) * 2.5) * gearScale),
    fireRateBonusPct: Math.round((6 + (lvl - 1) * 1.5) * gearScale),
    damageReductionPct: Math.min(16, Math.round((8 + (lvl - 1) * 2) * (1 + Math.max(0, dronePowerBonusPct) * 0.35))),
    shieldRegenBonusPct: Math.round((24 + (lvl - 1) * 6) * gearScale),
    recoveryHpPulse: Math.round((4 + (lvl - 1) * 1.5) * gearScale),
    recoveryShieldPulse: Math.round((5 + (lvl - 1) * 2) * gearScale),
    recoveryIntervalMs: Math.max(3000, 4400 - (lvl - 1) * 300),
    pickupRangeBonusPx: Math.round((85 + (lvl - 1) * 18) * gearScale),
    creditBonusPct: Math.min(18, Math.round((8 + (lvl - 1) * 2) * (1 + Math.max(0, dronePowerBonusPct) * 0.35))),
  };
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
    case 'prism': {
      const t = getPrismTuningAtLevel(lvl);
      return [
        `+${t.damageBonusPct}% DMG / +${t.damageReductionPct}% DR`,
        `+${t.recoveryHpPulse} HP Pulse / +${t.pickupRangeBonusPx}px`,
      ];
    }
  }
}
