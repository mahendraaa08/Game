import type Phaser from 'phaser';
import { SoundManager } from '../audio/SoundManager';
import { SceneId } from '../config/GameConfig';
import { EventBus } from '../utils/EventBus';
import { StorageInspectionResult, StorageManager } from '../utils/StorageManager';

export const MIN_LOADING_DURATION_MS = 4000;
const SCENE_READY_TIMEOUT_MS = 8500;
const ASSET_TIMEOUT_MS = 2200;

export interface StartupResult {
  inspection: StorageInspectionResult;
  game: Phaser.Game | null;
}

export interface StartupCallbacks {
  onStage?: (stageKey: string) => void;
  isAborted: () => boolean;
}

function waitMs(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function preloadImageAsset(src: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      resolve();
    };
    const timer = window.setTimeout(finish, ASSET_TIMEOUT_MS);
    img.onload = () => {
      window.clearTimeout(timer);
      if (typeof img.decode === 'function') {
        img.decode().then(finish, finish);
      } else {
        finish();
      }
    };
    img.onerror = () => {
      window.clearTimeout(timer);
      finish();
    };
    img.src = src;
  });
}

function waitForFontsReady(): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts?.ready) {
    return Promise.resolve();
  }
  return Promise.race([
    document.fonts.ready.then(() => undefined).catch(() => undefined),
    waitMs(1600),
  ]);
}

function waitForMainMenuReady(isAborted: () => boolean): Promise<void> {
  return new Promise((resolve) => {
    if (isAborted()) {
      resolve();
      return;
    }

    let settled = false;
    let unsub: (() => void) | null = null;
    let timeoutId: number | null = null;

    const finish = () => {
      if (settled) return;
      settled = true;
      unsub?.();
      unsub = null;
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
        timeoutId = null;
      }
      resolve();
    };

    unsub = EventBus.on('scene:changed', (scene: SceneId) => {
      if (isAborted()) {
        finish();
        return;
      }
      if (scene === 'MainMenuScene' || scene === 'HangarScene' || scene === 'GameScene') {
        finish();
      }
    });

    timeoutId = window.setTimeout(finish, SCENE_READY_TIMEOUT_MS);
  });
}

/**
 * Modular, single-flight startup coordinator.
 * Runs all genuine initialization tasks (storage inspection/sync, fonts & key art,
 * Phaser engine + procedural textures + initial scene readiness) concurrently with
 * the mandatory 4-second minimum Loading Screen duration.
 */
export async function runStartupPipeline(
  options: {
    parentId: string;
    keyArtSrcs: string[];
  },
  callbacks: StartupCallbacks
): Promise<StartupResult> {
  const minDurationPromise = waitMs(MIN_LOADING_DURATION_MS);

  const realInitPromise = (async (): Promise<StartupResult> => {
    // 1. Inspect & hydrate persisted player data safely (never resets or overwrites)
    callbacks.onStage?.('storage');
    let inspection: StorageInspectionResult;
    try {
      inspection = StorageManager.inspectSavedState();
      const loaded = StorageManager.load();
      SoundManager.syncSettings(loaded.settings);
    } catch {
      inspection = {
        status: 'unavailable',
        hasConfirmedGuestSession: false,
        storageAvailable: false,
      };
    }

    if (callbacks.isAborted()) {
      return { inspection, game: null };
    }

    // 2. Load typography & preload key visual assets
    callbacks.onStage?.('assets');
    await Promise.all([
      waitForFontsReady(),
      ...options.keyArtSrcs.map((src) => preloadImageAsset(src)),
    ]);

    if (callbacks.isAborted()) {
      return { inspection, game: null };
    }

    // 3. Boot Phaser engine and await real scene/texture pipeline completion
    callbacks.onStage?.('engine');
    let game: Phaser.Game | null = null;
    const readyPromise = waitForMainMenuReady(callbacks.isAborted);

    try {
      const { createPhaserGame } = await import('../PhaserGame');
      if (callbacks.isAborted()) {
        return { inspection, game: null };
      }
      game = createPhaserGame(options.parentId);
      await readyPromise;
    } catch {
      // Fallback: React UI remains operational even if WebGL/Canvas initialization fails
      await Promise.resolve();
    }

    return { inspection, game };
  })();

  const [result] = await Promise.all([realInitPromise, minDurationPromise]);
  return result;
}
