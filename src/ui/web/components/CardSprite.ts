/**
 * 单张卡牌 5:7 比例 - 优先使用纹理素材，支持翻牌动画
 */

import Phaser from 'phaser';
import type { Card } from '../../../core/card';
import { CARD_WIDTH, CARD_HEIGHT, COLORS, PIXEL_FONT } from '../config';

export class CardSprite {
  private container: Phaser.GameObjects.Container;
  private bg: Phaser.GameObjects.Graphics;
  private cardImage: Phaser.GameObjects.Image | null = null;
  private rankText: Phaser.GameObjects.Text;
  private faceUp: boolean = true;
  private currentCard: Card | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.container = scene.add.container(x, y);
    this.container.setSize(CARD_WIDTH, CARD_HEIGHT);

    this.bg = scene.add.graphics();
    this.rankText = scene.add
      .text(0, 0, '', {
        fontSize: '20px',
        color: '#ffffff',
        fontFamily: PIXEL_FONT,
      })
      .setOrigin(0.5);

    this.container.add([this.bg, this.rankText]);
    this.container.setDepth(60);
  }

  setCard(card: Card | null): void {
    this.currentCard = card;
    this.updateDisplay();
  }

  private get scene(): Phaser.Scene {
    return this.container.scene;
  }

  setFaceUp(up: boolean): void {
    this.faceUp = up;
    this.updateDisplay();
  }

  private updateDisplay(): void {
    if (this.cardImage) {
      this.cardImage.destroy();
      this.cardImage = null;
    }

    if (!this.currentCard) {
      this.rankText.setVisible(false);
      this.drawFallback(true);
      return;
    }

    const textures = this.scene.textures;
    const hasTextures = textures.exists('card_back');

    if (hasTextures) {
      const key = this.faceUp ? `card_${this.currentCard.rank}` : 'card_back';
      if (textures.exists(key)) {
        this.cardImage = this.scene.add.image(0, 0, key);
        this.cardImage.setDisplaySize(CARD_WIDTH, CARD_HEIGHT);
        this.container.addAt(this.cardImage, 0);
        this.rankText.setVisible(false);
        this.bg.clear();
        this.bg.lineStyle(2, COLORS.textDim, 0.5);
        this.bg.strokeRoundedRect(-CARD_WIDTH / 2, -CARD_HEIGHT / 2, CARD_WIDTH, CARD_HEIGHT, 6);
        return;
      }
    }

    this.rankText.setText(this.currentCard.rank);
    this.rankText.setVisible(this.faceUp);
    this.drawFallback(true);
  }

  private drawFallback(hasCard: boolean): void {
    this.bg.clear();
    const w = CARD_WIDTH;
    const h = CARD_HEIGHT;
    this.bg.fillStyle(COLORS.bgMid, 1);
    this.bg.fillRoundedRect(-w / 2, -h / 2, w, h, 6);
    this.bg.lineStyle(2, COLORS.textDim, 1);
    this.bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 6);
    if (hasCard && !this.faceUp && this.scene.textures.exists('card_back')) {
      const img = this.scene.add.image(0, 0, 'card_back');
      img.setDisplaySize(w, h);
      this.container.addAt(img, 0);
      (this as unknown as { cardImage: Phaser.GameObjects.Image | null }).cardImage = img;
    }
  }

  /** Inscryption 风格翻牌动画：scaleX 1→0 折半→切换纹理→0→1 */
  playFlipAnimation(onComplete?: () => void): void {
    this.container.setScale(1, 1);
    const halfDuration = 120;
    this.scene.tweens.add({
      targets: this.container,
      scaleX: 0.01,
      duration: halfDuration,
      ease: 'Cubic.easeIn',
      onComplete: () => {
        this.updateDisplay();
        this.scene.tweens.add({
          targets: this.container,
          scaleX: 1,
          duration: halfDuration,
          ease: 'Back.easeOut',
          onComplete: () => {
            onComplete?.();
          },
        });
      },
    });
  }

  /** 盖牌翻开动画：在折半时切换为正面 */
  playFlipToReveal(onComplete?: () => void): void {
    this.container.setScale(1, 1);
    const halfDuration = 120;
    this.scene.tweens.add({
      targets: this.container,
      scaleX: 0.01,
      duration: halfDuration,
      ease: 'Cubic.easeIn',
      onComplete: () => {
        this.faceUp = true;
        this.updateDisplay();
        this.scene.tweens.add({
          targets: this.container,
          scaleX: 1,
          duration: halfDuration,
          ease: 'Back.easeOut',
          onComplete: () => {
            onComplete?.();
          },
        });
      },
    });
  }

  getContainer(): Phaser.GameObjects.Container {
    return this.container;
  }

  setPosition(x: number, y: number): void {
    this.container.setPosition(x, y);
  }

  destroy(): void {
    this.container.destroy();
  }
}
