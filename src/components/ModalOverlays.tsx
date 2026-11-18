import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Home,
  LogOut,
  Play,
  RotateCcw,
  Settings,
  Trophy,
  Wrench,
} from 'lucide-react';
import { SoundManager } from '../game/audio/SoundManager';
import { ActionResult } from '../game/systems/ProgressionManager';
import {
  EventBus,
  GameOverPayload,
  LevelResultPayload,
  VictoryPayload,
} from '../game/utils/EventBus';
import { StorageManager } from '../game/utils/StorageManager';
import { DedicatedScreenShell } from './DedicatedScreenShell';
import { SettingsPanel } from './hub/SettingsPanel';
import { ConfirmButtonPair } from './ui/ConfirmButtonPair';
import { CreditsBadge, CrystalsBadge } from './ui/CurrencyBadges';

type PauseView = 'pause' | 'settings' | 'confirm_exit';

export const PauseModal: React.FC = () => {
  const [view, setView] = useState<PauseView>('pause');
  const [feedback, setFeedback] = useState<ActionResult | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const escReadyRef = useRef(false);
  const lowFx = StorageManager.load().settings.fxQuality === 'low';

  const showFeedback = useCallback((res: ActionResult) => {
    setFeedback(res);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setFeedback(null), 2800);
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => {
      escReadyRef.current = true;
    }, 140);
    return () => {
      window.clearTimeout(t);
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.repeat || !escReadyRef.current) return;
      e.preventDefault();
      if (view === 'settings' || view === 'confirm_exit') {
        SoundManager.playButtonClick();
        setView('pause');
      } else {
        SoundManager.playButtonClick();
        EventBus.emit('ui:resume-game');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [view]);

  if (view === 'settings') {
    return (
      <DedicatedScreenShell
        title="Settings"
        subtitle="Audio Mixer · Touch Flight Controls · Visual Quality & Display"
        backLabel="Pause Menu"
        onBack={() => {
          setFeedback(null);
          setView('pause');
        }}
        showCurrencies={false}
        feedback={feedback}
        maxWidthClass="max-w-5xl"
      >
        <SettingsPanel onFeedback={showFeedback} />
      </DedicatedScreenShell>
    );
  }

  const backdropStyle: React.CSSProperties = {
    backgroundImage:
      'radial-gradient(circle at center, rgba(6, 14, 32, 0.12) 0%, rgba(2, 5, 14, 0.64) 100%)',
  };
  const backdropBlurClass = lowFx ? 'bg-[#030712]/62' : 'bg-[#030712]/48 backdrop-blur-[2px]';

  if (view === 'confirm_exit') {
    return (
      <div
        style={backdropStyle}
        className={`scroll-panel absolute inset-0 z-30 flex items-center justify-center overflow-y-auto p-4 ${backdropBlurClass}`}
      >
        <div className="pause-panel-enter relative my-auto w-full max-w-sm rounded-2xl border border-rose-400/30 bg-[#0b101d]/94 p-6 shadow-xl shadow-black/50">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl border border-rose-400/25 bg-rose-500/10">
            <AlertTriangle className="h-5 w-5 text-rose-400" />
          </div>

          <h2 className="mt-4 text-center font-display text-xl font-bold tracking-wide text-white">
            EXIT CURRENT MISSION?
          </h2>
          <p className="mt-2 text-center text-xs sm:text-sm leading-relaxed text-slate-300">
            Your current mission will end. Are you sure you want to return to the Main Menu?
          </p>
          <p className="mt-2 text-center text-[11px] text-slate-400">
            Enemy kills and mission counters are saved without sector clear rewards.
          </p>

          <ConfirmButtonPair
            className="mt-6 grid grid-cols-2 gap-3"
            onCancel={() => {
              SoundManager.playButtonClick();
              setView('pause');
            }}
            onConfirm={() => {
              SoundManager.playButtonClick();
              EventBus.emit('ui:abort-mission');
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      style={backdropStyle}
      className={`scroll-panel absolute inset-0 z-30 flex items-center justify-center overflow-y-auto p-5 ${backdropBlurClass}`}
    >
      <div className="pause-panel-enter relative my-auto w-full max-w-[324px] sm:max-w-[360px] rounded-2xl border border-cyan-300/20 bg-[#08101d]/92 p-6 sm:p-7 shadow-xl shadow-black/45">
        <div className="text-center">
          <h2 className="font-display text-2xl sm:text-[26px] font-bold tracking-[0.12em] text-white">
            GAME PAUSED
          </h2>
          <p className="mt-1 font-mono-num text-[10.5px] font-medium tracking-[0.16em] text-slate-400">
            COMBAT SYSTEMS ON STANDBY
          </p>
          <div className="mt-4 h-px w-full bg-gradient-to-r from-transparent via-slate-700/80 to-transparent" />
        </div>

        <nav aria-label="Pause Menu" className="mt-5 flex flex-col gap-3">
          {/* 1. RESUME */}
          <button
            type="button"
            onClick={() => {
              SoundManager.unlock();
              SoundManager.playButtonClick();
              EventBus.emit('ui:resume-game');
            }}
            className="flex min-h-[48px] w-full items-center justify-center gap-2.5 rounded-xl border border-sky-300/40 bg-sky-400 px-5 py-2.5 font-display text-sm sm:text-base font-bold tracking-[0.12em] text-slate-950 transition-[background-color,transform] duration-150 hover:bg-sky-300 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-cyan-300"
          >
            <Play className="h-4 w-4 fill-current" />
            <span>RESUME</span>
          </button>

          {/* 2. SETTINGS */}
          <button
            type="button"
            onClick={() => {
              SoundManager.unlock();
              SoundManager.playButtonClick();
              setView('settings');
            }}
            className="flex min-h-[48px] w-full items-center justify-center gap-2.5 rounded-xl border border-slate-700/75 bg-[#0e1726]/90 px-5 py-2.5 font-display text-sm sm:text-base font-semibold tracking-[0.1em] text-slate-100 transition-[border-color,background-color,transform] duration-150 hover:border-cyan-300/45 hover:bg-[#142136] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-cyan-400"
          >
            <Settings className="h-4 w-4 text-cyan-300" />
            <span>SETTINGS</span>
          </button>

          {/* 3. EXIT */}
          <button
            type="button"
            onClick={() => {
              SoundManager.playButtonClick();
              setView('confirm_exit');
            }}
            className="flex min-h-[48px] w-full items-center justify-center gap-2.5 rounded-xl border border-rose-400/25 bg-[#191019]/88 px-5 py-2.5 font-display text-sm sm:text-base font-semibold tracking-[0.1em] text-rose-200 transition-[border-color,background-color,transform] duration-150 hover:border-rose-400/50 hover:bg-[#241524] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-rose-400"
          >
            <LogOut className="h-4 w-4 text-rose-400" />
            <span>EXIT</span>
          </button>
        </nav>
      </div>
    </div>
  );
};

export const LevelResultModal: React.FC<{ data: LevelResultPayload }> = ({ data }) => (
  <div className="scroll-panel absolute inset-0 z-30 flex items-center justify-center overflow-y-auto bg-[#040711]/82 p-4 backdrop-blur-sm">
    <div className="scroll-panel menu-enter my-auto max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl border border-sky-400/45 bg-[#081022]/96 p-6 sm:p-7 shadow-2xl">
      <div className="text-xs font-semibold text-sky-400">
        {data.mode === 'challenge'
          ? 'Challenge Trial Cleared'
          : `Sector ${String(data.levelNumber).padStart(2, '0')} Cleared`}
      </div>
      <h2 className="mt-1 font-display text-3xl font-bold text-white">{data.levelName}</h2>
      {data.bossDefeatedName && (
        <p className="mt-1 text-sm font-medium text-amber-300">
          Boss Neutralized: {data.bossDefeatedName}
        </p>
      )}

      <div className="mt-5 grid grid-cols-3 gap-3 border-y border-slate-800 py-4">
        <div>
          <div className="text-xs text-slate-400">Total Score</div>
          <div className="font-mono-num text-lg font-bold text-white">
            {data.score.toLocaleString()}
          </div>
        </div>
        <div>
          <div className="text-xs text-slate-400">Clear Bonus</div>
          <div className="font-mono-num text-lg font-bold text-sky-300">
            +{data.bonusScore.toLocaleString()}
          </div>
        </div>
        <div>
          <div className="text-xs text-slate-400">Hostiles</div>
          <div className="font-mono-num text-lg font-bold text-emerald-300">
            {data.enemiesDefeated}
          </div>
        </div>
      </div>

      {/* Premium Currency Rewards Earned */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-950/75 px-3.5 py-2.5 text-xs">
        <span className="font-medium text-slate-400">Mission Rewards</span>
        <div className="flex items-center gap-2">
          <CreditsBadge amount={data.creditsEarned} prefix="+" size="sm" />
          {data.crystalsEarned > 0 && (
            <CrystalsBadge amount={data.crystalsEarned} prefix="+" size="sm" />
          )}
        </div>
      </div>

      <p className="mt-3 text-xs text-slate-300">{data.rewardText}</p>

      <div className="mt-6 flex flex-col gap-2.5">
        {data.nextLevelNumber && (
          <button
            type="button"
            onClick={() => EventBus.emit('ui:next-level')}
            className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-400 to-cyan-400 px-5 py-2.5 font-display text-base font-bold text-slate-950 transition-all hover:brightness-110 active:scale-[0.98]"
          >
            <Play className="h-4 w-4 fill-current" />
            <span>Proceed to Sector {String(data.nextLevelNumber).padStart(2, '0')}</span>
          </button>
        )}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => EventBus.emit('ui:restart-level')}
            className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-200 hover:border-slate-500"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Replay</span>
          </button>
          <button
            type="button"
            onClick={() => {
              EventBus.emit('ui:navigate-route', 'ships');
              EventBus.emit('ui:open-hangar');
            }}
            className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-200 hover:border-sky-400/70"
          >
            <Wrench className="h-4 w-4 text-sky-400" />
            <span>Hangar</span>
          </button>
        </div>
      </div>
    </div>
  </div>
);

export const GameOverModal: React.FC<{ data: GameOverPayload }> = ({ data }) => (
  <div className="scroll-panel absolute inset-0 z-30 flex items-center justify-center overflow-y-auto bg-[#090308]/84 p-4 backdrop-blur-sm">
    <div className="scroll-panel menu-enter my-auto max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl border border-rose-500/45 bg-[#120710]/96 p-6 sm:p-7 shadow-2xl">
      <div className="text-xs font-semibold text-rose-400">
        Hull Critical ·{' '}
        {data.mode === 'endless'
          ? 'Endless Survival'
          : data.mode === 'boss_rush'
          ? 'Boss Rush'
          : data.mode === 'challenge'
          ? 'Challenge Trial'
          : `Sector ${String(data.levelNumber).padStart(2, '0')}`}
      </div>
      <h2 className="mt-1 font-display text-3xl font-bold text-white">Mission Failed</h2>
      <p className="mt-1 text-sm text-slate-300">
        {data.levelName} · Reached Wave {data.waveReached}
        {data.mode !== 'endless' ? `/${data.totalWaves}` : ''}
      </p>

      <div className="mt-5 grid grid-cols-2 gap-4 border-y border-rose-950/80 py-4">
        <div>
          <div className="text-xs text-slate-400">Final Score</div>
          <div className="font-mono-num text-xl font-bold text-white">
            {data.score.toLocaleString()}
          </div>
        </div>
        <div>
          <div className="text-xs text-slate-400">Enemies Defeated</div>
          <div className="font-mono-num text-xl font-bold text-rose-300">
            {data.enemiesDefeated}
          </div>
        </div>
      </div>

      {(data.creditsEarned > 0 || data.crystalsEarned > 0) && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-rose-950/70 bg-black/35 px-3.5 py-2.5 text-xs">
          <span className="text-slate-400">Salvage Recovered</span>
          <div className="flex items-center gap-2">
            <CreditsBadge amount={data.creditsEarned} prefix="+" size="sm" />
            {data.crystalsEarned > 0 && (
              <CrystalsBadge amount={data.crystalsEarned} prefix="+" size="sm" />
            )}
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-col gap-2.5">
        <button
          type="button"
          onClick={() => EventBus.emit('ui:restart-level')}
          className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-rose-500 px-5 py-2.5 font-display text-base font-bold text-white transition-colors hover:bg-rose-400 active:scale-[0.98]"
        >
          <RotateCcw className="h-4 w-4" />
          <span>Retry Mission</span>
        </button>
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => {
              EventBus.emit('ui:navigate-route', 'ships');
              EventBus.emit('ui:open-hangar');
            }}
            className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-200 hover:border-sky-400/70"
          >
            <Wrench className="h-4 w-4 text-sky-400" />
            <span>Hangar</span>
          </button>
          <button
            type="button"
            onClick={() => EventBus.emit('ui:open-menu')}
            className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-200 hover:border-slate-500"
          >
            <Home className="h-4 w-4" />
            <span>Main Menu</span>
          </button>
        </div>
      </div>
    </div>
  </div>
);

export const VictoryModal: React.FC<{ data: VictoryPayload }> = ({ data }) => {
  const isBossRush = data.mode === 'boss_rush';
  return (
    <div className="scroll-panel absolute inset-0 z-30 flex items-center justify-center overflow-y-auto bg-[#040711]/82 p-4 backdrop-blur-sm">
      <div className="scroll-panel menu-enter my-auto max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl border border-amber-400/50 bg-[#081022]/96 p-6 sm:p-7 text-center shadow-2xl">
        <Trophy className="mx-auto mb-3 h-10 w-10 text-amber-400" />
        <div className="text-xs font-semibold text-amber-300">
          {isBossRush ? '5-Boss Gauntlet Cleared' : 'Void Emperor Destroyed'}
        </div>
        <h2 className="mt-1 font-display text-3xl font-bold text-white">
          {isBossRush ? 'Boss Rush Conqueror' : 'Galaxy Liberated'}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-300">
          {isBossRush
            ? 'Every Void Commander fell in consecutive combat under your fighter’s wings.'
            : 'The Void Empire flagship has fallen. Humanity’s colonies across all ten sectors are safe under your watch.'}
        </p>

        <div className="mt-5 grid grid-cols-2 gap-4 border-y border-slate-800 py-4 text-left">
          <div>
            <div className="text-xs text-slate-400">Final Score</div>
            <div className="font-mono-num text-xl font-bold text-white">
              {data.finalScore.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-400">Hostiles Cleared</div>
            <div className="font-mono-num text-xl font-bold text-amber-300">
              {data.enemiesDefeated}
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-500/25 bg-slate-950/75 px-3.5 py-2.5 text-xs">
          <span className="text-slate-400">Victory Bounty</span>
          <div className="flex items-center gap-2">
            <CreditsBadge amount={data.creditsEarned} prefix="+" size="sm" />
            <CrystalsBadge amount={data.crystalsEarned} prefix="+" size="sm" />
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={() =>
              isBossRush
                ? EventBus.emit('ui:start-mode', { mode: 'boss_rush', levelNumber: 10 })
                : EventBus.emit('ui:start-level', 1)
            }
            className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-400 to-cyan-400 px-5 py-2.5 font-display text-base font-bold text-slate-950 transition-all hover:brightness-110 active:scale-[0.98]"
          >
            <Play className="h-4 w-4 fill-current" />
            <span>Play Again</span>
          </button>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => {
                EventBus.emit('ui:navigate-route', 'ships');
                EventBus.emit('ui:open-hangar');
              }}
              className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-200 hover:border-sky-400/70"
            >
              <Wrench className="h-4 w-4 text-sky-400" />
              <span>Hangar</span>
            </button>
            <button
              type="button"
              onClick={() => EventBus.emit('ui:open-menu')}
              className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-200 hover:border-slate-500"
            >
              <Home className="h-4 w-4" />
              <span>Main Menu</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
