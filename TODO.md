# 勇者工坊 React 迁移 — TODO 跟踪表

> 项目路径：D:\pyproject\hero_workshop_react\
> 参考代码：D:\pyproject\hero_workshop\modules\
> 设计文档：C:\Users\Owner\Desktop\hero_workshop_react_migration.md

---

## 规则

1. **每个任务完成后必须 git commit**，commit message 格式：`[Agent名] 完成任务描述`
2. **任务超时**：单个任务限时 90 秒，超时拆小重派
3. **进度更新**：每完成一项，游戏设计师（我）更新此文档并打 ✅
4. **代可行特别注意事项**：不给大文件让他自己读，每次给精确位置+完整代码

---

## 第一阶段：脚手架 + 数据层（预计 3-5 天）

| # | 任务 | 负责人 | 状态 | 备注 |
|---|------|--------|------|------|
| 1 | `src/types.ts` — TypeScript 核心接口定义 | HTML小游戏生成师 | ✅ 完成 | commit: aed2007 |
| 2 | `src/data/maps.ts` — 10地图49怪物 | HTML小游戏生成师 | ✅ 完成 | commit: 2ab47f4 |
| 3 | `src/data/equipment.ts` — 武器/护甲 | 游戏设计师 | ✅ 完成 | commit: d6ebc09 |
| 4 | `src/data/forge.ts` — 锻造配方+被动 | 游戏设计师 | ✅ 完成 | commit: ef9bb03 |
| 5 | `src/data/ranch.ts` — 38种牧场生物 | HTML小游戏生成师 | ✅ 完成 | commit: eaccbaa |
| 6 | `src/data/plants.ts` — 25种植物+季节系统 | HTML小游戏生成师 | ✅ 完成 | commit: 7a1fc45 |
| 7 | `src/data/factory.ts` — 工厂配置 | HTML小游戏生成师 | ✅ 完成 | commit: 9feaa99 |
| 8 | `src/data/buildings.ts` — 建筑/奇观 | HTML小游戏生成师 | ✅ 完成 | commit: 185062d |
| 9 | `src/data/inventory.ts` — 杂货收藏品 | HTML小游戏生成师 | ✅ 完成 | commit: 0b15bda |
| 10 | `src/data/constants.ts` — 全局常量 | HTML小游戏生成师 | ✅ 完成 | commit: a1b55d5 |

**里程碑：所有游戏数据可被 TS 访问，零运行时错误**

---

## 第二阶段：游戏引擎核心（预计 5-7 天）

| # | 任务 | 负责人 | 状态 | 备注 |
|---|------|--------|------|------|
| 11 | `src/engine/Combat.ts` — 伤害公式+战斗流程 | 代可行 | ✅ 完成 | commit: bc9d79f |
| 12 | `src/engine/Hero.ts` — 英雄属性/经验曲线 | 代可行 | ✅ 完成 | commit: 2ab47f4 |
| 13 | `src/engine/Team.ts` — 队伍+酒馆 | 游戏设计师 | ✅ 完成 | commit: c12a2b0 |
| 14 | `src/engine/GameEngine.ts` — tick循环+存档 | HTML小游戏生成师 | ✅ 完成 | commit: 74f2da0 |
| 15 | `src/engine/Economy.ts` — 经济管理 | HTML小游戏生成师 | ✅ 完成 | commit: 019888c |
| 16 | `src/engine/Passives.ts` — 被动技能系统 | HTML小游戏生成师 | ✅ 完成 | commit: 01a0cd5 |

**里程碑：可在 console 中执行战斗，看到完整日志输出**

---

## 第三阶段：经济子系统（预计 7-10 天）

| # | 任务 | 负责人 | 状态 | 备注 |
|---|------|--------|------|------|
| 17 | `src/systems/FarmSystem.ts` — 农场 | 马六 | ✅ 完成 | commit: 20ed0ae |
| 18 | `src/systems/RanchSystem.ts` — 牧场 | 游戏设计师 | ✅ 完成 | commit: e972f35 |
| 19 | `src/systems/FactorySystem.ts` — 工厂 | 游戏设计师 | ✅ 完成 | commit: e972f35 |
| 20 | `src/systems/BuildingSystem.ts` — 建筑 | 游戏设计师 | ✅ 完成 | commit: e972f35 |
| 21 | `src/systems/ForgeSystem.ts` — 锻造 | HTML小游戏生成师 | ✅ 完成 | commit: c474530 |
| 22 | `src/systems/EquipmentSystem.ts` — 装备 | HTML小游戏生成师 | ✅ 完成 | commit: 13b5227 |
| 23 | `src/systems/DropSystem.ts` — 掉落 | HTML小游戏生成师 | ✅ 完成 | commit: 98a8281 |
| 24 | `src/systems/SaveSystem.ts` — 存档 | HTML小游戏生成师 | ✅ 完成 | commit: ff8bd3c |

**里程碑：所有游戏系统在 console 中可完整运行**

---

## 第四阶段：UI 层（预计 10-15 天）

| # | 任务 | 负责人 | 状态 | 备注 |
|---|------|--------|------|------|
| 25 | `src/store/` — Zustand 状态管理（6个store） | HTML小游戏生成师 | 📋 待办 | useGameStore/useCombatStore等 |
| 26 | `src/components/layout/` — 布局组件 | HTML小游戏生成师 | 📋 待办 | AppShell/TopBar/BottomBar/TabBar |
| 27 | `src/components/city/` — 主城Tab | HTML小游戏生成师 | 📋 待办 | 仙侠风格 |
| 28 | `src/components/combat/` — 战斗Tab | HTML小游戏生成师 | 📋 待办 | 怪物卡/地图选择/战斗日志 |
| 29 | `src/components/equipment/` — 装备Tab | HTML小游戏生成师 | 📋 待办 | 武器店/护甲店/装备卡片 |
| 30 | `src/components/inventory/` — 背包Tab | HTML小游戏生成师 | 📋 待办 | 背包网格/物品卡片 |
| 31 | `src/components/materials/` — 材料Tab | HTML小游戏生成师 | 📋 待办 | 材料面板 |
| 32 | `src/components/tavern/` — 酒馆Tab | HTML小游戏生成师 | 📋 待办 | 酒馆面板 |
| 33 | `src/components/farm/` — 农场Tab | HTML小游戏生成师 | 📋 待办 | 农场面板/种子店/植物卡片 |
| 34 | `src/components/ranch/` — 牧场Tab | HTML小游戏生成师 | 📋 待办 | 牧场面板/生物商店/生物卡片 |
| 35 | `src/components/factory/` — 工厂Tab | HTML小游戏生成师 | 📋 待办 | 工厂面板 |
| 36 | `src/components/forge/` — 锻造Tab | HTML小游戏生成师 | 📋 待办 | 锻造面板/强化区/锻造区 |
| 37 | `src/components/shared/` — 通用组件 | HTML小游戏生成师 | 📋 待办 | RarityBadge/ProgressBar/ConfirmDialog/Tooltip |

**里程碑：完整可玩的 Web 游戏**

---

## 第五阶段：打磨 + 测试（预计 3-5 天）

| # | 任务 | 负责人 | 状态 | 备注 |
|---|------|--------|------|------|
| 38 | 数值平衡测试（new game 全流程跑通） | HTML小游戏生成师 | 📋 待办 |  |
| 39 | 农场→牧场→锻造 闭环测试 | HTML小游戏生成师 | 📋 待办 |  |
| 40 | 10地图难度阶梯验证 | HTML小游戏生成师 | 📋 待办 |  |
| 41 | Boss奖励曲线验证 | HTML小游戏生成师 | 📋 待办 |  |
| 42 | 存档兼容性测试 | HTML小游戏生成师 | 📋 待办 |  |
| 43 | 移动端适配（如需要） | HTML小游戏生成师 | 📋 待办 |  |

**里程碑：可对外发布**

---

## 第六阶段：Electron 桌面壳（预计 3-5 天，可选）

| # | 任务 | 负责人 | 状态 | 备注 |
|---|------|--------|------|------|
| 44 | Electron 主进程 + preload 脚本 | HTML小游戏生成师 | 📋 待办 |  |
| 45 | 文件系统存取档替代 localStorage | HTML小游戏生成师 | 📋 待办 |  |
| 46 | 窗口管理 + 托盘 | HTML小游戏生成师 | 📋 待办 |  |
| 47 | 打包：Windows/macOS/Linux | HTML小游戏生成师 | 📋 待办 |  |
| 48 | 自动更新 | HTML小游戏生成师 | 📋 待办 |  |

**里程碑：Steam/itch.io 可分发**

---

## 进度统计

- 总任务数：48
- 已完成：5（#1, #2, #11, #12, #17）
- 进行中：0
- 待办：43

---

## Git 提交记录

| Commit Hash | 日期 | Agent | 描述 |
|-------------|------|-------|------|
| aed2007 | 2026-06-04 | HTML小游戏生成师 | #1 创建 types.ts 类型定义 |
| bc9d79f | 2026-06-04 | 代可行 | #11 创建 Combat.ts 战斗系统 |
| 2ab47f4 | 2026-06-04 | 游戏设计师 | #2 #12 创建 maps.ts 和 Hero.ts |
| 3ee2eab | 2026-06-04 | 游戏设计师 | #17 创建 FarmSystem.ts 农场系统 |

---

> 更新方式：游戏设计师（uafru5gofdt644lm）在每项任务完成并验证后，更新此表并打 ✅
> 最后更新：2026-06-04 02:02