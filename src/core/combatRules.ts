/**
 * core/combatRules.ts
 * 纯规则计算，无副作用
 * 胜负、COMBO、伤害全部在此完成
 * 伤害公式：(攻击方基础攻击 - 被攻击方防御力) × COMBO
 */

import type { RoundResult, RoundOutcome, DamageCalculation } from './types';
import type { Hand } from './hand';
import type { HandSumContext } from './card';

/** 回合结算上下文（稻草人稻草卡等） */
export interface ResolveRoundContext {
  /** 敌人手牌稻草卡可当 1 使用（稻草人 Stand 12 点时） */
  enemyStrawAsOne?: boolean;
}

function buildDamageCalculation(
  attackerAttack: number,
  defenderDefense: number,
  combo: number
): DamageCalculation {
  const baseDamage = Math.max(0, attackerAttack - defenderDefense);
  const finalDamage = baseDamage * combo;
  return {
    attackerAttack,
    defenderDefense,
    baseDamage,
    combo,
    finalDamage,
  };
}

/** 战斗规则 */
export const CombatRules = {
  /**
   * 结算回合
   * @param playerHand 玩家手牌
   * @param enemyHand 敌人手牌
   * @param currentCombo 当前 COMBO（回合内累加，回合结束重置为 1）
   * @param playerAttack 玩家攻击力
   * @param playerDefense 玩家防御力
   * @param enemyAttack 敌人攻击力
   * @param enemyDefense 敌人防御力
   * @returns RoundResult
   */
  resolveRound(
    playerHand: Hand,
    enemyHand: Hand,
    currentCombo: number,
    playerAttack: number,
    playerDefense: number,
    enemyAttack: number,
    enemyDefense: number,
    context?: ResolveRoundContext
  ): RoundResult {
    const enemySumContext: HandSumContext | undefined = context?.enemyStrawAsOne
      ? { strawAsOne: true }
      : undefined;
    const playerBust = playerHand.isBust();
    const enemyBust = enemyHand.isBust(enemySumContext);
    const enemySumWithCtx = enemyHand.sum(enemySumContext);
    const playerPerfect = playerHand.isPerfect();
    const enemyPerfect = enemyHand.isPerfect(enemySumContext);

    // 双方都 BUST → 平局，不掉血，COMBO 重置为 1
    if (playerBust && enemyBust) {
      return {
        outcome: 'DRAW',
        comboApplied: 1,
        damageDealt: 0,
        playerBust,
        enemyBust,
        playerPerfect,
        enemyPerfect,
      };
    }

    // 玩家 BUST，敌人未 BUST → 敌人胜
    if (playerBust && !enemyBust) {
      let combo = currentCombo;
      if (enemyPerfect) combo += 1;
      combo += 1; // 因对方 BUST 获胜
      const damageCalc = buildDamageCalculation(
        enemyAttack,
        playerDefense,
        combo
      );
      return {
        outcome: 'ENEMY_WIN',
        comboApplied: combo,
        damageDealt: damageCalc.finalDamage,
        playerBust,
        enemyBust,
        playerPerfect,
        enemyPerfect,
        damageCalculation: damageCalc,
      };
    }

    // 敌人 BUST，玩家未 BUST → 玩家胜
    if (!playerBust && enemyBust) {
      let combo = currentCombo;
      if (playerPerfect) combo += 1;
      combo += 1; // 因对方 BUST 获胜
      const damageCalc = buildDamageCalculation(
        playerAttack,
        enemyDefense,
        combo
      );
      return {
        outcome: 'PLAYER_WIN',
        comboApplied: combo,
        damageDealt: damageCalc.finalDamage,
        playerBust,
        enemyBust,
        playerPerfect,
        enemyPerfect,
        damageCalculation: damageCalc,
      };
    }

    // 都未 BUST：比点数
    const playerSum = playerHand.sum();
    const enemySum = enemyHand.sum(enemySumContext);

    if (playerSum > enemySum) {
      let combo = currentCombo;
      if (playerPerfect) combo += 1;
      const damageCalc = buildDamageCalculation(
        playerAttack,
        enemyDefense,
        combo
      );
      return {
        outcome: 'PLAYER_WIN',
        comboApplied: combo,
        damageDealt: damageCalc.finalDamage,
        playerBust,
        enemyBust,
        playerPerfect,
        enemyPerfect,
        damageCalculation: damageCalc,
      };
    }

    if (enemySum > playerSum) {
      let combo = currentCombo;
      if (enemyPerfect) combo += 1;
      const damageCalc = buildDamageCalculation(
        enemyAttack,
        playerDefense,
        combo
      );
      return {
        outcome: 'ENEMY_WIN',
        comboApplied: combo,
        damageDealt: damageCalc.finalDamage,
        playerBust,
        enemyBust,
        playerPerfect,
        enemyPerfect,
        damageCalculation: damageCalc,
      };
    }

    // 点数相等 → 平局
    return {
      outcome: 'DRAW',
      comboApplied: 1,
      damageDealt: 0,
      playerBust,
      enemyBust,
      playerPerfect,
      enemyPerfect,
    };
  },
};
