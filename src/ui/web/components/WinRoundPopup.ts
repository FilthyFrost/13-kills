/**
 * YOU WIN THE ROUND + 伤害气泡 + COMBO 完整动画序列
 */

import Phaser from 'phaser';
import type { RoundResult } from '../../../core/types';
import { WIDTH, HEIGHT, PIXEL_FONT, ANIM } from '../config';
import { showDamageBubble } from './DamageBubble';
import { playDamageNumberEffect } from './DamageNumberEffect';
import { showDamageCalculationDisplay } from './DamageCalculationDisplay';
import type { HealthBar } from './HealthBar';

function getRoundResultMessage(result: RoundResult): string {
  if (result.outcome === 'DRAW') return 'DRAW';
  if (result.playerBust || result.enemyBust) return 'BUST!';
  if (result.playerPerfect || result.enemyPerfect) return 'PERFECT';
  if (result.outcome === 'PLAYER_WIN') return 'YOU WIN THE ROUND';
  if (result.outcome === 'ENEMY_WIN') return 'YOU LOSE THE ROUND';
  return '';
}

/**
 * 播放平局动画：显示 "DRAW" 或 "BOTH BUSTED!"（双方爆牌时）
 */
export function playDrawSequence(
  scene: Phaser.Scene,
  onComplete: () => void,
  result?: RoundResult
): void {
  const cx = WIDTH / 2;
  const cy = HEIGHT / 2 - 60;
  const message =
    result?.playerBust && result?.enemyBust ? 'BOTH BUSTED!' : 'DRAW';

  const winText = scene.add
    .text(cx, cy, message, {
      fontSize: '16px',
      color: '#aaaaaa',
      fontFamily: PIXEL_FONT,
    })
    .setOrigin(0.5)
    .setDepth(190)
    .setAlpha(0)
    .setStroke('#ffffff', 1);

  const bg = scene.add.graphics();
  bg.setScrollFactor(0);
  bg.setDepth(189);
  const pad = 20;
  const w = winText.width + pad * 2;
  const h = 50;
  bg.fillStyle(0x000000, 0.9);
  bg.fillRoundedRect(cx - w / 2, cy - h / 2, w, h, 8);

  scene.tweens.add({
    targets: [winText, bg],
    alpha: 1,
    duration: 200,
    ease: 'Power2',
  });

  scene.time.delayedCall(ANIM.winRoundDisplay, () => {
    scene.tweens.add({
      targets: [winText, bg],
      alpha: 0,
      duration: 200,
      ease: 'Power2',
      onComplete: () => {
        winText.destroy();
        bg.destroy();
        onComplete();
      },
    });
  });
}

/**
 * 播放玩家获胜的完整动画序列
 * @param scene 场景
 * @param result 回合结果
 * @param enemyPortraitX 敌人头像 X（用于伤害气泡箭头和 -1 位置）
 * @param enemyPortraitY 敌人头像 Y
 * @param onComplete 全部完成回调
 * @param enemyHealthBar 敌人血量条（用于实时扣血）
 * @param enemyHPBeforeDamage 伤害前敌人 HP
 * @param enemyMaxHP 敌人最大 HP
 * @param onEachHitVisual 每次 "-1" 触发的视觉反馈（如 BOSS 立绘闪光）
 */
export function playPlayerWinSequence(
  scene: Phaser.Scene,
  result: RoundResult,
  enemyPortraitX: number,
  enemyPortraitY: number,
  onComplete: () => void,
  enemyHealthBar?: HealthBar | null,
  enemyHPBeforeDamage?: number,
  enemyMaxHP?: number,
  onEachHitVisual?: (index: number) => void
): void {
  const cx = WIDTH / 2;
  const cy = HEIGHT / 2 - 60;
  const message = getRoundResultMessage(result);

  const winText = scene.add
    .text(cx, cy, message, {
      fontSize: '16px',
      color: '#ff3333',
      fontFamily: PIXEL_FONT,
    })
    .setOrigin(0.5)
    .setDepth(190)
    .setAlpha(0)
    .setStroke('#ffffff', 1);

  const bg = scene.add.graphics();
  bg.setScrollFactor(0);
  bg.setDepth(189);
  const pad = 20;
  const w = winText.width + pad * 2;
  const h = 50;
  bg.fillStyle(0x000000, 0.9);
  bg.fillRoundedRect(cx - w / 2, cy - h / 2, w, h, 8);

  scene.tweens.add({
    targets: [winText, bg],
    alpha: 1,
    duration: 200,
    ease: 'Power2',
  });

  scene.time.delayedCall(ANIM.winRoundDisplay, () => {
    scene.tweens.add({
      targets: [winText, bg],
      alpha: 0,
      duration: 200,
      ease: 'Power2',
      onComplete: () => {
        winText.destroy();
        bg.destroy();

        const runDamageSequence = () => {
          if (result.damageDealt <= 0) {
            onComplete();
            return;
          }
          showComboPopup(scene, result.comboApplied, () => {
            showDamageBubble(
              scene,
              result.damageDealt,
              enemyPortraitX,
              enemyPortraitY,
              () => {
                playDamageNumberEffect(
                  scene,
                  enemyPortraitX,
                  enemyPortraitY - 30,
                  {
                    value: 1,
                    count: result.damageDealt,
                    screenShake: true,
                    onEachHit:
                      enemyHealthBar && enemyHPBeforeDamage != null && enemyMaxHP != null
                        ? (index) => {
                            enemyHealthBar.setHP(
                              enemyHPBeforeDamage - (index + 1),
                              enemyMaxHP!
                            );
                          }
                        : undefined,
                    onEachHitVisual,
                  },
                  onComplete
                );
              }
            );
          });
        };

        if (
          result.damageDealt > 0 &&
          result.damageCalculation &&
          result.damageCalculation.finalDamage > 0
        ) {
          showDamageCalculationDisplay(
            scene,
            result.damageCalculation,
            runDamageSequence
          );
        } else {
          runDamageSequence();
        }
      },
    });
  });
}

function showComboPopup(
  scene: Phaser.Scene,
  combo: number,
  onComplete: () => void
): void {
  const cx = WIDTH / 2;
  const cy = HEIGHT / 2;

  const comboText = scene.add
    .text(cx, cy, `x${combo}`, {
      fontSize: '28px',
      color: '#ffcc00',
      fontFamily: PIXEL_FONT,
    })
    .setOrigin(0.5)
    .setDepth(185)
    .setAlpha(0)
    .setScale(0.5)
    .setStroke('#ffffff', 1);

  scene.tweens.add({
    targets: comboText,
    alpha: 1,
    scale: 1.2,
    duration: 200,
    ease: 'Back.easeOut',
  });

  scene.time.delayedCall(ANIM.comboDisplay, () => {
    scene.tweens.add({
      targets: comboText,
      alpha: 0,
      scale: 1.5,
      duration: 200,
      ease: 'Power2',
      onComplete: () => {
        comboText.destroy();
        onComplete();
      },
    });
  });
}

/**
 * 播放敌人获胜的动画序列（YOU LOSE / BUST + 伤害 + -1 特效）
 * @param playerHealthBar 玩家血量条（用于实时扣血）
 * @param playerHPBeforeDamage 伤害前玩家 HP
 * @param playerMaxHP 玩家最大 HP
 */
export function playEnemyWinSequence(
  scene: Phaser.Scene,
  result: RoundResult,
  playerPortraitX: number,
  playerPortraitY: number,
  onComplete: () => void,
  playerHealthBar?: HealthBar | null,
  playerHPBeforeDamage?: number,
  playerMaxHP?: number
): void {
  const message = getRoundResultMessage(result);
  const cx = WIDTH / 2;
  const cy = HEIGHT / 2 - 60;

  const showDamageSequence = () => {
    const runDamageSequence = () => {
      if (result.damageDealt <= 0) {
        onComplete();
        return;
      }
      showComboPopup(scene, result.comboApplied, () => {
        showDamageBubble(
          scene,
          result.damageDealt,
          playerPortraitX,
          playerPortraitY,
          () => {
            playDamageNumberEffect(
              scene,
              playerPortraitX,
              playerPortraitY - 30,
              {
                value: 1,
                count: result.damageDealt,
                screenShake: true,
                slashIntensity: 'exaggerated',
                onEachHit:
                  playerHealthBar && playerHPBeforeDamage != null && playerMaxHP != null
                    ? (index) => {
                        playerHealthBar.setHP(
                          playerHPBeforeDamage - (index + 1),
                          playerMaxHP!
                        );
                      }
                    : undefined,
              },
              onComplete
            );
          }
        );
      });
    };

    if (
      result.damageDealt > 0 &&
      result.damageCalculation &&
      result.damageCalculation.finalDamage > 0
    ) {
      showDamageCalculationDisplay(
        scene,
        result.damageCalculation,
        runDamageSequence
      );
    } else {
      runDamageSequence();
    }
  };

  if (message) {
    const winText = scene.add
      .text(cx, cy, message, {
        fontSize: '16px',
        color: '#ff3333',
        fontFamily: PIXEL_FONT,
      })
      .setOrigin(0.5)
      .setDepth(190)
      .setAlpha(0)
      .setStroke('#ffffff', 1);

    const bg = scene.add.graphics();
    bg.setScrollFactor(0);
    bg.setDepth(189);
    const pad = 20;
    const w = winText.width + pad * 2;
    const h = 50;
    bg.fillStyle(0x000000, 0.9);
    bg.fillRoundedRect(cx - w / 2, cy - h / 2, w, h, 8);

    scene.tweens.add({
      targets: [winText, bg],
      alpha: 1,
      duration: 200,
      ease: 'Power2',
    });

    scene.time.delayedCall(ANIM.winRoundDisplay, () => {
      scene.tweens.add({
        targets: [winText, bg],
        alpha: 0,
        duration: 200,
        ease: 'Power2',
        onComplete: () => {
          winText.destroy();
          bg.destroy();
          showDamageSequence();
        },
      });
    });
  } else {
    showDamageSequence();
  }
}
