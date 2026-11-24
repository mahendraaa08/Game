import { ACHIEVEMENTS } from '../config/AchievementConfig';
import type { BossId } from '../config/BossConfig';
import {
  DRONE_SLOT_IDS,
  type DroneId,
  DRONES,
  type DroneSlotId,
  getCollectorCreditBonus,
  getDroneUpgradeCost,
  isDroneCompatibleWithSlot,
} from '../config/DroneConfig';
import {
  BOSS_RUSH_CLEAR_REWARD,
  ECONOMY_CAPS,
  type ExchangeDirection,
  PLAYER_NAME_CHANGE_COST_GEMS,
  getCampaignClearReward,
  getChallengePayout,
  previewCurrencyExchange,
  validatePlayerName,
} from '../config/EconomyConfig';
import type { EnemyClass } from '../config/EnemyConfig';
import {
  EQUIPMENT_BY_ID,
  type EquipmentSlot,
  getEquipmentUpgradeCost,
  scaleEquipmentBonuses,
} from '../config/EquipmentConfig';
import {
  CAMPAIGN_DIFFICULTIES,
  type BossRushPerformanceSummary,
  type CampaignDifficulty,
  type ChallengeDifficulty,
  type ChallengeRule,
  type GameMode,
  getNextCampaignDifficulty,
  resolveChallengeTier,
} from '../config/GameModeConfig';
import { CAMPAIGN_LEVELS } from '../config/LevelConfig';
import {
  MAX_PLAYER_LEVEL,
  PLAYER_EXP_SOURCES,
  getExpRequiredForNextLevel,
  getLevelUpReward,
  getRankTitleForLevel,
} from '../config/LevelProgressionConfig';
import {
  selectDailyMissions,
  selectWeeklyChallenges,
} from '../config/MissionConfig';
import {
  PROFILE_AVATAR_MAP,
  PROFILE_BORDER_MAP,
  type ProfileAvatarId,
  type ProfileBorderId,
  isValidAvatarId,
  isValidBorderId,
} from '../config/ProfileCosmeticsConfig';
import { GAME_CONSTANTS } from '../config/GameConfig';
import { type ShipId, SHIPS } from '../config/ShipConfig';
import { getUpgradeCost, getWeaponUpgradeCost, type UpgradeId, UPGRADES } from '../config/UpgradeConfig';
import { type WeaponId, WEAPONS } from '../config/WeaponConfig';
import { EventBus, type LevelUpPayload, type LevelUpStepSummary } from '../utils/EventBus';
import {
  type PlayerProgress,
  StorageManager,
  syncAggregateCampaignFields,
} from '../utils/StorageManager';

export interface ActionResult {
  ok: boolean;
  message: string;
}

export interface ClaimAllResult extends ActionResult {
  claimedCount: number;
  creditsGranted: number;
  crystalsGranted: number;
  expGranted?: number;
}

export interface ComputedPlayerStats {
  shipId: ShipId;
  maxHp: number;
  maxShield: number;
  moveSpeed: number;
  damageMult: number;
  fireRateMult: number;
  critChance: number;
  critDamageMult: number;
  specialDamageMultiplier: number;
  specialCooldownMult: number;
  dashCooldownMult: number;
  damageReduction: number;
  shieldRegenMult: number;
  pickupRadiusBonus: number;
  creditBonusMult: number;
  dronePowerBonusPct: number;
}

export function computePlayerStats(
  progress: PlayerProgress,
  challengeRule?: ChallengeRule
): ComputedPlayerStats {
  const ship = SHIPS[progress.selectedShip] ?? SHIPS.falcon_x;
  const u = progress.upgrades;

  let maxHp = ship.stats.maxHp + u.max_health * UPGRADES.max_health.perLevelBonus;
  let maxShield = ship.stats.maxShield + u.shield_capacity * UPGRADES.shield_capacity.perLevelBonus;
  let moveSpeed =
    GAME_CONSTANTS.PLAYER_SPEED * ship.stats.moveSpeed +
    u.movement_speed * UPGRADES.movement_speed.perLevelBonus;
  let damageMult = ship.stats.damageMult * (1 + u.weapon_damage * UPGRADES.weapon_damage.perLevelBonus);
  let fireRateMult = ship.stats.fireRateMult * (1 + u.fire_rate * UPGRADES.fire_rate.perLevelBonus);
  let critChance = ship.stats.critChance + u.critical_chance * UPGRADES.critical_chance.perLevelBonus;
  let critDamageMult =
    ship.stats.critDamage + u.critical_damage * UPGRADES.critical_damage.perLevelBonus;
  let specialDamageMultiplier = 1.0;
  const specialCdLvl = Math.max(
    0,
    Math.min(UPGRADES.special_cooldown.maxLevel, Math.floor(u.special_cooldown ?? 0))
  );
  let specialCooldownMult = Math.max(
    0.76,
    1 - specialCdLvl * UPGRADES.special_cooldown.perLevelBonus
  );
  let dashCooldownMult = 1.0;
  let damageReduction = 0;
  let shieldRegenMult = 1.0;
  let pickupRadiusBonus = 0;
  let creditBonusMult = 1.0;
  let dronePowerBonusPct = 0;

  // Apply 4 Equipped Gear Items
  (['offensive', 'defensive', 'utility', 'special'] as EquipmentSlot[]).forEach((slot) => {
    const id = progress.equippedGear[slot];
    if (!id) return;
    const def = EQUIPMENT_BY_ID[id];
    const lvl = progress.ownedEquipment[id];
    if (!def || !lvl || def.slot !== slot) return;
    const b = scaleEquipmentBonuses(def, lvl);
    if (b.damagePct) damageMult *= 1 + b.damagePct / 100;
    if (b.fireRatePct) fireRateMult *= 1 + b.fireRatePct / 100;
    if (b.critChancePct) critChance += b.critChancePct / 100;
    if (b.critDamagePct) critDamageMult += b.critDamagePct / 100;
    if (b.maxHpFlat) maxHp += b.maxHpFlat;
    if (b.maxShieldFlat) maxShield += b.maxShieldFlat;
    if (b.shieldRegenPct) shieldRegenMult += b.shieldRegenPct / 100;
    if (b.damageReductionPct) damageReduction += b.damageReductionPct / 100;
    if (b.moveSpeedFlat) moveSpeed += b.moveSpeedFlat;
    if (b.pickupRangePct) pickupRadiusBonus += Math.round(140 * (b.pickupRangePct / 100));
    if (b.creditBonusPct) creditBonusMult += b.creditBonusPct / 100;
    if (b.specialPowerPct) specialDamageMultiplier *= 1 + b.specialPowerPct / 100;
    if (b.specialCooldownPct) specialCooldownMult *= Math.max(0.6, 1 - b.specialCooldownPct / 100);
    if (b.dashCooldownPct) dashCooldownMult *= Math.max(0.55, 1 - b.dashCooldownPct / 100);
    if (b.dronePowerPct) dronePowerBonusPct += b.dronePowerPct / 100;
  });

  const cappedDronePowerBonus = Math.min(0.45, Math.max(0, dronePowerBonusPct));

  // Apply Drone passive stat boosts (Shield & Collector drones; max 1 per DroneId via slots)
  if (!challengeRule?.disableDrones) {
    const seenPassiveDrones = new Set<DroneId>();
    DRONE_SLOT_IDS.forEach((slotId) => {
      const dId = progress.equippedDroneSlots?.[slotId];
      if (!dId || seenPassiveDrones.has(dId)) return;
      seenPassiveDrones.add(dId);
      const lvl = progress.ownedDrones[dId] ?? 0;
      if (lvl <= 0) return;
      if (dId === 'shield') {
        maxShield += 18 + (lvl - 1) * 8;
        shieldRegenMult += 0.2 + (lvl - 1) * 0.08;
      } else if (dId === 'collector') {
        pickupRadiusBonus += 110 + (lvl - 1) * 24;
        creditBonusMult += getCollectorCreditBonus(lvl, cappedDronePowerBonus);
      }
    });
  }

  // Apply Challenge Rule overrides cleanly
  if (challengeRule?.maxHpOverride) {
    maxHp = challengeRule.maxHpOverride;
  }
  if (challengeRule?.disableShield) {
    maxShield = 0;
  } else if (
    typeof challengeRule?.shieldCapRatio === 'number' &&
    challengeRule.shieldCapRatio >= 0 &&
    challengeRule.shieldCapRatio < 1
  ) {
    maxShield = Math.round(maxShield * challengeRule.shieldCapRatio);
  }

  return {
    shipId: ship.id,
    maxHp: Math.max(10, Math.round(maxHp)),
    maxShield: Math.max(0, Math.round(maxShield)),
    moveSpeed: Math.round(moveSpeed),
    damageMult,
    fireRateMult,
    critChance: Math.min(0.65, Math.max(0, critChance)),
    critDamageMult,
    specialDamageMultiplier,
    specialCooldownMult: Math.max(0.55, specialCooldownMult),
    dashCooldownMult: Math.max(0.5, dashCooldownMult),
    damageReduction: Math.min(0.6, Math.max(0, damageReduction)),
    shieldRegenMult: Math.min(2.6, Math.max(0.5, shieldRegenMult)),
    pickupRadiusBonus,
    creditBonusMult: Math.min(ECONOMY_CAPS.maxCreditBonusMult, Math.max(1, creditBonusMult)),
    dronePowerBonusPct: cappedDronePowerBonus,
  };
}

export interface CommanderRankInfo {
  level: number;
  title: string;
  currentExp: number;
  requiredExp: number;
  isMaxLevel: boolean;
  progressPct: number;
}

export function computeCommanderRank(progress: PlayerProgress): CommanderRankInfo {
  const level = Math.max(1, Math.min(MAX_PLAYER_LEVEL, Math.floor(progress.playerLevel || 1)));
  const isMaxLevel = level >= MAX_PLAYER_LEVEL;
  const requiredExp = isMaxLevel ? 0 : getExpRequiredForNextLevel(level);
  const currentExp = isMaxLevel ? 0 : Math.max(0, Math.floor(progress.playerExp || 0));
  const progressPct = isMaxLevel
    ? 100
    : requiredExp > 0
    ? Math.min(100, Math.round((currentExp / requiredExp) * 100))
    : 0;

  return {
    level,
    title: getRankTitleForLevel(level),
    currentExp,
    requiredExp,
    isMaxLevel,
    progressPct,
  };
}

class ProgressionManagerImpl {
  private emitChanged(): void {
    EventBus.emit('progress:updated');
  }

  getAchievementMetricValue(p: PlayerProgress, metric: string): number {
    switch (metric) {
      case 'total_kills':
        return p.totalKills;
      case 'total_boss_kills':
        return p.stats.totalBossKills;
      case 'completed_sectors_count':
        return p.completedLevels.length;
      case 'unlocked_ships_count':
        return p.unlockedShips.length;
      case 'unlocked_weapons_count':
        return p.unlockedWeapons.length;
      case 'best_endless_wave':
        return p.stats.bestEndlessWave;
      case 'completed_challenges_count':
        return p.stats.completedChallenges.length;
      case 'completed_extreme_challenges_count':
        return Object.values(p.stats.completedChallengeTiers ?? {}).filter((tiers) =>
          Array.isArray(tiers) && tiers.includes('Extreme')
        ).length;
      case 'hard_sectors_completed':
        return p.campaignProgress?.hard?.completedLevels?.length ?? 0;
      case 'nightmare_sectors_completed':
        return p.campaignProgress?.nightmare?.completedLevels?.length ?? 0;
      case 'boss_rush_clears':
        return p.stats.bossRushClears;
      case 'high_score':
        return p.highScore;
      case 'total_upgrades_bought':
        return p.stats.totalUpgradesBought;
      case 'critical_hits':
        return p.stats.totalCrits;
      default:
        return 0;
    }
  }

  setSelectedCampaignDifficulty(difficulty: CampaignDifficulty): ActionResult {
    const p = StorageManager.load();
    const bucket = p.campaignProgress[difficulty];
    if (!bucket || bucket.highestUnlockedLevel <= 0) {
      return { ok: false, message: `${CAMPAIGN_DIFFICULTIES[difficulty].label} is locked.` };
    }
    if (p.selectedCampaignDifficulty !== difficulty) {
      p.selectedCampaignDifficulty = difficulty;
      StorageManager.save(p);
      this.emitChanged();
    }
    return { ok: true, message: `${CAMPAIGN_DIFFICULTIES[difficulty].label} difficulty selected.` };
  }

  private addRewardHistory(p: PlayerProgress, label: string, credits: number, crystals: number): void {
    const cleanCredits = Math.max(0, Math.floor(credits));
    const cleanCrystals = Math.max(0, Math.floor(crystals));
    if (cleanCredits === 0 && cleanCrystals === 0) return;
    p.credits = Math.max(0, p.credits + cleanCredits);
    p.crystals = Math.max(0, p.crystals + cleanCrystals);
    p.rewardHistory = [
      {
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        label,
        credits: cleanCredits,
        crystals: cleanCrystals,
        at: Date.now(),
      },
      ...p.rewardHistory,
    ].slice(0, 15);
  }

  private applyExpAndRewards(
    p: PlayerProgress,
    rawExp: number
  ): { expAdded: number; levelUp: LevelUpPayload | null } {
    if (p.playerLevel >= MAX_PLAYER_LEVEL) {
      p.playerLevel = MAX_PLAYER_LEVEL;
      p.playerExp = 0;
      p.highestRewardedLevel = MAX_PLAYER_LEVEL;
      return { expAdded: 0, levelUp: null };
    }

    const expDelta = Math.max(0, Math.floor(rawExp));
    if (expDelta <= 0) return { expAdded: 0, levelUp: null };

    const previousLevel = Math.max(1, Math.floor(p.playerLevel || 1));
    p.playerLevel = previousLevel;
    p.highestRewardedLevel = Math.max(previousLevel, Math.floor(p.highestRewardedLevel || previousLevel));
    p.playerExp = Math.max(0, Math.floor(p.playerExp || 0)) + expDelta;

    let totalCreditsGranted = 0;
    let totalCrystalsGranted = 0;
    const newSteps: LevelUpStepSummary[] = [];

    while (p.playerLevel < MAX_PLAYER_LEVEL) {
      const needed = getExpRequiredForNextLevel(p.playerLevel);
      if (needed <= 0 || p.playerExp < needed) {
        break;
      }
      p.playerExp -= needed;
      p.playerLevel += 1;

      if (p.playerLevel > p.highestRewardedLevel) {
        const reward = getLevelUpReward(p.playerLevel);
        p.highestRewardedLevel = p.playerLevel;
        totalCreditsGranted += reward.credits;
        totalCrystalsGranted += reward.crystals;
        newSteps.push({
          level: p.playerLevel,
          credits: reward.credits,
          crystals: reward.crystals,
        });
        this.addRewardHistory(
          p,
          `Level ${p.playerLevel} Up`,
          reward.credits,
          reward.crystals
        );
      }
    }

    if (p.playerLevel >= MAX_PLAYER_LEVEL) {
      p.playerLevel = MAX_PLAYER_LEVEL;
      p.playerExp = 0;
    }

    if (p.playerLevel > previousLevel) {
      const existing = p.pendingLevelUp;
      const merged: LevelUpPayload = {
        previousLevel: existing ? Math.min(existing.previousLevel, previousLevel) : previousLevel,
        newLevel: Math.max(existing?.newLevel ?? 1, p.playerLevel),
        creditsGranted: (existing?.creditsGranted ?? 0) + totalCreditsGranted,
        crystalsGranted: (existing?.crystalsGranted ?? 0) + totalCrystalsGranted,
        steps: [...(existing?.steps ?? []), ...newSteps],
      };
      p.pendingLevelUp = merged;
      return { expAdded: expDelta, levelUp: merged };
    }

    return { expAdded: expDelta, levelUp: null };
  }

  grantPlayerExp(rawExp: number): LevelUpPayload | null {
    const p = StorageManager.load();
    const { levelUp } = this.applyExpAndRewards(p, rawExp);
    StorageManager.save(p);
    this.emitChanged();
    if (levelUp) {
      EventBus.emit('player:leveled-up', levelUp);
    }
    return levelUp;
  }

  consumePendingLevelUp(): LevelUpPayload | null {
    const p = StorageManager.load();
    if (!p.pendingLevelUp) return null;
    const payload = p.pendingLevelUp;
    p.pendingLevelUp = null;
    StorageManager.save(p);
    this.emitChanged();
    return payload;
  }

  private trySpend(p: PlayerProgress, credits: number, crystals: number): ActionResult | null {
    const cCost = Math.max(0, Math.floor(credits));
    const kCost = Math.max(0, Math.floor(crystals));
    if (p.credits < cCost) {
      return { ok: false, message: `Need ${cCost - p.credits} more Credits.` };
    }
    if (p.crystals < kCost) {
      return { ok: false, message: `Need ${kCost - p.crystals} more Crystals.` };
    }
    p.credits -= cCost;
    p.crystals -= kCost;
    return null;
  }

  unlockOrSelectShip(shipId: ShipId): ActionResult {
    const def = SHIPS[shipId];
    const p = StorageManager.load();
    if (p.unlockedShips.includes(shipId)) {
      StorageManager.update((d) => {
        d.selectedShip = shipId;
      });
      EventBus.emit('ui:select-ship', shipId);
      this.emitChanged();
      return { ok: true, message: `${def.name} deployed as active fighter.` };
    }

    if (
      def.unlock.minSectorCompleted &&
      !p.completedLevels.includes(def.unlock.minSectorCompleted)
    ) {
      return {
        ok: false,
        message: `Clear Sector ${String(def.unlock.minSectorCompleted).padStart(2, '0')} first.`,
      };
    }

    const err = this.trySpend(p, def.unlock.credits, def.unlock.crystals);
    if (err) return err;

    p.unlockedShips = [...p.unlockedShips, shipId];
    p.selectedShip = shipId;
    StorageManager.save(p);
    EventBus.emit('ui:select-ship', shipId);
    this.emitChanged();
    return { ok: true, message: `Unlocked and equipped ${def.name}!` };
  }

  purchaseUpgrade(upgradeId: UpgradeId): ActionResult {
    const def = UPGRADES[upgradeId];
    const p = StorageManager.load();
    const cur = p.upgrades[upgradeId] ?? 0;
    if (cur >= def.maxLevel) {
      return { ok: false, message: `${def.name} is already at Max Level.` };
    }
    const cost = getUpgradeCost(def, cur);
    const err = this.trySpend(p, cost.credits, cost.crystals);
    if (err) return err;

    p.upgrades[upgradeId] = cur + 1;
    p.stats.totalUpgradesBought += 1;
    StorageManager.save(p);
    this.emitChanged();
    return { ok: true, message: `${def.name} upgraded to Lv.${cur + 1}!` };
  }

  unlockOrUpgradeWeapon(weaponId: WeaponId, action: 'unlock' | 'upgrade' | 'select'): ActionResult {
    const def = WEAPONS[weaponId];
    const p = StorageManager.load();
    const isUnlocked = p.unlockedWeapons.includes(weaponId);

    if (action === 'select') {
      if (!isUnlocked) return { ok: false, message: `${def.name} is locked.` };
      p.selectedWeapon = weaponId;
      StorageManager.save(p);
      EventBus.emit('ui:select-weapon', weaponId);
      this.emitChanged();
      return { ok: true, message: `${def.name} equipped.` };
    }

    if (action === 'unlock') {
      if (isUnlocked) return { ok: false, message: `${def.name} is already unlocked.` };
      if (p.highestUnlockedLevel < def.unlockLevel) {
        return { ok: false, message: `Reach Sector ${String(def.unlockLevel).padStart(2, '0')} to unlock.` };
      }
      const err = this.trySpend(p, def.unlockCredits, def.unlockCrystals);
      if (err) return err;
      p.unlockedWeapons = [...p.unlockedWeapons, weaponId];
      p.selectedWeapon = weaponId;
      StorageManager.save(p);
      EventBus.emit('ui:select-weapon', weaponId);
      this.emitChanged();
      return { ok: true, message: `${def.name} unlocked and equipped!` };
    }

    // upgrade
    if (!isUnlocked) return { ok: false, message: `Unlock ${def.name} first.` };
    const cur = p.weaponLevels[weaponId] ?? 1;
    if (cur >= def.maxWeaponLevel) {
      return { ok: false, message: `${def.name} is already at Max Level.` };
    }
    const cost = getWeaponUpgradeCost(cur, weaponId);
    const err = this.trySpend(p, cost.credits, cost.crystals);
    if (err) return err;
    p.weaponLevels[weaponId] = cur + 1;
    p.stats.totalUpgradesBought += 1;
    StorageManager.save(p);
    this.emitChanged();
    return { ok: true, message: `${def.name} upgraded to Lv.${cur + 1}!` };
  }

  buyOrUpgradeEquipment(eqId: string): ActionResult {
    const def = EQUIPMENT_BY_ID[eqId];
    if (!def) return { ok: false, message: 'Invalid equipment item.' };
    const p = StorageManager.load();
    const cur = p.ownedEquipment[eqId] ?? 0;

    if (cur === 0) {
      const err = this.trySpend(p, def.costCredits, def.costCrystals);
      if (err) return err;
      p.ownedEquipment[eqId] = 1;
      if (!p.equippedGear[def.slot]) {
        p.equippedGear[def.slot] = eqId;
      }
      StorageManager.save(p);
      this.emitChanged();
      return { ok: true, message: `Acquired & equipped ${def.name}!` };
    }

    if (cur >= def.maxLevel) {
      return { ok: false, message: `${def.name} is already at Max Level.` };
    }
    const cost = getEquipmentUpgradeCost(def, cur);
    const err = this.trySpend(p, cost.credits, cost.crystals);
    if (err) return err;
    p.ownedEquipment[eqId] = cur + 1;
    p.stats.totalUpgradesBought += 1;
    StorageManager.save(p);
    this.emitChanged();
    return { ok: true, message: `${def.name} enhanced to Lv.${cur + 1}!` };
  }

  toggleEquipGear(eqId: string): ActionResult {
    const def = EQUIPMENT_BY_ID[eqId];
    if (!def) return { ok: false, message: 'Invalid item.' };
    const p = StorageManager.load();
    if (!p.ownedEquipment[eqId]) {
      return { ok: false, message: `Purchase ${def.name} first.` };
    }
    const currentlyEquipped = p.equippedGear[def.slot] === eqId;
    p.equippedGear[def.slot] = currentlyEquipped ? null : eqId;
    StorageManager.save(p);
    this.emitChanged();
    return {
      ok: true,
      message: currentlyEquipped ? `Unequipped ${def.name}.` : `Equipped ${def.name}.`,
    };
  }

  buyOrUpgradeDrone(droneId: DroneId, targetSlotId?: DroneSlotId): ActionResult {
    const def = DRONES[droneId];
    if (!def) return { ok: false, message: 'Invalid drone module.' };
    const p = StorageManager.load();
    const cur = p.ownedDrones[droneId] ?? 0;

    if (cur === 0) {
      const err = this.trySpend(p, def.costCredits, def.costCrystals);
      if (err) return err;
      p.ownedDrones[droneId] = 1;

      const alreadyInOtherSlot = DRONE_SLOT_IDS.some(
        (sId) => p.equippedDroneSlots[sId] === droneId
      );
      if (
        targetSlotId &&
        isDroneCompatibleWithSlot(def, targetSlotId) &&
        !p.equippedDroneSlots[targetSlotId] &&
        !alreadyInOtherSlot
      ) {
        p.equippedDroneSlots = { ...p.equippedDroneSlots, [targetSlotId]: droneId };
        StorageManager.save(p);
        this.emitChanged();
        const slotNum = targetSlotId === 'slot1' ? '01' : '02';
        return { ok: true, message: `Acquired & equipped ${def.name} in Slot ${slotNum}!` };
      }

      StorageManager.save(p);
      this.emitChanged();
      return { ok: true, message: `Acquired ${def.name}!` };
    }

    if (cur >= def.maxLevel) {
      return { ok: false, message: `${def.name} is at Max Level.` };
    }
    const cost = getDroneUpgradeCost(def, cur);
    const err = this.trySpend(p, cost.credits, cost.crystals);
    if (err) return err;
    p.ownedDrones[droneId] = cur + 1;
    p.stats.totalUpgradesBought += 1;
    StorageManager.save(p);
    this.emitChanged();
    return { ok: true, message: `${def.name} upgraded to Lv.${cur + 1}!` };
  }

  equipDroneToSlot(droneId: DroneId, slotId: DroneSlotId): ActionResult {
    const def = DRONES[droneId];
    if (!def) return { ok: false, message: 'Invalid drone module.' };
    if (!isDroneCompatibleWithSlot(def, slotId)) {
      return { ok: false, message: `${def.name} is not compatible with this slot.` };
    }

    const p = StorageManager.load();
    if (!p.ownedDrones[droneId] || p.ownedDrones[droneId]! <= 0) {
      return { ok: false, message: `Purchase ${def.name} first.` };
    }

    const slotLabel = slotId === 'slot1' ? 'Slot 01' : 'Slot 02';
    const otherSlotId: DroneSlotId = slotId === 'slot1' ? 'slot2' : 'slot1';
    const otherSlotLabel = otherSlotId === 'slot1' ? 'Slot 01' : 'Slot 02';

    if (p.equippedDroneSlots[slotId] === droneId) {
      return { ok: true, message: `${def.name} is already equipped in ${slotLabel}.` };
    }

    if (p.equippedDroneSlots[otherSlotId] === droneId) {
      return {
        ok: false,
        message: `${def.name} is active in ${otherSlotLabel}. Unequip it from ${otherSlotLabel} first.`,
      };
    }

    p.equippedDroneSlots = { ...p.equippedDroneSlots, [slotId]: droneId };
    StorageManager.save(p);
    this.emitChanged();
    return {
      ok: true,
      message: `${def.name} equipped to ${slotLabel}.`,
    };
  }

  unequipDroneFromSlot(slotId: DroneSlotId): ActionResult {
    const p = StorageManager.load();
    const currentId = p.equippedDroneSlots[slotId];
    if (!currentId) {
      return { ok: false, message: 'This slot is already empty.' };
    }
    const def = DRONES[currentId];
    p.equippedDroneSlots = { ...p.equippedDroneSlots, [slotId]: null };
    StorageManager.save(p);
    this.emitChanged();
    const slotLabel = slotId === 'slot1' ? 'Slot 01' : 'Slot 02';
    return {
      ok: true,
      message: `Unequipped ${def?.name ?? currentId} from ${slotLabel}.`,
    };
  }

  equipDrone(droneId: DroneId, targetSlotIndex?: 0 | 1): ActionResult {
    const slotId: DroneSlotId = targetSlotIndex === 1 ? 'slot2' : 'slot1';
    return this.equipDroneToSlot(droneId, slotId);
  }

  unequipDrone(droneId: DroneId): ActionResult {
    const p = StorageManager.load();
    const foundSlot = DRONE_SLOT_IDS.find((sId) => p.equippedDroneSlots[sId] === droneId);
    if (!foundSlot) {
      const def = DRONES[droneId];
      return { ok: false, message: `${def?.name ?? droneId} is not currently equipped.` };
    }
    return this.unequipDroneFromSlot(foundSlot);
  }

  claimDailyMission(missionId: string): ActionResult {
    const p = StorageManager.load();
    const templates = selectDailyMissions(p.dailyMissions.resetKey);
    const tpl = templates.find((m) => m.id === missionId);
    if (!tpl) return { ok: false, message: 'Mission expired or unavailable.' };
    if (p.dailyMissions.claimedIds.includes(missionId)) {
      return { ok: false, message: 'Reward already claimed.' };
    }
    const cur = p.dailyMissions.progress[missionId] ?? 0;
    if (cur < tpl.target) {
      return { ok: false, message: `Progress incomplete (${cur}/${tpl.target}).` };
    }
    p.dailyMissions.claimedIds = [...p.dailyMissions.claimedIds, missionId];
    this.addRewardHistory(p, `Daily: ${tpl.title}`, tpl.rewardCredits, tpl.rewardCrystals);
    const { expAdded, levelUp } = this.applyExpAndRewards(p, PLAYER_EXP_SOURCES.dailyMissionClaim);
    StorageManager.save(p);
    this.emitChanged();
    if (levelUp) EventBus.emit('player:leveled-up', levelUp);
    return {
      ok: true,
      message: `Claimed +${tpl.rewardCredits} Credits, +${tpl.rewardCrystals} Gems${expAdded > 0 ? `, +${expAdded} EXP` : ''}!`,
    };
  }

  claimWeeklyChallenge(challengeId: string): ActionResult {
    const p = StorageManager.load();
    const templates = selectWeeklyChallenges(p.weeklyChallenges.resetKey);
    const tpl = templates.find((m) => m.id === challengeId);
    if (!tpl) return { ok: false, message: 'Weekly challenge unavailable.' };
    if (p.weeklyChallenges.claimedIds.includes(challengeId)) {
      return { ok: false, message: 'Reward already claimed.' };
    }
    const cur = p.weeklyChallenges.progress[challengeId] ?? 0;
    if (cur < tpl.target) {
      return { ok: false, message: `Progress incomplete (${cur}/${tpl.target}).` };
    }
    p.weeklyChallenges.claimedIds = [...p.weeklyChallenges.claimedIds, challengeId];
    this.addRewardHistory(p, `Weekly: ${tpl.title}`, tpl.rewardCredits, tpl.rewardCrystals);
    const { expAdded, levelUp } = this.applyExpAndRewards(p, PLAYER_EXP_SOURCES.weeklyChallengeClaim);
    StorageManager.save(p);
    this.emitChanged();
    if (levelUp) EventBus.emit('player:leveled-up', levelUp);
    return {
      ok: true,
      message: `Claimed +${tpl.rewardCredits} Credits, +${tpl.rewardCrystals} Gems${expAdded > 0 ? `, +${expAdded} EXP` : ''}!`,
    };
  }

  claimAchievement(achievementId: string): ActionResult {
    const def = ACHIEVEMENTS.find((a) => a.id === achievementId);
    if (!def) return { ok: false, message: 'Achievement not found.' };
    const p = StorageManager.load();
    if (p.claimedAchievements.includes(achievementId)) {
      return { ok: false, message: 'Achievement reward already claimed.' };
    }
    const val = this.getAchievementMetricValue(p, def.metric);
    if (val < def.target) {
      return { ok: false, message: 'Achievement requirement not yet met.' };
    }
    p.claimedAchievements = [...p.claimedAchievements, achievementId];
    this.addRewardHistory(p, `Achievement: ${def.title}`, def.rewardCredits, def.rewardCrystals);
    const { expAdded, levelUp } = this.applyExpAndRewards(p, PLAYER_EXP_SOURCES.achievementClaim);
    StorageManager.save(p);
    this.emitChanged();
    if (levelUp) EventBus.emit('player:leveled-up', levelUp);
    return {
      ok: true,
      message: `Achievement claimed: +${def.rewardCredits} Credits, +${def.rewardCrystals} Gems${expAdded > 0 ? `, +${expAdded} EXP` : ''}!`,
    };
  }

  claimAllDirectives(): ClaimAllResult {
    const p = StorageManager.load();
    const dailyTemplates = selectDailyMissions(p.dailyMissions.resetKey);
    const weeklyTemplates = selectWeeklyChallenges(p.weeklyChallenges.resetKey);

    const dailyClaimedSet = new Set(p.dailyMissions.claimedIds);
    const weeklyClaimedSet = new Set(p.weeklyChallenges.claimedIds);

    const newlyClaimedDailyIds: string[] = [];
    let dailyCredits = 0;
    let dailyCrystals = 0;
    for (const tpl of dailyTemplates) {
      if (dailyClaimedSet.has(tpl.id)) continue;
      const cur = p.dailyMissions.progress[tpl.id] ?? 0;
      if (cur >= tpl.target) {
        dailyClaimedSet.add(tpl.id);
        newlyClaimedDailyIds.push(tpl.id);
        dailyCredits += tpl.rewardCredits;
        dailyCrystals += tpl.rewardCrystals;
      }
    }

    const newlyClaimedWeeklyIds: string[] = [];
    let weeklyCredits = 0;
    let weeklyCrystals = 0;
    for (const tpl of weeklyTemplates) {
      if (weeklyClaimedSet.has(tpl.id)) continue;
      const cur = p.weeklyChallenges.progress[tpl.id] ?? 0;
      if (cur >= tpl.target) {
        weeklyClaimedSet.add(tpl.id);
        newlyClaimedWeeklyIds.push(tpl.id);
        weeklyCredits += tpl.rewardCredits;
        weeklyCrystals += tpl.rewardCrystals;
      }
    }

    const claimedCount = newlyClaimedDailyIds.length + newlyClaimedWeeklyIds.length;
    if (claimedCount === 0) {
      return {
        ok: false,
        message: 'No completed directives ready to claim.',
        claimedCount: 0,
        creditsGranted: 0,
        crystalsGranted: 0,
        expGranted: 0,
      };
    }

    if (newlyClaimedDailyIds.length > 0) {
      p.dailyMissions.claimedIds = [...p.dailyMissions.claimedIds, ...newlyClaimedDailyIds];
      this.addRewardHistory(
        p,
        `Daily Batch (${newlyClaimedDailyIds.length})`,
        dailyCredits,
        dailyCrystals
      );
    }

    if (newlyClaimedWeeklyIds.length > 0) {
      p.weeklyChallenges.claimedIds = [...p.weeklyChallenges.claimedIds, ...newlyClaimedWeeklyIds];
      this.addRewardHistory(
        p,
        `Weekly Batch (${newlyClaimedWeeklyIds.length})`,
        weeklyCredits,
        weeklyCrystals
      );
    }

    const expEarned =
      newlyClaimedDailyIds.length * PLAYER_EXP_SOURCES.dailyMissionClaim +
      newlyClaimedWeeklyIds.length * PLAYER_EXP_SOURCES.weeklyChallengeClaim;
    const { expAdded, levelUp } = this.applyExpAndRewards(p, expEarned);

    const creditsGranted = dailyCredits + weeklyCredits;
    const crystalsGranted = dailyCrystals + weeklyCrystals;
    StorageManager.save(p);
    this.emitChanged();
    if (levelUp) EventBus.emit('player:leveled-up', levelUp);

    const rewardParts: string[] = [];
    if (creditsGranted > 0) rewardParts.push(`+${creditsGranted.toLocaleString()} Credits`);
    if (crystalsGranted > 0) rewardParts.push(`+${crystalsGranted.toLocaleString()} Gems`);
    if (expAdded > 0) rewardParts.push(`+${expAdded.toLocaleString()} EXP`);

    return {
      ok: true,
      message: `Claimed ${claimedCount} directive${claimedCount > 1 ? 's' : ''}${
        rewardParts.length > 0 ? `: ${rewardParts.join(', ')}` : ''
      }.`,
      claimedCount,
      creditsGranted,
      crystalsGranted,
      expGranted: expAdded,
    };
  }

  claimAllAchievements(): ClaimAllResult {
    const p = StorageManager.load();
    const claimedSet = new Set(p.claimedAchievements);
    const newlyClaimedIds: string[] = [];
    let creditsGranted = 0;
    let crystalsGranted = 0;

    for (const def of ACHIEVEMENTS) {
      if (claimedSet.has(def.id)) continue;
      const val = this.getAchievementMetricValue(p, def.metric);
      if (val >= def.target) {
        claimedSet.add(def.id);
        newlyClaimedIds.push(def.id);
        creditsGranted += def.rewardCredits;
        crystalsGranted += def.rewardCrystals;
      }
    }

    const claimedCount = newlyClaimedIds.length;
    if (claimedCount === 0) {
      return {
        ok: false,
        message: 'No medals ready to claim.',
        claimedCount: 0,
        creditsGranted: 0,
        crystalsGranted: 0,
        expGranted: 0,
      };
    }

    p.claimedAchievements = [...p.claimedAchievements, ...newlyClaimedIds];
    this.addRewardHistory(
      p,
      `Medals Batch (${claimedCount})`,
      creditsGranted,
      crystalsGranted
    );
    const { expAdded, levelUp } = this.applyExpAndRewards(
      p,
      claimedCount * PLAYER_EXP_SOURCES.achievementClaim
    );
    StorageManager.save(p);
    this.emitChanged();
    if (levelUp) EventBus.emit('player:leveled-up', levelUp);

    const rewardParts: string[] = [];
    if (creditsGranted > 0) rewardParts.push(`+${creditsGranted.toLocaleString()} Credits`);
    if (crystalsGranted > 0) rewardParts.push(`+${crystalsGranted.toLocaleString()} Gems`);
    if (expAdded > 0) rewardParts.push(`+${expAdded.toLocaleString()} EXP`);

    return {
      ok: true,
      message: `Claimed ${claimedCount} medal${claimedCount > 1 ? 's' : ''}${
        rewardParts.length > 0 ? `: ${rewardParts.join(', ')}` : ''
      }.`,
      claimedCount,
      creditsGranted,
      crystalsGranted,
      expGranted: expAdded,
    };
  }

  exchangeCurrency(direction: ExchangeDirection, gemUnits: number): ActionResult {
    const p = StorageManager.load();
    const preview = previewCurrencyExchange(direction, gemUnits, p.credits, p.crystals);
    if (!preview.valid) {
      return {
        ok: false,
        message: preview.reason ?? 'Unable to complete currency exchange.',
      };
    }

    p.credits = preview.creditsAfter;
    p.crystals = preview.crystalsAfter;
    StorageManager.save(p);
    this.emitChanged();

    if (direction === 'credits_to_gems') {
      return {
        ok: true,
        message: `Exchanged ${Math.abs(preview.creditDelta).toLocaleString()} Credits for +${preview.gemUnits.toLocaleString()} ${
          preview.gemUnits === 1 ? 'Gem' : 'Gems'
        }.`,
      };
    }

    return {
      ok: true,
      message: `Exchanged ${preview.gemUnits.toLocaleString()} ${
        preview.gemUnits === 1 ? 'Gem' : 'Gems'
      } for +${preview.creditDelta.toLocaleString()} Credits.`,
    };
  }

  changePlayerName(rawName: string): ActionResult {
    const p = StorageManager.load();
    const validation = validatePlayerName(rawName, p.playerName);
    if (!validation.valid) {
      return {
        ok: false,
        message: validation.error ?? 'Invalid Commander name.',
      };
    }

    if (p.crystals < PLAYER_NAME_CHANGE_COST_GEMS) {
      return {
        ok: false,
        message: `Insufficient Void Gems. Need ${PLAYER_NAME_CHANGE_COST_GEMS} Gems to change name.`,
      };
    }

    const err = this.trySpend(p, 0, PLAYER_NAME_CHANGE_COST_GEMS);
    if (err) return err;

    p.playerName = validation.cleaned;
    StorageManager.save(p);
    this.emitChanged();
    return {
      ok: true,
      message: `Commander name changed to "${validation.cleaned}" (-${PLAYER_NAME_CHANGE_COST_GEMS} Gems).`,
    };
  }

  setProfileCosmetics(avatarId: ProfileAvatarId, borderId: ProfileBorderId): ActionResult {
    if (!isValidAvatarId(avatarId) || !isValidBorderId(borderId)) {
      return { ok: false, message: 'Invalid profile customization selection.' };
    }
    const p = StorageManager.load();
    const avatarChanged = p.avatarId !== avatarId;
    const borderChanged = p.borderId !== borderId;
    if (!avatarChanged && !borderChanged) {
      return { ok: true, message: 'Profile appearance unchanged.' };
    }
    p.avatarId = avatarId;
    p.borderId = borderId;
    StorageManager.save(p);
    this.emitChanged();
    return {
      ok: true,
      message: `Profile updated (${PROFILE_AVATAR_MAP[avatarId].name} · ${PROFILE_BORDER_MAP[borderId].name}).`,
    };
  }

  setProfileAvatar(avatarId: ProfileAvatarId): ActionResult {
    if (!isValidAvatarId(avatarId)) {
      return { ok: false, message: 'Invalid avatar selection.' };
    }
    const p = StorageManager.load();
    if (p.avatarId === avatarId) {
      return { ok: true, message: `${PROFILE_AVATAR_MAP[avatarId].name} is already equipped.` };
    }
    p.avatarId = avatarId;
    StorageManager.save(p);
    this.emitChanged();
    return { ok: true, message: `Profile avatar set to ${PROFILE_AVATAR_MAP[avatarId].name}.` };
  }

  setProfileBorder(borderId: ProfileBorderId): ActionResult {
    if (!isValidBorderId(borderId)) {
      return { ok: false, message: 'Invalid profile border selection.' };
    }
    const p = StorageManager.load();
    if (p.borderId === borderId) {
      return { ok: true, message: `${PROFILE_BORDER_MAP[borderId].name} is already equipped.` };
    }
    p.borderId = borderId;
    StorageManager.save(p);
    this.emitChanged();
    return { ok: true, message: `Profile border set to ${PROFILE_BORDER_MAP[borderId].name}.` };
  }

  // ---- REAL GAMEPLAY EVENT RECORDING ----

  recordEnemyEncounter(enemyClass: EnemyClass): void {
    const p = StorageManager.load();
    if (!p.codex.discoveredEnemies.includes(enemyClass)) {
      p.codex.discoveredEnemies = [...p.codex.discoveredEnemies, enemyClass];
      StorageManager.save(p);
    }
  }

  recordBossEncounter(bossId: BossId): void {
    const p = StorageManager.load();
    if (!p.codex.encounteredBosses.includes(bossId)) {
      p.codex.encounteredBosses = [...p.codex.encounteredBosses, bossId];
      StorageManager.save(p);
    }
  }

  recordCombatProgress(events: {
    kills?: number;
    eliteKills?: number;
    bossDefeatedId?: BossId;
    powerUps?: number;
    crits?: number;
    survivalSec?: number;
    survivalWaves?: number;
    weaponId?: WeaponId;
    runScore?: number;
    completedLevel?: number;
    shipUsed?: ShipId;
  }): number {
    const p = StorageManager.load();
    if (events.kills) p.totalKills += events.kills;
    if (events.crits) p.stats.totalCrits += events.crits;
    if (events.powerUps) p.stats.totalPowerUps += events.powerUps;
    if (events.bossDefeatedId) {
      p.stats.totalBossKills += 1;
      if (!p.codex.defeatedBosses.includes(events.bossDefeatedId)) {
        p.codex.defeatedBosses = [...p.codex.defeatedBosses, events.bossDefeatedId];
      }
    }
    if (events.runScore && events.runScore > p.highScore) {
      p.highScore = events.runScore;
    }

    const dailyTemplates = selectDailyMissions(p.dailyMissions.resetKey);
    const weeklyTemplates = selectWeeklyChallenges(p.weeklyChallenges.resetKey);

    const applyToBucket = (templates: typeof dailyTemplates, bucket: typeof p.dailyMissions) => {
      templates.forEach((tpl) => {
        const cur = bucket.progress[tpl.id] ?? 0;
        let next = cur;
        switch (tpl.metric) {
          case 'kills':
            next += events.kills ?? 0;
            break;
          case 'elite_kills':
            next += events.eliteKills ?? 0;
            break;
          case 'boss_kills':
            next += events.bossDefeatedId ? 1 : 0;
            break;
          case 'powerups_collected':
            next += events.powerUps ?? 0;
            break;
          case 'levels_completed':
            next += events.completedLevel ? 1 : 0;
            break;
          case 'survival_waves':
            next += events.survivalWaves ?? 0;
            break;
          case 'survival_seconds':
            next += events.survivalSec ?? 0;
            break;
          case 'weapon_kills':
            if (tpl.weaponFilter && events.weaponId === tpl.weaponFilter) {
              next += events.kills ?? 0;
            }
            break;
          case 'ship_clears':
            if (events.completedLevel && tpl.shipFilter && events.shipUsed === tpl.shipFilter) {
              next += 1;
            }
            break;
          case 'high_score_run':
            if (events.runScore && events.runScore > cur) {
              next = events.runScore;
            }
            break;
        }
        bucket.progress[tpl.id] = Math.min(tpl.target, next);
      });
    };

    applyToBucket(dailyTemplates, p.dailyMissions);
    applyToBucket(weeklyTemplates, p.weeklyChallenges);

    const combatExp =
      (events.kills ?? 0) * PLAYER_EXP_SOURCES.enemyKillBase +
      (events.eliteKills ?? 0) * PLAYER_EXP_SOURCES.eliteKillBonus +
      (events.bossDefeatedId ? PLAYER_EXP_SOURCES.bossKillBonus : 0) +
      (events.crits ?? 0) * PLAYER_EXP_SOURCES.critHitBonus +
      (events.survivalSec ?? 0) * PLAYER_EXP_SOURCES.survivalSecondBonus +
      (events.completedLevel
        ? PLAYER_EXP_SOURCES.campaignSectorClearBase +
          events.completedLevel * PLAYER_EXP_SOURCES.campaignSectorPerLevel
        : 0);

    const { expAdded, levelUp } = this.applyExpAndRewards(p, combatExp);
    StorageManager.save(p);
    if (levelUp) {
      this.emitChanged();
      EventBus.emit('player:leveled-up', levelUp);
    }
    return expAdded;
  }

  recordRunReward(params: {
    mode: GameMode;
    creditsEarned: number;
    crystalsEarned: number;
    score: number;
    kills: number;
    levelNumber?: number;
    campaignDifficulty?: CampaignDifficulty;
    endlessWave?: number;
    challengeId?: string;
    challengeDifficulty?: ChallengeDifficulty;
    challengeCompleted?: boolean;
    bossRushCleared?: boolean;
    bossRushElapsedSec?: number;
    bossRushPerformance?: BossRushPerformanceSummary | null;
    shipUsed: ShipId;
  }): {
    creditsGranted: number;
    crystalsGranted: number;
    expGranted: number;
    unlockedNextDifficulty: CampaignDifficulty | null;
    isFirstClear: boolean;
  } {
    const p = StorageManager.load();
    p.stats.totalRuns += 1;
    if (params.score > p.highScore) p.highScore = params.score;

    let totalCredits = Math.max(0, Math.floor(params.creditsEarned));
    let totalCrystals = Math.max(0, Math.floor(params.crystalsEarned));
    let runExp: number = PLAYER_EXP_SOURCES.runCompletionBase;
    let unlockedNextDifficulty: CampaignDifficulty | null = null;
    let isFirstClear = false;

    if (params.mode === 'campaign' && params.levelNumber) {
      const lvl = Math.max(1, Math.min(10, Math.floor(params.levelNumber)));
      const diff: CampaignDifficulty = params.campaignDifficulty ?? p.selectedCampaignDifficulty ?? 'easy';
      const bucket = p.campaignProgress[diff];
      const levelDef = CAMPAIGN_LEVELS[lvl - 1];
      const hasBoss = Boolean(levelDef?.bossId);

      isFirstClear = !bucket.completedLevels.includes(lvl);
      const campaignBonus = getCampaignClearReward(lvl, hasBoss, isFirstClear, 1, diff);
      if (isFirstClear) {
        bucket.completedLevels = [...bucket.completedLevels, lvl].sort((a, b) => a - b);
        totalCredits += campaignBonus.firstClearCredits;
        totalCrystals += campaignBonus.firstClearCrystals;
      }
      bucket.highestUnlockedLevel = Math.min(10, Math.max(bucket.highestUnlockedLevel || 1, lvl + 1));
      bucket.levelScores[lvl] = Math.max(bucket.levelScores[lvl] ?? 0, params.score);

      if (lvl === 10) {
        const nextDiff = getNextCampaignDifficulty(diff);
        if (nextDiff && p.campaignProgress[nextDiff].highestUnlockedLevel <= 0) {
          p.campaignProgress[nextDiff].highestUnlockedLevel = 1;
          unlockedNextDifficulty = nextDiff;
        }
      }

      const diffMult = CAMPAIGN_DIFFICULTIES[diff]?.rewardMult ?? 1;
      runExp = Math.round(runExp * diffMult);
      syncAggregateCampaignFields(p);
    } else if (params.mode === 'endless') {
      p.stats.bestEndlessScore = Math.max(p.stats.bestEndlessScore, params.score);
      if (params.endlessWave) {
        p.stats.bestEndlessWave = Math.max(p.stats.bestEndlessWave, params.endlessWave);
        runExp += params.endlessWave * PLAYER_EXP_SOURCES.endlessPerWaveClear;
      }
    } else if (params.mode === 'boss_rush') {
      p.stats.bestBossRushScore = Math.max(p.stats.bestBossRushScore, params.score);
      if (params.bossRushCleared) {
        p.stats.bossRushClears += 1;
        totalCredits += BOSS_RUSH_CLEAR_REWARD.credits;
        totalCrystals += BOSS_RUSH_CLEAR_REWARD.crystals;
        if (params.bossRushPerformance) {
          totalCredits += params.bossRushPerformance.bonusCredits;
          totalCrystals += params.bossRushPerformance.bonusCrystals;
        }
        if (
          typeof params.bossRushElapsedSec === 'number' &&
          Number.isFinite(params.bossRushElapsedSec) &&
          params.bossRushElapsedSec > 0
        ) {
          const cleanSec = Math.round(params.bossRushElapsedSec);
          p.stats.bestBossRushTimeSec =
            p.stats.bestBossRushTimeSec === null
              ? cleanSec
              : Math.min(p.stats.bestBossRushTimeSec, cleanSec);
        }
        runExp += PLAYER_EXP_SOURCES.bossRushClearBonus;
      }
    } else if (params.mode === 'challenge' && params.challengeCompleted && params.challengeId) {
      const resolved = resolveChallengeTier(params.challengeId, params.challengeDifficulty);
      if (resolved) {
        const { challenge, tier } = resolved;
        const completedTiers = p.stats.completedChallengeTiers[challenge.id] ?? [];
        const tierAlreadyCompleted = completedTiers.includes(tier.difficulty);
        isFirstClear = !tierAlreadyCompleted;

        const payout = getChallengePayout(
          tier.rewardCredits,
          tier.rewardCrystals,
          tierAlreadyCompleted
        );
        totalCredits += payout.credits;
        totalCrystals += payout.crystals;

        if (!tierAlreadyCompleted) {
          p.stats.completedChallengeTiers = {
            ...p.stats.completedChallengeTiers,
            [challenge.id]: [...completedTiers, tier.difficulty],
          };
        }
        if (!p.stats.completedChallenges.includes(challenge.id)) {
          p.stats.completedChallenges = [...p.stats.completedChallenges, challenge.id];
        }
        const tierExpMult =
          tier.difficulty === 'Extreme' ? 1.5 : tier.difficulty === 'Hard' ? 1.25 : 1.0;
        runExp += Math.round(PLAYER_EXP_SOURCES.challengeClearBonus * tierExpMult);
      }
    }

    const modeLabel =
      params.mode === 'campaign'
        ? `Sector ${String(params.levelNumber ?? 1).padStart(2, '0')} (${
            CAMPAIGN_DIFFICULTIES[params.campaignDifficulty ?? p.selectedCampaignDifficulty ?? 'easy']
              .shortLabel
          })`
        : params.mode === 'endless'
        ? `Endless Wave ${params.endlessWave ?? 1}`
        : params.mode === 'boss_rush'
        ? 'Boss Rush'
        : `Challenge (${params.challengeDifficulty ?? 'Standard'})`;

    this.addRewardHistory(p, modeLabel, totalCredits, totalCrystals);
    const { expAdded, levelUp } = this.applyExpAndRewards(p, runExp);
    StorageManager.save(p);
    this.emitChanged();
    if (levelUp) {
      EventBus.emit('player:leveled-up', levelUp);
    }
    return {
      creditsGranted: totalCredits,
      crystalsGranted: totalCrystals,
      expGranted: expAdded,
      unlockedNextDifficulty,
      isFirstClear,
    };
  }
}

export const ProgressionManager = new ProgressionManagerImpl();
