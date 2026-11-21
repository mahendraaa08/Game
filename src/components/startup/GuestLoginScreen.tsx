import React, { useRef, useState } from 'react';
import { AlertTriangle, ChevronRight, RefreshCw, UserCheck } from 'lucide-react';
import titleKeyArt from '../../assets/images/title_key_art_1794922504898.jpg';
import { SoundManager } from '../../game/audio/SoundManager';
import { StorageHealthStatus } from '../../game/utils/StorageManager';
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
  const [retryNotice, setRetryNotice] = useState<string | null>(null);
  const submitLockRef = useRef(false);

  const handleGuestEnter = () => {
    if (submitLockRef.current || exiting) return;
    submitLockRef.current = true;
    setEntering(true);
    SoundManager.unlock();
    SoundManager.playButtonClick();
    onConfirmGuest();
  };

  const handleRetry = () => {
    if (submitLockRef.current || exiting) return;
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
      {/* Subtly Veiled Space Key Art Backdrop */}
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

      {/* Minimalist Exclusive Guest Login Surface */}
      <div className="startup-card-enter relative z-10 flex w-full max-w-[408px] flex-col items-center">
        <div className="w-full rounded-2xl border border-slate-700/55 bg-[#070f20]/90 px-6 py-8 sm:px-8 sm:py-9 shadow-[0_24px_64px_rgba(2,6,18,0.85)] backdrop-blur-md">
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
              Enter Earth Defense Command in Guest Mode. Your ships, weapons, upgrades, and currencies are stored safely on this device.
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
                    className="mt-2.5 inline-flex min-h-[34px] items-center gap-1.5 rounded-lg border border-amber-300/40 bg-amber-400/15 px-3 py-1 text-[11.5px] font-semibold text-amber-100 transition-colors hover:bg-amber-400/25 active:scale-[0.98] disabled:opacity-50"
                  >
                    <RefreshCw className="h-3 w-3 shrink-0" />
                    <span>Retry Load</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Streamlined Single-Step Guest Mode CTA */}
          <div className="mt-7">
            <button
              type="button"
              disabled={entering || exiting}
              onClick={handleGuestEnter}
              className="group flex min-h-[52px] w-full items-center justify-between rounded-xl border border-cyan-200/45 bg-gradient-to-r from-sky-400 to-cyan-400 px-5 py-3 text-left text-slate-950 shadow-lg shadow-slate-950/45 transition-[filter,transform,opacity] duration-150 hover:brightness-105 active:scale-[0.985] disabled:cursor-wait disabled:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
            >
              <span className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-950/12">
                  <UserCheck className="h-[18px] w-[18px]" />
                </span>
                <span className="font-display text-sm sm:text-base font-bold tracking-[0.09em] whitespace-nowrap">
                  {entering ? 'ENTERING COMMAND...' : 'GUEST MODE'}
                </span>
              </span>
              <ChevronRight className="h-5 w-5 shrink-0 text-slate-950/80 transition-transform duration-150 group-hover:translate-x-0.5" />
            </button>

            <p className="mt-3 text-center text-[11px] tracking-wide text-slate-400">
              Auto-saves locally · Preserved across reloads
            </p>
          </div>
        </div>

        {/* Creator Credit Line — Subtle, Balanced, Integrated Identity */}
        <footer className="mt-6 flex items-center justify-center gap-3 opacity-85">
          <span aria-hidden="true" className="h-px w-6 bg-gradient-to-r from-transparent to-cyan-400/40" />
          <p className="font-mono-num text-[10.5px] sm:text-[11px] font-medium tracking-[0.26em] text-slate-300/80 uppercase">
            GAME CREATED BY MAHENDRA
          </p>
          <span aria-hidden="true" className="h-px w-6 bg-gradient-to-l from-transparent to-cyan-400/40" />
        </footer>
      </div>
    </section>
  );
};
