// ============================================================
// 勇者工坊 - 全局类型定义
// ============================================================

// ── 稀有度 ──
export type Rarity = 0 | 1 | 2 | 3 | 4;  // 白/绿/蓝/紫/橙

export const RARITY_NAME: Record<Rarity, string> = {
  0: '普通', 1: '稀有', 2: '珍稀', 3: '史诗', 4: '传说',
};

export const RARITY_COLOR: Record<Rarity, string> = {
  0: '#C0C0C0', 1: '#4CAF50', 2: '#2196F3', 3: '#9370DB', 4: '#FF9800',
};

// ── 装备 ──
export type EquipmentType = 'weapon' | 'armor';

export interface Equipment {
  id: string;
  type: EquipmentType;
  name: string;
  tier: number;
  levelReq?: number;
  rarity: Rarity;
  rarityColor?: string;
  stats?: {
    atk?: number;
    def?: number;
    hp?: number;
    crit?: number;
    critDmg?: number;
  };
  enhanceLevel?: number;
  cost?: Record<string, number>;
  passiveId?: string;
  sellPrice?: number;
  isPerfect?: boolean;
  fortifyLevel?: number;
  // snake_case aliases for legacy consumers
  attack?: number;
  defense?: number;
  critRate?: number;
  critDmg?: number;
  hpBonus?: number;
  special?: string;
  forge_level?: number;
  is_perfect?: boolean;
  crit_rate?: number;
  crit_dmg?: number;
  hp_bonus?: number;
  sell_price?: number;
}

// ── 锻造 ──
export interface FortifyConfig {
  level: number;
  costGold: number;
  successRate: number;
  materials: Record<string, number>;
}

// ── 英雄/队友 ──
export interface HeroState {
  name: string;
  level: number;
  exp: number;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  critRate: number;
  critDmg: number;
  gold: number;
  weapon: Equipment | null;
  armor: Equipment | null;
  passives: string[];
  noveltyItems: string[];
  team: TeamMember[];  // 队友列表
  discoveredMonsters: string[];  // 已发现的怪物ID列表
  kills: number;              // 击杀数
  potions: number;  // 药水数量
}

export interface TeamMember {
  roleName: string;
  level: number;
  maxHp: number;
  hp: number;
  atk: number;
  def: number;
  isElite: boolean;
}

// ── 牧场 ──
export interface RanchCreature {
  id: string;
  name: string;
  icon: string;
  desc: string;
  rarity: Rarity;
  price: number;
  feedCost: number;
  personality: string;
  outputType: string;
  outputDesc: string;
  growthStages: string[];
  special: string;
}

export interface RanchSlotState {
  creatureId: string | null;
  boughtAt: number;
  fedAt: number;
  harvestCount: number;
}

// ── 农场 ──
export interface PlantData {
  id: string;
  name: string;
  icon: string;
  desc: string;
  rarity: Rarity;
  seedCost: number;
  growTime: number;      // 秒
  harvestInterval: number; // 秒
  seedYield: number;
  matureLifespan: number; // 秒，0=永久
  seasons: string[];
  outputDesc: string;
}

export interface FarmPlotState {
  plantId: string | null;
  plantedAt: number | null;
  lastHarvest: number | null;
  fertilizerCount: number;
}

// ── 工厂 ──
export interface DepartmentConfig {
  id: string;
  name: string;
  costGold: number;
  costResources: Record<string, number>;
  bonusFactor: number;
  desc: string;
  built?: boolean;
}

export interface WorkerConfig {
  hireCost: Record<string, number>;
  outputBonus: number;
  wage: number;
  wageInterval: number;
  maxWorkersPerLevel: Record<number, number>;
}

export interface FactoryDepartmentState {
  departmentId: string;
  level: number;
  workerCount: number;
  built: boolean;
  lastProduceAt: number;
}

// ── 建筑 ──
export interface BuildingConfig {
  name: string;
  desc: string;
  buildCost: { gold: number; resources: Record<string, number> };
  upgradeCost: { gold: number; resources: Record<string, number> };
  isWonder: boolean;
}

export interface BuildingState {
  id: string;
  level: number;
  lastCollectAt: number;
  workers: number;
}

// ── 地图 & 战斗 ──
export interface DropItem {
  itemId: string;
  chance: number;      // 0-1
  quantity: [number, number]; // [min, max]
}

export interface Monster {
  id: string;
  name: string;
  hp: number;
  atk: number;
  def: number;
  expReward: number;
  goldReward: number;
  drops: DropItem[];
  level?: number;
  rarity?: Rarity;
  isBoss?: boolean;
  icon?: string;
}

export interface GameMap {
  id: string;
  name: string;
  description?: string;
  minLevel: number;
  monsters: Monster[];
  boss: Monster;
  unlockCost: number;
  bgColor?: string;
}

// ── 酒馆 ──
export interface EquipmentItem {
  type: EquipmentType;
  name: string;
  attack?: number;
  defense?: number;
  hpBonus?: number;
  critRate?: number;
  critDmg?: number;
  rarity: string;
  rarityColor: string;
  sellPrice: number;
  levelReq: number;
  isPerfect: boolean;
}

export interface TavernRecruit {
  roleName: string;
  level: number;
  isElite: boolean;
  cost: number;
  gear: EquipmentItem[];
}

export interface TeamState {
  members: TeamMember[];
  currentIdx: number;
  tavernRoster: TavernRecruit[];
  tavernLastRefresh: number;
}

// ── 资源 ──
export interface Resources {
  wood?: number;
  iron?: number;
  hide?: number;
  stone?: number;
  herb?: number;
  [key: string]: number | undefined;
}

// ── 游戏存档 ──
export interface GameSave {
  version: string;
  timestamp: number;
  hero: HeroState;
  team: TeamState;
  ranch: RanchSlotState[];
  farm: FarmPlotState[];
  factory: FactoryDepartmentState[];
  buildings: BuildingState[];
  resources: Resources;
  currentMapId: string;
  log: string[];
}
