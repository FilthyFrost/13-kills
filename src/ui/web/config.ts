/**
 * 画布尺寸、主题色、常量
 */

export const WIDTH = 1280;
export const HEIGHT = 720;
export const CARD_RATIO = 5 / 7;
export const CARD_WIDTH = 80;
export const CARD_HEIGHT = CARD_WIDTH / CARD_RATIO;

export const COLORS = {
  bgDark: 0x1a1a1a,
  bgMid: 0x2a2a2a,
  bgLight: 0x3a3a3a,
  accent: 0x8b0000,
  text: 0xeeeeee,
  textDim: 0x888888,
  damageRed: 0xff3333,
};

export {
  INITIAL_HP,
  BASE_ATTACK,
  BASE_DEFENSE,
} from '../../core/constants';

/** 游戏 UI 字体（高清矢量，商用） */
export const PIXEL_FONT = 'Orbitron';

/** 属性面板像素字体（数字与图标） */
export const PIXEL_STATS_FONT = 'Press Start 2P';

/** 动画时长（毫秒） */
export const ANIM = {
  winRoundDisplay: 800,
  damageBubble: 600,
  comboDisplay: 600,
  damageNumberDuration: 700,
  damageNumberInterval: 100,
  screenShakeDuration: 150,
  screenShakeIntensity: 0.025,
};

/** 点数显示器与卡牌的间距 */
export const SUM_DISPLAY_GAP = 16;

/** 布局：头像中心坐标（用于伤害特效定位） */
export const LAYOUT = {
  playerPortraitX: 130,
  playerPortraitY: HEIGHT - 100,
  enemyPortraitX: WIDTH - 130,
  enemyPortraitY: 100,
};
