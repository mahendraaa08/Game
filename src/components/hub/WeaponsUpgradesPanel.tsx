import React, { useState } from 'react';
import { ArrowUpCircle, Check, Crosshair, Lock } from 'lucide-react';
import {
  getUpgradeCost,
  getWeaponUpgradeCost,
  UPGRADE_LIST,
} from '../../game/config/UpgradeConfig';
import {
  getWeaponDamageAtLevel,
  getWeaponFireRateAtLevel,
  WEAPON_LIST,
  WeaponId,
  WEAPONS,
} from '../../game/config/WeaponConfig';
import { SoundManager } from '../../game/audio/SoundManager';
import { ActionResult, ProgressionManager } from '../../game/systems/ProgressionManager';
import { PlayerProgress } from '../../game/utils/StorageManager';

interface WeaponsUpgradesPanelProps {
  progress: PlayerProgress;
  onFeedback: (res: ActionResult) => void;
}

export const WeaponsUpgradesPanel: React.FC<WeaponsUpgradesPanelProps> = ({
  progress,
  onFeedback,
}) => {
  const [inspectWeapon, setInspectWeapon] = useState<WeaponId>(progress.selectedWeapon);

  const def = WEAPONS[inspectWeapon] ?? WEAPONS.plasma;
  const eqDef = WEAPONS[progress.selectedWeapon] ?? WEAPONS.plasma;
  const unlocked = progress.unlockedWeapons.includes(def.id);
  const wLvl = progress.weaponLevels[def.id] ?? 1;
  const eqLvl = progress.weaponLevels[eqDef.id] ?? 1;
  const isMaxWeapon = wLvl >= def.maxWeaponLevel;
  const upgCost = getWeaponUpgradeCost(wLvl);

  const curDmg = getWeaponDamageAtLevel(def, wLvl);
  const nextDmg = isMaxWeapon ? curDmg : getWeaponDamageAtLevel(def, wLvl + 1);
  const curRate = Number((1000 / getWeaponFireRateAtLevel(def, wLvl)).toFixed(1));
  const eqDmg = getWeaponDamageAtLevel(eqDef, eqLvl);

  return (
    <div className="flex flex-col gap-6">
      {/* Section 1: 6 Primary Weapons */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.15fr_1fr]">
        <div>
          <h3 className="mb-2.5 flex items-center gap-2 font-display text-sm font-bold text-sky-300">
            <Crosshair className="h-4 w-4" />
            <span>Primary Weapons Arsenal (Live Preview Active)</span>
          </h3>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {WEAPON_LIST.map((w) => {
              const isOwned = progress.unlockedWeapons.includes(w.id);
              const isEquipped = progress.selectedWeapon === w.id;
              const isSelected = inspectWeapon === w.id;
              const lvl = progress.weaponLevels[w.id] ?? 1;

              return (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => {
                    SoundManager.playButtonClick();
                    setInspectWeapon(w.id);
                    if (isOwned) {
                      ProgressionManager.unlockOrUpgradeWeapon(w.id, 'select');
                    }
                  }}
                  className={`flex min-h-[68px] flex-col justify-between rounded-lg border p-3 text-left transition-colors ${
                    isSelected
                      ? 'border-sky-400 bg-sky-500/15 text-white'
                      : 'border-slate-800 bg-[#081022]/85 text-slate-200 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-display text-sm font-bold" style={{ color: w.colorHex }}>
                      {w.name}
                    </span>
                    {isEquipped ? (
                      <Check className="h-4 w-4 shrink-0 text-emerald-400" />
                    ) : !isOwned ? (
                      <Lock className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                    ) : null}
                  </div>
                  <div className="font-mono-num text-[11px] text-slate-400">
                    Key {w.hotkey} · {isOwned ? `Lv.${lvl}/${w.maxWeaponLevel}` : `Unlock S${String(w.unlockLevel).padStart(2, '0')}`} · DMG {getWeaponDamageAtLevel(w, lvl)}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Weapon Detail & Upgrade Card */}
        <div className="flex flex-col justify-between rounded-xl border border-slate-800 bg-[#081022]/92 p-5">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Hotkey {def.hotkey} · Range: {def.rangeLabel}</span>
              <span className="font-mono-num text-sky-300">
                Lv.{wLvl} / {def.maxWeaponLevel}
              </span>
            </div>
            <h4 className="mt-1 font-display text-2xl font-bold" style={{ color: def.colorHex }}>
              {def.name}
            </h4>
            <p className="mt-2 text-xs leading-relaxed text-slate-300">{def.description}</p>
            <p className="mt-2 text-[11px] font-medium text-purple-300">
              Trait: {def.specialProperty}
            </p>

            <div className="mt-4 grid grid-cols-2 gap-3 border-y border-slate-800 py-3 text-xs">
              <div>
                <div className="text-slate-400">Bolt Damage</div>
                <div className="font-mono-num text-base font-bold text-white">
                  {curDmg}
                  {!isMaxWeapon && unlocked && (
                    <span className="ml-1.5 text-xs text-emerald-400">→ {nextDmg}</span>
                  )}
                  {progress.selectedWeapon !== def.id && (
                    <span className="ml-1.5 text-[11px] text-slate-400">
                      ({curDmg - eqDmg >= 0 ? '+' : ''}{curDmg - eqDmg})
                    </span>
                  )}
                </div>
              </div>
              <div>
                <div className="text-slate-400">Fire Cadence</div>
                <div className="font-mono-num text-base font-bold text-sky-300">{curRate}/sec</div>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            {!unlocked ? (
              <button
                type="button"
                onClick={() => {
                  SoundManager.unlock();
                  const res = ProgressionManager.unlockOrUpgradeWeapon(def.id, 'unlock');
                  if (res.ok) SoundManager.playPurchase();
                  onFeedback(res);
                }}
                className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-lg bg-amber-400 px-4 py-2 font-display text-sm font-bold text-slate-950 hover:bg-amber-300"
              >
                <span>
                  Unlock ({def.unlockCredits} CR{def.unlockCrystals > 0 ? ` · ${def.unlockCrystals} Gems` : ''})
                </span>
              </button>
            ) : (
              <>
                {progress.selectedWeapon !== def.id && (
                  <button
                    type="button"
                    onClick={() => {
                      SoundManager.unlock();
                      const res = ProgressionManager.unlockOrUpgradeWeapon(def.id, 'select');
                      if (res.ok) SoundManager.playButtonClick();
                      onFeedback(res);
                    }}
                    className="flex min-h-[44px] flex-1 items-center justify-center rounded-lg border border-sky-400/70 bg-sky-500/15 px-4 py-2 font-display text-sm font-bold text-sky-200 hover:bg-sky-500/25"
                  >
                    Equip Weapon
                  </button>
                )}
                <button
                  type="button"
                  disabled={isMaxWeapon}
                  onClick={() => {
                    SoundManager.unlock();
                    const res = ProgressionManager.unlockOrUpgradeWeapon(def.id, 'upgrade');
                    if (res.ok) SoundManager.playPurchase();
                    onFeedback(res);
                  }}
                  className={`flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-lg px-4 py-2 font-display text-sm font-bold ${
                    isMaxWeapon
                      ? 'cursor-not-allowed border border-slate-700 bg-slate-900 text-slate-500'
                      : 'bg-sky-500 text-slate-950 hover:bg-sky-400'
                  }`}
                >
                  <ArrowUpCircle className="h-4 w-4" />
                  <span>
                    {isMaxWeapon
                      ? 'Max Level'
                      : `Upgrade (${upgCost.credits} CR${upgCost.crystals > 0 ? ` · ${upgCost.crystals} Gems` : ''})`}
                  </span>
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Section 2: 8 Core Ship Upgrades */}
      <section>
        <h3 className="mb-3 font-display text-sm font-bold text-sky-300">
          Upgrade Center (8 Fleet Systems)
        </h3>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {UPGRADE_LIST.map((u) => {
            const cur = progress.upgrades[u.id] ?? 0;
            const maxed = cur >= u.maxLevel;
            const cost = getUpgradeCost(u, cur);

            return (
              <div
                key={u.id}
                className="flex flex-col justify-between rounded-xl border border-slate-800 bg-[#081022]/90 p-3.5"
              >
                <div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-display text-sm font-bold text-white">{u.name}</span>
                    <span className="font-mono-num text-sky-300">
                      Lv.{cur}/{u.maxLevel}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] leading-snug text-slate-400">{u.description}</p>
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
                  onClick={() => {
                    SoundManager.unlock();
                    const res = ProgressionManager.purchaseUpgrade(u.id);
                    if (res.ok) SoundManager.playPurchase();
                    onFeedback(res);
                  }}
                  className={`mt-3 flex min-h-[42px] w-full items-center justify-center rounded-lg px-3 py-2 text-xs font-bold transition-colors ${
                    maxed
                      ? 'cursor-not-allowed border border-slate-800 bg-slate-950 text-slate-500'
                      : 'bg-sky-500 text-slate-950 hover:bg-sky-400'
                  }`}
                >
                  {maxed
                    ? 'MAXED'
                    : `${cost.credits.toLocaleString()} CR${cost.crystals > 0 ? ` · ${cost.crystals} Gems` : ''}`}
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
