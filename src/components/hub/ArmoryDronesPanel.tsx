import React, { useState } from 'react';
import { Check, Coins, Gem, RefreshCw } from 'lucide-react';
import {
  DRONE_LIST,
  getDronePowerAtLevel,
  getDroneUpgradeCost,
} from '../../game/config/DroneConfig';
import {
  EQUIPMENT_BY_ID,
  EQUIPMENT_LIST,
  EquipmentSlot,
  getEquipmentUpgradeCost,
  RARITY_CONFIG,
  scaleEquipmentBonuses,
} from '../../game/config/EquipmentConfig';
import { SoundManager } from '../../game/audio/SoundManager';
import { ActionResult, ProgressionManager } from '../../game/systems/ProgressionManager';
import { PlayerProgress } from '../../game/utils/StorageManager';
import { DroneArtBadge } from './ShipArtBadge';

interface ArmoryDronesPanelProps {
  progress: PlayerProgress;
  onFeedback: (res: ActionResult) => void;
}

const SLOTS: Array<{ id: 'all' | EquipmentSlot; label: string }> = [
  { id: 'all', label: 'All Gear (16)' },
  { id: 'offensive', label: 'Offensive' },
  { id: 'defensive', label: 'Defensive' },
  { id: 'utility', label: 'Utility' },
  { id: 'special', label: 'Special' },
];

export const ArmoryDronesPanel: React.FC<ArmoryDronesPanelProps> = ({ progress, onFeedback }) => {
  const [slotFilter, setSlotFilter] = useState<'all' | EquipmentSlot>('all');

  const filteredGear =
    slotFilter === 'all'
      ? EQUIPMENT_LIST
      : EQUIPMENT_LIST.filter((e) => e.slot === slotFilter);

  return (
    <div className="flex flex-col gap-6">
      {/* Companion Drones (Max 2 Active Wingmen) */}
      <section className="rounded-xl border border-slate-800 bg-[#081022]/90 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-display text-base font-bold text-white">
              Companion Drones ({progress.equippedDrones.length}/2 Deployed)
            </h3>
            <p className="text-xs text-slate-400">
              Equip up to 2 autonomous wingmen to assist in combat, barrier projection, hull repair, or salvage.
            </p>
          </div>
          <div className="font-mono-num text-xs text-sky-300">
            Active:{' '}
            {progress.equippedDrones.length > 0
              ? progress.equippedDrones.map((d) => d.toUpperCase()).join(' · ')
              : 'None'}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {DRONE_LIST.map((d) => {
            const lvl = progress.ownedDrones[d.id] ?? 0;
            const owned = lvl > 0;
            const equipped = progress.equippedDrones.includes(d.id);
            const maxed = lvl >= d.maxLevel;
            const upgCost = getDroneUpgradeCost(d, Math.max(1, lvl));
            const power = getDronePowerAtLevel(d, Math.max(1, lvl));

            return (
              <div
                key={d.id}
                className={`flex flex-col justify-between rounded-xl border p-3.5 ${
                  equipped
                    ? 'border-sky-400 bg-sky-500/10'
                    : 'border-slate-800 bg-slate-950/75'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2.5">
                    <DroneArtBadge droneId={d.id} colorHex={d.colorHex} size={38} />
                    <div className="min-w-0">
                      <div className="truncate font-display text-sm font-bold text-white">
                        {d.name}
                      </div>
                      <div className="font-mono-num text-[11px] text-slate-400">
                        {d.role} · {owned ? `Lv.${lvl}/${d.maxLevel}` : 'Locked'}
                      </div>
                    </div>
                  </div>
                  <p className="mt-2 text-[11px] leading-snug text-slate-300">{d.description}</p>
                  <div className="mt-2 font-mono-num text-[11px] font-semibold" style={{ color: d.colorHex }}>
                    {d.id === 'assault' && `Bolt Power: ${power} DMG`}
                    {d.id === 'shield' && `Shield Pulse: +${power} SHD`}
                    {d.id === 'repair' && `Nanite Patch: +${power} HP`}
                    {d.id === 'collector' && `Magnet Radius: +${power}px`}
                  </div>
                </div>

                <div className="mt-3 flex flex-col gap-1.5">
                  {owned && (
                    <button
                      type="button"
                      onClick={() => {
                        SoundManager.unlock();
                        const res = ProgressionManager.toggleEquipDrone(d.id);
                        SoundManager.playButtonClick();
                        onFeedback(res);
                      }}
                      className={`flex min-h-[38px] items-center justify-center gap-1 rounded-lg border text-xs font-bold ${
                        equipped
                          ? 'border-emerald-400/60 bg-emerald-500/15 text-emerald-300'
                          : 'border-slate-700 bg-slate-900 text-slate-200 hover:border-sky-400'
                      }`}
                    >
                      {equipped ? <Check className="h-3.5 w-3.5" /> : null}
                      <span>{equipped ? 'Deployed (Click to Reserve)' : 'Deploy Drone'}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={maxed}
                    onClick={() => {
                      SoundManager.unlock();
                      const res = ProgressionManager.buyOrUpgradeDrone(d.id);
                      if (res.ok) SoundManager.playPurchase();
                      onFeedback(res);
                    }}
                    className={`flex min-h-[40px] items-center justify-center rounded-lg px-3 text-xs font-bold ${
                      maxed
                        ? 'cursor-not-allowed border border-slate-800 bg-slate-950 text-slate-500'
                        : 'bg-sky-500 text-slate-950 hover:bg-sky-400'
                    }`}
                  >
                    {maxed
                      ? 'MAX LEVEL'
                      : owned
                      ? `Upgrade (${upgCost.credits} CR · ${upgCost.crystals} Gems)`
                      : `Unlock (${d.costCredits} CR · ${d.costCrystals} Gems)`}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Equipment Armory & Shop (4 Slots · 16 Items · 5 Rarities) */}
      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-base font-bold text-white">
              Equipment Armory &amp; Shop
            </h3>
            <p className="text-xs text-slate-400">
              Active Slots:{' '}
              {(['offensive', 'defensive', 'utility', 'special'] as EquipmentSlot[])
                .map((slot) => {
                  const id = progress.equippedGear[slot];
                  return `${slot.slice(0, 3).toUpperCase()}: ${id ? EQUIPMENT_BY_ID[id]?.name ?? 'Equipped' : 'Empty'}`;
                })
                .join(' · ')}
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {SLOTS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  SoundManager.playButtonClick();
                  setSlotFilter(s.id);
                }}
                className={`min-h-[36px] rounded-lg border px-3 text-xs font-semibold ${
                  slotFilter === s.id
                    ? 'border-sky-400 bg-sky-500/15 text-white'
                    : 'border-slate-800 bg-slate-900/70 text-slate-300 hover:border-slate-600'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {filteredGear.map((item) => {
            const rarity = RARITY_CONFIG[item.rarity];
            const lvl = progress.ownedEquipment[item.id] ?? 0;
            const owned = lvl > 0;
            const equipped = progress.equippedGear[item.slot] === item.id;
            const maxed = lvl >= item.maxLevel;
            const upgCost = getEquipmentUpgradeCost(item, Math.max(1, lvl));
            const scaled = scaleEquipmentBonuses(item, Math.max(1, lvl));

            const summaryParts: string[] = [];
            if (scaled.damagePct) summaryParts.push(`+${scaled.damagePct}% DMG`);
            if (scaled.fireRatePct) summaryParts.push(`+${scaled.fireRatePct}% Rate`);
            if (scaled.critChancePct) summaryParts.push(`+${scaled.critChancePct}% Crit`);
            if (scaled.critDamagePct) summaryParts.push(`+${scaled.critDamagePct}% Crit DMG`);
            if (scaled.maxHpFlat) summaryParts.push(`+${scaled.maxHpFlat} HP`);
            if (scaled.maxShieldFlat) summaryParts.push(`+${scaled.maxShieldFlat} SHD`);
            if (scaled.damageReductionPct) summaryParts.push(`${scaled.damageReductionPct}% DR`);
            if (scaled.moveSpeedFlat) summaryParts.push(`+${scaled.moveSpeedFlat} SPD`);
            if (scaled.pickupRangePct) summaryParts.push(`+${scaled.pickupRangePct}% Magnet`);
            if (scaled.creditBonusPct) summaryParts.push(`+${scaled.creditBonusPct}% CR`);
            if (scaled.specialPowerPct) summaryParts.push(`+${scaled.specialPowerPct}% Special`);
            if (scaled.specialCooldownPct) summaryParts.push(`-${scaled.specialCooldownPct}% Spec CD`);
            if (scaled.dashCooldownPct) summaryParts.push(`-${scaled.dashCooldownPct}% Dash CD`);

            return (
              <div
                key={item.id}
                className={`flex flex-col justify-between rounded-xl border bg-[#081022]/90 p-3.5 ${
                  equipped ? 'border-emerald-400/80' : rarity.borderClass
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 text-[11px]">
                    <span className={`font-semibold ${rarity.textClass}`}>
                      {rarity.label} · {item.slot.toUpperCase()}
                    </span>
                    <span className="font-mono-num text-slate-400">
                      {owned ? `Lv.${lvl}/${item.maxLevel}` : 'Shop'}
                    </span>
                  </div>
                  <h4 className="mt-1 font-display text-sm font-bold text-white">{item.name}</h4>
                  <p className="mt-1 text-[11px] leading-snug text-slate-400">{item.description}</p>
                  <div className="mt-2 font-mono-num text-[11px] font-semibold text-sky-300">
                    {summaryParts.join(' · ')}
                  </div>
                </div>

                <div className="mt-3 flex flex-col gap-1.5">
                  {owned && (
                    <button
                      type="button"
                      onClick={() => {
                        SoundManager.unlock();
                        const res = ProgressionManager.toggleEquipGear(item.id);
                        SoundManager.playButtonClick();
                        onFeedback(res);
                      }}
                      className={`flex min-h-[38px] items-center justify-center gap-1 rounded-lg border text-xs font-bold ${
                        equipped
                          ? 'border-emerald-400/70 bg-emerald-500/15 text-emerald-300'
                          : 'border-slate-700 bg-slate-900 text-slate-200 hover:border-sky-400'
                      }`}
                    >
                      {equipped ? <Check className="h-3.5 w-3.5" /> : null}
                      <span>{equipped ? 'Equipped (Click to Remove)' : 'Equip Slot'}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={maxed}
                    onClick={() => {
                      SoundManager.unlock();
                      const res = ProgressionManager.buyOrUpgradeEquipment(item.id);
                      if (res.ok) SoundManager.playPurchase();
                      onFeedback(res);
                    }}
                    className={`flex min-h-[40px] items-center justify-center rounded-lg px-3 text-xs font-bold ${
                      maxed
                        ? 'cursor-not-allowed border border-slate-800 bg-slate-950 text-slate-500'
                        : 'bg-sky-500 text-slate-950 hover:bg-sky-400'
                    }`}
                  >
                    {maxed
                      ? 'MAX LEVEL'
                      : owned
                      ? `Enhance (${upgCost.credits} CR${upgCost.crystals > 0 ? ` · ${upgCost.crystals} Gems` : ''})`
                      : `Purchase (${item.costCredits} CR${item.costCrystals > 0 ? ` · ${item.costCrystals} Gems` : ''})`}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Supply Exchange & Reward Ledger */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="flex flex-col justify-between rounded-xl border border-slate-800 bg-[#081022]/90 p-4">
          <div>
            <h3 className="font-display text-sm font-bold text-cyan-300">
              Crystal Supply Exchange
            </h3>
            <p className="mt-1 text-xs text-slate-300">
              Refine surplus Credits into rare Void Crystals required for top-tier fighters and mythic gear.
            </p>
          </div>
          <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-800 pt-3">
            <div className="flex items-center gap-2 font-mono-num text-xs">
              <span className="flex items-center gap-1 text-amber-300">
                <Coins className="h-3.5 w-3.5" /> 450 CR
              </span>
              <span className="text-slate-500">→</span>
              <span className="flex items-center gap-1 text-cyan-300">
                <Gem className="h-3.5 w-3.5" /> +1 Crystal
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                SoundManager.unlock();
                const res = ProgressionManager.exchangeCreditsForCrystal();
                if (res.ok) SoundManager.playPurchase();
                onFeedback(res);
              }}
              className="flex min-h-[42px] items-center gap-1.5 rounded-lg bg-cyan-400 px-4 py-2 font-display text-xs font-bold text-slate-950 hover:bg-cyan-300"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Refine Crystal</span>
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#081022]/90 p-4">
          <h3 className="font-display text-sm font-bold text-slate-200">Recent Economy Ledger</h3>
          {progress.rewardHistory.length === 0 ? (
            <p className="mt-2 text-xs text-slate-400">
              Complete missions, bounties, or achievements to log rewards here.
            </p>
          ) : (
            <div className="mt-2 flex max-h-36 flex-col gap-1.5 overflow-y-auto scroll-panel pr-1">
              {progress.rewardHistory.slice(0, 8).map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between rounded-md border border-slate-800/80 bg-slate-950/60 px-3 py-1.5 text-xs"
                >
                  <span className="truncate text-slate-300">{entry.label}</span>
                  <span className="shrink-0 font-mono-num font-semibold">
                    {entry.credits > 0 && <span className="text-amber-300">+{entry.credits} CR</span>}
                    {entry.credits > 0 && entry.crystals > 0 && <span className="mx-1 text-slate-600">·</span>}
                    {entry.crystals > 0 && <span className="text-cyan-300">+{entry.crystals} Gems</span>}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
