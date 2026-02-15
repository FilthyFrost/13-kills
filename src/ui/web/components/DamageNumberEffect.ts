/**
 * 受击 "-1" 浮动数字特效 + 屏幕抖动
 */

import Phaser from 'phaser';
import { PIXEL_FONT, ANIM, COLORS } from '../config';

export interface DamageNumberEffectOptions {
  /** 每次显示的数字（如 -1） */
  value: number;
  /** 显示次数（总伤害为 value * count） */
  count: number;
  /** 是否在每次显示时触发屏幕抖动 */
  screenShake?: boolean;
}

/**
 * 在指定位置播放伤害数字浮动特效
 * @param scene Phaser 场景
 * @param x 中心 X
 * @param y 中心 Y
 * @param options 选项
 * @param onComplete 全部播放完成回调
 */
export function playDamageNumberEffect(
  scene: Phaser.Scene,
  x: number,
  y: number,
  options: DamageNumberEffectOptions,
  onComplete?: () => void
): void {
  const { value, count, screenShake = true } = options;
  const duration = ANIM.damageNumberDuration;
  const interval = ANIM.damageNumberInterval;

  let completed = 0;

  const spawnOne = (index: number) => {
    const offsetX = (Math.random() - 0.5) * 40;
    const offsetY = (Math.random() - 0.5) * 20;
    const text = scene.add
      .text(x + offsetX, y + offsetY, `-${value}`, {
        fontSize: '20px',
        color: '#ff3333',
        fontFamily: PIXEL_FONT,
      })
      .setOrigin(0.5)
      .setDepth(200)
      .setAlpha(1)
      .setStroke('#ffffff', 1);

    if (screenShake) {
      scene.cameras.main.shake(
        ANIM.screenShakeDuration,
        ANIM.screenShakeIntensity
      );
    }

    scene.tweens.add({
      targets: text,
      y: text.y - 60,
      alpha: 0,
      duration,
      ease: 'Power2',
      onComplete: () => {
        text.destroy();
        completed++;
        if (completed >= count) {
          onComplete?.();
        }
      },
    });
  };

  for (let i = 0; i < count; i++) {
    scene.time.delayedCall(i * interval, () => spawnOne(i));
  }

  if (count === 0) {
    onComplete?.();
  }
}
