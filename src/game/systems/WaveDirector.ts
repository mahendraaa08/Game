import Phaser from 'phaser';
import { EnemyBehavior, EnemyClass } from '../config/EnemyConfig';
import { GameMode } from '../config/GameModeConfig';
import { LevelDefinition, WaveDefinition, WaveSpawnGroup } from '../config/LevelConfig';
import { EnemyEntity } from '../entities/Enemy';
import { ObjectPool } from '../utils/ObjectPool';

interface ScheduledSpawn {
  enemyClass: EnemyClass;
  xRatio: number;
  yOffset: number;
  behavior?: EnemyBehavior;
  spawnAtMs: number;
}

export class WaveDirector {
  private scene: Phaser.Scene;
  private level: LevelDefinition;
  private mode: GameMode;
  private enemyPool: ObjectPool<EnemyEntity>;
  private onEnemyEncounter?: (enemyClass: EnemyClass) => void;
  private onWaveCleared?: (waveNum: number) => void;

  currentWaveIdx = 0;
  totalWaves: number;
  private waveElapsedMs = 0;
  private waveCooldownMs = 900;
  private spawnQueue: ScheduledSpawn[] = [];
  private waveStarted = false;
  private allWavesCompleted = false;

  constructor(
    scene: Phaser.Scene,
    level: LevelDefinition,
    mode: GameMode = 'campaign',
    onEnemyEncounter?: (enemyClass: EnemyClass) => void,
    onWaveCleared?: (waveNum: number) => void
  ) {
    this.scene = scene;
    this.level = level;
    this.mode = mode;
    this.totalWaves = mode === 'endless' ? 999 : mode === 'boss_rush' ? 0 : level.waves.length;
    this.onEnemyEncounter = onEnemyEncounter;
    this.onWaveCleared = onWaveCleared;

    this.enemyPool = new ObjectPool<EnemyEntity>(
      () => new EnemyEntity(scene),
      18,
      70
    );

    if (mode === 'boss_rush') {
      this.allWavesCompleted = true;
    }
  }

  getActiveEnemies(): EnemyEntity[] {
    return this.enemyPool.getActiveItems();
  }

  spawnDirectMinion(enemyClass: EnemyClass, x: number, y: number): void {
    const e = this.enemyPool.acquire();
    if (!e) return;
    const diff =
      this.mode === 'endless'
        ? 1 + this.currentWaveIdx * 0.1
        : this.level.difficultyMultiplier;
    e.spawn(enemyClass, x, y, 'diving', diff);
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

    this.waveElapsedMs += dtMs;
    const w = this.scene.scale.width;
    const diff =
      this.mode === 'endless'
        ? 1 + this.currentWaveIdx * 0.11
        : this.level.difficultyMultiplier;

    while (this.spawnQueue.length > 0 && this.spawnQueue[0].spawnAtMs <= this.waveElapsedMs) {
      const next = this.spawnQueue.shift()!;
      const e = this.enemyPool.acquire();
      if (e) {
        const sx = Phaser.Math.Clamp(next.xRatio * w, 52, w - 52);
        e.spawn(next.enemyClass, sx, -36 - next.yOffset, next.behavior, diff);
        this.onEnemyEncounter?.(next.enemyClass);
      }
    }

    // Check if wave cleared
    if (this.spawnQueue.length === 0 && this.enemyPool.getActiveItems().length === 0) {
      this.onWaveCleared?.(this.currentWaveIdx + 1);
      if (this.mode === 'endless' || this.currentWaveIdx < this.totalWaves - 1) {
        this.currentWaveIdx++;
        this.waveStarted = false;
        this.waveCooldownMs = 1000;
      } else {
        this.allWavesCompleted = true;
      }
    }
  }

  private generateEndlessWave(waveNum: number): WaveDefinition {
    const interval = Math.max(290, 620 - waveNum * 22);
    const scoutCount = Math.min(14, 5 + Math.floor(waveNum * 0.8));
    const fighterCount = Math.min(9, 2 + Math.floor(waveNum * 0.65));
    const bomberCount = waveNum >= 2 ? Math.min(6, Math.floor(waveNum * 0.5)) : 0;
    const tankCount = waveNum >= 3 ? Math.min(5, Math.floor(waveNum * 0.35)) : 0;
    const eliteCount = waveNum >= 4 ? Math.min(6, Math.floor(waveNum * 0.4)) : 0;

    const formations: Array<'line' | 'vee' | 'stagger' | 'flank'> = ['vee', 'line', 'stagger', 'flank'];
    const form = formations[waveNum % formations.length];

    const groups: WaveSpawnGroup[] = [
      { enemyClass: 'scout', count: scoutCount, behavior: waveNum % 2 === 0 ? 'zigzag' : 'diving', formation: form },
      { enemyClass: 'fighter', count: fighterCount, behavior: 'sine', formation: 'stagger', delayMs: 900 },
    ];
    if (bomberCount > 0) {
      groups.push({ enemyClass: 'bomber', count: bomberCount, behavior: 'diving', delayMs: 1400 });
    }
    if (tankCount > 0) {
      groups.push({ enemyClass: 'tank', count: tankCount, behavior: 'straight', formation: 'line', delayMs: 1800 });
    }
    if (eliteCount > 0) {
      groups.push({ enemyClass: 'elite', count: eliteCount, behavior: 'tracking', delayMs: 2200 });
    }

    return {
      id: waveNum,
      title: `Endless Wave ${waveNum}`,
      spawnIntervalMs: interval,
      groups,
    };
  }

  private startWave(wave: WaveDefinition): void {
    this.waveStarted = true;
    this.waveElapsedMs = 0;
    this.spawnQueue = [];

    wave.groups.forEach((group) => {
      this.enqueueGroup(group, wave.spawnIntervalMs);
    });

    this.spawnQueue.sort((a, b) => a.spawnAtMs - b.spawnAtMs);
  }

  private enqueueGroup(group: WaveSpawnGroup, intervalMs: number): void {
    const baseDelay = group.delayMs ?? 0;
    const count = group.count;

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
        enemyClass: group.enemyClass,
        xRatio,
        yOffset,
        behavior: group.behavior,
        spawnAtMs,
      });
    }
  }

  clearAll(): void {
    this.spawnQueue = [];
    this.enemyPool.releaseAll();
  }

  destroy(): void {
    this.enemyPool.forEachActive((e) => e.destroy());
    this.clearAll();
  }
}
