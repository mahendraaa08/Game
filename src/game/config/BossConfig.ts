export type BossId =
  | 'iron_guardian'
  | 'venom_queen'
  | 'shadow_titan'
  | 'cyber_leviathan'
  | 'void_emperor';

export interface BossDefinition {
  id: BossId;
  name: string;
  title: string;
  textureKey: string;
  maxHp: number;
  scoreReward: number;
  primaryColor: number;
  secondaryColor: number;
  accentHex: string;
  width: number;
  height: number;
  moveSpeed: number;
  levelAssigned: number;
  description: string;
}

export const BOSS_CONFIGS: Record<BossId, BossDefinition> = {
  iron_guardian: {
    id: 'iron_guardian',
    name: 'IRON GUARDIAN',
    title: 'Orbital Siege Bastion',
    textureKey: 'boss_iron_guardian',
    maxHp: 2250,
    scoreReward: 5000,
    primaryColor: 0xf59e0b,
    secondaryColor: 0xef4444,
    accentHex: '#F59E0B',
    width: 150,
    height: 110,
    moveSpeed: 120,
    levelAssigned: 2,
    description: 'Heavily plated dreadnought armed with twin siege cannons, homing mortar seekers, and splitting shrapnel bombs.',
  },
  venom_queen: {
    id: 'venom_queen',
    name: 'VENOM QUEEN',
    title: 'Bio-Plasma Hive Matriarch',
    textureKey: 'boss_venom_queen',
    maxHp: 3400,
    scoreReward: 7800,
    primaryColor: 0xa855f7,
    secondaryColor: 0x22c55e,
    accentHex: '#A855F7',
    width: 164,
    height: 118,
    moveSpeed: 155,
    levelAssigned: 4,
    description: 'Organic Void flagship firing corrosive plasma rings, splitting spore pods, and seeker hive broods.',
  },
  shadow_titan: {
    id: 'shadow_titan',
    name: 'SHADOW TITAN',
    title: 'Cryo-Stealth Monolith',
    textureKey: 'boss_shadow_titan',
    maxHp: 4800,
    scoreReward: 11000,
    primaryColor: 0x38bdf8,
    secondaryColor: 0x6366f1,
    accentHex: '#38BDF8',
    width: 170,
    height: 120,
    moveSpeed: 185,
    levelAssigned: 6,
    description: 'Phase-shifting cruiser projecting sweeping cryo-laser lances, crisscrossing ice curtains, and splitting cryo cores.',
  },
  cyber_leviathan: {
    id: 'cyber_leviathan',
    name: 'CYBER LEVIATHAN',
    title: 'Autonomous Planet Core',
    textureKey: 'boss_cyber_leviathan',
    maxHp: 6800,
    scoreReward: 15000,
    primaryColor: 0x10b981,
    secondaryColor: 0x06b6d4,
    accentHex: '#10B981',
    width: 184,
    height: 126,
    moveSpeed: 170,
    levelAssigned: 8,
    description: 'Cybernetic war engine coordinating multi-lane security beams, weaving matrices, and lock-on seeker swarms.',
  },
  void_emperor: {
    id: 'void_emperor',
    name: 'VOID EMPEROR',
    title: 'Supreme Sovereign of the Void Empire',
    textureKey: 'boss_void_emperor',
    maxHp: 9600,
    scoreReward: 30000,
    primaryColor: 0xf43f5e,
    secondaryColor: 0xa855f7,
    accentHex: '#F43F5E',
    width: 210,
    height: 145,
    moveSpeed: 195,
    levelAssigned: 10,
    description: 'The ultimate multi-wing Void flagship wielding tri-beam apocalypse crowns, splitting void rifts, and homing singularity storms.',
  },
};
