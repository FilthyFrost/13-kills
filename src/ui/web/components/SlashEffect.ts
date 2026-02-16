/**
 * 刀砍特效 - 水果忍者风格切割动画，每次随机角度
 */

import Phaser from 'phaser';
import { ANIM } from '../config';

export interface SlashEffectOptions {
  /** 当前连击索引（0-based） */
  index: number;
  /** 总连击次数 */
  totalCount: number;
  /** 夸张程度：exaggerated 用于玩家受击，与 BOSS 侧观感一致 */
  intensity?: 'normal' | 'exaggerated';
}

const SLASH_SCALE_BASE = 5;
const SLASH_SCALE_PER_HIT = 0.7;
const SLASH_SCALE_MAX = 15;
const SLASH_EXAGGERATED_BASE = 7;
const SLASH_EXAGGERATED_PER_HIT = 1.0;
const SLASH_EXAGGERATED_MAX = 18;

/**
 * 在指定位置播放刀砍特效
 * @param scene Phaser 场景
 * @param x 中心 X
 * @param y 中心 Y
 * @param options 选项（index 用于递进缩放）
 * @param onComplete 播放完成回调
 */
export function playSlashEffect(
  scene: Phaser.Scene,
  x: number,
  y: number,
  options: SlashEffectOptions,
  onComplete?: () => void
): void {
  if (!scene.textures.exists('attack_slash_1')) return;

  const { index, intensity = 'normal' } = options;
  const isExaggerated = intensity === 'exaggerated';
  const base = isExaggerated ? SLASH_EXAGGERATED_BASE : (ANIM.slashScaleBase ?? SLASH_SCALE_BASE);
  const perHit = isExaggerated ? SLASH_EXAGGERATED_PER_HIT : (ANIM.slashScalePerHit ?? SLASH_SCALE_PER_HIT);
  const max = isExaggerated ? SLASH_EXAGGERATED_MAX : (ANIM.slashScaleMax ?? SLASH_SCALE_MAX);
  const scale = Math.min(max, base + index * perHit);
  const rotation = Math.random() * Math.PI * 2;

  const sprite = scene.add.sprite(x, y, 'attack_slash_1');
  sprite.setOrigin(0.5);
  sprite.setDepth(195);
  sprite.setScale(scale);
  sprite.setRotation(rotation);

  sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
    sprite.destroy();
    onComplete?.();
  });

  sprite.play('attack_slash');
}
