# 勇者工坊 Hero Workshop

**一款轻量级放置 RPG，主打「刷怪→掉落→成长→解锁」的循环快感。**

在《勇者工坊》中，你将扮演一位从零开始的勇者，通过不断战斗、收集资源、打造装备、招募队友，逐步探索更广阔的世界。游戏没有复杂的操作，所有成长都在后台自动进行——你只需要做出关键决策。

---

## 游戏简介

### 核心循环

```
战斗 → 掉落材料/装备 → 升级/锻造 → 挑战更强怪物 → 解锁新地图
```

**一局多久？** 放置类游戏，无单局时长限制。挂机 5 分钟有收获，上线 1 小时有进展。

**适合谁？** 喜欢数值成长、装备收集、被动挂机的玩家。

### 特色系统

- 🎮 **自动战斗**：开启后自动刷怪、自动吃药、自动刷新敌人
- ⚔️ **装备掉落**：击败怪物随机掉落武器/护甲，稀有度分 5 档（普通/稀有/史诗/传说/极品）
- 🔨 **锻造系统**：强化装备，提升属性上限
- 🏭 **工厂经营**：建造部门、雇佣工人，被动产出金币
- 🌾 **农场 & 牧场**：种植作物、养殖动物，获取资源
- 📖 **怪物图鉴**：收集怪物图鉴，解锁 Boss 挑战
- 💾 **存档系统**：自动保存 + 手动存档，支持导入导出

---

## 功能介绍

### 战斗系统

| 功能 | 说明 |
|------|------|
| 回合制战斗 | 玩家先手，双方交替攻击，暴击系统 |
| 自动战斗 | 一键开启，自动选择可击败目标、自动吃药 |
| 装备掉落 | 击败怪物随机掉落武器/护甲，Boss 掉率更高 |
| 材料掉落 | 木材、铁矿、皮革、石头等资源 |
| 药水系统 | 战斗中自动喝药，死亡自动复活至 50% HP |

### 装备系统

| 类型 | 说明 |
|------|------|
| 武器 | 提供攻击力、暴击率、暴击伤害 |
| 护甲 | 提供防御力、HP 加成 |
| 稀有度 | 普通（白）→ 稀有（绿）→ 珍稀（蓝）→ 史诗（紫）→ 传说（橙）→ 极品（红）|
| 特殊属性 | 吸血、破甲、连击、反伤、护盾等 |
| 锻造 | 消耗材料强化装备，提升属性 |

### 经营系统

| 模块 | 功能 |
|------|------|
| 🏭 工厂 | 建造部门（研发/生产/销售），雇佣工人，被动产出金币 |
| 🌾 农场 | 种植作物，定时收获种子和资源 |
| 🐄 牧场 | 购买动物，自动孵化产出材料 |
| 🏠 建筑 | 锯木厂、矿场等，自动产出资源 |
| 🍺 酒馆 | 招募队友，组建战斗小队 |

### 其他系统

| 功能 | 说明 |
|------|------|
| 📖 怪物图鉴 | 记录已击败的怪物，Boss 有金色边框特效 |
| 🎒 背包 | 10 格通用背包，支持堆叠 |
| 💰 商店 | 武器店、护甲店、杂货店，批量购买/出售 |
| 💾 存档 | localStorage 本地存储，支持导出 JSON 备份 |

---

## 技术栈

- React 18 + TypeScript
- Vite
- Zustand（状态管理）
- Tailwind CSS
- Radix UI（Dialog / Tabs / Tooltip / Switch / Collapsible / DropdownMenu / Select / Progress / Separator）
- framer-motion（动画）
- react-icons（图标）
- sonner（Toast 通知）
- 自建 `useCountUp` hook（数字滚动动画，`react-countup` 因 ESM/CJS 兼容问题已弃用）

## 功能模块

| 模块 | 状态 | 说明 |
|------|------|------|
| 战斗系统 | ✅ 完整 | 回合制战斗、自动战斗、装备掉落 |
| 背包 / 商店 | ✅ 完整 | 10格背包、批量买卖 |
| 农场 | ✅ 完整 | 种植、收获、时间积累 |
| 牧场 | ✅ 完整 | 购买动物、自动孵化 |
| 锻造 | ✅ 完整 | 强化装备、提升属性 |
| 工厂 | ✅ 完整 | 建造部门、雇佣工人、被动产出 |
| 酒馆 | ✅ 完整 | 招募队友、组建小队 |
| 图鉴 | ✅ 完整 | 怪物收集、Boss 解锁 |
| 存档系统 | ✅ 完整 | localStorage + 导入导出 |

## 启动

```bash
npm install
npm run dev
```

生产构建：

```bash
npm run build
```

## 图标系统

所有导航图标统一使用 `react-icons/fa6`（优先）和 `react-icons/fa`，不再使用 emoji。

Tab 图标映射（`AppShell.tsx` → `TABS` 数组）：

| Tab | 图标组件 | 来源 |
|-----|-----------|------|
| 武器 | `FaSword` | fa6 |
| 护甲 | `FaShieldHalved` | fa6 |
| 杂货 | `FaGift` | fa |
| 背包 | `FaBagShopping` | fa6 |
| 材料 | `FaCube` | fa |
| 酒馆 | `FaBeerMugEmpty` | fa6 |
| 农场 | `FaWheatAwn` | fa6 |
| 工厂 | `FaIndustry` | fa6 |
| 牧场 | `FaPaw` | fa6 |
| 锻造 | `FaHammer` | fa |
| 图鉴 | `FaBookOpen` | fa6 |

移动端底部导航（`MOBILE_NAV`）：

| 视图 | 图标组件 | 来源 |
|------|-----------|------|
| 主城 | `FaCastle` | fa6 |
| 战斗 | `FaSkullCrossbones` | fa |
| 背包 | `FaBagShopping` | fa6 |
| 锻造 | `FaHammer` | fa |
| 牧场 | `FaPaw` | fa6 |

底部操作栏按钮：

| 按钮 | 图标组件 | 来源 |
|------|-----------|------|
| 存档 | `FaFloppyDisk` | fa6 |
| 读档 | `FaFolderOpen` | fa6 |
| 图鉴 | `FaBookOpen` | fa6 |
| 帮助 | `FaQuestionCircle` | fa6 |

> 新增图标时优先从 `react-icons/fa6` 选取，fa6 没有再回退到 `react-icons/fa`。
> `TabBar.tsx` 的 `TabConfig.icon` 类型为 `React.ReactNode`，直接传入 JSX 组件即可。

## 项目结构

```
src/
├── App.tsx                    # 根组件
├── main.tsx                   # 入口
├── types.ts                   # 全局类型定义
├── assets/                    # 静态资源
├── components/
│   ├── layout/                # 布局组件
│   │   ├── AppShell.tsx       # 三栏自适应布局壳
│   │   ├── TabBar.tsx         # 桌面端左侧导航
│   │   └── TopBar.tsx         # 顶部状态栏（金币/材料）
│   ├── city/                  # 主城面板
│   │   ├── CenterPanel.tsx    # 核心面板：队伍 + 属性 + 战斗 + 自动战斗
│   │   ├── LogPanel.tsx       # 系统日志面板
│   │   └── MainCityPanel.tsx  # 主城：建筑 / 奇观卡片
│   ├── equipment/             # 装备 Tab
│   │   ├── WeaponTab.tsx      # 武器商店
│   │   └── ArmorTab.tsx       # 护甲商店
│   ├── novelty/               # 杂货 Tab（NoveltyTab.tsx）
│   ├── inventory/             # 背包（10格通用背包，InventoryTab.tsx）
│   ├── farm/                  # 农场（种植 / 收获，FarmTab.tsx）
│   ├── ranch/                 # 牧场（购买 / 自动孵化，RanchTab.tsx）
│   ├── forge/                 # 锻造（ForgeTab.tsx）
│   ├── factory/               # 工厂（FactoryTab.tsx）
│   ├── tavern/                # 酒馆（招募队友，TavernTab.tsx）
│   ├── materials/             # 材料（MaterialsTab.tsx）
│   ├── bestiary/              # 图鉴（BestiaryTab.tsx）
│   └── shared/                # 共享组件
│       ├── ConfirmDialog.tsx
│       ├── ProgressBar.tsx
│       ├── RarityBadge.tsx
│       └── Tooltip.tsx
├── store/                     # Zustand 状态管理
│   ├── useGameStore.ts        # 核心状态：英雄/战斗/建筑/工厂/自动战斗
│   ├── useInventoryStore.ts   # 背包状态
│   ├── useFarmStore.ts        # 农场状态
│   ├── useRanchStore.ts       # 牧场状态
│   ├── useForgeStore.ts       # 锻造状态
│   ├── useFactoryStore.ts     # 工厂状态
│   ├── useCombatStore.ts      # 战斗状态
│   └── saveUtils.ts           # 存档序列化
├── engine/                    # 战斗 / 经济引擎
│   ├── Combat.ts              # 战斗核心（executeBattle）
│   ├── Economy.ts             # 经济系统
│   ├── Hero.ts                # 英雄定义
│   ├── Passives.ts            # 被动技能
│   └── Team.ts                # 队伍管理
├── systems/                   # 子系统
│   ├── BuildingSystem.ts      # 建筑产出
│   ├── DropSystem.ts          # 掉落
│   ├── EquipmentSystem.ts     # 装备
│   ├── FactorySystem.ts       # 工厂
│   ├── FarmSystem.ts          # 农场
│   ├── ForgeSystem.ts         # 锻造
│   ├── RanchSystem.ts         # 牧场
│   └── SaveSystem.ts          # 存档
├── data/                      # 数据定义
│   ├── constants.ts           # 常量 / formatNumber
│   ├── maps.ts                # 地图 & 怪物
│   ├── equipment.ts           # 装备数据
│   ├── buildings.ts           # 建筑配置
│   ├── factory.ts             # 工厂配方
│   ├── forge.ts               # 锻造配方
│   ├── inventory.ts           # 物品数据
│   ├── plants.ts              # 植物数据
│   ├── ranch.ts               # 牧场动物
│   ├── tavern.ts              # 酒馆生成
│   └── types.ts               # 数据类型
├── hooks/
│   └── useCountUp.tsx         # 自建数字滚动动画
└── styles/                    # 样式
```

## 原版

Python MUD 版存档于 [idle-game](https://github.com/wukelili-dev/idle-game)。
