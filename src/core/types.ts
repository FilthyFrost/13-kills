/**
 * core/types.ts
 * 通用类型定义，便于扩展神/魔/铭刻/诅咒等
 */

/** 卡牌点数（白卡版：A-6，稻草卡为 0，稻草人牌组含 7） */
export type CardRank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '0';

/** Card Status 标识（卡牌特性） */
export type CardStatusId = 'DELETE';

/** BUFF/DEBUFF 标识 */
export type BuffId = 'LAZY';

/** BOSS 标识 */
export type BossId = 'SCARECROW';

/** 玩家/敌人行动 */
export type Action = 'HIT' | 'STAND';

/** 战斗阶段 */
export type Phase =
  | 'ROUND_START'
  | 'PLAYER_TURN'
  | 'ENEMY_TURN'
  | 'ROUND_RESOLVE'
  | 'BATTLE_END';

/** 回合胜负结果 */
export type RoundOutcome = 'PLAYER_WIN' | 'ENEMY_WIN' | 'DRAW';

/** 伤害计算明细（用于 UI 展示） */
export interface DamageCalculation {
  attackerAttack: number;
  defenderDefense: number;
  baseDamage: number;
  combo: number;
  finalDamage: number;
}

/** 回合结算结果（由 CombatRules 计算） */
export interface RoundResult {
  outcome: RoundOutcome;
  comboApplied: number;
  damageDealt: number;
  playerBust: boolean;
  enemyBust: boolean;
  playerPerfect: boolean;
  enemyPerfect: boolean;
  damageCalculation?: DamageCalculation;
}

/** 战斗结束原因 */
export type BattleEndReason = 'PLAYER_WIN' | 'ENEMY_WIN' | null;

/** 扩展预留：卡牌修饰符（神/魔/铭刻等） */
export interface CardModifier {
  id: string;
  apply?(context: unknown): unknown;
}

/** 扩展预留：战斗修饰符（诅咒等） */
export interface CombatModifier {
  id: string;
  apply?(context: unknown): unknown;
}
