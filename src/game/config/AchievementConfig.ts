import { ACHIEVEMENT_REWARDS } from './EconomyConfig';

export type AchievementCategory =
  | 'Combat Master'
  | 'Boss Slayer'
  | 'Survivor'
  | 'Galaxy Explorer'
  | 'Weapon Specialist'
  | 'Ship Collector'
  | 'Campaign Hero'
  | 'Legendary Pilot';

export type AchievementMetric =
  | 'total_kills'
  | 'total_boss_kills'
  | 'completed_sectors_count'
  | 'unlocked_ships_count'
  | 'unlocked_weapons_count'
  | 'best_endless_wave'
  | 'completed_challenges_count'
  | 'completed_extreme_challenges_count'
  | 'hard_sectors_completed'
  | 'nightmare_sectors_completed'
  | 'boss_rush_clears'
  | 'high_score'
  | 'total_upgrades_bought'
  | 'critical_hits';

export interface AchievementDefinition {
  id: string;
  category: AchievementCategory;
  title: string;
  description: string;
  metric: AchievementMetric;
  target: number;
  rewardCredits: number;
  rewardCrystals: number;
}

export const ACHIEVEMENTS: AchievementDefinition[] = [
  // Combat Master
  {
    id: 'ach_kills_100',
    category: 'Combat Master',
    title: 'First Hundred',
    description: 'Destroy 100 Void Empire ships in combat.',
    metric: 'total_kills',
    target: 100,
    rewardCredits: ACHIEVEMENT_REWARDS.ach_kills_100.credits,
    rewardCrystals: ACHIEVEMENT_REWARDS.ach_kills_100.crystals,
  },
  {
    id: 'ach_kills_500',
    category: 'Combat Master',
    title: 'Starfighter Ace',
    description: 'Destroy 500 Void Empire ships across all modes.',
    metric: 'total_kills',
    target: 500,
    rewardCredits: ACHIEVEMENT_REWARDS.ach_kills_500.credits,
    rewardCrystals: ACHIEVEMENT_REWARDS.ach_kills_500.crystals,
  },
  {
    id: 'ach_crits_75',
    category: 'Combat Master',
    title: 'Pinpoint Striker',
    description: 'Land 75 Critical Hits on hostile targets.',
    metric: 'critical_hits',
    target: 75,
    rewardCredits: ACHIEVEMENT_REWARDS.ach_crits_75.credits,
    rewardCrystals: ACHIEVEMENT_REWARDS.ach_crits_75.crystals,
  },

  // Boss Slayer
  {
    id: 'ach_boss_1',
    category: 'Boss Slayer',
    title: 'Giant Killer',
    description: 'Defeat your first Void Commander Boss.',
    metric: 'total_boss_kills',
    target: 1,
    rewardCredits: ACHIEVEMENT_REWARDS.ach_boss_1.credits,
    rewardCrystals: ACHIEVEMENT_REWARDS.ach_boss_1.crystals,
  },
  {
    id: 'ach_boss_10',
    category: 'Boss Slayer',
    title: 'Command Bane',
    description: 'Defeat 10 Bosses across Campaign, Challenge, or Boss Rush.',
    metric: 'total_boss_kills',
    target: 10,
    rewardCredits: ACHIEVEMENT_REWARDS.ach_boss_10.credits,
    rewardCrystals: ACHIEVEMENT_REWARDS.ach_boss_10.crystals,
  },
  {
    id: 'ach_boss_rush_1',
    category: 'Boss Slayer',
    title: 'Gauntlet Conqueror',
    description: 'Clear the 5-Boss Gauntlet in Boss Rush Mode.',
    metric: 'boss_rush_clears',
    target: 1,
    rewardCredits: ACHIEVEMENT_REWARDS.ach_boss_rush_1.credits,
    rewardCrystals: ACHIEVEMENT_REWARDS.ach_boss_rush_1.crystals,
  },

  // Survivor
  {
    id: 'ach_endless_5',
    category: 'Survivor',
    title: 'Wave Breaker',
    description: 'Reach Wave 5 in Endless Survival.',
    metric: 'best_endless_wave',
    target: 5,
    rewardCredits: ACHIEVEMENT_REWARDS.ach_endless_5.credits,
    rewardCrystals: ACHIEVEMENT_REWARDS.ach_endless_5.crystals,
  },
  {
    id: 'ach_endless_12',
    category: 'Survivor',
    title: 'Immortal Defender',
    description: 'Reach Wave 12 in Endless Survival.',
    metric: 'best_endless_wave',
    target: 12,
    rewardCredits: ACHIEVEMENT_REWARDS.ach_endless_12.credits,
    rewardCrystals: ACHIEVEMENT_REWARDS.ach_endless_12.crystals,
  },

  // Galaxy Explorer
  {
    id: 'ach_sectors_4',
    category: 'Galaxy Explorer',
    title: 'Deep Space Vanguard',
    description: 'Complete 4 distinct Campaign sectors.',
    metric: 'completed_sectors_count',
    target: 4,
    rewardCredits: ACHIEVEMENT_REWARDS.ach_sectors_4.credits,
    rewardCrystals: ACHIEVEMENT_REWARDS.ach_sectors_4.crystals,
  },
  {
    id: 'ach_challenges_3',
    category: 'Galaxy Explorer',
    title: 'Tactical Specialist',
    description: 'Complete 3 special missions in Challenge Mode.',
    metric: 'completed_challenges_count',
    target: 3,
    rewardCredits: ACHIEVEMENT_REWARDS.ach_challenges_3.credits,
    rewardCrystals: ACHIEVEMENT_REWARDS.ach_challenges_3.crystals,
  },
  {
    id: 'ach_challenges_6',
    category: 'Galaxy Explorer',
    title: 'Protocol Tactician',
    description: 'Complete 6 unique Challenge missions across any tier.',
    metric: 'completed_challenges_count',
    target: 6,
    rewardCredits: ACHIEVEMENT_REWARDS.ach_challenges_6.credits,
    rewardCrystals: ACHIEVEMENT_REWARDS.ach_challenges_6.crystals,
  },
  {
    id: 'ach_challenge_extreme',
    category: 'Galaxy Explorer',
    title: 'Extreme Overcomer',
    description: 'Complete 3 Challenge missions on Extreme tier.',
    metric: 'completed_extreme_challenges_count',
    target: 3,
    rewardCredits: ACHIEVEMENT_REWARDS.ach_challenge_extreme.credits,
    rewardCrystals: ACHIEVEMENT_REWARDS.ach_challenge_extreme.crystals,
  },

  // Weapon Specialist
  {
    id: 'ach_weapons_6',
    category: 'Weapon Specialist',
    title: 'Arsenal Unlocked',
    description: 'Unlock all 6 primary weapon systems.',
    metric: 'unlocked_weapons_count',
    target: 6,
    rewardCredits: ACHIEVEMENT_REWARDS.ach_weapons_6.credits,
    rewardCrystals: ACHIEVEMENT_REWARDS.ach_weapons_6.crystals,
  },
  {
    id: 'ach_upgrades_15',
    category: 'Weapon Specialist',
    title: 'Chief Engineer',
    description: 'Install 15 total upgrades in the Upgrade Center.',
    metric: 'total_upgrades_bought',
    target: 15,
    rewardCredits: ACHIEVEMENT_REWARDS.ach_upgrades_15.credits,
    rewardCrystals: ACHIEVEMENT_REWARDS.ach_upgrades_15.crystals,
  },

  // Ship Collector
  {
    id: 'ach_ships_4',
    category: 'Ship Collector',
    title: 'Squadron Commander',
    description: 'Unlock 4 playable spaceships in your Hangar.',
    metric: 'unlocked_ships_count',
    target: 4,
    rewardCredits: ACHIEVEMENT_REWARDS.ach_ships_4.credits,
    rewardCrystals: ACHIEVEMENT_REWARDS.ach_ships_4.crystals,
  },
  {
    id: 'ach_ships_8',
    category: 'Ship Collector',
    title: 'Fleet Admiral',
    description: 'Unlock all 8 spaceships in the Vanguard fleet.',
    metric: 'unlocked_ships_count',
    target: 8,
    rewardCredits: ACHIEVEMENT_REWARDS.ach_ships_8.credits,
    rewardCrystals: ACHIEVEMENT_REWARDS.ach_ships_8.crystals,
  },

  // Campaign Hero
  {
    id: 'ach_sectors_10',
    category: 'Campaign Hero',
    title: 'Savior of Earth',
    description: 'Complete all 10 Campaign sectors and defeat the Void Emperor.',
    metric: 'completed_sectors_count',
    target: 10,
    rewardCredits: ACHIEVEMENT_REWARDS.ach_sectors_10.credits,
    rewardCrystals: ACHIEVEMENT_REWARDS.ach_sectors_10.crystals,
  },
  {
    id: 'ach_campaign_hard',
    category: 'Campaign Hero',
    title: 'Hardened Vanguard',
    description: 'Complete all 10 Campaign sectors on Hard difficulty.',
    metric: 'hard_sectors_completed',
    target: 10,
    rewardCredits: ACHIEVEMENT_REWARDS.ach_campaign_hard.credits,
    rewardCrystals: ACHIEVEMENT_REWARDS.ach_campaign_hard.crystals,
  },
  {
    id: 'ach_campaign_nightmare',
    category: 'Campaign Hero',
    title: 'Nightmare Liberator',
    description: 'Conquer all 10 Campaign sectors on Nightmare difficulty.',
    metric: 'nightmare_sectors_completed',
    target: 10,
    rewardCredits: ACHIEVEMENT_REWARDS.ach_campaign_nightmare.credits,
    rewardCrystals: ACHIEVEMENT_REWARDS.ach_campaign_nightmare.crystals,
  },

  // Legendary Pilot
  {
    id: 'ach_score_30000',
    category: 'Legendary Pilot',
    title: 'Galactic Legend',
    description: 'Reach a high score of 30,000 points in a single mission.',
    metric: 'high_score',
    target: 30000,
    rewardCredits: ACHIEVEMENT_REWARDS.ach_score_30000.credits,
    rewardCrystals: ACHIEVEMENT_REWARDS.ach_score_30000.crystals,
  },
];
