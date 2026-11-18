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

  private stopBossAlertIfPresent(): void {
    if (this.scene.isActive('BossScene') || this.scene.isPaused('BossScene')) {
      this.scene.stop('BossScene');
    }
  }

  create(data: PauseData): void {
    EventBus.emit('scene:changed', 'PauseMenuScene');

    this.unsubs.push(
      EventBus.on('ui:resume-game', () => {
        this.resumePlay();
      }),
      EventBus.on('ui:restart-level', () => {
        this.stopBossAlertIfPresent();
        this.scene.stop('GameScene');
        this.scene.stop('PauseMenuScene');
        this.scene.start('GameScene', data.levelData);
      }),
      EventBus.on('ui:open-hangar', () => {
        this.stopBossAlertIfPresent();
        this.scene.stop('GameScene');
        this.scene.stop('PauseMenuScene');
        this.scene.start('HangarScene');
      }),
      EventBus.on('ui:open-menu', () => {
        this.stopBossAlertIfPresent();
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
    if (this.scene.isPaused('BossScene')) {
      this.scene.resume('BossScene');
    }
    this.scene.resume('GameScene');
    EventBus.emit('scene:changed', 'GameScene');
    this.scene.stop('PauseMenuScene');
  }
}
