import React, { useState } from 'react';
import { Check, Coins, Gem, Lock, Shield, Zap } from 'lucide-react';
import { SHIP_LIST, ShipId, SHIPS } from '../../game/config/ShipConfig';
import { SPECIAL_LIST, SpecialId, WEAPONS } from '../../game/config/WeaponConfig';
import { SoundManager } from '../../game/audio/SoundManager';
import { ActionResult, ProgressionManager } from '../../game/systems/ProgressionManager';
import { EventBus } from '../../game/utils/EventBus';
import { PlayerProgress } from '../../game/utils/StorageManager';
import { ShipArtBadge } from './ShipArtBadge';

interface HangarShipsPanelProps {
  progress: PlayerProgress;
  onFeedback: (res: ActionResult) => void;
}

export const HangarShipsPanel: React.FC<HangarShipsPanelProps> = ({ progress, onFeedback }) => {
  const [inspectId, setInspectId] = useState<ShipId>(progress.selectedShip);
  const [compareMode, setCompareMode] = useState<boolean>(true);

  const inspected = SHIPS[inspectId] ?? SHIPS.falcon_x;
  const equipped = SHIPS[progress.selectedShip] ?? SHIPS.falcon_x;
  const isUnlocked = progress.unlockedShips.includes(inspected.id);
  const isEquipped = progress.selectedShip === inspected.id;

  const statRows = [
    { label: 'Hull HP', val: inspected.stats.maxHp, eq: equipped.stats.maxHp, fmt: (v: number) => `${v}` },
    { label: 'Shield', val: inspected.stats.maxShield, eq: equipped.stats.maxShield, fmt: (v: number) => `${v}` },
    { label: 'Speed', val: inspected.stats.moveSpeed, eq: equipped.stats.moveSpeed, fmt: (v: number) => `${v}` },
    { label: 'Damage', val: inspected.stats.damageMult, eq: equipped.stats.damageMult, fmt: (v: number) => `${Math.round(v * 100)}%` },
    { label: 'Fire Rate', val: inspected.stats.fireRateMult, eq: equipped.stats.fireRateMult, fmt: (v: number) => `${Math.round(v * 100)}%` },
    { label: 'Crit Rate', val: inspected.stats.critChance, eq: equipped.stats.critChance, fmt: (v: number) => `${Math.round(v * 100)}%` },
    { label: 'Special', val: inspected.stats.specialPowerMult, eq: equipped.stats.specialPowerMult, fmt: (v: number) => `${Math.round(v * 100)}%` },
  ];

  const handleShipAction = () => {
    SoundManager.unlock();
    const res = ProgressionManager.unlockOrSelectShip(inspected.id);
    if (res.ok) SoundManager.playPurchase();
    else SoundManager.playButtonClick();
    onFeedback(res);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.15fr_1fr]">
        {/* 8-Ship Fleet Roster */}
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {SHIP_LIST.map((ship) => {
            const unlocked = progress.unlockedShips.includes(ship.id);
            const equippedShip = progress.selectedShip === ship.id;
            const selected = inspectId === ship.id;
            return (
              <button
                key={ship.id}
                type="button"
                onClick={() => {
                  SoundManager.playButtonClick();
                  setInspectId(ship.id);
                }}
                className={`flex min-h-[72px] items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
                  selected
                    ? 'border-sky-400 bg-sky-500/15 text-white'
                    : 'border-slate-800 bg-[#081022]/85 text-slate-200 hover:border-slate-600'
                }`}
              >
                <ShipArtBadge shipId={ship.id} size={46} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="truncate font-display text-sm font-bold">{ship.name}</span>
                    {equippedShip ? (
                      <Check className="h-4 w-4 shrink-0 text-emerald-400" />
                    ) : !unlocked ? (
                      <Lock className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                    ) : null}
                  </div>
                  <div className="truncate text-[11px] text-slate-400">
                    {ship.role} · {equippedShip ? 'Active' : unlocked ? 'Owned' : ship.unlock.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Detailed Ship Inspector & Comparison */}
        <div className="flex flex-col justify-between rounded-xl border border-slate-800 bg-[#081022]/92 p-5">
          <div>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <ShipArtBadge shipId={inspected.id} size={56} />
                <div>
                  <div className="text-xs font-semibold text-sky-300">{inspected.role}</div>
                  <h3 className="font-display text-2xl font-bold text-white">{inspected.name}</h3>
                </div>
              </div>

              {!isEquipped && (
                <button
                  type="button"
                  onClick={() => setCompareMode((v) => !v)}
                  className={`min-h-[34px] rounded-md border px-2.5 text-[11px] font-semibold ${
                    compareMode
                      ? 'border-sky-400/70 bg-sky-500/15 text-sky-200'
                      : 'border-slate-700 bg-slate-900 text-slate-400'
                  }`}
                >
                  {compareMode ? `vs ${equipped.name}` : 'Compare'}
                </button>
              )}
            </div>

            <p className="mt-3 text-xs leading-relaxed text-slate-300">{inspected.description}</p>

            {/* Passive & Weapon Synergy */}
            <div className="mt-3.5 rounded-lg border border-slate-800 bg-slate-950/75 p-3 text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-amber-300">
                <Shield className="h-3.5 w-3.5" />
                <span>Passive: {inspected.passiveName}</span>
              </div>
              <p className="mt-1 text-slate-300">{inspected.passiveDescription}</p>
              <div className="mt-2 border-t border-slate-800/80 pt-2 text-[11px] text-slate-400">
                Signature Arsenal: <span className="text-sky-300">{WEAPONS[inspected.signatureWeapon].name}</span> — {inspected.weaponCharacteristic}
              </div>
            </div>

            {/* Stat Matrix */}
            <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
              {statRows.map((row) => {
                const delta = row.val - row.eq;
                return (
                  <div key={row.label} className="flex items-center justify-between border-b border-slate-800/60 pb-1">
                    <span className="text-slate-400">{row.label}</span>
                    <div className="font-mono-num font-bold text-white">
                      {row.fmt(row.val)}
                      {compareMode && !isEquipped && Math.abs(delta) > 0.001 && (
                        <span
                          className={`ml-1.5 text-[11px] ${
                            delta > 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          ({delta > 0 ? '+' : ''}
                          {row.label === 'Damage' || row.label === 'Fire Rate' || row.label === 'Crit Rate' || row.label === 'Special'
                            ? `${Math.round(delta * 100)}%`
                            : Math.round(delta)}
                          )
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Unlock or Equip CTA */}
          <div className="mt-5">
            {isEquipped ? (
              <div className="flex min-h-[46px] items-center justify-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-sm font-bold text-emerald-300">
                <Check className="h-4 w-4" />
                <span>Currently Active Flagship</span>
              </div>
            ) : isUnlocked ? (
              <button
                type="button"
                onClick={handleShipAction}
                className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-lg bg-sky-500 px-5 py-2.5 font-display text-sm font-bold text-slate-950 hover:bg-sky-400"
              >
                <span>Deploy {inspected.name}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleShipAction}
                className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-lg bg-amber-400 px-5 py-2.5 font-display text-sm font-bold text-slate-950 hover:bg-amber-300"
              >
                <span>Unlock {inspected.name}</span>
                <span className="font-mono-num text-xs">
                  ({inspected.unlock.credits.toLocaleString()} CR
                  {inspected.unlock.crystals > 0 ? ` · ${inspected.unlock.crystals} Gems` : ''})
                </span>
              </button>
            )}

            {!isUnlocked && (
              <div className="mt-2 flex items-center justify-center gap-3 font-mono-num text-[11px] text-slate-400">
                <span className="flex items-center gap-1 text-amber-300">
                  <Coins className="h-3 w-3" /> {inspected.unlock.credits.toLocaleString()}
                </span>
                {inspected.unlock.crystals > 0 && (
                  <span className="flex items-center gap-1 text-cyan-300">
                    <Gem className="h-3 w-3" /> {inspected.unlock.crystals}
                  </span>
                )}
                {inspected.unlock.minSectorCompleted && (
                  <span>Requires Sector {String(inspected.unlock.minSectorCompleted).padStart(2, '0')} Clear</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Special System Selector */}
      <div className="rounded-xl border border-slate-800 bg-[#081022]/90 p-4">
        <h3 className="mb-3 flex items-center gap-2 font-display text-sm font-bold text-purple-300">
          <Zap className="h-4 w-4" />
          <span>Special Ability Module (Key E / HUD Button)</span>
        </h3>
        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-3">
          {SPECIAL_LIST.map((s) => {
            const active = progress.selectedSpecial === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  SoundManager.unlock();
                  SoundManager.playButtonClick();
                  EventBus.emit('ui:select-special', s.id as SpecialId);
                  onFeedback({ ok: true, message: `${s.name} armed as active Special.` });
                }}
                className={`min-h-[72px] rounded-lg border p-3 text-left transition-colors ${
                  active
                    ? 'border-purple-400 bg-purple-500/15 text-white'
                    : 'border-slate-800 bg-slate-950/70 text-slate-300 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold">
                  <span>{s.name}</span>
                  <span className="font-mono-num text-purple-300">{Math.round(s.cooldownMs / 1000)}s CD</span>
                </div>
                <p className="mt-1 text-[11px] leading-snug text-slate-400">{s.description}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
