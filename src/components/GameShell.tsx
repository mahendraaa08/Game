import React, { useCallback, useEffect, useRef, useState } from 'react';
import type Phaser from 'phaser';
import titleKeyArt from '../assets/images/title_key_art_1794922504898.jpg';
import { ExchangeDirection } from '../game/config/EconomyConfig';
import { HudSnapshot, SceneId } from '../game/config/GameConfig';
import { SHIPS, ShipId } from '../game/config/ShipConfig';
import { WeaponId } from '../game/config/WeaponConfig';
import { SoundManager } from '../game/audio/SoundManager';
import { runStartupPipeline } from '../game/startup/StartupLoader';
import {
  ActionResult,
  ProgressionManager,
  computePlayerStats,
} from '../game/systems/ProgressionManager';
import {
  AppRoute,
  BossWarningPayload,
  EventBus,
  GameOverPayload,
  LevelResultPayload,
  LevelUpPayload,
  StartRunRequest,
  VictoryPayload,
} from '../game/utils/EventBus';
import {
  PlayerProgress,
  StorageHealthStatus,
  StorageInspectionResult,
  StorageManager,
} from '../game/utils/StorageManager';
import { DedicatedScreenShell } from './DedicatedScreenShell';
import { HudOverlay } from './HudOverlay';
import { ModeSelectorOverlay } from './ModeSelectorOverlay';
import {
  GameOverModal,
  LevelResultModal,
  PauseModal,
  VictoryModal,
} from './ModalOverlays';
import { LevelUpModal } from './ui/LevelUpModal';
import { TitleOverlay } from './TitleOverlay';
import { CodexPanel } from './codex/CodexPanel';
import { ArmoryDronesPanel } from './hub/ArmoryDronesPanel';
import { ExchangePanel } from './hub/ExchangePanel';
import { HangarShipsPanel } from './hub/HangarShipsPanel';
import { HangarSubNav, HangarTabRoute } from './hub/HangarSubNav';
import { MissionsAchievementsPanel } from './hub/MissionsAchievementsPanel';
import { SettingsPanel } from './hub/SettingsPanel';
import { WeaponsUpgradesPanel } from './hub/WeaponsUpgradesPanel';
import { GuestLoginScreen } from './startup/GuestLoginScreen';
import { LoadingScreen } from './startup/LoadingScreen';

const INITIAL_HUD: HudSnapshot = {
  hp: 100,
  maxHp: 100,
  shield: 60,
  maxShield: 60,
  score: 0,
  combo: 1,
  mode: 'campaign',
  modeLabel: 'S01',
  levelNumber: 1,
  levelName: 'EARTH DEFENSE',
  objective: '',
  waveIndex: 1,
  wavePhase: 1,
  totalWaves: 5,
  shipId: 'falcon_x',
  shipName: 'FALCON X',
  weaponId: 'plasma',
  weaponName: 'Plasma Cannon',
  weaponColor: '#38BDF8',
  weaponLevel: 1,
  allowedWeapons: null,
  specialId: 'emp_nova',
  specialName: 'EMP Nova',
  specialCooldownRatio: 1,
  specialCooldownLeftSec: 0,
  dashCooldownRatio: 1,
  dashCooldownLeftSec: 0,
  rapidFireLeftSec: 0,
  doubleDamageLeftSec: 0,
  invulnLeftSec: 0,
  bossActive: false,
  bossName: '',
  bossTitle: '',
  bossHp: 0,
  bossMaxHp: 1,
  bossPhase: 1,
  bossWidth: 160,
  bossHeight: 120,
  bossAgeSec: 0,
  bossEntering: false,
  bossWarningText: null,
  creditsEarnedRun: 0,
  crystalsEarnedRun: 0,
  challengeProgressText: null,
  challengeTimeLeftSec: null,
  bossRushIndex: 1,
  bossRushTotal: 5,
};

type PendingStart =
  | { kind: 'level'; levelNumber: number }
  | { kind: 'mode'; req: StartRunRequest };

type StartupStage = 'loading' | 'loading_exit' | 'guest_login' | 'guest_exit' | 'ready';

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

export const GameShell: React.FC = () => {
  const [sceneId, setSceneId] = useState<SceneId>('BootScene');
  const [startupStage, setStartupStage] = useState<StartupStage>('loading');
  const [storageStatus, setStorageStatus] = useState<StorageHealthStatus>('empty');

  const [routeStack, setRouteStack] = useState<AppRoute[]>(['menu']);
  const [progress, setProgress] = useState<PlayerProgress>(() => ({ ...StorageManager.load() }));
  const [feedback, setFeedback] = useState<ActionResult | null>(null);
  const [hud, setHud] = useState<HudSnapshot>(INITIAL_HUD);
  const [bossWarning, setBossWarning] = useState<BossWarningPayload | null>(null);
  const [levelResult, setLevelResult] = useState<LevelResultPayload | null>(null);
  const [gameOverData, setGameOverData] = useState<GameOverPayload | null>(null);
  const [victoryData, setVictoryData] = useState<VictoryPayload | null>(null);
  const [activeLevelUpModal, setActiveLevelUpModal] = useState<LevelUpPayload | null>(null);
  const [inspectedShipId, setInspectedShipId] = useState<ShipId>(progress.selectedShip);
  const [inspectedWeaponId, setInspectedWeaponId] = useState<WeaponId>(progress.selectedWeapon);
  const [exchangeDirection, setExchangeDirection] =
    useState<ExchangeDirection>('credits_to_gems');

  const toastTimerRef = useRef<number | null>(null);
  const engineReadyRef = useRef(false);
  const pendingHangarRef = useRef(false);
  const pendingStartRef = useRef<PendingStart | null>(null);
  const inspectionRef = useRef<StorageInspectionResult | null>(null);
  const guestTransitionTimerRef = useRef<number | null>(null);

  const showFeedback = useCallback((res: ActionResult) => {
    setFeedback(res);
    setProgress({ ...StorageManager.load() });
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setFeedback(null), 3200);
  }, []);

  const clearFeedback = useCallback(() => {
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
    setFeedback(null);
  }, []);

  const navigateTo = useCallback(
    (route: Exclude<AppRoute, 'menu'>) => {
      clearFeedback();
      if (route === 'ships') {
        const latest = StorageManager.load();
        setInspectedShipId(latest.selectedShip);
        setInspectedWeaponId(latest.selectedWeapon);
        setRouteStack(['menu', 'ships']);
        if (engineReadyRef.current) {
          EventBus.emit('ui:open-hangar');
        } else {
          pendingHangarRef.current = true;
        }
        return;
      }
      setRouteStack((prev) => {
        if (prev[prev.length - 1] === route) return prev;
        return [...prev, route];
      });
    },
    [clearFeedback]
  );

  const openExchange = useCallback(
    (dir: ExchangeDirection) => {
      setExchangeDirection(dir);
      navigateTo('exchange');
    },
    [navigateTo]
  );

  const replaceHangarTab = useCallback(
    (tab: HangarTabRoute) => {
      clearFeedback();
      setRouteStack((prev) => {
        const top = prev[prev.length - 1];
        if (top === tab) return prev;
        if (top === 'ships' || top === 'weapons' || top === 'armory') {
          return [...prev.slice(0, -1), tab];
        }
        return [...prev, tab];
      });
    },
    [clearFeedback]
  );

  const popRoute = useCallback(() => {
    clearFeedback();
    pendingHangarRef.current = false;
    pendingStartRef.current = null;
    setRouteStack((prev) => {
      if (prev.length <= 1) return ['menu'];
      const next = prev.slice(0, -1);
      if (next.length === 1 && next[0] === 'menu' && sceneId === 'HangarScene') {
        EventBus.emit('ui:open-menu');
      }
      return next;
    });
  }, [clearFeedback, sceneId]);

  useEffect(() => {
    let destroyed = false;
    let game: Phaser.Game | null = null;
    let flushingPendingStart = false;
    let exitTimer: number | null = null;

    const syncProgress = () => setProgress({ ...StorageManager.load() });

    const unsubs = [
      EventBus.on('ui:start-level', (levelNumber) => {
        if (!engineReadyRef.current && !flushingPendingStart) {
          pendingStartRef.current = { kind: 'level', levelNumber };
        }
      }),
      EventBus.on('ui:start-mode', (req) => {
        if (!engineReadyRef.current && !flushingPendingStart) {
          pendingStartRef.current = { kind: 'mode', req };
        }
      }),
      EventBus.on('scene:changed', (next) => {
        setSceneId(next);

        if (next === 'MainMenuScene') {
          engineReadyRef.current = true;
          syncProgress();

          const queuedStart = pendingStartRef.current;
          if (queuedStart) {
            pendingStartRef.current = null;
            pendingHangarRef.current = false;
            flushingPendingStart = true;
            try {
              if (queuedStart.kind === 'level') {
                EventBus.emit('ui:start-level', queuedStart.levelNumber);
              } else {
                EventBus.emit('ui:start-mode', queuedStart.req);
              }
            } finally {
              flushingPendingStart = false;
            }
            return;
          }

          if (pendingHangarRef.current) {
            pendingHangarRef.current = false;
            EventBus.emit('ui:open-hangar');
            return;
          }

          setRouteStack((prev) => {
            const top = prev[prev.length - 1];
            if (top === 'ships' || top === 'weapons' || top === 'armory') {
              return ['menu'];
            }
            return prev.length > 0 ? prev : ['menu'];
          });
        } else if (next === 'HangarScene') {
          engineReadyRef.current = true;
          syncProgress();
          setRouteStack((prev) => {
            const top = prev[prev.length - 1];
            if (top === 'ships' || top === 'weapons' || top === 'armory') {
              return prev;
            }
            return ['menu', 'ships'];
          });
        } else if (next !== 'BootScene' && next !== 'PreloadScene') {
          setRouteStack(['menu']);
        }
      }),
      EventBus.on('ui:navigate-route', (route) => {
        if (route === 'menu') {
          setRouteStack(['menu']);
          return;
        }
        if (route === 'ships') {
          setRouteStack(['menu', 'ships']);
          return;
        }
        setRouteStack((prev) => (prev[prev.length - 1] === route ? prev : [...prev, route]));
      }),
      EventBus.on('progress:updated', syncProgress),
      EventBus.on('ui:select-weapon', syncProgress),
      EventBus.on('ui:select-special', syncProgress),
      EventBus.on('player:leveled-up', syncProgress),
      EventBus.on('hud:update', (snap) => setHud(snap)),
      EventBus.on('boss:warning', (warn) => setBossWarning(warn)),
      EventBus.on('level:result', (res) => setLevelResult(res)),
      EventBus.on('game:over', (res) => setGameOverData(res)),
      EventBus.on('campaign:victory', (res) => setVictoryData(res)),
    ];

    void runStartupPipeline(
      {
        parentId: 'phaser-root',
        keyArtSrcs: [titleKeyArt],
      },
      {
        isAborted: () => destroyed,
        onStage: (stage) => {
          if (destroyed) return;
          if (stage === 'storage') {
            const loaded = StorageManager.load();
            setProgress({ ...loaded });
            setInspectedShipId(loaded.selectedShip);
            setInspectedWeaponId(loaded.selectedWeapon);
          }
        },
      }
    ).then((result) => {
      if (destroyed) {
        result.game?.destroy(true);
        return;
      }
      game = result.game;
      inspectionRef.current = result.inspection;
      setStorageStatus(result.inspection.status);
      syncProgress();

      const exitMs = prefersReducedMotion() ? 10 : 420;
      setStartupStage('loading_exit');
      exitTimer = window.setTimeout(() => {
        if (destroyed) return;
        const latestInspection = inspectionRef.current ?? StorageManager.inspectSavedState();
        setStorageStatus(latestInspection.status);
        if (latestInspection.hasConfirmedGuestSession) {
          setStartupStage('ready');
          SoundManager.playMusic('menu');
        } else {
          setStartupStage('guest_login');
        }
      }, exitMs);
    });

    return () => {
      destroyed = true;
      if (exitTimer) window.clearTimeout(exitTimer);
      if (guestTransitionTimerRef.current) window.clearTimeout(guestTransitionTimerRef.current);
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
      unsubs.forEach((u) => u());
      SoundManager.playMusic('none');
      game?.destroy(true);
    };
  }, []);

  const transitionFromGuestToMenu = useCallback(() => {
    const exitMs = prefersReducedMotion() ? 10 : 260;
    setStartupStage('guest_exit');
    if (guestTransitionTimerRef.current) {
      window.clearTimeout(guestTransitionTimerRef.current);
    }
    guestTransitionTimerRef.current = window.setTimeout(() => {
      setStartupStage('ready');
    }, exitMs);
  }, []);

  const handleConfirmGuestMode = useCallback(() => {
    const confirmed = StorageManager.confirmGuestMode();
    inspectionRef.current = {
      status: 'ready',
      hasConfirmedGuestSession: true,
      storageAvailable: true,
    };
    setStorageStatus('ready');
    setProgress({ ...confirmed });
    setInspectedShipId(confirmed.selectedShip);
    setInspectedWeaponId(confirmed.selectedWeapon);
    SoundManager.syncSettings(confirmed.settings);
    SoundManager.unlock();
    SoundManager.playMusic('menu');
    EventBus.emit('progress:updated');
    transitionFromGuestToMenu();
  }, [transitionFromGuestToMenu]);

  const handleRetryCorruptedLoad = useCallback((): boolean => {
    const { inspection, progress: reloaded } = StorageManager.retryLoadSavedState();
    inspectionRef.current = inspection;
    setStorageStatus(inspection.status);
    if (inspection.hasConfirmedGuestSession) {
      setProgress({ ...reloaded });
      setInspectedShipId(reloaded.selectedShip);
      setInspectedWeaponId(reloaded.selectedWeapon);
      SoundManager.syncSettings(reloaded.settings);
      SoundManager.unlock();
      SoundManager.playMusic('menu');
      EventBus.emit('progress:updated');
      transitionFromGuestToMenu();
      return true;
    }
    return false;
  }, [transitionFromGuestToMenu]);

  const activeRoute: AppRoute = routeStack[routeStack.length - 1] ?? 'menu';
  const isStartupDone = startupStage === 'ready';

  // Display Level-Up popup exclusively after returning to Main Menu and consume once so it never repeats
  useEffect(() => {
    if (isStartupDone && sceneId === 'MainMenuScene' && activeRoute === 'menu' && progress.pendingLevelUp) {
      const consumed = ProgressionManager.consumePendingLevelUp();
      if (consumed) {
        setActiveLevelUpModal((existing) =>
          existing
            ? {
                previousLevel: Math.min(existing.previousLevel, consumed.previousLevel),
                newLevel: Math.max(existing.newLevel, consumed.newLevel),
                creditsGranted: existing.creditsGranted + consumed.creditsGranted,
                crystalsGranted: existing.crystalsGranted + consumed.crystalsGranted,
                steps: [...(existing.steps ?? []), ...(consumed.steps ?? [])],
              }
            : consumed
        );
      }
    }
  }, [isStartupDone, sceneId, activeRoute, progress.pendingLevelUp]);
  const prevRoute: AppRoute = routeStack[routeStack.length - 2] ?? 'menu';
  const isNonCombatUiScene =
    sceneId === 'MainMenuScene' ||
    sceneId === 'HangarScene' ||
    sceneId === 'BootScene' ||
    sceneId === 'PreloadScene';
  const backTargetLabel =
    prevRoute === 'modes'
      ? 'Game Modes'
      : prevRoute === 'ships' || prevRoute === 'weapons' || prevRoute === 'armory'
      ? 'Hangar'
      : prevRoute === 'missions'
      ? 'Missions'
      : prevRoute === 'codex'
      ? 'Codex'
      : 'Main Menu';

  const activeShip = SHIPS[progress.selectedShip] ?? SHIPS.falcon_x;
  const computed = computePlayerStats(progress);
  const shipSummary = `${activeShip.name} · HP ${computed.maxHp} · SHD ${computed.maxShield} · DMG ${Math.round(computed.damageMult * 100)}%`;

  return (
    <main className="relative h-[100dvh] w-screen overflow-hidden bg-[#040711]">
      {/* Isolated Phaser Canvas Container */}
      <div id="phaser-root" className="absolute inset-0 h-full w-full" />

      {/* Startup Loading Screen (Always shown on initial load & reload for >=4s & real init) */}
      {(startupStage === 'loading' || startupStage === 'loading_exit') && (
        <LoadingScreen exiting={startupStage === 'loading_exit'} />
      )}

      {/* First-Time Guest Login Card (Shown only when no confirmed progress exists) */}
      {(startupStage === 'guest_login' || startupStage === 'guest_exit') && (
        <GuestLoginScreen
          storageStatus={storageStatus}
          exiting={startupStage === 'guest_exit'}
          onConfirmGuest={handleConfirmGuestMode}
          onRetryLoad={handleRetryCorruptedLoad}
        />
      )}

      {/* Dedicated Non-Combat Screens (Stack-Driven Navigation) */}
      {isStartupDone && isNonCombatUiScene && activeRoute === 'menu' && (
        <TitleOverlay
          progress={progress}
          isActive={isStartupDone && isNonCombatUiScene && activeRoute === 'menu'}
          onNavigate={navigateTo}
          onOpenExchange={openExchange}
          feedback={feedback}
          onFeedback={showFeedback}
        />
      )}

      {isStartupDone && isNonCombatUiScene && activeRoute === 'modes' && (
        <ModeSelectorOverlay
          progress={progress}
          onBack={popRoute}
        />
      )}

      {isStartupDone && isNonCombatUiScene && activeRoute === 'ships' && (
        <DedicatedScreenShell
          title="Hangar & Upgrades"
          subtitle={shipSummary}
          backLabel={backTargetLabel}
          onBack={popRoute}
          credits={progress.credits}
          crystals={progress.crystals}
          onOpenExchange={openExchange}
          subNav={
            <HangarSubNav activeTab="ships" onSelectTab={replaceHangarTab} progress={progress} />
          }
          feedback={feedback}
          translucent={sceneId === 'HangarScene'}
        >
          <HangarShipsPanel
            progress={progress}
            onFeedback={showFeedback}
            inspectedShipId={inspectedShipId}
            onInspectShip={setInspectedShipId}
          />
        </DedicatedScreenShell>
      )}

      {isStartupDone && isNonCombatUiScene && activeRoute === 'weapons' && (
        <DedicatedScreenShell
          title="Hangar & Upgrades"
          subtitle={shipSummary}
          backLabel={backTargetLabel}
          onBack={popRoute}
          credits={progress.credits}
          crystals={progress.crystals}
          onOpenExchange={openExchange}
          subNav={
            <HangarSubNav activeTab="weapons" onSelectTab={replaceHangarTab} progress={progress} />
          }
          feedback={feedback}
          translucent={sceneId === 'HangarScene'}
        >
          <WeaponsUpgradesPanel
            progress={progress}
            onFeedback={showFeedback}
            inspectedWeaponId={inspectedWeaponId}
            onInspectWeapon={setInspectedWeaponId}
          />
        </DedicatedScreenShell>
      )}

      {isStartupDone && isNonCombatUiScene && activeRoute === 'armory' && (
        <DedicatedScreenShell
          title="Hangar & Upgrades"
          subtitle="Equipment Gear · Companion Drones"
          backLabel={backTargetLabel}
          onBack={popRoute}
          credits={progress.credits}
          crystals={progress.crystals}
          onOpenExchange={openExchange}
          subNav={
            <HangarSubNav activeTab="armory" onSelectTab={replaceHangarTab} progress={progress} />
          }
          feedback={feedback}
          translucent={sceneId === 'HangarScene'}
        >
          <ArmoryDronesPanel progress={progress} onFeedback={showFeedback} />
        </DedicatedScreenShell>
      )}

      {isStartupDone && isNonCombatUiScene && activeRoute === 'missions' && (
        <DedicatedScreenShell
          title="Missions & Medals"
          subtitle="Daily Directives · Weekly Challenges · Achievements & Medals"
          backLabel={backTargetLabel}
          onBack={popRoute}
          credits={progress.credits}
          crystals={progress.crystals}
          onOpenExchange={openExchange}
          feedback={feedback}
        >
          <MissionsAchievementsPanel progress={progress} onFeedback={showFeedback} />
        </DedicatedScreenShell>
      )}

      {isStartupDone && isNonCombatUiScene && activeRoute === 'codex' && (
        <DedicatedScreenShell
          title="Codex"
          subtitle="Galactic Encyclopedia · Aircraft, Arsenal & Hostile Intel"
          backLabel={backTargetLabel}
          onBack={popRoute}
          showCurrencies={false}
          maxWidthClass="max-w-6xl"
        >
          <CodexPanel />
        </DedicatedScreenShell>
      )}

      {isStartupDone && isNonCombatUiScene && activeRoute === 'exchange' && (
        <DedicatedScreenShell
          title="Exchange"
          subtitle="Vault Currency Terminal · Convert Credits & Void Gems"
          backLabel={backTargetLabel}
          onBack={popRoute}
          credits={progress.credits}
          crystals={progress.crystals}
          feedback={feedback}
          maxWidthClass="max-w-3xl"
        >
          <ExchangePanel
            progress={progress}
            initialDirection={exchangeDirection}
            onFeedback={showFeedback}
          />
        </DedicatedScreenShell>
      )}

      {isStartupDone && isNonCombatUiScene && activeRoute === 'settings' && (
        <DedicatedScreenShell
          title="Settings"
          subtitle="Audio Mixer · Touch Flight Controls · Visual Quality & Display"
          backLabel={backTargetLabel}
          onBack={popRoute}
          showCurrencies={false}
          feedback={feedback}
          maxWidthClass="max-w-5xl"
        >
          <SettingsPanel onFeedback={showFeedback} />
        </DedicatedScreenShell>
      )}

      {/* Active Gameplay HUD & Combat Modals */}
      {isStartupDone && (sceneId === 'GameScene' || sceneId === 'BossScene' || sceneId === 'PauseMenuScene') && (
        <HudOverlay
          hud={hud}
          bossWarning={bossWarning}
          isPaused={sceneId === 'PauseMenuScene'}
        />
      )}
      {isStartupDone && sceneId === 'PauseMenuScene' && <PauseModal />}
      {isStartupDone && sceneId === 'LevelResultScene' && levelResult && (
        <LevelResultModal data={levelResult} />
      )}
      {isStartupDone && sceneId === 'GameOverScene' && gameOverData && (
        <GameOverModal data={gameOverData} />
      )}
      {isStartupDone && sceneId === 'VictoryScene' && victoryData && (
        <VictoryModal data={victoryData} />
      )}

      {/* Level-Up Celebration Popup (Shown cleanly outside active combat) */}
      {isStartupDone && activeLevelUpModal && (
        <LevelUpModal
          data={activeLevelUpModal}
          onClose={() => setActiveLevelUpModal(null)}
        />
      )}
    </main>
  );
};
