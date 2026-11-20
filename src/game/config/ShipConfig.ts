import { formatShipUnlockLabel, SHIP_ECONOMY } from './EconomyConfig';
import type { WeaponId } from './WeaponConfig';

export type ShipId =
  | 'falcon_x'
  | 'destroyer'
  | 'phantom'
  | 'nova_prime'
  | 'thunderbolt'
  | 'aegis'
  | 'specter'
  | 'celestial';

export interface ShipStats {
  maxHp: number;
  maxShield: number;
  moveSpeed: number;
  damageMult: number;
  fireRateMult: number; // >1 means faster firing
  critChance: number; // 0..1
  specialPowerMult: number;
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
  signatureWeapon: WeaponId;
  passiveName: string;
  passiveDescription: string;
  weaponCharacteristic: string;
  description: string;
  stats: ShipStats;
  unlock: ShipUnlockRequirement;
}

export const SHIPS: Record<ShipId, ShipDefinition> = {
  falcon_x: {
    id: 'falcon_x',
    name: 'FALCON X',
    role: 'Balanced Fighter',
    textureKey: 'ship_falcon_x',
    primaryColorHex: '#38BDF8',
    primaryColorNum: 0x38bdf8,
    accentColorNum: 0xe2e8f0,
    thrusterColorNum: 0x67e8f9,
    signatureWeapon: 'plasma',
    passiveName: 'Adaptive Reactor',
    passiveDescription: '+12% Shield regeneration rate and steady all-around combat handling.',
    weaponCharacteristic: 'Reliable precision firing across all 6 weapon modules.',
    description:
      'Earth Defense Command’s versatile frontline interceptor. Engineered for dependable agility, armor, and energy balance.',
    stats: {
      maxHp: 100,
      maxShield: 60,
      moveSpeed: 385,
      damageMult: 1.0,
      fireRateMult: 1.0,
      critChance: 0.08,
      specialPowerMult: 1.0,
    },
    unlock: {
      ...SHIP_ECONOMY.falcon_x,
      description: formatShipUnlockLabel('falcon_x'),
    },
  },
  destroyer: {
    id: 'destroyer',
    name: 'DESTROYER',
    role: 'Heavy Assault',
    textureKey: 'ship_destroyer',
    primaryColorHex: '#F97316',
    primaryColorNum: 0xf97316,
    accentColorNum: 0xfef08a,
    thrusterColorNum: 0xfb923c,
    signatureWeapon: 'homing',
    passiveName: 'Overcharged Ordnance',
    passiveDescription: '+25% Projectile & Missile impact scale and +20% armor hull plating.',
    weaponCharacteristic: 'Heavy-caliber rounds with amplified splash & hull penetration.',
    description:
      'Twin-chassis gunship prioritizing overwhelming firepower and siege durability over top speed.',
    stats: {
      maxHp: 135,
      maxShield: 65,
      moveSpeed: 325,
      damageMult: 1.32,
      fireRateMult: 0.92,
      critChance: 0.1,
      specialPowerMult: 1.15,
    },
    unlock: {
      ...SHIP_ECONOMY.destroyer,
      description: formatShipUnlockLabel('destroyer'),
    },
  },
  phantom: {
    id: 'phantom',
    name: 'PHANTOM',
    role: 'High-Speed Interceptor',
    textureKey: 'ship_phantom',
    primaryColorHex: '#22D3EE',
    primaryColorNum: 0x22d3ee,
    accentColorNum: 0xa5f3fc,
    thrusterColorNum: 0x67e8f9,
    signatureWeapon: 'dual_laser',
    passiveName: 'Phase Thrusters',
    passiveDescription: '15% Evasion chance on incoming fire and -25% Dash cooldown.',
    weaponCharacteristic: 'High-velocity laser bolts tuned for hit-and-run precision.',
    description:
      'Razor-thin stealth interceptor built for micro-dodging dense bullet curtains at extreme speed.',
    stats: {
      maxHp: 82,
      maxShield: 50,
      moveSpeed: 475,
      damageMult: 0.98,
      fireRateMult: 1.14,
      critChance: 0.14,
      specialPowerMult: 1.0,
    },
    unlock: {
      ...SHIP_ECONOMY.phantom,
      description: formatShipUnlockLabel('phantom'),
    },
  },
  nova_prime: {
    id: 'nova_prime',
    name: 'NOVA PRIME',
    role: 'Advanced Balanced',
    textureKey: 'ship_nova_prime',
    primaryColorHex: '#818CF8',
    primaryColorNum: 0x818cf8,
    accentColorNum: 0xc7d2fe,
    thrusterColorNum: 0x60a5fa,
    signatureWeapon: 'beam',
    passiveName: 'Flux Capacitor',
    passiveDescription: 'Energy weapons deal +18% damage and Special recharges 18% faster.',
    weaponCharacteristic: 'Focused energy cores amplifying Beam, Plasma, and Special arcs.',
    description:
      'Next-generation command craft combining reinforced shields, superior speed, and high-output energy conduits.',
    stats: {
      maxHp: 120,
      maxShield: 85,
      moveSpeed: 415,
      damageMult: 1.16,
      fireRateMult: 1.12,
      critChance: 0.13,
      specialPowerMult: 1.22,
    },
    unlock: {
      ...SHIP_ECONOMY.nova_prime,
      description: formatShipUnlockLabel('nova_prime'),
    },
  },
  thunderbolt: {
    id: 'thunderbolt',
    name: 'THUNDERBOLT',
    role: 'Rapid-Fire Specialist',
    textureKey: 'ship_thunderbolt',
    primaryColorHex: '#FACC15',
    primaryColorNum: 0xfacc15,
    accentColorNum: 0xfef08a,
    thrusterColorNum: 0x38bdf8,
    signatureWeapon: 'lightning',
    passiveName: 'Rotary Accelerator',
    passiveDescription: 'Continuous firing ramps +22% sustained fire cadence and +1 Chain target.',
    weaponCharacteristic: 'Blistering cycle speed turning rapid-fire weapons into bullet storms.',
    description:
      'High-cadence assault wing designed to shred waves through relentless multi-stream fire saturation.',
    stats: {
      maxHp: 96,
      maxShield: 64,
      moveSpeed: 405,
      damageMult: 0.86,
      fireRateMult: 1.44,
      critChance: 0.11,
      specialPowerMult: 1.08,
    },
    unlock: {
      ...SHIP_ECONOMY.thunderbolt,
      description: formatShipUnlockLabel('thunderbolt'),
    },
  },
  aegis: {
    id: 'aegis',
    name: 'AEGIS',
    role: 'Defensive Guardian',
    textureKey: 'ship_aegis',
    primaryColorHex: '#10B981',
    primaryColorNum: 0x10b981,
    accentColorNum: 0x6ee7b7,
    thrusterColorNum: 0x34d399,
    signatureWeapon: 'spread',
    passiveName: 'Bastion Matrix',
    passiveDescription: '16% incoming damage reduction, +45% shield regen speed, and +4 Shield per kill.',
    weaponCharacteristic: 'Wide defensive spread volleys protecting forward lanes.',
    description:
      'Fortress-class starfighter forged to outlast prolonged boss sieges and absorb catastrophic barrages.',
    stats: {
      maxHp: 155,
      maxShield: 120,
      moveSpeed: 345,
      damageMult: 1.04,
      fireRateMult: 0.98,
      critChance: 0.08,
      specialPowerMult: 1.15,
    },
    unlock: {
      ...SHIP_ECONOMY.aegis,
      description: formatShipUnlockLabel('aegis'),
    },
  },
  specter: {
    id: 'specter',
    name: 'SPECTER',
    role: 'Critical Striker',
    textureKey: 'ship_specter',
    primaryColorHex: '#F43F5E',
    primaryColorNum: 0xf43f5e,
    accentColorNum: 0xfda4af,
    thrusterColorNum: 0xe879f9,
    signatureWeapon: 'beam',
    passiveName: 'Execution Protocol',
    passiveDescription: 'Critical hits deal 2.35x damage (up from 1.75x) and boost Special power.',
    weaponCharacteristic: 'Precision lethal strikes exploiting enemy armor weak points.',
    description:
      'High-risk tactical assassin ship trading heavy hull plating for devastating critical strikes and specials.',
    stats: {
      maxHp: 90,
      maxShield: 58,
      moveSpeed: 440,
      damageMult: 1.12,
      fireRateMult: 1.15,
      critChance: 0.28,
      specialPowerMult: 1.35,
    },
    unlock: {
      ...SHIP_ECONOMY.specter,
      description: formatShipUnlockLabel('specter'),
    },
  },
  celestial: {
    id: 'celestial',
    name: 'CELESTIAL',
    role: 'Legendary Sovereign',
    textureKey: 'ship_celestial',
    primaryColorHex: '#E879F9',
    primaryColorNum: 0xe879f9,
    accentColorNum: 0xfef08a,
    thrusterColorNum: 0x38bdf8,
    signatureWeapon: 'plasma',
    passiveName: 'Astral Convergence',
    passiveDescription:
      'Fires twin celestial wing-bolts alongside every attack, +20% crit bonus, and +25% Special potency.',
    weaponCharacteristic: 'Radiant multi-vector salvos with unmatched all-around dominance.',
    description:
      'Ancient prototype forged from starcore alloys. Earth’s supreme endgame interceptor against the Void Emperor.',
    stats: {
      maxHp: 145,
      maxShield: 110,
      moveSpeed: 445,
      damageMult: 1.38,
      fireRateMult: 1.28,
      critChance: 0.24,
      specialPowerMult: 1.4,
    },
    unlock: {
      ...SHIP_ECONOMY.celestial,
      description: formatShipUnlockLabel('celestial'),
    },
  },
};

export const SHIP_LIST: ShipDefinition[] = [
  SHIPS.falcon_x,
  SHIPS.destroyer,
  SHIPS.phantom,
  SHIPS.nova_prime,
  SHIPS.thunderbolt,
  SHIPS.aegis,
  SHIPS.specter,
  SHIPS.celestial,
];
