import React, { useMemo } from 'react';
import { Crosshair, Lock, Rocket, Shield } from 'lucide-react';
import { SoundManager } from '../../game/audio/SoundManager';
import { isArmoryUnlocked } from '../../game/config/EconomyConfig';
import { evaluateGlobalNotifications } from '../../game/systems/NotificationStatus';
import { AppRoute } from '../../game/utils/EventBus';
import { PlayerProgress } from '../../game/utils/StorageManager';
import { NotificationDot } from '../ui/NotificationDot';

export type HangarTabRoute = Extract<AppRoute, 'ships' | 'weapons' | 'armory'>;

interface HangarSubNavProps {
  activeTab: HangarTabRoute;
  onSelectTab: (tab: HangarTabRoute) => void;
  progress: PlayerProgress;
}

const HANGAR_TABS: Array<{
  id: HangarTabRoute;
  label: string;
  icon: React.FC<{ className?: string }>;
}> = [
  { id: 'ships', label: 'SHIPS', icon: Rocket },
  { id: 'weapons', label: 'WEAPONS', icon: Crosshair },
  { id: 'armory', label: 'ARMORY', icon: Shield },
];

export const HangarSubNav: React.FC<HangarSubNavProps> = ({
  activeTab,
  onSelectTab,
  progress,
}) => {
  const notifications = useMemo(() => evaluateGlobalNotifications(progress), [progress]);
  const armoryUnlocked = isArmoryUnlocked(progress);

  const tabDot: Record<HangarTabRoute, boolean> = {
    ships: notifications.shipsTab,
    weapons: notifications.weaponsTab,
    armory: armoryUnlocked ? notifications.armoryTab : false,
  };

  return (
    <nav
      aria-label="Hangar Sections"
      className="grid grid-cols-3 gap-1.5 rounded-xl border border-slate-800/85 bg-[#060d1c]/90 p-1 sm:max-w-lg"
    >
      {HANGAR_TABS.map((tab) => {
        const Icon = tab.icon;
        const isLocked = tab.id === 'armory' && !armoryUnlocked;
        const isActive = !isLocked && activeTab === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            disabled={isLocked}
            aria-disabled={isLocked ? 'true' : undefined}
            aria-current={isActive ? 'page' : undefined}
            title={
              isLocked ? 'Clear Sector 03 on Normal difficulty or higher to unlock Armory' : undefined
            }
            onClick={() => {
              if (isLocked || isActive) return;
              SoundManager.unlock();
              SoundManager.playButtonClick();
              onSelectTab(tab.id);
            }}
            className={`relative flex min-h-[44px] flex-col items-center justify-center rounded-lg border px-2 py-1.5 transition-[border-color,background-color,color,transform] duration-150 focus-visible:outline-2 focus-visible:outline-cyan-400 ${
              isLocked
                ? 'cursor-not-allowed border-slate-800/80 bg-[#050a16]/80 text-slate-500'
                : isActive
                ? 'border-cyan-300/60 bg-cyan-400/15 text-cyan-100 active:scale-[0.98]'
                : 'border-transparent bg-transparent text-slate-400 hover:bg-[#0d1930]/80 hover:text-slate-100 active:scale-[0.98]'
            }`}
          >
            <NotificationDot
              visible={!isLocked && tabDot[tab.id]}
              position="corner"
              label={`${tab.label} action available`}
            />
            <span className="flex items-center justify-center gap-1.5 font-display text-xs font-bold tracking-[0.08em] whitespace-nowrap">
              {isLocked ? (
                <Lock className="h-3.5 w-3.5 shrink-0 text-amber-400/80" />
              ) : (
                <Icon
                  className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-cyan-300' : 'text-slate-400'}`}
                />
              )}
              <span>{tab.label}</span>
            </span>
            {isLocked && (
              <span className="mt-0.5 font-mono-num text-[9px] font-semibold tracking-wider text-amber-300/80 whitespace-nowrap">
                UNLOCK: NORMAL · S03
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
};
