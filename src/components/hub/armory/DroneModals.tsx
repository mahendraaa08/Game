import React from 'react';
import { Check, Lock, X } from 'lucide-react';
import {
  DRONES,
  DroneDefinition,
  DroneId,
  DroneSlotId,
  getDroneModifierTags,
  getDroneUpgradeCost,
} from '../../../game/config/DroneConfig';
import { RARITY_CONFIG } from '../../../game/config/EquipmentConfig';
import { SoundManager } from '../../../game/audio/SoundManager';
import { isDroneActionableInSlot } from '../../../game/systems/NotificationStatus';
import { PlayerProgress } from '../../../game/utils/StorageManager';
import { NotificationDot } from '../../ui/NotificationDot';
import { DroneArtBadge } from '../ShipArtBadge';
import { DRONE_SLOT_ICON, DRONE_SLOTS, DroneSlotMeta } from './armoryUtils';

interface DroneSlotModalProps {
  slotMeta: DroneSlotMeta;
  slotItems: DroneDefinition[];
  activeDrone: DroneDefinition;
  progress: PlayerProgress;
  onSelectDrone: (id: DroneId) => void;
  onClose: () => void;
  onEquipConfirm: (drone: DroneDefinition, slotId: DroneSlotId) => void;
  onUnequipConfirm: (drone: DroneDefinition, slotId: DroneSlotId) => void;
  onBuyOrUpgradeConfirm: (drone: DroneDefinition, slotId: DroneSlotId) => void;
}

export const DroneSlotModal: React.FC<DroneSlotModalProps> = ({
  slotMeta,
  slotItems,
  activeDrone,
  progress,
  onSelectDrone,
  onClose,
  onEquipConfirm,
  onUnequipConfirm,
  onBuyOrUpgradeConfirm,
}) => {
  const HeaderSlotIcon = DRONE_SLOT_ICON[slotMeta.id];
  const otherSlotId: DroneSlotId = slotMeta.id === 'slot1' ? 'slot2' : 'slot1';
  const otherSlotMeta = DRONE_SLOTS.find((s) => s.id === otherSlotId) ?? DRONE_SLOTS[0];

  const currentEquippedId = progress.equippedDroneSlots[slotMeta.id];
  const currentEquippedName = currentEquippedId
    ? DRONES[currentEquippedId]?.name ?? 'Equipped'
    : 'Empty Slot';

  const rarity = RARITY_CONFIG[activeDrone.rarity];
  const lvl = progress.ownedDrones[activeDrone.id] ?? 0;
  const owned = lvl > 0;
  const equippedInThisSlot = progress.equippedDroneSlots[slotMeta.id] === activeDrone.id;
  const equippedInOtherSlot = progress.equippedDroneSlots[otherSlotId] === activeDrone.id;
  const maxed = lvl >= activeDrone.maxLevel;
  const upgCost = getDroneUpgradeCost(activeDrone, Math.max(1, lvl));
  const modifiers = getDroneModifierTags(activeDrone, Math.max(1, lvl));
  const nextModifiers =
    owned && !maxed ? getDroneModifierTags(activeDrone, lvl + 1) : [];
  const creditsNeeded = owned ? upgCost.credits : activeDrone.costCredits;
  const crystalsNeeded = owned ? upgCost.crystals : activeDrone.costCrystals;
  const affordable =
    progress.credits >= creditsNeeded && progress.crystals >= crystalsNeeded;

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
        className="pause-panel-enter flex max-h-[min(90dvh,760px)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-700/80 bg-[#081122]/98 shadow-2xl shadow-black/75"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Popup Header (Mirrors EquipmentGearModal 1:1) */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-800/85 px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-700/75 bg-[#050b18]">
              <HeaderSlotIcon
                className="h-5 w-5"
                style={{ color: slotMeta.accentHex }}
              />
            </span>
            <div className="min-w-0">
              <div className="font-mono-num text-[10.5px] font-semibold uppercase tracking-[0.12em] text-cyan-300">
                Equipment Slot · {slotMeta.title}
              </div>
              <h3
                id="drone-slot-popup-title"
                className="truncate font-display text-base sm:text-lg font-bold text-white"
              >
                Active: {currentEquippedName}
              </h3>
            </div>
          </div>

          <button
            type="button"
            aria-label="Close drone popup"
            onClick={() => {
              SoundManager.playButtonClick();
              onClose();
            }}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-700/80 bg-[#060c1a] text-slate-400 transition-colors hover:border-slate-500 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Popup Body */}
        <div className="scroll-panel flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4 sm:p-5">
          {/* Compatible Drones Grid (Filtered to clicked slot) */}
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {slotItems.map((item) => {
              const itemRarity = RARITY_CONFIG[item.rarity];
              const itemLvl = progress.ownedDrones[item.id] ?? 0;
              const itemOwned = itemLvl > 0;
              const itemEquippedHere = progress.equippedDroneSlots[slotMeta.id] === item.id;
              const itemEquippedOther = progress.equippedDroneSlots[otherSlotId] === item.id;
              const isSelected = activeDrone.id === item.id;
              const primaryMod = getDroneModifierTags(item, Math.max(1, itemLvl))[0];

              const droneActionable = isDroneActionableInSlot(progress, item, slotMeta.id);

              return (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => {
                    SoundManager.playButtonClick();
                    onSelectDrone(item.id);
                  }}
                  className={`relative flex min-h-[136px] flex-col justify-between rounded-xl border p-3 text-left transition-[border-color,background-color,transform] duration-150 active:scale-[0.98] ${
                    isSelected
                      ? 'border-cyan-300/85 bg-[#0e2140]/95'
                      : itemEquippedHere
                      ? 'border-emerald-400/55 bg-[#07191b]/90 hover:border-emerald-300/75'
                      : itemEquippedOther
                      ? 'border-amber-400/40 bg-[#171207]/75 hover:border-amber-300/65'
                      : itemOwned
                      ? 'border-slate-700/85 bg-[#081225]/92 hover:border-sky-300/50'
                      : 'border-slate-800/90 bg-[#050b18]/90 opacity-85 hover:opacity-100 hover:border-slate-600/80'
                  }`}
                >
                  <NotificationDot
                    visible={droneActionable}
                    position="corner-inset"
                    label={`${item.name} action available`}
                  />
                  <div className={`flex items-start justify-between gap-1.5 ${droneActionable ? 'pr-2.5' : ''}`}>
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border bg-[#050b18]"
                      style={{ borderColor: `${itemRarity.colorHex}50` }}
                    >
                      <DroneArtBadge
                        droneId={item.id}
                        colorHex={item.colorHex}
                        size={22}
                      />
                    </span>
                    <span
                      className={`flex items-center gap-0.5 font-mono-num text-[9.5px] font-bold ${
                        itemEquippedHere
                          ? 'text-emerald-300'
                          : itemEquippedOther
                          ? 'text-amber-300'
                          : itemOwned
                          ? 'text-sky-300'
                          : 'text-slate-500'
                      }`}
                    >
                      {!itemOwned && <Lock className="h-2.5 w-2.5" />}
                      <span>
                        {itemEquippedHere
                          ? 'EQUIPPED'
                          : itemEquippedOther
                          ? otherSlotMeta.title.toUpperCase()
                          : itemOwned
                          ? `Lv.${itemLvl}`
                          : 'LOCKED'}
                      </span>
                    </span>
                  </div>

                  <div className="my-2 min-w-0">
                    <div className="line-clamp-2 font-display text-xs font-bold leading-snug text-white">
                      {item.name}
                    </div>
                    <div className="mt-1 truncate font-mono-num text-[10px] font-medium text-sky-300/90">
                      {primaryMod}
                    </div>
                  </div>

                  <div className={`font-mono-num text-[10px] font-semibold ${itemRarity.textClass}`}>
                    {itemRarity.label}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected Drone Details & Actions (Mirrors EquipmentGearModal 1:1) */}
          <div
            key={activeDrone.id}
            className="panel-swap rounded-2xl border border-slate-800/90 bg-[#050b18]/90 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border bg-[#071022]"
                  style={{ borderColor: `${rarity.colorHex}55` }}
                >
                  <DroneArtBadge
                    droneId={activeDrone.id}
                    colorHex={activeDrone.colorHex}
                    size={32}
                  />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 font-mono-num text-[11px]">
                    <span className={`font-bold ${rarity.textClass}`}>{rarity.label}</span>
                    <span aria-hidden="true" className="text-slate-600">
                      ·
                    </span>
                    <span className={owned ? 'font-semibold text-emerald-300' : 'text-slate-400'}>
                      {owned
                        ? `Owned · Lv.${lvl}/${activeDrone.maxLevel}`
                        : 'Locked (Not Owned)'}
                    </span>
                    {equippedInThisSlot && (
                      <>
                        <span aria-hidden="true" className="text-slate-600">
                          ·
                        </span>
                        <span className="font-bold text-emerald-300">Equipped</span>
                      </>
                    )}
                    {equippedInOtherSlot && (
                      <>
                        <span aria-hidden="true" className="text-slate-600">
                          ·
                        </span>
                        <span className="font-bold text-amber-300">
                          Active in {otherSlotMeta.title}
                        </span>
                      </>
                    )}
                  </div>
                  <h4 className="mt-0.5 truncate font-display text-base sm:text-lg font-bold text-white">
                    {activeDrone.name}
                  </h4>
                </div>
              </div>
            </div>

            <p className="mt-2.5 text-xs leading-relaxed text-slate-300">
              {activeDrone.description}
            </p>

            <div className="mt-3 rounded-xl border border-slate-800/85 bg-[#071022]/85 p-3">
              <div className="font-mono-num text-[10.5px] font-semibold uppercase tracking-wider text-slate-400">
                {owned ? 'Drone Modifiers' : 'Base Modifiers (Lv.1)'}
              </div>
              <div className="mt-1.5 flex flex-col gap-1 font-mono-num text-xs font-semibold text-sky-300">
                {modifiers.map((m, idx) => (
                  <div key={m} className="flex items-center justify-between gap-2">
                    <span>{m}</span>
                    {nextModifiers[idx] && nextModifiers[idx] !== m && (
                      <span className="text-[11px] text-emerald-400">
                        → {nextModifiers[idx]}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
              {!owned ? (
                <div className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl border border-slate-800 bg-[#060c1a] px-3 text-xs font-medium text-slate-500">
                  <Lock className="h-3.5 w-3.5" />
                  <span>Purchase required to equip</span>
                </div>
              ) : equippedInThisSlot ? (
                <button
                  type="button"
                  onClick={() => onUnequipConfirm(activeDrone, slotMeta.id)}
                  className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl border border-emerald-400/50 bg-emerald-500/14 px-4 text-xs font-bold text-emerald-300 transition-colors hover:border-rose-400/55 hover:bg-rose-500/14 hover:text-rose-200"
                >
                  <Check className="h-4 w-4" />
                  <span>Equipped · Unequip</span>
                </button>
              ) : equippedInOtherSlot ? (
                <div className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl border border-amber-400/35 bg-amber-500/10 px-3 text-xs font-semibold text-amber-200/90">
                  <span>Active in {otherSlotMeta.title} · Unequip there first</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => onEquipConfirm(activeDrone, slotMeta.id)}
                  className="relative flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl border border-cyan-300/60 bg-cyan-400/14 px-4 text-xs font-bold text-cyan-100 transition-colors hover:bg-cyan-400/22"
                >
                  <NotificationDot
                    visible={!currentEquippedId}
                    position="corner"
                    label="Empty slot ready to equip"
                  />
                  <span>{currentEquippedId ? 'Replace Equipped' : 'Equip to Slot'}</span>
                </button>
              )}

              <button
                type="button"
                disabled={maxed}
                onClick={() => onBuyOrUpgradeConfirm(activeDrone, slotMeta.id)}
                className={`relative flex min-h-[44px] flex-1 items-center justify-center rounded-xl px-4 font-mono-num text-xs font-bold transition-[background-color,transform] duration-150 ${
                  maxed
                    ? 'cursor-not-allowed border border-slate-800 bg-slate-950 text-slate-500'
                    : affordable
                    ? 'bg-sky-400 text-slate-950 hover:bg-sky-300 active:scale-[0.98]'
                    : 'border border-slate-700/80 bg-slate-900/90 text-slate-300 hover:border-slate-500'
                }`}
              >
                <NotificationDot
                  visible={!maxed && affordable && !equippedInOtherSlot}
                  position="corner"
                  label={owned ? 'Ready to enhance' : 'Ready to purchase'}
                />
                {maxed
                  ? 'MAX LEVEL REACHED'
                  : owned
                  ? `Enhance Lv.${lvl + 1} (${upgCost.credits.toLocaleString()} CR${
                      upgCost.crystals > 0 ? ` · ${upgCost.crystals} Gems` : ''
                    })`
                  : `Buy Drone (${activeDrone.costCredits.toLocaleString()} CR${
                      activeDrone.costCrystals > 0 ? ` · ${activeDrone.costCrystals} Gems` : ''
                    })`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
