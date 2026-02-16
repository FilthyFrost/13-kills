/**
 * BOSS 信息面板 - 名称、基础能力、特性（无头像，整洁排版）- 图标上下弹跳
 */

import Phaser from 'phaser';
import { COLORS, PIXEL_FONT, PIXEL_STATS_FONT } from '../config';
import { addIconBounce } from '../utils/idleAnimations';

const PANEL_WIDTH = 160;
const PANEL_PAD = 12;
const SECTION_GAP = 10;
const HP_BAR_WIDTH = 120;
const HP_BAR_HEIGHT = 14;
const ICON_SIZE = 18;
const TRAIT_ICON_SIZE = 24;
const CIRCLE_RADIUS = 14;
const TOOLTIP_MAX_WIDTH = 180;
const TOOLTIP_PAD = 8;

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

export interface BossTrait {
  iconKey: string;
  label: string;
  tooltipText: string;
}

export class BossInfoPanel {
  private container: Phaser.GameObjects.Container;
  private bg: Phaser.GameObjects.Graphics;
  private border: Phaser.GameObjects.Graphics;
  private nameText: Phaser.GameObjects.Text;
  private hpBarBg: Phaser.GameObjects.Graphics;
  private hpBarFill: Phaser.GameObjects.Graphics;
  private hpText: Phaser.GameObjects.Text;
  private baseLabel: Phaser.GameObjects.Text;
  private attackIcon: Phaser.GameObjects.Image;
  private defenseIcon: Phaser.GameObjects.Image;
  private attackText: Phaser.GameObjects.Text;
  private defenseText: Phaser.GameObjects.Text;
  private traitLabel: Phaser.GameObjects.Text;
  private traitIconContainer: Phaser.GameObjects.Container | null = null;
  private traitText: Phaser.GameObjects.Text | null = null;
  private tooltipBg: Phaser.GameObjects.Graphics | null = null;
  private tooltipText: Phaser.GameObjects.Text | null = null;
  private bounceTweens: Phaser.Tweens.Tween[] = [];
  private traitBounceTween: Phaser.Tweens.Tween | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.container = scene.add.container(x, y);
    this.container.setDepth(45);
    this.container.setScrollFactor(0);
    this.container.setVisible(false);

    this.bg = scene.add.graphics();
    this.border = scene.add.graphics();

    this.nameText = scene.add
      .text(0, 0, '', {
        fontSize: '14px',
        color: COLORS.text,
        fontFamily: PIXEL_FONT,
      })
      .setOrigin(0.5, 0);

    this.hpBarBg = scene.add.graphics();
    this.hpBarFill = scene.add.graphics();
    this.hpText = scene.add
      .text(0, 0, '0/0', {
        fontSize: '10px',
        color: '#ffffff',
        fontFamily: PIXEL_FONT,
      })
      .setOrigin(0.5)
      .setStroke('#000000', 1);

    this.baseLabel = scene.add
      .text(0, 0, '基础能力', {
        fontSize: '10px',
        color: COLORS.textDim,
        fontFamily: PIXEL_FONT,
      })
      .setOrigin(0, 0);

    this.attackIcon = scene.add.image(0, 0, 'stats_icon_attack');
    this.attackIcon.setDisplaySize(ICON_SIZE, ICON_SIZE);
    this.attackIcon.setOrigin(0, 0.5);

    this.defenseIcon = scene.add.image(0, 0, 'stats_icon_defense');
    this.defenseIcon.setDisplaySize(ICON_SIZE, ICON_SIZE);
    this.defenseIcon.setOrigin(0, 0.5);

    this.attackText = scene.add
      .text(0, 0, '0', {
        fontSize: '10px',
        color: COLORS.text,
        fontFamily: PIXEL_STATS_FONT,
      })
      .setOrigin(0, 0.5);

    this.defenseText = scene.add
      .text(0, 0, '0', {
        fontSize: '10px',
        color: COLORS.text,
        fontFamily: PIXEL_STATS_FONT,
      })
      .setOrigin(0, 0.5);

    this.traitLabel = scene.add
      .text(0, 0, '特性', {
        fontSize: '10px',
        color: COLORS.textDim,
        fontFamily: PIXEL_FONT,
      })
      .setOrigin(0, 0);

    this.container.add([
      this.bg,
      this.border,
      this.nameText,
      this.hpBarBg,
      this.hpBarFill,
      this.hpText,
      this.baseLabel,
      this.attackIcon,
      this.defenseIcon,
      this.attackText,
      this.defenseText,
      this.traitLabel,
    ]);

    this.redraw();
    this.bounceTweens.push(addIconBounce(scene, this.attackIcon));
    this.bounceTweens.push(addIconBounce(scene, this.defenseIcon));
  }

  setDisplayName(name: string): void {
    this.nameText.setText(name);
    this.redraw();
  }

  setHP(current: number, max: number): void {
    this.hpText.setText(`${current}/${max}`);
    this.hpBarBg.clear();
    this.hpBarBg.fillStyle(COLORS.bgMid, 1);
    this.hpBarBg.fillRoundedRect(
      -HP_BAR_WIDTH / 2,
      0,
      HP_BAR_WIDTH,
      HP_BAR_HEIGHT,
      4
    );
    this.hpBarFill.clear();
    const ratio = Math.max(0, Math.min(1, max > 0 ? current / max : 0));
    this.hpBarFill.fillStyle(COLORS.accent, 1);
    this.hpBarFill.fillRoundedRect(
      -HP_BAR_WIDTH / 2,
      0,
      HP_BAR_WIDTH * ratio,
      HP_BAR_HEIGHT,
      4
    );
    this.redraw();
  }

  setStats(attack: number, defense: number): void {
    this.attackText.setText(String(attack));
    this.defenseText.setText(String(defense));
    this.redraw();
  }

  setTrait(trait: BossTrait | null): void {
    this.traitBounceTween?.remove();
    this.traitBounceTween = null;
    if (this.traitIconContainer) {
      this.traitIconContainer.destroy();
      this.traitIconContainer = null;
    }
    if (this.traitText) {
      this.traitText.destroy();
      this.traitText = null;
    }
    this.hideTooltip();

    if (trait && this.container.scene.textures.exists(trait.iconKey)) {
      const scene = this.container.scene;

      this.traitIconContainer = scene.add.container(0, 0);

      const circleBg = scene.add.graphics();
      circleBg.fillStyle(0xffffff, 1);
      circleBg.fillCircle(0, 0, CIRCLE_RADIUS);
      circleBg.lineStyle(1, 0x888888, 0.5);
      circleBg.strokeCircle(0, 0, CIRCLE_RADIUS);
      this.traitIconContainer.add(circleBg);

      const icon = scene.add.image(0, 0, trait.iconKey);
      icon.setDisplaySize(TRAIT_ICON_SIZE, TRAIT_ICON_SIZE);
      icon.setOrigin(0.5);
      icon.setInteractive({ useHandCursor: true });
      icon.on('pointerover', () => this.showTooltip(trait.tooltipText));
      icon.on('pointerout', () => this.hideTooltip());
      this.traitIconContainer.add(icon);
      this.traitBounceTween = addIconBounce(scene, icon);

      this.traitText = scene.add
        .text(0, 0, trait.label, {
          fontSize: '10px',
          color: COLORS.text,
          fontFamily: PIXEL_FONT,
        })
        .setOrigin(0, 0.5);

      this.container.add(this.traitIconContainer);
      this.container.add(this.traitText);
    }

    this.redraw();
  }

  setVisible(visible: boolean): void {
    this.container.setVisible(visible);
  }

  private redraw(): void {
    const halfW = PANEL_WIDTH / 2;
    let y = -PANEL_PAD;
    const contentTop = y;

    this.nameText.setPosition(0, y);
    y += this.nameText.height + SECTION_GAP;

    this.hpBarBg.setPosition(0, y);
    this.hpBarFill.setPosition(0, y);
    this.hpText.setPosition(0, y + HP_BAR_HEIGHT / 2);
    y += HP_BAR_HEIGHT + SECTION_GAP;

    this.baseLabel.setPosition(-halfW + PANEL_PAD, y);
    y += this.baseLabel.height + 4;

    const statsY = y;
    const iconGap = 4;
    const statSpacing = 50;
    this.attackIcon.setPosition(-halfW + PANEL_PAD, statsY + ICON_SIZE / 2);
    this.attackText.setPosition(
      -halfW + PANEL_PAD + ICON_SIZE + iconGap,
      statsY + ICON_SIZE / 2
    );
    this.defenseIcon.setPosition(
      -halfW + PANEL_PAD + statSpacing,
      statsY + ICON_SIZE / 2
    );
    this.defenseText.setPosition(
      -halfW + PANEL_PAD + statSpacing + ICON_SIZE + iconGap,
      statsY + ICON_SIZE / 2
    );
    y += ICON_SIZE + SECTION_GAP;

    this.traitLabel.setPosition(-halfW + PANEL_PAD, y);
    y += this.traitLabel.height + 4;

    if (this.traitIconContainer && this.traitText) {
      this.traitIconContainer.setPosition(-halfW + PANEL_PAD + CIRCLE_RADIUS, y + CIRCLE_RADIUS);
      this.traitText.setPosition(
        -halfW + PANEL_PAD + CIRCLE_RADIUS * 2 + 8,
        y + CIRCLE_RADIUS
      );
      y += CIRCLE_RADIUS * 2 + SECTION_GAP;
    }

    const contentHeight = y - contentTop + PANEL_PAD;
    const h = contentHeight;

    this.bg.clear();
    this.bg.fillStyle(0x000000, 0.85);
    this.bg.fillRoundedRect(-halfW, contentTop, PANEL_WIDTH, h, 6);

    this.border.clear();
    drawDashedBorder(this.border, -halfW + 1, contentTop + 1, PANEL_WIDTH - 2, h - 2);
  }

  private showTooltip(text: string): void {
    this.hideTooltip();
    const scene = this.container.scene;
    const worldX = this.container.x - PANEL_WIDTH / 2 - 10;
    const worldY = this.container.y;

    this.tooltipText = scene.add
      .text(worldX, worldY, text, {
        fontSize: '10px',
        color: '#ffffff',
        fontFamily: PIXEL_FONT,
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
    this.traitBounceTween?.remove();
    this.traitBounceTween = null;
    this.bounceTweens.forEach((t) => t.remove());
    this.bounceTweens = [];
    this.hideTooltip();
    this.traitIconContainer?.destroy();
    this.traitIconContainer = null;
    this.traitText?.destroy();
    this.traitText = null;
    this.container.destroy();
  }
}
