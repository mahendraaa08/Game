import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, ChevronRight, RefreshCw, ShieldCheck, UserCheck } from 'lucide-react';
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
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [retryNotice, setRetryNotice] = useState<string | null>(null);
  const confirmLockRef = useRef(false);

  useEffect(() => {
    if (!showConfirmDialog) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        SoundManager.playButtonClick();
        setShowConfirmDialog(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showConfirmDialog]);

  const handleOpenConfirm = () => {
    SoundManager.unlock();
    SoundManager.playButtonClick();
    setShowConfirmDialog(true);
  };

  const handleCancelConfirm = () => {
    SoundManager.playButtonClick();
    setShowConfirmDialog(false);
  };

  const handleConfirm = () => {
    if (confirmLockRef.current) return;
    confirmLockRef.current = true;
    SoundManager.unlock();
    SoundManager.playButtonClick();
    setShowConfirmDialog(false);
    onConfirmGuest();
  };

  const handleRetry = () => {
    SoundManager.unlock();
    SoundManager.playButtonClick();
    const recovered = onRetryLoad();
    if (!recovered) {
      setRetryNotice('Saved data is still unreadable. Continue with Guest Mode to start safely.');
    }
  };

  return (
    <section
      aria-label="Guest Login"
      className={`fixed inset-0 z-40 flex items-center justify-center overflow-y-auto bg-[#040711] p-4 sm:p-6 transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        exiting ? 'pointer-events-none scale-[0.985] opacity-0' : 'opacity-100 scale-100'
      }`}
    >
      {/* Preloaded Key Art Veiled Backdrop */}
      <img
        src={titleKeyArt}
        alt=""
        aria-hidden="true"
        referrerPolicy="no-referrer"
        className="fixed inset-0 h-full w-full object-cover opacity-25"
      />
      <div
        aria-hidden="true"
        className="fixed inset-0 bg-gradient-to-b from-[#040711]/90 via-[#040711]/80 to-[#040711]/96"
      />
      <div
        aria-hidden="true"
        className="fixed inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 45%, rgba(56, 189, 248, 0.08) 0%, rgba(4, 7, 17, 0.72) 55%, rgba(4, 7, 17, 0.96) 100%)',
        }}
      />

      {/* Centered Guest Login Card */}
      <div className="startup-card-enter relative z-10 w-full max-w-[432px] rounded-2xl border border-slate-700/65 bg-[#070f20]/94 p-7 sm:p-8 shadow-2xl shadow-black/75 backdrop-blur-md">
        {/* Game Identity Header */}
        <div className="border-b border-slate-800/85 pb-6">
          <GameBrandMark compact />
        </div>

        {/* Welcome Message */}
        <div className="mt-6 text-center">
          <p className="font-mono-num text-[11px] font-semibold tracking-[0.18em] text-cyan-300/90 uppercase">
            Earth Defense Command
          </p>
          <h1 className="mt-2 font-display text-xl sm:text-2xl font-bold tracking-wide text-white">
            Welcome, Commander
          </h1>
          <p className="mt-2.5 text-xs sm:text-[13px] leading-relaxed text-slate-300/90">
            Deploy into galactic defense immediately using Guest Mode. Your ships, weapons, upgrades, Credits, and Void Gems are saved automatically on this device.
          </p>
        </div>

        {/* Non-destructive Recovery Notice if prior data failed validation */}
        {storageStatus === 'corrupted' && (
          <div
            role="alert"
            className="mt-5 rounded-xl border border-amber-400/35 bg-amber-500/10 p-3.5 text-left"
          >
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
              <div className="min-w-0 flex-1 text-xs leading-relaxed text-amber-100/90">
                <p>
                  Existing local save data could not be loaded cleanly and has been left untouched. You can retry loading or start in Guest Mode (your previous raw data will be backed up safely).
                </p>
                {retryNotice && (
                  <p className="mt-1.5 font-medium text-amber-200">{retryNotice}</p>
                )}
                <button
                  type="button"
                  onClick={handleRetry}
                  className="mt-2.5 inline-flex min-h-[34px] items-center gap-1.5 rounded-lg border border-amber-300/40 bg-amber-400/15 px-3 py-1 text-[11.5px] font-semibold text-amber-100 transition-colors hover:bg-amber-400/25 active:scale-[0.98]"
                >
                  <RefreshCw className="h-3 w-3 shrink-0" />
                  <span>Retry Load</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Primary Action: Guest Mode */}
        <div className="mt-7">
          <button
            type="button"
            onClick={handleOpenConfirm}
            className="group flex min-h-[52px] w-full items-center justify-between rounded-xl border border-cyan-200/45 bg-gradient-to-r from-sky-400 to-cyan-400 px-5 py-3 text-left text-slate-950 shadow-lg shadow-slate-950/45 transition-[filter,transform] duration-150 hover:brightness-105 active:scale-[0.985] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
          >
            <span className="flex items-center gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-950/12">
                <UserCheck className="h-[18px] w-[18px]" />
              </span>
              <span className="font-display text-sm sm:text-base font-bold tracking-[0.08em] whitespace-nowrap">
                Guest Mode
              </span>
            </span>
            <ChevronRight className="h-5 w-5 shrink-0 text-slate-950/80 transition-transform duration-150 group-hover:translate-x-0.5" />
          </button>

          <p className="mt-3.5 text-center text-[11.5px] leading-relaxed text-slate-400">
            Instant access · Progress persists across reloads and future visits
          </p>
        </div>
      </div>

      {/* Guest Mode Confirmation Dialog */}
      {showConfirmDialog && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="guest-confirm-title"
          onClick={handleCancelConfirm}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#03060f]/82 p-4 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="panel-swap w-full max-w-md rounded-2xl border border-cyan-300/35 bg-[#081122]/98 p-6 shadow-2xl shadow-black/80"
          >
            <div className="flex items-start gap-3.5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-400/35 bg-cyan-400/12">
                <ShieldCheck className="h-5 w-5 text-cyan-300" />
              </span>
              <div>
                <h2
                  id="guest-confirm-title"
                  className="font-display text-lg font-bold tracking-wide text-white"
                >
                  Continue with Guest Mode?
                </h2>
                <p className="mt-2 text-xs sm:text-[13px] leading-relaxed text-slate-300">
                  You will start your campaign using <strong className="text-white">Guest Mode</strong>. A new Commander profile will be initialized and your progress will be saved automatically on this browser.
                </p>
                <p className="mt-2 text-xs leading-relaxed text-slate-400">
                  Level, Credits, Void Gems, ships, weapons, upgrades, and settings remain stored when you return or refresh the page.
                </p>
              </div>
            </div>

            <ConfirmButtonPair
              cancelLabel="Cancel"
              confirmLabel="Confirm"
              onCancel={handleCancelConfirm}
              onConfirm={handleConfirm}
              className="mt-6 grid grid-cols-2 gap-3"
            />
          </div>
        </div>
      )}
    </section>
  );
};
