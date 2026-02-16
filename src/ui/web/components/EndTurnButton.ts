/**
 * END TURN 按钮 - 使用 Zone 确保点击可靠
 */

import Phaser from 'phaser';
import { COLORS, PIXEL_FONT } from '../config';

export class EndTurnButton {
  private zone: Phaser.GameObjects.Zone;
  private container: Phaser.GameObjects.Container;
  private bg: Phaser.GameObjects.Graphics;
  private text: Phaser.GameObjects.Text;
  private enabled: boolean = true;
  private onClickCb?: () => void;
  private onDisabledClickCb?: () => void;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    const w = 140;
    const h = 56;

    this.zone = scene.add.zone(x, y, w, h).setInteractive({ useHandCursor: true });
    this.zone.setDepth(500);
    this.zone.on('pointerdown', () => {
      if (this.enabled && this.onClickCb) this.onClickCb();
      else if (!this.enabled && this.onDisabledClickCb) this.onDisabledClickCb();
    });

    this.container = scene.add.container(x, y);
    this.bg = scene.add.graphics();
    this.text = scene.add
      .text(0, 0, 'END TURN', {
        fontSize: '12px',
        color: '#ffffff',
        fontFamily: PIXEL_FONT,
      })
      .setOrigin(0.5);

    this.container.add([this.bg, this.text]);
    this.container.setDepth(499);
    this.container.setScrollFactor(0);

    this.zone.on('pointerover', () => {
      if (this.enabled) this.text.setColor('#cccccc');
    });
    this.zone.on('pointerout', () => {
      this.text.setColor(this.enabled ? '#ffffff' : '#555555');
    });
    this.draw();
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.text.setColor(enabled ? '#ffffff' : '#555555');
    this.draw();
  }

  setLabel(text: string): void {
    this.text.setText(text);
  }

  setOnClick(cb: () => void): void {
    this.onClickCb = cb;
  }

  setOnDisabledClick(cb?: () => void): void {
    this.onDisabledClickCb = cb;
  }

  private draw(): void {
    this.bg.clear();
    const w = 140;
    const h = 56;
    this.bg.fillStyle(this.enabled ? COLORS.bgLight : COLORS.bgMid, 1);
    this.bg.fillRoundedRect(-w / 2, -h / 2, w, h, 8);
    this.bg.lineStyle(2, this.enabled ? COLORS.text : COLORS.textDim, 1);
    this.bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 8);
  }

  destroy(): void {
    this.zone.destroy();
    this.container.destroy();
  }
}
