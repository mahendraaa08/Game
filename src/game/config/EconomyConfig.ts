import type { BossId } from './BossConfig';
import type { EnemyClass } from './EnemyConfig';
import type { Rarity } from './EquipmentConfig';
import type { GameMode } from './GameModeConfig';
import type { ShipId } from './ShipConfig';
import type { UpgradeId } from './UpgradeConfig';
import type { WeaponId } from './WeaponConfig';

export interface CurrencyAmount {
  credits: number;
  crystals: number;
}

export interface CampaignRewardBreakdown {
  clearCredits: number;
  clearCrystals: number;
  firstClearCredits: number;
  firstClearCrystals: number;
  totalFirstClearBonusCredits: number;
  totalFirstClearBonusCrystals: number;
}

export function roundCredits(value: number, step = 10): number {
  if (value <= 0) return 0;
  return Math.max(step, Math.round(value / step) * step);
}

/** Currency Exchange (Credit <-> Gems) rules & balanced spread */
export type ExchangeDirection = 'credits_to_gems' | 'gems_to_credits';

export const CURRENCY_EXCHANGE_CONFIG = {
  /** Credits required to mint 1 Gem */
  creditsPerGemBuy: 600,
  /** Credits received when liquidating 1 Gem (~30% spread prevents arbitrage) */
  creditsPerGemSell: 420,
  /** Quick gem-unit preset buttons */
  presets: [1, 3, 5, 10] as readonly number[],
} as const;

export const PLAYER_NAME_CHANGE_COST_GEMS = 25;
export const PLAYER_NAME_MAX_LENGTH = 20;

export interface ExchangePreview {
  valid: boolean;
  reason?: string;
  direction: ExchangeDirection;
  gemUnits: number;
  creditDelta: number;
  crystalDelta: number;
  creditsBefore: number;
  creditsAfter: number;
  crystalsBefore: number;
  crystalsAfter: number;
  maxGemUnits: number;
}

export function previewCurrencyExchange(
  direction: ExchangeDirection,
  requestedGemUnits: number,
  currentCredits: number,
  currentCrystals: number
): ExchangePreview {
  const safeCredits = Math.max(0, Math.floor(currentCredits));
  const safeCrystals = Math.max(0, Math.floor(currentCrystals));
  const maxGemUnits =
    direction === 'credits_to_gems'
      ? Math.floor(safeCredits / CURRENCY_EXCHANGE_CONFIG.creditsPerGemBuy)
      : safeCrystals;

  const isInt = Number.isFinite(requestedGemUnits) && Math.floor(requestedGemUnits) === requestedGemUnits;
  const units = Number.isFinite(requestedGemUnits) ? Math.floor(requestedGemUnits) : 0;

  if (!isInt || units <= 0) {
    return {
      valid: false,
      reason: 'Enter a valid whole number of Gems (minimum 1).',
      direction,
      gemUnits: 0,
      creditDelta: 0,
      crystalDelta: 0,
      creditsBefore: safeCredits,
      creditsAfter: safeCredits,
      crystalsBefore: safeCrystals,
      crystalsAfter: safeCrystals,
      maxGemUnits,
    };
  }

  if (direction === 'credits_to_gems') {
    const creditCost = units * CURRENCY_EXCHANGE_CONFIG.creditsPerGemBuy;
    if (creditCost > safeCredits) {
      return {
        valid: false,
        reason: `Insufficient Credits. Need ${creditCost.toLocaleString()} Credits (short by ${(creditCost - safeCredits).toLocaleString()}).`,
        direction,
        gemUnits: units,
        creditDelta: -creditCost,
        crystalDelta: units,
        creditsBefore: safeCredits,
        creditsAfter: safeCredits,
        crystalsBefore: safeCrystals,
        crystalsAfter: safeCrystals,
        maxGemUnits,
      };
    }
    return {
      valid: true,
      direction,
      gemUnits: units,
      creditDelta: -creditCost,
      crystalDelta: units,
      creditsBefore: safeCredits,
      creditsAfter: safeCredits - creditCost,
      crystalsBefore: safeCrystals,
      crystalsAfter: safeCrystals + units,
      maxGemUnits,
    };
  }

  // gems_to_credits
  if (units > safeCrystals) {
    return {
      valid: false,
      reason: `Insufficient Gems. Need ${units.toLocaleString()} Gems (short by ${(units - safeCrystals).toLocaleString()}).`,
      direction,
      gemUnits: units,
      creditDelta: units * CURRENCY_EXCHANGE_CONFIG.creditsPerGemSell,
      crystalDelta: -units,
      creditsBefore: safeCredits,
      creditsAfter: safeCredits,
      crystalsBefore: safeCrystals,
      crystalsAfter: safeCrystals,
      maxGemUnits,
    };
  }

  const creditGain = units * CURRENCY_EXCHANGE_CONFIG.creditsPerGemSell;
  return {
    valid: true,
    direction,
    gemUnits: units,
    creditDelta: creditGain,
    crystalDelta: -units,
    creditsBefore: safeCredits,
    creditsAfter: safeCredits + creditGain,
    crystalsBefore: safeCrystals,
    crystalsAfter: safeCrystals - units,
    maxGemUnits,
  };
}

/** Starting resources & save migration constants */
export const ECONOMY_START = {
  credits: 250,
  crystals: 1,
  migrationBaseCredits: 250,
  migrationCreditsPerSector: 120,
  migrationBaseCrystals: 1,
  migrationCrystalsPerSector: 1,
} as const;

export function getMigrationBonus(completedSectorsCount: number): CurrencyAmount {
  const count = Math.max(0, Math.floor(completedSectorsCount));
  return {
    credits: ECONOMY_START.migrationBaseCredits + count * ECONOMY_START.migrationCreditsPerSector,
    crystals: ECONOMY_START.migrationBaseCrystals + count * ECONOMY_START.migrationCrystalsPerSector,
  };
}

/** Economy safety & multiplier caps */
export const ECONOMY_CAPS = {
  /** Max total combat credit salvage multiplier (Collector Drone + Utility Gear) */
  maxCreditBonusMult: 1.4,
  /** Fraction of active combat credits retained on defeat (crystals earned from milestones stay 100%) */
  defeatCreditSalvageRatio: 0.85,
} as const;

/** Combat kill base credit yield calibrated for 5-wave (2-phase) sectors */
export const ENEMY_BASE_CREDIT_DROP: Record<EnemyClass, number> = {
  scout: 2,
  interceptor: 3,
  fighter: 3,
  sniper: 5,
  bomber: 5,
  splitter: 6,
  tank: 8,
  bastion: 9,
  elite: 10,
  harbinger: 12,
};

export function getEnemyCreditDrop(
  enemyClass: EnemyClass,
  difficultyMult: number,
  creditBonusMult: number
): number {
  const base = ENEMY_BASE_CREDIT_DROP[enemyClass] ?? 2;
  const sectorScale = 1 + Math.max(0, difficultyMult - 1) * 0.25;
  const cappedBonus = Math.min(ECONOMY_CAPS.maxCreditBonusMult, Math.max(1, creditBonusMult));
  return Math.max(1, Math.round(base * sectorScale * cappedBonus));
}

/** Boss combat defeat rewards tiered by dreadnought strength (Gems kept scarce & high-value) */
export const BOSS_DEFEAT_REWARDS: Record<BossId, CurrencyAmount> = {
  iron_guardian: { credits: 90, crystals: 1 },
  venom_queen: { credits: 130, crystals: 1 },
  shadow_titan: { credits: 175, crystals: 1 },
  cyber_leviathan: { credits: 220, crystals: 1 },
  void_emperor: { credits: 320, crystals: 2 },
};

export function getBossCombatReward(
  bossId: BossId,
  mode: GameMode,
  creditBonusMult: number,
  endlessBossTier = 1
): CurrencyAmount {
  const base = BOSS_DEFEAT_REWARDS[bossId] ?? { credits: 90, crystals: 1 };
  const cappedBonus = Math.min(ECONOMY_CAPS.maxCreditBonusMult, Math.max(1, creditBonusMult));

  if (mode === 'boss_rush') {
    // Gauntlet clears award the crystal jackpot upon defeating all 5 dreadnoughts
    return {
      credits: Math.round(base.credits * 0.45 * cappedBonus),
      crystals: base.crystals >= 2 ? 1 : 0,
    };
  }

  if (mode === 'endless') {
    const loopScale = 1 + Math.max(0, endlessBossTier - 1) * 0.16;
    return {
      credits: Math.round(base.credits * 0.55 * loopScale * cappedBonus),
      crystals: base.crystals >= 2 ? 2 : 1,
    };
  }

  return {
    credits: Math.round(base.credits * cappedBonus),
    crystals: base.crystals,
  };
}

/** Boss Rush full gauntlet clear bonus (hard endurance milestone) */
export const BOSS_RUSH_CLEAR_REWARD: CurrencyAmount = {
  credits: 750,
  crystals: 3,
};

/** Difficulty & scaling formulas across modes */
export function getEndlessDifficulty(waveIdxZeroBased: number): number {
  return 1 + Math.max(0, waveIdxZeroBased) * 0.11;
}

export function getEndlessBossHpMult(waveNum: number): number {
  const milestoneIdx = Math.max(0, Math.floor(waveNum / 5) - 1);
  return 1 + milestoneIdx * 0.35;
}

export function getEndlessWaveReward(waveNum: number, creditBonusMult: number): CurrencyAmount {
  const w = Math.max(1, Math.floor(waveNum));
  const cappedBonus = Math.min(ECONOMY_CAPS.maxCreditBonusMult, Math.max(1, creditBonusMult));
  const credits = Math.round((28 + w * 8) * cappedBonus);
  const crystals = w % 10 === 0 ? 1 : 0;
  return { credits, crystals };
}

/** Campaign clear + one-time first-clear milestone reward (hundreds per run; 1,000+ reserved for endgame feats) */
export function getCampaignClearReward(
  levelNumber: number,
  hasBoss: boolean,
  isFirstClear: boolean,
  creditBonusMult: number
): CampaignRewardBreakdown {
  const lvl = Math.max(1, Math.floor(levelNumber));
  const cappedBonus = Math.min(ECONOMY_CAPS.maxCreditBonusMult, Math.max(1, creditBonusMult));

  const baseClearCredits = 55 + lvl * 25;
  const clearCredits = Math.round(baseClearCredits * cappedBonus);
  const clearCrystals = 0;

  const firstClearCredits = 90 + lvl * 55;
  const firstClearCrystals = hasBoss
    ? lvl >= 10
      ? 3
      : lvl >= 6
      ? 2
      : 1
    : lvl >= 9
    ? 2
    : 1;

  return {
    clearCredits,
    clearCrystals,
    firstClearCredits: isFirstClear ? firstClearCredits : 0,
    firstClearCrystals: isFirstClear ? firstClearCrystals : 0,
    totalFirstClearBonusCredits: baseClearCredits + firstClearCredits,
    totalFirstClearBonusCrystals: clearCrystals + firstClearCrystals,
  };
}

export function formatSectorRewardText(
  levelNumber: number,
  totalSectors: number,
  hasBoss: boolean,
  nextSectorName?: string
): string {
  const breakdown = getCampaignClearReward(levelNumber, hasBoss, true, 1);
  const bonusStr = `+${breakdown.totalFirstClearBonusCredits.toLocaleString()} CR · +${breakdown.totalFirstClearBonusCrystals} Gems First Clear`;
  if (levelNumber >= totalSectors) {
    return `Galactic Liberation · ${bonusStr}`;
  }
  const nextTag = nextSectorName
    ? `Unlocks S${String(levelNumber + 1).padStart(2, '0')}: ${nextSectorName}`
    : `Unlocks Sector ${String(levelNumber + 1).padStart(2, '0')}`;
  return `${nextTag} · ${bonusStr}`;
}

/** Challenge first-clear vs calibrated replay payout */
export function getChallengePayout(
  firstClearCredits: number,
  firstClearCrystals: number,
  alreadyCompleted: boolean
): CurrencyAmount & { isReplay: boolean } {
  if (!alreadyCompleted) {
    return {
      credits: Math.max(0, Math.round(firstClearCredits)),
      crystals: Math.max(0, Math.round(firstClearCrystals)),
      isReplay: false,
    };
  }
  return {
    credits: roundCredits(firstClearCredits * 0.25, 10),
    crystals: 0,
    isReplay: true,
  };
}

/** Challenge bounty table (hundreds; Final Duel nears 1,000+ when paired with combat drops) */
export const CHALLENGE_REWARDS: Record<string, CurrencyAmount> = {
  chal_glass_cannon: { credits: 320, crystals: 1 },
  chal_laser_trial: { credits: 390, crystals: 1 },
  chal_timed_gauntlet: { credits: 480, crystals: 2 },
  chal_venom_duel: { credits: 580, crystals: 2 },
  chal_lightning_storm: { credits: 640, crystals: 2 },
  chal_emperor_duel: { credits: 980, crystals: 4 },
};

/** Rarity pricing multipliers for Equipment & Drones */
export const RARITY_ECONOMY: Record<
  Rarity,
  { costMultiplier: number; statMultiplier: number; crystalBase: number; crystalStep: number }
> = {
  common: { costMultiplier: 1.0, statMultiplier: 1.0, crystalBase: 0, crystalStep: 0 },
  rare: { costMultiplier: 1.45, statMultiplier: 1.25, crystalBase: 2, crystalStep: 2 },
  epic: { costMultiplier: 1.9, statMultiplier: 1.55, crystalBase: 4, crystalStep: 3 },
  legendary: { costMultiplier: 2.45, statMultiplier: 1.9, crystalBase: 6, crystalStep: 4 },
  mythic: { costMultiplier: 3.0, statMultiplier: 2.35, crystalBase: 9, crystalStep: 5 },
};

/** Fleet System Upgrade pricing rules (gradual 20-level escalation across all 8 tracks) */
export const FLEET_UPGRADE_ECONOMY: Record<
  UpgradeId,
  {
    baseCost: number;
    costMultiplier: number;
    crystalCostAtLevel?: number;
    baseCrystalCost?: number;
    crystalStep?: number;
  }
> = {
  max_health: { baseCost: 130, costMultiplier: 1.17 },
  shield_capacity: { baseCost: 140, costMultiplier: 1.17 },
  movement_speed: { baseCost: 150, costMultiplier: 1.17 },
  weapon_damage: {
    baseCost: 180,
    costMultiplier: 1.18,
    crystalCostAtLevel: 10,
    baseCrystalCost: 1,
    crystalStep: 1,
  },
  fire_rate: {
    baseCost: 185,
    costMultiplier: 1.18,
    crystalCostAtLevel: 10,
    baseCrystalCost: 1,
    crystalStep: 1,
  },
  critical_damage: {
    baseCost: 195,
    costMultiplier: 1.175,
    crystalCostAtLevel: 9,
    baseCrystalCost: 1,
    crystalStep: 1,
  },
  critical_chance: {
    baseCost: 200,
    costMultiplier: 1.18,
    crystalCostAtLevel: 9,
    baseCrystalCost: 1,
    crystalStep: 1,
  },
  special_cooldown: {
    baseCost: 215,
    costMultiplier: 1.18,
    crystalCostAtLevel: 9,
    baseCrystalCost: 1,
    crystalStep: 1,
  },
};

export function calculateFleetUpgradeCost(
  upgradeId: UpgradeId,
  currentLevel: number,
  maxLevel: number
): CurrencyAmount {
  if (currentLevel >= maxLevel) return { credits: 0, crystals: 0 };
  const rule = FLEET_UPGRADE_ECONOMY[upgradeId];
  const credits = roundCredits(rule.baseCost * Math.pow(rule.costMultiplier, currentLevel), 10);
  let crystals = 0;
  if (rule.crystalCostAtLevel !== undefined && currentLevel + 1 >= rule.crystalCostAtLevel) {
    const tier = currentLevel + 1 - rule.crystalCostAtLevel;
    crystals = (rule.baseCrystalCost ?? 1) + Math.floor(tier / 3) * (rule.crystalStep ?? 1);
  }
  return { credits, crystals };
}

/** Weapon unlocks & differentiated 15-level tiered upgrade curves (ordered from Plasma #1 starter to Chain Lightning #6 apex) */
export const WEAPON_ECONOMY: Record<
  WeaponId,
  { unlockLevel: number; unlockCredits: number; unlockCrystals: number; upgradeTierMult: number }
> = {
  plasma: { unlockLevel: 1, unlockCredits: 0, unlockCrystals: 0, upgradeTierMult: 1.0 },
  dual_laser: { unlockLevel: 1, unlockCredits: 1800, unlockCrystals: 4, upgradeTierMult: 1.15 },
  beam: { unlockLevel: 2, unlockCredits: 3200, unlockCrystals: 8, upgradeTierMult: 1.28 },
  homing: { unlockLevel: 2, unlockCredits: 4300, unlockCrystals: 11, upgradeTierMult: 1.38 },
  spread: { unlockLevel: 2, unlockCredits: 5400, unlockCrystals: 14, upgradeTierMult: 1.48 },
  lightning: { unlockLevel: 3, unlockCredits: 6800, unlockCrystals: 18, upgradeTierMult: 1.6 },
};

export function calculateWeaponUpgradeCost(
  currentLevel: number,
  weaponId: WeaponId = 'plasma',
  maxWeaponLevel = 15
): CurrencyAmount {
  const lvl = Math.max(1, Math.floor(currentLevel));
  if (lvl >= maxWeaponLevel) return { credits: 0, crystals: 0 };
  const tierMult = WEAPON_ECONOMY[weaponId]?.upgradeTierMult ?? 1.0;
  const credits = roundCredits(160 * tierMult * Math.pow(1.165, lvl - 1), 10);
  let crystals = 0;
  if (lvl >= 13) {
    crystals = tierMult >= 1.25 ? Math.round(2.3 * tierMult) : 2;
  } else if (lvl >= 10) {
    crystals = Math.round(1.6 * tierMult);
  } else if (lvl >= 6) {
    crystals = Math.max(1, Math.round(1.0 * tierMult));
  } else if (lvl >= 3 && tierMult >= 1.4) {
    crystals = 1;
  }
  return { credits, crystals };
}

/** Exclusive Ship unlock pricing table tiered by hull class & combat potency */
export const SHIP_ECONOMY: Record<
  ShipId,
  { credits: number; crystals: number; minSectorCompleted?: number }
> = {
  falcon_x: { credits: 0, crystals: 0 },
  destroyer: { credits: 2200, crystals: 4 },
  phantom: { credits: 3400, crystals: 8 },
  thunderbolt: { credits: 5200, crystals: 13, minSectorCompleted: 2 },
  aegis: { credits: 8600, crystals: 24, minSectorCompleted: 4 },
  specter: { credits: 11500, crystals: 32, minSectorCompleted: 6 },
  nova_prime: { credits: 14800, crystals: 42, minSectorCompleted: 7 },
  celestial: { credits: 18500, crystals: 55, minSectorCompleted: 8 },
};

export function formatShipUnlockLabel(shipId: ShipId): string {
  const req = SHIP_ECONOMY[shipId];
  if (req.credits === 0 && req.crystals === 0) return 'Unlocked by default';
  const parts: string[] = [`${req.credits.toLocaleString()} Credits`];
  if (req.crystals > 0) parts.push(`${req.crystals} Gems`);
  if (req.minSectorCompleted) {
    parts.push(`Clear Sector ${String(req.minSectorCompleted).padStart(2, '0')}`);
  }
  return parts.join(' · ');
}

/** Armory Equipment purchase & rarity/power-differentiated upgrade cost formulas */
export const EQUIPMENT_PRICING: Record<string, CurrencyAmount> = {
  util_ion_thruster: { credits: 680, crystals: 0 },
  def_titanium_hull: { credits: 760, crystals: 0 },
  off_plasma_coil: { credits: 860, crystals: 1 },
  spec_emp_inducer: { credits: 920, crystals: 1 },

  util_salvage_magnet: { credits: 1850, crystals: 5 },
  def_aegis_emitter: { credits: 2050, crystals: 6 },
  off_cryo_accelerator: { credits: 2250, crystals: 7 },
  spec_chrono_cell: { credits: 2450, crystals: 8 },

  util_warp_actuator: { credits: 3900, crystals: 13 },
  off_quantum_sight: { credits: 4300, crystals: 15 },
  def_phase_armor: { credits: 4600, crystals: 16 },
  spec_nova_prism: { credits: 4950, crystals: 18 },

  util_astral_navigator: { credits: 7600, crystals: 26 },
  def_immortal_bulwark: { credits: 8400, crystals: 30 },
  spec_omega_relayer: { credits: 10800, crystals: 38 },
  off_singularity_core: { credits: 11600, crystals: 42 },
};

export function calculateEquipmentUpgradeCost(rarity: Rarity, currentLevel: number): CurrencyAmount {
  const lvl = Math.max(1, Math.floor(currentLevel));
  if (lvl >= 5) return { credits: 0, crystals: 0 };
  const eco = RARITY_ECONOMY[rarity];
  const credits = roundCredits(480 * eco.costMultiplier * Math.pow(1.56, lvl - 1), 10);
  const crystals =
    rarity === 'common'
      ? lvl >= 4
        ? 2
        : lvl === 3
        ? 1
        : 0
      : lvl >= 2
      ? Math.round(eco.crystalBase + (lvl - 2) * eco.crystalStep)
      : 0;
  return { credits, crystals };
}

/** Companion Drone purchase & rarity-aware upgrade cost formulas */
export const DRONE_PRICING: Record<string, CurrencyAmount> = {
  assault: { credits: 2100, crystals: 7 },
  shield: { credits: 2350, crystals: 8 },
  collector: { credits: 3600, crystals: 13 },
  repair: { credits: 4400, crystals: 16 },
};

export function calculateDroneUpgradeCost(rarity: Rarity, currentLevel: number): CurrencyAmount {
  const lvl = Math.max(1, Math.floor(currentLevel));
  if (lvl >= 5) return { credits: 0, crystals: 0 };
  const tierMult = RARITY_ECONOMY[rarity]?.costMultiplier ?? 1.45;
  const credits = roundCredits(620 * tierMult * Math.pow(1.58, lvl - 1), 10);
  const crystals =
    rarity === 'epic'
      ? [3, 5, 8, 12][lvl - 1] ?? 12
      : [2, 4, 6, 9][lvl - 1] ?? 9;
  return { credits, crystals };
}

/** Daily, Weekly & Achievement calibrated reward tables (hundreds average; 1,000+ reserved for elite milestones) */
export const MISSION_REWARDS: Record<string, CurrencyAmount> = {
  // Daily pool (110 - 220 CR, 0 - 1 Gem)
  daily_kills_40: { credits: 130, crystals: 0 },
  daily_elite_6: { credits: 160, crystals: 1 },
  daily_powerups_6: { credits: 110, crystals: 0 },
  daily_sector_1: { credits: 170, crystals: 1 },
  daily_boss_1: { credits: 220, crystals: 1 },
  daily_survive_120: { credits: 120, crystals: 0 },
  daily_plasma_25: { credits: 140, crystals: 0 },
  daily_falcon_clear: { credits: 180, crystals: 1 },

  // Weekly pool (650 - 920 CR, 2 - 3 Gems)
  weekly_levels_5: { credits: 650, crystals: 2 },
  weekly_bosses_4: { credits: 920, crystals: 3 },
  weekly_endless_8: { credits: 760, crystals: 2 },
  weekly_score_18000: { credits: 820, crystals: 3 },
  weekly_kills_250: { credits: 700, crystals: 2 },
};

export const ACHIEVEMENT_REWARDS: Record<string, CurrencyAmount> = {
  ach_kills_100: { credits: 180, crystals: 1 },
  ach_kills_500: { credits: 480, crystals: 2 },
  ach_crits_75: { credits: 240, crystals: 1 },
  ach_boss_1: { credits: 220, crystals: 1 },
  ach_boss_10: { credits: 880, crystals: 3 },
  ach_boss_rush_1: { credits: 1150, crystals: 4 },
  ach_endless_5: { credits: 260, crystals: 1 },
  ach_endless_12: { credits: 780, crystals: 3 },
  ach_sectors_4: { credits: 340, crystals: 1 },
  ach_challenges_3: { credits: 560, crystals: 2 },
  ach_weapons_6: { credits: 460, crystals: 2 },
  ach_upgrades_15: { credits: 380, crystals: 2 },
  ach_ships_4: { credits: 500, crystals: 2 },
  ach_ships_8: { credits: 2200, crystals: 8 },
  ach_sectors_10: { credits: 1650, crystals: 6 },
  ach_score_30000: { credits: 840, crystals: 3 },
};
