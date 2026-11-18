import React from 'react';
import { BookOpen, ChevronRight, Crosshair, Shield } from 'lucide-react';
import { DRONE_LIST } from '../game/config/DroneConfig';
import { ENEMY_CONFIGS } from '../game/config/EnemyConfig';
import { SHIPS, SHIP_LIST } from '../game/config/ShipConfig';
import { UPGRADE_LIST } from '../game/config/UpgradeConfig';
import { WEAPONS, WEAPON_LIST } from '../game/config/WeaponConfig';
import { SoundManager } from '../game/audio/SoundManager';
import { computePlayerStats } from '../game/systems/ProgressionManager';
import { AppRoute } from '../game/utils/EventBus';
import { PlayerProgress } from '../game/utils/StorageManager';
import { DedicatedScreenShell } from './DedicatedScreenShell';
import { ShipArtBadge } from './hub/ShipArtBadge';

interface HangarHubScreenProps {
  progress: PlayerProgress;
  onBackToMenu: () => void;
  onSelectSection: (route: Extract<AppRoute, 'ships' | 'weapons' | 'armory' | 'codex'>) => void;
}

export const HangarHubScreen: React.FC<HangarHubScreenProps> = ({
  progress,
  onBackToMenu,
  onSelectSection,
}) => {
  const activeShip = SHIPS[progress.selectedShip] ?? SHIPS.falcon_x;
  const activeWeapon = WEAPONS[progress.selectedWeapon] ?? WEAPONS.plasma;
  const weaponLevel = progress.weaponLevels[activeWeapon.id] ?? 1;
  const computed = computePlayerStats(progress);

  const totalUpgradeLevels = UPGRADE_LIST.reduce(
    (sum, u) => sum + (progress.upgrades[u.id] ?? 0),
    0
  );
  const maxUpgradeLevels = UPGRADE_LIST.reduce((sum, u) => sum + u.maxLevel, 0);
  const equippedGearCount = Object.values(progress.equippedGear).filter(Boolean).length;
  const ownedGearCount = Object.keys(progress.ownedEquipment).length;

  const openSection = (route: Extract<AppRoute, 'ships' | 'weapons' | 'armory' | 'codex'>) => {
    SoundManager.unlock();
    SoundManager.playButtonClick();
    onSelectSection(route);
  };

  return (
    <DedicatedScreenShell
      title="Hangar & Upgrades"
      subtitle={`${activeShip.name} · HP ${computed.maxHp} · SHD ${computed.maxShield} · DMG ${Math.round(computed.damageMult * 100)}%`}
      backLabel="Main Menu"
      onBack={onBackToMenu}
      credits={progress.credits}
      crystals={progress.crystals}
      onCurrencyClick={() => openSection('armory')}
      translucent
      maxWidthClass="max-w-5xl"
    >
      <div className="flex flex-col gap-5 py-1 sm:py-3">
        {/* Combat Readiness Summary Banner */}
        <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-sky-400/25 bg-[#081022]/88 px-5 py-4 backdrop-blur-sm">
          <div className="flex items-center gap-3.5 min-w-0">
            <ShipArtBadge shipId={activeShip.id} size={52} />
            <div className="min-w-0">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-sky-300">
                Active Flagship · {activeShip.role}
              </div>
              <h2 className="truncate font-display text-lg sm:text-xl font-bold text-white">
                {activeShip.name}
              </h2>
              <p className="truncate font-mono-num text-xs text-slate-400">
                {activeWeapon.name} Lv.{weaponLevel} · {progress.equippedDrones.length}/2 Drones · {equippedGearCount}/4 Gear
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 border-t border-slate-800/80 pt-3 sm:border-t-0 sm:pt-0 font-mono-num text-xs">
            <div>
              <div className="text-[10px] text-slate-400">Hull</div>
              <div className="text-sm font-bold text-emerald-300">{computed.maxHp} HP</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400">Shield</div>
              <div className="text-sm font-bold text-sky-300">{computed.maxShield} SHD</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400">Firepower</div>
              <div className="text-sm font-bold text-amber-300">
                {Math.round(computed.damageMult * 100)}%
              </div>
            </div>
          </div>
        </section>

        {/* Three Dedicated Combat Progression Hub Cards */}
        <section
          aria-label="Hangar Sections"
          className="grid grid-cols-1 gap-4 md:grid-cols-3"
        >
          {/* 1. HANGAR & SHIPS */}
          <button
            type="button"
            onClick={() => openSection('ships')}
            className="group flex min-h-[176px] flex-col justify-between rounded-2xl border border-sky-400/35 bg-gradient-to-br from-[#0c1b36]/92 via-[#081124]/92 to-[#060c1a]/92 p-5 text-left transition-[border-color,transform,background-color] duration-150 hover:border-sky-300/80 hover:bg-[#0e1f3d]/95 active:scale-[0.985] focus-visible:outline-2 focus-visible:outline-sky-400"
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-sky-400/30 bg-sky-500/10">
                  <ShipArtBadge shipId={activeShip.id} size={36} />
                </div>
                <span className="font-mono-num text-xs font-semibold text-sky-300">
                  {progress.unlockedShips.length}/{SHIP_LIST.length} Fleet
                </span>
              </div>
              <h3 className="mt-4 font-display text-lg font-bold tracking-wide text-white">
                HANGAR &amp; SHIPS
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-300">
                Inspect stats, compare hulls, unlock starfighters, and arm Special modules.
              </p>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-slate-800/80 pt-3 text-xs font-semibold text-sky-300">
              <span>Active: {activeShip.name}</span>
              <ChevronRight className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5" />
            </div>
          </button>

          {/* 2. WEAPONS & UPGRADES */}
          <button
            type="button"
            onClick={() => openSection('weapons')}
            className="group flex min-h-[176px] flex-col justify-between rounded-2xl border border-cyan-400/35 bg-gradient-to-br from-[#091c2e]/92 via-[#081124]/92 to-[#060c1a]/92 p-5 text-left transition-[border-color,transform,background-color] duration-150 hover:border-cyan-300/80 hover:bg-[#0c2338]/95 active:scale-[0.985] focus-visible:outline-2 focus-visible:outline-cyan-400"
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-500/12">
                  <Crosshair className="h-6 w-6 text-cyan-300" />
                </span>
                <span className="font-mono-num text-xs font-semibold text-cyan-300">
                  {progress.unlockedWeapons.length}/{WEAPON_LIST.length} Weapons
                </span>
              </div>
              <h3 className="mt-4 font-display text-lg font-bold tracking-wide text-white">
                WEAPONS &amp; UPGRADES
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-300">
                Level primary cannons and upgrade damage, shield, hull, speed, and crit systems.
              </p>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-slate-800/80 pt-3 font-mono-num text-xs font-semibold text-cyan-300">
              <span>
                Systems {totalUpgradeLevels}/{maxUpgradeLevels}
              </span>
              <ChevronRight className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5" />
            </div>
          </button>

          {/* 3. ARMORY & SUPPLY */}
          <button
            type="button"
            onClick={() => openSection('armory')}
            className="group flex min-h-[176px] flex-col justify-between rounded-2xl border border-purple-400/35 bg-gradient-to-br from-[#14102b]/92 via-[#091022]/92 to-[#060c1a]/92 p-5 text-left transition-[border-color,transform,background-color] duration-150 hover:border-purple-300/80 hover:bg-[#1a1438]/95 active:scale-[0.985] focus-visible:outline-2 focus-visible:outline-purple-400"
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-purple-400/30 bg-purple-500/12">
                  <Shield className="h-6 w-6 text-purple-300" />
                </span>
                <span className="font-mono-num text-xs font-semibold text-purple-300">
                  {progress.equippedDrones.length}/2 Drones
                </span>
              </div>
              <h3 className="mt-4 font-display text-lg font-bold tracking-wide text-white">
                ARMORY &amp; SUPPLY
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-300">
                Equip gear across 4 tactical slots, deploy companion drones, and refine Crystals.
              </p>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-slate-800/80 pt-3 font-mono-num text-xs font-semibold text-purple-300">
              <span>
                {ownedGearCount} Gear · {Object.keys(progress.ownedDrones).length}/{DRONE_LIST.length} Drones
              </span>
              <ChevronRight className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5" />
            </div>
          </button>
        </section>

        {/* Compact Secondary Collection Entry: Galactic Codex */}
        <section aria-label="Collection Archive">
          <button
            type="button"
            onClick={() => openSection('codex')}
            className="group flex min-h-[68px] w-full items-center justify-between gap-4 rounded-2xl border border-slate-700/75 bg-[#070e1f]/90 px-5 py-3.5 text-left transition-[border-color,background-color,transform] duration-150 hover:border-sky-400/65 hover:bg-[#0c1630]/95 active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-sky-400"
          >
            <div className="flex min-w-0 items-center gap-3.5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-sky-400/25 bg-sky-500/10">
                <BookOpen className="h-5 w-5 text-sky-300" />
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-2 text-xs font-semibold text-sky-300">
                  <span>Collection</span>
                  <span aria-hidden="true" className="text-slate-600">·</span>
                  <span className="font-mono-num text-slate-400">
                    Enemies {progress.codex.discoveredEnemies.length}/{Object.keys(ENEMY_CONFIGS).length} · Bosses{' '}
                    {progress.codex.defeatedBosses.length}/5
                  </span>
                </div>
                <div className="truncate font-display text-sm sm:text-base font-bold text-white">
                  GALACTIC CODEX
                </div>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1.5 text-xs font-semibold text-slate-300 group-hover:text-sky-300">
              <span className="hidden sm:inline">Open Archive</span>
              <ChevronRight className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5" />
            </div>
          </button>
        </section>
      </div>
    </DedicatedScreenShell>
  );
};
