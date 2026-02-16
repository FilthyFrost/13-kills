/**
 * core/card.ts
 * Card 实体，包含 rank 与点数映射
 */

import type { CardRank, CardStatusId } from './types';

/** 卡牌实体 */
export interface Card {
  rank: CardRank;
  cardStatus?: CardStatusId;
  effectId?: string;
}

/** rank 到点数的映射（A=1, 2=2, ..., 6=6, 0=稻草卡基础值） */
const RANK_VALUES: Record<CardRank, number> = {
  A: 1,
  '2': 2,
  '3': 3,
  '4': 4,
  '5': 5,
  '6': 6,
  '7': 7,
  '0': 0,
};

/** 将 rank 转换为点数（A 固定为 1，可变值逻辑在 computeOptimalHandSum） */
export function rankToValue(rank: CardRank): number {
  return RANK_VALUES[rank];
}

/** 是否为稻草卡 */
export function isStrawCard(card: Card): boolean {
  return card.effectId === 'STRAW' || card.rank === '0';
}

/** 手牌求和上下文（用于稻草卡等效果） */
export interface HandSumContext {
  /** 稻草卡可当 1 使用（稻草人 Stand 12 点时） */
  strawAsOne?: boolean;
}

/**
 * 计算手牌最优和：A 可当 1 或 7，自动选择使结果最好的组合
 * 最优：优先 13（PERFECT），其次不爆牌时最大和，必爆时最小爆牌和
 * @param context strawAsOne 时，稻草卡第一张计 1，其余计 0
 */
export function computeOptimalHandSum(
  cards: readonly Card[],
  context?: HandSumContext
): number {
  if (cards.length === 0) return 0;

  const strawAsOne = context?.strawAsOne ?? false;
  const strawCards = cards.filter(isStrawCard);
  const nonStrawCards = cards.filter((c) => !isStrawCard(c));
  const strawContribution =
    strawAsOne && strawCards.length > 0 ? 1 : strawCards.length * 0;

  const fixedSum = nonStrawCards
    .filter((c) => c.rank !== 'A')
    .reduce((s, c) => s + rankToValue(c.rank), 0);
  const aceCount = nonStrawCards.filter((c) => c.rank === 'A').length;
  let bestSum = fixedSum + strawContribution + aceCount;
  let bestScore = -Infinity;
  for (let i = 0; i < 1 << aceCount; i++) {
    let aceSum = 0;
    for (let j = 0; j < aceCount; j++) aceSum += (i & (1 << j)) ? 7 : 1;
    const total = fixedSum + strawContribution + aceSum;
    const score = total <= 13 ? total : 13 - total;
    if (score > bestScore) {
      bestScore = score;
      bestSum = total;
    }
  }
  return bestSum;
}

/** 创建一张卡牌 */
export function createCard(
  rank: CardRank,
  options?: { cardStatus?: CardStatusId; effectId?: string }
): Card {
  return { rank, ...options };
}

/** 扩展预留：卡牌效果接口 */
export interface CardEffect {
  id: string;
  onPlay?(card: Card, context: unknown): unknown;
}
