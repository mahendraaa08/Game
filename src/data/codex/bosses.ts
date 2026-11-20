import { BOSS_CONFIGS, type BossId } from '../../game/config/BossConfig';
import { BOSS_DEFEAT_REWARDS } from '../../game/config/EconomyConfig';
import type { CodexEntry, CodexSpecialEffect } from './types';

const BOSS_ORDER: BossId[] = [
  'iron_guardian',
  'venom_queen',
  'shadow_titan',
  'cyber_leviathan',
  'void_emperor',
];

const BOSS_MECHANICS: Record<BossId, CodexSpecialEffect[]> = {
  iron_guardian: [
    {
      title: 'Pattern 1 — Siege Bomb Fan',
      description: 'Launches a 5-orb spread of heavy siege bombs (18 DMG each) across central lanes.',
    },
    {
      title: 'Pattern 2 — Twin Pod Aimed Burst',
      description: 'Fires twin 3-round aimed bursts simultaneously from left and right wing cannons (16 DMG each).',
    },
    {
      title: 'Pattern 3 — Telegraphed Hyper-Lance',
      description: 'Locks a 0.76s warning laser on player position before firing a 28 DMG piercing beam.',
    },
  ],
  venom_queen: [
    {
      title: 'Pattern 1 — Corrosive Bio-Ring',
      description: 'Emits a rotating 12–16 orb spiral ring (scales with phase) dealing 18 DMG per orb.',
    },
    {
      title: 'Pattern 2 — Scout Brood Summon',
      description: 'Deploys twin Scout Drone escorts directly from its flanking brood bays.',
    },
    {
      title: 'Pattern 3 — 7-Bolt Venom Fan',
      description: 'Fires a dense 7-bolt aimed plasma cone directly toward the defender.',
    },
  ],
  shadow_titan: [
    {
      title: 'Pattern 1 — Cryo Hyper-Lance',
      description: 'Locks a 0.76s cryo warning telegraph before discharging a 28 DMG piercing vertical lance.',
    },
    {
      title: 'Pattern 2 — Rotating Spiral Nova',
      description: 'Discharges a 12-bolt rotating nova (300 px/s) sweeping outward from its core.',
    },
    {
      title: 'Pattern 3 — Tri-Node Sniper Bolts',
      description: 'Fires 3 high-velocity (410 px/s) aimed rounds from center and wing emitters (20 DMG each).',
    },
  ],
  cyber_leviathan: [
    {
      title: 'Pattern 1 — Emerald Spiral Matrix',
      description: 'Unleashes a 14-orb rotating spiral storm across the arena (19 DMG each).',
    },
    {
      title: 'Pattern 2 — Orbital Hyper-Lance',
      description: 'Tracks player X-axis for 0.76s then sweeps a 28 DMG piercing laser beam.',
    },
    {
      title: 'Pattern 3 — Interceptor Deployment & Volley',
      description: 'Summons an Armored Fighter escort while firing a 5-bolt aimed plasma fan.',
    },
  ],
  void_emperor: [
    {
      title: 'Pattern 1 — Imperial Spiral Storm',
      description: 'Fires 20–28 rotating void orbs (scales with phase) blanketing defensive lanes.',
    },
    {
      title: 'Pattern 2 — Apocalypse Hyper-Lance',
      description: 'Telegraphs a 0.76s target lock before blasting a 28 DMG piercing void beam.',
    },
    {
      title: 'Pattern 3 — Twin-Wing Crimson Salvo',
      description: 'Both dreadnought wings fire 5-bolt aimed spreads simultaneously (10 total bolts at 380 px/s).',
    },
    {
      title: 'Phase 3 Special — Elite Escort & Void Curtain',
      description: 'Below 33% HP, summons an Elite Fighter and rains an 8-column vertical bomb curtain across the arena.',
    },
  ],
};

export const BOSSES_CODEX: CodexEntry[] = BOSS_ORDER.map((id) => {
  const boss = BOSS_CONFIGS[id];
  const bounty = BOSS_DEFEAT_REWARDS[id];
  const baseCdSec = (boss.id === 'void_emperor' ? 1.15 : 1.45).toFixed(2);
  const p3CdSec = Math.max(0.58, (boss.id === 'void_emperor' ? 1.15 : 1.45) - 0.48).toFixed(2);

  return {
    id: `boss_${boss.id}`,
    sourceId: boss.id,
    category: 'bosses',
    name: boss.name,
    subtitle: `${boss.title} · Sector ${String(boss.levelAssigned).padStart(2, '0')} Boss`,
    accentHex: boss.accentHex,
    description: boss.description,
    stats: [
      {
        label: 'Base Hull HP',
        value: `${boss.maxHp.toLocaleString()} HP`,
        numericValue: boss.maxHp,
        maxReference: 6000,
        tone: 'rose',
      },
      {
        label: 'Move Speed (P1 → P3)',
        value: `${boss.moveSpeed} → ${Math.round(boss.moveSpeed * 1.55)} px/s`,
        numericValue: boss.moveSpeed,
        maxReference: 200,
        tone: 'cyan',
      },
      {
        label: 'Attack Cadence (P1 → P3)',
        value: `${baseCdSec} → ${p3CdSec} s`,
        numericValue: Number(baseCdSec),
        maxReference: 1.6,
        tone: 'amber',
      },
      {
        label: 'Combat Phases',
        value: '3 Phases (66% / 33% HP)',
        tone: 'purple',
      },
      {
        label: 'Body Contact Damage',
        value: '25 DMG',
        tone: 'rose',
      },
      {
        label: 'Base Bounty',
        value: `${bounty.credits.toLocaleString()} CR · ${bounty.crystals} Gems`,
        tone: 'amber',
      },
    ],
    specialEffects: [
      {
        title: 'Phase Transition Shockwave',
        description:
          'At 66% and 33% HP, shifts phase with 1.1s brief invulnerability, guarantees a Power-Up drop, and accelerates movement and attack speed.',
      },
      ...(BOSS_MECHANICS[id] ?? []),
    ],
    acquisition: `Sector ${String(boss.levelAssigned).padStart(2, '0')} · Boss Rush Gauntlet · Endless Wave Milestones`,
    searchKeywords: [boss.name, boss.title, `Sector ${boss.levelAssigned}`, 'boss'],
  };
});
