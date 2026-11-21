import React from 'react';
import {
  PROFILE_AVATAR_MAP,
  PROFILE_BORDER_MAP,
  type ProfileAvatarId,
  type ProfileBorderId,
} from '../../game/config/ProfileCosmeticsConfig';

export type ProfileBadgeSize = 'xs' | 'sm' | 'md' | 'lg';

interface ProfileAvatarBadgeProps {
  avatarId: ProfileAvatarId;
  borderId: ProfileBorderId;
  size?: ProfileBadgeSize;
  className?: string;
}

const SIZE_MAP: Record<ProfileBadgeSize, { box: string; icon: string }> = {
  xs: { box: 'h-8 w-8 rounded-lg', icon: 'h-4 w-4' },
  sm: { box: 'h-10 w-10 rounded-xl', icon: 'h-5 w-5' },
  md: { box: 'h-11 w-11 rounded-xl', icon: 'h-[22px] w-[22px]' },
  lg: { box: 'h-14 w-14 rounded-2xl', icon: 'h-7 w-7' },
};

export const AvatarEmblemSvg: React.FC<{
  avatarId: ProfileAvatarId;
  className?: string;
}> = ({ avatarId, className = 'h-5 w-5' }) => {
  const def = PROFILE_AVATAR_MAP[avatarId] ?? PROFILE_AVATAR_MAP.vanguard;
  const color = def.accentHex;

  switch (avatarId) {
    case 'phoenix':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path
            d="M12 3.5L14.8 8.6L21 7.2L16.2 13.2L19 18.8L12 15.6L5 18.8L7.8 13.2L3 7.2L9.2 8.6L12 3.5Z"
            stroke={color}
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="11.5" r="2" fill={color} />
        </svg>
      );
    case 'nova':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path
            d="M12 2.8L14.2 9.8L21.2 12L14.2 14.2L12 21.2L9.8 14.2L2.8 12L9.8 9.8L12 2.8Z"
            stroke={color}
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="12" r="2.2" fill={color} />
        </svg>
      );
    case 'specter':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path
            d="M12 3L19.5 16.5L14.5 14.5L12 20.5L9.5 14.5L4.5 16.5L12 3Z"
            stroke={color}
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
          <path d="M12 8.5V13.5" stroke={color} strokeWidth="1.75" strokeLinecap="round" />
        </svg>
      );
    case 'aegis':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path
            d="M12 3L19.5 7.2V16.8L12 21L4.5 16.8V7.2L12 3Z"
            stroke={color}
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
          <path
            d="M12 7.2L15.8 9.4V14.6L12 16.8L8.2 14.6V9.4L12 7.2Z"
            fill={color}
            fillOpacity="0.28"
            stroke={color}
            strokeWidth="1.4"
          />
        </svg>
      );
    case 'orbit':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <ellipse
            cx="12"
            cy="12"
            rx="8.5"
            ry="3.8"
            transform="rotate(-28 12 12)"
            stroke={color}
            strokeWidth="1.65"
          />
          <path
            d="M12 5.2L15.4 16.5L12 14.4L8.6 16.5L12 5.2Z"
            fill={color}
            fillOpacity="0.25"
            stroke={color}
            strokeWidth="1.65"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'eclipse':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <circle cx="11.2" cy="12" r="6.5" stroke={color} strokeWidth="1.75" />
          <path
            d="M14.5 5.6A6.5 6.5 0 0 1 14.5 18.4"
            stroke="#F8FAFC"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
          <circle cx="11.2" cy="12" r="2.3" fill={color} />
        </svg>
      );
    case 'sovereign':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path
            d="M4.5 17.5L3.8 8.2L8.8 11.8L12 5.2L15.2 11.8L20.2 8.2L19.5 17.5H4.5Z"
            stroke={color}
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
          <path d="M6 20H18" stroke={color} strokeWidth="1.75" strokeLinecap="round" />
        </svg>
      );
    case 'vanguard':
    default:
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path
            d="M12 3.2L19 6.3V11.8C19 16.1 16 19.3 12 20.8C8 19.3 5 16.1 5 11.8V6.3L12 3.2Z"
            stroke={color}
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
          <path
            d="M12 7.5L14.5 13.8L12 12.6L9.5 13.8L12 7.5Z"
            fill={color}
          />
        </svg>
      );
  }
};

export const ProfileAvatarBadge: React.FC<ProfileAvatarBadgeProps> = ({
  avatarId,
  borderId,
  size = 'md',
  className = '',
}) => {
  const borderDef = PROFILE_BORDER_MAP[borderId] ?? PROFILE_BORDER_MAP.standard_alloy;
  const avatarDef = PROFILE_AVATAR_MAP[avatarId] ?? PROFILE_AVATAR_MAP.vanguard;
  const dim = SIZE_MAP[size];

  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden ${dim.box} ${borderDef.frameClass} ${className}`}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute inset-1 rounded-[inherit] opacity-65 ${avatarDef.bgTintClass}`}
      />
      <AvatarEmblemSvg avatarId={avatarId} className={`relative z-10 ${dim.icon}`} />
    </span>
  );
};
