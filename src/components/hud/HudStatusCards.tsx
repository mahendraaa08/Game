import React, { memo } from 'react';
import { Heart, Shield, Skull } from 'lucide-react';
import { ActivePowerUpsBar } from './PowerUpIndicators';

interface BossHealthBarProps {
  name: string;
  title?: string;
  hp: number;
  maxHp: number;
  phase: 1 | 2 | 3;
  damageFlash: boolean;
  closing?: boolean;
  introKey?: number;
  introHeaderRef?: React.RefObject<HTMLDivElement | null>;
}

const PHASE_ROMAN: Record<1 | 2 | 3, string> = {
  1: 'I',
  2: 'II',
  3: 'III',
};

export const BossHealthBar = memo<BossHealthBarProps>(
  ({
    name,
    title,
    hp,
    maxHp,
    phase,
    damageFlash,
    closing = false,
    introKey = 0,
    introHeaderRef,
  }) => {
    const safeHp = Math.max(0, hp);
    const pct = Math.max(0, Math.min(100, (safeHp / Math.max(1, maxHp)) * 100));

    const frameBorderClass = closing
      ? 'border-slate-700/40 bg-[#060914]/75'
      : damageFlash
      ? 'border-rose-300/80 bg-[#150816]/94'
      : phase === 3
      ? 'border-fuchsia-400/55 bg-[#090717]/92'
      : phase === 2
      ? 'border-amber-400/50 bg-[#0a0815]/92'
      : 'border-rose-400/45 bg-[#070917]/92';

    const fillGradientClass =
      phase === 3
        ? 'from-purple-600 via-fuchsia-500 to-rose-400'
        : phase === 2
        ? 'from-rose-600 via-orange-500 to-amber-400'
        : 'from-rose-600 via-rose-500 to-rose-400';

    const phaseBadgeClass =
      phase === 3
        ? 'text-fuchsia-300 border-fuchsia-400/35 bg-fuchsia-500/12'
        : phase === 2
        ? 'text-amber-300 border-amber-400/35 bg-amber-500/12'
        : 'text-rose-300 border-rose-400/35 bg-rose-500/12';

    return (
      <div className="relative w-full">
        {/* Stage 1 Center Introduction Transient Header (Zero layout impact on core bar height) */}
        <div
          ref={introHeaderRef}
          className="pointer-events-none absolute inset-x-0 bottom-full mb-2 flex flex-col items-center text-center"
        >
          <span className="font-mono-num text-[10px] font-bold uppercase tracking-[0.22em] text-rose-400">
            Hostile Commander Detected
          </span>
          {title && (
            <span className="mt-0.5 truncate max-w-full text-[11px] font-medium tracking-wide text-slate-300">
              {title}
            </span>
          )}
        </div>

        {/* Core Boss Health Bar (Fixed height throughout Stage 1, Stage 2 Glide, and Follow) */}
        <div
          className={`relative w-full overflow-hidden rounded-xl border backdrop-blur-md px-3.5 py-2.5 shadow-xl shadow-black/55 transition-[opacity,transform,border-color,background-color] duration-300 ease-out ${frameBorderClass} ${
            closing ? 'opacity-0 -translate-y-1.5 scale-[0.96]' : 'opacity-100 translate-y-0 scale-100'
          }`}
        >
          {/* Subtle top specular edge */}
          <div
            className={`pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent ${
              phase === 3
                ? 'via-fuchsia-400/70'
                : phase === 2
                ? 'via-amber-400/70'
                : 'via-rose-400/70'
            } to-transparent`}
          />

          <div className="mb-1.5 flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${phaseBadgeClass}`}
              >
                <Skull className="h-3 w-3" />
              </span>
              <span className="truncate font-display text-sm font-bold uppercase tracking-[0.09em] text-white">
                {name}
              </span>
              <div
                className="flex shrink-0 items-center gap-1"
                aria-label={`Phase ${phase} of 3`}
              >
                <span className="font-mono-num text-[9.5px] font-semibold tracking-wider text-slate-400">
                  P{PHASE_ROMAN[phase]}
                </span>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3].map((p) => (
                    <span
                      key={p}
                      className={`h-1.5 w-2 rounded-[2px] transition-colors duration-200 ${
                        p <= phase
                          ? phase === 3
                            ? 'bg-fuchsia-400'
                            : phase === 2
                            ? 'bg-amber-400'
                            : 'bg-rose-400'
                          : 'bg-slate-800'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="shrink-0 font-mono-num text-[11px] font-semibold">
              <span className="text-slate-100">{safeHp.toLocaleString()}</span>
              <span className="mx-1 text-slate-600">·</span>
              <span
                className={
                  phase === 3
                    ? 'text-fuchsia-300'
                    : phase === 2
                    ? 'text-amber-300'
                    : 'text-rose-300'
                }
              >
                {Math.ceil(pct)}%
              </span>
            </div>
          </div>

          {/* Dual-Layer Bar: Delayed Damage Trail + Synchronized Live Fill + Intro Energy Sweep + Phase Notches */}
          <div className="relative h-2.5 w-full overflow-hidden rounded-md bg-[#04060f] ring-1 ring-inset ring-white/10">
            <div
              className="absolute inset-y-0 left-0 bg-amber-200/55 transition-[width] duration-300 ease-out"
              style={{ width: `${pct}%` }}
            />
            <div
              className={`relative h-full bg-gradient-to-r transition-[width] duration-75 ease-linear ${
                damageFlash ? 'from-rose-400 via-pink-300 to-amber-200' : fillGradientClass
              }`}
              style={{ width: `${pct}%` }}
            >
              <div className="absolute inset-x-0 top-0 h-px bg-white/35" />
            </div>
            {!closing && (
              <div
                key={introKey}
                className="boss-intro-sweep pointer-events-none absolute inset-y-0 w-24 bg-gradient-to-r from-transparent via-white/45 to-transparent"
              />
            )}
            <span className="pointer-events-none absolute inset-y-0 left-[33.33%] w-px bg-slate-950/90" />
            <span className="pointer-events-none absolute inset-y-0 left-[66.66%] w-px bg-slate-950/90" />
          </div>
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
  tempShield?: number;
  maxShield: number;
  rapidFireLeftSec: number;
  doubleDamageLeftSec: number;
  invulnLeftSec: number;
}>(
  ({
    shipName,
    creditsEarnedRun,
    hp,
    maxHp,
    shield,
    tempShield = 0,
    maxShield,
    rapidFireLeftSec,
    doubleDamageLeftSec,
    invulnLeftSec,
  }) => {
    const safeHp = Math.max(0, hp);
    const hpPct = Math.max(0, Math.min(100, (safeHp / Math.max(1, maxHp)) * 100));
    const shieldOffline = maxShield <= 0;
    const safeShield = Math.max(0, shield);
    const safeTempShield = Math.max(0, tempShield);
    const shieldPct = shieldOffline
      ? 0
      : Math.max(0, Math.min(100, (safeShield / maxShield) * 100));

    const hpToneText =
      hpPct > 45
        ? 'text-emerald-300'
        : hpPct > 22
        ? 'text-amber-300'
        : 'text-rose-300';

    const hpBarColor =
      hpPct > 45
        ? 'bg-emerald-400'
        : hpPct > 22
        ? 'bg-amber-400'
        : 'bg-rose-500';

    return (
      <div className="flex min-w-[152px] sm:min-w-[202px] flex-col rounded-xl border border-slate-700/65 bg-[#060c1a]/84 px-2.5 py-2 backdrop-blur-sm sm:px-3.5 sm:py-2.5 shadow-lg shadow-black/30">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-1">
            <span className="truncate font-display text-[10.5px] sm:text-[11px] font-bold tracking-[0.08em] text-cyan-200">
              {shipName}
            </span>
            <span className="shrink-0 font-mono-num text-[10px] font-semibold text-amber-300/95">
              +{creditsEarnedRun.toLocaleString()} CR
            </span>
          </div>

          {/* Health Meter */}
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center justify-between gap-2 text-[10px] sm:text-[11px]">
              <span className="inline-flex items-center gap-1 font-medium text-slate-300">
                <Heart className={`h-3 w-3 shrink-0 ${hpToneText}`} />
                <span>HP</span>
              </span>
              <span className={`font-mono-num font-bold ${hpToneText}`}>
                {safeHp}/{maxHp}
              </span>
            </div>
            <div className="relative h-1.5 sm:h-2 w-full overflow-hidden rounded-full bg-slate-900/95 ring-1 ring-inset ring-white/5">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-white/30 transition-[width] duration-300 ease-out"
                style={{ width: `${hpPct}%` }}
              />
              <div
                className={`relative h-full rounded-full transition-[width] duration-100 ease-out ${hpBarColor}`}
                style={{ width: `${hpPct}%` }}
              />
            </div>
          </div>

          {/* Shield Meter */}
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center justify-between gap-2 text-[10px] sm:text-[11px]">
              <span className="inline-flex items-center gap-1 font-medium text-slate-300">
                <Shield
                  className={`h-3 w-3 shrink-0 ${
                    shieldOffline ? 'text-slate-500' : safeTempShield > 0 ? 'text-cyan-300' : 'text-sky-400'
                  }`}
                />
                <span>SHD</span>
              </span>
              <span
                className={`font-mono-num font-bold ${
                  shieldOffline ? 'text-slate-500' : 'text-sky-300'
                }`}
              >
                {shieldOffline ? (
                  'Offline'
                ) : (
                  <>
                    {safeShield}/{maxShield}
                    {safeTempShield > 0 && (
                      <span className="ml-1 text-cyan-300">+{safeTempShield}</span>
                    )}
                  </>
                )}
              </span>
            </div>
            <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-slate-900/95 ring-1 ring-inset ring-white/5">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-cyan-200/35 transition-[width] duration-300 ease-out"
                style={{ width: `${shieldPct}%` }}
              />
              <div
                className="relative h-full rounded-full bg-sky-400 transition-[width] duration-100 ease-out"
                style={{ width: `${shieldPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Integrated Circular Active Power-Up Indicators (Unified smooth expand/collapse) */}
        <ActivePowerUpsBar
          rapidFireLeftSec={rapidFireLeftSec}
          doubleDamageLeftSec={doubleDamageLeftSec}
          invulnLeftSec={invulnLeftSec}
        />
      </div>
    );
  }
);
TelemetryCard.displayName = 'TelemetryCard';

export const ScoreHudCard = memo<{
  modeLabel: string;
  levelName: string;
  waveLabel: string;
  score: number;
  combo: number;
  challengeProgressText: string | null;
}>(({ modeLabel, levelName, waveLabel, score, combo, challengeProgressText }) => {
  return (
    <div className="flex min-w-[126px] sm:min-w-[164px] flex-col items-end justify-between rounded-xl border border-slate-700/65 bg-[#060c1a]/84 px-2.5 py-2 text-right backdrop-blur-sm sm:px-3.5 sm:py-2.5 shadow-lg shadow-black/30">
      <div className="flex w-full items-center justify-end gap-1.5 border-b border-slate-800/80 pb-1">
        <span className="max-w-[96px] sm:max-w-[155px] truncate text-[10px] font-medium tracking-wide text-slate-400">
          {modeLabel} · {levelName}
        </span>
        <span className="text-slate-600" aria-hidden="true">
          ·
        </span>
        <span className="shrink-0 font-mono-num text-[10px] sm:text-[10.5px] font-bold text-cyan-300">
          {waveLabel}
        </span>
      </div>

      <div className="mt-1 flex items-baseline justify-end gap-1.5">
        <span
          aria-label={`Score multiplier ${combo}x`}
          className={`font-mono-num text-[11px] font-bold tracking-tight ${
            combo >= 5
              ? 'text-fuchsia-300'
              : combo === 4
              ? 'text-amber-300'
              : combo === 3
              ? 'text-emerald-300'
              : combo === 2
              ? 'text-cyan-300'
              : 'text-slate-400'
          }`}
        >
          {combo}x
        </span>
        <span className="font-mono-num text-base sm:text-xl font-bold leading-none tracking-tight text-white">
          {score.toLocaleString()}
        </span>
      </div>

      <div className="mt-0.5 flex items-center justify-end gap-2">
        {challengeProgressText ? (
          <span className="font-mono-num text-[10px] font-semibold text-amber-300">
            {challengeProgressText}
          </span>
        ) : (
          <span className="font-mono-num text-[9.5px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            SCORE
          </span>
        )}
      </div>
    </div>
  );
});
ScoreHudCard.displayName = 'ScoreHudCard';
