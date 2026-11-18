import Phaser from 'phaser';
import { CAMPAIGN_LEVELS } from '../config/LevelConfig';
import { SpecialId, WeaponId } from '../config/WeaponConfig';
import { BackgroundSystem } from '../systems/BackgroundSystem';
import { EventBus, GameOverPayload } from '../utils/EventBus';
import { StorageManager } from '../utils/StorageManager';

interface GameOverData extends GameOverPayload {
  weaponId: WeaponId;
  specialId: SpecialId;
}

export class GameOverScene extends Phaser.Scene {
  private bg!: BackgroundSystem;
  private unsubs: Array<() => void> = [];

  constructor() {
    super('GameOverScene');
  }

  create(data: GameOverData): void {
    EventBus.emit('scene:changed', 'GameOverScene');
    EventBus.emit('game:over', data);

    const saved = StorageManager.load();
    const env = CAMPAIGN_LEVELS[Math.max(0, data.levelNumber - 1)].environment;
    this.bg = new BackgroundSystem(this, env, saved.settings.fxQuality);
    this.bg.setScrollMultiplier(0.28);

    this.unsubs.push(
      EventBus.on('ui:restart-level', () => {
        this.scene.start('GameScene', {
          mode: data.mode,
          challengeId: data.challengeId,
          levelNumber: data.levelNumber,
          weaponId: data.weaponId,
          specialId: data.specialId,
          carryScore: 0,
        });
      }),
      EventBus.on('ui:open-hangar', () => {
        this.scene.start('HangarScene');
      }),
      EventBus.on('ui:open-menu', () => {
        this.scene.start('MainMenuScene');
      })
    );

    this.scale.on('resize', this.handleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off('resize', this.handleResize, this);
      this.unsubs.forEach((u) => u());
      this.unsubs = [];
      this.bg?.destroy();
    });
  }

  private handleResize(gameSize: Phaser.Structs.Size): void {
    this.bg?.resize(gameSize.width, gameSize.height);
  }

  update(_time: number, rawDelta: number): void {
    const dt = Math.min(rawDelta / 1000, 0.05);
    this.bg.update(dt);
  }
}
