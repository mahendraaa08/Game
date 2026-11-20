import { POWERUP_LIST } from '../../game/config/PowerUpConfig';
import type { CodexEntry, CodexSpecialEffect, CodexStatItem } from './types';

const POWERUP_DETAILS: Record<
  string,
  {
    subtitle: string;
    description: string;
    stats: CodexStatItem[];
    effects: CodexSpecialEffect[];
  }
> = {
  health: {
    subtitle: 'Instant Recovery · Hull Patch',
    description:
      'Emergency nanite capsule that immediately restores structural hull integrity during combat.',
    stats: [
      { label: 'Hull Restored', value: '+35 HP', numericValue: 35, maxReference: 50, tone: 'emerald' },
      { label: 'Duration', value: 'Instant', tone: 'slate' },
      { label: 'Drop Weight', value: '26%', numericValue: 26, maxReference: 30, tone: 'cyan' },
    ],
    effects: [
      {
        title: 'Overflow Handling',
        description: 'Caps cleanly at your ship’s maximum Hull HP without wasting pickup tracking.',
      },
    ],
  },
  shield: {
    subtitle: 'Instant Recovery · Energy Capacitor',
    description:
      'Replenishes depleted energy barrier reserves immediately on collection.',
    stats: [
      { label: 'Shield Restored', value: '+45 SHD', numericValue: 45, maxReference: 50, tone: 'sky' },
      { label: 'Duration', value: 'Instant', tone: 'slate' },
      { label: 'Drop Weight', value: '24%', numericValue: 24, maxReference: 30, tone: 'cyan' },
    ],
    effects: [
      {
        title: 'Challenge Compatibility',
        description: 'Has no restore effect in Shieldless Challenge runs where Max Shield is set to 0.',
      },
    ],
  },
  rapid_fire: {
    subtitle: 'Timed Combat Buff · Weapon Overclock',
    description:
      'Overclocks weapon cycling relays to drastically accelerate sustained projectile output.',
    stats: [
      { label: 'Fire Rate Multiplier', value: '1.75x (+75%)', numericValue: 75, maxReference: 100, tone: 'amber' },
      { label: 'Duration', value: '8.0 s', numericValue: 8, maxReference: 10, tone: 'cyan' },
      { label: 'Drop Weight', value: '18%', numericValue: 18, maxReference: 30, tone: 'sky' },
    ],
    effects: [
      {
        title: 'Stackable Buff',
        description: 'Multiplies atop Fleet Fire Rate, Ship passives, and Equipment accelerators (55 ms minimum cycle floor).',
      },
    ],
  },
  double_damage: {
    subtitle: 'Timed Combat Buff · Ordnance Surge',
    description:
      'Amplifies all primary weapon output to double strength for crushing bosses and elite waves.',
    stats: [
      { label: 'Damage Multiplier', value: '2.00x (200%)', numericValue: 200, maxReference: 200, tone: 'rose' },
      { label: 'Duration', value: '8.0 s', numericValue: 8, maxReference: 10, tone: 'cyan' },
      { label: 'Drop Weight', value: '16%', numericValue: 16, maxReference: 30, tone: 'sky' },
    ],
    effects: [
      {
        title: 'Multiplicative Synergy',
        description: 'Stacks multiplicatively with Critical Strikes, Weapon Levels, and Ship damage bonuses.',
      },
    ],
  },
  mega_bomb: {
    subtitle: 'Instant Screen Clear · Tactical Warhead',
    description:
      'Detonates an arena-wide subspace pulse that erases enemy fire and blasts every hostile target.',
    stats: [
      { label: 'Blast Damage', value: '220 DMG', numericValue: 220, maxReference: 250, tone: 'purple' },
      { label: 'Area of Effect', value: 'All Active Targets', tone: 'rose' },
      { label: 'Duration', value: 'Instant', tone: 'slate' },
      { label: 'Drop Weight', value: '9%', numericValue: 9, maxReference: 30, tone: 'cyan' },
    ],
    effects: [
      {
        title: 'Projectile Vaporization',
        description: 'Erases all hostile projectiles on screen immediately upon detonation.',
      },
    ],
  },
  invulnerability: {
    subtitle: 'Timed Defense Buff · Aegis Phase',
    description:
      'Envelops the starfighter in an impenetrable phase barrier immune to enemy shots and collisions.',
    stats: [
      { label: 'Duration', value: '6.0 s', numericValue: 6, maxReference: 10, tone: 'purple' },
      { label: 'Ramming Damage', value: '999 DMG', numericValue: 999, maxReference: 999, tone: 'rose' },
      { label: 'Drop Weight', value: '7%', numericValue: 7, maxReference: 30, tone: 'cyan' },
    ],
    effects: [
      {
        title: 'Kinetic Ramming',
        description: 'Direct contact with standard enemy aircraft during Aegis Invulnerability deals 999 lethal damage.',
      },
    ],
  },
};

export const POWERUPS_CODEX: CodexEntry[] = POWERUP_LIST.map((pu) => {
  const meta = POWERUP_DETAILS[pu.id];
  return {
    id: `powerup_${pu.id}`,
    sourceId: pu.id,
    category: 'powerUps',
    name: pu.name,
    subtitle: meta?.subtitle ?? pu.shortLabel,
    accentHex: pu.colorHex,
    description: meta?.description ?? pu.shortLabel,
    stats: meta?.stats ?? [],
    specialEffects: [
      ...(meta?.effects ?? []),
      {
        title: 'Battlefield Drop Rules',
        description: '16% drop chance from defeated enemies; guaranteed 100% drop on every Boss phase transition.',
      },
    ],
    acquisition: 'Battlefield Drop (Enemies & Boss Phase Transitions)',
    searchKeywords: [pu.name, pu.shortLabel, 'powerup', 'power-up', 'buff', 'drop'],
  };
});
