/**
 * 手牌点数显示（含 MAX: 13）
 * 支持玩家右侧、敌人左侧布局；敌人盖牌时显示猜测范围
 */

import Phaser from 'phaser';
import { PIXEL_FONT, COLORS, CARD_WIDTH, CARD_HEIGHT } from '../config';

const MAX_HAND = 13;

export type HandSumPosition = 'left' | 'right';

export class HandSumDisplay {
  private text: Phaser.GameObjects.Text;
  private bg: Phaser.GameObjects.Graphics;
  private x: number;
  private y: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    private position: HandSumPosition = 'right'
  ) {
    this.x = x;
    this.y = y;

    this.bg = scene.add.graphics();
    this.bg.setScrollFactor(0);
    this.bg.setDepth(64);

    this.text = scene.add
      .text(x, y, '0\nMAX : 13', {
        fontSize: '18px',
        color: '#ff3333',
        fontFamily: PIXEL_FONT,
        align: 'center',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(65)
      .setStroke('#ffffff', 1);

    this.drawBg();
  }

  setPosition(x: number, y: number): void {
    this.x = x;
    this.y = y;
    this.text.setPosition(x, y);
    this.drawBg();
  }

  private drawBg(): void {
    this.bg.clear();
    const w = CARD_WIDTH;
    const h = CARD_HEIGHT;
    this.bg.fillStyle(COLORS.bgMid, 1);
    this.bg.fillRoundedRect(this.x - w / 2, this.y - h / 2, w, h, 6);
    this.bg.lineStyle(2, COLORS.bgDark, 1);
    this.bg.strokeRoundedRect(this.x - w / 2, this.y - h / 2, w, h, 6);
  }

  /** 玩家或敌人无盖牌时使用 */
  setSum(sum: number, isBust: boolean): void {
    this.text.setText(`${sum}\nMAX : 13`);
    this.text.setColor(isBust ? '#ff4444' : '#ff3333');
  }

  /**
   * 敌人有盖牌时显示猜测范围
   * @param visibleSum 可见牌点数之和
   * @param hasHiddenCard 是否有盖牌
   * @param isBust 是否爆牌（盖牌翻开后）
   */
  setSumWithRange(
    visibleSum: number,
    hasHiddenCard: boolean,
    isBust: boolean
  ): void {
    if (!hasHiddenCard) {
      this.setSum(visibleSum, isBust);
      return;
    }
    const min = visibleSum + 1;
    const max = visibleSum + 7;
    this.text.setText(`${min}-${max}?\nMAX : 13`);
    this.text.setColor('#ff3333');
  }

  destroy(): void {
    this.bg.destroy();
    this.text.destroy();
  }
}
