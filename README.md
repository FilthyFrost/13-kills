# 13 点卡牌对战 MVP

最小可玩 MVP 的 13 点卡牌对战系统，规则层与 UI 层彻底分离。

## 目录结构

```
src/
├── core/           # 纯规则层（无 UI 依赖）
│   ├── types.ts     # 通用类型
│   ├── card.ts      # Card 实体
│   ├── deck.ts      # 牌堆
│   ├── hand.ts      # 手牌
│   ├── combatRules.ts # 回合胜负与伤害
│   ├── ai.ts        # 敌人 AI
│   └── rng.ts       # 随机数接口
├── game/            # 流程控制层
│   ├── battleState.ts
│   └── battleController.ts
└── ui/              # 演示层
    └── cli.ts       # CLI 入口
```

## 运行方式

### CLI 版

```bash
# 编译
npm run build

# 交互模式（玩家手动选择 Hit/Stand）
npm start

# 自动模拟（玩家每回合自动 Stand）
npm run start:auto
```

### Web 版（Phaser + Vite）

```bash
# 开发
npm run dev

# 构建
npm run build:web

# 预览构建结果
npm run preview
```

开发时访问 http://localhost:5173/ ，点击 DRAW 抽牌，点击 END TURN 停牌。

或直接使用 Node（需先编译）：

```bash
npx tsc
node dist/ui/cli.js
node dist/ui/cli.js --auto
```

## 游戏规则（白卡版）

- **卡组**：A,2,3,4,5,6 各 3 张，共 18 张；双方独立卡组
- **目标**：双方 HP 初始 10，先把对方打到 0 获胜
- **手牌上限**：13 点；>13 为 BUST，=13 为 PERFECT
- **COMBO**：PERFECT 胜 +1，因对方 BUST 胜 +1；回合结束重置为 1
- **伤害**：1 × COMBO

## 架构

- **core/**：纯规则与数据结构，不依赖 UI
- **game/**：状态机与流程控制
- **ui/**：仅调用 controller，不包含规则判断
