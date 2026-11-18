import React, { useState } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Compass,
  Flame,
  Lock,
  Play,
  ShieldAlert,
  Skull,
  Sparkles,
  Trophy,
} from 'lucide-react';
import { BOSS_CONFIGS } from '../game/config/BossConfig';
import { BOSS_RUSH_ORDER, CHALLENGES } from '../game/config/GameModeConfig';
import { CAMPAIGN_LEVELS } from '../game/config/LevelConfig';
import { SoundManager } from '../game/audio/SoundManager';
import { EventBus } from '../game/utils/EventBus';
import { PlayerProgress } from '../game/utils/StorageManager';
import { DedicatedScreenShell } from './DedicatedScreenShell';

interface ModeSelectorOverlayProps {
  progress: PlayerProgress;
  onBack: () => void;
  onOpenArmory: () => void;
}

export const ModeSelectorOverlay: React.FC<ModeSelectorOverlayProps> = ({
  progress,
  onBack,
  onOpenArmory,
}) => {
  const [selectedSector, setSelectedSector] = useState<number>(progress.highestUnlockedLevel);
  const [showSectors, setShowSectors] = useState<boolean>(false);
  const [showChallenges, setShowChallenges] = useState<boolean>(false);

  const sectorDef = CAMPAIGN_LEVELS[selectedSector - 1] ?? CAMPAIGN_LEVELS[0];
  const sectorBoss = sectorDef.bossId ? BOSS_CONFIGS[sectorDef.bossId] : null;
  const hasCampaignProgress =
    progress.highestUnlockedLevel > 1 || progress.completedLevels.length > 0;

  const launchCampaign = (lvl: number) => {
    SoundManager.unlock();
    SoundManager.playButtonClick();
    EventBus.emit('ui:start-level', lvl);
  };

  return (
    <DedicatedScreenShell
      title="Select Game Mode"
      subtitle="Choose your combat deployment across Void Empire space"
      backLabel="Main Menu"
      onBack={onBack}
      credits={progress.credits}
      crystals={progress.crystals}
      onCurrencyClick={onOpenArmory}
      maxWidthClass="max-w-5xl"
    >
      <div className="flex flex-col gap-4">
          {/* 1. CAMPAIGN MODE CARD (Featured Full-Width Card) */}
          <article className="overflow-hidden rounded-2xl border border-sky-400/45 bg-gradient-to-br from-[#0b1832]/95 via-[#081124]/95 to-[#060c1a]/95 p-5 sm:p-6 shadow-[0_0_28px_rgba(56,189,248,0.12)]">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-sky-300">
                  <Compass className="h-4 w-4" />
                  <span>Story Campaign</span>
                  <span className="text-slate-600">·</span>
                  <span className="font-mono-num">
                    {progress.completedLevels.length}/10 Sectors Cleared
                  </span>
                </div>

                <h2 className="mt-1.5 font-display text-2xl sm:text-3xl font-bold text-white">
                  CAMPAIGN
                </h2>
                <p className="mt-1.5 max-w-xl text-xs sm:text-sm leading-relaxed text-slate-300">
                  Defend the galaxy through the main story campaign across ten hostile sectors and five Void commanders.
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono-num text-xs text-slate-300">
                  <span>
                    Active: <strong className="text-sky-300">Sector {String(selectedSector).padStart(2, '0')} — {sectorDef.name}</strong>
                  </span>
                  {sectorBoss && (
                    <span className="flex items-center gap-1 text-rose-300">
                      <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
                      {sectorBoss.name}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex shrink-0 flex-col gap-2 sm:flex-row md:flex-col md:min-w-[220px]">
                <button
                  type="button"
                  onClick={() => launchCampaign(selectedSector)}
                  className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-400 via-cyan-400 to-sky-500 px-5 py-3 font-display text-sm sm:text-base font-bold text-slate-950 shadow-[0_0_20px_rgba(56,189,248,0.28)] transition-[filter,transform] duration-150 hover:brightness-110 active:scale-[0.98]"
                >
                  <Play className="h-4 w-4 fill-current" />
                  <span>
                    {hasCampaignProgress
                      ? `Continue Sector ${String(selectedSector).padStart(2, '0')}`
                      : 'Start Sector 01'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    SoundManager.playButtonClick();
                    setShowSectors((v) => !v);
                  }}
                  className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-slate-700/80 bg-[#070e1d]/90 px-4 py-2 text-xs font-semibold text-slate-200 transition-colors hover:border-sky-400/70"
                >
                  <span>{showSectors ? 'Hide Sector List' : 'Choose Sector (1–10)'}</span>
                  {showSectors ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {showSectors && (
              <div className="mt-5 border-t border-slate-800/80 pt-4">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                  {CAMPAIGN_LEVELS.map((lvl) => {
                    const unlocked = lvl.levelNumber <= progress.highestUnlockedLevel;
                    const completed = progress.completedLevels.includes(lvl.levelNumber);
                    const selected = selectedSector === lvl.levelNumber;
                    return (
                      <button
                        key={lvl.levelNumber}
                        type="button"
                        disabled={!unlocked}
                        onClick={() => {
                          SoundManager.playButtonClick();
                          setSelectedSector(lvl.levelNumber);
                        }}
                        className={`flex min-h-[54px] flex-col justify-between rounded-xl border p-2.5 text-left transition-colors ${
                          !unlocked
                            ? 'cursor-not-allowed border-slate-800/50 bg-slate-950/50 text-slate-600'
                            : selected
                            ? 'border-sky-400 bg-sky-500/18 text-white'
                            : 'border-slate-800 bg-[#081022]/85 text-slate-300 hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-center justify-between font-mono-num text-[10px]">
                          <span>S{String(lvl.levelNumber).padStart(2, '0')}</span>
                          {!unlocked ? (
                            <Lock className="h-3 w-3 text-slate-600" />
                          ) : completed ? (
                            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                          ) : null}
                        </div>
                        <div className="truncate font-display text-xs font-bold">{lvl.name}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </article>

          {/* 2–4: ENDLESS SURVIVAL · CHALLENGE MODE · BOSS RUSH */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* 2. ENDLESS SURVIVAL */}
            <article className="flex flex-col justify-between rounded-2xl border border-purple-400/40 bg-gradient-to-br from-[#130e29]/92 via-[#090d1f]/95 to-[#060a16]/95 p-5">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-purple-300">
                  <Flame className="h-4 w-4" />
                  <span>Infinite Waves</span>
                </div>
                <h2 className="mt-1.5 font-display text-xl font-bold text-white">
                  ENDLESS SURVIVAL
                </h2>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
                  Survive endless enemy waves and achieve the highest possible score. Bosses deploy every 5th wave.
                </p>

                <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl border border-slate-800/90 bg-slate-950/65 p-3 font-mono-num">
                  <div>
                    <div className="text-[10px] text-slate-400">Best Wave</div>
                    <div className="text-sm font-bold text-purple-300">
                      Wave {progress.stats.bestEndlessWave || 0}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">Best Score</div>
                    <div className="text-sm font-bold text-white">
                      {progress.stats.bestEndlessScore.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  SoundManager.unlock();
                  SoundManager.playButtonClick();
                  EventBus.emit('ui:start-mode', { mode: 'endless', levelNumber: 6 });
                }}
                className="mt-5 flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-purple-500 px-4 py-2.5 font-display text-sm font-bold text-white transition-colors hover:bg-purple-400 active:scale-[0.98]"
              >
                <Play className="h-4 w-4 fill-current" />
                <span>Play Endless</span>
              </button>
            </article>

            {/* 3. CHALLENGE MODE */}
            <article className="flex flex-col justify-between rounded-2xl border border-amber-400/40 bg-gradient-to-br from-[#19130a]/92 via-[#090e1d]/95 to-[#060a16]/95 p-5">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
                  <Sparkles className="h-4 w-4" />
                  <span>Tactical Trials</span>
                </div>
                <h2 className="mt-1.5 font-display text-xl font-bold text-white">
                  CHALLENGE MODE
                </h2>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
                  Complete special objectives with unique gameplay conditions, restricted loadouts, and bonus bounties.
                </p>

                <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl border border-slate-800/90 bg-slate-950/65 p-3 font-mono-num">
                  <div>
                    <div className="text-[10px] text-slate-400">Completed</div>
                    <div className="text-sm font-bold text-amber-300">
                      {progress.stats.completedChallenges.length} / {CHALLENGES.length}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">Top Bounty</div>
                    <div className="text-sm font-bold text-cyan-300">18 Gems</div>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  SoundManager.playButtonClick();
                  setShowChallenges((v) => !v);
                }}
                className="mt-5 flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 font-display text-sm font-bold text-slate-950 transition-colors hover:bg-amber-300 active:scale-[0.98]"
              >
                <span>{showChallenges ? 'Hide Trials' : 'View Challenges'}</span>
                {showChallenges ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
            </article>

            {/* 4. BOSS RUSH */}
            <article className="flex flex-col justify-between rounded-2xl border border-rose-400/40 bg-gradient-to-br from-[#1b0b15]/92 via-[#090d1e]/95 to-[#060a16]/95 p-5">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-rose-300">
                  <Skull className="h-4 w-4" />
                  <span>5-Boss Gauntlet</span>
                </div>
                <h2 className="mt-1.5 font-display text-xl font-bold text-white">
                  BOSS RUSH
                </h2>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
                  Face all five Void Empire commanders consecutively from Iron Guardian to the Void Emperor.
                </p>

                <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl border border-slate-800/90 bg-slate-950/65 p-3 font-mono-num">
                  <div>
                    <div className="text-[10px] text-slate-400">Gauntlet Clears</div>
                    <div className="text-sm font-bold text-rose-300">
                      {progress.stats.bossRushClears}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">Best Score</div>
                    <div className="text-sm font-bold text-white">
                      {progress.stats.bestBossRushScore.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  SoundManager.unlock();
                  SoundManager.playButtonClick();
                  EventBus.emit('ui:start-mode', { mode: 'boss_rush', levelNumber: 10 });
                }}
                className="mt-5 flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-rose-500 px-4 py-2.5 font-display text-sm font-bold text-white transition-colors hover:bg-rose-400 active:scale-[0.98]"
              >
                <Trophy className="h-4 w-4" />
                <span>Play Boss Rush</span>
              </button>
            </article>
          </div>

          {/* Expandable Challenge Trials List */}
          {showChallenges && (
            <section className="menu-enter rounded-2xl border border-amber-400/35 bg-[#081022]/92 p-4 sm:p-5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-display text-base font-bold text-amber-300">
                  Available Challenge Trials
                </h3>
                <span className="font-mono-num text-xs text-slate-400">
                  {progress.stats.completedChallenges.length}/{CHALLENGES.length} Completed
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {CHALLENGES.map((c) => {
                  const done = progress.stats.completedChallenges.includes(c.id);
                  return (
                    <div
                      key={c.id}
                      className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-950/70 p-4"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 text-[11px]">
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
                          {done && (
                            <span className="flex items-center gap-1 font-semibold text-emerald-400">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Cleared
                            </span>
                          )}
                        </div>
                        <h4 className="mt-1 font-display text-base font-bold text-white">{c.title}</h4>
                        <p className="mt-1 text-xs leading-relaxed text-slate-300">{c.objective}</p>
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-800/80 pt-3">
                        <div className="font-mono-num text-xs">
                          <span className="text-amber-300">+{c.rewardCredits} CR</span>
                          <span className="mx-1.5 text-slate-600">·</span>
                          <span className="text-cyan-300">+{c.rewardCrystals} Gems</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            SoundManager.unlock();
                            SoundManager.playButtonClick();
                            EventBus.emit('ui:start-mode', {
                              mode: 'challenge',
                              challengeId: c.id,
                              levelNumber: c.rules.levelBase,
                            });
                          }}
                          className="flex min-h-[40px] items-center gap-1.5 rounded-lg bg-sky-500 px-3.5 py-2 font-display text-xs font-bold text-slate-950 hover:bg-sky-400"
                        >
                          <Play className="h-3.5 w-3.5 fill-current" />
                          <span>{done ? 'Replay' : 'Play'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Boss Rush Roster Preview */}
          <section className="rounded-2xl border border-slate-800/80 bg-[#081022]/85 p-4">
            <div className="mb-2.5 flex items-center justify-between text-xs">
              <span className="font-display font-bold text-slate-200">
                Boss Rush Gauntlet Sequence
              </span>
              <span className="font-mono-num text-slate-400">
                Reward: +1,400 CR · +10 Gems Clear Bonus
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {BOSS_RUSH_ORDER.map((bId, idx) => {
                const boss = BOSS_CONFIGS[bId];
                return (
                  <div
                    key={bId}
                    className="rounded-xl border border-slate-800/90 bg-slate-950/65 px-3 py-2 text-xs"
                  >
                    <div className="font-mono-num text-[10px] text-slate-500">Stage {idx + 1}</div>
                    <div className="truncate font-display font-bold text-rose-300">
                      {boss.name}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
      </div>
    </DedicatedScreenShell>
  );
};
