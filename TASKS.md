# 勇者工坊 React 迁移 — 任务分配

## 项目总控：HTML小游戏生成师 🎮 (e8i0y6kkzh4a3zdc)

### 职责
- 项目架构最终决策
- TypeScript 类型体系定义（`src/types.ts`）
- 数据层迁移（8个文件：maps/equipment/forge/ranch/plants/factory/buildings/inventory）  
- UI框架搭建（AppShell/三栏布局/TabBar/通用组件）
- 协调引擎层（代可行）和系统层（马六）的集成

## 引擎层：代可行 (agent-99b57d4c)

### 任务（按顺序，每个独立，每次给完整代码+精确位置）

1. **Combat.ts** — 战斗系统核心
   - 伤害公式：`dmg = ATK * (1 - DEF/(DEF+50)) * random(0.9, 1.1)` 最低1伤
   - 战斗流程：回合制，玩家先手，自动战斗loop
   - 输入：HeroStats, TeamMember[], Monster
   - 输出：BattleLog[], 胜/败, 掉落

2. **Hero.ts** — 英雄属性系统
   - 等级-经验曲线、属性成长公式
   - 装备穿戴/卸下 → 属性计算

3. **Team.ts** — 队伍+酒馆
   - 酒馆刷新（随机3个队友）
   - 招募/解雇
   - 队伍属性汇总

## 系统层：马六 (agent-0b15429d)

### 任务（按顺序，每个独立）

1. **FarmSystem.ts** — 农场
   - 种植/收获/自动产金币和饲料
   - 施肥（肥料叠加递减）
   - 季节系统（2小时一季，匹配季节增产）

2. **RanchSystem.ts** — 牧场
   - 购买生物/喂食/自动产材料
   - 性格系统（8种性格影响产出）
   - 出售材料

3. **FactorySystem.ts + BuildingSystem.ts** — 工厂+建筑
   - 工厂部门升级/劳工管理
   - 建筑/奇观建造和产出

## 数据参考

所有游戏数据在 `D:\pyproject\hero_workshop\modules\` 下：
- maps.py — 10地图49怪物（含Boss加速曲线）
- equipment.py — 武器/护甲定义
- forge.py — 锻造配方+被动
- ranch.py — 38种牧场生物
- plants.py — 30+植物（含季节）
- factory.py — 工厂配置
- buildings.py — 建筑/奇观
- game_core.py — 核心引擎（伤害公式/战斗/battle_team）
- hero.py — 英雄属性系统

设计文档：
- D:\pyproject\hero_workshop\docs\地图怪物扩展设计文档v3.md
- C:\Users\Owner\Desktop\hero_workshop_react_migration.md

## 关键原则

1. 所有代码在 `engine/` 和 `systems/` 下实现，零 UI 依赖
2. 用 TypeScript 接口，不用 any
3. 每个文件完成后可独立测试
4. 每人做好后 git commit
