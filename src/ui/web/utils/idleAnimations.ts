/**
 * 待机浮动动画 - 商业级摇摆与弹跳效果
 */

import Phaser from 'phaser';
import { ANIM } from '../config';

export interface PendulumSwayOptions {
  /** 摇摆角度（度），默认 2 */
  angle?: number;
  /** 单次摆动周期（ms），默认 3000 */
  duration?: number;
  /** 随机延迟（ms），避免多对象同步 */
  delay?: number;
}

export interface IconBounceOptions {
  /** 上下位移像素，默认 2 */
  offset?: number;
  /** 单次周期（ms），默认 1200 */
  duration?: number;
  /** 随机延迟（ms） */
  delay?: number;
}

export interface JitterSwayOptions {
  /** 摇摆角度（度），默认 1 */
  angle?: number;
  /** 单次摆动周期（ms），默认 4000，为卡牌摇摆的 2 倍 */
  duration?: number;
  /** 随机延迟（ms） */
  delay?: number;
  /** 阶梯步数，实现一抖一抖效果，默认 4 */
  steps?: number;
}

const DEG_TO_RAD = Math.PI / 180;

/**
 * 左右摇摆（卡牌、头像、BOSS）- 类似摇摆锤
 */
export function addPendulumSway(
  scene: Phaser.Scene,
  target: Phaser.GameObjects.GameObject & { rotation?: number },
  options?: PendulumSwayOptions
): Phaser.Tweens.Tween {
  const angle = (options?.angle ?? ANIM.pendulumAngle ?? 2) * DEG_TO_RAD;
  const duration = options?.duration ?? ANIM.pendulumDuration ?? 3000;
  const delay = options?.delay ?? Math.random() * 500;

  return scene.tweens.add({
    targets: target,
    rotation: { from: -angle, to: angle },
    duration,
    ease: 'Sine.easeInOut',
    yoyo: true,
    repeat: -1,
    delay,
  });
}

/**
 * 抖动式左右摇摆（点数计数器）- 一抖一抖风格，频率为卡牌的一半
 */
export function addJitterSway(
  scene: Phaser.Scene,
  target: Phaser.GameObjects.GameObject & { rotation?: number },
  options?: JitterSwayOptions
): Phaser.Tweens.Tween {
  const angle = (options?.angle ?? 1) * DEG_TO_RAD;
  const duration = options?.duration ?? 4000;
  const delay = options?.delay ?? Math.random() * 500;
  const steps = options?.steps ?? 4;

  return scene.tweens.add({
    targets: target,
    rotation: { from: -angle, to: angle },
    duration,
    ease: 'Stepped',
    easeParams: [steps],
    yoyo: true,
    repeat: -1,
    delay,
  });
}

/**
 * 上下弹跳（攻击/防御/特性图标）- 任天堂风格
 * 从当前 y 位置向上下小幅位移
 */
export function addIconBounce(
  scene: Phaser.Scene,
  target: Phaser.GameObjects.GameObject & { y?: number },
  options?: IconBounceOptions
): Phaser.Tweens.Tween {
  const offset = options?.offset ?? ANIM.iconBounceOffset ?? 2;
  const duration = options?.duration ?? ANIM.iconBounceDuration ?? 1200;
  const delay = options?.delay ?? Math.random() * 300;
  const currentY = (target as { y?: number }).y ?? 0;

  return scene.tweens.add({
    targets: target,
    y: currentY - offset,
    duration: duration / 2,
    ease: 'Sine.easeInOut',
    yoyo: true,
    repeat: -1,
    delay,
  });
}
