import { getShipBaseMoveSpeedPx, SHIP_LIST } from '../../game/config/ShipConfig';
import type { CodexEntry } from './types';

export const AIRCRAFT_CODEX: CodexEntry[] = SHIP_LIST.map((ship) => {
  const movePx = getShipBaseMoveSpeedPx(ship);

  return {
    id: `aircraft_${ship.id}`,
    sourceId: ship.id,
    category: 'aircraft',
    name: ship.name,
    subtitle: `${ship.role} · 3 Tactical Passives`,
    accentHex: ship.primaryColorHex,
    description: ship.description,
    stats: [
      {
        label: 'Max Hull',
        value: `${ship.stats.maxHp} HP`,
        numericValue: ship.stats.maxHp,
        maxReference: 160,
        tone: 'emerald',
      },
      {
        label: 'Max Shield',
        value: `${ship.stats.maxShield} SHD`,
        numericValue: ship.stats.maxShield,
        maxReference: 120,
        tone: 'sky',
      },
      {
        label: 'Movement Speed',
        value: `${ship.stats.moveSpeed.toFixed(2)}x (${movePx} px/s)`,
        numericValue: movePx,
        maxReference: 480,
        tone: 'cyan',
      },
      {
        label: 'Damage Output',
        value: `${Math.round(ship.stats.damageMult * 100)}%`,
        numericValue: Math.round(ship.stats.damageMult * 100),
        maxReference: 130,
        tone: 'rose',
      },
      {
        label: 'Fire Rate',
        value: `${Math.round(ship.stats.fireRateMult * 100)}%`,
        numericValue: Math.round(ship.stats.fireRateMult * 100),
        maxReference: 130,
        tone: 'amber',
      },
      {
        label: 'Crit Chance',
        value: `${Math.round(ship.stats.critChance * 100)}%`,
        numericValue: Math.round(ship.stats.critChance * 100),
        maxReference: 25,
        tone: 'amber',
      },
      {
        label: 'Crit Damage',
        value: `${ship.stats.critDamage.toFixed(2)}x`,
        numericValue: Math.round(ship.stats.critDamage * 100),
        maxReference: 220,
        tone: 'purple',
      },
    ],
    specialEffects: ship.passives.map((p, idx) => ({
      title: `Passive ${idx + 1} — ${p.name}${p.cooldownSec ? ` (${p.cooldownSec}s CD)` : ''}`,
      description: p.description,
    })),
    acquisition: ship.unlock.description,
    searchKeywords: [
      ship.name,
      ship.role,
      ...ship.passives.map((p) => p.name),
      ...ship.passives.map((p) => p.description),
      ship.unlock.description,
    ],
  };
});
