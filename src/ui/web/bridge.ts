/**
 * BattleController 与 Phaser 的桥接
 */

import type { BattleScene } from './scenes/BattleScene';
import { applyBattleWin } from './data/mapData';
import { BattleController } from '../../game/battleController';
import { createDefaultRNG } from '../../core/rng';
import { getBossIdByNodeId } from '../../core/registries/bosses/nodeMapping';
import { getBoss } from '../../core/registries/bosses';
import '../../core/bosses/scarecrow';
import '../../core/buffs/lazy';
import '../../core/cardStatuses/delete';
import {
  LAZY_DESCRIPTION,
  SCARECROW_SKILL_DESCRIPTION,
} from '../../core/registries/buffs/descriptions';
import {
  WIDTH,
  HEIGHT,
  LAYOUT,
  CARD_WIDTH,
  CARD_HEIGHT,
  SUM_DISPLAY_GAP,
  INITIAL_HP,
  PIXEL_FONT,
  BATTLE_LAYOUT,
  BOSS_LAYOUT,
  BOSS_HAND_TO_DECK_GAP,
  BOSS_DECK_TO_SHOWCASE_GAP,
  BOSS_SHOWCASE_W,
  ANIM,
} from './config';
import { computeOptimalHandSum } from '../../core/card';
import {
  playPlayerWinSequence,
  playEnemyWinSequence,
  playDrawSequence,
} from './components/WinRoundPopup';

const PLAYER_DECK_X = 340;
const PLAYER_DECK_Y = HEIGHT - 120;
const ENEMY_DECK_X = WIDTH - 260;
const ENEMY_DECK_Y = 200;
const DEAL_DELAY = 220;
const CARD_SPACING = 20;

const PLAYER_HAND_CENTER_X = WIDTH / 2;
const PLAYER_HAND_CENTER_Y = HEIGHT - 140;

const BOSS_SHOWCASE_H = 220;
const BOSS_GAP = 16;
const BOSS_TRAIT_ICON_SIZE = 28;
const BOSS_TRAIT_GAP = 8;

function getBossLayoutPositions(cardCount: number): {
  deck: { x: number; y: number };
  showcase: { x: number; y: number };
  bossHealth: { x: number; y: number };
  bossTrait: { x: number; y: number };
  bossStats: { x: number; y: number };
} {
  const handCenterX = BOSS_LAYOUT.enemyHand.x;
  const handCenterY = BOSS_LAYOUT.enemyHand.y;
  const n = Math.max(1, cardCount);
  const halfHandWidth =
    (n * CARD_WIDTH + (n - 1) * CARD_SPACING) / 2;
  const deckCenterX =
    handCenterX +
    halfHandWidth +
    BOSS_HAND_TO_DECK_GAP +
    CARD_WIDTH / 2;
  const deckY = BOSS_LAYOUT.enemyDeck.y;
  const showcaseX =
    deckCenterX +
    CARD_WIDTH / 2 +
    BOSS_DECK_TO_SHOWCASE_GAP +
    BOSS_SHOWCASE_W / 2;
  const showcaseY = BOSS_LAYOUT.bossShowcase.y;

  return {
    deck: { x: deckCenterX, y: deckY },
    showcase: { x: showcaseX, y: showcaseY },
    bossHealth: {
      x: showcaseX - 60,
      y: showcaseY + BOSS_SHOWCASE_H / 2 + BOSS_GAP,
    },
    bossTrait: {
      x: showcaseX + BOSS_SHOWCASE_W / 2 + BOSS_GAP,
      y: showcaseY - BOSS_TRAIT_ICON_SIZE / 2,
    },
    bossStats: {
      x: showcaseX + BOSS_SHOWCASE_W / 2 + BOSS_GAP,
      y: showcaseY + BOSS_TRAIT_ICON_SIZE + BOSS_TRAIT_GAP + 36,
    },
  };
}

function getPlayerSumPosition(cardCount: number): { x: number; y: number } {
  const n = Math.max(1, cardCount);
  const totalWidth = n * CARD_WIDTH + (n - 1) * CARD_SPACING;
  const startX = PLAYER_HAND_CENTER_X - totalWidth / 2 + CARD_WIDTH / 2;
  const rightEdge =
    startX + (n - 1) * (CARD_WIDTH + CARD_SPACING) + CARD_WIDTH / 2;
  return {
    x: rightEdge + SUM_DISPLAY_GAP + CARD_WIDTH / 2,
    y: PLAYER_HAND_CENTER_Y,
  };
}

function getEnemySumPosition(
  cardCount: number,
  handCenterX: number,
  handCenterY: number
): { x: number; y: number } {
  const n = Math.max(1, cardCount);
  const totalWidth = n * CARD_WIDTH + (n - 1) * CARD_SPACING;
  const startX = handCenterX - totalWidth / 2 + CARD_WIDTH / 2;
  const leftEdge = startX - CARD_WIDTH / 2;
  return {
    x: leftEdge - SUM_DISPLAY_GAP - CARD_WIDTH / 2,
    y: handCenterY,
  };
}

function handleBattleEnd(
  scene: BattleScene,
  winner: string,
  mapContext?: { fromMap?: boolean; nodeId?: string }
): void {
  if (
    mapContext?.fromMap &&
    mapContext?.nodeId &&
    winner === 'PLAYER_WIN'
  ) {
    const mapData = scene.registry.get('mapData');
    if (mapData) {
      applyBattleWin(mapData, mapContext.nodeId);
      scene.registry.set('mapData', mapData);
    }
    scene.scene.start('Map');
  } else {
    scene.scene.start('GameOver', { winner });
  }
}

export function connect(
  scene: BattleScene,
  mapContext?: { fromMap?: boolean; nodeId?: string }
): BattleController {
  const bossId = mapContext?.nodeId
    ? getBossIdByNodeId(mapContext.nodeId)
    : undefined;
  const bossConfig = bossId ? getBoss(bossId) : undefined;

  const controller = new BattleController(createDefaultRNG(), { boss: bossConfig });
  controller.startBattle();

  const roundDisplay = scene.getRoundDisplay();
  const playerStats = scene.getPlayerStats();
  const enemyStats = scene.getEnemyStats();
  const playerDebuffIcons = scene.getPlayerDebuffIcons();
  const playerHealth = scene.getPlayerHealth();
  const enemyHealth = scene.getEnemyHealth();
  const playerHand = scene.getPlayerHand();
  const enemyHand = scene.getEnemyHand();
  const playerSumDisplay = scene.getPlayerSumDisplay();
  const enemySumDisplay = scene.getEnemySumDisplay();
  const playerDeck = scene.getPlayerDeck();
  const enemyDeck = scene.getEnemyDeck();
  const drawButton = scene.getDrawButton();
  const endTurnButton = scene.getEndTurnButton();
  const surrenderButton = scene.getSurrenderButton();

  surrenderButton.setOnClick(() => {
    controller.surrender();
    handleBattleEnd(scene, 'ENEMY_WIN', mapContext);
  });

  let lastLazyHintAt = 0;
  const LAZY_HINT_THROTTLE_MS = 600;
  const LAZY_HINT_DURATION_MS = 1500;

  function showLazyHint(): void {
    const now = Date.now();
    if (now - lastLazyHintAt < LAZY_HINT_THROTTLE_MS) return;
    lastLazyHintAt = now;

    const cx = WIDTH / 2;
    const cy = HEIGHT / 2 - 60;
    const message = '怠惰：需抽牌至 11 点以上才能结束回合';

    const hintText = scene.add
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
    const w = hintText.width + pad * 2;
    const h = 50;
    bg.fillStyle(0x000000, 0.9);
    bg.fillRoundedRect(cx - w / 2, cy - h / 2, w, h, 8);

    scene.tweens.add({
      targets: [hintText, bg],
      alpha: 1,
      duration: 200,
      ease: 'Power2',
    });

    scene.time.delayedCall(LAZY_HINT_DURATION_MS, () => {
      scene.tweens.add({
        targets: [hintText, bg],
        alpha: 0,
        duration: 200,
        ease: 'Power2',
        onComplete: () => {
          hintText.destroy();
          bg.destroy();
        },
      });
    });
  }

  function updateFromState(
    skipHands: boolean = false,
    enemyAllRevealed: boolean = false
  ): void {
    const state = controller.getState();
    roundDisplay.setRound(state.roundIndex);
    playerStats.setStats(state.playerAttack, state.playerDefense);
    enemyStats.setStats(state.enemyAttack, state.enemyDefense);
    playerHealth.setHP(state.playerHP, INITIAL_HP);

    const lazyStacks = state.playerBuffs.get('LAZY') ?? 0;
    const debuffDisplays =
      lazyStacks > 0
        ? [
            {
              id: 'LAZY' as const,
              stacks: lazyStacks,
              iconKey: 'debuff_lazy',
              tooltipText: LAZY_DESCRIPTION,
            },
          ]
        : [];
    playerDebuffIcons.setBuffs(debuffDisplays);

    if (bossConfig) {
      scene.getBossInfoPanel().setVisible(false);
      scene.getEnemyPortrait().setVisible(false);

      const bossPos = getBossLayoutPositions(state.enemyHand.getCards().length);
      enemyHand.setPosition(BOSS_LAYOUT.enemyHand.x, BOSS_LAYOUT.enemyHand.y);
      enemyDeck.setPosition(bossPos.deck.x, bossPos.deck.y);

      scene.getBossShowcase().setVisible(true);
      scene.getBossShowcase().setImage(bossConfig.portraitKey ?? '');
      scene.getBossShowcase().setPosition(bossPos.showcase.x, bossPos.showcase.y);
      scene.getEnemyHealth().setVisible(true);
      scene.getEnemyHealth().setPosition(
        bossPos.bossHealth.x,
        bossPos.bossHealth.y
      );
      scene.getEnemyHealth().setHP(state.enemyHP, state.enemyMaxHP);
      scene.getEnemyStats().setVisible(true);
      scene.getEnemyStats().setLightBg(false);
      scene.getEnemyStats().setPosition(
        bossPos.bossStats.x,
        bossPos.bossStats.y
      );
      scene.getEnemyStats().setStats(state.enemyAttack, state.enemyDefense);
      if (bossConfig.onPlayerStand) {
        scene.getBossSkillIcon().setVisible(true);
        scene.getBossSkillIcon().setPosition(
          bossPos.bossTrait.x,
          bossPos.bossTrait.y
        );
        scene.getBossSkillIcon().setSkill(
          'debuff_lazy',
          SCARECROW_SKILL_DESCRIPTION
        );
      } else {
        scene.getBossSkillIcon().setVisible(false);
      }
    } else {
      enemyHand.setPosition(
        BATTLE_LAYOUT.enemyHand.x,
        BATTLE_LAYOUT.enemyHand.y
      );
      enemyDeck.setPosition(
        BATTLE_LAYOUT.enemyDeck.x,
        BATTLE_LAYOUT.enemyDeck.y
      );

      scene.getBossShowcase().setVisible(false);
      scene.getBossInfoPanel().setVisible(false);
      scene.getEnemyPortrait().setVisible(true);
      scene.getEnemyHealth().setVisible(true);
      scene.getEnemyHealth().setPosition(
        BATTLE_LAYOUT.enemyHealth.x,
        BATTLE_LAYOUT.enemyHealth.y
      );
      scene.getEnemyHealth().setHP(state.enemyHP, state.enemyMaxHP);
      scene.getEnemyStats().setVisible(true);
      scene.getEnemyStats().setLightBg(false);
      scene.getEnemyStats().setPosition(WIDTH - 38, 100);
      scene.getEnemyStats().setStats(state.enemyAttack, state.enemyDefense);
      scene.getBossSkillIcon().setVisible(false);
    }
    if (!skipHands) {
      playerHand.setCards(state.playerHand.getCards());
      enemyHand.setCards(state.enemyHand.getCards(), enemyAllRevealed ? 0 : 1);
    }
    playerSumDisplay.setSum(state.playerHand.sum(), state.playerHand.isBust());

    const enemyCards = state.enemyHand.getCards();
    const faceDownCount = enemyAllRevealed ? 0 : 1;
    const hasHiddenCard = enemyCards.length > 0 && faceDownCount > 0;
    const visibleSum = hasHiddenCard
      ? computeOptimalHandSum(enemyCards.slice(faceDownCount))
      : controller.getEnemyDisplaySum();
    enemySumDisplay.setSumWithRange(
      visibleSum,
      hasHiddenCard,
      controller.getEnemyDisplayIsBust()
    );

    const playerCardCount = state.playerHand.getCards().length;
    const enemyCardCount = state.enemyHand.getCards().length;
    const playerPos = getPlayerSumPosition(playerCardCount);
    const enemyHandCenter = bossConfig
      ? BOSS_LAYOUT.enemyHand
      : { x: BATTLE_LAYOUT.enemyHand.x, y: BATTLE_LAYOUT.enemyHand.y };
    const enemyPos = getEnemySumPosition(
      enemyCardCount,
      enemyHandCenter.x,
      enemyHandCenter.y
    );
    playerSumDisplay.setPosition(playerPos.x, playerPos.y);
    enemySumDisplay.setPosition(enemyPos.x, enemyPos.y);

    playerDeck.setCount(state.playerDeck.size);
    enemyDeck.setCount(state.enemyDeck.size);

    const isPlayerTurn = state.phase === 'PLAYER_TURN';
    const canDraw =
      isPlayerTurn &&
      !state.playerHand.isBust() &&
      !state.playerHand.isPerfect();
    const hasLazy = (state.playerBuffs.get('LAZY') ?? 0) > 0;
    const sum = state.playerHand.sum();
    const lazyForcedDraw = hasLazy && sum < 11 && isPlayerTurn;

    drawButton.setEnabled(canDraw && !drawFlowRunning && !dealAnimationRunning);

    if (lazyForcedDraw) {
      endTurnButton.setLabel('END TURN');
      endTurnButton.setEnabled(false);
      endTurnButton.setOnDisabledClick(() => showLazyHint());
      endTurnButton.setOnClick(() => {});
    } else {
      endTurnButton.setLabel('END TURN');
      endTurnButton.setEnabled(isPlayerTurn);
      endTurnButton.setOnDisabledClick(undefined);
      endTurnButton.setOnClick(() => {
        controller.playerAction('STAND');
        updateFromState();
        scene.time.delayedCall(500, advance);
      });
    }
  }

  let drawFlowRunning = false;
  let dealAnimationRunning = false;
  function runDrawFlow(): void {
    if (drawFlowRunning) return;
    drawFlowRunning = true;
    drawButton.setEnabled(false);
    controller.playerAction('HIT');
    const state = controller.getState();
    const cards = state.playerHand.getCards();
    playerHand.clear();
    cards.slice(0, -1).forEach((c) => playerHand.addCard(c));
    const lastCard = cards[cards.length - 1];

    const finishDrawFlow = () => {
      drawFlowRunning = false;
      updateFromState();
      if (controller.getState().phase === 'ENEMY_TURN') {
        scene.time.delayedCall(500, advance);
      }
    };

    if (lastCard) {
      let drawFlowDone = false;
      const safeFinish = () => {
        if (drawFlowDone) return;
        drawFlowDone = true;
        finishDrawFlow();
      };
      scene.time.delayedCall(1200, safeFinish);
      // 独立于 Phaser 的后备：当 Phaser 的 delayedCall/tween 未触发时仍能恢复
      setTimeout(safeFinish, 1500);
      playerHand.addCardWithDealAnimation(
        lastCard,
        PLAYER_DECK_X,
        PLAYER_DECK_Y,
        true,
        0,
        {
          onComplete: safeFinish,
          onLayoutStart: (cardCount) => {
            const pos = getPlayerSumPosition(cardCount);
            playerSumDisplay.setPositionAnimated(
              pos.x,
              pos.y,
              ANIM.layoutSpreadDuration
            );
          },
        }
      );
    } else {
      finishDrawFlow();
    }
  }

  function runEarlyPerfectResolution(): void {
    const result = controller.resolveRound();
    if (!result) return;

    const finishRound = () => {
      controller.applyRoundResult(result);
      updateFromState();
      if (controller.isBattleEnd()) {
        const s = controller.getState();
        handleBattleEnd(scene, s.battleEndReason!, mapContext);
      } else {
        scene.time.delayedCall(600, advance);
      }
    };

    const playResult = () => {
      const state = controller.getState();
      const damageTargetPos = bossConfig
        ? getBossLayoutPositions(state.enemyHand.getCards().length).showcase
        : { x: LAYOUT.enemyPortraitX, y: LAYOUT.enemyPortraitY };
      if (result.outcome === 'PLAYER_WIN') {
        playPlayerWinSequence(
          scene,
          result,
          damageTargetPos.x,
          damageTargetPos.y,
          finishRound,
          enemyHealth,
          state.enemyHP,
          state.enemyMaxHP,
          bossConfig ? (index) => scene.getBossShowcase().playHitFlash() : undefined
        );
      } else if (result.outcome === 'ENEMY_WIN') {
        playEnemyWinSequence(
          scene,
          result,
          LAYOUT.playerPortraitX,
          LAYOUT.playerPortraitY,
          finishRound,
          playerHealth,
          state.playerHP,
          INITIAL_HP
        );
      } else {
        playDrawSequence(scene, finishRound, result);
      }
    };

    if (result.enemyPerfect) {
      enemyHand.flipCardAtIndex(0, () => {
        updateFromState(true, true);
        scene.time.delayedCall(300, playResult);
      });
    } else {
      playResult();
    }
  }

  function runDealAnimation(done: () => void): void {
    dealAnimationRunning = true;
    drawButton.setEnabled(false);
    const state = controller.getState();
    const playerCards = state.playerHand.getCards();
    const enemyCards = state.enemyHand.getCards();
    const enemyDeckPos = bossConfig
      ? getBossLayoutPositions(enemyCards.length).deck
      : { x: ENEMY_DECK_X, y: ENEMY_DECK_Y };

    playerHand.clear();
    enemyHand.clear();
    updateFromState(true);

    const enemyHandCenter = bossConfig
      ? BOSS_LAYOUT.enemyHand
      : { x: BATTLE_LAYOUT.enemyHand.x, y: BATTLE_LAYOUT.enemyHand.y };
    const pos1 = getPlayerSumPosition(1);
    const enemyPos1 = getEnemySumPosition(1, enemyHandCenter.x, enemyHandCenter.y);
    playerSumDisplay.setPosition(pos1.x, pos1.y);
    enemySumDisplay.setPosition(enemyPos1.x, enemyPos1.y);

    let pending = 4;
    const checkDone = () => {
      pending--;
      if (pending <= 0) {
        dealAnimationRunning = false;
        done();
      }
    };

    playerHand.addCardWithDealAnimation(
      playerCards[0],
      PLAYER_DECK_X,
      PLAYER_DECK_Y,
      true,
      0,
      {
        onComplete: checkDone,
        onLayoutStart: (cardCount) => {
          const pos = getPlayerSumPosition(cardCount);
          playerSumDisplay.setPositionAnimated(
            pos.x,
            pos.y,
            ANIM.layoutSpreadDuration
          );
        },
      }
    );
    playerHand.addCardWithDealAnimation(
      playerCards[1],
      PLAYER_DECK_X,
      PLAYER_DECK_Y,
      true,
      DEAL_DELAY,
      {
        onComplete: checkDone,
        onLayoutStart: (cardCount) => {
          const pos = getPlayerSumPosition(cardCount);
          playerSumDisplay.setPositionAnimated(
            pos.x,
            pos.y,
            ANIM.layoutSpreadDuration
          );
        },
      }
    );
    enemyHand.addCardWithDealAnimation(
      enemyCards[0],
      enemyDeckPos.x,
      enemyDeckPos.y,
      false,
      0,
      {
        onComplete: checkDone,
        onLayoutStart: (cardCount) => {
          const pos = getEnemySumPosition(
            cardCount,
            enemyHandCenter.x,
            enemyHandCenter.y
          );
          enemySumDisplay.setPositionAnimated(
            pos.x,
            pos.y,
            ANIM.layoutSpreadDuration
          );
        },
      }
    );
    enemyHand.addCardWithDealAnimation(
      enemyCards[1],
      enemyDeckPos.x,
      enemyDeckPos.y,
      true,
      DEAL_DELAY,
      {
        onComplete: checkDone,
        onLayoutStart: (cardCount) => {
          const pos = getEnemySumPosition(
            cardCount,
            enemyHandCenter.x,
            enemyHandCenter.y
          );
          enemySumDisplay.setPositionAnimated(
            pos.x,
            pos.y,
            ANIM.layoutSpreadDuration
          );
        },
      }
    );
  }

  function advance(): void {
    const state = controller.getState();
    if (state.phase === 'BATTLE_END') {
      handleBattleEnd(scene, state.battleEndReason!, mapContext);
      return;
    }
    if (state.phase === 'ROUND_START') {
      const nextRound = state.roundIndex + 1;
      roundDisplay.showFullScreenRound(nextRound, () => {
        controller.startRound();
        runDealAnimation(() => {
          updateFromState();
          const nextState = controller.getState();
          if (nextState.phase === 'ROUND_RESOLVE') {
            runEarlyPerfectResolution();
          }
        });
      });
      return;
    }
    if (state.phase === 'ENEMY_TURN') {
      scene.time.delayedCall(800, () => {
        controller.enemyTurn();
        const result = controller.resolveRound();
        if (!result) return;

        updateFromState();

        const finishRound = () => {
          controller.applyRoundResult(result);
          updateFromState();
          if (controller.isBattleEnd()) {
            const s = controller.getState();
            handleBattleEnd(scene, s.battleEndReason!, mapContext);
          } else {
            scene.time.delayedCall(600, advance);
          }
        };

        const playResultSequence = () => {
          const state = controller.getState();
          const damageTargetPos = bossConfig
            ? getBossLayoutPositions(state.enemyHand.getCards().length).showcase
            : { x: LAYOUT.enemyPortraitX, y: LAYOUT.enemyPortraitY };
          if (result.outcome === 'PLAYER_WIN') {
            playPlayerWinSequence(
              scene,
              result,
              damageTargetPos.x,
              damageTargetPos.y,
              finishRound,
              enemyHealth,
              state.enemyHP,
              state.enemyMaxHP
            );
          } else if (result.outcome === 'ENEMY_WIN') {
            playEnemyWinSequence(
              scene,
              result,
              LAYOUT.playerPortraitX,
              LAYOUT.playerPortraitY,
              finishRound,
              playerHealth,
              state.playerHP,
              INITIAL_HP
            );
          } else {
            playDrawSequence(scene, finishRound, result);
          }
        };

        enemyHand.flipCardAtIndex(0, () => {
          updateFromState(true, true);
          scene.time.delayedCall(300, playResultSequence);
        });
      });
    }
  }

  drawButton.setOnClick(() => {
    if (drawFlowRunning || dealAnimationRunning) return;
    drawButton.setEnabled(false);
    runDrawFlow();
  });

  updateFromState();
  advance();
  return controller;
}
