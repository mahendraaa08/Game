import { ENEMY_BASE_CREDIT_DROP } from '../../game/config/EconomyConfig';
import { ENEMY_CONFIGS, type EnemyClass } from '../../game/config/EnemyConfig';
import type { CodexEntry, CodexSpecialEffect } from './types';

const ENEMY_ORDER: EnemyClass[] = [
  'scout',
  'interceptor',
  'fighter',
  'sniper',
  'bomber',
  'splitter',
  'tank',
  'bastion',
  'elite',
  'harbinger',
];

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
      'Lightweight automated dart craft deployed in fast-moving packs with smooth banking zigzags and reactive dodge thrusters.',
    behaviorLabel: 'Zigzag, Flank Sweep & Evasive Jink',
    patternLabel: 'Tap-Burst & Angled Dart',
    effects: [
      {
        title: 'Evasive Thrusters & Attack Kit',
        description:
          'Weaves smoothly with banking tilt, executes reactive side-jinks when struck (3s cooldown), and alternates straight plasma taps with angled flank darts.',
      },
    ],
  },
  interceptor: {
    threat: 'Moderate Threat · High-Speed Flanker',
    description:
      'Swept-blade Void rusher engineered to dive through outer lanes at high velocity and slice across formations with twin shard darts.',
    behaviorLabel: 'Rush Weave & Diagonal Flank',
    patternLabel: 'Twin V-Darts & 3-Way Cross-Slash',
    effects: [
      {
        title: 'Flank Swoop & Shard Bursts',
        description:
          'Accelerates diagonally toward your lane before carving outward, firing rapid twin V-darts and 3-way shard slashes.',
      },
    ],
  },
  fighter: {
    threat: 'Moderate Threat · Tactical Interceptor',
    description:
      'Armored Void interceptor equipped with orbit-harass thrusters, retreat-strafing AI, and predictive twin-tap targeting.',
    behaviorLabel: 'Sine Patrol, Orbit Harass & Retreat Strafe',
    patternLabel: 'Double-Tap Aimed & Twin V-Split',
    effects: [
      {
        title: 'Aimed Engagement & Tactical Strafe',
        description:
          'Maintains optimal midrange altitude while alternating predictive double-tap rounds and twin V-split wing bolts after a brief telegraph.',
      },
    ],
  },
  sniper: {
    threat: 'High Threat · Long-Range Marksman',
    description:
      'Backline rail-gunner that locks onto high-altitude perches, paints targets with a laser sightline, and fires hyper-velocity rail shards.',
    behaviorLabel: 'High-Altitude Perch & Lateral Reposition',
    patternLabel: 'Laser-Telegraphed Rail Shard',
    effects: [
      {
        title: 'Targeting Sightline & Rail Shot',
        description:
          'Projects a 0.76s laser sightline (locking 0.22s before discharge) before firing 570 px/s piercing-velocity rail shards.',
      },
    ],
  },
  bomber: {
    threat: 'High Threat · Siege Striker',
    description:
      'Heavy ordnance carrier that dives toward your flight path, unleashes curved carpet bombs or radial rings, and smoothly pulls out to flank.',
    behaviorLabel: 'Diving Pullout & Flank Sweep',
    patternLabel: 'Rotating Bomb Ring & Carpet Spread',
    effects: [
      {
        title: 'Dive-Pullout & Dual Ordnance',
        description:
          'Dives after 22% screen height before pulling out sideways; alternates 6–8 orb rotating radial rings with curved 3-lane divergent carpet salvos.',
      },
    ],
  },
  splitter: {
    threat: 'High Threat · Cluster Disruptor',
    description:
      'Unstable hexagonal prism carrier that sweeps in wide pendulums and launches volatile Splitting Prism Orbs that burst mid-flight.',
    behaviorLabel: 'Pendulum Hover & Midfield Sweep',
    patternLabel: 'Splitting Prism Orbs & Shard Bursts',
    effects: [
      {
        title: 'Swelling Split Detonation',
        description:
          'Prism orbs swell visibly before bursting mid-air into 4–5 radial or fan-spread crystal shards, forcing lateral lane awareness.',
      },
    ],
  },
  tank: {
    threat: 'High Threat · Heavy Armored Hull',
    description:
      'Slow-moving armored cruiser that braces thrusters before firing multi-beat suppression salvos across vertical lanes.',
    behaviorLabel: 'Braced Advance & Tactical Formation',
    patternLabel: '3-Shot Burst & 2-Beat Layered Salvo',
    effects: [
      {
        title: 'Heavy Plating & Suppression Salvos',
        description:
          'High non-boss hull pool (175 base HP); decelerates during windup to fire 3-bolt cones or 2-beat 4-wide/3-tight layered plasma curtains.',
      },
    ],
  },
  bastion: {
    threat: 'High Threat · Shielded Fortress Cruiser',
    description:
      'Defensive emerald-plated warship protected by a regenerating frontal Energy Aegis barrier while projecting wave curtains and seeker pods.',
    behaviorLabel: 'Fortress March & Braced Guard',
    patternLabel: 'Aegis Wave Curtain & Homing Seeker',
    effects: [
      {
        title: 'Frontal Energy Aegis & Wave Curtain',
        description:
          'Carries an extra 75 base Energy Shield that absorbs damage before hull hits, firing counter-phased wave curtains and gentle homing seekers.',
      },
    ],
  },
  elite: {
    threat: 'Extreme Threat · Ace Squadron',
    description:
      'Crimson Void command fighter utilizing evasive dashes, orbital harassment, and a 3-pattern arsenal of aimed fans, tracking bursts, and curving spirals.',
    behaviorLabel: 'Lane Tracking, Orbit & Reactive Evasion',
    patternLabel: 'Aimed Fan, 3-Round Track & Curving Spiral',
    effects: [
      {
        title: 'Ace Combat Doctrine',
        description:
          'Maintains safe vertical spacing while dodging incoming lanes (2.1s cooldown) and cycling 3–5 way aimed fans, 3-round tracking bursts, and 6-orb curving spirals.',
      },
    ],
  },
  harbinger: {
    threat: 'Extreme Threat · Singularity Tactician',
    description:
      'Dread-class Void command craft capable of translucent phase-weaves while chaining homing seekers, X-grid waves, and 6-shard splitting orbs.',
    behaviorLabel: 'Phase Weave & Reactive Shimmer',
    patternLabel: 'Dual Seekers, X-Grid Wave & 6-Way Splitter',
    effects: [
      {
        title: 'Tri-Vector Void Arsenal',
        description:
          'Alternates twin homing seekers + rail shard combos, crisscrossing X-pattern wave curtains, and 6-shard splitting singularity orbs.',
      },
    ],
  },
};

export const ENEMIES_CODEX: CodexEntry[] = ENEMY_ORDER.map((id) => {
  const enemy = ENEMY_CONFIGS[id];
  const meta = ENEMY_LORE_AND_PATTERNS[id];
  const accentHex = `#${enemy.accentColor.toString(16).padStart(6, '0')}`;
  const effectiveHp = enemy.maxHp + (enemy.shieldHp ?? 0);

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
        label: enemy.shieldHp ? 'Hull + Shield HP' : 'Base Hull HP',
        value: enemy.shieldHp ? `${enemy.maxHp} + ${enemy.shieldHp} SHD` : `${enemy.maxHp} HP`,
        numericValue: effectiveHp,
        maxReference: 230,
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
        maxReference: 260,
        tone: 'cyan',
      },
      {
        label: 'Fire Cooldown',
        value: `${(enemy.fireCooldownMs / 1000).toFixed(2)} s`,
        numericValue: Number((enemy.fireCooldownMs / 1000).toFixed(2)),
        maxReference: 2.8,
        tone: 'amber',
      },
      {
        label: 'Projectile Velocity',
        value: `${enemy.projectileSpeed} px/s`,
        numericValue: enemy.projectileSpeed,
        maxReference: 600,
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
