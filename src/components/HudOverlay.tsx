import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pause } from 'lucide-react';
import { HudSnapshot } from '../game/config/GameConfig';
import { SoundManager } from '../game/audio/SoundManager';
import { BossPosePayload, BossWarningPayload, EventBus } from '../game/utils/EventBus';
import { StorageManager } from '../game/utils/StorageManager';
import { AbilityCircleButton } from './hud/AbilityCircleButton';
import { BossHealthBar, ScoreHudCard, TelemetryCard } from './hud/HudStatusCards';
import { PowerUpToastFeed } from './hud/PowerUpIndicators';
import { WeaponSelector } from './hud/WeaponSelector';

interface HudOverlayProps {
  hud: HudSnapshot;
  bossWarning: BossWarningPayload | null;
  isPaused?: boolean;
}

interface BossDisplaySnapshot {
  name: string;
  title: string;
  hp: number;
  maxHp: number;
  phase: 1 | 2 | 3;
}

const INTRO_HOLD_SEC = 1.25;
const GLIDE_DUR_SEC = 0.78;

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export const HudOverlay: React.FC<HudOverlayProps> = ({
  hud,
  bossWarning,
  isPaused = false,
}) => {
  const [dashActivated, setDashActivated] = useState(false);
  const [specialActivated, setSpecialActivated] = useState(false);
  const [bossDamageFlash, setBossDamageFlash] = useState(false);
  const [bossBarClosing, setBossBarClosing] = useState(false);
  const [closingBossData, setClosingBossData] = useState<BossDisplaySnapshot | null>(null);
  const [bossIntroKey, setBossIntroKey] = useState(0);
  const [warningKey, setWarningKey] = useState(0);
  const [savedProgress, setSavedProgress] = useState(() => StorageManager.load());

  const prevBossActiveRef = useRef<boolean>(hud.bossActive);
  const prevBossHpRef = useRef<number>(hud.bossHp);
  const lastBossSnapshotRef = useRef<BossDisplaySnapshot | null>(null);
  const bossCloseTimerRef = useRef<number | null>(null);
  const dashFlashTimerRef = useRef<number | null>(null);
  const specialFlashTimerRef = useRef<number | null>(null);

  const bossBarWrapperRef = useRef<HTMLDivElement | null>(null);
  const bossIntroHeaderRef = useRef<HTMLDivElement | null>(null);
  const bossClosingRef = useRef<boolean>(false);

  useEffect(() => {
    bossClosingRef.current = bossBarClosing;
  }, [bossBarClosing]);

  useEffect(() => {
    if (bossWarning) {
      setWarningKey((k) => k + 1);
    }
  }, [bossWarning]);

  const applyBossPose = useCallback((pose: BossPosePayload) => {
    const wrapper = bossBarWrapperRef.current;
    if (!wrapper || !pose.active || bossClosingRef.current) return;

    const vw = Math.max(320, pose.viewportW || window.innerWidth || 1280);
    const vh = Math.max(240, pose.viewportH || window.innerHeight || 720);
    const isNarrow = vw < 640;

    const baseW = isNarrow ? Math.min(312, Math.round(vw * 0.84)) : 356;
    const followScale = isNarrow ? 0.72 : 0.74;
    if (wrapper.style.width !== `${baseW}px`) {
      wrapper.style.width = `${baseW}px`;
    }

    const baseH = wrapper.offsetHeight || 62;

    // Stage 1: Prominent Center-Screen Introduction Anchor
    const centerX = vw * 0.5;
    const centerY = clamp(vh * 0.43, baseH + 44, Math.max(baseH + 44, vh - 175));

    // Stage 2 & 3: Clamped Real-Time Target Anchor Above Boss
    const visualHalfW = baseW * followScale * 0.5;
    const visualHalfH = baseH * followScale * 0.5;
    const minFollowX = visualHalfW + 10;
    const maxFollowX = Math.max(minFollowX, vw - visualHalfW - 10);
    const followX = clamp(pose.x, minFollowX, maxFollowX);

    const bossTopY = pose.y - pose.height * 0.5;
    const idealFollowY = bossTopY - 12 - visualHalfH;
    const minFollowY = visualHalfH + 10;
    const maxFollowY = Math.max(minFollowY, vh - visualHalfH - 92);
    const followY = clamp(idealFollowY, minFollowY, maxFollowY);

    const rawGlide = clamp((pose.ageSec - INTRO_HOLD_SEC) / GLIDE_DUR_SEC, 0, 1);
    const easeT = easeInOutCubic(rawGlide);
    const introPop = 0.9 + 0.1 * easeOutCubic(clamp(pose.ageSec / 0.22, 0, 1));

    const curX = centerX + (followX - centerX) * easeT;
    const curY = centerY + (followY - centerY) * easeT;
    const curScale = (1 + (followScale - 1) * easeT) * introPop;

    const tx = curX - baseW * 0.5;
    const ty = curY - baseH * 0.5;
    wrapper.style.transform = `translate3d(${tx.toFixed(2)}px, ${ty.toFixed(2)}px, 0) scale(${curScale.toFixed(4)})`;

    const header = bossIntroHeaderRef.current;
    if (header) {
      const headerAlpha = 1 - clamp((easeT - 0.02) / 0.44, 0, 1);
      header.style.opacity = headerAlpha.toFixed(3);
      header.style.transform = `translate3d(0, ${((1 - headerAlpha) * 6).toFixed(2)}px, 0)`;
    }
  }, []);

  useEffect(() => {
    const unsubProgress = EventBus.on('progress:updated', () => {
      setSavedProgress(StorageManager.load());
    });
    const unsubSettings = EventBus.on('settings:updated', (settings) => {
      setSavedProgress((prev) => ({ ...prev, settings }));
    });
    const unsubPose = EventBus.on('boss:pose', applyBossPose);
    return () => {
      unsubProgress();
      unsubSettings();
      unsubPose();
    };
  }, [applyBossPose]);

  const unlockedWeapons = savedProgress.unlockedWeapons;
  const weaponLevels = savedProgress.weaponLevels;
  const lowFx = savedProgress.settings.fxQuality === 'low';

  useEffect(() => {
    return () => {
      if (dashFlashTimerRef.current) window.clearTimeout(dashFlashTimerRef.current);
      if (specialFlashTimerRef.current) window.clearTimeout(specialFlashTimerRef.current);
      if (bossCloseTimerRef.current) window.clearTimeout(bossCloseTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (hud.bossActive) {
      if (bossCloseTimerRef.current) {
        window.clearTimeout(bossCloseTimerRef.current);
        bossCloseTimerRef.current = null;
      }
      if (!prevBossActiveRef.current) {
        setBossIntroKey((k) => k + 1);
      }
      setBossBarClosing(false);
      setClosingBossData(null);
      lastBossSnapshotRef.current = {
        name: hud.bossName,
        title: hud.bossTitle,
        hp: hud.bossHp,
        maxHp: hud.bossMaxHp,
        phase: hud.bossPhase,
      };
    } else if (prevBossActiveRef.current && lastBossSnapshotRef.current) {
      // Smoothly drain and close the Boss Health Bar right above the defeated Boss
      setClosingBossData({ ...lastBossSnapshotRef.current, hp: 0 });
      setBossBarClosing(true);
      if (bossCloseTimerRef.current) window.clearTimeout(bossCloseTimerRef.current);
      bossCloseTimerRef.current = window.setTimeout(() => {
        setBossBarClosing(false);
        setClosingBossData(null);
        lastBossSnapshotRef.current = null;
        bossCloseTimerRef.current = null;
      }, 320);
    }

    const tookRealDamage =
      hud.bossActive && prevBossActiveRef.current && hud.bossHp < prevBossHpRef.current;
    prevBossActiveRef.current = hud.bossActive;
    prevBossHpRef.current = hud.bossHp;

    if (tookRealDamage) {
      setBossDamageFlash(true);
      const t = window.setTimeout(() => setBossDamageFlash(false), 110);
      return () => window.clearTimeout(t);
    }
  }, [hud.bossActive, hud.bossHp, hud.bossName, hud.bossTitle, hud.bossMaxHp, hud.bossPhase]);

  const activeBossDisplay: BossDisplaySnapshot | null = hud.bossActive
    ? {
        name: hud.bossName,
        title: hud.bossTitle,
        hp: hud.bossHp,
        maxHp: hud.bossMaxHp,
        phase: hud.bossPhase,
      }
    : closingBossData;

  // Apply deterministic initial frame pose when Boss Health Bar mounts
  useEffect(() => {
    if (hud.bossActive) {
      applyBossPose({
        active: true,
        x: window.innerWidth * 0.5,
        y: -130,
        width: hud.bossWidth,
        height: hud.bossHeight,
        ageSec: hud.bossAgeSec,
        entering: hud.bossEntering,
        viewportW: window.innerWidth,
        viewportH: window.innerHeight,
      });
    }
  }, [hud.bossActive, bossIntroKey, applyBossPose, hud.bossWidth, hud.bossHeight, hud.bossAgeSec, hud.bossEntering]);

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
      {/* Cinematic Red Screen-Edge Boss Warning Atmosphere */}
      {bossWarning && (
        <div
          key={warningKey}
          aria-hidden="true"
          style={{
            animationPlayState: isPaused ? 'paused' : 'running',
            background: lowFx
              ? 'radial-gradient(ellipse at 50% 48%, transparent 62%, rgba(225, 29, 72, 0.18) 100%)'
              : 'radial-gradient(ellipse at 50% 48%, transparent 52%, rgba(190, 18, 60, 0.14) 78%, rgba(244, 63, 94, 0.36) 100%)',
            boxShadow: lowFx
              ? 'inset 0 0 42px rgba(244, 63, 94, 0.22)'
              : 'inset 0 0 88px rgba(244, 63, 94, 0.34)',
          }}
          className="boss-warning-atmosphere pointer-events-none fixed inset-0 z-10"
        >
          <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-rose-500/24 via-rose-500/8 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-rose-500/24 via-rose-500/8 to-transparent" />
        </div>
      )}

      {/* Top Telemetry Layer (Integrated Power-Up Circles + Pickup Popups on Left; Score/Mode + Pause on Right) */}
      <div className="relative z-20 flex items-start justify-between gap-2 sm:gap-3">
        <div className="flex flex-col items-start">
          <TelemetryCard
            shipName={hud.shipName}
            creditsEarnedRun={hud.creditsEarnedRun}
            hp={hud.hp}
            maxHp={hud.maxHp}
            shield={hud.shield}
            maxShield={hud.maxShield}
            rapidFireLeftSec={hud.rapidFireLeftSec}
            doubleDamageLeftSec={hud.doubleDamageLeftSec}
            invulnLeftSec={hud.invulnLeftSec}
          />
          <PowerUpToastFeed />
        </div>

        <div className="flex items-start gap-2">
          <ScoreHudCard
            modeLabel={hud.modeLabel}
            levelName={hud.levelName}
            waveLabel={waveLabel}
            score={hud.score}
            combo={hud.combo}
            challengeProgressText={hud.challengeProgressText}
          />

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
            className="pointer-events-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-700/65 bg-[#060c1a]/86 text-cyan-200 shadow-lg shadow-black/30 backdrop-blur-sm transition-[border-color,background-color,transform] duration-150 hover:border-cyan-300/55 hover:bg-[#0d1932] hover:text-white active:scale-90 touch-none focus-visible:outline-2 focus-visible:outline-cyan-300"
          >
            <Pause className="pointer-events-none h-[18px] w-[18px]" />
          </button>
        </div>
      </div>

      {/* Cinematic Two-Stage Center-to-Boss Health Bar (GPU-Composited 60fps Follow) */}
      {activeBossDisplay && (
        <div
          ref={bossBarWrapperRef}
          aria-label="Boss Health"
          style={{
            transformOrigin: 'center center',
            willChange: 'transform',
          }}
          className="pointer-events-none absolute left-0 top-0 z-[25]"
        >
          <BossHealthBar
            name={activeBossDisplay.name}
            title={activeBossDisplay.title}
            hp={activeBossDisplay.hp}
            maxHp={activeBossDisplay.maxHp}
            phase={activeBossDisplay.phase}
            damageFlash={bossDamageFlash}
            closing={bossBarClosing}
            introKey={bossIntroKey}
            introHeaderRef={bossIntroHeaderRef}
          />
        </div>
      )}

      {/* Bottom Perimeter: Compact Dynamic Weapon Selector (Left) + Single-Circle Ability Controls (Right) */}
      <div className="relative z-20 flex items-end justify-between gap-2 pb-1">
        <div className="relative z-30 min-w-0">
          <WeaponSelector
            activeWeaponId={hud.weaponId}
            allowedWeapons={hud.allowedWeapons}
            unlockedWeapons={unlockedWeapons}
            weaponLevels={weaponLevels}
            isPaused={isPaused}
          />
        </div>

        {/* Bottom-Right: Single-Circle SPECIAL & DASH Controls */}
        <div className="relative z-10 mb-1 mr-0.5 flex items-end gap-3 sm:mb-1.5 sm:mr-1 sm:gap-3.5">
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
