import React from 'react';

export const CANCEL_BUTTON_CLASS =
  'flex min-h-[46px] items-center justify-center rounded-xl border border-slate-700/90 bg-[#060c1a] px-4 py-2.5 text-center text-xs sm:text-sm font-semibold text-slate-200 transition-[border-color,background-color,color,transform] duration-150 hover:border-slate-500 hover:bg-[#0d1930] hover:text-white active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400 disabled:cursor-not-allowed disabled:opacity-45 disabled:active:scale-100';

export const CONFIRM_BUTTON_CLASS =
  'flex min-h-[46px] items-center justify-center rounded-xl border border-[#FEF08A]/70 bg-[#FACC15] px-4 py-2.5 text-center font-display text-xs sm:text-sm font-bold tracking-wider text-slate-950 transition-[background-color,border-color,transform] duration-150 hover:border-[#FEF9C3]/85 hover:bg-[#FDE047] active:scale-[0.98] active:bg-[#EAB308] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FDE047] disabled:cursor-not-allowed disabled:border-[#FACC15]/20 disabled:bg-[#FACC15]/30 disabled:text-slate-400/80 disabled:active:scale-100';

interface ConfirmButtonPairProps {
  onCancel: () => void;
  onConfirm: () => void;
  cancelLabel?: string;
  confirmLabel?: string;
  cancelDisabled?: boolean;
  confirmDisabled?: boolean;
  className?: string;
}

export const ConfirmButtonPair: React.FC<ConfirmButtonPairProps> = ({
  onCancel,
  onConfirm,
  cancelLabel = 'Cancel',
  confirmLabel = 'Confirm',
  cancelDisabled = false,
  confirmDisabled = false,
  className = 'mt-5 grid grid-cols-2 gap-3',
}) => {
  return (
    <div className={className}>
      <button
        type="button"
        disabled={cancelDisabled}
        onClick={onCancel}
        className={CANCEL_BUTTON_CLASS}
      >
        {cancelLabel}
      </button>
      <button
        type="button"
        disabled={confirmDisabled}
        onClick={onConfirm}
        className={CONFIRM_BUTTON_CLASS}
      >
        {confirmLabel}
      </button>
    </div>
  );
};
