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
    maxHp: 1650,
    scoreReward: 4000,
    primaryColor: 0xf59e0b,
    secondaryColor: 0xef4444,
    accentHex: '#F59E0B',
    width: 150,
    height: 110,
    moveSpeed: 120,
    levelAssigned: 2,
    description: 'Heavily plated dreadnought armed with twin siege cannons and kinetic barrage pods.',
  },
  venom_queen: {
    id: 'venom_queen',
    name: 'VENOM QUEEN',
    title: 'Bio-Plasma Hive Matriarch',
    textureKey: 'boss_venom_queen',
    maxHp: 2350,
    scoreReward: 6500,
    primaryColor: 0xa855f7,
    secondaryColor: 0x22c55e,
    accentHex: '#A855F7',
    width: 164,
    height: 118,
    moveSpeed: 155,
    levelAssigned: 4,
    description: 'Organic Void flagship firing corrosive plasma rings and spawning scout broods.',
  },
  shadow_titan: {
    id: 'shadow_titan',
    name: 'SHADOW TITAN',
    title: 'Cryo-Stealth Monolith',
    textureKey: 'boss_shadow_titan',
    maxHp: 3100,
    scoreReward: 9000,
    primaryColor: 0x38bdf8,
    secondaryColor: 0x6366f1,
    accentHex: '#38BDF8',
    width: 170,
    height: 120,
    moveSpeed: 185,
    levelAssigned: 6,
    description: 'Phase-shifting cruiser projecting sweeping cryo-laser lances and darting volleys.',
  },
  cyber_leviathan: {
    id: 'cyber_leviathan',
    name: 'CYBER LEVIATHAN',
    title: 'Autonomous Planet Core',
    textureKey: 'boss_cyber_leviathan',
    maxHp: 4200,
    scoreReward: 12000,
    primaryColor: 0x10b981,
    secondaryColor: 0x06b6d4,
    accentHex: '#10B981',
    width: 184,
    height: 126,
    moveSpeed: 170,
    levelAssigned: 8,
    description: 'Cybernetic war engine coordinating hyper-beam sweeps and spiral plasma curtains.',
  },
  void_emperor: {
    id: 'void_emperor',
    name: 'VOID EMPEROR',
    title: 'Supreme Sovereign of the Void Empire',
    textureKey: 'boss_void_emperor',
    maxHp: 6000,
    scoreReward: 25000,
    primaryColor: 0xf43f5e,
    secondaryColor: 0xa855f7,
    accentHex: '#F43F5E',
    width: 210,
    height: 145,
    moveSpeed: 195,
    levelAssigned: 10,
    description: 'The ultimate multi-wing Void flagship wielding dual apocalypse beams, void rifts, and relentless bullet storms.',
  },
};
