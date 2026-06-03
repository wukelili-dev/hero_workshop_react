// 稀有度: 0=白(普通), 1=绿(优秀), 2=蓝(精良), 3=紫(史诗), 4=橙(传说)
export type Rarity = 0 | 1 | 2 | 3 | 4;

// 稀有度颜色
export const RARITY_COLORS: Record<Rarity, string> = {
  0: '#9d9d9d', // 白
  1: '#1eff00', // 绿
  2: '#0070dd', // 蓝
  3: '#a335ee', // 紫
  4: '#ff8000', // 橙
};

// 稀有度名称
export const RARITY_NAMES: Record<Rarity, string> = {
  0: '普通',
  1: '优秀',
  2: '精良',
  3: '史诗',
  4: '传说',
};

// 英雄基础属性
export interface HeroStats {
  level: number;
  exp: number;
  expToNext: number;
  hp: number;
  atk: number;
  def: number;
  spd: number;
  crit: number; // 暴击率 0-1
  critDmg: number; // 暴击伤害倍率，默认1.5
}

// 掉落物品
export interface Drop {
  itemId: string;
  chance: number; // 0-1
  quantity: [number, number]; // [min, max]
}

// 怪物
export interface Monster {
  id: string;
  name: string;
  level: number;
  hp: number;
  atk: number;
  def: number;
  rarity: Rarity;
  drops: Drop[];
  expReward: number;
  goldReward: number;
  isBoss?: boolean;
}

// 地图
export interface GameMap {
  id: string;
  name: string;
  minLevel: number;
  unlockCost: number;
  monsters: Monster[];
  boss?: Monster;
}

// 装备
export interface Equipment {
  id: string;
  name: string;
  type: 'weapon' | 'armor';
  rarity: Rarity;
  tier: number; // 1-5
  stats: Partial<HeroStats>;
  passiveId?: string; // 关联被动技能ID
  enhanceLevel: number; // 强化等级 +0~+10
}

// 牧场生物
export interface RanchCreature {
  id: string;
  name: string;
  rarity: Rarity;
  produceInterval: number; // 秒
  produceItem: string;
  produceQuantity: number;
  personality: '乖巧' | '活泼' | '幸运' | '睿智' | '忠诚' | '暴躁' | '高傲' | '懒惰';
  feedCost: number; // 饲料消耗/次
}

// 植物
export interface Plant {
  id: string;
  name: string;
  growTime: number; // 秒
  seasons: ('spring' | 'summer' | 'autumn' | 'winter')[];
  coinOutput: number;
  feedOutput: number;
  seedCost: number;
}

// 背包物品
export interface InventoryItem {
  itemId: string;
  quantity: number;
}

// 战斗日志
export interface BattleLog {
  round: number;
  attacker: string;
  defender: string;
  damage: number;
  isCrit: boolean;
  description: string;
}

// 战斗结果
export interface BattleResult {
  victory: boolean;
  logs: BattleLog[];
  expGained: number;
  goldGained: number;
  drops: InventoryItem[];
}

export interface HeroPersonality {
  id: string;
  name: string;
  description: string;
  produceMultiplier: number;
  feedIntervalMultiplier: number;
}

export interface ForgeRecipe {
  id: string;
  name: string;
  materialCost: Record<string, number>; // itemId: quantity
  resultEquipmentId: string;
  passiveId?: string;
  setName?: string; // 套装名称
}

export interface GameState {
  hero: HeroStats;
  team: string[]; // 队伍英雄ID列表
  inventory: InventoryItem[];
  equipment: Equipment[];
  gold: number;
  materials: Record<string, number>;
  currentMapId: string;
  unlockedMapIds: string[];
  ranchCreatures: (RanchCreature & { instanceId: string })[];
  farmSlots: (Plant & { plantedAt: number; fertilizerCount: number })[];
  lastSave: number; // Date.now()
}
