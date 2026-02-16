/**
 * 牌堆（背面 + 数量）
 */

import Phaser from 'phaser';
import { CARD_WIDTH, CARD_HEIGHT, COLORS, PIXEL_FONT } from '../config';

export class DeckPile {
  private container: Phaser.GameObjects.Container;
  private bg: Phaser.GameObjects.Graphics;
  private deckImage: Phaser.GameObjects.Image | null = null;
  private countText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.container = scene.add.container(x, y);
    this.bg = scene.add.graphics();
    this.countText = scene.add
      .text(CARD_WIDTH / 2 - 8, CARD_HEIGHT / 2 - 8, '18', {
        fontSize: '12px',
        color: '#ffffff',
        fontFamily: PIXEL_FONT,
      })
      .setOrigin(1, 1);

    this.container.add([this.bg, this.countText]);
    this.container.setDepth(55);
    this.setCount(18);
  }

  setCount(n: number): void {
    this.countText.setText(String(n));
    this.bg.clear();
    const w = CARD_WIDTH;
    const h = CARD_HEIGHT;
    const scene = this.container.scene;
    if (scene.textures.exists('card_back')) {
      if (!this.deckImage) {
        this.deckImage = scene.add.image(0, 0, 'card_back');
        this.deckImage.setDisplaySize(w, h);
        this.container.addAt(this.deckImage, 0);
      }
    } else {
      this.bg.fillStyle(COLORS.bgDark, 1);
      this.bg.fillRoundedRect(-w / 2, -h / 2, w, h, 6);
      this.bg.lineStyle(2, COLORS.textDim, 1);
      this.bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 6);
    }
  }

  setPosition(x: number, y: number): void {
    this.container.setPosition(x, y);
  }

  getContainer(): Phaser.GameObjects.Container {
    return this.container;
  }

  destroy(): void {
    this.container.destroy();
  }
}
