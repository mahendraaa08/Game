import { BossId } from '../config/BossConfig';
import { DroneId } from '../config/DroneConfig';
import { EnemyClass } from '../config/EnemyConfig';
import { EquipmentSlot } from '../config/EquipmentConfig';
import { getDailyResetKey, getWeeklyResetKey } from '../config/MissionConfig';
import { ShipId, SHIPS } from '../config/ShipConfig';
import { UpgradeId, UPGRADES } from '../config/UpgradeConfig';
import { SpecialId, SPECIAL_ATTACKS, WeaponId, WEAPONS } from '../config/WeaponConfig';

export type FxQuality = 'high' | 'medium' | 'low';

export interface GameSettings {
  masterVolume: number; // 0..1
  musicVolume: number; // 0..1
  sfxVolume: number; // 0..1
  muted: boolean;
  controlSensitivity: number; // 0.7..1.8
  movementSmoothing: number; // 0..1 (1 = smooth responsive, 0 = instant crisp)
  screenShake: boolean;
  fxQuality: FxQuality;
  performanceQuality: 'high' | 'balanced';
}

export interface RewardHistoryEntry {
  id: string;
  label: string;
  credits: number;
  crystals: number;
  at: number;
}

export interface MissionProgressBucket {
  resetKey: string;
  progress: Record<string, number>;
  claimedIds: string[];
}

export interface PlayerStatsRecord {
  totalBossKills: number;
  totalCrits: number;
  totalUpgradesBought: number;
  totalPowerUps: number;
  totalRuns: number;
  bestEndlessScore: number;
  bestEndlessWave: number;
  bestBossRushScore: number;
  bossRushClears: number;
  completedChallenges: string[];
}

export interface CodexRecords {
  discoveredEnemies: EnemyClass[];
  encounteredBosses: BossId[];
  defeatedBosses: BossId[];
}

export interface PlayerProgress {
  version: number;
  highestUnlockedLevel: number;
  completedLevels: number[];
  highScore: number;
  levelScores: Record<number, number>;
  selectedShip: ShipId;
  unlockedShips: ShipId[];
  selectedWeapon: WeaponId;
  unlockedWeapons: WeaponId[];
  weaponLevels: Record<WeaponId, number>;
  selectedSpecial: SpecialId;
  upgrades: Record<UpgradeId, number>;
  ownedEquipment: Record<string, number>; // equipmentId -> level (1..5)
  equippedGear: Record<EquipmentSlot, string | null>;
  ownedDrones: Partial<Record<DroneId, number>>; // droneId -> level (1..5)
  equippedDrones: DroneId[];
  credits: number;
  crystals: number;
  dailyMissions: MissionProgressBucket;
  weeklyChallenges: MissionProgressBucket;
  claimedAchievements: string[];
  stats: PlayerStatsRecord;
  codex: CodexRecords;
  settings: GameSettings;
  rewardHistory: RewardHistoryEntry[];
  muted: boolean;
  totalKills: number;
}

const STORAGE_KEY = 'galactic_war_defender_save_v1';

export const DEFAULT_SETTINGS: GameSettings = {
  masterVolume: 0.75,
  musicVolume: 0.5,
  sfxVolume: 0.85,
  muted: false,
  controlSensitivity: 1.2,
  movementSmoothing: 0.7,
  screenShake: true,
  fxQuality: 'high',
  performanceQuality: 'high',
};

const DEFAULT_UPGRADES: Record<UpgradeId, number> = {
  weapon_damage: 0,
  fire_rate: 0,
  max_health: 0,
  shield_capacity: 0,
  movement_speed: 0,
  critical_chance: 0,
  missile_power: 0,
  special_power: 0,
};

const DEFAULT_WEAPON_LEVELS: Record<WeaponId, number> = {
  plasma: 1,
  dual_laser: 1,
  spread: 1,
  homing: 1,
  beam: 1,
  lightning: 1,
};

const DEFAULT_EQUIPPED_GEAR: Record<EquipmentSlot, string | null> = {
  offensive: null,
  defensive: null,
  utility: null,
  special: null,
};

export function createDefaultProgress(): PlayerProgress {
  return {
    version: 2,
    highestUnlockedLevel: 1,
    completedLevels: [],
    highScore: 0,
    levelScores: {},
    selectedShip: 'falcon_x',
    unlockedShips: ['falcon_x'],
    selectedWeapon: 'plasma',
    unlockedWeapons: ['plasma', 'dual_laser', 'spread'],
    weaponLevels: { ...DEFAULT_WEAPON_LEVELS },
    selectedSpecial: 'emp_nova',
    upgrades: { ...DEFAULT_UPGRADES },
    ownedEquipment: {},
    equippedGear: { ...DEFAULT_EQUIPPED_GEAR },
    ownedDrones: {},
    equippedDrones: [],
    credits: 450,
    crystals: 3,
    dailyMissions: {
      resetKey: getDailyResetKey(),
      progress: {},
      claimedIds: [],
    },
    weeklyChallenges: {
      resetKey: getWeeklyResetKey(),
      progress: {},
      claimedIds: [],
    },
    claimedAchievements: [],
    stats: {
      totalBossKills: 0,
      totalCrits: 0,
      totalUpgradesBought: 0,
      totalPowerUps: 0,
      totalRuns: 0,
      bestEndlessScore: 0,
      bestEndlessWave: 0,
      bestBossRushScore: 0,
      bossRushClears: 0,
      completedChallenges: [],
    },
    codex: {
      discoveredEnemies: [],
      encounteredBosses: [],
      defeatedBosses: [],
    },
    settings: { ...DEFAULT_SETTINGS },
    rewardHistory: [],
    muted: false,
    totalKills: 0,
  };
}

function safeInt(val: unknown, fallback: number, min = 0, max = Number.MAX_SAFE_INTEGER): number {
  if (typeof val !== 'number' || !Number.isFinite(val)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(val)));
}

function safeFloat(val: unknown, fallback: number, min: number, max: number): number {
  if (typeof val !== 'number' || !Number.isFinite(val)) return fallback;
  return Math.max(min, Math.min(max, val));
}

class StorageManagerImpl {
  private cache: PlayerProgress | null = null;

  load(): PlayerProgress {
    if (this.cache) {
      this.ensureFreshScheduleBuckets(this.cache);
      return this.cache;
    }

    const base = createDefaultProgress();
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        this.cache = base;
        return this.cache;
      }
      const parsed = JSON.parse(raw) as Partial<PlayerProgress> | null;
      if (!parsed || typeof parsed !== 'object') {
        this.cache = base;
        return this.cache;
      }

      const isMigratingV1 = parsed.version === undefined || parsed.version < 2;
      const completedLevels = Array.isArray(parsed.completedLevels)
        ? parsed.completedLevels.filter((n): n is number => typeof n === 'number' && n >= 1 && n <= 10)
        : [];

      const unlockedWeaponsRaw = Array.isArray(parsed.unlockedWeapons)
        ? parsed.unlockedWeapons.filter((w): w is WeaponId => w in WEAPONS)
        : [...base.unlockedWeapons];

      const selectedWeapon: WeaponId =
        parsed.selectedWeapon && parsed.selectedWeapon in WEAPONS ? parsed.selectedWeapon : 'plasma';
      if (!unlockedWeaponsRaw.includes(selectedWeapon)) {
        unlockedWeaponsRaw.push(selectedWeapon);
      }

      const unlockedShipsRaw = Array.isArray(parsed.unlockedShips)
        ? parsed.unlockedShips.filter((s): s is ShipId => s in SHIPS)
        : ['falcon_x' as ShipId];
      if (!unlockedShipsRaw.includes('falcon_x')) unlockedShipsRaw.unshift('falcon_x');

      const selectedShip: ShipId =
        parsed.selectedShip && parsed.selectedShip in SHIPS && unlockedShipsRaw.includes(parsed.selectedShip)
          ? parsed.selectedShip
          : 'falcon_x';

      const selectedSpecial: SpecialId =
        parsed.selectedSpecial && parsed.selectedSpecial in SPECIAL_ATTACKS ? parsed.selectedSpecial : 'emp_nova';

      const upgrades = { ...DEFAULT_UPGRADES };
      if (parsed.upgrades && typeof parsed.upgrades === 'object') {
        (Object.keys(DEFAULT_UPGRADES) as UpgradeId[]).forEach((k) => {
          upgrades[k] = safeInt((parsed.upgrades as Record<string, unknown>)[k], 0, 0, UPGRADES[k].maxLevel);
        });
      }

      const weaponLevels = { ...DEFAULT_WEAPON_LEVELS };
      if (parsed.weaponLevels && typeof parsed.weaponLevels === 'object') {
        (Object.keys(DEFAULT_WEAPON_LEVELS) as WeaponId[]).forEach((k) => {
          weaponLevels[k] = safeInt((parsed.weaponLevels as Record<string, unknown>)[k], 1, 1, WEAPONS[k].maxWeaponLevel);
        });
      }

      const ownedEquipment: Record<string, number> = {};
      if (parsed.ownedEquipment && typeof parsed.ownedEquipment === 'object') {
        Object.entries(parsed.ownedEquipment).forEach(([id, lvl]) => {
          const safeLvl = safeInt(lvl, 0, 0, 5);
          if (safeLvl >= 1) ownedEquipment[id] = safeLvl;
        });
      }

      const equippedGear: Record<EquipmentSlot, string | null> = { ...DEFAULT_EQUIPPED_GEAR };
      if (parsed.equippedGear && typeof parsed.equippedGear === 'object') {
        (['offensive', 'defensive', 'utility', 'special'] as EquipmentSlot[]).forEach((slot) => {
          const itemId = (parsed.equippedGear as Record<string, unknown>)[slot];
          if (typeof itemId === 'string' && ownedEquipment[itemId]) {
            equippedGear[slot] = itemId;
          }
        });
      }

      const ownedDrones: Partial<Record<DroneId, number>> = {};
      if (parsed.ownedDrones && typeof parsed.ownedDrones === 'object') {
        (['assault', 'shield', 'repair', 'collector'] as DroneId[]).forEach((dId) => {
          const lvl = safeInt((parsed.ownedDrones as Record<string, unknown>)[dId], 0, 0, 5);
          if (lvl >= 1) ownedDrones[dId] = lvl;
        });
      }

      const equippedDrones = Array.isArray(parsed.equippedDrones)
        ? parsed.equippedDrones.filter((d): d is DroneId => Boolean(ownedDrones[d as DroneId])).slice(0, 2)
        : [];

      const muted = Boolean(parsed.settings?.muted ?? parsed.muted ?? false);
      const settings: GameSettings = {
        masterVolume: safeFloat(parsed.settings?.masterVolume, DEFAULT_SETTINGS.masterVolume, 0, 1),
        musicVolume: safeFloat(parsed.settings?.musicVolume, DEFAULT_SETTINGS.musicVolume, 0, 1),
        sfxVolume: safeFloat(parsed.settings?.sfxVolume, DEFAULT_SETTINGS.sfxVolume, 0, 1),
        muted,
        controlSensitivity: safeFloat(parsed.settings?.controlSensitivity, DEFAULT_SETTINGS.controlSensitivity, 0.7, 1.8),
        movementSmoothing: safeFloat(parsed.settings?.movementSmoothing, DEFAULT_SETTINGS.movementSmoothing, 0, 1),
        screenShake: parsed.settings?.screenShake ?? DEFAULT_SETTINGS.screenShake,
        fxQuality:
          parsed.settings?.fxQuality === 'low' ||
          parsed.settings?.fxQuality === 'medium' ||
          parsed.settings?.fxQuality === 'high'
            ? parsed.settings.fxQuality
            : DEFAULT_SETTINGS.fxQuality,
        performanceQuality:
          parsed.settings?.performanceQuality === 'balanced' ? 'balanced' : 'high',
      };

      const migrationBonusCredits = isMigratingV1 ? 450 + completedLevels.length * 250 : 0;
      const migrationBonusCrystals = isMigratingV1 ? 3 + completedLevels.length * 2 : 0;

      const dailyKey = getDailyResetKey();
      const weeklyKey = getWeeklyResetKey();

      const dailyMissions: MissionProgressBucket =
        parsed.dailyMissions && parsed.dailyMissions.resetKey === dailyKey
          ? {
              resetKey: dailyKey,
              progress: typeof parsed.dailyMissions.progress === 'object' && parsed.dailyMissions.progress ? parsed.dailyMissions.progress : {},
              claimedIds: Array.isArray(parsed.dailyMissions.claimedIds) ? parsed.dailyMissions.claimedIds : [],
            }
          : { resetKey: dailyKey, progress: {}, claimedIds: [] };

      const weeklyChallenges: MissionProgressBucket =
        parsed.weeklyChallenges && parsed.weeklyChallenges.resetKey === weeklyKey
          ? {
              resetKey: weeklyKey,
              progress: typeof parsed.weeklyChallenges.progress === 'object' && parsed.weeklyChallenges.progress ? parsed.weeklyChallenges.progress : {},
              claimedIds: Array.isArray(parsed.weeklyChallenges.claimedIds) ? parsed.weeklyChallenges.claimedIds : [],
            }
          : { resetKey: weeklyKey, progress: {}, claimedIds: [] };

      const merged: PlayerProgress = {
        version: 2,
        highestUnlockedLevel: safeInt(parsed.highestUnlockedLevel, 1, 1, 10),
        completedLevels,
        highScore: safeInt(parsed.highScore, 0, 0),
        levelScores: parsed.levelScores && typeof parsed.levelScores === 'object' ? parsed.levelScores : {},
        selectedShip,
        unlockedShips: Array.from(new Set(unlockedShipsRaw)),
        selectedWeapon,
        unlockedWeapons: Array.from(new Set(unlockedWeaponsRaw)),
        weaponLevels,
        selectedSpecial,
        upgrades,
        ownedEquipment,
        equippedGear,
        ownedDrones,
        equippedDrones,
        credits: isMigratingV1 ? migrationBonusCredits : safeInt(parsed.credits, base.credits, 0),
        crystals: isMigratingV1 ? migrationBonusCrystals : safeInt(parsed.crystals, base.crystals, 0),
        dailyMissions,
        weeklyChallenges,
        claimedAchievements: Array.isArray(parsed.claimedAchievements) ? parsed.claimedAchievements : [],
        stats: {
          totalBossKills: safeInt(parsed.stats?.totalBossKills, 0, 0),
          totalCrits: safeInt(parsed.stats?.totalCrits, 0, 0),
          totalUpgradesBought: safeInt(parsed.stats?.totalUpgradesBought, 0, 0),
          totalPowerUps: safeInt(parsed.stats?.totalPowerUps, 0, 0),
          totalRuns: safeInt(parsed.stats?.totalRuns, 0, 0),
          bestEndlessScore: safeInt(parsed.stats?.bestEndlessScore, 0, 0),
          bestEndlessWave: safeInt(parsed.stats?.bestEndlessWave, 0, 0),
          bestBossRushScore: safeInt(parsed.stats?.bestBossRushScore, 0, 0),
          bossRushClears: safeInt(parsed.stats?.bossRushClears, 0, 0),
          completedChallenges: Array.isArray(parsed.stats?.completedChallenges) ? parsed.stats.completedChallenges : [],
        },
        codex: {
          discoveredEnemies: Array.isArray(parsed.codex?.discoveredEnemies) ? parsed.codex.discoveredEnemies : [],
          encounteredBosses: Array.isArray(parsed.codex?.encounteredBosses) ? parsed.codex.encounteredBosses : [],
          defeatedBosses: Array.isArray(parsed.codex?.defeatedBosses) ? parsed.codex.defeatedBosses : [],
        },
        settings,
        rewardHistory: Array.isArray(parsed.rewardHistory) ? parsed.rewardHistory.slice(0, 15) : [],
        muted,
        totalKills: safeInt(parsed.totalKills, 0, 0),
      };

      this.cache = merged;
      if (isMigratingV1) {
        this.save(merged);
      }
      return this.cache;
    } catch {
      this.cache = base;
      return this.cache;
    }
  }

  private ensureFreshScheduleBuckets(p: PlayerProgress): void {
    const dailyKey = getDailyResetKey();
    const weeklyKey = getWeeklyResetKey();
    let changed = false;

    if (p.dailyMissions.resetKey !== dailyKey) {
      p.dailyMissions = { resetKey: dailyKey, progress: {}, claimedIds: [] };
      changed = true;
    }
    if (p.weeklyChallenges.resetKey !== weeklyKey) {
      p.weeklyChallenges = { resetKey: weeklyKey, progress: {}, claimedIds: [] };
      changed = true;
    }
    if (changed) {
      this.save(p);
    }
  }

  save(next: PlayerProgress): void {
    const sanitized: PlayerProgress = {
      ...next,
      version: 2,
      credits: Math.max(0, Math.floor(next.credits)),
      crystals: Math.max(0, Math.floor(next.crystals)),
      muted: next.settings.muted,
    };
    this.cache = sanitized;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
    } catch {
      // Ignore storage quota errors gracefully
    }
  }

  update(mutator: (draft: PlayerProgress) => void): PlayerProgress {
    const current = this.load();
    mutator(current);
    this.save(current);
    return current;
  }

  setWeapon(weapon: WeaponId): void {
    const p = this.load();
    if (!p.unlockedWeapons.includes(weapon)) return;
    this.save({ ...p, selectedWeapon: weapon });
  }

  setSpecial(special: SpecialId): void {
    const p = this.load();
    this.save({ ...p, selectedSpecial: special });
  }

  setMuted(muted: boolean): void {
    const p = this.load();
    this.save({ ...p, muted, settings: { ...p.settings, muted } });
  }

  updateSettings(partial: Partial<GameSettings>): GameSettings {
    const p = this.load();
    const nextSettings: GameSettings = { ...p.settings, ...partial };
    this.save({ ...p, muted: nextSettings.muted, settings: nextSettings });
    return nextSettings;
  }

  resetSettings(): GameSettings {
    const p = this.load();
    const nextSettings: GameSettings = { ...DEFAULT_SETTINGS };
    this.save({ ...p, muted: nextSettings.muted, settings: nextSettings });
    return nextSettings;
  }
}

export const StorageManager = new StorageManagerImpl();
