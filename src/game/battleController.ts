/**
 * game/battleController.ts
 * 状态机驱动，UI 仅通过其公开方法推进
 * 所有规则计算委托给 CombatRules
 */

import type { Action, Phase, RoundResult } from '../core/types';
import {
  INITIAL_HP,
  BASE_ATTACK,
  BASE_DEFENSE,
} from '../core/constants';
import { Deck, createStandardDeck } from '../core/deck';
import { Hand } from '../core/hand';
import { CombatRules } from '../core/combatRules';
import { EnemyAI } from '../core/ai';
import type { RNG } from '../core/rng';
import { defaultRNG } from '../core/rng';
import type { BattleState } from './battleState';

const INITIAL_COMBO = 1;

/** 战斗控制器 */
export class BattleController {
  private state: BattleState;
  private rng: RNG;

  constructor(rng: RNG = defaultRNG) {
    this.rng = rng;
    const playerDeck = new Deck(createStandardDeck());
    const enemyDeck = new Deck(createStandardDeck());
    playerDeck.shuffle(rng);
    enemyDeck.shuffle(rng);
    this.state = {
      playerHP: INITIAL_HP,
      enemyHP: INITIAL_HP,
      playerAttack: BASE_ATTACK,
      playerDefense: BASE_DEFENSE,
      enemyAttack: BASE_ATTACK,
      enemyDefense: BASE_DEFENSE,
      playerDeck,
      enemyDeck,
      playerHand: new Hand(),
      enemyHand: new Hand(),
      phase: 'ROUND_START',
      combo: INITIAL_COMBO,
      roundIndex: 0,
      battleEndReason: null,
    };
  }

  /** 获取当前状态（只读快照） */
  getState(): Readonly<BattleState> {
    return this.state;
  }

  /** 开始战斗，进入 ROUND_START */
  startBattle(): void {
    this.state.phase = 'ROUND_START';
  }

  /** 从牌堆抽一张牌给手牌（牌堆空时重新创建并洗牌） */
  private drawForPlayer(): void {
    let card = this.state.playerDeck.draw();
    if (card === null) {
      const newDeck = new Deck(createStandardDeck());
      newDeck.shuffle(this.rng);
      this.state.playerDeck = newDeck;
      card = this.state.playerDeck.draw();
    }
    if (card) this.state.playerHand.add(card);
  }

  private drawForEnemy(): void {
    let card = this.state.enemyDeck.draw();
    if (card === null) {
      const newDeck = new Deck(createStandardDeck());
      newDeck.shuffle(this.rng);
      this.state.enemyDeck = newDeck;
      card = this.state.enemyDeck.draw();
    }
    if (card) this.state.enemyHand.add(card);
  }

  /** 开始回合：双方各抽 2 张。若任一方前两张牌直接 13 点（PERFECT），则直接进入 ROUND_RESOLVE；否则进入 PLAYER_TURN */
  startRound(): void {
    if (this.state.phase !== 'ROUND_START') return;
    this.state.playerHand.reset();
    this.state.enemyHand.reset();
    this.state.combo = INITIAL_COMBO;
    this.state.roundIndex += 1;

    for (let i = 0; i < 2; i++) {
      this.drawForPlayer();
      this.drawForEnemy();
    }

    const playerPerfect = this.state.playerHand.isPerfect();
    const enemyPerfect = this.state.enemyHand.isPerfect();
    const bothHaveTwoCards =
      this.state.playerHand.getCards().length === 2 &&
      this.state.enemyHand.getCards().length === 2;

    if (bothHaveTwoCards && (playerPerfect || enemyPerfect)) {
      this.state.phase = 'ROUND_RESOLVE';
    } else {
      this.state.phase = 'PLAYER_TURN';
    }
  }

  /** 玩家行动：HIT 抽 1 张，STAND 进入 ENEMY_TURN。抽牌后若 BUST（>13）或 PERFECT（=13）则自动结束玩家回合。 */
  playerAction(action: Action): void {
    if (this.state.phase !== 'PLAYER_TURN') return;
    if (action === 'HIT') {
      this.drawForPlayer();
      if (this.state.playerHand.isBust() || this.state.playerHand.isPerfect()) {
        this.state.phase = 'ENEMY_TURN';
      }
    } else {
      this.state.phase = 'ENEMY_TURN';
    }
  }

  /** 敌人回合：AI 决策并执行，进入 ROUND_RESOLVE。若玩家已 BUST 或敌人已 PERFECT，不再抽牌，直接结算。 */
  enemyTurn(): void {
    if (this.state.phase !== 'ENEMY_TURN') return;
    if (this.state.playerHand.isBust()) {
      this.state.phase = 'ROUND_RESOLVE';
      return;
    }
    if (this.state.enemyHand.isPerfect()) {
      this.state.phase = 'ROUND_RESOLVE';
      return;
    }
    const action = EnemyAI.decide(this.state.enemyHand);
    if (action === 'HIT') {
      this.drawForEnemy();
    }
    this.state.phase = 'ROUND_RESOLVE';
  }

  /** 结算回合：仅计算并返回 RoundResult，不修改 HP。由调用方在动画完成后调用 applyRoundResult。 */
  resolveRound(): RoundResult | null {
    if (this.state.phase !== 'ROUND_RESOLVE') return null;
    return CombatRules.resolveRound(
      this.state.playerHand,
      this.state.enemyHand,
      this.state.combo,
      this.state.playerAttack,
      this.state.playerDefense,
      this.state.enemyAttack,
      this.state.enemyDefense
    );
  }

  /** 应用回合结果：扣血、手牌放回牌堆并洗牌、重置 COMBO、进入下一回合或 BATTLE_END。在动画播放完成后调用。 */
  applyRoundResult(result: RoundResult): void {
    if (result.outcome === 'PLAYER_WIN') {
      this.state.enemyHP = Math.max(0, this.state.enemyHP - result.damageDealt);
    } else if (result.outcome === 'ENEMY_WIN') {
      this.state.playerHP = Math.max(0, this.state.playerHP - result.damageDealt);
    }

    this.state.playerDeck.returnCards(this.state.playerHand.getCards());
    this.state.enemyDeck.returnCards(this.state.enemyHand.getCards());
    this.state.playerDeck.shuffle(this.rng);
    this.state.enemyDeck.shuffle(this.rng);
    this.state.playerHand.reset();
    this.state.enemyHand.reset();
    this.state.combo = INITIAL_COMBO;

    if (this.state.playerHP <= 0 || this.state.enemyHP <= 0) {
      this.state.phase = 'BATTLE_END';
      this.state.battleEndReason =
        this.state.enemyHP <= 0 ? 'PLAYER_WIN' : 'ENEMY_WIN';
    } else {
      this.state.phase = 'ROUND_START';
    }
  }

  /** 战斗是否已结束 */
  isBattleEnd(): boolean {
    return this.state.phase === 'BATTLE_END';
  }

  /** 玩家投降 */
  surrender(): void {
    if (this.state.phase === 'BATTLE_END') return;
    this.state.phase = 'BATTLE_END';
    this.state.battleEndReason = 'ENEMY_WIN';
  }
}
