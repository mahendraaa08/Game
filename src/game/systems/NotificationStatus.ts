import { ACHIEVEMENTS } from '../config/AchievementConfig';
import {
  DRONE_LIST,
  DRONE_SLOT_IDS,
  DroneDefinition,
  DroneId,
  DroneSlotId,
  getDroneUpgradeCost,
  isDroneCompatibleWithSlot,
} from '../config/DroneConfig';
import {
  EQUIPMENT_LIST,
  EquipmentDefinition,
  EquipmentSlot,
  getEquipmentUpgradeCost,
} from '../config/EquipmentConfig';
import { selectDailyMissions, selectWeeklyChallenges } from '../config/MissionConfig';
import { SHIP_LIST, ShipId } from '../config/ShipConfig';
import {
  UPGRADE_LIST,
  UpgradeId,
  getUpgradeCost,
  getWeaponUpgradeCost,
} from '../config/UpgradeConfig';
import { WEAPON_LIST, WeaponId } from '../config/WeaponConfig';
import { PlayerProgress } from '../utils/StorageManager';
import { ProgressionManager } from './ProgressionManager';

export interface GlobalNotificationState {
  // Top-level main menu targets
  hangarMenu: boolean;
  missionsMenu: boolean;

  // Hangar sub-navigation tabs
  shipsTab: boolean;
  weaponsTab: boolean;
  armoryTab: boolean;

  // Ships section
  shipIds: Record<ShipId, boolean>;

  // Weapons section
  primaryWeaponsSubTab: boolean;
  fleetSystemsSubTab: boolean;
  weaponIds: Record<WeaponId, boolean>;
  upgradeIds: Record<UpgradeId, boolean>;

  // Armory section — Equipment Gear (strictly separated from Drones)
  gearSubTab: boolean;
  gearSlots: Record<EquipmentSlot, boolean>;
  gearItemIds: Record<string, boolean>;

  // Armory section — Companion Drones (per-slot compatibility & dual-slot uniqueness aware)
  dronesSubTab: boolean;
  droneSlots: Record<DroneSlotId, boolean>;
  droneItemIdsBySlot: Record<DroneSlotId, Record<DroneId, boolean>>;

  // Missions & Medals section
  directivesSubTab: boolean;
  achievementsSubTab: boolean;
  dailySection: boolean;
  weeklySection: boolean;
  dailyMissionIds: Record<string, boolean>;
  weeklyChallengeIds: Record<string, boolean>;
  achievementIds: Record<string, boolean>;
}

function canAfford(progress: PlayerProgress, credits: number, crystals: number): boolean {
  return progress.credits >= credits && progress.crystals >= crystals;
}

export function isEquipmentItemActionableInSlot(
  progress: PlayerProgress,
  item: EquipmentDefinition
): boolean {
  const lvl = progress.ownedEquipment[item.id] ?? 0;
  const owned = lvl > 0;
  const slotEmpty = !progress.equippedGear[item.slot];

  if (!owned) {
    return canAfford(progress, item.costCredits, item.costCrystals);
  }

  // Owned item in an empty slot can be equipped immediately
  if (slotEmpty) {
    return true;
  }

  // Owned item when slot already occupied is actionable only if it can be upgraded and afforded
  if (lvl < item.maxLevel) {
    const upgCost = getEquipmentUpgradeCost(item, lvl);
    return canAfford(progress, upgCost.credits, upgCost.crystals);
  }

  return false;
}

export function isDroneActionableInSlot(
  progress: PlayerProgress,
  drone: DroneDefinition,
  slotId: DroneSlotId
): boolean {
  if (!isDroneCompatibleWithSlot(drone, slotId)) return false;

  const otherSlotId: DroneSlotId = slotId === 'slot1' ? 'slot2' : 'slot1';
  const equippedInOther = progress.equippedDroneSlots[otherSlotId] === drone.id;
  if (equippedInOther) {
    // A drone actively deployed in the other slot cannot be equipped here and belongs to the other slot's upgrade state
    return false;
  }

  const lvl = progress.ownedDrones[drone.id] ?? 0;
  const owned = lvl > 0;
  const slotEmpty = !progress.equippedDroneSlots[slotId];

  if (!owned) {
    return canAfford(progress, drone.costCredits, drone.costCrystals);
  }

  // Owned unequipped drone compatible with an empty slot can be equipped immediately
  if (slotEmpty) {
    return true;
  }

  if (lvl < drone.maxLevel) {
    const upgCost = getDroneUpgradeCost(drone, lvl);
    return canAfford(progress, upgCost.credits, upgCost.crystals);
  }

  return false;
}

export function evaluateGlobalNotifications(progress: PlayerProgress): GlobalNotificationState {
  // 1. Ships (unlockable + affordable)
  const shipIds = {} as Record<ShipId, boolean>;
  let shipsTab = false;
  for (const ship of SHIP_LIST) {
    const unlocked = progress.unlockedShips.includes(ship.id);
    let actionable = false;
    if (!unlocked) {
      const sectorMet =
        !ship.unlock.minSectorCompleted ||
        progress.completedLevels.includes(ship.unlock.minSectorCompleted);
      actionable = sectorMet && canAfford(progress, ship.unlock.credits, ship.unlock.crystals);
    }
    shipIds[ship.id] = actionable;
    if (actionable) shipsTab = true;
  }

  // 2. Primary Weapons (unlockable+affordable OR upgradable+affordable)
  const weaponIds = {} as Record<WeaponId, boolean>;
  let primaryWeaponsSubTab = false;
  for (const weapon of WEAPON_LIST) {
    const unlocked = progress.unlockedWeapons.includes(weapon.id);
    let actionable = false;
    if (!unlocked) {
      actionable =
        progress.highestUnlockedLevel >= weapon.unlockLevel &&
        canAfford(progress, weapon.unlockCredits, weapon.unlockCrystals);
    } else {
      const lvl = progress.weaponLevels[weapon.id] ?? 1;
      if (lvl < weapon.maxWeaponLevel) {
        const upg = getWeaponUpgradeCost(lvl, weapon.id);
        actionable = canAfford(progress, upg.credits, upg.crystals);
      }
    }
    weaponIds[weapon.id] = actionable;
    if (actionable) primaryWeaponsSubTab = true;
  }

  // 3. Fleet Systems (upgradable + affordable)
  const upgradeIds = {} as Record<UpgradeId, boolean>;
  let fleetSystemsSubTab = false;
  for (const upgrade of UPGRADE_LIST) {
    const cur = progress.upgrades[upgrade.id] ?? 0;
    let actionable = false;
    if (cur < upgrade.maxLevel) {
      const cost = getUpgradeCost(upgrade, cur);
      actionable = canAfford(progress, cost.credits, cost.crystals);
    }
    upgradeIds[upgrade.id] = actionable;
    if (actionable) fleetSystemsSubTab = true;
  }

  const weaponsTab = primaryWeaponsSubTab || fleetSystemsSubTab;

  // 4. Armory — Equipment Gear (slot-by-slot invariant matches modal items 1:1)
  const gearSlots: Record<EquipmentSlot, boolean> = {
    offensive: false,
    defensive: false,
    utility: false,
    special: false,
  };
  const gearItemIds: Record<string, boolean> = {};
  for (const item of EQUIPMENT_LIST) {
    const actionable = isEquipmentItemActionableInSlot(progress, item);
    gearItemIds[item.id] = actionable;
    if (actionable) {
      gearSlots[item.slot] = true;
    }
  }
  const gearSubTab = Object.values(gearSlots).some(Boolean);

  // 5. Armory — Companion Drones (per-slot invariant matches drone slot modal 1:1)
  const droneSlots: Record<DroneSlotId, boolean> = {
    slot1: false,
    slot2: false,
  };
  const droneItemIdsBySlot = {
    slot1: {} as Record<DroneId, boolean>,
    slot2: {} as Record<DroneId, boolean>,
  };
  for (const slotId of DRONE_SLOT_IDS) {
    for (const drone of DRONE_LIST) {
      const actionable = isDroneActionableInSlot(progress, drone, slotId);
      droneItemIdsBySlot[slotId][drone.id] = actionable;
      if (actionable) {
        droneSlots[slotId] = true;
      }
    }
  }
  const dronesSubTab = droneSlots.slot1 || droneSlots.slot2;
  const armoryTab = gearSubTab || dronesSubTab;

  const hangarMenu = shipsTab || weaponsTab || armoryTab;

  // 6. Missions & Medals (only completed & unclaimed ready rewards)
  const dailyList = selectDailyMissions(progress.dailyMissions.resetKey);
  const dailyMissionIds: Record<string, boolean> = {};
  let dailySection = false;
  for (const m of dailyList) {
    const cur = progress.dailyMissions.progress[m.id] ?? 0;
    const ready = cur >= m.target && !progress.dailyMissions.claimedIds.includes(m.id);
    dailyMissionIds[m.id] = ready;
    if (ready) dailySection = true;
  }

  const weeklyList = selectWeeklyChallenges(progress.weeklyChallenges.resetKey);
  const weeklyChallengeIds: Record<string, boolean> = {};
  let weeklySection = false;
  for (const m of weeklyList) {
    const cur = progress.weeklyChallenges.progress[m.id] ?? 0;
    const ready = cur >= m.target && !progress.weeklyChallenges.claimedIds.includes(m.id);
    weeklyChallengeIds[m.id] = ready;
    if (ready) weeklySection = true;
  }

  const directivesSubTab = dailySection || weeklySection;

  const achievementIds: Record<string, boolean> = {};
  let achievementsSubTab = false;
  for (const ach of ACHIEVEMENTS) {
    const cur = ProgressionManager.getAchievementMetricValue(progress, ach.metric);
    const ready = cur >= ach.target && !progress.claimedAchievements.includes(ach.id);
    achievementIds[ach.id] = ready;
    if (ready) achievementsSubTab = true;
  }

  const missionsMenu = directivesSubTab || achievementsSubTab;

  return {
    hangarMenu,
    missionsMenu,
    shipsTab,
    weaponsTab,
    armoryTab,
    shipIds,
    primaryWeaponsSubTab,
    fleetSystemsSubTab,
    weaponIds,
    upgradeIds,
    gearSubTab,
    gearSlots,
    gearItemIds,
    dronesSubTab,
    droneSlots,
    droneItemIdsBySlot,
    directivesSubTab,
    achievementsSubTab,
    dailySection,
    weeklySection,
    dailyMissionIds,
    weeklyChallengeIds,
    achievementIds,
  };
}
