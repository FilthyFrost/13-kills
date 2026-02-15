/**
 * 中央伤害气泡：黑色气泡 + 红色 "X DMG" + 箭头指向目标
 */

import Phaser from 'phaser';
import { WIDTH, HEIGHT, PIXEL_FONT } from '../config';

export function showDamageBubble(
  scene: Phaser.Scene,
  damage: number,
  targetX: number,
  targetY: number,
  onComplete?: () => void
): void {
  const cx = WIDTH / 2;
  const cy = HEIGHT / 2 - 40;

  const bubble = scene.add.graphics();
  bubble.setScrollFactor(0);
  bubble.setDepth(180);

  const text = scene.add
    .text(cx, cy - 8, `${damage}`, {
      fontSize: '28px',
      color: '#ff3333',
      fontFamily: PIXEL_FONT,
    })
    .setOrigin(0.5)
    .setDepth(181)
    .setAlpha(0)
    .setStroke('#ffffff', 1);

  const subText = scene.add
    .text(cx, cy + 20, 'DMG', {
      fontSize: '12px',
      color: '#ff3333',
      fontFamily: PIXEL_FONT,
    })
    .setOrigin(0.5)
    .setDepth(181)
    .setAlpha(0)
    .setStroke('#ffffff', 1);

  const bubbleWidth = Math.max(120, text.width + 60);
  const bubbleHeight = 70;

  bubble.fillStyle(0x000000, 0.85);
  bubble.fillRoundedRect(
    cx - bubbleWidth / 2,
    cy - bubbleHeight / 2,
    bubbleWidth,
    bubbleHeight,
    12
  );

  const arrow = scene.add.graphics();
  arrow.setScrollFactor(0);
  arrow.setDepth(181);
  const angle = Math.atan2(targetY - cy, targetX - cx);
  const arrowLen = 30;
  arrow.lineStyle(4, 0xff3333, 1);
  arrow.beginPath();
  arrow.moveTo(cx + Math.cos(angle) * 60, cy + Math.sin(angle) * 60);
  arrow.lineTo(
    cx + Math.cos(angle) * (60 + arrowLen),
    cy + Math.sin(angle) * (60 + arrowLen)
  );
  arrow.strokePath();
  arrow.setAlpha(0);

  scene.tweens.add({
    targets: [text, subText, arrow],
    alpha: 1,
    duration: 200,
    ease: 'Power2',
  });

  scene.time.delayedCall(800, () => {
    scene.tweens.add({
      targets: [bubble, text, subText, arrow],
      alpha: 0,
      duration: 300,
      ease: 'Power2',
      onComplete: () => {
        bubble.destroy();
        text.destroy();
        subText.destroy();
        arrow.destroy();
        onComplete?.();
      },
    });
  });
}
