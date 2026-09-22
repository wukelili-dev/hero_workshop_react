// ============ 地形类型 ============
export type TerrainType = 'plain' | 'hill' | 'mountain' | 'water' | 'forest' | 'underworld' | 'plateau';

export const TERRAIN_NAMES: Record<TerrainType, string> = {
  plain: '平原',
  hill: '丘陵',
  mountain: '山地',
  water: '水域',
  forest: '森林',
  underworld: '幽冥',
  plateau: '高原',
};

export const TERRAIN_COLORS: Record<TerrainType, string> = {
  plain: '#a8d5a2',
  hill: '#c2b280',
  mountain: '#8B7355',
  water: '#7EC8E3',
  forest: '#2E8B57',
  underworld: '#4B0082',
  plateau: '#DAA520',
};

// ============ 节点类型 ============
export type NodeType = 'city' | 'sect' | 'dungeon' | 'village' | 'resource' | 'encounter';

// ============ 世界节点 ============
export interface WorldNode {
  id: string;
  name: string;
  type: NodeType;
  terrain: TerrainType;
  level: number; // 推荐等级
  x: number; // 网格坐标 x (用于渲染)
  y: number; // 网格坐标 y
  npcs: string[]; // NPC id 列表
  monsters?: string[]; // 战斗地图用
  boss?: string;
  description: string;
  isUnlocked?: boolean;
  minLevel?: number;
  unlockCost?: number;
}

// ============ 节点连接 ============
export interface WorldEdge {
  from: string;
  to: string;
  terrain: TerrainType;
  baseDays: number; // 基础天数
  isBidirectional: boolean;
  requirements?: string[]; // 特殊要求（如「需船只」）
}

// ============ 中原地区节点 (11主 + 10 minor) ============
export const CENTRAL_PLAIN_NODES: WorldNode[] = [
  // === 主节点 ===
  {
    id: 'changan',
    name: '长安',
    type: 'city',
    terrain: 'plain',
    level: 0,
    x: 3,
    y: 3,
    npcs: ['changan_zhang', 'changan_li', 'changan_wang', 'changan_mysterious', 'changan_fortune', 'changan_erlang', 'changan_guanyin', 'changan_weizheng', 'changan_tangwang', 'changan_xuanzang'],
    description: '大唐国都，天下繁华之所',
    isUnlocked: true,
    minLevel: 0,
    unlockCost: 0,
  },
  {
    id: 'datangdong',
    name: '大唐东',
    type: 'dungeon',
    terrain: 'plain',
    level: 11,
    x: 5,
    y: 3,
    npcs: [],
    monsters: ['太监', '失控的银甲唐兵', '失控的金甲唐兵', '唐兵统领'],
    boss: '千年蛇魅',
    description: '大唐东部边境，守卫森严',
    minLevel: 11,
    unlockCost: 500,
  },
  {
    id: 'datangnan',
    name: '大唐南',
    type: 'dungeon',
    terrain: 'hill',
    level: 20,
    x: 5,
    y: 5,
    npcs: [],
    monsters: ['绝色剑客', '江州衙役', '风流剑客'],
    boss: '高丽密探',
    description: '大唐南部，山林密布',
    minLevel: 20,
    unlockCost: 1500,
  },
  {
    id: 'aolai',
    name: '傲来国',
    type: 'dungeon',
    terrain: 'plain',
    level: 1,
    x: 1,
    y: 3,
    npcs: [],
    monsters: ['蝴蝶', '鹦鹉', '龙虾', '巨蟹'],
    boss: '九头精怪',
    description: '东海之滨的小国，物产丰饶',
    minLevel: 1,
    unlockCost: 0,
  },

  // === Minor 节点 (m1-m10) ===
  {
    id: 'm1_baqiao',
    name: '灞桥驿',
    type: 'village',
    terrain: 'plain',
    level: 0,
    x: 2,
    y: 3,
    npcs: [],
    description: '长安东边的驿站，旅人休憩之所',
  },
  {
    id: 'm2_zhongnan',
    name: '终南山',
    type: 'resource',
    terrain: 'hill',
    level: 5,
    x: 2,
    y: 2,
    npcs: [],
    description: '终南山脉，草药丰富',
  },
  {
    id: 'm3_lantian',
    name: '蓝田镇',
    type: 'village',
    terrain: 'plain',
    level: 8,
    x: 3,
    y: 2,
    npcs: [],
    description: '蓝田美玉产地，有铁匠铺',
  },
  {
    id: 'm4_tongguan',
    name: '潼关',
    type: 'village',
    terrain: 'mountain',
    level: 10,
    x: 4,
    y: 2,
    npcs: [],
    description: '险要关隘，驻军盘查',
  },
  {
    id: 'm5_weishui',
    name: '渭水渡',
    type: 'village',
    terrain: 'water',
    level: 12,
    x: 4,
    y: 4,
    npcs: [],
    description: '渭水河畔的渡口，需船只通行',
  },
  {
    id: 'm6_shangyu',
    name: '商於古道',
    type: 'encounter',
    terrain: 'mountain',
    level: 15,
    x: 5,
    y: 4,
    npcs: [],
    description: '古商道，传说有隐士出没',
  },
  {
    id: 'm7_wuguan',
    name: '武关',
    type: 'village',
    terrain: 'mountain',
    level: 18,
    x: 6,
    y: 5,
    npcs: [],
    description: '南境关隘，波斯商人过往',
  },
  {
    id: 'm8_lishan',
    name: '骊山',
    type: 'resource',
    terrain: 'hill',
    level: 5,
    x: 3,
    y: 4,
    npcs: [],
    description: '温泉胜地，疗养恢复之所',
  },
  {
    id: 'm9_qujiang',
    name: '曲江池',
    type: 'encounter',
    terrain: 'plain',
    level: 8,
    x: 2,
    y: 4,
    npcs: [],
    description: '长安东南部，宴游之地',
  },
  {
    id: 'm10_xianyang',
    name: '咸阳古道',
    type: 'village',
    terrain: 'plain',
    level: 10,
    x: 4,
    y: 5,
    npcs: [],
    description: '旧时咸阳，今为交通要道',
  },
];

// ============ 中原地区连接 ============
export const CENTRAL_PLAIN_EDGES: WorldEdge[] = [
  // 长安及周边
  { from: 'changan', to: 'm1_baqiao', terrain: 'plain', baseDays: 1, isBidirectional: true },
  { from: 'changan', to: 'm8_lishan', terrain: 'hill', baseDays: 1, isBidirectional: true },
  { from: 'changan', to: 'm9_qujiang', terrain: 'plain', baseDays: 1, isBidirectional: true },
  { from: 'changan', to: 'aolai', terrain: 'water', baseDays: 2, isBidirectional: true, requirements: ['需船只'] },

  // 灞桥驿分支
  { from: 'm1_baqiao', to: 'm2_zhongnan', terrain: 'hill', baseDays: 1, isBidirectional: true },
  { from: 'm1_baqiao', to: 'm3_lantian', terrain: 'plain', baseDays: 1, isBidirectional: true },

  // 终南山 → 蓝田镇 → 潼关 → 大唐东
  { from: 'm2_zhongnan', to: 'm3_lantian', terrain: 'plain', baseDays: 1, isBidirectional: true },
  { from: 'm3_lantian', to: 'm4_tongguan', terrain: 'mountain', baseDays: 2, isBidirectional: true },
  { from: 'm4_tongguan', to: 'datangdong', terrain: 'plain', baseDays: 1, isBidirectional: true },

  // 渭水渡分支
  { from: 'changan', to: 'm5_weishui', terrain: 'plain', baseDays: 1, isBidirectional: true },
  { from: 'm5_weishui', to: 'm6_shangyu', terrain: 'mountain', baseDays: 2, isBidirectional: true },
  { from: 'm5_weishui', to: 'm10_xianyang', terrain: 'plain', baseDays: 1, isBidirectional: true },

  // 商於古道 → 大唐南
  { from: 'm6_shangyu', to: 'datangnan', terrain: 'hill', baseDays: 2, isBidirectional: true },
  { from: 'm6_shangyu', to: 'm7_wuguan', terrain: 'mountain', baseDays: 2, isBidirectional: true },

  // 武关 → 大唐南
  { from: 'm7_wuguan', to: 'datangnan', terrain: 'hill', baseDays: 1, isBidirectional: true },

  // 曲江池 → 咸阳古道 → 大唐南
  { from: 'm9_qujiang', to: 'm10_xianyang', terrain: 'plain', baseDays: 1, isBidirectional: true },
  { from: 'm10_xianyang', to: 'datangnan', terrain: 'hill', baseDays: 2, isBidirectional: true },

  // 骊山 → 渭水渡
  { from: 'm8_lishan', to: 'm5_weishui', terrain: 'plain', baseDays: 1, isBidirectional: true },
];

// ============ 获取节点 by ID ============
export function getNodeById(id: string): WorldNode | undefined {
  return CENTRAL_PLAIN_NODES.find(n => n.id === id);
}

// ============ 获取相邻节点 ============
export function getNeighbors(nodeId: string): string[] {
  const neighbors: string[] = [];
  CENTRAL_PLAIN_EDGES.forEach(edge => {
    if (edge.from === nodeId) neighbors.push(edge.to);
    if (edge.isBidirectional && edge.to === nodeId) neighbors.push(edge.from);
  });
  return neighbors;
}

// ============ 获取连接信息 ============
export function getEdge(from: string, to: string): WorldEdge | undefined {
  return CENTRAL_PLAIN_EDGES.find(e =>
    (e.from === from && e.to === to) ||
    (e.isBidirectional && e.from === to && e.to === from)
  );
}

// ============ 简易路径查找 (BFS) ============
export function findPath(startId: string, endId: string): string[] | null {
  const visited = new Set<string>();
  const queue: { nodeId: string; path: string[] }[] = [{ nodeId: startId, path: [startId] }];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current.nodeId === endId) return current.path;

    visited.add(current.nodeId);
    const neighbors = getNeighbors(current.nodeId);
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        queue.push({ nodeId: neighbor, path: [...current.path, neighbor] });
      }
    }
  }
  return null;
}

// ============ 计算路径总天数 ============
export function calcPathDays(path: string[]): number {
  let total = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const edge = getEdge(path[i], path[i + 1]);
    if (edge) total += edge.baseDays;
  }
  return total;
}
