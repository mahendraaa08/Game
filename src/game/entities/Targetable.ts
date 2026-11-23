import Phaser from 'phaser';

let nextTargetId = 1;
let nextEnemyAttackId = 1;

export function allocateTargetId(): number {
  return nextTargetId++;
}

export function allocateEnemyAttackId(): number {
  return nextEnemyAttackId++;
}

export interface Targetable {
  readonly targetId: number;
  x: number;
  y: number;
  active: boolean;
  hp: number;
  maxHp?: number;
  radius: number;
  entering?: boolean;
  invulnerable?: boolean;
  sprite: Phaser.GameObjects.Sprite;
  takeDamage(amount: number): boolean;
  applyParalyze?(baseDurationSec: number): boolean;
}
