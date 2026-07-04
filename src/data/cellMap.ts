// ============ 棋盘式格子地图系统 ============
// 太吾绘卷风格：等距视角，每个格子独立场景

export type TerrainType = 
  | 'plains'      // 平原
  | 'forest'      // 森林
  | 'mountain'    // 山地
  | 'water'       // 水域
  | 'swamp'       // 沼泽
  | 'desert'      // 荒漠
  | 'snow'        // 雪原
  | 'volcanic'    // 火山
  | 'celestial';  // 仙境

export type FeatureType = 
  | 'npc'         // NPC
  | 'monster'     // 怪物
  | 'event'       // 固定事件
  | 'random'      // 随机奇遇
  | 'resource'    // 采集点
  | 'dungeon'     // 副本入口
  | 'city'        // 城市
  | 'sect';       // 门派

export interface CellFeature {
  type: FeatureType;
  id: string;
  // NPC
  npcId?: string;
  // 怪物
  monsterIds?: string[];
  spawnRate?: number;      // 0-1 刷新概率
  minLevel?: number;
  maxLevel?: number;
  // 事件
  eventId?: string;
  eventPool?: string[];
  // 采集
  resourceType?: string;
  gatherCount?: number;    // 可采集次数
  // 副本
  dungeonId?: string;
  // 城市/门派
  cityId?: string;
  sectId?: string;
  // 显示
  icon: string;            // emoji 或图标名
  label: string;           // 显示名称
  description?: string;    // 描述
}

export interface MapCell {
  id: string;
  x: number;               // 网格 X 坐标
  y: number;               // 网格 Y 坐标
  terrain: TerrainType;
  features: CellFeature[]; // 格子内容
  
  // 视觉
  elevation?: number;      // 海拔（0-3，影响渲染层级）
  isRevealed: boolean;     // 是否已探索
  isVisited: boolean;      // 是否已访问
  
  // 连接（用于路径计算）
  connections?: string[];  // 相邻格子 ID
}

export interface MapRegion {
  id: string;
  name: string;
  description: string;
  levelRange: [number, number]; // 等级范围
  cells: MapCell[];
  centerCellId: string;    // 中心格子（出生点）
  
  // 区域特性
  weatherEffect?: string;  // 天气效果
  specialEvents?: string[]; // 区域特殊事件
}

// ============ 地形配置 ============
export const TERRAIN_CONFIG: Record<TerrainType, {
  name: string;
  color: string;
  gradient: string;
  moveCost: number;        // 移动消耗天数
  encounterRate: number;   // 遇敌概率
  description: string;
}> = {
  plains: {
    name: '平原',
    color: '#90EE90',
    gradient: 'linear-gradient(135deg, #a8e6cf 0%, #7fcdcd 100%)',
    moveCost: 1,
    encounterRate: 0.2,
    description: '一望无际的平原，适合快速通行',
  },
  forest: {
    name: '森林',
    color: '#228B22',
    gradient: 'linear-gradient(135deg, #2d5a27 0%, #1a3d1a 100%)',
    moveCost: 1.5,
    encounterRate: 0.4,
    description: '茂密的森林，容易迷路',
  },
  mountain: {
    name: '山地',
    color: '#8B7355',
    gradient: 'linear-gradient(135deg, #8B7355 0%, #696969 100%)',
    moveCost: 2,
    encounterRate: 0.3,
    description: '崎岖的山路，行进缓慢',
  },
  water: {
    name: '水域',
    color: '#4682B4',
    gradient: 'linear-gradient(135deg, #4682B4 0%, #1E90FF 100%)',
    moveCost: 3,
    encounterRate: 0.25,
    description: '需要渡船才能通过',
  },
  swamp: {
    name: '沼泽',
    color: '#556B2F',
    gradient: 'linear-gradient(135deg, #556B2F 0%, #2F4F4F 100%)',
    moveCost: 2.5,
    encounterRate: 0.5,
    description: '危险的沼泽，有毒虫出没',
  },
  desert: {
    name: '荒漠',
    color: '#F4A460',
    gradient: 'linear-gradient(135deg, #F4A460 0%, #D2691E 100%)',
    moveCost: 2,
    encounterRate: 0.15,
    description: '酷热的沙漠，水源稀缺',
  },
  snow: {
    name: '雪原',
    color: '#F0F8FF',
    gradient: 'linear-gradient(135deg, #F0F8FF 0%, #B0C4DE 100%)',
    moveCost: 2,
    encounterRate: 0.2,
    description: '寒冷的雪原，需要御寒装备',
  },
  volcanic: {
    name: '火山',
    color: '#FF4500',
    gradient: 'linear-gradient(135deg, #FF4500 0%, #8B0000 100%)',
    moveCost: 3,
    encounterRate: 0.6,
    description: '活跃的火山地带，极度危险',
  },
  celestial: {
    name: '仙境',
    color: '#FFD700',
    gradient: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
    moveCost: 1,
    encounterRate: 0.1,
    description: '仙气缭绕的福地',
  },
};

// ============ 中原地区 - 7x7 棋盘 ============
export const CENTRAL_PLAIN_CELLS: MapCell[] = [
  // 第 0 行（北）
  { id: 'cp_0_0', x: 0, y: 0, terrain: 'mountain', features: [], isRevealed: true, elevation: 2 },
  { id: 'cp_1_0', x: 1, y: 0, terrain: 'mountain', features: [
    { type: 'resource', id: 'iron_mine', resourceType: 'iron_ore', gatherCount: 5, icon: '⛏️', label: '铁矿' }
  ], isRevealed: true, elevation: 2 },
  { id: 'cp_2_0', x: 2, y: 0, terrain: 'forest', features: [
    { type: 'monster', id: 'wolf_pack', monsterIds: ['wolf'], spawnRate: 0.7, minLevel: 3, maxLevel: 5, icon: '🐺', label: '狼群' }
  ], isRevealed: false, elevation: 1 },
  { id: 'cp_3_0', x: 3, y: 0, terrain: 'plains', features: [
    { type: 'city', id: 'changan', cityId: 'changan', icon: '🏯', label: '长安城', description: '大唐国都，繁华似锦' }
  ], isRevealed: true, elevation: 0 },
  { id: 'cp_4_0', x: 4, y: 0, terrain: 'forest', features: [], isRevealed: false, elevation: 1 },
  { id: 'cp_5_0', x: 5, y: 0, terrain: 'water', features: [
    { type: 'monster', id: 'river_monster', monsterIds: ['water_spirit'], spawnRate: 0.5, minLevel: 5, maxLevel: 8, icon: '🌊', label: '河妖' }
  ], isRevealed: false, elevation: 0 },
  { id: 'cp_6_0', x: 6, y: 0, terrain: 'plains', features: [
    { type: 'npc', id: 'farmer_li', npcId: 'changan_farmer', icon: '👨‍🌾', label: '李老汉', description: '种了一辈子地的老农' }
  ], isRevealed: false, elevation: 0 },

  // 第 1 行
  { id: 'cp_0_1', x: 0, y: 1, terrain: 'mountain', features: [
    { type: 'sect', id: 'huashan', sectId: 'huashan', icon: '⚔️', label: '华山派', description: '五岳剑派之一' }
  ], isRevealed: true, elevation: 3 },
  { id: 'cp_1_1', x: 1, y: 1, terrain: 'forest', features: [
    { type: 'random', id: 'forest_event', eventPool: ['bandit_ambush', 'lost_traveler', 'treasure_chest'], icon: '❓', label: '密林深处' }
  ], isRevealed: false, elevation: 1 },
  { id: 'cp_2_1', x: 2, y: 1, terrain: 'plains', features: [
    { type: 'npc', id: 'merchant_wang', npcId: 'traveling_merchant', icon: '🐪', label: '行商王老板', description: '走南闯北的商人' }
  ], isRevealed: false, elevation: 0 },
  { id: 'cp_3_1', x: 3, y: 1, terrain: 'plains', features: [
    { type: 'resource', id: 'herb_field', resourceType: 'herbs', gatherCount: 10, icon: '🌿', label: '药草田' }
  ], isRevealed: true, elevation: 0 },
  { id: 'cp_4_1', x: 4, y: 1, terrain: 'plains', features: [
    { type: 'monster', id: 'bandit_camp', monsterIds: ['bandit'], spawnRate: 0.6, minLevel: 4, maxLevel: 6, icon: '⚔️', label: '强盗营地' }
  ], isRevealed: false, elevation: 0 },
  { id: 'cp_5_1', x: 5, y: 1, terrain: 'plains', features: [
    { type: 'city', id: 'yangguan', cityId: 'yangguan', icon: '🏘️', label: '阳关', description: '西域门户' }
  ], isRevealed: true, elevation: 0 },
  { id: 'cp_6_1', x: 6, y: 1, terrain: 'desert', features: [
    { type: 'random', id: 'desert_event', eventPool: ['sandstorm', 'oasis', 'desert_spirit'], icon: '🏜️', label: '大漠' }
  ], isRevealed: false, elevation: 0 },

  // 第 2 行
  { id: 'cp_0_2', x: 0, y: 2, terrain: 'forest', features: [
    { type: 'monster', id: 'tiger_mountain', monsterIds: ['tiger'], spawnRate: 0.5, minLevel: 6, maxLevel: 9, icon: '🐅', label: '虎啸山林' }
  ], isRevealed: false, elevation: 1 },
  { id: 'cp_1_2', x: 1, y: 2, terrain: 'plains', features: [], isRevealed: false, elevation: 0 },
  { id: 'cp_2_2', x: 2, y: 2, terrain: 'plains', features: [
    { type: 'npc', id: 'monk_bodhi', npcId: 'wandering_monk', icon: '🧘', label: '菩提老僧', description: '云游四方的得道高僧' }
  ], isRevealed: false, elevation: 0 },
  { id: 'cp_3_2', x: 3, y: 2, terrain: 'plains', features: [
    { type: 'event', id: 'abandoned_temple', eventId: 'temple_exploration', icon: '🛕', label: '废弃寺庙', description: '似乎隐藏着什么秘密' }
  ], isRevealed: false, elevation: 0 },
  { id: 'cp_4_2', x: 4, y: 2, terrain: 'water', features: [
    { type: 'resource', id: 'fishing_spot', resourceType: 'fish', gatherCount: 8, icon: '🎣', label: '钓鱼点' }
  ], isRevealed: false, elevation: 0 },
  { id: 'cp_5_2', x: 5, y: 2, terrain: 'plains', features: [], isRevealed: false, elevation: 0 },
  { id: 'cp_6_2', x: 6, y: 2, terrain: 'mountain', features: [
    { type: 'dungeon', id: 'bandit_fortress', dungeonId: 'bandit_stronghold', icon: '🏰', label: '匪寨', description: '强盗的老巢' }
  ], isRevealed: false, elevation: 2 },

  // 第 3 行（中）
  { id: 'cp_0_3', x: 0, y: 3, terrain: 'water', features: [
    { type: 'monster', id: 'lake_monster', monsterIds: ['water_dragon'], spawnRate: 0.3, minLevel: 10, maxLevel: 15, icon: '🐉', label: '湖底蛟龙' }
  ], isRevealed: false, elevation: 0 },
  { id: 'cp_1_3', x: 1, y: 3, terrain: 'plains', features: [
    { type: 'city', id: 'datang_east', cityId: 'datang_east', icon: '🏘️', label: '大唐东', description: '东方重镇' }
  ], isRevealed: true, elevation: 0 },
  { id: 'cp_2_3', x: 2, y: 3, terrain: 'plains', features: [], isRevealed: false, elevation: 0 },
  { id: 'cp_3_3', x: 3, y: 3, terrain: 'celestial', features: [
    { type: 'event', id: 'immortal_encounter', eventId: 'meet_immortal', icon: '☁️', label: '仙人指路', description: '有缘者方能得见' }
  ], isRevealed: false, elevation: 1 },
  { id: 'cp_4_3', x: 4, y: 3, terrain: 'plains', features: [], isRevealed: false, elevation: 0 },
  { id: 'cp_5_3', x: 5, y: 3, terrain: 'city', features: [
    { type: 'city', id: 'datang_south', cityId: 'datang_south', icon: '🏘️', label: '大唐南', description: '南方商埠' }
  ], isRevealed: true, elevation: 0 },
  { id: 'cp_6_3', x: 6, y: 3, terrain: 'forest', features: [
    { type: 'monster', id: 'poison_snake', monsterIds: ['poison_snake'], spawnRate: 0.8, minLevel: 5, maxLevel: 8, icon: '🐍', label: '毒蛇谷' }
  ], isRevealed: false, elevation: 1 },

  // 第 4 行
  { id: 'cp_0_4', x: 0, y: 4, terrain: 'swamp', features: [
    { type: 'monster', id: 'swamp_creature', monsterIds: ['swamp_beast'], spawnRate: 0.6, minLevel: 7, maxLevel: 10, icon: '🦎', label: '沼泽怪兽' }
  ], isRevealed: false, elevation: 0 },
  { id: 'cp_1_4', x: 1, y: 4, terrain: 'forest', features: [], isRevealed: false, elevation: 1 },
  { id: 'cp_2_4', x: 2, y: 4, terrain: 'mountain', features: [
    { type: 'resource', id: 'crystal_cave', resourceType: 'crystal', gatherCount: 3, icon: '💎', label: '水晶矿洞' }
  ], isRevealed: false, elevation: 2 },
  { id: 'cp_3_4', x: 3, y: 4, terrain: 'plains', features: [
    { type: 'npc', id: 'hermit_sage', npcId: 'mountain_hermit', icon: '🧙', label: '山中隐士', description: '避世修行的老者' }
  ], isRevealed: false, elevation: 0 },
  { id: 'cp_4_4', x: 4, y: 4, terrain: 'forest', features: [], isRevealed: false, elevation: 1 },
  { id: 'cp_5_4', x: 5, y: 4, terrain: 'plains', features: [
    { type: 'random', id: 'traveler_camp', eventPool: ['merchant_caravan', 'wounded_soldier', 'mysterious_stranger'], icon: '⛺', label: '旅人营地' }
  ], isRevealed: false, elevation: 0 },
  { id: 'cp_6_4', x: 6, y: 4, terrain: 'mountain', features: [
    { type: 'dungeon', id: 'ancient_tomb', dungeonId: 'tomb_of_kings', icon: '⚰️', label: '古墓', description: '千年古墓，机关重重' }
  ], isRevealed: false, elevation: 2 },

  // 第 5 行
  { id: 'cp_0_5', x: 0, y: 5, terrain: 'forest', features: [
    { type: 'monster', id: 'bear_cave', monsterIds: ['bear'], spawnRate: 0.5, minLevel: 8, maxLevel: 12, icon: '🐻', label: '熊洞' }
  ], isRevealed: false, elevation: 1 },
  { id: 'cp_1_5', x: 1, y: 5, terrain: 'plains', features: [], isRevealed: false, elevation: 0 },
  { id: 'cp_2_5', x: 2, y: 5, terrain: 'plains', features: [
    { type: 'city', id: 'aolai', cityId: 'aolai', icon: '🏘️', label: '傲来国', description: '花果山下的国度' }
  ], isRevealed: true, elevation: 0 },
  { id: 'cp_3_5', x: 3, y: 5, terrain: 'mountain', features: [
    { type: 'sect', id: 'huaguoshan', sectId: 'monkey_king_sect', icon: '🐵', label: '花果山', description: '齐天大圣的故乡' }
  ], isRevealed: true, elevation: 3 },
  { id: 'cp_4_5', x: 4, y: 5, terrain: 'forest', features: [
    { type: 'monster', id: 'monkey_troop', monsterIds: ['monkey_warrior'], spawnRate: 0.7, minLevel: 6, maxLevel: 10, icon: '🐒', label: '猴群' }
  ], isRevealed: false, elevation: 1 },
  { id: 'cp_5_5', x: 5, y: 5, terrain: 'water', features: [
    { type: 'resource', id: 'pearl_bed', resourceType: 'pearl', gatherCount: 5, icon: '🦪', label: '珍珠贝床' }
  ], isRevealed: false, elevation: 0 },
  { id: 'cp_6_5', x: 6, y: 5, terrain: 'plains', features: [], isRevealed: false, elevation: 0 },

  // 第 6 行（南）
  { id: 'cp_0_6', x: 0, y: 6, terrain: 'volcanic', features: [
    { type: 'dungeon', id: 'fire_cave', dungeonId: 'volcano_depths', icon: '🌋', label: '火云洞', description: '火焰山深处' }
  ], isRevealed: false, elevation: 2 },
  { id: 'cp_1_6', x: 1, y: 6, terrain: 'desert', features: [
    { type: 'monster', id: 'sand_worm', monsterIds: ['sand_worm'], spawnRate: 0.4, minLevel: 10, maxLevel: 15, icon: '🐛', label: '沙虫' }
  ], isRevealed: false, elevation: 0 },
  { id: 'cp_2_6', x: 2, y: 6, terrain: 'plains', features: [], isRevealed: false, elevation: 0 },
  { id: 'cp_3_6', x: 3, y: 6, terrain: 'water', features: [
    { type: 'city', id: 'donghai', cityId: 'donghai', icon: '🌊', label: '东海龙宫', description: '龙王居所' }
  ], isRevealed: true, elevation: 0 },
  { id: 'cp_4_6', x: 4, y: 6, terrain: 'water', features: [
    { type: 'monster', id: 'sea_monster', monsterIds: ['sea_serpent'], spawnRate: 0.5, minLevel: 12, maxLevel: 18, icon: '🐋', label: '海怪' }
  ], isRevealed: false, elevation: 0 },
  { id: 'cp_5_6', x: 5, y: 6, terrain: 'celestial', features: [
    { type: 'event', id: 'dragon_palace', eventId: 'visit_dragon_king', icon: '🐲', label: '龙宫秘境', description: '龙王设宴' }
  ], isRevealed: false, elevation: 1 },
  { id: 'cp_6_6', x: 6, y: 6, terrain: 'water', features: [], isRevealed: false, elevation: 0 },
];

// ============ 中原地区配置 ============
export const CENTRAL_PLAIN_REGION: MapRegion = {
  id: 'central_plain',
  name: '中原地区',
  description: '大唐腹地，人烟稠密，但也暗藏危机',
  levelRange: [1, 20],
  cells: CENTRAL_PLAIN_CELLS,
  centerCellId: 'cp_3_0', // 长安城
  weatherEffect: 'none',
  specialEvents: ['imperial_exam', 'bandit_raid', 'immortal_encounter'],
};

// ============ 工具函数 ============
export function getCellById(id: string): MapCell | undefined {
  return CENTRAL_PLAIN_CELLS.find(c => c.id === id);
}

export function getCellByCoord(x: number, y: number): MapCell | undefined {
  return CENTRAL_PLAIN_CELLS.find(c => c.x === x && c.y === y);
}

export function getNeighbors(cellId: string): string[] {
  const cell = getCellById(cellId);
  if (!cell) return [];
  
  const neighbors: string[] = [];
  const directions = [
    { dx: 0, dy: -1 }, // 上
    { dx: 0, dy: 1 },  // 下
    { dx: -1, dy: 0 }, // 左
    { dx: 1, dy: 0 },  // 右
  ];
  
  for (const dir of directions) {
    const neighbor = getCellByCoord(cell.x + dir.dx, cell.y + dir.dy);
    if (neighbor) neighbors.push(neighbor.id);
  }
  
  return neighbors;
}

export function calcMoveCost(fromId: string, toId: string): number {
  const from = getCellById(fromId);
  const to = getCellById(toId);
  if (!from || !to) return 999;
  
  const t = TERRAIN_CONFIG[to.terrain];
  return t ? t.moveCost : 1;
}
