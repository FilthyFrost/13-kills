/**
 * core/deck.ts
 * 牌堆创建、洗牌、抽牌
 * 白卡版：A,2,3,4,5,6 各 3 张，共 18 张
 */

import type { CardRank } from './types';
import type { Card } from './card';
import { createCard } from './card';
import type { RNG } from './rng';
import { defaultRNG } from './rng';

const RANKS: CardRank[] = ['A', '2', '3', '4', '5', '6'];
const COPIES_PER_RANK = 3;

/** 创建标准白卡牌组（18 张） */
export function createStandardDeck(): Card[] {
  const cards: Card[] = [];
  for (const rank of RANKS) {
    for (let i = 0; i < COPIES_PER_RANK; i++) {
      cards.push(createCard(rank));
    }
  }
  return cards;
}

/** Fisher-Yates 洗牌 */
function shuffleArray<T>(arr: T[], rng: RNG): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng.next() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** 牌堆 */
export class Deck {
  private cards: Card[];

  constructor(cards: Card[] = createStandardDeck()) {
    this.cards = [...cards];
  }

  /** 洗牌 */
  shuffle(rng: RNG = defaultRNG): void {
    this.cards = shuffleArray(this.cards, rng);
  }

  /** 抽一张牌，牌堆空则返回 null */
  draw(): Card | null {
    return this.cards.pop() ?? null;
  }

  /** 将牌放回牌堆（用于回合结束后回收手牌） */
  returnCards(cards: readonly Card[]): void {
    this.cards.push(...cards);
  }

  /** 剩余牌数 */
  get size(): number {
    return this.cards.length;
  }
}
