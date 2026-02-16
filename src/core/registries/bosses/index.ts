/**
 * BOSS 注册表 - 模块化 BOSS 定义
 */

import type { BossId } from '../../types';
import type { Action } from '../../types';
import type { Card } from '../../card';
import type { Hand } from '../../hand';
import type { Deck } from '../../deck';
import type { HandSumContext } from '../../card';
import type { RNG } from '../../rng';

/** AI 决策上下文（供 aiDecide 使用） */
export interface AIContext {
  playerHand: Hand;
  enemyHand: Hand;
  enemyDeck: Deck;
  getEnemySumContext: () => HandSumContext | undefined;
  rng: RNG;
}

export interface BossConfig {
  id: BossId;
  hp: number;
  attack: number;
  defense: number;
  deckFactory: () => Card[];
  portraitKey: string;
  /** 显示名称，如「稻草人」 */
  displayName?: string;
  /** 玩家 Stand 时触发的技能 */
  onPlayerStand?: (playerHandCards: readonly Card[]) => { addDebuff?: string } | void;
  /** 自定义 AI 决策（稻草人等 BOSS 使用概率策略） */
  aiDecide?: (ctx: AIContext) => Action;
}

const registry = new Map<BossId, BossConfig>();

export function registerBoss(config: BossConfig): void {
  registry.set(config.id, config);
}

export function getBoss(id: BossId): BossConfig | undefined {
  return registry.get(id);
}
