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
  damageNumberInterval: 90,
  screenShakeDuration: 150,
  screenShakeIntensity: 0.025,
  layoutSpreadDuration: 220,
  layoutSpreadEase: 'Cubic.easeOut',
  dealArcHeight: 80,
  dealScaleFrom: 0.75,
  dealDuration: 380,
  dealOvershoot: 2.5,
  layoutStaggerDelay: 40,
  screenShakeBaseDuration: 120,
  screenShakeBaseIntensity: 0.02,
  screenShakeScalePerHit: 0.12,
  pendulumAngle: 2,
  pendulumDuration: 3000,
  /** 卡牌摇摆周期（1.5x 提速，其他组件仍用 pendulumDuration） */
  pendulumCardDuration: 2000,
  iconBounceOffset: 2,
  iconBounceDuration: 1200,
  slashScaleBase: 5,
  slashScalePerHit: 0.7,
  slashScaleMax: 15,
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

/** 战斗场景集中式布局配置 */
export const BATTLE_LAYOUT = {
  playerStats: { x: 38, y: HEIGHT - 100 },
  playerDebuff: { x: 38, y: HEIGHT - 150 },
  playerPortrait: { x: 130, y: HEIGHT - 100 },
  playerHealth: { x: 70, y: HEIGHT - 32 },
  playerDeck: { x: 340, y: HEIGHT - 120 },
  playerHand: { x: WIDTH / 2, y: HEIGHT - 140 },
  enemyDeck: { x: WIDTH - 260, y: 200 },
  enemyHand: { x: WIDTH / 2, y: 200 },
  enemyHealth: { x: WIDTH - 210, y: 140 },
  bossInfoPanel: { x: WIDTH - 100, y: 90 },
} as const;

/** BOSS 卡牌与卡堆最小间距 */
export const BOSS_HAND_TO_DECK_GAP = 28;
/** BOSS 卡堆与 BOSS 立绘最小间距 */
export const BOSS_DECK_TO_SHOWCASE_GAP = 24;

/** BOSS 区域布局（卡牌与玩家对齐，卡牌 → 牌堆右下方 → BOSS 右下方） */
const BOSS_CENTER_X = 980;
const BOSS_CENTER_Y = 300;
export const BOSS_SHOWCASE_W = 180;
const BOSS_SHOWCASE_H = 220;
const BOSS_GAP = 16;
const BOSS_TRAIT_ICON_SIZE = 28;
const BOSS_TRAIT_GAP = 8;

export const BOSS_LAYOUT = {
  enemyHand: { x: 640, y: 200 },
  enemyDeck: { x: 820, y: 235 },
  bossShowcase: { x: BOSS_CENTER_X, y: BOSS_CENTER_Y },
  bossHealth: {
    x: BOSS_CENTER_X - 60,
    y: BOSS_CENTER_Y + BOSS_SHOWCASE_H / 2 + BOSS_GAP,
  },
  bossTrait: {
    x: BOSS_CENTER_X + BOSS_SHOWCASE_W / 2 + BOSS_GAP,
    y: BOSS_CENTER_Y - BOSS_TRAIT_ICON_SIZE / 2,
  },
  bossStats: {
    x: BOSS_CENTER_X + BOSS_SHOWCASE_W / 2 + BOSS_GAP,
    y: BOSS_CENTER_Y + BOSS_TRAIT_ICON_SIZE + BOSS_TRAIT_GAP + 36,
  },
} as const;
