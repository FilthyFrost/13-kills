/**
 * 头像框（玩家/敌人复用）
 */

import Phaser from 'phaser';
import { COLORS } from '../config';

export class PortraitFrame {
  private frame: Phaser.GameObjects.Graphics;
  private placeholder: Phaser.GameObjects.Graphics;
  private size: number;

  constructor(scene: Phaser.Scene, x: number, y: number, size: number = 80) {
    this.size = size;

    this.frame = scene.add.graphics();
    this.frame.setScrollFactor(0);
    this.frame.setDepth(40);
    this.placeholder = scene.add.graphics();
    this.placeholder.setScrollFactor(0);
    this.placeholder.setDepth(41);

    this.setPosition(x, y);
  }

  setPosition(x: number, y: number): void {
    this.frame.clear();
    this.placeholder.clear();
    const s = this.size;
    this.frame.fillStyle(COLORS.bgLight, 1);
    this.frame.fillRoundedRect(x - s / 2, y - s / 2, s, s, 8);
    this.frame.lineStyle(2, COLORS.textDim, 1);
    this.frame.strokeRoundedRect(x - s / 2, y - s / 2, s, s, 8);
    this.placeholder.fillStyle(COLORS.bgMid, 1);
    this.placeholder.fillRoundedRect(x - s / 2 + 4, y - s / 2 + 4, s - 8, s - 8, 4);
  }

  setImage(key: string): void {
    // Phase 5 可替换为实际头像
  }

  destroy(): void {
    this.frame.destroy();
    this.placeholder.destroy();
  }
}
