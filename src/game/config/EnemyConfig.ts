export type EnemyClass =
  | 'scout'
  | 'fighter'
  | 'bomber'
  | 'tank'
  | 'elite'
  | 'interceptor'
  | 'sniper'
  | 'splitter'
  | 'bastion'
  | 'harbinger';

export type EnemyBehavior =
  | 'straight'
  | 'zigzag'
  | 'sine'
  | 'diving'
  | 'formation'
  | 'tracking'
  | 'flank_sweep'
  | 'orbit_harass'
  | 'retreat_strafe'
  | 'evasive'
  | 'rush_weave'
  | 'sniper_perch'
  | 'pendulum_hover'
  | 'fortress_march'
  | 'phase_weave';

export interface EnemyDefinition {
  id: EnemyClass;
  name: string;
  textureKey: string;
  maxHp: number;
  shieldHp?: number;
  damage: number;
  speed: number;
  fireCooldownMs: number;
  scoreReward: number;
  radius: number;
  accentColor: number;
  defaultBehavior: EnemyBehavior;
  attackPattern:
    | 'single'
    | 'aimed'
    | 'radial_bomb'
    | 'burst_triple'
    | 'spread_fan'
    | 'twin_rush'
    | 'rail_sniper'
    | 'cluster_split'
    | 'aegis_wave'
    | 'void_combo';
  projectileSpeed: number;
}

export const ENEMY_CONFIGS: Record<EnemyClass, EnemyDefinition> = {
  scout: {
    id: 'scout',
    name: 'Scout Drone',
    textureKey: 'enemy_scout',
    maxHp: 28,
    damage: 12,
    speed: 225,
    fireCooldownMs: 2100,
    scoreReward: 100,
    radius: 17,
    accentColor: 0x38bdf8,
    defaultBehavior: 'zigzag',
    attackPattern: 'single',
    projectileSpeed: 310,
  },
  interceptor: {
    id: 'interceptor',
    name: 'Void Interceptor',
    textureKey: 'enemy_interceptor',
    maxHp: 38,
    damage: 14,
    speed: 245,
    fireCooldownMs: 1650,
    scoreReward: 160,
    radius: 18,
    accentColor: 0x22d3ee,
    defaultBehavior: 'rush_weave',
    attackPattern: 'twin_rush',
    projectileSpeed: 390,
  },
  fighter: {
    id: 'fighter',
    name: 'Armored Fighter',
    textureKey: 'enemy_fighter',
    maxHp: 62,
    damage: 16,
    speed: 145,
    fireCooldownMs: 1750,
    scoreReward: 220,
    radius: 22,
    accentColor: 0xef4444,
    defaultBehavior: 'sine',
    attackPattern: 'aimed',
    projectileSpeed: 350,
  },
  sniper: {
    id: 'sniper',
    name: 'Rail Sniper',
    textureKey: 'enemy_sniper',
    maxHp: 56,
    damage: 22,
    speed: 135,
    fireCooldownMs: 2650,
    scoreReward: 290,
    radius: 20,
    accentColor: 0x818cf8,
    defaultBehavior: 'sniper_perch',
    attackPattern: 'rail_sniper',
    projectileSpeed: 570,
  },
  bomber: {
    id: 'bomber',
    name: 'Void Bomber',
    textureKey: 'enemy_bomber',
    maxHp: 85,
    damage: 22,
    speed: 118,
    fireCooldownMs: 2500,
    scoreReward: 320,
    radius: 25,
    accentColor: 0xf97316,
    defaultBehavior: 'diving',
    attackPattern: 'radial_bomb',
    projectileSpeed: 240,
  },
  splitter: {
    id: 'splitter',
    name: 'Cluster Carrier',
    textureKey: 'enemy_splitter',
    maxHp: 95,
    damage: 18,
    speed: 120,
    fireCooldownMs: 2450,
    scoreReward: 380,
    radius: 25,
    accentColor: 0xfacc15,
    defaultBehavior: 'pendulum_hover',
    attackPattern: 'cluster_split',
    projectileSpeed: 235,
  },
  tank: {
    id: 'tank',
    name: 'Heavy Tank',
    textureKey: 'enemy_tank',
    maxHp: 175,
    damage: 26,
    speed: 74,
    fireCooldownMs: 2200,
    scoreReward: 480,
    radius: 31,
    accentColor: 0xa855f7,
    defaultBehavior: 'straight',
    attackPattern: 'burst_triple',
    projectileSpeed: 290,
  },
  bastion: {
    id: 'bastion',
    name: 'Aegis Bastion',
    textureKey: 'enemy_bastion',
    maxHp: 145,
    shieldHp: 75,
    damage: 20,
    speed: 78,
    fireCooldownMs: 2350,
    scoreReward: 520,
    radius: 30,
    accentColor: 0x10b981,
    defaultBehavior: 'fortress_march',
    attackPattern: 'aegis_wave',
    projectileSpeed: 280,
  },
  elite: {
    id: 'elite',
    name: 'Elite Fighter',
    textureKey: 'enemy_elite',
    maxHp: 135,
    damage: 22,
    speed: 175,
    fireCooldownMs: 1400,
    scoreReward: 560,
    radius: 24,
    accentColor: 0xf43f5e,
    defaultBehavior: 'tracking',
    attackPattern: 'spread_fan',
    projectileSpeed: 380,
  },
  harbinger: {
    id: 'harbinger',
    name: 'Void Harbinger',
    textureKey: 'enemy_harbinger',
    maxHp: 165,
    damage: 24,
    speed: 165,
    fireCooldownMs: 1700,
    scoreReward: 680,
    radius: 26,
    accentColor: 0xe879f9,
    defaultBehavior: 'phase_weave',
    attackPattern: 'void_combo',
    projectileSpeed: 330,
  },
};
