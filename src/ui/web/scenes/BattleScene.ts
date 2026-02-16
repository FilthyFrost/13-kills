/**
 * 主战斗场景
 */

import Phaser from 'phaser';
import { WIDTH, HEIGHT, BATTLE_LAYOUT, BOSS_LAYOUT } from '../config';
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
import { DebuffIcons } from '../components/DebuffIcons';
import { BossSkillIcon } from '../components/BossSkillIcon';
import { BossShowcase } from '../components/BossShowcase';
import { BossInfoPanel } from '../components/BossInfoPanel';
import { connect } from '../bridge';

export class BattleScene extends Phaser.Scene {
  private background!: BackgroundLayer;
  private roundDisplay!: RoundDisplay;
  private playerPortrait!: PortraitFrame;
  private enemyPortrait!: PortraitFrame;
  private playerStats!: StatsPanel;
  private enemyStats!: StatsPanel;
  private playerDebuffIcons!: DebuffIcons;
  private bossSkillIcon!: BossSkillIcon;
  private bossShowcase!: BossShowcase;
  private bossInfoPanel!: BossInfoPanel;
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

    // 玩家区域（左下）：使用 BATTLE_LAYOUT
    const pl = BATTLE_LAYOUT;
    this.playerStats = new StatsPanel(this, pl.playerStats.x, pl.playerStats.y, false);
    this.playerDebuffIcons = new DebuffIcons(this, pl.playerDebuff.x, pl.playerDebuff.y);
    this.playerPortrait = new PortraitFrame(this, pl.playerPortrait.x, pl.playerPortrait.y, 120);
    this.playerHealth = new HealthBar(this, pl.playerHealth.x, pl.playerHealth.y, 120, 16);
    this.playerHand = new CardHand(this, pl.playerHand.x, pl.playerHand.y);
    this.playerSumDisplay = new HandSumDisplay(
      this,
      pl.playerHand.x + 120,
      pl.playerHand.y,
      'right'
    );
    this.playerDeck = new DeckPile(this, pl.playerDeck.x, pl.playerDeck.y);

    // 敌人区域（右上）：普通敌用 BATTLE_LAYOUT，BOSS 用 BOSS_LAYOUT
    const bl = BOSS_LAYOUT;
    this.bossShowcase = new BossShowcase(this, bl.bossShowcase.x, bl.bossShowcase.y);
    this.bossInfoPanel = new BossInfoPanel(this, pl.bossInfoPanel.x, pl.bossInfoPanel.y);
    this.bossSkillIcon = new BossSkillIcon(this, bl.bossTrait.x, bl.bossTrait.y);
    this.enemyPortrait = new PortraitFrame(this, WIDTH - 130, 100, 80);
    this.enemyStats = new StatsPanel(this, WIDTH - 38, 100, true);
    this.enemyHealth = new HealthBar(this, pl.enemyHealth.x, pl.enemyHealth.y, 120, 16);
    this.enemyHand = new CardHand(this, pl.enemyHand.x, pl.enemyHand.y);
    this.enemySumDisplay = new HandSumDisplay(
      this,
      pl.enemyHand.x - 120,
      pl.enemyHand.y,
      'left'
    );
    this.enemyDeck = new DeckPile(this, pl.enemyDeck.x, pl.enemyDeck.y);

    // 按钮（右下）
    this.drawButton = new DrawButton(this, WIDTH - 280, HEIGHT - 80);
    this.endTurnButton = new EndTurnButton(this, WIDTH - 120, HEIGHT - 80);

    const initData = (this.scene.settings.data ?? {}) as {
      fromMap?: boolean;
      nodeId?: string;
    };
    connect(this, initData);
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
  getEnemyPortrait(): PortraitFrame {
    return this.enemyPortrait;
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
  getPlayerDebuffIcons(): DebuffIcons {
    return this.playerDebuffIcons;
  }
  getBossSkillIcon(): BossSkillIcon {
    return this.bossSkillIcon;
  }
  getBossShowcase(): BossShowcase {
    return this.bossShowcase;
  }
  getBossInfoPanel(): BossInfoPanel {
    return this.bossInfoPanel;
  }

  shutdown(): void {
    this.background?.destroy();
    this.roundDisplay?.destroy();
    this.playerPortrait?.destroy();
    this.enemyPortrait?.destroy();
    this.playerDebuffIcons?.destroy();
    this.bossSkillIcon?.destroy();
    this.bossShowcase?.destroy();
    this.bossInfoPanel?.destroy();
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
