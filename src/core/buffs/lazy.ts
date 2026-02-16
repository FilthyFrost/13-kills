/**
 * 怠惰 DEBUFF - 新回合 Stand 需 >= 11 点，否则强制抽牌；本回合结束清除
 */

import { registerBuff } from '../registries/buffs';

registerBuff({
  id: 'LAZY',
  iconKey: 'debuff_lazy',
  duration: -1, // 本回合结束清除
});
