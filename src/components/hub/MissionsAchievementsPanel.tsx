import React, { useMemo, useRef, useState } from 'react';
import { Award, Calendar, CheckCircle2, Clock, Lock, Medal, X } from 'lucide-react';
import {
  AchievementCategory,
  AchievementDefinition,
  ACHIEVEMENTS,
} from '../../game/config/AchievementConfig';
import {
  selectDailyMissions,
  selectWeeklyChallenges,
} from '../../game/config/MissionConfig';
import { SoundManager } from '../../game/audio/SoundManager';
import { ActionResult, ProgressionManager } from '../../game/systems/ProgressionManager';
import { PlayerProgress } from '../../game/utils/StorageManager';

interface MissionsAchievementsPanelProps {
  progress: PlayerProgress;
  onFeedback: (res: ActionResult) => void;
}

const CATEGORIES: Array<'All' | AchievementCategory> = [
  'All',
  'Combat Master',
  'Boss Slayer',
  'Survivor',
  'Galaxy Explorer',
  'Weapon Specialist',
  'Ship Collector',
  'Campaign Hero',
  'Legendary Pilot',
];

function getTimeUntilLocalMidnight(): string {
  const now = new Date();
  const nextMidnight = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
    0,
    0,
    0,
    0
  );
  const diffMs = Math.max(0, nextMidnight.getTime() - now.getTime());
  const hrs = Math.floor(diffMs / 3600000);
  const mins = Math.floor((diffMs % 3600000) / 60000);
  return `${hrs}h ${mins}m`;
}

function getTimeUntilWeeklyResetUtc(): string {
  const now = new Date();
  const day = now.getUTCDay() || 7; // 1=Mon .. 7=Sun
  const daysToMon = 8 - day;
  const nextMonday = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + daysToMon, 0, 0, 0, 0)
  );
  const diffMs = Math.max(0, nextMonday.getTime() - now.getTime());
  const days = Math.floor(diffMs / 86400000);
  const hrs = Math.floor((diffMs % 86400000) / 3600000);
  return days > 0 ? `${days}d ${hrs}h` : `${hrs}h`;
}

export const MissionsAchievementsPanel: React.FC<MissionsAchievementsPanelProps> = ({
  progress,
  onFeedback,
}) => {
  const [subView, setSubView] = useState<'missions' | 'achievements'>('missions');
  const [catFilter, setCatFilter] = useState<'All' | AchievementCategory>('All');
  const [inspectedMedal, setInspectedMedal] = useState<AchievementDefinition | null>(null);
  const lastClaimTsRef = useRef<number>(0);

  const dailyList = selectDailyMissions(progress.dailyMissions.resetKey);
  const weeklyList = selectWeeklyChallenges(progress.weeklyChallenges.resetKey);

  const dailyClaimedCount = useMemo(
    () => dailyList.filter((m) => progress.dailyMissions.claimedIds.includes(m.id)).length,
    [dailyList, progress.dailyMissions.claimedIds]
  );

  const weeklyClaimedCount = useMemo(
    () => weeklyList.filter((m) => progress.weeklyChallenges.claimedIds.includes(m.id)).length,
    [weeklyList, progress.weeklyChallenges.claimedIds]
  );

  const readyMissionsCount = useMemo(() => {
    const dailyReady = dailyList.filter((m) => {
      const cur = progress.dailyMissions.progress[m.id] ?? 0;
      return cur >= m.target && !progress.dailyMissions.claimedIds.includes(m.id);
    }).length;
    const weeklyReady = weeklyList.filter((m) => {
      const cur = progress.weeklyChallenges.progress[m.id] ?? 0;
      return cur >= m.target && !progress.weeklyChallenges.claimedIds.includes(m.id);
    }).length;
    return dailyReady + weeklyReady;
  }, [dailyList, weeklyList, progress.dailyMissions, progress.weeklyChallenges]);

  const readyAchievementsCount = useMemo(
    () =>
      ACHIEVEMENTS.filter((a) => {
        const cur = ProgressionManager.getAchievementMetricValue(progress, a.metric);
        return cur >= a.target && !progress.claimedAchievements.includes(a.id);
      }).length,
    [progress]
  );

  const filteredAchievements = useMemo(
    () =>
      catFilter === 'All'
        ? ACHIEVEMENTS
        : ACHIEVEMENTS.filter((a) => a.category === catFilter),
    [catFilter]
  );

  const overallMedalPct = Math.round(
    (progress.claimedAchievements.length / ACHIEVEMENTS.length) * 100
  );

  const guardClaim = (): boolean => {
    const now = Date.now();
    if (now - lastClaimTsRef.current < 280) return false;
    lastClaimTsRef.current = now;
    return true;
  };

  return (
    <>
      <div className="flex flex-col gap-4">
        {/* Unified Segmented Navigation: Daily & Weekly Directives | Medals & Achievements */}
        <div
          role="tablist"
          aria-label="Missions and Medals Sections"
          className="grid w-full sm:w-auto grid-cols-2 gap-1.5 rounded-xl border border-slate-800/90 bg-[#060d1c]/90 p-1 sm:inline-grid"
        >
          <button
            type="button"
            role="tab"
            aria-selected={subView === 'missions'}
            onClick={() => {
              SoundManager.playButtonClick();
              setSubView('missions');
            }}
            className={`flex min-h-[42px] items-center justify-center gap-2 rounded-lg border px-3 sm:px-5 text-xs font-bold transition-[border-color,background-color,color] duration-150 ${
              subView === 'missions'
                ? 'border-cyan-300/55 bg-cyan-400/15 text-cyan-100'
                : 'border-transparent text-slate-400 hover:bg-[#0c162b] hover:text-slate-200'
            }`}
          >
            <Clock className="h-3.5 w-3.5 shrink-0 text-cyan-300" />
            <span className="truncate">Daily &amp; Weekly Directives</span>
            {readyMissionsCount > 0 && (
              <span className="shrink-0 rounded bg-emerald-400 px-1.5 py-0.5 font-mono-num text-[10px] font-bold text-slate-950">
                {readyMissionsCount}
              </span>
            )}
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={subView === 'achievements'}
            onClick={() => {
              SoundManager.playButtonClick();
              setSubView('achievements');
            }}
            className={`flex min-h-[42px] items-center justify-center gap-2 rounded-lg border px-3 sm:px-5 text-xs font-bold transition-[border-color,background-color,color] duration-150 ${
              subView === 'achievements'
                ? 'border-amber-300/55 bg-amber-400/15 text-amber-100'
                : 'border-transparent text-slate-400 hover:bg-[#0c162b] hover:text-slate-200'
            }`}
          >
            <Medal className="h-3.5 w-3.5 shrink-0 text-amber-300" />
            <span className="truncate">Medals &amp; Achievements</span>
            {readyAchievementsCount > 0 && (
              <span className="shrink-0 rounded bg-amber-400 px-1.5 py-0.5 font-mono-num text-[10px] font-bold text-slate-950">
                {readyAchievementsCount}
              </span>
            )}
          </button>
        </div>

        {/* VIEW 1: DAILY & WEEKLY DIRECTIVES */}
        {subView === 'missions' && (
          <div className="panel-swap grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Daily Directives */}
            <section className="flex flex-col rounded-2xl border border-slate-700/70 bg-[#081122]/90 p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                <div>
                  <div className="flex items-center gap-2 font-display text-sm font-bold tracking-wide text-cyan-300">
                    <Clock className="h-4 w-4" />
                    <span>DAILY DIRECTIVES</span>
                  </div>
                  <div className="mt-0.5 font-mono-num text-[11px] text-slate-400">
                    Progress: {dailyClaimedCount}/{dailyList.length} Claimed
                  </div>
                </div>
                <span className="font-mono-num text-[11px] text-slate-400">
                  Resets in {getTimeUntilLocalMidnight()}
                </span>
              </div>

              <div className="scroll-panel flex flex-col gap-2.5 lg:max-h-[calc(100dvh-280px)] lg:overflow-y-auto lg:pr-1">
                {dailyList.map((m) => {
                  const cur = Math.min(m.target, progress.dailyMissions.progress[m.id] ?? 0);
                  const pct = Math.round((cur / m.target) * 100);
                  const claimed = progress.dailyMissions.claimedIds.includes(m.id);
                  const ready = cur >= m.target && !claimed;

                  return (
                    <div
                      key={m.id}
                      className={`rounded-xl border p-3 transition-colors ${
                        claimed
                          ? 'border-emerald-400/30 bg-[#061816]/85'
                          : ready
                          ? 'border-cyan-300/60 bg-[#0b1c34]/92'
                          : 'border-slate-800/90 bg-[#060c1a]/85'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="truncate font-display text-sm font-bold text-white">
                              {m.title}
                            </span>
                            <span
                              className={`shrink-0 rounded px-1.5 py-0.5 font-mono-num text-[9.5px] font-bold uppercase ${
                                claimed
                                  ? 'bg-emerald-500/15 text-emerald-300'
                                  : ready
                                  ? 'bg-cyan-400/20 text-cyan-200'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {claimed ? 'Claimed' : ready ? 'Completed' : 'Active'}
                            </span>
                          </div>
                          <div className="mt-0.5 text-xs text-slate-400">{m.description}</div>
                        </div>

                        <div className="shrink-0 text-right font-mono-num text-[11px] font-semibold">
                          <span className="text-amber-300">+{m.rewardCredits} CR</span>
                          <span className="mx-1 text-slate-600">·</span>
                          <span className="text-cyan-300">+{m.rewardCrystals}G</span>
                        </div>
                      </div>

                      <div className="mt-2.5 flex items-center gap-3">
                        <div className="flex-1">
                          <div className="mb-1 flex justify-between font-mono-num text-[10.5px] text-slate-400">
                            <span>
                              {cur.toLocaleString()} / {m.target.toLocaleString()}
                            </span>
                            <span>{pct}%</span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-slate-900">
                            <div
                              className={`h-full rounded-full transition-[width] duration-200 ${
                                claimed ? 'bg-emerald-400' : 'bg-sky-400'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={!ready}
                          onClick={() => {
                            if (!guardClaim()) return;
                            SoundManager.unlock();
                            const res = ProgressionManager.claimDailyMission(m.id);
                            if (res.ok) SoundManager.playMissionComplete();
                            onFeedback(res);
                          }}
                          className={`min-h-[38px] shrink-0 rounded-xl px-3.5 text-xs font-bold transition-[background-color,transform] duration-150 ${
                            claimed
                              ? 'border border-emerald-400/35 bg-emerald-500/12 text-emerald-300'
                              : ready
                              ? 'bg-emerald-400 text-slate-950 hover:bg-emerald-300 active:scale-[0.97]'
                              : 'cursor-not-allowed border border-slate-800 bg-slate-900 text-slate-500'
                          }`}
                        >
                          {claimed ? 'Claimed' : ready ? 'Claim' : 'Active'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Weekly Directives */}
            <section className="flex flex-col rounded-2xl border border-slate-700/70 bg-[#081122]/90 p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                <div>
                  <div className="flex items-center gap-2 font-display text-sm font-bold tracking-wide text-purple-300">
                    <Calendar className="h-4 w-4" />
                    <span>WEEKLY DIRECTIVES</span>
                  </div>
                  <div className="mt-0.5 font-mono-num text-[11px] text-slate-400">
                    Progress: {weeklyClaimedCount}/{weeklyList.length} Claimed
                  </div>
                </div>
                <span className="font-mono-num text-[11px] text-slate-400">
                  Resets in {getTimeUntilWeeklyResetUtc()}
                </span>
              </div>

              <div className="scroll-panel flex flex-col gap-2.5 lg:max-h-[calc(100dvh-280px)] lg:overflow-y-auto lg:pr-1">
                {weeklyList.map((m) => {
                  const cur = Math.min(m.target, progress.weeklyChallenges.progress[m.id] ?? 0);
                  const pct = Math.round((cur / m.target) * 100);
                  const claimed = progress.weeklyChallenges.claimedIds.includes(m.id);
                  const ready = cur >= m.target && !claimed;

                  return (
                    <div
                      key={m.id}
                      className={`rounded-xl border p-3 transition-colors ${
                        claimed
                          ? 'border-emerald-400/30 bg-[#061816]/85'
                          : ready
                          ? 'border-purple-300/60 bg-[#140e29]/92'
                          : 'border-slate-800/90 bg-[#060c1a]/85'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="truncate font-display text-sm font-bold text-white">
                              {m.title}
                            </span>
                            <span
                              className={`shrink-0 rounded px-1.5 py-0.5 font-mono-num text-[9.5px] font-bold uppercase ${
                                claimed
                                  ? 'bg-emerald-500/15 text-emerald-300'
                                  : ready
                                  ? 'bg-purple-400/20 text-purple-200'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {claimed ? 'Claimed' : ready ? 'Completed' : 'Active'}
                            </span>
                          </div>
                          <div className="mt-0.5 text-xs text-slate-400">{m.description}</div>
                        </div>

                        <div className="shrink-0 text-right font-mono-num text-[11px] font-semibold">
                          <span className="text-amber-300">+{m.rewardCredits} CR</span>
                          <span className="mx-1 text-slate-600">·</span>
                          <span className="text-cyan-300">+{m.rewardCrystals}G</span>
                        </div>
                      </div>

                      <div className="mt-2.5 flex items-center gap-3">
                        <div className="flex-1">
                          <div className="mb-1 flex justify-between font-mono-num text-[10.5px] text-slate-400">
                            <span>
                              {cur.toLocaleString()} / {m.target.toLocaleString()}
                            </span>
                            <span>{pct}%</span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-slate-900">
                            <div
                              className={`h-full rounded-full transition-[width] duration-200 ${
                                claimed ? 'bg-emerald-400' : 'bg-purple-400'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={!ready}
                          onClick={() => {
                            if (!guardClaim()) return;
                            SoundManager.unlock();
                            const res = ProgressionManager.claimWeeklyChallenge(m.id);
                            if (res.ok) SoundManager.playMissionComplete();
                            onFeedback(res);
                          }}
                          className={`min-h-[38px] shrink-0 rounded-xl px-3.5 text-xs font-bold transition-[background-color,transform] duration-150 ${
                            claimed
                              ? 'border border-emerald-400/35 bg-emerald-500/12 text-emerald-300'
                              : ready
                              ? 'bg-purple-400 text-slate-950 hover:bg-purple-300 active:scale-[0.97]'
                              : 'cursor-not-allowed border border-slate-800 bg-slate-900 text-slate-500'
                          }`}
                        >
                          {claimed ? 'Claimed' : ready ? 'Claim' : 'Active'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {/* VIEW 2: MEDALS & ACHIEVEMENTS GRID + SUMMARY + DETAIL MODAL */}
        {subView === 'achievements' && (
          <div className="panel-swap flex flex-col gap-3.5">
            {/* Compact Medal Summary Bar */}
            <section className="flex flex-col gap-3 rounded-2xl border border-slate-700/70 bg-[#081122]/90 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="font-mono-num text-[10.5px] font-semibold uppercase tracking-wider text-amber-300">
                  PILOT COMMENDATION PROGRESS
                </div>
                <div className="mt-0.5 flex items-baseline gap-2.5">
                  <span className="font-display text-lg font-bold text-white">
                    {progress.claimedAchievements.length} / {ACHIEVEMENTS.length} Medals Claimed
                  </span>
                  <span className="font-mono-num text-xs text-slate-400">
                    ({overallMedalPct}%)
                  </span>
                  {readyAchievementsCount > 0 && (
                    <span className="font-mono-num text-xs font-semibold text-emerald-300">
                      · {readyAchievementsCount} Ready to Claim
                    </span>
                  )}
                </div>
              </div>

              <div className="w-full sm:w-56">
                <div className="h-2 overflow-hidden rounded-full bg-slate-900">
                  <div
                    className="h-full rounded-full bg-amber-400 transition-[width] duration-200"
                    style={{ width: `${overallMedalPct}%` }}
                  />
                </div>
              </div>
            </section>

            {/* Horizontal Category Filter Strip */}
            <div className="flex gap-1.5 overflow-x-auto pb-1.5">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    SoundManager.playButtonClick();
                    setCatFilter(c);
                  }}
                  className={`min-h-[36px] shrink-0 rounded-xl border px-3 text-xs font-semibold whitespace-nowrap transition-colors ${
                    catFilter === c
                      ? 'border-amber-300/65 bg-amber-400/14 text-amber-100'
                      : 'border-slate-800 bg-[#081122]/85 text-slate-400 hover:border-slate-600 hover:text-slate-200'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            {/* Compact Emblem Grid (Tap card to inspect full requirements & claim in Modal) */}
            <div className="scroll-panel grid max-h-[calc(100dvh-340px)] grid-cols-2 gap-2.5 overflow-y-auto pr-1.5 sm:grid-cols-3 lg:grid-cols-4">
              {filteredAchievements.map((ach) => {
                const cur = Math.min(
                  ach.target,
                  ProgressionManager.getAchievementMetricValue(progress, ach.metric)
                );
                const pct = Math.round((cur / ach.target) * 100);
                const claimed = progress.claimedAchievements.includes(ach.id);
                const ready = cur >= ach.target && !claimed;

                return (
                  <button
                    key={ach.id}
                    type="button"
                    onClick={() => {
                      SoundManager.playButtonClick();
                      setInspectedMedal(ach);
                    }}
                    className={`flex min-h-[126px] flex-col justify-between rounded-xl border p-3 text-left touch-pan-y transition-[border-color,background-color,transform] duration-150 active:scale-[0.985] ${
                      claimed
                        ? 'border-emerald-400/40 bg-[#061816]/85 hover:border-emerald-300/70'
                        : ready
                        ? 'border-amber-300/70 bg-[#1b1409]/92 hover:border-amber-200'
                        : 'border-slate-800/90 bg-[#081122]/90 hover:border-slate-600'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${
                            claimed
                              ? 'border-emerald-400/40 bg-emerald-500/14 text-emerald-300'
                              : ready
                              ? 'border-amber-300/55 bg-amber-400/14 text-amber-300'
                              : 'border-slate-700/80 bg-slate-900/90 text-slate-500'
                          }`}
                        >
                          <Award className="h-4 w-4" />
                        </span>

                        {claimed ? (
                          <span className="flex items-center gap-1 font-mono-num text-[9.5px] font-bold text-emerald-300">
                            <CheckCircle2 className="h-3 w-3" /> CLAIMED
                          </span>
                        ) : ready ? (
                          <span className="rounded bg-amber-400 px-1.5 py-0.5 font-mono-num text-[9.5px] font-bold text-slate-950">
                            CLAIM
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 font-mono-num text-[9.5px] text-slate-500">
                            <Lock className="h-2.5 w-2.5" /> LOCKED
                          </span>
                        )}
                      </div>

                      <h4 className="mt-2 truncate font-display text-xs sm:text-sm font-bold text-white">
                        {ach.title}
                      </h4>
                      <p className="mt-0.5 line-clamp-1 text-[10.5px] text-slate-400">
                        {ach.category}
                      </p>
                    </div>

                    <div className="mt-2.5">
                      <div className="mb-1 flex justify-between font-mono-num text-[10px] text-slate-300">
                        <span>{pct}%</span>
                        <span>
                          <span className="text-amber-300">+{ach.rewardCredits}</span> ·{' '}
                          <span className="text-cyan-300">+{ach.rewardCrystals}G</span>
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-slate-900">
                        <div
                          className={`h-full rounded-full transition-[width] duration-200 ${
                            claimed ? 'bg-emerald-400' : 'bg-amber-400'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Focused Medal Detail & Reward Claim Modal */}
      {inspectedMedal &&
        (() => {
          const cur = Math.min(
            inspectedMedal.target,
            ProgressionManager.getAchievementMetricValue(progress, inspectedMedal.metric)
          );
          const pct = Math.round((cur / inspectedMedal.target) * 100);
          const claimed = progress.claimedAchievements.includes(inspectedMedal.id);
          const ready = cur >= inspectedMedal.target && !claimed;

          return (
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="medal-detail-title"
              className="fixed inset-0 z-50 flex items-center justify-center bg-[#03060f]/82 p-4 backdrop-blur-sm"
              onClick={() => setInspectedMedal(null)}
            >
              <div
                className="panel-swap w-full max-w-md rounded-2xl border border-slate-700/80 bg-[#081122]/96 p-5 sm:p-6 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${
                        claimed
                          ? 'border-emerald-400/45 bg-emerald-500/14 text-emerald-300'
                          : ready
                          ? 'border-amber-300/60 bg-amber-400/14 text-amber-300'
                          : 'border-slate-700 bg-slate-900 text-slate-400'
                      }`}
                    >
                      <Award className="h-6 w-6" />
                    </span>
                    <div>
                      <div className="font-mono-num text-[11px] font-semibold text-amber-300">
                        {inspectedMedal.category} ·{' '}
                        {claimed ? 'CLAIMED' : ready ? 'UNLOCKED' : 'LOCKED'}
                      </div>
                      <h3
                        id="medal-detail-title"
                        className="font-display text-lg sm:text-xl font-bold text-white"
                      >
                        {inspectedMedal.title}
                      </h3>
                    </div>
                  </div>

                  <button
                    type="button"
                    aria-label="Close medal detail"
                    onClick={() => {
                      SoundManager.playButtonClick();
                      setInspectedMedal(null);
                    }}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-slate-300 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <p className="mt-3 text-xs sm:text-sm leading-relaxed text-slate-300">
                  {inspectedMedal.description}
                </p>

                <div className="mt-4 rounded-xl border border-slate-800/90 bg-[#060c1a]/90 p-3.5">
                  <div className="mb-1.5 flex items-center justify-between font-mono-num text-xs text-slate-300">
                    <span>
                      Progress: {cur.toLocaleString()} / {inspectedMedal.target.toLocaleString()}
                    </span>
                    <span className="font-bold text-white">{pct}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-900">
                    <div
                      className={`h-full rounded-full transition-[width] duration-200 ${
                        claimed ? 'bg-emerald-400' : 'bg-amber-400'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="mt-2.5 flex items-center justify-between border-t border-slate-800/80 pt-2 font-mono-num text-xs">
                    <span className="text-slate-400">Medal Reward</span>
                    <span className="font-bold">
                      <span className="text-amber-300">+{inspectedMedal.rewardCredits} CR</span>
                      <span className="mx-1.5 text-slate-600">·</span>
                      <span className="text-cyan-300">+{inspectedMedal.rewardCrystals} Gems</span>
                    </span>
                  </div>
                </div>

                <div className="mt-4">
                  <button
                    type="button"
                    disabled={!ready}
                    onClick={() => {
                      if (!guardClaim()) return;
                      SoundManager.unlock();
                      const res = ProgressionManager.claimAchievement(inspectedMedal.id);
                      if (res.ok) SoundManager.playAchievementUnlock();
                      onFeedback(res);
                    }}
                    className={`flex min-h-[46px] w-full items-center justify-center rounded-xl font-display text-sm font-bold tracking-wider transition-[background-color,transform] duration-150 ${
                      claimed
                        ? 'border border-emerald-400/40 bg-emerald-500/12 text-emerald-300'
                        : ready
                        ? 'bg-amber-400 text-slate-950 hover:bg-amber-300 active:scale-[0.98]'
                        : 'cursor-not-allowed border border-slate-800 bg-slate-900 text-slate-500'
                    }`}
                  >
                    {claimed
                      ? 'MEDAL ALREADY CLAIMED'
                      : ready
                      ? 'CLAIM MEDAL REWARD'
                      : 'REQUIREMENT NOT MET'}
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
    </>
  );
};
