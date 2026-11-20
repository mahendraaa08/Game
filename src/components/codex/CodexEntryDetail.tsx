import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CODEX_CATEGORIES, type CodexEntry, type CodexStatTone } from '../../data/codex';
import { SoundManager } from '../../game/audio/SoundManager';
import { CodexArtwork } from './CodexArtwork';

interface CodexEntryDetailProps {
  entry: CodexEntry;
  currentIndex: number;
  totalCount: number;
  onPrev: () => void;
  onNext: () => void;
}

const TONE_BAR_CLASS: Record<CodexStatTone, string> = {
  sky: 'bg-sky-400',
  cyan: 'bg-cyan-400',
  emerald: 'bg-emerald-400',
  amber: 'bg-amber-400',
  rose: 'bg-rose-400',
  purple: 'bg-purple-400',
  slate: 'bg-slate-400',
};

const TONE_TEXT_CLASS: Record<CodexStatTone, string> = {
  sky: 'text-sky-200',
  cyan: 'text-cyan-200',
  emerald: 'text-emerald-200',
  amber: 'text-amber-200',
  rose: 'text-rose-200',
  purple: 'text-purple-200',
  slate: 'text-slate-200',
};

export const CodexEntryDetail: React.FC<CodexEntryDetailProps> = ({
  entry,
  currentIndex,
  totalCount,
  onPrev,
  onNext,
}) => {
  const categoryLabel =
    CODEX_CATEGORIES.find((c) => c.id === entry.category)?.label ?? entry.category;

  return (
    <article
      key={entry.id}
      className="panel-swap flex flex-col gap-5 rounded-2xl border border-slate-800/85 bg-[#081021]/92 p-5 sm:p-6"
    >
      {/* Dossier Header: Artwork + Identity + Prev/Next Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4 min-w-0">
          <div className="shrink-0">
            <CodexArtwork entry={entry} size={64} />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-400">
              <span style={{ color: entry.accentHex }} className="font-semibold">
                {categoryLabel}
              </span>
              <span aria-hidden="true">·</span>
              <span className="truncate">{entry.subtitle}</span>
            </div>
            <h2 className="mt-1 font-display text-xl sm:text-2xl font-bold tracking-wide text-white text-balance">
              {entry.name}
            </h2>
            {entry.acquisition && (
              <p className="mt-1 font-mono-num text-xs text-slate-400">{entry.acquisition}</p>
            )}
          </div>
        </div>

        {totalCount > 1 && (
          <div className="flex shrink-0 items-center gap-1.5 self-end sm:self-start">
            <span className="mr-1 font-mono-num text-xs text-slate-400 tabular-nums">
              {currentIndex + 1} / {totalCount}
            </span>
            <button
              type="button"
              aria-label="Previous Codex entry"
              onClick={() => {
                SoundManager.playButtonClick();
                onPrev();
              }}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700/70 bg-slate-900/70 text-slate-300 transition-[border-color,background-color,color] duration-150 hover:border-cyan-300/50 hover:bg-[#0d1930] hover:text-white focus-visible:outline-2 focus-visible:outline-cyan-400"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Next Codex entry"
              onClick={() => {
                SoundManager.playButtonClick();
                onNext();
              }}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700/70 bg-slate-900/70 text-slate-300 transition-[border-color,background-color,color] duration-150 hover:border-cyan-300/50 hover:bg-[#0d1930] hover:text-white focus-visible:outline-2 focus-visible:outline-cyan-400"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Overview Prose */}
      <p className="max-w-[68ch] text-sm leading-relaxed text-slate-300">{entry.description}</p>

      {/* Primary Statistics Grid */}
      <section aria-label="Statistics" className="border-t border-slate-800/85 pt-4">
        <h3 className="font-display text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
          Statistics
        </h3>

        <div className="mt-3 grid grid-cols-1 gap-x-5 gap-y-3 sm:grid-cols-2">
          {entry.stats.map((stat) => {
            const tone: CodexStatTone = stat.tone ?? 'sky';
            const hasBar =
              stat.numericValue !== undefined &&
              stat.maxReference !== undefined &&
              stat.maxReference > 0;
            const pct = hasBar
              ? Math.min(100, Math.max(5, Math.round((stat.numericValue! / stat.maxReference!) * 100)))
              : 0;

            return (
              <div
                key={stat.label}
                className="flex flex-col justify-between gap-1.5 border-b border-slate-800/55 pb-2.5"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-xs text-slate-400">{stat.label}</span>
                  <span
                    className={`font-mono-num text-sm font-semibold tabular-nums whitespace-nowrap ${TONE_TEXT_CLASS[tone]}`}
                  >
                    {stat.value}
                  </span>
                </div>
                {hasBar && (
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800/90">
                    <div
                      style={{ width: `${pct}%` }}
                      className={`h-full rounded-full ${TONE_BAR_CLASS[tone]} opacity-85 transition-[opacity] duration-200`}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Special Effects & Tactical Mechanics */}
      {entry.specialEffects.length > 0 && (
        <section aria-label="Special Effects" className="border-t border-slate-800/85 pt-4">
          <h3 className="font-display text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
            Special Effects &amp; Mechanics
          </h3>

          <div className="mt-3 divide-y divide-slate-800/65">
            {entry.specialEffects.map((eff) => (
              <div key={eff.title} className="py-2.5 first:pt-0 last:pb-0">
                <h4 className="text-sm font-semibold text-slate-100">{eff.title}</h4>
                <p className="mt-0.5 text-xs sm:text-[13px] leading-relaxed text-slate-300/90">
                  {eff.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </article>
  );
};
