/**
 * 速度控制 x0.5/x1/x2/x3 - 使用 Zone 确保点击可靠
 */

import Phaser from 'phaser';
import { COLORS, PIXEL_FONT } from '../config';

const SPEEDS = [0.5, 1, 2, 3] as const;

export class SpeedPanel {
  private container: Phaser.GameObjects.Container;
  private zones: Phaser.GameObjects.Zone[] = [];
  private buttons: Phaser.GameObjects.Text[] = [];
  private selectedIndex: number = 1;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.container = scene.add.container(x, y);
    this.container.setDepth(500);

    const label = scene.add.text(0, -25, 'SPEED', {
      fontSize: '10px',
      color: '#888',
      fontFamily: PIXEL_FONT,
    }).setOrigin(0.5);
    this.container.add(label);

    SPEEDS.forEach((speed, i) => {
      const btnX = i * 50 - 75;
      const zone = scene.add.zone(x + btnX, y, 44, 28).setInteractive({ useHandCursor: true });
      zone.setDepth(501);
      zone.on('pointerdown', () => this.setSpeed(i));
      zone.on('pointerover', () => {
        this.buttons[i].setColor('#aaa');
      });
      zone.on('pointerout', () => {
        this.buttons[i].setColor(i === this.selectedIndex ? '#fff' : '#888');
      });
      this.zones.push(zone);

      const btn = scene.add
        .text(btnX, 0, `x${speed}`, {
          fontSize: '10px',
          color: i === this.selectedIndex ? '#fff' : '#888',
          fontFamily: PIXEL_FONT,
        })
        .setOrigin(0.5);
      this.buttons.push(btn);
      this.container.add(btn);
    });
  }

  private setSpeed(index: number): void {
    this.selectedIndex = index;
    this.buttons.forEach((btn, i) => {
      btn.setColor(i === index ? '#fff' : '#888');
    });
    this.container.scene.time.timeScale = SPEEDS[index];
  }

  destroy(): void {
    this.zones.forEach((z) => z.destroy());
    this.container.destroy();
  }
}
