import { BossId } from './BossConfig';
import { WeaponId } from './WeaponConfig';

export type GameMode = 'campaign' | 'endless' | 'challenge' | 'boss_rush';

export interface ChallengeRule {
  maxHpOverride?: number;
  disableShield?: boolean;
  allowedWeapons?: WeaponId[];
  disableDrones?: boolean;
  timeLimitSec?: number;
  targetKills?: number;
  bossId?: BossId;
  levelBase: number; // Campaign level environment & wave pool base (1..10)
}

export interface ChallengeDefinition {
  id: string;
  title: string;
  difficulty: 'Standard' | 'Hard' | 'Extreme';
  objective: string;
  constraintsLabel: string;
  rewardCredits: number;
  rewardCrystals: number;
  rules: ChallengeRule;
}

export const CHALLENGES: ChallengeDefinition[] = [
  {
    id: 'chal_glass_cannon',
    title: 'Glass Interceptor',
    difficulty: 'Standard',
    objective: 'Destroy 35 Void hostiles with fragile 45 HP hull plating.',
    constraintsLabel: '45 Max HP · Standard Arsenal',
    rewardCredits: 850,
    rewardCrystals: 5,
    rules: {
      maxHpOverride: 45,
      targetKills: 35,
      levelBase: 3,
    },
  },
  {
    id: 'chal_laser_trial',
    title: 'Coherent Precision',
    difficulty: 'Standard',
    objective: 'Eliminate 45 hostiles using only Dual Laser & Plasma Cannon.',
    constraintsLabel: 'Weapons Locked: Plasma / Dual Laser',
    rewardCredits: 950,
    rewardCrystals: 6,
    rules: {
      allowedWeapons: ['plasma', 'dual_laser'],
      targetKills: 45,
      levelBase: 5,
    },
  },
  {
    id: 'chal_timed_gauntlet',
    title: '60-Second Blitz',
    difficulty: 'Hard',
    objective: 'Survive 60 seconds inside the Dark Dimension rift storm.',
    constraintsLabel: '60s Survival Timer · No Drones',
    rewardCredits: 1200,
    rewardCrystals: 8,
    rules: {
      timeLimitSec: 60,
      disableDrones: true,
      levelBase: 7,
    },
  },
  {
    id: 'chal_venom_duel',
    title: 'Hive Purge',
    difficulty: 'Hard',
    objective: 'Defeat the Venom Queen with shields offline.',
    constraintsLabel: 'Shields Disabled · Boss Hunt',
    rewardCredits: 1450,
    rewardCrystals: 10,
    rules: {
      disableShield: true,
      bossId: 'venom_queen',
      levelBase: 4,
    },
  },
  {
    id: 'chal_lightning_storm',
    title: 'Voltaic Surge',
    difficulty: 'Hard',
    objective: 'Destroy 55 hostiles armed strictly with Spread & Chain Lightning.',
    constraintsLabel: 'Weapons Locked: Spread / Lightning',
    rewardCredits: 1550,
    rewardCrystals: 11,
    rules: {
      allowedWeapons: ['spread', 'lightning'],
      targetKills: 55,
      levelBase: 8,
    },
  },
  {
    id: 'chal_emperor_duel',
    title: 'Sovereign Showdown',
    difficulty: 'Extreme',
    objective: 'Confront and destroy the Void Emperor under 75 HP hull lock.',
    constraintsLabel: '75 Max HP · No Drones · Final Boss',
    rewardCredits: 2400,
    rewardCrystals: 18,
    rules: {
      maxHpOverride: 75,
      disableDrones: true,
      bossId: 'void_emperor',
      levelBase: 10,
    },
  },
];

export const CHALLENGE_BY_ID: Record<string, ChallengeDefinition> = Object.fromEntries(
  CHALLENGES.map((c) => [c.id, c])
);

export const BOSS_RUSH_ORDER: BossId[] = [
  'iron_guardian',
  'venom_queen',
  'shadow_titan',
  'cyber_leviathan',
  'void_emperor',
];
