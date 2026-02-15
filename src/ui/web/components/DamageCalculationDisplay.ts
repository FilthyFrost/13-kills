/**
 * 伤害计算过程展示：分步显示公式
 * 1. 攻击 X - 防御 Y = Z
 * 2. Z × COMBO N = 总伤害
 */

import Phaser from 'phaser';
import type { DamageCalculation } from '../../../core/types';
import { WIDTH, PIXEL_FONT } from '../config';

const STEP_DURATION = 400;
const FADE_DURATION = 200;

export function showDamageCalculationDisplay(
  scene: Phaser.Scene,
  calculation: DamageCalculation,
  onComplete?: () => void
): void {
  const cx = WIDTH / 2;
  const cy = 180;

  const bg = scene.add.graphics();
  bg.setScrollFactor(0);
  bg.setDepth(188);
  const pad = 24;
  const w = 280;
  const h = 90;
  bg.fillStyle(0x000000, 0.9);
  bg.fillRoundedRect(cx - w / 2, cy - h / 2, w, h, 10);
  bg.lineStyle(2, 0x444444, 1);
  bg.strokeRoundedRect(cx - w / 2, cy - h / 2, w, h, 10);
  bg.setAlpha(0);

  const line1 = scene.add
    .text(
      cx,
      cy - 22,
      `攻击 ${calculation.attackerAttack} - 防御 ${calculation.defenderDefense} = ${calculation.baseDamage}`,
      {
        fontSize: '14px',
        color: '#ffffff',
        fontFamily: PIXEL_FONT,
      }
    )
    .setOrigin(0.5)
    .setDepth(189)
    .setAlpha(0)
    .setStroke('#000000', 1);

  const line2 = scene.add
    .text(
      cx,
      cy + 18,
      `${calculation.baseDamage} × COMBO ${calculation.combo} = ${calculation.finalDamage}`,
      {
        fontSize: '14px',
        color: '#ff3333',
        fontFamily: PIXEL_FONT,
      }
    )
    .setOrigin(0.5)
    .setDepth(189)
    .setAlpha(0)
    .setStroke('#000000', 1);

  scene.tweens.add({
    targets: [bg, line1],
    alpha: 1,
    duration: FADE_DURATION,
    ease: 'Power2',
  });

  scene.time.delayedCall(STEP_DURATION, () => {
    scene.tweens.add({
      targets: line2,
      alpha: 1,
      duration: FADE_DURATION,
      ease: 'Power2',
    });
  });

  scene.time.delayedCall(STEP_DURATION * 2 + 200, () => {
    scene.tweens.add({
      targets: [bg, line1, line2],
      alpha: 0,
      duration: FADE_DURATION,
      ease: 'Power2',
      onComplete: () => {
        bg.destroy();
        line1.destroy();
        line2.destroy();
        onComplete?.();
      },
    });
  });
}
