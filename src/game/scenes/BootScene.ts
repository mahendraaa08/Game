import Phaser from 'phaser';
import { EventBus } from '../utils/EventBus';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create(): void {
    EventBus.emit('scene:changed', 'BootScene');
    this.cameras.main.setBackgroundColor(0x040711);
    this.scene.start('PreloadScene');
  }
}
