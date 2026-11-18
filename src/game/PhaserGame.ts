import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { BossScene } from './scenes/BossScene';
import { GameOverScene } from './scenes/GameOverScene';
import { GameScene } from './scenes/GameScene';
import { HangarScene } from './scenes/HangarScene';
import { LevelResultScene } from './scenes/LevelResultScene';
import { MainMenuScene } from './scenes/MainMenuScene';
import { PauseMenuScene } from './scenes/PauseMenuScene';
import { PreloadScene } from './scenes/PreloadScene';
import { VictoryScene } from './scenes/VictoryScene';
import { StorageManager } from './utils/StorageManager';

function buildConfig(parentId: string, renderType: number): Phaser.Types.Core.GameConfig {
  const settings = StorageManager.load().settings;
  const width = Math.max(320, window.innerWidth || 1280);
  const height = Math.max(240, window.innerHeight || 720);

  return {
    type: renderType,
    parent: parentId,
    backgroundColor: '#040711',
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width,
      height,
    },
    input: {
      activePointers: 3,
    },
    render: {
      antialias: settings.performanceQuality !== 'balanced',
      powerPreference: 'high-performance',
    },
    scene: [
      BootScene,
      PreloadScene,
      MainMenuScene,
      HangarScene,
      GameScene,
      BossScene,
      PauseMenuScene,
      LevelResultScene,
      GameOverScene,
      VictoryScene,
    ],
  };
}

export function createPhaserGame(parentId: string): Phaser.Game {
  try {
    return new Phaser.Game(buildConfig(parentId, Phaser.AUTO));
  } catch {
    const parentEl = document.getElementById(parentId);
    if (parentEl) {
      parentEl.innerHTML = '';
    }
    return new Phaser.Game(buildConfig(parentId, Phaser.CANVAS));
  }
}
