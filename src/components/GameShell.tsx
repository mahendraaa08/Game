import React, { useCallback, useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { HudSnapshot, SceneId } from '../game/config/GameConfig';
import { SHIPS } from '../game/config/ShipConfig';
import { createPhaserGame } from '../game/PhaserGame';
import { ActionResult, computePlayerStats } from '../game/systems/ProgressionManager';
import {
  AppRoute,
  EventBus,
  GameOverPayload,
  LevelResultPayload,
  VictoryPayload,
} from '../game/utils/EventBus';
import { PlayerProgress, StorageManager } from '../game/utils/StorageManager';
import { DedicatedScreenShell } from './DedicatedScreenShell';
import { HangarHubScreen } from './HangarHubScreen';
import { HudOverlay } from './HudOverlay';
import { ModeSelectorOverlay } from './ModeSelectorOverlay';
import {
  GameOverModal,
  LevelResultModal,
  PauseModal,
  VictoryModal,
} from './ModalOverlays';
import { TitleOverlay } from './TitleOverlay';
import { ArmoryDronesPanel } from './hub/ArmoryDronesPanel';
import { CodexPanel } from './hub/CodexPanel';
import { HangarShipsPanel } from './hub/HangarShipsPanel';
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
  bossWarningText: null,
  creditsEarnedRun: 0,
  crystalsEarnedRun: 0,
  challengeProgressText: null,
  challengeTimeLeftSec: null,
  bossRushIndex: 1,
  bossRushTotal: 5,
};

export const GameShell: React.FC = () => {
  const [sceneId, setSceneId] = useState<SceneId>('BootScene');
  const [routeStack, setRouteStack] = useState<AppRoute[]>(['menu']);
  const [progress, setProgress] = useState<PlayerProgress>(() => ({ ...StorageManager.load() }));
  const [feedback, setFeedback] = useState<ActionResult | null>(null);
  const [hud, setHud] = useState<HudSnapshot>(INITIAL_HUD);
  const [bossWarning, setBossWarning] = useState<{ name: string; title: string } | null>(null);
  const [levelResult, setLevelResult] = useState<LevelResultPayload | null>(null);
  const [gameOverData, setGameOverData] = useState<GameOverPayload | null>(null);
  const [victoryData, setVictoryData] = useState<VictoryPayload | null>(null);
  const toastTimerRef = useRef<number | null>(null);

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
      if (route === 'hangar_hub') {
        setRouteStack(['menu', 'hangar_hub']);
        EventBus.emit('ui:open-hangar');
        return;
      }
      setRouteStack((prev) => {
        if (prev[prev.length - 1] === route) return prev;
        return [...prev, route];
      });
    },
    [clearFeedback]
  );

  const popRoute = useCallback(() => {
    clearFeedback();
    setRouteStack((prev) => {
      if (prev.length <= 1) return ['menu'];
      const current = prev[prev.length - 1];
      if (current === 'hangar_hub' && sceneId === 'HangarScene') {
        EventBus.emit('ui:open-menu');
        return ['menu'];
      }
      const next = prev.slice(0, -1);
      if (next.length === 1 && next[0] === 'menu' && sceneId === 'HangarScene') {
        EventBus.emit('ui:open-menu');
      }
      return next;
    });
  }, [clearFeedback, sceneId]);

  const returnToMainMenu = useCallback(() => {
    clearFeedback();
    setRouteStack(['menu']);
    if (sceneId === 'HangarScene') {
      EventBus.emit('ui:open-menu');
    }
  }, [clearFeedback, sceneId]);

  useEffect(() => {
    const game: Phaser.Game = createPhaserGame('phaser-root');

    const syncProgress = () => setProgress({ ...StorageManager.load() });

    const unsubs = [
      EventBus.on('scene:changed', (next) => {
        setSceneId(next);
        if (next === 'MainMenuScene') {
          syncProgress();
          setRouteStack((prev) => {
            const top = prev[prev.length - 1];
            if (
              top === 'hangar_hub' ||
              top === 'ships' ||
              top === 'weapons' ||
              top === 'codex'
            ) {
              return ['menu'];
            }
            return prev.length > 0 ? prev : ['menu'];
          });
        } else if (next === 'HangarScene') {
          syncProgress();
          setRouteStack((prev) => {
            const top = prev[prev.length - 1];
            if (
              top === 'hangar_hub' ||
              top === 'ships' ||
              top === 'weapons' ||
              top === 'armory' ||
              top === 'codex'
            ) {
              return prev;
            }
            return ['menu', 'hangar_hub'];
          });
        } else {
          setRouteStack(['menu']);
        }
      }),
      EventBus.on('ui:navigate-route', (route) => {
        if (route === 'menu') {
          setRouteStack(['menu']);
          return;
        }
        if (route === 'hangar_hub') {
          setRouteStack(['menu', 'hangar_hub']);
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

    return () => {
      unsubs.forEach((u) => u());
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
      game.destroy(true);
    };
  }, []);

  const activeRoute: AppRoute = routeStack[routeStack.length - 1] ?? 'menu';
  const prevRoute: AppRoute = routeStack[routeStack.length - 2] ?? 'menu';
  const isMenuOrHangarScene = sceneId === 'MainMenuScene' || sceneId === 'HangarScene';
  const backTargetLabel = prevRoute === 'hangar_hub' ? 'Hangar Hub' : prevRoute === 'modes' ? 'Game Modes' : 'Main Menu';

  const activeShip = SHIPS[progress.selectedShip] ?? SHIPS.falcon_x;
  const computed = computePlayerStats(progress);
  const shipSummary = `${activeShip.name} · HP ${computed.maxHp} · SHD ${computed.maxShield} · DMG ${Math.round(computed.damageMult * 100)}%`;

  return (
    <main className="relative h-[100dvh] w-screen overflow-hidden bg-[#040711]">
      {/* Isolated Phaser Canvas Container */}
      <div id="phaser-root" className="absolute inset-0 h-full w-full" />

      {/* Dedicated Non-Combat Screens (Stack-Driven Navigation) */}
      {isMenuOrHangarScene && activeRoute === 'menu' && (
        <TitleOverlay
          progress={progress}
          isActive={sceneId === 'MainMenuScene' && activeRoute === 'menu'}
          onNavigate={navigateTo}
        />
      )}

      {isMenuOrHangarScene && activeRoute === 'modes' && (
        <ModeSelectorOverlay
          progress={progress}
          onBack={popRoute}
          onOpenArmory={() => navigateTo('armory')}
        />
      )}

      {isMenuOrHangarScene && activeRoute === 'hangar_hub' && (
        <HangarHubScreen
          progress={progress}
          onBackToMenu={returnToMainMenu}
          onSelectSection={(section) => navigateTo(section)}
        />
      )}

      {isMenuOrHangarScene && activeRoute === 'ships' && (
        <DedicatedScreenShell
          title="Hangar & Ships"
          subtitle={shipSummary}
          backLabel={backTargetLabel}
          onBack={popRoute}
          credits={progress.credits}
          crystals={progress.crystals}
          onCurrencyClick={() => navigateTo('armory')}
          feedback={feedback}
          translucent={sceneId === 'HangarScene'}
        >
          <HangarShipsPanel progress={progress} onFeedback={showFeedback} />
        </DedicatedScreenShell>
      )}

      {isMenuOrHangarScene && activeRoute === 'weapons' && (
        <DedicatedScreenShell
          title="Weapons & Upgrades"
          subtitle={shipSummary}
          backLabel={backTargetLabel}
          onBack={popRoute}
          credits={progress.credits}
          crystals={progress.crystals}
          onCurrencyClick={() => navigateTo('armory')}
          feedback={feedback}
          translucent={sceneId === 'HangarScene'}
        >
          <WeaponsUpgradesPanel progress={progress} onFeedback={showFeedback} />
        </DedicatedScreenShell>
      )}

      {isMenuOrHangarScene && activeRoute === 'armory' && (
        <DedicatedScreenShell
          title="Armory & Supply"
          subtitle="Companion Drones · Equipment Slots · Crystal Supply Exchange"
          backLabel={backTargetLabel}
          onBack={popRoute}
          credits={progress.credits}
          crystals={progress.crystals}
          feedback={feedback}
          translucent={sceneId === 'HangarScene'}
        >
          <ArmoryDronesPanel progress={progress} onFeedback={showFeedback} />
        </DedicatedScreenShell>
      )}

      {isMenuOrHangarScene && activeRoute === 'codex' && (
        <DedicatedScreenShell
          title="Galactic Codex"
          subtitle="Enemy Telemetry · Void Commanders · Fleet & Campaign Records"
          backLabel={backTargetLabel}
          onBack={popRoute}
          credits={progress.credits}
          crystals={progress.crystals}
          onCurrencyClick={() => navigateTo('armory')}
          translucent={sceneId === 'HangarScene'}
        >
          <CodexPanel progress={progress} />
        </DedicatedScreenShell>
      )}

      {isMenuOrHangarScene && activeRoute === 'missions' && (
        <DedicatedScreenShell
          title="Missions & Medals"
          subtitle="Daily Directives · Weekly Challenges · Achievements & Medals"
          backLabel={backTargetLabel}
          onBack={popRoute}
          credits={progress.credits}
          crystals={progress.crystals}
          onCurrencyClick={() => navigateTo('armory')}
          feedback={feedback}
        >
          <MissionsAchievementsPanel progress={progress} onFeedback={showFeedback} />
        </DedicatedScreenShell>
      )}

      {isMenuOrHangarScene && activeRoute === 'settings' && (
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
      {(sceneId === 'GameScene' || sceneId === 'BossScene') && (
        <HudOverlay hud={hud} bossWarning={bossWarning} />
      )}
      {sceneId === 'PauseMenuScene' && (
        <>
          <HudOverlay hud={hud} bossWarning={null} isPaused />
          <PauseModal />
        </>
      )}
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
