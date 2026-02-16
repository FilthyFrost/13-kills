/**
 * game/battleController.ts
 * 状态机驱动，UI 仅通过其公开方法推进
 * 所有规则计算委托给 CombatRules
 */

import type { Action, Phase, RoundResult } from '../core/types';
import type { BuffId } from '../core/types';
import {
  INITIAL_HP,
  BASE_ATTACK,
  BASE_DEFENSE,
} from '../core/constants';
import { Deck, createStandardDeck } from '../core/deck';
import { Hand } from '../core/hand';
import { CombatRules } from '../core/combatRules';
import type { ResolveRoundContext } from '../core/combatRules';
import { EnemyAI } from '../core/ai';
import type { RNG } from '../core/rng';
import { createDefaultRNG } from '../core/rng';
import type { BattleState } from './battleState';
import type { BossConfig } from '../core/registries/bosses';
import { isStrawCard } from '../core/card';

const INITIAL_COMBO = 1;
const LAZY_STAND_THRESHOLD = 11;

export interface BattleControllerOptions {
  boss?: BossConfig;
}

/** 战斗控制器 */
export class BattleController {
  private state: BattleState;
  private rng: RNG;
  private bossConfig?: BossConfig;

  constructor(rng?: RNG, options?: BattleControllerOptions) {
    this.rng = rng ?? createDefaultRNG();
    this.bossConfig = options?.boss;

    const playerDeck = new Deck(createStandardDeck());
    const enemyDeck = new Deck(
      this.bossConfig?.deckFactory?.() ?? createStandardDeck()
    );
    playerDeck.shuffle(this.rng);
    enemyDeck.shuffle(this.rng);

    const enemyHP = this.bossConfig?.hp ?? INITIAL_HP;
    const enemyAttack = this.bossConfig?.attack ?? BASE_ATTACK;
    const enemyDefense = this.bossConfig?.defense ?? BASE_DEFENSE;

    this.state = {
      playerHP: INITIAL_HP,
      enemyHP,
      playerAttack: BASE_ATTACK,
      playerDefense: BASE_DEFENSE,
      enemyAttack,
      enemyDefense,
      playerDeck,
      enemyDeck,
      playerHand: new Hand(),
      enemyHand: new Hand(),
      phase: 'ROUND_START',
      combo: INITIAL_COMBO,
      roundIndex: 0,
      battleEndReason: null,
      playerBuffs: new Map<BuffId, number>(),
      roundUsedStrawCards: new Set(),
      bossId: this.bossConfig?.id,
      enemyMaxHP: enemyHP,
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
      const factory = this.bossConfig?.deckFactory ?? createStandardDeck;
      const newDeck = new Deck(factory());
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
    this.state.roundUsedStrawCards.clear();

    for (let i = 0; i < 2; i++) {
      this.drawForPlayer();
      this.drawForEnemy();
    }

    const enemySumContext = this.getEnemySumContext();
    const playerPerfect = this.state.playerHand.isPerfect();
    const enemyPerfect = this.state.enemyHand.isPerfect(enemySumContext);
    const bothHaveTwoCards =
      this.state.playerHand.getCards().length === 2 &&
      this.state.enemyHand.getCards().length === 2;

    if (bothHaveTwoCards && (playerPerfect || enemyPerfect)) {
      this.state.phase = 'ROUND_RESOLVE';
    } else {
      this.state.phase = 'PLAYER_TURN';
    }
  }

  /** 敌人手牌求和上下文（稻草人 12+稻草 Stand 时稻草卡当 1 → 13 PERFECT） */
  private getEnemySumContext(): { strawAsOne: boolean } | undefined {
    if (this.state.bossId !== 'SCARECROW') return undefined;
    const cards = this.state.enemyHand.getCards();
    const hasStraw = cards.some(isStrawCard);
    if (!hasStraw) return undefined;
    const nonStrawSum = this.state.enemyHand.sum();
    return nonStrawSum === 12 ? { strawAsOne: true } : undefined;
  }

  /** 供 UI 显示用的敌人点数（含稻草人 strawAsOne） */
  getEnemyDisplaySum(): number {
    const ctx = this.getEnemySumContext();
    return this.state.enemyHand.sum(ctx);
  }

  /** 供 UI 显示用的敌人是否 BUST（含 strawAsOne） */
  getEnemyDisplayIsBust(): boolean {
    const ctx = this.getEnemySumContext();
    return this.state.enemyHand.isBust(ctx);
  }

  /** 玩家行动：HIT 抽 1 张，STAND 进入 ENEMY_TURN。怠惰时 Stand 需 >= 11 点，否则强制 HIT。 */
  playerAction(action: Action): void {
    if (this.state.phase !== 'PLAYER_TURN') return;
    if (action === 'HIT') {
      this.drawForPlayer();
      if (this.state.playerHand.isBust() || this.state.playerHand.isPerfect()) {
        this.state.phase = 'ENEMY_TURN';
      }
    } else {
      const hasLazy = (this.state.playerBuffs.get('LAZY') ?? 0) > 0;
      const sum = this.state.playerHand.sum();
      if (hasLazy && sum < LAZY_STAND_THRESHOLD) {
        this.drawForPlayer();
        if (
          this.state.playerHand.isBust() ||
          this.state.playerHand.isPerfect()
        ) {
          this.state.phase = 'ENEMY_TURN';
        }
      } else {
        const result = this.bossConfig?.onPlayerStand?.(
          this.state.playerHand.getCards()
        );
        if (result?.addDebuff === 'LAZY') {
          const cur = this.state.playerBuffs.get('LAZY') ?? 0;
          this.state.playerBuffs.set('LAZY', cur + 1);
          this.state.lazyAddedThisRound = true;
        }
        this.state.phase = 'ENEMY_TURN';
      }
    }
  }

  /** 敌人回合：循环 AI 决策，HIT 则抽牌并继续，STAND 或 BUST 或 PERFECT 则结算。无抽牌次数限制。 */
  enemyTurn(): void {
    if (this.state.phase !== 'ENEMY_TURN') return;
    if (this.state.playerHand.isBust()) {
      this.state.phase = 'ROUND_RESOLVE';
      return;
    }
    for (;;) {
      const enemySumContext = this.getEnemySumContext();
      if (this.state.enemyHand.isPerfect(enemySumContext)) {
        this.state.phase = 'ROUND_RESOLVE';
        return;
      }
      const action = this.bossConfig?.aiDecide
        ? this.bossConfig.aiDecide({
            playerHand: this.state.playerHand,
            enemyHand: this.state.enemyHand,
            enemyDeck: this.state.enemyDeck,
            getEnemySumContext: () => this.getEnemySumContext(),
            rng: this.rng,
          })
        : EnemyAI.decide(
            this.state.enemyHand,
            this.getEnemySumContext()
          );
      if (action === 'STAND') {
        this.state.phase = 'ROUND_RESOLVE';
        return;
      }
      this.drawForEnemy();
      const afterDrawCtx = this.getEnemySumContext();
      if (this.state.enemyHand.isPerfect(afterDrawCtx)) {
        this.state.phase = 'ROUND_RESOLVE';
        return;
      }
      if (this.state.enemyHand.isBust(afterDrawCtx)) {
        this.state.phase = 'ROUND_RESOLVE';
        return;
      }
    }
  }

  /** 结算回合：仅计算并返回 RoundResult，不修改 HP。由调用方在动画完成后调用 applyRoundResult。 */
  resolveRound(): RoundResult | null {
    if (this.state.phase !== 'ROUND_RESOLVE') return null;

    const enemySumContext = this.getEnemySumContext();
    if (enemySumContext?.strawAsOne) {
      const enemyCards = this.state.enemyHand.getCards();
      const firstStraw = enemyCards.find(isStrawCard);
      if (firstStraw) {
        this.state.roundUsedStrawCards.add(firstStraw);
      }
    }

    const resolveContext: ResolveRoundContext | undefined =
      enemySumContext ? { enemyStrawAsOne: true } : undefined;

    return CombatRules.resolveRound(
      this.state.playerHand,
      this.state.enemyHand,
      this.state.combo,
      this.state.playerAttack,
      this.state.playerDefense,
      this.state.enemyAttack,
      this.state.enemyDefense,
      resolveContext
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

    const enemyCards = this.state.enemyHand.getCards();
    const toReturn = enemyCards.filter(
      (c) => !this.state.roundUsedStrawCards.has(c)
    );
    this.state.enemyDeck.returnCards(toReturn);

    this.state.playerDeck.shuffle(this.rng);
    this.state.enemyDeck.shuffle(this.rng);
    this.state.playerHand.reset();
    this.state.enemyHand.reset();
    this.state.combo = INITIAL_COMBO;
    this.state.roundUsedStrawCards.clear();
    if (!this.state.lazyAddedThisRound) {
      this.state.playerBuffs.clear();
    }
    this.state.lazyAddedThisRound = false;

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
