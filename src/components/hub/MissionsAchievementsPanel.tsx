import React, { useState } from 'react';
import { Award, Calendar, CheckCircle2, Clock, Medal } from 'lucide-react';
import { AchievementCategory, ACHIEVEMENTS } from '../../game/config/AchievementConfig';
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

export const MissionsAchievementsPanel: React.FC<MissionsAchievementsPanelProps> = ({
  progress,
  onFeedback,
}) => {
  const [subView, setSubView] = useState<'missions' | 'achievements'>('missions');
  const [catFilter, setCatFilter] = useState<'All' | AchievementCategory>('All');

  const dailyList = selectDailyMissions(progress.dailyMissions.resetKey);
  const weeklyList = selectWeeklyChallenges(progress.weeklyChallenges.resetKey);
  const filteredAchievements =
    catFilter === 'All'
      ? ACHIEVEMENTS
      : ACHIEVEMENTS.filter((a) => a.category === catFilter);

  return (
    <div className="flex flex-col gap-5">
      {/* Focused Missions vs Medals Switch */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => {
            SoundManager.playButtonClick();
            setSubView('missions');
          }}
          className={`flex min-h-[44px] items-center gap-1.5 rounded-xl border px-4 text-xs font-bold transition-colors ${
            subView === 'missions'
              ? 'border-sky-400 bg-sky-500/18 text-white'
              : 'border-slate-800 bg-[#081022]/85 text-slate-300 hover:border-slate-600'
          }`}
        >
          <Clock className="h-3.5 w-3.5 text-sky-400" />
          <span>Daily &amp; Weekly Directives</span>
        </button>

        <button
          type="button"
          onClick={() => {
            SoundManager.playButtonClick();
            setSubView('achievements');
          }}
          className={`flex min-h-[44px] items-center gap-1.5 rounded-xl border px-4 text-xs font-bold transition-colors ${
            subView === 'achievements'
              ? 'border-amber-400 bg-amber-500/18 text-white'
              : 'border-slate-800 bg-[#081022]/85 text-slate-300 hover:border-slate-600'
          }`}
        >
          <Medal className="h-3.5 w-3.5 text-amber-400" />
          <span>
            Medals &amp; Achievements ({progress.claimedAchievements.length}/{ACHIEVEMENTS.length})
          </span>
        </button>
      </div>

      {subView === 'missions' && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* Daily Missions */}
          <section className="rounded-2xl border border-slate-800/90 bg-[#081022]/90 p-4 sm:p-5">
            <div className="mb-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2 font-display text-sm font-bold text-sky-300">
                <Clock className="h-4 w-4" />
                <span>Daily Missions (4)</span>
              </div>
              <span className="font-mono-num text-[11px] text-slate-400">
                Reset: {progress.dailyMissions.resetKey}
              </span>
            </div>

            <div className="flex flex-col gap-2.5">
              {dailyList.map((m) => {
                const cur = Math.min(m.target, progress.dailyMissions.progress[m.id] ?? 0);
                const pct = Math.round((cur / m.target) * 100);
                const claimed = progress.dailyMissions.claimedIds.includes(m.id);
                const ready = cur >= m.target && !claimed;

                return (
                  <div
                    key={m.id}
                    className={`rounded-xl border p-3.5 transition-colors ${
                      claimed
                        ? 'border-emerald-500/35 bg-emerald-950/15'
                        : ready
                        ? 'border-sky-400/60 bg-sky-950/25'
                        : 'border-slate-800 bg-slate-950/70'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-display text-sm font-bold text-white">{m.title}</div>
                        <div className="text-xs text-slate-400">{m.description}</div>
                      </div>
                      <div className="shrink-0 text-right font-mono-num text-[11px] font-semibold">
                        <div className="text-amber-300">+{m.rewardCredits} CR</div>
                        <div className="text-cyan-300">+{m.rewardCrystals} Gems</div>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-3">
                      <div className="flex-1">
                        <div className="mb-1 flex justify-between font-mono-num text-[11px] text-slate-400">
                          <span>
                            {cur.toLocaleString()} / {m.target.toLocaleString()}
                          </span>
                          <span>{pct}%</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-sm bg-slate-800">
                          <div className="h-full bg-sky-400 transition-all duration-200" style={{ width: `${pct}%` }} />
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={!ready}
                        onClick={() => {
                          SoundManager.unlock();
                          const res = ProgressionManager.claimDailyMission(m.id);
                          if (res.ok) SoundManager.playMissionComplete();
                          onFeedback(res);
                        }}
                        className={`min-h-[38px] shrink-0 rounded-lg px-3.5 text-xs font-bold transition-colors ${
                          claimed
                            ? 'border border-emerald-500/35 bg-emerald-500/10 text-emerald-300'
                            : ready
                            ? 'bg-emerald-400 text-slate-950 hover:bg-emerald-300'
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

          {/* Weekly Challenges */}
          <section className="rounded-2xl border border-slate-800/90 bg-[#081022]/90 p-4 sm:p-5">
            <div className="mb-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2 font-display text-sm font-bold text-purple-300">
                <Calendar className="h-4 w-4" />
                <span>Weekly Challenges (3)</span>
              </div>
              <span className="font-mono-num text-[11px] text-slate-400">
                Week: {progress.weeklyChallenges.resetKey}
              </span>
            </div>

            <div className="flex flex-col gap-2.5">
              {weeklyList.map((m) => {
                const cur = Math.min(m.target, progress.weeklyChallenges.progress[m.id] ?? 0);
                const pct = Math.round((cur / m.target) * 100);
                const claimed = progress.weeklyChallenges.claimedIds.includes(m.id);
                const ready = cur >= m.target && !claimed;

                return (
                  <div
                    key={m.id}
                    className={`rounded-xl border p-3.5 transition-colors ${
                      claimed
                        ? 'border-emerald-500/35 bg-emerald-950/15'
                        : ready
                        ? 'border-purple-400/60 bg-purple-950/25'
                        : 'border-slate-800 bg-slate-950/70'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-display text-sm font-bold text-white">{m.title}</div>
                        <div className="text-xs text-slate-400">{m.description}</div>
                      </div>
                      <div className="shrink-0 text-right font-mono-num text-[11px] font-semibold">
                        <div className="text-amber-300">+{m.rewardCredits} CR</div>
                        <div className="text-cyan-300">+{m.rewardCrystals} Gems</div>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-3">
                      <div className="flex-1">
                        <div className="mb-1 flex justify-between font-mono-num text-[11px] text-slate-400">
                          <span>
                            {cur.toLocaleString()} / {m.target.toLocaleString()}
                          </span>
                          <span>{pct}%</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-sm bg-slate-800">
                          <div className="h-full bg-purple-400 transition-all duration-200" style={{ width: `${pct}%` }} />
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={!ready}
                        onClick={() => {
                          SoundManager.unlock();
                          const res = ProgressionManager.claimWeeklyChallenge(m.id);
                          if (res.ok) SoundManager.playMissionComplete();
                          onFeedback(res);
                        }}
                        className={`min-h-[38px] shrink-0 rounded-lg px-3.5 text-xs font-bold transition-colors ${
                          claimed
                            ? 'border border-emerald-500/35 bg-emerald-500/10 text-emerald-300'
                            : ready
                            ? 'bg-purple-400 text-slate-950 hover:bg-purple-300'
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

      {subView === 'achievements' && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  SoundManager.playButtonClick();
                  setCatFilter(c);
                }}
                className={`min-h-[36px] rounded-xl border px-3 text-xs font-semibold transition-colors ${
                  catFilter === c
                    ? 'border-amber-400 bg-amber-500/18 text-amber-200'
                    : 'border-slate-800 bg-slate-900/70 text-slate-300 hover:border-slate-600'
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredAchievements.map((ach) => {
              const cur = Math.min(
                ach.target,
                ProgressionManager.getAchievementMetricValue(progress, ach.metric)
              );
              const pct = Math.round((cur / ach.target) * 100);
              const claimed = progress.claimedAchievements.includes(ach.id);
              const ready = cur >= ach.target && !claimed;

              return (
                <div
                  key={ach.id}
                  className={`flex flex-col justify-between rounded-2xl border p-4 transition-colors ${
                    claimed
                      ? 'border-emerald-500/45 bg-emerald-950/15'
                      : ready
                      ? 'border-amber-400/75 bg-amber-950/20'
                      : 'border-slate-800 bg-[#081022]/90'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 text-[11px]">
                      <span className="font-semibold text-amber-300">{ach.category}</span>
                      {claimed && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
                    </div>
                    <div className="mt-1.5 flex items-center gap-2.5">
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border ${
                          claimed
                            ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-300'
                            : 'border-amber-400/35 bg-amber-500/10 text-amber-300'
                        }`}
                      >
                        <Award className="h-4 w-4" />
                      </span>
                      <h4 className="font-display text-sm font-bold text-white">{ach.title}</h4>
                    </div>
                    <p className="mt-1.5 text-xs text-slate-400">{ach.description}</p>
                  </div>

                  <div className="mt-3 pt-2">
                    <div className="mb-1 flex justify-between font-mono-num text-[11px] text-slate-300">
                      <span>
                        {cur.toLocaleString()} / {ach.target.toLocaleString()}
                      </span>
                      <span>
                        +{ach.rewardCredits} CR · +{ach.rewardCrystals} Gems
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-sm bg-slate-800">
                      <div className="h-full bg-amber-400" style={{ width: `${pct}%` }} />
                    </div>
                    <button
                      type="button"
                      disabled={!ready}
                      onClick={() => {
                        SoundManager.unlock();
                        const res = ProgressionManager.claimAchievement(ach.id);
                        if (res.ok) SoundManager.playAchievementUnlock();
                        onFeedback(res);
                      }}
                      className={`mt-2.5 flex min-h-[40px] w-full items-center justify-center rounded-xl text-xs font-bold transition-colors ${
                        claimed
                          ? 'border border-emerald-500/35 bg-emerald-500/10 text-emerald-300'
                          : ready
                          ? 'bg-amber-400 text-slate-950 hover:bg-amber-300'
                          : 'cursor-not-allowed border border-slate-800 bg-slate-900 text-slate-500'
                      }`}
                    >
                      {claimed ? 'Medal Unlocked' : ready ? 'Claim Reward' : 'In Progress'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
