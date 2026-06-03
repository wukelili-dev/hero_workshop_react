// ============================================
// 英雄工坊 React - 类型定义文件
// ============================================

// 稀有度: 0=白, 1=绿, 2=蓝, 3=紫, 4=橙
export type Rarity = 0 | 1 | 2 | 3 | 4;

// 稀有度显示配置
export interface RarityConfig {
  label: string;
  color: string;
  bgColor: string;
}

// 英雄属性
export interface HeroStats {
  hp: number;        // 生命值
  atk: number;       // 攻击力
  def: number;       // 防御力
  spd: number;       // 速度
  cri: number;       // 暴击率 (%)
  criDmg: number;    // 暴击伤害 (%)
  dodge: number;     // 闪避率 (%)
  accuracy: number;  // 命中率 (%)
}

// 掉落物
export interface Drop {
  itemId: string;
  name: string;
  dropRate: number;  // 掉落率 (%)
  minCount: number;
  maxCount: number;
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
  skills?: string[];     // 怪物技能ID列表
  description?: string;  // 怪物描述
}

// 地图
export interface GameMap {
  id: string;
  name: string;
  description?: string;
  minLevel: number;
  unlockCost: number;
  monsters: Monster[];
  boss?: Monster;
  backgroundImage?: string;
  recommendedPower?: number;  // 推荐战力
}

// 装备类型
export type EquipmentType = 'weapon' | 'armor' | 'accessory' | 'boots' | 'helmet';

// 装备
export interface Equipment {
  id: string;
  name: string;
  type: EquipmentType;
  rarity: Rarity;
  stats: HeroStats;
  passive?: string;       // 被动技能描述
  description?: string;
  icon?: string;          // 图标路径
  levelRequirement?: number;
  sellPrice?: number;     // 出售价格
}

// 英雄
export interface Hero {
  id: string;
  name: string;
  level: number;
  exp: number;
  expToNext: number;
  rarity: Rarity;
  stats: HeroStats;
  equipment: {
    weapon?: Equipment;
    armor?: Equipment;
    accessory?: Equipment;
    boots?: Equipment;
    helmet?: Equipment;
  };
  skills: string[];       // 技能ID列表
  createdAt: number;      // 创建时间戳
}

// 牧场生物性格 (8种)
export type CreaturePersonality = 
  | 'brave'      // 勇敢 - 产量+10%
  | 'gentle'     // 温顺 - 成熟时间-5%
  | 'naughty'    // 顽皮 - 有几率双倍产出
  | 'lazy'       // 懒惰 - 产量-10%
  | 'curious'    // 好奇 - 随机额外物品
  | 'shy'        // 害羞 - 需要更多关爱
  | 'aggressive' // 凶猛 - 产出高品质物品概率+15%
  | 'wise';      // 智慧 - 经验获取+20%

// 牧场生物
export interface RanchCreature {
  id: string;
  name: string;
  rarity: Rarity;
  produceInterval: number;    // 秒
  produceItem: string;
  personality: CreaturePersonality;
  mood: number;               // 心情值 0-100
  lastCollectTime: number;    // 上次收集时间戳
  description?: string;
  icon?: string;
}

// 植物
export interface Plant {
  id: string;
  name: string;
  growTime: number;           // 秒
  seasons: ('spring' | 'summer' | 'autumn' | 'winter')[];
  produceItem: string;
  produceCount: number;       // 每次收获数量
  maxHarvests: number;        // 最大收获次数
  currentHarvests: number;    // 当前已收获次数
  waterRequirement: number;   // 需水量 0-100
  fertilizerRequirement?: number;
  description?: string;
  icon?: string;
}

// 背包物品
export interface InventoryItem {
  itemId: string;
  name: string;
  count: number;
  type: 'material' | 'consumable' | 'equipment' | 'special';
  rarity: Rarity;
  description?: string;
  icon?: string;
  usable: boolean;
}

// 任务/成就
export interface Quest {
  id: string;
  name: string;
  description: string;
  type: 'main' | 'side' | 'daily' | 'achievement';
  requirements: {
    monsterKills?: { monsterId: string; count: number }[];
    itemCollect?: { itemId: string; count: number }[];
    levelReach?: number;
    mapUnlock?: string;
  };
  rewards: {
    exp: number;
    gold: number;
    items?: { itemId: string; count: number }[];
  };
  completed: boolean;
  claimed: boolean;
}

// 游戏存档
export interface GameSave {
  version: number;
  timestamp: number;
  hero: Hero;
  maps: GameMap[];
  inventory: InventoryItem[];
  ranchCreatures: RanchCreature[];
  plants: { plantId: string; plantedAt: number; locationId: string }[];
  quests: Quest[];
  unlockedMaps: string[];
  gold: number;
  settings?: {
    soundEnabled: boolean;
    musicEnabled: boolean;
    difficulty: 'easy' | 'normal' | 'hard';
  };
}

// UI状态类型
export interface GameUIState {
  currentScreen: 'main' | 'map' | 'battle' | 'ranch' | 'garden' | 'inventory' | 'hero' | 'quest';
  selectedMapId?: string;
  selectedMonsterId?: string;
  battleLog: string[];
  isBattleActive: boolean;
}

// 战斗动作
export interface BattleAction {
  type: 'attack' | 'skill' | 'item' | 'flee';
  damage?: number;
  heal?: number;
  message: string;
  critical?: boolean;
  dodge?: boolean;
}

// 战斗结果
export interface BattleResult {
  victory: boolean;
  expGained: number;
  goldGained: number;
  drops: { itemId: string; count: number }[];
  turnsUsed: number;
}

// 工具函数：获取稀有度配置
export const RARITY_CONFIG: Record<Rarity, RarityConfig> = {
  0: { label: '普通', color: '#ffffff', bgColor: '#808080' },
  1: { label: '优秀', color: '#00ff00', bgColor: '#1a3a1a' },
  2: { label: '精良', color: '#0080ff', bgColor: '#1a2a3a' },
  3: { label: '史诗', color: '#a000ff', bgColor: '#2a1a3a' },
  4: { label: '传说', color: '#ff8000', bgColor: '#3a2a1a' },
};

// 工具函数：计算战力
export function calculatePower(stats: HeroStats): number {
  return Math.floor(
    stats.hp * 0.1 +
    stats.atk * 2 +
    stats.def * 1.5 +
    stats.spd * 1.2 +
    stats.cri * 0.5 +
    stats.criDmg * 0.3 +
    stats.dodge * 0.3 +
    stats.accuracy * 0.3
  );
}
