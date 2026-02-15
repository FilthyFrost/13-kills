/**
 * game/battleState.ts
 * 战斗状态快照
 */

import type { Phase, BattleEndReason } from '../core/types';
import type { Deck } from '../core/deck';
import type { Hand } from '../core/hand';

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
}
