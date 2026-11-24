import React, { useEffect, useRef } from 'react';
import { Heart, Shield, Sparkles, Zap } from 'lucide-react';
import { SoundManager } from '../game/audio/SoundManager';
import {
  BOSS_RUSH_RECOVERY_OPTIONS,
  BossRushRecoveryId,
  EndlessUpgradeStatId,
} from '../game/config/GameModeConfig';
import {
  BossRushRecoveryDraftPayload,
  EndlessUpgradeDraftPayload,
} from '../game/utils/EventBus';

const ENDLESS_CARD_STYLES: Record<
  EndlessUpgradeStatId,
  { border: string; badge: string; valueText: string; stripe: string }
> = {
  weapon_damage: {
    border: 'border-rose-400/45 hover:border-rose-300/85 hover:bg-rose-500/12',
    badge: 'border-rose-400/35 bg-rose-500/15 text-rose-300',
    valueText: 'text-rose-300',
    stripe: 'bg-rose-400',
  },
  fire_rate: {
    border: 'border-orange-400/45 hover:border-orange-300/85 hover:bg-orange-500/12',
    badge: 'border-orange-400/35 bg-orange-500/15 text-orange-300',
    valueText: 'text-orange-300',
    stripe: 'bg-orange-400',
  },
  crit_chance: {
    border: 'border-yellow-400/45 hover:border-yellow-300/85 hover:bg-yellow-500/12',
    badge: 'border-yellow-400/35 bg-yellow-500/15 text-yellow-300',
    valueText: 'text-yellow-300',
    stripe: 'bg-yellow-400',
  },
  crit_damage: {
    border: 'border-amber-400/45 hover:border-amber-300/85 hover:bg-amber-500/12',
    badge: 'border-amber-400/35 bg-amber-500/15 text-amber-300',
    valueText: 'text-amber-300',
    stripe: 'bg-amber-400',
  },
  max_hp: {
    border: 'border-emerald-400/45 hover:border-emerald-300/85 hover:bg-emerald-500/12',
    badge: 'border-emerald-400/35 bg-emerald-500/15 text-emerald-300',
    valueText: 'text-emerald-300',
    stripe: 'bg-emerald-400',
  },
  max_shield: {
    border: 'border-sky-400/45 hover:border-sky-300/85 hover:bg-sky-500/12',
    badge: 'border-sky-400/35 bg-sky-500/15 text-sky-300',
    valueText: 'text-sky-300',
    stripe: 'bg-sky-400',
  },
  move_speed: {
    border: 'border-cyan-400/45 hover:border-cyan-300/85 hover:bg-cyan-500/12',
    badge: 'border-cyan-400/35 bg-cyan-500/15 text-cyan-300',
    valueText: 'text-cyan-300',
    stripe: 'bg-cyan-400',
  },
  special_damage: {
    border: 'border-purple-400/45 hover:border-purple-300/85 hover:bg-purple-500/12',
    badge: 'border-purple-400/35 bg-purple-500/15 text-purple-300',
    valueText: 'text-purple-300',
    stripe: 'bg-purple-400',
  },
  special_cooldown: {
    border: 'border-indigo-400/45 hover:border-indigo-300/85 hover:bg-indigo-500/12',
    badge: 'border-indigo-400/35 bg-indigo-500/15 text-indigo-300',
    valueText: 'text-indigo-300',
    stripe: 'bg-indigo-400',
  },
};

export const EndlessUpgradeDraftModal: React.FC<{
  data: EndlessUpgradeDraftPayload;
  onSelect: (statId: EndlessUpgradeStatId) => void;
}> = ({ data, onSelect }) => {
  const pickLockRef = useRef(false);

  const handleChoose = (id: EndlessUpgradeStatId) => {
    if (pickLockRef.current) return;
    pickLockRef.current = true;
    SoundManager.unlock();
    SoundManager.playButtonClick();
    onSelect(id);
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat || pickLockRef.current) return;
      const idx = e.key === '1' ? 0 : e.key === '2' ? 1 : e.key === '3' ? 2 : -1;
      if (idx >= 0 && idx < data.choices.length) {
        e.preventDefault();
        handleChoose(data.choices[idx].id);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  const gridCols =
    data.choices.length === 1
      ? 'grid-cols-1 max-w-sm mx-auto'
      : data.choices.length === 2
      ? 'grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto'
      : 'grid-cols-1 sm:grid-cols-3';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="endless-draft-title"
      className="scroll-panel absolute inset-0 z-30 flex items-center justify-center overflow-y-auto bg-[#030712]/72 p-4 backdrop-blur-sm"
    >
      <div className="menu-enter my-auto w-full max-w-3xl rounded-2xl border border-purple-400/35 bg-[#081022]/96 p-5 sm:p-7 shadow-2xl shadow-black/70">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 font-mono-num text-[11px] font-bold uppercase tracking-[0.18em] text-purple-300">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Wave {data.waveCompleted} Milestone Boss Defeated</span>
          </div>
          <h2
            id="endless-draft-title"
            className="mt-1.5 font-display text-2xl sm:text-3xl font-bold tracking-[0.08em] text-white"
          >
            ENDLESS UPGRADE DRAFT
          </h2>
          <p className="mx-auto mt-1.5 max-w-xl text-xs sm:text-sm text-slate-300">
            Select 1 temporary combat modifier for this Endless Survival run. HP and Shield upgrades expand capacity without restoring current health or barrier.
          </p>
        </div>

        <div className={`mt-5 grid gap-3 ${gridCols}`}>
          {data.choices.map((choice, idx) => {
            const style = ENDLESS_CARD_STYLES[choice.id];
            return (
              <button
                key={choice.id}
                type="button"
                onClick={() => handleChoose(choice.id)}
                className={`group relative flex flex-col justify-between overflow-hidden rounded-xl border bg-[#060c1a]/92 p-4 text-left transition-[border-color,background-color,transform] duration-150 active:scale-[0.985] focus-visible:outline-2 focus-visible:outline-purple-300 ${style.border}`}
              >
                <div className={`absolute inset-x-0 top-0 h-1 ${style.stripe} opacity-80`} />

                <div>
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <span
                      className={`rounded-md border px-2 py-0.5 font-mono-num text-[10px] font-bold tracking-wider ${style.badge}`}
                    >
                      {choice.categoryLabel}
                    </span>
                    <span className="font-mono-num text-[10px] text-slate-500">
                      [{idx + 1}]
                    </span>
                  </div>

                  <div className="mt-3 font-display text-base font-bold tracking-wide text-white">
                    {choice.label}
                  </div>

                  <div className={`mt-1 font-mono-num text-xl font-bold ${style.valueText}`}>
                    {choice.formattedDelta}
                  </div>

                  <div className="mt-1 font-mono-num text-[11px] text-slate-400">
                    {choice.formattedProgress}
                  </div>

                  <p className="mt-2.5 text-xs leading-relaxed text-slate-300">
                    {choice.description}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-slate-800/80 pt-2.5 font-display text-xs font-bold tracking-wider text-slate-200 group-hover:text-white">
                  <span>SELECT MODIFIER</span>
                  <span className="font-mono-num text-purple-300">→</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const RECOVERY_CARD_STYLES: Record<
  BossRushRecoveryId,
  { border: string; badge: string; accent: string; stripe: string; icon: React.FC<{ className?: string }> }
> = {
  emergency_repair: {
    border: 'border-emerald-400/45 hover:border-emerald-300/85 hover:bg-emerald-500/12',
    badge: 'border-emerald-400/35 bg-emerald-500/15 text-emerald-300',
    accent: 'text-emerald-300',
    stripe: 'bg-emerald-400',
    icon: Heart,
  },
  shield_recharge: {
    border: 'border-sky-400/45 hover:border-sky-300/85 hover:bg-sky-500/12',
    badge: 'border-sky-400/35 bg-sky-500/15 text-sky-300',
    accent: 'text-sky-300',
    stripe: 'bg-sky-400',
    icon: Shield,
  },
  combat_calibration: {
    border: 'border-purple-400/45 hover:border-purple-300/85 hover:bg-purple-500/12',
    badge: 'border-purple-400/35 bg-purple-500/15 text-purple-300',
    accent: 'text-purple-300',
    stripe: 'bg-purple-400',
    icon: Zap,
  },
};

export const BossRushRecoveryModal: React.FC<{
  data: BossRushRecoveryDraftPayload;
  onSelect: (recoveryId: BossRushRecoveryId) => void;
}> = ({ data, onSelect }) => {
  const pickLockRef = useRef(false);

  const handleChoose = (id: BossRushRecoveryId) => {
    if (pickLockRef.current) return;
    pickLockRef.current = true;
    SoundManager.unlock();
    SoundManager.playButtonClick();
    onSelect(id);
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat || pickLockRef.current) return;
      const idx = e.key === '1' ? 0 : e.key === '2' ? 1 : e.key === '3' ? 2 : -1;
      if (idx >= 0 && idx < BOSS_RUSH_RECOVERY_OPTIONS.length) {
        e.preventDefault();
        handleChoose(BOSS_RUSH_RECOVERY_OPTIONS[idx].id);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  const hpPct = Math.max(0, Math.min(100, (data.currentHp / Math.max(1, data.maxHp)) * 100));
  const shieldPct =
    data.maxShield > 0
      ? Math.max(0, Math.min(100, (data.currentShield / data.maxShield) * 100))
      : 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="boss-rush-recovery-title"
      className="scroll-panel absolute inset-0 z-30 flex items-center justify-center overflow-y-auto bg-[#05030d]/76 p-4 backdrop-blur-sm"
    >
      <div className="menu-enter my-auto w-full max-w-3xl rounded-2xl border border-rose-400/35 bg-[#090c1c]/96 p-5 sm:p-7 shadow-2xl shadow-black/75">
        <div className="text-center">
          <div className="font-mono-num text-[11px] font-bold uppercase tracking-[0.18em] text-rose-300">
            Stage {data.defeatedBossNumber}/{data.totalBosses} Cleared · {data.defeatedBossName} Destroyed
          </div>
          <h2
            id="boss-rush-recovery-title"
            className="mt-1.5 font-display text-2xl sm:text-3xl font-bold tracking-[0.08em] text-white"
          >
            TACTICAL RECOVERY DRAFT
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-300">
            Incoming Threat:{' '}
            <strong className="font-display text-rose-300">{data.nextBossName}</strong> — Select 1 recovery protocol before engagement.
          </p>
        </div>

        {/* Live Hull & Shield Telemetry */}
        <div className="mt-4 grid grid-cols-1 gap-3 rounded-xl border border-slate-800/85 bg-[#060a16]/90 p-3.5 sm:grid-cols-2">
          <div>
            <div className="flex items-center justify-between font-mono-num text-xs">
              <span className="inline-flex items-center gap-1.5 text-emerald-300">
                <Heart className="h-3.5 w-3.5" />
                <span>Hull Integrity</span>
              </span>
              <span className="font-bold text-white">
                {data.currentHp} / {data.maxHp}
              </span>
            </div>
            <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-900">
              <div
                className="h-full rounded-full bg-emerald-400 transition-[width]"
                style={{ width: `${hpPct}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between font-mono-num text-xs">
              <span className="inline-flex items-center gap-1.5 text-sky-300">
                <Shield className="h-3.5 w-3.5" />
                <span>Shield Capacitor</span>
              </span>
              <span className="font-bold text-white">
                {data.maxShield > 0 ? `${data.currentShield} / ${data.maxShield}` : 'Offline'}
              </span>
            </div>
            <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-900">
              <div
                className="h-full rounded-full bg-sky-400 transition-[width]"
                style={{ width: `${shieldPct}%` }}
              />
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {BOSS_RUSH_RECOVERY_OPTIONS.map((opt, idx) => {
            const style = RECOVERY_CARD_STYLES[opt.id];
            const Icon = style.icon;
            const hpRoom = Math.max(0, data.maxHp - data.currentHp);
            const shieldRoom = Math.max(0, data.maxShield - data.currentShield);
            const hpGain =
              opt.hpRestoreRatio > 0
                ? Math.min(hpRoom, Math.max(1, Math.round(data.maxHp * opt.hpRestoreRatio)))
                : 0;
            const shieldGain =
              opt.shieldRestoreRatio > 0 && data.maxShield > 0
                ? Math.min(shieldRoom, Math.max(1, Math.round(data.maxShield * opt.shieldRestoreRatio)))
                : 0;

            const gainParts: string[] = [];
            if (opt.hpRestoreRatio > 0) {
              gainParts.push(hpGain > 0 ? `+${hpGain} HP` : 'HP Full');
            }
            if (opt.shieldRestoreRatio > 0) {
              gainParts.push(
                data.maxShield <= 0
                  ? 'No Shield'
                  : shieldGain > 0
                  ? `+${shieldGain} SHD`
                  : 'Shield Full'
              );
            }

            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleChoose(opt.id)}
                className={`group relative flex flex-col justify-between overflow-hidden rounded-xl border bg-[#060c1a]/92 p-4 text-left transition-[border-color,background-color,transform] duration-150 active:scale-[0.985] focus-visible:outline-2 focus-visible:outline-rose-300 ${style.border}`}
              >
                <div className={`absolute inset-x-0 top-0 h-1 ${style.stripe} opacity-80`} />

                <div>
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <span
                      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-mono-num text-[10px] font-bold tracking-wider ${style.badge}`}
                    >
                      <Icon className="h-3 w-3" />
                      <span>{opt.subtitle}</span>
                    </span>
                    <span className="font-mono-num text-[10px] text-slate-500">[{idx + 1}]</span>
                  </div>

                  <div className="mt-3 font-display text-base font-bold tracking-wide text-white">
                    {opt.title}
                  </div>

                  <div className={`mt-1 font-mono-num text-sm font-bold ${style.accent}`}>
                    {opt.effectLabel}
                  </div>

                  <div className="mt-1 font-mono-num text-xs font-semibold text-slate-200">
                    Actual Restore: {gainParts.join(' · ')}
                  </div>

                  <p className="mt-2.5 text-xs leading-relaxed text-slate-300">
                    {opt.description}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-slate-800/80 pt-2.5 font-display text-xs font-bold tracking-wider text-slate-200 group-hover:text-white">
                  <span>DEPLOY PROTOCOL</span>
                  <span className="font-mono-num text-rose-300">→</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
