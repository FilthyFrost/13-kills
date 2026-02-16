/**
 * BOSS 大立绘 - 画面右侧增强压迫感（图3 位置）- 支持左右摇摆浮动 + 受击闪光膨胀
 */

import Phaser from 'phaser';
import { addPendulumSway } from '../utils/idleAnimations';

const SHOWCASE_WIDTH = 180;
const SHOWCASE_HEIGHT = 220;

export class BossShowcase {
  private container: Phaser.GameObjects.Container;
  private image: Phaser.GameObjects.Image | null = null;
  private flashOverlay: Phaser.GameObjects.Graphics;
  private swayTween: Phaser.Tweens.Tween | null = null;
  private hitFlashTween: Phaser.Tweens.Tween | null = null;
  private hitScaleUpTween: Phaser.Tweens.Tween | null = null;
  private hitScaleDownTween: Phaser.Tweens.Tween | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.container = scene.add.container(x, y);
    this.container.setDepth(35);
    this.container.setScrollFactor(0);
    this.container.setVisible(false);
    this.swayTween = addPendulumSway(scene, this.container, { angle: 2.5 });

    this.flashOverlay = scene.add.graphics();
    this.flashOverlay.fillStyle(0xffffff, 1);
    this.flashOverlay.fillRoundedRect(
      -SHOWCASE_WIDTH / 2,
      -SHOWCASE_HEIGHT / 2,
      SHOWCASE_WIDTH,
      SHOWCASE_HEIGHT,
      4
    );
    this.flashOverlay.setAlpha(0);
    this.container.add(this.flashOverlay);
  }

  setImage(key: string): void {
    if (this.image) {
      this.image.destroy();
      this.image = null;
    }
    const scene = this.container.scene;
    if (scene.textures.exists(key)) {
      this.image = scene.add.image(0, 0, key);
      this.image.setDisplaySize(SHOWCASE_WIDTH, SHOWCASE_HEIGHT);
      this.image.setOrigin(0.5);
      this.container.addAt(this.image, 0);
    }
  }

  setVisible(visible: boolean): void {
    this.container.setVisible(visible);
  }

  setPosition(x: number, y: number): void {
    this.container.setPosition(x, y);
  }

  /** 杀戮尖塔风格受击特效：闪光 + 膨胀 */
  playHitFlash(): void {
    if (!this.container.visible) return;

    this.hitFlashTween?.remove();
    this.hitScaleUpTween?.remove();
    this.hitScaleDownTween?.remove();
    this.hitFlashTween = null;
    this.hitScaleUpTween = null;
    this.hitScaleDownTween = null;

    const scene = this.container.scene;
    this.flashOverlay.setAlpha(0);
    this.container.setScale(1);

    this.hitFlashTween = scene.tweens.add({
      targets: this.flashOverlay,
      alpha: 0.85,
      duration: 30,
      ease: 'Quad.easeOut',
      onComplete: () => {
        scene.tweens.add({
          targets: this.flashOverlay,
          alpha: 0,
          duration: 70,
          ease: 'Quad.easeIn',
        });
      },
    });

    this.hitScaleUpTween = scene.tweens.add({
      targets: this.container,
      scale: 1.12,
      duration: 25,
      ease: 'Quad.easeOut',
      onComplete: () => {
        this.hitScaleDownTween = scene.tweens.add({
          targets: this.container,
          scale: 1,
          duration: 90,
          ease: 'Back.easeOut',
          easeParams: [1.5],
        });
      },
    });
  }

  destroy(): void {
    this.swayTween?.remove();
    this.swayTween = null;
    this.hitFlashTween?.remove();
    this.hitFlashTween = null;
    this.hitScaleUpTween?.remove();
    this.hitScaleUpTween = null;
    this.hitScaleDownTween?.remove();
    this.hitScaleDownTween = null;
    this.image?.destroy();
    this.image = null;
    this.flashOverlay.destroy();
    this.container.destroy();
  }
}
