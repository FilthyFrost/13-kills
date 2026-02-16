/**
 * BUFF/DEBUFF 注册表
 */

import type { BuffId } from '../../types';

export interface BuffConfig {
  id: BuffId;
  iconKey: string;
  /** 持续回合数，-1 表示本回合结束清除 */
  duration: number;
}

const registry = new Map<BuffId, BuffConfig>();

export function registerBuff(config: BuffConfig): void {
  registry.set(config.id, config);
}

export function getBuff(id: BuffId): BuffConfig | undefined {
  return registry.get(id);
}
