import React, { useEffect, useState } from 'react';

interface LoadingScreenProps {
  exiting: boolean;
  progress: number;
  stageLabel?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  exiting,
  progress,
  stageLabel,
}) => {
  const [dotCount, setDotCount] = useState(1);
  const clampedProgress = Math.max(0, Math.min(100, Math.round(progress)));

  useEffect(() => {
    const reduced =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduced) {
      setDotCount(3);
      return;
    }

    const intervalId = window.setInterval(() => {
      setDotCount((prev) => (prev >= 3 ? 1 : prev + 1));
    }, 420);

    return () => window.clearInterval(intervalId);
  }, []);

  const dots = '.'.repeat(dotCount);

  return (
    <section
      aria-label="Loading"
      aria-busy={!exiting}
      className={`fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-[#040711] px-6 select-none transition-[opacity,transform] duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        exiting ? 'pointer-events-none scale-[1.015] opacity-0' : 'opacity-100 scale-100'
      }`}
    >
      {/* Subtle Deep-Space Atmospheric Vignette */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgba(56, 189, 248, 0.09) 0%, rgba(12, 25, 52, 0.28) 34%, rgba(4, 7, 17, 1) 72%)',
        }}
      />

      {/* Minimalist Centered Progress Bar Focal Block */}
      <div className="startup-emblem-enter relative z-10 w-full max-w-[340px] sm:max-w-[380px]">
        {/* Small "Loading" Text with Repeating Dots + Percentage */}
        <div className="mb-2.5 flex items-baseline justify-between gap-3">
          <div className="flex items-baseline text-xs font-medium tracking-[0.14em] text-slate-300 uppercase">
            <span>Loading</span>
            <span aria-hidden="true" className="inline-block w-[1.35em] text-left text-cyan-300">
              {dots}
            </span>
          </div>

          <span className="font-mono-num tabular-nums text-xs font-semibold text-cyan-300">
            {clampedProgress}%
          </span>
        </div>

        {/* Primary Progress Bar */}
        <div
          role="progressbar"
          aria-label="Game initialization progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={clampedProgress}
          className="relative h-2.5 w-full overflow-hidden rounded-full border border-slate-700/75 bg-[#081022]/90 p-[2px] shadow-[0_0_24px_rgba(14,165,233,0.14)]"
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-sky-500 via-cyan-400 to-sky-200 transition-[width] duration-200 ease-out"
            style={{ width: `${clampedProgress}%` }}
          />
        </div>

        {/* Subtle Real Stage Indicator */}
        {stageLabel && (
          <p className="mt-2.5 truncate text-center text-[11px] tracking-wide text-slate-500">
            {stageLabel}
          </p>
        )}
      </div>
    </section>
  );
};
