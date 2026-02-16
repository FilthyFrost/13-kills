/**
 * 手牌点数显示（含 MAX: 13）
 * 支持玩家右侧、敌人左侧布局；敌人盖牌时显示猜测范围
 * 支持抖动式摇摆与位置动画
 */

import Phaser from 'phaser';
import { PIXEL_FONT, COLORS, CARD_WIDTH, CARD_HEIGHT, ANIM } from '../config';
import { addJitterSway } from '../utils/idleAnimations';

const MAX_HAND = 13;

export type HandSumPosition = 'left' | 'right';

export class HandSumDisplay {
  private container: Phaser.GameObjects.Container;
  private text: Phaser.GameObjects.Text;
  private bg: Phaser.GameObjects.Graphics;
  private jitterTween: Phaser.Tweens.Tween | null = null;
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

    this.container = scene.add.container(x, y);
    this.container.setScrollFactor(0);
    this.container.setDepth(64);

    this.bg = scene.add.graphics();
    this.text = scene.add
      .text(0, 0, '0\nMAX : 13', {
        fontSize: '18px',
        color: '#ff3333',
        fontFamily: PIXEL_FONT,
        align: 'center',
      })
      .setOrigin(0.5)
      .setStroke('#ffffff', 1);

    this.container.add([this.bg, this.text]);
    this.drawBg();

    this.jitterTween = addJitterSway(scene, this.container, {
      angle: 1,
      duration: 4000,
    });
  }

  setPosition(x: number, y: number): void {
    this.x = x;
    this.y = y;
    this.container.setPosition(x, y);
    this.drawBg();
  }

  /** 平滑移动到新位置（与卡牌布局同步） */
  setPositionAnimated(x: number, y: number, duration: number): void {
    this.x = x;
    this.y = y;
    this.container.scene.tweens.add({
      targets: this.container,
      x,
      y,
      duration,
      ease: ANIM.layoutSpreadEase ?? 'Cubic.easeOut',
    });
  }

  private drawBg(): void {
    this.bg.clear();
    const w = CARD_WIDTH;
    const h = CARD_HEIGHT;
    this.bg.fillStyle(COLORS.bgMid, 1);
    this.bg.fillRoundedRect(-w / 2, -h / 2, w, h, 6);
    this.bg.lineStyle(2, COLORS.bgDark, 1);
    this.bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 6);
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
    this.jitterTween?.remove();
    this.jitterTween = null;
    this.container.destroy();
  }
}
