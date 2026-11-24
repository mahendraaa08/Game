import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, ChevronRight, RefreshCw, ShieldCheck, UserCheck, X } from 'lucide-react';
import titleKeyArt from '../../assets/images/title_key_art_1794922504898.jpg';
import { SoundManager } from '../../game/audio/SoundManager';
import { StorageHealthStatus } from '../../game/utils/StorageManager';
import { ConfirmButtonPair } from '../ui/ConfirmButtonPair';
import { GameBrandMark } from './GameBrandMark';

interface GuestLoginScreenProps {
  storageStatus: StorageHealthStatus;
  exiting: boolean;
  onConfirmGuest: () => void;
  onRetryLoad: () => boolean;
}

export const GuestLoginScreen: React.FC<GuestLoginScreenProps> = ({
  storageStatus,
  exiting,
  onConfirmGuest,
  onRetryLoad,
}) => {
  const [entering, setEntering] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [retryNotice, setRetryNotice] = useState<string | null>(null);
  const submitLockRef = useRef(false);

  useEffect(() => {
    if (exiting) {
      setShowConfirmDialog(false);
    }
  }, [exiting]);

  useEffect(() => {
    if (!showConfirmDialog) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !entering && !exiting) {
        e.preventDefault();
        SoundManager.playButtonClick();
        setShowConfirmDialog(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showConfirmDialog, entering, exiting]);

  const handleOpenConfirm = () => {
    if (submitLockRef.current || entering || exiting) return;
    SoundManager.unlock();
    SoundManager.playButtonClick();
    setShowConfirmDialog(true);
  };

  const handleCancelConfirm = () => {
    if (entering || exiting) return;
    SoundManager.playButtonClick();
    setShowConfirmDialog(false);
  };

  const handleGuestEnter = () => {
    if (submitLockRef.current || exiting) return;
    submitLockRef.current = true;
    setEntering(true);
    setShowConfirmDialog(false);
    SoundManager.unlock();
    SoundManager.playButtonClick();
    onConfirmGuest();
  };

  const handleRetry = () => {
    if (submitLockRef.current || entering || exiting) return;
    SoundManager.unlock();
    SoundManager.playButtonClick();
    const recovered = onRetryLoad();
    if (!recovered) {
      setRetryNotice('Saved data could not be recovered. Continue with Guest Mode to start safely.');
    }
  };

  return (
    <section
      aria-label="Guest Login"
      className={`fixed inset-0 z-40 flex flex-col items-center justify-center overflow-y-auto bg-[#040711] p-5 sm:p-8 transition-[opacity,transform] duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        exiting ? 'pointer-events-none scale-[0.985] opacity-0' : 'opacity-100 scale-100'
      }`}
    >
      {/* Space Key Art Backdrop */}
      <img
        src={titleKeyArt}
        alt=""
        aria-hidden="true"
        referrerPolicy="no-referrer"
        className="fixed inset-0 h-full w-full object-cover opacity-22"
      />
      <div
        aria-hidden="true"
        className="fixed inset-0 bg-gradient-to-b from-[#040711]/92 via-[#040711]/78 to-[#040711]/96"
      />
      <div
        aria-hidden="true"
        className="fixed inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 44%, rgba(56, 189, 248, 0.08) 0%, rgba(4, 7, 17, 0.72) 55%, rgba(4, 7, 17, 0.96) 100%)',
        }}
      />

      {/* Exclusive Guest Access Surface */}
      <div className="startup-card-enter relative z-10 flex w-full max-w-[416px] flex-col items-center">
        <div className="relative w-full overflow-hidden rounded-2xl border border-slate-700/60 bg-[#070f20]/92 px-6 py-8 sm:px-8 sm:py-9 shadow-[0_28px_72px_rgba(2,6,18,0.88)] backdrop-blur-md">
          {/* Top Accent Line */}
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/55 to-transparent"
          />

          {/* Brand Identity */}
          <div className="border-b border-slate-800/80 pb-6">
            <GameBrandMark compact />
          </div>

          {/* Focused Welcome Copy */}
          <div className="mt-6 text-center">
            <h1 className="font-display text-xl sm:text-2xl font-bold tracking-[0.06em] text-white">
              Welcome, Commander
            </h1>
            <p className="mt-2.5 text-xs sm:text-[13px] leading-relaxed text-slate-300/88">
              Enter Earth Defense Command with Guest Access. Ships, arsenal upgrades, and currencies save automatically to this device.
            </p>
          </div>

          {/* Non-destructive Recovery Notice if Prior Data Failed Validation */}
          {storageStatus === 'corrupted' && (
            <div
              role="alert"
              className="mt-5 rounded-xl border border-amber-400/35 bg-amber-500/10 p-3.5 text-left"
            >
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
                <div className="min-w-0 flex-1 text-xs leading-relaxed text-amber-100/90">
                  <p>
                    Existing save data could not be verified and remains untouched. Retry loading or proceed with Guest Mode (a backup will be preserved).
                  </p>
                  {retryNotice && (
                    <p className="mt-1.5 font-medium text-amber-200">{retryNotice}</p>
                  )}
                  <button
                    type="button"
                    disabled={entering}
                    onClick={handleRetry}
                    className="mt-2.5 inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-amber-300/40 bg-amber-400/15 px-3 py-1 text-[11.5px] font-semibold text-amber-100 transition-colors hover:bg-amber-400/25 active:scale-[0.98] disabled:opacity-50"
                  >
                    <RefreshCw className="h-3 w-3 shrink-0" />
                    <span>Retry Load</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Primary Guest CTA (Opens Confirmation Dialog) */}
          <div className="mt-7">
            <button
              type="button"
              disabled={entering || exiting}
              onClick={handleOpenConfirm}
              className="group flex min-h-[52px] w-full items-center justify-between rounded-xl border border-cyan-200/50 bg-gradient-to-r from-sky-400 to-cyan-300 px-5 py-3 text-left text-slate-950 shadow-lg shadow-slate-950/50 transition-[filter,transform,opacity] duration-150 hover:brightness-105 active:scale-[0.985] disabled:cursor-wait disabled:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
            >
              <span className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-950/12">
                  <UserCheck className="h-[18px] w-[18px]" />
                </span>
                <span className="font-display text-sm sm:text-base font-bold tracking-[0.09em] whitespace-nowrap">
                  {entering ? 'ENTERING COMMAND...' : 'CONTINUE AS GUEST'}
                </span>
              </span>
              <ChevronRight className="h-5 w-5 shrink-0 text-slate-950/80 transition-transform duration-150 group-hover:translate-x-0.5" />
            </button>

            <p className="mt-3.5 text-center text-[11px] tracking-wide text-slate-400">
              Local Device Save · Preserved Across Reloads
            </p>
          </div>
        </div>

        {/* Creator Credit Line */}
        <footer className="mt-6 flex items-center justify-center gap-3 opacity-85">
          <span aria-hidden="true" className="h-px w-6 bg-gradient-to-r from-transparent to-cyan-400/40" />
          <p className="font-mono-num text-[10.5px] sm:text-[11px] font-medium tracking-[0.26em] text-slate-300/80 uppercase">
            GAME CREATED BY MAHENDRA
          </p>
          <span aria-hidden="true" className="h-px w-6 bg-gradient-to-l from-transparent to-cyan-400/40" />
        </footer>
      </div>

      {/* Guest Mode Confirmation Dialog */}
      {showConfirmDialog && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="guest-confirm-title"
          aria-describedby="guest-confirm-desc"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#03060f]/78 p-4 backdrop-blur-sm"
          onClick={handleCancelConfirm}
        >
          <div
            className="panel-swap relative w-full max-w-sm overflow-hidden rounded-2xl border border-slate-700/80 bg-[#060d1c]/98 p-5 sm:p-6 shadow-2xl shadow-black/80"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/50 to-transparent"
            />

            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-300/35 bg-cyan-400/12 text-cyan-300">
                  <ShieldCheck className="h-5 w-5" />
                </span>
                <div>
                  <h2
                    id="guest-confirm-title"
                    className="font-display text-base font-bold tracking-wide text-white"
                  >
                    Confirm Guest Login
                  </h2>
                  <p className="mt-0.5 text-[11px] text-slate-400">
                    Local Commander Profile
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={entering}
                onClick={handleCancelConfirm}
                aria-label="Close Guest Confirmation"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/[0.07] hover:text-white disabled:opacity-45"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p
              id="guest-confirm-desc"
              className="mt-4 text-xs sm:text-[13px] leading-relaxed text-slate-300/90"
            >
              {storageStatus === 'corrupted'
                ? 'Proceeding as Guest will initialize a fresh local Commander profile while preserving a backup of the unreadable save data.'
                : 'Continue into Earth Defense Command as a Guest? Your campaign progress, hangar fleet, and currencies will be saved locally on this device.'}
            </p>

            <ConfirmButtonPair
              className="mt-5 grid grid-cols-2 gap-3"
              cancelLabel="Cancel"
              confirmLabel={entering ? 'Entering...' : 'Confirm'}
              cancelDisabled={entering}
              confirmDisabled={entering}
              onCancel={handleCancelConfirm}
              onConfirm={handleGuestEnter}
            />
          </div>
        </div>
      )}
    </section>
  );
};
