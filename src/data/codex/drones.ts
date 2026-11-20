import {
  DRONE_LIST,
  getCollectorCreditBonus,
  getDronePowerAtLevel,
} from '../../game/config/DroneConfig';
import { RARITY_CONFIG } from '../../game/config/EquipmentConfig';
import type { CodexEntry, CodexSpecialEffect, CodexStatItem } from './types';

function buildDroneStats(drone: (typeof DRONE_LIST)[number]): CodexStatItem[] {
  const p1 = getDronePowerAtLevel(drone, 1);
  const p5 = getDronePowerAtLevel(drone, drone.maxLevel);

  switch (drone.id) {
    case 'assault': {
      const cd1 = (drone.baseCooldownMs / 1000).toFixed(2);
      const cd5 = (Math.max(320, drone.baseCooldownMs - 4 * 40) / 1000).toFixed(2);
      return [
        {
          label: 'Bolt Damage (Lv1 → Lv5)',
          value: `${p1} → ${p5} DMG`,
          numericValue: p5,
          maxReference: 32,
          tone: 'rose',
        },
        {
          label: 'Attack Interval (Lv1 → Lv5)',
          value: `${cd1} → ${cd5} s`,
          numericValue: Number(cd5),
          maxReference: 1,
          tone: 'amber',
        },
        {
          label: 'Targeting Range',
          value: '520 px',
          numericValue: 520,
          maxReference: 600,
          tone: 'cyan',
        },
        {
          label: 'Bolt Velocity',
          value: '760 px/s',
          numericValue: 760,
          maxReference: 900,
          tone: 'sky',
        },
      ];
    }
    case 'shield': {
      const cd1 = (drone.baseCooldownMs / 1000).toFixed(1);
      const cd5 = (Math.max(4200, drone.baseCooldownMs - 4 * 400) / 1000).toFixed(1);
      return [
        {
          label: 'Max Shield Bonus (Lv1 → Lv5)',
          value: `+18 → +50 SHD`,
          numericValue: 50,
          maxReference: 60,
          tone: 'sky',
        },
        {
          label: 'Shield Pulse (Lv1 → Lv5)',
          value: `+${p1} → +${p5} SHD`,
          numericValue: p5,
          maxReference: 25,
          tone: 'cyan',
        },
        {
          label: 'Pulse Cooldown (Lv1 → Lv5)',
          value: `${cd1} → ${cd5} s`,
          numericValue: Number(cd1),
          maxReference: 12,
          tone: 'amber',
        },
        {
          label: 'Regen Rate Boost (Lv1 → Lv5)',
          value: '+20% → +52%',
          numericValue: 52,
          maxReference: 60,
          tone: 'emerald',
        },
      ];
    }
    case 'repair': {
      const cd1 = (drone.baseCooldownMs / 1000).toFixed(1);
      const cd5 = (Math.max(7500, drone.baseCooldownMs - 4 * 600) / 1000).toFixed(1);
      return [
        {
          label: 'Hull Repair (Lv1 → Lv5)',
          value: `+${p1} → +${p5} HP`,
          numericValue: p5,
          maxReference: 30,
          tone: 'emerald',
        },
        {
          label: 'Repair Cooldown (Lv1 → Lv5)',
          value: `${cd1} → ${cd5} s`,
          numericValue: Number(cd1),
          maxReference: 12,
          tone: 'amber',
        },
        {
          label: 'Activation Trigger',
          value: 'When HP < Max',
          tone: 'cyan',
        },
      ];
    }
    case 'collector': {
      const r1 = 110;
      const r5 = 110 + 4 * 24;
      const c1 = Math.round(getCollectorCreditBonus(1) * 100);
      const c5 = Math.round(getCollectorCreditBonus(drone.maxLevel) * 100);
      return [
        {
          label: 'Magnet Radius (Lv1 → Lv5)',
          value: `+${r1} → +${r5} px`,
          numericValue: r5,
          maxReference: 220,
          tone: 'cyan',
        },
        {
          label: 'Credit Bonus (Lv1 → Lv5)',
          value: `+${c1}% → +${c5}%`,
          numericValue: c5,
          maxReference: 30,
          tone: 'amber',
        },
        {
          label: 'Mode',
          value: 'Continuous Passive Aura',
          tone: 'emerald',
        },
      ];
    }
  }
}

const DRONE_SPECIAL_EFFECTS: Record<string, CodexSpecialEffect[]> = {
  assault: [
    {
      title: 'Critical Strike Inheritance',
      description: 'Every bolt fired rolls against the pilot’s active Critical Chance and Critical Damage multiplier.',
    },
    {
      title: 'Deployment Slots',
      description: 'Fits either Port (Slot 01) or Starboard (Slot 02) wingman hardpoints.',
    },
  ],
  shield: [
    {
      title: 'Dual Barrier Support',
      description: 'Expands maximum shield reserve passively while delivering periodic emergency shield pulses.',
    },
    {
      title: 'Deployment Slots',
      description: 'Fits either Port (Slot 01) or Starboard (Slot 02) wingman hardpoints.',
    },
  ],
  repair: [
    {
      title: 'Smart Triage Timer',
      description: 'Holds repair charge ready whenever the hull is intact and fires immediately upon taking hull damage.',
    },
    {
      title: 'Deployment Slots',
      description: 'Fits either Port (Slot 01) or Starboard (Slot 02) wingman hardpoints.',
    },
  ],
  collector: [
    {
      title: 'Salvage Economy Cap',
      description: 'Stacks with Graviton Gear up to the global 1.55x Credit bonus cap; disabled in No-Drone Challenges.',
    },
    {
      title: 'Deployment Slots',
      description: 'Fits either Port (Slot 01) or Starboard (Slot 02) wingman hardpoints.',
    },
  ],
};

export const DRONES_CODEX: CodexEntry[] = DRONE_LIST.map((drone) => {
  const rarity = RARITY_CONFIG[drone.rarity];
  return {
    id: `drone_${drone.id}`,
    sourceId: drone.id,
    category: 'drones',
    name: drone.name,
    subtitle: `${drone.role} · ${rarity.label} · Max Lv${drone.maxLevel}`,
    accentHex: drone.colorHex,
    description: drone.description,
    stats: buildDroneStats(drone),
    specialEffects: DRONE_SPECIAL_EFFECTS[drone.id] ?? [],
    acquisition: `Armory Purchase: ${drone.costCredits.toLocaleString()} CR · ${drone.costCrystals} Gems`,
    searchKeywords: [drone.name, drone.role, rarity.label, drone.abilitySummary, 'drone', 'wingman'],
  };
});
