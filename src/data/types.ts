/**
 * 游戏数据类型定义
 */

// 掉落物
export interface Drops {
  [key: string]: number;
}

// 怪物数据
export interface Monster {
  name: string;
  hp: number;
  atk: number;    // 对应 Python 中的 attack
  def: number;    // 对应 Python 中的 defense
  exp: number;
  gold: number;
  drops: Drops;
  level?: number;     // 等级（可选，用于计算稀有度）
  rarity?: number;    // 稀有度 0-4
  isBoss?: boolean;   // 是否为 Boss
}

// 地图数据
export interface GameMap {
  name: string;
  description: string;
  minLevel: number;
  enemies: string[];   // 怪物名称列表（引用 MONSTERS）
  bosses: string[];     // Boss 名称列表（引用 MONSTERS）
  unlockCost: number;
}
