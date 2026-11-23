import { GAME_CONSTANTS } from '../../game/config/GameConfig';
import { SPECIAL_LIST } from '../../game/config/WeaponConfig';
import type { CodexEntry, CodexSpecialEffect } from './types';

const SPECIAL_METADATA: Record<
  string,
  {
    subtitle: string;
    extraStats: CodexEntry['stats'];
    effects: CodexSpecialEffect[];
  }
> = {
  emp_nova: {
    subtitle: 'Active Special · Radial Countermeasure',
    extraStats: [
      { label: 'Shockwave Radius', value: '500 px', numericValue: 500, maxReference: 600, tone: 'sky' },
      { label: 'Projectile Clear', value: 'Full Screen', tone: 'cyan' },
    ],
    effects: [
      {
        title: 'Bullet Erasure',
        description: 'Instantly vaporizes every active hostile projectile in the arena on activation.',
      },
      {
        title: 'Crit & Cooldown Scaling',
        description: 'Scales with Equipment Special Power, Fleet Critical Damage & Cooldown Reduction upgrades, and Critical rolls.',
      },
    ],
  },
  orbital_strike: {
    subtitle: 'Active Special · Vertical Lance Barrage',
    extraStats: [
      { label: 'Strike Lanes', value: '3 Columns', tone: 'purple' },
      { label: 'Lane Width', value: '88 px', numericValue: 88, maxReference: 120, tone: 'sky' },
    ],
    effects: [
      {
        title: 'Tri-Column Sweep',
        description: 'Fires twin flanking orbital beams (±110 px) plus a centered lance spanning full arena height.',
      },
      {
        title: 'Crit & Cooldown Scaling',
        description: 'Scales with Equipment Special Power, Fleet Critical Damage & Cooldown Reduction upgrades, and Critical rolls.',
      },
    ],
  },
  photon_barrage: {
    subtitle: 'Active Special · Homing Salvo',
    extraStats: [
      { label: 'Warheads Fired', value: '14 missiles', numericValue: 14, maxReference: 16, tone: 'amber' },
      { label: 'Seek Range', value: '480 px', numericValue: 480, maxReference: 600, tone: 'cyan' },
      { label: 'Warhead Velocity', value: '560 px/s', tone: 'sky' },
    ],
    effects: [
      {
        title: 'Warhead Payload & Crit Scaling',
        description: 'Each warhead deals 25% of Special Base Damage multiplied by Equipment Special Power and Critical Damage rolls.',
      },
      {
        title: 'Autonomous Tracking',
        description: 'Warheads lock onto active enemies and bosses across a wide fan arc.',
      },
    ],
  },
};

const SPECIAL_CODEX: CodexEntry[] = SPECIAL_LIST.map((spec) => {
  const meta = SPECIAL_METADATA[spec.id];
  return {
    id: `ability_${spec.id}`,
    sourceId: spec.id,
    category: 'abilities',
    name: spec.name,
    subtitle: meta?.subtitle ?? 'Active Special Ability',
    accentHex: spec.colorHex,
    description: spec.description,
    stats: [
      {
        label: 'Base Damage',
        value: `${spec.damage} DMG`,
        numericValue: spec.damage,
        maxReference: 200,
        tone: 'rose',
      },
      {
        label: 'Base Cooldown',
        value: `${(spec.cooldownMs / 1000).toFixed(1)} s`,
        numericValue: spec.cooldownMs / 1000,
        maxReference: 14,
        tone: 'amber',
      },
      ...(meta?.extraStats ?? []),
    ],
    specialEffects: meta?.effects ?? [],
    acquisition: 'Selectable anytime in Hangar & Weapons',
    searchKeywords: [spec.name, spec.description, 'special', 'ability'],
  };
});

const DASH_ABILITY: CodexEntry = {
  id: 'ability_thruster_dash',
  sourceId: 'thruster_dash',
  category: 'abilities',
  name: 'Emergency Thruster Dash',
  subtitle: 'Tactical Mobility · Built-In System',
  accentHex: '#22D3EE',
  description:
    'Propels your starfighter in your current movement vector at extreme burst speed to slip through bullet curtains.',
  stats: [
    {
      label: 'Dash Speed',
      value: `${GAME_CONSTANTS.DASH_SPEED} px/s`,
      numericValue: GAME_CONSTANTS.DASH_SPEED,
      maxReference: 1000,
      tone: 'cyan',
    },
    {
      label: 'Dash Duration',
      value: `${(GAME_CONSTANTS.DASH_DURATION_MS / 1000).toFixed(2)} s`,
      numericValue: GAME_CONSTANTS.DASH_DURATION_MS / 1000,
      maxReference: 0.5,
      tone: 'sky',
    },
    {
      label: 'Base Cooldown',
      value: `${(GAME_CONSTANTS.DASH_COOLDOWN_MS / 1000).toFixed(1)} s`,
      numericValue: GAME_CONSTANTS.DASH_COOLDOWN_MS / 1000,
      maxReference: 3,
      tone: 'amber',
    },
  ],
  specialEffects: [
    {
      title: 'Invulnerability Frames',
      description: 'Grants complete damage immunity for the entire 0.18s dash burst.',
    },
    {
      title: 'Cooldown Reduction Scaling',
      description: 'Cooldown is reduced by Utility Dash Actuator equipment upgrades.',
    },
  ],
  acquisition: 'Standard flight system on all aircraft (Shift / HUD Dash button)',
  searchKeywords: ['dash', 'dodge', 'thruster', 'mobility', 'invulnerability'],
};

export const ABILITIES_CODEX: CodexEntry[] = [...SPECIAL_CODEX, DASH_ABILITY];
