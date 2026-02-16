/**
 * 肉鸽地图数据结构
 * 节点类型：出生点、BOSS、商人、财宝、不明（无小怪、无篝火）
 * 起点仅连接上下 BOSS，初始只开放下方 BOSS
 */

export type MapNodeType = 'SPAWN' | 'BOSS' | 'MERCHANT' | 'TREASURE' | 'UNKNOWN';

export interface MapNode {
  id: string;
  type: MapNodeType;
  gridX: number;
  gridY: number;
  visited: boolean;
  reachable: boolean;
  nextIds: string[];
}

export interface MapData {
  nodes: MapNode[];
  currentNodeId: string;
}

const NODE_LABELS: Record<MapNodeType, string> = {
  SPAWN: '起点',
  BOSS: 'BOSS',
  MERCHANT: '商人',
  TREASURE: '财宝',
  UNKNOWN: '?',
};

export function getNodeLabel(type: MapNodeType): string {
  return NODE_LABELS[type];
}

/**
 * 节点是否锁定：未访问且不可到达
 */
export function isNodeLocked(node: MapNode): boolean {
  return !node.visited && !node.reachable;
}

/**
 * 创建初始地图：起点仅连接上下 BOSS，只开放下方 BOSS
 */
export function createInitialMap(): MapData {
  const nodes: MapNode[] = [];

  // 中心 (0,0): SPAWN - 仅连接上下两个 BOSS
  const spawn: MapNode = {
    id: 'spawn',
    type: 'SPAWN',
    gridX: 0,
    gridY: 0,
    visited: true,
    reachable: false,
    nextIds: ['boss_d1', 'boss_u1'],
  };
  nodes.push(spawn);

  // row 1 (上): BOSS - 锁定
  const bossU1: MapNode = {
    id: 'boss_u1',
    type: 'BOSS',
    gridX: 0,
    gridY: 1,
    visited: false,
    reachable: false,
    nextIds: [],
  };
  nodes.push(bossU1);

  // row -1 (下): BOSS - 唯一开放
  const bossD1: MapNode = {
    id: 'boss_d1',
    type: 'BOSS',
    gridX: 0,
    gridY: -1,
    visited: false,
    reachable: true,
    nextIds: ['merchant_d2', 'treasure_d2', 'unknown_d2'],
  };
  nodes.push(bossD1);

  // row -2 (下): 商人、财宝、不明 - 击败 BOSS 后解锁
  const merchantD2: MapNode = {
    id: 'merchant_d2',
    type: 'MERCHANT',
    gridX: -1,
    gridY: -2,
    visited: false,
    reachable: false,
    nextIds: [],
  };
  const treasureD2: MapNode = {
    id: 'treasure_d2',
    type: 'TREASURE',
    gridX: 0,
    gridY: -2,
    visited: false,
    reachable: false,
    nextIds: [],
  };
  const unknownD2: MapNode = {
    id: 'unknown_d2',
    type: 'UNKNOWN',
    gridX: 1,
    gridY: -2,
    visited: false,
    reachable: false,
    nextIds: [],
  };
  nodes.push(merchantD2, treasureD2, unknownD2);

  return {
    nodes,
    currentNodeId: 'spawn',
  };
}

export function getNodeById(data: MapData, id: string): MapNode | undefined {
  return data.nodes.find((n) => n.id === id);
}

/**
 * 战斗胜利后更新地图状态
 */
export function applyBattleWin(data: MapData, nodeId: string): MapData {
  const node = getNodeById(data, nodeId);
  if (!node) return data;

  node.visited = true;
  node.reachable = false;
  data.currentNodeId = nodeId;

  for (const nextId of node.nextIds) {
    const next = getNodeById(data, nextId);
    if (next) next.reachable = true;
  }

  return data;
}
