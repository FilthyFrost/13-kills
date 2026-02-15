/**
 * Phaser 入口，初始化 Game
 */

import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { MainMenuScene } from './scenes/MainMenuScene';
import { BattleScene } from './scenes/BattleScene';
import { GameOverScene } from './scenes/GameOverScene';
import { WIDTH, HEIGHT } from './config';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: WIDTH,
  height: HEIGHT,
  parent: 'game-container',
  backgroundColor: '#1a1a1a',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    orientation: Phaser.Scale.LANDSCAPE,
  },
  render: {
    pixelArt: true,
    antialias: false,
    roundPixels: true,
  },
  scene: [BootScene, MainMenuScene, BattleScene, GameOverScene],
  physics: {
    default: 'arcade',
    arcade: { debug: false },
  },
};

new Phaser.Game(config);
