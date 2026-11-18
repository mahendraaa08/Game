import Phaser from 'phaser';
import { CAMPAIGN_LEVELS } from '../config/LevelConfig';
import { SHIPS } from '../config/ShipConfig';
import { getWeaponFireRateAtLevel, SpecialId, WeaponId, WEAPONS } from '../config/WeaponConfig';
import { SoundManager } from '../audio/SoundManager';
import { ProjectileManager } from '../entities/ProjectileManager';
import { Targetable } from '../entities/Targetable';
import { BackgroundSystem } from '../systems/BackgroundSystem';
import { EventBus } from '../utils/EventBus';
import { StorageManager } from '../utils/StorageManager';

export class HangarScene extends Phaser.Scene {
  private bg!: BackgroundSystem;
  private ship!: Phaser.GameObjects.Sprite;
  private projectiles!: ProjectileManager;
  private dummyTarget!: Phaser.GameObjects.Sprite;
  private fireTimerMs = 0;
  private age = 0;
  private selectedWeapon: WeaponId = 'plasma';
  private selectedSpecial: SpecialId = 'emp_nova';
  private unsubs: Array<() => void> = [];

  constructor() {
    super('HangarScene');
  }

  create(): void {
    EventBus.emit('scene:changed', 'HangarScene');
    const saved = StorageManager.load();
    this.selectedWeapon = saved.selectedWeapon;
    this.selectedSpecial = saved.selectedSpecial;
    SoundManager.playMusic('campaign');

    this.bg = new BackgroundSystem(this, CAMPAIGN_LEVELS[0].environment, saved.settings.fxQuality);
    this.bg.setScrollMultiplier(0.45);
    this.projectiles = new ProjectileManager(this);

    const w = this.scale.width;
    const h = this.scale.height;
    const shipDef = SHIPS[saved.selectedShip] ?? SHIPS.falcon_x;

    this.ship = this.add.sprite(w * 0.5, h * 0.68, shipDef.textureKey).setScale(1.35).setDepth(10);
    this.dummyTarget = this.add.sprite(w * 0.5, h * 0.25, 'enemy_fighter').setScale(1.1).setDepth(10);

    this.unsubs.push(
      EventBus.on('ui:select-ship', (shipId) => {
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

    const targetObj: Targetable = {
      x: this.dummyTarget.x,
      y: this.dummyTarget.y,
      active: true,
      hp: 999,
      radius: 26,
      sprite: this.dummyTarget,
      takeDamage: () => false,
    };

    const saved = StorageManager.load();
    const wLevel = saved.weaponLevels[this.selectedWeapon] ?? 1;
    const shipDef = SHIPS[saved.selectedShip] ?? SHIPS.falcon_x;

    this.fireTimerMs -= dt * 1000;
    if (this.fireTimerMs <= 0) {
      const cycle = getWeaponFireRateAtLevel(WEAPONS[this.selectedWeapon], wLevel);
      this.fireTimerMs = cycle / shipDef.stats.fireRateMult;
      this.projectiles.fireWeapon(
        this.selectedWeapon,
        this.ship.x,
        this.ship.y,
        shipDef.stats.damageMult,
        [targetObj],
        () => {
          this.dummyTarget.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
          this.time.delayedCall(50, () => {
            if (this.dummyTarget.active) {
              this.dummyTarget.clearTint().setTintMode(Phaser.TintModes.MULTIPLY);
            }
          });
        },
        {
          weaponLevel: wLevel,
          hasAstralWingBolts: shipDef.id === 'celestial',
          extraChainTargets: shipDef.id === 'thunderbolt' ? 1 : 0,
        }
      );
    }

    this.projectiles.update(dt, [targetObj]);
    this.projectiles.forEachPlayerBullet((b) => {
      if (Math.hypot(b.sprite.x - this.dummyTarget.x, b.sprite.y - this.dummyTarget.y) < 28) {
        b.setActive(false).setVisible(false);
        this.dummyTarget.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
        this.time.delayedCall(50, () => {
          if (this.dummyTarget.active) {
            this.dummyTarget.clearTint().setTintMode(Phaser.TintModes.MULTIPLY);
          }
        });
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
