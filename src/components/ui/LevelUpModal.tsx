import React, { useEffect, useState } from 'react';
import { ArrowRight, Award, Sparkles } from 'lucide-react';
import { SoundManager } from '../../game/audio/SoundManager';
import { getRankTitleForLevel } from '../../game/config/LevelProgressionConfig';
import { type LevelUpPayload } from '../../game/utils/EventBus';
import { CreditCoinIcon, CrystalGemIcon } from './CurrencyBadges';

interface LevelUpModalProps {
  data: LevelUpPayload;
  onClose: () => void;
}

export const LevelUpModal: React.FC<LevelUpModalProps> = ({ data, onClose }) => {
  const rankTitle = getRankTitleForLevel(data.newLevel);
  const [closing, setClosing] = useState(false);
  const [displayLevel, setDisplayLevel] = useState(data.previousLevel);
  const [displayCredits, setDisplayCredits] = useState(0);
  const [displayGems, setDisplayGems] = useState(0);

  const levelsGained = Math.max(1, data.newLevel - data.previousLevel);
  const isMultiLevel = levelsGained > 1 && data.steps && data.steps.length > 1;

  useEffect(() => {
    SoundManager.unlock();
    SoundManager.playPowerUp();
  }, [data.newLevel]);

  // Smooth lightweight count-up animation for level number & reward totals
  useEffect(() => {
    const start = performance.now();
    const duration = 420;
    let rafId = 0;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayLevel(
        Math.round(data.previousLevel + (data.newLevel - data.previousLevel) * eased)
      );
      setDisplayCredits(Math.round(data.creditsGranted * eased));
      setDisplayGems(Math.round(data.crystalsGranted * eased));
      if (t < 1) {
        rafId = window.requestAnimationFrame(tick);
      }
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [data.previousLevel, data.newLevel, data.creditsGranted, data.crystalsGranted]);

  const handleContinue = () => {
    if (closing) return;
    SoundManager.unlock();
    SoundManager.playButtonClick();
    setClosing(true);
    window.setTimeout(() => {
      onClose();
    }, 170);
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleContinue();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [closing]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="level-up-modal-title"
      className={`fixed inset-0 z-[60] flex items-center justify-center bg-[#03060f]/82 p-4 backdrop-blur-sm transition-opacity duration-150 ${
        closing ? 'opacity-0' : 'opacity-100'
      }`}
      onClick={handleContinue}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`panel-swap relative w-full max-w-[372px] overflow-hidden rounded-2xl border border-cyan-300/40 bg-[#070f20]/98 shadow-2xl shadow-black/80 transition-[opacity,transform] duration-150 ${
          closing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        }`}
      >
        <div
          aria-hidden="true"
          className="h-1 w-full bg-gradient-to-r from-sky-400 via-cyan-300 to-amber-300"
        />

        <div className="flex flex-col items-center px-5 pb-5 pt-5 text-center sm:px-6 sm:pb-6 sm:pt-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-300/40 bg-cyan-400/12 shadow-[0_0_22px_rgba(34,211,238,0.22)]">
            <Award className="h-5.5 w-5.5 text-cyan-300" />
          </div>

          <div className="mt-3 inline-flex items-center gap-1.5 font-mono-num text-[10.5px] font-bold tracking-[0.2em] text-cyan-300 uppercase">
            <Sparkles className="h-3 w-3" />
            <span>
              {levelsGained > 1
                ? `+${levelsGained} Levels Promoted`
                : 'Commander Promotion'}
            </span>
          </div>

          <h2
            id="level-up-modal-title"
            className="mt-1 font-display text-2xl font-bold tracking-[0.14em] text-white"
          >
            LEVEL UP
          </h2>

          {/* Level Transition Pill */}
          <div className="mt-3.5 flex items-center justify-center gap-3 rounded-xl border border-slate-800 bg-[#040814]/90 px-5 py-2.5">
            <span className="font-mono-num text-sm font-semibold text-slate-400">
              Lv.{data.previousLevel}
            </span>
            <ArrowRight className="h-4 w-4 text-cyan-300" />
            <span className="font-mono-num text-xl font-bold text-cyan-200">
              Lv.{displayLevel}
            </span>
          </div>

          <p className="mt-2 text-xs font-medium tracking-wide text-slate-300">
            Rank: <span className="font-semibold text-white">{rankTitle}</span>
          </p>

          {/* Granted Rewards */}
          {(data.creditsGranted > 0 || data.crystalsGranted > 0) && (
            <div className="mt-4 w-full rounded-xl border border-slate-800/90 bg-[#050b19]/90 p-3.5">
              <div className="text-[11px] font-medium tracking-wide text-slate-400">
                {isMultiLevel ? 'Total Level-Up Rewards' : 'Level-Up Rewards'}
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2.5">
                {data.creditsGranted > 0 && (
                  <div className="flex items-center justify-center gap-1.5 rounded-lg border border-amber-400/25 bg-amber-400/10 px-3 py-2">
                    <CreditCoinIcon className="h-4 w-4 shrink-0" />
                    <span className="font-mono-num text-sm font-bold text-amber-200">
                      +{displayCredits.toLocaleString()} CR
                    </span>
                  </div>
                )}
                {data.crystalsGranted > 0 && (
                  <div className="flex items-center justify-center gap-1.5 rounded-lg border border-cyan-400/25 bg-cyan-400/10 px-3 py-2">
                    <CrystalGemIcon className="h-4 w-4 shrink-0" />
                    <span className="font-mono-num text-sm font-bold text-cyan-200">
                      +{displayGems.toLocaleString()} {data.crystalsGranted === 1 ? 'Gem' : 'Gems'}
                    </span>
                  </div>
                )}
              </div>

              {/* Organized Multi-Level Breakdown */}
              {isMultiLevel && data.steps && (
                <div className="scroll-panel mt-3 max-h-24 space-y-1 overflow-y-auto border-t border-slate-800/80 pt-2.5 pr-1 text-left font-mono-num text-[11px]">
                  {data.steps.map((step) => (
                    <div
                      key={step.level}
                      className="flex items-center justify-between text-slate-300"
                    >
                      <span className="font-semibold text-cyan-200">Level {step.level}</span>
                      <span>
                        <span className="text-amber-200">+{step.credits.toLocaleString()} CR</span>
                        <span className="mx-1.5 text-slate-600">·</span>
                        <span className="text-cyan-200">+{step.crystals} Gems</span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={handleContinue}
            className="mt-4 flex min-h-[44px] w-full items-center justify-center rounded-xl border border-cyan-200/45 bg-gradient-to-r from-sky-400 to-cyan-400 px-5 py-2.5 font-display text-sm font-bold tracking-[0.1em] text-slate-950 shadow-lg shadow-cyan-950/30 transition-[filter,transform] duration-150 hover:brightness-105 active:scale-[0.985] focus-visible:outline-2 focus-visible:outline-cyan-300"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};
