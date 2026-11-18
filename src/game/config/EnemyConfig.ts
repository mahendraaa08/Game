export type EnemyClass = 'scout' | 'fighter' | 'bomber' | 'tank' | 'elite';

export type EnemyBehavior =
  | 'straight'
  | 'zigzag'
  | 'sine'
  | 'diving'
  | 'formation'
  | 'tracking';

export interface EnemyDefinition {
  id: EnemyClass;
  name: string;
  textureKey: string;
  maxHp: number;
  damage: number;
  speed: number;
  fireCooldownMs: number;
  scoreReward: number;
  radius: number;
  accentColor: number;
  defaultBehavior: EnemyBehavior;
  attackPattern: 'single' | 'aimed' | 'radial_bomb' | 'burst_triple' | 'spread_fan';
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
};
