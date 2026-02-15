/**
 * 投降按钮 - 使用 Zone 确保点击可靠
 */

import Phaser from 'phaser';
import { COLORS, PIXEL_FONT } from '../config';

export class SurrenderButton {
  private zone: Phaser.GameObjects.Zone;
  private container: Phaser.GameObjects.Container;
  private bg: Phaser.GameObjects.Graphics;
  private text: Phaser.GameObjects.Text;
  private onClickCb?: () => void;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    const w = 120;
    const h = 36;

    this.zone = scene.add.zone(x, y, w, h).setInteractive({ useHandCursor: true });
    this.zone.setDepth(500);
    this.zone.on('pointerdown', () => this.onClickCb?.());

    this.container = scene.add.container(x, y);
    this.bg = scene.add.graphics();
    this.text = scene.add
      .text(0, 0, 'SURRENDER', {
        fontSize: '10px',
        color: '#ffffff',
        fontFamily: PIXEL_FONT,
      })
      .setOrigin(0.5);

    this.container.add([this.bg, this.text]);
    this.container.setDepth(499);
    this.container.setScrollFactor(0);

    this.zone.on('pointerover', () => this.text.setColor('#cccccc'));
    this.zone.on('pointerout', () => this.text.setColor('#ffffff'));
    this.draw();
  }

  setOnClick(cb: () => void): void {
    this.onClickCb = cb;
  }

  private draw(): void {
    this.bg.clear();
    this.bg.fillStyle(COLORS.bgMid, 0.9);
    this.bg.fillRoundedRect(-60, -18, 120, 36, 6);
    this.bg.lineStyle(2, COLORS.textDim, 1);
    this.bg.strokeRoundedRect(-60, -18, 120, 36, 6);
  }

  destroy(): void {
    this.zone.destroy();
    this.container.destroy();
  }
}
