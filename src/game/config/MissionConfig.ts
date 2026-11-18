import { ShipId } from './ShipConfig';
import { WeaponId } from './WeaponConfig';

export type MissionMetric =
  | 'kills'
  | 'elite_kills'
  | 'boss_kills'
  | 'levels_completed'
  | 'powerups_collected'
  | 'survival_waves'
  | 'survival_seconds'
  | 'weapon_kills'
  | 'ship_clears'
  | 'high_score_run'
  | 'no_death_level';

export interface MissionTemplate {
  id: string;
  kind: 'daily' | 'weekly';
  title: string;
  description: string;
  metric: MissionMetric;
  target: number;
  weaponFilter?: WeaponId;
  shipFilter?: ShipId;
  rewardCredits: number;
  rewardCrystals: number;
}

export const DAILY_MISSION_POOL: MissionTemplate[] = [
  {
    id: 'daily_kills_40',
    kind: 'daily',
    title: 'Vanguard Sweep',
    description: 'Destroy 40 hostile ships in any mode.',
    metric: 'kills',
    target: 40,
    rewardCredits: 320,
    rewardCrystals: 1,
  },
  {
    id: 'daily_elite_6',
    kind: 'daily',
    title: 'Elite Hunter',
    description: 'Eliminate 6 Elite Fighters or Heavy Tanks.',
    metric: 'elite_kills',
    target: 6,
    rewardCredits: 380,
    rewardCrystals: 2,
  },
  {
    id: 'daily_powerups_6',
    kind: 'daily',
    title: 'Supply Interception',
    description: 'Collect 6 combat power-ups during missions.',
    metric: 'powerups_collected',
    target: 6,
    rewardCredits: 260,
    rewardCrystals: 1,
  },
  {
    id: 'daily_sector_1',
    kind: 'daily',
    title: 'Sector Defense',
    description: 'Complete 1 Campaign sector.',
    metric: 'levels_completed',
    target: 1,
    rewardCredits: 400,
    rewardCrystals: 2,
  },
  {
    id: 'daily_boss_1',
    kind: 'daily',
    title: 'Commander Down',
    description: 'Defeat 1 Void Commander Boss.',
    metric: 'boss_kills',
    target: 1,
    rewardCredits: 520,
    rewardCrystals: 3,
  },
  {
    id: 'daily_survive_120',
    kind: 'daily',
    title: 'Orbital Endurance',
    description: 'Survive 120 seconds of active combat.',
    metric: 'survival_seconds',
    target: 120,
    rewardCredits: 300,
    rewardCrystals: 1,
  },
  {
    id: 'daily_plasma_25',
    kind: 'daily',
    title: 'Plasma Calibration',
    description: 'Destroy 25 hostiles while wielding Plasma Cannon.',
    metric: 'weapon_kills',
    weaponFilter: 'plasma',
    target: 25,
    rewardCredits: 340,
    rewardCrystals: 2,
  },
  {
    id: 'daily_falcon_clear',
    kind: 'daily',
    title: 'Falcon Patrol',
    description: 'Clear a sector flying FALCON X.',
    metric: 'ship_clears',
    shipFilter: 'falcon_x',
    target: 1,
    rewardCredits: 380,
    rewardCrystals: 2,
  },
];

export const WEEKLY_CHALLENGE_POOL: MissionTemplate[] = [
  {
    id: 'weekly_levels_5',
    kind: 'weekly',
    title: 'Campaign Offensive',
    description: 'Complete 5 Campaign sectors this week.',
    metric: 'levels_completed',
    target: 5,
    rewardCredits: 1800,
    rewardCrystals: 10,
  },
  {
    id: 'weekly_bosses_4',
    kind: 'weekly',
    title: 'Dreadnought Breaker',
    description: 'Defeat 4 Bosses across Campaign or Boss Rush.',
    metric: 'boss_kills',
    target: 4,
    rewardCredits: 2400,
    rewardCrystals: 14,
  },
  {
    id: 'weekly_endless_8',
    kind: 'weekly',
    title: 'Infinite Bastion',
    description: 'Clear 8 cumulative waves in Endless Survival.',
    metric: 'survival_waves',
    target: 8,
    rewardCredits: 2100,
    rewardCrystals: 12,
  },
  {
    id: 'weekly_score_18000',
    kind: 'weekly',
    title: 'Ace Score Directive',
    description: 'Achieve at least 18,000 points in a single run.',
    metric: 'high_score_run',
    target: 18000,
    rewardCredits: 2200,
    rewardCrystals: 12,
  },
  {
    id: 'weekly_kills_250',
    kind: 'weekly',
    title: 'Fleet Annihilation',
    description: 'Destroy 250 Void Empire ships.',
    metric: 'kills',
    target: 250,
    rewardCredits: 1950,
    rewardCrystals: 10,
  },
];

export function getDailyResetKey(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getWeeklyResetKey(now = new Date()): string {
  const date = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

/** Deterministic daily selection of 4 missions based on the date key */
export function selectDailyMissions(dateKey: string): MissionTemplate[] {
  let hash = 0;
  for (let i = 0; i < dateKey.length; i++) {
    hash = (hash * 31 + dateKey.charCodeAt(i)) >>> 0;
  }
  const pool = [...DAILY_MISSION_POOL];
  const picked: MissionTemplate[] = [];
  for (let i = 0; i < 4 && pool.length > 0; i++) {
    const idx = (hash + i * 3) % pool.length;
    picked.push(pool.splice(idx, 1)[0]);
  }
  return picked;
}

export function selectWeeklyChallenges(weekKey: string): MissionTemplate[] {
  let hash = 0;
  for (let i = 0; i < weekKey.length; i++) {
    hash = (hash * 37 + weekKey.charCodeAt(i)) >>> 0;
  }
  const pool = [...WEEKLY_CHALLENGE_POOL];
  const picked: MissionTemplate[] = [];
  for (let i = 0; i < 3 && pool.length > 0; i++) {
    const idx = (hash + i * 2) % pool.length;
    picked.push(pool.splice(idx, 1)[0]);
  }
  return picked;
}
