/**
 * game/battleState.ts
 * 战斗状态快照
 */

import type { Phase, BattleEndReason, BuffId } from '../core/types';
import type { Deck } from '../core/deck';
import type { Hand } from '../core/hand';
import type { Card } from '../core/card';

/** 战斗状态 */
export interface BattleState {
  playerHP: number;
  enemyHP: number;
  playerAttack: number;
  playerDefense: number;
  enemyAttack: number;
  enemyDefense: number;
  playerDeck: Deck;
  enemyDeck: Deck;
  playerHand: Hand;
  enemyHand: Hand;
  phase: Phase;
  combo: number;
  roundIndex: number;
  battleEndReason: BattleEndReason;
  /** 玩家 BUFF/DEBUFF 层数 */
  playerBuffs: Map<BuffId, number>;
  /** 本回合作为 1 使用过的稻草卡（回合结束后从牌堆删除） */
  roundUsedStrawCards: Set<Card>;
  /** 当前 BOSS ID（用于稻草卡等效果） */
  bossId?: string;
  /** 本回合刚添加的怠惰（不在此回合 applyRoundResult 时清除） */
  lazyAddedThisRound?: boolean;
  /** 敌人最大 HP（用于 UI 显示） */
  enemyMaxHP: number;
}
