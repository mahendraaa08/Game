import type Phaser from 'phaser';
import { SoundManager } from '../audio/SoundManager';
import { SceneId } from '../config/GameConfig';
import { EventBus } from '../utils/EventBus';
import { StorageInspectionResult, StorageManager } from '../utils/StorageManager';

const SCENE_READY_TIMEOUT_MS = 8500;
const ASSET_TIMEOUT_MS = 2200;
const SETTLE_AT_100_MS = 180;

export interface StartupResult {
  inspection: StorageInspectionResult;
  game: Phaser.Game | null;
}

export interface StartupCallbacks {
  onStage?: (stageKey: string) => void;
  onProgress?: (percent: number, stageLabel: string) => void;
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

function waitForMainMenuReady(
  isAborted: () => boolean,
  onPreloadProgress: (ratio: number, stageLabel: string) => void
): Promise<void> {
  return new Promise((resolve) => {
    if (isAborted()) {
      resolve();
      return;
    }

    let settled = false;
    let unsubScene: (() => void) | null = null;
    let unsubPreload: (() => void) | null = null;
    let timeoutId: number | null = null;

    const finish = () => {
      if (settled) return;
      settled = true;
      unsubScene?.();
      unsubPreload?.();
      unsubScene = null;
      unsubPreload = null;
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
        timeoutId = null;
      }
      resolve();
    };

    unsubPreload = EventBus.on('preload:progress', (payload) => {
      if (isAborted()) {
        finish();
        return;
      }
      onPreloadProgress(payload.progress, payload.stageLabel);
    });

    unsubScene = EventBus.on('scene:changed', (scene: SceneId) => {
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
 * Single-flight startup coordinator.
 * Emits monotonic, genuine initialization progress (0-100%) driven strictly by
 * storage hydration, typography & key-art decoding, Phaser boot, and procedural
 * texture generation batches.
 */
export async function runStartupPipeline(
  options: {
    parentId: string;
    keyArtSrcs: string[];
  },
  callbacks: StartupCallbacks
): Promise<StartupResult> {
  let highestPercent = 0;
  const report = (rawPercent: number, stageLabel: string) => {
    if (callbacks.isAborted()) return;
    const clamped = Math.max(highestPercent, Math.min(100, Math.round(rawPercent)));
    highestPercent = clamped;
    callbacks.onProgress?.(clamped, stageLabel);
  };

  // 1. Inspect & hydrate persisted player data safely (never resets or overwrites)
  report(4, 'Checking saved progress');
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
  report(14, 'Loading typography & key art');

  // 2. Load typography & preload key visual assets with real completion steps
  callbacks.onStage?.('assets');
  const totalImages = Math.max(1, options.keyArtSrcs.length);
  let loadedImages = 0;
  let fontsDone = false;

  const updateAssetProgress = () => {
    const fontWeight = fontsDone ? 8 : 0;
    const imageWeight = (loadedImages / totalImages) * 10;
    report(14 + fontWeight + imageWeight, 'Loading typography & key art');
  };

  await Promise.all([
    waitForFontsReady().then(() => {
      fontsDone = true;
      updateAssetProgress();
    }),
    ...options.keyArtSrcs.map((src) =>
      preloadImageAsset(src).then(() => {
        loadedImages += 1;
        updateAssetProgress();
      })
    ),
  ]);

  if (callbacks.isAborted()) {
    return { inspection, game: null };
  }

  // 3. Boot Phaser engine and track real PreloadScene texture generation batches
  report(34, 'Initializing graphics engine');
  callbacks.onStage?.('engine');
  let game: Phaser.Game | null = null;
  const readyPromise = waitForMainMenuReady(callbacks.isAborted, (ratio, stageLabel) => {
    const safeRatio = Number.isFinite(ratio) ? Math.max(0, Math.min(1, ratio)) : 0;
    report(42 + safeRatio * 54, stageLabel);
  });

  try {
    const { createPhaserGame } = await import('../PhaserGame');
    if (callbacks.isAborted()) {
      return { inspection, game: null };
    }
    report(42, 'Preparing game assets');
    game = createPhaserGame(options.parentId);
    await readyPromise;
  } catch {
    // Fallback: React UI remains operational even if WebGL/Canvas initialization fails
    await Promise.resolve();
  }

  if (callbacks.isAborted()) {
    return { inspection, game };
  }

  report(100, 'Ready');
  await waitMs(SETTLE_AT_100_MS);

  return { inspection, game };
}
