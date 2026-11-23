import {
  DRONE_LIST,
  getCollectorCreditBonus,
  getDronePowerAtLevel,
  getPrismTuningAtLevel,
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
    case 'prism': {
      const t1 = getPrismTuningAtLevel(1);
      const t5 = getPrismTuningAtLevel(drone.maxLevel);
      return [
        {
          label: 'Offensive Mode (Lv1 → Lv5)',
          value: `+${t1.damageBonusPct}% → +${t5.damageBonusPct}% DMG · +${t1.fireRateBonusPct}% → +${t5.fireRateBonusPct}% FR`,
          numericValue: t5.damageBonusPct,
          maxReference: 25,
          tone: 'rose',
        },
        {
          label: 'Defensive Mode (Lv1 → Lv5)',
          value: `+${t1.damageReductionPct}% → +${t5.damageReductionPct}% DR · +${t1.shieldRegenBonusPct}% → +${t5.shieldRegenBonusPct}% Regen`,
          numericValue: t5.damageReductionPct,
          maxReference: 20,
          tone: 'sky',
        },
        {
          label: 'Recovery Mode (Lv1 → Lv5)',
          value: `+${t1.recoveryHpPulse} → +${t5.recoveryHpPulse} HP · +${t1.recoveryShieldPulse} → +${t5.recoveryShieldPulse} SHD`,
          numericValue: t5.recoveryHpPulse,
          maxReference: 15,
          tone: 'emerald',
        },
        {
          label: 'Collection Mode (Lv1 → Lv5)',
          value: `+${t1.pickupRangeBonusPx} → +${t5.pickupRangeBonusPx} px · +${t1.creditBonusPct}% → +${t5.creditBonusPct}% CR`,
          numericValue: t5.pickupRangeBonusPx,
          maxReference: 180,
          tone: 'amber',
        },
      ];
    }
  }
}

const DRONE_SPECIAL_EFFECTS: Record<string, CodexSpecialEffect[]> = {
  assault: [
    {
      title: 'Critical Strike Inheritance',
      description: 'Every bolt fired rolls against the pilot’s active Critical Chance and Critical Damage multiplier, and scales with Special Gear Drone Power.',
    },
    {
      title: 'Deployment Slots',
      description: 'Fits either Port (Slot 01) or Starboard (Slot 02) wingman hardpoints.',
    },
  ],
  shield: [
    {
      title: 'Dual Barrier Support',
      description: 'Expands maximum shield reserve passively while delivering periodic emergency shield pulses enhanced by Drone Power gear.',
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
      description: 'Stacks with Utility Gear up to the global 1.40x Credit bonus cap; disabled in No-Drone Challenges.',
    },
    {
      title: 'Deployment Slots',
      description: 'Fits either Port (Slot 01) or Starboard (Slot 02) wingman hardpoints.',
    },
  ],
  prism: [
    {
      title: 'Single-Mode Adaptive Priority',
      description: 'Evaluates combat telemetry every 2.2s (minimum 2.0s dwell) in strict priority: Recovery (Hull HP ≤ 45%) > Defensive (high threat/bullet pressure) > Offensive (≥5 enemies) > Collection (≥2 drops). Only one mode is active at any time.',
    },
    {
      title: 'Deployment Slots & Gear Scaling',
      description: 'Fits either Port (Slot 01) or Starboard (Slot 02) hardpoints and scales all 4 adaptive modes with Drone Level and Special Gear Drone Enhancement.',
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
