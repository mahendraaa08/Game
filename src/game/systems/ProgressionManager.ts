import { ACHIEVEMENTS } from '../config/AchievementConfig';
import { BossId } from '../config/BossConfig';
import { DroneId, DRONES, getDroneUpgradeCost } from '../config/DroneConfig';
import { EnemyClass } from '../config/EnemyConfig';
import {
  EQUIPMENT_BY_ID,
  EquipmentSlot,
  getEquipmentUpgradeCost,
  scaleEquipmentBonuses,
} from '../config/EquipmentConfig';
import { ChallengeRule, GameMode } from '../config/GameModeConfig';
import {
  selectDailyMissions,
  selectWeeklyChallenges,
} from '../config/MissionConfig';
import { ShipId, SHIPS } from '../config/ShipConfig';
import { getUpgradeCost, getWeaponUpgradeCost, UpgradeId, UPGRADES } from '../config/UpgradeConfig';
import { WeaponId, WEAPONS } from '../config/WeaponConfig';
import { EventBus } from '../utils/EventBus';
import { PlayerProgress, StorageManager } from '../utils/StorageManager';

export interface ActionResult {
  ok: boolean;
  message: string;
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
  missilePowerMult: number;
  specialPowerMult: number;
  specialCooldownMult: number;
  dashCooldownMult: number;
  damageReduction: number;
  evasionChance: number;
  shieldRegenMult: number;
  pickupRadiusBonus: number;
  creditBonusMult: number;
  shieldOnKill: number;
  extraChainTargets: number;
  hasAstralWingBolts: boolean;
  rotaryFireBonus: number;
}

export function computePlayerStats(
  progress: PlayerProgress,
  challengeRule?: ChallengeRule
): ComputedPlayerStats {
  const ship = SHIPS[progress.selectedShip] ?? SHIPS.falcon_x;
  const u = progress.upgrades;

  let maxHp = ship.stats.maxHp + u.max_health * UPGRADES.max_health.perLevelBonus;
  let maxShield = ship.stats.maxShield + u.shield_capacity * UPGRADES.shield_capacity.perLevelBonus;
  let moveSpeed = ship.stats.moveSpeed + u.movement_speed * UPGRADES.movement_speed.perLevelBonus;
  let damageMult = ship.stats.damageMult * (1 + u.weapon_damage * UPGRADES.weapon_damage.perLevelBonus);
  let fireRateMult = ship.stats.fireRateMult * (1 + u.fire_rate * UPGRADES.fire_rate.perLevelBonus);
  let critChance = ship.stats.critChance + u.critical_chance * UPGRADES.critical_chance.perLevelBonus;
  let critDamageMult = ship.id === 'specter' ? 2.35 : ship.id === 'celestial' ? 1.95 : 1.75;
  const missilePowerMult = 1 + u.missile_power * UPGRADES.missile_power.perLevelBonus;
  let specialPowerMult = ship.stats.specialPowerMult * (1 + u.special_power * UPGRADES.special_power.perLevelBonus);
  let specialCooldownMult = Math.max(0.65, 1 - u.special_power * 0.025);
  let dashCooldownMult = ship.id === 'phantom' ? 0.75 : 1.0;
  let damageReduction = ship.id === 'aegis' ? 0.16 : 0;
  const evasionChance = ship.id === 'phantom' ? 0.15 : 0;
  let shieldRegenMult = ship.id === 'aegis' ? 1.45 : ship.id === 'falcon_x' ? 1.12 : 1.0;
  let pickupRadiusBonus = 0;
  let creditBonusMult = 1.0;

  if (ship.id === 'nova_prime') {
    specialCooldownMult *= 0.82;
  }

  // Apply 4 Equipped Gear Items
  (['offensive', 'defensive', 'utility', 'special'] as EquipmentSlot[]).forEach((slot) => {
    const id = progress.equippedGear[slot];
    if (!id) return;
    const def = EQUIPMENT_BY_ID[id];
    const lvl = progress.ownedEquipment[id];
    if (!def || !lvl) return;
    const b = scaleEquipmentBonuses(def, lvl);
    if (b.damagePct) damageMult *= 1 + b.damagePct / 100;
    if (b.fireRatePct) fireRateMult *= 1 + b.fireRatePct / 100;
    if (b.critChancePct) critChance += b.critChancePct / 100;
    if (b.critDamagePct) critDamageMult += b.critDamagePct / 100;
    if (b.maxHpFlat) maxHp += b.maxHpFlat;
    if (b.maxShieldFlat) maxShield += b.maxShieldFlat;
    if (b.damageReductionPct) damageReduction += b.damageReductionPct / 100;
    if (b.moveSpeedFlat) moveSpeed += b.moveSpeedFlat;
    if (b.pickupRangePct) pickupRadiusBonus += Math.round(140 * (b.pickupRangePct / 100));
    if (b.creditBonusPct) creditBonusMult += b.creditBonusPct / 100;
    if (b.specialPowerPct) specialPowerMult *= 1 + b.specialPowerPct / 100;
    if (b.specialCooldownPct) specialCooldownMult *= Math.max(0.6, 1 - b.specialCooldownPct / 100);
    if (b.dashCooldownPct) dashCooldownMult *= Math.max(0.55, 1 - b.dashCooldownPct / 100);
  });

  // Apply Drone passive stat boosts (Shield & Collector drones)
  if (!challengeRule?.disableDrones) {
    progress.equippedDrones.forEach((dId) => {
      const lvl = progress.ownedDrones[dId] ?? 0;
      if (lvl <= 0) return;
      if (dId === 'shield') {
        maxShield += 18 + (lvl - 1) * 8;
        shieldRegenMult += 0.2 + (lvl - 1) * 0.08;
      } else if (dId === 'collector') {
        pickupRadiusBonus += 110 + (lvl - 1) * 24;
        creditBonusMult += 0.18 + (lvl - 1) * 0.05;
      }
    });
  }

  // Apply Challenge Rule overrides cleanly
  if (challengeRule?.maxHpOverride) {
    maxHp = challengeRule.maxHpOverride;
  }
  if (challengeRule?.disableShield) {
    maxShield = 0;
  }

  return {
    shipId: ship.id,
    maxHp: Math.max(10, Math.round(maxHp)),
    maxShield: Math.max(0, Math.round(maxShield)),
    moveSpeed: Math.round(moveSpeed),
    damageMult,
    fireRateMult,
    critChance: Math.min(0.75, Math.max(0, critChance)),
    critDamageMult,
    missilePowerMult,
    specialPowerMult,
    specialCooldownMult: Math.max(0.5, specialCooldownMult),
    dashCooldownMult: Math.max(0.5, dashCooldownMult),
    damageReduction: Math.min(0.45, Math.max(0, damageReduction)),
    evasionChance,
    shieldRegenMult,
    pickupRadiusBonus,
    creditBonusMult,
    shieldOnKill: ship.id === 'aegis' ? 4 : 0,
    extraChainTargets: ship.id === 'thunderbolt' ? 1 : 0,
    hasAstralWingBolts: ship.id === 'celestial',
    rotaryFireBonus: ship.id === 'thunderbolt' ? 0.22 : 0,
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
    const cost = getWeaponUpgradeCost(cur);
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

  buyOrUpgradeDrone(droneId: DroneId): ActionResult {
    const def = DRONES[droneId];
    const p = StorageManager.load();
    const cur = p.ownedDrones[droneId] ?? 0;

    if (cur === 0) {
      const err = this.trySpend(p, def.costCredits, def.costCrystals);
      if (err) return err;
      p.ownedDrones[droneId] = 1;
      if (p.equippedDrones.length < 2 && !p.equippedDrones.includes(droneId)) {
        p.equippedDrones = [...p.equippedDrones, droneId];
      }
      StorageManager.save(p);
      this.emitChanged();
      return { ok: true, message: `${def.name} deployed!` };
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

  equipDrone(droneId: DroneId, targetSlotIndex?: 0 | 1): ActionResult {
    const def = DRONES[droneId];
    if (!def) return { ok: false, message: 'Invalid drone module.' };
    const p = StorageManager.load();
    if (!p.ownedDrones[droneId] || p.ownedDrones[droneId]! <= 0) {
      return { ok: false, message: `Unlock ${def.name} first.` };
    }

    const existingIdx = p.equippedDrones.indexOf(droneId);
    if (existingIdx !== -1) {
      if (targetSlotIndex !== undefined && existingIdx !== targetSlotIndex && p.equippedDrones.length === 2) {
        const swapped = [...p.equippedDrones];
        const other = swapped[targetSlotIndex];
        swapped[targetSlotIndex] = droneId;
        swapped[existingIdx] = other;
        p.equippedDrones = swapped.slice(0, 2);
        StorageManager.save(p);
        this.emitChanged();
        return {
          ok: true,
          message: `${def.name} moved to Equipment Slot 0${targetSlotIndex + 1}.`,
        };
      }
      return { ok: true, message: `${def.name} is already equipped.` };
    }

    if (p.equippedDrones.length < 2) {
      p.equippedDrones = [...p.equippedDrones, droneId];
    } else {
      const replaceIdx = targetSlotIndex === 1 ? 1 : 0;
      const next = [...p.equippedDrones];
      next[replaceIdx] = droneId;
      p.equippedDrones = next.slice(0, 2);
    }

    StorageManager.save(p);
    this.emitChanged();
    const assignedSlot = p.equippedDrones.indexOf(droneId) + 1;
    return {
      ok: true,
      message: `${def.name} equipped to Slot 0${assignedSlot} (${p.equippedDrones.length}/2).`,
    };
  }

  unequipDrone(droneId: DroneId): ActionResult {
    const def = DRONES[droneId];
    if (!def) return { ok: false, message: 'Invalid drone module.' };
    const p = StorageManager.load();
    if (!p.equippedDrones.includes(droneId)) {
      return { ok: false, message: `${def.name} is not currently equipped.` };
    }
    p.equippedDrones = p.equippedDrones.filter((id) => id !== droneId);
    StorageManager.save(p);
    this.emitChanged();
    return { ok: true, message: `${def.name} unequipped to reserve bay.` };
  }

  toggleEquipDrone(droneId: DroneId): ActionResult {
    const p = StorageManager.load();
    if (p.equippedDrones.includes(droneId)) {
      return this.unequipDrone(droneId);
    }
    return this.equipDrone(droneId);
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
    StorageManager.save(p);
    this.emitChanged();
    return { ok: true, message: `Claimed +${tpl.rewardCredits} Credits, +${tpl.rewardCrystals} Crystals!` };
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
    StorageManager.save(p);
    this.emitChanged();
    return { ok: true, message: `Claimed +${tpl.rewardCredits} Credits, +${tpl.rewardCrystals} Crystals!` };
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
    StorageManager.save(p);
    this.emitChanged();
    return { ok: true, message: `Achievement claimed: +${def.rewardCredits} Credits, +${def.rewardCrystals} Crystals!` };
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
  }): void {
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

    StorageManager.save(p);
  }

  recordRunReward(params: {
    mode: GameMode;
    creditsEarned: number;
    crystalsEarned: number;
    score: number;
    kills: number;
    levelNumber?: number;
    endlessWave?: number;
    challengeId?: string;
    challengeCompleted?: boolean;
    bossRushCleared?: boolean;
    shipUsed: ShipId;
  }): { creditsGranted: number; crystalsGranted: number } {
    const p = StorageManager.load();
    p.stats.totalRuns += 1;
    if (params.score > p.highScore) p.highScore = params.score;

    let totalCredits = Math.max(0, Math.floor(params.creditsEarned));
    let totalCrystals = Math.max(0, Math.floor(params.crystalsEarned));

    if (params.mode === 'campaign' && params.levelNumber) {
      const lvl = params.levelNumber;
      const isFirstClear = !p.completedLevels.includes(lvl);
      if (isFirstClear) {
        p.completedLevels = [...p.completedLevels, lvl];
        totalCredits += 180 + lvl * 75;
        totalCrystals += lvl % 2 === 0 ? 3 : 2;
      }
      p.highestUnlockedLevel = Math.min(10, Math.max(p.highestUnlockedLevel, lvl + 1));
      p.levelScores[lvl] = Math.max(p.levelScores[lvl] ?? 0, params.score);
    } else if (params.mode === 'endless') {
      p.stats.bestEndlessScore = Math.max(p.stats.bestEndlessScore, params.score);
      if (params.endlessWave) {
        p.stats.bestEndlessWave = Math.max(p.stats.bestEndlessWave, params.endlessWave);
      }
    } else if (params.mode === 'boss_rush') {
      p.stats.bestBossRushScore = Math.max(p.stats.bestBossRushScore, params.score);
      if (params.bossRushCleared) {
        p.stats.bossRushClears += 1;
      }
    } else if (params.mode === 'challenge' && params.challengeCompleted && params.challengeId) {
      if (!p.stats.completedChallenges.includes(params.challengeId)) {
        p.stats.completedChallenges = [...p.stats.completedChallenges, params.challengeId];
      }
    }

    const modeLabel =
      params.mode === 'campaign'
        ? `Sector ${String(params.levelNumber ?? 1).padStart(2, '0')} Run`
        : params.mode === 'endless'
        ? `Endless Wave ${params.endlessWave ?? 1}`
        : params.mode === 'boss_rush'
        ? 'Boss Rush'
        : 'Challenge Mission';

    this.addRewardHistory(p, modeLabel, totalCredits, totalCrystals);
    StorageManager.save(p);
    this.emitChanged();
    return { creditsGranted: totalCredits, crystalsGranted: totalCrystals };
  }
}

export const ProgressionManager = new ProgressionManagerImpl();
