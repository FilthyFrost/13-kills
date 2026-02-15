/**
 * ROUND N 显示
 */

import Phaser from 'phaser';
import { WIDTH, HEIGHT, COLORS, PIXEL_FONT } from '../config';

export class RoundDisplay {
  private text: Phaser.GameObjects.Text;
  private bg: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, x: number = WIDTH / 2, y: number = 50) {
    this.bg = scene.add.graphics();
    this.bg.setScrollFactor(0);
    this.bg.setDepth(100);
    this.text = scene.add
      .text(x, y, 'ROUND 1', {
        fontSize: '20px',
        color: '#ffffff',
        fontFamily: PIXEL_FONT,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(101)
      .setStroke('#000000', 1);

    this.setRound(1);
  }

  setRound(n: number): void {
    this.text.setText(`ROUND ${n}`);
    this.bg.clear();
    const w = 160;
    const h = 48;
    const x = this.text.x - w / 2;
    const y = this.text.y - h / 2;
    this.bg.fillStyle(0xffffff, 0.15);
    this.bg.fillRoundedRect(x, y, w, h, 8);
    this.bg.lineStyle(2, COLORS.text, 0.6);
    this.bg.strokeRoundedRect(x, y, w, h, 8);
  }

  /**
   * 全屏显示 ROUND N，淡入停留淡出后回调
   */
  showFullScreenRound(n: number, onComplete: () => void): void {
    const cx = WIDTH / 2;
    const cy = HEIGHT / 2 - 40;

    const bigText = this.text.scene.add
      .text(cx, cy, `ROUND ${n}`, {
        fontSize: '36px',
        color: '#ffffff',
        fontFamily: PIXEL_FONT,
      })
      .setOrigin(0.5)
      .setDepth(150)
      .setAlpha(0)
      .setStroke('#ffffff', 1);

    this.text.scene.tweens.add({
      targets: bigText,
      alpha: 1,
      duration: 300,
      ease: 'Power2',
    });

    this.text.scene.time.delayedCall(1000, () => {
      this.text.scene.tweens.add({
        targets: bigText,
        alpha: 0,
        duration: 300,
        ease: 'Power2',
        onComplete: () => {
          bigText.destroy();
          onComplete();
        },
      });
    });
  }

  destroy(): void {
    this.text.destroy();
    this.bg.destroy();
  }
}
