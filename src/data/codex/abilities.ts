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
    subtitle: 'Active Special · Instant AoE & Bullet Clear',
    extraStats: [
      { label: 'Shockwave Radius', value: '520 px', numericValue: 520, maxReference: 600, tone: 'sky' },
      { label: 'Projectile Clear', value: 'Full Screen', tone: 'cyan' },
    ],
    effects: [
      {
        title: 'Bullet Erasure & Emergency Shielding',
        description: 'Instantly vaporizes every active hostile projectile across the arena while dealing high radial shock damage.',
      },
      {
        title: 'Crit & Cooldown Scaling',
        description: 'Damage scales with Special Power, Critical Chance/Damage, and Fleet upgrades; cooldown scales with Special Cooldown Reduction.',
      },
    ],
  },
  chrono_singularity: {
    subtitle: 'Active Special · Selective Stasis Field',
    extraStats: [
      { label: 'Stasis Duration', value: '3.6 s', numericValue: 3.6, maxReference: 5, tone: 'purple' },
      { label: 'Stasis Scope', value: 'Enemies, Boss & Bullets', tone: 'cyan' },
    ],
    effects: [
      {
        title: 'Selective Time Manipulation',
        description: 'Freezes hostile ships, boss actions/timers, and enemy projectiles in place while your starfighter, weapons, and companion drones operate at full speed.',
      },
      {
        title: 'Crit & Cooldown Scaling',
        description: 'Initial temporal shockwave scales with Special Power and Critical rolls; ends cleanly when the 3.6s stasis field expires.',
      },
    ],
  },
  gravity_well: {
    subtitle: 'Active Special · Gravitational Crowd Control',
    extraStats: [
      { label: 'Pull Radius', value: '235 px', numericValue: 235, maxReference: 300, tone: 'amber' },
      { label: 'Vortex Duration', value: '4.2 s', numericValue: 4.2, maxReference: 5, tone: 'purple' },
      { label: 'Damage Tick', value: '0.28 s', numericValue: 0.28, maxReference: 1, tone: 'cyan' },
    ],
    effects: [
      {
        title: 'Black Hole Pull & Sustained AoE',
        description: 'Anchors a gravity vortex in the upper-center arena that pulls standard enemies inward (safely clamped within bounds) and deals rapid periodic Special damage.',
      },
      {
        title: 'Boss Crowd-Control Immunity',
        description: 'Boss flagships resist gravitational displacement while still taking full periodic AoE damage inside the singularity.',
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
        label: spec.id === 'gravity_well' ? 'Tick Base Damage' : 'Base Damage',
        value: spec.id === 'gravity_well' ? `${spec.damage} DMG / tick` : `${spec.damage} DMG`,
        numericValue: spec.damage,
        maxReference: 180,
        tone: 'rose',
      },
      {
        label: 'Base Cooldown',
        value: `${(spec.cooldownMs / 1000).toFixed(1)} s`,
        numericValue: spec.cooldownMs / 1000,
        maxReference: 15,
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
