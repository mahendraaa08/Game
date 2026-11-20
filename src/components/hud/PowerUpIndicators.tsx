import React, { memo, useEffect, useRef, useState } from 'react';
import { POWERUP_CONFIGS, PowerUpType } from '../../game/config/PowerUpConfig';
import { EventBus, PowerUpPickupPayload } from '../../game/utils/EventBus';
import { PowerUpVectorIcon } from './HudIcons';

type TimedPowerUpType = 'rapid_fire' | 'double_damage' | 'invulnerability';

interface ActiveBuffEntry {
  type: TimedPowerUpType;
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
    const syncList: Array<{ type: TimedPowerUpType; left: number }> = [
      { type: 'rapid_fire', left: rapidFireLeftSec },
      { type: 'double_damage', left: doubleDamageLeftSec },
      { type: 'invulnerability', left: invulnLeftSec },
    ];

    setEntries((prev) => {
      const byType = new Map<TimedPowerUpType, ActiveBuffEntry>();
      prev.forEach((item) => byType.set(item.type, item));

      for (const { type, left } of syncList) {
        const prevLeft = prevSecRef.current[type] ?? 0;
        const durationSec = POWERUP_CONFIGS[type].durationSec;
        const existing = byType.get(type);

        if (durationSec > 0 && left > 0) {
          if (exitTimersRef.current[type]) {
            window.clearTimeout(exitTimersRef.current[type]);
            delete exitTimersRef.current[type];
          }
          const isFreshActivation = !existing || existing.exiting || prevLeft <= 0;
          byType.set(type, {
            type,
            leftSec: left,
            durationSec,
            pulseKey: isFreshActivation
              ? (existing?.pulseKey ?? 0) + 1
              : existing?.pulseKey ?? 1,
            exiting: false,
          });
        } else if (existing && !existing.exiting) {
          byType.set(type, { ...existing, leftSec: 0, exiting: true });
          exitTimersRef.current[type] = window.setTimeout(() => {
            setEntries((curr) => curr.filter((e) => e.type !== type || !e.exiting));
            delete exitTimersRef.current[type];
          }, 260);
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

  const hasActive =
    rapidFireLeftSec > 0 || doubleDamageLeftSec > 0 || invulnLeftSec > 0;
  // Keep row expanded only while at least one timed buff is active; collapses smoothly in sync with exiting icons
  const expanded = hasActive && entries.some((e) => !e.exiting);

  const sizePx = 24;
  const strokeWidth = 1.75;
  const radius = (sizePx - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div
      aria-label="Active power-ups"
      aria-hidden={!expanded && entries.length === 0}
      className={`grid transition-[grid-template-rows,margin-top,opacity] duration-[260ms] ease-out ${
        expanded
          ? 'mt-1.5 grid-rows-[1fr] opacity-100'
          : 'mt-0 grid-rows-[0fr] opacity-0 pointer-events-none'
      }`}
    >
      <div className="overflow-hidden">
        <div className="flex flex-wrap items-center pt-0.5">
          {entries.map((entry) => {
            const def = POWERUP_CONFIGS[entry.type];
            const ratio = Math.max(
              0,
              Math.min(1, entry.leftSec / Math.max(1, entry.durationSec))
            );
            const dashOffset = circumference * (1 - ratio);

            return (
              <div
                key={`${entry.type}-${entry.pulseKey}`}
                title={def.name}
                className={`overflow-hidden transition-[width,margin,opacity,transform] duration-[260ms] ease-out ${
                  entry.exiting
                    ? 'mr-0 w-0 translate-y-1 scale-75 opacity-0'
                    : 'mr-1.5 last:mr-0 w-6 translate-y-0 scale-100 opacity-100'
                }`}
              >
                <div
                  style={{
                    width: sizePx,
                    height: sizePx,
                    backgroundColor: `${def.colorHex}14`,
                  }}
                  className="powerup-enter relative flex shrink-0 items-center justify-center rounded-full bg-[#071022]/90"
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
                      stroke="rgba(148, 163, 184, 0.16)"
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
                  <PowerUpVectorIcon type={entry.type} className="relative z-10 h-3 w-3" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});
ActivePowerUpsBar.displayName = 'ActivePowerUpsBar';

interface PickupToast {
  uid: number;
  type: PowerUpType;
  payload: PowerUpPickupPayload;
  refreshKey: number;
  exiting: boolean;
}

const POWERUP_TOAST_META: Record<
  PowerUpType,
  { title: string; fallbackTag: string }
> = {
  health: { title: 'Hull Repair', fallbackTag: 'Full' },
  shield: { title: 'Shield', fallbackTag: 'Full' },
  rapid_fire: { title: 'Rapid Fire', fallbackTag: 'Active' },
  double_damage: { title: 'Overcharge', fallbackTag: '2x DMG' },
  invulnerability: { title: 'Aegis Phase', fallbackTag: 'Shielded' },
  mega_bomb: { title: 'Mega Bomb', fallbackTag: 'Clear' },
};

const MAX_VISIBLE_TOASTS = 3;
const TOAST_VISIBLE_MS = 1480;
const TOAST_EXIT_MS = 260;

export const PowerUpToastFeed: React.FC = () => {
  const [toasts, setToasts] = useState<PickupToast[]>([]);
  const toastsRef = useRef<PickupToast[]>([]);
  const queueRef = useRef<PowerUpPickupPayload[]>([]);
  const nextUidRef = useRef(1);
  const toastTimersRef = useRef<Map<number, { fade: number; remove: number }>>(new Map());
  const lastEmitRef = useRef<{ type: PowerUpType; at: number } | null>(null);

  useEffect(() => {
    const clearToastTimers = (uid: number) => {
      const pair = toastTimersRef.current.get(uid);
      if (pair) {
        window.clearTimeout(pair.fade);
        window.clearTimeout(pair.remove);
        toastTimersRef.current.delete(uid);
      }
    };

    const clearAllToasts = () => {
      toastTimersRef.current.forEach(({ fade, remove }) => {
        window.clearTimeout(fade);
        window.clearTimeout(remove);
      });
      toastTimersRef.current.clear();
      queueRef.current = [];
      toastsRef.current = [];
      setToasts([]);
    };

    const pushOrRefreshToast = (payload: PowerUpPickupPayload) => {
      const curr = toastsRef.current;
      const existing = curr.find((t) => t.type === payload.type && !t.exiting);

      if (existing) {
        const next = curr.map((t) =>
          t.uid === existing.uid ? { ...t, payload, refreshKey: t.refreshKey + 1 } : t
        );
        toastsRef.current = next;
        setToasts(next);
        scheduleRemoval(existing.uid);
        return;
      }

      if (curr.length >= MAX_VISIBLE_TOASTS) {
        // Queue new distinct power-up cleanly so concurrent pickups remain readable without messy overlap
        const queuedIdx = queueRef.current.findIndex((q) => q.type === payload.type);
        if (queuedIdx >= 0) {
          queueRef.current[queuedIdx] = payload;
        } else {
          queueRef.current.push(payload);
        }
        return;
      }

      const uid = nextUidRef.current++;
      const next = [
        ...curr,
        { uid, type: payload.type, payload, refreshKey: 1, exiting: false },
      ];
      toastsRef.current = next;
      setToasts(next);
      scheduleRemoval(uid);
    };

    const scheduleRemoval = (uid: number) => {
      clearToastTimers(uid);
      const fade = window.setTimeout(() => {
        const next = toastsRef.current.map((t) => (t.uid === uid ? { ...t, exiting: true } : t));
        toastsRef.current = next;
        setToasts(next);
      }, TOAST_VISIBLE_MS);

      const remove = window.setTimeout(() => {
        const next = toastsRef.current.filter((t) => t.uid !== uid);
        toastsRef.current = next;
        setToasts(next);
        toastTimersRef.current.delete(uid);

        if (queueRef.current.length > 0 && toastsRef.current.length < MAX_VISIBLE_TOASTS) {
          const queued = queueRef.current.shift();
          if (queued) {
            pushOrRefreshToast(queued);
          }
        }
      }, TOAST_VISIBLE_MS + TOAST_EXIT_MS);

      toastTimersRef.current.set(uid, { fade, remove });
    };

    const unsubPickup = EventBus.on('powerup:collected', (payload) => {
      const now = performance.now();
      if (
        lastEmitRef.current &&
        lastEmitRef.current.type === payload.type &&
        now - lastEmitRef.current.at < 120
      ) {
        return;
      }
      lastEmitRef.current = { type: payload.type, at: now };
      pushOrRefreshToast(payload);
    });

    const unsubScene = EventBus.on('scene:changed', (scene) => {
      if (scene !== 'GameScene' && scene !== 'BossScene' && scene !== 'PauseMenuScene') {
        clearAllToasts();
      }
    });

    return () => {
      unsubPickup();
      unsubScene();
      clearAllToasts();
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none mt-1.5 flex flex-col items-start gap-1">
      {toasts.map(({ uid, payload, refreshKey, exiting }) => {
        const def = POWERUP_CONFIGS[payload.type];
        const meta = POWERUP_TOAST_META[payload.type];

        let badgeText = meta.fallbackTag;
        if (payload.type === 'health') {
          badgeText = payload.amountRestored > 0 ? `+${payload.amountRestored}` : 'FULL';
        } else if (payload.type === 'shield') {
          badgeText = payload.amountRestored > 0 ? `+${payload.amountRestored}` : 'FULL';
        } else if (payload.durationSec > 0) {
          badgeText = `${payload.durationSec}s`;
        }

        return (
          <div
            key={uid}
            style={{
              borderColor: `${def.colorHex}45`,
            }}
            className={`${
              exiting ? 'powerup-toast-exit' : 'powerup-toast-enter'
            } relative flex items-center gap-2 overflow-hidden rounded-lg border bg-[#060d1e]/92 py-1 pl-1.5 pr-2.5 backdrop-blur-md shadow-md shadow-black/40`}
          >
            {/* Subtle top accent line */}
            <div
              style={{
                background: `linear-gradient(90deg, transparent, ${def.colorHex}85, transparent)`,
              }}
              className="pointer-events-none absolute inset-x-1.5 top-0 h-px"
            />
            {/* Brief light highlight on arrival / refresh */}
            <div
              key={`shine-${refreshKey}`}
              style={{
                background: `linear-gradient(90deg, transparent, ${def.colorHex}24, transparent)`,
              }}
              className="powerup-toast-shine pointer-events-none absolute inset-y-0 w-10"
            />

            <div
              key={`icon-${refreshKey}`}
              style={{
                backgroundColor: `${def.colorHex}1e`,
              }}
              className="powerup-toast-icon relative flex h-5.5 w-5.5 shrink-0 items-center justify-center rounded-md"
            >
              <PowerUpVectorIcon type={payload.type} className="h-3.5 w-3.5" />
            </div>

            <div className="relative flex items-center gap-1.5 leading-none">
              <span className="truncate font-display text-[10.5px] font-bold uppercase tracking-[0.06em] text-slate-100">
                {meta.title}
              </span>
              <span
                style={{ color: def.colorHex }}
                className="shrink-0 font-mono-num text-[9.5px] font-bold"
              >
                {badgeText}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
