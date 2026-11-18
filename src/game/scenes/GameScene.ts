import Phaser from 'phaser';
import { BOSS_CONFIGS, BossId } from '../config/BossConfig';
import { GAME_CONSTANTS, HudSnapshot } from '../config/GameConfig';
import { BOSS_RUSH_ORDER, CHALLENGE_BY_ID, ChallengeDefinition, GameMode } from '../config/GameModeConfig';
import { CAMPAIGN_LEVELS, LevelDefinition } from '../config/LevelConfig';
import { SHIPS } from '../config/ShipConfig';
import { SpecialId, SPECIAL_ATTACKS, WeaponId, WEAPONS, WEAPON_LIST } from '../config/WeaponConfig';
import { SoundManager } from '../audio/SoundManager';
import { BossEntity } from '../entities/Boss';
import { DroneManager } from '../entities/DroneManager';
import { EnemyEntity } from '../entities/Enemy';
import { Player } from '../entities/Player';
import { ProjectileManager } from '../entities/ProjectileManager';
import { Targetable } from '../entities/Targetable';
import { BackgroundSystem } from '../systems/BackgroundSystem';
import { CombatSystem } from '../systems/CombatSystem';
import { computePlayerStats, ProgressionManager } from '../systems/ProgressionManager';
import { WaveDirector } from '../systems/WaveDirector';
import { EventBus } from '../utils/EventBus';
import { StorageManager } from '../utils/StorageManager';

export interface GameSceneData {
  mode?: GameMode;
  levelNumber: number;
  challengeId?: string;
  weaponId?: WeaponId;
  specialId?: SpecialId;
  carryScore?: number;
}

export class GameScene extends Phaser.Scene {
  private mode: GameMode = 'campaign';
  private challengeDef: ChallengeDefinition | null = null;
  private levelDef!: LevelDefinition;
  private bg!: BackgroundSystem;
  private player!: Player;
  private drones: DroneManager | null = null;
  private projectiles!: ProjectileManager;
  private waveDirector!: WaveDirector;
  private combat!: CombatSystem;
  private boss: BossEntity | null = null;

  private score = 0;
  private combo = 1;
  private comboTimerMs = 0;
  private enemiesDefeated = 0;
  private bossSpawned = false;
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

  private escKey?: Phaser.Input.Keyboard.Key;
  private numberKeys: Phaser.Input.Keyboard.Key[] = [];
  private unsubs: Array<() => void> = [];
  private currentData: GameSceneData = { mode: 'campaign', levelNumber: 1 };
  private hudEmitTimerMs = 0;

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
    const saved = StorageManager.load();
    this.mode = data?.mode ?? 'campaign';
    this.challengeDef =
      this.mode === 'challenge' && data?.challengeId
        ? CHALLENGE_BY_ID[data.challengeId] ?? null
        : null;

    const baseLvlNum =
      this.mode === 'challenge' && this.challengeDef
        ? this.challengeDef.rules.levelBase
        : data?.levelNumber ?? 1;

    const levelNumber = Phaser.Math.Clamp(baseLvlNum, 1, CAMPAIGN_LEVELS.length);
    this.levelDef = CAMPAIGN_LEVELS[levelNumber - 1];
    this.currentData = {
      mode: this.mode,
      levelNumber,
      challengeId: this.challengeDef?.id,
      weaponId: data?.weaponId ?? saved.selectedWeapon,
      specialId: data?.specialId ?? saved.selectedSpecial,
      carryScore: data?.carryScore ?? 0,
    };

    this.score = this.currentData.carryScore ?? 0;
    this.combo = 1;
    this.comboTimerMs = 0;
    this.enemiesDefeated = 0;
    this.boss = null;
    this.bossSpawned = false;
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

    EventBus.emit('scene:changed', 'GameScene');
    EventBus.emit('boss:warning', null);

    const fxQuality = saved.settings.fxQuality;
    this.bg = new BackgroundSystem(this, this.levelDef.environment, fxQuality);
    this.projectiles = new ProjectileManager(this);
    this.combat = new CombatSystem(this, fxQuality);

    this.waveDirector = new WaveDirector(
      this,
      this.levelDef,
      this.mode,
      (enemyClass) => ProgressionManager.recordEnemyEncounter(enemyClass),
      (waveNum) => {
        if (this.mode === 'endless') {
          this.creditsEarnedRun += Math.round((45 + waveNum * 12) * this.player.stats.creditBonusMult);
          if (waveNum % 3 === 0) this.crystalsEarnedRun += 1;
          ProgressionManager.recordCombatProgress({
            survivalWaves: 1,
            runScore: this.score,
          });
          // Endless milestone boss every 5 waves
          if (waveNum % 5 === 0 && !this.boss) {
            const bossPool = BOSS_RUSH_ORDER;
            const bId = bossPool[(Math.floor(waveNum / 5) - 1) % bossPool.length];
            this.spawnBossEncounter(bId);
          }
        }
      }
    );

    const stats = computePlayerStats(saved, this.challengeDef?.rules);
    const allowedWeapons = this.challengeDef?.rules.allowedWeapons ?? null;
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
      allowedWeapons
    );

    this.drones = !this.challengeDef?.rules.disableDrones
      ? new DroneManager(this, saved.equippedDrones, saved.ownedDrones, startX, startY)
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
        if (!this.levelEnding) {
          this.levelEnding = true;
          this.flushCombatProgress();
        }
        this.player?.endDrag();
        if (this.scene.isActive('BossScene')) {
          this.scene.stop('BossScene');
        }
        if (this.scene.isActive('PauseMenuScene')) {
          this.scene.stop('PauseMenuScene');
        }
        this.scene.start('MainMenuScene');
      }),
      EventBus.on('ui:trigger-dash', () => {
        if (this.scene.isPaused('GameScene') || this.levelEnding) return;
        this.player.triggerDash();
        this.emitHud();
      }),
      EventBus.on('ui:trigger-special', () => {
        if (this.scene.isPaused('GameScene') || this.levelEnding) return;
        this.triggerPlayerSpecial();
        this.emitHud();
      })
    );

    this.scale.on('resize', this.handleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanup, this);
    this.emitHud();
  }

  private shakeCamera(durationMs: number, intensity: number): void {
    if (!StorageManager.load().settings.screenShake) return;
    this.cameras.main.shake(durationMs, intensity);
  }

  private handleResize(gameSize: Phaser.Structs.Size): void {
    this.bg?.resize(gameSize.width, gameSize.height);
  }

  private pauseGame(): void {
    if (this.levelEnding || this.scene.isPaused('GameScene')) return;
    this.player?.endDrag();
    this.scene.pause('GameScene');
    this.scene.launch('PauseMenuScene', { levelData: this.currentData });
  }

  private triggerPlayerSpecial(): void {
    const targets = this.getAllTargets();
    this.player.tryTriggerSpecial(
      this.projectiles,
      targets,
      (t, dmg, isCrit) => this.applyDirectDamage(t, dmg, isCrit),
      (intensity) => this.shakeCamera(220, intensity)
    );
  }

  private getAllTargets(): Targetable[] {
    const targets: Targetable[] = [...this.waveDirector.getActiveEnemies()];
    if (this.boss && this.boss.active) {
      targets.push(this.boss);
    }
    return targets;
  }

  private applyDirectDamage(target: Targetable, dmg: number, isCrit = false): void {
    if (!target.active) return;
    this.combat.spawnExplosion(target.x, target.y, isCrit ? 0xfacc15 : 0x38bdf8, 4, 90, 0.55);
    this.combat.spawnDamageNumber(target.x, target.y, dmg, isCrit);
    if (isCrit) {
      this.pendingCrits += 1;
      SoundManager.playCritHit();
    } else {
      SoundManager.playHit();
    }
    const killed = target.takeDamage(dmg);
    if (killed && 'def' in target && 'scoreReward' in target) {
      this.handleEnemyKilled(target as EnemyEntity);
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

    ProgressionManager.recordCombatProgress({
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
    this.enemiesDefeated++;
    this.pendingKills++;
    if (enemy.def.id === 'elite' || enemy.def.id === 'tank') {
      this.pendingEliteKills++;
    }

    if (this.player.stats.shieldOnKill > 0) {
      this.player.restoreShield(this.player.stats.shieldOnKill);
    }

    this.combo = Math.min(8, this.combo + 1);
    this.comboTimerMs = 3400;
    this.score += enemy.scoreReward * Math.max(1, Math.floor(this.combo * 0.5));

    const creditGain = Math.round(
      (enemy.def.id === 'elite' || enemy.def.id === 'tank' ? 18 : 7) *
        this.player.stats.creditBonusMult
    );
    this.creditsEarnedRun += creditGain;

    const isHeavy = enemy.def.id === 'tank' || enemy.def.id === 'elite' || enemy.def.id === 'bomber';
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
    if (
      this.mode === 'challenge' &&
      this.challengeDef?.rules.targetKills &&
      this.enemiesDefeated >= this.challengeDef.rules.targetKills &&
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
      (defeatedBoss) => this.handleBossDefeated(defeatedBoss)
    );
  }

  private handleBossDefeated(boss: BossEntity): void {
    if (this.levelEnding) return;

    this.score += boss.def.scoreReward;
    this.creditsEarnedRun += Math.round(280 * this.player.stats.creditBonusMult);
    this.crystalsEarnedRun += 2;

    ProgressionManager.recordCombatProgress({
      bossDefeatedId: boss.def.id,
      runScore: this.score,
    });

    SoundManager.playExplosion('boss');
    this.shakeCamera(550, 0.018);

    // Endless Mode boss defeat continues survival loop cleanly!
    if (this.mode === 'endless') {
      this.combat.spawnExplosion(boss.x, boss.y, boss.def.primaryColor, 28, 320, 1.5);
      this.combat.maybeDropPowerUp(boss.x, boss.y + 20, true);
      boss.destroy();
      this.boss = null;
      this.bossSpawned = false;
      SoundManager.playMusic('endless');
      return;
    }

    // Boss Rush Mode: advance through all 5 bosses with limited between-boss recovery
    if (this.mode === 'boss_rush' && this.bossRushIdx < BOSS_RUSH_ORDER.length - 1) {
      this.projectiles.clearEnemyBullets();
      this.waveDirector.clearAll();
      this.combat.spawnExplosion(boss.x, boss.y, boss.def.primaryColor, 28, 300, 1.5);
      boss.destroy();
      this.boss = null;
      this.bossSpawned = false;

      // Limited tactical recovery between gauntlet bosses
      this.player.healHp(Math.round(this.player.maxHp * 0.28));
      this.player.restoreShield(Math.round(this.player.maxShield * 0.45));
      this.bossRushIdx++;

      this.time.delayedCall(1200, () => {
        if (this.scene.isActive('GameScene') && !this.levelEnding) {
          this.spawnBossEncounter(BOSS_RUSH_ORDER[this.bossRushIdx]);
        }
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
    const bonusScore = this.levelDef.levelNumber * 1000 + Math.round(this.player.hp * 15);
    const finalLevelScore = this.score + bonusScore;
    const clearCredits = Math.round((120 + this.levelDef.levelNumber * 45) * this.player.stats.creditBonusMult);
    const clearCrystals = this.levelDef.bossId ? 2 : 1;
    this.creditsEarnedRun += clearCredits;
    this.crystalsEarnedRun += clearCrystals;

    this.flushCombatProgress(this.levelDef.levelNumber);
    const granted = ProgressionManager.recordRunReward({
      mode: 'campaign',
      creditsEarned: this.creditsEarnedRun,
      crystalsEarned: this.crystalsEarnedRun,
      score: finalLevelScore,
      kills: this.enemiesDefeated,
      levelNumber: this.levelDef.levelNumber,
      shipUsed: this.player.stats.shipId,
    });

    SoundManager.playVictory();
    SoundManager.playMusic('victory');

    if (this.levelDef.levelNumber >= CAMPAIGN_LEVELS.length) {
      this.scene.start('VictoryScene', {
        mode: 'campaign',
        finalScore: finalLevelScore,
        enemiesDefeated: this.enemiesDefeated,
        creditsEarned: granted.creditsGranted,
        crystalsEarned: granted.crystalsGranted,
      });
    } else {
      this.scene.start('LevelResultScene', {
        mode: 'campaign',
        levelNumber: this.levelDef.levelNumber,
        levelName: this.levelDef.name,
        score: finalLevelScore,
        bonusScore,
        enemiesDefeated: this.enemiesDefeated,
        bossDefeatedName,
        rewardText: this.levelDef.rewardText,
        creditsEarned: granted.creditsGranted,
        crystalsEarned: granted.crystalsGranted,
        nextLevelNumber: this.levelDef.levelNumber + 1,
        weaponId: this.player.weaponId,
        specialId: this.player.specialId,
      });
    }
  }

  private completeChallenge(won: boolean, bossDefeatedName: string | null = null): void {
    const chal = this.challengeDef!;
    this.flushCombatProgress();
    const bonusScore = won ? 2500 + Math.round(this.player.hp * 20) : 0;
    const finalScore = this.score + bonusScore;
    const credits = won ? this.creditsEarnedRun + chal.rewardCredits : this.creditsEarnedRun;
    const crystals = won ? this.crystalsEarnedRun + chal.rewardCrystals : this.crystalsEarnedRun;

    const granted = ProgressionManager.recordRunReward({
      mode: 'challenge',
      creditsEarned: credits,
      crystalsEarned: crystals,
      score: finalScore,
      kills: this.enemiesDefeated,
      challengeId: chal.id,
      challengeCompleted: won,
      shipUsed: this.player.stats.shipId,
    });

    SoundManager.playVictory();
    SoundManager.playMusic('victory');
    this.scene.start('LevelResultScene', {
      mode: 'challenge',
      challengeId: chal.id,
      levelNumber: this.levelDef.levelNumber,
      levelName: chal.title,
      score: finalScore,
      bonusScore,
      enemiesDefeated: this.enemiesDefeated,
      bossDefeatedName,
      rewardText: `Challenge Complete · ${chal.objective}`,
      creditsEarned: granted.creditsGranted,
      crystalsEarned: granted.crystalsGranted,
      nextLevelNumber: null,
      weaponId: this.player.weaponId,
      specialId: this.player.specialId,
    });
  }

  private completeBossRush(): void {
    this.flushCombatProgress();
    const bonusScore = 6000 + Math.round(this.player.hp * 30);
    const finalScore = this.score + bonusScore;
    const granted = ProgressionManager.recordRunReward({
      mode: 'boss_rush',
      creditsEarned: this.creditsEarnedRun + 1400,
      crystalsEarned: this.crystalsEarnedRun + 10,
      score: finalScore,
      kills: this.enemiesDefeated,
      bossRushCleared: true,
      shipUsed: this.player.stats.shipId,
    });

    SoundManager.playVictory();
    SoundManager.playMusic('victory');
    this.scene.start('VictoryScene', {
      mode: 'boss_rush',
      finalScore,
      enemiesDefeated: this.enemiesDefeated,
      creditsEarned: granted.creditsGranted,
      crystalsEarned: granted.crystalsGranted,
    });
  }

  private triggerGameOver(): void {
    if (this.levelEnding) return;
    this.levelEnding = true;
    SoundManager.playExplosion('boss');
    SoundManager.playMusic('gameover');
    this.combat.spawnExplosion(this.player.x, this.player.y, 0xf43f5e, 32, 320, 1.6);
    this.shakeCamera(420, 0.018);
    this.player.sprite.setVisible(false);

    this.flushCombatProgress();
    const granted = ProgressionManager.recordRunReward({
      mode: this.mode,
      creditsEarned: this.creditsEarnedRun,
      crystalsEarned: this.crystalsEarnedRun,
      score: this.score,
      kills: this.enemiesDefeated,
      endlessWave: this.mode === 'endless' ? this.waveDirector.currentWaveIdx + 1 : undefined,
      shipUsed: this.player.stats.shipId,
    });

    if (this.scene.isActive('BossScene')) {
      this.scene.stop('BossScene');
    }

    this.time.delayedCall(900, () => {
      this.scene.start('GameOverScene', {
        mode: this.mode,
        challengeId: this.challengeDef?.id,
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
    const saved = StorageManager.load();
    for (let i = 0; i < this.numberKeys.length; i++) {
      if (Phaser.Input.Keyboard.JustDown(this.numberKeys[i])) {
        const wDef = WEAPON_LIST[i];
        if (wDef && saved.unlockedWeapons.includes(wDef.id)) {
          if (this.player.setWeapon(wDef.id)) {
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

    if (this.comboTimerMs > 0) {
      this.comboTimerMs -= dt * 1000;
      if (this.comboTimerMs <= 0) {
        this.combo = 1;
      }
    }

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
    if (
      this.mode === 'challenge' &&
      this.challengeDef?.rules.timeLimitSec &&
      this.elapsedSurvivalSec >= this.challengeDef.rules.timeLimitSec
    ) {
      this.levelEnding = true;
      this.completeChallenge(true);
      return;
    }

    const targets = this.getAllTargets();

    // Update Player
    this.player.update(
      dt,
      this.projectiles,
      targets,
      (t, dmg, isCrit) => this.applyDirectDamage(t, dmg, isCrit),
      () => {},
      (intensity) => this.shakeCamera(180, intensity)
    );

    // Update Companion Drones
    this.drones?.update(dt, this.player, this.projectiles, targets, () => this.player.rollCrit());

    // Update Waves / Boss Trigger
    this.waveDirector.update(dt);
    if (this.waveDirector.isFinished()) {
      if (this.mode === 'campaign' && this.levelDef.bossId) {
        if (!this.bossSpawned) {
          this.spawnBossEncounter(this.levelDef.bossId);
        }
      } else if (this.mode === 'challenge' && this.challengeDef?.rules.bossId) {
        if (!this.bossSpawned) {
          this.spawnBossEncounter(this.challengeDef.rules.bossId);
        }
      } else if (this.mode === 'challenge' && this.challengeDef?.rules.targetKills) {
        // Keep endless waves feeding until kill count is reached
        this.waveDirector = new WaveDirector(this, this.levelDef, 'endless');
      } else if (this.mode === 'challenge' && this.challengeDef?.rules.timeLimitSec) {
        this.waveDirector = new WaveDirector(this, this.levelDef, 'endless');
      } else if (this.mode === 'campaign') {
        this.levelEnding = true;
        this.time.delayedCall(650, () => this.completeCampaignLevel(null));
      }
    }

    // Update Enemies
    const activeEnemies = this.waveDirector.getActiveEnemies();
    for (let i = 0; i < activeEnemies.length; i++) {
      activeEnemies[i].update(dt, this.player.x, this.player.y, this.projectiles);
    }

    // Update Boss
    if (this.boss && this.boss.active) {
      this.boss.update(dt, this.player.x, this.player.y, this.projectiles, (laserDmg) => {
        if (this.player.takeDamage(laserDmg)) {
          this.shakeCamera(200, 0.012);
          if (this.player.hp <= 0) this.triggerGameOver();
        }
      });
    }

    // Update Projectiles & Collisions
    this.projectiles.update(dt, targets);

    this.combat.resolveCollisions(
      this.player,
      this.projectiles,
      activeEnemies,
      this.boss,
      (enemy) => this.handleEnemyKilled(enemy),
      (dmg) => {
        this.score += Math.max(8, Math.round(dmg * 0.6));
      },
      () => {
        this.shakeCamera(160, 0.009);
        if (this.player.hp <= 0) {
          this.triggerGameOver();
        }
      },
      () => {
        this.pendingCrits += 1;
      }
    );

    this.combat.updateParticlesAndPowerUps(
      dt,
      this.player,
      this.projectiles,
      targets,
      (type, info) => {
        this.pendingPowerUps += 1;
        if (type === 'mega_bomb') {
          this.score += 400;
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
    if (this.hudEmitTimerMs >= 33) {
      this.hudEmitTimerMs = 0;
      this.emitHud();
    }
  }

  private emitHud(): void {
    const weapon = WEAPONS[this.player.weaponId];
    const special = SPECIAL_ATTACKS[this.player.specialId];
    const shipDef = SHIPS[this.player.stats.shipId] ?? SHIPS.falcon_x;
    const bossDef = this.levelDef.bossId ? BOSS_CONFIGS[this.levelDef.bossId] : null;

    let challengeProgressText: string | null = null;
    let challengeTimeLeftSec: number | null = null;
    if (this.mode === 'challenge' && this.challengeDef) {
      if (this.challengeDef.rules.targetKills) {
        challengeProgressText = `Kills ${Math.min(this.enemiesDefeated, this.challengeDef.rules.targetKills)}/${this.challengeDef.rules.targetKills}`;
      } else if (this.challengeDef.rules.timeLimitSec) {
        challengeTimeLeftSec = Math.max(
          0,
          Math.ceil(this.challengeDef.rules.timeLimitSec - this.elapsedSurvivalSec)
        );
        challengeProgressText = `Survive ${challengeTimeLeftSec}s`;
      } else if (this.challengeDef.rules.bossId) {
        challengeProgressText = 'Boss Duel';
      }
    }

    const modeLabel =
      this.mode === 'endless'
        ? 'ENDLESS'
        : this.mode === 'boss_rush'
        ? 'BOSS RUSH'
        : this.mode === 'challenge'
        ? 'CHALLENGE'
        : `S${String(this.levelDef.levelNumber).padStart(2, '0')}`;

    const snapshot: HudSnapshot = {
      hp: Math.ceil(this.player.hp),
      maxHp: this.player.maxHp,
      shield: Math.ceil(this.player.shield),
      maxShield: this.player.maxShield,
      score: this.score,
      combo: this.combo,
      mode: this.mode,
      modeLabel,
      levelNumber: this.levelDef.levelNumber,
      levelName:
        this.mode === 'endless'
          ? 'Endless Survival'
          : this.mode === 'boss_rush'
          ? 'Boss Rush'
          : this.challengeDef?.title ?? this.levelDef.name,
      objective: this.challengeDef?.objective ?? this.levelDef.objective,
      waveIndex: this.waveDirector.currentWaveIdx + 1,
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
    this.drones?.destroy();
    this.player?.destroy();
    this.projectiles?.destroy();
    this.waveDirector?.destroy();
    this.combat?.destroy();
    this.boss?.destroy();
    this.bg?.destroy();
  }
}
