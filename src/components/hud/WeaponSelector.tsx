import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronUp, Lock, X } from 'lucide-react';
import { WEAPON_LIST, WEAPONS, WeaponDefinition, WeaponId } from '../../game/config/WeaponConfig';
import { SoundManager } from '../../game/audio/SoundManager';
import { EventBus } from '../../game/utils/EventBus';
import { WeaponVectorIcon } from './HudIcons';

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

export const WeaponSelector = memo<WeaponSelectorProps>(
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
        className="pointer-events-auto relative z-30"
      >
        {/* Expandable Dynamic Scrollable Weapon Panel */}
        {open && !isPaused && (
          <div
            data-hud-control="true"
            data-weapon-selector="true"
            role="dialog"
            aria-label="Weapon Selector"
            onPointerDown={(e) => e.stopPropagation()}
            className={`menu-enter absolute bottom-full left-0 z-40 mb-2 ${panelWidthClass} max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-2xl border border-cyan-400/45 bg-[#060e20]/96 shadow-[0_14px_36px_rgba(2,6,18,0.92)] backdrop-blur-md`}
          >
            <div className="flex items-center justify-between border-b border-cyan-400/15 pl-3 pr-1.5 py-1.5">
              <div className="flex items-center gap-2">
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
