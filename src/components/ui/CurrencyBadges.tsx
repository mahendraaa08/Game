import React, { useId } from 'react';

interface CurrencyBadgeProps {
  amount: number;
  prefix?: string;
  size?: 'sm' | 'md';
  onClick?: () => void;
  title?: string;
}

export const CreditCoinIcon: React.FC<{ className?: string }> = ({ className = 'h-4 w-4' }) => {
  const gradId = useId();
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={gradId} x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FEF08A" />
          <stop offset="50%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="9.5" fill={`url(#${gradId})`} stroke="#FDE68A" strokeWidth="1.2" />
      <circle cx="12" cy="12" r="6.5" stroke="#78350F" strokeOpacity="0.45" strokeWidth="1" />
      <path d="M12 7.5V16.5M9.5 10.2C9.5 9.1 10.6 8.5 12 8.5C13.4 8.5 14.3 9.1 14.3 10.1C14.3 11.9 9.7 11.5 9.7 13.7C9.7 14.8 10.7 15.5 12 15.5C13.4 15.5 14.4 14.9 14.4 13.8" stroke="#451A03" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
};

export const CrystalGemIcon: React.FC<{ className?: string }> = ({ className = 'h-4 w-4' }) => {
  const gradId = useId();
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={gradId} x1="4" y1="2" x2="20" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#E0F2FE" />
          <stop offset="45%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#0284C7" />
        </linearGradient>
      </defs>
      <polygon
        points="12,2.5 19.5,9 12,21.5 4.5,9"
        fill={`url(#${gradId})`}
        stroke="#BAE6FD"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <polygon points="12,2.5 15.5,9 12,21.5 8.5,9" fill="#E0F2FE" fillOpacity="0.28" />
      <line x1="4.5" y1="9" x2="19.5" y2="9" stroke="#E0F2FE" strokeOpacity="0.55" strokeWidth="1" />
    </svg>
  );
};

export const CreditsBadge: React.FC<CurrencyBadgeProps> = ({
  amount,
  prefix = '',
  size = 'md',
  onClick,
  title = 'Credits — Tap to open Armory & Supply Exchange',
}) => {
  const classes = `group inline-flex items-center gap-2 rounded-xl border border-amber-400/45 bg-gradient-to-br from-[#1a1306]/90 via-[#120d05]/92 to-[#090d18]/92 shadow-[0_0_16px_rgba(245,158,11,0.12)] backdrop-blur-sm transition-[border-color,transform,filter] duration-150 ${
    size === 'sm' ? 'min-h-[34px] px-2.5 py-1 text-xs' : 'min-h-[38px] px-3 py-1.5 text-xs sm:text-sm'
  } ${
    onClick
      ? 'cursor-pointer hover:border-amber-300/80 hover:brightness-110 active:scale-[0.97]'
      : ''
  }`;

  const inner = (
    <>
      <CreditCoinIcon className={size === 'sm' ? 'h-4 w-4 shrink-0' : 'h-[18px] w-[18px] shrink-0'} />
      <span className="font-mono-num font-bold tracking-tight text-amber-200 whitespace-nowrap">
        {prefix}
        {amount.toLocaleString()}
      </span>
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} title={title} className={classes}>
        {inner}
      </button>
    );
  }

  return <div className={classes}>{inner}</div>;
};

export const CrystalsBadge: React.FC<CurrencyBadgeProps> = ({
  amount,
  prefix = '',
  size = 'md',
  onClick,
  title = 'Void Crystals — Tap to open Armory & Supply Exchange',
}) => {
  const classes = `group inline-flex items-center gap-2 rounded-xl border border-cyan-400/45 bg-gradient-to-br from-[#06192a]/90 via-[#071222]/92 to-[#090d18]/92 shadow-[0_0_16px_rgba(34,211,238,0.12)] backdrop-blur-sm transition-[border-color,transform,filter] duration-150 ${
    size === 'sm' ? 'min-h-[34px] px-2.5 py-1 text-xs' : 'min-h-[38px] px-3 py-1.5 text-xs sm:text-sm'
  } ${
    onClick
      ? 'cursor-pointer hover:border-cyan-300/80 hover:brightness-110 active:scale-[0.97]'
      : ''
  }`;

  const inner = (
    <>
      <CrystalGemIcon className={size === 'sm' ? 'h-4 w-4 shrink-0' : 'h-[18px] w-[18px] shrink-0'} />
      <span className="font-mono-num font-bold tracking-tight text-cyan-200 whitespace-nowrap">
        {prefix}
        {amount.toLocaleString()}
      </span>
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} title={title} className={classes}>
        {inner}
      </button>
    );
  }

  return <div className={classes}>{inner}</div>;
};
