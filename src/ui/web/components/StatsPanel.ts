/**
 * 攻击/防御面板 - 使用图片图标，参考图3长宽比
 */

import Phaser from 'phaser';
import { PIXEL_STATS_FONT } from '../config';

const PANEL_WIDTH = 44;
const PANEL_HEIGHT = 72;
const PAD = 6;
const ICON_SIZE = 18;

/** 绘制浅灰虚线边框（矩形四边） */
function drawDashedBorder(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  w: number,
  h: number
): void {
  const dash = 3;
  const gap = 2;
  const color = 0xaaaaaa;
  g.lineStyle(1, color, 1);

  const drawDashedLine = (x1: number, y1: number, x2: number, y2: number) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    const ux = dx / len;
    const uy = dy / len;
    let t = 0;
    while (t < len) {
      const tEnd = Math.min(t + dash, len);
      g.beginPath();
      g.moveTo(x1 + ux * t, y1 + uy * t);
      g.lineTo(x1 + ux * tEnd, y1 + uy * tEnd);
      g.strokePath();
      t = tEnd + gap;
    }
  };

  drawDashedLine(x, y, x + w, y);
  drawDashedLine(x + w, y, x + w, y + h);
  drawDashedLine(x + w, y + h, x, y + h);
  drawDashedLine(x, y + h, x, y);
}

export class StatsPanel {
  private container: Phaser.GameObjects.Container;
  private bg: Phaser.GameObjects.Graphics;
  private border: Phaser.GameObjects.Graphics;
  private attackIcon: Phaser.GameObjects.Image;
  private defenseIcon: Phaser.GameObjects.Image;
  private attackText: Phaser.GameObjects.Text;
  private defenseText: Phaser.GameObjects.Text;
  private mirrored: boolean;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    mirrored: boolean = false
  ) {
    this.mirrored = mirrored;
    this.container = scene.add.container(x, y);
    this.container.setDepth(45);
    this.container.setScrollFactor(0);

    this.bg = scene.add.graphics();
    this.border = scene.add.graphics();

    this.attackIcon = scene.add.image(0, 0, 'stats_icon_attack');
    this.attackIcon.setDisplaySize(ICON_SIZE, ICON_SIZE);
    this.attackIcon.setOrigin(0.5);

    this.defenseIcon = scene.add.image(0, 0, 'stats_icon_defense');
    this.defenseIcon.setDisplaySize(ICON_SIZE, ICON_SIZE);
    this.defenseIcon.setOrigin(0.5);

    this.attackText = scene.add
      .text(0, 0, '5', {
        fontSize: '8px',
        color: '#ffffff',
        fontFamily: PIXEL_STATS_FONT,
      })
      .setOrigin(mirrored ? 1 : 0, 0.5);
    this.defenseText = scene.add
      .text(0, 0, '2', {
        fontSize: '8px',
        color: '#ffffff',
        fontFamily: PIXEL_STATS_FONT,
      })
      .setOrigin(mirrored ? 1 : 0, 0.5);

    this.container.add([
      this.bg,
      this.border,
      this.attackIcon,
      this.defenseIcon,
      this.attackText,
      this.defenseText,
    ]);

    this.draw(5, 2);
  }

  private draw(attack: number, defense: number): void {
    const w = PANEL_WIDTH;
    const h = PANEL_HEIGHT;
    const halfW = w / 2;
    const halfH = h / 2;

    this.bg.clear();
    this.bg.fillStyle(0x000000, 1);
    this.bg.fillRoundedRect(-halfW, -halfH, w, h, 4);

    this.border.clear();
    drawDashedBorder(this.border, -halfW + 1, -halfH + 1, w - 2, h - 2);

    const row1Y = -halfH + PAD + 14;
    const row2Y = halfH - PAD - 14;
    const iconX = this.mirrored
      ? halfW - PAD - ICON_SIZE / 2 - 2
      : -halfW + PAD + ICON_SIZE / 2 + 2;
    const textX = this.mirrored ? -halfW + PAD + 6 : halfW - PAD - 6;

    this.attackIcon.setPosition(iconX, row1Y);
    this.defenseIcon.setPosition(iconX, row2Y);

    this.attackText.setPosition(textX, row1Y);
    this.attackText.setText(String(attack));
    this.defenseText.setPosition(textX, row2Y);
    this.defenseText.setText(String(defense));
  }

  setAttack(n: number): void {
    const defense = parseInt(this.defenseText.text, 10) || 0;
    this.draw(n, defense);
  }

  setDefense(n: number): void {
    const attack = parseInt(this.attackText.text, 10) || 0;
    this.draw(attack, n);
  }

  setStats(attack: number, defense: number): void {
    this.draw(attack, defense);
  }

  destroy(): void {
    this.container.destroy();
  }
}
