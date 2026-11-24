import type { BossId } from '../config/BossConfig';
import { DRONE_LIST, DRONE_SLOT_IDS, type DroneId, type DroneSlotId } from '../config/DroneConfig';
import {
  ECONOMY_START,
  MAX_SHIP_LEVEL,
  PLAYER_NAME_MAX_LENGTH,
  getMigrationBonus,
} from '../config/EconomyConfig';
import type { EnemyClass } from '../config/EnemyConfig';
import { EQUIPMENT_BY_ID, type EquipmentSlot } from '../config/EquipmentConfig';
import {
  MAX_PLAYER_LEVEL,
  getExpRequiredForNextLevel,
} from '../config/LevelProgressionConfig';
import { getDailyResetKey, getWeeklyResetKey } from '../config/MissionConfig';
import {
  type ProfileAvatarId,
  type ProfileBorderId,
  isValidAvatarId,
  isValidBorderId,
} from '../config/ProfileCosmeticsConfig';
import {
  CAMPAIGN_DIFFICULTY_ORDER,
  CHALLENGE_BY_ID,
  CHALLENGE_DIFFICULTY_ORDER,
  type CampaignDifficulty,
  type ChallengeDifficulty,
} from '../config/GameModeConfig';
import { type ShipId, SHIPS } from '../config/ShipConfig';
import { type UpgradeId, UPGRADES } from '../config/UpgradeConfig';
import { type SpecialId, SPECIAL_ATTACKS, type WeaponId, WEAPONS } from '../config/WeaponConfig';
import type { LevelUpPayload } from './EventBus';

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

export interface CampaignDifficultyProgress {
  highestUnlockedLevel: number; // 0 = locked, 1..10 = unlocked sector ceiling
  completedLevels: number[];
  levelScores: Record<number, number>;
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
  bestBossRushTimeSec: number | null;
  bossRushClears: number;
  completedChallenges: string[];
  completedChallengeTiers: Record<string, ChallengeDifficulty[]>;
}

export interface CodexRecords {
  discoveredEnemies: EnemyClass[];
  encounteredBosses: BossId[];
  defeatedBosses: BossId[];
}

export interface PlayerProgress {
  version: number;
  guestModeConfirmed?: boolean;
  guestSessionCreatedAt?: number;
  playerName: string;
  avatarId: ProfileAvatarId;
  borderId: ProfileBorderId;
  playerLevel: number;
  playerExp: number;
  highestRewardedLevel: number;
  pendingLevelUp: LevelUpPayload | null;
  selectedCampaignDifficulty: CampaignDifficulty;
  campaignProgress: Record<CampaignDifficulty, CampaignDifficultyProgress>;
  highestUnlockedLevel: number;
  completedLevels: number[];
  highScore: number;
  levelScores: Record<number, number>;
  selectedShip: ShipId;
  unlockedShips: ShipId[];
  shipLevels: Record<ShipId, number>;
  selectedWeapon: WeaponId;
  unlockedWeapons: WeaponId[];
  weaponLevels: Record<WeaponId, number>;
  selectedSpecial: SpecialId;
  upgrades: Record<UpgradeId, number>;
  ownedEquipment: Record<string, number>; // equipmentId -> level (1..5)
  equippedGear: Record<EquipmentSlot, string | null>;
  ownedDrones: Partial<Record<DroneId, number>>; // droneId -> level (1..5)
  equippedDrones: DroneId[];
  equippedDroneSlots: Record<DroneSlotId, DroneId | null>;
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

export type StorageHealthStatus =
  | 'empty'
  | 'unconfirmed'
  | 'ready'
  | 'corrupted'
  | 'unavailable';

export interface StorageInspectionResult {
  status: StorageHealthStatus;
  hasConfirmedGuestSession: boolean;
  storageAvailable: boolean;
}

const STORAGE_KEY = 'galactic_war_defender_save_v1';
const CORRUPTED_BACKUP_KEY = 'galactic_war_defender_save_v1_backup';

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
  critical_damage: 0,
  special_cooldown: 0,
};

const DEFAULT_WEAPON_LEVELS: Record<WeaponId, number> = {
  plasma: 1,
  dual_laser: 1,
  spread: 1,
  homing: 1,
  beam: 1,
  lightning: 1,
};

const DEFAULT_SHIP_LEVELS: Record<ShipId, number> = {
  falcon_x: 1,
  destroyer: 1,
  phantom: 1,
  thunderbolt: 1,
  aegis: 1,
  specter: 1,
  nova_prime: 1,
  celestial: 1,
};

const DEFAULT_EQUIPPED_GEAR: Record<EquipmentSlot, string | null> = {
  offensive: null,
  defensive: null,
  utility: null,
  special: null,
};

const DEFAULT_EQUIPPED_DRONE_SLOTS: Record<DroneSlotId, DroneId | null> = {
  slot1: null,
  slot2: null,
};

export function sanitizePlayerName(raw: unknown): string {
  if (typeof raw !== 'string') return 'Commander';
  const cleaned = raw
    .replace(/[\u0000-\u001F\u007F<>`\\{}\[\]]/g, '')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, PLAYER_NAME_MAX_LENGTH)
    .trim();
  return cleaned.length > 0 ? cleaned : 'Commander';
}

export function createDefaultCampaignProgress(): Record<
  CampaignDifficulty,
  CampaignDifficultyProgress
> {
  return {
    easy: { highestUnlockedLevel: 1, completedLevels: [], levelScores: {} },
    normal: { highestUnlockedLevel: 0, completedLevels: [], levelScores: {} },
    hard: { highestUnlockedLevel: 0, completedLevels: [], levelScores: {} },
    insane: { highestUnlockedLevel: 0, completedLevels: [], levelScores: {} },
    nightmare: { highestUnlockedLevel: 0, completedLevels: [], levelScores: {} },
  };
}

export function createDefaultProgress(): PlayerProgress {
  return {
    version: 2,
    guestModeConfirmed: false,
    guestSessionCreatedAt: undefined,
    playerName: 'Commander',
    avatarId: 'vanguard',
    borderId: 'standard_alloy',
    playerLevel: 1,
    playerExp: 0,
    highestRewardedLevel: 1,
    pendingLevelUp: null,
    selectedCampaignDifficulty: 'easy',
    campaignProgress: createDefaultCampaignProgress(),
    highestUnlockedLevel: 1,
    completedLevels: [],
    highScore: 0,
    levelScores: {},
    selectedShip: 'falcon_x',
    unlockedShips: ['falcon_x'],
    shipLevels: { ...DEFAULT_SHIP_LEVELS },
    selectedWeapon: 'plasma',
    unlockedWeapons: ['plasma'],
    weaponLevels: { ...DEFAULT_WEAPON_LEVELS },
    selectedSpecial: 'emp_nova',
    upgrades: { ...DEFAULT_UPGRADES },
    ownedEquipment: {},
    equippedGear: { ...DEFAULT_EQUIPPED_GEAR },
    ownedDrones: {},
    equippedDrones: [],
    equippedDroneSlots: { ...DEFAULT_EQUIPPED_DRONE_SLOTS },
    credits: ECONOMY_START.credits,
    crystals: ECONOMY_START.crystals,
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
      bestBossRushTimeSec: null,
      bossRushClears: 0,
      completedChallenges: [],
      completedChallengeTiers: {},
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

function sanitizeLevelScores(raw: unknown): Record<number, number> {
  const out: Record<number, number> = {};
  if (!raw || typeof raw !== 'object') return out;
  Object.entries(raw as Record<string, unknown>).forEach(([k, v]) => {
    const lvl = Number(k);
    if (Number.isInteger(lvl) && lvl >= 1 && lvl <= 10 && typeof v === 'number' && Number.isFinite(v) && v > 0) {
      out[lvl] = Math.floor(v);
    }
  });
  return out;
}

function sanitizeCompletedLevels(raw: unknown): number[] {
  if (!Array.isArray(raw)) return [];
  return Array.from(
    new Set(
      raw.filter((n): n is number => typeof n === 'number' && Number.isInteger(n) && n >= 1 && n <= 10)
    )
  ).sort((a, b) => a - b);
}

export function syncAggregateCampaignFields(p: PlayerProgress): void {
  // Enforce sequential difficulty unlock chain whenever Lv10 of previous tier is cleared
  p.campaignProgress.easy.highestUnlockedLevel = Math.max(
    1,
    Math.min(10, p.campaignProgress.easy.highestUnlockedLevel || 1)
  );
  for (let i = 0; i < CAMPAIGN_DIFFICULTY_ORDER.length - 1; i++) {
    const curDiff = CAMPAIGN_DIFFICULTY_ORDER[i];
    const nextDiff = CAMPAIGN_DIFFICULTY_ORDER[i + 1];
    if (p.campaignProgress[curDiff].completedLevels.includes(10)) {
      p.campaignProgress[nextDiff].highestUnlockedLevel = Math.max(
        1,
        p.campaignProgress[nextDiff].highestUnlockedLevel
      );
    }
  }

  const allCompleted = new Set<number>();
  let maxUnlocked = 1;
  const mergedScores: Record<number, number> = {};

  CAMPAIGN_DIFFICULTY_ORDER.forEach((diff) => {
    const bucket = p.campaignProgress[diff];
    bucket.completedLevels.forEach((lvl) => allCompleted.add(lvl));
    if (bucket.highestUnlockedLevel > maxUnlocked) {
      maxUnlocked = bucket.highestUnlockedLevel;
    }
    Object.entries(bucket.levelScores).forEach(([k, v]) => {
      const lvl = Number(k);
      if (lvl >= 1 && lvl <= 10 && v > (mergedScores[lvl] ?? 0)) {
        mergedScores[lvl] = v;
      }
    });
  });

  p.completedLevels = Array.from(allCompleted).sort((a, b) => a - b);
  p.highestUnlockedLevel = Math.max(1, Math.min(10, maxUnlocked));
  p.levelScores = mergedScores;

  // Sync completedChallengeTiers -> completedChallenges union
  const validChallengeIds = new Set<string>(p.stats.completedChallenges);
  Object.entries(p.stats.completedChallengeTiers).forEach(([id, tiers]) => {
    if (Array.isArray(tiers) && tiers.length > 0) {
      validChallengeIds.add(id);
    }
  });
  p.stats.completedChallenges = Array.from(validChallengeIds);
}

class StorageManagerImpl {
  private cache: PlayerProgress | null = null;

  private hasSubstantiveGameplayProgress(parsed: Partial<PlayerProgress>): boolean {
    return (
      (Array.isArray(parsed.completedLevels) && parsed.completedLevels.length > 0) ||
      (typeof parsed.highScore === 'number' && parsed.highScore > 0) ||
      (typeof parsed.totalKills === 'number' && parsed.totalKills > 0) ||
      (typeof parsed.playerLevel === 'number' && parsed.playerLevel > 1) ||
      (typeof parsed.playerExp === 'number' && parsed.playerExp > 0) ||
      (typeof parsed.stats?.totalRuns === 'number' && parsed.stats.totalRuns > 0) ||
      (typeof parsed.stats?.totalUpgradesBought === 'number' && parsed.stats.totalUpgradesBought > 0)
    );
  }

  inspectSavedState(): StorageInspectionResult {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw === null || raw.trim() === '') {
        return {
          status: 'empty',
          hasConfirmedGuestSession: false,
          storageAvailable: true,
        };
      }

      const parsed = JSON.parse(raw) as Partial<PlayerProgress> | null;
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return {
          status: 'corrupted',
          hasConfirmedGuestSession: false,
          storageAvailable: true,
        };
      }

      const hasProgress = this.hasSubstantiveGameplayProgress(parsed);
      const isConfirmed =
        parsed.guestModeConfirmed === true ||
        parsed.guestModeConfirmed === undefined ||
        hasProgress;

      return {
        status: isConfirmed ? 'ready' : 'unconfirmed',
        hasConfirmedGuestSession: isConfirmed,
        storageAvailable: true,
      };
    } catch (err) {
      // Distinguish storage access error vs JSON parse error without deleting user data
      try {
        const rawCheck = window.localStorage.getItem(STORAGE_KEY);
        if (rawCheck !== null && rawCheck.trim() !== '') {
          return {
            status: 'corrupted',
            hasConfirmedGuestSession: false,
            storageAvailable: true,
          };
        }
      } catch {
        return {
          status: 'unavailable',
          hasConfirmedGuestSession: false,
          storageAvailable: false,
        };
      }
      return {
        status: err instanceof SyntaxError ? 'corrupted' : 'unavailable',
        hasConfirmedGuestSession: false,
        storageAvailable: false,
      };
    }
  }

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
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        this.cache = base;
        return this.cache;
      }

      const isMigratingV1 = parsed.version === undefined || parsed.version < 2;
      const completedLevels = Array.isArray(parsed.completedLevels)
        ? Array.from(
            new Set(
              parsed.completedLevels.filter(
                (n): n is number => typeof n === 'number' && n >= 1 && n <= 10
              )
            )
          )
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

      const rawSpecial = parsed.selectedSpecial as string | undefined;
      const migratedSpecial =
        rawSpecial === 'orbital_strike'
          ? 'chrono_singularity'
          : rawSpecial === 'photon_barrage'
          ? 'gravity_well'
          : rawSpecial;
      const selectedSpecial: SpecialId =
        migratedSpecial && migratedSpecial in SPECIAL_ATTACKS
          ? (migratedSpecial as SpecialId)
          : 'emp_nova';

      const upgrades = { ...DEFAULT_UPGRADES };
      if (parsed.upgrades && typeof parsed.upgrades === 'object') {
        const rawUpgrades = parsed.upgrades as Record<string, unknown>;
        (Object.keys(DEFAULT_UPGRADES) as UpgradeId[]).forEach((k) => {
          let rawVal = rawUpgrades[k];
          if (rawVal === undefined) {
            if (k === 'critical_damage') rawVal = rawUpgrades.missile_power;
            if (k === 'special_cooldown') rawVal = rawUpgrades.special_power;
          }
          upgrades[k] = safeInt(rawVal, 0, 0, UPGRADES[k].maxLevel);
        });
      }

      const weaponLevels = { ...DEFAULT_WEAPON_LEVELS };
      if (parsed.weaponLevels && typeof parsed.weaponLevels === 'object') {
        (Object.keys(DEFAULT_WEAPON_LEVELS) as WeaponId[]).forEach((k) => {
          weaponLevels[k] = safeInt((parsed.weaponLevels as Record<string, unknown>)[k], 1, 1, WEAPONS[k].maxWeaponLevel);
        });
      }

      const shipLevels = { ...DEFAULT_SHIP_LEVELS };
      if (parsed.shipLevels && typeof parsed.shipLevels === 'object') {
        (Object.keys(DEFAULT_SHIP_LEVELS) as ShipId[]).forEach((k) => {
          shipLevels[k] = safeInt((parsed.shipLevels as Record<string, unknown>)[k], 1, 1, MAX_SHIP_LEVEL);
        });
      }

      const ownedEquipment: Record<string, number> = {};
      if (parsed.ownedEquipment && typeof parsed.ownedEquipment === 'object') {
        Object.entries(parsed.ownedEquipment).forEach(([id, lvl]) => {
          if (!(id in EQUIPMENT_BY_ID)) return;
          const safeLvl = safeInt(lvl, 0, 0, 5);
          if (safeLvl >= 1) ownedEquipment[id] = safeLvl;
        });
      }

      const equippedGear: Record<EquipmentSlot, string | null> = { ...DEFAULT_EQUIPPED_GEAR };
      if (parsed.equippedGear && typeof parsed.equippedGear === 'object') {
        (['offensive', 'defensive', 'utility', 'special'] as EquipmentSlot[]).forEach((slot) => {
          const itemId = (parsed.equippedGear as Record<string, unknown>)[slot];
          if (
            typeof itemId === 'string' &&
            ownedEquipment[itemId] &&
            EQUIPMENT_BY_ID[itemId]?.slot === slot
          ) {
            equippedGear[slot] = itemId;
          }
        });
      }

      const ownedDrones: Partial<Record<DroneId, number>> = {};
      if (parsed.ownedDrones && typeof parsed.ownedDrones === 'object') {
        DRONE_LIST.forEach(({ id: dId }) => {
          const lvl = safeInt((parsed.ownedDrones as Record<string, unknown>)[dId], 0, 0, 5);
          if (lvl >= 1) ownedDrones[dId] = lvl;
        });
      }

      const equippedDroneSlots: Record<DroneSlotId, DroneId | null> = {
        ...DEFAULT_EQUIPPED_DRONE_SLOTS,
      };
      const seenDrones = new Set<DroneId>();
      const rawSlots = (parsed as Partial<PlayerProgress>).equippedDroneSlots;
      if (rawSlots && typeof rawSlots === 'object') {
        DRONE_SLOT_IDS.forEach((slotId) => {
          const dId = (rawSlots as Record<string, unknown>)[slotId];
          if (
            typeof dId === 'string' &&
            ownedDrones[dId as DroneId] &&
            !seenDrones.has(dId as DroneId)
          ) {
            equippedDroneSlots[slotId] = dId as DroneId;
            seenDrones.add(dId as DroneId);
          }
        });
      } else if (Array.isArray(parsed.equippedDrones)) {
        const legacyValid = parsed.equippedDrones.filter((d): d is DroneId =>
          Boolean(ownedDrones[d as DroneId])
        );
        DRONE_SLOT_IDS.forEach((slotId, idx) => {
          const dId = legacyValid[idx];
          if (dId && !seenDrones.has(dId)) {
            equippedDroneSlots[slotId] = dId;
            seenDrones.add(dId);
          }
        });
      }

      const equippedDrones = DRONE_SLOT_IDS.map((slotId) => equippedDroneSlots[slotId]).filter(
        (d): d is DroneId => d !== null
      );

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

      const migrationBonus = isMigratingV1 ? getMigrationBonus(completedLevels.length) : null;
      const migrationBonusCredits = migrationBonus ? migrationBonus.credits : 0;
      const migrationBonusCrystals = migrationBonus ? migrationBonus.crystals : 0;

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

      const parsedPlayerLevel = safeInt(
        (parsed as Partial<PlayerProgress>).playerLevel,
        1,
        1,
        MAX_PLAYER_LEVEL
      );
      const maxExpForParsedLevel =
        parsedPlayerLevel >= MAX_PLAYER_LEVEL
          ? 0
          : Math.max(0, getExpRequiredForNextLevel(parsedPlayerLevel) - 1);
      const parsedPlayerExp =
        parsedPlayerLevel >= MAX_PLAYER_LEVEL
          ? 0
          : safeInt((parsed as Partial<PlayerProgress>).playerExp, 0, 0, maxExpForParsedLevel);
      const parsedHighestRewarded = safeInt(
        (parsed as Partial<PlayerProgress>).highestRewardedLevel,
        parsedPlayerLevel,
        1,
        MAX_PLAYER_LEVEL
      );

      const rawPending = (parsed as Partial<PlayerProgress>).pendingLevelUp;
      const sanitizedPending: LevelUpPayload | null =
        rawPending &&
        typeof rawPending === 'object' &&
        typeof rawPending.previousLevel === 'number' &&
        typeof rawPending.newLevel === 'number' &&
        rawPending.newLevel > rawPending.previousLevel &&
        rawPending.newLevel <= parsedPlayerLevel
          ? {
              previousLevel: Math.max(1, Math.floor(rawPending.previousLevel)),
              newLevel: Math.min(MAX_PLAYER_LEVEL, Math.floor(rawPending.newLevel)),
              creditsGranted: Math.max(0, Math.floor(rawPending.creditsGranted || 0)),
              crystalsGranted: Math.max(0, Math.floor(rawPending.crystalsGranted || 0)),
              steps: Array.isArray(rawPending.steps)
                ? rawPending.steps
                    .filter(
                      (s): s is { level: number; credits: number; crystals: number } =>
                        Boolean(s) && typeof s.level === 'number'
                    )
                    .map((s) => ({
                      level: Math.max(2, Math.min(MAX_PLAYER_LEVEL, Math.floor(s.level))),
                      credits: Math.max(0, Math.floor(s.credits || 0)),
                      crystals: Math.max(0, Math.floor(s.crystals || 0)),
                    }))
                : undefined,
            }
          : null;

      const isConfirmedSession =
        typeof parsed.guestModeConfirmed === 'boolean'
          ? parsed.guestModeConfirmed || this.hasSubstantiveGameplayProgress(parsed)
          : true;

      const legacyCompletedLevels = sanitizeCompletedLevels(parsed.completedLevels);
      const legacyScores = sanitizeLevelScores(parsed.levelScores);
      const legacyHighestUnlocked = safeInt(parsed.highestUnlockedLevel, 1, 1, 10);

      const campaignProgress = createDefaultCampaignProgress();
      const rawCampaignProgress = (parsed as Partial<PlayerProgress>).campaignProgress;
      const hasLegacyCampaign =
        legacyCompletedLevels.length > 0 ||
        legacyHighestUnlocked > 1 ||
        Object.keys(legacyScores).length > 0;

      if (rawCampaignProgress && typeof rawCampaignProgress === 'object') {
        CAMPAIGN_DIFFICULTY_ORDER.forEach((diff) => {
          const rawBucket = (rawCampaignProgress as Record<string, unknown>)[diff];
          if (rawBucket && typeof rawBucket === 'object') {
            const b = rawBucket as Partial<CampaignDifficultyProgress>;
            campaignProgress[diff] = {
              highestUnlockedLevel: safeInt(
                b.highestUnlockedLevel,
                diff === 'easy' ? 1 : 0,
                0,
                10
              ),
              completedLevels: sanitizeCompletedLevels(b.completedLevels),
              levelScores: sanitizeLevelScores(b.levelScores),
            };
          }
        });
      } else if (hasLegacyCampaign) {
        // Migrate legacy campaign saves cleanly into Normal difficulty without losing any completion/score
        campaignProgress.normal = {
          highestUnlockedLevel: Math.max(1, legacyHighestUnlocked),
          completedLevels: legacyCompletedLevels,
          levelScores: legacyScores,
        };
      }

      const rawSelectedDiff = (parsed as Partial<PlayerProgress>).selectedCampaignDifficulty;
      const selectedCampaignDifficulty: CampaignDifficulty =
        rawSelectedDiff &&
        CAMPAIGN_DIFFICULTY_ORDER.includes(rawSelectedDiff) &&
        campaignProgress[rawSelectedDiff].highestUnlockedLevel >= 1
          ? rawSelectedDiff
          : !rawCampaignProgress && hasLegacyCampaign
          ? 'normal'
          : 'easy';

      const legacyCompletedChallenges = Array.isArray(parsed.stats?.completedChallenges)
        ? Array.from(
            new Set(
              parsed.stats!.completedChallenges.filter((id): id is string => typeof id === 'string')
            )
          )
        : [];

      const completedChallengeTiers: Record<string, ChallengeDifficulty[]> = {};
      const rawTiers = (parsed.stats as Partial<PlayerStatsRecord> | undefined)?.completedChallengeTiers;
      if (rawTiers && typeof rawTiers === 'object') {
        Object.entries(rawTiers).forEach(([id, arr]) => {
          if (!Array.isArray(arr)) return;
          const valid = Array.from(
            new Set(
              arr.filter((t): t is ChallengeDifficulty =>
                CHALLENGE_DIFFICULTY_ORDER.includes(t as ChallengeDifficulty)
              )
            )
          );
          if (valid.length > 0) completedChallengeTiers[id] = valid;
        });
      }
      // Migrate any legacy completed challenge IDs onto their original tier
      legacyCompletedChallenges.forEach((id) => {
        if (!completedChallengeTiers[id] || completedChallengeTiers[id].length === 0) {
          const def = CHALLENGE_BY_ID[id];
          completedChallengeTiers[id] = [def?.legacyDifficulty ?? 'Standard'];
        }
      });

      const rawBestRushTime = (parsed.stats as Partial<PlayerStatsRecord> | undefined)?.bestBossRushTimeSec;
      const bestBossRushTimeSec =
        typeof rawBestRushTime === 'number' && Number.isFinite(rawBestRushTime) && rawBestRushTime > 0
          ? Math.round(rawBestRushTime)
          : null;

      const merged: PlayerProgress = {
        version: 2,
        guestModeConfirmed: isConfirmedSession,
        guestSessionCreatedAt:
          typeof parsed.guestSessionCreatedAt === 'number' &&
          Number.isFinite(parsed.guestSessionCreatedAt)
            ? parsed.guestSessionCreatedAt
            : undefined,
        playerName: sanitizePlayerName(parsed.playerName),
        avatarId: isValidAvatarId((parsed as Partial<PlayerProgress>).avatarId)
          ? (parsed as Partial<PlayerProgress>).avatarId!
          : 'vanguard',
        borderId: isValidBorderId((parsed as Partial<PlayerProgress>).borderId)
          ? (parsed as Partial<PlayerProgress>).borderId!
          : 'standard_alloy',
        playerLevel: parsedPlayerLevel,
        playerExp: parsedPlayerExp,
        highestRewardedLevel: Math.max(parsedPlayerLevel, parsedHighestRewarded),
        pendingLevelUp: sanitizedPending,
        selectedCampaignDifficulty,
        campaignProgress,
        highestUnlockedLevel: legacyHighestUnlocked,
        completedLevels: legacyCompletedLevels,
        highScore: safeInt(parsed.highScore, 0, 0),
        levelScores: legacyScores,
        selectedShip,
        unlockedShips: Array.from(new Set(unlockedShipsRaw)),
        shipLevels,
        selectedWeapon,
        unlockedWeapons: Array.from(new Set(unlockedWeaponsRaw)),
        weaponLevels,
        selectedSpecial,
        upgrades,
        ownedEquipment,
        equippedGear,
        ownedDrones,
        equippedDrones,
        equippedDroneSlots,
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
          bestBossRushTimeSec,
          bossRushClears: safeInt(parsed.stats?.bossRushClears, 0, 0),
          completedChallenges: legacyCompletedChallenges,
          completedChallengeTiers,
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

      syncAggregateCampaignFields(merged);
      this.cache = merged;
      if (isMigratingV1 || !rawCampaignProgress) {
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
    const slots: Record<DroneSlotId, DroneId | null> = {
      slot1: next.equippedDroneSlots?.slot1 ?? null,
      slot2: next.equippedDroneSlots?.slot2 ?? null,
    };
    const syncedDrones = DRONE_SLOT_IDS.map((id) => slots[id]).filter(
      (d): d is DroneId => d !== null
    );
    const clampedLevel = Math.max(1, Math.min(MAX_PLAYER_LEVEL, Math.floor(next.playerLevel || 1)));
    const clampedShipLevels = { ...DEFAULT_SHIP_LEVELS };
    (Object.keys(DEFAULT_SHIP_LEVELS) as ShipId[]).forEach((k) => {
      clampedShipLevels[k] = safeInt(next.shipLevels?.[k], 1, 1, MAX_SHIP_LEVEL);
    });
    const sanitized: PlayerProgress = {
      ...next,
      shipLevels: clampedShipLevels,
      version: 2,
      guestModeConfirmed: Boolean(next.guestModeConfirmed),
      guestSessionCreatedAt:
        typeof next.guestSessionCreatedAt === 'number' && Number.isFinite(next.guestSessionCreatedAt)
          ? next.guestSessionCreatedAt
          : undefined,
      playerName: sanitizePlayerName(next.playerName),
      avatarId: isValidAvatarId(next.avatarId) ? next.avatarId : 'vanguard',
      borderId: isValidBorderId(next.borderId) ? next.borderId : 'standard_alloy',
      playerLevel: clampedLevel,
      playerExp: clampedLevel >= MAX_PLAYER_LEVEL ? 0 : Math.max(0, Math.floor(next.playerExp || 0)),
      highestRewardedLevel: Math.max(
        clampedLevel,
        Math.min(MAX_PLAYER_LEVEL, Math.floor(next.highestRewardedLevel || clampedLevel))
      ),
      pendingLevelUp:
        next.pendingLevelUp && next.pendingLevelUp.newLevel > next.pendingLevelUp.previousLevel
          ? next.pendingLevelUp
          : null,
      equippedDroneSlots: slots,
      equippedDrones: syncedDrones,
      credits: Math.max(0, Math.floor(next.credits)),
      crystals: Math.max(0, Math.floor(next.crystals)),
      muted: next.settings.muted,
    };
    syncAggregateCampaignFields(sanitized);
    this.cache = sanitized;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
    } catch {
      // Ignore storage quota errors gracefully
    }
  }

  confirmGuestMode(): PlayerProgress {
    const inspection = this.inspectSavedState();
    const current = this.load();

    // Never overwrite or reset already-confirmed or substantive existing player progress
    if (
      inspection.status === 'ready' ||
      current.guestModeConfirmed === true ||
      this.hasSubstantiveGameplayProgress(current)
    ) {
      if (!current.guestModeConfirmed || !current.guestSessionCreatedAt) {
        const preserved: PlayerProgress = {
          ...current,
          guestModeConfirmed: true,
          guestSessionCreatedAt: current.guestSessionCreatedAt ?? Date.now(),
        };
        this.save(preserved);
        return preserved;
      }
      return current;
    }

    // Preserve unreadable raw payload as backup before initializing a fresh profile
    if (inspection.status === 'corrupted') {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) {
          window.localStorage.setItem(CORRUPTED_BACKUP_KEY, raw);
        }
      } catch {
        // Ignore backup quota errors
      }
    }

    const fresh = createDefaultProgress();
    const confirmed: PlayerProgress = {
      ...fresh,
      guestModeConfirmed: true,
      guestSessionCreatedAt: Date.now(),
      settings: { ...current.settings },
      muted: current.settings.muted,
    };
    this.save(confirmed);
    return confirmed;
  }

  retryLoadSavedState(): { inspection: StorageInspectionResult; progress: PlayerProgress } {
    this.cache = null;
    const inspection = this.inspectSavedState();
    const progress = this.load();
    return { inspection, progress };
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

  resetAllProgress(): PlayerProgress {
    const current = this.load();
    const fresh = createDefaultProgress();
    const preservedSettings: GameSettings = { ...current.settings };
    const resetState: PlayerProgress = {
      ...fresh,
      guestModeConfirmed: current.guestModeConfirmed ?? true,
      guestSessionCreatedAt: current.guestSessionCreatedAt ?? Date.now(),
      settings: preservedSettings,
      muted: preservedSettings.muted,
    };
    this.save(resetState);
    return resetState;
  }
}

export const StorageManager = new StorageManagerImpl();
