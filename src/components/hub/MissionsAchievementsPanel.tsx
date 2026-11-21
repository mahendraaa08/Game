import React, { useMemo, useRef, useState } from 'react';
import {
  Award,
  Calendar,
  CheckCheck,
  CheckCircle2,
  Clock,
  Lock,
  Medal,
  X,
} from 'lucide-react';
import {
  AchievementCategory,
  AchievementDefinition,
  ACHIEVEMENTS,
} from '../../game/config/AchievementConfig';
import {
  selectDailyMissions,
  selectWeeklyChallenges,
} from '../../game/config/MissionConfig';
import { PLAYER_EXP_SOURCES } from '../../game/config/LevelProgressionConfig';
import { SoundManager } from '../../game/audio/SoundManager';
import { evaluateGlobalNotifications } from '../../game/systems/NotificationStatus';
import { ActionResult, ProgressionManager } from '../../game/systems/ProgressionManager';
import { PlayerProgress } from '../../game/utils/StorageManager';
import { ExpStarIcon } from '../ui/CurrencyBadges';
import { NotificationDot } from '../ui/NotificationDot';

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

function getDirectivePriorityRank(cur: number, target: number, claimed: boolean): number {
  if (claimed) return 3; // Priority 4: Claimed (bottom)
  if (cur >= target) return 0; // Priority 1: Completed & Ready to Claim (top)
  if (cur > 0) return 1; // Priority 2: In Progress
  return 2; // Priority 3: Not Started
}

function sortDirectivesByPriority<T extends { id: string; target: number }>(
  list: T[],
  progressMap: Record<string, number>,
  claimedIds: string[]
): T[] {
  return list
    .map((item, idx) => {
      const cur = Math.min(item.target, progressMap[item.id] ?? 0);
      const claimed = claimedIds.includes(item.id);
      const rank = getDirectivePriorityRank(cur, item.target, claimed);
      const ratio = item.target > 0 ? cur / item.target : 0;
      return { item, idx, rank, ratio, cur };
    })
    .sort((a, b) => {
      if (a.rank !== b.rank) return a.rank - b.rank;
      if (a.rank === 1) {
        if (b.ratio !== a.ratio) return b.ratio - a.ratio;
        if (b.cur !== a.cur) return b.cur - a.cur;
      }
      return a.idx - b.idx;
    })
    .map((entry) => entry.item);
}

function sortAchievementsByPriority(
  list: AchievementDefinition[],
  progress: PlayerProgress
): AchievementDefinition[] {
  return list
    .map((ach, idx) => {
      const rawVal = ProgressionManager.getAchievementMetricValue(progress, ach.metric);
      const cur = Math.min(ach.target, rawVal);
      const claimed = progress.claimedAchievements.includes(ach.id);
      const rank = getDirectivePriorityRank(cur, ach.target, claimed);
      const ratio = ach.target > 0 ? cur / ach.target : 0;
      return { ach, idx, rank, ratio, cur };
    })
    .sort((a, b) => {
      if (a.rank !== b.rank) return a.rank - b.rank;
      if (a.rank === 1) {
        if (b.ratio !== a.ratio) return b.ratio - a.ratio;
        if (b.cur !== a.cur) return b.cur - a.cur;
      }
      return a.idx - b.idx;
    })
    .map((entry) => entry.ach);
}

export const MissionsAchievementsPanel: React.FC<MissionsAchievementsPanelProps> = ({
  progress,
  onFeedback,
}) => {
  const [subView, setSubView] = useState<'missions' | 'achievements'>('missions');
  const [catFilter, setCatFilter] = useState<'All' | AchievementCategory>('All');
  const [inspectedMedal, setInspectedMedal] = useState<AchievementDefinition | null>(null);
  const lastClaimTsRef = useRef<number>(0);

  const inspectedMedalState = inspectedMedal;
  const notifications = useMemo(() => evaluateGlobalNotifications(progress), [progress]);
  const dailyList = selectDailyMissions(progress.dailyMissions.resetKey);
  const weeklyList = selectWeeklyChallenges(progress.weeklyChallenges.resetKey);
  void inspectedMedalState;

  const sortedDailyList = useMemo(
    () =>
      sortDirectivesByPriority(
        dailyList,
        progress.dailyMissions.progress,
        progress.dailyMissions.claimedIds
      ),
    [dailyList, progress.dailyMissions.progress, progress.dailyMissions.claimedIds]
  );

  const sortedWeeklyList = useMemo(
    () =>
      sortDirectivesByPriority(
        weeklyList,
        progress.weeklyChallenges.progress,
        progress.weeklyChallenges.claimedIds
      ),
    [weeklyList, progress.weeklyChallenges.progress, progress.weeklyChallenges.claimedIds]
  );

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

  const sortedFilteredAchievements = useMemo(() => {
    const base =
      catFilter === 'All'
        ? ACHIEVEMENTS
        : ACHIEVEMENTS.filter((a) => a.category === catFilter);
    return sortAchievementsByPriority(base, progress);
  }, [catFilter, progress]);

  const overallMedalPct = Math.round(
    (progress.claimedAchievements.length / ACHIEVEMENTS.length) * 100
  );

  const guardClaim = (): boolean => {
    const now = Date.now();
    if (now - lastClaimTsRef.current < 320) return false;
    lastClaimTsRef.current = now;
    return true;
  };

  return (
    <>
      <div className="flex flex-col gap-4">
        {/* Unified Segmented Navigation: Daily & Weekly Directives | Medals & Achievements */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
              className={`relative flex min-h-[42px] items-center justify-center gap-2 rounded-lg border px-3 sm:px-5 text-xs font-bold transition-[border-color,background-color,color] duration-150 ${
                subView === 'missions'
                  ? 'border-cyan-300/55 bg-cyan-400/15 text-cyan-100'
                  : 'border-transparent text-slate-400 hover:bg-[#0c162b] hover:text-slate-200'
              }`}
            >
              <NotificationDot
                visible={notifications.directivesSubTab}
                position="corner"
                label="Completed mission reward ready to claim"
              />
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
              className={`relative flex min-h-[42px] items-center justify-center gap-2 rounded-lg border px-3 sm:px-5 text-xs font-bold transition-[border-color,background-color,color] duration-150 ${
                subView === 'achievements'
                  ? 'border-amber-300/55 bg-amber-400/15 text-amber-100'
                  : 'border-transparent text-slate-400 hover:bg-[#0c162b] hover:text-slate-200'
              }`}
            >
              <NotificationDot
                visible={notifications.achievementsSubTab}
                position="corner"
                label="Completed medal reward ready to claim"
              />
              <Medal className="h-3.5 w-3.5 shrink-0 text-amber-300" />
              <span className="truncate">Medals &amp; Achievements</span>
              {readyAchievementsCount > 0 && (
                <span className="shrink-0 rounded bg-amber-400 px-1.5 py-0.5 font-mono-num text-[10px] font-bold text-slate-950">
                  {readyAchievementsCount}
                </span>
              )}
            </button>
          </div>

          {subView === 'missions' && (
            <button
              type="button"
              disabled={readyMissionsCount === 0}
              onClick={() => {
                if (readyMissionsCount === 0 || !guardClaim()) return;
                SoundManager.unlock();
                const res = ProgressionManager.claimAllDirectives();
                if (res.ok) SoundManager.playMissionComplete();
                onFeedback(res);
              }}
              className={`relative flex min-h-[42px] shrink-0 items-center justify-center gap-2 rounded-xl border px-4 text-xs font-bold whitespace-nowrap transition-[border-color,background-color,color,transform] duration-150 ${
                readyMissionsCount > 0
                  ? 'border-emerald-300/60 bg-emerald-400 text-slate-950 hover:bg-emerald-300 active:scale-[0.98]'
                  : 'cursor-not-allowed border-slate-800/90 bg-[#060d1c]/70 text-slate-500'
              }`}
            >
              <NotificationDot
                visible={notifications.directivesSubTab}
                position="corner"
                label="Claim all available mission rewards"
              />
              <CheckCheck className="h-4 w-4 shrink-0" />
              <span>
                {readyMissionsCount > 0
                  ? `Claim All (${readyMissionsCount})`
                  : 'Claim All'}
              </span>
            </button>
          )}
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
                    <NotificationDot
                      visible={notifications.dailySection}
                      position="inline"
                      label="Daily directive reward ready"
                    />
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
                {sortedDailyList.map((m) => {
                  const cur = Math.min(m.target, progress.dailyMissions.progress[m.id] ?? 0);
                  const pct = Math.round((cur / m.target) * 100);
                  const claimed = progress.dailyMissions.claimedIds.includes(m.id);
                  const ready = Boolean(notifications.dailyMissionIds[m.id]);
                  const inProgress = !claimed && !ready && cur > 0;

                  return (
                    <div
                      key={m.id}
                      className={`relative rounded-xl border transition-colors ${
                        claimed
                          ? 'border-slate-800/65 bg-[#050a14]/65 px-3 py-2.5 opacity-65'
                          : ready
                          ? 'border-emerald-400/65 bg-[#071c22]/95 p-3.5'
                          : inProgress
                          ? 'border-cyan-400/25 bg-[#071022]/90 p-3'
                          : 'border-slate-800/85 bg-[#060b18]/85 p-3'
                      }`}
                    >
                      <NotificationDot
                        visible={ready}
                        position="corner-inset"
                        label="Ready to claim reward"
                      />
                      <div className={`flex items-start justify-between gap-2.5 ${ready ? 'pr-3' : ''}`}>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`truncate font-display text-sm font-bold ${
                                claimed ? 'text-slate-300' : 'text-white'
                              }`}
                            >
                              {m.title}
                            </span>
                            {ready ? (
                              <span className="shrink-0 font-mono-num text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                                · Ready to Claim
                              </span>
                            ) : claimed ? (
                              <span className="inline-flex shrink-0 items-center gap-1 font-mono-num text-[10px] font-semibold uppercase tracking-wider text-emerald-400/80">
                                <CheckCircle2 className="h-3 w-3" />
                                Claimed
                              </span>
                            ) : inProgress ? (
                              <span className="shrink-0 font-mono-num text-[10px] font-semibold uppercase tracking-wider text-cyan-300/85">
                                · In Progress
                              </span>
                            ) : (
                              <span className="shrink-0 font-mono-num text-[10px] font-medium uppercase tracking-wider text-slate-500">
                                · Not Started
                              </span>
                            )}
                          </div>
                          <div className={`mt-0.5 text-xs ${claimed ? 'text-slate-500' : 'text-slate-400'}`}>
                            {m.description}
                          </div>
                        </div>

                        <div
                          className={`flex shrink-0 flex-wrap items-center justify-end gap-x-1 gap-y-0.5 text-right font-mono-num text-[11px] font-semibold ${
                            claimed ? 'opacity-65' : ''
                          }`}
                        >
                          <span className="text-amber-300">+{m.rewardCredits} CR</span>
                          <span className="text-slate-600">·</span>
                          <span className="text-cyan-300">+{m.rewardCrystals}G</span>
                          <span className="text-slate-600">·</span>
                          <span className="inline-flex items-center gap-0.5 text-purple-300">
                            <ExpStarIcon className="h-3 w-3 shrink-0" />
                            +{PLAYER_EXP_SOURCES.dailyMissionClaim} EXP
                          </span>
                        </div>
                      </div>

                      {claimed ? (
                        <div className="mt-2 flex items-center justify-between font-mono-num text-[10.5px] text-slate-500">
                          <span>
                            {m.target.toLocaleString()} / {m.target.toLocaleString()} Completed
                          </span>
                          <span className="text-emerald-400/80">Reward Collected</span>
                        </div>
                      ) : (
                        <div className="mt-2.5 flex items-center gap-3">
                          <div className="flex-1">
                            <div className="mb-1 flex justify-between font-mono-num text-[10.5px] text-slate-400">
                              <span>
                                {cur.toLocaleString()} / {m.target.toLocaleString()}
                              </span>
                              <span className={ready ? 'font-bold text-emerald-300' : ''}>{pct}%</span>
                            </div>
                            <div className="h-1.5 overflow-hidden rounded-full bg-slate-900">
                              <div
                                className={`h-full rounded-full transition-[width] duration-200 ${
                                  ready ? 'bg-emerald-400' : inProgress ? 'bg-sky-400' : 'bg-slate-700'
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>

                          {ready ? (
                            <button
                              type="button"
                              onClick={() => {
                                if (!guardClaim()) return;
                                SoundManager.unlock();
                                const res = ProgressionManager.claimDailyMission(m.id);
                                if (res.ok) SoundManager.playMissionComplete();
                                onFeedback(res);
                              }}
                              className="min-h-[38px] shrink-0 rounded-xl bg-emerald-400 px-4 text-xs font-bold tracking-wide text-slate-950 transition-[background-color,transform] duration-150 hover:bg-emerald-300 active:scale-[0.97]"
                            >
                              Claim
                            </button>
                          ) : (
                            <span className="min-h-[38px] shrink-0 inline-flex items-center justify-center rounded-xl border border-slate-800/90 bg-slate-900/75 px-3 font-mono-num text-[11px] font-semibold text-slate-500">
                              {inProgress ? `${pct}%` : '0%'}
                            </span>
                          )}
                        </div>
                      )}
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
                    <NotificationDot
                      visible={notifications.weeklySection}
                      position="inline"
                      label="Weekly challenge reward ready"
                    />
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
                {sortedWeeklyList.map((m) => {
                  const cur = Math.min(m.target, progress.weeklyChallenges.progress[m.id] ?? 0);
                  const pct = Math.round((cur / m.target) * 100);
                  const claimed = progress.weeklyChallenges.claimedIds.includes(m.id);
                  const ready = Boolean(notifications.weeklyChallengeIds[m.id]);
                  const inProgress = !claimed && !ready && cur > 0;

                  return (
                    <div
                      key={m.id}
                      className={`relative rounded-xl border transition-colors ${
                        claimed
                          ? 'border-slate-800/65 bg-[#050a14]/65 px-3 py-2.5 opacity-65'
                          : ready
                          ? 'border-purple-300/65 bg-[#150e2b]/95 p-3.5'
                          : inProgress
                          ? 'border-purple-400/25 bg-[#0c0d22]/90 p-3'
                          : 'border-slate-800/85 bg-[#060b18]/85 p-3'
                      }`}
                    >
                      <NotificationDot
                        visible={ready}
                        position="corner-inset"
                        label="Ready to claim reward"
                      />
                      <div className={`flex items-start justify-between gap-2.5 ${ready ? 'pr-3' : ''}`}>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`truncate font-display text-sm font-bold ${
                                claimed ? 'text-slate-300' : 'text-white'
                              }`}
                            >
                              {m.title}
                            </span>
                            {ready ? (
                              <span className="shrink-0 font-mono-num text-[10px] font-bold uppercase tracking-wider text-purple-200">
                                · Ready to Claim
                              </span>
                            ) : claimed ? (
                              <span className="inline-flex shrink-0 items-center gap-1 font-mono-num text-[10px] font-semibold uppercase tracking-wider text-emerald-400/80">
                                <CheckCircle2 className="h-3 w-3" />
                                Claimed
                              </span>
                            ) : inProgress ? (
                              <span className="shrink-0 font-mono-num text-[10px] font-semibold uppercase tracking-wider text-purple-300/85">
                                · In Progress
                              </span>
                            ) : (
                              <span className="shrink-0 font-mono-num text-[10px] font-medium uppercase tracking-wider text-slate-500">
                                · Not Started
                              </span>
                            )}
                          </div>
                          <div className={`mt-0.5 text-xs ${claimed ? 'text-slate-500' : 'text-slate-400'}`}>
                            {m.description}
                          </div>
                        </div>

                        <div
                          className={`flex shrink-0 flex-wrap items-center justify-end gap-x-1 gap-y-0.5 text-right font-mono-num text-[11px] font-semibold ${
                            claimed ? 'opacity-65' : ''
                          }`}
                        >
                          <span className="text-amber-300">+{m.rewardCredits} CR</span>
                          <span className="text-slate-600">·</span>
                          <span className="text-cyan-300">+{m.rewardCrystals}G</span>
                          <span className="text-slate-600">·</span>
                          <span className="inline-flex items-center gap-0.5 text-purple-300">
                            <ExpStarIcon className="h-3 w-3 shrink-0" />
                            +{PLAYER_EXP_SOURCES.weeklyChallengeClaim} EXP
                          </span>
                        </div>
                      </div>

                      {claimed ? (
                        <div className="mt-2 flex items-center justify-between font-mono-num text-[10.5px] text-slate-500">
                          <span>
                            {m.target.toLocaleString()} / {m.target.toLocaleString()} Completed
                          </span>
                          <span className="text-emerald-400/80">Reward Collected</span>
                        </div>
                      ) : (
                        <div className="mt-2.5 flex items-center gap-3">
                          <div className="flex-1">
                            <div className="mb-1 flex justify-between font-mono-num text-[10.5px] text-slate-400">
                              <span>
                                {cur.toLocaleString()} / {m.target.toLocaleString()}
                              </span>
                              <span className={ready ? 'font-bold text-purple-200' : ''}>{pct}%</span>
                            </div>
                            <div className="h-1.5 overflow-hidden rounded-full bg-slate-900">
                              <div
                                className={`h-full rounded-full transition-[width] duration-200 ${
                                  ready ? 'bg-purple-400' : inProgress ? 'bg-purple-400/85' : 'bg-slate-700'
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>

                          {ready ? (
                            <button
                              type="button"
                              onClick={() => {
                                if (!guardClaim()) return;
                                SoundManager.unlock();
                                const res = ProgressionManager.claimWeeklyChallenge(m.id);
                                if (res.ok) SoundManager.playMissionComplete();
                                onFeedback(res);
                              }}
                              className="min-h-[38px] shrink-0 rounded-xl bg-purple-400 px-4 text-xs font-bold tracking-wide text-slate-950 transition-[background-color,transform] duration-150 hover:bg-purple-300 active:scale-[0.97]"
                            >
                              Claim
                            </button>
                          ) : (
                            <span className="min-h-[38px] shrink-0 inline-flex items-center justify-center rounded-xl border border-slate-800/90 bg-slate-900/75 px-3 font-mono-num text-[11px] font-semibold text-slate-500">
                              {inProgress ? `${pct}%` : '0%'}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {/* VIEW 2: MEDALS & ACHIEVEMENTS GRID + SUMMARY + CLAIM ALL + DETAIL MODAL */}
        {subView === 'achievements' && (
          <div className="panel-swap flex flex-col gap-3.5">
            {/* Compact Medal Summary Bar with Claim All Action */}
            <section className="flex flex-col gap-3 rounded-2xl border border-slate-700/70 bg-[#081122]/90 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="font-mono-num text-[10.5px] font-semibold uppercase tracking-wider text-amber-300">
                  PILOT COMMENDATION PROGRESS
                </div>
                <div className="mt-0.5 flex flex-wrap items-baseline gap-2">
                  <span className="font-display text-lg font-bold text-white">
                    {progress.claimedAchievements.length} / {ACHIEVEMENTS.length} Medals Claimed
                  </span>
                  <span className="font-mono-num text-xs text-slate-400">
                    ({overallMedalPct}%)
                  </span>
                  {readyAchievementsCount > 0 && (
                    <span className="font-mono-num text-xs font-semibold text-amber-300">
                      · {readyAchievementsCount} Ready to Claim
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-3.5">
                <div className="w-full sm:w-44">
                  <div className="h-2 overflow-hidden rounded-full bg-slate-900">
                    <div
                      className="h-full rounded-full bg-amber-400 transition-[width] duration-200"
                      style={{ width: `${overallMedalPct}%` }}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  disabled={readyAchievementsCount === 0}
                  onClick={() => {
                    if (readyAchievementsCount === 0 || !guardClaim()) return;
                    SoundManager.unlock();
                    const res = ProgressionManager.claimAllAchievements();
                    if (res.ok) SoundManager.playAchievementUnlock();
                    onFeedback(res);
                  }}
                  className={`relative flex min-h-[40px] shrink-0 items-center justify-center gap-2 rounded-xl border px-4 text-xs font-bold whitespace-nowrap transition-[border-color,background-color,color,transform] duration-150 ${
                    readyAchievementsCount > 0
                      ? 'border-amber-300/70 bg-amber-400 text-slate-950 hover:bg-amber-300 active:scale-[0.98]'
                      : 'cursor-not-allowed border-slate-800/90 bg-slate-900/75 text-slate-500'
                  }`}
                >
                  <NotificationDot
                    visible={notifications.achievementsSubTab}
                    position="corner"
                    label="Claim all available medal rewards"
                  />
                  <CheckCheck className="h-4 w-4 shrink-0" />
                  <span>
                    {readyAchievementsCount > 0
                      ? `Claim All (${readyAchievementsCount})`
                      : 'Claim All'}
                  </span>
                </button>
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

            {/* Priority-Sorted Emblem Grid */}
            <div className="scroll-panel grid max-h-[calc(100dvh-340px)] grid-cols-1 gap-2.5 overflow-y-auto pr-1.5 sm:grid-cols-2 lg:grid-cols-4">
              {sortedFilteredAchievements.map((ach) => {
                const cur = Math.min(
                  ach.target,
                  ProgressionManager.getAchievementMetricValue(progress, ach.metric)
                );
                const pct = Math.round((cur / ach.target) * 100);
                const claimed = progress.claimedAchievements.includes(ach.id);
                const ready = Boolean(notifications.achievementIds[ach.id]);
                const inProgress = !claimed && !ready && cur > 0;

                return (
                  <div
                    key={ach.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      SoundManager.playButtonClick();
                      setInspectedMedal(ach);
                    }}
                    onKeyDown={(e) => {
                      if (e.target !== e.currentTarget) return;
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        SoundManager.playButtonClick();
                        setInspectedMedal(ach);
                      }
                    }}
                    className={`relative flex min-h-[136px] cursor-pointer flex-col justify-between rounded-xl border p-3 text-left touch-pan-y transition-[border-color,background-color,transform] duration-150 focus-visible:outline-2 focus-visible:outline-amber-300 ${
                      claimed
                        ? 'border-slate-800/65 bg-[#050a14]/65 opacity-65 hover:border-slate-700'
                        : ready
                        ? 'border-amber-300/75 bg-[#1b1409]/94 hover:border-amber-200'
                        : inProgress
                        ? 'border-sky-400/25 bg-[#081226]/92 hover:border-slate-500'
                        : 'border-slate-800/90 bg-[#060c1a]/88 hover:border-slate-700'
                    }`}
                  >
                    <NotificationDot
                      visible={ready}
                      position="corner-inset"
                      label="Medal reward ready to claim"
                    />
                    <div>
                      <div className={`flex items-center justify-between gap-2 ${ready ? 'pr-3' : ''}`}>
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${
                            claimed
                              ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-400/80'
                              : ready
                              ? 'border-amber-300/60 bg-amber-400/15 text-amber-300'
                              : inProgress
                              ? 'border-sky-400/30 bg-sky-500/10 text-sky-300'
                              : 'border-slate-800 bg-slate-900/90 text-slate-500'
                          }`}
                        >
                          <Award className="h-4 w-4" />
                        </span>

                        {claimed ? (
                          <span className="inline-flex items-center gap-1 font-mono-num text-[10px] font-semibold text-emerald-400/85">
                            <CheckCircle2 className="h-3 w-3" /> CLAIMED
                          </span>
                        ) : ready ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!guardClaim()) return;
                              SoundManager.unlock();
                              const res = ProgressionManager.claimAchievement(ach.id);
                              if (res.ok) SoundManager.playAchievementUnlock();
                              onFeedback(res);
                            }}
                            className="min-h-[30px] rounded-lg bg-amber-400 px-2.5 font-mono-num text-[10.5px] font-bold tracking-wide text-slate-950 transition-[background-color,transform] duration-150 hover:bg-amber-300 active:scale-[0.96]"
                          >
                            Claim
                          </button>
                        ) : inProgress ? (
                          <span className="font-mono-num text-[10px] font-semibold uppercase tracking-wider text-sky-300/90">
                            In Progress
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-mono-num text-[10px] text-slate-500">
                            <Lock className="h-2.5 w-2.5" /> Not Started
                          </span>
                        )}
                      </div>

                      <h4
                        className={`mt-2 truncate font-display text-xs sm:text-sm font-bold ${
                          claimed ? 'text-slate-300' : 'text-white'
                        }`}
                      >
                        {ach.title}
                      </h4>
                      <p className="mt-0.5 line-clamp-1 text-[10.5px] text-slate-400">
                        {ach.category}
                      </p>
                    </div>

                    {claimed ? (
                      <div className="mt-2.5 flex items-center justify-between border-t border-slate-800/60 pt-2 font-mono-num text-[10px] text-slate-500">
                        <span>
                          {ach.target.toLocaleString()} / {ach.target.toLocaleString()}
                        </span>
                        <span className="text-emerald-400/80">Reward Collected</span>
                      </div>
                    ) : (
                      <div className="mt-2.5">
                        <div className="mb-1 flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5 font-mono-num text-[10px] text-slate-300">
                          <span>
                            {cur.toLocaleString()} / {ach.target.toLocaleString()} ({pct}%)
                          </span>
                          <span className="inline-flex shrink-0 items-center gap-1">
                            <span className="text-amber-300">+{ach.rewardCredits}</span>
                            <span className="text-slate-600">·</span>
                            <span className="text-cyan-300">+{ach.rewardCrystals}G</span>
                            <span className="text-slate-600">·</span>
                            <span className="inline-flex items-center gap-0.5 text-purple-300">
                              <ExpStarIcon className="h-2.5 w-2.5 shrink-0" />
                              +{PLAYER_EXP_SOURCES.achievementClaim}
                            </span>
                          </span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-slate-900">
                          <div
                            className={`h-full rounded-full transition-[width] duration-200 ${
                              ready ? 'bg-amber-400' : inProgress ? 'bg-sky-400' : 'bg-slate-700'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
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
                        {claimed ? 'CLAIMED' : ready ? 'READY TO CLAIM' : cur > 0 ? 'IN PROGRESS' : 'NOT STARTED'}
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
                  <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/80 pt-2 font-mono-num text-xs">
                    <span className="text-slate-400">Medal Reward</span>
                    <span className="inline-flex flex-wrap items-center justify-end gap-1.5 font-bold">
                      <span className="text-amber-300">+{inspectedMedal.rewardCredits} CR</span>
                      <span className="text-slate-600">·</span>
                      <span className="text-cyan-300">+{inspectedMedal.rewardCrystals} Gems</span>
                      <span className="text-slate-600">·</span>
                      <span className="inline-flex items-center gap-1 text-purple-300">
                        <ExpStarIcon className="h-3.5 w-3.5 shrink-0" />
                        +{PLAYER_EXP_SOURCES.achievementClaim} EXP
                      </span>
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
