import { ENEMY_BASE_CREDIT_DROP } from '../../game/config/EconomyConfig';
import { ENEMY_CONFIGS, type EnemyClass } from '../../game/config/EnemyConfig';
import type { CodexEntry, CodexSpecialEffect } from './types';

const ENEMY_ORDER: EnemyClass[] = ['scout', 'fighter', 'bomber', 'tank', 'elite'];

const ENEMY_LORE_AND_PATTERNS: Record<
  EnemyClass,
  {
    threat: string;
    description: string;
    behaviorLabel: string;
    patternLabel: string;
    effects: CodexSpecialEffect[];
  }
> = {
  scout: {
    threat: 'Low Threat · Vanguard Swarmer',
    description:
      'Lightweight automated dart craft deployed in fast-moving packs to test orbital perimeter defenses.',
    behaviorLabel: 'Zigzag Weave',
    patternLabel: 'Single Vertical Bolt',
    effects: [
      {
        title: 'Attack & Movement',
        description: 'Descends in wide sinusoidal zigzags while firing single straight downward plasma bolts.',
      },
    ],
  },
  fighter: {
    threat: 'Moderate Threat · Tactical Interceptor',
    description:
      'Armored Void interceptor equipped with predictive targeting thrusters that track player position.',
    behaviorLabel: 'Sine Patrol',
    patternLabel: '1 Aimed Bolt',
    effects: [
      {
        title: 'Aimed Engagement',
        description: 'Fires targeted plasma rounds directly toward your aircraft coordinates with a brief pre-fire telegraph.',
      },
    ],
  },
  bomber: {
    threat: 'High Threat · Siege Striker',
    description:
      'Heavy ordnance carrier that locks onto your vector mid-flight and unleashes omnidirectional bomb rings.',
    behaviorLabel: 'Diving Pursuit',
    patternLabel: '6-Way Radial Bomb Ring',
    effects: [
      {
        title: 'Dive Protocol & Radial Burst',
        description: 'Accelerates at 1.45x speed toward the player after passing 24% screen height and fires 6 radial bombs.',
      },
    ],
  },
  tank: {
    threat: 'High Threat · Heavy Armored Hull',
    description:
      'Slow-moving armored cruiser soaking sustained fire while blanketing vertical lanes with triple plasma bursts.',
    behaviorLabel: 'Steady Advance',
    patternLabel: '3-Shot Forward Spread',
    effects: [
      {
        title: 'Heavy Plating & Salvo',
        description: 'Highest non-boss hull pool (175 base HP); fires a 3-bolt forward cone (-0.25, 0, +0.25 rad).',
      },
    ],
  },
  elite: {
    threat: 'Extreme Threat · Ace Squadron',
    description:
      'Crimson Void command fighter that shadows your horizontal lane and unleashes rapid aimed fan spreads.',
    behaviorLabel: 'Active Lane Tracking',
    patternLabel: '3-Way Aimed Fan Spread',
    effects: [
      {
        title: 'Hover Tracking & Rapid Fire',
        description: 'Tracks player X-axis continuously in the upper third of the arena with the fastest enemy projectile speed (380 px/s).',
      },
    ],
  },
};

export const ENEMIES_CODEX: CodexEntry[] = ENEMY_ORDER.map((id) => {
  const enemy = ENEMY_CONFIGS[id];
  const meta = ENEMY_LORE_AND_PATTERNS[id];
  const accentHex = `#${enemy.accentColor.toString(16).padStart(6, '0')}`;

  return {
    id: `enemy_${enemy.id}`,
    sourceId: enemy.id,
    category: 'enemies',
    name: enemy.name,
    subtitle: `${meta.threat} · ${meta.patternLabel}`,
    accentHex,
    description: meta.description,
    stats: [
      {
        label: 'Base Hull HP',
        value: `${enemy.maxHp} HP`,
        numericValue: enemy.maxHp,
        maxReference: 180,
        tone: 'emerald',
      },
      {
        label: 'Projectile Damage',
        value: `${enemy.damage} DMG`,
        numericValue: enemy.damage,
        maxReference: 30,
        tone: 'rose',
      },
      {
        label: 'Flight Speed',
        value: `${enemy.speed} px/s`,
        numericValue: enemy.speed,
        maxReference: 240,
        tone: 'cyan',
      },
      {
        label: 'Fire Cooldown',
        value: `${(enemy.fireCooldownMs / 1000).toFixed(2)} s`,
        numericValue: Number((enemy.fireCooldownMs / 1000).toFixed(2)),
        maxReference: 2.6,
        tone: 'amber',
      },
      {
        label: 'Projectile Velocity',
        value: `${enemy.projectileSpeed} px/s`,
        numericValue: enemy.projectileSpeed,
        maxReference: 400,
        tone: 'sky',
      },
      {
        label: 'Base Reward',
        value: `${enemy.scoreReward} pts · ${ENEMY_BASE_CREDIT_DROP[id]} CR`,
        tone: 'amber',
      },
    ],
    specialEffects: [
      {
        title: `Flight Behavior: ${meta.behaviorLabel}`,
        description: `Collision deals ${enemy.damage + 6} contact damage before hull armor mitigation.`,
      },
      ...meta.effects,
    ],
    acquisition: 'Appears across Campaign Sectors, Endless Survival, and Challenge Waves',
    searchKeywords: [enemy.name, meta.threat, meta.behaviorLabel, meta.patternLabel, 'enemy'],
  };
});
