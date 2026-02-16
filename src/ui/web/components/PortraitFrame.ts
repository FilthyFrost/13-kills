/**
 * 头像框（玩家/敌人复用）- 支持左右摇摆浮动
 */

import Phaser from 'phaser';
import { COLORS } from '../config';
import { addPendulumSway } from '../utils/idleAnimations';

export class PortraitFrame {
  private container: Phaser.GameObjects.Container;
  private frame: Phaser.GameObjects.Graphics;
  private placeholder: Phaser.GameObjects.Graphics;
  private size: number;
  private x: number;
  private y: number;
  private portraitImage: Phaser.GameObjects.Image | null = null;
  private swayTween: Phaser.Tweens.Tween | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number, size: number = 80) {
    this.size = size;
    this.x = x;
    this.y = y;

    this.container = scene.add.container(x, y);
    this.container.setDepth(40);
    this.container.setScrollFactor(0);

    this.frame = scene.add.graphics();
    this.frame.setScrollFactor(0);
    this.placeholder = scene.add.graphics();
    this.placeholder.setScrollFactor(0);

    this.container.add([this.frame, this.placeholder]);
    this.setPosition(x, y);
    this.swayTween = addPendulumSway(scene, this.container, { angle: 2 });
  }

  setPosition(x: number, y: number): void {
    this.x = x;
    this.y = y;
    this.container.setPosition(x, y);
    this.frame.clear();
    this.placeholder.clear();
    const s = this.size;
    const half = s / 2;
    this.frame.fillStyle(COLORS.bgLight, 1);
    this.frame.fillRoundedRect(-half, -half, s, s, 8);
    this.frame.lineStyle(2, COLORS.textDim, 1);
    this.frame.strokeRoundedRect(-half, -half, s, s, 8);
    this.placeholder.fillStyle(COLORS.bgMid, 1);
    this.placeholder.fillRoundedRect(-half + 4, -half + 4, s - 8, s - 8, 4);

    if (this.portraitImage) {
      this.portraitImage.setPosition(0, 0);
    }
  }

  setVisible(visible: boolean): void {
    this.container.setVisible(visible);
    if (this.portraitImage) this.portraitImage.setVisible(visible);
  }

  setImage(key: string): void {
    if (this.portraitImage) {
      this.portraitImage.destroy();
      this.portraitImage = null;
    }
    const scene = this.container.scene;
    if (scene.textures.exists(key)) {
      this.portraitImage = scene.add.image(0, 0, key);
      this.portraitImage.setDisplaySize(this.size - 8, this.size - 8);
      this.portraitImage.setOrigin(0.5);
      this.portraitImage.setDepth(2);
      this.portraitImage.setScrollFactor(0);
      this.container.add(this.portraitImage);
    }
  }

  destroy(): void {
    this.swayTween?.remove();
    this.swayTween = null;
    this.portraitImage?.destroy();
    this.portraitImage = null;
    this.container.destroy();
  }
}
