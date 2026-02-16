/**
 * 稻草人 BOSS 配置 - 地图节点 boss_d1 对应此 BOSS
 */

import { registerBoss } from '../registries/bosses';
import { createScarecrowDeck } from '../deck';
import { computeOptimalHandSum } from '../card';
import { ScarecrowAI } from '../ai/scarecrowAI';

registerBoss({
  id: 'SCARECROW',
  hp: 30,
  attack: 3,
  defense: 0,
  deckFactory: createScarecrowDeck,
  portraitKey: 'boss_scarecrow',
  displayName: '稻草人',
  aiDecide: (ctx) => ScarecrowAI.decide(ctx),
  onPlayerStand: (playerHandCards) => {
    const sum = computeOptimalHandSum(playerHandCards);
    if (playerHandCards.length === 2 && sum <= 9) {
      return { addDebuff: 'LAZY' };
    }
  },
});
