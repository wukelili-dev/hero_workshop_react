import type { HeroStats, Equipment } from '../types';

// 强化倍率表 [+0, +1, ..., +10]
const FORTIFY_MULTS: number[] = [1.0, 1.12, 1.25, 1.39, 1.54, 1.70, 1.87, 2.05, 2.24, 2.44, 2.65];

// 计算升级所需经验
function getExpNeeded(level: number): number {
  return 50 * level + 10 * level * level;
}

// 计算基础最大HP（不含装备）
function getBaseMaxHp(level: number): number {
  return Math.floor(80 + level * 18 + Math.floor(level / 5) * 5);
}

// 计算基础攻击力（不含装备）
function getBaseAttack(level: number): number {
  return Math.floor(5 + level * 2 + Math.floor(level / 5));
}

// 计算基础防御力（不含装备）
function getBaseDefense(level: number): number {
  return Math.floor(2 + level + Math.floor(level / 5));
}

export interface HeroState {
  level: number;
  exp: number;
  gold: number;
  maxHp: number;
  hp: number;
  baseAtk: number;
  baseDef: number;
  weapon: Equipment | null;
  armor: Equipment | null;
  inventory: Record<string, number>; // itemId: quantity
}

export class Hero {
  private state: HeroState;

  constructor() {
    this.state = {
      level: 1,
      exp: 0,
      gold: 100,
      maxHp: getBaseMaxHp(1),
      hp: getBaseMaxHp(1),
      baseAtk: getBaseAttack(1),
      baseDef: getBaseDefense(1),
      weapon: null,
      armor: null,
      inventory: {},
    };
  }

  // 获取当前属性（含装备加成）
  getStats(): HeroStats {
    const stats: HeroStats = {
      level: this.state.level,
      exp: this.state.exp,
      expToNext: getExpNeeded(this.state.level),
      hp: this.state.hp,
      atk: this.state.baseAtk,
      def: this.state.baseDef,
      spd: 10 + this.state.level * 0.5,
      crit: 0.05 + this.state.level * 0.002,
      critDmg: 1.5,
    };

    // 装备加成
    if (this.state.weapon) {
      const w = this.state.weapon;
      const mult = FORTIFY_MULTS[w.enhanceLevel || 0] || 1.0;
      if (w.stats.atk) stats.atk += Math.floor(w.stats.atk * mult);
      if (w.stats.def) stats.def += Math.floor(w.stats.def * mult);
      if (w.stats.hp) stats.hp = Math.floor(stats.hp + w.stats.hp * mult);
    }
    if (this.state.armor) {
      const a = this.state.armor;
      const mult = FORTIFY_MULTS[a.enhanceLevel || 0] || 1.0;
      if (a.stats.atk) stats.atk += Math.floor(a.stats.atk * mult);
      if (a.stats.def) stats.def += Math.floor(a.stats.def * mult);
      if (a.stats.hp) stats.hp = Math.floor(stats.hp + a.stats.hp * mult);
    }

    return stats;
  }

  // 添加经验（返回是否升级）
  addExp(amount: number): { leveledUp: boolean; newLevel: number } {
    this.state.exp += amount;
    let leveledUp = false;
    while (this.state.exp >= getExpNeeded(this.state.level)) {
      this.state.exp -= getExpNeeded(this.state.level);
      this.state.level++;
      this.state.maxHp = getBaseMaxHp(this.state.level);
      this.state.hp = this.state.maxHp; // 升级回满血
      this.state.baseAtk = getBaseAttack(this.state.level);
      this.state.baseDef = getBaseDefense(this.state.level);
      leveledUp = true;
    }
    return { leveledUp, newLevel: this.state.level };
  }

  // 穿戴装备
  equip(item: Equipment): void {
    if (item.type === 'weapon') {
      this.state.weapon = item;
    } else if (item.type === 'armor') {
      this.state.armor = item;
    }
  }

  // 卸下装备
  unequip(slot: 'weapon' | 'armor'): Equipment | null {
    if (slot === 'weapon') {
      const w = this.state.weapon;
      this.state.weapon = null;
      return w;
    } else {
      const a = this.state.armor;
      this.state.armor = null;
      return a;
    }
  }

  // 获取状态
  getState(): HeroState {
    return { ...this.state };
  }

  // 扣除金币
  spendGold(amount: number): boolean {
    if (this.state.gold < amount) return false;
    this.state.gold -= amount;
    return true;
  }

  // 获得金币
  earnGold(amount: number): void {
    this.state.gold += amount;
  }

  // 受到伤害
  takeDamage(dmg: number): boolean {
    this.state.hp = Math.max(0, this.state.hp - dmg);
    return this.state.hp <= 0; // 返回是否死亡
  }

  // 治疗
  heal(amount: number): void {
    this.state.hp = Math.min(this.state.maxHp, this.state.hp + amount);
  }

  // 添加物品到背包
  addItem(itemId: string, quantity: number = 1): void {
    this.state.inventory[itemId] = (this.state.inventory[itemId] || 0) + quantity;
  }

  // 从背包移除物品
  removeItem(itemId: string, quantity: number = 1): boolean {
    if (!this.state.inventory[itemId] || this.state.inventory[itemId] < quantity) {
      return false;
    }
    this.state.inventory[itemId] -= quantity;
    if (this.state.inventory[itemId] <= 0) {
      delete this.state.inventory[itemId];
    }
    return true;
  }
}

// 创建初始英雄
export function createHero(): Hero {
  return new Hero();
}
