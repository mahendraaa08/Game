import React, { useEffect, useMemo } from 'react';
import { BookOpen, ChevronRight, Play, Settings, Trophy, Wrench } from 'lucide-react';
import titleKeyArt from '../assets/images/title_key_art_1794922504898.jpg';
import { SHIPS } from '../game/config/ShipConfig';
import { SoundManager } from '../game/audio/SoundManager';
import { evaluateGlobalNotifications } from '../game/systems/NotificationStatus';
import { AppRoute } from '../game/utils/EventBus';
import { PlayerProgress } from '../game/utils/StorageManager';
import { CreditCoinIcon, CrystalGemIcon } from './ui/CurrencyBadges';
import { NotificationDot } from './ui/NotificationDot';

interface TitleOverlayProps {
  progress: PlayerProgress;
  isActive: boolean;
  onNavigate: (route: Exclude<AppRoute, 'menu'>) => void;
}

export const TitleOverlay: React.FC<TitleOverlayProps> = ({
  progress,
  isActive,
  onNavigate,
}) => {
  const activeShip = SHIPS[progress.selectedShip] ?? SHIPS.falcon_x;
  const notifications = useMemo(() => evaluateGlobalNotifications(progress), [progress]);

  const navigateTo = (route: Exclude<AppRoute, 'menu'>) => {
    SoundManager.unlock();
    SoundManager.playButtonClick();
    onNavigate(route);
  };

  useEffect(() => {
    if (!isActive) return;
    const onKey = (e: KeyboardEvent) => {
      const targetTag = (e.target as HTMLElement | null)?.tagName;
      if (targetTag === 'BUTTON' || targetTag === 'A' || targetTag === 'INPUT') {
        return;
      }
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        navigateTo('modes');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isActive]);

  return (
    <div className="scroll-panel absolute inset-0 z-20 overflow-y-auto overflow-x-hidden">
      {/* Preserved Space & Starfighter Key Art Backdrop */}
      <img
        src={titleKeyArt}
        alt="Galactic War Starfighter Squadron defending Earth"
        referrerPolicy="no-referrer"
        className="fixed inset-0 h-full w-full object-cover opacity-85"
      />
      <div className="fixed inset-0 bg-gradient-to-r from-[#040711]/94 via-[#040711]/68 to-[#040711]/18" />
      <div className="fixed inset-0 bg-gradient-to-t from-[#040711]/88 via-transparent to-[#040711]/52" />

      <div className="relative z-10 flex min-h-full flex-col">
        {/* TOP HEADER: Ship + Sector (Left) | Non-Interactive Currency Cluster + Settings (Right) */}
        <header className="relative z-10 flex items-center justify-between gap-2.5 sm:gap-4 px-4 pt-[max(0.875rem,env(safe-area-inset-top))] pb-2 sm:px-8 lg:px-12">
          {/* Top-Left: Active Ship & Current Sector Only */}
          <div className="flex min-w-0 flex-col leading-tight sm:flex-row sm:items-center sm:gap-2">
            <span className="truncate font-display text-xs sm:text-sm font-semibold tracking-wider text-slate-100">
              {activeShip.name}
            </span>
            <span aria-hidden="true" className="hidden sm:inline text-slate-600">
              ·
            </span>
            <span className="font-mono-num text-[11px] sm:text-xs font-medium text-sky-300/90 whitespace-nowrap">
              Sector {progress.highestUnlockedLevel}/10
            </span>
          </div>

          {/* Top-Right: Compact Read-Only Credits & Crystals + Settings Button */}
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <div
              aria-label={`Credits ${progress.credits.toLocaleString()}, Crystals ${progress.crystals.toLocaleString()}`}
              className="flex min-h-[44px] items-center gap-2 sm:gap-3 rounded-xl border border-slate-700/65 bg-[#070f20]/82 px-2.5 sm:px-3.5 py-1.5 backdrop-blur-sm select-none"
            >
              <div className="flex items-center gap-1.5">
                <CreditCoinIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                <span className="font-mono-num text-xs sm:text-[13px] font-semibold tracking-tight text-slate-100 whitespace-nowrap">
                  {progress.credits.toLocaleString()}
                </span>
              </div>

              <span aria-hidden="true" className="h-3.5 w-px shrink-0 bg-slate-700/80" />

              <div className="flex items-center gap-1.5">
                <CrystalGemIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                <span className="font-mono-num text-xs sm:text-[13px] font-semibold tracking-tight text-cyan-200 whitespace-nowrap">
                  {progress.crystals.toLocaleString()}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigateTo('settings')}
              aria-label="Open Settings"
              title="Settings"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-700/65 bg-[#070f20]/82 text-slate-300 backdrop-blur-sm transition-[border-color,background-color,color,transform] duration-150 hover:border-cyan-300/50 hover:bg-[#0d1930] hover:text-white active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-cyan-400"
            >
              <Settings className="h-[18px] w-[18px] text-cyan-300/90" />
            </button>
          </div>
        </header>

        {/* LEFT-ALIGNED HERO TITLE + 3-BUTTON NAVIGATION STACK */}
        <section className="menu-enter relative z-10 my-auto w-full max-w-[490px] px-4 py-6 pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-8 lg:ml-8 lg:px-6">
          {/* HERO IDENTITY */}
          <div className="mb-7">
            <svg
              viewBox="0 0 640 156"
              className="mb-3 w-full max-w-[450px] drop-shadow-[0_4px_14px_rgba(2,6,18,0.65)]"
              role="img"
              aria-label="Galactic War: The Last Defender"
            >
              <defs>
                <linearGradient id="gwTitleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#F8FAFC" />
                  <stop offset="65%" stopColor="#E0F2FE" />
                  <stop offset="100%" stopColor="#7DD3FC" />
                </linearGradient>
                <linearGradient id="gwAccentRule" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#38BDF8" />
                  <stop offset="100%" stopColor="#38BDF8" stopOpacity="0" />
                </linearGradient>
              </defs>
              <rect x="2" y="6" width="96" height="2.5" fill="url(#gwAccentRule)" rx="1.25" />
              <text
                x="2"
                y="25"
                fill="#7DD3FC"
                fillOpacity="0.9"
                fontFamily="'Chakra Petch', sans-serif"
                fontSize="14.5"
                fontWeight="600"
                letterSpacing="3.8"
              >
                YEAR 3099 · VOID EMPIRE INVASION
              </text>
              <text
                x="0"
                y="90"
                fill="url(#gwTitleGrad)"
                fontFamily="'Chakra Petch', sans-serif"
                fontSize="66"
                fontWeight="700"
                letterSpacing="2"
              >
                GALACTIC WAR
              </text>
              <text
                x="2"
                y="132"
                fill="#CBD5E1"
                fontFamily="'Chakra Petch', sans-serif"
                fontSize="26"
                fontWeight="600"
                letterSpacing="7"
              >
                THE LAST DEFENDER
              </text>
              <rect x="2" y="148" width="320" height="1.5" fill="url(#gwAccentRule)" opacity="0.55" />
            </svg>

            <p className="max-w-[38ch] text-sm sm:text-[15px] leading-relaxed text-slate-300/90">
              Command your starfighters. Defend the galaxy. Become the last defender.
            </p>
          </div>

          {/* STRICTLY 3 PRIMARY NAVIGATION BUTTONS */}
          <nav aria-label="Main Navigation" className="flex w-full max-w-[400px] flex-col gap-3">
            {/* 1. PLAY -> Dedicated Game Mode Selection */}
            <button
              type="button"
              onClick={() => navigateTo('modes')}
              className="group flex min-h-[62px] w-full items-center justify-between rounded-2xl border border-cyan-200/45 bg-gradient-to-r from-sky-400 to-cyan-400 px-5 py-3 text-left text-slate-950 shadow-lg shadow-slate-950/40 transition-[filter,transform] duration-150 hover:brightness-105 active:scale-[0.985] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
            >
              <div className="flex items-center gap-3.5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-950/12">
                  <Play className="h-[18px] w-[18px] fill-current" />
                </span>
                <div>
                  <div className="font-display text-lg sm:text-xl font-bold tracking-[0.1em] leading-tight">
                    PLAY
                  </div>
                  <div className="mt-0.5 font-mono-num text-[10.5px] font-bold tracking-[0.14em] text-slate-900/75">
                    SELECT GAME MODE
                  </div>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-slate-950/80 transition-transform duration-150 group-hover:translate-x-0.5" />
            </button>

            {/* 2. HANGAR & UPGRADES -> Direct 3-Tab Hangar (Ships | Weapons | Armory) */}
            <button
              type="button"
              onClick={() => navigateTo('ships')}
              className="group relative flex min-h-[54px] w-full items-center justify-between rounded-2xl border border-slate-700/70 bg-[#081122]/86 px-5 py-3 text-left text-slate-100 backdrop-blur-sm transition-[border-color,background-color,transform] duration-150 hover:border-cyan-300/45 hover:bg-[#0d1930]/92 active:scale-[0.985] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
            >
              <NotificationDot
                visible={notifications.hangarMenu}
                position="corner"
                label="Hangar action available"
              />
              <div className="flex items-center gap-3.5 min-w-0">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10">
                  <Wrench className="h-[17px] w-[17px] text-cyan-300" />
                </span>
                <span className="truncate font-display text-sm sm:text-[15px] font-semibold tracking-[0.08em] text-slate-100">
                  HANGAR &amp; UPGRADES
                </span>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-cyan-300" />
            </button>

            {/* 3. MISSIONS & MEDALS -> Dedicated Missions & Medals Screen */}
            <button
              type="button"
              onClick={() => navigateTo('missions')}
              className="group relative flex min-h-[54px] w-full items-center justify-between rounded-2xl border border-slate-700/70 bg-[#081122]/86 px-5 py-3 text-left text-slate-100 backdrop-blur-sm transition-[border-color,background-color,transform] duration-150 hover:border-cyan-300/45 hover:bg-[#0d1930]/92 active:scale-[0.985] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
            >
              <NotificationDot
                visible={notifications.missionsMenu}
                position="corner"
                label="Completed mission or medal reward ready to claim"
              />
              <div className="flex items-center gap-3.5 min-w-0">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-amber-300/20 bg-amber-400/10">
                  <Trophy className="h-[17px] w-[17px] text-amber-300" />
                </span>
                <span className="truncate font-display text-sm sm:text-[15px] font-semibold tracking-[0.08em] text-slate-100">
                  MISSIONS &amp; MEDALS
                </span>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-amber-300" />
            </button>

            {/* 4. CODEX -> Game Encyclopedia */}
            <button
              type="button"
              onClick={() => navigateTo('codex')}
              className="group relative flex min-h-[54px] w-full items-center justify-between rounded-2xl border border-slate-700/70 bg-[#081122]/86 px-5 py-3 text-left text-slate-100 backdrop-blur-sm transition-[border-color,background-color,transform] duration-150 hover:border-cyan-300/45 hover:bg-[#0d1930]/92 active:scale-[0.985] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-sky-300/20 bg-sky-400/10">
                  <BookOpen className="h-[17px] w-[17px] text-sky-300" />
                </span>
                <span className="truncate font-display text-sm sm:text-[15px] font-semibold tracking-[0.08em] text-slate-100">
                  CODEX
                </span>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-sky-300" />
            </button>
          </nav>
        </section>
      </div>
    </div>
  );
};
