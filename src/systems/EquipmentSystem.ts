// @ts-nocheck — legacy system, data model incompatible with current types
import { Hero } from '../types';
import { Equipment } from '../types';
import * as Passives from '../engine/Passives';

/**
 * 装备系统：穿戴/脱下/背包管理/属性计算
 * 所有方法为静态方法，直接操作 Hero 对象
 */
export class EquipmentSystem {

  // ═════════════════════════════════════
  // 穿戴 / 脱下
  // ═════════════════════════════════════

  /**
   * 从背包穿戴装备（自动脱下同部位旧装备放回背包）
   * @returns [success, message]
   */
  static equipFromInventory(hero: Hero, index: number): [boolean, string] {
    const inv = hero.inventory;
    if (index < 0 || index >= inv.length) {
      return [false, "无效的背包位置!"];
    }
    const equip = inv[index];
    if (hero.level < (equip.level_req ?? 0)) {
      return [false, `等级不足! 需要 Lv.${equip.level_req}`];
    }
    if (equip.type === "weapon") {
      // 脱下旧武器
      if (hero.weapon) hero.inventory.push(hero.weapon);
      hero.weapon = equip;
    } else if (equip.type === "armor") {
      // 脱下旧护甲
      if (hero.armor) hero.inventory.push(hero.armor);
      hero.armor = equip;
    } else {
      return [false, "无法穿戴此物品!"];
    }
    // 从背包移除
    inv.splice(index, 1);
    return [true, `穿戴成功: ${equip.name}`];
  }

  /** 脱下武器放回背包 */
  static unequipWeapon(hero: Hero): [boolean, string] {
    if (!hero.weapon) return [false, "没有装备武器!"];
    if (hero.inventory.length >= 20) return [false, "背包已满!"];
    hero.inventory.push(hero.weapon);
    hero.weapon = null;
    return [true, "武器已脱下"];
  }

  /** 脱下护甲放回背包 */
  static unequipArmor(hero: Hero): [boolean, string] {
    if (!hero.armor) return [false, "没有装备护甲!"];
    if (hero.inventory.length >= 20) return [false, "背包已满!"];
    hero.inventory.push(hero.armor);
    hero.armor = null;
    return [true, "护甲已脱下"];
  }

  // ═════════════════════════════════════
  // 背包管理
  // ═════════════════════════════════════

  /** 添加装备到背包 */
  static addToInventory(hero: Hero, equip: Equipment): [boolean, string] {
    if (hero.inventory.length >= 20) {
      return [false, "背包已满! (最多20件)"];
    }
    hero.inventory.push(equip);
    return [true, `${equip.name} 已放入背包`];
  }

  /** 出售背包中指定index的物品 */
  static sellFromInventory(hero: Hero, index: number): [boolean, string, number] {
    const inv = hero.inventory;
    if (index < 0 || index >= inv.length) {
      return [false, "物品不存在!", 0];
    }
    const item = inv[index];
    const goldGained = item.sell_price ?? 0;
    hero.gold += goldGained;
    inv.splice(index, 1);
    return [true, `${item.name} 已出售! +${goldGained}G`, goldGained];
  }

  /** 背包是否已满 */
  static isInventoryFull(hero: Hero): boolean {
    return hero.inventory.length >= 20;
  }

  /** 获取背包物品数量 */
  static getInventoryCount(hero: Hero): number {
    return hero.inventory.length;
  }

  // ═════════════════════════════════════
  // 属性计算（含装备/强化/被动）
  // ═════════════════════════════════════

  /** 计算最终攻击力（基础 + 武器 + 被动%） */
  static calcFinalAttack(hero: Hero): number {
    const base = hero.attack;
    const weaponAtk = hero.weapon ? hero.weapon.attack : 0;
    const fortifyMult = EquipmentSystem._getFortifyMult(hero.weapon);
    const passiveBonus = Passives.calcPassiveStatBonus(hero);
    const raw = (base + weaponAtk * fortifyMult) * (1 + passiveBonus.atk_pct / 100);
    return Math.floor(raw);
  }

  /** 计算最终防御力（基础 + 护甲 + 被动%） */
  static calcFinalDefense(hero: Hero): number {
    const base = hero.defense;
    const armorDef = hero.armor ? hero.armor.defense : 0;
    const fortifyMult = EquipmentSystem._getFortifyMult(hero.armor);
    const passiveBonus = Passives.calcPassiveStatBonus(hero);
    const raw = (base + armorDef * fortifyMult) * (1 + passiveBonus.def_pct / 100);
    return Math.floor(raw);
  }

  /** 计算最终HP上限（基础 + 护甲 + 被动%） */
  static calcFinalMaxHP(hero: Hero): number {
    const base = hero.max_hp;
    const armorHP = hero.armor ? hero.armor.hp_bonus : 0;
    const passiveBonus = Passives.calcPassiveStatBonus(hero);
    const raw = (base + armorHP) * (1 + passiveBonus.hp_pct / 100);
    return Math.floor(raw);
  }

  /** 计算最终暴击率（武器 + 被动） */
  static calcFinalCritRate(hero: Hero): number {
    const weaponCrit = hero.weapon ? hero.weapon.crit_rate : 0;
    const passive = Passives.calcPassiveStatBonus(hero);
    return Math.min(100, weaponCrit + passive.dodge); // dodge字段复用为暴击率加成
  }

  /** 计算最终暴击伤害（武器 + 被动） */
  static calcFinalCritDmg(hero: Hero): number {
    const weaponCDmg = hero.weapon ? hero.weapon.crit_dmg : 150;
    const passive = Passives.calcPassiveStatBonus(hero);
    return weaponCDmg + passive.crit_bonus_pct;
  }

  /** 计算闪避率（被动） */
  static calcDodge(hero: Hero): number {
    const passive = Passives.calcPassiveStatBonus(hero);
    return passive.dodge;
  }

  // ═════════════════════════════════════
  // 强化倍率
  // ═════════════════════════════════════

  /** 获取装备强化倍率（from forge.py get_fortify_bonus） */
  private static _getFortifyMult(equip: Equipment | null): number {
    if (!equip) return 1.0;
    const level = equip.forge_level ?? 0;
    if (level <= 0) return 1.0;
    // 直接从 forge.ts data 导入
    try {
      const { getFortifyBonus } = require("../engine/ForgeSystem");
      return getFortifyBonus(level);
    } catch {
      // fallback: 手动计算
      const BONUS_TABLE: Record<number, number> = {
        1: 1.05, 2: 1.10, 3: 1.15, 4: 1.20, 5: 1.25,
        6: 1.30, 7: 1.40, 8: 1.50, 9: 1.65, 10: 1.80,
      };
      return BONUS_TABLE[level] ?? 1.0;
    }
  }

  // ═════════════════════════════════════
  // 套装效果（锻造套装）
  // ═════════════════════════════════════

  /** 获取英雄当前激活的套装效果 */
  static getActiveSetEffects(hero: Hero): any[] {
    const sets: Record<string, number> = {};
    [hero.weapon, hero.armor].forEach(eq => {
      if (eq && eq.forge_set) {
        sets[eq.forge_set] = (sets[eq.forge_set] ?? 0) + 1;
      }
    });
    const result: any[] = [];
    for (const [setName, count] of Object.entries(sets)) {
      // 从 data/forge.ts 导入 SET_EFFECTS
      try {
        const { SET_EFFECTS } = require("../data/forge");
        const effects = SET_EFFECTS[setName]?.effects ?? {};
        for (const [threshold, effect] of Object.entries(effects)) {
          if (count >= parseInt(threshold)) {
            result.push({ set: setName, threshold: parseInt(threshold), effect });
          }
        }
      } catch {}
    }
    return result;
  }
}
