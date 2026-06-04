// @ts-nocheck — legacy engine, data model incompatible with current types
import { GameEngine } from './GameEngine';
import { Equipment } from '../types';

/**
 * 经济系统：资源管理、买卖定价、工资结算
 * 所有方法为静态方法，接收 engine 实例进行操作
 */
export class EconomySystem {
  // ═════════════════════════════════════
  // 资源检查与消耗
  // ═════════════════════════════════════

  /** 检查是否能支付成本 */
  static canAfford(engine: GameEngine, cost: Record<string, number>): boolean {
    for (const [res, amount] of Object.entries(cost)) {
      if (res === "金币") {
        if (engine.player.gold < amount) return false;
      } else {
        if ((engine.resources[res] ?? 0) < amount) return false;
      }
    }
    return true;
  }

  /** 消耗资源 */
  static spendResources(engine: GameEngine, cost: Record<string, number>): void {
    for (const [res, amount] of Object.entries(cost)) {
      if (res === "金币") {
        engine.player.gold -= amount;
      } else {
        engine.resources[res] = (engine.resources[res] ?? 0) - amount;
      }
    }
  }

  /** 增加资源 */
  static addResources(engine: GameEngine, gains: Record<string, number>): void {
    for (const [res, amount] of Object.entries(gains)) {
      engine.resources[res] = (engine.resources[res] ?? 0) + amount;
    }
  }

  // ═════════════════════════════════════
  // 定价公式
  // ═════════════════════════════════════

  /**
   * 商店装备售价计算（收购价 = 成本的80%）
   * 资源折算：木材=2G, 铁矿=3G, 皮革=2G, 石头=1G
   */
  static calcShopSellPrice(cost: Record<string, number>): number {
    let goldValue = cost["金币"] ?? 0;
    goldValue += (cost["木材"] ?? 0) * 2;
    goldValue += (cost["铁矿"] ?? 0) * 3;
    goldValue += (cost["皮革"] ?? 0) * 2;
    goldValue += (cost["石头"] ?? 0) * 1;
    return Math.floor(goldValue * 0.8);
  }

  /** 掉落装备售价计算（根据稀有度和属性） */
  static calcDropSellPrice(equip: Equipment): number {
    const rarity = equip.rarity ?? "普通";
    const isPerfect = equip.is_perfect ?? false;

    let base = 0;
    if (equip.type === "weapon") {
      base = 10 + (equip.attack ?? 0) * 2 + (equip.crit_rate ?? 0);
    } else {
      base = 10 + (equip.defense ?? 0) * 2 + Math.floor((equip.hp_bonus ?? 0) / 10);
    }

    // 稀有度倍率
    const rarityMult: Record<string, number> = {
      "普通": 1,
      "优秀": 1.5,
      "精良": 2.5,
      "稀有": 4,
      "传说": 8,
    };
    base = Math.floor(base * (rarityMult[rarity] ?? 1));

    // 完美加成
    if (isPerfect) base = Math.floor(base * 1.5);

    // 强化等级加成
    const forgeLevel = equip.forge_level ?? 0;
    base = Math.floor(base * (1 + forgeLevel * 0.1));

    return Math.max(1, base);
  }

  // ═════════════════════════════════════
  // 购买：武器 / 护甲
  // ═════════════════════════════════════

  /**
   * 购买武器（写入背包）
   * @returns [success, message]
   */
  static buyWeapon(
    engine: GameEngine,
    wpn: any
  ): [boolean, string] {
    // 等级检查
    if (engine.player.level < (wpn.level_req ?? 0)) {
      return [false, `等级不足! 需要 Lv.${(wpn as any).level_req}`];
    }
    if (!EconomySystem.canAfford(engine, wpn.cost)) {
      return [false, "资源不足!"];
    }
    if (engine.player.inventory.length >= 20) {
      return [false, "背包已满! (最多20件)"];
    }

    EconomySystem.spendResources(engine, wpn.cost);
    const sellPrice = EconomySystem.calcShopSellPrice(wpn.cost);

    const equip: Equipment = {
      name: wpn.name,
      type: "weapon",
      rarity: "商店",
      rarity_color: "#FFFFFF",
      attack: wpn.attack,
      crit_rate: wpn.crit_rate,
      crit_dmg: wpn.crit_dmg ?? 150,
      special: wpn.special ?? null,
      level_req: wpn.level_req ?? 1,
      is_perfect: false,
      sell_price: sellPrice,
      forge_level: 0,
      is_forged: false,
      forge_set: null,
      passive: null,
    };
    engine.player.inventory.push(equip);
    engine.addLog(`购买装备进入背包: ${wpn.name}`);
    return [true, `${wpn.name} 已放入背包`];
  }

  /**
   * 购买护甲（写入背包）
   * @returns [success, message]
   */
  static buyArmor(
    engine: GameEngine,
    arm: any
  ): [boolean, string] {
    if (engine.player.level < (arm.level_req ?? 0)) {
      return [false, `等级不足! 需要 Lv.${arm.level_req}`];
    }
    if (!EconomySystem.canAfford(engine, arm.cost)) {
      return [false, "资源不足!"];
    }
    if (engine.player.inventory.length >= 20) {
      return [false, "背包已满! (最多20件)"];
    }

    EconomySystem.spendResources(engine, arm.cost);
    const sellPrice = EconomySystem.calcShopSellPrice(arm.cost);

    const equip: Equipment = {
      name: arm.name,
      type: "armor",
      rarity: "商店",
      rarity_color: "#FFFFFF",
      defense: arm.defense,
      hp_bonus: arm.hp_bonus,
      special: arm.special ?? null,
      level_req: arm.level_req ?? 1,
      is_perfect: false,
      sell_price: sellPrice,
      forge_level: 0,
      is_forged: false,
      forge_set: null,
      passive: null,
    };
    engine.player.inventory.push(equip);
    engine.addLog(`购买装备进入背包: ${arm.name}`);
    return [true, `${arm.name} 已放入背包`];
  }

  // ═════════════════════════════════════
  // 出售：背包物品
  // ═════════════════════════════════════

  /**
   * 出售背包中指定index的物品
   * @returns [success, message, goldGained]
   */
  static sellInventoryItem(
    engine: GameEngine,
    idx: number
  ): [boolean, string, number] {
    const inv = engine.player.inventory;
    if (idx < 0 || idx >= inv.length) {
      return [false, "物品不存在!", 0];
    }
    const item = inv[idx];
    const goldGained = item.sell_price ?? 0;
    engine.player.gold += goldGained;
    inv.splice(idx, 1);
    engine.addLog(`出售 ${item.name}: +${goldGained}G`);
    return [true, `${item.name} 已出售! +${goldGained}G`, goldGained];
  }

  // ═════════════════════════════════════
  // 材料买卖
  // ═════════════════════════════════════

  /** 购买材料（单价1G） */
  static buyMaterial(
    engine: GameEngine,
    material: string,
    amount: number
  ): [boolean, string] {
    const cost = amount; // 1G per unit
    if (engine.player.gold < cost) {
      return [false, `金币不足! 需要 ${cost}G`];
    }
    engine.player.gold -= cost;
    engine.resources[material] = (engine.resources[material] ?? 0) + amount;
    engine.addLog(`购买材料: ${material} x${amount} (-${cost}G)`);
    return [true, `${material} x${amount} 已购入!`];
  }

  /** 出售材料（单价1G） */
  static sellMaterial(
    engine: GameEngine,
    material: string,
    amount: number
  ): [boolean, string] {
    const owned = engine.resources[material] ?? 0;
    if (owned < amount) {
      return [false, `${material} 数量不足! (拥有: ${owned})`];
    }
    engine.resources[material] = owned - amount;
    const goldGained = amount;
    engine.player.gold += goldGained;
    engine.addLog(`出售材料: ${material} x${amount} (+${goldGained}G)`);
    return [true, `${material} x${amount} 已售出! +${goldGained}G`];
  }

  // ═════════════════════════════════════
  // 工资系统（tick驱动）
  // ═════════════════════════════════════

  private static lastWageTime: number = 0;
  private static readonly WAGE_INTERVAL_MS: number = 60 * 1000; // 60秒
  private static readonly WAGE_PER_WORKER: number = 10; // 每人10G

  /** 每tick检查并扣除工资 */
  static tickWages(engine: GameEngine): void {
    const now = Date.now();
    if (EconomySystem.lastWageTime === 0) {
      EconomySystem.lastWageTime = now;
      return;
    }
    if (now - EconomySystem.lastWageTime < EconomySystem.WAGE_INTERVAL_MS) {
      return;
    }
    EconomySystem.lastWageTime = now;

    // 统计总劳工数
    let totalWorkers = 0;
    for (const workers of Object.values(engine.buildingWorkers)) {
      for (const count of workers) {
        totalWorkers += count;
      }
    }

    if (totalWorkers === 0) return;

    const totalWage = totalWorkers * EconomySystem.WAGE_PER_WORKER;
    if (engine.player.gold >= totalWage) {
      engine.player.gold -= totalWage;
      engine.addLog(`💰 支付工资: ${totalWage}G (${totalWorkers}个劳工)`);
    } else {
      // 金币不足，解雇所有劳工
      engine.addLog(`⚠️ 金币不足支付工资! 解雇所有劳工!`);
      for (const name of Object.keys(engine.buildingWorkers)) {
        engine.buildingWorkers[name] = engine.buildingWorkers[name].map(() => 0);
      }
    }
  }
}
