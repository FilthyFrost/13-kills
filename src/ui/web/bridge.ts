/**
 * BattleController 与 Phaser 的桥接
 */

import type { BattleScene } from './scenes/BattleScene';
import { BattleController } from '../../game/battleController';
import {
  WIDTH,
  HEIGHT,
  LAYOUT,
  CARD_WIDTH,
  CARD_HEIGHT,
  SUM_DISPLAY_GAP,
  INITIAL_HP,
} from './config';
import { computeOptimalHandSum } from '../../core/card';
import {
  playPlayerWinSequence,
  playEnemyWinSequence,
  playDrawSequence,
} from './components/WinRoundPopup';

const PLAYER_DECK_X = 260;
const PLAYER_DECK_Y = HEIGHT - 120;
const ENEMY_DECK_X = WIDTH - 260;
const ENEMY_DECK_Y = 200;
const DEAL_DELAY = 220;
const CARD_SPACING = 20;

const PLAYER_HAND_CENTER_X = WIDTH / 2;
const PLAYER_HAND_CENTER_Y = HEIGHT - 140;
const ENEMY_HAND_CENTER_X = WIDTH / 2;
const ENEMY_HAND_CENTER_Y = 200;

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

function getEnemySumPosition(cardCount: number): { x: number; y: number } {
  const n = Math.max(1, cardCount);
  const totalWidth = n * CARD_WIDTH + (n - 1) * CARD_SPACING;
  const startX = ENEMY_HAND_CENTER_X - totalWidth / 2 + CARD_WIDTH / 2;
  const leftEdge = startX - CARD_WIDTH / 2;
  return {
    x: leftEdge - SUM_DISPLAY_GAP - CARD_WIDTH / 2,
    y: ENEMY_HAND_CENTER_Y,
  };
}

export function connect(scene: BattleScene): BattleController {
  const controller = new BattleController();
  controller.startBattle();

  const roundDisplay = scene.getRoundDisplay();
  const playerStats = scene.getPlayerStats();
  const enemyStats = scene.getEnemyStats();
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
    scene.scene.start('GameOver', { winner: 'ENEMY_WIN' });
  });

  function updateFromState(
    skipHands: boolean = false,
    enemyAllRevealed: boolean = false
  ): void {
    const state = controller.getState();
    roundDisplay.setRound(state.roundIndex);
    playerStats.setStats(state.playerAttack, state.playerDefense);
    enemyStats.setStats(state.enemyAttack, state.enemyDefense);
    playerHealth.setHP(state.playerHP, INITIAL_HP);
    enemyHealth.setHP(state.enemyHP, INITIAL_HP);
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
      : state.enemyHand.sum();
    enemySumDisplay.setSumWithRange(
      visibleSum,
      hasHiddenCard,
      state.enemyHand.isBust()
    );

    const playerCardCount = state.playerHand.getCards().length;
    const enemyCardCount = state.enemyHand.getCards().length;
    const playerPos = getPlayerSumPosition(playerCardCount);
    const enemyPos = getEnemySumPosition(enemyCardCount);
    playerSumDisplay.setPosition(playerPos.x, playerPos.y);
    enemySumDisplay.setPosition(enemyPos.x, enemyPos.y);

    playerDeck.setCount(state.playerDeck.size);
    enemyDeck.setCount(state.enemyDeck.size);

    const isPlayerTurn = state.phase === 'PLAYER_TURN';
    const canDraw =
      isPlayerTurn &&
      !state.playerHand.isBust() &&
      !state.playerHand.isPerfect();
    drawButton.setEnabled(canDraw);
    endTurnButton.setEnabled(isPlayerTurn);
  }

  function runEarlyPerfectResolution(): void {
    const result = controller.resolveRound();
    if (!result) return;

    const finishRound = () => {
      controller.applyRoundResult(result);
      updateFromState();
      if (controller.isBattleEnd()) {
        const s = controller.getState();
        scene.scene.start('GameOver', { winner: s.battleEndReason });
      } else {
        scene.time.delayedCall(600, advance);
      }
    };

    const playResult = () => {
      if (result.outcome === 'PLAYER_WIN' && result.damageDealt > 0) {
        playPlayerWinSequence(
          scene,
          result,
          LAYOUT.enemyPortraitX,
          LAYOUT.enemyPortraitY,
          finishRound
        );
      } else if (result.outcome === 'ENEMY_WIN' && result.damageDealt > 0) {
        playEnemyWinSequence(
          scene,
          result,
          LAYOUT.playerPortraitX,
          LAYOUT.playerPortraitY,
          finishRound
        );
      } else {
        playDrawSequence(scene, finishRound);
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
    const state = controller.getState();
    const playerCards = state.playerHand.getCards();
    const enemyCards = state.enemyHand.getCards();

    playerHand.clear();
    enemyHand.clear();
    updateFromState(true);

    let pending = 4;
    const checkDone = () => {
      pending--;
      if (pending <= 0) done();
    };

    playerHand.addCardWithDealAnimation(
      playerCards[0],
      PLAYER_DECK_X,
      PLAYER_DECK_Y,
      true,
      0,
      checkDone
    );
    playerHand.addCardWithDealAnimation(
      playerCards[1],
      PLAYER_DECK_X,
      PLAYER_DECK_Y,
      true,
      DEAL_DELAY,
      checkDone
    );
    enemyHand.addCardWithDealAnimation(
      enemyCards[0],
      ENEMY_DECK_X,
      ENEMY_DECK_Y,
      false,
      0,
      checkDone
    );
    enemyHand.addCardWithDealAnimation(
      enemyCards[1],
      ENEMY_DECK_X,
      ENEMY_DECK_Y,
      true,
      DEAL_DELAY,
      checkDone
    );
  }

  function advance(): void {
    const state = controller.getState();
    if (state.phase === 'BATTLE_END') {
      scene.scene.start('GameOver', { winner: state.battleEndReason });
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
            scene.scene.start('GameOver', { winner: s.battleEndReason });
          } else {
            scene.time.delayedCall(600, advance);
          }
        };

        const playResultSequence = () => {
          if (result.outcome === 'PLAYER_WIN' && result.damageDealt > 0) {
            playPlayerWinSequence(
              scene,
              result,
              LAYOUT.enemyPortraitX,
              LAYOUT.enemyPortraitY,
              finishRound
            );
          } else if (result.outcome === 'ENEMY_WIN' && result.damageDealt > 0) {
            playEnemyWinSequence(
              scene,
              result,
              LAYOUT.playerPortraitX,
              LAYOUT.playerPortraitY,
              finishRound
            );
          } else {
            playDrawSequence(scene, finishRound);
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
    drawButton.setEnabled(false);
    controller.playerAction('HIT');
    const state = controller.getState();
    const cards = state.playerHand.getCards();
    playerHand.clear();
    cards.slice(0, -1).forEach((c) => playerHand.addCard(c));
    const lastCard = cards[cards.length - 1];

    const finishDrawFlow = () => {
      updateFromState();
      if (controller.getState().phase === 'ENEMY_TURN') {
        scene.time.delayedCall(500, advance);
      }
    };

    if (lastCard) {
      let drawFlowDone = false;
      let fallbackTimer: Phaser.Time.TimerEvent | null = null;
      const safeFinish = () => {
        if (drawFlowDone) return;
        drawFlowDone = true;
        if (fallbackTimer) scene.time.removeEvent(fallbackTimer);
        finishDrawFlow();
      };
      fallbackTimer = scene.time.delayedCall(1200, safeFinish);
      playerHand.addCardWithDealAnimation(
        lastCard,
        PLAYER_DECK_X,
        PLAYER_DECK_Y,
        true,
        0,
        safeFinish
      );
    } else {
      finishDrawFlow();
    }
  });

  endTurnButton.setOnClick(() => {
    controller.playerAction('STAND');
    updateFromState();
    scene.time.delayedCall(500, advance);
  });

  advance();
  return controller;
}
