import Phaser from 'phaser';
import { generateAllTextures } from '../textures/TextureGenerator';
import { EventBus } from '../utils/EventBus';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  create(): void {
    EventBus.emit('scene:changed', 'PreloadScene');
    EventBus.emit('preload:progress', 0.35);

    generateAllTextures(this);
    EventBus.emit('preload:progress', 1);

    this.time.delayedCall(120, () => {
      this.scene.start('MainMenuScene');
    });
  }
}
