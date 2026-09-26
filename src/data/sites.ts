/**
 * sites — 野外格子内容池（世界广度 R4）
 *
 * 每格按 seed = hash(regionId + cellId) 确定性抽取 1 个「主要内容」+ 0~1 个「附带内容」。
 * 同一格每次进游戏内容一致（可记忆）；跨区域/跨等级内容不同。
 * 禁止 Math.random() 直接决定格子内容。
 */
import { hash01 } from '../engine/hash';
import type { TerrainType } from './cellMap';
import type { ItemEffect } from '../types';
import { regionOf } from './regions';

export type SiteKind = 'monster' | 'gather' | 'encounter' | 'discovery' | 'npc' | 'dungeon' | 'landmark';

export interface SiteDef {
  id: string;
  kind: SiteKind;
  regionId: string;
  terrain: TerrainType[];
  levelRange: [number, number];
  weight: number;
  once?: boolean;
  payload?: {
    monsterIds?: string[];
    resourceType?: string;
    npcId?: string;
    dungeonMapId?: string;
    effect?: ItemEffect[];
    text?: string;
  };
}

// ── 中原内容池 ──

export const CENTRAL_SITES: SiteDef[] = [
  // 野怪（权重适中，保证 ≥40% 但不垄断）
  { id: 'cp_site_wolf', kind: 'monster', regionId: 'central_plain', terrain: ['forest', 'plains'], levelRange: [1, 8], weight: 4, payload: { monsterIds: ['灰狼', '毒蛇'] } },
  { id: 'cp_site_bandit', kind: 'monster', regionId: 'central_plain', terrain: ['plains', 'mountain'], levelRange: [3, 12], weight: 4, payload: { monsterIds: ['山贼'] } },
  { id: 'cp_site_tiger', kind: 'monster', regionId: 'central_plain', terrain: ['forest', 'mountain'], levelRange: [6, 15], weight: 3, payload: { monsterIds: ['山君'] } },
  { id: 'cp_site_snake', kind: 'monster', regionId: 'central_plain', terrain: ['forest', 'swamp'], levelRange: [4, 10], weight: 3, payload: { monsterIds: ['毒蛇', '灰狼'] } },
  { id: 'cp_site_river', kind: 'monster', regionId: 'central_plain', terrain: ['water'], levelRange: [5, 15], weight: 3, payload: { monsterIds: ['河妖'] } },
  { id: 'cp_site_lizard', kind: 'monster', regionId: 'central_plain', terrain: ['swamp', 'plains'], levelRange: [7, 18], weight: 3, payload: { monsterIds: ['沼泽巨蜥', '毒蛇'] } },
  // 采集（权重高，terrain 广覆盖，保证 ≥15%）
  { id: 'cp_site_herb', kind: 'gather', regionId: 'central_plain', terrain: ['plains', 'forest', 'swamp'], levelRange: [1, 20], weight: 5, payload: { resourceType: 'herbs' } },
  { id: 'cp_site_iron', kind: 'gather', regionId: 'central_plain', terrain: ['mountain', 'volcanic'], levelRange: [1, 20], weight: 5, payload: { resourceType: 'iron_ore' } },
  { id: 'cp_site_fish', kind: 'gather', regionId: 'central_plain', terrain: ['water'], levelRange: [1, 20], weight: 4, payload: { resourceType: 'fish' } },
  { id: 'cp_site_crystal', kind: 'gather', regionId: 'central_plain', terrain: ['mountain', 'celestial'], levelRange: [8, 20], weight: 4, payload: { resourceType: 'crystal' } },
  { id: 'cp_site_pearl', kind: 'gather', regionId: 'central_plain', terrain: ['water', 'swamp'], levelRange: [5, 20], weight: 3, payload: { resourceType: 'pearl' } },
  { id: 'cp_site_wild_herb', kind: 'gather', regionId: 'central_plain', terrain: ['plains', 'forest', 'mountain', 'water', 'swamp', 'desert', 'celestial', 'volcanic'], levelRange: [1, 20], weight: 4, payload: { resourceType: 'herbs' } },
  // 奇遇/发现（once，权重提升）
  { id: 'cp_site_temple', kind: 'discovery', regionId: 'central_plain', terrain: ['plains', 'mountain', 'forest'], levelRange: [5, 20], weight: 3, once: true, payload: { text: '一座荒废的古寺，墙上刻着半部残缺的经文。' } },
  { id: 'cp_site_immortal', kind: 'encounter', regionId: 'central_plain', terrain: ['celestial', 'mountain'], levelRange: [10, 20], weight: 3, once: true, payload: { text: '云雾中似有仙人指路，转瞬即逝。' } },
  { id: 'cp_site_treasure', kind: 'discovery', regionId: 'central_plain', terrain: ['forest', 'plains', 'swamp'], levelRange: [3, 20], weight: 3, once: true, payload: { text: '一具白骨旁，散落着半袋银钱。' } },
  { id: 'cp_site_battlefield', kind: 'encounter', regionId: 'central_plain', terrain: ['plains', 'desert'], levelRange: [5, 20], weight: 3, once: true, payload: { text: '一片古战场，锈蚀的兵刃散落一地。' } },
  // 遭遇 NPC
  { id: 'cp_site_merchant', kind: 'npc', regionId: 'central_plain', terrain: ['plains', 'desert'], levelRange: [1, 20], weight: 3, payload: { npcId: 'traveling_merchant' } },
  { id: 'cp_site_monk', kind: 'npc', regionId: 'central_plain', terrain: ['plains', 'mountain'], levelRange: [1, 20], weight: 3, payload: { npcId: 'wandering_monk' } },
  { id: 'cp_site_traveler', kind: 'npc', regionId: 'central_plain', terrain: ['plains', 'forest', 'mountain', 'water', 'swamp', 'desert', 'celestial', 'volcanic'], levelRange: [1, 20], weight: 3, payload: { npcId: 'traveling_merchant' } },
  // 副本（mountain 专属，权重高保证命中 1~2 个）
  { id: 'cp_site_fortress', kind: 'dungeon', regionId: 'central_plain', terrain: ['mountain'], levelRange: [8, 20], weight: 4, payload: { dungeonMapId: 'datangdong' } },
  { id: 'cp_site_tomb', kind: 'dungeon', regionId: 'central_plain', terrain: ['mountain', 'swamp'], levelRange: [12, 20], weight: 4, payload: { dungeonMapId: 'datangnan' } },
  { id: 'cp_site_cave', kind: 'dungeon', regionId: 'central_plain', terrain: ['plains', 'forest', 'mountain', 'desert', 'swamp'], levelRange: [8, 20], weight: 4, payload: { dungeonMapId: 'datangdong' } },
  // 地标
  { id: 'cp_site_landmark', kind: 'landmark', regionId: 'central_plain', terrain: ['plains', 'celestial'], levelRange: [1, 20], weight: 3, payload: { text: '一座无名古碑，风吹过，似有低语。' } },
];

// ── 河西内容池 ──

export const HEXI_SITES: SiteDef[] = [
  // 野怪
  { id: 'hx_site_scorpion', kind: 'monster', regionId: 'hexi', terrain: ['desert'], levelRange: [15, 25], weight: 4, payload: { monsterIds: ['沙虫', '毒蛇'] } },
  { id: 'hx_site_bandit', kind: 'monster', regionId: 'hexi', terrain: ['desert', 'plains'], levelRange: [16, 28], weight: 4, payload: { monsterIds: ['山贼', '沙虫'] } },
  { id: 'hx_site_wolf', kind: 'monster', regionId: 'hexi', terrain: ['desert', 'mountain'], levelRange: [18, 30], weight: 3, payload: { monsterIds: ['灰狼', '沙虫'] } },
  { id: 'hx_site_lizard', kind: 'monster', regionId: 'hexi', terrain: ['mountain', 'plains'], levelRange: [20, 33], weight: 3, payload: { monsterIds: ['沼泽巨蜥', '灰狼'] } },
  { id: 'hx_site_ghost', kind: 'monster', regionId: 'hexi', terrain: ['desert', 'mountain'], levelRange: [24, 35], weight: 3, payload: { monsterIds: ['沙虫', '沼泽巨蜥'] } },
  // 采集（权重高，广覆盖）
  { id: 'hx_site_jade', kind: 'gather', regionId: 'hexi', terrain: ['mountain', 'desert'], levelRange: [15, 35], weight: 5, payload: { resourceType: 'jade_ore' } },
  { id: 'hx_site_salt', kind: 'gather', regionId: 'hexi', terrain: ['desert', 'plains'], levelRange: [15, 35], weight: 5, payload: { resourceType: 'salt' } },
  { id: 'hx_site_herb', kind: 'gather', regionId: 'hexi', terrain: ['plains', 'desert'], levelRange: [15, 35], weight: 4, payload: { resourceType: 'herbs' } },
  { id: 'hx_site_iron', kind: 'gather', regionId: 'hexi', terrain: ['mountain'], levelRange: [15, 35], weight: 4, payload: { resourceType: 'iron_ore' } },
  { id: 'hx_site_wild', kind: 'gather', regionId: 'hexi', terrain: ['desert', 'mountain', 'plains'], levelRange: [15, 35], weight: 4, payload: { resourceType: 'herbs' } },
  // 奇遇/发现（权重提升）
  { id: 'hx_site_ruins', kind: 'discovery', regionId: 'hexi', terrain: ['desert'], levelRange: [18, 35], weight: 3, once: true, payload: { text: '黄沙掩埋的楼兰故城，残垣断壁间似有宝光。' } },
  { id: 'hx_site_mirage', kind: 'encounter', regionId: 'hexi', terrain: ['desert'], levelRange: [16, 35], weight: 3, once: true, payload: { text: '海市蜃楼中，恍惚可见一座繁华古城。' } },
  { id: 'hx_site_buried', kind: 'discovery', regionId: 'hexi', terrain: ['desert', 'mountain'], levelRange: [20, 35], weight: 3, once: true, payload: { text: '流沙古冢露出一角，似有珍宝。' } },
  { id: 'hx_site_oasis', kind: 'encounter', regionId: 'hexi', terrain: ['desert', 'plains'], levelRange: [16, 35], weight: 3, once: true, payload: { text: '一片绿洲，泉水甘冽，旅人得救。' } },
  // 遭遇 NPC
  { id: 'hx_site_caravan', kind: 'npc', regionId: 'hexi', terrain: ['desert', 'plains'], levelRange: [15, 35], weight: 3, payload: { npcId: 'yangguan_merchant' } },
  { id: 'hx_site_hermit', kind: 'npc', regionId: 'hexi', terrain: ['desert', 'mountain'], levelRange: [18, 35], weight: 3, payload: { npcId: 'yangguan_hermit' } },
  { id: 'hx_site_guard', kind: 'npc', regionId: 'hexi', terrain: ['desert', 'mountain', 'plains'], levelRange: [15, 35], weight: 3, payload: { npcId: 'yangguan_guard' } },
  // 副本
  { id: 'hx_site_mogao', kind: 'dungeon', regionId: 'hexi', terrain: ['mountain'], levelRange: [20, 35], weight: 4, payload: { dungeonMapId: 'yangguan' } },
  { id: 'hx_site_gaochang', kind: 'dungeon', regionId: 'hexi', terrain: ['desert', 'mountain'], levelRange: [25, 35], weight: 4, payload: { dungeonMapId: 'yangguan' } },
  { id: 'hx_site_ruin_cave', kind: 'dungeon', regionId: 'hexi', terrain: ['desert', 'mountain', 'plains'], levelRange: [20, 35], weight: 4, payload: { dungeonMapId: 'yangguan' } },
  // 地标
  { id: 'hx_site_sunset', kind: 'landmark', regionId: 'hexi', terrain: ['desert'], levelRange: [15, 35], weight: 3, payload: { text: '大漠尽头，长河落日，壮美如画。' } },
];

export const ALL_SITES: SiteDef[] = [...CENTRAL_SITES, ...HEXI_SITES];

export function sitesOfRegion(regionId: string): SiteDef[] {
  return ALL_SITES.filter((s) => s.regionId === regionId);
}

/** 按地形 + 等级过滤可选内容池 */
function filterSites(sites: SiteDef[], terrain: TerrainType, level: number): SiteDef[] {
  return sites.filter(
    (s) =>
      s.terrain.includes(terrain) &&
      level >= s.levelRange[0] &&
      level <= s.levelRange[1]
  );
}

/**
 * 为某格确定性抽取主要内容（确定性密度分配，保证 contentBudget 达标）。
 *
 * 算法：
 * 1. 区域所有格子按 seed=hash(regionId+cellId) 排序；
 * 2. 把 contentBudget 展开成 kind 队列（monster×N, gather×N, …）；
 * 3. 按序给格子分配 kind，地形不匹配（该地形无此 kind site）的格子顺延重试；
 * 4. 兜底未匹配的格子 → 该地形可用的 monster/gather。
 *
 * 这样各类内容占比精确符合预算，且 seed 保证确定性、跨等级内容新鲜。
 */
export function assignSiteKinds(regionId: string, cells: { id: string; terrain: TerrainType }[], level: number): Map<string, SiteDef> {
  const sites = sitesOfRegion(regionId);
  const region = regionOf(regionId);
  const budget = region?.contentBudget ?? { monster: 20, gather: 8, encounter: 6, discovery: 6, npc: 4, dungeon: 2 };

  // kind 队列（按 budget 展开）
  const queue: SiteKind[] = [];
  for (const k of ['monster', 'gather', 'encounter', 'discovery', 'npc', 'dungeon'] as SiteKind[]) {
    const n = (budget as any)[k] ?? 0;
    for (let i = 0; i < n; i++) queue.push(k);
  }

  // 格子按 seed 确定性排序
  const sorted = [...cells].sort((a, b) => hash01(`${regionId}:${a.id}`) - hash01(`${regionId}:${b.id}`));

  const result = new Map<string, SiteDef>();
  const pending: typeof cells = [];

  // 第一轮：按队列分配，地形不匹配的顺延
  for (const cell of sorted) {
    if (queue.length === 0) { pending.push(cell); continue; }
    const kind = queue.shift()!;
    const pool = filterSites(sites, cell.terrain, level).filter((s) => s.kind === kind);
    if (pool.length === 0) {
      // 该地形无此 kind site：把 kind 放回队尾，格子顺延
      queue.push(kind);
      pending.push(cell);
    } else {
      const site = pickWeighted(pool, hash01(`${regionId}:${cell.id}:pick`));
      result.set(cell.id, site);
    }
  }

  // 第二轮：兜底未匹配格子 → 该地形可用的 monster/gather（或任意）
  for (const cell of pending) {
    const pool = filterSites(sites, cell.terrain, level);
    const fallback = pool.filter((s) => s.kind === 'monster' || s.kind === 'gather');
    const target = fallback.length > 0 ? fallback : pool;
    if (target.length > 0) {
      result.set(cell.id, pickWeighted(target, hash01(`${regionId}:${cell.id}:fb`)));
    }
  }

  return result;
}

/** 单格查询入口：由 assignSiteKinds 的结果查询（供 UI 层按需调用） */
export function pickSiteForCell(regionId: string, cellId: string, terrain: TerrainType, level: number): SiteDef | null {
  const region = regionOf(regionId);
  if (!region) return null;
  // 单格查询无法精确复现全局分配，退化为：该地形可用池内按预算权重抽（确定性）
  const sites = sitesOfRegion(regionId);
  const budget = region.contentBudget;
  const kinds: { kind: SiteKind; count: number }[] = [
    { kind: 'monster', count: budget.monster },
    { kind: 'gather', count: budget.gather },
    { kind: 'encounter', count: budget.encounter },
    { kind: 'discovery', count: budget.discovery },
    { kind: 'npc', count: budget.npc },
    { kind: 'dungeon', count: budget.dungeon },
  ];
  const terrainPool = filterSites(sites, terrain, level);
  const avail = kinds.filter((k) => terrainPool.some((s) => s.kind === k.kind));
  if (avail.length === 0) return null;
  const total = avail.reduce((s, k) => s + k.count, 0);
  const seed = hash01(`${regionId}:${cellId}`);
  let roll = seed * total;
  let targetKind = avail[avail.length - 1].kind;
  for (const k of avail) { roll -= k.count; if (roll <= 0) { targetKind = k.kind; break; } }
  const pool = terrainPool.filter((s) => s.kind === targetKind);
  if (pool.length === 0) return null;
  return pickWeighted(pool, seed);
}

/** 加权抽取（确定性） */
function pickWeighted(pool: SiteDef[], seed: number): SiteDef {
  const total = pool.reduce((sum, s) => sum + s.weight, 0);
  let r = (seed * 7919) % 1 * total;
  let chosen = pool[pool.length - 1];
  for (const s of pool) {
    r -= s.weight;
    if (r <= 0) { chosen = s; break; }
  }
  return chosen;
}

/** 已发现 site 的世界旗标 key */
export function siteFlagKey(siteId: string): string {
  return `site:${siteId}`;
}
