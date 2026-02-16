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

    // 地图 8-bit 图标
    this.load.image('map_icon_spawn', `${base}assets/map/icon_spawn.png`);
    this.load.image('map_icon_boss', `${base}assets/map/icon_boss.png`);
    this.load.image('map_icon_merchant', `${base}assets/map/icon_merchant.png`);
    this.load.image('map_icon_treasure', `${base}assets/map/icon_treasure.png`);
    this.load.image('map_icon_lock', `${base}assets/map/icon_lock.png`);

    // BOSS 立绘
    this.load.image('boss_scarecrow', `${base}assets/boss/ScareCrow.png`);

    // 稻草卡
    this.load.image('card_straw', `${base}assets/cards/ScareCrow/ScareCrow_Card_0.png`);

    // DEBUFF 图标
    this.load.image('debuff_lazy', `${base}assets/CurseAndBless/sloth.png`);

    // Card Status 图标
    this.load.image('cardstatus_delete', `${base}assets/CardStatusIcon/Delelte.png`);

    // 刀砍特效分帧（10 帧）
    for (let i = 1; i <= 10; i++) {
      this.load.image(`attack_slash_${i}`, `${base}assets/attack_animation_frames/${i}.png`);
    }
  }

  create(): void {
    const canvas = this.sys.game.canvas;
    Phaser.Display.Canvas.TouchAction(canvas, 'none');

    // 刀砍特效动画
    const slashFrames = Array.from({ length: 10 }, (_, i) => ({
      key: `attack_slash_${i + 1}`,
    }));
    this.anims.create({
      key: 'attack_slash',
      frames: slashFrames,
      frameRate: 24,
      repeat: 0,
    });

    this.scene.start('MainMenu');
  }
}
