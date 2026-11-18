import Phaser from 'phaser';
import { generateAllTextures } from '../textures/TextureGenerator';
import { EventBus } from '../utils/EventBus';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  create(): void {
    EventBus.emit('scene:changed', 'PreloadScene');
    generateAllTextures(this);
    this.scene.start('MainMenuScene');
  }
}
