/**
 * regions — 多区域世界骨架（世界广度 R1）
 *
 * 四层世界：World → Region → (City / 野外格子 / 内容池) ，区域之间由 RegionGate 连接。
 * - WorldRegion：一个 7×7 棋盘区域，含 1 座主城、通往其它区域的关隘、内容密度预算。
 * - RegionGate：关隘（官道 road / 渡口 ferry / 山关 pass），有通行门槛（等级/物品/声望）。
 * - CityDef：主城定义（势力 / NPC / 特产 / 物价基数 / 治安）。
 *
 * 格子坐标约定：cell id = `${regionPrefix}_${x}_${y}`。
 * 中原沿用既有 `cp_x_y`（不破坏已有 NPC/遭遇/商店挂载），河西用 `hx_x_y`。
 */
import type { TerrainType } from './cellMap';

export interface RegionGate {
  toRegionId: string;
  kind: 'road' | 'ferry' | 'pass';
  days: number;
  require?: { minLevel?: number; itemId?: string; factionRep?: { id: string; min: number } };
}

export interface RegionContentBudget {
  monster: number;
  gather: number;
  encounter: number;
  discovery: number;
  npc: number;
  dungeon: number;
}

export interface WorldRegion {
  id: string;
  name: string;
  description: string;
  levelRange: [number, number];
  size: number;
  /** 该区域常见地形（决定地图观感与内容池抽样） */
  terrainBias: TerrainType[];
  /** 格子 id 前缀（cell id = `${cellPrefix}_${x}_${y}`） */
  cellPrefix: string;
  /** 主城 id（对齐 data/maps.ts 的 MAPS id） */
  cityId: string;
  /** 中心格子（出生点 / 主城所在格） */
  centerCellId: string;
  gates: RegionGate[];
  contentBudget: RegionContentBudget;
}

export interface CitySpecialty {
  goodId: string;
  supply: number;
}

export interface CityDef {
  id: string;
  name: string;
  regionId: string;
  factionIds: string[];
  npcIds: string[];
  specialties: CitySpecialty[];
  priceIndex: number;
  /** 0~1，影响偷窃难度与街头事件 */
  security: number;
  description: string;
}

// ── 区域列表 ──

export const REGIONS: WorldRegion[] = [
  {
    id: 'central_plain',
    name: '中原',
    description: '大唐腹地，人烟稠密，四通八达，却也暗藏危机。',
    levelRange: [1, 20],
    size: 7,
    terrainBias: ['plains', 'forest', 'mountain'],
    cellPrefix: 'cp',
    cityId: 'changan',
    centerCellId: 'cp_3_0',
    gates: [
      { toRegionId: 'hexi', kind: 'pass', days: 2, require: { minLevel: 5 } },
    ],
    contentBudget: { monster: 20, gather: 9, encounter: 5, discovery: 5, npc: 3, dungeon: 2 },
  },
  {
    id: 'hexi',
    name: '河西',
    description: '西出阳关，大漠孤烟。边贸重镇，商旅驼队不绝于途。',
    levelRange: [15, 35],
    size: 7,
    terrainBias: ['desert', 'mountain', 'plains'],
    cellPrefix: 'hx',
    cityId: 'yangguan',
    centerCellId: 'hx_3_3',
    gates: [
      { toRegionId: 'central_plain', kind: 'road', days: 2, require: { minLevel: 5 } },
      { toRegionId: 'donghai', kind: 'ferry', days: 3, require: { minLevel: 20 } },
    ],
    contentBudget: { monster: 20, gather: 9, encounter: 5, discovery: 5, npc: 3, dungeon: 2 },
  },
  {
    id: 'donghai',
    name: '东海',
    description: '碧波万顷，龙宫巍峨。仙岛星罗，海市蜃楼隐现其间。',
    levelRange: [25, 45],
    size: 7,
    terrainBias: ['water', 'celestial', 'mountain'],
    cellPrefix: 'dh',
    cityId: 'donghai',
    centerCellId: 'dh_3_3',
    gates: [
      { toRegionId: 'hexi', kind: 'ferry', days: 3, require: { minLevel: 20 } },
    ],
    contentBudget: { monster: 20, gather: 9, encounter: 5, discovery: 5, npc: 3, dungeon: 2 },
  },
];

// ── 主城定义 ──

export const CITIES: CityDef[] = [
  {
    id: 'changan',
    name: '长安',
    regionId: 'central_plain',
    factionIds: ['changan_court', 'changan_guild', 'changan_escort', 'changan_temple'],
    npcIds: ['changan_blacksmith', 'changan_herbalist', 'changan_tavern', 'changan_biaotou', 'changan_embroidery', 'changan_gongsun', 'changan_qinqiong'],
    specialties: [
      { goodId: 'silk', supply: 3 },
      { goodId: 'porcelain', supply: 2 },
    ],
    priceIndex: 1.0,
    security: 0.9,
    description: '大唐国都，天下繁华之所。官府与商会并立，规矩森严。',
  },
  {
    id: 'yangguan',
    name: '阳关',
    regionId: 'hexi',
    factionIds: ['changan_escort'],
    npcIds: ['yangguan_merchant', 'yangguan_guard', 'yangguan_innkeeper'],
    specialties: [
      { goodId: 'jade', supply: 3 },
      { goodId: 'fur', supply: 2 },
    ],
    priceIndex: 1.25,
    security: 0.45,
    description: '西域门户，边贸驼队云集。鱼龙混杂，盗匪出没。',
  },
  {
    id: 'donghai',
    name: '东海龙宫',
    regionId: 'donghai',
    factionIds: [],
    npcIds: ['donghai_aoguang', 'donghai_turtle', 'donghai_merchant', 'donghai_fisherman'],
    specialties: [
      { goodId: 'pearl', supply: 4 },
      { goodId: 'salt', supply: 3 },
    ],
    priceIndex: 1.1,
    security: 0.7,
    description: '东海龙宫，敖广坐镇。虾兵蟹将侍立，海货丰饶。',
  },
];

// ── 查询工具 ──

export function regionOf(id: string): WorldRegion | undefined {
  return REGIONS.find((r) => r.id === id);
}

export function cityOf(id: string): CityDef | undefined {
  return CITIES.find((c) => c.id === id);
}

export function cityOfRegion(regionId: string): CityDef | undefined {
  return CITIES.find((c) => c.regionId === regionId);
}

export function regionOfCell(cellId: string): WorldRegion | undefined {
  return REGIONS.find((r) => cellId.startsWith(`${r.cellPrefix}_`));
}

export function regionOfCity(cityId: string): WorldRegion | undefined {
  const city = cityOf(cityId);
  return city ? regionOf(city.regionId) : undefined;
}

/** 某区域通往目标区域的关隘（可能 undefined） */
export function gateBetween(fromRegionId: string, toRegionId: string): RegionGate | undefined {
  const region = regionOf(fromRegionId);
  return region?.gates.find((g) => g.toRegionId === toRegionId);
}
