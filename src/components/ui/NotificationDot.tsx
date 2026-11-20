import React from 'react';

interface NotificationDotProps {
  visible?: boolean;
  /** Positioning mode: 'corner' floats on top-right border; 'corner-inset' sits inside top-right padding; 'inline' flows inline */
  position?: 'corner' | 'corner-inset' | 'inline';
  label?: string;
  className?: string;
}

const POSITION_CLASS: Record<'corner' | 'corner-inset' | 'inline', string> = {
  corner: 'pointer-events-none absolute -right-1 -top-1 z-20',
  'corner-inset': 'pointer-events-none absolute right-1.5 top-1.5 z-20',
  inline: 'shrink-0',
};

export const NotificationDot: React.FC<NotificationDotProps> = ({
  visible = true,
  position = 'corner',
  label = 'Action available',
  className = '',
}) => {
  if (!visible) return null;

  return (
    <span
      role="status"
      aria-label={label}
      className={`inline-block h-2.5 w-2.5 sm:h-[11px] sm:w-[11px] rounded-full bg-red-500 ring-[1.5px] ring-[#060d1c]/90 shadow-[0_1px_3px_rgba(239,68,68,0.4)] ${POSITION_CLASS[position]} ${className}`}
    />
  );
};
