import Phaser from 'phaser';
import { getEndlessDifficulty } from '../config/EconomyConfig';
import { EnemyBehavior, EnemyClass } from '../config/EnemyConfig';
import { GameMode } from '../config/GameModeConfig';
import {
  LevelDefinition,
  WaveDefinition,
  WavePhaseDefinition,
  WaveSpawnGroup,
} from '../config/LevelConfig';
import { EnemyEntity, type EnemySpawnModifiers } from '../entities/Enemy';
import { ObjectPool } from '../utils/ObjectPool';

export interface WaveModifiers {
  spawnIntervalMult?: number;
  densityMult?: number;
  eliteChanceBonus?: number;
  enemyMods?: EnemySpawnModifiers;
}

interface ScheduledSpawn {
  enemyClass: EnemyClass;
  xRatio: number;
  yOffset: number;
  behavior?: EnemyBehavior;
  spawnAtMs: number;
}

const PHASE_TRANSITION_MS = 450;
const WAVE_COOLDOWN_MS = 1050;

export class WaveDirector {
  private scene: Phaser.Scene;
  private level: LevelDefinition;
  private mode: GameMode;
  private waveModifiers: WaveModifiers;
  private enemyPool: ObjectPool<EnemyEntity>;
  private onEnemyEncounter?: (enemyClass: EnemyClass) => void;
  private onWaveCleared?: (waveNum: number) => void;
  private onPhaseStarted?: (waveNum: number, phase: 1 | 2) => void;

  currentWaveIdx = 0;
  totalWaves: number;
  private activeWave: WaveDefinition | null = null;
  private currentPhaseIdx: 0 | 1 = 0;
  private phaseElapsedMs = 0;
  private phaseTransitionMs = 0;
  private waveCooldownMs = 900;
  private spawnQueue: ScheduledSpawn[] = [];
  private waveStarted = false;
  private allWavesCompleted = false;

  constructor(
    scene: Phaser.Scene,
    level: LevelDefinition,
    mode: GameMode = 'campaign',
    onEnemyEncounter?: (enemyClass: EnemyClass) => void,
    onWaveCleared?: (waveNum: number) => void,
    onPhaseStarted?: (waveNum: number, phase: 1 | 2) => void,
    waveModifiers: WaveModifiers = {}
  ) {
    this.scene = scene;
    this.level = level;
    this.mode = mode;
    this.waveModifiers = waveModifiers;
    this.totalWaves = mode === 'endless' ? 0 : mode === 'boss_rush' ? 0 : level.waves.length;
    this.onEnemyEncounter = onEnemyEncounter;
    this.onWaveCleared = onWaveCleared;
    this.onPhaseStarted = onPhaseStarted;

    this.enemyPool = new ObjectPool<EnemyEntity>(
      () => new EnemyEntity(scene),
      24,
      84
    );

    if (mode === 'boss_rush') {
      this.allWavesCompleted = true;
    }
  }

  switchToEndlessLoop(): void {
    this.mode = 'endless';
    this.totalWaves = 0;
    this.allWavesCompleted = false;
    this.waveStarted = false;
    this.activeWave = null;
    this.currentPhaseIdx = 0;
    this.waveCooldownMs = 600;
  }

  get currentPhase(): 1 | 2 {
    return this.currentPhaseIdx === 0 ? 1 : 2;
  }

  getActiveEnemies(): EnemyEntity[] {
    return this.enemyPool.getActiveItems();
  }

  fillActiveEnemies(out: EnemyEntity[]): EnemyEntity[] {
    return this.enemyPool.fillActive(out);
  }

  spawnDirectMinion(enemyClass: EnemyClass, x: number, y: number): void {
    const e = this.enemyPool.acquire();
    if (!e) return;
    const diff =
      this.mode === 'endless'
        ? getEndlessDifficulty(this.currentWaveIdx)
        : this.level.difficultyMultiplier;
    const minionBehavior: EnemyBehavior =
      enemyClass === 'scout'
        ? Math.random() < 0.5
          ? 'flank_sweep'
          : 'diving'
        : enemyClass === 'interceptor'
        ? 'rush_weave'
        : enemyClass === 'fighter'
        ? 'orbit_harass'
        : enemyClass === 'sniper'
        ? 'sniper_perch'
        : enemyClass === 'bomber'
        ? 'diving'
        : enemyClass === 'splitter'
        ? 'pendulum_hover'
        : enemyClass === 'bastion'
        ? 'fortress_march'
        : enemyClass === 'harbinger'
        ? 'phase_weave'
        : enemyClass === 'elite'
        ? 'evasive'
        : 'formation';
    e.spawn(enemyClass, x, y, minionBehavior, diff, this.waveModifiers.enemyMods);
    this.onEnemyEncounter?.(enemyClass);
  }

  isFinished(): boolean {
    return this.allWavesCompleted;
  }

  update(dt: number): void {
    if (this.allWavesCompleted) return;
    const dtMs = dt * 1000;

    if (!this.waveStarted) {
      this.waveCooldownMs -= dtMs;
      if (this.waveCooldownMs <= 0) {
        if (this.mode === 'endless') {
          this.startWave(this.generateEndlessWave(this.currentWaveIdx + 1));
        } else {
          this.startWave(this.level.waves[this.currentWaveIdx]);
        }
      }
      return;
    }

    // Smooth inter-phase pause before Phase 2 reinforcements enter
    if (this.phaseTransitionMs > 0) {
      this.phaseTransitionMs -= dtMs;
      if (this.phaseTransitionMs <= 0 && this.activeWave) {
        this.phaseTransitionMs = 0;
        this.enqueuePhase(this.activeWave.phases[1], this.activeWave.spawnIntervalMs);
        this.onPhaseStarted?.(this.currentWaveIdx + 1, 2);
      }
      return;
    }

    this.phaseElapsedMs += dtMs;
    const w = this.scene.scale.width;
    const diff =
      this.mode === 'endless'
        ? getEndlessDifficulty(this.currentWaveIdx)
        : this.level.difficultyMultiplier;

    while (this.spawnQueue.length > 0 && this.spawnQueue[0].spawnAtMs <= this.phaseElapsedMs) {
      const next = this.spawnQueue.shift()!;
      const e = this.enemyPool.acquire();
      if (e) {
        const sx = Phaser.Math.Clamp(next.xRatio * w, 52, w - 52);
        e.spawn(
          next.enemyClass,
          sx,
          -36 - next.yOffset,
          next.behavior,
          diff,
          this.waveModifiers.enemyMods
        );
        this.onEnemyEncounter?.(next.enemyClass);
      }
    }

    // Check if current phase is cleared
    if (this.spawnQueue.length === 0 && !this.enemyPool.hasActive()) {
      if (this.currentPhaseIdx === 0 && this.activeWave?.phases[1]) {
        this.currentPhaseIdx = 1;
        this.phaseTransitionMs = PHASE_TRANSITION_MS;
        return;
      }

      // Both phases cleared -> complete wave & advance
      this.onWaveCleared?.(this.currentWaveIdx + 1);
      if (this.mode === 'endless' || this.currentWaveIdx < this.totalWaves - 1) {
        this.currentWaveIdx++;
        this.waveStarted = false;
        this.activeWave = null;
        this.currentPhaseIdx = 0;
        this.waveCooldownMs = WAVE_COOLDOWN_MS;
      } else {
        this.allWavesCompleted = true;
        this.activeWave = null;
      }
    }
  }

  private generateEndlessWave(waveNum: number): WaveDefinition {
    const interval = Math.max(350, 710 - waveNum * 18);
    const phaseTargetTotal = Math.min(22, 10 + Math.floor(waveNum * 1.1));

    const interceptorCountP1 = Math.min(5, Math.max(1, Math.floor((waveNum + 1) * 0.45)));
    const sniperCountP1 = waveNum >= 2 ? Math.min(3, Math.floor(waveNum * 0.3)) : 0;
    const bomberCountP1 = waveNum >= 2 ? Math.min(4, Math.floor(waveNum * 0.4)) : 0;
    const fighterCountP1 = Math.min(6, Math.max(2, Math.floor(phaseTargetTotal * 0.3)));
    const scoutCountP1 = Math.max(
      2,
      phaseTargetTotal - interceptorCountP1 - sniperCountP1 - fighterCountP1 - bomberCountP1
    );

    const harbingerCountP2 = waveNum >= 6 ? Math.min(3, Math.floor((waveNum - 4) * 0.35)) : 0;
    const splitterCountP2 = waveNum >= 3 ? Math.min(4, Math.floor(waveNum * 0.32)) : 0;
    const bastionCountP2 = waveNum >= 4 ? Math.min(3, Math.floor((waveNum - 2) * 0.3)) : 0;
    const eliteCountP2 = waveNum >= 3 ? Math.min(5, Math.max(1, Math.floor(waveNum * 0.35))) : 0;
    const tankCountP2 = waveNum >= 2 ? Math.min(4, Math.max(1, Math.floor(waveNum * 0.3))) : 0;
    const fighterCountP2 = Math.min(
      6,
      Math.max(2, Math.floor((phaseTargetTotal - eliteCountP2 - tankCountP2 - bastionCountP2) * 0.4))
    );
    const scoutCountP2 = Math.max(
      2,
      phaseTargetTotal -
        harbingerCountP2 -
        splitterCountP2 -
        bastionCountP2 -
        eliteCountP2 -
        tankCountP2 -
        fighterCountP2
    );

    const formations: Array<'line' | 'vee' | 'stagger' | 'flank'> = ['vee', 'line', 'stagger', 'flank'];
    const formP1 = formations[waveNum % formations.length];
    const formP2 = formations[(waveNum + 2) % formations.length];

    const scoutBehaviors: EnemyBehavior[] = ['zigzag', 'diving', 'flank_sweep', 'evasive'];
    const fighterBehaviors: EnemyBehavior[] = ['sine', 'orbit_harass', 'retreat_strafe', 'formation'];
    const bomberBehaviors: EnemyBehavior[] = ['diving', 'flank_sweep', 'sine'];
    const eliteBehaviors: EnemyBehavior[] = ['tracking', 'evasive', 'orbit_harass', 'retreat_strafe'];

    const phase1Groups: WaveSpawnGroup[] = [
      {
        enemyClass: 'scout',
        count: scoutCountP1,
        behavior: scoutBehaviors[waveNum % scoutBehaviors.length],
        formation: formP1,
      },
      {
        enemyClass: 'interceptor',
        count: interceptorCountP1,
        behavior: waveNum % 2 === 0 ? 'rush_weave' : 'flank_sweep',
        formation: 'flank',
        delayMs: 650,
      },
      {
        enemyClass: 'fighter',
        count: fighterCountP1,
        behavior: fighterBehaviors[waveNum % fighterBehaviors.length],
        formation: formP1 === 'flank' ? 'flank' : 'stagger',
        delayMs: 1100,
      },
    ];
    if (bomberCountP1 > 0) {
      phase1Groups.push({
        enemyClass: 'bomber',
        count: bomberCountP1,
        behavior: bomberBehaviors[waveNum % bomberBehaviors.length],
        formation: 'line',
        delayMs: 1550,
      });
    }
    if (sniperCountP1 > 0) {
      phase1Groups.push({
        enemyClass: 'sniper',
        count: sniperCountP1,
        behavior: 'sniper_perch',
        formation: 'line',
        delayMs: 1850,
      });
    }

    const phase2Groups: WaveSpawnGroup[] = [
      {
        enemyClass: 'fighter',
        count: fighterCountP2,
        behavior: fighterBehaviors[(waveNum + 1) % fighterBehaviors.length],
        formation: formP2,
      },
      {
        enemyClass: 'scout',
        count: scoutCountP2,
        behavior: scoutBehaviors[(waveNum + 2) % scoutBehaviors.length],
        formation: 'flank',
        delayMs: 850,
      },
    ];
    if (tankCountP2 > 0) {
      phase2Groups.push({
        enemyClass: 'tank',
        count: tankCountP2,
        behavior: waveNum % 2 === 0 ? 'formation' : 'straight',
        formation: 'line',
        delayMs: 1150,
      });
    }
    if (bastionCountP2 > 0) {
      phase2Groups.push({
        enemyClass: 'bastion',
        count: bastionCountP2,
        behavior: 'fortress_march',
        formation: 'line',
        delayMs: 1350,
      });
    }
    if (splitterCountP2 > 0) {
      phase2Groups.push({
        enemyClass: 'splitter',
        count: splitterCountP2,
        behavior: 'pendulum_hover',
        formation: 'stagger',
        delayMs: 1550,
      });
    }
    if (eliteCountP2 > 0) {
      phase2Groups.push({
        enemyClass: 'elite',
        count: eliteCountP2,
        behavior: eliteBehaviors[waveNum % eliteBehaviors.length],
        formation: 'vee',
        delayMs: 1750,
      });
    }
    if (harbingerCountP2 > 0) {
      phase2Groups.push({
        enemyClass: 'harbinger',
        count: harbingerCountP2,
        behavior: 'phase_weave',
        formation: 'flank',
        delayMs: 1950,
      });
    }

    return {
      id: waveNum,
      title: `Endless Wave ${waveNum}`,
      spawnIntervalMs: interval,
      phases: [
        { groups: phase1Groups, spawnIntervalMs: interval },
        { groups: phase2Groups, spawnIntervalMs: Math.max(330, interval - 20) },
      ],
    };
  }

  private startWave(wave: WaveDefinition): void {
    this.waveStarted = true;
    this.activeWave = wave;
    this.currentPhaseIdx = 0;
    this.phaseTransitionMs = 0;
    this.enqueuePhase(wave.phases[0], wave.spawnIntervalMs);
    this.onPhaseStarted?.(this.currentWaveIdx + 1, 1);
  }

  private enqueuePhase(phase: WavePhaseDefinition, defaultIntervalMs: number): void {
    this.phaseElapsedMs = 0;
    this.spawnQueue = [];
    const baseInterval = phase.spawnIntervalMs ?? defaultIntervalMs;
    const intervalMult = Math.max(0.55, Math.min(1.4, this.waveModifiers.spawnIntervalMult ?? 1));
    const interval = Math.max(250, Math.round(baseInterval * intervalMult));

    phase.groups.forEach((group) => {
      this.enqueueGroup(group, interval);
    });

    this.spawnQueue.sort((a, b) => a.spawnAtMs - b.spawnAtMs);
  }

  private maybePromoteEnemyClass(baseClass: EnemyClass, idx: number): EnemyClass {
    const eliteChance = Math.max(0, Math.min(0.45, this.waveModifiers.eliteChanceBonus ?? 0));
    if (eliteChance <= 0) return baseClass;

    // Deterministic-friendly stochastic promotion of light ships on higher difficulties
    if (baseClass === 'scout' && Math.random() < eliteChance * 0.65) {
      return idx % 3 === 0 ? 'fighter' : 'interceptor';
    }
    if (baseClass === 'fighter' && Math.random() < eliteChance * 0.55) {
      return this.level.levelNumber >= 7 && idx % 4 === 0 ? 'harbinger' : 'elite';
    }
    if (baseClass === 'bomber' && this.level.levelNumber >= 4 && Math.random() < eliteChance * 0.4) {
      return 'splitter';
    }
    return baseClass;
  }

  private enqueueGroup(group: WaveSpawnGroup, intervalMs: number): void {
    const baseDelay = group.delayMs ?? 0;
    const densityMult = Math.max(0.6, Math.min(1.8, this.waveModifiers.densityMult ?? 1));
    const count = Math.max(1, Math.round(group.count * densityMult));

    for (let i = 0; i < count; i++) {
      let xRatio = 0.15 + ((i + 0.5) / Math.max(1, count)) * 0.7;
      let yOffset = 0;
      let spawnAtMs = baseDelay + i * intervalMs;

      switch (group.formation) {
        case 'vee': {
          const mid = (count - 1) / 2;
          const distFromMid = Math.abs(i - mid);
          xRatio = 0.5 + ((i - mid) / Math.max(1, mid)) * 0.36;
          yOffset = distFromMid * 22;
          spawnAtMs = baseDelay + distFromMid * (intervalMs * 0.55);
          break;
        }
        case 'line': {
          xRatio = 0.14 + ((i + 0.5) / count) * 0.72;
          spawnAtMs = baseDelay + i * (intervalMs * 0.35);
          break;
        }
        case 'flank': {
          xRatio = i % 2 === 0 ? 0.12 + i * 0.04 : 0.88 - i * 0.04;
          break;
        }
        case 'stagger':
        default: {
          xRatio = 0.12 + ((i * 0.37) % 0.76);
          break;
        }
      }

      this.spawnQueue.push({
        enemyClass: this.maybePromoteEnemyClass(group.enemyClass, i),
        xRatio,
        yOffset,
        behavior: group.behavior,
        spawnAtMs,
      });
    }
  }

  clearAll(): void {
    this.spawnQueue = [];
    this.phaseTransitionMs = 0;
    this.enemyPool.releaseAll();
  }

  destroy(): void {
    this.enemyPool.forEachActive((e) => e.destroy());
    this.clearAll();
  }
}
