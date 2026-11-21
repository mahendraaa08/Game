import React, { useEffect, useMemo, useState } from 'react';
import { ArrowUpCircle, Check, Cpu, Crosshair, Lock } from 'lucide-react';
import {
  getUpgradeCost,
  getWeaponUpgradeCost,
  UPGRADE_LIST,
  UpgradeDefinition,
} from '../../game/config/UpgradeConfig';
import {
  getWeaponDamageAtLevel,
  getWeaponFireRateAtLevel,
  WEAPON_LIST,
  WeaponId,
  WEAPONS,
} from '../../game/config/WeaponConfig';
import { SoundManager } from '../../game/audio/SoundManager';
import { evaluateGlobalNotifications } from '../../game/systems/NotificationStatus';
import { ActionResult, ProgressionManager } from '../../game/systems/ProgressionManager';
import { PlayerProgress } from '../../game/utils/StorageManager';
import { HorizontalSwipeStrip } from '../ui/HorizontalSwipeStrip';
import { NotificationDot } from '../ui/NotificationDot';
import { ActionConfirmDialog, PendingHangarAction } from './ActionConfirmDialog';

interface WeaponsUpgradesPanelProps {
  progress: PlayerProgress;
  onFeedback: (res: ActionResult) => void;
  inspectedWeaponId?: WeaponId;
  onInspectWeapon?: (id: WeaponId) => void;
}

export const WeaponsUpgradesPanel: React.FC<WeaponsUpgradesPanelProps> = ({
  progress,
  onFeedback,
  inspectedWeaponId,
  onInspectWeapon,
}) => {
  const [subTab, setSubTab] = useState<'weapons' | 'systems'>('weapons');
  const [localInspect, setLocalInspect] = useState<WeaponId>(
    inspectedWeaponId ?? progress.selectedWeapon
  );
  const [pendingAction, setPendingAction] = useState<PendingHangarAction | null>(null);

  const inspectWeapon = inspectedWeaponId ?? localInspect;
  const setInspectWeapon = (id: WeaponId) => {
    setLocalInspect(id);
    onInspectWeapon?.(id);
  };

  useEffect(() => {
    setPendingAction(null);
  }, [inspectWeapon, subTab]);

  const notifications = useMemo(() => evaluateGlobalNotifications(progress), [progress]);
  const def = WEAPONS[inspectWeapon] ?? WEAPONS.plasma;
  const eqDef = WEAPONS[progress.selectedWeapon] ?? WEAPONS.plasma;
  const unlocked = progress.unlockedWeapons.includes(def.id);
  const wLvl = progress.weaponLevels[def.id] ?? 1;
  const eqLvl = progress.weaponLevels[eqDef.id] ?? 1;
  const isMaxWeapon = wLvl >= def.maxWeaponLevel;
  const upgCost = getWeaponUpgradeCost(wLvl, def.id);

  const curDmg = getWeaponDamageAtLevel(def, wLvl);
  const nextDmg = isMaxWeapon ? curDmg : getWeaponDamageAtLevel(def, wLvl + 1);
  const curRate = Number((1000 / getWeaponFireRateAtLevel(def, wLvl)).toFixed(1));
  const nextRate = isMaxWeapon
    ? curRate
    : Number((1000 / getWeaponFireRateAtLevel(def, wLvl + 1)).toFixed(1));
  const eqDmg = getWeaponDamageAtLevel(eqDef, eqLvl);
  const eqRate = Number((1000 / getWeaponFireRateAtLevel(eqDef, eqLvl)).toFixed(1));

  const openWeaponActionConfirm = (action: 'unlock' | 'select' | 'upgrade') => {
    SoundManager.unlock();
    SoundManager.playButtonClick();

    if (action === 'select') {
      setPendingAction({
        id: `equip-weapon-${def.id}`,
        category: 'equip',
        title: 'Confirm Equip',
        itemName: def.name,
        itemSubtitle: `Hotkey #${def.hotkey} · ${def.rangeLabel} · Lv.${wLvl}`,
        description: `Switch primary combat weapon from ${eqDef.name} to ${def.name}?`,
        icon: <Crosshair className="h-5 w-5" style={{ color: def.colorHex }} />,
        statDeltas: [
          { label: 'Equipped Weapon', before: eqDef.name, after: def.name },
          { label: 'Bolt Damage', before: `${eqDmg}`, after: `${curDmg}` },
          { label: 'Fire Cadence', before: `${eqRate}/s`, after: `${curRate}/s` },
        ],
        execute: () => ProgressionManager.unlockOrUpgradeWeapon(def.id, 'select'),
      });
      return;
    }

    if (action === 'unlock') {
      const sectorMet = progress.highestUnlockedLevel >= def.unlockLevel;
      setPendingAction({
        id: `unlock-weapon-${def.id}`,
        category: 'unlock',
        title: 'Confirm Unlock',
        itemName: def.name,
        itemSubtitle: `Hotkey #${def.hotkey} · ${def.rangeLabel}`,
        description: def.description,
        note: !sectorMet
          ? `Requirement not met: Reach Sector ${String(def.unlockLevel).padStart(2, '0')} first.`
          : undefined,
        icon: <Crosshair className="h-5 w-5" style={{ color: def.colorHex }} />,
        statDeltas: [
          { label: 'Bolt Damage (Lv.1)', before: `${curDmg}` },
          { label: 'Fire Cadence', before: `${curRate}/s` },
        ],
        creditsCost: def.unlockCredits,
        crystalsCost: def.unlockCrystals,
        execute: () => ProgressionManager.unlockOrUpgradeWeapon(def.id, 'unlock'),
      });
      return;
    }

    setPendingAction({
      id: `upgrade-weapon-${def.id}-${wLvl}`,
      category: 'upgrade',
      title: 'Confirm Upgrade',
      itemName: def.name,
      itemSubtitle: `Primary Weapon Enhancement · Hotkey #${def.hotkey}`,
      description: `Reinforce ${def.name} emitters and ballistic output.`,
      icon: <ArrowUpCircle className="h-5 w-5 text-cyan-300" />,
      statDeltas: [
        { label: 'Weapon Level', before: `Lv.${wLvl}`, after: `Lv.${wLvl + 1}` },
        { label: 'Bolt Damage', before: `${curDmg}`, after: `${nextDmg}` },
        { label: 'Fire Cadence', before: `${curRate}/s`, after: `${nextRate}/s` },
      ],
      creditsCost: upgCost.credits,
      crystalsCost: upgCost.crystals,
      execute: () => ProgressionManager.unlockOrUpgradeWeapon(def.id, 'upgrade'),
    });
  };

  const openSystemUpgradeConfirm = (u: UpgradeDefinition) => {
    const cur = progress.upgrades[u.id] ?? 0;
    if (cur >= u.maxLevel) return;
    const cost = getUpgradeCost(u, cur);

    SoundManager.unlock();
    SoundManager.playButtonClick();

    setPendingAction({
      id: `upgrade-sys-${u.id}-${cur}`,
      category: 'upgrade',
      title: 'Confirm Upgrade',
      itemName: u.name,
      itemSubtitle: `Fleet System Track · Max Lv.${u.maxLevel}`,
      description: u.description,
      icon: <Cpu className="h-5 w-5 text-emerald-300" />,
      statDeltas: [
        { label: 'System Level', before: `Lv.${cur}`, after: `Lv.${cur + 1}` },
        { label: 'Bonus Output', before: u.formatValue(cur), after: u.formatValue(cur + 1) },
      ],
      creditsCost: cost.credits,
      crystalsCost: cost.crystals,
      execute: () => ProgressionManager.purchaseUpgrade(u.id),
    });
  };

  const totalUpgradeLevels = UPGRADE_LIST.reduce(
    (sum, u) => sum + (progress.upgrades[u.id] ?? 0),
    0
  );
  const maxUpgradeLevels = UPGRADE_LIST.reduce((sum, u) => sum + u.maxLevel, 0);

  return (
    <>
      <div className="flex flex-col gap-4">
        {/* Sub-Tabs Inside Weapons View */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div
            role="tablist"
            aria-label="Weapons and Systems"
            className="grid w-full sm:w-auto grid-cols-2 gap-1.5 rounded-xl border border-slate-800/90 bg-[#060d1c]/90 p-1"
          >
            <button
              type="button"
              role="tab"
              aria-selected={subTab === 'weapons'}
              onClick={() => {
                SoundManager.playButtonClick();
                setSubTab('weapons');
              }}
              className={`relative flex min-h-[42px] items-center justify-center gap-2 rounded-lg px-4 text-xs font-bold transition-colors ${
                subTab === 'weapons'
                  ? 'border border-cyan-300/50 bg-cyan-400/18 text-cyan-100'
                  : 'border border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <NotificationDot
                visible={notifications.primaryWeaponsSubTab}
                position="corner"
                label="Primary weapon unlock or upgrade available"
              />
              <Crosshair className="h-3.5 w-3.5 text-cyan-300" />
              <span>Primary Weapons ({progress.unlockedWeapons.length}/{WEAPON_LIST.length})</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={subTab === 'systems'}
              onClick={() => {
                SoundManager.playButtonClick();
                setSubTab('systems');
              }}
              className={`relative flex min-h-[42px] items-center justify-center gap-2 rounded-lg px-4 text-xs font-bold transition-colors ${
                subTab === 'systems'
                  ? 'border border-emerald-300/50 bg-emerald-400/16 text-emerald-100'
                  : 'border border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <NotificationDot
                visible={notifications.fleetSystemsSubTab}
                position="corner"
                label="Fleet system upgrade available"
              />
              <Cpu className="h-3.5 w-3.5 text-emerald-300" />
              <span>Fleet Systems ({totalUpgradeLevels}/{maxUpgradeLevels})</span>
            </button>
          </div>
        </div>

        {/* SUB-TAB 1: PRIMARY WEAPONS MANAGEMENT */}
        {subTab === 'weapons' && (
          <div className="panel-swap grid grid-cols-1 gap-4 lg:grid-cols-[0.95fr_1.15fr] lg:items-start">
            {/* Arsenal Selector: Smooth horizontal swipe strip on mobile/tablet, 2-col grid on desktop */}
            <section aria-label="Weapon Selector">
              <div className="mb-2.5 flex items-center justify-between text-xs">
                <span className="font-display font-bold tracking-wide text-slate-200">
                  ARSENAL SELECTOR
                </span>
                <span className="font-mono-num text-[11px] text-slate-400">
                  <span className="lg:hidden">Swipe · Keys #1–#6</span>
                  <span className="hidden lg:inline">Keys #1–#6</span>
                </span>
              </div>

              <HorizontalSwipeStrip ariaLabel="Weapons Arsenal Selector">
                {WEAPON_LIST.map((w) => {
                  const isOwned = progress.unlockedWeapons.includes(w.id);
                  const isEquipped = progress.selectedWeapon === w.id;
                  const isSelected = inspectWeapon === w.id;
                  const lvl = progress.weaponLevels[w.id] ?? 1;

                  return (
                    <button
                      key={w.id}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => {
                        SoundManager.playButtonClick();
                        setInspectWeapon(w.id);
                      }}
                      className={`relative flex min-w-[164px] lg:min-w-0 shrink-0 flex-col justify-between rounded-xl border p-3.5 text-left transition-[border-color,background-color,transform] duration-150 active:scale-[0.985] ${
                        isSelected
                          ? 'border-cyan-300/75 bg-[#0c1b36]/95 text-white'
                          : 'border-slate-800/90 bg-[#081122]/85 text-slate-200 hover:border-slate-600'
                      }`}
                    >
                      <NotificationDot
                        visible={notifications.weaponIds[w.id]}
                        position="corner-inset"
                        label={`${w.name} action available`}
                      />
                      <div className={`flex items-center justify-between gap-2 ${notifications.weaponIds[w.id] ? 'pr-2.5' : ''}`}>
                        <span
                          className="truncate font-display text-xs sm:text-sm font-bold"
                          style={{ color: w.colorHex }}
                        >
                          {w.name}
                        </span>
                        {isEquipped ? (
                          <Check className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                        ) : !isOwned ? (
                          <Lock className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                        ) : null}
                      </div>
                      <div className="mt-2 flex items-center justify-between font-mono-num text-[10.5px] text-slate-400">
                        <span>#{w.hotkey}</span>
                        <span>
                          {isOwned
                            ? `Lv.${lvl}/${w.maxWeaponLevel}`
                            : `S${String(w.unlockLevel).padStart(2, '0')}`}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </HorizontalSwipeStrip>
            </section>

            {/* Focused Weapon Detail & Upgrade Card */}
            <section
              key={def.id}
              aria-label="Weapon Upgrade Panel"
              className="panel-swap flex flex-col justify-between rounded-2xl border border-slate-700/75 bg-[#081122]/94 p-4 sm:p-5 backdrop-blur-sm"
            >
              <div>
                <div className="flex items-center justify-between font-mono-num text-[11px] text-slate-400">
                  <span>
                    Hotkey #{def.hotkey} · {def.rangeLabel}
                  </span>
                  <span
                    className={`font-bold ${
                      progress.selectedWeapon === def.id
                        ? 'text-emerald-300'
                        : unlocked
                        ? 'text-sky-300'
                        : 'text-amber-300'
                    }`}
                  >
                    {progress.selectedWeapon === def.id
                      ? 'EQUIPPED'
                      : unlocked
                      ? `OWNED · Lv.${wLvl}/${def.maxWeaponLevel}`
                      : 'LOCKED'}
                  </span>
                </div>

                <div className="mt-2 flex items-center gap-2.5">
                  <span
                    className="h-8 w-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: def.colorHex }}
                  />
                  <h4
                    className="font-display text-xl sm:text-2xl font-bold tracking-wide"
                    style={{ color: def.colorHex }}
                  >
                    {def.name}
                  </h4>
                </div>

                <p className="mt-2.5 text-xs leading-relaxed text-slate-300">{def.description}</p>
                <p className="mt-1.5 font-mono-num text-[11px] font-medium text-purple-300">
                  Trait: {def.specialProperty}
                </p>

                {/* Level Pips */}
                <div className="mt-3.5 flex items-center gap-1">
                  {Array.from({ length: def.maxWeaponLevel }).map((_, i) => (
                    <span
                      key={i}
                      className={`h-1.5 flex-1 rounded-full ${
                        i < wLvl ? 'bg-cyan-400' : 'bg-slate-800'
                      }`}
                    />
                  ))}
                </div>

                <div className="mt-3.5 grid grid-cols-2 gap-3 border-y border-slate-800/80 py-3 text-xs">
                  <div>
                    <div className="text-[11px] text-slate-400">Bolt Damage</div>
                    <div className="mt-0.5 font-mono-num text-base font-bold text-white">
                      {curDmg}
                      {!isMaxWeapon && unlocked && (
                        <span className="ml-1.5 text-xs text-emerald-400">→ {nextDmg}</span>
                      )}
                      {progress.selectedWeapon !== def.id && (
                        <span className="ml-1.5 text-[11px] text-slate-400">
                          ({curDmg - eqDmg >= 0 ? '+' : ''}
                          {curDmg - eqDmg})
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-400">Fire Cadence</div>
                    <div className="mt-0.5 font-mono-num text-base font-bold text-sky-300">
                      {curRate}/s
                      {!isMaxWeapon && unlocked && nextRate !== curRate && (
                        <span className="ml-1.5 text-xs text-emerald-400">→ {nextRate}/s</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                {!unlocked ? (
                  <button
                    type="button"
                    onClick={() => openWeaponActionConfirm('unlock')}
                    className="relative flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-2 font-display text-sm font-bold text-slate-950 transition-[background-color,transform] duration-150 hover:bg-amber-300 active:scale-[0.98]"
                  >
                    <NotificationDot
                      visible={notifications.weaponIds[def.id]}
                      position="corner"
                      label={`Ready to unlock ${def.name}`}
                    />
                    <span>
                      Unlock Weapon ({def.unlockCredits} CR
                      {def.unlockCrystals > 0 ? ` · ${def.unlockCrystals} Gems` : ''})
                    </span>
                  </button>
                ) : (
                  <div className="flex flex-col gap-2.5 sm:flex-row">
                    {progress.selectedWeapon !== def.id && (
                      <button
                        type="button"
                        onClick={() => openWeaponActionConfirm('select')}
                        className="flex min-h-[46px] flex-1 items-center justify-center rounded-xl border border-cyan-300/50 bg-cyan-400/12 px-4 py-2 font-display text-sm font-bold text-cyan-200 transition-colors hover:bg-cyan-400/20"
                      >
                        EQUIP WEAPON
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={isMaxWeapon}
                      onClick={() => openWeaponActionConfirm('upgrade')}
                      className={`relative flex min-h-[46px] flex-1 items-center justify-center gap-1.5 rounded-xl px-4 py-2 font-display text-sm font-bold transition-[background-color,transform] duration-150 ${
                        isMaxWeapon
                          ? 'cursor-not-allowed border border-slate-800 bg-slate-900/90 text-slate-500'
                          : 'bg-gradient-to-r from-sky-400 to-cyan-400 text-slate-950 hover:brightness-105 active:scale-[0.98]'
                      }`}
                    >
                      <NotificationDot
                        visible={notifications.weaponIds[def.id]}
                        position="corner"
                        label={`Ready to upgrade ${def.name}`}
                      />
                      <ArrowUpCircle className="h-4 w-4" />
                      <span>
                        {isMaxWeapon
                          ? 'MAX LEVEL'
                          : `UPGRADE (${upgCost.credits} CR${
                              upgCost.crystals > 0 ? ` · ${upgCost.crystals} Gems` : ''
                            })`}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}

        {/* SUB-TAB 2: CORE FLEET SYSTEM UPGRADES (8 TRACKS) */}
        {subTab === 'systems' && (
          <section className="panel-swap">
            <div className="scroll-panel grid max-h-[calc(100dvh-250px)] sm:max-h-none grid-cols-1 gap-3 overflow-y-auto pr-1.5 sm:grid-cols-2 lg:grid-cols-4">
              {UPGRADE_LIST.map((u) => {
                const cur = progress.upgrades[u.id] ?? 0;
                const maxed = cur >= u.maxLevel;
                const cost = getUpgradeCost(u, cur);

                return (
                  <div
                    key={u.id}
                    className="flex flex-col justify-between rounded-2xl border border-slate-800/90 bg-[#081122]/90 p-4"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 text-xs">
                        <span className="font-display text-[13px] leading-snug font-bold text-white">
                          {u.name}
                        </span>
                        <span className="shrink-0 pt-0.5 font-mono-num text-[11px] font-semibold text-cyan-300">
                          Lv.{cur}/{u.maxLevel}
                        </span>
                      </div>
                      <p className="mt-1.5 line-clamp-2 text-[11.5px] leading-snug text-slate-400">
                        {u.description}
                      </p>

                      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-900">
                        <div
                          className="h-full rounded-full bg-emerald-400/85 transition-[width] duration-200"
                          style={{ width: `${Math.round((cur / u.maxLevel) * 100)}%` }}
                        />
                      </div>

                      <div className="mt-2 font-mono-num text-xs font-semibold text-emerald-300">
                        {u.formatValue(cur)}
                        {!maxed && (
                          <span className="text-slate-400"> → {u.formatValue(cur + 1)}</span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={maxed}
                      onClick={() => openSystemUpgradeConfirm(u)}
                      className={`relative mt-3 flex min-h-[42px] w-full items-center justify-center rounded-xl px-3 font-mono-num text-xs font-bold transition-[background-color,transform] duration-150 ${
                        maxed
                          ? 'cursor-not-allowed border border-slate-800 bg-slate-950 text-slate-500'
                          : 'bg-sky-400 text-slate-950 hover:bg-sky-300 active:scale-[0.98]'
                      }`}
                    >
                      <NotificationDot
                        visible={!maxed && Boolean(notifications.upgradeIds[u.id])}
                        position="corner"
                        label={`${u.name} upgrade available`}
                      />
                      {maxed
                        ? 'MAXED'
                        : `UPGRADE (${cost.credits.toLocaleString()} CR${
                            cost.crystals > 0 ? ` · ${cost.crystals} Gems` : ''
                          })`}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        )}
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
