import React, { useEffect, useMemo, useState } from 'react';
import { Check, Coins, Gem, Lock, Shield, Zap } from 'lucide-react';
import { GAME_CONSTANTS } from '../../game/config/GameConfig';
import { getShipBaseMoveSpeedPx, SHIP_LIST, ShipId, SHIPS } from '../../game/config/ShipConfig';
import { SPECIAL_LIST, SpecialId } from '../../game/config/WeaponConfig';
import { SoundManager } from '../../game/audio/SoundManager';
import { evaluateGlobalNotifications } from '../../game/systems/NotificationStatus';
import { ActionResult, ProgressionManager } from '../../game/systems/ProgressionManager';
import { EventBus } from '../../game/utils/EventBus';
import { PlayerProgress } from '../../game/utils/StorageManager';
import { HorizontalSwipeStrip } from '../ui/HorizontalSwipeStrip';
import { NotificationDot } from '../ui/NotificationDot';
import { ActionConfirmDialog, PendingHangarAction } from './ActionConfirmDialog';
import { ShipArtBadge } from './ShipArtBadge';

interface HangarShipsPanelProps {
  progress: PlayerProgress;
  onFeedback: (res: ActionResult) => void;
  inspectedShipId?: ShipId;
  onInspectShip?: (id: ShipId) => void;
}

const STAT_MAX = {
  maxHp: Math.max(...SHIP_LIST.map((s) => s.stats.maxHp)),
  maxShield: Math.max(...SHIP_LIST.map((s) => s.stats.maxShield)),
  moveSpeed: Math.max(...SHIP_LIST.map((s) => s.stats.moveSpeed)),
  damageMult: Math.max(...SHIP_LIST.map((s) => s.stats.damageMult)),
  fireRateMult: Math.max(...SHIP_LIST.map((s) => s.stats.fireRateMult)),
  critChance: Math.max(...SHIP_LIST.map((s) => s.stats.critChance)),
  critDamage: Math.max(...SHIP_LIST.map((s) => s.stats.critDamage)),
};

export const HangarShipsPanel: React.FC<HangarShipsPanelProps> = ({
  progress,
  onFeedback,
  inspectedShipId,
  onInspectShip,
}) => {
  const [localInspectId, setLocalInspectId] = useState<ShipId>(
    inspectedShipId ?? progress.selectedShip
  );
  const [compareMode, setCompareMode] = useState<boolean>(true);
  const [pendingAction, setPendingAction] = useState<PendingHangarAction | null>(null);

  const inspectId = inspectedShipId ?? localInspectId;
  const setInspectId = (id: ShipId) => {
    setLocalInspectId(id);
    onInspectShip?.(id);
  };

  useEffect(() => {
    setPendingAction(null);
  }, [inspectId]);

  const notifications = useMemo(() => evaluateGlobalNotifications(progress), [progress]);
  const inspected = SHIPS[inspectId] ?? SHIPS.falcon_x;
  const equipped = SHIPS[progress.selectedShip] ?? SHIPS.falcon_x;
  const isUnlocked = progress.unlockedShips.includes(inspected.id);
  const isEquipped = progress.selectedShip === inspected.id;

  const currentSpecial =
    SPECIAL_LIST.find((s) => s.id === progress.selectedSpecial) ?? SPECIAL_LIST[0];

  const statRows = [
    {
      label: 'Hull Integrity',
      val: inspected.stats.maxHp,
      eq: equipped.stats.maxHp,
      max: STAT_MAX.maxHp,
      fmt: (v: number) => `${v}`,
      fmtDelta: (d: number) => `${d > 0 ? '+' : ''}${Math.round(d)}`,
    },
    {
      label: 'Shield Capacity',
      val: inspected.stats.maxShield,
      eq: equipped.stats.maxShield,
      max: STAT_MAX.maxShield,
      fmt: (v: number) => `${v}`,
      fmtDelta: (d: number) => `${d > 0 ? '+' : ''}${Math.round(d)}`,
    },
    {
      label: 'Thruster Speed',
      val: inspected.stats.moveSpeed,
      eq: equipped.stats.moveSpeed,
      max: STAT_MAX.moveSpeed,
      fmt: (v: number) => `${v.toFixed(2)}x (${Math.round(GAME_CONSTANTS.PLAYER_SPEED * v)} px/s)`,
      fmtDelta: (d: number) => `${d > 0 ? '+' : ''}${Math.round(d * 100)}%`,
    },
    {
      label: 'Weapon Power',
      val: inspected.stats.damageMult,
      eq: equipped.stats.damageMult,
      max: STAT_MAX.damageMult,
      fmt: (v: number) => `${Math.round(v * 100)}%`,
      fmtDelta: (d: number) => `${d > 0 ? '+' : ''}${Math.round(d * 100)}%`,
    },
    {
      label: 'Fire Cadence',
      val: inspected.stats.fireRateMult,
      eq: equipped.stats.fireRateMult,
      max: STAT_MAX.fireRateMult,
      fmt: (v: number) => `${Math.round(v * 100)}%`,
      fmtDelta: (d: number) => `${d > 0 ? '+' : ''}${Math.round(d * 100)}%`,
    },
    {
      label: 'Critical Rate',
      val: inspected.stats.critChance,
      eq: equipped.stats.critChance,
      max: STAT_MAX.critChance,
      fmt: (v: number) => `${Math.round(v * 100)}%`,
      fmtDelta: (d: number) => `${d > 0 ? '+' : ''}${Math.round(d * 100)}%`,
    },
    {
      label: 'Critical Damage',
      val: inspected.stats.critDamage,
      eq: equipped.stats.critDamage,
      max: STAT_MAX.critDamage,
      fmt: (v: number) => `${v.toFixed(2)}x`,
      fmtDelta: (d: number) => `${d > 0 ? '+' : ''}${d.toFixed(2)}x`,
    },
  ];

  const openShipEquipConfirm = () => {
    SoundManager.unlock();
    SoundManager.playButtonClick();
    setPendingAction({
      id: `equip-ship-${inspected.id}`,
      category: 'equip',
      title: 'Confirm Equip',
      itemName: inspected.name,
      itemSubtitle: `${inspected.role} · 3 Tactical Passives`,
      description: `Deploy ${inspected.name} as your active flagship across missions and fleet sorties?`,
      icon: <ShipArtBadge shipId={inspected.id} size={36} />,
      statDeltas: [
        {
          label: 'Active Flagship',
          before: equipped.name,
          after: inspected.name,
        },
        {
          label: 'Hull / Shield',
          before: `${equipped.stats.maxHp} / ${equipped.stats.maxShield}`,
          after: `${inspected.stats.maxHp} / ${inspected.stats.maxShield}`,
        },
        {
          label: 'Power / Crit DMG',
          before: `${Math.round(equipped.stats.damageMult * 100)}% · ${equipped.stats.critDamage.toFixed(2)}x`,
          after: `${Math.round(inspected.stats.damageMult * 100)}% · ${inspected.stats.critDamage.toFixed(2)}x`,
        },
      ],
      execute: () => ProgressionManager.unlockOrSelectShip(inspected.id),
    });
  };

  const openShipUnlockConfirm = () => {
    SoundManager.unlock();
    SoundManager.playButtonClick();
    const minSector = inspected.unlock.minSectorCompleted;
    const sectorMet = !minSector || progress.completedLevels.includes(minSector);
    setPendingAction({
      id: `unlock-ship-${inspected.id}`,
      category: 'unlock',
      title: 'Confirm Unlock',
      itemName: inspected.name,
      itemSubtitle: `${inspected.role} · 3 Tactical Passives`,
      description: inspected.description,
      note:
        minSector && !sectorMet
          ? `Requirement not met: Clear Sector ${String(minSector).padStart(2, '0')} first.`
          : undefined,
      icon: <ShipArtBadge shipId={inspected.id} size={36} />,
      statDeltas: [
        {
          label: 'Hull / Shield',
          before: `${inspected.stats.maxHp} HP · ${inspected.stats.maxShield} SHD`,
        },
        {
          label: 'Power / Speed',
          before: `${Math.round(inspected.stats.damageMult * 100)}% DMG · ${getShipBaseMoveSpeedPx(inspected)} px/s`,
        },
      ],
      creditsCost: inspected.unlock.credits,
      crystalsCost: inspected.unlock.crystals,
      execute: () => ProgressionManager.unlockOrSelectShip(inspected.id),
    });
  };

  const openSpecialConfirm = (spec: (typeof SPECIAL_LIST)[number]) => {
    if (progress.selectedSpecial === spec.id) return;
    SoundManager.unlock();
    SoundManager.playButtonClick();
    setPendingAction({
      id: `arm-special-${spec.id}`,
      category: 'equip',
      title: 'Confirm Loadout',
      itemName: spec.name,
      itemSubtitle: `Special Ability Module · Key E · ${Math.round(spec.cooldownMs / 1000)}s Cooldown`,
      description: spec.description,
      icon: <Zap className="h-5 w-5 text-purple-300" />,
      statDeltas: [
        {
          label: 'Armed Special',
          before: currentSpecial.name,
          after: spec.name,
        },
        {
          label: 'Cooldown',
          before: `${Math.round(currentSpecial.cooldownMs / 1000)}s`,
          after: `${Math.round(spec.cooldownMs / 1000)}s`,
        },
      ],
      execute: () => {
        EventBus.emit('ui:select-special', spec.id as SpecialId);
        return { ok: true, message: `${spec.name} armed as active Special.` };
      },
    });
  };

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[0.95fr_1.15fr] lg:items-start">
          {/* Fleet Roster: Smooth horizontal swipe strip on mobile/tablet, 2x4 grid on desktop */}
          <section aria-label="Fleet Roster">
            <div className="mb-2.5 flex items-center justify-between text-xs">
              <span className="font-display font-bold tracking-wide text-slate-200">
                FLEET ROSTER ({progress.unlockedShips.length}/{SHIP_LIST.length})
              </span>
              <span className="font-mono-num text-[11px] text-slate-400">
                <span className="lg:hidden">Swipe &amp; tap hull</span>
                <span className="hidden lg:inline">Tap hull to inspect</span>
              </span>
            </div>

            <HorizontalSwipeStrip ariaLabel="Starfighter Fleet Roster">
              {SHIP_LIST.map((ship) => {
                const unlocked = progress.unlockedShips.includes(ship.id);
                const equippedShip = progress.selectedShip === ship.id;
                const selected = inspectId === ship.id;

                return (
                  <button
                    key={ship.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => {
                      SoundManager.playButtonClick();
                      setInspectId(ship.id);
                    }}
                    className={`relative flex min-w-[162px] lg:min-w-0 shrink-0 items-center gap-3 rounded-xl border p-3 text-left transition-[border-color,background-color,transform] duration-150 active:scale-[0.985] ${
                      selected
                        ? 'border-cyan-300/75 bg-[#0c1b36]/95 text-white'
                        : 'border-slate-800/90 bg-[#081122]/85 text-slate-200 hover:border-slate-600 hover:bg-[#0b162c]/90'
                    }`}
                  >
                    <NotificationDot
                      visible={notifications.shipIds[ship.id]}
                      position="corner-inset"
                      label={`${ship.name} available to unlock`}
                    />
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-slate-700/70 bg-[#050b18]/90">
                      <ShipArtBadge shipId={ship.id} size={34} />
                    </div>

                    <div className="min-w-0 flex-1 pr-2">
                      <div className="truncate font-display text-xs sm:text-[13px] font-bold tracking-wide">
                        {ship.name}
                      </div>
                      <div className="mt-1 flex items-center gap-1.5 font-mono-num text-[10.5px]">
                        {equippedShip ? (
                          <span className="font-bold text-emerald-300">Equipped</span>
                        ) : unlocked ? (
                          <span className="font-semibold text-sky-300">Owned</span>
                        ) : (
                          <span className="flex items-center gap-1 text-slate-500">
                            <Lock className="h-3 w-3" /> Locked
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </HorizontalSwipeStrip>
          </section>

          {/* Primary Inspected Ship Focus Card */}
          <section
            key={inspected.id}
            aria-label="Ship Telemetry Inspector"
            className="panel-swap flex flex-col justify-between rounded-2xl border border-slate-700/75 bg-[#081122]/94 p-4 sm:p-5 backdrop-blur-sm"
          >
            <div>
              {/* Showcase Visual & Status Header */}
              <div className="flex items-start justify-between gap-3 rounded-xl border border-slate-800/80 bg-[#050b18]/85 p-3.5">
                <div className="flex min-w-0 items-center gap-3.5">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-cyan-300/25 bg-[#09142b]">
                    <ShipArtBadge shipId={inspected.id} size={46} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 font-mono-num text-[10.5px]">
                      <span className="font-semibold uppercase tracking-wider text-cyan-300">
                        {inspected.role}
                      </span>
                      <span aria-hidden="true" className="text-slate-600">·</span>
                      <span
                        className={`font-bold ${
                          isEquipped
                            ? 'text-emerald-300'
                            : isUnlocked
                            ? 'text-sky-300'
                            : 'text-amber-300'
                        }`}
                      >
                        {isEquipped ? 'EQUIPPED' : isUnlocked ? 'OWNED' : 'LOCKED'}
                      </span>
                    </div>
                    <h3 className="mt-0.5 truncate font-display text-lg sm:text-xl font-bold text-white">
                      {inspected.name}
                    </h3>
                    <div className="font-mono-num text-[11px] text-slate-400">
                      Universal Weaponry · 3 Active Passives
                    </div>
                  </div>
                </div>

                {!isEquipped && (
                  <button
                    type="button"
                    onClick={() => {
                      SoundManager.playButtonClick();
                      setCompareMode((v) => !v);
                    }}
                    className={`min-h-[36px] shrink-0 rounded-lg border px-3 text-[11px] font-semibold transition-colors ${
                      compareMode
                        ? 'border-cyan-300/60 bg-cyan-400/14 text-cyan-200'
                        : 'border-slate-700 bg-slate-900/90 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {compareMode ? `vs ${equipped.name}` : 'Compare'}
                  </button>
                )}
              </div>

              <p className="mt-3 text-xs leading-relaxed text-slate-300">{inspected.description}</p>

              {/* Tactical Passive Suite (3 Passives from ShipConfig) */}
              <div className="mt-3 rounded-xl border border-slate-800/90 bg-[#060c1a]/90 px-3.5 py-2.5 text-xs">
                <div className="flex items-center gap-1.5 font-semibold text-amber-300">
                  <Shield className="h-3.5 w-3.5 shrink-0" />
                  <span>Tactical Passives ({inspected.passives.length})</span>
                </div>
                <div className="mt-2 space-y-2">
                  {inspected.passives.map((passive, idx) => (
                    <div
                      key={passive.id}
                      className="rounded-lg border border-slate-800/75 bg-[#040916]/85 px-2.5 py-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-sky-200">
                          {idx + 1}. {passive.name}
                        </span>
                        <span className="font-mono-num text-[10px] text-slate-400">
                          {passive.cooldownSec ? `${passive.cooldownSec}s CD` : 'Passive'}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[11px] leading-snug text-slate-300">
                        {passive.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2-Column Stat Matrix */}
              <div className="mt-3.5 grid grid-cols-1 gap-x-4 gap-y-2.5 sm:grid-cols-2 text-xs">
                {statRows.map((row) => {
                  const delta = row.val - row.eq;
                  const pct = Math.min(100, Math.round((row.val / row.max) * 100));
                  return (
                    <div key={row.label} className="flex flex-col gap-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[11px] text-slate-400">{row.label}</span>
                        <div className="font-mono-num text-[11.5px] font-bold text-white">
                          {row.fmt(row.val)}
                          {compareMode && !isEquipped && Math.abs(delta) > 0.001 && (
                            <span
                              className={`ml-1 text-[10.5px] ${
                                delta > 0 ? 'text-emerald-400' : 'text-rose-400'
                              }`}
                            >
                              ({row.fmtDelta(delta)})
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-900">
                        <div
                          className="h-full rounded-full bg-sky-400/80 transition-[width] duration-200"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Deploy / Unlock Action Area (Universal Confirm Modal) */}
            <div className="mt-4 border-t border-slate-800/80 pt-3.5">
              {isEquipped ? (
                <div className="flex min-h-[46px] items-center justify-center gap-2 rounded-xl border border-emerald-400/40 bg-emerald-500/12 text-xs sm:text-sm font-bold text-emerald-300">
                  <Check className="h-4 w-4" />
                  <span>EQUIPPED FLAGSHIP</span>
                </div>
              ) : isUnlocked ? (
                <button
                  type="button"
                  onClick={openShipEquipConfirm}
                  className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-400 to-cyan-400 px-5 py-2.5 font-display text-sm font-bold tracking-wider text-slate-950 transition-[filter,transform] duration-150 hover:brightness-105 active:scale-[0.98]"
                >
                  <span>EQUIP {inspected.name}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={openShipUnlockConfirm}
                  className="relative flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 py-2.5 font-display text-sm font-bold text-slate-950 transition-[filter,transform] duration-150 hover:bg-amber-300 active:scale-[0.98]"
                >
                  <NotificationDot
                    visible={notifications.shipIds[inspected.id]}
                    position="corner"
                    label={`Ready to unlock ${inspected.name}`}
                  />
                  <span>UNLOCK {inspected.name}</span>
                  <span className="font-mono-num text-xs">
                    ({inspected.unlock.credits.toLocaleString()} CR
                    {inspected.unlock.crystals > 0 ? ` · ${inspected.unlock.crystals} Gems` : ''})
                  </span>
                </button>
              )}

              {!isUnlocked && (
                <div className="mt-2.5 flex flex-wrap items-center justify-center gap-3 font-mono-num text-[11px] text-slate-400">
                  <span className="flex items-center gap-1 text-amber-300">
                    <Coins className="h-3 w-3" /> {inspected.unlock.credits.toLocaleString()} CR
                  </span>
                  {inspected.unlock.crystals > 0 && (
                    <span className="flex items-center gap-1 text-cyan-300">
                      <Gem className="h-3 w-3" /> {inspected.unlock.crystals} Gems
                    </span>
                  )}
                  {inspected.unlock.minSectorCompleted && (
                    <span>
                      Requires Sector {String(inspected.unlock.minSectorCompleted).padStart(2, '0')} Clear
                    </span>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Special Ability Module Selector (Opens Confirm Dialog on Switch) */}
        <section className="rounded-2xl border border-slate-700/70 bg-[#081122]/90 p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 font-display text-xs sm:text-sm font-bold tracking-wide text-purple-300">
              <Zap className="h-3.5 w-3.5" />
              <span>SPECIAL ABILITY MODULE (KEY E)</span>
            </h3>
            <span className="font-mono-num text-[11px] text-slate-400">
              Select module to arm tactical special
            </span>
          </div>
          <div className="grid grid-cols-1 gap-2.5 md:grid-cols-3">
            {SPECIAL_LIST.map((s) => {
              const active = progress.selectedSpecial === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => openSpecialConfirm(s)}
                  className={`min-h-[68px] rounded-xl border px-4 py-3 text-left transition-[border-color,background-color] duration-150 ${
                    active
                      ? 'border-purple-300/65 bg-purple-500/14 text-white'
                      : 'border-slate-800 bg-[#060c1a]/85 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-xs font-bold">
                    <span className="font-display tracking-wide">{s.name}</span>
                    <span className="font-mono-num text-[10.5px] text-purple-300">
                      {Math.round(s.cooldownMs / 1000)}s CD
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-1 text-[11px] text-slate-400">{s.description}</p>
                </button>
              );
            })}
          </div>
        </section>
      </div>

      <ActionConfirmDialog
        action={pendingAction}
        currentCredits={progress.credits}
        currentCrystals={progress.crystals}
        onCancel={() => setPendingAction(null)}
        onResult={(res) => {
          if (res.ok) setPendingAction(null);
          onFeedback(res);
        }}
      />
    </>
  );
};
