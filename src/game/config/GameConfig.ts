import { GameMode } from './GameModeConfig';
import { ShipId } from './ShipConfig';
import { WeaponId } from './WeaponConfig';

export type SceneId =
  | 'BootScene'
  | 'PreloadScene'
  | 'MainMenuScene'
  | 'HangarScene'
  | 'GameScene'
  | 'BossScene'
  | 'PauseMenuScene'
  | 'LevelResultScene'
  | 'GameOverScene'
  | 'VictoryScene';

export const GAME_CONSTANTS = {
  GAME_TITLE: 'GALACTIC WAR: THE LAST DEFENDER',
  YEAR_SETTING: 3099,
  BASE_PLAYER_HP: 100,
  BASE_PLAYER_SHIELD: 60,
  PLAYER_SPEED: 380,
  PLAYER_ACCEL: 2400,
  PLAYER_DRAG: 1800,
  DASH_SPEED: 880,
  DASH_DURATION_MS: 180,
  DASH_COOLDOWN_MS: 2200,
  SPECIAL_COOLDOWN_MS: 11000,
  INVULN_HIT_MS: 900,
  SHIELD_REGEN_DELAY_MS: 4500,
  SHIELD_REGEN_PER_SEC: 6,
  MAX_DELTA_SEC: 0.05,
  HITSTOP_LIGHT_MS: 32,
  HITSTOP_HEAVY_MS: 65,
} as const;

export interface HudSnapshot {
  hp: number;
  maxHp: number;
  shield: number;
  maxShield: number;
  score: number;
  combo: number;
  mode: GameMode;
  modeLabel: string;
  levelNumber: number;
  levelName: string;
  objective: string;
  waveIndex: number;
  totalWaves: number;
  shipId: ShipId;
  shipName: string;
  weaponId: WeaponId;
  weaponName: string;
  weaponColor: string;
  weaponLevel: number;
  allowedWeapons: WeaponId[] | null;
  specialId: string;
  specialName: string;
  specialCooldownRatio: number; // 1 = ready, 0 = empty
  specialCooldownLeftSec: number;
  dashCooldownRatio: number;
  dashCooldownLeftSec: number;
  rapidFireLeftSec: number;
  doubleDamageLeftSec: number;
  invulnLeftSec: number;
  bossActive: boolean;
  bossName: string;
  bossTitle: string;
  bossHp: number;
  bossMaxHp: number;
  bossPhase: 1 | 2 | 3;
  bossWarningText: string | null;
  creditsEarnedRun: number;
  crystalsEarnedRun: number;
  challengeProgressText: string | null;
  challengeTimeLeftSec: number | null;
  bossRushIndex: number;
  bossRushTotal: number;
}
