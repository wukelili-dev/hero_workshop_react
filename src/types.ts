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

// ── 善恶值档位 ──
export type MoralLevel = 'saint' | 'good' | 'neutral' | 'evil' | 'demon';

// ── 派系亲和度 ──
export interface Factions {
  human: number;   // 人族 0~100
  demon: number;   // 妖族 0~100
  divine: number;  // 仙族 0~100
}

// ── 装备 ──
export type EquipmentType = 'weapon' | 'armor' | 'accessory' | 'consumable';

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
  special?: string | { name: string; value: number };
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
  backpack?: Array<{ name: string; icon?: string; description?: string }>;
  moralValue: number;         // -100 ~ +100，初始 0
  factions: Factions;         // 派系亲和度
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
  /** 所属派系类型，影响派系亲和度加成 */
  npcType?: 'normal' | 'demon' | 'human' | 'divine';
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
  /** 是否为城市地图（无怪物，显示 NPC） */
  isCity?: boolean;
}

// ── NPC 系统 ──
export type NpcType = 'merchant' | 'challenger' | 'flavor';

/** NPC 随身物品 */
export interface NpcPersonalItem {
  name: string;
  icon: string;
  description: string;
  sellPrice?: number;
}

/** NPC 图鉴（考据数据） */
export interface NpcBestiary {
  source: string;    // 出自
  era: string;       // 时代/背景
  notes: string;     // 补充注释
}

/** NPC 善恶对话（根据勇者善恶值档位显示不同对话） */
export interface NpcMoralDialogue {
  good?: string[];     // 善恶值 ≥ +50
  neutral?: string[];  // 善恶值 -49 ~ +49
  evil?: string[];     // 善恶值 ≤ -50
}

/** NPC 对话集（部分新NPC使用，旧NPC仍用 greetings/chatDialogues） */
export interface NpcDialogueSet {
  greet?: string[];
  chat?: string[];
  challenge?: string[];
}

/** 名角专属掉落：击败后获得一件隐藏神装 */
export interface NpcUniqueDrop {
  /** 获得时的文案 */
  message: string;
  /** 掉落的装备（含完整 stats） */
  equipment: Equipment;
}

/** NPC 静态定义（from data/npcs.ts） */
export interface NpcDefinition {
  id: string;
  name: string;
  title: string;               // "铁匠铺掌柜"
  type: NpcType;
  location: string;             // map ID
  description: string;
  avatarEmoji: string;          // "🔨"
  greetings: string[];          // 随机选取一句作为首次对话

  /** 商人：可售卖的物品列表 */
  tradeItems?: NpcTradeItem[];

  /** 挑战者：战斗属性 */
  challengeStats?: { hp: number; atk: number; def: number };
  /** 挑战者：胜利奖励 */
  challengeReward?: { exp: number; gold: number; message: string };

  /** 名角专属掉落：击败后获得一件隐藏神装（仅首次胜利掉落） */
  uniqueDrop?: NpcUniqueDrop;

  /** 闲聊对话池 */
  chatDialogues?: string[];

  /** 随身物品（击败/偷窃后可能获得） */
  personalItem?: NpcPersonalItem;

  /** 偷窃成功时附赠金币概率（默认0.2） */
  stealGoldChance?: number;
  /** 偷窃附赠金币最小值 */
  stealGoldMin?: number;
  /** 偷窃附赠金币最大值 */
  stealGoldMax?: number;

  /** 善恶对话（优先于普通闲聊显示） */
  moralDialogues?: NpcMoralDialogue;

  /** 新版对话集（与 greetings/chatDialogues 二选一） */
  dialogues?: NpcDialogueSet;

  /** 装备商品（部分新NPC使用） */
  goods?: Array<{ id: string; name: string; cost: number; icon: string; heal?: number }>;

  /** 隐藏解锁条件 */
  unlockCondition?: { kind: string; value: number; compare: string };

  /** 图鉴（考据数据） */
  bestiary?: NpcBestiary;

  /** 初始金币（用于NPC经济系统） */
  initialGold?: number;

  /** 偷窃难度修正（0~1，0=普通，0.5=困难，0.8=极难） */
  stealDifficulty?: number;
}

export interface NpcTradeItem {
  label: string;                // 显示名
  type: 'equipment' | 'potion' | 'material' | 'novelty';
  price: number;
  /** 如果是材料，对应资源 key */
  resourceKey?: string;
  /** 如果是药水，购买时触发的数量 */
  potionCount?: number;
  /** 对话前缀 */
  dialogue?: string;
}

/** NPC 运行时实例状态 */
export interface NpcInstance {
  npcId: string;
  state: 'idle' | 'defeated';
  defeatedCount: number;
  lastInteractedAt: number;
  /** 是否已听过问候语 */
  greeted: boolean;
  /** 运行时钱包余额（初始=initialGold） */
  gold: number;
  /** 亲密度 0~100 */
  affinity: number;
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
