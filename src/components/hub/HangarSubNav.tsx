import React, { useMemo } from 'react';
import { Crosshair, Rocket, Shield } from 'lucide-react';
import { SoundManager } from '../../game/audio/SoundManager';
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

  const tabDot: Record<HangarTabRoute, boolean> = {
    ships: notifications.shipsTab,
    weapons: notifications.weaponsTab,
    armory: notifications.armoryTab,
  };

  return (
    <nav
      aria-label="Hangar Sections"
      className="grid grid-cols-3 gap-1.5 rounded-xl border border-slate-800/85 bg-[#060d1c]/90 p-1 sm:max-w-lg"
    >
      {HANGAR_TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            aria-current={isActive ? 'page' : undefined}
            onClick={() => {
              if (isActive) return;
              SoundManager.unlock();
              SoundManager.playButtonClick();
              onSelectTab(tab.id);
            }}
            className={`relative flex min-h-[42px] items-center justify-center gap-2 rounded-lg border px-2.5 py-1.5 font-display text-xs font-bold tracking-[0.08em] whitespace-nowrap transition-[border-color,background-color,color,transform] duration-150 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-cyan-400 ${
              isActive
                ? 'border-cyan-300/60 bg-cyan-400/15 text-cyan-100'
                : 'border-transparent bg-transparent text-slate-400 hover:bg-[#0d1930]/80 hover:text-slate-100'
            }`}
          >
            <NotificationDot
              visible={tabDot[tab.id]}
              position="corner"
              label={`${tab.label} action available`}
            />
            <Icon className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-cyan-300' : 'text-slate-400'}`} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
