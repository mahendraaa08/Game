import React, { useEffect, useRef, useState } from 'react';
import { Pause } from 'lucide-react';
import { HudSnapshot } from '../game/config/GameConfig';
import { SoundManager } from '../game/audio/SoundManager';
import { EventBus } from '../game/utils/EventBus';
import { StorageManager } from '../game/utils/StorageManager';
import { AbilityCircleButton } from './hud/AbilityCircleButton';
import { BossHealthBar, TelemetryCard } from './hud/HudStatusCards';
import { ActivePowerUpsBar, PowerUpToastFeed } from './hud/PowerUpIndicators';
import { WeaponSelector } from './hud/WeaponSelector';

interface HudOverlayProps {
  hud: HudSnapshot;
  bossWarning: { name: string; title: string } | null;
  isPaused?: boolean;
}

export const HudOverlay: React.FC<HudOverlayProps> = ({
  hud,
  bossWarning,
  isPaused = false,
}) => {
  const [dashActivated, setDashActivated] = useState(false);
  const [specialActivated, setSpecialActivated] = useState(false);
  const [bossDamageFlash, setBossDamageFlash] = useState(false);
  const [savedProgress, setSavedProgress] = useState(() => StorageManager.load());
  const prevBossActiveRef = useRef<boolean>(hud.bossActive);
  const prevBossHpRef = useRef<number>(hud.bossHp);
  const dashFlashTimerRef = useRef<number | null>(null);
  const specialFlashTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const unsubProgress = EventBus.on('progress:updated', () => {
      setSavedProgress(StorageManager.load());
    });
    const unsubSettings = EventBus.on('settings:updated', (settings) => {
      setSavedProgress((prev) => ({ ...prev, settings }));
    });
    return () => {
      unsubProgress();
      unsubSettings();
    };
  }, []);

  const unlockedWeapons = savedProgress.unlockedWeapons;
  const weaponLevels = savedProgress.weaponLevels;
  const lowFx = savedProgress.settings.fxQuality === 'low';

  useEffect(() => {
    return () => {
      if (dashFlashTimerRef.current) window.clearTimeout(dashFlashTimerRef.current);
      if (specialFlashTimerRef.current) window.clearTimeout(specialFlashTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const tookRealDamage =
      hud.bossActive && prevBossActiveRef.current && hud.bossHp < prevBossHpRef.current;
    prevBossActiveRef.current = hud.bossActive;
    prevBossHpRef.current = hud.bossHp;

    if (tookRealDamage) {
      setBossDamageFlash(true);
      const t = window.setTimeout(() => setBossDamageFlash(false), 110);
      return () => window.clearTimeout(t);
    }
  }, [hud.bossActive, hud.bossHp]);

  const triggerDash = () => {
    if (isPaused || hud.dashCooldownRatio < 1) return;
    SoundManager.unlock();
    setDashActivated(true);
    EventBus.emit('ui:trigger-dash');
    if (dashFlashTimerRef.current) window.clearTimeout(dashFlashTimerRef.current);
    dashFlashTimerRef.current = window.setTimeout(() => setDashActivated(false), 180);
  };

  const triggerSpecial = () => {
    if (isPaused || hud.specialCooldownRatio < 1) return;
    SoundManager.unlock();
    setSpecialActivated(true);
    EventBus.emit('ui:trigger-special');
    if (specialFlashTimerRef.current) window.clearTimeout(specialFlashTimerRef.current);
    specialFlashTimerRef.current = window.setTimeout(() => setSpecialActivated(false), 240);
  };

  const waveLabel =
    hud.mode === 'boss_rush'
      ? `Boss ${hud.bossRushIndex}/${hud.bossRushTotal}`
      : hud.bossActive
      ? 'Boss'
      : hud.mode === 'endless'
      ? `Wave ${hud.waveIndex}`
      : `W${hud.waveIndex}/${hud.totalWaves}`;

  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-between px-3 pt-[max(0.625rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-4">
      {/* Top Telemetry Layer (Strictly Hull/Shield & Score/Pause) */}
      <div className="flex items-start justify-between gap-2 sm:gap-3">
        <TelemetryCard
          shipName={hud.shipName}
          creditsEarnedRun={hud.creditsEarnedRun}
          hp={hud.hp}
          maxHp={hud.maxHp}
          shield={hud.shield}
          maxShield={hud.maxShield}
        />

        <div className="flex items-start gap-2">
          <div className="rounded-xl border border-cyan-400/22 bg-[#050b1a]/80 px-2.5 py-2 backdrop-blur-sm sm:px-3 text-right">
            <div className="max-w-[130px] sm:max-w-none truncate text-[10px] sm:text-[11px] font-medium text-slate-400">
              {hud.modeLabel} · {hud.levelName}
            </div>
            <div className="mt-0.5 flex items-center justify-end gap-1.5 sm:gap-2.5">
              <span className="font-mono-num text-[11px] sm:text-xs font-semibold text-cyan-300">
                {waveLabel}
              </span>
              <span className="text-slate-600">·</span>
              <span className="font-mono-num text-sm sm:text-base font-bold text-white">
                {hud.score.toLocaleString()}
              </span>
              {hud.combo > 1 && (
                <span className="font-mono-num text-[11px] font-bold text-amber-300">
                  x{hud.combo}
                </span>
              )}
            </div>
            {hud.challengeProgressText && (
              <div className="mt-0.5 font-mono-num text-[10px] font-semibold text-amber-300">
                {hud.challengeProgressText}
              </div>
            )}
          </div>

          <button
            type="button"
            data-hud-control="true"
            onPointerDown={(e) => {
              e.preventDefault();
              if (!isPaused) EventBus.emit('ui:pause-game');
            }}
            onClick={(e) => {
              if (e.detail === 0 && !isPaused) EventBus.emit('ui:pause-game');
            }}
            title="Pause Game (Esc)"
            aria-label="Pause Game"
            className="pointer-events-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-400/30 bg-[#060d20]/86 text-cyan-200 shadow-[0_0_12px_rgba(34,211,238,0.14)] backdrop-blur-sm transition-[border-color,background-color,transform] duration-150 hover:border-cyan-300 hover:bg-[#0c1b3a] hover:text-white active:scale-90 touch-none focus-visible:outline-2 focus-visible:outline-cyan-300"
          >
            <Pause className="pointer-events-none h-[18px] w-[18px]" />
          </button>
        </div>
      </div>

      {/* Independent Locked Boss Health Bar Layer (Zero Layout Coupling with Power-Ups) */}
      {hud.bossActive && (
        <div
          aria-label="Boss Health"
          className="pointer-events-none absolute inset-x-3 top-[calc(max(0.625rem,env(safe-area-inset-top))+92px)] mx-auto w-auto max-w-md sm:top-[calc(max(0.625rem,env(safe-area-inset-top))+100px)] lg:inset-x-auto lg:left-1/2 lg:top-4 lg:w-full lg:-translate-x-1/2"
        >
          <BossHealthBar
            name={hud.bossName}
            hp={hud.bossHp}
            maxHp={hud.bossMaxHp}
            phase={hud.bossPhase}
            damageFlash={bossDamageFlash}
          />
        </div>
      )}

      {/* Independent Power-Up Notification & Active Buff Layer (Zero Reflow Impact on Boss HP) */}
      <div
        className={`pointer-events-none absolute left-3 sm:left-4 flex flex-col items-start ${
          hud.bossActive
            ? 'top-[calc(max(0.625rem,env(safe-area-inset-top))+156px)] sm:top-[calc(max(0.625rem,env(safe-area-inset-top))+168px)] lg:top-[110px]'
            : 'top-[calc(max(0.625rem,env(safe-area-inset-top))+92px)] sm:top-[calc(max(0.625rem,env(safe-area-inset-top))+100px)] lg:top-[110px]'
        }`}
      >
        <ActivePowerUpsBar
          rapidFireLeftSec={hud.rapidFireLeftSec}
          doubleDamageLeftSec={hud.doubleDamageLeftSec}
          invulnLeftSec={hud.invulnLeftSec}
        />
        <PowerUpToastFeed />
      </div>

      {/* Transient Boss Arrival Alert Banner */}
      {bossWarning && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-4">
          <div className="flex flex-col items-center rounded-2xl border border-rose-500/70 bg-[#13040b]/92 px-6 py-4 text-center shadow-[0_0_28px_rgba(244,63,94,0.3)] sm:px-8">
            <span className="font-mono-num text-xs font-bold tracking-widest text-rose-400">
              HOSTILE COMMANDER DETECTED
            </span>
            <span className="mt-1 font-display text-2xl sm:text-3xl font-bold text-white">
              {bossWarning.name}
            </span>
            <span className="text-xs text-slate-300">{bossWarning.title}</span>
          </div>
        </div>
      )}

      {/* Bottom Perimeter: Compact Dynamic Weapon Selector (Left) + Single-Circle Ability Controls (Right) */}
      <div className="relative flex items-end justify-between gap-2 pb-1">
        <WeaponSelector
          activeWeaponId={hud.weaponId}
          allowedWeapons={hud.allowedWeapons}
          unlockedWeapons={unlockedWeapons}
          weaponLevels={weaponLevels}
          isPaused={isPaused}
        />

        {/* Bottom-Right: Single-Circle SPECIAL & DASH Controls */}
        <div className="mb-1 mr-0.5 flex items-end gap-3 sm:mb-1.5 sm:mr-1 sm:gap-3.5">
          <div className="-translate-y-3.5">
            <AbilityCircleButton
              variant="special"
              label="SPECIAL"
              hotkeyHint="E"
              ratio={hud.specialCooldownRatio}
              cooldownLeftSec={hud.specialCooldownLeftSec}
              disabled={isPaused}
              lowFx={lowFx}
              sizePx={68}
              accentHex="#C084FC"
              secondaryHex="#38BDF8"
              activated={specialActivated}
              onActivate={triggerSpecial}
              icon={
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5 text-purple-200"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M12 2.5L14.6 8.9L21 11.5L14.6 14.1L12 20.5L9.4 14.1L3 11.5L9.4 8.9L12 2.5Z"
                    fill="#C084FC"
                    fillOpacity="0.35"
                    stroke="#E9D5FF"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                  <circle cx="12" cy="11.5" r="2.1" fill="#67E8F9" />
                </svg>
              }
            />
          </div>

          <AbilityCircleButton
            variant="dash"
            label="DASH"
            hotkeyHint="Shift"
            ratio={hud.dashCooldownRatio}
            cooldownLeftSec={hud.dashCooldownLeftSec}
            disabled={isPaused}
            lowFx={lowFx}
            sizePx={60}
            accentHex="#38BDF8"
            secondaryHex="#0EA5E9"
            activated={dashActivated}
            onActivate={triggerDash}
            icon={
              <svg
                viewBox="0 0 24 24"
                className="h-[18px] w-[18px] text-cyan-200"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M5.5 16.5L12 10L18.5 16.5"
                  stroke="#38BDF8"
                  strokeWidth="2.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M7.5 10.8L12 6.3L16.5 10.8"
                  stroke="#BAE6FD"
                  strokeWidth="2.1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            }
          />
        </div>
      </div>
    </div>
  );
};
