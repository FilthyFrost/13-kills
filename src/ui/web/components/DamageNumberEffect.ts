/**
 * 受击 "-1" 浮动数字特效 + 刀砍切割 + 屏幕抖动（递进曲线）
 */

import Phaser from 'phaser';
import { PIXEL_FONT, ANIM } from '../config';
import { playSlashEffect } from './SlashEffect';

export interface DamageNumberEffectOptions {
  /** 每次显示的数字（如 -1） */
  value: number;
  /** 显示次数（总伤害为 value * count） */
  count: number;
  /** 是否在每次显示时触发屏幕抖动 */
  screenShake?: boolean;
  /** 每次 "-1" 触发时调用，用于实时更新血量条 */
  onEachHit?: (index: number) => void;
  /** 每次 "-1" 触发时调用，用于 BOSS 立绘等视觉反馈 */
  onEachHitVisual?: (index: number) => void;
  /** 刀砍特效强度：exaggerated 用于玩家受击 */
  slashIntensity?: 'normal' | 'exaggerated';
}

/**
 * 在指定位置播放伤害数字浮动特效（含刀砍 + 递进式抖动）
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
  const { value, count, screenShake = true, onEachHit, onEachHitVisual, slashIntensity = 'normal' } = options;
  const duration = ANIM.damageNumberDuration;
  const interval = ANIM.damageNumberInterval;

  let completed = 0;

  const baseIntensity = ANIM.screenShakeBaseIntensity ?? ANIM.screenShakeIntensity;
  const baseDuration = ANIM.screenShakeBaseDuration ?? ANIM.screenShakeDuration;
  const scalePerHit = ANIM.screenShakeScalePerHit ?? 0.15;

  const spawnOne = (index: number) => {
    onEachHit?.(index);
    onEachHitVisual?.(index);
    playSlashEffect(scene, x, y, { index, totalCount: count, intensity: slashIntensity });

    const offsetX = (Math.random() - 0.5) * 40;
    const offsetY = (Math.random() - 0.5) * 20;
    const driftX = (Math.random() - 0.5) * 30;
    const fontSize = Math.min(56, 36 + index * 3);
    const text = scene.add
      .text(x + offsetX, y + offsetY, `-${value}`, {
        fontSize: `${fontSize}px`,
        color: '#ff1111',
        fontFamily: PIXEL_FONT,
      })
      .setOrigin(0.5)
      .setDepth(200)
      .setAlpha(1)
      .setScale(0.6)
      .setStroke('#990000', 2);

    if (screenShake) {
      const intensity = Math.min(
        0.25,
        baseIntensity * (1 + index * scalePerHit)
      );
      const shakeDuration = baseDuration + index * 12;
      scene.cameras.main.shake(shakeDuration, intensity);
    }

    scene.tweens.add({
      targets: text,
      scale: 1.15,
      duration: 60,
      ease: 'Back.easeOut',
      onComplete: () => {
        scene.tweens.add({
          targets: text,
          scale: 1,
          duration: 40,
          ease: 'Quad.easeOut',
        });
      },
    });

    scene.tweens.add({
      targets: text,
      y: text.y - 80,
      x: text.x + driftX,
      alpha: 0,
      duration,
      ease: 'Bounce.easeOut',
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
