/**
 * core/card.ts
 * Card 实体，包含 rank 与点数映射
 */

import type { CardRank } from './types';

/** 卡牌实体 */
export interface Card {
  rank: CardRank;
}

/** rank 到点数的映射（A=1, 2=2, ..., 6=6） */
const RANK_VALUES: Record<CardRank, number> = {
  A: 1,
  '2': 2,
  '3': 3,
  '4': 4,
  '5': 5,
  '6': 6,
};

/** 将 rank 转换为点数（A 固定为 1，可变值逻辑在 computeOptimalHandSum） */
export function rankToValue(rank: CardRank): number {
  return RANK_VALUES[rank];
}

/**
 * 计算手牌最优和：A 可当 1 或 7，自动选择使结果最好的组合
 * 最优：优先 13（PERFECT），其次不爆牌时最大和，必爆时最小爆牌和
 */
export function computeOptimalHandSum(cards: readonly Card[]): number {
  if (cards.length === 0) return 0;
  const fixedSum = cards
    .filter((c) => c.rank !== 'A')
    .reduce((s, c) => s + rankToValue(c.rank), 0);
  const aceCount = cards.filter((c) => c.rank === 'A').length;
  let bestSum = fixedSum + aceCount;
  let bestScore = -Infinity;
  for (let i = 0; i < 1 << aceCount; i++) {
    let aceSum = 0;
    for (let j = 0; j < aceCount; j++) aceSum += (i & (1 << j)) ? 7 : 1;
    const total = fixedSum + aceSum;
    const score = total <= 13 ? total : 13 - total;
    if (score > bestScore) {
      bestScore = score;
      bestSum = total;
    }
  }
  return bestSum;
}

/** 创建一张卡牌 */
export function createCard(rank: CardRank): Card {
  return { rank };
}

/** 扩展预留：卡牌效果接口 */
export interface CardEffect {
  id: string;
  onPlay?(card: Card, context: unknown): unknown;
}
