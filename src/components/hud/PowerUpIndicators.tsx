import React, { memo, useEffect, useRef, useState } from 'react';
import { POWERUP_CONFIGS } from '../../game/config/PowerUpConfig';
import { EventBus, PowerUpPickupPayload } from '../../game/utils/EventBus';
import { PowerUpVectorIcon, formatBuffCountdown } from './HudIcons';

interface ActiveBuffEntry {
  type: 'rapid_fire' | 'double_damage' | 'invulnerability';
  leftSec: number;
  durationSec: number;
  pulseKey: number;
  exiting: boolean;
}

export const ActivePowerUpsBar = memo<{
  rapidFireLeftSec: number;
  doubleDamageLeftSec: number;
  invulnLeftSec: number;
}>(({ rapidFireLeftSec, doubleDamageLeftSec, invulnLeftSec }) => {
  const [entries, setEntries] = useState<ActiveBuffEntry[]>([]);
  const prevSecRef = useRef<Record<string, number>>({});
  const exitTimersRef = useRef<Record<string, number>>({});

  useEffect(() => {
    const syncList: Array<{
      type: 'rapid_fire' | 'double_damage' | 'invulnerability';
      left: number;
    }> = [
      { type: 'rapid_fire', left: rapidFireLeftSec },
      { type: 'double_damage', left: doubleDamageLeftSec },
      { type: 'invulnerability', left: invulnLeftSec },
    ];

    setEntries((prev) => {
      const byType = new Map<string, ActiveBuffEntry>();
      prev.forEach((item) => byType.set(item.type, item));

      for (const { type, left } of syncList) {
        const prevLeft = prevSecRef.current[type] ?? 0;
        const durationSec = POWERUP_CONFIGS[type].durationSec;
        const existing = byType.get(type);

        if (left > 0) {
          if (exitTimersRef.current[type]) {
            window.clearTimeout(exitTimersRef.current[type]);
            delete exitTimersRef.current[type];
          }
          const refreshed = prevLeft <= 0 || left > prevLeft + 0.5;
          byType.set(type, {
            type,
            leftSec: left,
            durationSec,
            pulseKey: refreshed ? (existing?.pulseKey ?? 0) + 1 : existing?.pulseKey ?? 1,
            exiting: false,
          });
        } else if (existing && !existing.exiting) {
          byType.set(type, { ...existing, leftSec: 0, exiting: true });
          exitTimersRef.current[type] = window.setTimeout(() => {
            setEntries((curr) => curr.filter((e) => e.type !== type || !e.exiting));
            delete exitTimersRef.current[type];
          }, 220);
        }
        prevSecRef.current[type] = left;
      }

      return Array.from(byType.values());
    });
  }, [rapidFireLeftSec, doubleDamageLeftSec, invulnLeftSec]);

  useEffect(() => {
    return () => {
      Object.values(exitTimersRef.current).forEach((t) => window.clearTimeout(t));
    };
  }, []);

  if (entries.length === 0) return null;

  const sizePx = 42;
  const strokeWidth = 2.5;
  const radius = (sizePx - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div
      aria-label="Active power-ups"
      className="pointer-events-none mt-1.5 flex flex-wrap items-center gap-2"
    >
      {entries.map((entry) => {
        const def = POWERUP_CONFIGS[entry.type];
        const ratio = Math.max(0, Math.min(1, entry.leftSec / Math.max(1, entry.durationSec)));
        const dashOffset = circumference * (1 - ratio);

        return (
          <div
            key={`${entry.type}-${entry.pulseKey}`}
            className={`powerup-enter flex flex-col items-center transition-all duration-200 ${
              entry.exiting ? 'scale-75 opacity-0' : 'scale-100 opacity-100'
            }`}
          >
            <div
              style={{
                width: sizePx,
                height: sizePx,
                boxShadow: `0 4px 12px rgba(2, 6, 18, 0.6), 0 0 12px ${def.colorHex}28`,
              }}
              className="relative flex items-center justify-center rounded-full bg-[#060d1f]/88"
            >
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
                  stroke={def.colorHex}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                />
              </svg>
              <PowerUpVectorIcon type={entry.type} className="relative z-10 h-4 w-4" />
            </div>
            <span
              style={{ color: def.colorHex }}
              className="mt-0.5 rounded bg-[#050b1a]/88 px-1.5 py-[1px] font-mono-num text-[9.5px] font-bold leading-tight"
            >
              {formatBuffCountdown(entry.leftSec)}
            </span>
          </div>
        );
      })}
    </div>
  );
});
ActivePowerUpsBar.displayName = 'ActivePowerUpsBar';

interface PickupToast {
  uid: number;
  payload: PowerUpPickupPayload;
  exiting: boolean;
}

export const PowerUpToastFeed: React.FC = () => {
  const [toasts, setToasts] = useState<PickupToast[]>([]);
  const nextUidRef = useRef(1);
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    const unsub = EventBus.on('powerup:collected', (payload) => {
      const uid = nextUidRef.current++;
      setToasts((prev) => [...prev.slice(-2), { uid, payload, exiting: false }]);

      const fadeTimer = window.setTimeout(() => {
        setToasts((prev) => prev.map((t) => (t.uid === uid ? { ...t, exiting: true } : t)));
      }, 1500);
      const removeTimer = window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.uid !== uid));
      }, 1820);
      timersRef.current.push(fadeTimer, removeTimer);
    });

    return () => {
      unsub();
      timersRef.current.forEach((t) => window.clearTimeout(t));
      timersRef.current = [];
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none mt-1.5 flex flex-col items-start gap-1.5">
      {toasts.map(({ uid, payload, exiting }) => {
        const def = POWERUP_CONFIGS[payload.type];
        let title = def.shortLabel;
        let detail = '';

        if (payload.type === 'health') {
          title = 'HEALTH';
          detail = payload.amountRestored > 0 ? `+${payload.amountRestored} HP` : 'FULL HP';
        } else if (payload.type === 'shield') {
          title = 'SHIELD';
          detail =
            payload.amountRestored > 0
              ? `+${payload.amountRestored} SHD`
              : payload.isFull
              ? 'MAX SHIELD'
              : 'CHARGED';
        } else if (payload.type === 'mega_bomb') {
          title = 'MEGA BOMB';
          detail = 'SECTOR BLAST';
        } else if (payload.durationSec > 0) {
          detail = `${payload.durationSec}s`;
        }

        return (
          <div
            key={uid}
            style={{
              borderColor: `${def.colorHex}55`,
              boxShadow: `0 4px 14px rgba(2, 6, 18, 0.55), 0 0 10px ${def.colorHex}20`,
            }}
            className={`powerup-enter flex items-center gap-2 rounded-full border bg-[#060e21]/88 py-1 pl-1 pr-3 backdrop-blur-sm transition-all duration-300 ${
              exiting ? '-translate-y-1 opacity-0' : 'translate-y-0 opacity-100'
            }`}
          >
            <div
              style={{
                borderColor: `${def.colorHex}70`,
                backgroundColor: `${def.colorHex}20`,
              }}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border"
            >
              <PowerUpVectorIcon type={payload.type} className="h-3.5 w-3.5" />
            </div>
            <div className="flex items-center gap-1.5 leading-none">
              <span className="font-display text-[10px] font-bold tracking-wider text-white">
                {title}
              </span>
              {detail && (
                <span
                  style={{ color: def.colorHex }}
                  className="font-mono-num text-[10px] font-bold"
                >
                  {detail}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
