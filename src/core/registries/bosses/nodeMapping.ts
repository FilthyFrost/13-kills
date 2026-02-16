/**
 * 地图节点 ID 到 BOSS ID 的映射
 */

import type { BossId } from '../../types';

export const NODE_TO_BOSS: Record<string, BossId> = {
  boss_d1: 'SCARECROW',
};

export function getBossIdByNodeId(nodeId: string): BossId | undefined {
  return NODE_TO_BOSS[nodeId];
}
