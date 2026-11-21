import React from 'react';

interface LoadingScreenProps {
  exiting: boolean;
}

const LOADING_CHARS = ['L', 'O', 'A', 'D', 'I', 'N', 'G', '.', '.', '.'] as const;

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ exiting }) => {
  return (
    <section
      aria-label="Loading"
      aria-busy={!exiting}
      className={`fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-[#040711] px-6 select-none transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        exiting ? 'pointer-events-none scale-[1.015] opacity-0' : 'opacity-100 scale-100'
      }`}
    >
      {/* Clean Deep-Space Atmospheric Vignette (Zero Clutter) */}
      <div
        aria-hidden="true"
        className="loading-aura pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgba(56, 189, 248, 0.12) 0%, rgba(12, 25, 52, 0.34) 34%, rgba(4, 7, 17, 1) 72%)',
        }}
      />

      {/* Minimalist "LOADING..." Typographic Focal Centerpiece */}
      <div className="startup-emblem-enter relative z-10 flex items-center justify-center">
        <span className="sr-only">LOADING...</span>
        <div
          aria-hidden="true"
          className="flex items-center justify-center gap-2.5 sm:gap-3.5 font-display text-2xl sm:text-3xl md:text-[34px] font-bold text-sky-50 drop-shadow-[0_0_22px_rgba(56,189,248,0.34)]"
        >
          {LOADING_CHARS.map((ch, idx) => (
            <span
              key={idx}
              className={`loading-letter ${idx >= 7 ? 'text-cyan-300' : 'text-sky-50'}`}
              style={{
                animationDelay: `${idx * 95}ms`,
              }}
            >
              {ch}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};
