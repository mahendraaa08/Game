import { BossId } from './BossConfig';
import { EnemyBehavior, EnemyClass } from './EnemyConfig';

export interface WaveSpawnGroup {
  enemyClass: EnemyClass;
  count: number;
  behavior?: EnemyBehavior;
  formation?: 'line' | 'vee' | 'stagger' | 'flank';
  delayMs?: number;
}

export interface WaveDefinition {
  id: number;
  title: string;
  groups: WaveSpawnGroup[];
  spawnIntervalMs: number;
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
    rewardText: 'Unlocks Sector 02: Asteroid Belt · +1,000 Clear Bonus',
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
        spawnIntervalMs: 700,
        groups: [{ enemyClass: 'scout', count: 7, behavior: 'straight', formation: 'vee' }],
      },
      {
        id: 2,
        title: 'Orbital Raiders',
        spawnIntervalMs: 650,
        groups: [
          { enemyClass: 'scout', count: 6, behavior: 'zigzag', formation: 'stagger' },
          { enemyClass: 'fighter', count: 3, behavior: 'sine', formation: 'line', delayMs: 1200 },
        ],
      },
      {
        id: 3,
        title: 'Vanguard Sweep',
        spawnIntervalMs: 600,
        groups: [
          { enemyClass: 'fighter', count: 5, behavior: 'sine', formation: 'vee' },
          { enemyClass: 'scout', count: 6, behavior: 'diving', formation: 'flank', delayMs: 1400 },
        ],
      },
    ],
  },
  {
    levelNumber: 2,
    name: 'ASTEROID BELT',
    subtitle: 'Ceres Mining Corridor',
    objective: 'Navigate the asteroid drift and dismantle the Iron Guardian siege dreadnought.',
    rewardText: 'Unlocks Sector 03: Mars Outpost · +2,500 Clear Bonus',
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
        spawnIntervalMs: 620,
        groups: [
          { enemyClass: 'scout', count: 7, behavior: 'zigzag', formation: 'stagger' },
          { enemyClass: 'bomber', count: 2, behavior: 'diving', delayMs: 1300 },
        ],
      },
      {
        id: 2,
        title: 'Armored Escort',
        spawnIntervalMs: 600,
        groups: [
          { enemyClass: 'fighter', count: 5, behavior: 'formation', formation: 'line' },
          { enemyClass: 'tank', count: 2, behavior: 'straight', delayMs: 1500 },
        ],
      },
      {
        id: 3,
        title: 'Siege Perimeter',
        spawnIntervalMs: 560,
        groups: [
          { enemyClass: 'bomber', count: 3, behavior: 'sine' },
          { enemyClass: 'scout', count: 8, behavior: 'diving', formation: 'vee', delayMs: 1000 },
        ],
      },
    ],
  },
  {
    levelNumber: 3,
    name: 'MARS OUTPOST',
    subtitle: 'Ares Colony Defense Grid',
    objective: 'Repel the Void assault force threatening the Martian civilian orbital habitats.',
    rewardText: 'Unlocks Sector 04: Nebula Zone · +3,000 Clear Bonus',
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
        spawnIntervalMs: 580,
        groups: [
          { enemyClass: 'fighter', count: 6, behavior: 'sine', formation: 'vee' },
          { enemyClass: 'scout', count: 6, behavior: 'zigzag', delayMs: 900 },
        ],
      },
      {
        id: 2,
        title: 'Bombardment Wing',
        spawnIntervalMs: 560,
        groups: [
          { enemyClass: 'bomber', count: 4, behavior: 'diving', formation: 'line' },
          { enemyClass: 'tank', count: 2, behavior: 'straight', delayMs: 1400 },
        ],
      },
      {
        id: 3,
        title: 'Elite Vanguard',
        spawnIntervalMs: 520,
        groups: [
          { enemyClass: 'elite', count: 2, behavior: 'tracking' },
          { enemyClass: 'fighter', count: 6, behavior: 'formation', formation: 'stagger', delayMs: 1200 },
        ],
      },
    ],
  },
  {
    levelNumber: 4,
    name: 'NEBULA ZONE',
    subtitle: 'Violet Ion Storm Sector',
    objective: 'Hunt down the bio-plasma Venom Queen deep within the ionized purple nebula.',
    rewardText: 'Unlocks Sector 05: Alien Fortress · +4,500 Clear Bonus',
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
        spawnIntervalMs: 520,
        groups: [
          { enemyClass: 'scout', count: 10, behavior: 'sine', formation: 'vee' },
          { enemyClass: 'bomber', count: 3, behavior: 'diving', delayMs: 1100 },
        ],
      },
      {
        id: 2,
        title: 'Hive Defenders',
        spawnIntervalMs: 520,
        groups: [
          { enemyClass: 'fighter', count: 6, behavior: 'tracking' },
          { enemyClass: 'elite', count: 2, behavior: 'sine', delayMs: 1200 },
        ],
      },
      {
        id: 3,
        title: 'Royal Guard',
        spawnIntervalMs: 500,
        groups: [
          { enemyClass: 'tank', count: 3, behavior: 'formation', formation: 'line' },
          { enemyClass: 'bomber', count: 4, behavior: 'zigzag', delayMs: 1000 },
        ],
      },
    ],
  },
  {
    levelNumber: 5,
    name: 'ALIEN FORTRESS',
    subtitle: 'Outer Citadel Bastion',
    objective: 'Break through the Void Empire fortress perimeter and shatter its defensive battlegroups.',
    rewardText: 'Unlocks Sector 06: Frozen Galaxy · +5,500 Clear Bonus',
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
        spawnIntervalMs: 500,
        groups: [
          { enemyClass: 'tank', count: 3, behavior: 'straight', formation: 'line' },
          { enemyClass: 'scout', count: 8, behavior: 'zigzag', delayMs: 800 },
        ],
      },
      {
        id: 2,
        title: 'Fortress Scramble',
        spawnIntervalMs: 480,
        groups: [
          { enemyClass: 'fighter', count: 7, behavior: 'diving', formation: 'flank' },
          { enemyClass: 'bomber', count: 4, behavior: 'sine', delayMs: 1000 },
        ],
      },
      {
        id: 3,
        title: 'Citadel Command Wing',
        spawnIntervalMs: 460,
        groups: [
          { enemyClass: 'elite', count: 4, behavior: 'tracking' },
          { enemyClass: 'tank', count: 2, behavior: 'straight', delayMs: 1100 },
        ],
      },
    ],
  },
  {
    levelNumber: 6,
    name: 'FROZEN GALAXY',
    subtitle: 'Cryo-Nebula Expanse',
    objective: 'Brave the sub-zero crystal fields and destroy the Shadow Titan stealth monolith.',
    rewardText: 'Unlocks Sector 07: Dark Dimension · +7,000 Clear Bonus',
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
        spawnIntervalMs: 470,
        groups: [
          { enemyClass: 'scout', count: 10, behavior: 'diving', formation: 'vee' },
          { enemyClass: 'fighter', count: 5, behavior: 'zigzag', delayMs: 900 },
        ],
      },
      {
        id: 2,
        title: 'Cryo Phalanx',
        spawnIntervalMs: 460,
        groups: [
          { enemyClass: 'tank', count: 3, behavior: 'formation', formation: 'line' },
          { enemyClass: 'elite', count: 3, behavior: 'tracking', delayMs: 1100 },
        ],
      },
      {
        id: 3,
        title: 'Aurora Gauntlet',
        spawnIntervalMs: 440,
        groups: [
          { enemyClass: 'bomber', count: 5, behavior: 'sine' },
          { enemyClass: 'fighter', count: 6, behavior: 'tracking', delayMs: 900 },
        ],
      },
    ],
  },
  {
    levelNumber: 7,
    name: 'DARK DIMENSION',
    subtitle: 'Subspace Singularity Rift',
    objective: 'Survive the dimensional anomalies and purge the elite Void patrol.',
    rewardText: 'Unlocks Sector 08: Cyber Planet · +8,000 Clear Bonus',
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
        spawnIntervalMs: 430,
        groups: [
          { enemyClass: 'elite', count: 3, behavior: 'tracking' },
          { enemyClass: 'scout', count: 10, behavior: 'zigzag', formation: 'stagger', delayMs: 700 },
        ],
      },
      {
        id: 2,
        title: 'Singularity Heavy Line',
        spawnIntervalMs: 430,
        groups: [
          { enemyClass: 'tank', count: 4, behavior: 'straight', formation: 'line' },
          { enemyClass: 'bomber', count: 5, behavior: 'diving', delayMs: 900 },
        ],
      },
      {
        id: 3,
        title: 'Void Executioners',
        spawnIntervalMs: 400,
        groups: [
          { enemyClass: 'elite', count: 5, behavior: 'sine' },
          { enemyClass: 'fighter', count: 7, behavior: 'tracking', delayMs: 900 },
        ],
      },
    ],
  },
  {
    levelNumber: 8,
    name: 'CYBER PLANET',
    subtitle: 'Mechanized Dyson Nexus',
    objective: 'Infiltrate the machine world and deactivate the Cyber Leviathan core.',
    rewardText: 'Unlocks Sector 09: Void Territory · +10,000 Clear Bonus',
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
        spawnIntervalMs: 410,
        groups: [
          { enemyClass: 'scout', count: 12, behavior: 'sine', formation: 'vee' },
          { enemyClass: 'fighter', count: 6, behavior: 'formation', delayMs: 800 },
        ],
      },
      {
        id: 2,
        title: 'Sentinel Matrix',
        spawnIntervalMs: 400,
        groups: [
          { enemyClass: 'tank', count: 4, behavior: 'straight' },
          { enemyClass: 'elite', count: 4, behavior: 'tracking', delayMs: 900 },
        ],
      },
      {
        id: 3,
        title: 'Nexus Overload',
        spawnIntervalMs: 380,
        groups: [
          { enemyClass: 'bomber', count: 6, behavior: 'diving' },
          { enemyClass: 'elite', count: 4, behavior: 'zigzag', delayMs: 900 },
        ],
      },
    ],
  },
  {
    levelNumber: 9,
    name: 'VOID TERRITORY',
    subtitle: 'Imperial Sovereign Space',
    objective: 'Punch through the Void Empire home fleet to open the path to the Throne Sector.',
    rewardText: 'Unlocks Sector 10: Final Reckoning · +12,000 Clear Bonus',
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
        spawnIntervalMs: 380,
        groups: [
          { enemyClass: 'fighter', count: 8, behavior: 'tracking' },
          { enemyClass: 'tank', count: 4, behavior: 'formation', formation: 'line', delayMs: 800 },
        ],
      },
      {
        id: 2,
        title: 'Crimson Storm',
        spawnIntervalMs: 370,
        groups: [
          { enemyClass: 'bomber', count: 6, behavior: 'diving' },
          { enemyClass: 'elite', count: 5, behavior: 'sine', delayMs: 900 },
        ],
      },
      {
        id: 3,
        title: 'Throne Gatekeepers',
        spawnIntervalMs: 350,
        groups: [
          { enemyClass: 'elite', count: 6, behavior: 'tracking' },
          { enemyClass: 'tank', count: 4, behavior: 'straight', delayMs: 900 },
          { enemyClass: 'scout', count: 10, behavior: 'diving', delayMs: 1400 },
        ],
      },
    ],
  },
  {
    levelNumber: 10,
    name: 'FINAL RECKONING',
    subtitle: 'Heart of the Void Empire',
    objective: 'Confront the Void Emperor and end the galactic war once and for all.',
    rewardText: 'Galactic Liberation · Campaign Victory',
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
        spawnIntervalMs: 370,
        groups: [
          { enemyClass: 'scout', count: 12, behavior: 'diving', formation: 'vee' },
          { enemyClass: 'elite', count: 4, behavior: 'tracking', delayMs: 800 },
        ],
      },
      {
        id: 2,
        title: 'Armageddon Armada',
        spawnIntervalMs: 360,
        groups: [
          { enemyClass: 'tank', count: 4, behavior: 'straight' },
          { enemyClass: 'bomber', count: 6, behavior: 'zigzag', delayMs: 800 },
        ],
      },
      {
        id: 3,
        title: 'Emperor Vanguard',
        spawnIntervalMs: 340,
        groups: [
          { enemyClass: 'elite', count: 6, behavior: 'tracking' },
          { enemyClass: 'fighter', count: 8, behavior: 'sine', delayMs: 900 },
        ],
      },
    ],
  },
];
