/**
 * 主菜单场景 - 13 KILLS
 */

import Phaser from 'phaser';
import { WIDTH, HEIGHT, COLORS, PIXEL_FONT } from '../config';
import { BackgroundLayer } from '../components/BackgroundLayer';

const SAVE_KEY = '13kills_save';

function hasSavedGame(): boolean {
  try {
    const storage = (globalThis as Record<string, unknown>).localStorage;
    return storage != null && typeof (storage as Record<string, unknown>).getItem === 'function' &&
      (storage as { getItem: (k: string) => string | null }).getItem(SAVE_KEY) !== null;
  } catch {
    return false;
  }
}

function createMenuButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  enabled: boolean,
  subLabel?: string,
  onClick?: () => void
): { zone: Phaser.GameObjects.Zone; container: Phaser.GameObjects.Container } {
  const w = 200;
  const h = 56;

  const zone = scene.add.zone(x, y, w, h).setInteractive({ useHandCursor: enabled });
  zone.setDepth(100);
  zone.setScrollFactor(0);
  zone.on('pointerdown', () => {
    if (enabled && onClick) onClick();
  });

  const container = scene.add.container(x, y);
  container.setScrollFactor(0);
  container.setDepth(99);

  const bg = scene.add.graphics();
  bg.fillStyle(enabled ? COLORS.bgLight : COLORS.bgMid, 1);
  bg.fillRoundedRect(-w / 2, -h / 2, w, h, 12);
  bg.lineStyle(2, enabled ? COLORS.text : COLORS.textDim, 1);
  bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 12);

  const text = scene.add
    .text(0, subLabel ? -6 : 0, label, {
      fontSize: '18px',
      color: enabled ? '#ffffff' : '#555555',
      fontFamily: PIXEL_FONT,
    })
    .setOrigin(0.5);

  container.add([bg, text]);

  if (subLabel) {
    const sub = scene.add
      .text(0, 14, subLabel, {
        fontSize: '10px',
        color: '#666666',
        fontFamily: PIXEL_FONT,
      })
      .setOrigin(0.5);
    container.add(sub);
  }

  zone.on('pointerover', () => {
    if (enabled) text.setColor('#cccccc');
  });
  zone.on('pointerout', () => {
    text.setColor(enabled ? '#ffffff' : '#555555');
  });

  return { zone, container };
}

export class MainMenuScene extends Phaser.Scene {
  private background!: BackgroundLayer;

  constructor() {
    super({ key: 'MainMenu' });
  }

  create(): void {
    this.background = new BackgroundLayer(this);

    const cx = WIDTH / 2;
    const titleY = HEIGHT * 0.28;

    const titleText = this.add
      .text(cx, titleY, '13 KILLS', {
        fontSize: '72px',
        color: '#b22222',
        fontFamily: PIXEL_FONT,
      })
      .setOrigin(0.5)
      .setStroke('#ffffff', 3)
      .setShadow(0, 4, '#000000', 4);

    this.tweens.add({
      targets: titleText,
      y: titleY - 8,
      duration: 1500,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });

    this.add
      .text(cx, titleY + 52, '[13点卡牌对战]', {
        fontSize: '14px',
        color: '#888888',
        fontFamily: PIXEL_FONT,
      })
      .setOrigin(0.5);

    const hasSave = hasSavedGame();

    const newRunBtn = createMenuButton(this, cx, HEIGHT * 0.52, 'NEW RUN', true, undefined, () => {
      this.scene.start('Battle');
    });

    const continueBtn = createMenuButton(
      this,
      cx,
      HEIGHT * 0.62,
      'CONTINUE',
      hasSave,
      hasSave ? undefined : '暂无存档',
      hasSave
        ? () => {
            this.scene.start('Battle');
          }
        : undefined
    );
  }

  shutdown(): void {
    this.background?.destroy();
  }
}
