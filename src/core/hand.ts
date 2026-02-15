/**
 * core/hand.ts
 * 手牌管理，点数计算，BUST/PERFECT 判断
 */

import type { Card } from './card';
import { computeOptimalHandSum } from './card';

/** 手牌点数上限 */
export const MAX_HAND = 13;

/** 手牌 */
export class Hand {
  private cards: Card[] = [];

  /** 添加一张牌 */
  add(card: Card): void {
    this.cards.push(card);
  }

  /** 手牌点数总和（A 可当 1 或 7，自动选最优） */
  sum(): number {
    return computeOptimalHandSum(this.cards);
  }

  /** 是否爆牌（点数 > 13） */
  isBust(): boolean {
    return this.sum() > MAX_HAND;
  }

  /** 是否完美（点数 == 13） */
  isPerfect(): boolean {
    return this.sum() === MAX_HAND;
  }

  /** 清空手牌 */
  reset(): void {
    this.cards = [];
  }

  /** 获取手牌副本（只读） */
  getCards(): readonly Card[] {
    return [...this.cards];
  }
}
