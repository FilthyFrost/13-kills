/**
 * core/ai.ts
 * 敌人 AI 决策
 * 规则：点数 <= 10 则 HIT，否则 STAND
 */

import type { Action } from './types';
import type { Hand } from './hand';

const HIT_THRESHOLD = 10;

/** 敌人 AI */
export const EnemyAI = {
  decide(hand: Hand): Action {
    const sum = hand.sum();
    return sum <= HIT_THRESHOLD ? 'HIT' : 'STAND';
  },
};
