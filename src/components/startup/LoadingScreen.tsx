import React from 'react';
import { GameBrandMark } from './GameBrandMark';

interface LoadingScreenProps {
  progress: number;
  stageLabel: string;
  exiting: boolean;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  progress,
  stageLabel,
  exiting,
}) => {
  const clamped = Math.max(0, Math.min(1, progress));
  const percent = Math.round(clamped * 100);

  return (
    <section
      aria-label="Game Loading Screen"
      aria-busy={!exiting}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-[#040711] px-6 transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        exiting ? 'pointer-events-none scale-[1.015] opacity-0' : 'opacity-100 scale-100'
      }`}
    >
      {/* Subtle Cosmic Radial Atmosphere & Precision Orbital Geometry */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 42%, rgba(14, 165, 233, 0.11) 0%, rgba(7, 15, 32, 0.48) 38%, rgba(4, 7, 17, 1) 74%)',
        }}
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-25"
      >
        <svg
          width="560"
          height="560"
          viewBox="0 0 560 560"
          fill="none"
          className="h-[420px] w-[420px] sm:h-[560px] sm:w-[560px]"
        >
          <g className="startup-orbit-slow" style={{ transformOrigin: '280px 280px' }}>
            <circle
              cx="280"
              cy="280"
              r="240"
              stroke="#38BDF8"
              strokeOpacity="0.22"
              strokeWidth="1"
              strokeDasharray="6 14"
            />
          </g>
          <g className="startup-orbit-reverse" style={{ transformOrigin: '280px 280px' }}>
            <circle
              cx="280"
              cy="280"
              r="182"
              stroke="#7DD3FC"
              strokeOpacity="0.16"
              strokeWidth="1"
              strokeDasharray="48 24 12 24"
            />
          </g>
        </svg>
      </div>

      {/* Centered Content Stack */}
      <div className="startup-emblem-enter relative z-10 flex w-full max-w-[380px] flex-col items-center">
        <GameBrandMark />

        {/* Real Progress Bar + Tabular Percentage */}
        <div className="mt-10 w-full">
          <div
            role="progressbar"
            aria-label="Loading game data and assets"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
            className="relative h-1.5 w-full overflow-hidden rounded-full bg-slate-800/85 ring-1 ring-white/[0.05]"
          >
            <div
              className="h-full w-full origin-left rounded-full bg-gradient-to-r from-sky-500 via-cyan-400 to-sky-200 will-change-transform"
              style={{
                transform: `scaleX(${Math.max(0.015, clamped)})`,
              }}
            />
          </div>

          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="truncate text-xs font-medium tracking-wide text-slate-400">
              {stageLabel}
            </span>
            <span className="font-mono-num shrink-0 text-xs font-semibold text-cyan-200">
              {percent}%
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
