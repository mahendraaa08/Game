import React, { useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, KeyRound, Trash2, XCircle } from 'lucide-react';
import { SoundManager } from '../../game/audio/SoundManager';
import {
  DEV_TOOLS_CONFIG,
  redeemDeveloperCode,
  resetPlayerProgressFromDevTools,
} from '../../game/dev/DevToolsModule';
import { ActionResult } from '../../game/systems/ProgressionManager';
import { ConfirmButtonPair } from '../ui/ConfirmButtonPair';

interface DevToolsSettingsSectionProps {
  onFeedback: (res: ActionResult) => void;
}

export const DevToolsSettingsSection: React.FC<DevToolsSettingsSectionProps> = ({
  onFeedback,
}) => {
  const [codeInput, setCodeInput] = useState('');
  const [inlineNotice, setInlineNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const [showResetProgressModal, setShowResetProgressModal] = useState(false);
  const submitLockRef = useRef(false);

  if (!DEV_TOOLS_CONFIG.enabled) {
    return null;
  }

  const handleRedeem = (e: React.FormEvent) => {
    e.preventDefault();
    if (submitLockRef.current) return;
    submitLockRef.current = true;

    try {
      SoundManager.unlock();
      const res = redeemDeveloperCode(codeInput);
      if (res.ok) {
        SoundManager.playPowerUp();
        setCodeInput('');
      } else {
        SoundManager.playButtonClick();
      }
      setInlineNotice({ ok: res.ok, text: res.message });
      onFeedback(res);
    } finally {
      window.setTimeout(() => {
        submitLockRef.current = false;
      }, 120);
    }
  };

  const handleConfirmResetProgress = () => {
    SoundManager.unlock();
    SoundManager.playButtonClick();
    const res = resetPlayerProgressFromDevTools();
    setShowResetProgressModal(false);
    setInlineNotice(null);
    onFeedback(res);
  };

  return (
    <>
      <section className="flex flex-col gap-3 rounded-2xl border border-slate-800/85 bg-[#070e1d]/88 p-5">
        <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
          <div>
            <h3 className="font-display text-sm font-bold tracking-wide text-white">
              Developer &amp; Testing Tools
            </h3>
            <p className="mt-0.5 text-xs text-slate-400">
              Modular utilities for economy testing, reward validation, and full progress reset.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 pt-1 lg:grid-cols-2">
          {/* Redeem Code Panel */}
          <form
            onSubmit={handleRedeem}
            className="flex flex-col justify-between gap-3 rounded-xl border border-slate-800/85 bg-[#050a16]/90 p-4"
          >
            <div>
              <div className="flex items-center gap-2 font-display text-xs sm:text-sm font-bold tracking-wide text-white">
                <KeyRound className="h-4 w-4 text-cyan-300" />
                <span>Redeem Code</span>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                Enter a developer code to grant test Credits and Void Gems immediately.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value)}
                placeholder="Enter redeem code"
                aria-label="Developer redeem code"
                className="h-11 min-w-0 flex-1 rounded-xl border border-slate-700/80 bg-[#040814] px-3.5 font-mono-num text-sm font-semibold tracking-wider text-white outline-none transition-colors placeholder:font-sans placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-500 focus:border-cyan-400/75"
              />
              <button
                type="submit"
                className="min-h-[44px] shrink-0 rounded-xl border border-cyan-300/45 bg-cyan-400/16 px-4 py-2 font-display text-xs font-bold uppercase tracking-wider text-cyan-200 transition-[border-color,background-color,color,transform] duration-150 hover:border-cyan-300/75 hover:bg-cyan-400/25 hover:text-white active:scale-[0.97] whitespace-nowrap"
              >
                Redeem
              </button>
            </div>

            {inlineNotice && (
              <div
                role="status"
                className={`flex items-center gap-2 text-xs ${
                  inlineNotice.ok ? 'text-emerald-300' : 'text-rose-300'
                }`}
              >
                {inlineNotice.ok ? (
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                ) : (
                  <XCircle className="h-3.5 w-3.5 shrink-0" />
                )}
                <span>{inlineNotice.text}</span>
              </div>
            )}
          </form>

          {/* Reset Progress Panel */}
          <div className="flex flex-col justify-between gap-3 rounded-xl border border-slate-800/85 bg-[#050a16]/90 p-4">
            <div>
              <div className="flex items-center gap-2 font-display text-xs sm:text-sm font-bold tracking-wide text-white">
                <Trash2 className="h-4 w-4 text-rose-400" />
                <span>Reset Progress</span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">
                Wipes Credits, Gems, ships, weapons, upgrades, Campaign progress, missions, medals, and stats back to starting state.
              </p>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  SoundManager.unlock();
                  SoundManager.playButtonClick();
                  setShowResetProgressModal(true);
                }}
                className="flex min-h-[44px] items-center gap-2 rounded-xl border border-rose-400/45 bg-rose-500/12 px-4 py-2 font-display text-xs font-bold uppercase tracking-wider text-rose-200 transition-[border-color,background-color,color,transform] duration-150 hover:border-rose-400/80 hover:bg-rose-500/22 hover:text-white active:scale-[0.97] whitespace-nowrap"
              >
                <Trash2 className="h-3.5 w-3.5 shrink-0" />
                <span>Reset Progress</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Confirmation Popup for Full Progress Reset */}
      {showResetProgressModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-progress-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#03060f]/82 p-4 backdrop-blur-sm"
          onClick={() => setShowResetProgressModal(false)}
        >
          <div
            className="panel-swap w-full max-w-md rounded-2xl border border-rose-400/40 bg-[#081122]/96 p-5 sm:p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-rose-400/35 bg-rose-500/14">
                <AlertTriangle className="h-5 w-5 text-rose-300" />
              </span>
              <div>
                <h2
                  id="reset-progress-title"
                  className="font-display text-lg font-bold tracking-wide text-white"
                >
                  Reset All Game Progress?
                </h2>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
                  This action permanently erases all saved player progress and restores the game to its initial starting state:
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-rose-200/90">
                  Credits, Void Gems, unlocked ships, weapons, equipment, drones, upgrades, Campaign sectors, missions, medals, and combat statistics will all be reset.
                </p>
              </div>
            </div>

            <ConfirmButtonPair
              confirmLabel="Confirm Reset"
              onCancel={() => {
                SoundManager.playButtonClick();
                setShowResetProgressModal(false);
              }}
              onConfirm={handleConfirmResetProgress}
            />
          </div>
        </div>
      )}
    </>
  );
};
