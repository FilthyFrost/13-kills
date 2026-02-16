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

/** 稻草卡：点数 0，Card Status 删除，效果 STRAW */
function createStrawCard(): Card {
  return createCard('0', { cardStatus: 'DELETE', effectId: 'STRAW' });
}

/** 创建稻草人 BOSS 牌组：2,3,4,5,6,7 各 3 张 + 稻草 2 张（无 A） */
export function createScarecrowDeck(): Card[] {
  const cards: Card[] = [];
  const scarecrowRanks: CardRank[] = ['2', '3', '4', '5', '6', '7'];
  for (const rank of scarecrowRanks) {
    for (let i = 0; i < COPIES_PER_RANK; i++) {
      cards.push(createCard(rank));
    }
  }
  cards.push(createStrawCard(), createStrawCard());
  return cards;
}

/** Fisher-Yates 洗牌，优先使用无偏差 nextIntInclusive */
function shuffleArray<T>(arr: T[], rng: RNG): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j =
      typeof rng.nextIntInclusive === 'function'
        ? rng.nextIntInclusive(0, i)
        : Math.floor(rng.next() * (i + 1));
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

  /** 获取剩余牌副本（供 AI 统计构成，不暴露可变引用） */
  getRemainingCards(): readonly Card[] {
    return [...this.cards];
  }
}
