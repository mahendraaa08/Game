import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, BookOpen, Search, X } from 'lucide-react';
import {
  CODEX_CATEGORIES,
  type CodexCategoryId,
  getCodexCategoryCount,
  getCodexEntries,
} from '../../data/codex';
import { SoundManager } from '../../game/audio/SoundManager';
import { CodexArtwork } from './CodexArtwork';
import { CodexEntryDetail } from './CodexEntryDetail';

export const CodexPanel: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<CodexCategoryId>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string>('');
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);

  const entries = useMemo(
    () => getCodexEntries(activeCategory, searchQuery),
    [activeCategory, searchQuery]
  );

  const activeCategoryMeta = useMemo(
    () => CODEX_CATEGORIES.find((c) => c.id === activeCategory) ?? CODEX_CATEGORIES[0],
    [activeCategory]
  );

  useEffect(() => {
    if (entries.length === 0) {
      setSelectedId('');
      return;
    }
    const stillExists = entries.some((item) => item.id === selectedId);
    if (!stillExists) {
      setSelectedId(entries[0].id);
    }
  }, [entries, selectedId]);

  const selectedIndex = useMemo(() => {
    if (entries.length === 0) return -1;
    const idx = entries.findIndex((item) => item.id === selectedId);
    return idx >= 0 ? idx : 0;
  }, [entries, selectedId]);

  const selectedEntry = selectedIndex >= 0 ? entries[selectedIndex] : null;

  const handleSelectCategory = (catId: CodexCategoryId) => {
    if (catId === activeCategory) return;
    SoundManager.playButtonClick();
    setActiveCategory(catId);
    setMobileDetailOpen(false);
  };

  const handleSelectEntry = (entryId: string) => {
    SoundManager.playButtonClick();
    setSelectedId(entryId);
    setMobileDetailOpen(true);
  };

  const handlePrevEntry = () => {
    if (entries.length <= 1 || selectedIndex < 0) return;
    const nextIdx = (selectedIndex - 1 + entries.length) % entries.length;
    setSelectedId(entries[nextIdx].id);
  };

  const handleNextEntry = () => {
    if (entries.length <= 1 || selectedIndex < 0) return;
    const nextIdx = (selectedIndex + 1) % entries.length;
    setSelectedId(entries[nextIdx].id);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Category Navigation Strip + Search Control */}
      <div className="flex flex-col gap-3 border-b border-slate-800/80 pb-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Category Filter Tabs */}
          <nav
            aria-label="Codex Categories"
            className="swipe-strip-x flex items-center gap-1.5 overflow-x-auto pb-1 lg:flex-wrap lg:overflow-visible lg:pb-0"
          >
            {CODEX_CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.id;
              const count = getCodexCategoryCount(cat.id);
              return (
                <button
                  key={cat.id}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => handleSelectCategory(cat.id)}
                  className={`flex min-h-[40px] shrink-0 items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-[border-color,background-color,color] duration-150 focus-visible:outline-2 focus-visible:outline-cyan-400 ${
                    isActive
                      ? 'border-cyan-300/65 bg-cyan-400/14 text-cyan-100'
                      : 'border-slate-800/90 bg-[#081021]/80 text-slate-400 hover:border-slate-600 hover:text-slate-100'
                  }`}
                >
                  <span>{cat.shortLabel}</span>
                  <span
                    className={`font-mono-num text-[11px] tabular-nums ${
                      isActive ? 'text-cyan-300' : 'text-slate-500'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </nav>

          {/* Search Input */}
          <div className="relative w-full shrink-0 lg:w-72">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name, trait, or weapon..."
              aria-label="Search Codex entries"
              className="min-h-[42px] w-full rounded-xl border border-slate-700/75 bg-[#081021]/90 pl-9 pr-9 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 transition-[border-color] duration-150 focus:border-cyan-400/70 focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Category Context Line */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
          <p className="text-slate-300/90">{activeCategoryMeta.description}</p>
          <span className="font-mono-num text-slate-400 tabular-nums whitespace-nowrap">
            {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
          </span>
        </div>
      </div>

      {/* Empty Search Result State */}
      {entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-800/80 bg-[#081021]/75 px-6 py-12 text-center">
          <BookOpen className="h-8 w-8 text-slate-500" />
          <h2 className="mt-3 font-display text-base font-bold text-slate-100">
            No matching Codex entries
          </h2>
          <p className="mt-1 max-w-sm text-xs sm:text-sm text-slate-400">
            No aircraft, weapons, equipment, or hostile units matched your current filter.
          </p>
          <button
            type="button"
            onClick={() => {
              SoundManager.playButtonClick();
              setSearchQuery('');
              setActiveCategory('all');
            }}
            className="mt-4 min-h-[40px] rounded-xl border border-cyan-300/50 bg-cyan-400/12 px-4 py-2 text-xs font-semibold text-cyan-200 transition-colors hover:bg-cyan-400/20"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        /* Split Master-Detail Encyclopedia Workspace */
        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.18fr)]">
          {/* Left Column: Entry Cards Grid */}
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {entries.map((entry) => {
              const isSelected = selectedEntry?.id === entry.id;
              return (
                <button
                  key={entry.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => handleSelectEntry(entry.id)}
                  className={`group flex min-h-[72px] w-full items-center gap-3 rounded-xl border p-3 text-left transition-[border-color,background-color,transform] duration-150 active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-cyan-400 ${
                    isSelected
                      ? 'border-cyan-300/75 bg-[#0c1b36]/95'
                      : 'border-slate-800/85 bg-[#081021]/82 hover:border-slate-600/90 hover:bg-[#0b162c]/90'
                  }`}
                >
                  <CodexArtwork entry={entry} size={44} />

                  <div className="min-w-0 flex-1">
                    <div className="truncate font-display text-sm font-bold tracking-wide text-white">
                      {entry.name}
                    </div>
                    <div className="mt-0.5 truncate text-xs text-slate-400">{entry.subtitle}</div>
                    {entry.stats[0] && (
                      <div className="mt-1 flex items-center gap-1.5 font-mono-num text-[11px] text-slate-300/90 tabular-nums">
                        <span className="truncate text-slate-400">{entry.stats[0].label}:</span>
                        <span className="font-semibold text-cyan-200 whitespace-nowrap">
                          {entry.stats[0].value}
                        </span>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Column: Desktop Sticky Dossier */}
          {selectedEntry && (
            <div className="hidden lg:block lg:sticky lg:top-0">
              <CodexEntryDetail
                entry={selectedEntry}
                currentIndex={selectedIndex}
                totalCount={entries.length}
                onPrev={handlePrevEntry}
                onNext={handleNextEntry}
              />
            </div>
          )}
        </div>
      )}

      {/* Mobile & Tablet Detail Drawer Sheet (< lg viewports) */}
      {mobileDetailOpen && selectedEntry && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${selectedEntry.name} Details`}
          className="fixed inset-0 z-40 flex flex-col bg-[#040711]/95 backdrop-blur-md lg:hidden"
        >
          <header className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-800/80 bg-[#050a18]/95 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
            <button
              type="button"
              onClick={() => {
                SoundManager.playButtonClick();
                setMobileDetailOpen(false);
              }}
              className="flex min-h-[42px] items-center gap-2 rounded-xl border border-slate-700/65 bg-slate-900/70 px-3.5 py-2 text-xs font-semibold text-slate-200 transition-colors hover:border-cyan-300/50 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4 text-cyan-300" />
              <span>Back to List</span>
            </button>
            <span className="truncate font-display text-xs font-bold uppercase tracking-wider text-slate-300">
              {activeCategoryMeta.label}
            </span>
          </header>

          <div className="scroll-panel min-h-0 flex-1 overflow-y-auto p-4 pb-[max(2rem,env(safe-area-inset-bottom))]">
            <CodexEntryDetail
              entry={selectedEntry}
              currentIndex={selectedIndex}
              totalCount={entries.length}
              onPrev={handlePrevEntry}
              onNext={handleNextEntry}
            />
          </div>
        </div>
      )}
    </div>
  );
};
