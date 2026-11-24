import Phaser from 'phaser';
import { CAMPAIGN_LEVELS } from '../config/LevelConfig';
import { SHIPS } from '../config/ShipConfig';
import { SoundManager } from '../audio/SoundManager';
import { BackgroundSystem } from '../systems/BackgroundSystem';
import { generateAllTextures } from '../textures/TextureGenerator';
import { EventBus } from '../utils/EventBus';
import { StorageManager } from '../utils/StorageManager';

export class MainMenuScene extends Phaser.Scene {
  private bg!: BackgroundSystem;
  private heroShip!: Phaser.GameObjects.Sprite;
  private escortLeft!: Phaser.GameObjects.Sprite;
  private escortRight!: Phaser.GameObjects.Sprite;
  private age = 0;
  private unsubs: Array<() => void> = [];

  constructor() {
    super('MainMenuScene');
  }

  create(): void {
    generateAllTextures(this);
    EventBus.emit('scene:changed', 'MainMenuScene');
    const saved = StorageManager.load();
    SoundManager.syncSettings(saved.settings);
    if (saved.guestModeConfirmed) {
      SoundManager.playMusic('menu');
    }

    this.bg = new BackgroundSystem(this, CAMPAIGN_LEVELS[0].environment, saved.settings.fxQuality);
    this.bg.setScrollMultiplier(0.75);

    const w = this.scale.width;
    const h = this.scale.height;
    const shipTex = (SHIPS[saved.selectedShip] ?? SHIPS.falcon_x).textureKey;

    this.heroShip = this.add.sprite(w * 0.68, h * 0.56, shipTex).setScale(1.35).setDepth(5).setAlpha(0.88);
    this.escortLeft = this.add.sprite(w * 0.6, h * 0.65, 'ship_falcon_x').setScale(0.78).setDepth(4).setAlpha(0.65);
    this.escortRight = this.add.sprite(w * 0.77, h * 0.64, 'ship_phantom').setScale(0.78).setDepth(4).setAlpha(0.65);

    this.unsubs.push(
      EventBus.on('ui:start-level', (levelNumber) => {
        const progress = StorageManager.load();
        const rawDiff = progress.selectedCampaignDifficulty ?? 'easy';
        const safeDiff =
          progress.campaignProgress[rawDiff]?.highestUnlockedLevel >= 1 ? rawDiff : 'easy';
        const maxUnlocked = Math.max(1, progress.campaignProgress[safeDiff]?.highestUnlockedLevel ?? 1);
        const safeLevel = Math.min(Math.max(1, levelNumber), maxUnlocked);
        this.scene.start('GameScene', {
          mode: 'campaign',
          campaignDifficulty: safeDiff,
          levelNumber: safeLevel,
          weaponId: progress.selectedWeapon,
          specialId: progress.selectedSpecial,
          carryScore: 0,
        });
      }),
      EventBus.on('ui:start-mode', (req) => {
        const progress = StorageManager.load();
        const rawDiff = req.campaignDifficulty ?? progress.selectedCampaignDifficulty ?? 'easy';
        const safeDiff =
          progress.campaignProgress[rawDiff]?.highestUnlockedLevel >= 1 ? rawDiff : 'easy';
        const maxUnlocked = Math.max(1, progress.campaignProgress[safeDiff]?.highestUnlockedLevel ?? 1);
        const lvl = req.levelNumber ?? maxUnlocked;
        this.scene.start('GameScene', {
          mode: req.mode,
          campaignDifficulty: req.mode === 'campaign' ? safeDiff : undefined,
          levelNumber: req.mode === 'campaign' ? Math.min(Math.max(1, lvl), maxUnlocked) : lvl,
          challengeId: req.challengeId,
          challengeDifficulty: req.challengeDifficulty,
          weaponId: progress.selectedWeapon,
          specialId: progress.selectedSpecial,
          carryScore: 0,
        });
      }),
      EventBus.on('ui:select-ship', (shipId) => {
        const def = SHIPS[shipId];
        if (def && this.heroShip?.active) {
          this.heroShip.setTexture(def.textureKey);
        }
      }),
      EventBus.on('ui:open-hangar', () => {
        this.scene.start('HangarScene');
      })
    );

    this.scale.on('resize', this.handleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanup, this);
  }

  private handleResize(gameSize: Phaser.Structs.Size): void {
    this.bg?.resize(gameSize.width, gameSize.height);
  }

  update(_time: number, rawDelta: number): void {
    const dt = Math.min(rawDelta / 1000, 0.05);
    this.age += dt;
    this.bg.update(dt);

    const w = this.scale.width;
    const h = this.scale.height;
    this.heroShip.setPosition(w * 0.68 + Math.sin(this.age * 1.1) * 26, h * 0.56 + Math.cos(this.age * 1.6) * 14);
    this.heroShip.setRotation(Math.cos(this.age * 1.1) * 0.08);
    this.escortLeft.setPosition(this.heroShip.x - 86, this.heroShip.y + 52);
    this.escortRight.setPosition(this.heroShip.x + 86, this.heroShip.y + 48);
  }

  private cleanup(): void {
    this.scale.off('resize', this.handleResize, this);
    this.unsubs.forEach((u) => u());
    this.unsubs = [];
    this.bg?.destroy();
  }
}
