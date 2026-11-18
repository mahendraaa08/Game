import React, { useEffect, useMemo, useState } from 'react';
import { Cpu, Lock, Plus, Sword } from 'lucide-react';
import {
  DRONE_LIST,
  DRONES,
  DroneDefinition,
  DroneId,
  getDronePowerAtLevel,
  getDroneUpgradeCost,
} from '../../game/config/DroneConfig';
import {
  EQUIPMENT_BY_ID,
  EQUIPMENT_LIST,
  EquipmentDefinition,
  EquipmentSlot,
  getEquipmentUpgradeCost,
  RARITY_CONFIG,
  scaleEquipmentBonuses,
} from '../../game/config/EquipmentConfig';
import { SoundManager } from '../../game/audio/SoundManager';
import { ActionResult, ProgressionManager } from '../../game/systems/ProgressionManager';
import { PlayerProgress } from '../../game/utils/StorageManager';
import { ActionConfirmDialog, PendingHangarAction } from './ActionConfirmDialog';
import { DroneArtBadge } from './ShipArtBadge';
import {
  EQUIPMENT_SLOTS,
  SLOT_ICON,
  formatBonusTags,
  formatDronePower,
} from './armory/armoryUtils';
import { EquipmentGearModal } from './armory/EquipmentGearModal';
import { DroneInfoModal, DroneSlotPickerModal } from './armory/DroneModals';

interface ArmoryDronesPanelProps {
  progress: PlayerProgress;
  onFeedback: (res: ActionResult) => void;
}

export const ArmoryDronesPanel: React.FC<ArmoryDronesPanelProps> = ({ progress, onFeedback }) => {
  const [armoryTab, setArmoryTab] = useState<'gear' | 'drones'>('gear');

  // Equipment Gear Popup State (Slot -> Compatible Items Selection Popup)
  const [activeGearSlotModal, setActiveGearSlotModal] = useState<EquipmentSlot | null>(null);
  const [selectedGearId, setSelectedGearId] = useState<string>(EQUIPMENT_LIST[0].id);

  // Companion Drones Popup State (Slot Selection Popup OR Drone Info Popup — zero stacking)
  const [dronePickerSlotIndex, setDronePickerSlotIndex] = useState<0 | 1 | null>(null);
  const [inspectedDronePopup, setInspectedDronePopup] = useState<{
    droneId: DroneId;
    fromSlotIndex: 0 | 1 | null;
  } | null>(null);

  const [pendingAction, setPendingAction] = useState<PendingHangarAction | null>(null);

  // Escape key support for Armory popups when confirm dialog is closed
  useEffect(() => {
    const hasPopup =
      activeGearSlotModal !== null ||
      dronePickerSlotIndex !== null ||
      inspectedDronePopup !== null;
    if (!hasPopup || pendingAction !== null) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        SoundManager.playButtonClick();
        setActiveGearSlotModal(null);
        setDronePickerSlotIndex(null);
        setInspectedDronePopup(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeGearSlotModal, dronePickerSlotIndex, inspectedDronePopup, pendingAction]);

  // Clear popups cleanly when switching Armory tabs
  const switchArmoryTab = (tab: 'gear' | 'drones') => {
    SoundManager.playButtonClick();
    setActiveGearSlotModal(null);
    setDronePickerSlotIndex(null);
    setInspectedDronePopup(null);
    setArmoryTab(tab);
  };

  // Equipment items compatible with the currently opened Equipment Slot popup
  const modalSlotItems = useMemo(() => {
    if (!activeGearSlotModal) return [];
    return EQUIPMENT_LIST.filter((item) => item.slot === activeGearSlotModal);
  }, [activeGearSlotModal]);

  const activeGearItem: EquipmentDefinition | null = useMemo(() => {
    if (!activeGearSlotModal) return null;
    const picked = EQUIPMENT_BY_ID[selectedGearId];
    if (picked && picked.slot === activeGearSlotModal) return picked;
    const equippedId = progress.equippedGear[activeGearSlotModal];
    if (equippedId && EQUIPMENT_BY_ID[equippedId]) return EQUIPMENT_BY_ID[equippedId];
    return modalSlotItems[0] ?? null;
  }, [activeGearSlotModal, selectedGearId, progress.equippedGear, modalSlotItems]);

  const equippedGearCount = useMemo(
    () => EQUIPMENT_SLOTS.filter((slot) => Boolean(progress.equippedGear[slot.id])).length,
    [progress.equippedGear]
  );

  // Open Equipment Gear Slot Selection Popup
  const openGearSlotPopup = (slot: EquipmentSlot) => {
    SoundManager.unlock();
    SoundManager.playButtonClick();
    const equippedId = progress.equippedGear[slot];
    const firstSlotItem = EQUIPMENT_LIST.find((e) => e.slot === slot);
    setSelectedGearId(equippedId ?? firstSlotItem?.id ?? EQUIPMENT_LIST[0].id);
    setActiveGearSlotModal(slot);
  };

  // Open Drone Slot Selection Popup
  const openDroneSlotPopup = (slotIndex: 0 | 1) => {
    SoundManager.unlock();
    SoundManager.playButtonClick();
    setInspectedDronePopup(null);
    setDronePickerSlotIndex(slotIndex);
  };

  // Open Drone Information Popup (either directly from grid OR from inside Slot Selection Popup)
  const openDroneInfoPopup = (droneId: DroneId, fromSlotIndex: 0 | 1 | null = null) => {
    SoundManager.unlock();
    SoundManager.playButtonClick();
    setDronePickerSlotIndex(null);
    setInspectedDronePopup({ droneId, fromSlotIndex });
  };

  // ---- UNIVERSAL CONFIRMATION DIALOG TRIGGERS ----

  const openGearBuyOrEnhanceConfirm = (item: EquipmentDefinition) => {
    const lvl = progress.ownedEquipment[item.id] ?? 0;
    const owned = lvl > 0;
    if (lvl >= item.maxLevel) return;

    const rarity = RARITY_CONFIG[item.rarity];
    const upgCost = getEquipmentUpgradeCost(item, Math.max(1, lvl));
    const creditsCost = owned ? upgCost.credits : item.costCredits;
    const crystalsCost = owned ? upgCost.crystals : item.costCrystals;
    const curBonuses = formatBonusTags(scaleEquipmentBonuses(item, Math.max(1, lvl)));
    const nextBonuses = owned ? formatBonusTags(scaleEquipmentBonuses(item, lvl + 1)) : [];
    const SlotIcon = SLOT_ICON[item.slot];

    SoundManager.unlock();
    SoundManager.playButtonClick();

    setPendingAction({
      id: `gear-tx-${item.id}-${lvl}`,
      category: owned ? 'upgrade' : 'purchase',
      title: owned ? 'Confirm Enhancement' : 'Confirm Purchase',
      itemName: item.name,
      itemSubtitle: `${rarity.label} · ${item.slot.toUpperCase()} Slot`,
      description: item.description,
      icon: <SlotIcon className="h-5 w-5" style={{ color: rarity.colorHex }} />,
      statDeltas: owned
        ? [
            { label: 'Module Level', before: `Lv.${lvl}`, after: `Lv.${lvl + 1}` },
            ...curBonuses.slice(0, 2).map((b, idx) => ({
              label: `Modifier ${idx + 1}`,
              before: b,
              after: nextBonuses[idx],
            })),
          ]
        : curBonuses.slice(0, 3).map((b, idx) => ({
            label: `Base Effect ${idx + 1}`,
            before: b,
          })),
      creditsCost,
      crystalsCost,
      execute: () => ProgressionManager.buyOrUpgradeEquipment(item.id),
    });
  };

  const openGearEquipConfirm = (item: EquipmentDefinition) => {
    const lvl = progress.ownedEquipment[item.id] ?? 0;
    if (lvl <= 0) return;

    const rarity = RARITY_CONFIG[item.rarity];
    const equipped = progress.equippedGear[item.slot] === item.id;
    const currentSlotItemId = progress.equippedGear[item.slot];
    const currentSlotItemName = currentSlotItemId
      ? EQUIPMENT_BY_ID[currentSlotItemId]?.name ?? 'Occupied'
      : 'Empty Slot';
    const SlotIcon = SLOT_ICON[item.slot];

    SoundManager.unlock();
    SoundManager.playButtonClick();

    setPendingAction({
      id: `gear-equip-${item.id}-${equipped ? 'off' : 'on'}`,
      category: 'equip',
      title: equipped ? 'Confirm Unequip' : 'Confirm Equip',
      itemName: item.name,
      itemSubtitle: `${rarity.label} · ${item.slot.toUpperCase()} Slot · Lv.${lvl}`,
      description: equipped
        ? `Remove ${item.name} from your active ${item.slot} equipment slot?`
        : `Install ${item.name} into your ${item.slot} equipment slot.`,
      note:
        !equipped && currentSlotItemId && currentSlotItemId !== item.id
          ? `Replaces currently equipped ${currentSlotItemName}.`
          : undefined,
      icon: <SlotIcon className="h-5 w-5" style={{ color: rarity.colorHex }} />,
      statDeltas: [
        {
          label: `${item.slot.toUpperCase()} Slot`,
          before: currentSlotItemName,
          after: equipped ? 'Empty Slot' : item.name,
        },
      ],
      execute: () => ProgressionManager.toggleEquipGear(item.id),
    });
  };

  const openDroneBuyOrUpgradeConfirm = (d: DroneDefinition) => {
    const lvl = progress.ownedDrones[d.id] ?? 0;
    const owned = lvl > 0;
    if (lvl >= d.maxLevel) return;

    const upgCost = getDroneUpgradeCost(d, Math.max(1, lvl));
    const creditsCost = owned ? upgCost.credits : d.costCredits;
    const crystalsCost = owned ? upgCost.crystals : d.costCrystals;
    const curPower = getDronePowerAtLevel(d, Math.max(1, lvl));
    const nextPower = owned ? getDronePowerAtLevel(d, lvl + 1) : curPower;

    SoundManager.unlock();
    SoundManager.playButtonClick();

    setPendingAction({
      id: `drone-tx-${d.id}-${lvl}`,
      category: owned ? 'upgrade' : 'purchase',
      title: owned ? 'Confirm Upgrade' : 'Confirm Unlock',
      itemName: d.name,
      itemSubtitle: `${d.role} Wingman Drone`,
      description: d.description,
      icon: <DroneArtBadge droneId={d.id} colorHex={d.colorHex} size={34} />,
      statDeltas: owned
        ? [
            { label: 'Drone Level', before: `Lv.${lvl}`, after: `Lv.${lvl + 1}` },
            {
              label: 'Wingman Output',
              before: formatDronePower(d, curPower),
              after: formatDronePower(d, nextPower),
            },
          ]
        : [{ label: 'Wingman Output (Lv.1)', before: formatDronePower(d, curPower) }],
      creditsCost,
      crystalsCost,
      execute: () => ProgressionManager.buyOrUpgradeDrone(d.id),
    });
  };

  const openDroneEquipConfirm = (d: DroneDefinition, targetSlotIndex?: 0 | 1) => {
    const lvl = progress.ownedDrones[d.id] ?? 0;
    if (lvl <= 0 || progress.equippedDrones.includes(d.id)) return;

    const equippedCount = progress.equippedDrones.length;
    const isReplacing = equippedCount >= 2;
    const replaceIdx: 0 | 1 = isReplacing
      ? targetSlotIndex === 1
        ? 1
        : 0
      : (equippedCount as 0 | 1);
    const slotLabel = `Equipment Slot 0${replaceIdx + 1}`;
    const currentSlotDroneId = isReplacing ? progress.equippedDrones[replaceIdx] : null;
    const currentSlotDrone = currentSlotDroneId ? DRONES[currentSlotDroneId] : null;
    const curPower = getDronePowerAtLevel(d, lvl);

    SoundManager.unlock();
    SoundManager.playButtonClick();

    setPendingAction({
      id: `drone-equip-${d.id}-s${replaceIdx}`,
      category: 'equip',
      title: isReplacing ? 'Confirm Replace Drone' : 'Confirm Equip Drone',
      itemName: d.name,
      itemSubtitle: `${d.role} · Lv.${lvl}/${d.maxLevel}`,
      description:
        isReplacing && currentSlotDrone
          ? `Replace ${currentSlotDrone.name} in ${slotLabel} with ${d.name}?`
          : `Equip ${d.name} into ${slotLabel} for combat and passive wingman bonuses.`,
      note:
        isReplacing && currentSlotDrone
          ? `${currentSlotDrone.name} will return to reserve and its wingman bonus will deactivate.`
          : undefined,
      icon: <DroneArtBadge droneId={d.id} colorHex={d.colorHex} size={34} />,
      statDeltas: [
        {
          label: slotLabel,
          before: currentSlotDrone ? currentSlotDrone.name : 'Empty Slot',
          after: d.name,
        },
        {
          label: 'Wingman Output',
          before: currentSlotDrone
            ? formatDronePower(
                currentSlotDrone,
                getDronePowerAtLevel(
                  currentSlotDrone,
                  Math.max(1, progress.ownedDrones[currentSlotDrone.id] ?? 1)
                )
              )
            : 'None',
          after: formatDronePower(d, curPower),
        },
      ],
      execute: () => ProgressionManager.equipDrone(d.id, isReplacing ? replaceIdx : undefined),
    });
  };

  const openDroneUnequipConfirm = (d: DroneDefinition) => {
    const lvl = progress.ownedDrones[d.id] ?? 0;
    const slotIdx = progress.equippedDrones.indexOf(d.id);
    if (lvl <= 0 || slotIdx === -1) return;

    const slotLabel = `Equipment Slot 0${slotIdx + 1}`;
    const curPower = getDronePowerAtLevel(d, lvl);

    SoundManager.unlock();
    SoundManager.playButtonClick();

    setPendingAction({
      id: `drone-unequip-${d.id}`,
      category: 'equip',
      title: 'Confirm Unequip Drone',
      itemName: d.name,
      itemSubtitle: `${slotLabel} · Lv.${lvl}/${d.maxLevel}`,
      description: `Unequip ${d.name} from ${slotLabel}? Active wingman combat support and passive effects will stop until re-equipped.`,
      icon: <DroneArtBadge droneId={d.id} colorHex={d.colorHex} size={34} />,
      statDeltas: [
        {
          label: slotLabel,
          before: d.name,
          after: 'Empty Slot',
        },
        {
          label: 'Active Wingman',
          before: formatDronePower(d, curPower),
          after: 'Inactive',
        },
      ],
      execute: () => ProgressionManager.unequipDrone(d.id),
    });
  };

  const activeGearSlotMeta = activeGearSlotModal
    ? EQUIPMENT_SLOTS.find((s) => s.id === activeGearSlotModal) ?? EQUIPMENT_SLOTS[0]
    : null;

  const inspectedDroneDef = inspectedDronePopup ? DRONES[inspectedDronePopup.droneId] : null;

  return (
    <>
      <div className="flex flex-col gap-5">
        {/* Clean 2-Tab Armory Switcher */}
        <div
          role="tablist"
          aria-label="Armory Categories"
          className="grid w-full sm:w-auto grid-cols-2 gap-1.5 rounded-xl border border-slate-800/90 bg-[#060d1c]/90 p-1 sm:inline-grid"
        >
          <button
            type="button"
            role="tab"
            aria-selected={armoryTab === 'gear'}
            onClick={() => switchArmoryTab('gear')}
            className={`flex min-h-[42px] items-center justify-center gap-2 rounded-lg px-4 sm:px-5 text-xs font-bold transition-colors ${
              armoryTab === 'gear'
                ? 'border border-cyan-300/50 bg-cyan-400/16 text-cyan-100'
                : 'border border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sword className="h-3.5 w-3.5 text-cyan-300" />
            <span>Equipment Gear ({equippedGearCount}/4)</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={armoryTab === 'drones'}
            onClick={() => switchArmoryTab('drones')}
            className={`flex min-h-[42px] items-center justify-center gap-2 rounded-lg px-4 sm:px-5 text-xs font-bold transition-colors ${
              armoryTab === 'drones'
                ? 'border border-purple-300/50 bg-purple-400/16 text-purple-100'
                : 'border border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="h-3.5 w-3.5 text-purple-300" />
            <span>Companion Drones ({progress.equippedDrones.length}/2)</span>
          </button>
        </div>

        {/* ===================================================================== */}
        {/* 1. EQUIPMENT GEAR — SLOT-FIRST ARCHITECTURE                           */}
        {/* ===================================================================== */}
        {armoryTab === 'gear' && (
          <div className="panel-swap flex flex-col gap-5">
            <section aria-label="Equipment Gear Slots">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div>
                  <h2 className="font-display text-sm sm:text-base font-bold tracking-wide text-white">
                    EQUIPMENT SLOTS
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-400">
                    Select any equipment slot to equip, replace, or upgrade compatible modules.
                  </p>
                </div>
                <span className="font-mono-num text-[11px] font-semibold text-cyan-300">
                  {equippedGearCount}/4 Equipped · {Object.keys(progress.ownedEquipment).length}/16 Owned
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
                {EQUIPMENT_SLOTS.map((slotMeta) => {
                  const SlotIcon = SLOT_ICON[slotMeta.id];
                  const equippedId = progress.equippedGear[slotMeta.id];
                  const equippedItem = equippedId ? EQUIPMENT_BY_ID[equippedId] : null;
                  const equippedLvl = equippedItem ? progress.ownedEquipment[equippedItem.id] ?? 1 : 0;
                  const rarity = equippedItem ? RARITY_CONFIG[equippedItem.rarity] : null;
                  const primaryStat = equippedItem
                    ? formatBonusTags(scaleEquipmentBonuses(equippedItem, Math.max(1, equippedLvl)))[0]
                    : null;
                  const ownedInSlot = EQUIPMENT_LIST.filter(
                    (e) => e.slot === slotMeta.id && (progress.ownedEquipment[e.id] ?? 0) > 0
                  ).length;

                  return (
                    <button
                      key={slotMeta.id}
                      type="button"
                      onClick={() => openGearSlotPopup(slotMeta.id)}
                      className={`group flex min-h-[188px] sm:min-h-[204px] flex-col justify-between rounded-2xl border p-4 text-left touch-pan-y transition-[border-color,background-color,transform] duration-150 active:scale-[0.985] focus-visible:outline-2 focus-visible:outline-cyan-400 ${
                        equippedItem
                          ? 'border-emerald-400/50 bg-[#07191b]/90 hover:border-cyan-300/75 hover:bg-[#092127]'
                          : 'border-dashed border-slate-700/80 bg-[#060c1a]/88 hover:border-cyan-300/60 hover:bg-[#081326]'
                      }`}
                    >
                      {/* Top Row: Slot Type + Status */}
                      <div className="flex w-full items-center justify-between gap-2 font-mono-num text-[10.5px]">
                        <span className={`font-bold uppercase tracking-wider ${slotMeta.accentClass}`}>
                          {slotMeta.title}
                        </span>
                        {equippedItem ? (
                          <span className="font-bold text-emerald-300">EQUIPPED</span>
                        ) : (
                          <span className="text-slate-500">EMPTY</span>
                        )}
                      </div>

                      {/* Center Visual & Identity */}
                      {equippedItem && rarity ? (
                        <div className="my-3 flex flex-col gap-2.5">
                          <div className="flex items-center gap-3">
                            <span
                              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border bg-[#050b18]"
                              style={{ borderColor: `${rarity.colorHex}60` }}
                            >
                              <SlotIcon className="h-5 w-5" style={{ color: rarity.colorHex }} />
                            </span>
                            <div className="min-w-0">
                              <div className={`font-mono-num text-[10.5px] font-bold ${rarity.textClass}`}>
                                {rarity.label} · Lv.{equippedLvl}/{equippedItem.maxLevel}
                              </div>
                              <div className="mt-0.5 line-clamp-2 font-display text-xs sm:text-sm font-bold leading-snug text-white">
                                {equippedItem.name}
                              </div>
                            </div>
                          </div>
                          {primaryStat && (
                            <div className="truncate font-mono-num text-[11px] font-semibold text-sky-300">
                              {primaryStat}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="my-3 flex flex-col items-center justify-center gap-2 text-center">
                          <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-800 bg-[#081122] text-slate-500 transition-colors group-hover:border-cyan-400/40 group-hover:text-cyan-300">
                            <SlotIcon className="h-5 w-5" />
                          </span>
                          <div>
                            <div className="font-display text-xs sm:text-sm font-bold text-slate-200">
                              Select Equipment
                            </div>
                            <div className="mt-0.5 font-mono-num text-[10.5px] text-slate-500">
                              {slotMeta.emptyHint}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Footer Meta */}
                      <div className="flex w-full items-center justify-between gap-2 border-t border-slate-800/80 pt-2.5 font-mono-num text-[10.5px] text-slate-400">
                        <span>{ownedInSlot}/4 Owned</span>
                        <span className="text-cyan-300/90 group-hover:text-cyan-200">
                          {equippedItem ? 'Manage' : 'Browse'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {/* ===================================================================== */}
        {/* 2. COMPANION DRONES — SLOT-FIRST + DRONE GRID (NO PERMANENT INFO BOX) */}
        {/* ===================================================================== */}
        {armoryTab === 'drones' && (
          <div className="panel-swap flex flex-col gap-6">
            {/* Area 1: Active Equipment Slots */}
            <section aria-label="Companion Drone Equipment Slots">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div>
                  <h2 className="font-display text-sm sm:text-base font-bold tracking-wide text-white">
                    EQUIPMENT SLOTS
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-400">
                    Tap a wingman slot to choose, replace, or unequip an active companion drone.
                  </p>
                </div>
                <span className="font-mono-num text-[11px] font-semibold text-purple-300">
                  {progress.equippedDrones.length}/2 Active Wingmen
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3.5 sm:max-w-2xl">
                {([0, 1] as const).map((slotIndex) => {
                  const slotDroneId = progress.equippedDrones[slotIndex];
                  const slotDrone = slotDroneId ? DRONES[slotDroneId] : null;
                  const slotLvl = slotDrone ? progress.ownedDrones[slotDrone.id] ?? 1 : 0;
                  const slotPower = slotDrone
                    ? getDronePowerAtLevel(slotDrone, Math.max(1, slotLvl))
                    : 0;

                  return (
                    <button
                      key={`drone-slot-${slotIndex}`}
                      type="button"
                      onClick={() => openDroneSlotPopup(slotIndex)}
                      className={`group flex min-h-[188px] sm:min-h-[196px] flex-col justify-between rounded-2xl border p-4 text-left touch-pan-y transition-[border-color,background-color,transform] duration-150 active:scale-[0.985] focus-visible:outline-2 focus-visible:outline-cyan-400 ${
                        slotDrone
                          ? 'border-emerald-400/50 bg-[#07191b]/90 hover:border-cyan-300/75 hover:bg-[#092127]'
                          : 'border-dashed border-slate-700/80 bg-[#060c1a]/88 hover:border-purple-300/60 hover:bg-[#0c1229]'
                      }`}
                    >
                      <div className="flex w-full items-center justify-between gap-2 font-mono-num text-[10.5px]">
                        <span className="font-bold uppercase tracking-wider text-purple-300">
                          Slot 0{slotIndex + 1}
                        </span>
                        {slotDrone ? (
                          <span className="font-bold text-emerald-300">EQUIPPED</span>
                        ) : (
                          <span className="text-slate-500">EMPTY</span>
                        )}
                      </div>

                      {slotDrone ? (
                        <div className="my-3 flex flex-col gap-2.5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-slate-700/75 bg-[#050b18]">
                              <DroneArtBadge
                                droneId={slotDrone.id}
                                colorHex={slotDrone.colorHex}
                                size={36}
                              />
                            </div>
                            <div className="min-w-0">
                              <div className="font-mono-num text-[10.5px] font-semibold text-slate-400">
                                {slotDrone.role} · Lv.{slotLvl}/{slotDrone.maxLevel}
                              </div>
                              <div className="mt-0.5 truncate font-display text-xs sm:text-sm font-bold text-white">
                                {slotDrone.name}
                              </div>
                            </div>
                          </div>
                          <div
                            className="font-mono-num text-xs font-bold"
                            style={{ color: slotDrone.colorHex }}
                          >
                            {formatDronePower(slotDrone, slotPower)}
                          </div>
                        </div>
                      ) : (
                        <div className="my-3 flex flex-col items-center justify-center gap-2 text-center">
                          <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-800 bg-[#081122] text-slate-500 transition-colors group-hover:border-purple-400/45 group-hover:text-purple-300">
                            <Plus className="h-5 w-5" />
                          </span>
                          <div>
                            <div className="font-display text-xs sm:text-sm font-bold text-slate-200">
                              Select Drone
                            </div>
                            <div className="mt-0.5 font-mono-num text-[10.5px] text-slate-500">
                              Wingman Slot 0{slotIndex + 1}
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex w-full items-center justify-between gap-2 border-t border-slate-800/80 pt-2.5 font-mono-num text-[10.5px] text-slate-400">
                        <span>{slotDrone ? `Lv.${slotLvl}/${slotDrone.maxLevel}` : 'Empty Slot'}</span>
                        <span className="text-purple-300/90 group-hover:text-purple-200">
                          {slotDrone ? 'Change / Unequip' : 'Equip'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Area 2: Companion Drones Grid (Zero Permanent Info Panel Below) */}
            <section aria-label="Companion Drones Roster">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div>
                  <h3 className="font-display text-sm sm:text-base font-bold tracking-wide text-white">
                    COMPANION DRONES
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-400">
                    Tap any drone to inspect specifications, unlock, equip, or upgrade.
                  </p>
                </div>
                <span className="font-mono-num text-[11px] text-slate-400">
                  {Object.keys(progress.ownedDrones).length}/{DRONE_LIST.length} Owned
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
                {DRONE_LIST.map((d) => {
                  const lvl = progress.ownedDrones[d.id] ?? 0;
                  const owned = lvl > 0;
                  const slotIdx = progress.equippedDrones.indexOf(d.id);
                  const equipped = slotIdx !== -1;
                  const maxed = lvl >= d.maxLevel;
                  const upgCost = getDroneUpgradeCost(d, Math.max(1, lvl));
                  const power = getDronePowerAtLevel(d, Math.max(1, lvl));

                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => openDroneInfoPopup(d.id, null)}
                      className={`group flex min-h-[172px] flex-col justify-between rounded-2xl border p-4 text-left touch-pan-y transition-[border-color,background-color,transform] duration-150 active:scale-[0.985] focus-visible:outline-2 focus-visible:outline-cyan-400 ${
                        equipped
                          ? 'border-emerald-400/55 bg-[#07191b]/90 hover:border-emerald-300/80'
                          : owned
                          ? 'border-slate-700/85 bg-[#081225]/92 hover:border-purple-300/55 hover:bg-[#0c1830]'
                          : 'border-slate-800/90 bg-[#060c1a]/88 opacity-90 hover:opacity-100 hover:border-slate-600/80'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-700/75 bg-[#050b18]">
                          <DroneArtBadge droneId={d.id} colorHex={d.colorHex} size={34} />
                        </div>
                        <span
                          className={`flex items-center gap-1 font-mono-num text-[10px] font-bold tracking-wide ${
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
                              ? `EQUIPPED · S${slotIdx + 1}`
                              : owned
                              ? `OWNED · Lv.${lvl}`
                              : 'LOCKED'}
                          </span>
                        </span>
                      </div>

                      <div className="my-2.5 min-w-0">
                        <div className="truncate font-display text-xs sm:text-sm font-bold text-white">
                          {d.name}
                        </div>
                        <div className="mt-1 truncate font-mono-num text-[11px] text-purple-300">
                          {d.role}
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-1.5 border-t border-slate-800/75 pt-2 font-mono-num text-[11px] font-semibold">
                        <span className="truncate" style={{ color: d.colorHex }}>
                          {formatDronePower(d, power)}
                        </span>
                        <span className="shrink-0 text-slate-400">
                          {maxed
                            ? 'MAX'
                            : owned
                            ? `${upgCost.credits} CR`
                            : `${d.costCredits} CR`}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          </div>
        )}
      </div>

      {activeGearSlotModal && activeGearSlotMeta && activeGearItem && (
        <EquipmentGearModal
          slotMeta={activeGearSlotMeta}
          slotItems={modalSlotItems}
          activeItem={activeGearItem}
          progress={progress}
          onSelectItem={setSelectedGearId}
          onClose={() => setActiveGearSlotModal(null)}
          onEquipConfirm={openGearEquipConfirm}
          onBuyOrEnhanceConfirm={openGearBuyOrEnhanceConfirm}
        />
      )}

      {dronePickerSlotIndex !== null && (
        <DroneSlotPickerModal
          slotIndex={dronePickerSlotIndex}
          progress={progress}
          onClose={() => setDronePickerSlotIndex(null)}
          onSelectDroneInfo={(droneId, slotIndex) => openDroneInfoPopup(droneId, slotIndex)}
          onUnequipConfirm={openDroneUnequipConfirm}
        />
      )}

      {inspectedDronePopup && inspectedDroneDef && (
        <DroneInfoModal
          drone={inspectedDroneDef}
          fromSlotIndex={inspectedDronePopup.fromSlotIndex}
          progress={progress}
          onBackToSlotPicker={openDroneSlotPopup}
          onClose={() => setInspectedDronePopup(null)}
          onUnequipConfirm={openDroneUnequipConfirm}
          onEquipConfirm={openDroneEquipConfirm}
          onBuyOrUpgradeConfirm={openDroneBuyOrUpgradeConfirm}
        />
      )}

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
