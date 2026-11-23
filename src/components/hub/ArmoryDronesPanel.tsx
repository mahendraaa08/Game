import React, { useEffect, useMemo, useState } from 'react';
import { Cpu, Sword } from 'lucide-react';
import {
  DRONE_LIST,
  DRONE_SLOT_IDS,
  DRONES,
  DroneDefinition,
  DroneId,
  DroneSlotId,
  getDroneModifierTags,
  getDroneUpgradeCost,
  isDroneCompatibleWithSlot,
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
import { evaluateGlobalNotifications } from '../../game/systems/NotificationStatus';
import { ActionResult, ProgressionManager } from '../../game/systems/ProgressionManager';
import { PlayerProgress } from '../../game/utils/StorageManager';
import { NotificationDot } from '../ui/NotificationDot';
import { ActionConfirmDialog, PendingHangarAction } from './ActionConfirmDialog';
import { DroneArtBadge } from './ShipArtBadge';
import {
  DRONE_SLOT_ICON,
  DRONE_SLOTS,
  EQUIPMENT_SLOTS,
  SLOT_ICON,
  formatBonusTags,
} from './armory/armoryUtils';
import { EquipmentGearModal } from './armory/EquipmentGearModal';
import { DroneSlotModal } from './armory/DroneModals';

interface ArmoryDronesPanelProps {
  progress: PlayerProgress;
  onFeedback: (res: ActionResult) => void;
}

export const ArmoryDronesPanel: React.FC<ArmoryDronesPanelProps> = ({ progress, onFeedback }) => {
  const [armoryTab, setArmoryTab] = useState<'gear' | 'drones'>('gear');

  // Equipment Gear Popup State (Slot -> Compatible Items Selection & Details Popup)
  const [activeGearSlotModal, setActiveGearSlotModal] = useState<EquipmentSlot | null>(null);
  const [selectedGearId, setSelectedGearId] = useState<string>(EQUIPMENT_LIST[0].id);

  // Companion Drones Popup State (Slot -> Compatible Drones Selection & Details Popup — identical mechanism)
  const [activeDroneSlotModal, setActiveDroneSlotModal] = useState<DroneSlotId | null>(null);
  const [selectedDroneId, setSelectedDroneId] = useState<DroneId>(DRONE_LIST[0].id);

  const [pendingAction, setPendingAction] = useState<PendingHangarAction | null>(null);
  const notifications = useMemo(() => evaluateGlobalNotifications(progress), [progress]);

  // Escape key support for Armory popups when confirm dialog is closed
  useEffect(() => {
    const hasPopup = activeGearSlotModal !== null || activeDroneSlotModal !== null;
    if (!hasPopup || pendingAction !== null) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        SoundManager.playButtonClick();
        setActiveGearSlotModal(null);
        setActiveDroneSlotModal(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeGearSlotModal, activeDroneSlotModal, pendingAction]);

  // Clear popups cleanly when switching Armory tabs
  const switchArmoryTab = (tab: 'gear' | 'drones') => {
    SoundManager.playButtonClick();
    setActiveGearSlotModal(null);
    setActiveDroneSlotModal(null);
    setArmoryTab(tab);
  };

  // Equipment items compatible with the currently opened Equipment Slot popup
  const modalGearSlotItems = useMemo(() => {
    if (!activeGearSlotModal) return [];
    return EQUIPMENT_LIST.filter((item) => item.slot === activeGearSlotModal);
  }, [activeGearSlotModal]);

  const activeGearItem: EquipmentDefinition | null = useMemo(() => {
    if (!activeGearSlotModal) return null;
    const picked = EQUIPMENT_BY_ID[selectedGearId];
    if (picked && picked.slot === activeGearSlotModal) return picked;
    const equippedId = progress.equippedGear[activeGearSlotModal];
    if (equippedId && EQUIPMENT_BY_ID[equippedId]) return EQUIPMENT_BY_ID[equippedId];
    return modalGearSlotItems[0] ?? null;
  }, [activeGearSlotModal, selectedGearId, progress.equippedGear, modalGearSlotItems]);

  const equippedGearCount = useMemo(
    () => EQUIPMENT_SLOTS.filter((slot) => Boolean(progress.equippedGear[slot.id])).length,
    [progress.equippedGear]
  );

  // Companion drones compatible with the currently opened Drone Slot popup
  const modalDroneSlotItems = useMemo(() => {
    if (!activeDroneSlotModal) return [];
    return DRONE_LIST.filter((d) => isDroneCompatibleWithSlot(d, activeDroneSlotModal));
  }, [activeDroneSlotModal]);

  const activeDroneItem: DroneDefinition | null = useMemo(() => {
    if (!activeDroneSlotModal) return null;
    const picked = DRONES[selectedDroneId];
    if (picked && isDroneCompatibleWithSlot(picked, activeDroneSlotModal)) return picked;
    const equippedId = progress.equippedDroneSlots[activeDroneSlotModal];
    if (equippedId && DRONES[equippedId]) return DRONES[equippedId];
    return modalDroneSlotItems[0] ?? null;
  }, [activeDroneSlotModal, selectedDroneId, progress.equippedDroneSlots, modalDroneSlotItems]);

  const equippedDronesCount = useMemo(
    () =>
      DRONE_SLOT_IDS.filter((slotId) => Boolean(progress.equippedDroneSlots[slotId])).length,
    [progress.equippedDroneSlots]
  );

  // Open Equipment Gear Slot Popup
  const openGearSlotPopup = (slot: EquipmentSlot) => {
    SoundManager.unlock();
    SoundManager.playButtonClick();
    const equippedId = progress.equippedGear[slot];
    const firstSlotItem = EQUIPMENT_LIST.find((e) => e.slot === slot);
    setSelectedGearId(equippedId ?? firstSlotItem?.id ?? EQUIPMENT_LIST[0].id);
    setActiveGearSlotModal(slot);
  };

  // Open Companion Drone Slot Popup (identical to openGearSlotPopup)
  const openDroneSlotPopup = (slotId: DroneSlotId) => {
    SoundManager.unlock();
    SoundManager.playButtonClick();
    const equippedId = progress.equippedDroneSlots[slotId];
    const firstSlotItem = DRONE_LIST.find((d) => isDroneCompatibleWithSlot(d, slotId));
    setSelectedDroneId(equippedId ?? firstSlotItem?.id ?? DRONE_LIST[0].id);
    setActiveDroneSlotModal(slotId);
  };

  // ---- UNIVERSAL CONFIRMATION DIALOG TRIGGERS (GEAR) ----

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
      note: item.rarityEffect
        ? `${item.rarityEffect.label}: ${item.rarityEffect.description}`
        : undefined,
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

  // ---- UNIVERSAL CONFIRMATION DIALOG TRIGGERS (COMPANION DRONES) ----

  const openDroneBuyOrUpgradeConfirm = (d: DroneDefinition, slotId: DroneSlotId) => {
    const lvl = progress.ownedDrones[d.id] ?? 0;
    const owned = lvl > 0;
    if (lvl >= d.maxLevel) return;

    const rarity = RARITY_CONFIG[d.rarity];
    const slotLabel = slotId === 'slot1' ? 'SLOT 01' : 'SLOT 02';
    const upgCost = getDroneUpgradeCost(d, Math.max(1, lvl));
    const creditsCost = owned ? upgCost.credits : d.costCredits;
    const crystalsCost = owned ? upgCost.crystals : d.costCrystals;
    const curModifiers = getDroneModifierTags(d, Math.max(1, lvl));
    const nextModifiers = owned ? getDroneModifierTags(d, lvl + 1) : [];

    SoundManager.unlock();
    SoundManager.playButtonClick();

    setPendingAction({
      id: `drone-tx-${d.id}-${lvl}-${slotId}`,
      category: owned ? 'upgrade' : 'purchase',
      title: owned ? 'Confirm Enhancement' : 'Confirm Purchase',
      itemName: d.name,
      itemSubtitle: `${rarity.label} · ${slotLabel} · ${d.role}`,
      description: d.description,
      icon: <DroneArtBadge droneId={d.id} colorHex={d.colorHex} size={34} />,
      statDeltas: owned
        ? [
            { label: 'Drone Level', before: `Lv.${lvl}`, after: `Lv.${lvl + 1}` },
            ...curModifiers.map((m, idx) => ({
              label: `Modifier ${idx + 1}`,
              before: m,
              after: nextModifiers[idx],
            })),
          ]
        : curModifiers.map((m, idx) => ({
            label: `Base Effect ${idx + 1}`,
            before: m,
          })),
      creditsCost,
      crystalsCost,
      execute: () => ProgressionManager.buyOrUpgradeDrone(d.id, slotId),
    });
  };

  const openDroneEquipConfirm = (d: DroneDefinition, slotId: DroneSlotId) => {
    const lvl = progress.ownedDrones[d.id] ?? 0;
    if (lvl <= 0) return;

    const rarity = RARITY_CONFIG[d.rarity];
    const slotLabel = slotId === 'slot1' ? 'SLOT 01' : 'SLOT 02';
    const currentSlotDroneId = progress.equippedDroneSlots[slotId];
    const currentSlotDroneName = currentSlotDroneId
      ? DRONES[currentSlotDroneId]?.name ?? 'Occupied'
      : 'Empty Slot';

    SoundManager.unlock();
    SoundManager.playButtonClick();

    setPendingAction({
      id: `drone-equip-${d.id}-${slotId}`,
      category: 'equip',
      title: 'Confirm Equip',
      itemName: d.name,
      itemSubtitle: `${rarity.label} · ${slotLabel} · Lv.${lvl}`,
      description: `Install ${d.name} into Companion Drone ${slotLabel}.`,
      note:
        currentSlotDroneId && currentSlotDroneId !== d.id
          ? `Replaces currently equipped ${currentSlotDroneName}.`
          : undefined,
      icon: <DroneArtBadge droneId={d.id} colorHex={d.colorHex} size={34} />,
      statDeltas: [
        {
          label: slotLabel,
          before: currentSlotDroneName,
          after: d.name,
        },
      ],
      execute: () => ProgressionManager.equipDroneToSlot(d.id, slotId),
    });
  };

  const openDroneUnequipConfirm = (d: DroneDefinition, slotId: DroneSlotId) => {
    const lvl = progress.ownedDrones[d.id] ?? 0;
    if (lvl <= 0 || progress.equippedDroneSlots[slotId] !== d.id) return;

    const rarity = RARITY_CONFIG[d.rarity];
    const slotLabel = slotId === 'slot1' ? 'SLOT 01' : 'SLOT 02';

    SoundManager.unlock();
    SoundManager.playButtonClick();

    setPendingAction({
      id: `drone-unequip-${d.id}-${slotId}`,
      category: 'equip',
      title: 'Confirm Unequip',
      itemName: d.name,
      itemSubtitle: `${rarity.label} · ${slotLabel} · Lv.${lvl}`,
      description: `Remove ${d.name} from Companion Drone ${slotLabel}?`,
      icon: <DroneArtBadge droneId={d.id} colorHex={d.colorHex} size={34} />,
      statDeltas: [
        {
          label: slotLabel,
          before: d.name,
          after: 'Empty Slot',
        },
      ],
      execute: () => ProgressionManager.unequipDroneFromSlot(slotId),
    });
  };

  const activeGearSlotMeta = activeGearSlotModal
    ? EQUIPMENT_SLOTS.find((s) => s.id === activeGearSlotModal) ?? EQUIPMENT_SLOTS[0]
    : null;

  const activeDroneSlotMeta = activeDroneSlotModal
    ? DRONE_SLOTS.find((s) => s.id === activeDroneSlotModal) ?? DRONE_SLOTS[0]
    : null;

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
            className={`relative flex min-h-[42px] items-center justify-center gap-2 rounded-lg px-4 sm:px-5 text-xs font-bold transition-colors ${
              armoryTab === 'gear'
                ? 'border border-cyan-300/50 bg-cyan-400/16 text-cyan-100'
                : 'border border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <NotificationDot
              visible={notifications.gearSubTab}
              position="corner"
              label="Equipment gear action available"
            />
            <Sword className="h-3.5 w-3.5 text-cyan-300" />
            <span>Equipment Gear ({equippedGearCount}/4)</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={armoryTab === 'drones'}
            onClick={() => switchArmoryTab('drones')}
            className={`relative flex min-h-[42px] items-center justify-center gap-2 rounded-lg px-4 sm:px-5 text-xs font-bold transition-colors ${
              armoryTab === 'drones'
                ? 'border border-cyan-300/50 bg-cyan-400/16 text-cyan-100'
                : 'border border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <NotificationDot
              visible={notifications.dronesSubTab}
              position="corner"
              label="Companion drone action available"
            />
            <Cpu className="h-3.5 w-3.5 text-cyan-300" />
            <span>Companion Drones ({equippedDronesCount}/2)</span>
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
                  {equippedGearCount}/4 Equipped · {Object.keys(progress.ownedEquipment).length}/{EQUIPMENT_LIST.length} Owned
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
                  const slotItemsInCat = EQUIPMENT_LIST.filter((e) => e.slot === slotMeta.id);
                  const ownedInSlot = slotItemsInCat.filter(
                    (e) => (progress.ownedEquipment[e.id] ?? 0) > 0
                  ).length;

                  return (
                    <button
                      key={slotMeta.id}
                      type="button"
                      onClick={() => openGearSlotPopup(slotMeta.id)}
                      className={`group relative flex min-h-[188px] sm:min-h-[204px] flex-col justify-between rounded-2xl border p-4 text-left touch-pan-y transition-[border-color,background-color,transform] duration-150 active:scale-[0.985] focus-visible:outline-2 focus-visible:outline-cyan-400 ${
                        equippedItem
                          ? 'border-emerald-400/50 bg-[#07191b]/90 hover:border-cyan-300/75 hover:bg-[#092127]'
                          : 'border-dashed border-slate-700/80 bg-[#060c1a]/88 hover:border-cyan-300/60 hover:bg-[#081326]'
                      }`}
                    >
                      <NotificationDot
                        visible={notifications.gearSlots[slotMeta.id]}
                        position="corner-inset"
                        label={`${slotMeta.title} slot action available`}
                      />
                      {/* Top Row: Slot Type + Status */}
                      <div
                        className={`flex w-full items-center justify-between gap-2 font-mono-num text-[10.5px] ${
                          notifications.gearSlots[slotMeta.id] ? 'pr-2.5' : ''
                        }`}
                      >
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
                        <span>
                          {ownedInSlot}/{slotItemsInCat.length} Owned
                        </span>
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
        {/* 2. COMPANION DRONES — SLOT-ONLY ARCHITECTURE (IDENTICAL TO GEAR UI)   */}
        {/* ===================================================================== */}
        {armoryTab === 'drones' && (
          <div className="panel-swap flex flex-col gap-5">
            <section aria-label="Companion Drone Equipment Slots">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div>
                  <h2 className="font-display text-sm sm:text-base font-bold tracking-wide text-white">
                    EQUIPMENT SLOTS
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-400">
                    Select any wingman slot to equip, replace, or upgrade compatible companion drones.
                  </p>
                </div>
                <span className="font-mono-num text-[11px] font-semibold text-cyan-300">
                  {equippedDronesCount}/2 Equipped · {Object.keys(progress.ownedDrones).length}/
                  {DRONE_LIST.length} Owned
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
                {DRONE_SLOTS.map((slotMeta) => {
                  const SlotIcon = DRONE_SLOT_ICON[slotMeta.id];
                  const slotDroneId = progress.equippedDroneSlots[slotMeta.id];
                  const slotDrone = slotDroneId ? DRONES[slotDroneId] : null;
                  const slotLvl = slotDrone ? progress.ownedDrones[slotDrone.id] ?? 1 : 0;
                  const rarity = slotDrone ? RARITY_CONFIG[slotDrone.rarity] : null;
                  const primaryStat = slotDrone
                    ? getDroneModifierTags(slotDrone, Math.max(1, slotLvl))[0]
                    : null;
                  const compatibleList = DRONE_LIST.filter((d) =>
                    isDroneCompatibleWithSlot(d, slotMeta.id)
                  );
                  const ownedInSlot = compatibleList.filter(
                    (d) => (progress.ownedDrones[d.id] ?? 0) > 0
                  ).length;

                  return (
                    <button
                      key={slotMeta.id}
                      type="button"
                      onClick={() => openDroneSlotPopup(slotMeta.id)}
                      className={`group relative flex min-h-[188px] sm:min-h-[204px] flex-col justify-between rounded-2xl border p-4 text-left touch-pan-y transition-[border-color,background-color,transform] duration-150 active:scale-[0.985] focus-visible:outline-2 focus-visible:outline-cyan-400 ${
                        slotDrone
                          ? 'border-emerald-400/50 bg-[#07191b]/90 hover:border-cyan-300/75 hover:bg-[#092127]'
                          : 'border-dashed border-slate-700/80 bg-[#060c1a]/88 hover:border-cyan-300/60 hover:bg-[#081326]'
                      }`}
                    >
                      <NotificationDot
                        visible={notifications.droneSlots[slotMeta.id]}
                        position="corner-inset"
                        label={`${slotMeta.title} drone slot action available`}
                      />
                      {/* Top Row: Slot Type + Status */}
                      <div
                        className={`flex w-full items-center justify-between gap-2 font-mono-num text-[10.5px] ${
                          notifications.droneSlots[slotMeta.id] ? 'pr-2.5' : ''
                        }`}
                      >
                        <span className={`font-bold uppercase tracking-wider ${slotMeta.accentClass}`}>
                          {slotMeta.title}
                        </span>
                        {slotDrone ? (
                          <span className="font-bold text-emerald-300">EQUIPPED</span>
                        ) : (
                          <span className="text-slate-500">EMPTY</span>
                        )}
                      </div>

                      {/* Center Visual & Identity */}
                      {slotDrone && rarity ? (
                        <div className="my-3 flex flex-col gap-2.5">
                          <div className="flex items-center gap-3">
                            <span
                              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border bg-[#050b18]"
                              style={{ borderColor: `${rarity.colorHex}60` }}
                            >
                              <DroneArtBadge
                                droneId={slotDrone.id}
                                colorHex={slotDrone.colorHex}
                                size={30}
                              />
                            </span>
                            <div className="min-w-0">
                              <div className={`font-mono-num text-[10.5px] font-bold ${rarity.textClass}`}>
                                {rarity.label} · Lv.{slotLvl}/{slotDrone.maxLevel}
                              </div>
                              <div className="mt-0.5 line-clamp-2 font-display text-xs sm:text-sm font-bold leading-snug text-white">
                                {slotDrone.name}
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
                              Select Drone
                            </div>
                            <div className="mt-0.5 font-mono-num text-[10.5px] text-slate-500">
                              {slotMeta.emptyHint}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Footer Meta */}
                      <div className="flex w-full items-center justify-between gap-2 border-t border-slate-800/80 pt-2.5 font-mono-num text-[10.5px] text-slate-400">
                        <span>
                          {ownedInSlot}/{compatibleList.length} Owned
                        </span>
                        <span className="text-cyan-300/90 group-hover:text-cyan-200">
                          {slotDrone ? 'Manage' : 'Browse'}
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
          slotItems={modalGearSlotItems}
          activeItem={activeGearItem}
          progress={progress}
          onSelectItem={setSelectedGearId}
          onClose={() => setActiveGearSlotModal(null)}
          onEquipConfirm={openGearEquipConfirm}
          onBuyOrEnhanceConfirm={openGearBuyOrEnhanceConfirm}
        />
      )}

      {activeDroneSlotModal && activeDroneSlotMeta && activeDroneItem && (
        <DroneSlotModal
          slotMeta={activeDroneSlotMeta}
          slotItems={modalDroneSlotItems}
          activeDrone={activeDroneItem}
          progress={progress}
          onSelectDrone={setSelectedDroneId}
          onClose={() => setActiveDroneSlotModal(null)}
          onEquipConfirm={openDroneEquipConfirm}
          onUnequipConfirm={openDroneUnequipConfirm}
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
