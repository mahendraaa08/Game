import React, { useEffect, useState } from 'react';
import { ChevronRight, Play } from 'lucide-react';
import { SoundManager } from '../game/audio/SoundManager';

export const STORY_BEATS = [
  {
    year: 'Year 3099 · Outer Rim Breach',
    heading: 'The Void Empire Strikes',
    body: 'Without warning, the Void Empire shattered humanity’s outer defense relays. Their dreadnought fleets now descend upon Earth and the ten core sectors.',
  },
  {
    year: 'Earth Orbital Command · Last Squadron',
    heading: 'The Last Defender',
    body: 'Every allied wing has fallen. Unlock eight specialized starfighters, six modular weapons, companion drones, and tactical gear to turn the tide.',
  },
  {
    year: 'Mission Directive · Ten Sectors',
    heading: 'End the Galactic War',
    body: 'Fight through ten campaign sectors, survive Endless onslaughts, clear Boss Rush, and destroy the Void Emperor in the Final Reckoning.',
  },
];

interface StoryBriefingModalProps {
  open: boolean;
  onClose: () => void;
  onLaunch?: () => void;
  launchLabel?: string;
}

export const StoryBriefingModal: React.FC<StoryBriefingModalProps> = ({
  open,
  onClose,
  onLaunch,
  launchLabel = 'Continue to Modes',
}) => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!open) return;
    setStep(0);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (step < STORY_BEATS.length - 1) {
          setStep((s) => s + 1);
        } else if (onLaunch) {
          onLaunch();
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, step, onClose, onLaunch]);

  if (!open) return null;

  const beat = STORY_BEATS[step];

  return (
    <div className="scroll-panel fixed inset-0 z-40 flex items-center justify-center overflow-y-auto bg-[#03060f]/86 p-4 backdrop-blur-sm">
      <div className="scroll-panel menu-enter my-auto max-h-[calc(100dvh-2rem)] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-700/80 bg-[#081022]/96 p-6 sm:p-7 shadow-2xl">
        <div className="mb-3 flex items-center justify-between text-xs font-medium text-sky-300">
          <span>{beat.year}</span>
          <span className="font-mono-num text-slate-400">
            {step + 1} / {STORY_BEATS.length}
          </span>
        </div>

        <h2 className="mb-3 font-display text-2xl font-bold text-white">{beat.heading}</h2>
        <p className="mb-7 text-sm sm:text-base leading-relaxed text-slate-300">{beat.body}</p>

        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              SoundManager.playButtonClick();
              onClose();
            }}
            className="min-h-[44px] px-3 py-2 text-sm font-medium text-slate-400 transition-colors hover:text-white"
          >
            {onLaunch ? 'Skip Briefing' : 'Close'}
          </button>

          {step < STORY_BEATS.length - 1 ? (
            <button
              type="button"
              onClick={() => {
                SoundManager.playButtonClick();
                setStep((s) => s + 1);
              }}
              className="flex min-h-[44px] items-center gap-1.5 rounded-xl bg-sky-500 px-5 py-2 text-sm font-bold text-slate-950 transition-colors hover:bg-sky-400"
            >
              <span>Next</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                SoundManager.playButtonClick();
                if (onLaunch) onLaunch();
                else onClose();
              }}
              className="flex min-h-[44px] items-center gap-2 rounded-xl bg-sky-500 px-5 py-2 text-sm font-bold text-slate-950 transition-colors hover:bg-sky-400"
            >
              <Play className="h-4 w-4 fill-current" />
              <span>{onLaunch ? launchLabel : 'Finish Briefing'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
