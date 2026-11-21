import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, ArrowLeftRight, ArrowRight, Minus, Plus } from 'lucide-react';
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

  const handleSelectDirection = (next: ExchangeDirection) => {
    if (next === direction) return;
    SoundManager.unlock();
    SoundManager.playButtonClick();
    setDirection(next);
    setRawInput('1');
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

  const spendLabel = isBuyGems ? 'Credits' : 'Void Gems';
  const receiveLabel = isBuyGems ? 'Void Gems' : 'Credits';
  const spendValue = isBuyGems
    ? `${Math.abs(preview.creditDelta).toLocaleString()} CR`
    : `${preview.gemUnits.toLocaleString()} ${preview.gemUnits === 1 ? 'Gem' : 'Gems'}`;
  const receiveValue = isBuyGems
    ? `${preview.gemUnits.toLocaleString()} ${preview.gemUnits === 1 ? 'Gem' : 'Gems'}`
    : `${Math.abs(preview.creditDelta).toLocaleString()} CR`;

  return (
    <div className="mx-auto flex w-full max-w-[560px] flex-col gap-4">
      {/* 1. Spacious Dual Wallet Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-700/65 bg-[#071022]/90 px-4 py-3.5 sm:px-5 sm:py-4 backdrop-blur-md">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-400/20 bg-amber-400/10">
            <CreditCoinIcon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <div className="text-[11px] font-medium tracking-wide text-slate-400">Credits</div>
            <div className="mt-0.5 flex flex-wrap items-baseline gap-x-1.5 font-mono-num">
              <span className="text-base sm:text-lg font-bold tracking-tight text-amber-200">
                {preview.creditsBefore.toLocaleString()}
              </span>
              {preview.valid && preview.creditDelta !== 0 && (
                <span
                  className={`text-[11px] font-semibold ${
                    preview.creditDelta > 0 ? 'text-emerald-300' : 'text-rose-300'
                  }`}
                >
                  → {preview.creditsAfter.toLocaleString()}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-slate-700/65 bg-[#071022]/90 px-4 py-3.5 sm:px-5 sm:py-4 backdrop-blur-md">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10">
            <CrystalGemIcon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <div className="text-[11px] font-medium tracking-wide text-slate-400">Void Gems</div>
            <div className="mt-0.5 flex flex-wrap items-baseline gap-x-1.5 font-mono-num">
              <span className="text-base sm:text-lg font-bold tracking-tight text-cyan-200">
                {preview.crystalsBefore.toLocaleString()}
              </span>
              {preview.valid && preview.crystalDelta !== 0 && (
                <span
                  className={`text-[11px] font-semibold ${
                    preview.crystalDelta > 0 ? 'text-emerald-300' : 'text-rose-300'
                  }`}
                >
                  → {preview.crystalsAfter.toLocaleString()}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Terminal Card */}
      <section className="overflow-hidden rounded-2xl border border-slate-700/65 bg-[#060d1c]/95 p-5 shadow-2xl shadow-black/50 backdrop-blur-md sm:p-6">
        {/* Spacious Mode Selector Cards (Zero Cramped Borders) */}
        <div role="tablist" aria-label="Exchange Mode" className="grid grid-cols-2 gap-3">
          <button
            type="button"
            role="tab"
            aria-selected={isBuyGems}
            onClick={() => handleSelectDirection('credits_to_gems')}
            className={`flex flex-col items-center justify-center gap-2 rounded-xl border px-4 py-3.5 text-center transition-[border-color,background-color,color,transform] duration-150 active:scale-[0.985] focus-visible:outline-2 focus-visible:outline-cyan-400 sm:px-5 sm:py-4 ${
              isBuyGems
                ? 'border-cyan-300/65 bg-gradient-to-b from-cyan-400/16 to-cyan-500/8 text-white shadow-[0_0_20px_rgba(34,211,238,0.12)]'
                : 'border-slate-800/90 bg-[#040915]/85 text-slate-400 hover:border-slate-700 hover:bg-[#091328] hover:text-slate-200'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              <CreditCoinIcon className="h-4 w-4 shrink-0" />
              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <CrystalGemIcon className="h-4 w-4 shrink-0" />
            </span>
            <span className="font-display text-xs sm:text-[13px] font-bold tracking-[0.05em]">
              Credit to Gems
            </span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={!isBuyGems}
            onClick={() => handleSelectDirection('gems_to_credits')}
            className={`flex flex-col items-center justify-center gap-2 rounded-xl border px-4 py-3.5 text-center transition-[border-color,background-color,color,transform] duration-150 active:scale-[0.985] focus-visible:outline-2 focus-visible:outline-amber-400 sm:px-5 sm:py-4 ${
              !isBuyGems
                ? 'border-amber-300/65 bg-gradient-to-b from-amber-400/16 to-amber-500/8 text-white shadow-[0_0_20px_rgba(251,191,36,0.12)]'
                : 'border-slate-800/90 bg-[#040915]/85 text-slate-400 hover:border-slate-700 hover:bg-[#091328] hover:text-slate-200'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              <CrystalGemIcon className="h-4 w-4 shrink-0" />
              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <CreditCoinIcon className="h-4 w-4 shrink-0" />
            </span>
            <span className="font-display text-xs sm:text-[13px] font-bold tracking-[0.05em]">
              Gems to Credit
            </span>
          </button>
        </div>

        {/* Clean Conversion Rate Strip */}
        <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-800/80 bg-[#040916]/85 px-4 py-2.5 text-xs">
          <span className="text-slate-400">Exchange Rate</span>
          <span className="font-mono-num font-semibold text-slate-100 whitespace-nowrap">
            {isBuyGems
              ? `${CURRENCY_EXCHANGE_CONFIG.creditsPerGemBuy.toLocaleString()} CR = 1 Gem`
              : `1 Gem = ${CURRENCY_EXCHANGE_CONFIG.creditsPerGemSell.toLocaleString()} CR`}
          </span>
        </div>

        {/* Quantity Selector */}
        <div key={direction} className="panel-swap mt-5 flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs">
            <label htmlFor="exchange-gem-amount" className="font-medium text-slate-300">
              {isBuyGems ? 'Gems to Acquire' : 'Gems to Convert'}
            </label>
            <button
              type="button"
              onClick={handleSetMax}
              disabled={maxAffordable <= 0}
              className="font-mono-num text-xs text-slate-400 transition-colors hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-45"
            >
              Max Available: <strong className="text-slate-200">{maxAffordable.toLocaleString()}</strong>
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              aria-label="Decrease gem quantity"
              onClick={() => handleStep(-1)}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-slate-700/75 bg-[#0b152a] text-slate-200 transition-[border-color,background-color,transform] duration-150 hover:border-cyan-300/55 hover:bg-slate-800 active:scale-[0.95] focus-visible:outline-2 focus-visible:outline-cyan-400"
            >
              <Minus className="h-4 w-4" />
            </button>

            <div className="relative flex-1">
              <div className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center">
                <CrystalGemIcon className="h-4 w-4" />
              </div>
              <input
                id="exchange-gem-amount"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={rawInput}
                onChange={handleInputChange}
                aria-label="Gem quantity"
                placeholder="1"
                className={`h-12 w-full rounded-xl border border-slate-700/80 bg-[#040814] pl-10 pr-16 font-mono-num text-base font-bold text-white outline-none transition-colors ${
                  isBuyGems ? 'focus:border-cyan-400/75' : 'focus:border-amber-400/75'
                }`}
              />
              <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center font-mono-num text-xs font-medium text-slate-400">
                {parsedUnits === 1 ? 'Gem' : 'Gems'}
              </span>
            </div>

            <button
              type="button"
              aria-label="Increase gem quantity"
              onClick={() => handleStep(1)}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-slate-700/75 bg-[#0b152a] text-slate-200 transition-[border-color,background-color,transform] duration-150 hover:border-cyan-300/55 hover:bg-slate-800 active:scale-[0.95] focus-visible:outline-2 focus-visible:outline-cyan-400"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {CURRENCY_EXCHANGE_CONFIG.presets.map((preset) => {
              const selected = parsedUnits === preset;
              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleSetUnits(preset)}
                  className={`min-h-[38px] rounded-xl border px-2 py-1.5 font-mono-num text-xs font-semibold transition-[border-color,background-color,color,transform] duration-150 active:scale-[0.96] whitespace-nowrap ${
                    selected
                      ? isBuyGems
                        ? 'border-cyan-400/65 bg-cyan-400/16 text-cyan-200'
                        : 'border-amber-400/65 bg-amber-400/16 text-amber-200'
                      : 'border-slate-800/90 bg-[#081122] text-slate-300 hover:border-slate-700 hover:text-white'
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
              className="min-h-[38px] rounded-xl border border-slate-700/75 bg-[#0b152a] px-2 py-1.5 font-mono-num text-xs font-semibold text-slate-200 transition-[border-color,background-color,transform] duration-150 hover:border-cyan-300/55 hover:text-white active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-40 whitespace-nowrap"
            >
              Max
            </button>
          </div>
        </div>

        {/* Summary & Confirm */}
        <div className="mt-5 flex flex-col gap-4 border-t border-slate-800/80 pt-5">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-800/80 bg-[#040916]/85 px-4 py-3">
            <div className="min-w-0">
              <div className="text-[11px] text-slate-400">You Spend ({spendLabel})</div>
              <div className="mt-0.5 flex items-center gap-1.5 font-mono-num text-sm sm:text-[15px] font-bold text-rose-300 whitespace-nowrap">
                {isBuyGems ? (
                  <CreditCoinIcon className="h-4 w-4 shrink-0" />
                ) : (
                  <CrystalGemIcon className="h-4 w-4 shrink-0" />
                )}
                <span>-{parsedUnits > 0 ? spendValue : isBuyGems ? '0 CR' : '0 Gems'}</span>
              </div>
            </div>

            <ArrowRight className="h-4 w-4 shrink-0 text-slate-500" />

            <div className="min-w-0 text-right">
              <div className="text-[11px] text-slate-400">You Receive ({receiveLabel})</div>
              <div className="mt-0.5 flex items-center justify-end gap-1.5 font-mono-num text-sm sm:text-[15px] font-bold text-emerald-300 whitespace-nowrap">
                <span>+{parsedUnits > 0 ? receiveValue : isBuyGems ? '0 Gems' : '0 CR'}</span>
                {isBuyGems ? (
                  <CrystalGemIcon className="h-4 w-4 shrink-0" />
                ) : (
                  <CreditCoinIcon className="h-4 w-4 shrink-0" />
                )}
              </div>
            </div>
          </div>

          {!preview.valid && preview.reason && (
            <div
              role="alert"
              className="flex items-center gap-2.5 rounded-xl border border-rose-400/40 bg-[#1a0a12]/85 px-4 py-2.5 text-xs text-rose-200"
            >
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{preview.reason}</span>
            </div>
          )}

          <button
            type="button"
            onClick={handleConfirm}
            disabled={!preview.valid}
            className={`flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border px-5 py-3 font-display text-sm font-bold tracking-[0.06em] transition-[filter,transform,opacity] duration-150 active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-45 whitespace-nowrap ${
              isBuyGems
                ? 'border-cyan-200/45 bg-gradient-to-r from-sky-400 to-cyan-400 text-slate-950 hover:brightness-105'
                : 'border-amber-200/45 bg-gradient-to-r from-amber-400 to-orange-400 text-slate-950 hover:brightness-105'
            }`}
          >
            <ArrowLeftRight className="h-4 w-4 shrink-0" />
            <span>
              {preview.valid
                ? isBuyGems
                  ? `Exchange ${Math.abs(preview.creditDelta).toLocaleString()} CR for ${preview.gemUnits} ${preview.gemUnits === 1 ? 'Gem' : 'Gems'}`
                  : `Exchange ${preview.gemUnits} ${preview.gemUnits === 1 ? 'Gem' : 'Gems'} for ${Math.abs(preview.creditDelta).toLocaleString()} CR`
                : isBuyGems
                ? 'Confirm Credit to Gems'
                : 'Confirm Gems to Credit'}
            </span>
          </button>
        </div>
      </section>
    </div>
  );
};
