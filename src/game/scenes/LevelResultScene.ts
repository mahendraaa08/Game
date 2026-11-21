import Phaser from 'phaser';
import { CAMPAIGN_LEVELS } from '../config/LevelConfig';
import { SHIPS } from '../config/ShipConfig';
import { SpecialId, WeaponId } from '../config/WeaponConfig';
import { BackgroundSystem } from '../systems/BackgroundSystem';
import { generateAllTextures } from '../textures/TextureGenerator';
import { EventBus, LevelResultPayload } from '../utils/EventBus';
import { StorageManager } from '../utils/StorageManager';

interface LevelResultData extends LevelResultPayload {
  weaponId: WeaponId;
  specialId: SpecialId;
}

export class LevelResultScene extends Phaser.Scene {
  private bg!: BackgroundSystem;
  private ship!: Phaser.GameObjects.Sprite;
  private unsubs: Array<() => void> = [];

  constructor() {
    super('LevelResultScene');
  }

  create(data: LevelResultData): void {
    generateAllTextures(this);
    EventBus.emit('scene:changed', 'LevelResultScene');
    EventBus.emit('level:result', data);

    const saved = StorageManager.load();
    const env = CAMPAIGN_LEVELS[Math.max(0, data.levelNumber - 1)].environment;
    this.bg = new BackgroundSystem(this, env, saved.settings.fxQuality);
    this.bg.setScrollMultiplier(2.2);

    const shipTex = (SHIPS[saved.selectedShip] ?? SHIPS.falcon_x).textureKey;
    this.ship = this.add
      .sprite(this.scale.width * 0.5, this.scale.height * 0.72, shipTex)
      .setScale(1.25)
      .setDepth(5);

    this.unsubs.push(
      EventBus.on('ui:next-level', () => {
        if (data.nextLevelNumber) {
          this.scene.start('GameScene', {
            mode: 'campaign',
            levelNumber: data.nextLevelNumber,
            weaponId: data.weaponId,
            specialId: data.specialId,
            carryScore: data.score,
          });
        }
      }),
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

  update(time: number, rawDelta: number): void {
    const dt = Math.min(rawDelta / 1000, 0.05);
    this.bg.update(dt);
    this.ship.setPosition(
      this.scale.width * 0.5 + Math.sin(time * 0.002) * 20,
      this.scale.height * 0.78
    );
  }
}
