# 勇者工坊 React 迁移 — TODO 追踪表
> 项目路径：D:\pyproject\hero_workshop_react\
> 参考代码：D:\pyproject\hero_workshop\modules\
> 设计文档：C:\Users\Owner\Desktop\hero_workshop_react_migration.md

---

## 规则

1. **每个任务完成后必须 git commit**，commit message 格式：[Agent名] #N 完成任务描述
2. **任务超时**：单个任务限时 90 秒，超时拆小重派
3. **进度更新**：每完成一项，游戏设计师（或我）更新此文档并打 ✅
4. **代可执行特别注意项**：不给大文件让他自己读，每次给精准位置+完结代码

---

## 第一阶段：脚手架 + 数据层（预计 3-5 天）

| # | 任务 | 负责人 | 状态 | 备注 |
|---|------|--------|------|------|
| 1 | src/types.ts — TypeScript 核心接口定义 | HTML小游戏生成师 | ✅ 完成 | commit: aed2007 |
| 2 | src/data/maps.ts — 10地图49怪物 | HTML小游戏生成师 | ✅ 完成 | commit: 2ab47f4 |
| 3 | src/data/equipment.ts — 武器/护甲 | 游戏设计师 | ✅ 完成 | commit: d6ebc09 |
| 4 | src/data/forge.ts — 锻造配置+被动 | 游戏设计师 | ✅ 完成 | commit: ef9bb03 |
| 5 | src/data/ranch.ts — 38种牧场生物 | HTML小游戏生成师 | ✅ 完成 | commit: eaccbaa |
| 6 | src/data/plants.ts — 25种植物+季节系统 | HTML小游戏生成师 | ✅ 完成 | commit: 7a1fc45 |
| 7 | src/data/factory.ts — 工厂配置 | HTML小游戏生成师 | ✅ 完成 | commit: 9feaa99 |
| 8 | src/data/buildings.ts — 建筑/奇观 | HTML小游戏生成师 | ✅ 完成 | commit: 185062d |
| 9 | src/data/inventory.ts — 杂物收藏品 | HTML小游戏生成师 | ✅ 完成 | commit: 0b15bda |
| 10 | src/data/constants.ts — 全局常量 | HTML小游戏生成师 | ✅ 完成 | commit: a1b55d5 |

**里程碑：所有游戏数据可被 TS 访问，零运行时错误**

---

## 第二阶段：游戏引擎核心（预计 5-7 天）

| # | 任务 | 负责人 | 状态 | 备注 |
|---|------|--------|------|------|
| 11 | src/engine/Combat.ts — 伤害公式+战斗流程 | 代可执行 | ✅ 完成 | commit: bc9d79f |
| 12 | src/engine/Hero.ts — 英雄属性/经验曲线 | 代可执行 | ✅ 完成 | commit: 2ab47f4 |
| 13 | src/engine/Team.ts — 队伍+酒馆 | 游戏设计师 | ✅ 完成 | commit: c12a2b0 |
| 14 | src/engine/GameEngine.ts — tick循环+存档 | HTML小游戏生成师 | ✅ 完成 | commit: 74f2da0 |
| 15 | src/engine/Economy.ts — 经济管理 | HTML小游戏生成师 | ✅ 完成 | commit: 019888c |
| 16 | src/engine/Passives.ts — 被动技能系统 | HTML小游戏生成师 | ✅ 完成 | commit: 01a0cd5 |

**里程碑：可在 console 中执行战斗，看到完整日志输出**

---

## 第三阶段：经济子系统（预计 7-10 天）

| # | 任务 | 负责人 | 状态 | 备注 |
|---|------|--------|------|------|
| 17 | src/systems/FarmSystem.ts — 农场 | 马六 | ✅ 完成 | commit: 20ed0ae |
| 18 | src/systems/RanchSystem.ts — 牧场 | 游戏设计师 | ✅ 完成 | commit: e972f35 |
| 19 | src/systems/FactorySystem.ts — 工厂 | 游戏设计师 | ✅ 完成 | commit: e972f35 |
| 20 | src/systems/BuildingSystem.ts — 建筑 | 游戏设计师 | ✅ 完成 | commit: e972f35 |
| 21 | src/systems/ForgeSystem.ts — 锻造 | HTML小游戏生成师 | ✅ 完成 | commit: c474530 |
| 22 | src/systems/EquipmentSystem.ts — 装备 | HTML小游戏生成师 | ✅ 完成 | commit: 13b5227 |
| 23 | src/systems/DropSystem.ts — 掉落 | HTML小游戏生成师 | ✅ 完成 | commit: 98a8281 |
| 24 | src/systems/SaveSystem.ts — 存档 | HTML小游戏生成师 | ✅ 完成 | commit: ff8bd3c |

**里程碑：所有游戏系统在 console 中可完整运行**

---

## 第四阶段：UI 层（预计 10-15 天）

| # | 任务 | 负责人 | 状态 | 备注 |
|---|------|--------|------|------|
| 25 | src/store/ — Zustand 状态管理（6个store） | HTML小游戏生成师 | ✅ 完成 | commit: 9342af6 |
| 26 | src/components/layout/ — 布局组件 | HTML小游戏生成师 | ✅ 完成 | commit: 3a75f47 |
| 27 | src/components/city/ — 主城面板（左侧） | HTML小游戏生成师 | ✅ 完成 | commit: 211f624 |
| 28 | src/components/equipment/ — 武器Tab | HTML小游戏生成师 | ✅ 完成 | commit: c4d710c |
| 29 | src/components/equipment/ — 护甲Tab+杂货Tab | HTML小游戏生成师 | ✅ 完成 | commit: c4d710c |
| 30 | src/components/inventory/ — 背包Tab | HTML小游戏生成师 | ✅ 完成 | commit: 32dab6f |
| 31 | src/components/materials/ — 材料Tab | HTML小游戏生成师 | ✅ 完成 | commit: 6dcd8ac |
| 32 | src/components/tavern/ — 酒馆Tab | HTML小游戏生成师 | ✅ 完成 | commit: dbdd343 |
| 33 | src/components/farm/ — 农场Tab | HTML小游戏生成师 | ✅ 完成 | commit: 40ed5d7 |
| 34 | src/components/ranch/ — 牧场Tab | HTML小游戏生成师 | ✅ 完成 | commit: c3871d5 |
| 35 | src/components/factory/ — 工厂Tab | HTML小游戏生成师 | ✅ 完成 | commit: 2ada69b |
| 36 | src/components/forge/ — 锻造Tab | HTML小游戏生成师 | ✅ 完成 | commit: ac8448c |
| 37 | src/components/shared/ — 通用组件 | HTML小游戏生成师 | ✅ 完成 | commit: 792f239 |

**里程碑：完整可玩的 Web 游戏**

---

## 第五阶段：打磨 + 测试（预计 3-5 天）

| # | 任务 | 负责人 | 状态 | 备注 |
|---|------|--------|------|------|
| 38 | 数值平衡测试（全流程跑通） | 游戏设计师 | ✅ 完成 | 见 test_balance_v2.mjs 报告 |
| 39 | 农场→牧场→锻造闭环测试 | 游戏设计师 | ✅ 完成 | 闭环逻辑OK，装备数值待加强 |
| 40 | 10地图难度阶梯验证 | 游戏设计师 | ✅ 完成 | 梯度平滑，傲来国→大唐东跳跃大 |
| 41 | Boss奖励曲线验证 | 游戏设计师 | ✅ 完成 | 曲线合理，EXP/HP比例稳定 |
| 42 | 存档兼容性测试 | 游戏设计师 | ✅ 完成 | localStorage存取档+确认弹窗 |
| 43 | 移动端适配（如需要） | 游戏设计师 | ✅ 完成 | md断点切换+底部导航栏 |

**里程碑：可对外发布**

---

## 第六阶段：Electron 桌面端（预计 3-5 天，可选）

| # | 任务 | 负责人 | 状态 | 备注 |
|---|------|--------|------|------|
| 44 | Electron 主进程 + preload 脚本 | HTML小游戏生成师 | 📋 待办 | |
| 45 | 文件系统存取档替代 localStorage | HTML小游戏生成师 | 📋 待办 | |
| 46 | 窗口管理 + 托盘 | HTML小游戏生成师 | 📋 待办 | |
| 47 | 打包：Windows/macOS/Linux | HTML小游戏生成师 | 📋 待办 | |
| 48 | 自动更新 | HTML小游戏生成师 | 📋 待办 | |

**里程碑：Steam/itch.io 可分发**

---

## 进度统计

- 总任务数：48
- 已完成：43（#1-#43）
- 进行中：0
- 待办：5

---

## Git 提交记录

| Commit Hash | 日期 | Agent | 描述 |
|-------------|------|-------|------|
| 9342af6 | 2026-06-04 | HTML小游戏生成师 | #25 完成 Zustand Store（6个store） |
| 792f239 | 2026-06-04 | HTML小游戏生成师 | #37 完成 共享组件 |
| 3a75f47 | 2026-06-04 | HTML小游戏生成师 | #26 完成 布局组件 |
| 211f624 | 2026-06-04 | HTML小游戏生成师 | #27 完成 主城面板 |
| c4d710c | 2026-06-04 | HTML小游戏生成师 | #28-#29 武器/护甲/杂货Tab |
| 32dab6f | 2026-06-04 | HTML小游戏生成师 | #30 背包Tab |
| 6dcd8ac | 2026-06-04 | HTML小游戏生成师 | #31 材料Tab |
| dbdd343 | 2026-06-04 | HTML小游戏生成师 | #32 酒馆Tab |
| 40ed5d7 | 2026-06-04 | HTML小游戏生成师 | #33 农场Tab |
| c3871d5 | 2026-06-04 | HTML小游戏生成师 | #34 牧场Tab |
| 2ada69b | 2026-06-04 | HTML小游戏生成师 | #35 工厂Tab |
| ac8448c | 2026-06-04 | HTML小游戏生成师 | #36 锻造Tab |
| cb3e2a9 | 2026-06-04 | HTML小游戏生成师 | App.tsx接入AppShell |

> 更新方式：游戏设计师（uafru5gofdt644lm）在每项任务完成并验证后，更新此表并打 ✅
> 最后更新：2026-06-04 12:30