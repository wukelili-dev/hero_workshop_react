# 勇者工坊 Hero Workshop

放置类 RPG，React + TypeScript 重写版。

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

| 模块 | 状态 |
|------|------|
| 战斗系统 | ✅ 完整 |
| 背包 / 商店 | ✅ 完整 |
| 农场 | ✅ 完整 |
| 牧场 | ✅ 完整 |
| 锻造 | ✅ 完整 |
| 工厂 | ✅ 完整 |
| 存档系统 | ✅ 完整（localStorage） |

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
