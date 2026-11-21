import Phaser from 'phaser';
import { generateAllTexturesAsync } from '../textures/TextureGenerator';
import { EventBus } from '../utils/EventBus';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  create(): void {
    EventBus.emit('scene:changed', 'PreloadScene');
    void this.runPreload();
  }

  private async runPreload(): Promise<void> {
    await generateAllTexturesAsync(this, (ratio, stageLabel) => {
      EventBus.emit('preload:progress', { progress: ratio, stageLabel });
    });

    if (!this.sys || !this.sys.isActive()) return;
    this.scene.start('MainMenuScene');
  }
}
