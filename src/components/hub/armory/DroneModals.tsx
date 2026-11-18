import React from 'react';
import { ArrowLeft, Check, Cpu, Lock, X } from 'lucide-react';
import {
  DRONE_LIST,
  DRONES,
  DroneDefinition,
  DroneId,
  getDronePowerAtLevel,
  getDroneUpgradeCost,
} from '../../../game/config/DroneConfig';
import { SoundManager } from '../../../game/audio/SoundManager';
import { PlayerProgress } from '../../../game/utils/StorageManager';
import { DroneArtBadge } from '../ShipArtBadge';
import { formatDronePower } from './armoryUtils';

interface DroneSlotPickerModalProps {
  slotIndex: 0 | 1;
  progress: PlayerProgress;
  onClose: () => void;
  onSelectDroneInfo: (droneId: DroneId, fromSlotIndex: 0 | 1) => void;
  onUnequipConfirm: (drone: DroneDefinition) => void;
}

export const DroneSlotPickerModal: React.FC<DroneSlotPickerModalProps> = ({
  slotIndex,
  progress,
  onClose,
  onSelectDroneInfo,
  onUnequipConfirm,
}) => {
  const currentSlotId = progress.equippedDrones[slotIndex];
  const currentSlotDrone = currentSlotId ? DRONES[currentSlotId] : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="drone-slot-popup-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#03060f]/82 p-3 sm:p-5 backdrop-blur-sm"
      onClick={() => {
        SoundManager.playButtonClick();
        onClose();
      }}
    >
      <div
        className="pause-panel-enter flex max-h-[min(88dvh,680px)] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-slate-700/80 bg-[#081122]/98 shadow-2xl shadow-black/75"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-800/85 px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-purple-400/35 bg-[#050b18]">
              <Cpu className="h-5 w-5 text-purple-300" />
            </span>
            <div className="min-w-0">
              <div className="font-mono-num text-[10.5px] font-semibold uppercase tracking-[0.12em] text-purple-300">
                Companion Drones · Slot 0{slotIndex + 1}
              </div>
              <h3
                id="drone-slot-popup-title"
                className="truncate font-display text-base sm:text-lg font-bold text-white"
              >
                {currentSlotDrone ? `Active: ${currentSlotDrone.name}` : 'Select Companion Drone'}
              </h3>
            </div>
          </div>

          <button
            type="button"
            aria-label="Close drone slot popup"
            onClick={() => {
              SoundManager.playButtonClick();
              onClose();
            }}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-700/80 bg-[#060c1a] text-slate-400 transition-colors hover:border-slate-500 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Grid of Compatible Companion Drones */}
        <div className="scroll-panel flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4 sm:p-5">
          {currentSlotDrone && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-400/35 bg-[#07191b]/85 px-4 py-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <DroneArtBadge
                  droneId={currentSlotDrone.id}
                  colorHex={currentSlotDrone.colorHex}
                  size={28}
                />
                <div className="min-w-0">
                  <div className="truncate font-display text-xs sm:text-sm font-bold text-white">
                    {currentSlotDrone.name}
                  </div>
                  <div className="font-mono-num text-[10.5px] text-emerald-300">
                    Currently Equipped in Slot 0{slotIndex + 1}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onUnequipConfirm(currentSlotDrone)}
                className="min-h-[36px] rounded-lg border border-slate-700/90 bg-[#050b18] px-3 text-xs font-semibold text-slate-200 transition-colors hover:border-rose-400/55 hover:bg-rose-500/14 hover:text-rose-200"
              >
                Unequip
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {DRONE_LIST.map((d) => {
              const lvl = progress.ownedDrones[d.id] ?? 0;
              const owned = lvl > 0;
              const equippedSlot = progress.equippedDrones.indexOf(d.id);
              const equipped = equippedSlot !== -1;
              const power = getDronePowerAtLevel(d, Math.max(1, lvl));

              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => onSelectDroneInfo(d.id, slotIndex)}
                  className={`flex min-h-[152px] flex-col justify-between rounded-2xl border p-3.5 text-left transition-[border-color,background-color,transform] duration-150 active:scale-[0.98] ${
                    equipped
                      ? 'border-emerald-400/55 bg-[#07191b]/90 hover:border-emerald-300/80'
                      : owned
                      ? 'border-slate-700/85 bg-[#081225]/92 hover:border-purple-300/60'
                      : 'border-slate-800/90 bg-[#050b18]/90 opacity-85 hover:opacity-100 hover:border-slate-600/80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-700/70 bg-[#050b18]">
                      <DroneArtBadge droneId={d.id} colorHex={d.colorHex} size={32} />
                    </span>
                    <span
                      className={`flex items-center gap-1 font-mono-num text-[10px] font-bold ${
                        equipped
                          ? 'text-emerald-300'
                          : owned
                          ? 'text-sky-300'
                          : 'text-slate-500'
                      }`}
                    >
                      {!owned && <Lock className="h-3 w-3" />}
                      <span>
                        {equipped
                          ? `EQUIPPED · S${equippedSlot + 1}`
                          : owned
                          ? `OWNED · Lv.${lvl}`
                          : 'LOCKED'}
                      </span>
                    </span>
                  </div>

                  <div className="my-2 min-w-0">
                    <div className="truncate font-display text-xs sm:text-sm font-bold text-white">
                      {d.name}
                    </div>
                    <div className="mt-0.5 truncate font-mono-num text-[10.5px] text-purple-300">
                      {d.role}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 border-t border-slate-800/80 pt-2 font-mono-num text-[10.5px] font-semibold">
                    <span style={{ color: d.colorHex }}>{formatDronePower(d, power)}</span>
                    <span className="text-slate-400">Inspect</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

interface DroneInfoModalProps {
  drone: DroneDefinition;
  fromSlotIndex: 0 | 1 | null;
  progress: PlayerProgress;
  onBackToSlotPicker: (slotIndex: 0 | 1) => void;
  onClose: () => void;
  onUnequipConfirm: (drone: DroneDefinition) => void;
  onEquipConfirm: (drone: DroneDefinition, targetSlotIndex?: 0 | 1) => void;
  onBuyOrUpgradeConfirm: (drone: DroneDefinition) => void;
}

export const DroneInfoModal: React.FC<DroneInfoModalProps> = ({
  drone: d,
  fromSlotIndex: preferredSlot,
  progress,
  onBackToSlotPicker,
  onClose,
  onUnequipConfirm,
  onEquipConfirm,
  onBuyOrUpgradeConfirm,
}) => {
  const lvl = progress.ownedDrones[d.id] ?? 0;
  const owned = lvl > 0;
  const slotIdx = progress.equippedDrones.indexOf(d.id);
  const equipped = slotIdx !== -1;
  const slotsFull = progress.equippedDrones.length >= 2;
  const maxed = lvl >= d.maxLevel;
  const upgCost = getDroneUpgradeCost(d, Math.max(1, lvl));
  const power = getDronePowerAtLevel(d, Math.max(1, lvl));
  const nextPower = owned && !maxed ? getDronePowerAtLevel(d, lvl + 1) : null;
  const creditsNeeded = owned ? upgCost.credits : d.costCredits;
  const crystalsNeeded = owned ? upgCost.crystals : d.costCrystals;
  const affordable = progress.credits >= creditsNeeded && progress.crystals >= crystalsNeeded;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="drone-info-popup-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#03060f]/82 p-3 sm:p-5 backdrop-blur-sm"
      onClick={() => {
        SoundManager.playButtonClick();
        onClose();
      }}
    >
      <div
        key={d.id}
        className="pause-panel-enter flex max-h-[min(88dvh,640px)] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-slate-700/80 bg-[#081122]/98 shadow-2xl shadow-black/75"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-800/85 px-5 py-3.5">
          {preferredSlot !== null ? (
            <button
              type="button"
              onClick={() => onBackToSlotPicker(preferredSlot)}
              className="flex min-h-[36px] items-center gap-1.5 rounded-lg border border-slate-700/80 bg-[#060c1a] px-3 text-xs font-semibold text-slate-200 transition-colors hover:border-purple-300/60 hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>All Drones (Slot 0{preferredSlot + 1})</span>
            </button>
          ) : (
            <span className="font-mono-num text-[11px] font-semibold uppercase tracking-[0.12em] text-purple-300">
              Companion Drone Info
            </span>
          )}

          <button
            type="button"
            aria-label="Close drone details"
            onClick={() => {
              SoundManager.playButtonClick();
              onClose();
            }}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-700/80 bg-[#060c1a] text-slate-400 transition-colors hover:border-slate-500 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Drone Details */}
        <div className="scroll-panel flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-5">
          {/* Visual + Title + Ownership */}
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-slate-700/80 bg-[#050b18]">
              <DroneArtBadge droneId={d.id} colorHex={d.colorHex} size={48} />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 font-mono-num text-[11px]">
                <span className="font-semibold text-purple-300">{d.role}</span>
                <span aria-hidden="true" className="text-slate-600">
                  ·
                </span>
                <span
                  className={`font-bold ${
                    equipped ? 'text-emerald-300' : owned ? 'text-sky-300' : 'text-slate-400'
                  }`}
                >
                  {equipped
                    ? `Equipped (Slot 0${slotIdx + 1})`
                    : owned
                    ? `Owned · Lv.${lvl}/${d.maxLevel}`
                    : 'Locked'}
                </span>
              </div>
              <h3
                id="drone-info-popup-title"
                className="mt-1 truncate font-display text-lg sm:text-xl font-bold text-white"
              >
                {d.name}
              </h3>
            </div>
          </div>

          {/* Description */}
          <p className="text-xs sm:text-[13px] leading-relaxed text-slate-300">{d.description}</p>

          {/* Primary Stat & Special Ability */}
          <div className="flex flex-col gap-2.5 rounded-xl border border-slate-800/90 bg-[#050b18]/90 p-3.5 font-mono-num text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-400">Wingman Output</span>
              <div className="font-bold" style={{ color: d.colorHex }}>
                {formatDronePower(d, power)}
                {nextPower !== null && (
                  <span className="ml-2 text-emerald-400">→ {formatDronePower(d, nextPower)}</span>
                )}
              </div>
            </div>
            <div className="h-px bg-slate-800/80" />
            <div>
              <div className="text-[10.5px] uppercase tracking-wider text-slate-500">
                Special Capability
              </div>
              <div className="mt-1 font-sans text-xs leading-relaxed text-slate-200">
                {d.abilitySummary}
              </div>
            </div>
          </div>

          {/* Action Area */}
          <div className="flex flex-col gap-2.5 border-t border-slate-800/85 pt-4">
            {!owned ? (
              <div className="flex min-h-[42px] items-center justify-center gap-2 rounded-xl border border-slate-800 bg-[#050b18]/85 px-4 text-xs font-medium text-slate-500">
                <Lock className="h-3.5 w-3.5" />
                <span>Locked — Unlock drone before equipping</span>
              </div>
            ) : equipped ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-3.5 py-2.5 text-xs">
                  <span className="flex items-center gap-1.5 font-bold text-emerald-300">
                    <Check className="h-4 w-4" />
                    <span>Equipped in Slot 0{slotIdx + 1}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => onUnequipConfirm(d)}
                    className="font-semibold text-rose-300 underline-offset-2 hover:text-rose-200 hover:underline"
                  >
                    Unequip
                  </button>
                </div>
              </div>
            ) : !slotsFull ? (
              <button
                type="button"
                onClick={() => onEquipConfirm(d)}
                className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-cyan-300/60 bg-cyan-400/14 px-4 text-xs font-bold text-cyan-100 transition-colors hover:bg-cyan-400/22"
              >
                <span>Equip to Slot 0{progress.equippedDrones.length + 1}</span>
              </button>
            ) : preferredSlot !== null ? (
              <button
                type="button"
                onClick={() => onEquipConfirm(d, preferredSlot)}
                className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-cyan-300/60 bg-cyan-400/14 px-4 text-xs font-bold text-cyan-100 transition-colors hover:bg-cyan-400/22"
              >
                <span>
                  Equip to Slot 0{preferredSlot + 1} (Replaces{' '}
                  {DRONES[progress.equippedDrones[preferredSlot]]?.name ?? 'Active'})
                </span>
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {([0, 1] as const).map((targetIdx) => {
                  const incumbentId = progress.equippedDrones[targetIdx];
                  const incumbentName = incumbentId
                    ? DRONES[incumbentId]?.name ?? incumbentId
                    : 'Empty';
                  return (
                    <button
                      key={`replace-s${targetIdx}`}
                      type="button"
                      onClick={() => onEquipConfirm(d, targetIdx)}
                      className="flex min-h-[44px] flex-col items-center justify-center rounded-xl border border-slate-700 bg-slate-900/90 px-3 py-1.5 text-center transition-colors hover:border-cyan-300/60 hover:text-white"
                    >
                      <span className="text-[11px] font-bold text-cyan-200">
                        Replace Slot 0{targetIdx + 1}
                      </span>
                      <span className="max-w-full truncate font-mono-num text-[10px] text-slate-400">
                        {incumbentName}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {owned ? (
              <button
                type="button"
                disabled={maxed}
                onClick={() => onBuyOrUpgradeConfirm(d)}
                className={`flex min-h-[46px] items-center justify-center rounded-xl px-4 font-mono-num text-xs font-bold transition-[background-color,transform] duration-150 ${
                  maxed
                    ? 'cursor-not-allowed border border-slate-800 bg-slate-950 text-slate-500'
                    : affordable
                    ? 'bg-sky-400 text-slate-950 hover:bg-sky-300 active:scale-[0.98]'
                    : 'border border-slate-700/80 bg-slate-900/90 text-slate-300 hover:border-slate-500'
                }`}
              >
                {maxed
                  ? 'MAX LEVEL REACHED'
                  : `Upgrade Lv.${lvl + 1} (${upgCost.credits.toLocaleString()} CR${
                      upgCost.crystals > 0 ? ` · ${upgCost.crystals} Gems` : ''
                    })`}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onBuyOrUpgradeConfirm(d)}
                className={`flex min-h-[46px] items-center justify-center rounded-xl px-4 font-mono-num text-xs font-bold transition-[background-color,transform] duration-150 ${
                  affordable
                    ? 'bg-sky-400 text-slate-950 hover:bg-sky-300 active:scale-[0.98]'
                    : 'border border-slate-700/80 bg-slate-900/90 text-slate-300 hover:border-slate-500'
                }`}
              >
                {`Unlock Drone (${d.costCredits.toLocaleString()} CR${
                  d.costCrystals > 0 ? ` · ${d.costCrystals} Gems` : ''
                })`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
