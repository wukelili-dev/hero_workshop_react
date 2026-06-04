// @ts-nocheck — legacy system
import { GameEngine } from '../engine/GameEngine';

/** 强化配置表 [level, bonus_pct, 铁矿, 金币, success_rate] */
const FORTIFY_CONFIG: [number, number, number, number, number][] = [
  [1,  5,   5,   50,   1.00],
  [2,  10,  10,  100,  0.95],
  [3,  15,  20,  200,  0.90],
  [4,  20,  35,  350,  0.80],
  [5,  25,  50,  500,  0.70],
  [6,  30,  70,  700,  0.55],
  [7,  40,  100, 1000, 0.40],
  [8,  50,  150, 1500, 0.25],
  [9,  65,  200, 2000, 0.15],
  [10, 80,  300, 3000, 0.05],
];

/** 护锻符保护费用 */
const PROTECT_CHARM_COST: Record<string, number> = { "铁矿": 50, "金币": 500 };

interface FortifyInfo {
  level: number;
  bonus_pct: number;
  cost: Record<string, number>;
  success_rate: number;
}

/** 获取指定强化等级的信息 */
function getFortifyInfo(level: number): FortifyInfo | null {
  if (level < 1 || level > 10) return null;
  const [, bonus, iron, gold, rate] = FORTIFY_CONFIG[level - 1];
  return {
    level,
    bonus_pct: bonus,
    cost: { "铁矿": iron, "金币": gold },
    success_rate: rate,
  };
}

/** 获取强化属性加成倍率 */
function getFortifyBonus(forgeLevel: number): number {
  if (forgeLevel <= 0) return 1.0;
  const info = getFortifyInfo(forgeLevel);
  if (!info) return 1.0;
  return 1.0 + info.bonus_pct / 100.0;
}

// ══════════════════════════════════════
// ForgeSystem — 强化 + 专属锻造
// ══════════════════════════════════════

export class ForgeSystem {

  /**
   * 强化装备（+1~+10）
   * @param equipRef 装备dict（直接修改）
   * @param useCharm 是否使用护锻符
   * @returns [success, message]
   */
  static fortifyEquipment(
    equipRef: any,
    useCharm: boolean = false
  ): [boolean, string] {
    const currentLevel = equipRef.forge_level ?? 0;
    if (currentLevel >= 10) {
      return [false, "已达到最高强化等级 +10!"];
    }

    const nextLevel = currentLevel + 1;
    const info = getFortifyInfo(nextLevel);
    if (!info) return [false, "强化配置错误!"];

    // 计算费用
    const cost: Record<string, number> = { ...info.cost };
    if (useCharm) {
      for (const [k, v] of Object.entries(PROTECT_CHARM_COST)) {
        cost[k] = (cost[k] ?? 0) + v;
      }
    }

    // 费用检查由调用方做（GameEngine/EconomySystem）
    // 这里直接执行强化

    const success = Math.random() < info.success_rate;
    if (success) {
      equipRef.forge_level = nextLevel;
      return [true, `强化成功! ${equipRef.name} +${nextLevel}`];
    } else {
      if (useCharm) {
        return [false, `强化失败! 护锻符保护不掉级 (保持+${currentLevel})`];
      } else if (nextLevel > 5 && currentLevel > 0) {
        equipRef.forge_level = currentLevel - 1;
        return [false, `强化失败! 掉回 +${currentLevel - 1}`];
      } else {
        return [false, `强化失败! 保持 +${currentLevel}`];
      }
    }
  }

  /**
   * 专属锻造（使用牧场材料+铁矿+金币）
   * @returns [success, message, equip]
   */
  static forgeEquipment(
    engine: GameEngine,
    recipeName: string
  ): [boolean, string, any | null] {
    // 查找配方（从 data/forge.ts 导入）
    const recipe = ForgeSystem._findRecipe(recipeName);
    if (!recipe) return [false, "锻造配方不存在!", null];

    // 检查核心材料
    const warehouse = engine.ranch.getWarehouseSummary();
    const matName = recipe.material;
    const matCount = recipe.material_count;
    if ((warehouse[matName] ?? 0) < matCount) {
      return [false, `${matName}不足! 需要${matCount}个, 当前${warehouse[matName] ?? 0}个`, null];
    }

    // 检查费用
    const cost = { "铁矿": recipe.iron, "金币": recipe.gold };
    if (!EconomySystem.canAfford(engine, cost)) {
      return [false, "资源不足!", null];
    }

    // 检查背包
    if (engine.player.inventory.length >= 20) {
      return [false, "背包已满! (最多20件)", null];
    }

    // 消耗
    EconomySystem.spendResources(engine, cost);
    engine.ranch.output_warehouse[matName] -= matCount;
    if (engine.ranch.output_warehouse[matName] <= 0) {
      delete engine.ranch.output_warehouse[matName];
    }

    // 构建装备
    const equip = ForgeSystem._buildForgedEquip(recipe);
    engine.player.inventory.push(equip);
    engine.addLog(`🔨 锻造成功! 获得 ${equip.name}`);
    return [true, `锻造成功! 获得 ${equip.name}`, equip];
  }

  // ══════════════════════════════════════
  // UI 辅助
  // ══════════════════════════════════════

  /** 获取所有锻造配方（含 can_forge 标记） */
  static getForgeRecipesForUI(engine: GameEngine): any[] {
    // 从 data/forge.ts 获取全部配方
    const { FORGE_RECIPES } = require("../data/forge");
    const warehouse = engine.ranch.getWarehouseSummary();
    return FORGE_RECIPES.map((r: any) => ({
      ...r,
      can_forge:
        (warehouse[r.material] ?? 0) >= r.material_count &&
        engine.resources["铁矿"] >= r.iron &&
        engine.player.gold >= r.gold,
      owned_mat: warehouse[r.material] ?? 0,
    }));
  }

  /** 获取装备强化信息（用于UI展示） */
  static getFortifyInfoForUI(equip: any): any {
    const current = equip.forge_level ?? 0;
    if (current >= 10) {
      return { current, max: 10, next: null };
    }
    const nextInfo = getFortifyInfo(current + 1);
    return {
      current,
      max: 10,
      next: nextInfo
        ? { level: nextInfo.level, cost: nextInfo.cost, success_rate: nextInfo.success_rate }
        : null,
    };
  }

  // ══════════════════════════════════════
  // 内部辅助
  // ══════════════════════════════════════

  /** 根据名称查找配方（from data/forge.ts） */
  private static _findRecipe(name: string): any | null {
    const { FORGE_RECIPES } = require("../data/forge");
    return FORGE_RECIPES.find((r: any) => r.name === name) ?? null;
  }

  /** 根据配方构建锻造装备dict */
  private static _buildForgedEquip(recipe: any): any {
    const { FORGE_RARITY_COLORS } = require("../data/forge");
    const equip: any = {
      name: recipe.name,
      type: recipe.type,
      rarity: "锻造",
      rarity_color: FORGE_RARITY_COLORS[recipe.rarity] ?? "#cccccc",
      level_req: 1,
      is_perfect: false,
      sell_price: Math.floor(recipe.gold / 2),
      forge_level: 0,
      is_forged: true,
      forge_set: recipe.forge_set ?? null,
      passive: recipe.passive ?? null,
    };
    if (recipe.type === "weapon") {
      equip.attack = recipe.attack;
      equip.crit_rate = recipe.crit_rate;
      equip.crit_dmg = recipe.crit_dmg ?? 150;
      equip.special = null;
    } else {
      equip.defense = recipe.defense;
      equip.hp_bonus = recipe.hp_bonus;
      equip.special = null;
    }
    return equip;
  }
}

// 延迟导入避免循环依赖
import { EconomySystem } from '../engine/Economy';
