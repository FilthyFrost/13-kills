/**
 * 胜负结算
 */

import Phaser from 'phaser';
import { WIDTH, HEIGHT } from '../config';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOver' });
  }

  create(data?: { winner: 'PLAYER_WIN' | 'ENEMY_WIN' }): void {
    const text = data?.winner === 'PLAYER_WIN' ? '胜利' : '失败';
    this.add
      .text(WIDTH / 2, HEIGHT / 2 - 40, text, {
        fontSize: '72px',
        color: data?.winner === 'PLAYER_WIN' ? '#4a4' : '#a44',
        fontFamily: 'sans-serif',
      })
      .setOrigin(0.5);

    this.add
      .text(WIDTH / 2, HEIGHT / 2 + 40, '点击重新开始', {
        fontSize: '24px',
        color: '#888',
        fontFamily: 'sans-serif',
      })
      .setOrigin(0.5);

    this.input.once('pointerdown', () => {
      this.scene.start('MainMenu');
    });
  }
}
