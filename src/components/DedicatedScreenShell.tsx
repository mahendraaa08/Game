import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { SoundManager } from '../game/audio/SoundManager';
import { ActionResult } from '../game/systems/ProgressionManager';
import { CreditsBadge, CrystalsBadge } from './ui/CurrencyBadges';

interface DedicatedScreenShellProps {
  title: string;
  subtitle?: string;
  backLabel?: string;
  onBack: () => void;
  credits?: number;
  crystals?: number;
  showCurrencies?: boolean;
  onCurrencyClick?: () => void;
  feedback?: ActionResult | null;
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
  onCurrencyClick,
  feedback = null,
  translucent = false,
  maxWidthClass = 'max-w-6xl',
  children,
}) => {
  return (
    <div
      className={`menu-enter fixed inset-0 z-30 flex h-full flex-col overflow-hidden ${
        translucent
          ? 'pointer-events-none bg-[#040711]/62 backdrop-blur-[2px]'
          : 'bg-[#040711]/92 backdrop-blur-md'
      }`}
    >
      {/* Focused Single-Screen Header */}
      <header className="pointer-events-auto flex shrink-0 items-center justify-between gap-3 border-b border-slate-800/80 bg-[#050a18]/95 px-4 py-2.5 pt-[max(0.65rem,env(safe-area-inset-top))] sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={() => {
              SoundManager.unlock();
              SoundManager.playButtonClick();
              onBack();
            }}
            className="flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-xl border border-slate-700/80 bg-[#091124] px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-200 transition-colors hover:border-sky-400 hover:text-white active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-sky-400"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{backLabel}</span>
          </button>

          <div className="min-w-0">
            <h1 className="truncate font-display text-base sm:text-xl font-bold tracking-wide text-white">
              {title}
            </h1>
            {subtitle && (
              <p className="hidden sm:block truncate font-mono-num text-[11px] text-slate-400">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {showCurrencies && (
          <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
            <CreditsBadge
              amount={credits}
              size="sm"
              onClick={
                onCurrencyClick
                  ? () => {
                      SoundManager.unlock();
                      SoundManager.playButtonClick();
                      onCurrencyClick();
                    }
                  : undefined
              }
            />
            <CrystalsBadge
              amount={crystals}
              size="sm"
              onClick={
                onCurrencyClick
                  ? () => {
                      SoundManager.unlock();
                      SoundManager.playButtonClick();
                      onCurrencyClick();
                    }
                  : undefined
              }
            />
          </div>
        )}
      </header>

      {/* Action Feedback Toast */}
      {feedback && (
        <div className="pointer-events-none fixed inset-x-0 top-[76px] z-40 flex justify-center px-4">
          <div
            className={`rounded-xl border px-4 py-2 text-xs font-bold shadow-xl backdrop-blur-sm ${
              feedback.ok
                ? 'border-emerald-400/70 bg-[#061c18]/95 text-emerald-200'
                : 'border-rose-400/70 bg-[#1e0712]/95 text-rose-200'
            }`}
          >
            {feedback.message}
          </div>
        </div>
      )}

      {/* Naturally Scrollable Screen Workspace */}
      <div className="pointer-events-auto scroll-panel min-h-0 flex-1 overflow-y-auto px-4 py-4 pb-[max(1.75rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-5">
        <div className={`mx-auto w-full ${maxWidthClass}`}>{children}</div>
      </div>
    </div>
  );
};
