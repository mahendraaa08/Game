import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  ChevronRight,
  Compass,
  Flame,
  Lock,
  Play,
  Skull,
  Sparkles,
} from 'lucide-react';
import { BOSS_CONFIGS } from '../game/config/BossConfig';
import { BOSS_RUSH_CLEAR_REWARD, getChallengePayout } from '../game/config/EconomyConfig';
import { BOSS_RUSH_ORDER, CHALLENGES, GameMode } from '../game/config/GameModeConfig';
import { CAMPAIGN_LEVELS } from '../game/config/LevelConfig';
import {
  PLAYER_EXP_SOURCES,
  getCampaignClearTotalExp,
} from '../game/config/LevelProgressionConfig';
import { SoundManager } from '../game/audio/SoundManager';
import { EventBus } from '../game/utils/EventBus';
import { PlayerProgress } from '../game/utils/StorageManager';
import { DedicatedScreenShell } from './DedicatedScreenShell';
import { ExpStarIcon } from './ui/CurrencyBadges';

interface ModeSelectorOverlayProps {
  progress: PlayerProgress;
  onBack: () => void;
}

export const ModeSelectorOverlay: React.FC<ModeSelectorOverlayProps> = ({
  progress,
  onBack,
}) => {
  const [selectedMode, setSelectedMode] = useState<GameMode>('campaign');
  const [selectedSector, setSelectedSector] = useState<number>(progress.highestUnlockedLevel);
  const [selectedChallengeId, setSelectedChallengeId] = useState<string>(
    () =>
      CHALLENGES.find((c) => !progress.stats.completedChallenges.includes(c.id))?.id ??
      CHALLENGES[0].id
  );

  const sectorDef = CAMPAIGN_LEVELS[selectedSector - 1] ?? CAMPAIGN_LEVELS[0];
  const selectedSectorUnlocked = sectorDef.levelNumber <= progress.highestUnlockedLevel;

  const selectedChallenge = useMemo(
    () => CHALLENGES.find((c) => c.id === selectedChallengeId) ?? CHALLENGES[0],
    [selectedChallengeId]
  );
  const selectedChallengeCompleted = progress.stats.completedChallenges.includes(selectedChallenge.id);
  const selectedChallengePayout = getChallengePayout(
    selectedChallenge.rewardCredits,
    selectedChallenge.rewardCrystals,
    selectedChallengeCompleted
  );
  const challengeClearExp =
    PLAYER_EXP_SOURCES.challengeClearBonus + PLAYER_EXP_SOURCES.runCompletionBase;
  const bossRushClearExp =
    PLAYER_EXP_SOURCES.bossRushClearBonus + PLAYER_EXP_SOURCES.runCompletionBase;

  const selectMode = (mode: GameMode) => {
    if (selectedMode === mode) return;
    SoundManager.unlock();
    SoundManager.playButtonClick();
    setSelectedMode(mode);
  };

  const handleLaunchSelected = () => {
    SoundManager.unlock();
    SoundManager.playButtonClick();

    if (selectedMode === 'campaign') {
      if (!selectedSectorUnlocked) return;
      EventBus.emit('ui:start-level', selectedSector);
      return;
    }
    if (selectedMode === 'endless') {
      EventBus.emit('ui:start-mode', { mode: 'endless', levelNumber: 6 });
      return;
    }
    if (selectedMode === 'challenge') {
      EventBus.emit('ui:start-mode', {
        mode: 'challenge',
        challengeId: selectedChallenge.id,
        levelNumber: selectedChallenge.rules.levelBase,
      });
      return;
    }
    EventBus.emit('ui:start-mode', { mode: 'boss_rush', levelNumber: 10 });
  };

  const modeOptions: Array<{
    id: GameMode;
    title: string;
    metric: string;
    icon: React.FC<{ className?: string }>;
    selectedBorder: string;
    selectedBg: string;
    iconColor: string;
  }> = [
    {
      id: 'campaign',
      title: 'Campaign',
      metric: `${progress.completedLevels.length}/10 Cleared`,
      icon: Compass,
      selectedBorder: 'border-sky-300/70',
      selectedBg: 'bg-[#0b1b34]/95',
      iconColor: 'text-sky-300',
    },
    {
      id: 'endless',
      title: 'Endless Survival',
      metric:
        progress.stats.bestEndlessWave > 0
          ? `Best Wave ${progress.stats.bestEndlessWave}`
          : 'No Record',
      icon: Flame,
      selectedBorder: 'border-purple-300/70',
      selectedBg: 'bg-[#16102b]/95',
      iconColor: 'text-purple-300',
    },
    {
      id: 'challenge',
      title: 'Challenge Mode',
      metric: `${progress.stats.completedChallenges.length}/${CHALLENGES.length} Completed`,
      icon: Sparkles,
      selectedBorder: 'border-amber-300/70',
      selectedBg: 'bg-[#1a140b]/95',
      iconColor: 'text-amber-300',
    },
    {
      id: 'boss_rush',
      title: 'Boss Rush',
      metric: `${progress.stats.bossRushClears} Clears`,
      icon: Skull,
      selectedBorder: 'border-rose-300/70',
      selectedBg: 'bg-[#1d0e18]/95',
      iconColor: 'text-rose-300',
    },
  ];

  return (
    <DedicatedScreenShell
      title="SELECT GAME MODE"
        backLabel="Main Menu"
        onBack={onBack}
        credits={progress.credits}
        crystals={progress.crystals}
        maxWidthClass="max-w-6xl"
      >
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[290px_1fr] lg:items-start lg:gap-6">
          {/* LEFT RAIL (Desktop) / COMPACT 2x2 SELECTOR (Mobile): Minimal 4 Game Modes */}
          <nav
            aria-label="Game Modes"
            className="grid grid-cols-2 gap-2.5 lg:grid-cols-1 lg:gap-2.5"
          >
            {modeOptions.map((item) => {
              const Icon = item.icon;
              const isSelected = selectedMode === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => selectMode(item.id)}
                  className={`group flex min-h-[68px] sm:min-h-[76px] items-center justify-between gap-3 rounded-2xl border px-3.5 py-3 sm:px-4 text-left transition-[border-color,background-color,opacity,transform] duration-150 active:scale-[0.985] focus-visible:outline-2 focus-visible:outline-cyan-400 ${
                    isSelected
                      ? `${item.selectedBorder} ${item.selectedBg} opacity-100`
                      : 'border-slate-800/85 bg-[#081122]/80 opacity-80 hover:opacity-100 hover:border-slate-600/80 hover:bg-[#0c172d]/85'
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-700/70 bg-[#050b18]">
                      <Icon className={`h-4 w-4 ${item.iconColor}`} />
                    </span>
                    <div className="min-w-0">
                      <div className="truncate font-display text-xs sm:text-sm font-bold tracking-wide text-white">
                        {item.title}
                      </div>
                      <div className="mt-0.5 truncate font-mono-num text-[11px] text-slate-400">
                        {item.metric}
                      </div>
                    </div>
                  </div>

                  <ChevronRight
                    className={`hidden h-4 w-4 shrink-0 transition-transform duration-150 lg:block ${
                      isSelected
                        ? 'translate-x-0.5 text-slate-200'
                        : 'text-slate-600 group-hover:text-slate-400'
                    }`}
                  />
                </button>
              );
            })}
          </nav>

          {/* RIGHT STAGE: Single Clean Dynamic Mode Briefing & Action Area */}
          <section
            key={selectedMode}
            aria-live="polite"
            className="panel-swap flex flex-col justify-between gap-5 rounded-2xl border border-slate-700/70 bg-[#081122]/92 p-5 sm:p-6 lg:p-7"
          >
            {/* 1. CAMPAIGN */}
            {selectedMode === 'campaign' && (
              <>
                <div className="flex flex-col gap-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 font-mono-num text-xs text-slate-400">
                    <span className="font-semibold uppercase tracking-wider text-sky-300">
                      Campaign
                    </span>
                    <span>
                      {progress.completedLevels.length}/{CAMPAIGN_LEVELS.length} Sectors Cleared
                    </span>
                  </div>

                  <div>
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <h2 className="font-display text-xl sm:text-2xl font-bold text-white">
                        Sector {String(selectedSector).padStart(2, '0')} — {sectorDef.name}
                      </h2>
                      <span className="font-mono-num text-xs text-slate-400">
                        {sectorDef.subtitle}
                      </span>
                    </div>
                    <p className="mt-2 max-w-2xl text-xs sm:text-sm leading-relaxed text-slate-300">
                      {sectorDef.objective}
                    </p>
                  </div>

                  {/* Unboxed Clean Telemetry Line */}
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-y border-slate-800/80 py-3 font-mono-num text-xs">
                    <span className="text-slate-400">
                      Waves: <strong className="text-white">{sectorDef.waves.length}</strong>
                    </span>
                    <span className="text-slate-400">
                      Best Score:{' '}
                      <strong className="text-white">
                        {(progress.levelScores[selectedSector] ?? 0) > 0
                          ? (progress.levelScores[selectedSector] ?? 0).toLocaleString()
                          : '—'}
                      </strong>
                    </span>
                    <span className="text-emerald-300">{sectorDef.rewardText}</span>
                    <span className="inline-flex items-center gap-1 font-semibold text-purple-300">
                      <ExpStarIcon className="h-3.5 w-3.5 shrink-0" />
                      +{getCampaignClearTotalExp(selectedSector).toLocaleString()} Clear EXP
                    </span>
                  </div>

                  {/* Clean Sector Selector (01-10) */}
                  <div>
                    <div className="mb-2.5 flex items-center justify-between text-xs">
                      <span className="font-display font-semibold text-slate-200">
                        Select Sector
                      </span>
                      <span className="font-mono-num text-[11px] text-slate-400">
                        Unlocked to S{String(progress.highestUnlockedLevel).padStart(2, '0')}
                      </span>
                    </div>

                    <div className="scroll-panel grid max-h-[212px] sm:max-h-none grid-cols-2 gap-2 overflow-y-auto pr-1.5 sm:grid-cols-5">
                      {CAMPAIGN_LEVELS.map((lvl) => {
                        const unlocked = lvl.levelNumber <= progress.highestUnlockedLevel;
                        const completed = progress.completedLevels.includes(lvl.levelNumber);
                        const active = selectedSector === lvl.levelNumber;

                        return (
                          <button
                            key={lvl.levelNumber}
                            type="button"
                            disabled={!unlocked}
                            onClick={() => {
                              SoundManager.playButtonClick();
                              setSelectedSector(lvl.levelNumber);
                            }}
                            className={`flex min-h-[62px] flex-col justify-between rounded-xl border px-3 py-2.5 text-left transition-[border-color,background-color] duration-150 ${
                              !unlocked
                                ? 'cursor-not-allowed border-slate-800/60 bg-slate-950/45 text-slate-600'
                                : active
                                ? 'border-sky-300/75 bg-sky-500/15 text-white'
                                : 'border-slate-800 bg-[#060c1a]/85 text-slate-300 hover:border-slate-600'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1 font-mono-num text-[10.5px]">
                              <span className="font-bold">
                                S{String(lvl.levelNumber).padStart(2, '0')}
                              </span>
                              {!unlocked ? (
                                <Lock className="h-3 w-3 text-slate-600" />
                              ) : completed ? (
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                              ) : null}
                            </div>
                            <div className="truncate font-display text-[11.5px] font-bold">
                              {lvl.name}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Action Bar */}
                <div className="flex justify-end border-t border-slate-800/80 pt-4">
                  <button
                    type="button"
                    disabled={!selectedSectorUnlocked}
                    onClick={handleLaunchSelected}
                    className="flex min-h-[48px] w-full sm:w-auto items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-sky-400 to-cyan-400 px-6 py-2.5 font-display text-sm sm:text-base font-bold tracking-wider text-slate-950 transition-[filter,transform] duration-150 hover:brightness-105 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 sm:min-w-[220px]"
                  >
                    <Play className="h-4 w-4 fill-current" />
                    <span>Play Sector {String(selectedSector).padStart(2, '0')}</span>
                  </button>
                </div>
              </>
            )}

            {/* 2. ENDLESS SURVIVAL */}
            {selectedMode === 'endless' && (
              <>
                <div className="flex flex-col gap-5">
                  <div className="font-mono-num text-xs font-semibold uppercase tracking-wider text-purple-300">
                    Endless Survival
                  </div>

                  <div>
                    <h2 className="font-display text-xl sm:text-2xl font-bold text-white">
                      Endless Survival Simulation
                    </h2>
                    <p className="mt-2 max-w-2xl text-xs sm:text-sm leading-relaxed text-slate-300">
                      Hostile speed, hull armor, and squadron density scale continuously across every wave. Void commanders intercept every 5th wave with bonus Credits and Void Crystal milestones.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-y border-slate-800/80 py-4 font-mono-num sm:grid-cols-4">
                    <div>
                      <div className="text-[11px] text-slate-400">Best Wave</div>
                      <div className="mt-1 text-base sm:text-lg font-bold text-purple-300">
                        {progress.stats.bestEndlessWave > 0
                          ? `Wave ${progress.stats.bestEndlessWave}`
                          : '—'}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-slate-400">High Score</div>
                      <div className="mt-1 text-base sm:text-lg font-bold text-white">
                        {progress.stats.bestEndlessScore > 0
                          ? progress.stats.bestEndlessScore.toLocaleString()
                          : '0'}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-slate-400">Boss Interval</div>
                      <div className="mt-1 text-base sm:text-lg font-bold text-cyan-300">
                        Every 5 Waves
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-slate-400">Sorties Logged</div>
                      <div className="mt-1 text-base sm:text-lg font-bold text-slate-200">
                        {progress.stats.totalRuns.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono-num text-xs text-slate-400">
                    <span className="inline-flex items-center gap-1.5 font-semibold text-purple-300">
                      <ExpStarIcon className="h-3.5 w-3.5 shrink-0" />
                      +{PLAYER_EXP_SOURCES.endlessPerWaveClear} EXP / Wave Cleared
                    </span>
                    <span className="text-slate-600">·</span>
                    <span>
                      +{PLAYER_EXP_SOURCES.runCompletionBase} Run Bonus EXP &amp; Combat Kill EXP
                    </span>
                  </div>
                </div>

                <div className="flex justify-end border-t border-slate-800/80 pt-4">
                  <button
                    type="button"
                    onClick={handleLaunchSelected}
                    className="flex min-h-[48px] w-full sm:w-auto items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-purple-400 to-fuchsia-400 px-6 py-2.5 font-display text-sm sm:text-base font-bold tracking-wider text-slate-950 transition-[filter,transform] duration-150 hover:brightness-105 active:scale-[0.98] sm:min-w-[220px]"
                  >
                    <Play className="h-4 w-4 fill-current" />
                    <span>Start Survival</span>
                  </button>
                </div>
              </>
            )}

            {/* 3. CHALLENGE MODE */}
            {selectedMode === 'challenge' && (
              <>
                <div className="flex flex-col gap-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 font-mono-num text-xs">
                    <span className="font-semibold uppercase tracking-wider text-amber-300">
                      Challenge Mode
                    </span>
                    <span className="text-slate-400">
                      {progress.stats.completedChallenges.length}/{CHALLENGES.length} Completed
                    </span>
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h2 className="font-display text-xl sm:text-2xl font-bold text-white">
                        {selectedChallenge.title}
                      </h2>
                      <span
                        className={`font-mono-num text-xs font-semibold ${
                          progress.stats.completedChallenges.includes(selectedChallenge.id)
                            ? 'text-emerald-400'
                            : 'text-sky-300'
                        }`}
                      >
                        {progress.stats.completedChallenges.includes(selectedChallenge.id)
                          ? 'Completed'
                          : 'Available'}
                      </span>
                    </div>
                    <p className="mt-1.5 max-w-2xl text-xs sm:text-sm leading-relaxed text-slate-300">
                      {selectedChallenge.objective}
                    </p>
                    <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono-num text-xs text-slate-400">
                      <span>{selectedChallenge.constraintsLabel}</span>
                      <span className="text-slate-300">
                        {selectedChallengePayout.isReplay ? 'Replay:' : 'First Clear:'}
                      </span>
                      <span className="text-amber-300">+{selectedChallengePayout.credits} CR</span>
                      <span className="text-cyan-300">+{selectedChallengePayout.crystals} Gems</span>
                      <span className="inline-flex items-center gap-1 font-semibold text-purple-300">
                        <ExpStarIcon className="h-3.5 w-3.5 shrink-0" />
                        +{challengeClearExp} EXP
                      </span>
                    </div>
                  </div>

                  <div className="scroll-panel grid max-h-[232px] sm:max-h-none grid-cols-1 gap-2.5 overflow-y-auto pr-1.5 sm:grid-cols-2">
                    {CHALLENGES.map((c) => {
                      const done = progress.stats.completedChallenges.includes(c.id);
                      const isPicked = selectedChallenge.id === c.id;
                      const payout = getChallengePayout(c.rewardCredits, c.rewardCrystals, done);

                      return (
                        <button
                          key={c.id}
                          type="button"
                          aria-pressed={isPicked}
                          onClick={() => {
                            SoundManager.playButtonClick();
                            setSelectedChallengeId(c.id);
                          }}
                          className={`flex flex-col justify-between gap-2 rounded-xl border p-3.5 text-left transition-[border-color,background-color] duration-150 ${
                            isPicked
                              ? 'border-amber-300/75 bg-amber-500/12'
                              : 'border-slate-800 bg-[#060c1a]/85 hover:border-slate-600'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 font-mono-num text-[10.5px]">
                            <span
                              className={`font-semibold ${
                                c.difficulty === 'Extreme'
                                  ? 'text-rose-400'
                                  : c.difficulty === 'Hard'
                                  ? 'text-amber-300'
                                  : 'text-sky-300'
                              }`}
                            >
                              {c.difficulty} · {c.constraintsLabel}
                            </span>
                            {done && <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />}
                          </div>

                          <div className="font-display text-sm font-bold text-white">
                            {c.title}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 font-mono-num text-[11px] text-slate-400">
                            {payout.isReplay && <span className="text-slate-400">Replay</span>}
                            <span className="text-amber-300">+{payout.credits} CR</span>
                            <span className="text-slate-600">·</span>
                            <span className="text-cyan-300">+{payout.crystals} Gems</span>
                            <span className="text-slate-600">·</span>
                            <span className="inline-flex items-center gap-0.5 text-purple-300">
                              <ExpStarIcon className="h-3 w-3 shrink-0" />
                              +{challengeClearExp} EXP
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-end border-t border-slate-800/80 pt-4">
                  <button
                    type="button"
                    onClick={handleLaunchSelected}
                    className="flex min-h-[48px] w-full sm:w-auto items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 px-6 py-2.5 font-display text-sm sm:text-base font-bold tracking-wider text-slate-950 transition-[filter,transform] duration-150 hover:brightness-105 active:scale-[0.98] sm:min-w-[220px]"
                  >
                    <Play className="h-4 w-4 fill-current" />
                    <span>Start Challenge</span>
                  </button>
                </div>
              </>
            )}

            {/* 4. BOSS RUSH */}
            {selectedMode === 'boss_rush' && (
              <>
                <div className="flex flex-col gap-5">
                  <div className="flex flex-wrap items-center justify-between gap-2 font-mono-num text-xs">
                    <span className="font-semibold uppercase tracking-wider text-rose-300">
                      Boss Rush Gauntlet
                    </span>
                    <span className="text-slate-400">
                      {progress.stats.bossRushClears} Clears · Best{' '}
                      {progress.stats.bestBossRushScore.toLocaleString()} PTS
                    </span>
                  </div>

                  <div>
                    <h2 className="font-display text-xl sm:text-2xl font-bold text-white">
                      Void Commander Boss Rush
                    </h2>
                    <p className="mt-2 max-w-2xl text-xs sm:text-sm leading-relaxed text-slate-300">
                      Engage all {BOSS_RUSH_ORDER.length} Void Empire dreadnought commanders back-to-back in a single gauntlet. Clearing the full sequence awards +{BOSS_RUSH_CLEAR_REWARD.credits.toLocaleString()} CR and +{BOSS_RUSH_CLEAR_REWARD.crystals} Gems.
                    </p>
                    <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono-num text-xs">
                      <span className="inline-flex items-center gap-1.5 font-semibold text-purple-300">
                        <ExpStarIcon className="h-3.5 w-3.5 shrink-0" />
                        +{bossRushClearExp} Clear EXP
                      </span>
                      <span className="text-slate-600">·</span>
                      <span className="text-slate-400">
                        +{PLAYER_EXP_SOURCES.bossKillBonus} EXP per Void Commander defeated
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-5">
                    {BOSS_RUSH_ORDER.map((bId, idx) => {
                      const boss = BOSS_CONFIGS[bId];
                      return (
                        <div
                          key={bId}
                          className="rounded-xl border border-slate-800/90 bg-[#060c1a]/85 px-3 py-3"
                        >
                          <div className="font-mono-num text-[10.5px] text-slate-500">
                            0{idx + 1}
                          </div>
                          <div className="mt-1 truncate font-display text-xs sm:text-sm font-bold text-rose-300">
                            {boss.name}
                          </div>
                          <div className="mt-0.5 truncate text-[11px] text-slate-400">
                            {boss.title}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-end border-t border-slate-800/80 pt-4">
                  <button
                    type="button"
                    onClick={handleLaunchSelected}
                    className="flex min-h-[48px] w-full sm:w-auto items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 px-6 py-2.5 font-display text-sm sm:text-base font-bold tracking-wider text-white transition-[filter,transform] duration-150 hover:brightness-110 active:scale-[0.98] sm:min-w-[220px]"
                  >
                    <Play className="h-4 w-4 fill-current" />
                    <span>Start Boss Rush</span>
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
      </DedicatedScreenShell>
  );
};
