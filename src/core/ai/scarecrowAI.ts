/**
 * core/ai/scarecrowAI.ts
 * 稻草人 BOSS 专用策略：基于概率计算 HIT/STAND
 * 牌组：2,3,4,5,6,7 各 3 张 + 稻草 2 张（20 张），稻草=0，12+稻草 Stand 视为 13 PERFECT
 */

import type { Action } from '../types';
import { createScarecrowDeck } from '../deck';
import { isStrawCard } from '../card';
import type { AIContext } from '../registries/bosses';

const TIE_THRESHOLD = 0.05;
const RANDOM_FAVOR_PROB = 0.7;

/** 比较点数得胜率：enemySum vs playerSum */
function compareWinRate(enemySum: number, playerSum: number): number {
  if (enemySum > playerSum) return 1;
  if (enemySum < playerSum) return 0;
  return 0.5;
}

/** 稻草人牌组中单张牌的点数（无 A，稻草=0） */
function cardValue(rank: string): number {
  if (rank === '0') return 0;
  const v = parseInt(rank, 10);
  return Number.isNaN(v) ? 1 : v;
}

/** 8 点以下必须 HIT（单张最大 7，抽牌几乎不爆，必须博牌） */
const HIT_FLOOR = 8;
/** 9 点及以上绝不 HIT（爆牌概率高，不赌博） */
const STAND_SAFE_THRESHOLD = 9;

/** 稻草人 AI：概率驱动决策 */
export const ScarecrowAI = {
  decide(ctx: AIContext): Action {
    const { playerHand, enemyHand, enemyDeck, getEnemySumContext, rng } = ctx;

    const playerSum = playerHand.sum();
    const enemySumContext = getEnemySumContext();
    const enemySumStand = enemyHand.sum(enemySumContext);
    const enemySumBase = enemyHand.sum();
    const hasStraw = enemyHand.getCards().some(isStrawCard);

    const standWinRate = compareWinRate(enemySumStand, playerSum);

    if (enemySumStand >= STAND_SAFE_THRESHOLD) {
      return 'STAND';
    }

    if (enemySumStand <= HIT_FLOOR) {
      return 'HIT';
    }

    let remaining = enemyDeck.getRemainingCards();
    if (remaining.length === 0) {
      remaining = createScarecrowDeck();
    }

    const n = remaining.length;
    let hitWinRate = 0;

    for (const card of remaining) {
      const value = cardValue(card.rank);
      let newSum = enemySumBase + value;
      if (hasStraw && newSum === 12) newSum = 13;

      let outcome: number;
      if (newSum > 13) {
        outcome = 0;
      } else if (newSum === 13) {
        outcome = playerSum === 13 ? 0.5 : 1;
      } else {
        outcome = compareWinRate(newSum, playerSum);
      }
      hitWinRate += outcome / n;
    }

    const diff = hitWinRate - standWinRate;

    if (Math.abs(diff) < TIE_THRESHOLD) {
      const preferHit = diff > 0 || (diff >= 0 && standWinRate < 0.5);
      return rng.next() < RANDOM_FAVOR_PROB ? (preferHit ? 'HIT' : 'STAND') : preferHit ? 'STAND' : 'HIT';
    }

    return hitWinRate > standWinRate ? 'HIT' : 'STAND';
  },
};
