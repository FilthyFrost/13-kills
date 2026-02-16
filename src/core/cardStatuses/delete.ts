/**
 * 删除 Card Status - 能力发动后从牌堆删除，本局不再出现
 */

import { registerCardStatus } from '../registries/cardStatuses';

registerCardStatus({
  id: 'DELETE',
  iconKey: 'cardstatus_delete',
});
