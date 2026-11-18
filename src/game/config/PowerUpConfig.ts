export type PowerUpType =
  | 'health'
  | 'shield'
  | 'rapid_fire'
  | 'double_damage'
  | 'mega_bomb'
  | 'invulnerability';

export interface PowerUpDefinition {
  id: PowerUpType;
  name: string;
  shortLabel: string;
  textureKey: string;
  colorHex: string;
  colorNum: number;
  durationSec: number;
  weight: number;
}

export const POWERUP_CONFIGS: Record<PowerUpType, PowerUpDefinition> = {
  health: {
    id: 'health',
    name: 'Health Restoration',
    shortLabel: '+35 HP',
    textureKey: 'powerup_health',
    colorHex: '#22C55E',
    colorNum: 0x22c55e,
    durationSec: 0,
    weight: 26,
  },
  shield: {
    id: 'shield',
    name: 'Energy Shield',
    shortLabel: '+45 SHD',
    textureKey: 'powerup_shield',
    colorHex: '#38BDF8',
    colorNum: 0x38bdf8,
    durationSec: 0,
    weight: 24,
  },
  rapid_fire: {
    id: 'rapid_fire',
    name: 'Rapid Fire',
    shortLabel: 'RAPID FIRE',
    textureKey: 'powerup_rapid_fire',
    colorHex: '#F59E0B',
    colorNum: 0xf59e0b,
    durationSec: 8,
    weight: 18,
  },
  double_damage: {
    id: 'double_damage',
    name: 'Double Damage',
    shortLabel: '2X DAMAGE',
    textureKey: 'powerup_double_damage',
    colorHex: '#EF4444',
    colorNum: 0xef4444,
    durationSec: 8,
    weight: 16,
  },
  mega_bomb: {
    id: 'mega_bomb',
    name: 'Mega Bomb',
    shortLabel: 'MEGA BOMB',
    textureKey: 'powerup_mega_bomb',
    colorHex: '#A855F7',
    colorNum: 0xa855f7,
    durationSec: 0,
    weight: 9,
  },
  invulnerability: {
    id: 'invulnerability',
    name: 'Temporary Invulnerability',
    shortLabel: 'AEGIS INVULN',
    textureKey: 'powerup_invulnerability',
    colorHex: '#E0F2FE',
    colorNum: 0xe0f2fe,
    durationSec: 6,
    weight: 7,
  },
};

export const POWERUP_LIST: PowerUpDefinition[] = Object.values(POWERUP_CONFIGS);
