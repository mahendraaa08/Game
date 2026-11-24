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
import {
  BOSS_RUSH_CLEAR_REWARD,
  formatSectorRewardText,
  getChallengePayout,
} from '../game/config/EconomyConfig';
import {
  BOSS_RUSH_ORDER,
  CAMPAIGN_DIFFICULTIES,
  CAMPAIGN_DIFFICULTY_ORDER,
  CHALLENGES,
  CHALLENGE_CATEGORY_LABELS,
  CHALLENGE_CATEGORY_ORDER,
  CHALLENGE_DIFFICULTY_ORDER,
  CampaignDifficulty,
  ChallengeCategory,
  ChallengeDifficulty,
  GameMode,
  getBossRushAscensionModifiers,
  getBossRushAscensionRank,
  getBossRushAscensionReward,
} from '../game/config/GameModeConfig';
import { CAMPAIGN_LEVELS } from '../game/config/LevelConfig';
import {
  PLAYER_EXP_SOURCES,
  getCampaignClearTotalExp,
} from '../game/config/LevelProgressionConfig';
import { SoundManager } from '../game/audio/SoundManager';
import { ProgressionManager } from '../game/systems/ProgressionManager';
import { EventBus } from '../game/utils/EventBus';
import { PlayerProgress } from '../game/utils/StorageManager';
import { DedicatedScreenShell } from './DedicatedScreenShell';
import { ExpStarIcon } from './ui/CurrencyBadges';

interface ModeSelectorOverlayProps {
  progress: PlayerProgress;
  onBack: () => void;
}

const DIFFICULTY_TAB_ACCENTS: Record<
  CampaignDifficulty,
  { active: string; text: string }
> = {
  easy: {
    active: 'border-emerald-300/75 bg-emerald-500/15 text-white',
    text: 'text-emerald-300',
  },
  normal: {
    active: 'border-sky-300/75 bg-sky-500/15 text-white',
    text: 'text-sky-300',
  },
  hard: {
    active: 'border-amber-300/75 bg-amber-500/15 text-white',
    text: 'text-amber-300',
  },
  insane: {
    active: 'border-orange-300/75 bg-orange-500/15 text-white',
    text: 'text-orange-300',
  },
  nightmare: {
    active: 'border-rose-300/75 bg-rose-500/15 text-white',
    text: 'text-rose-300',
  },
};

const TIER_ACCENTS: Record<ChallengeDifficulty, { active: string; text: string }> = {
  Standard: {
    active: 'border-sky-300/80 bg-sky-500/16 text-white',
    text: 'text-sky-300',
  },
  Hard: {
    active: 'border-amber-300/80 bg-amber-500/16 text-white',
    text: 'text-amber-300',
  },
  Extreme: {
    active: 'border-rose-300/80 bg-rose-500/16 text-white',
    text: 'text-rose-300',
  },
};

function formatDurationSec(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  const mins = Math.floor(s / 60);
  const rem = s % 60;
  return mins > 0 ? `${mins}m ${String(rem).padStart(2, '0')}s` : `${rem}s`;
}

function getInitialDifficulty(progress: PlayerProgress): CampaignDifficulty {
  const pref = progress.selectedCampaignDifficulty ?? 'easy';
  if ((progress.campaignProgress[pref]?.highestUnlockedLevel ?? 0) >= 1) {
    return pref;
  }
  return 'easy';
}

export const ModeSelectorOverlay: React.FC<ModeSelectorOverlayProps> = ({
  progress,
  onBack,
}) => {
  const [selectedMode, setSelectedMode] = useState<GameMode>('campaign');

  // Campaign state (5 difficulties x 10 sectors)
  const [selectedDifficulty, setSelectedDifficulty] = useState<CampaignDifficulty>(() =>
    getInitialDifficulty(progress)
  );
  const activeBucket =
    progress.campaignProgress[selectedDifficulty] ?? progress.campaignProgress.easy;
  const maxUnlockedInDiff = Math.max(1, activeBucket?.highestUnlockedLevel ?? 1);
  const [selectedSector, setSelectedSector] = useState<number>(() => maxUnlockedInDiff);

  // Challenge state (4 categories x 3 tiers)
  const [selectedCategory, setSelectedCategory] = useState<'all' | ChallengeCategory>('all');
  const [selectedChallengeId, setSelectedChallengeId] = useState<string>(
    () =>
      CHALLENGES.find(
        (c) =>
          (progress.stats.completedChallengeTiers[c.id]?.length ?? 0) <
          CHALLENGE_DIFFICULTY_ORDER.length
      )?.id ?? CHALLENGES[0].id
  );
  const [selectedChallengeTier, setSelectedChallengeTier] = useState<ChallengeDifficulty>(() => {
    const initialChallenge =
      CHALLENGES.find(
        (c) =>
          (progress.stats.completedChallengeTiers[c.id]?.length ?? 0) <
          CHALLENGE_DIFFICULTY_ORDER.length
      ) ?? CHALLENGES[0];
    const doneTiers = progress.stats.completedChallengeTiers[initialChallenge.id] ?? [];
    return (
      CHALLENGE_DIFFICULTY_ORDER.find((t) => !doneTiers.includes(t)) ??
      initialChallenge.legacyDifficulty
    );
  });

  // Derived Campaign telemetry
  const diffConfig = CAMPAIGN_DIFFICULTIES[selectedDifficulty];
  const clampedSector = Math.max(1, Math.min(maxUnlockedInDiff, selectedSector));
  const sectorDef = CAMPAIGN_LEVELS[clampedSector - 1] ?? CAMPAIGN_LEVELS[0];
  const nextSectorDef = CAMPAIGN_LEVELS[clampedSector];
  const selectedSectorUnlocked = sectorDef.levelNumber <= maxUnlockedInDiff;
  const totalCampaignClears = CAMPAIGN_DIFFICULTY_ORDER.reduce(
    (sum, d) => sum + (progress.campaignProgress[d]?.completedLevels.length ?? 0),
    0
  );
  const sectorBestScore = activeBucket?.levelScores[clampedSector] ?? 0;
  const sectorRewardText = formatSectorRewardText(
    clampedSector,
    CAMPAIGN_LEVELS.length,
    Boolean(sectorDef.bossId),
    nextSectorDef?.name,
    selectedDifficulty
  );
  const sectorClearExp = getCampaignClearTotalExp(clampedSector, selectedDifficulty);

  // Derived Challenge telemetry
  const filteredChallenges = useMemo(
    () =>
      selectedCategory === 'all'
        ? CHALLENGES
        : CHALLENGES.filter((c) => c.category === selectedCategory),
    [selectedCategory]
  );

  const selectedChallenge = useMemo(
    () =>
      filteredChallenges.find((c) => c.id === selectedChallengeId) ??
      CHALLENGES.find((c) => c.id === selectedChallengeId) ??
      filteredChallenges[0] ??
      CHALLENGES[0],
    [filteredChallenges, selectedChallengeId]
  );

  const activeTierCfg =
    selectedChallenge.tiers[selectedChallengeTier] ??
    selectedChallenge.tiers[selectedChallenge.legacyDifficulty];
  const completedTiersForSelected = progress.stats.completedChallengeTiers[selectedChallenge.id] ?? [];
  const selectedTierDone = completedTiersForSelected.includes(activeTierCfg.difficulty);
  const selectedChallengePayout = getChallengePayout(
    activeTierCfg.rewardCredits,
    activeTierCfg.rewardCrystals,
    selectedTierDone
  );
  const tierExpScale =
    activeTierCfg.difficulty === 'Extreme'
      ? 1.45
      : activeTierCfg.difficulty === 'Hard'
      ? 1.2
      : 1.0;
  const challengeClearExp = Math.round(
    (PLAYER_EXP_SOURCES.challengeClearBonus + PLAYER_EXP_SOURCES.runCompletionBase) * tierExpScale
  );
  const totalTiersCompleted = CHALLENGES.reduce(
    (sum, c) => sum + (progress.stats.completedChallengeTiers[c.id]?.length ?? 0),
    0
  );
  const totalTiersPossible = CHALLENGES.length * CHALLENGE_DIFFICULTY_ORDER.length;

  const selectMode = (mode: GameMode) => {
    if (selectedMode === mode) return;
    SoundManager.unlock();
    SoundManager.playButtonClick();
    setSelectedMode(mode);
  };

  const handleSelectDifficulty = (diff: CampaignDifficulty) => {
    const bucket = progress.campaignProgress[diff];
    if (!bucket || bucket.highestUnlockedLevel <= 0) return;
    SoundManager.unlock();
    SoundManager.playButtonClick();
    setSelectedDifficulty(diff);
    setSelectedSector(Math.max(1, bucket.highestUnlockedLevel));
    ProgressionManager.setSelectedCampaignDifficulty(diff);
  };

  const handleSelectCategory = (cat: 'all' | ChallengeCategory) => {
    SoundManager.unlock();
    SoundManager.playButtonClick();
    setSelectedCategory(cat);
    const list = cat === 'all' ? CHALLENGES : CHALLENGES.filter((c) => c.category === cat);
    if (list.length > 0 && !list.some((c) => c.id === selectedChallengeId)) {
      const next = list[0];
      setSelectedChallengeId(next.id);
      const done = progress.stats.completedChallengeTiers[next.id] ?? [];
      setSelectedChallengeTier(
        CHALLENGE_DIFFICULTY_ORDER.find((t) => !done.includes(t)) ?? next.legacyDifficulty
      );
    }
  };

  const handleSelectChallenge = (cId: string) => {
    SoundManager.unlock();
    SoundManager.playButtonClick();
    setSelectedChallengeId(cId);
    const ch = CHALLENGES.find((c) => c.id === cId);
    if (ch) {
      const done = progress.stats.completedChallengeTiers[ch.id] ?? [];
      setSelectedChallengeTier(
        CHALLENGE_DIFFICULTY_ORDER.find((t) => !done.includes(t)) ?? ch.legacyDifficulty
      );
    }
  };

  const handleLaunchSelected = () => {
    SoundManager.unlock();
    SoundManager.playButtonClick();

    if (selectedMode === 'campaign') {
      if (!selectedSectorUnlocked) return;
      ProgressionManager.setSelectedCampaignDifficulty(selectedDifficulty);
      EventBus.emit('ui:start-mode', {
        mode: 'campaign',
        campaignDifficulty: selectedDifficulty,
        levelNumber: clampedSector,
      });
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
        challengeDifficulty: activeTierCfg.difficulty,
        levelNumber: activeTierCfg.rules.levelBase,
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
      metric: `${totalCampaignClears}/50 Cleared`,
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
      metric: `${totalTiersCompleted}/${totalTiersPossible} Tiers`,
      icon: Sparkles,
      selectedBorder: 'border-amber-300/70',
      selectedBg: 'bg-[#1a140b]/95',
      iconColor: 'text-amber-300',
    },
    {
      id: 'boss_rush',
      title: 'Boss Rush',
      metric: `Rank ${getBossRushAscensionRank(progress.stats.bossRushClears)} · ${progress.stats.bossRushClears} Clears`,
      icon: Skull,
      selectedBorder: 'border-rose-300/70',
      selectedBg: 'bg-[#1d0e18]/95',
      iconColor: 'text-rose-300',
    },
  ];

  const bossRushRank = getBossRushAscensionRank(progress.stats.bossRushClears);
  const bossRushAscMods = getBossRushAscensionModifiers(bossRushRank);
  const bossRushAscReward = getBossRushAscensionReward(
    bossRushRank,
    BOSS_RUSH_CLEAR_REWARD.credits,
    BOSS_RUSH_CLEAR_REWARD.crystals,
    PLAYER_EXP_SOURCES.bossRushClearBonus
  );
  const nextBossRushRank = bossRushRank + 1;
  const nextBossRushAscMods = getBossRushAscensionModifiers(nextBossRushRank);
  const nextBossRushAscReward = getBossRushAscensionReward(
    nextBossRushRank,
    BOSS_RUSH_CLEAR_REWARD.credits,
    BOSS_RUSH_CLEAR_REWARD.crystals,
    PLAYER_EXP_SOURCES.bossRushClearBonus
  );

  return (
    <DedicatedScreenShell
      title="SELECT GAME MODE"
      backLabel="Main Menu"
      onBack={onBack}
      credits={progress.credits}
      crystals={progress.crystals}
      maxWidthClass="max-w-6xl"
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr] lg:items-start lg:gap-6">
        {/* LEFT RAIL: 4 Game Modes */}
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

        {/* RIGHT STAGE */}
        <section
          key={selectedMode}
          aria-live="polite"
          className="panel-swap flex flex-col justify-between gap-5 rounded-2xl border border-slate-700/70 bg-[#081122]/92 p-5 sm:p-6 lg:p-7"
        >
          {/* 1. CAMPAIGN (5 Difficulties x 10 Sectors) */}
          {selectedMode === 'campaign' && (
            <>
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center justify-between gap-2 font-mono-num text-xs text-slate-400">
                  <span className="font-semibold uppercase tracking-wider text-sky-300">
                    Campaign · {diffConfig.label}
                  </span>
                  <span>
                    {(activeBucket?.completedLevels.length ?? 0)}/{CAMPAIGN_LEVELS.length} Sectors Cleared ({diffConfig.label})
                  </span>
                </div>

                {/* 5 Difficulty Tabs */}
                <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-5">
                  {CAMPAIGN_DIFFICULTY_ORDER.map((diff, dIdx) => {
                    const cfg = CAMPAIGN_DIFFICULTIES[diff];
                    const bucket = progress.campaignProgress[diff];
                    const unlocked = (bucket?.highestUnlockedLevel ?? 0) >= 1;
                    const completedCount = bucket?.completedLevels.length ?? 0;
                    const isPicked = selectedDifficulty === diff;
                    const accent = DIFFICULTY_TAB_ACCENTS[diff];
                    const prevCfg = dIdx > 0 ? CAMPAIGN_DIFFICULTIES[CAMPAIGN_DIFFICULTY_ORDER[dIdx - 1]] : null;

                    return (
                      <button
                        key={diff}
                        type="button"
                        disabled={!unlocked}
                        title={
                          unlocked
                            ? cfg.description
                            : `Clear ${prevCfg?.label ?? 'previous'} Sector 10 to unlock`
                        }
                        onClick={() => handleSelectDifficulty(diff)}
                        className={`flex flex-col justify-between rounded-xl border px-3 py-2 text-left transition-[border-color,background-color] duration-150 ${
                          !unlocked
                            ? 'cursor-not-allowed border-slate-800/60 bg-slate-950/45 text-slate-600'
                            : isPicked
                            ? accent.active
                            : 'border-slate-800 bg-[#060c1a]/85 text-slate-300 hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span
                            className={`font-display text-xs font-bold ${
                              unlocked ? (isPicked ? 'text-white' : accent.text) : 'text-slate-600'
                            }`}
                          >
                            {cfg.label}
                          </span>
                          {!unlocked ? (
                            <Lock className="h-3 w-3 text-slate-600" />
                          ) : completedCount >= 10 ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                          ) : null}
                        </div>
                        <div className="mt-0.5 font-mono-num text-[10.5px] text-slate-400">
                          {unlocked ? `${completedCount}/10 Cleared` : 'Locked'}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <p className="text-xs leading-relaxed text-slate-400">
                  {diffConfig.description}
                </p>

                <div>
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <h2 className="font-display text-xl sm:text-2xl font-bold text-white">
                      Sector {String(clampedSector).padStart(2, '0')} — {sectorDef.name}
                    </h2>
                    <span className="font-mono-num text-xs text-slate-400">
                      {sectorDef.subtitle}
                    </span>
                  </div>
                  <p className="mt-2 max-w-2xl text-xs sm:text-sm leading-relaxed text-slate-300">
                    {sectorDef.objective}
                  </p>
                </div>

                {/* Telemetry Line */}
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-y border-slate-800/80 py-3 font-mono-num text-xs">
                  <span className="text-slate-400">
                    Waves: <strong className="text-white">{sectorDef.waves.length}</strong>
                  </span>
                  <span className="text-slate-400">
                    Enemy HP:{' '}
                    <strong className={DIFFICULTY_TAB_ACCENTS[selectedDifficulty].text}>
                      {Math.round(diffConfig.enemyHpMult * 100)}%
                    </strong>
                  </span>
                  <span className="text-slate-400">
                    Best ({diffConfig.shortLabel}):{' '}
                    <strong className="text-white">
                      {sectorBestScore > 0 ? sectorBestScore.toLocaleString() : '—'}
                    </strong>
                  </span>
                  <span className="text-emerald-300">{sectorRewardText}</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-purple-300">
                    <ExpStarIcon className="h-3.5 w-3.5 shrink-0" />
                    +{sectorClearExp.toLocaleString()} Clear EXP
                  </span>
                </div>

                {/* Sector Selector (01-10) */}
                <div>
                  <div className="mb-2.5 flex items-center justify-between text-xs">
                    <span className="font-display font-semibold text-slate-200">
                      Select Sector ({diffConfig.label})
                    </span>
                    <span className="font-mono-num text-[11px] text-slate-400">
                      Unlocked to S{String(maxUnlockedInDiff).padStart(2, '0')}
                    </span>
                  </div>

                  <div className="scroll-panel grid max-h-[212px] sm:max-h-none grid-cols-2 gap-2 overflow-y-auto pr-1.5 sm:grid-cols-5">
                    {CAMPAIGN_LEVELS.map((lvl) => {
                      const unlocked = lvl.levelNumber <= maxUnlockedInDiff;
                      const completed = activeBucket?.completedLevels.includes(lvl.levelNumber) ?? false;
                      const active = clampedSector === lvl.levelNumber;

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

              <div className="flex justify-end border-t border-slate-800/80 pt-4">
                <button
                  type="button"
                  disabled={!selectedSectorUnlocked}
                  onClick={handleLaunchSelected}
                  className="flex min-h-[48px] w-full sm:w-auto items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-sky-400 to-cyan-400 px-6 py-2.5 font-display text-sm sm:text-base font-bold tracking-wider text-slate-950 transition-[filter,transform] duration-150 hover:brightness-105 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 sm:min-w-[240px]"
                >
                  <Play className="h-4 w-4 fill-current" />
                  <span>
                    Play {diffConfig.label} · Sector {String(clampedSector).padStart(2, '0')}
                  </span>
                </button>
              </div>
            </>
          )}

          {/* 2. ENDLESS SURVIVAL */}
          {selectedMode === 'endless' && (
            <>
              <div className="flex flex-col gap-5">
                <div className="font-mono-num text-xs font-semibold uppercase tracking-wider text-purple-300">
                  Endless Survival · Infinite Scaling
                </div>

                <div>
                  <h2 className="font-display text-xl sm:text-2xl font-bold text-white">
                    Endless Survival Simulation
                  </h2>
                  <p className="mt-2 max-w-2xl text-xs sm:text-sm leading-relaxed text-slate-300">
                    Waves continue indefinitely with steady hostile scaling. Milestone Dreadnoughts intercept every 5th wave with escalating combat pressure; defeating each milestone Boss (Waves 5, 10, 15, and onward) opens a 3-choice <strong className="text-purple-300">Endless Upgrade Draft</strong> for temporary per-run combat boosts.
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
                    <div className="text-[11px] text-slate-400">Upgrade Draft</div>
                    <div className="mt-1 text-base sm:text-lg font-bold text-cyan-300">
                      Every 5 Waves
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-400">Boss Milestone</div>
                    <div className="mt-1 text-base sm:text-lg font-bold text-slate-200">
                      Every 5 Waves
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono-num text-xs text-slate-400">
                  <span className="inline-flex items-center gap-1.5 font-semibold text-purple-300">
                    <ExpStarIcon className="h-3.5 w-3.5 shrink-0" />
                    +{PLAYER_EXP_SOURCES.endlessPerWaveClear} EXP / Wave Cleared
                  </span>
                  <span className="text-slate-600">·</span>
                  <span>+1 Void Gem at Waves 10, 20, 30... &amp; Boss Milestones</span>
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

          {/* 3. CHALLENGE MODE (4 Categories x 3 Tiers) */}
          {selectedMode === 'challenge' && (
            <>
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center justify-between gap-2 font-mono-num text-xs">
                  <span className="font-semibold uppercase tracking-wider text-amber-300">
                    Challenge Mode · {CHALLENGE_CATEGORY_LABELS[selectedChallenge.category]}
                  </span>
                  <span className="text-slate-400">
                    {totalTiersCompleted}/{totalTiersPossible} Tiers Cleared
                  </span>
                </div>

                {/* 4 Category Filter Tabs + All */}
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleSelectCategory('all')}
                    className={`rounded-lg border px-2.5 py-1.5 font-display text-[11px] font-bold tracking-wide transition-colors ${
                      selectedCategory === 'all'
                        ? 'border-amber-300/75 bg-amber-500/15 text-amber-200'
                        : 'border-slate-800 bg-[#060c1a]/85 text-slate-400 hover:border-slate-600 hover:text-slate-200'
                    }`}
                  >
                    All ({CHALLENGES.length})
                  </button>
                  {CHALLENGE_CATEGORY_ORDER.map((cat) => {
                    const count = CHALLENGES.filter((c) => c.category === cat).length;
                    const active = selectedCategory === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => handleSelectCategory(cat)}
                        className={`rounded-lg border px-2.5 py-1.5 font-display text-[11px] font-bold tracking-wide transition-colors ${
                          active
                            ? 'border-amber-300/75 bg-amber-500/15 text-amber-200'
                            : 'border-slate-800 bg-[#060c1a]/85 text-slate-400 hover:border-slate-600 hover:text-slate-200'
                        }`}
                      >
                        {CHALLENGE_CATEGORY_LABELS[cat]} ({count})
                      </button>
                    );
                  })}
                </div>

                {/* Selected Challenge + 3 Difficulty Tiers */}
                <div className="rounded-xl border border-slate-800/90 bg-[#060c1a]/85 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h2 className="font-display text-lg sm:text-xl font-bold text-white">
                        {selectedChallenge.title}
                      </h2>
                      <span
                        className={`font-mono-num text-xs font-semibold ${
                          selectedTierDone ? 'text-emerald-400' : 'text-sky-300'
                        }`}
                      >
                        {selectedTierDone ? `${activeTierCfg.difficulty} Cleared` : 'First Clear Available'}
                      </span>
                    </div>

                    {/* 3 Difficulty Tier Buttons */}
                    <div className="flex items-center gap-1.5">
                      {CHALLENGE_DIFFICULTY_ORDER.map((tier) => {
                        const isTierActive = activeTierCfg.difficulty === tier;
                        const isTierDone = completedTiersForSelected.includes(tier);
                        const accent = TIER_ACCENTS[tier];
                        return (
                          <button
                            key={tier}
                            type="button"
                            onClick={() => {
                              SoundManager.playButtonClick();
                              setSelectedChallengeTier(tier);
                            }}
                            className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 font-mono-num text-[11px] font-bold transition-colors ${
                              isTierActive
                                ? accent.active
                                : 'border-slate-800 bg-[#050a16] text-slate-400 hover:border-slate-600 hover:text-slate-200'
                            }`}
                          >
                            <span className={isTierActive ? 'text-white' : accent.text}>
                              {tier}
                            </span>
                            {isTierDone && <CheckCircle2 className="h-3 w-3 text-emerald-400" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <p className="mt-2 max-w-2xl text-xs sm:text-sm leading-relaxed text-slate-300">
                    {activeTierCfg.objective}
                  </p>

                  <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono-num text-xs text-slate-400">
                    <span className="text-slate-200">{activeTierCfg.constraintsLabel}</span>
                    <span className="text-slate-300">
                      {selectedChallengePayout.isReplay ? 'Replay (25%):' : 'First Clear:'}
                    </span>
                    <span className="text-amber-300">+{selectedChallengePayout.credits} CR</span>
                    <span className="text-cyan-300">+{selectedChallengePayout.crystals} Gems</span>
                    <span className="inline-flex items-center gap-1 font-semibold text-purple-300">
                      <ExpStarIcon className="h-3.5 w-3.5 shrink-0" />
                      +{challengeClearExp} EXP
                    </span>
                  </div>
                </div>

                {/* Challenge List */}
                <div className="scroll-panel grid max-h-[212px] grid-cols-1 gap-2.5 overflow-y-auto pr-1.5 sm:grid-cols-2">
                  {filteredChallenges.map((c) => {
                    const tiersDone = progress.stats.completedChallengeTiers[c.id] ?? [];
                    const isPicked = selectedChallenge.id === c.id;
                    const previewTier = isPicked ? activeTierCfg : c.tiers[c.legacyDifficulty];
                    const previewDone = tiersDone.includes(previewTier.difficulty);
                    const payout = getChallengePayout(
                      previewTier.rewardCredits,
                      previewTier.rewardCrystals,
                      previewDone
                    );

                    return (
                      <button
                        key={c.id}
                        type="button"
                        aria-pressed={isPicked}
                        onClick={() => handleSelectChallenge(c.id)}
                        className={`flex flex-col justify-between gap-2 rounded-xl border p-3.5 text-left transition-[border-color,background-color] duration-150 ${
                          isPicked
                            ? 'border-amber-300/75 bg-amber-500/12'
                            : 'border-slate-800 bg-[#060c1a]/85 hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 font-mono-num text-[10.5px]">
                          <span className="truncate font-semibold text-amber-300/90">
                            {CHALLENGE_CATEGORY_LABELS[c.category]}
                          </span>
                          <span className="shrink-0 text-slate-400">
                            {tiersDone.length}/3 Tiers
                          </span>
                        </div>

                        <div className="font-display text-sm font-bold text-white">
                          {c.title}
                        </div>

                        <div className="flex items-center justify-between gap-2 font-mono-num text-[11px]">
                          <div className="flex items-center gap-1.5 text-slate-400">
                            <span className="text-amber-300">+{payout.credits} CR</span>
                            <span className="text-slate-600">·</span>
                            <span className="text-cyan-300">+{payout.crystals} Gems</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {CHALLENGE_DIFFICULTY_ORDER.map((t) => {
                              const done = tiersDone.includes(t);
                              return (
                                <span
                                  key={t}
                                  className={`rounded px-1.5 py-0.5 text-[9.5px] font-bold ${
                                    done
                                      ? 'bg-emerald-500/20 text-emerald-300'
                                      : 'bg-slate-900 text-slate-500'
                                  }`}
                                >
                                  {t[0]}
                                </span>
                              );
                            })}
                          </div>
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
                  className="flex min-h-[48px] w-full sm:w-auto items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 px-6 py-2.5 font-display text-sm sm:text-base font-bold tracking-wider text-slate-950 transition-[filter,transform] duration-150 hover:brightness-105 active:scale-[0.98] sm:min-w-[230px]"
                >
                  <Play className="h-4 w-4 fill-current" />
                  <span>Start {activeTierCfg.difficulty} Trial</span>
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
                    Boss Rush · Ascension Rank {bossRushRank}
                  </span>
                  <span className="text-slate-400">
                    {progress.stats.bossRushClears} Clears · Best{' '}
                    {progress.stats.bestBossRushScore.toLocaleString()} PTS
                    {(progress.stats.bestBossRushTimeSec ?? 0) > 0
                      ? ` · Best Time ${formatDurationSec(progress.stats.bestBossRushTimeSec!)}`
                      : ''}
                  </span>
                </div>

                <div>
                  <h2 className="font-display text-xl sm:text-2xl font-bold text-white">
                    Void Commander Boss Rush
                  </h2>
                  <p className="mt-2 max-w-2xl text-xs sm:text-sm leading-relaxed text-slate-300">
                    Engage all {BOSS_RUSH_ORDER.length} scaled Void Empire dreadnoughts back-to-back without automatic healing. Between stages 1–4, choose 1 of 3 <strong className="text-rose-300">Tactical Recovery Draft</strong> protocols. Full gauntlet clears advance your Ascension Rank and unlock higher bounty tiers.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3 border-y border-slate-800/80 py-3.5 font-mono-num text-xs sm:grid-cols-3">
                  <div>
                    <div className="text-[11px] text-slate-400">Ascension Scaling (Rank {bossRushRank})</div>
                    <div className="mt-1 font-bold text-rose-300">
                      {bossRushAscMods.hpMult.toFixed(2)}x HP · {bossRushAscMods.damageMult.toFixed(2)}x DMG · {bossRushAscMods.attackRateMult.toFixed(2)}x Rate
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-400">
                      Clear Bounty{bossRushAscReward.creditsBonusPct > 0 ? ` (+${bossRushAscReward.creditsBonusPct}% Rank)` : ''}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 font-bold">
                      <span className="text-amber-300">
                        +{bossRushAscReward.totalClearCredits.toLocaleString()} CR
                      </span>
                      <span className="text-slate-600">·</span>
                      <span className="text-cyan-300">
                        +{bossRushAscReward.totalClearCrystals} Gems
                      </span>
                      <span className="text-slate-600">·</span>
                      <span className="inline-flex items-center gap-1 text-purple-300">
                        <ExpStarIcon className="h-3.5 w-3.5 shrink-0" />
                        +{bossRushAscReward.clearExp + PLAYER_EXP_SOURCES.runCompletionBase} EXP
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-400">Next Rank ({nextBossRushRank}) Preview</div>
                    <div className="mt-1 font-semibold text-slate-200">
                      {nextBossRushAscMods.hpMult.toFixed(2)}x HP · +{nextBossRushAscReward.totalClearCredits.toLocaleString()} CR · +{nextBossRushAscReward.totalClearCrystals} Gems
                    </div>
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
