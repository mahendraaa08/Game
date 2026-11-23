import React from 'react';
import { Check, Lock, X } from 'lucide-react';
import {
  EQUIPMENT_BY_ID,
  EquipmentDefinition,
  getEquipmentUpgradeCost,
  RARITY_CONFIG,
  scaleEquipmentBonuses,
} from '../../../game/config/EquipmentConfig';
import { SoundManager } from '../../../game/audio/SoundManager';
import { isEquipmentItemActionableInSlot } from '../../../game/systems/NotificationStatus';
import { PlayerProgress } from '../../../game/utils/StorageManager';
import { NotificationDot } from '../../ui/NotificationDot';
import { EquipmentSlotMeta, formatBonusTags, SLOT_ICON } from './armoryUtils';

interface EquipmentGearModalProps {
  slotMeta: EquipmentSlotMeta;
  slotItems: EquipmentDefinition[];
  activeItem: EquipmentDefinition;
  progress: PlayerProgress;
  onSelectItem: (id: string) => void;
  onClose: () => void;
  onEquipConfirm: (item: EquipmentDefinition) => void;
  onBuyOrEnhanceConfirm: (item: EquipmentDefinition) => void;
}

export const EquipmentGearModal: React.FC<EquipmentGearModalProps> = ({
  slotMeta,
  slotItems,
  activeItem,
  progress,
  onSelectItem,
  onClose,
  onEquipConfirm,
  onBuyOrEnhanceConfirm,
}) => {
  const HeaderSlotIcon = SLOT_ICON[slotMeta.id];
  const currentEquippedId = progress.equippedGear[slotMeta.id];
  const currentEquippedName = currentEquippedId
    ? EQUIPMENT_BY_ID[currentEquippedId]?.name ?? 'Equipped'
    : 'Empty Slot';

  const rarity = RARITY_CONFIG[activeItem.rarity];
  const lvl = progress.ownedEquipment[activeItem.id] ?? 0;
  const owned = lvl > 0;
  const equipped = progress.equippedGear[activeItem.slot] === activeItem.id;
  const maxed = lvl >= activeItem.maxLevel;
  const upgCost = getEquipmentUpgradeCost(activeItem, Math.max(1, lvl));
  const scaled = scaleEquipmentBonuses(activeItem, Math.max(1, lvl));
  const nextScaled = owned && !maxed ? scaleEquipmentBonuses(activeItem, lvl + 1) : null;
  const bonuses = formatBonusTags(scaled);
  const nextBonuses = nextScaled ? formatBonusTags(nextScaled) : [];
  const creditsNeeded = owned ? upgCost.credits : activeItem.costCredits;
  const crystalsNeeded = owned ? upgCost.crystals : activeItem.costCrystals;
  const affordable = progress.credits >= creditsNeeded && progress.crystals >= crystalsNeeded;
  const ActiveItemIcon = SLOT_ICON[activeItem.slot];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="gear-slot-popup-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#03060f]/82 p-3 sm:p-5 backdrop-blur-sm"
      onClick={() => {
        SoundManager.playButtonClick();
        onClose();
      }}
    >
      <div
        className="pause-panel-enter flex max-h-[min(90dvh,780px)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-700/80 bg-[#081122]/98 shadow-2xl shadow-black/75"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Popup Header */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-800/85 px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-700/75 bg-[#050b18]">
              <HeaderSlotIcon className="h-5 w-5" style={{ color: slotMeta.accentHex }} />
            </span>
            <div className="min-w-0">
              <div className="font-mono-num text-[10.5px] font-semibold uppercase tracking-[0.12em] text-cyan-300">
                Equipment Slot · {slotMeta.title}
              </div>
              <h3
                id="gear-slot-popup-title"
                className="truncate font-display text-base sm:text-lg font-bold text-white"
              >
                Active: {currentEquippedName}
              </h3>
            </div>
          </div>

          <button
            type="button"
            aria-label="Close equipment popup"
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
          {/* Compatible Items Grid (Strictly matching clicked slot: 5 rarities) */}
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
            {slotItems.map((item) => {
              const itemRarity = RARITY_CONFIG[item.rarity];
              const itemLvl = progress.ownedEquipment[item.id] ?? 0;
              const itemOwned = itemLvl > 0;
              const itemEquipped = progress.equippedGear[item.slot] === item.id;
              const isSelected = activeItem.id === item.id;
              const ItemIcon = SLOT_ICON[item.slot];
              const primaryMod =
                formatBonusTags(scaleEquipmentBonuses(item, Math.max(1, itemLvl)))[0] ??
                item.passiveText;

              const itemActionable = isEquipmentItemActionableInSlot(progress, item);

              return (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => {
                    SoundManager.playButtonClick();
                    onSelectItem(item.id);
                  }}
                  className={`relative flex min-h-[136px] flex-col justify-between rounded-xl border p-3 text-left transition-[border-color,background-color,transform] duration-150 active:scale-[0.98] ${
                    isSelected
                      ? 'border-cyan-300/85 bg-[#0e2140]/95'
                      : itemEquipped
                      ? 'border-emerald-400/55 bg-[#07191b]/90 hover:border-emerald-300/75'
                      : itemOwned
                      ? 'border-slate-700/85 bg-[#081225]/92 hover:border-sky-300/50'
                      : 'border-slate-800/90 bg-[#050b18]/90 opacity-85 hover:opacity-100 hover:border-slate-600/80'
                  }`}
                >
                  <NotificationDot
                    visible={itemActionable}
                    position="corner-inset"
                    label={`${item.name} action available`}
                  />
                  <div className={`flex items-start justify-between gap-1.5 ${itemActionable ? 'pr-2.5' : ''}`}>
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border bg-[#050b18]"
                      style={{ borderColor: `${itemRarity.colorHex}50` }}
                    >
                      <ItemIcon className="h-4 w-4" style={{ color: itemRarity.colorHex }} />
                    </span>
                    <span
                      className={`flex items-center gap-0.5 font-mono-num text-[9.5px] font-bold ${
                        itemEquipped
                          ? 'text-emerald-300'
                          : itemOwned
                          ? 'text-sky-300'
                          : 'text-slate-500'
                      }`}
                    >
                      {!itemOwned && <Lock className="h-2.5 w-2.5" />}
                      <span>
                        {itemEquipped ? 'EQUIPPED' : itemOwned ? `Lv.${itemLvl}` : 'LOCKED'}
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

          {/* Selected Item Details & Actions */}
          <div
            key={activeItem.id}
            className="panel-swap rounded-2xl border border-slate-800/90 bg-[#050b18]/90 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border bg-[#071022]"
                  style={{ borderColor: `${rarity.colorHex}55` }}
                >
                  <ActiveItemIcon className="h-5 w-5" style={{ color: rarity.colorHex }} />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 font-mono-num text-[11px]">
                    <span className={`font-bold ${rarity.textClass}`}>{rarity.label}</span>
                    <span aria-hidden="true" className="text-slate-600">
                      ·
                    </span>
                    <span className={owned ? 'font-semibold text-emerald-300' : 'text-slate-400'}>
                      {owned ? `Owned · Lv.${lvl}/${activeItem.maxLevel}` : 'Locked (Not Owned)'}
                    </span>
                    {equipped && (
                      <>
                        <span aria-hidden="true" className="text-slate-600">
                          ·
                        </span>
                        <span className="font-bold text-emerald-300">Equipped</span>
                      </>
                    )}
                  </div>
                  <h4 className="mt-0.5 truncate font-display text-base sm:text-lg font-bold text-white">
                    {activeItem.name}
                  </h4>
                </div>
              </div>
            </div>

            <p className="mt-2.5 text-xs leading-relaxed text-slate-300">
              {activeItem.description}
            </p>

            <div className="mt-3 rounded-xl border border-slate-800/85 bg-[#071022]/85 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2 font-mono-num text-[10.5px] font-semibold uppercase tracking-wider text-slate-400">
                <span>{owned ? 'Module Modifiers' : 'Base Modifiers (Lv.1)'}</span>
                <span className={rarity.textClass}>
                  {rarity.statMultiplier.toFixed(2)}x Rarity · +20%/Lv
                </span>
              </div>
              <div className="mt-1.5 flex flex-col gap-1 font-mono-num text-xs font-semibold text-sky-300">
                {bonuses.map((b, idx) => (
                  <div key={b} className="flex items-center justify-between gap-2">
                    <span>{b}</span>
                    {nextBonuses[idx] && nextBonuses[idx] !== b && (
                      <span className="text-[11px] text-emerald-400">→ {nextBonuses[idx]}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {activeItem.rarityEffect && (
              <div className="mt-2.5 rounded-xl border border-slate-800/85 bg-[#060d1c]/90 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2 font-mono-num text-[10.5px]">
                  <span className={`font-bold uppercase tracking-wider ${rarity.textClass}`}>
                    {rarity.label} Perk · {activeItem.rarityEffect.label}
                  </span>
                  <span className="text-slate-400">
                    {(activeItem.rarityEffect.cooldownMs / 1000).toFixed(1)}s ICD
                  </span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-slate-300">
                  {activeItem.rarityEffect.description}
                </p>
              </div>
            )}

            <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
              {!owned ? (
                <div className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl border border-slate-800 bg-[#060c1a] px-3 text-xs font-medium text-slate-500">
                  <Lock className="h-3.5 w-3.5" />
                  <span>Purchase required to equip</span>
                </div>
              ) : equipped ? (
                <button
                  type="button"
                  onClick={() => onEquipConfirm(activeItem)}
                  className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl border border-emerald-400/50 bg-emerald-500/14 px-4 text-xs font-bold text-emerald-300 transition-colors hover:border-rose-400/55 hover:bg-rose-500/14 hover:text-rose-200"
                >
                  <Check className="h-4 w-4" />
                  <span>Equipped · Unequip</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onEquipConfirm(activeItem)}
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
                onClick={() => onBuyOrEnhanceConfirm(activeItem)}
                className={`relative flex min-h-[44px] flex-1 items-center justify-center rounded-xl px-4 font-mono-num text-xs font-bold transition-[background-color,transform] duration-150 ${
                  maxed
                    ? 'cursor-not-allowed border border-slate-800 bg-slate-950 text-slate-500'
                    : affordable
                    ? 'bg-sky-400 text-slate-950 hover:bg-sky-300 active:scale-[0.98]'
                    : 'border border-slate-700/80 bg-slate-900/90 text-slate-300 hover:border-slate-500'
                }`}
              >
                <NotificationDot
                  visible={!maxed && affordable}
                  position="corner"
                  label={owned ? 'Ready to enhance' : 'Ready to purchase'}
                />
                {maxed
                  ? 'MAX LEVEL REACHED'
                  : owned
                  ? `Enhance Lv.${lvl + 1} (${upgCost.credits.toLocaleString()} CR${
                      upgCost.crystals > 0 ? ` · ${upgCost.crystals} Gems` : ''
                    })`
                  : `Buy Module (${activeItem.costCredits.toLocaleString()} CR${
                      activeItem.costCrystals > 0 ? ` · ${activeItem.costCrystals} Gems` : ''
                    })`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
