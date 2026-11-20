import { ABILITIES_CODEX } from './abilities';
import { AIRCRAFT_CODEX } from './aircraft';
import { BOSSES_CODEX } from './bosses';
import { DRONES_CODEX } from './drones';
import { ENEMIES_CODEX } from './enemies';
import { GEARS_CODEX } from './gears';
import { POWERUPS_CODEX } from './powerUps';
import type { CodexCategoryId, CodexCategoryMeta, CodexEntry, CodexEntryCategory } from './types';
import { WEAPONS_CODEX } from './weapons';

export type {
  CodexCategoryId,
  CodexCategoryMeta,
  CodexEntry,
  CodexEntryCategory,
  CodexSpecialEffect,
  CodexStatItem,
  CodexStatTone,
} from './types';

export const CODEX_CATEGORIES: CodexCategoryMeta[] = [
  {
    id: 'all',
    label: 'All Entries',
    shortLabel: 'All',
    description: 'Complete tactical archive of Earth Defense Command and Void Empire forces.',
  },
  {
    id: 'aircraft',
    label: 'Player Aircraft',
    shortLabel: 'Aircraft',
    description: 'Playable starfighters, base flight telemetry, and passive reactor traits.',
  },
  {
    id: 'abilities',
    label: 'Special Abilities',
    shortLabel: 'Abilities',
    description: 'Equippable Special Attack systems and standard emergency flight mobility.',
  },
  {
    id: 'weapons',
    label: 'Weapons',
    shortLabel: 'Weapons',
    description: 'Six primary weapon modules with Lv1–Lv5 scaling and delivery mechanics.',
  },
  {
    id: 'gears',
    label: 'Equipment & Gears',
    shortLabel: 'Gears',
    description: 'Offensive, Defensive, Utility, and Special slot equipment from Common to Mythic.',
  },
  {
    id: 'drones',
    label: 'Companion Drones',
    shortLabel: 'Drones',
    description: 'Autonomous combat and support wingmen mounted in Port and Starboard slots.',
  },
  {
    id: 'powerUps',
    label: 'Power-Ups',
    shortLabel: 'Power-Ups',
    description: 'In-flight tactical drops, instant repairs, timed buffs, and drop probabilities.',
  },
  {
    id: 'enemies',
    label: 'Enemy Aircraft',
    shortLabel: 'Enemies',
    description: 'Standard Void Empire hostile squadrons, flight behaviors, and attack patterns.',
  },
  {
    id: 'bosses',
    label: 'Bosses',
    shortLabel: 'Bosses',
    description: 'Sector flagships, three-phase escalation rules, and signature attack patterns.',
  },
];

export const CODEX_ENTRIES_BY_CATEGORY: Record<CodexEntryCategory, CodexEntry[]> = {
  aircraft: AIRCRAFT_CODEX,
  abilities: ABILITIES_CODEX,
  weapons: WEAPONS_CODEX,
  gears: GEARS_CODEX,
  drones: DRONES_CODEX,
  powerUps: POWERUPS_CODEX,
  enemies: ENEMIES_CODEX,
  bosses: BOSSES_CODEX,
};

export const ALL_CODEX_ENTRIES: CodexEntry[] = [
  ...AIRCRAFT_CODEX,
  ...ABILITIES_CODEX,
  ...WEAPONS_CODEX,
  ...GEARS_CODEX,
  ...DRONES_CODEX,
  ...POWERUPS_CODEX,
  ...ENEMIES_CODEX,
  ...BOSSES_CODEX,
];

export function getCodexEntries(category: CodexCategoryId, query = ''): CodexEntry[] {
  const pool = category === 'all' ? ALL_CODEX_ENTRIES : CODEX_ENTRIES_BY_CATEGORY[category];
  const normalized = query.trim().toLowerCase();
  if (!normalized) return pool;
  return pool.filter((entry) => {
    if (entry.name.toLowerCase().includes(normalized)) return true;
    if (entry.subtitle.toLowerCase().includes(normalized)) return true;
    if (entry.description.toLowerCase().includes(normalized)) return true;
    return entry.searchKeywords.some((kw) => kw.toLowerCase().includes(normalized));
  });
}

export function getCodexCategoryCount(category: CodexCategoryId): number {
  if (category === 'all') return ALL_CODEX_ENTRIES.length;
  return CODEX_ENTRIES_BY_CATEGORY[category].length;
}
