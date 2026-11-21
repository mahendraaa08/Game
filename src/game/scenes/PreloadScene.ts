import Phaser from 'phaser';
import { generateAllTextures, generateAllTexturesAsync } from '../textures/TextureGenerator';
import { EventBus } from '../utils/EventBus';

export class PreloadScene extends Phaser.Scene {
  private aborted = false;

  constructor() {
    super('PreloadScene');
  }

  create(): void {
    this.aborted = false;
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.aborted = true;
    });
    this.events.once(Phaser.Scenes.Events.DESTROY, () => {
      this.aborted = true;
    });

    EventBus.emit('scene:changed', 'PreloadScene');
    void this.runPreload();
  }

  private async runPreload(): Promise<void> {
    try {
      await generateAllTexturesAsync(this, (ratio, stageLabel) => {
        if (!this.aborted) {
          EventBus.emit('preload:progress', { progress: ratio, stageLabel });
        }
      });
    } finally {
      if (!this.aborted && this.sys && this.sys.textures) {
        generateAllTextures(this);
      }
    }

    if (this.aborted || !this.sys) return;
    const status = this.sys.settings?.status;
    if (status === Phaser.Scenes.SHUTDOWN || status === Phaser.Scenes.DESTROYED) return;

    this.scene.start('MainMenuScene');
  }
}
