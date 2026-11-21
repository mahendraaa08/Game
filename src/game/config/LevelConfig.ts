import type { BossId } from './BossConfig';
import { formatSectorRewardText } from './EconomyConfig';
import type { EnemyBehavior, EnemyClass } from './EnemyConfig';

export interface WaveSpawnGroup {
  enemyClass: EnemyClass;
  count: number;
  behavior?: EnemyBehavior;
  formation?: 'line' | 'vee' | 'stagger' | 'flank';
  delayMs?: number;
}

export interface WavePhaseDefinition {
  groups: WaveSpawnGroup[];
  spawnIntervalMs?: number;
}

export interface WaveDefinition {
  id: number;
  title: string;
  spawnIntervalMs: number;
  phases: [WavePhaseDefinition, WavePhaseDefinition];
}

export interface LevelEnvironment {
  bgDeep: number;
  nebulaPrimary: number;
  nebulaSecondary: number;
  starTint: number;
  planetColor: number;
  planetRim: number;
  hasAsteroids: boolean;
  asteroidTint: number;
  hasStationSilhouettes: boolean;
  hasAuroraRifts: boolean;
  hasCyberGrid: boolean;
  hasVoidRifts: boolean;
}

export interface LevelDefinition {
  levelNumber: number;
  name: string;
  subtitle: string;
  objective: string;
  rewardText: string;
  difficultyMultiplier: number;
  bossId: BossId | null;
  environment: LevelEnvironment;
  waves: WaveDefinition[];
}

export const CAMPAIGN_LEVELS: LevelDefinition[] = [
  {
    levelNumber: 1,
    name: 'EARTH DEFENSE',
    subtitle: 'Low Earth Orbit · Year 3099',
    objective: 'Intercept the Void Empire vanguard fleet before they breach Earth orbital shields.',
    rewardText: formatSectorRewardText(1, 10, false, 'Asteroid Belt'),
    difficultyMultiplier: 1.0,
    bossId: null,
    environment: {
      bgDeep: 0x04091a,
      nebulaPrimary: 0x0ea5e9,
      nebulaSecondary: 0x1d4ed8,
      starTint: 0xe0f2fe,
      planetColor: 0x1e40af,
      planetRim: 0x38bdf8,
      hasAsteroids: false,
      asteroidTint: 0x64748b,
      hasStationSilhouettes: true,
      hasAuroraRifts: false,
      hasCyberGrid: false,
      hasVoidRifts: false,
    },
    waves: [
      {
        id: 1,
        title: 'First Contact',
        spawnIntervalMs: 850,
        phases: [
          {
            // 8 enemies
            groups: [
              { enemyClass: 'scout', count: 6, behavior: 'straight', formation: 'vee' },
              { enemyClass: 'scout', count: 2, behavior: 'zigzag', formation: 'flank', delayMs: 1400 },
            ],
          },
          {
            // 8 enemies
            spawnIntervalMs: 820,
            groups: [
              { enemyClass: 'scout', count: 5, behavior: 'zigzag', formation: 'stagger' },
              { enemyClass: 'fighter', count: 3, behavior: 'sine', formation: 'line', delayMs: 1300 },
            ],
          },
        ],
      },
      {
        id: 2,
        title: 'Orbital Raiders',
        spawnIntervalMs: 800,
        phases: [
          {
            // 10 enemies
            groups: [
              { enemyClass: 'scout', count: 7, behavior: 'zigzag', formation: 'stagger' },
              { enemyClass: 'fighter', count: 3, behavior: 'sine', formation: 'line', delayMs: 1300 },
            ],
          },
          {
            // 10 enemies
            spawnIntervalMs: 760,
            groups: [
              { enemyClass: 'scout', count: 6, behavior: 'flank_sweep', formation: 'flank' },
              { enemyClass: 'fighter', count: 4, behavior: 'formation', formation: 'vee', delayMs: 1200 },
            ],
          },
        ],
      },
      {
        id: 3,
        title: 'Shield Breachers',
        spawnIntervalMs: 750,
        phases: [
          {
            // 10 enemies
            groups: [
              { enemyClass: 'fighter', count: 4, behavior: 'sine', formation: 'vee' },
              { enemyClass: 'scout', count: 6, behavior: 'diving', formation: 'flank', delayMs: 1200 },
            ],
          },
          {
            // 10 enemies
            spawnIntervalMs: 720,
            groups: [
              { enemyClass: 'bomber', count: 3, behavior: 'diving', formation: 'line' },
              { enemyClass: 'scout', count: 7, behavior: 'zigzag', formation: 'stagger', delayMs: 1100 },
            ],
          },
        ],
      },
      {
        id: 4,
        title: 'Stratosphere Push',
        spawnIntervalMs: 700,
        phases: [
          {
            // 11 enemies
            groups: [
              { enemyClass: 'fighter', count: 5, behavior: 'orbit_harass', formation: 'stagger' },
              { enemyClass: 'bomber', count: 2, behavior: 'sine', formation: 'line', delayMs: 1100 },
              { enemyClass: 'scout', count: 4, behavior: 'flank_sweep', formation: 'flank', delayMs: 1800 },
            ],
          },
          {
            // 11 enemies
            spawnIntervalMs: 680,
            groups: [
              { enemyClass: 'tank', count: 2, behavior: 'straight', formation: 'line' },
              { enemyClass: 'fighter', count: 4, behavior: 'retreat_strafe', formation: 'flank', delayMs: 1000 },
              { enemyClass: 'scout', count: 5, behavior: 'diving', formation: 'vee', delayMs: 1700 },
            ],
          },
        ],
      },
      {
        id: 5,
        title: 'Vanguard Finale',
        spawnIntervalMs: 660,
        phases: [
          {
            // 13 enemies
            groups: [
              { enemyClass: 'fighter', count: 5, behavior: 'sine', formation: 'vee' },
              { enemyClass: 'bomber', count: 3, behavior: 'diving', formation: 'line', delayMs: 1100 },
              { enemyClass: 'scout', count: 5, behavior: 'zigzag', formation: 'stagger', delayMs: 1900 },
            ],
          },
          {
            // 13 enemies
            spawnIntervalMs: 640,
            groups: [
              { enemyClass: 'tank', count: 2, behavior: 'formation', formation: 'line' },
              { enemyClass: 'scout', count: 5, behavior: 'flank_sweep', formation: 'flank', delayMs: 1000 },
              { enemyClass: 'interceptor', count: 2, behavior: 'rush_weave', formation: 'flank', delayMs: 1350 },
              { enemyClass: 'fighter', count: 4, behavior: 'tracking', formation: 'stagger', delayMs: 1850 },
            ],
          },
        ],
      },
    ],
  },
  {
    levelNumber: 2,
    name: 'ASTEROID BELT',
    subtitle: 'Ceres Mining Corridor',
    objective: 'Navigate the asteroid drift and dismantle the Iron Guardian siege dreadnought.',
    rewardText: formatSectorRewardText(2, 10, true, 'Mars Outpost'),
    difficultyMultiplier: 1.12,
    bossId: 'iron_guardian',
    environment: {
      bgDeep: 0x0b0914,
      nebulaPrimary: 0xd97706,
      nebulaSecondary: 0x475569,
      starTint: 0xfef3c7,
      planetColor: 0x78350f,
      planetRim: 0xf59e0b,
      hasAsteroids: true,
      asteroidTint: 0x78716c,
      hasStationSilhouettes: false,
      hasAuroraRifts: false,
      hasCyberGrid: false,
      hasVoidRifts: false,
    },
    waves: [
      {
        id: 1,
        title: 'Belt Ambush',
        spawnIntervalMs: 780,
        phases: [
          {
            // 10 enemies
            groups: [
              { enemyClass: 'scout', count: 7, behavior: 'zigzag', formation: 'stagger' },
              { enemyClass: 'bomber', count: 3, behavior: 'diving', formation: 'line', delayMs: 1300 },
            ],
          },
          {
            // 10 enemies
            spawnIntervalMs: 750,
            groups: [
              { enemyClass: 'fighter', count: 4, behavior: 'sine', formation: 'vee' },
              { enemyClass: 'interceptor', count: 3, behavior: 'rush_weave', formation: 'flank', delayMs: 950 },
              { enemyClass: 'scout', count: 3, behavior: 'flank_sweep', formation: 'stagger', delayMs: 1450 },
            ],
          },
        ],
      },
      {
        id: 2,
        title: 'Armored Escort',
        spawnIntervalMs: 730,
        phases: [
          {
            // 10 enemies
            groups: [
              { enemyClass: 'fighter', count: 6, behavior: 'formation', formation: 'line' },
              { enemyClass: 'tank', count: 2, behavior: 'straight', delayMs: 1300 },
              { enemyClass: 'scout', count: 2, behavior: 'diving', formation: 'flank', delayMs: 1900 },
            ],
          },
          {
            // 10 enemies
            spawnIntervalMs: 700,
            groups: [
              { enemyClass: 'bomber', count: 4, behavior: 'sine', formation: 'stagger' },
              { enemyClass: 'fighter', count: 6, behavior: 'orbit_harass', formation: 'flank', delayMs: 1150 },
            ],
          },
        ],
      },
      {
        id: 3,
        title: 'Ceres Crossfire',
        spawnIntervalMs: 690,
        phases: [
          {
            // 11 enemies
            groups: [
              { enemyClass: 'scout', count: 5, behavior: 'diving', formation: 'flank' },
              { enemyClass: 'interceptor', count: 3, behavior: 'rush_weave', formation: 'vee', delayMs: 850 },
              { enemyClass: 'bomber', count: 3, behavior: 'diving', formation: 'line', delayMs: 1350 },
            ],
          },
          {
            // 11 enemies
            spawnIntervalMs: 670,
            groups: [
              { enemyClass: 'tank', count: 3, behavior: 'formation', formation: 'line' },
              { enemyClass: 'fighter', count: 8, behavior: 'retreat_strafe', formation: 'vee', delayMs: 1100 },
            ],
          },
        ],
      },
      {
        id: 4,
        title: 'Ore Forge Patrol',
        spawnIntervalMs: 660,
        phases: [
          {
            // 11 enemies
            groups: [
              { enemyClass: 'fighter', count: 6, behavior: 'tracking', formation: 'stagger' },
              { enemyClass: 'bomber', count: 5, behavior: 'flank_sweep', formation: 'flank', delayMs: 1100 },
            ],
          },
          {
            // 11 enemies
            spawnIntervalMs: 630,
            groups: [
              { enemyClass: 'elite', count: 2, behavior: 'orbit_harass', formation: 'vee' },
              { enemyClass: 'tank', count: 2, behavior: 'straight', formation: 'line', delayMs: 1000 },
              { enemyClass: 'interceptor', count: 3, behavior: 'rush_weave', formation: 'flank', delayMs: 1450 },
              { enemyClass: 'scout', count: 4, behavior: 'zigzag', formation: 'stagger', delayMs: 1850 },
            ],
          },
        ],
      },
      {
        id: 5,
        title: 'Siege Perimeter',
        spawnIntervalMs: 630,
        phases: [
          {
            // 12 enemies
            groups: [
              { enemyClass: 'bomber', count: 4, behavior: 'sine', formation: 'line' },
              { enemyClass: 'interceptor', count: 4, behavior: 'rush_weave', formation: 'flank', delayMs: 900 },
              { enemyClass: 'scout', count: 4, behavior: 'diving', formation: 'vee', delayMs: 1400 },
            ],
          },
          {
            // 12 enemies
            spawnIntervalMs: 600,
            groups: [
              { enemyClass: 'tank', count: 3, behavior: 'formation', formation: 'line' },
              { enemyClass: 'elite', count: 3, behavior: 'evasive', formation: 'flank', delayMs: 1100 },
              { enemyClass: 'fighter', count: 6, behavior: 'retreat_strafe', formation: 'stagger', delayMs: 1750 },
            ],
          },
        ],
      },
    ],
  },
  {
    levelNumber: 3,
    name: 'MARS OUTPOST',
    subtitle: 'Ares Colony Defense Grid',
    objective: 'Repel the Void assault force threatening the Martian civilian orbital habitats.',
    rewardText: formatSectorRewardText(3, 10, false, 'Nebula Zone'),
    difficultyMultiplier: 1.24,
    bossId: null,
    environment: {
      bgDeep: 0x13070b,
      nebulaPrimary: 0xdc2626,
      nebulaSecondary: 0x9a3412,
      starTint: 0xffedd5,
      planetColor: 0x991b1b,
      planetRim: 0xf97316,
      hasAsteroids: false,
      asteroidTint: 0x7c2d12,
      hasStationSilhouettes: true,
      hasAuroraRifts: false,
      hasCyberGrid: false,
      hasVoidRifts: false,
    },
    waves: [
      {
        id: 1,
        title: 'Red Horizon',
        spawnIntervalMs: 720,
        phases: [
          {
            // 12 enemies
            groups: [
              { enemyClass: 'fighter', count: 6, behavior: 'sine', formation: 'vee' },
              { enemyClass: 'scout', count: 6, behavior: 'zigzag', formation: 'stagger', delayMs: 1000 },
            ],
          },
          {
            // 12 enemies
            spawnIntervalMs: 690,
            groups: [
              { enemyClass: 'scout', count: 8, behavior: 'flank_sweep', formation: 'flank' },
              { enemyClass: 'bomber', count: 4, behavior: 'diving', formation: 'line', delayMs: 1150 },
            ],
          },
        ],
      },
      {
        id: 2,
        title: 'Bombardment Wing',
        spawnIntervalMs: 690,
        phases: [
          {
            // 10 enemies
            groups: [
              { enemyClass: 'bomber', count: 5, behavior: 'diving', formation: 'line' },
              { enemyClass: 'tank', count: 2, behavior: 'straight', delayMs: 1300 },
              { enemyClass: 'scout', count: 3, behavior: 'zigzag', formation: 'flank', delayMs: 1900 },
            ],
          },
          {
            // 10 enemies
            spawnIntervalMs: 660,
            groups: [
              { enemyClass: 'fighter', count: 4, behavior: 'orbit_harass', formation: 'stagger' },
              { enemyClass: 'sniper', count: 2, behavior: 'sniper_perch', formation: 'line', delayMs: 900 },
              { enemyClass: 'bomber', count: 4, behavior: 'sine', formation: 'vee', delayMs: 1300 },
            ],
          },
        ],
      },
      {
        id: 3,
        title: 'Ares Orbital Ring',
        spawnIntervalMs: 650,
        phases: [
          {
            // 13 enemies
            groups: [
              { enemyClass: 'scout', count: 5, behavior: 'evasive', formation: 'flank' },
              { enemyClass: 'interceptor', count: 3, behavior: 'rush_weave', formation: 'flank', delayMs: 800 },
              { enemyClass: 'fighter', count: 5, behavior: 'tracking', formation: 'vee', delayMs: 1200 },
            ],
          },
          {
            // 13 enemies
            spawnIntervalMs: 620,
            groups: [
              { enemyClass: 'tank', count: 3, behavior: 'formation', formation: 'line' },
              { enemyClass: 'sniper', count: 2, behavior: 'sniper_perch', formation: 'line', delayMs: 900 },
              { enemyClass: 'elite', count: 2, behavior: 'orbit_harass', delayMs: 1250 },
              { enemyClass: 'scout', count: 6, behavior: 'diving', formation: 'stagger', delayMs: 1750 },
            ],
          },
        ],
      },
      {
        id: 4,
        title: 'Dust Storm Flank',
        spawnIntervalMs: 620,
        phases: [
          {
            // 12 enemies
            groups: [
              { enemyClass: 'bomber', count: 5, behavior: 'flank_sweep', formation: 'flank' },
              { enemyClass: 'fighter', count: 7, behavior: 'retreat_strafe', formation: 'stagger', delayMs: 1100 },
            ],
          },
          {
            // 12 enemies
            spawnIntervalMs: 590,
            groups: [
              { enemyClass: 'elite', count: 3, behavior: 'evasive', formation: 'vee' },
              { enemyClass: 'tank', count: 2, behavior: 'straight', formation: 'line', delayMs: 950 },
              { enemyClass: 'interceptor', count: 4, behavior: 'rush_weave', formation: 'flank', delayMs: 1400 },
              { enemyClass: 'scout', count: 3, behavior: 'diving', formation: 'flank', delayMs: 1750 },
            ],
          },
        ],
      },
      {
        id: 5,
        title: 'Elite Vanguard',
        spawnIntervalMs: 590,
        phases: [
          {
            // 12 enemies
            groups: [
              { enemyClass: 'elite', count: 3, behavior: 'orbit_harass', formation: 'vee' },
              { enemyClass: 'sniper', count: 2, behavior: 'sniper_perch', formation: 'line', delayMs: 850 },
              { enemyClass: 'fighter', count: 4, behavior: 'retreat_strafe', formation: 'stagger', delayMs: 1200 },
              { enemyClass: 'bomber', count: 3, behavior: 'sine', formation: 'line', delayMs: 1850 },
            ],
          },
          {
            // 12 enemies
            spawnIntervalMs: 560,
            groups: [
              { enemyClass: 'tank', count: 3, behavior: 'formation', formation: 'line' },
              { enemyClass: 'bomber', count: 5, behavior: 'diving', formation: 'vee', delayMs: 1050 },
              { enemyClass: 'elite', count: 4, behavior: 'tracking', delayMs: 1700 },
            ],
          },
        ],
      },
    ],
  },
  {
    levelNumber: 4,
    name: 'NEBULA ZONE',
    subtitle: 'Violet Ion Storm Sector',
    objective: 'Hunt down the bio-plasma Venom Queen deep within the ionized purple nebula.',
    rewardText: formatSectorRewardText(4, 10, true, 'Alien Fortress'),
    difficultyMultiplier: 1.36,
    bossId: 'venom_queen',
    environment: {
      bgDeep: 0x0d061b,
      nebulaPrimary: 0xa855f7,
      nebulaSecondary: 0xec4899,
      starTint: 0xf3e8ff,
      planetColor: 0x581c87,
      planetRim: 0xc084fc,
      hasAsteroids: false,
      asteroidTint: 0x6b21a8,
      hasStationSilhouettes: false,
      hasAuroraRifts: true,
      hasCyberGrid: false,
      hasVoidRifts: false,
    },
    waves: [
      {
        id: 1,
        title: 'Swarm Surge',
        spawnIntervalMs: 670,
        phases: [
          {
            // 13 enemies
            groups: [
              { enemyClass: 'scout', count: 9, behavior: 'sine', formation: 'vee' },
              { enemyClass: 'bomber', count: 4, behavior: 'diving', delayMs: 1150 },
            ],
          },
          {
            // 13 enemies
            spawnIntervalMs: 640,
            groups: [
              { enemyClass: 'fighter', count: 6, behavior: 'flank_sweep', formation: 'flank' },
              { enemyClass: 'scout', count: 7, behavior: 'evasive', formation: 'stagger', delayMs: 1050 },
            ],
          },
        ],
      },
      {
        id: 2,
        title: 'Hive Defenders',
        spawnIntervalMs: 640,
        phases: [
          {
            // 10 enemies
            groups: [
              { enemyClass: 'fighter', count: 7, behavior: 'tracking', formation: 'stagger' },
              { enemyClass: 'elite', count: 3, behavior: 'sine', delayMs: 1150 },
            ],
          },
          {
            // 10 enemies
            spawnIntervalMs: 610,
            groups: [
              { enemyClass: 'bomber', count: 3, behavior: 'zigzag', formation: 'line' },
              { enemyClass: 'splitter', count: 2, behavior: 'pendulum_hover', formation: 'stagger', delayMs: 850 },
              { enemyClass: 'tank', count: 2, behavior: 'formation', delayMs: 1250 },
              { enemyClass: 'interceptor', count: 3, behavior: 'rush_weave', formation: 'flank', delayMs: 1800 },
            ],
          },
        ],
      },
      {
        id: 3,
        title: 'Plasma Brood',
        spawnIntervalMs: 610,
        phases: [
          {
            // 12 enemies
            groups: [
              { enemyClass: 'scout', count: 6, behavior: 'diving', formation: 'flank' },
              { enemyClass: 'sniper', count: 3, behavior: 'sniper_perch', formation: 'line', delayMs: 800 },
              { enemyClass: 'elite', count: 3, behavior: 'orbit_harass', delayMs: 1300 },
            ],
          },
          {
            // 12 enemies
            spawnIntervalMs: 580,
            groups: [
              { enemyClass: 'fighter', count: 7, behavior: 'retreat_strafe', formation: 'vee' },
              { enemyClass: 'bomber', count: 5, behavior: 'diving', formation: 'line', delayMs: 1150 },
            ],
          },
        ],
      },
      {
        id: 4,
        title: 'Ionized Vanguard',
        spawnIntervalMs: 580,
        phases: [
          {
            // 11 enemies
            groups: [
              { enemyClass: 'tank', count: 3, behavior: 'straight', formation: 'line' },
              { enemyClass: 'splitter', count: 2, behavior: 'pendulum_hover', formation: 'stagger', delayMs: 900 },
              { enemyClass: 'fighter', count: 6, behavior: 'orbit_harass', formation: 'stagger', delayMs: 1300 },
            ],
          },
          {
            // 11 enemies
            spawnIntervalMs: 550,
            groups: [
              { enemyClass: 'elite', count: 4, behavior: 'evasive', formation: 'vee' },
              { enemyClass: 'bomber', count: 7, behavior: 'flank_sweep', formation: 'flank', delayMs: 1150 },
            ],
          },
        ],
      },
      {
        id: 5,
        title: 'Royal Guard',
        spawnIntervalMs: 560,
        phases: [
          {
            // 16 enemies
            groups: [
              { enemyClass: 'tank', count: 3, behavior: 'formation', formation: 'line' },
              { enemyClass: 'bomber', count: 5, behavior: 'zigzag', delayMs: 1000 },
              { enemyClass: 'interceptor', count: 4, behavior: 'rush_weave', formation: 'flank', delayMs: 1450 },
              { enemyClass: 'scout', count: 4, behavior: 'sine', formation: 'vee', delayMs: 1850 },
            ],
          },
          {
            // 16 enemies
            spawnIntervalMs: 530,
            groups: [
              { enemyClass: 'elite', count: 4, behavior: 'tracking', formation: 'vee' },
              { enemyClass: 'splitter', count: 3, behavior: 'pendulum_hover', formation: 'stagger', delayMs: 850 },
              { enemyClass: 'sniper', count: 2, behavior: 'sniper_perch', formation: 'line', delayMs: 1200 },
              { enemyClass: 'fighter', count: 7, behavior: 'retreat_strafe', delayMs: 1650 },
            ],
          },
        ],
      },
    ],
  },
  {
    levelNumber: 5,
    name: 'ALIEN FORTRESS',
    subtitle: 'Outer Citadel Bastion',
    objective: 'Break through the Void Empire fortress perimeter and shatter its defensive battlegroups.',
    rewardText: formatSectorRewardText(5, 10, false, 'Frozen Galaxy'),
    difficultyMultiplier: 1.48,
    bossId: null,
    environment: {
      bgDeep: 0x0a050d,
      nebulaPrimary: 0xbe123c,
      nebulaSecondary: 0x4c1d95,
      starTint: 0xfecdd3,
      planetColor: 0x3b0764,
      planetRim: 0xf43f5e,
      hasAsteroids: false,
      asteroidTint: 0x4c1d95,
      hasStationSilhouettes: true,
      hasAuroraRifts: false,
      hasCyberGrid: false,
      hasVoidRifts: true,
    },
    waves: [
      {
        id: 1,
        title: 'Turret Screen',
        spawnIntervalMs: 630,
        phases: [
          {
            // 12 enemies
            groups: [
              { enemyClass: 'bastion', count: 2, behavior: 'fortress_march', formation: 'line' },
              { enemyClass: 'tank', count: 2, behavior: 'straight', formation: 'line', delayMs: 500 },
              { enemyClass: 'scout', count: 8, behavior: 'zigzag', delayMs: 1050 },
            ],
          },
          {
            // 12 enemies
            spawnIntervalMs: 600,
            groups: [
              { enemyClass: 'fighter', count: 7, behavior: 'sine', formation: 'vee' },
              { enemyClass: 'bomber', count: 5, behavior: 'diving', formation: 'stagger', delayMs: 1050 },
            ],
          },
        ],
      },
      {
        id: 2,
        title: 'Fortress Scramble',
        spawnIntervalMs: 600,
        phases: [
          {
            // 12 enemies
            groups: [
              { enemyClass: 'fighter', count: 5, behavior: 'flank_sweep', formation: 'flank' },
              { enemyClass: 'interceptor', count: 3, behavior: 'rush_weave', formation: 'flank', delayMs: 750 },
              { enemyClass: 'bomber', count: 4, behavior: 'diving', delayMs: 1150 },
            ],
          },
          {
            // 12 enemies
            spawnIntervalMs: 570,
            groups: [
              { enemyClass: 'elite', count: 4, behavior: 'orbit_harass', formation: 'vee' },
              { enemyClass: 'tank', count: 3, behavior: 'formation', formation: 'line', delayMs: 1000 },
              { enemyClass: 'sniper', count: 2, behavior: 'sniper_perch', formation: 'line', delayMs: 1450 },
              { enemyClass: 'scout', count: 3, behavior: 'evasive', formation: 'stagger', delayMs: 1850 },
            ],
          },
        ],
      },
      {
        id: 3,
        title: 'Bastion Breach',
        spawnIntervalMs: 570,
        phases: [
          {
            // 14 enemies
            groups: [
              { enemyClass: 'scout', count: 7, behavior: 'evasive', formation: 'stagger' },
              { enemyClass: 'splitter', count: 3, behavior: 'pendulum_hover', formation: 'stagger', delayMs: 850 },
              { enemyClass: 'bomber', count: 4, behavior: 'flank_sweep', formation: 'flank', delayMs: 1200 },
            ],
          },
          {
            // 14 enemies
            spawnIntervalMs: 540,
            groups: [
              { enemyClass: 'bastion', count: 3, behavior: 'fortress_march', formation: 'line' },
              { enemyClass: 'fighter', count: 7, behavior: 'retreat_strafe', formation: 'vee', delayMs: 950 },
              { enemyClass: 'scout', count: 4, behavior: 'diving', formation: 'flank', delayMs: 1700 },
            ],
          },
        ],
      },
      {
        id: 4,
        title: 'Iron Ramparts',
        spawnIntervalMs: 550,
        phases: [
          {
            // 11 enemies
            groups: [
              { enemyClass: 'elite', count: 4, behavior: 'tracking', formation: 'vee' },
              { enemyClass: 'fighter', count: 7, behavior: 'orbit_harass', formation: 'flank', delayMs: 1000 },
            ],
          },
          {
            // 11 enemies
            spawnIntervalMs: 520,
            groups: [
              { enemyClass: 'bomber', count: 6, behavior: 'diving', formation: 'line' },
              { enemyClass: 'tank', count: 5, behavior: 'formation', formation: 'line', delayMs: 1100 },
            ],
          },
        ],
      },
      {
        id: 5,
        title: 'Citadel Command Wing',
        spawnIntervalMs: 530,
        phases: [
          {
            // 14 enemies
            groups: [
              { enemyClass: 'elite', count: 4, behavior: 'tracking' },
              { enemyClass: 'bastion', count: 2, behavior: 'fortress_march', formation: 'line', delayMs: 850 },
              { enemyClass: 'sniper', count: 3, behavior: 'sniper_perch', formation: 'line', delayMs: 1250 },
              { enemyClass: 'scout', count: 5, behavior: 'zigzag', formation: 'flank', delayMs: 1700 },
            ],
          },
          {
            // 14 enemies
            spawnIntervalMs: 500,
            groups: [
              { enemyClass: 'fighter', count: 6, behavior: 'retreat_strafe', formation: 'flank' },
              { enemyClass: 'splitter', count: 3, behavior: 'pendulum_hover', formation: 'stagger', delayMs: 850 },
              { enemyClass: 'bomber', count: 2, behavior: 'sine', formation: 'vee', delayMs: 1250 },
              { enemyClass: 'elite', count: 3, behavior: 'evasive', delayMs: 1550 },
            ],
          },
        ],
      },
    ],
  },
  {
    levelNumber: 6,
    name: 'FROZEN GALAXY',
    subtitle: 'Cryo-Nebula Expanse',
    objective: 'Brave the sub-zero crystal fields and destroy the Shadow Titan stealth monolith.',
    rewardText: formatSectorRewardText(6, 10, true, 'Dark Dimension'),
    difficultyMultiplier: 1.6,
    bossId: 'shadow_titan',
    environment: {
      bgDeep: 0x030d18,
      nebulaPrimary: 0x06b6d4,
      nebulaSecondary: 0x3b82f6,
      starTint: 0xcffafe,
      planetColor: 0x0e7490,
      planetRim: 0x67e8f9,
      hasAsteroids: true,
      asteroidTint: 0x67e8f9,
      hasStationSilhouettes: false,
      hasAuroraRifts: true,
      hasCyberGrid: false,
      hasVoidRifts: false,
    },
    waves: [
      {
        id: 1,
        title: 'Glacial Strike',
        spawnIntervalMs: 590,
        phases: [
          {
            // 15 enemies
            groups: [
              { enemyClass: 'interceptor', count: 6, behavior: 'rush_weave', formation: 'vee' },
              { enemyClass: 'scout', count: 4, behavior: 'diving', formation: 'flank', delayMs: 550 },
              { enemyClass: 'fighter', count: 5, behavior: 'zigzag', delayMs: 1050 },
            ],
          },
          {
            // 15 enemies
            spawnIntervalMs: 560,
            groups: [
              { enemyClass: 'bomber', count: 5, behavior: 'sine', formation: 'stagger' },
              { enemyClass: 'fighter', count: 5, behavior: 'flank_sweep', formation: 'flank', delayMs: 950 },
              { enemyClass: 'sniper', count: 3, behavior: 'sniper_perch', formation: 'line', delayMs: 1400 },
              { enemyClass: 'scout', count: 2, behavior: 'evasive', formation: 'vee', delayMs: 1750 },
            ],
          },
        ],
      },
      {
        id: 2,
        title: 'Cryo Phalanx',
        spawnIntervalMs: 570,
        phases: [
          {
            // 14 enemies
            groups: [
              { enemyClass: 'bastion', count: 3, behavior: 'fortress_march', formation: 'line' },
              { enemyClass: 'elite', count: 4, behavior: 'tracking', delayMs: 1000 },
              { enemyClass: 'scout', count: 7, behavior: 'zigzag', formation: 'stagger', delayMs: 1700 },
            ],
          },
          {
            // 14 enemies
            spawnIntervalMs: 540,
            groups: [
              { enemyClass: 'interceptor', count: 5, behavior: 'rush_weave', formation: 'flank' },
              { enemyClass: 'splitter', count: 4, behavior: 'pendulum_hover', formation: 'stagger', delayMs: 850 },
              { enemyClass: 'bomber', count: 5, behavior: 'diving', formation: 'vee', delayMs: 1300 },
            ],
          },
        ],
      },
      {
        id: 3,
        title: 'Sub-Zero Ambush',
        spawnIntervalMs: 540,
        phases: [
          {
            // 11 enemies
            groups: [
              { enemyClass: 'fighter', count: 7, behavior: 'orbit_harass', formation: 'stagger' },
              { enemyClass: 'elite', count: 4, behavior: 'evasive', delayMs: 950 },
            ],
          },
          {
            // 11 enemies
            spawnIntervalMs: 520,
            groups: [
              { enemyClass: 'tank', count: 4, behavior: 'straight', formation: 'line' },
              { enemyClass: 'bomber', count: 7, behavior: 'flank_sweep', formation: 'flank', delayMs: 1050 },
            ],
          },
        ],
      },
      {
        id: 4,
        title: 'Shatter Glacier',
        spawnIntervalMs: 520,
        phases: [
          {
            // 14 enemies
            groups: [
              { enemyClass: 'scout', count: 7, behavior: 'zigzag', formation: 'vee' },
              { enemyClass: 'sniper', count: 3, behavior: 'sniper_perch', formation: 'line', delayMs: 750 },
              { enemyClass: 'tank', count: 4, behavior: 'formation', formation: 'line', delayMs: 1150 },
            ],
          },
          {
            // 14 enemies
            spawnIntervalMs: 500,
            groups: [
              { enemyClass: 'elite', count: 5, behavior: 'orbit_harass', formation: 'stagger' },
              { enemyClass: 'fighter', count: 9, behavior: 'retreat_strafe', formation: 'flank', delayMs: 950 },
            ],
          },
        ],
      },
      {
        id: 5,
        title: 'Aurora Gauntlet',
        spawnIntervalMs: 500,
        phases: [
          {
            // 16 enemies
            groups: [
              { enemyClass: 'bomber', count: 6, behavior: 'flank_sweep', formation: 'flank' },
              { enemyClass: 'fighter', count: 6, behavior: 'retreat_strafe', delayMs: 900 },
              { enemyClass: 'splitter', count: 4, behavior: 'pendulum_hover', formation: 'vee', delayMs: 1550 },
            ],
          },
          {
            // 16 enemies
            spawnIntervalMs: 480,
            groups: [
              { enemyClass: 'elite', count: 5, behavior: 'tracking', formation: 'vee' },
              { enemyClass: 'bastion', count: 3, behavior: 'fortress_march', formation: 'line', delayMs: 950 },
              { enemyClass: 'interceptor', count: 8, behavior: 'rush_weave', formation: 'flank', delayMs: 1550 },
            ],
          },
        ],
      },
    ],
  },
  {
    levelNumber: 7,
    name: 'DARK DIMENSION',
    subtitle: 'Subspace Singularity Rift',
    objective: 'Survive the dimensional anomalies and purge the elite Void patrol.',
    rewardText: formatSectorRewardText(7, 10, false, 'Cyber Planet'),
    difficultyMultiplier: 1.72,
    bossId: null,
    environment: {
      bgDeep: 0x050311,
      nebulaPrimary: 0x6366f1,
      nebulaSecondary: 0x7c3aed,
      starTint: 0xe0e7ff,
      planetColor: 0x1e1b4b,
      planetRim: 0x818cf8,
      hasAsteroids: false,
      asteroidTint: 0x4338ca,
      hasStationSilhouettes: false,
      hasAuroraRifts: false,
      hasCyberGrid: false,
      hasVoidRifts: true,
    },
    waves: [
      {
        id: 1,
        title: 'Rift Skirmishers',
        spawnIntervalMs: 560,
        phases: [
          {
            // 14 enemies
            groups: [
              { enemyClass: 'elite', count: 4, behavior: 'tracking' },
              { enemyClass: 'interceptor', count: 5, behavior: 'rush_weave', formation: 'flank', delayMs: 550 },
              { enemyClass: 'scout', count: 5, behavior: 'zigzag', formation: 'stagger', delayMs: 950 },
            ],
          },
          {
            // 14 enemies
            spawnIntervalMs: 530,
            groups: [
              { enemyClass: 'fighter', count: 8, behavior: 'flank_sweep', formation: 'flank' },
              { enemyClass: 'bomber', count: 6, behavior: 'sine', formation: 'vee', delayMs: 950 },
            ],
          },
        ],
      },
      {
        id: 2,
        title: 'Singularity Heavy Line',
        spawnIntervalMs: 540,
        phases: [
          {
            // 11 enemies
            groups: [
              { enemyClass: 'bastion', count: 3, behavior: 'fortress_march', formation: 'line' },
              { enemyClass: 'sniper', count: 3, behavior: 'sniper_perch', formation: 'line', delayMs: 750 },
              { enemyClass: 'bomber', count: 5, behavior: 'diving', delayMs: 1150 },
            ],
          },
          {
            // 11 enemies
            spawnIntervalMs: 510,
            groups: [
              { enemyClass: 'elite', count: 5, behavior: 'orbit_harass', formation: 'vee' },
              { enemyClass: 'fighter', count: 6, behavior: 'retreat_strafe', formation: 'stagger', delayMs: 950 },
            ],
          },
        ],
      },
      {
        id: 3,
        title: 'Event Horizon',
        spawnIntervalMs: 510,
        phases: [
          {
            // 16 enemies
            groups: [
              { enemyClass: 'scout', count: 8, behavior: 'evasive', formation: 'flank' },
              { enemyClass: 'splitter', count: 4, behavior: 'pendulum_hover', formation: 'stagger', delayMs: 750 },
              { enemyClass: 'harbinger', count: 2, behavior: 'phase_weave', formation: 'vee', delayMs: 1100 },
              { enemyClass: 'elite', count: 2, behavior: 'tracking', delayMs: 1450 },
            ],
          },
          {
            // 16 enemies
            spawnIntervalMs: 490,
            groups: [
              { enemyClass: 'tank', count: 4, behavior: 'formation', formation: 'line' },
              { enemyClass: 'bomber', count: 6, behavior: 'flank_sweep', formation: 'stagger', delayMs: 950 },
              { enemyClass: 'scout', count: 6, behavior: 'zigzag', formation: 'vee', delayMs: 1650 },
            ],
          },
        ],
      },
      {
        id: 4,
        title: 'Subspace Crossfire',
        spawnIntervalMs: 490,
        phases: [
          {
            // 12 enemies
            groups: [
              { enemyClass: 'fighter', count: 8, behavior: 'orbit_harass', formation: 'vee' },
              { enemyClass: 'tank', count: 4, behavior: 'straight', formation: 'line', delayMs: 950 },
            ],
          },
          {
            // 12 enemies
            spawnIntervalMs: 470,
            groups: [
              { enemyClass: 'elite', count: 4, behavior: 'evasive', formation: 'flank' },
              { enemyClass: 'sniper', count: 3, behavior: 'sniper_perch', formation: 'line', delayMs: 750 },
              { enemyClass: 'bomber', count: 5, behavior: 'diving', formation: 'stagger', delayMs: 1150 },
            ],
          },
        ],
      },
      {
        id: 5,
        title: 'Void Executioners',
        spawnIntervalMs: 470,
        phases: [
          {
            // 14 enemies
            groups: [
              { enemyClass: 'harbinger', count: 3, behavior: 'phase_weave', formation: 'vee' },
              { enemyClass: 'elite', count: 3, behavior: 'evasive', delayMs: 650 },
              { enemyClass: 'fighter', count: 8, behavior: 'orbit_harass', delayMs: 1050 },
            ],
          },
          {
            // 14 enemies
            spawnIntervalMs: 450,
            groups: [
              { enemyClass: 'bastion', count: 3, behavior: 'fortress_march', formation: 'line' },
              { enemyClass: 'splitter', count: 4, behavior: 'pendulum_hover', formation: 'stagger', delayMs: 750 },
              { enemyClass: 'bomber', count: 3, behavior: 'diving', formation: 'vee', delayMs: 1150 },
              { enemyClass: 'elite', count: 4, behavior: 'tracking', delayMs: 1500 },
            ],
          },
        ],
      },
    ],
  },
  {
    levelNumber: 8,
    name: 'CYBER PLANET',
    subtitle: 'Mechanized Dyson Nexus',
    objective: 'Infiltrate the machine world and deactivate the Cyber Leviathan core.',
    rewardText: formatSectorRewardText(8, 10, true, 'Void Territory'),
    difficultyMultiplier: 1.85,
    bossId: 'cyber_leviathan',
    environment: {
      bgDeep: 0x021210,
      nebulaPrimary: 0x10b981,
      nebulaSecondary: 0x06b6d4,
      starTint: 0xd1fae5,
      planetColor: 0x064e3b,
      planetRim: 0x34d399,
      hasAsteroids: false,
      asteroidTint: 0x059669,
      hasStationSilhouettes: true,
      hasAuroraRifts: false,
      hasCyberGrid: true,
      hasVoidRifts: false,
    },
    waves: [
      {
        id: 1,
        title: 'Firewall Swarm',
        spawnIntervalMs: 530,
        phases: [
          {
            // 18 enemies
            groups: [
              { enemyClass: 'interceptor', count: 6, behavior: 'rush_weave', formation: 'flank' },
              { enemyClass: 'scout', count: 6, behavior: 'sine', formation: 'vee', delayMs: 500 },
              { enemyClass: 'fighter', count: 6, behavior: 'formation', delayMs: 950 },
            ],
          },
          {
            // 18 enemies
            spawnIntervalMs: 500,
            groups: [
              { enemyClass: 'bomber', count: 5, behavior: 'flank_sweep', formation: 'flank' },
              { enemyClass: 'sniper', count: 3, behavior: 'sniper_perch', formation: 'line', delayMs: 750 },
              { enemyClass: 'elite', count: 4, behavior: 'tracking', formation: 'stagger', delayMs: 1100 },
              { enemyClass: 'scout', count: 6, behavior: 'zigzag', formation: 'vee', delayMs: 1550 },
            ],
          },
        ],
      },
      {
        id: 2,
        title: 'Sentinel Matrix',
        spawnIntervalMs: 510,
        phases: [
          {
            // 13 enemies
            groups: [
              { enemyClass: 'bastion', count: 3, behavior: 'fortress_march', formation: 'line' },
              { enemyClass: 'elite', count: 4, behavior: 'tracking', delayMs: 900 },
              { enemyClass: 'fighter', count: 6, behavior: 'sine', formation: 'vee', delayMs: 1550 },
            ],
          },
          {
            // 13 enemies
            spawnIntervalMs: 490,
            groups: [
              { enemyClass: 'fighter', count: 6, behavior: 'retreat_strafe', formation: 'flank' },
              { enemyClass: 'splitter', count: 3, behavior: 'pendulum_hover', formation: 'stagger', delayMs: 800 },
              { enemyClass: 'bomber', count: 4, behavior: 'diving', formation: 'line', delayMs: 1200 },
            ],
          },
        ],
      },
      {
        id: 3,
        title: 'Logic Gatekeepers',
        spawnIntervalMs: 490,
        phases: [
          {
            // 15 enemies
            groups: [
              { enemyClass: 'scout', count: 9, behavior: 'evasive', formation: 'stagger' },
              { enemyClass: 'sniper', count: 2, behavior: 'sniper_perch', formation: 'line', delayMs: 650 },
              { enemyClass: 'tank', count: 4, behavior: 'formation', formation: 'line', delayMs: 1000 },
            ],
          },
          {
            // 15 enemies
            spawnIntervalMs: 470,
            groups: [
              { enemyClass: 'harbinger', count: 3, behavior: 'phase_weave', formation: 'flank' },
              { enemyClass: 'elite', count: 4, behavior: 'orbit_harass', formation: 'vee', delayMs: 700 },
              { enemyClass: 'fighter', count: 8, behavior: 'tracking', formation: 'flank', delayMs: 1100 },
            ],
          },
        ],
      },
      {
        id: 4,
        title: 'Dyson Lockdown',
        spawnIntervalMs: 470,
        phases: [
          {
            // 16 enemies
            groups: [
              { enemyClass: 'bomber', count: 6, behavior: 'diving', formation: 'line' },
              { enemyClass: 'tank', count: 4, behavior: 'straight', formation: 'line', delayMs: 900 },
              { enemyClass: 'interceptor', count: 6, behavior: 'rush_weave', formation: 'flank', delayMs: 1450 },
            ],
          },
          {
            // 16 enemies
            spawnIntervalMs: 450,
            groups: [
              { enemyClass: 'elite', count: 6, behavior: 'evasive', formation: 'stagger' },
              { enemyClass: 'splitter', count: 4, behavior: 'pendulum_hover', formation: 'vee', delayMs: 750 },
              { enemyClass: 'scout', count: 6, behavior: 'flank_sweep', formation: 'flank', delayMs: 1200 },
            ],
          },
        ],
      },
      {
        id: 5,
        title: 'Nexus Overload',
        spawnIntervalMs: 450,
        phases: [
          {
            // 16 enemies
            groups: [
              { enemyClass: 'bomber', count: 5, behavior: 'diving' },
              { enemyClass: 'sniper', count: 3, behavior: 'sniper_perch', formation: 'line', delayMs: 700 },
              { enemyClass: 'elite', count: 4, behavior: 'evasive', delayMs: 1050 },
              { enemyClass: 'fighter', count: 4, behavior: 'orbit_harass', formation: 'stagger', delayMs: 1550 },
            ],
          },
          {
            // 16 enemies
            spawnIntervalMs: 430,
            groups: [
              { enemyClass: 'bastion', count: 3, behavior: 'fortress_march', formation: 'line' },
              { enemyClass: 'harbinger', count: 3, behavior: 'phase_weave', formation: 'flank', delayMs: 750 },
              { enemyClass: 'fighter', count: 6, behavior: 'orbit_harass', formation: 'vee', delayMs: 1100 },
              { enemyClass: 'elite', count: 4, behavior: 'tracking', delayMs: 1450 },
            ],
          },
        ],
      },
    ],
  },
  {
    levelNumber: 9,
    name: 'VOID TERRITORY',
    subtitle: 'Imperial Sovereign Space',
    objective: 'Punch through the Void Empire home fleet to open the path to the Throne Sector.',
    rewardText: formatSectorRewardText(9, 10, false, 'Final Reckoning'),
    difficultyMultiplier: 2.0,
    bossId: null,
    environment: {
      bgDeep: 0x110209,
      nebulaPrimary: 0xf43f5e,
      nebulaSecondary: 0x7e22ce,
      starTint: 0xffe4e6,
      planetColor: 0x4c0519,
      planetRim: 0xfb7185,
      hasAsteroids: true,
      asteroidTint: 0x881337,
      hasStationSilhouettes: true,
      hasAuroraRifts: false,
      hasCyberGrid: false,
      hasVoidRifts: true,
    },
    waves: [
      {
        id: 1,
        title: 'Imperial Guard',
        spawnIntervalMs: 500,
        phases: [
          {
            // 15 enemies
            groups: [
              { enemyClass: 'fighter', count: 6, behavior: 'tracking' },
              { enemyClass: 'bastion', count: 3, behavior: 'fortress_march', formation: 'line', delayMs: 800 },
              { enemyClass: 'interceptor', count: 6, behavior: 'rush_weave', formation: 'flank', delayMs: 1350 },
            ],
          },
          {
            // 15 enemies
            spawnIntervalMs: 480,
            groups: [
              { enemyClass: 'scout', count: 7, behavior: 'evasive', formation: 'flank' },
              { enemyClass: 'sniper', count: 3, behavior: 'sniper_perch', formation: 'line', delayMs: 700 },
              { enemyClass: 'elite', count: 5, behavior: 'orbit_harass', formation: 'vee', delayMs: 1050 },
            ],
          },
        ],
      },
      {
        id: 2,
        title: 'Crimson Storm',
        spawnIntervalMs: 480,
        phases: [
          {
            // 13 enemies
            groups: [
              { enemyClass: 'splitter', count: 4, behavior: 'pendulum_hover', formation: 'stagger' },
              { enemyClass: 'bomber', count: 4, behavior: 'diving', delayMs: 700 },
              { enemyClass: 'elite', count: 5, behavior: 'sine', delayMs: 1100 },
            ],
          },
          {
            // 13 enemies
            spawnIntervalMs: 460,
            groups: [
              { enemyClass: 'tank', count: 4, behavior: 'straight', formation: 'line' },
              { enemyClass: 'harbinger', count: 3, behavior: 'phase_weave', formation: 'flank', delayMs: 750 },
              { enemyClass: 'fighter', count: 6, behavior: 'retreat_strafe', formation: 'stagger', delayMs: 1100 },
            ],
          },
        ],
      },
      {
        id: 3,
        title: 'Sovereign Armada',
        spawnIntervalMs: 460,
        phases: [
          {
            // 18 enemies
            groups: [
              { enemyClass: 'interceptor', count: 7, behavior: 'rush_weave', formation: 'flank' },
              { enemyClass: 'scout', count: 5, behavior: 'flank_sweep', formation: 'flank', delayMs: 650 },
              { enemyClass: 'bomber', count: 6, behavior: 'zigzag', formation: 'vee', delayMs: 1050 },
            ],
          },
          {
            // 18 enemies
            spawnIntervalMs: 440,
            groups: [
              { enemyClass: 'elite', count: 6, behavior: 'evasive', formation: 'stagger' },
              { enemyClass: 'bastion', count: 4, behavior: 'fortress_march', formation: 'line', delayMs: 900 },
              { enemyClass: 'scout', count: 8, behavior: 'diving', formation: 'flank', delayMs: 1550 },
            ],
          },
        ],
      },
      {
        id: 4,
        title: 'Eclipse Bastion',
        spawnIntervalMs: 440,
        phases: [
          {
            // 14 enemies
            groups: [
              { enemyClass: 'fighter', count: 6, behavior: 'orbit_harass', formation: 'vee' },
              { enemyClass: 'sniper', count: 3, behavior: 'sniper_perch', formation: 'line', delayMs: 700 },
              { enemyClass: 'bomber', count: 5, behavior: 'diving', formation: 'line', delayMs: 1050 },
            ],
          },
          {
            // 14 enemies
            spawnIntervalMs: 430,
            groups: [
              { enemyClass: 'elite', count: 5, behavior: 'tracking', formation: 'flank' },
              { enemyClass: 'harbinger', count: 3, behavior: 'phase_weave', formation: 'vee', delayMs: 700 },
              { enemyClass: 'tank', count: 6, behavior: 'straight', formation: 'line', delayMs: 1100 },
            ],
          },
        ],
      },
      {
        id: 5,
        title: 'Throne Gatekeepers',
        spawnIntervalMs: 420,
        phases: [
          {
            // 20 enemies
            groups: [
              { enemyClass: 'elite', count: 5, behavior: 'orbit_harass' },
              { enemyClass: 'splitter', count: 4, behavior: 'pendulum_hover', formation: 'stagger', delayMs: 650 },
              { enemyClass: 'tank', count: 3, behavior: 'formation', delayMs: 1000 },
              { enemyClass: 'scout', count: 8, behavior: 'zigzag', formation: 'vee', delayMs: 1550 },
            ],
          },
          {
            // 20 enemies
            spawnIntervalMs: 410,
            groups: [
              { enemyClass: 'interceptor', count: 8, behavior: 'rush_weave', formation: 'flank' },
              { enemyClass: 'bomber', count: 4, behavior: 'diving', formation: 'vee', delayMs: 800 },
              { enemyClass: 'harbinger', count: 3, behavior: 'phase_weave', formation: 'flank', delayMs: 1150 },
              { enemyClass: 'elite', count: 5, behavior: 'retreat_strafe', delayMs: 1500 },
            ],
          },
        ],
      },
    ],
  },
  {
    levelNumber: 10,
    name: 'FINAL RECKONING',
    subtitle: 'Heart of the Void Empire',
    objective: 'Confront the Void Emperor and end the galactic war once and for all.',
    rewardText: formatSectorRewardText(10, 10, true),
    difficultyMultiplier: 2.15,
    bossId: 'void_emperor',
    environment: {
      bgDeep: 0x09010d,
      nebulaPrimary: 0xe11d48,
      nebulaSecondary: 0x9333ea,
      starTint: 0xfef08a,
      planetColor: 0x881337,
      planetRim: 0xf43f5e,
      hasAsteroids: false,
      asteroidTint: 0x9f1239,
      hasStationSilhouettes: true,
      hasAuroraRifts: true,
      hasCyberGrid: false,
      hasVoidRifts: true,
    },
    waves: [
      {
        id: 1,
        title: 'Eclipse Escort',
        spawnIntervalMs: 480,
        phases: [
          {
            // 17 enemies
            groups: [
              { enemyClass: 'interceptor', count: 7, behavior: 'rush_weave', formation: 'flank' },
              { enemyClass: 'scout', count: 5, behavior: 'diving', formation: 'vee', delayMs: 550 },
              { enemyClass: 'elite', count: 5, behavior: 'tracking', delayMs: 950 },
            ],
          },
          {
            // 17 enemies
            spawnIntervalMs: 460,
            groups: [
              { enemyClass: 'fighter', count: 8, behavior: 'flank_sweep', formation: 'flank' },
              { enemyClass: 'sniper', count: 3, behavior: 'sniper_perch', formation: 'line', delayMs: 700 },
              { enemyClass: 'bomber', count: 6, behavior: 'sine', formation: 'stagger', delayMs: 1050 },
            ],
          },
        ],
      },
      {
        id: 2,
        title: 'Armageddon Armada',
        spawnIntervalMs: 460,
        phases: [
          {
            // 14 enemies
            groups: [
              { enemyClass: 'bastion', count: 4, behavior: 'fortress_march', formation: 'line' },
              { enemyClass: 'splitter', count: 4, behavior: 'pendulum_hover', formation: 'stagger', delayMs: 700 },
              { enemyClass: 'bomber', count: 6, behavior: 'zigzag', delayMs: 1050 },
            ],
          },
          {
            // 14 enemies
            spawnIntervalMs: 440,
            groups: [
              { enemyClass: 'harbinger', count: 3, behavior: 'phase_weave', formation: 'flank' },
              { enemyClass: 'elite', count: 4, behavior: 'orbit_harass', formation: 'vee', delayMs: 700 },
              { enemyClass: 'fighter', count: 7, behavior: 'retreat_strafe', formation: 'flank', delayMs: 1050 },
            ],
          },
        ],
      },
      {
        id: 3,
        title: 'Obsidian Gauntlet',
        spawnIntervalMs: 440,
        phases: [
          {
            // 18 enemies
            groups: [
              { enemyClass: 'scout', count: 8, behavior: 'evasive', formation: 'flank' },
              { enemyClass: 'sniper', count: 4, behavior: 'sniper_perch', formation: 'line', delayMs: 650 },
              { enemyClass: 'elite', count: 6, behavior: 'tracking', delayMs: 1000 },
            ],
          },
          {
            // 18 enemies
            spawnIntervalMs: 430,
            groups: [
              { enemyClass: 'tank', count: 4, behavior: 'formation', formation: 'line' },
              { enemyClass: 'splitter', count: 4, behavior: 'pendulum_hover', formation: 'stagger', delayMs: 750 },
              { enemyClass: 'bomber', count: 4, behavior: 'diving', formation: 'stagger', delayMs: 1100 },
              { enemyClass: 'interceptor', count: 6, behavior: 'rush_weave', formation: 'vee', delayMs: 1550 },
            ],
          },
        ],
      },
      {
        id: 4,
        title: 'Throneworld Phalanx',
        spawnIntervalMs: 420,
        phases: [
          {
            // 14 enemies
            groups: [
              { enemyClass: 'fighter', count: 9, behavior: 'orbit_harass', formation: 'vee' },
              { enemyClass: 'bastion', count: 5, behavior: 'fortress_march', formation: 'line', delayMs: 900 },
            ],
          },
          {
            // 14 enemies
            spawnIntervalMs: 410,
            groups: [
              { enemyClass: 'harbinger', count: 4, behavior: 'phase_weave', formation: 'flank' },
              { enemyClass: 'elite', count: 4, behavior: 'evasive', formation: 'stagger', delayMs: 700 },
              { enemyClass: 'bomber', count: 6, behavior: 'flank_sweep', formation: 'flank', delayMs: 1050 },
            ],
          },
        ],
      },
      {
        id: 5,
        title: 'Emperor Vanguard',
        spawnIntervalMs: 400,
        phases: [
          {
            // 16 enemies
            groups: [
              { enemyClass: 'harbinger', count: 4, behavior: 'phase_weave', formation: 'flank' },
              { enemyClass: 'sniper', count: 3, behavior: 'sniper_perch', formation: 'line', delayMs: 650 },
              { enemyClass: 'elite', count: 4, behavior: 'evasive', delayMs: 950 },
              { enemyClass: 'fighter', count: 5, behavior: 'retreat_strafe', delayMs: 1300 },
            ],
          },
          {
            // 16 enemies
            spawnIntervalMs: 390,
            groups: [
              { enemyClass: 'bastion', count: 3, behavior: 'fortress_march', formation: 'line' },
              { enemyClass: 'splitter', count: 4, behavior: 'pendulum_hover', formation: 'stagger', delayMs: 650 },
              { enemyClass: 'bomber', count: 4, behavior: 'diving', formation: 'vee', delayMs: 1000 },
              { enemyClass: 'harbinger', count: 2, behavior: 'phase_weave', formation: 'flank', delayMs: 1350 },
              { enemyClass: 'elite', count: 3, behavior: 'tracking', delayMs: 1650 },
            ],
          },
        ],
      },
    ],
  },
];
