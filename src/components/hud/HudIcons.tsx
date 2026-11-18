import React from 'react';
import { PowerUpType } from '../../game/config/PowerUpConfig';
import { WeaponDefinition } from '../../game/config/WeaponConfig';

export function formatCooldownText(sec: number): string {
  if (sec <= 0) return '';
  if (sec < 3) return `${sec.toFixed(1)}s`;
  return `${Math.ceil(sec)}s`;
}

export function formatBuffCountdown(sec: number): string {
  if (sec <= 0) return '0s';
  if (sec < 1) return `${sec.toFixed(1)}s`;
  return `${Math.ceil(sec)}s`;
}

/* -------------------------------------------------------------------------- */
/* Dynamic Weapon Icon Renderer (supports all current & future weapons)       */
/* -------------------------------------------------------------------------- */
export const WeaponVectorIcon: React.FC<{ weapon: WeaponDefinition; className?: string }> = ({
  weapon,
  className = 'h-4 w-4',
}) => {
  const color = weapon.colorHex;
  switch (weapon.id) {
    case 'plasma':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="4.5" fill={color} fillOpacity="0.28" stroke={color} strokeWidth="1.8" />
          <path d="M12 3V7M12 17V21M3 12H7M17 12H21" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case 'dual_laser':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          <path d="M8 4V20M16 4V20" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
          <path d="M8 7L8 12M16 7L16 12" stroke="#E0F2FE" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      );
    case 'spread':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          <path d="M12 19V5M12 19L5 7M12 19L19 7" stroke={color} strokeWidth="2" strokeLinecap="round" />
          <circle cx="12" cy="5" r="1.6" fill={color} />
          <circle cx="5" cy="7" r="1.6" fill={color} />
          <circle cx="19" cy="7" r="1.6" fill={color} />
        </svg>
      );
    case 'homing':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          <path
            d="M12 3L15.5 9.5L14 15L16.5 19.5L12 17.5L7.5 19.5L10 15L8.5 9.5L12 3Z"
            fill={color}
            fillOpacity="0.26"
            stroke={color}
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'beam':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          <rect x="9.5" y="3" width="5" height="18" rx="2.5" fill={color} fillOpacity="0.3" stroke={color} strokeWidth="1.6" />
          <line x1="12" y1="4" x2="12" y2="20" stroke="#E0F2FE" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    case 'lightning':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          <path
            d="M13.5 3L6 13H12L10.5 21L18 11H12L13.5 3Z"
            fill={color}
            fillOpacity="0.28"
            stroke={color}
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          <polygon
            points="12,3 20,12 12,21 4,12"
            fill={color}
            fillOpacity="0.25"
            stroke={color}
            strokeWidth="1.8"
          />
          <circle cx="12" cy="12" r="2.2" fill={color} />
        </svg>
      );
  }
};

/* -------------------------------------------------------------------------- */
/* Distinct Power-Up Icon Renderer                                            */
/* -------------------------------------------------------------------------- */
export const PowerUpVectorIcon: React.FC<{ type: PowerUpType; className?: string }> = ({
  type,
  className = 'h-4 w-4',
}) => {
  switch (type) {
    case 'health':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          <path
            d="M12 5V19M5 12H19"
            stroke="#4ADE80"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'shield':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          <path
            d="M12 3.5L19 6.5V12C19 16.4 15.9 19.9 12 21C8.1 19.9 5 16.4 5 12V6.5L12 3.5Z"
            fill="#38BDF8"
            fillOpacity="0.25"
            stroke="#67E8F9"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'rapid_fire':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          <path
            d="M13.5 3L6.5 13H12L10.5 21L17.5 11H12L13.5 3Z"
            fill="#FBBF24"
            stroke="#FEF08A"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'double_damage':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          <path
            d="M12 3L19 10L16 12L19 16L12 21L5 16L8 12L5 10L12 3Z"
            fill="#EF4444"
            fillOpacity="0.3"
            stroke="#F87171"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="12" r="2.2" fill="#FCA5A5" />
        </svg>
      );
    case 'invulnerability':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          <polygon
            points="12,3 19.5,7.5 19.5,16.5 12,21 4.5,16.5 4.5,7.5"
            fill="#A855F7"
            fillOpacity="0.26"
            stroke="#67E8F9"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="12" r="3" fill="#C4B5FD" />
        </svg>
      );
    case 'mega_bomb':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="5" fill="#A855F7" fillOpacity="0.35" stroke="#E879F9" strokeWidth="1.8" />
          <path
            d="M12 2.5V5.5M12 18.5V21.5M2.5 12H5.5M18.5 12H21.5M5.3 5.3L7.5 7.5M16.5 16.5L18.7 18.7M18.7 5.3L16.5 7.5M7.5 16.5L5.3 18.7"
            stroke="#E879F9"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      );
  }
};
