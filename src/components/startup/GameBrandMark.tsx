import React from 'react';

interface GameBrandMarkProps {
  compact?: boolean;
}

export const GameBrandMark: React.FC<GameBrandMarkProps> = ({ compact = false }) => {
  return (
    <div className="flex flex-col items-center text-center select-none">
      {/* Precision Vector Wing Emblem */}
      <div
        className={`relative flex items-center justify-center ${
          compact ? 'mb-3.5 h-12 w-12' : 'mb-5 h-16 w-16'
        }`}
        aria-hidden="true"
      >
        <div className="absolute inset-0 rounded-full bg-sky-400/10 blur-xl" />
        <svg
          viewBox="0 0 64 64"
          className="relative h-full w-full drop-shadow-[0_4px_14px_rgba(56,189,248,0.28)]"
          fill="none"
        >
          <defs>
            <linearGradient id="gwEmblemWing" x1="12" y1="8" x2="52" y2="54" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#F8FAFC" />
              <stop offset="55%" stopColor="#7DD3FC" />
              <stop offset="100%" stopColor="#0EA5E9" />
            </linearGradient>
            <linearGradient id="gwEmblemArc" x1="8" y1="32" x2="56" y2="32" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.15" />
              <stop offset="50%" stopColor="#7DD3FC" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.15" />
            </linearGradient>
          </defs>

          <circle
            cx="32"
            cy="32"
            r="26"
            stroke="url(#gwEmblemArc)"
            strokeWidth="1.25"
            strokeDasharray="34 10 12 10"
          />
          <path
            d="M32 9L45 41L36.5 36.5L32 51L27.5 36.5L19 41L32 9Z"
            fill="url(#gwEmblemWing)"
          />
          <path
            d="M32 17L36.5 32.5L32 30.2L27.5 32.5L32 17Z"
            fill="#040711"
            fillOpacity="0.72"
          />
          <path
            d="M14 36L23 30.5L20.5 37.5L14 36Z"
            fill="#38BDF8"
            fillOpacity="0.85"
          />
          <path
            d="M50 36L41 30.5L43.5 37.5L50 36Z"
            fill="#38BDF8"
            fillOpacity="0.85"
          />
        </svg>
      </div>

      {/* Wordmark */}
      <div className="flex flex-col items-center">
        <span
          className={`font-display font-bold tracking-[0.14em] text-transparent bg-clip-text bg-gradient-to-r from-white via-sky-100 to-sky-300 ${
            compact ? 'text-2xl sm:text-[26px]' : 'text-3xl sm:text-4xl'
          }`}
        >
          GALACTIC WAR
        </span>
        <span
          className={`mt-1 font-display font-semibold tracking-[0.34em] text-slate-300/90 ${
            compact ? 'text-[10.5px] sm:text-[11px]' : 'text-xs sm:text-[13px]'
          }`}
        >
          THE LAST DEFENDER
        </span>
      </div>
    </div>
  );
};
