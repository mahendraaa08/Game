import React from 'react';
import { Crosshair, Flame, Navigation, Orbit, Radar, Shield, Sparkles, Zap } from 'lucide-react';
import type { CodexEntry } from '../../data/codex';
import { type DroneId } from '../../game/config/DroneConfig';
import { EQUIPMENT_BY_ID, RARITY_CONFIG } from '../../game/config/EquipmentConfig';
import { type PowerUpType } from '../../game/config/PowerUpConfig';
import { type ShipId } from '../../game/config/ShipConfig';
import { type WeaponId, WEAPONS } from '../../game/config/WeaponConfig';
import { SLOT_ICON } from '../hub/armory/armoryUtils';
import { DroneArtBadge, ShipArtBadge } from '../hub/ShipArtBadge';
import { PowerUpVectorIcon, WeaponVectorIcon } from '../hud/HudIcons';

const EnemySvgArtwork: React.FC<{ enemyId: string; size: number }> = ({ enemyId, size }) => {
  switch (enemyId) {
    case 'scout':
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className="shrink-0">
          <circle cx="32" cy="32" r="28" fill="#060c1c" stroke="#38BDF8" strokeOpacity="0.35" strokeWidth="1.5" />
          <polygon
            points="32,50 48,22 37,18 32,25 27,18 16,22"
            fill="#0F172A"
            stroke="#38BDF8"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          <circle cx="32" cy="34" r="4.5" fill="#F43F5E" />
        </svg>
      );
    case 'fighter':
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className="shrink-0">
          <circle cx="32" cy="32" r="28" fill="#060c1c" stroke="#EF4444" strokeOpacity="0.35" strokeWidth="1.5" />
          <polygon
            points="32,52 44,34 52,22 46,12 37,20 27,20 18,12 12,22 20,34"
            fill="#311020"
            stroke="#EF4444"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <rect x="26" y="19" width="12" height="20" rx="2" fill="#991B1B" />
          <circle cx="32" cy="34" r="4" fill="#FCA5A5" />
        </svg>
      );
    case 'bomber':
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className="shrink-0">
          <circle cx="32" cy="32" r="28" fill="#060c1c" stroke="#F97316" strokeOpacity="0.35" strokeWidth="1.5" />
          <polygon
            points="32,50 54,34 50,16 39,13 25,13 14,16 10,34"
            fill="#27150A"
            stroke="#F97316"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <circle cx="22" cy="30" r="3.5" fill="#F59E0B" />
          <circle cx="42" cy="30" r="3.5" fill="#F59E0B" />
          <ellipse cx="32" cy="36" rx="5" ry="6.5" fill="#FEF08A" />
        </svg>
      );
    case 'tank':
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className="shrink-0">
          <circle cx="32" cy="32" r="28" fill="#060c1c" stroke="#A855F7" strokeOpacity="0.38" strokeWidth="1.5" />
          <rect x="11" y="14" width="42" height="34" rx="7" fill="#1E1033" stroke="#A855F7" strokeWidth="2.2" />
          <rect x="19" y="20" width="26" height="22" rx="3" fill="#581C87" />
          <circle cx="32" cy="33" r="6" fill="#E879F9" />
          <rect x="15" y="45" width="5" height="7" rx="1" fill="#C084FC" />
          <rect x="44" y="45" width="5" height="7" rx="1" fill="#C084FC" />
        </svg>
      );
    case 'interceptor':
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className="shrink-0">
          <circle cx="32" cy="32" r="28" fill="#060c1c" stroke="#22D3EE" strokeOpacity="0.4" strokeWidth="1.5" />
          <polygon
            points="32,52 40,36 52,44 46,19 38,24 32,12 26,24 18,19 12,44 24,36"
            fill="#083344"
            stroke="#22D3EE"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <polygon points="32,46 27,26 37,26" fill="#06B6D4" fillOpacity="0.85" />
          <circle cx="23" cy="21" r="2.4" fill="#F43F5E" />
          <circle cx="41" cy="21" r="2.4" fill="#F43F5E" />
          <circle cx="32" cy="35" r="3.2" fill="#A5F3FC" />
        </svg>
      );
    case 'sniper':
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className="shrink-0">
          <circle cx="32" cy="32" r="28" fill="#060c1c" stroke="#818CF8" strokeOpacity="0.4" strokeWidth="1.5" />
          <polygon
            points="26,53 28,39 14,27 20,12 44,12 50,27 36,39 38,53 34,40 30,40"
            fill="#1E1B4B"
            stroke="#818CF8"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <rect x="28" y="17" width="8" height="20" rx="1.5" fill="#4338CA" />
          <circle cx="32" cy="34" r="4.2" fill="#38BDF8" />
          <circle cx="32" cy="34" r="1.8" fill="#FEF08A" />
        </svg>
      );
    case 'splitter':
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className="shrink-0">
          <circle cx="32" cy="32" r="28" fill="#060c1c" stroke="#FACC15" strokeOpacity="0.4" strokeWidth="1.5" />
          <polygon
            points="32,52 51,41 51,21 32,11 13,21 13,41"
            fill="#2A1807"
            stroke="#FACC15"
            strokeWidth="2.1"
            strokeLinejoin="round"
          />
          <circle cx="32" cy="32" r="11" fill="none" stroke="#F97316" strokeWidth="1.6" />
          <circle cx="32" cy="32" r="5.5" fill="#FEF08A" />
          <circle cx="20" cy="34" r="2.6" fill="#F97316" />
          <circle cx="44" cy="34" r="2.6" fill="#F97316" />
        </svg>
      );
    case 'bastion':
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className="shrink-0">
          <circle cx="32" cy="32" r="28" fill="#060c1c" stroke="#10B981" strokeOpacity="0.42" strokeWidth="1.5" />
          <polygon
            points="19,50 45,50 56,37 52,18 40,12 24,12 12,18 8,37"
            fill="#042F2E"
            stroke="#10B981"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          <rect x="18" y="20" width="28" height="22" rx="4" fill="#065F46" />
          <circle cx="32" cy="32" r="5.5" fill="#6EE7B7" />
          <rect x="14" y="42" width="5" height="8" rx="1" fill="#34D399" />
          <rect x="45" y="42" width="5" height="8" rx="1" fill="#34D399" />
        </svg>
      );
    case 'harbinger':
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className="shrink-0">
          <circle cx="32" cy="32" r="28" fill="#060c1c" stroke="#E879F9" strokeOpacity="0.45" strokeWidth="1.5" />
          <polygon
            points="32,54 41,37 54,46 51,20 40,12 35,23 32,14 29,23 24,12 13,20 10,46 23,37"
            fill="#28052E"
            stroke="#E879F9"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <circle cx="32" cy="32" r="8.5" fill="none" stroke="#F43F5E" strokeWidth="1.7" />
          <circle cx="32" cy="32" r="4.8" fill="#F43F5E" />
          <circle cx="32" cy="32" r="2.2" fill="#FEF08A" />
        </svg>
      );
    case 'elite':
    default:
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className="shrink-0">
          <circle cx="32" cy="32" r="28" fill="#060c1c" stroke="#F43F5E" strokeOpacity="0.4" strokeWidth="1.5" />
          <polygon
            points="32,53 52,27 42,10 36,21 32,12 28,21 22,10 12,27"
            fill="#2A0818"
            stroke="#F43F5E"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <polygon points="32,44 23,24 41,24" fill="none" stroke="#FBBF24" strokeWidth="1.6" />
          <circle cx="32" cy="31" r="3.8" fill="#FBBF24" />
        </svg>
      );
  }
};

const BossSvgArtwork: React.FC<{ bossId: string; size: number }> = ({ bossId, size }) => {
  switch (bossId) {
    case 'iron_guardian':
      return (
        <svg width={size} height={size} viewBox="0 0 80 80" aria-hidden="true" className="shrink-0">
          <circle cx="40" cy="40" r="36" fill="#060c1c" stroke="#F59E0B" strokeOpacity="0.4" strokeWidth="1.5" />
          <polygon
            points="12,26 68,26 63,52 50,59 46,48 34,48 30,59 17,52"
            fill="#1F2937"
            stroke="#F59E0B"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          <rect x="23" y="30" width="34" height="16" rx="2" fill="#78350F" />
          <circle cx="40" cy="40" r="8" fill="none" stroke="#EF4444" strokeWidth="2" />
          <circle cx="40" cy="40" r="5" fill="#FEF08A" />
        </svg>
      );
    case 'venom_queen':
      return (
        <svg width={size} height={size} viewBox="0 0 80 80" aria-hidden="true" className="shrink-0">
          <circle cx="40" cy="40" r="36" fill="#060c1c" stroke="#A855F7" strokeOpacity="0.42" strokeWidth="1.5" />
          <polygon
            points="40,61 68,36 59,20 47,30 40,22 33,30 21,20 12,36"
            fill="#2E1065"
            stroke="#A855F7"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          <circle cx="40" cy="42" r="5.5" fill="#22C55E" />
          <circle cx="25" cy="38" r="3" fill="#22C55E" />
          <circle cx="55" cy="38" r="3" fill="#22C55E" />
        </svg>
      );
    case 'shadow_titan':
      return (
        <svg width={size} height={size} viewBox="0 0 80 80" aria-hidden="true" className="shrink-0">
          <circle cx="40" cy="40" r="36" fill="#060c1c" stroke="#38BDF8" strokeOpacity="0.42" strokeWidth="1.5" />
          <polygon
            points="40,62 70,41 64,20 48,28 40,18 32,28 16,20 10,41"
            fill="#091124"
            stroke="#38BDF8"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          <polygon points="40,51 30,32 50,32" fill="#6366F1" fillOpacity="0.88" />
          <circle cx="40" cy="40" r="4.5" fill="#67E8F9" />
        </svg>
      );
    case 'cyber_leviathan':
      return (
        <svg width={size} height={size} viewBox="0 0 80 80" aria-hidden="true" className="shrink-0">
          <circle cx="40" cy="40" r="36" fill="#060c1c" stroke="#10B981" strokeOpacity="0.42" strokeWidth="1.5" />
          <rect x="11" y="24" width="58" height="26" rx="7" fill="#042F2E" stroke="#10B981" strokeWidth="2.2" />
          <polygon points="20,50 26,62 32,50" fill="#064E3B" stroke="#10B981" strokeWidth="1.5" />
          <polygon points="48,50 54,62 60,50" fill="#064E3B" stroke="#10B981" strokeWidth="1.5" />
          <rect x="22" y="29" width="36" height="15" rx="2" fill="none" stroke="#34D399" strokeWidth="1.6" />
          <circle cx="40" cy="37" r="5" fill="#22D3EE" />
        </svg>
      );
    case 'void_emperor':
    default:
      return (
        <svg width={size} height={size} viewBox="0 0 80 80" aria-hidden="true" className="shrink-0">
          <circle cx="40" cy="40" r="36" fill="#060c1c" stroke="#F43F5E" strokeOpacity="0.48" strokeWidth="1.5" />
          <polygon
            points="40,64 50,49 71,54 68,28 53,20 46,31 40,18 34,31 27,20 12,28 9,54 30,49"
            fill="#1A0414"
            stroke="#F43F5E"
            strokeWidth="2.1"
            strokeLinejoin="round"
          />
          <circle cx="40" cy="40" r="11" fill="none" stroke="#A855F7" strokeWidth="1.8" />
          <circle cx="40" cy="40" r="7.5" fill="#881337" />
          <circle cx="40" cy="40" r="3.8" fill="#FEF08A" />
          <circle cx="20" cy="42" r="2.6" fill="#F43F5E" />
          <circle cx="60" cy="42" r="2.6" fill="#F43F5E" />
        </svg>
      );
  }
};

export const CodexArtwork: React.FC<{ entry: CodexEntry; size?: number }> = ({
  entry,
  size = 44,
}) => {
  switch (entry.category) {
    case 'aircraft':
      return <ShipArtBadge shipId={entry.sourceId as ShipId} size={size} />;

    case 'drones':
      return <DroneArtBadge droneId={entry.sourceId as DroneId} colorHex={entry.accentHex} size={size} />;

    case 'weapons': {
      const weapon = WEAPONS[entry.sourceId as WeaponId];
      if (!weapon) return null;
      return (
        <span
          style={{ width: size, height: size, borderColor: `${entry.accentHex}44` }}
          className="flex shrink-0 items-center justify-center rounded-xl border bg-[#060c1c]"
        >
          <WeaponVectorIcon weapon={weapon} className="h-[54%] w-[54%]" />
        </span>
      );
    }

    case 'powerUps':
      return (
        <span
          style={{ width: size, height: size, borderColor: `${entry.accentHex}44` }}
          className="flex shrink-0 items-center justify-center rounded-full border bg-[#060c1c]"
        >
          <PowerUpVectorIcon type={entry.sourceId as PowerUpType} className="h-[52%] w-[52%]" />
        </span>
      );

    case 'gears': {
      const eq = EQUIPMENT_BY_ID[entry.sourceId];
      const SlotIcon = eq ? SLOT_ICON[eq.slot] : Shield;
      const rarityColor = eq ? RARITY_CONFIG[eq.rarity].colorHex : entry.accentHex;
      return (
        <span
          style={{ width: size, height: size, borderColor: `${rarityColor}55` }}
          className="flex shrink-0 items-center justify-center rounded-xl border bg-[#060c1c]"
        >
          <SlotIcon style={{ color: rarityColor }} className="h-[46%] w-[46%]" />
        </span>
      );
    }

    case 'abilities': {
      const Icon =
        entry.sourceId === 'emp_nova'
          ? Orbit
          : entry.sourceId === 'orbital_strike'
          ? Zap
          : entry.sourceId === 'photon_barrage'
          ? Flame
          : entry.sourceId === 'thruster_dash'
          ? Navigation
          : Sparkles;
      return (
        <span
          style={{ width: size, height: size, borderColor: `${entry.accentHex}4D` }}
          className="flex shrink-0 items-center justify-center rounded-xl border bg-[#060c1c]"
        >
          <Icon style={{ color: entry.accentHex }} className="h-[48%] w-[48%]" />
        </span>
      );
    }

    case 'enemies':
      return <EnemySvgArtwork enemyId={entry.sourceId} size={size} />;

    case 'bosses':
      return <BossSvgArtwork bossId={entry.sourceId} size={size} />;

    default:
      return (
        <span
          style={{ width: size, height: size }}
          className="flex shrink-0 items-center justify-center rounded-xl border border-slate-700/70 bg-[#060c1c]"
        >
          <Radar className="h-[46%] w-[46%] text-cyan-300" />
          <Crosshair className="sr-only" />
        </span>
      );
  }
};
