/**
 * 肉鸽地图场景 - 黑暗系 8-bit 风格，中心出生，上下分支
 */

import Phaser from 'phaser';
import { WIDTH, HEIGHT, PIXEL_FONT, PIXEL_STATS_FONT } from '../config';
import {
  type MapData,
  createInitialMap,
  getNodeById,
  isNodeLocked,
} from '../data/mapData';

const ROW_HEIGHT = 100;
const COL_WIDTH = 120;
const NODE_SIZE = 48;

const BG_DARK = 0x0a0a0a;
const PATH_WHITE = 0xffffff;
const NODE_REACHABLE_BG = 0xcccccc;
const NODE_REACHABLE_BORDER = 0xdddddd;
const NODE_ICON_DARK = 0x333333;
const NODE_VISITED = 0x666666;
const NODE_LOCKED = 0x333333;
const TEXT_WHITE = '#ffffff';
const TEXT_GRAY = '#888888';

const ICON_KEYS: Record<string, string> = {
  SPAWN: 'map_icon_spawn',
  BOSS: 'map_icon_boss',
  MERCHANT: 'map_icon_merchant',
  TREASURE: 'map_icon_treasure',
};

function gridToScreen(
  gridX: number,
  gridY: number
): { x: number; y: number } {
  const cx = WIDTH / 2;
  const cy = HEIGHT / 2;
  return {
    x: cx + gridX * COL_WIDTH,
    y: cy - gridY * ROW_HEIGHT,
  };
}

export class MapScene extends Phaser.Scene {
  private mapData!: MapData;
  private pathGraphics!: Phaser.GameObjects.Graphics;
  private nodeContainer!: Phaser.GameObjects.Container;
  private nodeZones: Map<string, Phaser.GameObjects.Zone> = new Map();

  constructor() {
    super({ key: 'Map' });
  }

  create(): void {
    this.mapData =
      (this.registry.get('mapData') as MapData | undefined) ?? createInitialMap();

    const cx = WIDTH / 2;
    const cy = HEIGHT / 2;

    // 纯黑背景
    const bg = this.add.graphics();
    bg.fillStyle(BG_DARK, 1);
    bg.fillRect(0, 0, WIDTH, HEIGHT);
    bg.setScrollFactor(0);
    bg.setDepth(-1000);

    // 路径连线（白色虚线）
    this.pathGraphics = this.add.graphics();
    this.pathGraphics.setScrollFactor(0);
    this.pathGraphics.setDepth(0);
    this.drawPaths();

    // 节点容器
    this.nodeContainer = this.add.container(0, 0);
    this.nodeContainer.setScrollFactor(0);
    this.nodeContainer.setDepth(1);
    this.drawNodes();

    // 节点交互区域
    this.createNodeZones();

    // 图例
    this.drawLegend();
  }

  private drawPaths(): void {
    this.pathGraphics.clear();
    const nodeMap = new Map(this.mapData.nodes.map((n) => [n.id, n]));

    for (const node of this.mapData.nodes) {
      const from = gridToScreen(node.gridX, node.gridY);
      for (const nextId of node.nextIds) {
        const next = nodeMap.get(nextId);
        if (!next) continue;
        const to = gridToScreen(next.gridX, next.gridY);
        const visited = node.visited && next.visited;
        this.pathGraphics.lineStyle(2, PATH_WHITE, visited ? 0.4 : 0.6);
        this.drawDashedLine(from.x, from.y, to.x, to.y, 8, 6);
      }
    }
  }

  private drawDashedLine(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    dashLen: number,
    gapLen: number
  ): void {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    const ux = dx / len;
    const uy = dy / len;
    let t = 0;
    let drawing = true;
    this.pathGraphics.beginPath();
    this.pathGraphics.moveTo(x1, y1);
    while (t < len) {
      const step = drawing ? dashLen : gapLen;
      t += step;
      const endT = Math.min(t, len);
      const ex = x1 + ux * endT;
      const ey = y1 + uy * endT;
      if (drawing) {
        this.pathGraphics.lineTo(ex, ey);
      } else {
        this.pathGraphics.moveTo(ex, ey);
      }
      drawing = !drawing;
    }
    this.pathGraphics.strokePath();
  }

  private drawNodes(): void {
    this.nodeContainer.removeAll(true);

    for (const node of this.mapData.nodes) {
      const pos = gridToScreen(node.gridX, node.gridY);
      const isCurrent = node.id === this.mapData.currentNodeId;
      const locked = isNodeLocked(node);

      let bgColor: number;
      const isReachableOrCurrent = isCurrent || node.reachable;
      if (isReachableOrCurrent) {
        bgColor = NODE_REACHABLE_BG;
      } else if (node.visited) {
        bgColor = NODE_VISITED;
      } else {
        bgColor = NODE_LOCKED;
      }

      const half = NODE_SIZE / 2;

      // 节点背景（方形 8-bit 风格）
      const rect = this.add.graphics();
      rect.fillStyle(bgColor, 0.9);
      rect.fillRoundedRect(pos.x - half, pos.y - half, NODE_SIZE, NODE_SIZE, 4);
      const borderColor = locked ? 0x555555 : isReachableOrCurrent ? NODE_REACHABLE_BORDER : 0x888888;
      rect.lineStyle(2, borderColor, 1);
      rect.strokeRoundedRect(pos.x - half, pos.y - half, NODE_SIZE, NODE_SIZE, 4);
      this.nodeContainer.add(rect);

      // 图标或文字：不明节点用像素风「?」
      const iconTint = locked ? 0x666666 : isReachableOrCurrent ? NODE_ICON_DARK : 0x888888;
      const textColor = locked ? '#666666' : isReachableOrCurrent ? '#333333' : '#888888';

      if (node.type === 'UNKNOWN') {
        const text = this.add.text(pos.x, pos.y, '?', {
          fontSize: '24px',
          fontFamily: PIXEL_STATS_FONT,
          color: textColor,
        });
        text.setOrigin(0.5);
        this.nodeContainer.add(text);
      } else {
        const iconKey = ICON_KEYS[node.type];
        if (iconKey) {
          const icon = this.add.image(pos.x, pos.y, iconKey);
          icon.setDisplaySize(NODE_SIZE * 0.7, NODE_SIZE * 0.7);
          icon.setTint(iconTint);
          this.nodeContainer.add(icon);
        }
      }

      // 锁定节点：锁图标放右下角，缩小，避免遮挡主图标
      if (locked) {
        const lockIcon = this.add.image(
          pos.x + half * 0.55,
          pos.y + half * 0.55,
          'map_icon_lock'
        );
        lockIcon.setDisplaySize(NODE_SIZE * 0.22, NODE_SIZE * 0.22);
        lockIcon.setTint(0xffffff);
        this.nodeContainer.add(lockIcon);
      }
    }
  }

  private createNodeZones(): void {
    this.nodeZones.forEach((z) => z.destroy());
    this.nodeZones.clear();

    for (const node of this.mapData.nodes) {
      if (!node.reachable) continue;
      const pos = gridToScreen(node.gridX, node.gridY);
      const zone = this.add
        .zone(pos.x, pos.y, NODE_SIZE * 2, NODE_SIZE * 2)
        .setInteractive({ useHandCursor: true });
      zone.setDepth(10);
      zone.setScrollFactor(0);
      zone.on('pointerdown', () => this.onNodeClick(node.id));
      this.nodeZones.set(node.id, zone);
    }
  }

  private onNodeClick(nodeId: string): void {
    const node = getNodeById(this.mapData, nodeId);
    if (!node || !node.reachable) return;

    this.registry.set('mapData', this.mapData);
    this.scene.start('Battle', { fromMap: true, nodeId });
  }

  private drawLegend(): void {
    const legendX = WIDTH - 120;
    const startY = 100;
    const lineHeight = 40;

    this.add
      .text(legendX, startY - 28, '图例', {
        fontSize: '14px',
        color: TEXT_WHITE,
        fontFamily: PIXEL_FONT,
      })
      .setOrigin(0.5, 0)
      .setDepth(5)
      .setScrollFactor(0);

    const items: { key: string; label: string; useText?: string }[] = [
      { key: 'map_icon_spawn', label: '起点' },
      { key: 'map_icon_boss', label: 'BOSS' },
      { key: 'map_icon_merchant', label: '商人' },
      { key: 'map_icon_treasure', label: '财宝' },
      { key: '', label: '不明', useText: '?' },
      { key: 'map_icon_lock', label: '锁定' },
    ];

    items.forEach((item, i) => {
      const y = startY + i * lineHeight;
      if (item.useText) {
        this.add
          .text(legendX - 45, y + 12, item.useText, {
            fontSize: '16px',
            fontFamily: PIXEL_STATS_FONT,
            color: TEXT_WHITE,
          })
          .setOrigin(0.5)
          .setDepth(5)
          .setScrollFactor(0);
      } else {
        const icon = this.add.image(legendX - 45, y + 12, item.key);
        icon.setDisplaySize(24, 24);
        icon.setTint(0xffffff);
        icon.setDepth(5);
        icon.setScrollFactor(0);
      }
      this.add
        .text(legendX, y + 12, item.label, {
          fontSize: '11px',
          color: TEXT_GRAY,
          fontFamily: PIXEL_FONT,
        })
        .setOrigin(0, 0.5)
        .setDepth(5)
        .setScrollFactor(0);
    });
  }

  shutdown(): void {
    this.nodeZones.forEach((z) => z.destroy());
    this.nodeZones.clear();
  }
}
