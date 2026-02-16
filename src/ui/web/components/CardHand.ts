/**
 * 手牌布局 - 支持发牌与抽牌动画（抛物线弧线、缩放生长、overshoot、错峰排列）
 */

import Phaser from 'phaser';
import type { Card } from '../../../core/card';
import { CardSprite } from './CardSprite';
import { CARD_WIDTH, ANIM } from '../config';

const DEAL_DURATION = ANIM.dealDuration ?? 450;
const DEAL_ARC_HEIGHT = ANIM.dealArcHeight ?? 80;
const DEAL_SCALE_FROM = ANIM.dealScaleFrom ?? 0.75;
const DEAL_OVERSHOOT = ANIM.dealOvershoot ?? 2.5;

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
   * 从牌堆发牌到手牌：13 Bones 风格 - 飞行中翻面 + 快速平移
   * 飞行开始时同步启动已有牌布局与计数器让位，落地前布局已就绪
   */
  addCardWithDealAnimation(
    card: Card,
    fromX: number,
    fromY: number,
    faceUp: boolean,
    delayMs: number,
    options?: { onComplete?: () => void; onLayoutStart?: (cardCount: number) => void }
  ): void {
    const sprite = new CardSprite(this.scene, fromX, fromY);
    sprite.setCard(card);
    sprite.setFaceUp(false);
    this.cards.push(sprite);

    const container = sprite.getContainer();
    const targetPos = this.getTargetPosition(this.cards.length - 1);
    const toX = targetPos.x;
    const toY = targetPos.y;

    container.setDepth(70);
    container.setScale(DEAL_SCALE_FROM);

    const arcDir = fromY > toY ? -1 : 1;
    const cardCount = this.cards.length;

    const doTween = () => {
      this.layoutExistingCards();
      options?.onLayoutStart?.(cardCount);

      if (faceUp) {
        this.scene.time.delayedCall(DEAL_DURATION * 0.15, () =>
          sprite.playFlipToReveal()
        );
      }
      const progress = { t: 0 };
      this.scene.tweens.add({
        targets: progress,
        t: 1,
        duration: DEAL_DURATION,
        ease: 'Back.easeOut',
        easeParams: [DEAL_OVERSHOOT],
        onUpdate: () => {
          const t = Math.min(1, progress.t);
          const linearX = fromX + (toX - fromX) * t;
          const linearY = fromY + (toY - fromY) * t;
          const arcOffset = 4 * DEAL_ARC_HEIGHT * t * (1 - t);
          container.x = linearX;
          container.y = linearY + arcDir * arcOffset;
          const scale = DEAL_SCALE_FROM + (1 - DEAL_SCALE_FROM) * t;
          container.setScale(scale);
        },
        onComplete: () => {
          container.setDepth(60);
          container.setScale(1);
          container.x = toX;
          container.y = toY;
          if (faceUp) {
            sprite.setFaceUp(true);
          }
          options?.onComplete?.();
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
   * 已有牌布局动画：仅对已有牌（不含新牌）做布局，与新牌飞行重叠
   */
  private layoutExistingCards(): void {
    const count = this.cards.length;
    if (count <= 1) return;
    for (let i = 0; i < count - 1; i++) {
      const sprite = this.cards[i];
      const target = this.getTargetPosition(i);
      const container = sprite.getContainer();
      if (Math.abs(container.x - target.x) < 1 && Math.abs(container.y - target.y) < 1) continue;
      this.scene.tweens.add({
        targets: container,
        x: target.x,
        y: target.y,
        duration: ANIM.layoutSpreadDuration,
        ease: 'Cubic.easeOut',
      });
    }
  }

  /**
   * 错位排列动画：错峰启动，依次让位，Back.easeOut 落地感
   */
  private layoutWithAnimation(onComplete?: () => void): void {
    if (this.cards.length === 0) {
      onComplete?.();
      return;
    }
    const staggerDelay = ANIM.layoutStaggerDelay ?? 40;
    const targets = this.cards.map((sprite, i) => ({
      sprite,
      target: this.getTargetPosition(i),
      index: i,
    }));
    let pending = targets.length;
    const checkDone = () => {
      pending--;
      if (pending <= 0) onComplete?.();
    };
    targets.forEach(({ sprite, target, index }) => {
      const container = sprite.getContainer();
      if (Math.abs(container.x - target.x) < 1 && Math.abs(container.y - target.y) < 1) {
        checkDone();
        return;
      }
      this.scene.tweens.add({
        targets: container,
        x: target.x,
        y: target.y,
        duration: ANIM.layoutSpreadDuration,
        ease: 'Back.easeOut',
        easeParams: [1.5],
        delay: index * staggerDelay,
        onComplete: checkDone,
      });
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

  setPosition(x: number, y: number): void {
    this.x = x;
    this.y = y;
    this.layout();
  }

  clear(): void {
    this.cards.forEach((c) => c.destroy());
    this.cards = [];
  }

  destroy(): void {
    this.clear();
  }
}
