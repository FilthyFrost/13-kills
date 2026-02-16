/**
 * Card Status 注册表
 */

import type { CardStatusId } from '../../types';

export interface CardStatusConfig {
  id: CardStatusId;
  iconKey: string;
}

const registry = new Map<CardStatusId, CardStatusConfig>();

export function registerCardStatus(config: CardStatusConfig): void {
  registry.set(config.id, config);
}

export function getCardStatus(id: CardStatusId): CardStatusConfig | undefined {
  return registry.get(id);
}
