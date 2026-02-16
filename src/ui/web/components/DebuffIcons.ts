/**
 * DEBUFF 图标显示 - 在 StatsPanel 上方垂直堆叠，支持悬停提示 - 图标上下弹跳
 */

import Phaser from 'phaser';
import { addIconBounce } from '../utils/idleAnimations';
import type { BuffId } from '../../../core/types';

const ICON_SIZE = 24;
const ICON_GAP = 4;
const CIRCLE_RADIUS = 14;
const TOOLTIP_OFFSET_X = 40;
const TOOLTIP_MAX_WIDTH = 200;
const TOOLTIP_PAD = 8;

export interface DebuffDisplay {
  id: BuffId;
  stacks: number;
  iconKey: string;
  tooltipText?: string;
}

export class DebuffIcons {
  private container: Phaser.GameObjects.Container;
  private iconContainers: Phaser.GameObjects.Container[] = [];
  private bounceTweens: Phaser.Tweens.Tween[] = [];
  private tooltipBg: Phaser.GameObjects.Graphics | null = null;
  private tooltipText: Phaser.GameObjects.Text | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.container = scene.add.container(x, y);
    this.container.setDepth(450);
    this.container.setScrollFactor(0);
  }

  setBuffs(buffs: DebuffDisplay[]): void {
    this.bounceTweens.forEach((t) => t.remove());
    this.bounceTweens = [];
    this.iconContainers.forEach((c) => c.destroy());
    this.iconContainers = [];
    this.hideTooltip();

    buffs.forEach((buff, i) => {
      if (!this.container.scene.textures.exists(buff.iconKey)) return;
      const y = -i * (ICON_SIZE + ICON_GAP);

      const iconContainer = this.container.scene.add.container(0, y);

      const bg = this.container.scene.add.graphics();
      bg.fillStyle(0xffffff, 1);
      bg.fillCircle(0, 0, CIRCLE_RADIUS);
      bg.lineStyle(1, 0x888888, 0.5);
      bg.strokeCircle(0, 0, CIRCLE_RADIUS);
      iconContainer.add(bg);

      const icon = this.container.scene.add.image(0, 0, buff.iconKey);
      icon.setDisplaySize(ICON_SIZE, ICON_SIZE);
      icon.setOrigin(0.5);
      iconContainer.add(icon);

      iconContainer.setSize(CIRCLE_RADIUS * 2, CIRCLE_RADIUS * 2);
      iconContainer.setInteractive({ useHandCursor: true });
      const tooltipText = buff.tooltipText;
      iconContainer.on('pointerover', () => {
        if (tooltipText) this.showTooltip(tooltipText, 0, y);
      });
      iconContainer.on('pointerout', () => this.hideTooltip());

      this.container.add(iconContainer);
      this.iconContainers.push(iconContainer);
      this.bounceTweens.push(addIconBounce(this.container.scene, iconContainer));
    });
    if (buffs.length > 0) {
      this.container.scene.children.bringToTop(this.container);
    }
  }

  private showTooltip(text: string, iconX: number, iconY: number): void {
    this.hideTooltip();
    const scene = this.container.scene;
    const worldX = this.container.x + iconX + TOOLTIP_OFFSET_X;
    const worldY = this.container.y + iconY;

    this.tooltipText = scene.add
      .text(worldX, worldY, text, {
        fontSize: '10px',
        color: '#ffffff',
        fontFamily: 'Orbitron',
        wordWrap: { width: TOOLTIP_MAX_WIDTH },
        align: 'left',
      })
      .setOrigin(0, 0.5);
    this.tooltipText.setDepth(200);
    this.tooltipText.setScrollFactor(0);

    const bounds = this.tooltipText.getBounds();
    const pad = TOOLTIP_PAD;
    this.tooltipBg = scene.add.graphics();
    this.tooltipBg.fillStyle(0x000000, 0.9);
    this.tooltipBg.fillRoundedRect(
      bounds.left - pad,
      bounds.top - pad,
      bounds.width + pad * 2,
      bounds.height + pad * 2,
      4
    );
    this.tooltipBg.lineStyle(1, 0x888888, 1);
    this.tooltipBg.strokeRoundedRect(
      bounds.left - pad,
      bounds.top - pad,
      bounds.width + pad * 2,
      bounds.height + pad * 2,
      4
    );
    this.tooltipBg.setDepth(199);
    this.tooltipBg.setScrollFactor(0);
  }

  private hideTooltip(): void {
    if (this.tooltipBg) {
      this.tooltipBg.destroy();
      this.tooltipBg = null;
    }
    if (this.tooltipText) {
      this.tooltipText.destroy();
      this.tooltipText = null;
    }
  }

  destroy(): void {
    this.bounceTweens.forEach((t) => t.remove());
    this.bounceTweens = [];
    this.hideTooltip();
    this.iconContainers.forEach((c) => c.destroy());
    this.iconContainers = [];
    this.container.destroy();
  }
}
