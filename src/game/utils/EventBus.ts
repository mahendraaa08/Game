import { HudSnapshot, SceneId } from '../config/GameConfig';
import type {
  BossRushPerformanceSummary,
  BossRushRecoveryId,
  CampaignDifficulty,
  ChallengeDifficulty,
  EndlessUpgradeChoice,
  EndlessUpgradeStatId,
  GameMode,
} from '../config/GameModeConfig';
import { PowerUpType } from '../config/PowerUpConfig';
import { ShipId } from '../config/ShipConfig';
import { SpecialId, WeaponId } from '../config/WeaponConfig';
import { GameSettings } from './StorageManager';

export interface StartRunRequest {
  mode: GameMode;
  levelNumber?: number;
  campaignDifficulty?: CampaignDifficulty;
  challengeId?: string;
  challengeDifficulty?: ChallengeDifficulty;
}

export interface EndlessUpgradeDraftPayload {
  waveCompleted: number;
  choices: EndlessUpgradeChoice[];
}

export interface BossRushRecoveryDraftPayload {
  defeatedBossNumber: number;
  totalBosses: number;
  defeatedBossName: string;
  nextBossName: string;
  currentHp: number;
  maxHp: number;
  currentShield: number;
  maxShield: number;
}

export interface PowerUpPickupPayload {
  type: PowerUpType;
  amountRestored: number;
  durationSec: number;
  isFull: boolean;
}

export interface LevelResultPayload {
  mode: GameMode;
  levelNumber: number;
  levelName: string;
  campaignDifficulty?: CampaignDifficulty;
  challengeId?: string;
  challengeDifficulty?: ChallengeDifficulty;
  score: number;
  bonusScore: number;
  enemiesDefeated: number;
  bossDefeatedName: string | null;
  rewardText: string;
  creditsEarned: number;
  crystalsEarned: number;
  expEarned?: number;
  nextLevelNumber: number | null;
  unlockedNextDifficulty?: CampaignDifficulty | null;
}

export interface GameOverPayload {
  mode: GameMode;
  levelNumber: number;
  levelName: string;
  campaignDifficulty?: CampaignDifficulty;
  challengeId?: string;
  challengeDifficulty?: ChallengeDifficulty;
  score: number;
  waveReached: number;
  totalWaves: number;
  enemiesDefeated: number;
  creditsEarned: number;
  crystalsEarned: number;
  expEarned?: number;
}

export interface VictoryPayload {
  mode: GameMode;
  campaignDifficulty?: CampaignDifficulty;
  unlockedNextDifficulty?: CampaignDifficulty | null;
  finalScore: number;
  enemiesDefeated: number;
  creditsEarned: number;
  crystalsEarned: number;
  expEarned?: number;
  bossRushPerformance?: BossRushPerformanceSummary | null;
}

export interface BossWarningPayload {
  name: string;
  title: string;
  accentHex?: string;
  durationMs?: number;
}

export interface BossPosePayload {
  active: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  ageSec: number;
  entering: boolean;
  viewportW: number;
  viewportH: number;
}

export interface LevelUpStepSummary {
  level: number;
  credits: number;
  crystals: number;
}

export interface LevelUpPayload {
  previousLevel: number;
  newLevel: number;
  creditsGranted: number;
  crystalsGranted: number;
  steps?: LevelUpStepSummary[];
}

export interface PreloadProgressPayload {
  progress: number;
  stageLabel: string;
}

export type AppRoute =
  | 'menu'
  | 'modes'
  | 'ships'
  | 'weapons'
  | 'armory'
  | 'missions'
  | 'codex'
  | 'exchange'
  | 'settings';

type EventMap = {
  'preload:progress': PreloadProgressPayload;
  'scene:changed': SceneId;
  'hud:update': HudSnapshot;
  'powerup:collected': PowerUpPickupPayload;
  'level:result': LevelResultPayload;
  'game:over': GameOverPayload;
  'campaign:victory': VictoryPayload;
  'boss:warning': BossWarningPayload | null;
  'boss:pose': BossPosePayload;
  'endless:upgrade-draft': EndlessUpgradeDraftPayload;
  'ui:select-endless-upgrade': EndlessUpgradeStatId;
  'boss_rush:recovery-draft': BossRushRecoveryDraftPayload;
  'ui:select-boss-rush-recovery': BossRushRecoveryId;
  'ui:start-level': number;
  'ui:start-mode': StartRunRequest;
  'ui:open-hangar': void;
  'ui:navigate-route': AppRoute;
  'ui:open-menu': void;
  'ui:pause-game': void;
  'ui:resume-game': void;
  'ui:abort-mission': void;
  'ui:restart-level': void;
  'ui:next-level': void;
  'ui:select-ship': ShipId;
  'ui:select-weapon': WeaponId;
  'ui:select-special': SpecialId;
  'ui:trigger-dash': void;
  'ui:trigger-special': void;
  'progress:updated': void;
  'player:leveled-up': LevelUpPayload;
  'settings:updated': GameSettings;
};

type Listener<T> = (payload: T) => void;

class TypedEventBus {
  private listeners = new Map<keyof EventMap, Set<Listener<unknown>>>();

  on<K extends keyof EventMap>(event: K, fn: Listener<EventMap[K]>): () => void {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(fn as Listener<unknown>);
    return () => {
      set?.delete(fn as Listener<unknown>);
    };
  }

  emit<K extends keyof EventMap>(
    event: K,
    ...args: EventMap[K] extends void ? [] : [EventMap[K]]
  ): void {
    const set = this.listeners.get(event);
    if (!set) return;
    const payload = args[0] as EventMap[K];
    set.forEach((fn) => {
      (fn as Listener<EventMap[K]>)(payload);
    });
  }
}

export const EventBus = new TypedEventBus();
