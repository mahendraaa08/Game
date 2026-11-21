import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Home,
  LogOut,
  Play,
  RotateCcw,
  Settings,
  ShieldAlert,
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
import { CreditsBadge, CrystalsBadge, ExpBadge } from './ui/CurrencyBadges';

type PauseView = 'pause' | 'settings' | 'confirm_exit';

export const PauseModal: React.FC = () => {
  const [view, setView] = useState<PauseView>('pause');
  const [feedback, setFeedback] = useState<ActionResult | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const escReadyRef = useRef(false);
  const exitLockRef = useRef(false);
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
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-exit-title"
        style={backdropStyle}
        className={`scroll-panel absolute inset-0 z-30 flex items-center justify-center overflow-y-auto p-4 ${backdropBlurClass}`}
      >
        <div className="pause-panel-enter relative my-auto w-full max-w-[328px] rounded-2xl border border-slate-700/70 bg-[#070e1c]/95 p-6 text-center shadow-2xl shadow-black/55">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl border border-rose-400/25 bg-rose-500/10 text-rose-400">
            <AlertTriangle className="h-[18px] w-[18px]" />
          </div>

          <h2
            id="confirm-exit-title"
            className="mt-3.5 font-display text-lg sm:text-xl font-bold tracking-wider text-white"
          >
            EXIT CURRENT MISSION
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-300">
            Leave your current mission?
          </p>

          <ConfirmButtonPair
            className="mt-5 grid grid-cols-2 gap-3"
            onCancel={() => {
              SoundManager.playButtonClick();
              setView('pause');
            }}
            onConfirm={() => {
              if (exitLockRef.current) return;
              exitLockRef.current = true;
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

interface ResultMetric {
  label: string;
  value: string;
  toneClass?: string;
}

interface ResultCardShellProps {
  tone: 'victory_sector' | 'victory_grand' | 'defeat';
  headline: 'VICTORY' | 'DEFEAT';
  summaryLine: string;
  metrics: ResultMetric[];
  rewardLabel: string;
  creditsEarned: number;
  crystalsEarned: number;
  expEarned?: number;
  primaryAction: {
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
  };
  secondaryActions: Array<{
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
    accentHoverClass?: string;
  }>;
}

const ResultCardShell: React.FC<ResultCardShellProps> = ({
  tone,
  headline,
  summaryLine,
  metrics,
  rewardLabel,
  creditsEarned,
  crystalsEarned,
  expEarned = 0,
  primaryAction,
  secondaryActions,
}) => {
  const actionLockRef = useRef(false);
  const isDefeat = tone === 'defeat';
  const isGrandVictory = tone === 'victory_grand';

  const cardSurfaceClass = isDefeat
    ? 'border-rose-400/35 bg-[#0f0914]/94'
    : isGrandVictory
    ? 'border-amber-300/40 bg-[#081021]/95'
    : 'border-cyan-400/35 bg-[#081021]/95';

  const iconBoxClass = isDefeat
    ? 'border-rose-400/30 bg-rose-500/10 text-rose-300'
    : isGrandVictory
    ? 'border-amber-300/35 bg-amber-400/12 text-amber-300'
    : 'border-cyan-300/35 bg-cyan-400/12 text-cyan-300';

  const summaryClass = isDefeat
    ? 'text-rose-200/85'
    : isGrandVictory
    ? 'text-amber-200/90'
    : 'text-cyan-200/90';

  const primaryButtonClass = isDefeat
    ? 'border border-rose-300/35 bg-rose-500 text-white hover:bg-rose-400'
    : 'border border-cyan-200/45 bg-sky-400 text-slate-950 hover:bg-sky-300';

  const showRewards = creditsEarned > 0 || crystalsEarned > 0 || expEarned > 0;
  const secondaryGridClass = secondaryActions.length === 3 ? 'grid-cols-3' : 'grid-cols-2';

  const triggerOnce = (fn: () => void) => {
    if (actionLockRef.current) return;
    actionLockRef.current = true;
    SoundManager.playButtonClick();
    fn();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="result-card-title"
      className={`scroll-panel absolute inset-0 z-30 flex items-center justify-center overflow-y-auto p-4 backdrop-blur-sm ${
        isDefeat ? 'bg-[#08040b]/80' : 'bg-[#040814]/80'
      }`}
    >
      <div
        className={`scroll-panel menu-enter my-auto max-h-[calc(100dvh-2rem)] w-full max-w-[392px] overflow-y-auto rounded-2xl border p-6 shadow-2xl shadow-black/60 ${cardSurfaceClass}`}
      >
        {/* Centered Header Lockup */}
        <div className="flex flex-col items-center text-center">
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-xl border ${iconBoxClass}`}
          >
            {isDefeat ? (
              <ShieldAlert className="h-5 w-5" />
            ) : (
              <Trophy className="h-5 w-5" />
            )}
          </div>

          <h2
            id="result-card-title"
            className="mt-3 font-display text-3xl font-bold tracking-[0.14em] text-white"
          >
            {headline}
          </h2>

          <p className={`mt-1 text-xs sm:text-[13px] font-medium ${summaryClass}`}>
            {summaryLine}
          </p>
        </div>

        {/* Clean Single-Elevation Telemetry Row (Hairline Dividers) */}
        <div
          className={`mt-5 grid gap-3 border-y border-slate-800/80 py-4 text-center ${
            metrics.length === 3 ? 'grid-cols-3' : 'grid-cols-2'
          }`}
        >
          {metrics.map((metric) => (
            <div key={metric.label} className="min-w-0">
              <div className="truncate font-mono-num text-[10px] uppercase tracking-wider text-slate-400">
                {metric.label}
              </div>
              <div
                className={`mt-1 truncate font-mono-num text-lg sm:text-xl font-bold ${
                  metric.toneClass ?? 'text-white'
                }`}
              >
                {metric.value}
              </div>
            </div>
          ))}
        </div>

        {/* Compact Rewards / Salvage Row */}
        {showRewards && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 py-3 text-xs">
            <span className="font-mono-num text-[10.5px] font-medium uppercase tracking-wider text-slate-400">
              {rewardLabel}
            </span>
            <div className="flex flex-wrap items-center justify-end gap-1.5">
              {creditsEarned > 0 && (
                <CreditsBadge amount={creditsEarned} prefix="+" size="sm" />
              )}
              {crystalsEarned > 0 && (
                <CrystalsBadge amount={crystalsEarned} prefix="+" size="sm" />
              )}
              {expEarned > 0 && (
                <ExpBadge amount={expEarned} prefix="+" size="sm" />
              )}
            </div>
          </div>
        )}

        {/* Unified Action Hierarchy */}
        <div className="mt-5 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={() => triggerOnce(primaryAction.onClick)}
            className={`flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl px-5 py-2.5 font-display text-sm sm:text-base font-bold tracking-wider transition-[background-color,transform] duration-150 active:scale-[0.98] ${primaryButtonClass}`}
          >
            {primaryAction.icon}
            <span>{primaryAction.label}</span>
          </button>

          <div className={`grid ${secondaryGridClass} gap-2`}>
            {secondaryActions.map((action) => (
              <button
                key={action.label}
                type="button"
                onClick={() => triggerOnce(action.onClick)}
                className={`flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl border border-slate-700/75 bg-[#0b1324]/90 px-2.5 py-2 text-xs font-semibold text-slate-200 transition-[border-color,background-color,transform] duration-150 hover:bg-[#121e38] active:scale-[0.98] ${
                  action.accentHoverClass ?? 'hover:border-slate-500'
                }`}
              >
                {action.icon}
                <span className="truncate">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const LevelResultModal: React.FC<{ data: LevelResultPayload }> = ({ data }) => {
  const sectorLabel =
    data.mode === 'challenge'
      ? `Challenge · ${data.levelName}`
      : `Sector ${String(data.levelNumber).padStart(2, '0')} · ${data.levelName}`;

  const summaryLine = data.bossDefeatedName
    ? `${sectorLabel} · ${data.bossDefeatedName} Defeated`
    : sectorLabel;

  const secondaryActions = data.nextLevelNumber
    ? [
        {
          label: 'Replay',
          icon: <RotateCcw className="h-3.5 w-3.5 shrink-0" />,
          onClick: () => EventBus.emit('ui:restart-level'),
        },
        {
          label: 'Hangar',
          icon: <Wrench className="h-3.5 w-3.5 shrink-0 text-sky-400" />,
          onClick: () => {
            EventBus.emit('ui:navigate-route', 'ships');
            EventBus.emit('ui:open-hangar');
          },
          accentHoverClass: 'hover:border-sky-400/60',
        },
        {
          label: 'Main Menu',
          icon: <Home className="h-3.5 w-3.5 shrink-0" />,
          onClick: () => EventBus.emit('ui:open-menu'),
        },
      ]
    : [
        {
          label: 'Hangar',
          icon: <Wrench className="h-3.5 w-3.5 shrink-0 text-sky-400" />,
          onClick: () => {
            EventBus.emit('ui:navigate-route', 'ships');
            EventBus.emit('ui:open-hangar');
          },
          accentHoverClass: 'hover:border-sky-400/60',
        },
        {
          label: 'Main Menu',
          icon: <Home className="h-3.5 w-3.5 shrink-0" />,
          onClick: () => EventBus.emit('ui:open-menu'),
        },
      ];

  return (
    <ResultCardShell
      tone="victory_sector"
      headline="VICTORY"
      summaryLine={summaryLine}
      metrics={[
        { label: 'Score', value: data.score.toLocaleString(), toneClass: 'text-white' },
        {
          label: 'Clear Bonus',
          value: `+${data.bonusScore.toLocaleString()}`,
          toneClass: 'text-cyan-300',
        },
        {
          label: 'Defeated',
          value: data.enemiesDefeated.toLocaleString(),
          toneClass: 'text-emerald-300',
        },
      ]}
      rewardLabel="Rewards"
      creditsEarned={data.creditsEarned}
      crystalsEarned={data.crystalsEarned}
      expEarned={data.expEarned ?? 0}
      primaryAction={
        data.nextLevelNumber
          ? {
              label: `Continue · Sector ${String(data.nextLevelNumber).padStart(2, '0')}`,
              icon: <Play className="h-4 w-4 fill-current" />,
              onClick: () => EventBus.emit('ui:next-level'),
            }
          : {
              label: 'Play Again',
              icon: <RotateCcw className="h-4 w-4" />,
              onClick: () => EventBus.emit('ui:restart-level'),
            }
      }
      secondaryActions={secondaryActions}
    />
  );
};

export const GameOverModal: React.FC<{ data: GameOverPayload }> = ({ data }) => {
  const modeSummary =
    data.mode === 'endless'
      ? `Endless Survival · Wave ${data.waveReached}`
      : data.mode === 'boss_rush'
      ? `Boss Rush · Wave ${data.waveReached}/${data.totalWaves}`
      : data.mode === 'challenge'
      ? `Challenge · ${data.levelName} · Wave ${data.waveReached}/${data.totalWaves}`
      : `Sector ${String(data.levelNumber).padStart(2, '0')} · Wave ${data.waveReached}/${data.totalWaves}`;

  return (
    <ResultCardShell
      tone="defeat"
      headline="DEFEAT"
      summaryLine={modeSummary}
      metrics={[
        { label: 'Score', value: data.score.toLocaleString(), toneClass: 'text-white' },
        {
          label: 'Defeated',
          value: data.enemiesDefeated.toLocaleString(),
          toneClass: 'text-rose-300',
        },
      ]}
      rewardLabel="Salvage"
      creditsEarned={data.creditsEarned}
      crystalsEarned={data.crystalsEarned}
      expEarned={data.expEarned ?? 0}
      primaryAction={{
        label: 'Retry',
        icon: <RotateCcw className="h-4 w-4" />,
        onClick: () => EventBus.emit('ui:restart-level'),
      }}
      secondaryActions={[
        {
          label: 'Hangar',
          icon: <Wrench className="h-3.5 w-3.5 shrink-0 text-sky-400" />,
          onClick: () => {
            EventBus.emit('ui:navigate-route', 'ships');
            EventBus.emit('ui:open-hangar');
          },
          accentHoverClass: 'hover:border-sky-400/60',
        },
        {
          label: 'Main Menu',
          icon: <Home className="h-3.5 w-3.5 shrink-0" />,
          onClick: () => EventBus.emit('ui:open-menu'),
        },
      ]}
    />
  );
};

export const VictoryModal: React.FC<{ data: VictoryPayload }> = ({ data }) => {
  const isBossRush = data.mode === 'boss_rush';
  return (
    <ResultCardShell
      tone="victory_grand"
      headline="VICTORY"
      summaryLine={
        isBossRush
          ? 'Boss Rush · 5-Boss Gauntlet Cleared'
          : 'Campaign Complete · Void Emperor Defeated'
      }
      metrics={[
        { label: 'Score', value: data.finalScore.toLocaleString(), toneClass: 'text-white' },
        {
          label: 'Defeated',
          value: data.enemiesDefeated.toLocaleString(),
          toneClass: 'text-amber-300',
        },
      ]}
      rewardLabel="Rewards"
      creditsEarned={data.creditsEarned}
      crystalsEarned={data.crystalsEarned}
      expEarned={data.expEarned ?? 0}
      primaryAction={{
        label: 'Play Again',
        icon: <Play className="h-4 w-4 fill-current" />,
        onClick: () =>
          isBossRush
            ? EventBus.emit('ui:start-mode', { mode: 'boss_rush', levelNumber: 10 })
            : EventBus.emit('ui:start-level', 1),
      }}
      secondaryActions={[
        {
          label: 'Hangar',
          icon: <Wrench className="h-3.5 w-3.5 shrink-0 text-sky-400" />,
          onClick: () => {
            EventBus.emit('ui:navigate-route', 'ships');
            EventBus.emit('ui:open-hangar');
          },
          accentHoverClass: 'hover:border-sky-400/60',
        },
        {
          label: 'Main Menu',
          icon: <Home className="h-3.5 w-3.5 shrink-0" />,
          onClick: () => EventBus.emit('ui:open-menu'),
        },
      ]}
    />
  );
};
