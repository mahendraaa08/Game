import React, { useCallback, useEffect, useRef, useState } from 'react';
import type Phaser from 'phaser';
import { HudSnapshot, SceneId } from '../game/config/GameConfig';
import { SHIPS, ShipId } from '../game/config/ShipConfig';
import { WeaponId } from '../game/config/WeaponConfig';
import { SoundManager } from '../game/audio/SoundManager';
import { ActionResult, computePlayerStats } from '../game/systems/ProgressionManager';
import {
  AppRoute,
  BossWarningPayload,
  EventBus,
  GameOverPayload,
  LevelResultPayload,
  StartRunRequest,
  VictoryPayload,
} from '../game/utils/EventBus';
import { PlayerProgress, StorageManager } from '../game/utils/StorageManager';
import { DedicatedScreenShell } from './DedicatedScreenShell';
import { HudOverlay } from './HudOverlay';
import { ModeSelectorOverlay } from './ModeSelectorOverlay';
import {
  GameOverModal,
  LevelResultModal,
  PauseModal,
  VictoryModal,
} from './ModalOverlays';
import { TitleOverlay } from './TitleOverlay';
import { CodexPanel } from './codex/CodexPanel';
import { ArmoryDronesPanel } from './hub/ArmoryDronesPanel';
import { HangarShipsPanel } from './hub/HangarShipsPanel';
import { HangarSubNav, HangarTabRoute } from './hub/HangarSubNav';
import { MissionsAchievementsPanel } from './hub/MissionsAchievementsPanel';
import { SettingsPanel } from './hub/SettingsPanel';
import { WeaponsUpgradesPanel } from './hub/WeaponsUpgradesPanel';

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
  totalWaves: 3,
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

export const GameShell: React.FC = () => {
  const [sceneId, setSceneId] = useState<SceneId>('BootScene');
  const [routeStack, setRouteStack] = useState<AppRoute[]>(['menu']);
  const [progress, setProgress] = useState<PlayerProgress>(() => ({ ...StorageManager.load() }));
  const [feedback, setFeedback] = useState<ActionResult | null>(null);
  const [hud, setHud] = useState<HudSnapshot>(INITIAL_HUD);
  const [bossWarning, setBossWarning] = useState<BossWarningPayload | null>(null);
  const [levelResult, setLevelResult] = useState<LevelResultPayload | null>(null);
  const [gameOverData, setGameOverData] = useState<GameOverPayload | null>(null);
  const [victoryData, setVictoryData] = useState<VictoryPayload | null>(null);
  const [inspectedShipId, setInspectedShipId] = useState<ShipId>(progress.selectedShip);
  const [inspectedWeaponId, setInspectedWeaponId] = useState<WeaponId>(progress.selectedWeapon);

  const toastTimerRef = useRef<number | null>(null);
  const engineReadyRef = useRef(false);
  const pendingHangarRef = useRef(false);
  const pendingStartRef = useRef<PendingStart | null>(null);

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
      EventBus.on('hud:update', (snap) => setHud(snap)),
      EventBus.on('boss:warning', (warn) => setBossWarning(warn)),
      EventBus.on('level:result', (res) => setLevelResult(res)),
      EventBus.on('game:over', (res) => setGameOverData(res)),
      EventBus.on('campaign:victory', (res) => setVictoryData(res)),
    ];

    // Load Phaser asynchronously after React paints Main Menu UI so Preview never hangs on heavy bundle eval
    import('../game/PhaserGame')
      .then(({ createPhaserGame }) => {
        if (destroyed) return;
        game = createPhaserGame('phaser-root');
      })
      .catch(() => {
        // React UI remains responsive even if canvas/WebGL backend fails to initialize
      });

    return () => {
      destroyed = true;
      unsubs.forEach((u) => u());
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
      SoundManager.playMusic('none');
      game?.destroy(true);
    };
  }, []);

  const activeRoute: AppRoute = routeStack[routeStack.length - 1] ?? 'menu';
  const prevRoute: AppRoute = routeStack[routeStack.length - 2] ?? 'menu';
  const isNonCombatUiScene =
    sceneId === 'MainMenuScene' ||
    sceneId === 'HangarScene' ||
    sceneId === 'BootScene' ||
    sceneId === 'PreloadScene';
  const backTargetLabel =
    prevRoute === 'modes'
      ? 'Game Modes'
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

      {/* Dedicated Non-Combat Screens (Stack-Driven Navigation) */}
      {isNonCombatUiScene && activeRoute === 'menu' && (
        <TitleOverlay
          progress={progress}
          isActive={isNonCombatUiScene && activeRoute === 'menu'}
          onNavigate={navigateTo}
        />
      )}

      {isNonCombatUiScene && activeRoute === 'modes' && (
        <ModeSelectorOverlay
          progress={progress}
          onBack={popRoute}
        />
      )}

      {isNonCombatUiScene && activeRoute === 'ships' && (
        <DedicatedScreenShell
          title="Hangar & Upgrades"
          subtitle={shipSummary}
          backLabel={backTargetLabel}
          onBack={popRoute}
          credits={progress.credits}
          crystals={progress.crystals}
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

      {isNonCombatUiScene && activeRoute === 'weapons' && (
        <DedicatedScreenShell
          title="Hangar & Upgrades"
          subtitle={shipSummary}
          backLabel={backTargetLabel}
          onBack={popRoute}
          credits={progress.credits}
          crystals={progress.crystals}
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

      {isNonCombatUiScene && activeRoute === 'armory' && (
        <DedicatedScreenShell
          title="Hangar & Upgrades"
          subtitle="Equipment Gear · Companion Drones"
          backLabel={backTargetLabel}
          onBack={popRoute}
          credits={progress.credits}
          crystals={progress.crystals}
          subNav={
            <HangarSubNav activeTab="armory" onSelectTab={replaceHangarTab} progress={progress} />
          }
          feedback={feedback}
          translucent={sceneId === 'HangarScene'}
        >
          <ArmoryDronesPanel progress={progress} onFeedback={showFeedback} />
        </DedicatedScreenShell>
      )}

      {isNonCombatUiScene && activeRoute === 'missions' && (
        <DedicatedScreenShell
          title="Missions & Medals"
          subtitle="Daily Directives · Weekly Challenges · Achievements & Medals"
          backLabel={backTargetLabel}
          onBack={popRoute}
          credits={progress.credits}
          crystals={progress.crystals}
          feedback={feedback}
        >
          <MissionsAchievementsPanel progress={progress} onFeedback={showFeedback} />
        </DedicatedScreenShell>
      )}

      {isNonCombatUiScene && activeRoute === 'codex' && (
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

      {isNonCombatUiScene && activeRoute === 'settings' && (
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
      {(sceneId === 'GameScene' || sceneId === 'BossScene' || sceneId === 'PauseMenuScene') && (
        <HudOverlay
          hud={hud}
          bossWarning={bossWarning}
          isPaused={sceneId === 'PauseMenuScene'}
        />
      )}
      {sceneId === 'PauseMenuScene' && <PauseModal />}
      {sceneId === 'LevelResultScene' && levelResult && (
        <LevelResultModal data={levelResult} />
      )}
      {sceneId === 'GameOverScene' && gameOverData && (
        <GameOverModal data={gameOverData} />
      )}
      {sceneId === 'VictoryScene' && victoryData && (
        <VictoryModal data={victoryData} />
      )}
    </main>
  );
};
