import Phaser from 'phaser';
import { CAMPAIGN_LEVELS } from '../config/LevelConfig';
import { SHIPS } from '../config/ShipConfig';
import { BackgroundSystem } from '../systems/BackgroundSystem';
import { EventBus, VictoryPayload } from '../utils/EventBus';
import { StorageManager } from '../utils/StorageManager';

export class VictoryScene extends Phaser.Scene {
  private bg!: BackgroundSystem;
  private ship!: Phaser.GameObjects.Sprite;
  private unsubs: Array<() => void> = [];

  constructor() {
    super('VictoryScene');
  }

  create(data: VictoryPayload): void {
    EventBus.emit('scene:changed', 'VictoryScene');
    EventBus.emit('campaign:victory', data);

    const saved = StorageManager.load();
    this.bg = new BackgroundSystem(this, CAMPAIGN_LEVELS[0].environment, saved.settings.fxQuality);
    this.bg.setScrollMultiplier(1.5);
    const shipTex = (SHIPS[saved.selectedShip] ?? SHIPS.falcon_x).textureKey;
    this.ship = this.add
      .sprite(this.scale.width * 0.5, this.scale.height * 0.78, shipTex)
      .setScale(1.4)
      .setDepth(5);

    this.unsubs.push(
      EventBus.on('ui:start-level', (lvl) => {
        this.scene.start('GameScene', { mode: 'campaign', levelNumber: lvl });
      }),
      EventBus.on('ui:start-mode', (req) => {
        this.scene.start('GameScene', {
          mode: req.mode,
          levelNumber: req.levelNumber ?? 1,
          challengeId: req.challengeId,
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

  update(time: number, rawDelta: number): void {
    const dt = Math.min(rawDelta / 1000, 0.05);
    this.bg.update(dt);
    this.ship.setPosition(
      this.scale.width * 0.5 + Math.sin(time * 0.002) * 32,
      this.scale.height * 0.8 + Math.cos(time * 0.003) * 10
    );
  }
}
