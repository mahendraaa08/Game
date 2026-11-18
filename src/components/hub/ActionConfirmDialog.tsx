import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, ArrowRight, X } from 'lucide-react';
import { SoundManager } from '../../game/audio/SoundManager';
import { ActionResult } from '../../game/systems/ProgressionManager';
import { ConfirmButtonPair } from '../ui/ConfirmButtonPair';
import { CreditCoinIcon, CrystalGemIcon } from '../ui/CurrencyBadges';

export interface ConfirmStatDelta {
  label: string;
  before: string;
  after?: string;
}

export interface PendingHangarAction {
  id: string;
  category: 'purchase' | 'unlock' | 'upgrade' | 'equip';
  title: string;
  itemName: string;
  itemSubtitle?: string;
  description?: string;
  note?: string;
  icon?: React.ReactNode;
  statDeltas?: ConfirmStatDelta[];
  creditsCost?: number;
  crystalsCost?: number;
  execute: () => ActionResult;
}

interface ActionConfirmDialogProps {
  action: PendingHangarAction | null;
  currentCredits: number;
  currentCrystals: number;
  onCancel: () => void;
  onResult: (res: ActionResult) => void;
}

export const ActionConfirmDialog: React.FC<ActionConfirmDialogProps> = ({
  action,
  currentCredits,
  currentCrystals,
  onCancel,
  onResult,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const lastExecTsRef = useRef<number>(0);

  useEffect(() => {
    setIsProcessing(false);
    setErrorMessage(null);
  }, [action?.id]);

  useEffect(() => {
    if (!action) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isProcessing) {
        e.preventDefault();
        SoundManager.playButtonClick();
        onCancel();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [action, isProcessing, onCancel]);

  if (!action) return null;

  const creditsCost = Math.max(0, action.creditsCost ?? 0);
  const crystalsCost = Math.max(0, action.crystalsCost ?? 0);
  const hasCost = creditsCost > 0 || crystalsCost > 0;
  const remainingCredits = currentCredits - creditsCost;
  const remainingCrystals = currentCrystals - crystalsCost;
  const lackingCredits = remainingCredits < 0;
  const lackingCrystals = remainingCrystals < 0;
  const insufficientFunds = lackingCredits || lackingCrystals;

  const handleConfirm = () => {
    if (isProcessing || insufficientFunds) return;
    const now = Date.now();
    if (now - lastExecTsRef.current < 280) return;
    lastExecTsRef.current = now;

    setIsProcessing(true);
    setErrorMessage(null);
    SoundManager.unlock();

    try {
      const res = action.execute();
      if (res.ok) {
        if (hasCost) SoundManager.playPurchase();
        else SoundManager.playButtonClick();
        onResult(res);
      } else {
        SoundManager.playButtonClick();
        setErrorMessage(res.message);
        setIsProcessing(false);
        onResult(res);
      }
    } catch {
      setErrorMessage('Unable to complete action right now.');
      setIsProcessing(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="hangar-confirm-title"
      className="fixed inset-0 z-[60] flex items-center justify-center bg-[#03060f]/82 p-4 backdrop-blur-sm"
      onClick={() => {
        if (isProcessing) return;
        SoundManager.playButtonClick();
        onCancel();
      }}
    >
      <div
        className="pause-panel-enter w-full max-w-md rounded-2xl border border-slate-700/80 bg-[#081122]/98 p-5 sm:p-6 shadow-2xl shadow-black/70"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-800/80 pb-4">
          <div className="flex min-w-0 items-center gap-3.5">
            {action.icon && (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-slate-700/75 bg-[#050b18]">
                {action.icon}
              </div>
            )}
            <div className="min-w-0">
              <div className="font-mono-num text-[11px] font-semibold uppercase tracking-[0.12em] text-cyan-300">
                {action.title}
              </div>
              <h3
                id="hangar-confirm-title"
                className="mt-0.5 truncate font-display text-lg font-bold tracking-wide text-white"
              >
                {action.itemName}
              </h3>
              {action.itemSubtitle && (
                <div className="mt-0.5 truncate font-mono-num text-xs text-slate-400">
                  {action.itemSubtitle}
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            disabled={isProcessing}
            aria-label="Cancel action"
            onClick={() => {
              SoundManager.playButtonClick();
              onCancel();
            }}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-700/80 bg-[#060c1a] text-slate-400 transition-colors hover:border-slate-500 hover:text-white disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Description / Note */}
        {action.description && (
          <p className="mt-4 text-xs sm:text-[13px] leading-relaxed text-slate-300">
            {action.description}
          </p>
        )}

        {action.note && (
          <div className="mt-3 rounded-xl border border-amber-400/30 bg-amber-500/8 px-3.5 py-2.5 text-xs leading-relaxed text-amber-200">
            {action.note}
          </div>
        )}

        {/* Stat Before -> After Preview */}
        {action.statDeltas && action.statDeltas.length > 0 && (
          <div className="mt-4 flex flex-col gap-2 rounded-xl border border-slate-800/85 bg-[#050b18]/90 p-3.5">
            {action.statDeltas.map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between gap-3 text-xs"
              >
                <span className="text-slate-400">{row.label}</span>
                <div className="flex items-center gap-1.5 font-mono-num font-semibold">
                  <span className="text-slate-200">{row.before}</span>
                  {row.after && row.after !== row.before && (
                    <>
                      <ArrowRight className="h-3.5 w-3.5 text-slate-500" />
                      <span className="text-emerald-300">{row.after}</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Cost & Balance Projection */}
        {hasCost && (
          <div className="mt-4 flex flex-col gap-2.5 rounded-xl border border-slate-800/85 bg-[#050b18]/90 p-3.5 font-mono-num text-xs">
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-400">Required Cost</span>
              <div className="flex items-center gap-3 font-bold">
                {creditsCost > 0 && (
                  <span className="flex items-center gap-1.5 text-amber-300">
                    <CreditCoinIcon className="h-3.5 w-3.5" />
                    {creditsCost.toLocaleString()} CR
                  </span>
                )}
                {crystalsCost > 0 && (
                  <span className="flex items-center gap-1.5 text-cyan-300">
                    <CrystalGemIcon className="h-3.5 w-3.5" />
                    {crystalsCost.toLocaleString()} Gems
                  </span>
                )}
              </div>
            </div>

            <div className="h-px bg-slate-800/80" />

            {creditsCost > 0 && (
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-400">Credits Balance</span>
                <div className="flex items-center gap-1.5 font-semibold">
                  <span className="text-slate-300">{currentCredits.toLocaleString()}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-500" />
                  <span className={lackingCredits ? 'text-rose-400' : 'text-emerald-300'}>
                    {lackingCredits ? 'Insufficient' : remainingCredits.toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            {crystalsCost > 0 && (
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-400">Crystals Balance</span>
                <div className="flex items-center gap-1.5 font-semibold">
                  <span className="text-slate-300">{currentCrystals.toLocaleString()}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-500" />
                  <span className={lackingCrystals ? 'text-rose-400' : 'text-emerald-300'}>
                    {lackingCrystals ? 'Insufficient' : remainingCrystals.toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Validation / Insufficient Balance Message */}
        {(insufficientFunds || errorMessage) && (
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-rose-400/40 bg-rose-500/10 px-3.5 py-2.5 text-xs font-medium text-rose-200">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>
              {errorMessage ??
                (lackingCredits
                  ? `Need ${(creditsCost - currentCredits).toLocaleString()} more Credits.`
                  : `Need ${(crystalsCost - currentCrystals).toLocaleString()} more Crystals.`)}
            </span>
          </div>
        )}

        {/* Actions */}
        <ConfirmButtonPair
          cancelDisabled={isProcessing}
          confirmDisabled={isProcessing || insufficientFunds}
          onCancel={() => {
            SoundManager.playButtonClick();
            onCancel();
          }}
          onConfirm={handleConfirm}
        />
      </div>
    </div>
  );
};
