/**
 * 主战斗场景
 */

import Phaser from 'phaser';
import { WIDTH, HEIGHT } from '../config';
import { BackgroundLayer } from '../components/BackgroundLayer';
import { RoundDisplay } from '../components/RoundDisplay';
import { HealthBar } from '../components/HealthBar';
import { PortraitFrame } from '../components/PortraitFrame';
import { CardHand } from '../components/CardHand';
import { HandSumDisplay } from '../components/HandSumDisplay';
import { DeckPile } from '../components/DeckPile';
import { DrawButton } from '../components/DrawButton';
import { EndTurnButton } from '../components/EndTurnButton';
import { SpeedPanel } from '../components/SpeedPanel';
import { SurrenderButton } from '../components/SurrenderButton';
import { StatsPanel } from '../components/StatsPanel';
import { connect } from '../bridge';

export class BattleScene extends Phaser.Scene {
  private background!: BackgroundLayer;
  private roundDisplay!: RoundDisplay;
  private playerPortrait!: PortraitFrame;
  private enemyPortrait!: PortraitFrame;
  private playerStats!: StatsPanel;
  private enemyStats!: StatsPanel;
  private playerHealth!: HealthBar;
  private enemyHealth!: HealthBar;
  private playerHand!: CardHand;
  private playerSumDisplay!: HandSumDisplay;
  private enemyHand!: CardHand;
  private enemySumDisplay!: HandSumDisplay;
  private playerDeck!: DeckPile;
  private enemyDeck!: DeckPile;
  private drawButton!: DrawButton;
  private endTurnButton!: EndTurnButton;
  private speedPanel!: SpeedPanel;
  private surrenderButton!: SurrenderButton;

  constructor() {
    super({ key: 'Battle' });
  }

  create(): void {
    this.background = new BackgroundLayer(this);
    this.roundDisplay = new RoundDisplay(this, WIDTH / 2, 50);
    this.speedPanel = new SpeedPanel(this, 100, 50);
    this.surrenderButton = new SurrenderButton(this, 100, 112);

    // 玩家区域（左下）：StatsPanel 在头像左侧，与头像、牌堆拉开间距
    this.playerStats = new StatsPanel(this, 38, HEIGHT - 100, false);
    this.playerPortrait = new PortraitFrame(this, 130, HEIGHT - 100, 80);
    this.playerHealth = new HealthBar(this, 90, HEIGHT - 50, 120, 16);
    this.playerHand = new CardHand(this, WIDTH / 2, HEIGHT - 140);
    this.playerSumDisplay = new HandSumDisplay(
      this,
      WIDTH / 2 + 120,
      HEIGHT - 140,
      'right'
    );
    this.playerDeck = new DeckPile(this, 260, HEIGHT - 120);

    // 敌人区域（右上）：StatsPanel 在头像右侧，镜像
    this.enemyPortrait = new PortraitFrame(this, WIDTH - 130, 100, 80);
    this.enemyStats = new StatsPanel(this, WIDTH - 38, 100, true);
    this.enemyHealth = new HealthBar(this, WIDTH - 210, 140, 120, 16);
    this.enemyHand = new CardHand(this, WIDTH / 2, 200);
    this.enemySumDisplay = new HandSumDisplay(
      this,
      WIDTH / 2 - 120,
      200,
      'left'
    );
    this.enemyDeck = new DeckPile(this, WIDTH - 260, 200);

    // 按钮（右下）
    this.drawButton = new DrawButton(this, WIDTH - 280, HEIGHT - 80);
    this.endTurnButton = new EndTurnButton(this, WIDTH - 120, HEIGHT - 80);

    connect(this);
  }

  getRoundDisplay(): RoundDisplay {
    return this.roundDisplay;
  }
  getPlayerStats(): StatsPanel {
    return this.playerStats;
  }
  getEnemyStats(): StatsPanel {
    return this.enemyStats;
  }
  getPlayerHealth(): HealthBar {
    return this.playerHealth;
  }
  getEnemyHealth(): HealthBar {
    return this.enemyHealth;
  }
  getPlayerHand(): CardHand {
    return this.playerHand;
  }
  getEnemyHand(): CardHand {
    return this.enemyHand;
  }
  getPlayerSumDisplay(): HandSumDisplay {
    return this.playerSumDisplay;
  }
  getEnemySumDisplay(): HandSumDisplay {
    return this.enemySumDisplay;
  }
  getPlayerDeck(): DeckPile {
    return this.playerDeck;
  }
  getEnemyDeck(): DeckPile {
    return this.enemyDeck;
  }
  getDrawButton(): DrawButton {
    return this.drawButton;
  }
  getEndTurnButton(): EndTurnButton {
    return this.endTurnButton;
  }
  getSurrenderButton(): SurrenderButton {
    return this.surrenderButton;
  }

  shutdown(): void {
    this.background?.destroy();
    this.roundDisplay?.destroy();
    this.playerPortrait?.destroy();
    this.enemyPortrait?.destroy();
    this.playerStats?.destroy();
    this.enemyStats?.destroy();
    this.playerHealth?.destroy();
    this.enemyHealth?.destroy();
    this.playerHand?.destroy();
    this.playerSumDisplay?.destroy();
    this.enemyHand?.destroy();
    this.enemySumDisplay?.destroy();
    this.playerDeck?.destroy();
    this.enemyDeck?.destroy();
    this.drawButton?.destroy();
    this.endTurnButton?.destroy();
    this.speedPanel?.destroy();
    this.surrenderButton?.destroy();
  }
}
