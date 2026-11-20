import {
  getWeaponDamageAtLevel,
  getWeaponFireRateAtLevel,
  WEAPON_LIST,
} from '../../game/config/WeaponConfig';
import type { CodexEntry, CodexSpecialEffect } from './types';

const WEAPON_RUNTIME_META: Record<
  string,
  {
    projectileCount: string;
    deliveryStats: CodexEntry['stats'];
    effects: CodexSpecialEffect[];
  }
> = {
  plasma: {
    projectileCount: '1 bolt (2 twin at Lv3+)',
    deliveryStats: [
      { label: 'Bolt Speed', value: '840 px/s', numericValue: 840, maxReference: 1050, tone: 'sky' },
      { label: 'Effective Range', value: 'Long', tone: 'cyan' },
    ],
    effects: [
      {
        title: 'Lv3+ Twin Convergence',
        description: 'Splits into twin slightly angled plasma bolts dealing 62% damage each for wider coverage.',
      },
      {
        title: 'Nova Prime Synergy',
        description: 'Gains +18% bonus weapon damage when mounted on Nova Prime.',
      },
    ],
  },
  dual_laser: {
    projectileCount: '2 parallel bolts (3 at Lv4+)',
    deliveryStats: [
      { label: 'Bolt Speed', value: '980 px/s', numericValue: 980, maxReference: 1050, tone: 'cyan' },
      { label: 'Effective Range', value: 'Full Screen', tone: 'sky' },
    ],
    effects: [
      {
        title: 'Lv4+ Triple Laser Core',
        description: 'Adds a high-speed 1040 px/s central lane bolt dealing 70% bolt damage.',
      },
    ],
  },
  spread: {
    projectileCount: '5-way cone (7-way at Lv4+)',
    deliveryStats: [
      { label: 'Bolt Speed', value: '740 px/s', numericValue: 740, maxReference: 1050, tone: 'purple' },
      { label: 'Effective Range', value: 'Medium-Wide Cone', tone: 'sky' },
    ],
    effects: [
      {
        title: 'Lv4+ Expanded Arc',
        description: 'Widens fan from 5 projectiles (±0.36 rad) to 7 projectiles (±0.45 rad) for swarm clearing.',
      },
    ],
  },
  homing: {
    projectileCount: '2 missiles (3 at Lv4+)',
    deliveryStats: [
      { label: 'Missile Speed', value: '540 px/s', numericValue: 540, maxReference: 1050, tone: 'amber' },
      { label: 'Seek Radius', value: '480 px', numericValue: 480, maxReference: 600, tone: 'cyan' },
    ],
    effects: [
      {
        title: 'Missile Power Scaling',
        description: 'Direct multiplier from Fleet Missile Power upgrades and Lv4+ third central warhead (85% DMG).',
      },
    ],
  },
  beam: {
    projectileCount: 'Instant Piercing Column',
    deliveryStats: [
      { label: 'Delivery', value: 'Instant Hitscan', tone: 'sky' },
      { label: 'Beam Width', value: '28–48 px', tone: 'cyan' },
    ],
    effects: [
      {
        title: 'Full Column Penetration',
        description: 'Pierces every hostile along the vertical firing line ahead of the aircraft with zero travel delay.',
      },
      {
        title: 'Nova Prime Synergy',
        description: 'Gains +18% bonus weapon damage when mounted on Nova Prime.',
      },
    ],
  },
  lightning: {
    projectileCount: '4 chain jumps (5 at Lv4+)',
    deliveryStats: [
      { label: 'Initial Arc Range', value: '540 px', numericValue: 540, maxReference: 600, tone: 'cyan' },
      { label: 'Chain Jump Range', value: '270 px', numericValue: 270, maxReference: 600, tone: 'sky' },
    ],
    effects: [
      {
        title: 'Voltaic Chain Decay',
        description: 'Jumps instantaneously between targets; each bounce retains 86% of the previous arc damage.',
      },
      {
        title: 'Thunderbolt Synergy',
        description: 'Thunderbolt chassis adds +1 extra chain bounce per volley.',
      },
    ],
  },
};

export const WEAPONS_CODEX: CodexEntry[] = WEAPON_LIST.map((weapon) => {
  const dmgLv1 = getWeaponDamageAtLevel(weapon, 1);
  const dmgLv5 = getWeaponDamageAtLevel(weapon, weapon.maxWeaponLevel);
  const rateLv1 = getWeaponFireRateAtLevel(weapon, 1);
  const rateLv5 = getWeaponFireRateAtLevel(weapon, weapon.maxWeaponLevel);
  const meta = WEAPON_RUNTIME_META[weapon.id];

  const unlockParts: string[] = [];
  if (weapon.unlockCredits === 0 && weapon.unlockCrystals === 0) {
    unlockParts.push('Starter Module (Unlocked at Sector 01)');
  } else {
    unlockParts.push(`Sector ${String(weapon.unlockLevel).padStart(2, '0')} Required`);
    unlockParts.push(`${weapon.unlockCredits.toLocaleString()} CR`);
    if (weapon.unlockCrystals > 0) unlockParts.push(`${weapon.unlockCrystals} Gems`);
  }

  return {
    id: `weapon_${weapon.id}`,
    sourceId: weapon.id,
    category: 'weapons',
    name: weapon.name,
    subtitle: `${weapon.typeLabel} · Hotkey ${weapon.hotkey} · Max Lv${weapon.maxWeaponLevel}`,
    accentHex: weapon.colorHex,
    description: weapon.description,
    stats: [
      {
        label: 'Base Damage (Lv1 → Lv5)',
        value: `${dmgLv1} → ${dmgLv5} DMG`,
        numericValue: dmgLv1,
        maxReference: 32,
        tone: 'rose',
      },
      {
        label: 'Cycle Delay (Lv1 → Lv5)',
        value: `${rateLv1} → ${rateLv5} ms`,
        numericValue: Math.round(1000 / rateLv1 * 10) / 10,
        maxReference: 11,
        tone: 'amber',
      },
      {
        label: 'Salvo Pattern',
        value: meta?.projectileCount ?? weapon.specialProperty,
        tone: 'purple',
      },
      ...(meta?.deliveryStats ?? []),
    ],
    specialEffects: [
      {
        title: 'Upgrade Progression',
        description: '+16% base damage and +5% fire cadence per weapon level up to Level 5.',
      },
      ...(meta?.effects ?? []),
    ],
    acquisition: unlockParts.join(' · '),
    searchKeywords: [weapon.name, weapon.typeLabel, weapon.specialProperty, 'weapon'],
  };
});
