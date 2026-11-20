import { SHIP_LIST } from '../../game/config/ShipConfig';
import { WEAPONS } from '../../game/config/WeaponConfig';
import type { CodexEntry, CodexSpecialEffect } from './types';

const EXTRA_SHIP_MECHANICS: Record<string, CodexSpecialEffect[]> = {
  falcon_x: [
    {
      title: 'Crit Damage Multiplier',
      description: 'Standard 175% critical strike damage scaling.',
    },
  ],
  destroyer: [
    {
      title: 'Heavy Ordnance Geometry',
      description: 'Projectiles and homing warheads fire at 1.25x collision scale.',
    },
  ],
  phantom: [
    {
      title: 'Phase Evasion & Mobility',
      description: '15% chance to evade incoming damage (0.26s phase blink) and -25% Dash cooldown.',
    },
  ],
  nova_prime: [
    {
      title: 'Conduit Overdrive',
      description: 'Beam and Plasma weapons gain +18% direct damage and Special cooldown drops by 18%.',
    },
  ],
  thunderbolt: [
    {
      title: 'Sustained Cadence Ramp',
      description: 'Continuous firing ramps up to +22% bonus fire rate over 2.0s and adds +1 Chain Lightning jump.',
    },
  ],
  aegis: [
    {
      title: 'Bastion Defense',
      description: 'Reduces incoming damage by 16%, boosts passive shield recharge by +45%, and restores +4 Shield per kill.',
    },
  ],
  specter: [
    {
      title: 'Lethal Critical Multiplier',
      description: 'Critical hits deal 235% damage instead of the standard 175%.',
    },
  ],
  celestial: [
    {
      title: 'Astral Wing-Bolts & Crit Bonus',
      description: 'Every shot fires twin wing-bolts (35% weapon damage each) alongside 195% critical strike damage.',
    },
  ],
};

export const AIRCRAFT_CODEX: CodexEntry[] = SHIP_LIST.map((ship) => {
  const sigWeapon = WEAPONS[ship.signatureWeapon];
  const extraEffects = EXTRA_SHIP_MECHANICS[ship.id] ?? [];

  return {
    id: `aircraft_${ship.id}`,
    sourceId: ship.id,
    category: 'aircraft',
    name: ship.name,
    subtitle: `${ship.role} · Signature: ${sigWeapon.shortName}`,
    accentHex: ship.primaryColorHex,
    description: ship.description,
    stats: [
      {
        label: 'Max Hull',
        value: `${ship.stats.maxHp} HP`,
        numericValue: ship.stats.maxHp,
        maxReference: 160,
        tone: 'emerald',
      },
      {
        label: 'Max Shield',
        value: `${ship.stats.maxShield} SHD`,
        numericValue: ship.stats.maxShield,
        maxReference: 120,
        tone: 'sky',
      },
      {
        label: 'Movement Speed',
        value: `${ship.stats.moveSpeed} px/s`,
        numericValue: ship.stats.moveSpeed,
        maxReference: 480,
        tone: 'cyan',
      },
      {
        label: 'Damage Output',
        value: `${Math.round(ship.stats.damageMult * 100)}%`,
        numericValue: Math.round(ship.stats.damageMult * 100),
        maxReference: 145,
        tone: 'rose',
      },
      {
        label: 'Fire Rate',
        value: `${Math.round(ship.stats.fireRateMult * 100)}%`,
        numericValue: Math.round(ship.stats.fireRateMult * 100),
        maxReference: 150,
        tone: 'amber',
      },
      {
        label: 'Crit Chance',
        value: `${Math.round(ship.stats.critChance * 100)}%`,
        numericValue: Math.round(ship.stats.critChance * 100),
        maxReference: 30,
        tone: 'amber',
      },
      {
        label: 'Special Power',
        value: `${Math.round(ship.stats.specialPowerMult * 100)}%`,
        numericValue: Math.round(ship.stats.specialPowerMult * 100),
        maxReference: 145,
        tone: 'purple',
      },
    ],
    specialEffects: [
      {
        title: `Passive: ${ship.passiveName}`,
        description: ship.passiveDescription,
      },
      {
        title: `Signature Integration: ${sigWeapon.name}`,
        description: ship.weaponCharacteristic,
      },
      ...extraEffects,
    ],
    acquisition: ship.unlock.description,
    searchKeywords: [
      ship.name,
      ship.role,
      ship.passiveName,
      sigWeapon.name,
      ship.unlock.description,
    ],
  };
});
