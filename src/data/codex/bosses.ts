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
      title: 'Pattern 1 — Staggered Siege Fan & Homing Seekers',
      description: 'Launches 5-orb siege fans, escalating in Phase 2–3 to a 2-beat staggered barrage paired with shoulder Homing Siege Seekers.',
    },
    {
      title: 'Pattern 2 — Twin Pod Multi-Beat Salvo',
      description: 'Fires twin 3-round aimed wing bursts with a rapid follow-up volley in Phase 2–3 while executing surge dips.',
    },
    {
      title: 'Pattern 3 & Phase 3 — Twin Hyper-Lances & Splitting Mortars',
      description: 'Projects amber Hyper-Lances (twin framing lances in Phase 3) alongside Splitting Mortar Orbs that burst into 4-way shrapnel.',
    },
  ],
  venom_queen: [
    {
      title: 'Pattern 1 — Counter-Rotating Bio-Rings',
      description: 'Emits 12–16 orb corrosive rings while weaving in a Lissajous figure-8, adding a counter-curving inner ring in Phase 2–3.',
    },
    {
      title: 'Pattern 2 — Brood Escort & Bio-Seekers',
      description: 'Deploys Scout/Interceptor/Fighter broods from flanking bays alongside Homing Bio-Seekers in Phase 2–3.',
    },
    {
      title: 'Pattern 3 & Phase 3 — Wave Venom Fan & Splitting Spore Pods',
      description: 'Fires undulating 7-bolt wave fans, Twin Splitting Spore Pods (5-shard blooms in Phase 3), and twin crossfire arcs.',
    },
  ],
  shadow_titan: [
    {
      title: 'Pattern 1 — Cryo Hyper-Lances',
      description: 'Smoothly tracks player position before locking a piercing cryo beam (dual V-angle lances in Phase 3).',
    },
    {
      title: 'Pattern 2 — Curving Cryo Spiral & Homing Seekers',
      description: 'Discharges a 12–14 shard curving spiral nova accompanied by twin Homing Cryo Seekers in Phase 2–3.',
    },
    {
      title: 'Pattern 3 & Phase 3 — Phase-Shift Ambush, Wave Curtain & Cryo Cores',
      description: 'Executes translucent phase-shift glides while firing 425 px/s tri-node sniper shards, wave curtains, and 6-shard Splitting Cryo Cores.',
    },
  ],
  cyber_leviathan: [
    {
      title: 'Pattern 1 — Weaving Accelerating Emerald Matrix',
      description: 'Unleashes a 14–18 orb spiral storm whose projectiles accelerate and weave sinusoidally down-range in Phase 2–3.',
    },
    {
      title: 'Pattern 2 — Multi-Lane Security Beams & Splitting Data Orbs',
      description: 'Escalates from a tracking Hyper-Lance to twin beams (Phase 2) and a 3-lane vertical security grid + Splitting Data Orbs (Phase 3).',
    },
    {
      title: 'Pattern 3 & Phase 3 — Sniper/Interceptor Escorts & Lock-On Swarm',
      description: 'Deploys Rail Sniper & Interceptor escorts with 5-bolt fans, 2-beat matrix waves, and 3-seeker lock-on barrages.',
    },
  ],
  void_emperor: [
    {
      title: 'Pattern 1 — Imperial Spiral Storm & Splitting Void Rifts',
      description: 'Fires 18–26 void orbs, adding a counter-curving inner ring in Phase 2 and 3 Splitting Void Rifts (6 shards each) in Phase 3.',
    },
    {
      title: 'Pattern 2 — Tri-Beam Void Crown',
      description: 'Escalates from a single Apocalypse Lance to dual framing beams (Phase 2) and a 3-beam Void Crown telegraph (Phase 3).',
    },
    {
      title: 'Pattern 3 — Twin-Wing Crimson Salvo & Homing Void Seekers',
      description: 'Both dreadnought wings unleash alternating 5-shard aimed spreads paired with twin Homing Void Seekers in Phase 2–3.',
    },
    {
      title: 'Phase 2–3 Special — Harbinger Escort & Splitting Void Curtain',
      description: 'Executes phase-shift glides in Phase 3 while summoning Cluster/Harbinger escorts and dropping staggered splitting/weaving Void Curtains.',
    },
  ],
};

export const BOSSES_CODEX: CodexEntry[] = BOSS_ORDER.map((id) => {
  const boss = BOSS_CONFIGS[id];
  const bounty = BOSS_DEFEAT_REWARDS[id];
  const baseCd = boss.id === 'void_emperor' ? 1.12 : boss.id === 'shadow_titan' ? 1.28 : 1.42;
  const baseCdSec = baseCd.toFixed(2);
  const p3CdSec = Math.max(0.58, baseCd - 0.46).toFixed(2);

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
        maxReference: 9600,
        tone: 'rose',
      },
      {
        label: 'Move Speed (P1 → P3)',
        value: `${boss.moveSpeed} → ${Math.round(boss.moveSpeed * 1.54)} px/s`,
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
