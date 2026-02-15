/**
 * 预加载素材
 */

import Phaser from 'phaser';

const CARD_RANKS = ['A', '2', '3', '4', '5', '6'] as const;

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Boot' });
  }

  preload(): void {
    const base = import.meta.env.BASE_URL;
    CARD_RANKS.forEach((rank) => {
      this.load.image(`card_${rank}`, `${base}assets/cards/card_${rank}.png`);
    });
    this.load.image('card_back', `${base}assets/cards/card_back.png`);
    this.load.image('stats_icon_attack', `${base}assets/stats/icon_attack.png`);
    this.load.image('stats_icon_defense', `${base}assets/stats/icon_defense.png`);
  }

  create(): void {
    this.scene.start('MainMenu');
  }
}
