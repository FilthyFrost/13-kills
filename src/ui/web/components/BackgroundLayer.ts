/**
 * 漩涡/暗色背景
 */

import Phaser from 'phaser';
import { WIDTH, HEIGHT, COLORS } from '../config';

export class BackgroundLayer {
  private graphics: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene) {
    this.graphics = scene.add.graphics();
    this.graphics.setScrollFactor(0);
    this.graphics.setDepth(-1000);
    this.draw();
  }

  private draw(): void {
    this.graphics.clear();
    this.graphics.fillStyle(COLORS.bgDark, 1);
    this.graphics.fillRect(0, 0, WIDTH, HEIGHT);

    // 漩涡效果：螺旋弧线
    const cx = WIDTH / 2;
    const cy = HEIGHT / 2;
    const maxR = Math.max(WIDTH, HEIGHT) * 0.7;
    for (let i = 0; i < 12; i++) {
      const startAngle = (i / 12) * Math.PI * 2;
      this.graphics.lineStyle(2, COLORS.bgLight, 0.15);
      this.graphics.beginPath();
      for (let r = 20; r < maxR; r += 8) {
        const angle = startAngle + (r / maxR) * Math.PI * 4;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        if (r === 20) this.graphics.moveTo(x, y);
        else this.graphics.lineTo(x, y);
      }
      this.graphics.strokePath();
    }
  }

  destroy(): void {
    this.graphics.destroy();
  }
}
