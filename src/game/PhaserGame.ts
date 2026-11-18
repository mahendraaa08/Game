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

export function createPhaserGame(parentId: string): Phaser.Game {
  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent: parentId,
    backgroundColor: '#040711',
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: window.innerWidth,
      height: window.innerHeight,
    },
    input: {
      activePointers: 3,
    },
    render: {
      antialias: true,
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

  return new Phaser.Game(config);
}
