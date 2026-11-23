import {
  getWeaponDamageAtLevel,
  getWeaponFireRateAtLevel,
  WEAPON_LIST,
} from '../../game/config/WeaponConfig';
import {
  WEAPON_EVOLUTIONS,
  WEAPON_RUNTIME_TUNING,
} from '../../game/config/WeaponEvolutionConfig';
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
    projectileCount: '1 Bolt (Evo II: +6 Burst Shards)',
    deliveryStats: [
      {
        label: 'Bolt Speed (Base → Evo I+)',
        value: `${WEAPON_RUNTIME_TUNING.plasma.baseSpeed} → ${WEAPON_RUNTIME_TUNING.plasma.evo1Speed} px/s`,
        numericValue: WEAPON_RUNTIME_TUNING.plasma.evo1Speed,
        maxReference: 1150,
        tone: 'sky',
      },
      { label: 'Effective Range', value: 'Long', tone: 'cyan' },
    ],
    effects: [],
  },
  dual_laser: {
    projectileCount: '2 Parallel Bolts (Evo II: +Central Barrage)',
    deliveryStats: [
      {
        label: 'Bolt Speed (Base → Evo I+)',
        value: `${WEAPON_RUNTIME_TUNING.dual_laser.baseSpeed} → ${WEAPON_RUNTIME_TUNING.dual_laser.evo1Speed} px/s`,
        numericValue: WEAPON_RUNTIME_TUNING.dual_laser.evo1Speed,
        maxReference: 1150,
        tone: 'cyan',
      },
      { label: 'Effective Range', value: 'Full Screen', tone: 'sky' },
    ],
    effects: [],
  },
  spread: {
    projectileCount: '4-Way Fan (Lv20 Evo II: 6-Way Fan)',
    deliveryStats: [
      {
        label: 'Bolt Speed (Base → Evo II)',
        value: `${WEAPON_RUNTIME_TUNING.spread.baseSpeed} → ${WEAPON_RUNTIME_TUNING.spread.evo2Speed} px/s`,
        numericValue: WEAPON_RUNTIME_TUNING.spread.evo2Speed,
        maxReference: 1150,
        tone: 'purple',
      },
      { label: 'Effective Range', value: 'Medium-Wide Fan', tone: 'sky' },
    ],
    effects: [],
  },
  beam: {
    projectileCount: 'Continuous Piercing Column',
    deliveryStats: [
      { label: 'Delivery', value: 'Continuous Lock Laser', tone: 'sky' },
      {
        label: 'Lock-On Ramp Cap',
        value: `+${Math.round(WEAPON_RUNTIME_TUNING.beam.baseMaxRampBonus * 100)}% → +${Math.round(WEAPON_RUNTIME_TUNING.beam.evo1MaxRampBonus * 100)}%`,
        numericValue: Math.round(WEAPON_RUNTIME_TUNING.beam.evo1MaxRampBonus * 100),
        maxReference: 75,
        tone: 'cyan',
      },
    ],
    effects: [
      {
        title: 'Fire Rate Synchronization',
        description:
          'Fire Rate bonuses smoothly shorten the Beam damage tick interval down to 52ms without double-dipping.',
      },
    ],
  },
  homing: {
    projectileCount: '2 AoE Missiles (Evo II: +Heavy Missile)',
    deliveryStats: [
      {
        label: 'Missile Speed (Base → Evo I+)',
        value: `${WEAPON_RUNTIME_TUNING.homing.baseSpeed} → ${WEAPON_RUNTIME_TUNING.homing.evo1Speed} px/s`,
        numericValue: WEAPON_RUNTIME_TUNING.homing.evo1Speed,
        maxReference: 1150,
        tone: 'amber',
      },
      {
        label: 'Blast Radius (Base → Evo I → Evo II)',
        value: `${WEAPON_RUNTIME_TUNING.homing.baseSplashRadiusPx} → ${WEAPON_RUNTIME_TUNING.homing.evo1SplashRadiusPx} → ${WEAPON_RUNTIME_TUNING.homing.evo2HeavySplashRadiusPx} px`,
        numericValue: WEAPON_RUNTIME_TUNING.homing.evo2HeavySplashRadiusPx,
        maxReference: 150,
        tone: 'rose',
      },
    ],
    effects: [],
  },
  lightning: {
    projectileCount: '4 Chain Jumps (Lv12 Evo I+: 6 Jumps)',
    deliveryStats: [
      {
        label: 'Initial Arc Range',
        value: `${WEAPON_RUNTIME_TUNING.lightning.baseInitialRangePx} → ${WEAPON_RUNTIME_TUNING.lightning.evo1InitialRangePx} px`,
        numericValue: WEAPON_RUNTIME_TUNING.lightning.evo1InitialRangePx,
        maxReference: 650,
        tone: 'cyan',
      },
      {
        label: 'Chain Jump Range',
        value: `${WEAPON_RUNTIME_TUNING.lightning.baseChainRangePx} → ${WEAPON_RUNTIME_TUNING.lightning.evo1ChainRangePx} px`,
        numericValue: WEAPON_RUNTIME_TUNING.lightning.evo1ChainRangePx,
        maxReference: 650,
        tone: 'sky',
      },
    ],
    effects: [],
  },
};

export const WEAPONS_CODEX: CodexEntry[] = WEAPON_LIST.map((weapon) => {
  const dmgLv1 = getWeaponDamageAtLevel(weapon, 1);
  const dmgLvMax = getWeaponDamageAtLevel(weapon, weapon.maxWeaponLevel);
  const rateLv1 = getWeaponFireRateAtLevel(weapon, 1);
  const rateLvMax = getWeaponFireRateAtLevel(weapon, weapon.maxWeaponLevel);
  const meta = WEAPON_RUNTIME_META[weapon.id];
  const evoTiers = WEAPON_EVOLUTIONS[weapon.id];

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
        label: `Base Damage (Lv1 → Lv${weapon.maxWeaponLevel})`,
        value: `${dmgLv1} → ${dmgLvMax} DMG`,
        numericValue: dmgLv1,
        maxReference: 26,
        tone: 'rose',
      },
      {
        label: `Cycle Delay (Lv1 → Lv${weapon.maxWeaponLevel})`,
        value: `${rateLv1} → ${rateLvMax} ms`,
        numericValue: Math.round((1000 / rateLv1) * 10) / 10,
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
      ...evoTiers.map((tier) => ({
        title: `${tier.tierLabel} (Lv.${tier.unlockLevel}): ${tier.formName}`,
        description: `${tier.summary} ${tier.mechanicNotes.join(' · ')}.`,
      })),
      ...(meta?.effects ?? []),
    ],
    acquisition: unlockParts.join(' · '),
    searchKeywords: [
      weapon.name,
      weapon.typeLabel,
      weapon.specialProperty,
      ...evoTiers.map((t) => t.formName),
      'weapon',
      'evolution',
    ],
  };
});
