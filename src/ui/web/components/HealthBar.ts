/**
 * HP 条 + 数字
 */

import Phaser from 'phaser';
import { COLORS, PIXEL_FONT } from '../config';

export class HealthBar {
  private bgBar: Phaser.GameObjects.Graphics;
  private fillBar: Phaser.GameObjects.Graphics;
  private text: Phaser.GameObjects.Text;
  private x: number;
  private y: number;
  private width: number;
  private height: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number = 120,
    height: number = 16
  ) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;

    this.bgBar = scene.add.graphics();
    this.bgBar.setScrollFactor(0);
    this.bgBar.setDepth(50);
    this.fillBar = scene.add.graphics();
    this.fillBar.setScrollFactor(0);
    this.fillBar.setDepth(51);
    this.text = scene.add
      .text(x + width / 2, y + height / 2, '10/10', {
        fontSize: '10px',
        color: '#ffffff',
        fontFamily: PIXEL_FONT,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(52)
      .setStroke('#000000', 1);

    this.setHP(10, 10);
  }

  setHP(current: number, max: number): void {
    this.text.setText(`${current}/${max}`);
    this.bgBar.clear();
    this.bgBar.fillStyle(COLORS.bgMid, 1);
    this.bgBar.fillRoundedRect(this.x, this.y, this.width, this.height, 4);

    this.fillBar.clear();
    const ratio = Math.max(0, Math.min(1, current / max));
    this.fillBar.fillStyle(COLORS.accent, 1);
    this.fillBar.fillRoundedRect(
      this.x,
      this.y,
      this.width * ratio,
      this.height,
      4
    );
  }

  destroy(): void {
    this.bgBar.destroy();
    this.fillBar.destroy();
    this.text.destroy();
  }
}
