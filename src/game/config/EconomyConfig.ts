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

/** Starting resources & save migration constants */
export const ECONOMY_START = {
  credits: 500,
  crystals: 3,
  migrationBaseCredits: 500,
  migrationCreditsPerSector: 280,
  migrationBaseCrystals: 3,
  migrationCrystalsPerSector: 2,
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
  maxCreditBonusMult: 1.55,
  /** Fraction of active combat credits retained on defeat (crystals earned from milestones stay 100%) */
  defeatCreditSalvageRatio: 0.9,
} as const;

/** Combat kill base credit yield by enemy class */
export const ENEMY_BASE_CREDIT_DROP: Record<EnemyClass, number> = {
  scout: 8,
  fighter: 13,
  bomber: 18,
  tank: 28,
  elite: 32,
};

export function getEnemyCreditDrop(
  enemyClass: EnemyClass,
  difficultyMult: number,
  creditBonusMult: number
): number {
  const base = ENEMY_BASE_CREDIT_DROP[enemyClass] ?? 8;
  const sectorScale = 1 + Math.max(0, difficultyMult - 1) * 0.45;
  const cappedBonus = Math.min(ECONOMY_CAPS.maxCreditBonusMult, Math.max(1, creditBonusMult));
  return Math.max(1, Math.round(base * sectorScale * cappedBonus));
}

/** Boss combat defeat rewards tiered by dreadnought strength */
export const BOSS_DEFEAT_REWARDS: Record<BossId, CurrencyAmount> = {
  iron_guardian: { credits: 320, crystals: 3 },
  venom_queen: { credits: 480, crystals: 4 },
  shadow_titan: { credits: 680, crystals: 5 },
  cyber_leviathan: { credits: 900, crystals: 7 },
  void_emperor: { credits: 1350, crystals: 10 },
};

export function getBossCombatReward(
  bossId: BossId,
  mode: GameMode,
  creditBonusMult: number,
  endlessBossTier = 1
): CurrencyAmount {
  const base = BOSS_DEFEAT_REWARDS[bossId] ?? { credits: 320, crystals: 3 };
  const cappedBonus = Math.min(ECONOMY_CAPS.maxCreditBonusMult, Math.max(1, creditBonusMult));

  if (mode === 'boss_rush') {
    // Gauntlet clears award the main crystal jackpot upon defeating all 5 bosses
    return {
      credits: Math.round(base.credits * 0.6 * cappedBonus),
      crystals: Math.max(1, Math.floor(base.crystals * 0.5)),
    };
  }

  if (mode === 'endless') {
    const loopScale = 1 + Math.max(0, endlessBossTier - 1) * 0.2;
    return {
      credits: Math.round(base.credits * 0.85 * loopScale * cappedBonus),
      crystals: Math.max(2, Math.round(base.crystals * 0.7)),
    };
  }

  return {
    credits: Math.round(base.credits * cappedBonus),
    crystals: base.crystals,
  };
}

/** Boss Rush full gauntlet clear bonus */
export const BOSS_RUSH_CLEAR_REWARD: CurrencyAmount = {
  credits: 1600,
  crystals: 10,
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
  const credits = Math.round((55 + w * 18) * cappedBonus);
  let crystals = 0;
  if (w % 3 === 0) crystals += 1;
  if (w % 10 === 0) crystals += 1;
  return { credits, crystals };
}

/** Campaign clear + one-time first-clear milestone reward */
export function getCampaignClearReward(
  levelNumber: number,
  hasBoss: boolean,
  isFirstClear: boolean,
  creditBonusMult: number
): CampaignRewardBreakdown {
  const lvl = Math.max(1, Math.floor(levelNumber));
  const cappedBonus = Math.min(ECONOMY_CAPS.maxCreditBonusMult, Math.max(1, creditBonusMult));

  const baseClearCredits = 140 + lvl * 70;
  const clearCredits = Math.round(baseClearCredits * cappedBonus);
  const clearCrystals = hasBoss ? 2 : 1;

  const firstClearCredits = 300 + lvl * 170;
  const firstClearCrystals = 2 + Math.floor((lvl + (hasBoss ? 1 : 0)) / 2);

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
    credits: roundCredits(firstClearCredits * 0.28, 10),
    crystals: Math.max(1, Math.round(firstClearCrystals * 0.2)),
    isReplay: true,
  };
}

/** Challenge bounty table */
export const CHALLENGE_REWARDS: Record<string, CurrencyAmount> = {
  chal_glass_cannon: { credits: 900, crystals: 5 },
  chal_laser_trial: { credits: 1100, crystals: 6 },
  chal_timed_gauntlet: { credits: 1350, crystals: 8 },
  chal_venom_duel: { credits: 1650, crystals: 10 },
  chal_lightning_storm: { credits: 1750, crystals: 11 },
  chal_emperor_duel: { credits: 2800, crystals: 18 },
};

/** Rarity pricing multipliers for Equipment & Drones */
export const RARITY_ECONOMY: Record<
  Rarity,
  { costMultiplier: number; statMultiplier: number; crystalBase: number; crystalStep: number }
> = {
  common: { costMultiplier: 1.0, statMultiplier: 1.0, crystalBase: 0, crystalStep: 0 },
  rare: { costMultiplier: 1.3, statMultiplier: 1.25, crystalBase: 2, crystalStep: 1.5 },
  epic: { costMultiplier: 1.65, statMultiplier: 1.55, crystalBase: 3, crystalStep: 2.5 },
  legendary: { costMultiplier: 2.0, statMultiplier: 1.9, crystalBase: 4, crystalStep: 3.0 },
  mythic: { costMultiplier: 2.4, statMultiplier: 2.35, crystalBase: 5, crystalStep: 4.0 },
};

/** Fleet System Upgrade pricing rules (8 tracks) */
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
  max_health: { baseCost: 150, costMultiplier: 1.34 },
  shield_capacity: { baseCost: 170, costMultiplier: 1.35 },
  movement_speed: { baseCost: 180, costMultiplier: 1.35 },
  weapon_damage: {
    baseCost: 200,
    costMultiplier: 1.37,
    crystalCostAtLevel: 7,
    baseCrystalCost: 3,
    crystalStep: 1,
  },
  fire_rate: {
    baseCost: 220,
    costMultiplier: 1.37,
    crystalCostAtLevel: 7,
    baseCrystalCost: 3,
    crystalStep: 1,
  },
  missile_power: {
    baseCost: 220,
    costMultiplier: 1.36,
    crystalCostAtLevel: 6,
    baseCrystalCost: 3,
    crystalStep: 1,
  },
  critical_chance: {
    baseCost: 240,
    costMultiplier: 1.38,
    crystalCostAtLevel: 6,
    baseCrystalCost: 3,
    crystalStep: 1,
  },
  special_power: {
    baseCost: 260,
    costMultiplier: 1.38,
    crystalCostAtLevel: 5,
    baseCrystalCost: 3,
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
    crystals = (rule.baseCrystalCost ?? 2) + tier * (rule.crystalStep ?? 1);
  }
  return { credits, crystals };
}

/** Weapon unlocks & tiered upgrade curves */
export const WEAPON_ECONOMY: Record<
  WeaponId,
  { unlockLevel: number; unlockCredits: number; unlockCrystals: number; upgradeTierMult: number }
> = {
  plasma: { unlockLevel: 1, unlockCredits: 0, unlockCrystals: 0, upgradeTierMult: 1.0 },
  dual_laser: { unlockLevel: 1, unlockCredits: 0, unlockCrystals: 0, upgradeTierMult: 1.0 },
  spread: { unlockLevel: 1, unlockCredits: 0, unlockCrystals: 0, upgradeTierMult: 1.0 },
  homing: { unlockLevel: 1, unlockCredits: 450, unlockCrystals: 0, upgradeTierMult: 1.15 },
  beam: { unlockLevel: 2, unlockCredits: 900, unlockCrystals: 2, upgradeTierMult: 1.22 },
  lightning: { unlockLevel: 3, unlockCredits: 1450, unlockCrystals: 4, upgradeTierMult: 1.3 },
};

export function calculateWeaponUpgradeCost(
  currentLevel: number,
  weaponId: WeaponId = 'plasma'
): CurrencyAmount {
  const lvl = Math.max(1, Math.floor(currentLevel));
  if (lvl >= 5) return { credits: 0, crystals: 0 };
  const tierMult = WEAPON_ECONOMY[weaponId]?.upgradeTierMult ?? 1.0;
  const credits = roundCredits(320 * tierMult * Math.pow(1.58, lvl - 1), 10);
  let crystals = 0;
  if (lvl === 3) {
    crystals = tierMult > 1.2 ? 4 : 3;
  } else if (lvl >= 4) {
    crystals = tierMult >= 1.3 ? 8 : tierMult > 1.2 ? 7 : 6;
  }
  return { credits, crystals };
}

/** Ship unlock pricing table */
export const SHIP_ECONOMY: Record<
  ShipId,
  { credits: number; crystals: number; minSectorCompleted?: number }
> = {
  falcon_x: { credits: 0, crystals: 0 },
  destroyer: { credits: 950, crystals: 0 },
  phantom: { credits: 1500, crystals: 5 },
  thunderbolt: { credits: 2400, crystals: 9, minSectorCompleted: 2 },
  nova_prime: { credits: 2900, crystals: 12, minSectorCompleted: 3 },
  aegis: { credits: 3600, crystals: 16, minSectorCompleted: 4 },
  specter: { credits: 4800, crystals: 22, minSectorCompleted: 6 },
  celestial: { credits: 8500, crystals: 42, minSectorCompleted: 8 },
};

export function formatShipUnlockLabel(shipId: ShipId): string {
  const req = SHIP_ECONOMY[shipId];
  if (req.credits === 0 && req.crystals === 0) return 'Unlocked by default';
  const parts: string[] = [`${req.credits.toLocaleString()} Credits`];
  if (req.crystals > 0) parts.push(`${req.crystals} Crystals`);
  if (req.minSectorCompleted) {
    parts.push(`Clear Sector ${String(req.minSectorCompleted).padStart(2, '0')}`);
  }
  return parts.join(' · ');
}

/** Equipment purchase & upgrade cost formulas */
export const EQUIPMENT_PRICING: Record<string, CurrencyAmount> = {
  off_plasma_coil: { credits: 360, crystals: 0 },
  off_cryo_accelerator: { credits: 920, crystals: 4 },
  off_quantum_sight: { credits: 1850, crystals: 10 },
  off_singularity_core: { credits: 4600, crystals: 30 },

  def_titanium_hull: { credits: 340, crystals: 0 },
  def_aegis_emitter: { credits: 880, crystals: 4 },
  def_phase_armor: { credits: 1950, crystals: 11 },
  def_immortal_bulwark: { credits: 3600, crystals: 22 },

  util_ion_thruster: { credits: 320, crystals: 0 },
  util_salvage_magnet: { credits: 850, crystals: 4 },
  util_warp_actuator: { credits: 1800, crystals: 10 },
  util_astral_navigator: { credits: 3300, crystals: 19 },

  spec_emp_inducer: { credits: 380, crystals: 0 },
  spec_chrono_cell: { credits: 980, crystals: 5 },
  spec_nova_prism: { credits: 2100, crystals: 12 },
  spec_omega_relayer: { credits: 4400, crystals: 28 },
};

export function calculateEquipmentUpgradeCost(rarity: Rarity, currentLevel: number): CurrencyAmount {
  const lvl = Math.max(1, Math.floor(currentLevel));
  if (lvl >= 5) return { credits: 0, crystals: 0 };
  const eco = RARITY_ECONOMY[rarity];
  const credits = roundCredits(220 * eco.costMultiplier * Math.pow(1.48, lvl - 1), 10);
  const crystals =
    lvl >= 2 && rarity !== 'common' ? Math.round(eco.crystalBase + (lvl - 2) * eco.crystalStep) : 0;
  return { credits, crystals };
}

/** Companion Drone purchase & rarity-aware upgrade cost formulas */
export const DRONE_PRICING: Record<string, CurrencyAmount> = {
  assault: { credits: 850, crystals: 4 },
  shield: { credits: 900, crystals: 4 },
  collector: { credits: 1350, crystals: 7 },
  repair: { credits: 1500, crystals: 8 },
};

export function calculateDroneUpgradeCost(rarity: Rarity, currentLevel: number): CurrencyAmount {
  const lvl = Math.max(1, Math.floor(currentLevel));
  if (lvl >= 5) return { credits: 0, crystals: 0 };
  const tierMult = RARITY_ECONOMY[rarity]?.costMultiplier ?? 1.25;
  const credits = roundCredits(320 * tierMult * Math.pow(1.48, lvl - 1), 10);
  const crystals =
    rarity === 'epic'
      ? [2, 3, 5, 7][lvl - 1] ?? 7
      : [1, 2, 4, 6][lvl - 1] ?? 6;
  return { credits, crystals };
}

/** Daily, Weekly & Achievement calibrated reward tables */
export const MISSION_REWARDS: Record<string, CurrencyAmount> = {
  // Daily pool
  daily_kills_40: { credits: 360, crystals: 1 },
  daily_elite_6: { credits: 420, crystals: 2 },
  daily_powerups_6: { credits: 300, crystals: 1 },
  daily_sector_1: { credits: 440, crystals: 2 },
  daily_boss_1: { credits: 560, crystals: 3 },
  daily_survive_120: { credits: 320, crystals: 1 },
  daily_plasma_25: { credits: 380, crystals: 2 },
  daily_falcon_clear: { credits: 440, crystals: 2 },

  // Weekly pool
  weekly_levels_5: { credits: 1900, crystals: 9 },
  weekly_bosses_4: { credits: 2500, crystals: 13 },
  weekly_endless_8: { credits: 2200, crystals: 11 },
  weekly_score_18000: { credits: 2300, crystals: 12 },
  weekly_kills_250: { credits: 2000, crystals: 10 },
};

export const ACHIEVEMENT_REWARDS: Record<string, CurrencyAmount> = {
  ach_kills_100: { credits: 450, crystals: 3 },
  ach_kills_500: { credits: 1250, crystals: 7 },
  ach_crits_75: { credits: 600, crystals: 4 },
  ach_boss_1: { credits: 520, crystals: 3 },
  ach_boss_10: { credits: 2200, crystals: 14 },
  ach_boss_rush_1: { credits: 2600, crystals: 16 },
  ach_endless_5: { credits: 650, crystals: 4 },
  ach_endless_12: { credits: 1850, crystals: 12 },
  ach_sectors_4: { credits: 850, crystals: 5 },
  ach_challenges_3: { credits: 1450, crystals: 9 },
  ach_weapons_6: { credits: 1150, crystals: 7 },
  ach_upgrades_15: { credits: 950, crystals: 6 },
  ach_ships_4: { credits: 1200, crystals: 7 },
  ach_ships_8: { credits: 4200, crystals: 22 },
  ach_sectors_10: { credits: 3400, crystals: 20 },
  ach_score_30000: { credits: 2100, crystals: 13 },
};
