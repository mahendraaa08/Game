import { roundCredits, type CurrencyAmount } from './EconomyConfig';

export const MAX_PLAYER_LEVEL = 99;

/**
 * EXP earned across real gameplay actions, mode completions, missions, and medals.
 * Single source of truth used by both ProgressionManager and UI reward displays.
 */
export const PLAYER_EXP_SOURCES = {
  enemyKillBase: 8,
  eliteKillBonus: 14,
  bossKillBonus: 150,
  critHitBonus: 1,
  survivalSecondBonus: 1,
  campaignSectorClearBase: 140,
  campaignSectorPerLevel: 40,
  runCompletionBase: 60,
  endlessPerWaveClear: 40,
  bossRushClearBonus: 480,
  challengeClearBonus: 300,
  dailyMissionClaim: 110,
  weeklyChallengeClaim: 380,
  achievementClaim: 250,
} as const;

export function getCampaignClearTotalExp(levelNumber: number): number {
  const lvl = Math.max(1, Math.floor(levelNumber));
  return (
    PLAYER_EXP_SOURCES.campaignSectorClearBase +
    lvl * PLAYER_EXP_SOURCES.campaignSectorPerLevel +
    PLAYER_EXP_SOURCES.runCompletionBase
  );
}

/**
 * EXP required to advance from `level` to `level + 1`.
 * Steep polynomial progression from Lv.1 to Lv.99 so mid and high levels
 * require meaningful sustained gameplay. Returns 0 once `level >= MAX_PLAYER_LEVEL`.
 */
export function getExpRequiredForNextLevel(level: number): number {
  const lv = Math.max(1, Math.floor(level));
  if (lv >= MAX_PLAYER_LEVEL) return 0;
  const raw = 550 + lv * 210 + Math.pow(lv, 2.25) * 26;
  return Math.max(100, Math.round(raw / 10) * 10);
}

/**
 * Balanced Credit & Void Gem rewards granted strictly once upon reaching `reachedLevel` (2..99).
 * Scales meaningfully across higher tiers without inflating the game economy.
 */
export function getLevelUpReward(reachedLevel: number): CurrencyAmount {
  const lv = Math.max(2, Math.min(MAX_PLAYER_LEVEL, Math.floor(reachedLevel)));

  const credits =
    lv === MAX_PLAYER_LEVEL
      ? 5000
      : roundCredits(100 + lv * 26 + Math.floor(Math.pow(lv, 1.32) * 5), 10);

  let crystals: number;
  if (lv === MAX_PLAYER_LEVEL) {
    crystals = 15;
  } else {
    const tierBase = lv >= 75 ? 4 : lv >= 50 ? 3 : lv >= 25 ? 2 : 1;
    const milestoneBonus = lv % 10 === 0 ? (lv >= 50 ? 3 : 2) : lv % 5 === 0 ? 1 : 0;
    crystals = tierBase + milestoneBonus;
  }

  return { credits, crystals };
}

export function getRankTitleForLevel(level: number): string {
  if (level >= MAX_PLAYER_LEVEL) return 'Eternal Defender';
  if (level >= 70) return 'Astral Sovereign';
  if (level >= 45) return 'Galactic Marshal';
  if (level >= 25) return 'Fleet Admiral';
  if (level >= 12) return 'Wing Commander';
  if (level >= 5) return 'Star Ace';
  return 'Defender Cadet';
}
