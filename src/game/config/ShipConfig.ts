import { formatShipUnlockLabel, SHIP_ECONOMY } from './EconomyConfig';
import { GAME_CONSTANTS } from './GameConfig';

export type ShipId =
  | 'falcon_x'
  | 'destroyer'
  | 'thunderbolt'
  | 'phantom'
  | 'aegis'
  | 'specter'
  | 'nova_prime'
  | 'celestial';

export interface ShipStats {
  maxHp: number;
  maxShield: number;
  moveSpeed: number; // Speed multiplier relative to GAME_CONSTANTS.PLAYER_SPEED (380 px/s)
  damageMult: number;
  fireRateMult: number; // >1 means faster firing
  critChance: number; // 0..1
  critDamage: number; // Multiplier, e.g. 1.75 = 175% damage on crit
}

export interface ShipPassiveDefinition {
  id: string;
  slot: 1 | 2 | 3;
  name: string;
  triggerLabel: string;
  cooldownSec?: number;
  description: string;
}

export interface ShipUnlockRequirement {
  credits: number;
  crystals: number;
  minSectorCompleted?: number;
  description: string;
}

export interface ShipDefinition {
  id: ShipId;
  name: string;
  role: string;
  textureKey: string;
  primaryColorHex: string;
  primaryColorNum: number;
  accentColorNum: number;
  thrusterColorNum: number;
  description: string;
  stats: ShipStats;
  passives: [ShipPassiveDefinition, ShipPassiveDefinition, ShipPassiveDefinition];
  unlock: ShipUnlockRequirement;
}

export function getShipBaseMoveSpeedPx(ship: ShipDefinition): number {
  return Math.round(GAME_CONSTANTS.PLAYER_SPEED * ship.stats.moveSpeed);
}

export const SHIPS: Record<ShipId, ShipDefinition> = {
  falcon_x: {
    id: 'falcon_x',
    name: 'FALCON X',
    role: 'Adaptive Vanguard',
    textureKey: 'ship_falcon_x',
    primaryColorHex: '#38BDF8',
    primaryColorNum: 0x38bdf8,
    accentColorNum: 0xe2e8f0,
    thrusterColorNum: 0x67e8f9,
    description:
      'Earth Defense Command’s versatile frontline interceptor. Engineered for dependable agility, armor, and energy balance across all six weapon platforms.',
    stats: {
      maxHp: 100,
      maxShield: 60,
      moveSpeed: 1.0,
      damageMult: 1.0,
      fireRateMult: 1.0,
      critChance: 0.1,
      critDamage: 1.75,
    },
    passives: [
      {
        id: 'falcon_adaptive_combat',
        slot: 1,
        name: 'Adaptive Combat',
        triggerLabel: 'Every 10 Hits',
        description:
          'Every 10 valid weapon hits empower the next Player attack with +30% damage.',
      },
      {
        id: 'falcon_reactive_armor',
        slot: 2,
        name: 'Reactive Armor',
        triggerLabel: 'On Hit',
        cooldownSec: 9,
        description:
          'Taking an enemy hit grants 20% Damage Reduction for the next 2 enemy attacks (9s CD).',
      },
      {
        id: 'falcon_combat_recovery',
        slot: 3,
        name: 'Combat Recovery',
        triggerLabel: 'Every 5 Kills',
        description: 'Every 5 direct Player kills restore 8% of Max Shield.',
      },
    ],
    unlock: {
      ...SHIP_ECONOMY.falcon_x,
      description: formatShipUnlockLabel('falcon_x'),
    },
  },
  destroyer: {
    id: 'destroyer',
    name: 'DESTROYER',
    role: 'Apocalypse Engine',
    textureKey: 'ship_destroyer',
    primaryColorHex: '#F97316',
    primaryColorNum: 0xf97316,
    accentColorNum: 0xfef08a,
    thrusterColorNum: 0xfb923c,
    description:
      'Twin-chassis siege gunship prioritizing heavy hull integrity, devastating armor-shattering ordnance, and explosive area pressure.',
    stats: {
      maxHp: 140,
      maxShield: 75,
      moveSpeed: 0.86,
      damageMult: 1.15,
      fireRateMult: 0.9,
      critChance: 0.08,
      critDamage: 1.8,
    },
    passives: [
      {
        id: 'destroyer_siege_breaker',
        slot: 1,
        name: 'Siege Breaker',
        triggerLabel: 'Every 6 Hits',
        cooldownSec: 6,
        description:
          'Every 6 valid hits arm the next hit to detonate around the target for 100% Base Damage (6s CD).',
      },
      {
        id: 'destroyer_armor_crusher',
        slot: 2,
        name: 'Armor Crusher',
        triggerLabel: '4 Hits / 3s',
        description:
          'Hitting the same target 4 times within 3s empowers your next attack against it for +35% damage.',
      },
      {
        id: 'destroyer_apocalypse_impact',
        slot: 3,
        name: 'Apocalypse Impact',
        triggerLabel: 'On Kill',
        cooldownSec: 5,
        description:
          'Direct Player kills trigger a blast dealing 60% Base Damage to nearby enemies (5s CD).',
      },
    ],
    unlock: {
      ...SHIP_ECONOMY.destroyer,
      description: formatShipUnlockLabel('destroyer'),
    },
  },
  thunderbolt: {
    id: 'thunderbolt',
    name: 'THUNDERBOLT',
    role: 'Storm Accelerator',
    textureKey: 'ship_thunderbolt',
    primaryColorHex: '#FACC15',
    primaryColorNum: 0xfacc15,
    accentColorNum: 0xfef08a,
    thrusterColorNum: 0x38bdf8,
    description:
      'High-cadence assault wing built to overwhelm enemy formations with sustained fire rate, critical discharges, and storm arcs.',
    stats: {
      maxHp: 105,
      maxShield: 65,
      moveSpeed: 0.98,
      damageMult: 0.95,
      fireRateMult: 1.18,
      critChance: 0.1,
      critDamage: 1.75,
    },
    passives: [
      {
        id: 'thunderbolt_arc_conductor',
        slot: 1,
        name: 'Arc Conductor',
        triggerLabel: 'Every 8 Hits',
        description:
          'Every 8 valid weapon hits call down lightning striking up to 3 enemies for 65% Base Damage each.',
      },
      {
        id: 'thunderbolt_voltage_surge',
        slot: 2,
        name: 'Voltage Surge',
        triggerLabel: '5 Crit Hits',
        description:
          'Each Player Critical Hit grants 1 Voltage Stack; at 5 stacks, unleashes a 100% Base Damage electric wave.',
      },
      {
        id: 'thunderbolt_overload_circuit',
        slot: 3,
        name: 'Overload Circuit',
        triggerLabel: 'Every 10s',
        cooldownSec: 10,
        description:
          'Every 10s, the next Player hit deals +40% bonus damage with an electric surge; missed shots never waste it.',
      },
    ],
    unlock: {
      ...SHIP_ECONOMY.thunderbolt,
      description: formatShipUnlockLabel('thunderbolt'),
    },
  },
  phantom: {
    id: 'phantom',
    name: 'PHANTOM',
    role: 'Ghost Protocol',
    textureKey: 'ship_phantom',
    primaryColorHex: '#22D3EE',
    primaryColorNum: 0x22d3ee,
    accentColorNum: 0xa5f3fc,
    thrusterColorNum: 0x67e8f9,
    description:
      'Razor-thin stealth interceptor built for extreme mobility, post-dash ambushes, holographic decoys, and emergency defensive reflexes.',
    stats: {
      maxHp: 85,
      maxShield: 50,
      moveSpeed: 1.18,
      damageMult: 0.95,
      fireRateMult: 1.05,
      critChance: 0.12,
      critDamage: 1.8,
    },
    passives: [
      {
        id: 'phantom_phase_counter',
        slot: 1,
        name: 'Phase Counter',
        triggerLabel: 'After Dash',
        cooldownSec: 6,
        description:
          'After dashing, your next Player attack within 3s deals +35% damage (6s CD).',
      },
      {
        id: 'phantom_ghost_decoy',
        slot: 2,
        name: 'Ghost Decoy',
        triggerLabel: 'On Hit',
        cooldownSec: 9,
        description:
          'Taking an enemy hit deploys a holographic Decoy for 2.5s that diverts enemy targeting (9s CD).',
      },
      {
        id: 'phantom_quantum_evasion',
        slot: 3,
        name: 'Quantum Evasion',
        triggerLabel: 'HP <= 35%',
        cooldownSec: 10,
        description:
          'Dropping to or below 35% HP grants 50% Damage Reduction for the next 2 enemy attacks (10s CD).',
      },
    ],
    unlock: {
      ...SHIP_ECONOMY.phantom,
      description: formatShipUnlockLabel('phantom'),
    },
  },
  aegis: {
    id: 'aegis',
    name: 'AEGIS',
    role: 'Eternal Bastion',
    textureKey: 'ship_aegis',
    primaryColorHex: '#10B981',
    primaryColorNum: 0x10b981,
    accentColorNum: 0x6ee7b7,
    thrusterColorNum: 0x34d399,
    description:
      'Fortress-class starfighter forged to outlast prolonged boss sieges through layered shields, emergency reformation, and kinetic retaliation pulses.',
    stats: {
      maxHp: 155,
      maxShield: 120,
      moveSpeed: 0.82,
      damageMult: 0.9,
      fireRateMult: 0.9,
      critChance: 0.08,
      critDamage: 1.75,
    },
    passives: [
      {
        id: 'aegis_fortress_core',
        slot: 1,
        name: 'Fortress Core',
        triggerLabel: 'While Shielded',
        description: 'While Shield is above 0, reduces all incoming damage by 8%.',
      },
      {
        id: 'aegis_shield_reformation',
        slot: 2,
        name: 'Shield Reformation',
        triggerLabel: 'On Shield Break',
        cooldownSec: 10,
        description: 'When Shield breaks to 0, immediately restores 15% Max Shield (10s CD).',
      },
      {
        id: 'aegis_guardian_pulse',
        slot: 3,
        name: 'Guardian Pulse',
        triggerLabel: '25% HP Damage Taken',
        cooldownSec: 8,
        description:
          'Every 25% Max HP in post-mitigation damage taken emits an 80% Base Damage energy pulse (8s CD).',
      },
    ],
    unlock: {
      ...SHIP_ECONOMY.aegis,
      description: formatShipUnlockLabel('aegis'),
    },
  },
  specter: {
    id: 'specter',
    name: 'SPECTER',
    role: 'Execution Phantom',
    textureKey: 'ship_specter',
    primaryColorHex: '#F43F5E',
    primaryColorNum: 0xf43f5e,
    accentColorNum: 0xfda4af,
    thrusterColorNum: 0xe879f9,
    description:
      'High-risk tactical assassin ship exploiting weak points for lethal critical strikes, execution marks, and snowballing precision harvests.',
    stats: {
      maxHp: 90,
      maxShield: 55,
      moveSpeed: 1.0,
      damageMult: 0.95,
      fireRateMult: 0.95,
      critChance: 0.22,
      critDamage: 2.1,
    },
    passives: [
      {
        id: 'specter_deadly_precision',
        slot: 1,
        name: 'Deadly Precision',
        triggerLabel: 'On Crit Hit',
        cooldownSec: 3,
        description:
          'Player Critical Hits deal +15% of the critical damage dealt as immediate bonus damage (3s CD).',
      },
      {
        id: 'specter_execution_mark',
        slot: 2,
        name: 'Execution Mark',
        triggerLabel: 'On Crit Hit',
        description:
          'Critical Hits mark the target for 4s; your next hit against that marked target gains +25% damage.',
      },
      {
        id: 'specter_death_harvest',
        slot: 3,
        name: 'Death Harvest',
        triggerLabel: 'On Crit Kill',
        description:
          'Killing with a Critical Hit restores 5% Max Shield and grants +3% Crit Chance for 8s (max 3 stacks).',
      },
    ],
    unlock: {
      ...SHIP_ECONOMY.specter,
      description: formatShipUnlockLabel('specter'),
    },
  },
  nova_prime: {
    id: 'nova_prime',
    name: 'NOVA PRIME',
    role: 'Quantum Architect',
    textureKey: 'ship_nova_prime',
    primaryColorHex: '#818CF8',
    primaryColorNum: 0x818cf8,
    accentColorNum: 0xc7d2fe,
    thrusterColorNum: 0x60a5fa,
    description:
      'Next-generation command craft projecting an autonomous Quantum Clone that replicates weapon systems, synchronized strikes, and shield recovery.',
    stats: {
      maxHp: 120,
      maxShield: 85,
      moveSpeed: 0.96,
      damageMult: 1.05,
      fireRateMult: 1.0,
      critChance: 0.12,
      critDamage: 1.85,
    },
    passives: [
      {
        id: 'nova_quantum_replication',
        slot: 1,
        name: 'Quantum Replication',
        triggerLabel: 'Always Active',
        description:
          'Projects 1 permanent Quantum Clone mirroring your weapon & evolution at 50% Fire Rate and 20% damage.',
      },
      {
        id: 'nova_quantum_synchronization',
        slot: 2,
        name: 'Quantum Synchronization',
        triggerLabel: '1s Co-Hit',
        cooldownSec: 6,
        description:
          'When Player and Clone hit the same target within 1s, the Clone’s next hit deals +50% damage (6s CD).',
      },
      {
        id: 'nova_quantum_recovery',
        slot: 3,
        name: 'Quantum Recovery',
        triggerLabel: '4 Clone Hits',
        cooldownSec: 8,
        description:
          'Every 4 Clone firing actions hitting an enemy restore 3% of Max Shield (8s CD).',
      },
    ],
    unlock: {
      ...SHIP_ECONOMY.nova_prime,
      description: formatShipUnlockLabel('nova_prime'),
    },
  },
  celestial: {
    id: 'celestial',
    name: 'CELESTIAL',
    role: 'Astral Sovereign',
    textureKey: 'ship_celestial',
    primaryColorHex: '#E879F9',
    primaryColorNum: 0xe879f9,
    accentColorNum: 0xfef08a,
    thrusterColorNum: 0x38bdf8,
    description:
      'Ancient prototype forged from starcore alloys. Commands astral shard constellations, special-triggered barriers, and orbital divine judgment.',
    stats: {
      maxHp: 140,
      maxShield: 100,
      moveSpeed: 1.02,
      damageMult: 1.1,
      fireRateMult: 1.05,
      critChance: 0.15,
      critDamage: 1.95,
    },
    passives: [
      {
        id: 'celestial_astral_constellation',
        slot: 1,
        name: 'Astral Constellation',
        triggerLabel: 'Every 7 Hits',
        cooldownSec: 7,
        description:
          'Every 7 valid hits summon 3 Astral Shards hitting nearest enemies sequentially for 65% Base Damage each (7s CD).',
      },
      {
        id: 'celestial_stellar_protection',
        slot: 2,
        name: 'Stellar Protection',
        triggerLabel: 'On Special',
        cooldownSec: 10,
        description:
          'Activating your Special grants 25% Damage Reduction for the next 3 enemy attacks (10s CD).',
      },
      {
        id: 'celestial_divine_judgment',
        slot: 3,
        name: 'Divine Judgment',
        triggerLabel: 'Every 10s',
        cooldownSec: 10,
        description:
          'Every 10s, calls an Astral Strike on the on-screen enemy with the highest actual HP for 150% Base Damage.',
      },
    ],
    unlock: {
      ...SHIP_ECONOMY.celestial,
      description: formatShipUnlockLabel('celestial'),
    },
  },
};

export const SHIP_LIST: ShipDefinition[] = [
  SHIPS.falcon_x,
  SHIPS.destroyer,
  SHIPS.thunderbolt,
  SHIPS.phantom,
  SHIPS.aegis,
  SHIPS.specter,
  SHIPS.nova_prime,
  SHIPS.celestial,
];
