export type CodexEntryCategory =
  | 'aircraft'
  | 'abilities'
  | 'weapons'
  | 'gears'
  | 'drones'
  | 'powerUps'
  | 'enemies'
  | 'bosses';

export type CodexCategoryId = 'all' | CodexEntryCategory;

export type CodexStatTone = 'sky' | 'cyan' | 'emerald' | 'amber' | 'rose' | 'purple' | 'slate';

export interface CodexStatItem {
  label: string;
  value: string;
  numericValue?: number;
  maxReference?: number;
  tone?: CodexStatTone;
}

export interface CodexSpecialEffect {
  title: string;
  description: string;
}

export interface CodexEntry {
  id: string;
  sourceId: string;
  category: CodexEntryCategory;
  name: string;
  subtitle: string;
  accentHex: string;
  description: string;
  stats: CodexStatItem[];
  specialEffects: CodexSpecialEffect[];
  acquisition?: string;
  searchKeywords: string[];
}

export interface CodexCategoryMeta {
  id: CodexCategoryId;
  label: string;
  shortLabel: string;
  description: string;
}
