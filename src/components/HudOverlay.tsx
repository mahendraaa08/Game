import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronUp, Lock, Pause, X } from 'lucide-react';
import { HudSnapshot } from '../game/config/GameConfig';
import { POWERUP_CONFIGS, PowerUpType } from '../game/config/PowerUpConfig';
import { WEAPON_LIST, WEAPONS, WeaponDefinition, WeaponId } from '../game/config/WeaponConfig';
import { SoundManager } from '../game/audio/SoundManager';
import { EventBus, PowerUpPickupPayload } from '../game/utils/EventBus';
import { StorageManager } from '../game/utils/StorageManager';

interface HudOverlayProps {
  hud: HudSnapshot;
  bossWarning: { name: string; title: string } | null;
  isPaused?: boolean;
}

function formatCooldownText(sec: number): string {
  if (sec <= 0) return '';
  if (sec < 3) return `${sec.toFixed(1)}s`;
  return `${Math.ceil(sec)}s`;
}

function formatBuffCountdown(sec: number): string {
  if (sec <= 0) return '0s';
  if (sec < 1) return `${sec.toFixed(1)}s`;
  return `${Math.ceil(sec)}s`;
}

/* -------------------------------------------------------------------------- */
/* Dynamic Weapon Icon Renderer (supports all current & future weapons)       */
/* -------------------------------------------------------------------------- */
const WeaponVectorIcon: React.FC<{ weapon: WeaponDefinition; className?: string }> = ({
  weapon,
  className = 'h-4 w-4',
}) => {
  const color = weapon.colorHex;
  switch (weapon.id) {
    case 'plasma':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="4.5" fill={color} fillOpacity="0.28" stroke={color} strokeWidth="1.8" />
          <path d="M12 3V7M12 17V21M3 12H7M17 12H21" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case 'dual_laser':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          <path d="M8 4V20M16 4V20" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
          <path d="M8 7L8 12M16 7L16 12" stroke="#E0F2FE" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      );
    case 'spread':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          <path d="M12 19V5M12 19L5 7M12 19L19 7" stroke={color} strokeWidth="2" strokeLinecap="round" />
          <circle cx="12" cy="5" r="1.6" fill={color} />
          <circle cx="5" cy="7" r="1.6" fill={color} />
          <circle cx="19" cy="7" r="1.6" fill={color} />
        </svg>
      );
    case 'homing':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          <path
            d="M12 3L15.5 9.5L14 15L16.5 19.5L12 17.5L7.5 19.5L10 15L8.5 9.5L12 3Z"
            fill={color}
            fillOpacity="0.26"
            stroke={color}
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'beam':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          <rect x="9.5" y="3" width="5" height="18" rx="2.5" fill={color} fillOpacity="0.3" stroke={color} strokeWidth="1.6" />
          <line x1="12" y1="4" x2="12" y2="20" stroke="#E0F2FE" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    case 'lightning':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          <path
            d="M13.5 3L6 13H12L10.5 21L18 11H12L13.5 3Z"
            fill={color}
            fillOpacity="0.28"
            stroke={color}
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          <polygon
            points="12,3 20,12 12,21 4,12"
            fill={color}
            fillOpacity="0.25"
            stroke={color}
            strokeWidth="1.8"
          />
          <circle cx="12" cy="12" r="2.2" fill={color} />
        </svg>
      );
  }
};

/* -------------------------------------------------------------------------- */
/* Distinct Power-Up Icon Renderer                                            */
/* -------------------------------------------------------------------------- */
const PowerUpVectorIcon: React.FC<{ type: PowerUpType; className?: string }> = ({
  type,
  className = 'h-4 w-4',
}) => {
  switch (type) {
    case 'health':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          <path
            d="M12 5V19M5 12H19"
            stroke="#4ADE80"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'shield':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          <path
            d="M12 3.5L19 6.5V12C19 16.4 15.9 19.9 12 21C8.1 19.9 5 16.4 5 12V6.5L12 3.5Z"
            fill="#38BDF8"
            fillOpacity="0.25"
            stroke="#67E8F9"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'rapid_fire':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          <path
            d="M13.5 3L6.5 13H12L10.5 21L17.5 11H12L13.5 3Z"
            fill="#FBBF24"
            stroke="#FEF08A"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'double_damage':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          <path
            d="M12 3L19 10L16 12L19 16L12 21L5 16L8 12L5 10L12 3Z"
            fill="#EF4444"
            fillOpacity="0.3"
            stroke="#F87171"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="12" r="2.2" fill="#FCA5A5" />
        </svg>
      );
    case 'invulnerability':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          <polygon
            points="12,3 19.5,7.5 19.5,16.5 12,21 4.5,16.5 4.5,7.5"
            fill="#A855F7"
            fillOpacity="0.26"
            stroke="#67E8F9"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="12" r="3" fill="#C4B5FD" />
        </svg>
      );
    case 'mega_bomb':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="5" fill="#A855F7" fillOpacity="0.35" stroke="#E879F9" strokeWidth="1.8" />
          <path
            d="M12 2.5V5.5M12 18.5V21.5M2.5 12H5.5M18.5 12H21.5M5.3 5.3L7.5 7.5M16.5 16.5L18.7 18.7M18.7 5.3L16.5 7.5M7.5 16.5L5.3 18.7"
            stroke="#E879F9"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      );
  }
};

/* -------------------------------------------------------------------------- */
/* Clean Single-Circle Dash & Special Ability Button (Zero Double Circles)    */
/* -------------------------------------------------------------------------- */
interface AbilityCircleButtonProps {
  variant: 'dash' | 'special';
  label: string;
  hotkeyHint: string;
  ratio: number; // 0..1 (1 = ready)
  cooldownLeftSec: number;
  disabled?: boolean;
  lowFx?: boolean;
  sizePx: number;
  accentHex: string;
  secondaryHex: string;
  icon: React.ReactNode;
  activated: boolean;
  onActivate: () => void;
}

const AbilityCircleButton = memo<AbilityCircleButtonProps>(
  ({
    variant,
    label,
    hotkeyHint,
    ratio,
    cooldownLeftSec,
    disabled = false,
    lowFx = false,
    sizePx,
    accentHex,
    secondaryHex,
    icon,
    activated,
    onActivate,
  }) => {
    const activePointerIdRef = useRef<number | null>(null);
    const [pressed, setPressed] = useState(false);

    const clamped = Math.max(0, Math.min(1, ratio));
    const ready = clamped >= 1 && !disabled;
    const strokeWidth = 2.5;
    const radius = (sizePx - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const dashOffset = circumference * (1 - clamped);
    const cooldownLabel =
      !ready && cooldownLeftSec > 0.05 ? formatCooldownText(cooldownLeftSec) : '';

    const releasePointer = (pointerId: number) => {
      if (activePointerIdRef.current === pointerId) {
        activePointerIdRef.current = null;
        setPressed(false);
      }
    };

    const backgroundStyle: React.CSSProperties = {
      width: sizePx,
      height: sizePx,
      background:
        variant === 'special'
          ? ready
            ? 'radial-gradient(circle at 32% 28%, rgba(168, 85, 247, 0.28), rgba(14, 11, 34, 0.90) 68%, rgba(6, 10, 24, 0.96) 100%)'
            : 'radial-gradient(circle at 50% 40%, rgba(20, 16, 40, 0.80), rgba(7, 10, 22, 0.88) 100%)'
          : ready
          ? 'radial-gradient(circle at 32% 28%, rgba(56, 189, 248, 0.24), rgba(8, 22, 46, 0.90) 68%, rgba(5, 11, 24, 0.96) 100%)'
          : 'radial-gradient(circle at 50% 40%, rgba(10, 18, 36, 0.80), rgba(5, 10, 20, 0.88) 100%)',
      boxShadow: ready
        ? lowFx
          ? `0 0 8px ${accentHex}2a`
          : `0 6px 18px rgba(2, 6, 18, 0.65), 0 0 16px ${accentHex}33`
        : '0 4px 12px rgba(2, 6, 18, 0.5)',
    };

    return (
      <button
        type="button"
        data-hud-control="true"
        aria-label={`${label} (${hotkeyHint})${cooldownLabel ? ` recharging ${cooldownLabel}` : ''}`}
        aria-disabled={!ready}
        onPointerDown={(e) => {
          e.preventDefault();
          if (activePointerIdRef.current !== null && activePointerIdRef.current !== e.pointerId) {
            return;
          }
          activePointerIdRef.current = e.pointerId;
          if (!ready) return;
          setPressed(true);
          onActivate();
        }}
        onPointerUp={(e) => releasePointer(e.pointerId)}
        onPointerCancel={(e) => releasePointer(e.pointerId)}
        onLostPointerCapture={(e) => releasePointer(e.pointerId)}
        onClick={(e) => {
          if (e.detail === 0 && ready) onActivate();
        }}
        style={backgroundStyle}
        className={`pointer-events-auto relative flex flex-col items-center justify-center overflow-hidden rounded-full border-0 transition-[transform,filter,opacity] duration-150 select-none touch-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 ${
          ready
            ? variant === 'special'
              ? 'text-purple-100 hover:brightness-110'
              : 'text-sky-100 hover:brightness-110'
            : 'text-slate-400 opacity-85 cursor-not-allowed'
        } ${pressed || activated ? 'scale-92 brightness-125' : ''}`}
      >
        {/* Subtle Internal Activation Flash (stays inside the single circle) */}
        {activated && !lowFx && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-full opacity-45"
            style={{
              background: `radial-gradient(circle, ${accentHex}80 0%, transparent 70%)`,
            }}
          />
        )}

        {/* Single Flush Perimeter Edge & Cooldown Sweep Arc */}
        <svg
          width={sizePx}
          height={sizePx}
          viewBox={`0 0 ${sizePx} ${sizePx}`}
          className="pointer-events-none absolute inset-0 -rotate-90"
          aria-hidden="true"
        >
          <circle
            cx={sizePx / 2}
            cy={sizePx / 2}
            r={radius}
            fill="none"
            stroke="rgba(148, 163, 184, 0.2)"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={sizePx / 2}
            cy={sizePx / 2}
            r={radius}
            fill="none"
            stroke={ready ? accentHex : disabled ? '#475569' : secondaryHex}
            strokeOpacity={ready ? 0.92 : 0.78}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
          />
        </svg>

        {/* Core Icon + Status Label / Seconds */}
        <div className="pointer-events-none relative z-10 flex flex-col items-center justify-center leading-none">
          {cooldownLabel ? (
            <>
              <span
                className={`font-mono-num font-bold tracking-tight ${
                  variant === 'special' ? 'text-[13px] text-purple-200' : 'text-xs text-sky-200'
                }`}
              >
                {cooldownLabel}
              </span>
              <span className="mt-0.5 font-display text-[8.5px] font-semibold tracking-wider text-slate-400">
                {label}
              </span>
            </>
          ) : (
            <>
              <div className={disabled ? 'opacity-45' : ''}>{icon}</div>
              <span className="mt-0.5 font-display text-[9px] font-bold tracking-wider">
                {label}
              </span>
            </>
          )}
        </div>
      </button>
    );
  }
);
AbilityCircleButton.displayName = 'AbilityCircleButton';

/* -------------------------------------------------------------------------- */
/* Compact Dynamic Expandable Weapon Selector                                 */
/* -------------------------------------------------------------------------- */
interface WeaponSelectorProps {
  activeWeaponId: WeaponId;
  allowedWeapons: WeaponId[] | null;
  unlockedWeapons: WeaponId[];
  weaponLevels: Record<WeaponId, number>;
  isPaused: boolean;
}

interface WeaponGestureState {
  pointerId: number;
  weaponId: WeaponId;
  startX: number;
  startY: number;
  startScrollTop: number;
  moved: boolean;
}

const WeaponSelector = memo<WeaponSelectorProps>(
  ({ activeWeaponId, allowedWeapons, unlockedWeapons, weaponLevels, isPaused }) => {
    const [open, setOpen] = useState(false);
    const [confirmPulse, setConfirmPulse] = useState(false);
    const prevWeaponRef = useRef<WeaponId>(activeWeaponId);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const scrollContainerRef = useRef<HTMLDivElement | null>(null);
    const itemGestureRef = useRef<WeaponGestureState | null>(null);

    const activeDef = WEAPONS[activeWeaponId] ?? WEAPON_LIST[0];

    // Subtle confirmation pulse whenever active weapon changes (tap or hotkey)
    useEffect(() => {
      if (prevWeaponRef.current !== activeWeaponId) {
        prevWeaponRef.current = activeWeaponId;
        setConfirmPulse(true);
        const t = window.setTimeout(() => setConfirmPulse(false), 280);
        return () => window.clearTimeout(t);
      }
    }, [activeWeaponId]);

    // Auto-close panel if paused
    useEffect(() => {
      if (isPaused && open) {
        setOpen(false);
        itemGestureRef.current = null;
      }
    }, [isPaused, open]);

    // Close only when pointerdown starts strictly outside the WeaponSelector container, or on Escape
    useEffect(() => {
      if (!open) return;
      const onPointerDown = (e: PointerEvent) => {
        const target = e.target as Node | null;
        if (target && containerRef.current && !containerRef.current.contains(target)) {
          itemGestureRef.current = null;
          setOpen(false);
        }
      };
      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          itemGestureRef.current = null;
          setOpen(false);
        }
      };
      document.addEventListener('pointerdown', onPointerDown, { passive: true });
      window.addEventListener('keydown', onKeyDown);
      return () => {
        document.removeEventListener('pointerdown', onPointerDown);
        window.removeEventListener('keydown', onKeyDown);
      };
    }, [open]);

    const sortedWeapons = useMemo(() => {
      const available: WeaponDefinition[] = [];
      const locked: WeaponDefinition[] = [];
      for (const w of WEAPON_LIST) {
        const isOwned = unlockedWeapons.includes(w.id);
        const isAllowed = !allowedWeapons || allowedWeapons.includes(w.id);
        if (isOwned && isAllowed) {
          available.push(w);
        } else {
          locked.push(w);
        }
      }
      return [...available, ...locked];
    }, [unlockedWeapons, allowedWeapons]);

    const gridColsClass =
      sortedWeapons.length <= 2 ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2';
    const panelWidthClass =
      sortedWeapons.length <= 2
        ? 'w-[min(86vw,264px)]'
        : 'w-[min(88vw,380px)] sm:w-[416px]';

    const selectWeapon = (weapon: WeaponDefinition) => {
      if (isPaused) return;
      SoundManager.unlock();
      SoundManager.playButtonClick();
      EventBus.emit('ui:select-weapon', weapon.id);
      itemGestureRef.current = null;
      setOpen(false);
    };

    const closePanel = () => {
      SoundManager.playButtonClick();
      itemGestureRef.current = null;
      setOpen(false);
    };

    return (
      <div
        ref={containerRef}
        data-hud-control="true"
        data-weapon-selector="true"
        className="pointer-events-auto relative"
      >
        {/* Expandable Dynamic Scrollable Weapon Panel */}
        {open && !isPaused && (
          <div
            data-hud-control="true"
            data-weapon-selector="true"
            role="dialog"
            aria-label="Weapon Selector"
            className={`menu-enter absolute bottom-full left-0 mb-2 ${panelWidthClass} max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-2xl border border-cyan-400/35 bg-[#060e20]/94 shadow-[0_12px_32px_rgba(2,6,18,0.85)] backdrop-blur-sm`}
          >
            <div className="flex items-center justify-between border-b border-cyan-400/15 pl-3 pr-1.5 py-1.5">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                <span className="font-display text-[11px] font-bold tracking-[0.14em] text-cyan-200">
                  SELECT WEAPON
                </span>
                <span className="font-mono-num text-[10px] text-slate-400">
                  {sortedWeapons.filter(
                    (w) =>
                      unlockedWeapons.includes(w.id) &&
                      (!allowedWeapons || allowedWeapons.includes(w.id))
                  ).length}
                  /{WEAPON_LIST.length} READY
                </span>
              </div>

              <button
                type="button"
                data-hud-control="true"
                data-weapon-selector="true"
                aria-label="Close weapon selector"
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  closePanel();
                }}
                onClick={(e) => {
                  if (e.detail === 0) closePanel();
                }}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-800/80 hover:text-white active:scale-90 touch-none"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div
              ref={scrollContainerRef}
              data-hud-control="true"
              data-weapon-selector="true"
              onScroll={() => {
                if (!itemGestureRef.current || !scrollContainerRef.current) return;
                const delta = Math.abs(
                  scrollContainerRef.current.scrollTop - itemGestureRef.current.startScrollTop
                );
                if (delta > 4) {
                  itemGestureRef.current.moved = true;
                }
              }}
              className={`scroll-panel grid ${gridColsClass} gap-2 overflow-y-auto overscroll-contain touch-pan-y p-2 max-h-[min(48dvh,310px)]`}
            >
              {sortedWeapons.map((w) => {
                const isOwned = unlockedWeapons.includes(w.id);
                const isAllowed = !allowedWeapons || allowedWeapons.includes(w.id);
                const available = isOwned && isAllowed;
                const active = activeWeaponId === w.id;
                const lvl = weaponLevels[w.id] ?? 1;

                return (
                  <button
                    key={w.id}
                    type="button"
                    disabled={!available}
                    data-hud-control="true"
                    data-weapon-selector="true"
                    aria-disabled={!available}
                    aria-pressed={active}
                    onPointerDown={(e) => {
                      if (!available || isPaused) return;
                      itemGestureRef.current = {
                        pointerId: e.pointerId,
                        weaponId: w.id,
                        startX: e.clientX,
                        startY: e.clientY,
                        startScrollTop: scrollContainerRef.current?.scrollTop ?? 0,
                        moved: false,
                      };
                    }}
                    onPointerMove={(e) => {
                      const g = itemGestureRef.current;
                      if (!g || g.pointerId !== e.pointerId) return;
                      const dist = Math.hypot(e.clientX - g.startX, e.clientY - g.startY);
                      const scrollDelta = Math.abs(
                        (scrollContainerRef.current?.scrollTop ?? 0) - g.startScrollTop
                      );
                      if (dist > 8 || scrollDelta > 4) {
                        g.moved = true;
                      }
                    }}
                    onPointerUp={(e) => {
                      const g = itemGestureRef.current;
                      itemGestureRef.current = null;
                      if (!g || g.pointerId !== e.pointerId || g.weaponId !== w.id) return;
                      const dist = Math.hypot(e.clientX - g.startX, e.clientY - g.startY);
                      const scrollDelta = Math.abs(
                        (scrollContainerRef.current?.scrollTop ?? 0) - g.startScrollTop
                      );
                      if (!g.moved && dist <= 8 && scrollDelta <= 4 && available && !isPaused) {
                        selectWeapon(w);
                      }
                    }}
                    onPointerCancel={() => {
                      itemGestureRef.current = null;
                    }}
                    onClick={(e) => {
                      if (e.detail === 0 && available && !isPaused) {
                        selectWeapon(w);
                      }
                    }}
                    className={`group flex min-h-[56px] w-full items-start gap-2.5 rounded-xl border px-2.5 py-2 text-left transition-colors duration-150 touch-pan-y select-none ${
                      !available
                        ? 'cursor-not-allowed border-slate-800/80 bg-[#050a16]/55 opacity-50'
                        : active
                        ? 'border-cyan-300/75 bg-gradient-to-br from-cyan-500/18 via-sky-500/10 to-[#09152c]/95 shadow-[inset_0_0_12px_rgba(34,211,238,0.14)]'
                        : 'border-slate-800/90 bg-[#081226]/82 hover:border-cyan-400/45 hover:bg-[#0d1c38]'
                    }`}
                  >
                    {/* Weapon Icon Badge */}
                    <div
                      className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border"
                      style={{
                        borderColor: available ? `${w.colorHex}55` : 'rgba(51,65,85,0.5)',
                        backgroundColor: available ? `${w.colorHex}18` : 'rgba(15,23,42,0.6)',
                      }}
                    >
                      {available ? (
                        <WeaponVectorIcon weapon={w} className="h-4 w-4" />
                      ) : (
                        <Lock className="h-3.5 w-3.5 text-slate-500" />
                      )}
                    </div>

                    {/* Weapon Metadata */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="truncate font-display text-xs font-bold text-white">
                          {w.name}
                        </span>
                        {active ? (
                          <span className="inline-flex shrink-0 items-center gap-0.5 rounded bg-cyan-400/20 px-1.5 py-0.5 font-mono-num text-[9px] font-bold text-cyan-200">
                            <Check className="h-2.5 w-2.5" />
                            ACTIVE
                          </span>
                        ) : available ? (
                          <span className="shrink-0 font-mono-num text-[9.5px] font-semibold text-slate-400">
                            #{w.hotkey}
                          </span>
                        ) : (
                          <span className="shrink-0 rounded bg-slate-800/90 px-1.5 py-0.5 font-mono-num text-[9px] font-semibold text-slate-400">
                            {isOwned ? 'RESTRICTED' : 'LOCKED'}
                          </span>
                        )}
                      </div>

                      <div className="mt-0.5 flex items-center gap-1.5 text-[10px]">
                        <span style={{ color: available ? w.colorHex : '#64748B' }} className="font-semibold">
                          {w.typeLabel || w.rangeLabel}
                        </span>
                        {available && (
                          <>
                            <span className="text-slate-600">·</span>
                            <span className="font-mono-num text-slate-400">Lv.{lvl}</span>
                          </>
                        )}
                      </div>

                      <p className="mt-0.5 line-clamp-1 text-[10px] leading-tight text-slate-400">
                        {w.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Primary Compact Trigger Selector */}
        <button
          type="button"
          data-hud-control="true"
          data-weapon-selector="true"
          disabled={isPaused}
          aria-expanded={open}
          aria-label={`Active weapon: ${activeDef.name}. Tap to switch weapon.`}
          onPointerDown={(e) => {
            e.preventDefault();
            if (isPaused) return;
            SoundManager.unlock();
            SoundManager.playButtonClick();
            setOpen((prev) => !prev);
          }}
          onClick={(e) => {
            if (e.detail === 0 && !isPaused) {
              SoundManager.unlock();
              SoundManager.playButtonClick();
              setOpen((prev) => !prev);
            }
          }}
          style={{
            borderColor: open ? activeDef.colorHex : 'rgba(56, 189, 248, 0.30)',
          }}
          className={`flex min-h-[46px] items-center gap-2.5 rounded-xl border bg-[#050c1d]/88 px-3 py-1.5 text-left shadow-[0_6px_18px_rgba(2,6,18,0.65)] backdrop-blur-sm transition-[border-color,background-color,transform] duration-150 hover:bg-[#09152e] active:scale-95 touch-none focus-visible:outline-2 focus-visible:outline-cyan-300 ${
            confirmPulse ? 'hud-confirm-flash' : ''
          }`}
        >
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border"
            style={{
              borderColor: `${activeDef.colorHex}55`,
              backgroundColor: `${activeDef.colorHex}1C`,
            }}
          >
            <WeaponVectorIcon weapon={activeDef} className="h-4 w-4" />
          </div>

          <div className="min-w-0 pr-0.5">
            <div className="flex items-center gap-1.5">
              <span className="font-mono-num text-[9.5px] font-bold text-cyan-300/85">
                #{activeDef.hotkey}
              </span>
              <span className="max-w-[92px] sm:max-w-[120px] truncate font-display text-xs font-bold tracking-wide text-white">
                {activeDef.shortName}
              </span>
            </div>
            <div className="font-mono-num text-[9.5px] text-slate-400">
              {activeDef.typeLabel || activeDef.rangeLabel}
            </div>
          </div>

          <ChevronUp
            className={`h-3.5 w-3.5 shrink-0 text-cyan-300/80 transition-transform duration-150 ${
              open ? 'rotate-180' : ''
            }`}
          />
        </button>
      </div>
    );
  }
);
WeaponSelector.displayName = 'WeaponSelector';

/* -------------------------------------------------------------------------- */
/* Active Power-Up Circular Countdown Row & Transient Pickup Toasts           */
/* -------------------------------------------------------------------------- */
interface ActiveBuffEntry {
  type: 'rapid_fire' | 'double_damage' | 'invulnerability';
  leftSec: number;
  durationSec: number;
  pulseKey: number;
  exiting: boolean;
}

const ActivePowerUpsBar = memo<{
  rapidFireLeftSec: number;
  doubleDamageLeftSec: number;
  invulnLeftSec: number;
}>(({ rapidFireLeftSec, doubleDamageLeftSec, invulnLeftSec }) => {
  const [entries, setEntries] = useState<ActiveBuffEntry[]>([]);
  const prevSecRef = useRef<Record<string, number>>({});
  const exitTimersRef = useRef<Record<string, number>>({});

  useEffect(() => {
    const syncList: Array<{
      type: 'rapid_fire' | 'double_damage' | 'invulnerability';
      left: number;
    }> = [
      { type: 'rapid_fire', left: rapidFireLeftSec },
      { type: 'double_damage', left: doubleDamageLeftSec },
      { type: 'invulnerability', left: invulnLeftSec },
    ];

    setEntries((prev) => {
      const byType = new Map<string, ActiveBuffEntry>();
      prev.forEach((item) => byType.set(item.type, item));

      for (const { type, left } of syncList) {
        const prevLeft = prevSecRef.current[type] ?? 0;
        const durationSec = POWERUP_CONFIGS[type].durationSec;
        const existing = byType.get(type);

        if (left > 0) {
          if (exitTimersRef.current[type]) {
            window.clearTimeout(exitTimersRef.current[type]);
            delete exitTimersRef.current[type];
          }
          const refreshed = prevLeft <= 0 || left > prevLeft + 0.5;
          byType.set(type, {
            type,
            leftSec: left,
            durationSec,
            pulseKey: refreshed ? (existing?.pulseKey ?? 0) + 1 : existing?.pulseKey ?? 1,
            exiting: false,
          });
        } else if (existing && !existing.exiting) {
          byType.set(type, { ...existing, leftSec: 0, exiting: true });
          exitTimersRef.current[type] = window.setTimeout(() => {
            setEntries((curr) => curr.filter((e) => e.type !== type || !e.exiting));
            delete exitTimersRef.current[type];
          }, 220);
        }
        prevSecRef.current[type] = left;
      }

      return Array.from(byType.values());
    });
  }, [rapidFireLeftSec, doubleDamageLeftSec, invulnLeftSec]);

  useEffect(() => {
    return () => {
      Object.values(exitTimersRef.current).forEach((t) => window.clearTimeout(t));
    };
  }, []);

  if (entries.length === 0) return null;

  const sizePx = 42;
  const strokeWidth = 2.5;
  const radius = (sizePx - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div
      aria-label="Active power-ups"
      className="pointer-events-none mt-1.5 flex flex-wrap items-center gap-2"
    >
      {entries.map((entry) => {
        const def = POWERUP_CONFIGS[entry.type];
        const ratio = Math.max(0, Math.min(1, entry.leftSec / Math.max(1, entry.durationSec)));
        const dashOffset = circumference * (1 - ratio);

        return (
          <div
            key={`${entry.type}-${entry.pulseKey}`}
            className={`powerup-enter flex flex-col items-center transition-all duration-200 ${
              entry.exiting ? 'scale-75 opacity-0' : 'scale-100 opacity-100'
            }`}
          >
            <div
              style={{
                width: sizePx,
                height: sizePx,
                boxShadow: `0 4px 12px rgba(2, 6, 18, 0.6), 0 0 12px ${def.colorHex}28`,
              }}
              className="relative flex items-center justify-center rounded-full bg-[#060d1f]/88"
            >
              <svg
                width={sizePx}
                height={sizePx}
                viewBox={`0 0 ${sizePx} ${sizePx}`}
                className="pointer-events-none absolute inset-0 -rotate-90"
                aria-hidden="true"
              >
                <circle
                  cx={sizePx / 2}
                  cy={sizePx / 2}
                  r={radius}
                  fill="none"
                  stroke="rgba(148, 163, 184, 0.2)"
                  strokeWidth={strokeWidth}
                />
                <circle
                  cx={sizePx / 2}
                  cy={sizePx / 2}
                  r={radius}
                  fill="none"
                  stroke={def.colorHex}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                />
              </svg>
              <PowerUpVectorIcon type={entry.type} className="relative z-10 h-4 w-4" />
            </div>
            <span
              style={{ color: def.colorHex }}
              className="mt-0.5 rounded bg-[#050b1a]/88 px-1.5 py-[1px] font-mono-num text-[9.5px] font-bold leading-tight"
            >
              {formatBuffCountdown(entry.leftSec)}
            </span>
          </div>
        );
      })}
    </div>
  );
});
ActivePowerUpsBar.displayName = 'ActivePowerUpsBar';

interface PickupToast {
  uid: number;
  payload: PowerUpPickupPayload;
  exiting: boolean;
}

const PowerUpToastFeed: React.FC = () => {
  const [toasts, setToasts] = useState<PickupToast[]>([]);
  const nextUidRef = useRef(1);
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    const unsub = EventBus.on('powerup:collected', (payload) => {
      const uid = nextUidRef.current++;
      setToasts((prev) => [...prev.slice(-2), { uid, payload, exiting: false }]);

      const fadeTimer = window.setTimeout(() => {
        setToasts((prev) => prev.map((t) => (t.uid === uid ? { ...t, exiting: true } : t)));
      }, 1500);
      const removeTimer = window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.uid !== uid));
      }, 1820);
      timersRef.current.push(fadeTimer, removeTimer);
    });

    return () => {
      unsub();
      timersRef.current.forEach((t) => window.clearTimeout(t));
      timersRef.current = [];
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none mt-1.5 flex flex-col items-start gap-1.5">
      {toasts.map(({ uid, payload, exiting }) => {
        const def = POWERUP_CONFIGS[payload.type];
        let title = def.shortLabel;
        let detail = '';

        if (payload.type === 'health') {
          title = 'HEALTH';
          detail = payload.amountRestored > 0 ? `+${payload.amountRestored} HP` : 'FULL HP';
        } else if (payload.type === 'shield') {
          title = 'SHIELD';
          detail =
            payload.amountRestored > 0
              ? `+${payload.amountRestored} SHD`
              : payload.isFull
              ? 'MAX SHIELD'
              : 'CHARGED';
        } else if (payload.type === 'mega_bomb') {
          title = 'MEGA BOMB';
          detail = 'SECTOR BLAST';
        } else if (payload.durationSec > 0) {
          detail = `${payload.durationSec}s`;
        }

        return (
          <div
            key={uid}
            style={{
              borderColor: `${def.colorHex}55`,
              boxShadow: `0 4px 14px rgba(2, 6, 18, 0.55), 0 0 10px ${def.colorHex}20`,
            }}
            className={`powerup-enter flex items-center gap-2 rounded-full border bg-[#060e21]/88 py-1 pl-1 pr-3 backdrop-blur-sm transition-all duration-300 ${
              exiting ? '-translate-y-1 opacity-0' : 'translate-y-0 opacity-100'
            }`}
          >
            <div
              style={{
                borderColor: `${def.colorHex}70`,
                backgroundColor: `${def.colorHex}20`,
              }}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border"
            >
              <PowerUpVectorIcon type={payload.type} className="h-3.5 w-3.5" />
            </div>
            <div className="flex items-center gap-1.5 leading-none">
              <span className="font-display text-[10px] font-bold tracking-wider text-white">
                {title}
              </span>
              {detail && (
                <span
                  style={{ color: def.colorHex }}
                  className="font-mono-num text-[10px] font-bold"
                >
                  {detail}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Boss Health Bar                                                            */
/* -------------------------------------------------------------------------- */
interface BossHealthBarProps {
  name: string;
  hp: number;
  maxHp: number;
  phase: 1 | 2 | 3;
  damageFlash: boolean;
}

const BossHealthBar = memo<BossHealthBarProps>(
  ({ name, hp, maxHp, phase, damageFlash }) => {
    const pct = Math.max(0, Math.min(100, (hp / Math.max(1, maxHp)) * 100));

    return (
      <div
        className={`w-full rounded-xl border transition-colors duration-150 backdrop-blur-sm px-3 py-1.5 lg:px-4 lg:py-2 ${
          damageFlash
            ? 'border-rose-300 bg-[#1a0718]/92 shadow-[0_0_18px_rgba(244,63,94,0.36)]'
            : 'border-rose-500/45 bg-[#090412]/88 shadow-[0_6px_16px_rgba(2,6,18,0.55)]'
        }`}
      >
        <div className="mb-1 flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate font-display text-xs sm:text-sm font-bold tracking-wider text-rose-300">
              {name}
            </span>
            <div className="flex items-center gap-0.5" aria-label={`Phase ${phase} of 3`}>
              {[1, 2, 3].map((p) => (
                <span
                  key={p}
                  className={`h-1.5 w-3 rounded-[2px] transition-colors ${
                    p <= phase ? 'bg-rose-400' : 'bg-slate-800'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="shrink-0 font-mono-num text-[11px] sm:text-xs font-semibold text-slate-200">
            <span>{hp.toLocaleString()}</span>
            <span className="mx-1 text-slate-500">·</span>
            <span className="text-rose-300">{Math.ceil(pct)}%</span>
          </div>
        </div>

        <div className="relative h-2 lg:h-2.5 w-full overflow-hidden rounded-sm bg-slate-950/95 ring-1 ring-inset ring-rose-500/25">
          <div
            className="absolute inset-y-0 left-0 bg-amber-300/60 transition-[width] duration-300 ease-out"
            style={{ width: `${pct}%` }}
          />
          <div
            className={`relative h-full transition-[width] duration-100 ${
              damageFlash
                ? 'bg-gradient-to-r from-rose-400 via-pink-400 to-amber-300'
                : 'bg-gradient-to-r from-rose-600 via-rose-500 to-fuchsia-500'
            }`}
            style={{ width: `${pct}%` }}
          />
          <span className="pointer-events-none absolute inset-y-0 left-[33.33%] w-px bg-slate-950/80" />
          <span className="pointer-events-none absolute inset-y-0 left-[66.66%] w-px bg-slate-950/80" />
        </div>
      </div>
    );
  }
);
BossHealthBar.displayName = 'BossHealthBar';

/* -------------------------------------------------------------------------- */
/* Top-Left Telemetry Card (Memoized)                                         */
/* -------------------------------------------------------------------------- */
const TelemetryCard = memo<{
  shipName: string;
  creditsEarnedRun: number;
  hp: number;
  maxHp: number;
  shield: number;
  maxShield: number;
}>(({ shipName, creditsEarnedRun, hp, maxHp, shield, maxShield }) => {
  const hpPct = Math.max(0, Math.min(100, (hp / Math.max(1, maxHp)) * 100));
  const shieldPct =
    maxShield > 0 ? Math.max(0, Math.min(100, (shield / maxShield) * 100)) : 0;

  return (
    <div className="flex min-w-[134px] sm:min-w-[188px] flex-col gap-1.5 rounded-xl border border-cyan-400/22 bg-[#050b1a]/80 px-2.5 py-2 backdrop-blur-sm sm:px-3">
      <div className="flex items-center justify-between gap-2 text-[10px] font-semibold">
        <span className="truncate font-display tracking-wide text-cyan-300">{shipName}</span>
        <span className="font-mono-num text-[10px] text-amber-300">+{creditsEarnedRun} CR</span>
      </div>

      <div>
        <div className="mb-0.5 flex items-center justify-between text-[10px] sm:text-[11px] font-semibold">
          <span className="text-slate-300">Hull</span>
          <span className="font-mono-num text-emerald-300">
            {hp}/{maxHp}
          </span>
        </div>
        <div className="h-1.5 sm:h-2 w-28 sm:w-40 overflow-hidden rounded-full bg-slate-900/95 ring-1 ring-inset ring-white/5">
          <div
            className={`h-full rounded-full transition-all duration-100 ${
              hpPct > 45 ? 'bg-emerald-400' : hpPct > 22 ? 'bg-amber-400' : 'bg-rose-500'
            }`}
            style={{ width: `${hpPct}%` }}
          />
        </div>
      </div>

      <div>
        <div className="mb-0.5 flex items-center justify-between text-[10px] sm:text-[11px] font-semibold">
          <span className="text-slate-300">Shield</span>
          <span className="font-mono-num text-sky-300">
            {maxShield > 0 ? `${shield}/${maxShield}` : 'Offline'}
          </span>
        </div>
        <div className="h-1.5 w-28 sm:w-40 overflow-hidden rounded-full bg-slate-900/95 ring-1 ring-inset ring-white/5">
          <div
            className="h-full rounded-full bg-sky-400 transition-all duration-100"
            style={{ width: `${shieldPct}%` }}
          />
        </div>
      </div>
    </div>
  );
});
TelemetryCard.displayName = 'TelemetryCard';

/* -------------------------------------------------------------------------- */
/* Main HudOverlay                                                            */
/* -------------------------------------------------------------------------- */
export const HudOverlay: React.FC<HudOverlayProps> = ({
  hud,
  bossWarning,
  isPaused = false,
}) => {
  const [dashActivated, setDashActivated] = useState(false);
  const [specialActivated, setSpecialActivated] = useState(false);
  const [bossDamageFlash, setBossDamageFlash] = useState(false);
  const prevBossActiveRef = useRef<boolean>(hud.bossActive);
  const prevBossHpRef = useRef<number>(hud.bossHp);
  const dashFlashTimerRef = useRef<number | null>(null);
  const specialFlashTimerRef = useRef<number | null>(null);

  const saved = useMemo(() => StorageManager.load(), []);
  const unlockedWeapons = saved.unlockedWeapons;
  const weaponLevels = saved.weaponLevels;
  const lowFx = saved.settings.fxQuality === 'low';

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
