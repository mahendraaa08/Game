import Phaser from 'phaser';
import { BOSS_CONFIGS, BossId } from '../config/BossConfig';
import {
  ECONOMY_CAPS,
  formatSectorRewardText,
  getBossCombatReward,
  getCampaignClearReward,
  getEndlessBossHpMult,
  getEndlessDifficulty,
  getEndlessWaveReward,
  getEnemyCreditDrop,
} from '../config/EconomyConfig';
import { EQUIPMENT_BY_ID, EquipmentRarityEffect, type EquipmentSlot } from '../config/EquipmentConfig';
import { GAME_CONSTANTS, HudSnapshot } from '../config/GameConfig';
import {
  BOSS_RUSH_ORDER,
  BOSS_RUSH_RECOVERY_BY_ID,
  calculateBossRushPerformanceBonus,
  CAMPAIGN_DIFFICULTIES,
  type CampaignDifficulty,
  CHALLENGE_BY_ID,
  type ChallengeDefinition,
  type ChallengeDifficulty,
  type ChallengeRule,
  type ChallengeTierConfig,
  ENDLESS_UPGRADE_SPECS,
  type GameMode,
  getBossRushStageModifiers,
  pickEndlessUpgradeChoices,
  resolveChallengeTier,
} from '../config/GameModeConfig';
import { CAMPAIGN_LEVELS, LevelDefinition } from '../config/LevelConfig';
import { SHIPS } from '../config/ShipConfig';
import { SpecialId, SPECIAL_ATTACKS, WeaponId, WEAPONS, WEAPON_LIST, getWeaponDamageAtLevel } from '../config/WeaponConfig';
import { SoundManager } from '../audio/SoundManager';
import { type BossCombatModifiers, BossEntity } from '../entities/Boss';
import { DroneManager } from '../entities/DroneManager';
import { EnemyEntity } from '../entities/Enemy';
import { Player, SpecialActivatedPayload } from '../entities/Player';
import { BeamHitMeta, ProjectileManager } from '../entities/ProjectileManager';
import { QuantumClone } from '../entities/QuantumClone';
import { allocateEnemyAttackId, Targetable } from '../entities/Targetable';
import { BackgroundSystem } from '../systems/BackgroundSystem';
import { CombatSystem } from '../systems/CombatSystem';
import { PassiveSystem, PassiveTarget } from '../systems/PassiveSystem';
import { computePlayerStats, ProgressionManager } from '../systems/ProgressionManager';
import { WaveDirector, type WaveModifiers } from '../systems/WaveDirector';
import { generateAllTextures } from '../textures/TextureGenerator';
import { EventBus, BossPosePayload } from '../utils/EventBus';
import { StorageManager } from '../utils/StorageManager';

export interface GameSceneData {
  mode?: GameMode;
  levelNumber: number;
  campaignDifficulty?: CampaignDifficulty;
  challengeId?: string;
  challengeDifficulty?: ChallengeDifficulty;
  weaponId?: WeaponId;
  specialId?: SpecialId;
  carryScore?: number;
}

export class GameScene extends Phaser.Scene {
  private mode: GameMode = 'campaign';
  private campaignDifficulty: CampaignDifficulty = 'easy';
  private challengeDef: ChallengeDefinition | null = null;
  private challengeDifficulty: ChallengeDifficulty = 'Standard';
  private challengeTier: ChallengeTierConfig | null = null;
  private levelDef!: LevelDefinition;
  private bg!: BackgroundSystem;
  private player!: Player;
  private passiveSystem: PassiveSystem | null = null;
  private quantumClone: QuantumClone | null = null;
  private ghostDecoySprite: Phaser.GameObjects.Sprite | null = null;
  private ghostDecoyGfx: Phaser.GameObjects.Graphics | null = null;
  private drones: DroneManager | null = null;
  private projectiles!: ProjectileManager;
  private waveDirector!: WaveDirector;
  private combat!: CombatSystem;
  private boss: BossEntity | null = null;

  private score = 0;
  private combo = 1;
  private enemiesDefeated = 0;
  private bossSpawned = false;
  private activeEndlessBossWave = 0;
  private inRunDraftModal = false;
  private bossRushIdx = 0;
  private levelEnding = false;
  private elapsedSurvivalSec = 0;
  private pendingSurvivalSec = 0;
  private pendingKills = 0;
  private pendingEliteKills = 0;
  private pendingPowerUps = 0;
  private pendingCrits = 0;
  private creditsEarnedRun = 0;
  private crystalsEarnedRun = 0;
  private expEarnedRun = 0;

  private escKey?: Phaser.Input.Keyboard.Key;
  private numberKeys: Phaser.Input.Keyboard.Key[] = [];
  private unsubs: Array<() => void> = [];
  private currentData: GameSceneData = { mode: 'campaign', levelNumber: 1 };
  private hudEmitTimerMs = 0;
  private cachedScreenShake = true;
  private cachedBalancedPerf = false;
  private cachedUnlockedWeapons: WeaponId[] = ['plasma'];
  private activeEnemiesBuf: EnemyEntity[] = [];
  private targetsBuf: Targetable[] = [];
  private specialVfxGfx: Phaser.GameObjects.Graphics | null = null;
  private chronoFreezeMs = 0;
  private gravityWell = {
    active: false,
    x: 0,
    y: 0,
    radius: 235,
    remainingMs: 0,
    maxDurationMs: 4200,
    tickTimerMs: 0,
    tickIntervalMs: 280,
    tickDamage: 34,
  };
  private lightningHazard = {
    enabled: false,
    intervalSec: 4.5,
    cooldownSec: 2.6,
    telegraphing: false,
    telegraphTimerSec: 0,
    telegraphDurationSec: 0.9,
    strikeX: 0,
    strikeY: 0,
    radiusPx: 46,
    flashTimerSec: 0,
  };
  private bossPoseScratch: BossPosePayload = {
    active: false,
    x: 0,
    y: 0,
    width: 160,
    height: 120,
    ageSec: 0,
    entering: false,
    viewportW: 1280,
    viewportH: 720,
  };

  private onWindowBlur = (): void => {
    this.input.keyboard?.resetKeys();
    this.player?.endDrag();
  };

  private onVisibilityChange = (): void => {
    if (document.hidden) {
      this.onWindowBlur();
    }
  };

  private toGameCoords(clientX: number, clientY: number): { x: number; y: number } {
    const canvas = this.sys.game.canvas;
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      return { x: clientX, y: clientY };
    }
    return {
      x: ((clientX - rect.left) / rect.width) * this.scale.width,
      y: ((clientY - rect.top) / rect.height) * this.scale.height,
    };
  }

  private onWindowPointerDown = (e: PointerEvent): void => {
    const target = e.target as HTMLElement | null;
    if (target?.closest('[data-hud-control="true"]')) {
      return;
    }
    SoundManager.unlock();
    if (this.scene.isPaused('GameScene') || this.levelEnding) return;
    const pos = this.toGameCoords(e.clientX, e.clientY);
    this.player?.startDrag(e.pointerId, pos.x, pos.y);
  };

  private onWindowPointerMove = (e: PointerEvent): void => {
    if (this.scene.isPaused('GameScene') || this.levelEnding) return;
    if (!this.player?.isDraggingPointer(e.pointerId)) return;
    const pos = this.toGameCoords(e.clientX, e.clientY);
    this.player.moveDrag(e.pointerId, pos.x, pos.y);
  };

  private onWindowPointerUp = (e: PointerEvent): void => {
    this.player?.endDrag(e.pointerId);
  };

  constructor() {
    super('GameScene');
  }

  create(data: GameSceneData): void {
    generateAllTextures(this);
    const saved = StorageManager.load();
    this.mode = data?.mode ?? 'campaign';
    const rawDiff = data?.campaignDifficulty ?? saved.selectedCampaignDifficulty ?? 'easy';
    this.campaignDifficulty =
      saved.campaignProgress[rawDiff]?.highestUnlockedLevel >= 1 ? rawDiff : 'easy';

    const resolvedChallenge =
      this.mode === 'challenge' && data?.challengeId
        ? resolveChallengeTier(data.challengeId, data.challengeDifficulty)
        : null;
    this.challengeDef = resolvedChallenge?.challenge ?? null;
    this.challengeTier = resolvedChallenge?.tier ?? null;
    this.challengeDifficulty = resolvedChallenge?.tier.difficulty ?? 'Standard';
    const activeRules: ChallengeRule | undefined =
      this.challengeTier?.rules ?? this.challengeDef?.rules;

    const baseLvlNum =
      this.mode === 'challenge' && activeRules
        ? activeRules.levelBase
        : data?.levelNumber ?? 1;

    const levelNumber = Phaser.Math.Clamp(baseLvlNum, 1, CAMPAIGN_LEVELS.length);
    this.levelDef = CAMPAIGN_LEVELS[levelNumber - 1];
    this.currentData = {
      mode: this.mode,
      levelNumber,
      campaignDifficulty: this.mode === 'campaign' ? this.campaignDifficulty : undefined,
      challengeId: this.challengeDef?.id,
      challengeDifficulty: this.mode === 'challenge' ? this.challengeDifficulty : undefined,
      weaponId: data?.weaponId ?? saved.selectedWeapon,
      specialId: data?.specialId ?? saved.selectedSpecial,
      carryScore: data?.carryScore ?? 0,
    };

    this.score = this.currentData.carryScore ?? 0;
    this.combo = 1;
    this.enemiesDefeated = 0;
    this.boss = null;
    this.bossSpawned = false;
    this.activeEndlessBossWave = 0;
    this.inRunDraftModal = false;
    this.bossRushIdx = 0;
    this.levelEnding = false;
    this.hudEmitTimerMs = 0;
    this.elapsedSurvivalSec = 0;
    this.pendingSurvivalSec = 0;
    this.pendingKills = 0;
    this.pendingEliteKills = 0;
    this.pendingPowerUps = 0;
    this.pendingCrits = 0;
    this.creditsEarnedRun = 0;
    this.crystalsEarnedRun = 0;
    this.expEarnedRun = 0;
    this.chronoFreezeMs = 0;
    this.gravityWell.active = false;
    this.gravityWell.remainingMs = 0;
    this.gravityWell.tickTimerMs = 0;
    this.lightningHazard = {
      enabled: Boolean(this.mode === 'challenge' && activeRules?.lightningProtocol),
      intervalSec: activeRules?.lightningIntervalSec ?? 4.5,
      cooldownSec: 2.5,
      telegraphing: false,
      telegraphTimerSec: 0,
      telegraphDurationSec: 0.9,
      strikeX: 0,
      strikeY: 0,
      radiusPx: 46,
      flashTimerSec: 0,
    };

    EventBus.emit('scene:changed', 'GameScene');
    EventBus.emit('boss:warning', null);

    const fxQuality = saved.settings.fxQuality;
    this.cachedScreenShake = saved.settings.screenShake;
    this.cachedBalancedPerf = saved.settings.performanceQuality === 'balanced';
    this.cachedUnlockedWeapons = [...saved.unlockedWeapons];
    this.bg = new BackgroundSystem(this, this.levelDef.environment, fxQuality);
    this.projectiles = new ProjectileManager(this);
    this.combat = new CombatSystem(this, fxQuality);
    this.specialVfxGfx = this.add.graphics().setDepth(14);

    let waveModifiers: WaveModifiers = {};
    if (this.mode === 'campaign') {
      const diffCfg = CAMPAIGN_DIFFICULTIES[this.campaignDifficulty];
      waveModifiers = {
        spawnIntervalMult: diffCfg.spawnIntervalMult,
        densityMult: diffCfg.densityMult,
        eliteChanceBonus: diffCfg.eliteChanceBonus,
        enemyMods: {
          hpMult: diffCfg.enemyHpMult,
          damageMult: diffCfg.enemyDamageMult,
          attackRateMult: diffCfg.enemyAttackRateMult,
          projectileSpeedMult: diffCfg.enemyProjectileSpeedMult,
        },
      };
    } else if (this.mode === 'challenge' && activeRules) {
      waveModifiers = {
        spawnIntervalMult: activeRules.spawnIntervalMult ?? 1,
        densityMult: activeRules.densityMult ?? 1,
        eliteChanceBonus: activeRules.eliteChanceBonus ?? 0,
        enemyMods: {
          hpMult: activeRules.enemyHpMult ?? 1,
          damageMult: activeRules.enemyDamageMult ?? 1,
          attackRateMult: activeRules.enemyAttackRateMult ?? 1,
          projectileSpeedMult: activeRules.enemyProjectileSpeedMult ?? 1,
        },
      };
    }

    this.waveDirector = new WaveDirector(
      this,
      this.levelDef,
      this.mode,
      (enemyClass) => ProgressionManager.recordEnemyEncounter(enemyClass),
      (waveNum) => this.handleWaveCleared(waveNum),
      (waveNum, phase) => this.handleWavePhaseStarted(waveNum, phase),
      waveModifiers
    );

    const stats = computePlayerStats(saved, activeRules);
    const allowedWeapons = activeRules?.allowedWeapons ?? null;
    const equippedEffects: EquipmentRarityEffect[] = [];
    (['offensive', 'defensive', 'utility', 'special'] as EquipmentSlot[]).forEach((slot) => {
      const eqId = saved.equippedGear[slot];
      if (!eqId || !saved.ownedEquipment[eqId]) return;
      const eqDef = EQUIPMENT_BY_ID[eqId];
      if (eqDef?.rarityEffect) {
        equippedEffects.push(eqDef.rarityEffect);
      }
    });

    const startX = this.scale.width * 0.5;
    const startY = this.scale.height * 0.8;

    this.player = new Player(
      this,
      startX,
      startY,
      this.currentData.weaponId!,
      this.currentData.specialId!,
      stats,
      saved.weaponLevels,
      allowedWeapons,
      equippedEffects,
      (label, colorHex) => {
        this.combat?.spawnFloatingLabel(this.player.x, this.player.y - 26, label, colorHex);
      }
    );

    this.passiveSystem = new PassiveSystem(stats.shipId, {
      getPlayerState: () => ({
        x: this.player.x,
        y: this.player.y,
        hp: this.player.hp,
        maxHp: this.player.maxHp,
        shield: this.player.shield,
        maxShield: this.player.maxShield,
      }),
      getWeaponBaseDamage: () =>
        Math.max(
          1,
          Math.round(
            getWeaponDamageAtLevel(WEAPONS[this.player.weaponId], this.player.weaponLevel) *
              this.player.getWeaponBaseDamageMult()
          )
        ),
      getTargets: () => this.fillAllTargets(),
      getScreenSize: () => ({
        width: this.scale.width,
        height: this.scale.height,
      }),
      restoreShield: (amount, label) => {
        const gained = this.player.restoreShield(amount);
        if (label) {
          this.combat.spawnFloatingLabel(this.player.x, this.player.y - 22, label, '#67E8F9');
        } else if (gained > 0) {
          this.combat.spawnFloatingLabel(
            this.player.x,
            this.player.y - 22,
            `+${gained} SHD`,
            '#67E8F9'
          );
        }
      },
      applyPassiveDamage: (target, dmg, label) => this.applyPassiveDamage(target, dmg, label),
      onExplosionAoe: (x, y, radiusPx, color, isHeavy) =>
        this.combat.spawnAoeShockwave(x, y, radiusPx, color, Boolean(isHeavy)),
      onLightningArcs: (points, color) =>
        this.projectiles.addLightningArc(points, true, false, color),
      onEnergyWave: (x, y, radiusPx, color) =>
        this.combat.spawnAoeShockwave(x, y, radiusPx, color, true),
      onAstralBeam: (x, y, color) => {
        this.projectiles.addVisualBeam(x, 0, x, y, color, 26, 0.28);
        this.combat.spawnExplosion(x, y, color, 16, 220, 1.15);
      },
      onAstralShardHit: (fromX, fromY, toX, toY) => {
        this.projectiles.addVisualBeam(fromX, fromY, toX, toY, 0xe879f9, 10, 0.16);
        this.combat.spawnExplosion(toX, toY, 0xf0abfc, 8, 150, 0.8);
      },
      onFloatingLabel: (x, y, text, colorHex) =>
        this.combat.spawnFloatingLabel(x, y, text, colorHex),
    });
    this.player.setPassiveSystem(this.passiveSystem);

    this.quantumClone =
      stats.shipId === 'nova_prime' ? new QuantumClone(this, startX - 46, startY + 18) : null;

    if (stats.shipId === 'phantom') {
      this.ghostDecoyGfx = this.add.graphics().setDepth(9).setVisible(false);
      this.ghostDecoySprite = this.add
        .sprite(-200, -200, 'ship_phantom')
        .setDepth(9)
        .setAlpha(0.58)
        .setTint(0x22d3ee)
        .setVisible(false);
    } else {
      this.ghostDecoyGfx = null;
      this.ghostDecoySprite = null;
    }

    this.drones = !activeRules?.disableDrones
      ? new DroneManager(this, saved.equippedDroneSlots, saved.ownedDrones, startX, startY)
      : null;

    if (this.mode === 'boss_rush') {
      SoundManager.playMusic('boss');
      this.time.delayedCall(600, () => {
        if (this.scene.isActive('GameScene')) {
          this.spawnBossEncounter(BOSS_RUSH_ORDER[0]);
        }
      });
    } else if (this.mode === 'endless') {
      SoundManager.playMusic('endless');
    } else {
      SoundManager.playMusic('gameplay');
    }

    if (this.input.keyboard) {
      this.escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
      this.numberKeys = [
        this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE),
        this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO),
        this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE),
        this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.FOUR),
        this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.FIVE),
        this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SIX),
      ];
    }

    window.addEventListener('blur', this.onWindowBlur);
    document.addEventListener('visibilitychange', this.onVisibilityChange);
    window.addEventListener('pointerdown', this.onWindowPointerDown, { passive: true });
    window.addEventListener('pointermove', this.onWindowPointerMove, { passive: true });
    window.addEventListener('pointerup', this.onWindowPointerUp);
    window.addEventListener('pointercancel', this.onWindowPointerUp);

    this.unsubs.push(
      EventBus.on('ui:select-weapon', (wId) => {
        const latest = StorageManager.load();
        if (!latest.unlockedWeapons.includes(wId)) return;
        if (this.player.setWeapon(wId)) {
          StorageManager.setWeapon(wId);
          this.emitHud();
        }
      }),
      EventBus.on('ui:select-special', (sId) => {
        this.player.setSpecial(sId);
        StorageManager.setSpecial(sId);
        this.emitHud();
      }),
      EventBus.on('ui:pause-game', () => {
        this.pauseGame();
      }),
      EventBus.on('ui:abort-mission', () => {
        this.inRunDraftModal = false;
        if (!this.levelEnding) {
          this.levelEnding = true;
          this.flushCombatProgress();
        }
        this.player?.endDrag();
        if (this.scene.isPaused('GameScene')) {
          this.scene.resume('GameScene');
        }
        if (this.scene.isActive('BossScene')) {
          this.scene.stop('BossScene');
        }
        if (this.scene.isActive('PauseMenuScene')) {
          this.scene.stop('PauseMenuScene');
        }
        this.scene.start('MainMenuScene');
      }),
      EventBus.on('ui:select-endless-upgrade', (statId) => {
        if (!this.inRunDraftModal || this.mode !== 'endless' || this.levelEnding) return;
        const delta = this.player.applyEndlessUpgrade(statId);
        this.inRunDraftModal = false;
        this.scene.resume('GameScene');
        if (delta > 0) {
          const spec = ENDLESS_UPGRADE_SPECS[statId];
          this.combat.spawnFloatingLabel(
            this.player.x,
            this.player.y - 30,
            `${spec.label.toUpperCase()} UP!`,
            spec.accentHex
          );
        }
        this.emitHud();
      }),
      EventBus.on('ui:select-boss-rush-recovery', (recoveryId) => {
        if (!this.inRunDraftModal || this.mode !== 'boss_rush' || this.levelEnding) return;
        const opt = BOSS_RUSH_RECOVERY_BY_ID[recoveryId];
        if (opt) {
          if (opt.hpRestoreRatio > 0) {
            const gainedHp = this.player.healHp(Math.round(this.player.maxHp * opt.hpRestoreRatio));
            if (gainedHp > 0) {
              this.combat.spawnFloatingLabel(
                this.player.x,
                this.player.y - 26,
                `+${gainedHp} HP`,
                '#34D399'
              );
            }
          }
          if (opt.shieldRestoreRatio > 0) {
            const gainedShd = this.player.restoreShield(
              Math.round(this.player.maxShield * opt.shieldRestoreRatio)
            );
            if (gainedShd > 0) {
              this.combat.spawnFloatingLabel(
                this.player.x,
                this.player.y - 44,
                `+${gainedShd} SHD`,
                '#38BDF8'
              );
            }
          }
        }
        this.inRunDraftModal = false;
        this.bossRushIdx++;
        this.scene.resume('GameScene');
        this.emitHud();

        this.time.delayedCall(750, () => {
          if (this.scene.isActive('GameScene') && !this.levelEnding) {
            this.spawnBossEncounter(BOSS_RUSH_ORDER[this.bossRushIdx]);
          }
        });
      }),
      EventBus.on('ui:trigger-dash', () => {
        if (this.scene.isPaused('GameScene') || this.levelEnding || this.inRunDraftModal) return;
        this.player.triggerDash();
        this.emitHud();
      }),
      EventBus.on('ui:trigger-special', () => {
        if (this.scene.isPaused('GameScene') || this.levelEnding || this.inRunDraftModal) return;
        this.triggerPlayerSpecial();
        this.emitHud();
      }),
      EventBus.on('settings:updated', (next) => {
        this.cachedScreenShake = next.screenShake;
        this.cachedBalancedPerf = next.performanceQuality === 'balanced';
        this.combat?.setFxQuality(next.fxQuality);
      }),
      EventBus.on('progress:updated', () => {
        this.cachedUnlockedWeapons = [...StorageManager.load().unlockedWeapons];
      })
    );

    this.scale.on('resize', this.handleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanup, this);
    this.emitHud();
  }

  private shakeCamera(durationMs: number, intensity: number): void {
    if (!this.cachedScreenShake) return;
    this.cameras.main.shake(durationMs, intensity);
  }

  private handleResize(gameSize: Phaser.Structs.Size): void {
    this.bg?.resize(gameSize.width, gameSize.height);
  }

  private pauseGame(): void {
    if (this.levelEnding || this.inRunDraftModal || this.scene.isPaused('GameScene')) return;
    this.player?.endDrag();
    if (this.scene.isActive('BossScene')) {
      this.scene.pause('BossScene');
    }
    this.scene.pause('GameScene');
    this.scene.launch('PauseMenuScene', { levelData: this.currentData });
  }

  private triggerPlayerSpecial(): void {
    const targets = this.fillAllTargets();
    this.player.tryTriggerSpecial(
      this.projectiles,
      targets,
      (t, dmg, isCrit, hitMeta) => this.applyDirectDamage(t, dmg, isCrit, hitMeta),
      (intensity) => this.shakeCamera(220, intensity),
      (payload) => this.handleSpecialActivated(payload)
    );
  }

  private handleSpecialActivated(payload: SpecialActivatedPayload): void {
    if (payload.id === 'chrono_singularity') {
      this.chronoFreezeMs = payload.def.durationMs ?? 3600;
      this.boss?.setChronoPaused(true);
      this.combat.spawnFloatingLabel(this.player.x, this.player.y - 34, 'CHRONO STASIS', '#C084FC');
      return;
    }

    if (payload.id === 'gravity_well') {
      const w = this.scale.width;
      const h = this.scale.height;
      const wellX = w * 0.5;
      const wellY = Math.max(145, Math.min(220, h * 0.28));
      this.gravityWell.active = true;
      this.gravityWell.x = wellX;
      this.gravityWell.y = wellY;
      this.gravityWell.radius = payload.def.radiusPx ?? 235;
      this.gravityWell.maxDurationMs = payload.def.durationMs ?? 4200;
      this.gravityWell.remainingMs = this.gravityWell.maxDurationMs;
      this.gravityWell.tickIntervalMs = payload.def.tickIntervalMs ?? 280;
      this.gravityWell.tickTimerMs = 80; // fast initial gravity pulse
      this.gravityWell.tickDamage = payload.damage;
      this.combat.spawnFloatingLabel(wellX, wellY - 26, 'GRAVITY WELL', '#F59E0B');
    }
  }

  private fillAllTargets(): Targetable[] {
    this.waveDirector.fillActiveEnemies(this.activeEnemiesBuf);
    this.targetsBuf.length = 0;
    for (let i = 0; i < this.activeEnemiesBuf.length; i++) {
      this.targetsBuf.push(this.activeEnemiesBuf[i]);
    }
    if (this.boss && this.boss.active) {
      this.targetsBuf.push(this.boss);
    }
    return this.targetsBuf;
  }

  private applyPassiveDamage(target: PassiveTarget, dmg: number, label?: string): void {
    if (!target.active) return;
    const t = target as Targetable;
    this.combat.spawnExplosion(t.x, t.y, 0x38bdf8, 5, 115, 0.65);
    this.combat.spawnDamageNumber(t.x, t.y, dmg, false);
    if (label) {
      this.combat.spawnFloatingLabel(t.x, t.y - 16, label, '#FACC15');
    }
    const killed = t.takeDamage(dmg);
    if (killed && 'def' in t && 'scoreReward' in t) {
      this.handleEnemyKilled(t as EnemyEntity);
    }
  }

  private applyDirectDamage(
    target: Targetable,
    dmg: number,
    isCrit = false,
    hitMeta?: BeamHitMeta,
    cloneActionId = 0
  ): void {
    if (!target.active) return;
    let finalDmg = dmg;
    if (this.passiveSystem && hitMeta) {
      if (hitMeta.source === 'player_weapon') {
        finalDmg = this.passiveSystem.resolvePlayerWeaponHitDamage(target, dmg, {
          source: 'player_weapon',
          firingActionId: hitMeta.firingActionId,
          countsForFiringAction: hitMeta.countsForFiringAction,
          isCrit,
        });
      } else if (hitMeta.source === 'clone') {
        finalDmg = this.passiveSystem.resolveCloneWeaponHitDamage(target, dmg, {
          cloneActionId,
          countsForFiringAction: hitMeta.countsForFiringAction,
        });
      }
    }

    this.combat.spawnExplosion(
      target.x,
      target.y,
      hitMeta?.source === 'clone' ? 0x818cf8 : isCrit ? 0xfacc15 : 0x38bdf8,
      4,
      90,
      0.55
    );
    this.combat.spawnDamageNumber(target.x, target.y, finalDmg, isCrit);
    if (isCrit) {
      this.pendingCrits += 1;
      this.player.notifyCritLanded();
      SoundManager.playCritHit();
    } else {
      SoundManager.playHit();
    }
    const killed = target.takeDamage(finalDmg);
    const isEnemy = 'def' in target && 'scoreReward' in target;
    if (killed && isEnemy) {
      this.handleEnemyKilled(target as EnemyEntity);
    }

    if (this.passiveSystem && hitMeta) {
      if (hitMeta.source === 'player_weapon' || hitMeta.source === 'special') {
        this.passiveSystem.onPlayerWeaponHitPostDamage(target, finalDmg, killed, {
          source: hitMeta.source,
          firingActionId: hitMeta.firingActionId,
          countsForFiringAction: hitMeta.countsForFiringAction,
          isCrit,
        });
      } else if (hitMeta.source === 'clone') {
        this.passiveSystem.onCloneWeaponHitPostDamage(target, {
          cloneActionId,
          countsForFiringAction: hitMeta.countsForFiringAction,
        });
      }
    }
  }

  private flushCombatProgress(completedLevel?: number): void {
    if (
      this.pendingKills === 0 &&
      this.pendingEliteKills === 0 &&
      this.pendingPowerUps === 0 &&
      this.pendingCrits === 0 &&
      this.pendingSurvivalSec < 1 &&
      !completedLevel
    ) {
      return;
    }

    this.expEarnedRun += ProgressionManager.recordCombatProgress({
      kills: this.pendingKills,
      eliteKills: this.pendingEliteKills,
      powerUps: this.pendingPowerUps,
      crits: this.pendingCrits,
      survivalSec: Math.floor(this.pendingSurvivalSec),
      weaponId: this.player.weaponId,
      runScore: this.score,
      completedLevel,
      shipUsed: this.player.stats.shipId,
    });

    this.pendingKills = 0;
    this.pendingEliteKills = 0;
    this.pendingPowerUps = 0;
    this.pendingCrits = 0;
    this.pendingSurvivalSec = this.pendingSurvivalSec % 1;
  }

  private handleEnemyKilled(enemy: EnemyEntity): void {
    if (!enemy.claimKillReward()) return;

    this.enemiesDefeated++;
    this.pendingKills++;
    this.player.notifyEnemyKilled();
    if (
      enemy.def.id === 'elite' ||
      enemy.def.id === 'tank' ||
      enemy.def.id === 'bastion' ||
      enemy.def.id === 'harbinger'
    ) {
      this.pendingEliteKills++;
    }

    this.score += enemy.scoreReward * this.combo;

    const activeDiff =
      this.mode === 'endless'
        ? getEndlessDifficulty(this.waveDirector.currentWaveIdx)
        : this.levelDef.difficultyMultiplier;
    const creditGain = getEnemyCreditDrop(
      enemy.def.id,
      activeDiff,
      this.player.getEffectiveCreditBonusMult()
    );
    this.creditsEarnedRun += creditGain;

    const isHeavy =
      enemy.def.id === 'tank' ||
      enemy.def.id === 'elite' ||
      enemy.def.id === 'bomber' ||
      enemy.def.id === 'bastion' ||
      enemy.def.id === 'harbinger' ||
      enemy.def.id === 'splitter';
    SoundManager.playExplosion(isHeavy ? 'medium' : 'small');
    this.combat.spawnExplosion(
      enemy.x,
      enemy.y,
      enemy.def.accentColor,
      isHeavy ? 20 : 12,
      isHeavy ? 260 : 190,
      isHeavy ? 1.25 : 0.9
    );
    if (isHeavy) {
      this.combat.hitstopMs = GAME_CONSTANTS.HITSTOP_LIGHT_MS;
      this.shakeCamera(110, 0.005);
    }
    this.combat.maybeDropPowerUp(enemy.x, enemy.y, false);

    // Check Challenge kill target completion
    const activeTargetKills = this.challengeTier?.rules.targetKills ?? this.challengeDef?.rules.targetKills;
    if (
      this.mode === 'challenge' &&
      activeTargetKills &&
      this.enemiesDefeated >= activeTargetKills &&
      !this.levelEnding
    ) {
      this.levelEnding = true;
      this.time.delayedCall(500, () => this.completeChallenge(true));
    }
  }

  private spawnBossEncounter(bossId: BossId): void {
    if (this.boss && this.boss.active) return;
    this.bossSpawned = true;
    ProgressionManager.recordBossEncounter(bossId);
    SoundManager.playMusic('boss');

    let bossHpMult = 1;
    let bossCombatMods: BossCombatModifiers = {};

    if (this.mode === 'campaign') {
      const diffCfg = CAMPAIGN_DIFFICULTIES[this.campaignDifficulty];
      bossHpMult = diffCfg.bossHpMult;
      bossCombatMods = {
        damageMult: diffCfg.bossDamageMult,
        attackRateMult: diffCfg.bossAggressionMult,
        projectileSpeedMult: diffCfg.enemyProjectileSpeedMult,
        aggressionMult: diffCfg.bossAggressionMult,
      };
    } else if (this.mode === 'endless') {
      const endlessWaveNum =
        this.activeEndlessBossWave || Math.max(5, this.waveDirector.currentWaveIdx + 1);
      const endlessBossTier = Math.max(1, Math.floor(endlessWaveNum / 5));
      bossHpMult = getEndlessBossHpMult(endlessWaveNum);
      bossCombatMods = {
        damageMult: Math.min(1.85, 1 + (endlessBossTier - 1) * 0.08),
        attackRateMult: Math.min(1.4, 1 + (endlessBossTier - 1) * 0.05),
        projectileSpeedMult: Math.min(1.25, 1 + (endlessBossTier - 1) * 0.03),
        aggressionMult: Math.min(1.35, 1 + (endlessBossTier - 1) * 0.04),
      };
    } else if (this.mode === 'challenge' && this.challengeTier) {
      const rules = this.challengeTier.rules;
      bossHpMult = rules.bossHpMult ?? 1;
      bossCombatMods = {
        damageMult: rules.bossDamageMult ?? 1,
        attackRateMult: rules.bossAggressionMult ?? 1,
        projectileSpeedMult: rules.enemyProjectileSpeedMult ?? 1,
        aggressionMult: rules.bossAggressionMult ?? 1,
      };
    } else if (this.mode === 'boss_rush') {
      const rushMods = getBossRushStageModifiers(this.bossRushIdx);
      bossHpMult = rushMods.hpMult;
      bossCombatMods = {
        damageMult: rushMods.damageMult,
        attackRateMult: rushMods.attackRateMult,
        projectileSpeedMult: rushMods.projectileSpeedMult,
        aggressionMult: rushMods.aggressionMult,
      };
    }

    this.scene.launch('BossScene', { bossId });
    this.boss = new BossEntity(
      this,
      bossId,
      (enemyClass, x, y) => this.waveDirector.spawnDirectMinion(enemyClass, x, y),
      () => {
        if (this.boss) {
          this.combat.maybeDropPowerUp(this.boss.x, this.boss.y + 30, true);
        }
      },
      (defeatedBoss) => this.handleBossDefeated(defeatedBoss),
      bossHpMult,
      bossCombatMods
    );
    this.emitBossPose();
    this.emitHud();
  }

  private emitBossPose(): void {
    const active = Boolean(this.boss && this.boss.active);
    this.bossPoseScratch.active = active;
    if (active && this.boss) {
      this.bossPoseScratch.x = this.boss.x;
      this.bossPoseScratch.y = this.boss.y;
      this.bossPoseScratch.width = this.boss.def.width;
      this.bossPoseScratch.height = this.boss.def.height;
      this.bossPoseScratch.ageSec = this.boss.ageSec;
      this.bossPoseScratch.entering = this.boss.entering;
    }
    this.bossPoseScratch.viewportW = this.scale.width;
    this.bossPoseScratch.viewportH = this.scale.height;
    EventBus.emit('boss:pose', this.bossPoseScratch);
  }

  private handleWavePhaseStarted(_waveNum: number, _phase: 1 | 2): void {
    if (this.levelEnding) return;
    this.emitHud();
  }

  private handleWaveCleared(waveNum: number): void {
    if (this.levelEnding) return;

    if (this.combo < 5) {
      this.combo = Math.min(5, this.combo + 1);
      this.combat?.spawnFloatingLabel(
        this.player.x,
        this.player.y - 12,
        `SCORE ${this.combo}x!`,
        '#38BDF8'
      );
      this.emitHud();
    }

    if (this.mode === 'endless') {
      const waveReward = getEndlessWaveReward(waveNum, this.player.getEffectiveCreditBonusMult());
      this.creditsEarnedRun += waveReward.credits;
      this.crystalsEarnedRun += waveReward.crystals;
      this.expEarnedRun += ProgressionManager.recordCombatProgress({
        survivalWaves: 1,
        runScore: this.score,
      });
      // Endless milestone boss every 5 waves (must be defeated before next wave begins)
      if (waveNum % 5 === 0 && !this.boss) {
        this.activeEndlessBossWave = waveNum;
        const bossPool = BOSS_RUSH_ORDER;
        const bId = bossPool[(Math.floor(waveNum / 5) - 1) % bossPool.length];
        this.spawnBossEncounter(bId);
      }
    }
  }

  private resetScoreMultiplierOnHpLoss(): void {
    if (this.combo > 1) {
      this.combo = 1;
      this.combat?.spawnFloatingLabel(
        this.player.x,
        this.player.y - 10,
        'MULTIPLIER 1x',
        '#FB7185'
      );
    }
    this.emitHud();
  }

  private handleBossDefeated(boss: BossEntity): void {
    if (this.levelEnding) return;

    this.score += boss.def.scoreReward * this.combo;
    const endlessBossWave =
      this.activeEndlessBossWave || Math.max(5, Math.floor((this.waveDirector.currentWaveIdx + 1) / 5) * 5);
    const endlessBossTier =
      this.mode === 'endless' ? Math.max(1, Math.floor(endlessBossWave / 5)) : 1;
    const bossReward = getBossCombatReward(
      boss.def.id,
      this.mode,
      this.player.getEffectiveCreditBonusMult(),
      endlessBossTier
    );
    this.creditsEarnedRun += bossReward.credits;
    this.crystalsEarnedRun += bossReward.crystals;

    this.expEarnedRun += ProgressionManager.recordCombatProgress({
      bossDefeatedId: boss.def.id,
      runScore: this.score,
    });

    SoundManager.playExplosion('boss');
    this.shakeCamera(550, 0.018);

    // Endless Mode boss defeat continues survival loop cleanly & triggers Upgrade Draft every 10 waves!
    if (this.mode === 'endless') {
      this.combat.spawnExplosion(boss.x, boss.y, boss.def.primaryColor, 28, 320, 1.5);
      this.combat.maybeDropPowerUp(boss.x, boss.y + 20, true);
      boss.destroy();
      this.boss = null;
      this.bossSpawned = false;
      this.activeEndlessBossWave = 0;
      SoundManager.playMusic('endless');

      if (endlessBossWave >= 10 && endlessBossWave % 10 === 0) {
        const choices = pickEndlessUpgradeChoices(this.player.getEndlessBonuses(), 3);
        if (choices.length > 0) {
          this.projectiles.clearEnemyBullets();
          this.inRunDraftModal = true;
          this.player?.endDrag();
          this.emitHud();
          this.scene.pause('GameScene');
          EventBus.emit('endless:upgrade-draft', {
            waveCompleted: endlessBossWave,
            choices,
          });
        }
      }
      return;
    }

    // Boss Rush Mode: pause between bosses 1..4 for interactive Tactical Recovery Draft (never auto-heal)
    if (this.mode === 'boss_rush' && this.bossRushIdx < BOSS_RUSH_ORDER.length - 1) {
      const defeatedBossName = boss.def.name;
      this.projectiles.clearEnemyBullets();
      this.waveDirector.clearAll();
      this.combat.spawnExplosion(boss.x, boss.y, boss.def.primaryColor, 28, 300, 1.5);
      boss.destroy();
      this.boss = null;
      this.bossSpawned = false;

      const nextBossId = BOSS_RUSH_ORDER[this.bossRushIdx + 1];
      this.inRunDraftModal = true;
      this.player?.endDrag();
      this.emitHud();
      this.scene.pause('GameScene');
      EventBus.emit('boss_rush:recovery-draft', {
        defeatedBossNumber: this.bossRushIdx + 1,
        totalBosses: BOSS_RUSH_ORDER.length,
        defeatedBossName,
        nextBossName: BOSS_CONFIGS[nextBossId].name,
        currentHp: Math.ceil(this.player.hp),
        maxHp: this.player.maxHp,
        currentShield: Math.ceil(this.player.shield),
        maxShield: this.player.maxShield,
      });
      return;
    }

    // Campaign Boss or Final Challenge/Boss Rush Boss defeated
    this.levelEnding = true;
    this.projectiles.clearEnemyBullets();
    this.waveDirector.clearAll();

    for (let i = 0; i < 6; i++) {
      this.time.delayedCall(i * 180, () => {
        if (!this.scene.isActive('GameScene')) return;
        const ox = boss.x + (Math.random() - 0.5) * 120;
        const oy = boss.y + (Math.random() - 0.5) * 80;
        this.combat.spawnExplosion(ox, oy, i % 2 === 0 ? boss.def.primaryColor : 0xfef08a, 24, 300, 1.5);
        SoundManager.playExplosion('medium');
      });
    }

    this.time.delayedCall(1250, () => {
      const defeatedName = boss.def.name;
      boss.destroy();
      this.boss = null;

      if (this.mode === 'challenge') {
        this.completeChallenge(true, defeatedName);
      } else if (this.mode === 'boss_rush') {
        this.completeBossRush();
      } else {
        this.completeCampaignLevel(defeatedName);
      }
    });
  }

  private completeCampaignLevel(bossDefeatedName: string | null): void {
    const diffCfg = CAMPAIGN_DIFFICULTIES[this.campaignDifficulty];
    const bonusScore = this.levelDef.levelNumber * 1000 + Math.round(this.player.hp * 15);
    const finalLevelScore = Math.round((this.score + bonusScore) * diffCfg.scoreMult);
    const clearReward = getCampaignClearReward(
      this.levelDef.levelNumber,
      Boolean(this.levelDef.bossId),
      false,
      this.player.getEffectiveCreditBonusMult(),
      this.campaignDifficulty
    );
    this.creditsEarnedRun += clearReward.clearCredits;
    this.crystalsEarnedRun += clearReward.clearCrystals;

    this.flushCombatProgress(this.levelDef.levelNumber);
    const granted = ProgressionManager.recordRunReward({
      mode: 'campaign',
      creditsEarned: this.creditsEarnedRun,
      crystalsEarned: this.crystalsEarnedRun,
      score: finalLevelScore,
      kills: this.enemiesDefeated,
      levelNumber: this.levelDef.levelNumber,
      campaignDifficulty: this.campaignDifficulty,
      shipUsed: this.player.stats.shipId,
    });
    this.expEarnedRun += granted.expGranted;

    const nextDef = CAMPAIGN_LEVELS[this.levelDef.levelNumber] ?? null;
    const rewardText = formatSectorRewardText(
      this.levelDef.levelNumber,
      CAMPAIGN_LEVELS.length,
      Boolean(this.levelDef.bossId),
      nextDef?.name,
      this.campaignDifficulty
    );

    SoundManager.playVictory();
    SoundManager.playMusic('victory');

    if (this.levelDef.levelNumber >= CAMPAIGN_LEVELS.length) {
      this.scene.start('VictoryScene', {
        mode: 'campaign',
        campaignDifficulty: this.campaignDifficulty,
        unlockedNextDifficulty: granted.unlockedNextDifficulty,
        finalScore: finalLevelScore,
        enemiesDefeated: this.enemiesDefeated,
        creditsEarned: granted.creditsGranted,
        crystalsEarned: granted.crystalsGranted,
        expEarned: this.expEarnedRun,
      });
    } else {
      this.scene.start('LevelResultScene', {
        mode: 'campaign',
        campaignDifficulty: this.campaignDifficulty,
        levelNumber: this.levelDef.levelNumber,
        levelName: this.levelDef.name,
        score: finalLevelScore,
        bonusScore,
        enemiesDefeated: this.enemiesDefeated,
        bossDefeatedName,
        rewardText,
        creditsEarned: granted.creditsGranted,
        crystalsEarned: granted.crystalsGranted,
        expEarned: this.expEarnedRun,
        nextLevelNumber: this.levelDef.levelNumber + 1,
        unlockedNextDifficulty: granted.unlockedNextDifficulty,
        weaponId: this.player.weaponId,
        specialId: this.player.specialId,
      });
    }
  }

  private completeChallenge(won: boolean, bossDefeatedName: string | null = null): void {
    const chal = this.challengeDef!;
    const tierObj = this.challengeTier?.objective ?? chal.objective;
    this.flushCombatProgress();
    const bonusScore = won ? 2500 + Math.round(this.player.hp * 20) : 0;
    const finalScore = this.score + bonusScore;

    const granted = ProgressionManager.recordRunReward({
      mode: 'challenge',
      creditsEarned: this.creditsEarnedRun,
      crystalsEarned: this.crystalsEarnedRun,
      score: finalScore,
      kills: this.enemiesDefeated,
      challengeId: chal.id,
      challengeDifficulty: this.challengeDifficulty,
      challengeCompleted: won,
      shipUsed: this.player.stats.shipId,
    });
    this.expEarnedRun += granted.expGranted;

    SoundManager.playVictory();
    SoundManager.playMusic('victory');
    this.scene.start('LevelResultScene', {
      mode: 'challenge',
      challengeId: chal.id,
      challengeDifficulty: this.challengeDifficulty,
      levelNumber: this.levelDef.levelNumber,
      levelName: chal.title,
      score: finalScore,
      bonusScore,
      enemiesDefeated: this.enemiesDefeated,
      bossDefeatedName,
      rewardText: `${this.challengeDifficulty} Clear · ${tierObj}`,
      creditsEarned: granted.creditsGranted,
      crystalsEarned: granted.crystalsGranted,
      expEarned: this.expEarnedRun,
      nextLevelNumber: null,
      weaponId: this.player.weaponId,
      specialId: this.player.specialId,
    });
  }

  private completeBossRush(): void {
    this.flushCombatProgress();
    const bonusScore = 6000 + Math.round(this.player.hp * 30);
    const finalScore = this.score + bonusScore;
    const performance = calculateBossRushPerformanceBonus({
      hpRatio: this.player.hp / Math.max(1, this.player.maxHp),
      clearTimeSec: this.elapsedSurvivalSec,
      score: finalScore,
    });
    const granted = ProgressionManager.recordRunReward({
      mode: 'boss_rush',
      creditsEarned: this.creditsEarnedRun,
      crystalsEarned: this.crystalsEarnedRun,
      score: finalScore,
      kills: this.enemiesDefeated,
      bossRushCleared: true,
      bossRushElapsedSec: this.elapsedSurvivalSec,
      bossRushPerformance: performance,
      shipUsed: this.player.stats.shipId,
    });
    this.expEarnedRun += granted.expGranted;

    SoundManager.playVictory();
    SoundManager.playMusic('victory');
    this.scene.start('VictoryScene', {
      mode: 'boss_rush',
      finalScore,
      enemiesDefeated: this.enemiesDefeated,
      creditsEarned: granted.creditsGranted,
      crystalsEarned: granted.crystalsGranted,
      expEarned: this.expEarnedRun,
      bossRushPerformance: performance,
    });
  }

  private triggerGameOver(): void {
    if (this.levelEnding) return;
    this.levelEnding = true;
    this.inRunDraftModal = false;
    SoundManager.playExplosion('boss');
    SoundManager.playDefeat();
    SoundManager.playMusic('gameover');
    this.combat.spawnExplosion(this.player.x, this.player.y, 0xf43f5e, 32, 320, 1.6);
    this.shakeCamera(420, 0.018);
    this.player.sprite.setVisible(false);

    this.flushCombatProgress();
    const salvageCredits = Math.round(
      this.creditsEarnedRun * ECONOMY_CAPS.defeatCreditSalvageRatio
    );
    const granted = ProgressionManager.recordRunReward({
      mode: this.mode,
      creditsEarned: salvageCredits,
      crystalsEarned: this.crystalsEarnedRun,
      score: this.score,
      kills: this.enemiesDefeated,
      campaignDifficulty: this.mode === 'campaign' ? this.campaignDifficulty : undefined,
      challengeId: this.mode === 'challenge' ? this.challengeDef?.id : undefined,
      challengeDifficulty: this.mode === 'challenge' ? this.challengeDifficulty : undefined,
      endlessWave: this.mode === 'endless' ? this.waveDirector.currentWaveIdx + 1 : undefined,
      shipUsed: this.player.stats.shipId,
    });
    this.expEarnedRun += granted.expGranted;

    if (this.scene.isActive('BossScene')) {
      this.scene.stop('BossScene');
    }

    this.time.delayedCall(900, () => {
      this.scene.start('GameOverScene', {
        mode: this.mode,
        campaignDifficulty: this.mode === 'campaign' ? this.campaignDifficulty : undefined,
        challengeId: this.challengeDef?.id,
        challengeDifficulty: this.mode === 'challenge' ? this.challengeDifficulty : undefined,
        levelNumber: this.levelDef.levelNumber,
        levelName:
          this.mode === 'endless'
            ? 'Endless Survival'
            : this.mode === 'boss_rush'
            ? 'Boss Rush Gauntlet'
            : this.challengeDef?.title ?? this.levelDef.name,
        score: this.score,
        waveReached: this.waveDirector.currentWaveIdx + 1,
        totalWaves: this.waveDirector.totalWaves,
        enemiesDefeated: this.enemiesDefeated,
        creditsEarned: granted.creditsGranted,
        crystalsEarned: granted.crystalsGranted,
        expEarned: this.expEarnedRun,
        weaponId: this.player.weaponId,
        specialId: this.player.specialId,
      });
    });
  }

  update(_time: number, rawDelta: number): void {
    const dt = Math.min(rawDelta / 1000, GAME_CONSTANTS.MAX_DELTA_SEC);

    if (this.escKey && Phaser.Input.Keyboard.JustDown(this.escKey)) {
      this.pauseGame();
      return;
    }

    // Weapon hotkey switching (1-6) respecting unlocked weapons & Challenge restrictions
    for (let i = 0; i < this.numberKeys.length; i++) {
      if (Phaser.Input.Keyboard.JustDown(this.numberKeys[i])) {
        const wDef = WEAPON_LIST[i];
        if (wDef && this.cachedUnlockedWeapons.includes(wDef.id)) {
          if (this.player.setWeapon(wDef.id)) {
            SoundManager.playWeaponSwitch();
            StorageManager.setWeapon(wDef.id);
          }
        }
      }
    }

    // Brief hitstop on heavy impacts
    if (this.combat.hitstopMs > 0) {
      this.combat.hitstopMs = Math.max(0, this.combat.hitstopMs - rawDelta);
      this.bg.update(dt * 0.2);
      return;
    }

    this.bg.update(dt);

    if (this.levelEnding) {
      this.combat.updateParticlesAndPowerUps(
        dt,
        this.player,
        this.projectiles,
        [],
        () => {},
        () => {}
      );
      this.emitHud();
      return;
    }

    // Track real survival seconds & flush periodically every 10s
    this.elapsedSurvivalSec += dt;
    this.pendingSurvivalSec += dt;
    if (this.pendingSurvivalSec >= 10) {
      this.flushCombatProgress();
    }

    // Challenge timed survival completion check
    const activeTimeLimitSec =
      this.challengeTier?.rules.timeLimitSec ?? this.challengeDef?.rules.timeLimitSec;
    if (
      this.mode === 'challenge' &&
      activeTimeLimitSec &&
      this.elapsedSurvivalSec >= activeTimeLimitSec
    ) {
      this.levelEnding = true;
      this.completeChallenge(true);
      return;
    }

    const targets = this.fillAllTargets();

    // Selective Chrono Singularity timer update
    const wasChronoFrozen = this.chronoFreezeMs > 0;
    if (wasChronoFrozen) {
      this.chronoFreezeMs = Math.max(0, this.chronoFreezeMs - rawDelta);
      if (this.chronoFreezeMs <= 0) {
        this.boss?.setChronoPaused(false);
      }
    }
    const isChronoFrozen = this.chronoFreezeMs > 0;

    // Update Player & PassiveSystem (always runs at full speed even during Chrono Singularity)
    this.player.update(
      dt,
      this.projectiles,
      targets,
      (t, dmg, isCrit, hitMeta) => this.applyDirectDamage(t, dmg, isCrit, hitMeta),
      () => {},
      (intensity) => this.shakeCamera(180, intensity),
      (t) => this.combat.spawnStunRing(t.x, t.y),
      (payload) => this.handleSpecialActivated(payload)
    );

    this.passiveSystem?.update(dt);

    // Update Nova Prime Quantum Clone
    this.quantumClone?.update(
      dt,
      this.player,
      this.projectiles,
      targets,
      () => this.passiveSystem?.beginCloneFiringAction() ?? 0,
      (t, dmg, cloneActionId, countsForFiringAction) =>
        this.applyDirectDamage(
          t,
          dmg,
          false,
          { source: 'clone', firingActionId: 0, countsForFiringAction },
          cloneActionId
        )
    );

    // Update Companion Drones (incl. Prism Drone adaptive evaluation)
    const activeEnemiesPre = this.waveDirector.fillActiveEnemies(this.activeEnemiesBuf);
    this.drones?.update(dt, this.player, this.projectiles, targets, () => this.player.rollCrit(), {
      dronePowerBonusPct: this.player.stats.dronePowerBonusPct,
      activeEnemyCount: activeEnemiesPre.length,
      enemyBulletCount: this.projectiles.getActiveEnemyBulletCount(),
      activeDropCount: this.combat.getActivePowerUpCount(),
      bossActive: Boolean(this.boss && this.boss.active),
      onPrismModeChanged: (_mode, spec) => {
        this.combat?.spawnFloatingLabel(
          this.player.x,
          this.player.y - 34,
          `PRISM: ${spec.shortLabel}`,
          spec.colorHex
        );
      },
    });

    // Update Waves / Boss Trigger (paused cleanly during Chrono Singularity & Endless Boss fights)
    const activeChallengeRules = this.challengeTier?.rules ?? this.challengeDef?.rules;
    const blockWaveDuringEndlessBoss =
      this.mode === 'endless' && Boolean(this.boss && this.boss.active);

    if (!isChronoFrozen && !this.inRunDraftModal) {
      if (!blockWaveDuringEndlessBoss) {
        this.waveDirector.update(dt);
      }
      if (this.waveDirector.isFinished()) {
        if (this.mode === 'campaign' && this.levelDef.bossId) {
          if (!this.bossSpawned) {
            this.spawnBossEncounter(this.levelDef.bossId);
          }
        } else if (this.mode === 'challenge' && activeChallengeRules?.bossId) {
          if (!this.bossSpawned) {
            this.spawnBossEncounter(activeChallengeRules.bossId);
          }
        } else if (
          this.mode === 'challenge' &&
          (activeChallengeRules?.targetKills || activeChallengeRules?.timeLimitSec)
        ) {
          // Switch cleanly to endless wave loop without leaking pooled sprites
          this.waveDirector.switchToEndlessLoop();
        } else if (this.mode === 'campaign') {
          this.levelEnding = true;
          this.time.delayedCall(650, () => this.completeCampaignLevel(null));
        }
      }
    }

    // Resolve Enemy Aim Target (supports Phantom Ghost Decoy distraction)
    const aim = this.passiveSystem?.getEnemyAimTarget(this.player.x, this.player.y) ?? {
      x: this.player.x,
      y: this.player.y,
      decoyActive: false,
    };

    if (this.ghostDecoySprite && this.ghostDecoyGfx) {
      if (aim.decoyActive) {
        const pulse = 0.55 + 0.3 * Math.sin(this.elapsedSurvivalSec * 14);
        this.ghostDecoySprite.setVisible(true).setPosition(aim.x, aim.y).setAlpha(0.52 * pulse);
        this.ghostDecoyGfx.setVisible(true).clear();
        this.ghostDecoyGfx.lineStyle(2, 0x22d3ee, 0.75 * pulse);
        this.ghostDecoyGfx.strokeCircle(aim.x, aim.y, 26);
        this.ghostDecoyGfx.fillStyle(0x22d3ee, 0.14 * pulse);
        this.ghostDecoyGfx.fillCircle(aim.x, aim.y, 24);
      } else {
        this.ghostDecoySprite.setVisible(false);
        this.ghostDecoyGfx.setVisible(false).clear();
      }
    }

    // Update Enemies (selectively frozen during Chrono Singularity)
    const activeEnemies = this.waveDirector.fillActiveEnemies(this.activeEnemiesBuf);
    if (!isChronoFrozen) {
      for (let i = 0; i < activeEnemies.length; i++) {
        activeEnemies[i].update(dt, aim.x, aim.y, this.projectiles);
      }
    }

    // Challenge Lightning Protocol hazard update
    this.updateLightningProtocolHazard(dt, isChronoFrozen);

    // Gravity Well update (pulls standard enemies inside bounds & inflicts sustained AoE on enemies + Boss)
    this.updateGravityWellAndSpecialVfx(dt, rawDelta, activeEnemies, isChronoFrozen);

    // Update Boss & stream real-time 60fps pose to BossHealthBar (boss simulation paused in Chrono)
    if (this.boss && this.boss.active) {
      if (!isChronoFrozen) {
        this.boss.update(dt, aim.x, aim.y, this.projectiles, (laserDmg) => {
          const prevHp = this.player.hp;
          if (this.player.takeDamage(laserDmg, allocateEnemyAttackId())) {
            if (this.player.hp < prevHp) {
              this.resetScoreMultiplierOnHpLoss();
            }
            this.shakeCamera(200, 0.012);
            if (this.player.hp <= 0) this.triggerGameOver();
          }
        });
      } else {
        this.boss.setChronoPaused(true);
      }
      this.emitBossPose();
    } else if (this.bossPoseScratch.active) {
      this.emitBossPose();
    }

    // Update Projectiles & Collisions (enemy bullets freeze in place during Chrono Singularity)
    this.projectiles.update(dt, targets, aim.x, aim.y, isChronoFrozen);

    this.combat.resolveCollisions(
      this.player,
      this.projectiles,
      activeEnemies,
      this.boss,
      (enemy) => this.handleEnemyKilled(enemy),
      (dmg) => {
        this.score += Math.max(8, Math.round(dmg * 0.6)) * this.combo;
      },
      (hpReduced) => {
        if (hpReduced) {
          this.resetScoreMultiplierOnHpLoss();
        }
        this.shakeCamera(160, 0.009);
        if (this.player.hp <= 0) {
          this.triggerGameOver();
        }
      },
      () => {
        this.pendingCrits += 1;
        this.player.notifyCritLanded();
      },
      this.passiveSystem
    );

    this.combat.updateParticlesAndPowerUps(
      dt,
      this.player,
      this.projectiles,
      targets,
      (type, info) => {
        this.pendingPowerUps += 1;
        if (type === 'mega_bomb') {
          this.score += 400 * this.combo;
        }
        EventBus.emit('powerup:collected', {
          type,
          amountRestored: info.amountRestored,
          durationSec: info.durationSec,
          isFull: info.isFull,
        });
        this.emitHud();
      },
      (t) => {
        if ('def' in t && 'scoreReward' in t) {
          this.handleEnemyKilled(t as EnemyEntity);
        }
      }
    );

    this.hudEmitTimerMs += rawDelta;
    const hudIntervalMs = this.cachedBalancedPerf ? 50 : 33;
    if (this.hudEmitTimerMs >= hudIntervalMs) {
      this.hudEmitTimerMs = 0;
      this.emitHud();
    }
  }

  private emitHud(): void {
    const weapon = WEAPONS[this.player.weaponId];
    const special = SPECIAL_ATTACKS[this.player.specialId];
    const shipDef = SHIPS[this.player.stats.shipId] ?? SHIPS.falcon_x;
    const bossDef = this.levelDef.bossId ? BOSS_CONFIGS[this.levelDef.bossId] : null;
    const activeRules = this.challengeTier?.rules ?? this.challengeDef?.rules;

    let challengeProgressText: string | null = null;
    let challengeTimeLeftSec: number | null = null;
    if (this.mode === 'challenge' && this.challengeDef && activeRules) {
      if (activeRules.targetKills) {
        challengeProgressText = `Kills ${Math.min(this.enemiesDefeated, activeRules.targetKills)}/${activeRules.targetKills}`;
      } else if (activeRules.timeLimitSec) {
        challengeTimeLeftSec = Math.max(
          0,
          Math.ceil(activeRules.timeLimitSec - this.elapsedSurvivalSec)
        );
        challengeProgressText = `Survive ${challengeTimeLeftSec}s`;
      } else if (activeRules.bossId) {
        challengeProgressText = `${this.challengeDifficulty} Boss Duel`;
      }
    }

    const modeLabel =
      this.mode === 'endless'
        ? 'ENDLESS'
        : this.mode === 'boss_rush'
        ? 'BOSS RUSH'
        : this.mode === 'challenge'
        ? `CHAL · ${this.challengeDifficulty.toUpperCase()}`
        : `${CAMPAIGN_DIFFICULTIES[this.campaignDifficulty].shortLabel} S${String(this.levelDef.levelNumber).padStart(2, '0')}`;

    const snapshot: HudSnapshot = {
      hp: Math.ceil(this.player.hp),
      maxHp: this.player.maxHp,
      shield: Math.ceil(this.player.shield),
      maxShield: this.player.maxShield,
      score: this.score,
      combo: this.combo,
      mode: this.mode,
      modeLabel,
      campaignDifficulty: this.mode === 'campaign' ? this.campaignDifficulty : undefined,
      challengeDifficulty: this.mode === 'challenge' ? this.challengeDifficulty : undefined,
      endlessUpgradeCount:
        this.mode === 'endless' ? this.player.getEndlessUpgradeCount() : undefined,
      levelNumber: this.levelDef.levelNumber,
      levelName:
        this.mode === 'endless'
          ? 'Endless Survival'
          : this.mode === 'boss_rush'
          ? 'Boss Rush'
          : this.challengeDef?.title ?? this.levelDef.name,
      objective: this.challengeTier?.objective ?? this.challengeDef?.objective ?? this.levelDef.objective,
      waveIndex: this.waveDirector.currentWaveIdx + 1,
      wavePhase: this.waveDirector.currentPhase,
      totalWaves: this.waveDirector.totalWaves,
      shipId: shipDef.id,
      shipName: shipDef.name,
      weaponId: weapon.id,
      weaponName: weapon.name,
      weaponColor: weapon.colorHex,
      weaponLevel: this.player.weaponLevel,
      allowedWeapons: this.player.allowedWeapons,
      specialId: special.id,
      specialName: special.name,
      specialCooldownRatio: this.player.getSpecialCooldownRatio(),
      specialCooldownLeftSec: this.player.getSpecialCooldownLeftSec(),
      dashCooldownRatio: this.player.getDashCooldownRatio(),
      dashCooldownLeftSec: this.player.getDashCooldownLeftSec(),
      rapidFireLeftSec: this.player.getRapidFireSec(),
      doubleDamageLeftSec: this.player.getDoubleDamageSec(),
      invulnLeftSec: this.player.getInvulnSec(),
      bossActive: Boolean(this.boss && this.boss.active),
      bossName: this.boss?.def.name ?? bossDef?.name ?? '',
      bossTitle: this.boss?.def.title ?? bossDef?.title ?? '',
      bossHp: Math.ceil(this.boss?.hp ?? 0),
      bossMaxHp: this.boss?.maxHp ?? bossDef?.maxHp ?? 1,
      bossPhase: this.boss?.phase ?? 1,
      bossWidth: this.boss?.def.width ?? bossDef?.width ?? 160,
      bossHeight: this.boss?.def.height ?? bossDef?.height ?? 120,
      bossAgeSec: this.boss?.ageSec ?? 0,
      bossEntering: this.boss?.entering ?? false,
      bossWarningText: null,
      creditsEarnedRun: this.creditsEarnedRun,
      crystalsEarnedRun: this.crystalsEarnedRun,
      challengeProgressText,
      challengeTimeLeftSec,
      bossRushIndex: this.bossRushIdx + 1,
      bossRushTotal: BOSS_RUSH_ORDER.length,
    };

    EventBus.emit('hud:update', snapshot);
  }

  private updateLightningProtocolHazard(dt: number, isChronoFrozen: boolean): void {
    const lh = this.lightningHazard;
    if (!lh.enabled) return;

    if (lh.flashTimerSec > 0) {
      lh.flashTimerSec = Math.max(0, lh.flashTimerSec - dt);
    }

    if (isChronoFrozen || this.inRunDraftModal || this.levelEnding) return;

    const w = this.scale.width;
    const h = this.scale.height;

    if (!lh.telegraphing) {
      lh.cooldownSec -= dt;
      if (lh.cooldownSec <= 0) {
        lh.telegraphing = true;
        lh.telegraphTimerSec = lh.telegraphDurationSec;
        const jitterX = (Math.random() - 0.5) * 36;
        lh.strikeX = Phaser.Math.Clamp(this.player.x + jitterX, 48, Math.max(48, w - 48));
        lh.strikeY = Phaser.Math.Clamp(this.player.y, 96, Math.max(96, h - 60));
      }
      return;
    }

    lh.telegraphTimerSec -= dt;
    if (lh.telegraphTimerSec <= 0) {
      lh.telegraphing = false;
      lh.cooldownSec = lh.intervalSec;
      lh.flashTimerSec = 0.28;

      this.projectiles.addVisualBeam(lh.strikeX, 0, lh.strikeX, h, 0x38bdf8, 22, 0.25);
      this.combat.spawnAoeShockwave(lh.strikeX, lh.strikeY, lh.radiusPx * 1.15, 0x38bdf8, false);
      SoundManager.playBossLaser();

      const distToBolt = Math.abs(this.player.x - lh.strikeX);
      if (distToBolt <= lh.radiusPx) {
        const prevHp = this.player.hp;
        const strikeDamage = this.challengeDifficulty === 'Extreme' ? 28 : 22;
        if (this.player.takeDamage(strikeDamage, allocateEnemyAttackId())) {
          if (this.player.hp < prevHp) {
            this.resetScoreMultiplierOnHpLoss();
          }
          this.shakeCamera(180, 0.01);
          if (this.player.hp <= 0) this.triggerGameOver();
        }
      }
    }
  }

  private updateGravityWellAndSpecialVfx(
    dt: number,
    rawDeltaMs: number,
    activeEnemies: EnemyEntity[],
    isChronoFrozen: boolean
  ): void {
    const gfx = this.specialVfxGfx;
    if (!gfx) return;
    gfx.clear();

    const w = this.scale.width;
    const h = this.scale.height;

    // Render Challenge Lightning Protocol telegraph / impact indicator
    const lh = this.lightningHazard;
    if (lh.enabled && lh.telegraphing) {
      const progress = 1 - Math.max(0, Math.min(1, lh.telegraphTimerSec / lh.telegraphDurationSec));
      const pulseAlpha = 0.35 + 0.55 * progress;
      gfx.lineStyle(2 + progress * 1.8, 0x38bdf8, pulseAlpha);
      gfx.lineBetween(lh.strikeX, 0, lh.strikeX, h);
      gfx.strokeCircle(lh.strikeX, lh.strikeY, lh.radiusPx);
      gfx.fillStyle(0x38bdf8, 0.08 + 0.14 * progress);
      gfx.fillCircle(lh.strikeX, lh.strikeY, lh.radiusPx * (1 - progress * 0.65));
    } else if (lh.enabled && lh.flashTimerSec > 0) {
      const a = Math.min(1, lh.flashTimerSec / 0.28);
      gfx.lineStyle(2.5, 0xbae6fd, 0.85 * a);
      gfx.strokeCircle(lh.strikeX, lh.strikeY, lh.radiusPx * (1.25 - a * 0.2));
    }

    if (isChronoFrozen) {
      const ratio = Math.max(0, Math.min(1, this.chronoFreezeMs / 3600));
      const pulse = 0.3 + 0.2 * Math.sin(this.elapsedSurvivalSec * 8);
      gfx.lineStyle(3, 0xa855f7, pulse * ratio);
      gfx.strokeRect(8, 8, Math.max(10, w - 16), Math.max(10, h - 16));
      gfx.lineStyle(1.4, 0x67e8f9, 0.45 * ratio);
      for (let i = 0; i < activeEnemies.length; i++) {
        const e = activeEnemies[i];
        if (e.active) {
          gfx.strokeCircle(e.x, e.y, e.radius + 7);
        }
      }
      if (this.boss && this.boss.active) {
        gfx.strokeCircle(this.boss.x, this.boss.y, this.boss.radius + 10);
      }
    }

    if (!this.gravityWell.active) return;

    this.gravityWell.remainingMs -= rawDeltaMs;
    if (this.gravityWell.remainingMs <= 0) {
      this.gravityWell.active = false;
      return;
    }

    const gw = this.gravityWell;
    const lifeRatio = Math.max(0.15, Math.min(1, gw.remainingMs / gw.maxDurationMs));

    // Visual vortex core & orbital accretion rings
    gfx.fillStyle(0x090414, 0.72 * lifeRatio);
    gfx.fillCircle(gw.x, gw.y, 26);
    gfx.lineStyle(3, 0xf59e0b, 0.85 * lifeRatio);
    gfx.strokeCircle(gw.x, gw.y, 28 + Math.sin(this.elapsedSurvivalSec * 12) * 3);
    gfx.lineStyle(2, 0xa855f7, 0.55 * lifeRatio);
    gfx.strokeCircle(gw.x, gw.y, gw.radius * 0.58);
    gfx.lineStyle(1.4, 0xf59e0b, 0.3 * lifeRatio);
    gfx.strokeCircle(gw.x, gw.y, gw.radius);

    for (let arm = 0; arm < 3; arm++) {
      const baseAng = this.elapsedSurvivalSec * 3.8 + (arm * Math.PI * 2) / 3;
      const rOuter = gw.radius * 0.86;
      gfx.lineStyle(1.8, arm % 2 === 0 ? 0xfbbf24 : 0xc084fc, 0.48 * lifeRatio);
      gfx.lineBetween(
        gw.x + Math.cos(baseAng) * 26,
        gw.y + Math.sin(baseAng) * 26,
        gw.x + Math.cos(baseAng + 0.9) * rOuter,
        gw.y + Math.sin(baseAng + 0.9) * rOuter
      );
    }

    // Pull normal enemies smoothly within playable arena bounds (never pull Boss, never freeze/break)
    if (!isChronoFrozen) {
      const pullRange = gw.radius * 1.45;
      const minX = 36;
      const maxX = Math.max(minX, w - 36);
      const minY = 56;
      const maxY = Math.max(minY, h - 95);

      for (let i = 0; i < activeEnemies.length; i++) {
        const e = activeEnemies[i];
        if (!e.active || e.sprite.y < 36) continue;
        const dx = gw.x - e.x;
        const dy = gw.y - e.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 14 && dist <= pullRange) {
          const pullStrength = 250 * (1 - dist / (pullRange * 1.25));
          const step = Math.min(dist - 12, pullStrength * dt);
          const nx = e.sprite.x + (dx / dist) * step;
          const ny = e.sprite.y + (dy / dist) * step;
          e.sprite.x = Phaser.Math.Clamp(nx, minX, maxX);
          e.sprite.y = Phaser.Math.Clamp(ny, minY, maxY);
        }
      }
    }

    // Sustained periodic AoE damage tick (enemies + Boss)
    gw.tickTimerMs -= rawDeltaMs;
    if (gw.tickTimerMs <= 0) {
      gw.tickTimerMs += gw.tickIntervalMs;
      const specialMeta: BeamHitMeta = {
        source: 'special',
        firingActionId: 0,
        countsForFiringAction: false,
      };
      for (let i = 0; i < activeEnemies.length; i++) {
        const e = activeEnemies[i];
        if (!e.active) continue;
        const d = Math.hypot(e.x - gw.x, e.y - gw.y);
        if (d <= gw.radius + e.radius * 0.85) {
          const crit = this.player.rollCrit();
          this.applyDirectDamage(e, Math.round(gw.tickDamage * crit.mult), crit.isCrit, specialMeta);
        }
      }
      if (this.boss && this.boss.active && !this.boss.entering && !this.boss.invulnerable) {
        const dBoss = Math.hypot(this.boss.x - gw.x, this.boss.y - gw.y);
        if (dBoss <= gw.radius + this.boss.radius * 0.9) {
          const crit = this.player.rollCrit();
          this.applyDirectDamage(
            this.boss,
            Math.round(gw.tickDamage * crit.mult),
            crit.isCrit,
            specialMeta
          );
        }
      }
    }
  }

  private cleanup(): void {
    window.removeEventListener('blur', this.onWindowBlur);
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    window.removeEventListener('pointerdown', this.onWindowPointerDown);
    window.removeEventListener('pointermove', this.onWindowPointerMove);
    window.removeEventListener('pointerup', this.onWindowPointerUp);
    window.removeEventListener('pointercancel', this.onWindowPointerUp);
    this.scale.off('resize', this.handleResize, this);
    this.unsubs.forEach((u) => u());
    this.unsubs = [];
    if (this.scene.isActive('BossScene')) {
      this.scene.stop('BossScene');
    }
    this.specialVfxGfx?.destroy();
    this.specialVfxGfx = null;
    this.drones?.destroy();
    this.quantumClone?.destroy();
    this.quantumClone = null;
    this.passiveSystem?.destroy();
    this.passiveSystem = null;
    this.ghostDecoySprite?.destroy();
    this.ghostDecoySprite = null;
    this.ghostDecoyGfx?.destroy();
    this.ghostDecoyGfx = null;
    this.player?.destroy();
    this.projectiles?.destroy();
    this.waveDirector?.destroy();
    this.combat?.destroy();
    this.boss?.destroy();
    this.bg?.destroy();
  }
}
