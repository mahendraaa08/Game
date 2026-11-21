import Phaser from 'phaser';

export interface Targetable {
  x: number;
  y: number;
  active: boolean;
  hp: number;
  radius: number;
  sprite: Phaser.GameObjects.Sprite;
  takeDamage(amount: number): boolean;
  applyParalyze?(baseDurationSec: number): boolean;
}
