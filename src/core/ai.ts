/**
 * core/ai.ts
 * 敌人 AI 决策
 * 规则：点数 <= 10 则 HIT，否则 STAND
 * 稻草人稻草卡：Stand 12 时稻草当 1，AI 需考虑此上下文
 */

import type { Action } from './types';
import type { Hand } from './hand';
import type { HandSumContext } from './card';

const HIT_THRESHOLD = 10;

/** 敌人 AI */
export const EnemyAI = {
  decide(hand: Hand, context?: HandSumContext): Action {
    const sum = hand.sum(context);
    return sum <= HIT_THRESHOLD ? 'HIT' : 'STAND';
  },
};
