import Phaser from 'phaser';
import { EventBus } from '../utils/EventBus';
import { GameSceneData } from './GameScene';

interface PauseData {
  levelData: GameSceneData;
}

export class PauseMenuScene extends Phaser.Scene {
  private unsubs: Array<() => void> = [];

  constructor() {
    super('PauseMenuScene');
  }

  create(data: PauseData): void {
    EventBus.emit('scene:changed', 'PauseMenuScene');

    this.unsubs.push(
      EventBus.on('ui:resume-game', () => {
        this.resumePlay();
      }),
      EventBus.on('ui:restart-level', () => {
        this.scene.stop('GameScene');
        this.scene.stop('PauseMenuScene');
        this.scene.start('GameScene', data.levelData);
      }),
      EventBus.on('ui:open-hangar', () => {
        this.scene.stop('GameScene');
        this.scene.stop('PauseMenuScene');
        this.scene.start('HangarScene');
      }),
      EventBus.on('ui:open-menu', () => {
        this.scene.stop('GameScene');
        this.scene.stop('PauseMenuScene');
        this.scene.start('MainMenuScene');
      })
    );

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.unsubs.forEach((u) => u());
      this.unsubs = [];
    });
  }

  private resumePlay(): void {
    if (!this.scene.isPaused('GameScene')) return;
    this.scene.resume('GameScene');
    EventBus.emit('scene:changed', 'GameScene');
    this.scene.stop('PauseMenuScene');
  }
}
