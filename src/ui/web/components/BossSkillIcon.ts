/**
 * BOSS 技能图标 - 显示在 enemyStats 上方，悬停显示技能说明 - 图标上下弹跳
 */

import Phaser from 'phaser';
import { addIconBounce } from '../utils/idleAnimations';

const ICON_SIZE = 24;
const CIRCLE_RADIUS = 14;
const TOOLTIP_OFFSET_X = -50;
const TOOLTIP_MAX_WIDTH = 180;
const TOOLTIP_PAD = 8;

export class BossSkillIcon {
  private container: Phaser.GameObjects.Container;
  private circleBg: Phaser.GameObjects.Graphics | null = null;
  private icon: Phaser.GameObjects.Image | null = null;
  private tooltipBg: Phaser.GameObjects.Graphics | null = null;
  private tooltipText: Phaser.GameObjects.Text | null = null;
  private bounceTween: Phaser.Tweens.Tween | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.container = scene.add.container(x, y);
    this.container.setDepth(150);
    this.container.setScrollFactor(0);
  }

  setSkill(iconKey: string, tooltipText: string): void {
    this.hideTooltip();
    this.bounceTween?.remove();
    this.bounceTween = null;
    if (this.circleBg) {
      this.circleBg.destroy();
      this.circleBg = null;
    }
    if (this.icon) {
      this.icon.destroy();
      this.icon = null;
    }

    const scene = this.container.scene;
    if (!scene.textures.exists(iconKey)) return;

    this.circleBg = scene.add.graphics();
    this.circleBg.fillStyle(0xffffff, 1);
    this.circleBg.fillCircle(0, 0, CIRCLE_RADIUS);
    this.circleBg.lineStyle(1, 0x888888, 0.5);
    this.circleBg.strokeCircle(0, 0, CIRCLE_RADIUS);
    this.container.add(this.circleBg);

    this.icon = scene.add.image(0, 0, iconKey);
    this.icon.setDisplaySize(ICON_SIZE, ICON_SIZE);
    this.icon.setOrigin(0.5);
    this.icon.setInteractive({ useHandCursor: true });
    this.icon.on('pointerover', () => this.showTooltip(tooltipText));
    this.icon.on('pointerout', () => this.hideTooltip());
    this.container.add(this.icon);
    this.bounceTween = addIconBounce(scene, this.icon);
  }

  setVisible(visible: boolean): void {
    this.container.setVisible(visible);
  }

  setPosition(x: number, y: number): void {
    this.container.setPosition(x, y);
  }

  private showTooltip(text: string): void {
    this.hideTooltip();
    const scene = this.container.scene;
    const worldX = this.container.x + TOOLTIP_OFFSET_X;
    const worldY = this.container.y;

    this.tooltipText = scene.add
      .text(worldX, worldY, text, {
        fontSize: '10px',
        color: '#ffffff',
        fontFamily: 'Orbitron',
        wordWrap: { width: TOOLTIP_MAX_WIDTH },
        align: 'left',
      })
      .setOrigin(1, 0.5);
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
    this.bounceTween?.remove();
    this.bounceTween = null;
    this.hideTooltip();
    this.circleBg?.destroy();
    this.circleBg = null;
    this.icon?.destroy();
    this.icon = null;
    this.container.destroy();
  }
}
