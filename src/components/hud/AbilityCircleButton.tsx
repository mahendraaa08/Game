import React, { memo, useRef, useState } from 'react';
import { formatCooldownText } from './HudIcons';

interface AbilityCircleButtonProps {
  variant: 'dash' | 'special';
  label: string;
  hotkeyHint: string;
  ratio: number; // 0..1 (1 = ready)
  cooldownLeftSec: number;
  disabled?: boolean;
  lowFx?: boolean;
  sizePx: number;
  accentHex: string;
  secondaryHex: string;
  icon: React.ReactNode;
  activated: boolean;
  onActivate: () => void;
}

export const AbilityCircleButton = memo<AbilityCircleButtonProps>(
  ({
    variant,
    label,
    hotkeyHint,
    ratio,
    cooldownLeftSec,
    disabled = false,
    lowFx = false,
    sizePx,
    accentHex,
    secondaryHex,
    icon,
    activated,
    onActivate,
  }) => {
    const activePointerIdRef = useRef<number | null>(null);
    const [pressed, setPressed] = useState(false);

    const clamped = Math.max(0, Math.min(1, ratio));
    const ready = clamped >= 1 && !disabled;
    const strokeWidth = 2.5;
    const radius = (sizePx - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const dashOffset = circumference * (1 - clamped);
    const cooldownLabel =
      !ready && cooldownLeftSec > 0.05 ? formatCooldownText(cooldownLeftSec) : '';

    const releasePointer = (pointerId: number) => {
      if (activePointerIdRef.current === pointerId) {
        activePointerIdRef.current = null;
        setPressed(false);
      }
    };

    const backgroundStyle: React.CSSProperties = {
      width: sizePx,
      height: sizePx,
      background:
        variant === 'special'
          ? ready
            ? 'radial-gradient(circle at 32% 28%, rgba(168, 85, 247, 0.28), rgba(14, 11, 34, 0.90) 68%, rgba(6, 10, 24, 0.96) 100%)'
            : 'radial-gradient(circle at 50% 40%, rgba(20, 16, 40, 0.80), rgba(7, 10, 22, 0.88) 100%)'
          : ready
          ? 'radial-gradient(circle at 32% 28%, rgba(56, 189, 248, 0.24), rgba(8, 22, 46, 0.90) 68%, rgba(5, 11, 24, 0.96) 100%)'
          : 'radial-gradient(circle at 50% 40%, rgba(10, 18, 36, 0.80), rgba(5, 10, 20, 0.88) 100%)',
      boxShadow: ready
        ? lowFx
          ? `0 0 8px ${accentHex}2a`
          : `0 6px 18px rgba(2, 6, 18, 0.65), 0 0 16px ${accentHex}33`
        : '0 4px 12px rgba(2, 6, 18, 0.5)',
    };

    return (
      <button
        type="button"
        data-hud-control="true"
        aria-label={`${label} (${hotkeyHint})${cooldownLabel ? ` recharging ${cooldownLabel}` : ''}`}
        aria-disabled={!ready}
        onPointerDown={(e) => {
          e.preventDefault();
          if (activePointerIdRef.current !== null && activePointerIdRef.current !== e.pointerId) {
            return;
          }
          activePointerIdRef.current = e.pointerId;
          if (!ready) return;
          setPressed(true);
          onActivate();
        }}
        onPointerUp={(e) => releasePointer(e.pointerId)}
        onPointerCancel={(e) => releasePointer(e.pointerId)}
        onLostPointerCapture={(e) => releasePointer(e.pointerId)}
        onClick={(e) => {
          if (e.detail === 0 && ready) onActivate();
        }}
        style={backgroundStyle}
        className={`pointer-events-auto relative flex flex-col items-center justify-center overflow-hidden rounded-full border-0 transition-[transform,filter,opacity] duration-150 select-none touch-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 ${
          ready
            ? variant === 'special'
              ? 'text-purple-100 hover:brightness-110'
              : 'text-sky-100 hover:brightness-110'
            : 'text-slate-400 opacity-85 cursor-not-allowed'
        } ${pressed || activated ? 'scale-92 brightness-125' : ''}`}
      >
        {/* Subtle Internal Activation Flash (stays inside the single circle) */}
        {activated && !lowFx && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-full opacity-45"
            style={{
              background: `radial-gradient(circle, ${accentHex}80 0%, transparent 70%)`,
            }}
          />
        )}

        {/* Single Flush Perimeter Edge & Cooldown Sweep Arc */}
        <svg
          width={sizePx}
          height={sizePx}
          viewBox={`0 0 ${sizePx} ${sizePx}`}
          className="pointer-events-none absolute inset-0 -rotate-90"
          aria-hidden="true"
        >
          <circle
            cx={sizePx / 2}
            cy={sizePx / 2}
            r={radius}
            fill="none"
            stroke="rgba(148, 163, 184, 0.2)"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={sizePx / 2}
            cy={sizePx / 2}
            r={radius}
            fill="none"
            stroke={ready ? accentHex : disabled ? '#475569' : secondaryHex}
            strokeOpacity={ready ? 0.92 : 0.78}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
          />
        </svg>

        {/* Core Icon + Status Label / Seconds */}
        <div className="pointer-events-none relative z-10 flex flex-col items-center justify-center leading-none">
          {cooldownLabel ? (
            <>
              <span
                className={`font-mono-num font-bold tracking-tight ${
                  variant === 'special' ? 'text-[13px] text-purple-200' : 'text-xs text-sky-200'
                }`}
              >
                {cooldownLabel}
              </span>
              <span className="mt-0.5 font-display text-[8.5px] font-semibold tracking-wider text-slate-400">
                {label}
              </span>
            </>
          ) : (
            <>
              <div className={disabled ? 'opacity-45' : ''}>{icon}</div>
              <span className="mt-0.5 font-display text-[9px] font-bold tracking-wider">
                {label}
              </span>
            </>
          )}
        </div>
      </button>
    );
  }
);
AbilityCircleButton.displayName = 'AbilityCircleButton';
