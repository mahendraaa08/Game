import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, ArrowUpDown, Minus, Plus } from 'lucide-react';
import { SoundManager } from '../../game/audio/SoundManager';
import {
  CURRENCY_EXCHANGE_CONFIG,
  type ExchangeDirection,
  previewCurrencyExchange,
} from '../../game/config/EconomyConfig';
import { ActionResult, ProgressionManager } from '../../game/systems/ProgressionManager';
import { PlayerProgress } from '../../game/utils/StorageManager';
import { CreditCoinIcon, CrystalGemIcon } from '../ui/CurrencyBadges';

interface ExchangePanelProps {
  progress: PlayerProgress;
  initialDirection?: ExchangeDirection;
  onFeedback: (res: ActionResult) => void;
}

export const ExchangePanel: React.FC<ExchangePanelProps> = ({
  progress,
  initialDirection = 'credits_to_gems',
  onFeedback,
}) => {
  const [direction, setDirection] = useState<ExchangeDirection>(initialDirection);
  const [rawInput, setRawInput] = useState<string>('1');
  const submitLockRef = useRef(false);

  useEffect(() => {
    setDirection(initialDirection);
  }, [initialDirection]);

  const parsedUnits = useMemo(() => {
    if (!rawInput.trim()) return 0;
    const num = Number(rawInput);
    return Number.isFinite(num) ? num : -1;
  }, [rawInput]);

  const preview = useMemo(
    () => previewCurrencyExchange(direction, parsedUnits, progress.credits, progress.crystals),
    [direction, parsedUnits, progress.credits, progress.crystals]
  );

  const isBuyGems = direction === 'credits_to_gems';
  const maxAffordable = preview.maxGemUnits;
  const validUnits = parsedUnits > 0 ? Math.floor(parsedUnits) : 0;
  const creditAmount =
    validUnits *
    (isBuyGems
      ? CURRENCY_EXCHANGE_CONFIG.creditsPerGemBuy
      : CURRENCY_EXCHANGE_CONFIG.creditsPerGemSell);

  const handleSelectDirection = (next: ExchangeDirection) => {
    if (next === direction) return;
    SoundManager.unlock();
    SoundManager.playButtonClick();
    setDirection(next);
    setRawInput('1');
  };

  const handleFlipDirection = () => {
    handleSelectDirection(isBuyGems ? 'gems_to_credits' : 'credits_to_gems');
  };

  const handleSetUnits = (units: number) => {
    SoundManager.unlock();
    SoundManager.playButtonClick();
    setRawInput(String(Math.max(1, Math.floor(units))));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRawInput(e.target.value.replace(/[^0-9]/g, ''));
  };

  const handleStep = (delta: number) => {
    SoundManager.unlock();
    SoundManager.playButtonClick();
    const base = Number.isFinite(parsedUnits) && parsedUnits > 0 ? Math.floor(parsedUnits) : 1;
    setRawInput(String(Math.max(1, base + delta)));
  };

  const handleSetMax = () => {
    SoundManager.unlock();
    SoundManager.playButtonClick();
    setRawInput(String(Math.max(1, maxAffordable)));
  };

  const handleConfirm = () => {
    if (submitLockRef.current) return;
    submitLockRef.current = true;
    try {
      SoundManager.unlock();
      const res = ProgressionManager.exchangeCurrency(direction, parsedUnits);
      if (res.ok) {
        SoundManager.playPowerUp();
        setRawInput('1');
      } else {
        SoundManager.playButtonClick();
      }
      onFeedback(res);
    } finally {
      window.setTimeout(() => {
        submitLockRef.current = false;
      }, 120);
    }
  };

  const gemStepperControl = (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-cyan-400/25 bg-cyan-400/10">
            <CrystalGemIcon className="h-4.5 w-4.5" />
          </span>
          <div>
            <div className="font-display text-sm font-bold text-white whitespace-nowrap">
              Void Gems
            </div>
            <div className="font-mono-num tabular-nums text-[11px] text-slate-400">
              Balance: {progress.crystals.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            aria-label="Decrease gem quantity"
            onClick={() => handleStep(-1)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-700/75 bg-[#091224] text-slate-200 transition-[border-color,background-color,transform] duration-150 hover:border-cyan-300/55 hover:bg-slate-800 active:scale-[0.95] focus-visible:outline-2 focus-visible:outline-cyan-400"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>

          <input
            id="exchange-gem-amount"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={rawInput}
            onChange={handleInputChange}
            aria-label="Gem quantity"
            placeholder="1"
            className={`h-10 w-20 rounded-xl border border-slate-700/80 bg-[#040814] px-2 text-center font-mono-num tabular-nums text-base font-bold text-white outline-none transition-colors sm:w-24 ${
              isBuyGems ? 'focus:border-cyan-400/80' : 'focus:border-amber-400/80'
            }`}
          />

          <button
            type="button"
            aria-label="Increase gem quantity"
            onClick={() => handleStep(1)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-700/75 bg-[#091224] text-slate-200 transition-[border-color,background-color,transform] duration-150 hover:border-cyan-300/55 hover:bg-slate-800 active:scale-[0.95] focus-visible:outline-2 focus-visible:outline-cyan-400"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Quick Presets */}
      <div className="grid grid-cols-5 gap-1.5">
        {CURRENCY_EXCHANGE_CONFIG.presets.map((preset) => {
          const selected = parsedUnits === preset;
          return (
            <button
              key={preset}
              type="button"
              onClick={() => handleSetUnits(preset)}
              className={`min-h-[34px] rounded-lg border px-2 py-1 font-mono-num tabular-nums text-xs font-semibold transition-[border-color,background-color,color,transform] duration-150 active:scale-[0.96] whitespace-nowrap ${
                selected
                  ? isBuyGems
                    ? 'border-cyan-400/65 bg-cyan-400/15 text-cyan-200'
                    : 'border-amber-400/65 bg-amber-400/15 text-amber-200'
                  : 'border-slate-800/90 bg-[#050b18] text-slate-300 hover:border-slate-700 hover:text-white'
              }`}
            >
              {preset}
            </button>
          );
        })}
        <button
          type="button"
          onClick={handleSetMax}
          disabled={maxAffordable <= 0}
          className="min-h-[34px] rounded-lg border border-slate-700/75 bg-[#091224] px-2 py-1 font-mono-num text-xs font-semibold text-slate-200 transition-[border-color,background-color,transform] duration-150 hover:border-cyan-300/55 hover:text-white active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-40 whitespace-nowrap"
        >
          Max
        </button>
      </div>
    </div>
  );

  const creditsSummaryControl = (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-amber-400/25 bg-amber-400/10">
          <CreditCoinIcon className="h-4.5 w-4.5" />
        </span>
        <div>
          <div className="font-display text-sm font-bold text-white whitespace-nowrap">
            Credits
          </div>
          <div className="font-mono-num tabular-nums text-[11px] text-slate-400">
            Balance: {progress.credits.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="text-right font-mono-num tabular-nums">
        <div
          className={`text-xl sm:text-2xl font-bold tracking-tight ${
            validUnits <= 0
              ? 'text-slate-500'
              : isBuyGems
              ? 'text-amber-200'
              : 'text-emerald-300'
          }`}
        >
          {validUnits > 0
            ? `${isBuyGems ? '-' : '+'}${creditAmount.toLocaleString()}`
            : '0'}
        </div>
        <div className="text-[10.5px] font-medium uppercase tracking-wider text-slate-400">
          CR
        </div>
      </div>
    </div>
  );

  return (
    <div className="mx-auto flex w-full max-w-[496px] flex-col gap-4">
      {/* Compact Dual Wallet Strip */}
      <div className="grid grid-cols-2 divide-x divide-slate-800/80 rounded-2xl border border-slate-700/65 bg-[#060d1c]/92 backdrop-blur-md">
        <div className="flex items-center gap-3 px-4 py-3.5 sm:px-5">
          <CreditCoinIcon className="h-5 w-5 shrink-0" />
          <div className="min-w-0">
            <div className="text-[11px] font-medium text-slate-400">Credits</div>
            <div className="mt-0.5 flex flex-wrap items-baseline gap-x-1.5 font-mono-num tabular-nums">
              <span className="text-base sm:text-lg font-bold text-amber-200">
                {preview.creditsBefore.toLocaleString()}
              </span>
              {preview.valid && preview.creditDelta !== 0 && (
                <span
                  className={`text-[11px] font-semibold ${
                    preview.creditDelta > 0 ? 'text-emerald-300' : 'text-slate-400'
                  }`}
                >
                  → {preview.creditsAfter.toLocaleString()}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 px-4 py-3.5 sm:px-5">
          <CrystalGemIcon className="h-5 w-5 shrink-0" />
          <div className="min-w-0">
            <div className="text-[11px] font-medium text-slate-400">Void Gems</div>
            <div className="mt-0.5 flex flex-wrap items-baseline gap-x-1.5 font-mono-num tabular-nums">
              <span className="text-base sm:text-lg font-bold text-cyan-200">
                {preview.crystalsBefore.toLocaleString()}
              </span>
              {preview.valid && preview.crystalDelta !== 0 && (
                <span
                  className={`text-[11px] font-semibold ${
                    preview.crystalDelta > 0 ? 'text-emerald-300' : 'text-slate-400'
                  }`}
                >
                  → {preview.crystalsAfter.toLocaleString()}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Minimalist Swap Terminal */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (preview.valid) handleConfirm();
        }}
        className="rounded-2xl border border-slate-700/70 bg-[#060d1c]/95 p-5 shadow-2xl shadow-black/55 backdrop-blur-md sm:p-6"
      >
        {/* Clean Segmented Direction Control */}
        <div
          role="tablist"
          aria-label="Exchange Mode"
          className="grid grid-cols-2 gap-1 rounded-xl border border-slate-800/90 bg-[#040814] p-1"
        >
          <button
            type="button"
            role="tab"
            aria-selected={isBuyGems}
            onClick={() => handleSelectDirection('credits_to_gems')}
            className={`min-h-[38px] rounded-lg px-3 py-1.5 font-display text-xs font-bold tracking-wide transition-[background-color,color] duration-150 whitespace-nowrap focus-visible:outline-2 focus-visible:outline-cyan-400 ${
              isBuyGems
                ? 'bg-cyan-400/16 text-cyan-200 border border-cyan-300/40'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            Credits to Gems
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={!isBuyGems}
            onClick={() => handleSelectDirection('gems_to_credits')}
            className={`min-h-[38px] rounded-lg px-3 py-1.5 font-display text-xs font-bold tracking-wide transition-[background-color,color] duration-150 whitespace-nowrap focus-visible:outline-2 focus-visible:outline-amber-400 ${
              !isBuyGems
                ? 'bg-amber-400/16 text-amber-200 border border-amber-300/40'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            Gems to Credits
          </button>
        </div>

        {/* Send -> Swap Rate Divider -> Receive */}
        <div className="mt-5 flex flex-col">
          {/* Top Zone: Send / Pay */}
          <div className="rounded-xl border border-slate-800/90 bg-[#040916]/90 p-4">
            <div className="mb-2.5 flex items-center justify-between text-[11px]">
              <span className="font-medium text-slate-400">You Pay</span>
              {isBuyGems ? (
                <button
                  type="button"
                  onClick={handleSetMax}
                  disabled={maxAffordable <= 0}
                  className="font-mono-num tabular-nums text-slate-400 transition-colors hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  Max: {maxAffordable.toLocaleString()} {maxAffordable === 1 ? 'Gem' : 'Gems'}
                </button>
              ) : (
                <span className="font-mono-num tabular-nums text-slate-400">
                  Available: {progress.crystals.toLocaleString()}
                </span>
              )}
            </div>
            {isBuyGems ? creditsSummaryControl : gemStepperControl}
          </div>

          {/* Center Swap Divider + Single Conversion Rate */}
          <div className="relative my-2.5 flex items-center justify-between px-1">
            <div className="h-px flex-1 bg-slate-800/85" />
            <button
              type="button"
              onClick={handleFlipDirection}
              aria-label="Flip exchange direction"
              title="Swap exchange direction"
              className="mx-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-700/80 bg-[#091224] text-slate-300 transition-[border-color,background-color,color,transform] duration-150 hover:border-cyan-300/55 hover:text-white active:scale-95 focus-visible:outline-2 focus-visible:outline-cyan-400"
            >
              <ArrowUpDown className="h-3.5 w-3.5" />
            </button>
            <div className="flex flex-1 items-center justify-end gap-2">
              <div className="h-px flex-1 bg-slate-800/85" />
              <span className="shrink-0 font-mono-num tabular-nums text-[11px] font-medium text-slate-400 whitespace-nowrap">
                {isBuyGems
                  ? `1 Gem = ${CURRENCY_EXCHANGE_CONFIG.creditsPerGemBuy.toLocaleString()} CR`
                  : `1 Gem = ${CURRENCY_EXCHANGE_CONFIG.creditsPerGemSell.toLocaleString()} CR`}
              </span>
            </div>
          </div>

          {/* Bottom Zone: Receive */}
          <div className="rounded-xl border border-slate-800/90 bg-[#040916]/90 p-4">
            <div className="mb-2.5 flex items-center justify-between text-[11px]">
              <span className="font-medium text-slate-400">You Receive</span>
              <span className="font-mono-num tabular-nums text-slate-400">
                {preview.valid
                  ? isBuyGems
                    ? `New Balance: ${preview.crystalsAfter.toLocaleString()} Gems`
                    : `New Balance: ${preview.creditsAfter.toLocaleString()} CR`
                  : 'Enter whole number'}
              </span>
            </div>
            {isBuyGems ? gemStepperControl : creditsSummaryControl}
          </div>
        </div>

        {/* Validation Alert */}
        {!preview.valid && preview.reason && (
          <div
            role="alert"
            className="mt-4 flex items-center gap-2.5 rounded-xl border border-rose-400/35 bg-[#1a0a12]/85 px-3.5 py-2.5 text-xs text-rose-200"
          >
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{preview.reason}</span>
          </div>
        )}

        {/* Primary Action */}
        <button
          type="submit"
          disabled={!preview.valid}
          className={`mt-5 flex min-h-[48px] w-full items-center justify-center rounded-xl px-5 py-2.5 font-display text-sm font-bold tracking-wider transition-[filter,transform,opacity] duration-150 active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-45 whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 ${
            isBuyGems
              ? 'bg-gradient-to-r from-sky-400 to-cyan-400 text-slate-950 hover:brightness-105 focus-visible:outline-cyan-300'
              : 'bg-gradient-to-r from-amber-400 to-orange-400 text-slate-950 hover:brightness-105 focus-visible:outline-amber-300'
          }`}
        >
          Confirm Exchange
        </button>
      </form>
    </div>
  );
};
