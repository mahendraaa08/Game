import Phaser from 'phaser';
import { CAMPAIGN_LEVELS } from '../config/LevelConfig';
import { ShipId, SHIPS } from '../config/ShipConfig';
import { getWeaponFireRateAtLevel, SpecialId, WeaponId, WEAPONS } from '../config/WeaponConfig';
import { SoundManager } from '../audio/SoundManager';
import { ProjectileManager } from '../entities/ProjectileManager';
import { allocateTargetId, Targetable } from '../entities/Targetable';
import { BackgroundSystem } from '../systems/BackgroundSystem';
import { generateAllTextures } from '../textures/TextureGenerator';
import { EventBus } from '../utils/EventBus';
import { StorageManager } from '../utils/StorageManager';

export class HangarScene extends Phaser.Scene {
  private bg!: BackgroundSystem;
  private ship!: Phaser.GameObjects.Sprite;
  private projectiles!: ProjectileManager;
  private dummyTarget!: Phaser.GameObjects.Sprite;
  private dummyTargetObj!: Targetable;
  private dummyTargetList: Targetable[] = [];
  private fireTimerMs = 0;
  private age = 0;
  private selectedShip: ShipId = 'falcon_x';
  private selectedWeapon: WeaponId = 'plasma';
  private selectedSpecial: SpecialId = 'emp_nova';
  private cachedWeaponLevels: Record<WeaponId, number> = {
    plasma: 1,
    dual_laser: 1,
    spread: 1,
    homing: 1,
    beam: 1,
    lightning: 1,
  };
  private unsubs: Array<() => void> = [];

  private flashDummyTarget = (): void => {
    this.dummyTarget.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
    this.time.delayedCall(50, () => {
      if (this.dummyTarget.active) {
        this.dummyTarget.clearTint().setTintMode(Phaser.TintModes.MULTIPLY);
      }
    });
  };

  constructor() {
    super('HangarScene');
  }

  create(): void {
    generateAllTextures(this);
    EventBus.emit('scene:changed', 'HangarScene');
    const saved = StorageManager.load();
    this.selectedShip = saved.selectedShip;
    this.selectedWeapon = saved.selectedWeapon;
    this.selectedSpecial = saved.selectedSpecial;
    this.cachedWeaponLevels = { ...saved.weaponLevels };
    SoundManager.playMusic('campaign');

    this.bg = new BackgroundSystem(this, CAMPAIGN_LEVELS[0].environment, saved.settings.fxQuality);
    this.bg.setScrollMultiplier(0.45);
    this.projectiles = new ProjectileManager(this);

    const w = this.scale.width;
    const h = this.scale.height;
    const shipDef = SHIPS[this.selectedShip] ?? SHIPS.falcon_x;

    this.ship = this.add.sprite(w * 0.5, h * 0.68, shipDef.textureKey).setScale(1.35).setDepth(10);
    this.dummyTarget = this.add.sprite(w * 0.5, h * 0.25, 'enemy_fighter').setScale(1.1).setDepth(10);

    this.dummyTargetObj = {
      targetId: allocateTargetId(),
      x: this.dummyTarget.x,
      y: this.dummyTarget.y,
      active: true,
      hp: 999,
      radius: 26,
      sprite: this.dummyTarget,
      takeDamage: () => false,
    };
    this.dummyTargetList = [this.dummyTargetObj];

    this.unsubs.push(
      EventBus.on('ui:select-ship', (shipId) => {
        this.selectedShip = shipId;
        const def = SHIPS[shipId];
        if (def && this.ship?.active) {
          this.ship.setTexture(def.textureKey);
        }
      }),
      EventBus.on('ui:select-weapon', (wId) => {
        this.selectedWeapon = wId;
        StorageManager.setWeapon(wId);
      }),
      EventBus.on('ui:select-special', (sId) => {
        this.selectedSpecial = sId;
        StorageManager.setSpecial(sId);
      }),
      EventBus.on('progress:updated', () => {
        const latest = StorageManager.load();
        this.selectedShip = latest.selectedShip;
        this.cachedWeaponLevels = { ...latest.weaponLevels };
      }),
      EventBus.on('ui:start-level', (levelNumber) => {
        const p = StorageManager.load();
        this.scene.start('GameScene', {
          mode: 'campaign',
          levelNumber,
          weaponId: p.selectedWeapon,
          specialId: p.selectedSpecial,
          carryScore: 0,
        });
      }),
      EventBus.on('ui:start-mode', (req) => {
        const p = StorageManager.load();
        this.scene.start('GameScene', {
          mode: req.mode,
          levelNumber: req.levelNumber ?? p.highestUnlockedLevel,
          challengeId: req.challengeId,
          weaponId: p.selectedWeapon,
          specialId: p.selectedSpecial,
          carryScore: 0,
        });
      }),
      EventBus.on('ui:open-menu', () => {
        this.scene.start('MainMenuScene');
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
    this.ship.setPosition(w * 0.5 + Math.sin(this.age * 1.4) * 32, h * 0.68);
    this.dummyTarget.setPosition(w * 0.5 + Math.sin(this.age * 1.9) * 65, h * 0.24);
    this.dummyTargetObj.x = this.dummyTarget.x;
    this.dummyTargetObj.y = this.dummyTarget.y;

    const wLevel = this.cachedWeaponLevels[this.selectedWeapon] ?? 1;
    const shipDef = SHIPS[this.selectedShip] ?? SHIPS.falcon_x;

    this.fireTimerMs -= dt * 1000;
    if (this.fireTimerMs <= 0) {
      const cycle = getWeaponFireRateAtLevel(WEAPONS[this.selectedWeapon], wLevel);
      this.fireTimerMs = cycle / shipDef.stats.fireRateMult;
      this.projectiles.fireWeapon(
        this.selectedWeapon,
        this.ship.x,
        this.ship.y,
        shipDef.stats.damageMult,
        this.dummyTargetList,
        this.flashDummyTarget,
        {
          weaponLevel: wLevel,
        }
      );
    }

    this.projectiles.update(dt, this.dummyTargetList);
    this.projectiles.forEachPlayerBullet((b) => {
      if (Math.hypot(b.sprite.x - this.dummyTarget.x, b.sprite.y - this.dummyTarget.y) < 28) {
        b.setActive(false).setVisible(false);
        this.flashDummyTarget();
      }
    });
  }

  private cleanup(): void {
    this.scale.off('resize', this.handleResize, this);
    this.unsubs.forEach((u) => u());
    this.unsubs = [];
    this.projectiles?.destroy();
    this.bg?.destroy();
  }
}
