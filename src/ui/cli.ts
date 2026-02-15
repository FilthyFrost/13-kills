/**
 * ui/cli.ts
 * 最小 CLI 入口，仅调用 controller 并打印日志
 * 不包含任何规则判断
 */

import * as readline from 'readline';
import { BattleController } from '../game/battleController';
import { EnemyAI } from '../core/ai';
import type { RoundResult } from '../core/types';

function formatCards(cards: readonly { rank: string }[]): string {
  return cards.map((c) => c.rank).join(',');
}

function logRound(
  roundIndex: number,
  playerCards: string,
  playerSum: number,
  playerBust: boolean,
  playerPerfect: boolean,
  enemyCards: string,
  enemySum: number,
  enemyBust: boolean,
  enemyPerfect: boolean,
  result: RoundResult,
  playerHP: number,
  enemyHP: number
): void {
  console.log(JSON.stringify({
    roundIndex,
    playerCards,
    playerSum,
    playerBust,
    playerPerfect,
    enemyCards,
    enemySum,
    enemyBust,
    enemyPerfect,
    outcome: result.outcome,
    comboApplied: result.comboApplied,
    damageDealt: result.damageDealt,
    playerHP,
    enemyHP,
  }));
}

function runAutoSimulation(maxRounds: number = 50): void {
  const controller = new BattleController();
  controller.startBattle();

  while (!controller.isBattleEnd()) {
    const state = controller.getState();
    if (state.phase === 'ROUND_START') {
      controller.startRound();
      continue;
    }
    if (state.phase === 'PLAYER_TURN') {
      const action = EnemyAI.decide(state.playerHand);
      controller.playerAction(action);
      continue;
    }
    if (state.phase === 'ENEMY_TURN') {
      controller.enemyTurn();
      continue;
    }
    if (state.phase === 'ROUND_RESOLVE') {
      const playerCards = formatCards(state.playerHand.getCards());
      const enemyCards = formatCards(state.enemyHand.getCards());
      const playerSum = state.playerHand.sum();
      const enemySum = state.enemyHand.sum();
      const playerBust = state.playerHand.isBust();
      const enemyBust = state.enemyHand.isBust();
      const playerPerfect = state.playerHand.isPerfect();
      const enemyPerfect = state.enemyHand.isPerfect();

      const result = controller.resolveRound();
      if (result) {
        const nextState = controller.getState();
        logRound(
          state.roundIndex,
          playerCards,
          playerSum,
          playerBust,
          playerPerfect,
          enemyCards,
          enemySum,
          enemyBust,
          enemyPerfect,
          result,
          nextState.playerHP,
          nextState.enemyHP
        );
      }
    }
  }

  const final = controller.getState();
  console.log('--- BATTLE END ---');
  console.log(JSON.stringify({ battleEndReason: final.battleEndReason }));
}

function runInteractive(): void {
  const controller = new BattleController();
  controller.startBattle();
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  function prompt(): void {
    if (controller.isBattleEnd()) {
      const final = controller.getState();
      console.log('--- BATTLE END ---');
      console.log(JSON.stringify({ battleEndReason: final.battleEndReason }));
      rl.close();
      return;
    }

    const state = controller.getState();
    if (state.phase === 'ROUND_START') {
      controller.startRound();
      console.log(`[Round ${controller.getState().roundIndex}] 双方各抽 2 张`);
      prompt();
      return;
    }
    if (state.phase === 'PLAYER_TURN') {
      const cards = formatCards(state.playerHand.getCards());
      const sum = state.playerHand.sum();
      console.log(`[玩家] 手牌: ${cards}, 点数: ${sum}`);
      rl.question('Hit (h) 或 Stand (s)? ', (answer: string) => {
        const action = answer.trim().toLowerCase().startsWith('h') ? 'HIT' : 'STAND';
        controller.playerAction(action);
        const next = controller.getState();
        if (action === 'HIT') {
          console.log(`  抽到: ${formatCards(next.playerHand.getCards().slice(-1))}, 新点数: ${next.playerHand.sum()}`);
          if (next.phase === 'ENEMY_TURN') {
            console.log('  [BUST!] 点数超过 13，玩家回合自动结束');
          }
        }
        prompt();
      });
      return;
    }
    if (state.phase === 'ENEMY_TURN') {
      controller.enemyTurn();
      const next = controller.getState();
      console.log(`[敌人] 手牌: ${formatCards(next.enemyHand.getCards())}, 点数: ${next.enemyHand.sum()}`);
      prompt();
      return;
    }
    if (state.phase === 'ROUND_RESOLVE') {
      const playerCards = formatCards(state.playerHand.getCards());
      const enemyCards = formatCards(state.enemyHand.getCards());
      const result = controller.resolveRound();
      if (result) {
        const nextState = controller.getState();
        logRound(
          state.roundIndex,
          playerCards,
          state.playerHand.sum(),
          state.playerHand.isBust(),
          state.playerHand.isPerfect(),
          enemyCards,
          state.enemyHand.sum(),
          state.enemyHand.isBust(),
          state.enemyHand.isPerfect(),
          result,
          nextState.playerHP,
          nextState.enemyHP
        );
      }
      prompt();
    }
  }

  prompt();
}

const args = process.argv.slice(2);
if (args.includes('--auto')) {
  runAutoSimulation();
} else {
  runInteractive();
}
