/**
 * 手牌布局 - 支持发牌与抽牌动画
 */

import Phaser from 'phaser';
import type { Card } from '../../../core/card';
import { CardSprite } from './CardSprite';
import { CARD_WIDTH } from '../config';

const DEAL_DURATION = 400;
const DEAL_EASE = 'Back.easeOut';

export class CardHand {
  private scene: Phaser.Scene;
  private cards: CardSprite[] = [];
  private x: number;
  private y: number;
  private spacing: number;

  constructor(scene: Phaser.Scene, x: number, y: number, spacing: number = 20) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.spacing = spacing;
  }

  /** @param faceDownCount 前 N 张牌盖住（敌人第一张） */
  setCards(cardData: readonly Card[], faceDownCount: number = 0): void {
    this.clear();
    cardData.forEach((card, i) => {
      const sprite = new CardSprite(this.scene, 0, 0);
      sprite.setCard(card);
      sprite.setFaceUp(i >= faceDownCount);
      this.cards.push(sprite);
    });
    this.layout();
  }

  addCard(card: Card): void {
    const sprite = new CardSprite(this.scene, 0, 0);
    sprite.setCard(card);
    sprite.setFaceUp(true);
    this.cards.push(sprite);
    this.layout();
  }

  /**
   * 从牌堆发牌到手牌，带飞行动画与翻牌
   * @param card 卡牌
   * @param fromX 牌堆 X
   * @param fromY 牌堆 Y
   * @param faceUp 是否正面朝上（敌人第一张可盖牌）
   * @param delayMs 延迟毫秒
   * @param onComplete 完成回调
   */
  addCardWithDealAnimation(
    card: Card,
    fromX: number,
    fromY: number,
    faceUp: boolean,
    delayMs: number,
    onComplete?: () => void
  ): void {
    const sprite = new CardSprite(this.scene, fromX, fromY);
    sprite.setCard(card);
    sprite.setFaceUp(false);
    this.cards.push(sprite);

    const targetPos = this.getTargetPosition(this.cards.length - 1);

    const doTween = () => {
      this.scene.tweens.add({
        targets: sprite.getContainer(),
        x: targetPos.x,
        y: targetPos.y,
        duration: DEAL_DURATION,
        ease: DEAL_EASE,
        onComplete: () => {
          if (faceUp) {
            sprite.setFaceUp(true);
            sprite.playFlipAnimation(onComplete);
          } else {
            onComplete?.();
          }
        },
      });
    };

    if (delayMs > 0) {
      this.scene.time.delayedCall(delayMs, doTween);
    } else {
      doTween();
    }
  }

  private getTargetPosition(index: number): { x: number; y: number } {
    const totalWidth = this.cards.length * CARD_WIDTH + (this.cards.length - 1) * this.spacing;
    const startX = this.x - totalWidth / 2 + CARD_WIDTH / 2;
    return {
      x: startX + index * (CARD_WIDTH + this.spacing),
      y: this.y,
    };
  }

  private layout(): void {
    const totalWidth = this.cards.length * CARD_WIDTH + (this.cards.length - 1) * this.spacing;
    let startX = this.x - totalWidth / 2 + CARD_WIDTH / 2;
    this.cards.forEach((sprite, i) => {
      sprite.setPosition(startX + i * (CARD_WIDTH + this.spacing), this.y);
    });
  }

  /**
   * 翻开指定索引的盖牌
   * @param index 牌索引
   * @param onComplete 翻牌完成回调
   */
  flipCardAtIndex(index: number, onComplete?: () => void): void {
    const sprite = this.cards[index];
    if (!sprite) {
      onComplete?.();
      return;
    }
    sprite.playFlipToReveal(onComplete);
  }

  clear(): void {
    this.cards.forEach((c) => c.destroy());
    this.cards = [];
  }

  destroy(): void {
    this.clear();
  }
}
