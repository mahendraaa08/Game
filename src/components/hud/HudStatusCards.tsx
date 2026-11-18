import React, { memo } from 'react';

interface BossHealthBarProps {
  name: string;
  hp: number;
  maxHp: number;
  phase: 1 | 2 | 3;
  damageFlash: boolean;
}

export const BossHealthBar = memo<BossHealthBarProps>(
  ({ name, hp, maxHp, phase, damageFlash }) => {
    const pct = Math.max(0, Math.min(100, (hp / Math.max(1, maxHp)) * 100));

    return (
      <div
        className={`w-full rounded-xl border transition-colors duration-150 backdrop-blur-sm px-3 py-1.5 lg:px-4 lg:py-2 ${
          damageFlash
            ? 'border-rose-300 bg-[#1a0718]/92 shadow-[0_0_18px_rgba(244,63,94,0.36)]'
            : 'border-rose-500/45 bg-[#090412]/88 shadow-[0_6px_16px_rgba(2,6,18,0.55)]'
        }`}
      >
        <div className="mb-1 flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate font-display text-xs sm:text-sm font-bold tracking-wider text-rose-300">
              {name}
            </span>
            <div className="flex items-center gap-0.5" aria-label={`Phase ${phase} of 3`}>
              {[1, 2, 3].map((p) => (
                <span
                  key={p}
                  className={`h-1.5 w-3 rounded-[2px] transition-colors ${
                    p <= phase ? 'bg-rose-400' : 'bg-slate-800'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="shrink-0 font-mono-num text-[11px] sm:text-xs font-semibold text-slate-200">
            <span>{hp.toLocaleString()}</span>
            <span className="mx-1 text-slate-500">·</span>
            <span className="text-rose-300">{Math.ceil(pct)}%</span>
          </div>
        </div>

        <div className="relative h-2 lg:h-2.5 w-full overflow-hidden rounded-sm bg-slate-950/95 ring-1 ring-inset ring-rose-500/25">
          <div
            className="absolute inset-y-0 left-0 bg-amber-300/60 transition-[width] duration-300 ease-out"
            style={{ width: `${pct}%` }}
          />
          <div
            className={`relative h-full transition-[width] duration-100 ${
              damageFlash
                ? 'bg-gradient-to-r from-rose-400 via-pink-400 to-amber-300'
                : 'bg-gradient-to-r from-rose-600 via-rose-500 to-fuchsia-500'
            }`}
            style={{ width: `${pct}%` }}
          />
          <span className="pointer-events-none absolute inset-y-0 left-[33.33%] w-px bg-slate-950/80" />
          <span className="pointer-events-none absolute inset-y-0 left-[66.66%] w-px bg-slate-950/80" />
        </div>
      </div>
    );
  }
);
BossHealthBar.displayName = 'BossHealthBar';

export const TelemetryCard = memo<{
  shipName: string;
  creditsEarnedRun: number;
  hp: number;
  maxHp: number;
  shield: number;
  maxShield: number;
}>(({ shipName, creditsEarnedRun, hp, maxHp, shield, maxShield }) => {
  const hpPct = Math.max(0, Math.min(100, (hp / Math.max(1, maxHp)) * 100));
  const shieldPct =
    maxShield > 0 ? Math.max(0, Math.min(100, (shield / maxShield) * 100)) : 0;

  return (
    <div className="flex min-w-[134px] sm:min-w-[188px] flex-col gap-1.5 rounded-xl border border-cyan-400/22 bg-[#050b1a]/80 px-2.5 py-2 backdrop-blur-sm sm:px-3">
      <div className="flex items-center justify-between gap-2 text-[10px] font-semibold">
        <span className="truncate font-display tracking-wide text-cyan-300">{shipName}</span>
        <span className="font-mono-num text-[10px] text-amber-300">+{creditsEarnedRun} CR</span>
      </div>

      <div>
        <div className="mb-0.5 flex items-center justify-between text-[10px] sm:text-[11px] font-semibold">
          <span className="text-slate-300">Hull</span>
          <span className="font-mono-num text-emerald-300">
            {hp}/{maxHp}
          </span>
        </div>
        <div className="h-1.5 sm:h-2 w-28 sm:w-40 overflow-hidden rounded-full bg-slate-900/95 ring-1 ring-inset ring-white/5">
          <div
            className={`h-full rounded-full transition-all duration-100 ${
              hpPct > 45 ? 'bg-emerald-400' : hpPct > 22 ? 'bg-amber-400' : 'bg-rose-500'
            }`}
            style={{ width: `${hpPct}%` }}
          />
        </div>
      </div>

      <div>
        <div className="mb-0.5 flex items-center justify-between text-[10px] sm:text-[11px] font-semibold">
          <span className="text-slate-300">Shield</span>
          <span className="font-mono-num text-sky-300">
            {maxShield > 0 ? `${shield}/${maxShield}` : 'Offline'}
          </span>
        </div>
        <div className="h-1.5 w-28 sm:w-40 overflow-hidden rounded-full bg-slate-900/95 ring-1 ring-inset ring-white/5">
          <div
            className="h-full rounded-full bg-sky-400 transition-all duration-100"
            style={{ width: `${shieldPct}%` }}
          />
        </div>
      </div>
    </div>
  );
});
TelemetryCard.displayName = 'TelemetryCard';
