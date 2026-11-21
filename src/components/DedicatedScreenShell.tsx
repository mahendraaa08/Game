import React from 'react';
import { AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { SoundManager } from '../game/audio/SoundManager';
import { ActionResult } from '../game/systems/ProgressionManager';
import { CompactCurrencyCluster } from './ui/CurrencyBadges';

interface DedicatedScreenShellProps {
  title: string;
  subtitle?: string;
  backLabel?: string;
  onBack: () => void;
  credits?: number;
  crystals?: number;
  showCurrencies?: boolean;
  onOpenExchange?: (direction: 'credits_to_gems' | 'gems_to_credits') => void;
  feedback?: ActionResult | null;
  subNav?: React.ReactNode;
  translucent?: boolean;
  maxWidthClass?: string;
  children: React.ReactNode;
}

export const DedicatedScreenShell: React.FC<DedicatedScreenShellProps> = ({
  title,
  subtitle,
  backLabel = 'Back',
  onBack,
  credits = 0,
  crystals = 0,
  showCurrencies = true,
  onOpenExchange,
  feedback = null,
  subNav,
  translucent = false,
  maxWidthClass = 'max-w-6xl',
  children,
}) => {
  return (
    <div
      className={`menu-enter fixed inset-0 z-30 flex h-full flex-col overflow-hidden ${
        translucent
          ? 'pointer-events-none bg-[#040711]/64 backdrop-blur-[2px]'
          : 'bg-[#040711]/94 backdrop-blur-md'
      }`}
    >
      {/* Unified Matte Sci-Fi Header */}
      <header className="pointer-events-auto shrink-0 border-b border-slate-800/75 bg-[#050a18]/92 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-6 lg:px-8">
        <div className={`mx-auto flex w-full ${maxWidthClass} items-center justify-between gap-3`}>
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <button
              type="button"
              aria-label={`Back to ${backLabel}`}
              onClick={() => {
                SoundManager.unlock();
                SoundManager.playButtonClick();
                onBack();
              }}
              className="group flex min-h-[42px] sm:min-h-[44px] shrink-0 items-center gap-2 rounded-xl border border-slate-700/55 bg-slate-900/55 px-3 sm:px-3.5 py-2 text-xs sm:text-[13px] font-medium tracking-wide text-slate-200 transition-[border-color,background-color,color,transform] duration-150 hover:border-cyan-300/45 hover:bg-[#0d1930]/85 hover:text-white active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-cyan-400"
            >
              <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 text-slate-400 transition-[transform,color] duration-150 group-hover:-translate-x-0.5 group-hover:text-cyan-300" />
              <span className="whitespace-nowrap">{backLabel}</span>
            </button>

            <span
              aria-hidden="true"
              className="hidden h-5 w-px shrink-0 bg-slate-800/90 sm:block"
            />

            <div className="min-w-0">
              <h1 className="truncate font-display text-sm sm:text-lg font-bold tracking-[0.06em] text-white uppercase">
                {title}
              </h1>
              {subtitle && (
                <p className="hidden sm:block truncate font-mono-num text-[11px] tracking-wide text-slate-400">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {showCurrencies && (
            <div className="shrink-0">
              <CompactCurrencyCluster
                credits={credits}
                crystals={crystals}
                onOpenExchange={
                  onOpenExchange
                    ? (dir) => {
                        SoundManager.unlock();
                        SoundManager.playButtonClick();
                        onOpenExchange(dir);
                      }
                    : undefined
                }
              />
            </div>
          )}
        </div>
      </header>

      {/* Optional Quick Sub-Navigation Bar (e.g. Hangar Category Tabs) */}
      {subNav && (
        <div className="pointer-events-auto shrink-0 border-b border-slate-800/70 bg-[#050b19]/84 px-4 py-2 sm:px-6 lg:px-8">
          <div className={`mx-auto w-full ${maxWidthClass}`}>{subNav}</div>
        </div>
      )}

      {/* Non-Blocking Feedback Toast */}
      {feedback && (
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-none fixed inset-x-0 top-[76px] z-40 flex justify-center px-4"
        >
          <div
            className={`menu-enter flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-semibold shadow-xl shadow-black/45 backdrop-blur-sm ${
              feedback.ok
                ? 'border-emerald-400/50 bg-[#071816]/95 text-emerald-200'
                : 'border-rose-400/50 bg-[#1c0912]/95 text-rose-200'
            }`}
          >
            {feedback.ok ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            )}
            <span>{feedback.message}</span>
          </div>
        </div>
      )}

      {/* Scrollable Screen Workspace */}
      <div className="pointer-events-auto scroll-panel min-h-0 flex-1 overflow-y-auto px-4 py-4 pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-5 lg:px-8">
        <div className={`mx-auto w-full ${maxWidthClass}`}>{children}</div>
      </div>
    </div>
  );
};

