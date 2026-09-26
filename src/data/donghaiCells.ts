/**
 * donghaiCells — 东海区域 7×7 棋盘格子数据（世界广度 R6）
 * cell id = `dh_x_y`，龙宫（dh_3_3）居中，四周水域/岛屿。
 */
import type { MapCell } from './cellMap';

export const DONGHAI_CELLS: MapCell[] = [
  // 第 0 行（北）
  { id: 'dh_0_0', x: 0, y: 0, terrain: 'water', features: [], isRevealed: true, elevation: 0 },
  { id: 'dh_1_0', x: 1, y: 0, terrain: 'water', features: [
    { type: 'monster', id: 'dh_patrol', monsterIds: ['sea_serpent'], spawnRate: 0.5, minLevel: 25, maxLevel: 30, icon: '🐟', label: '巡海夜叉' },
  ], isRevealed: false, elevation: 0 },
  { id: 'dh_2_0', x: 2, y: 0, terrain: 'water', features: [
    { type: 'resource', id: 'dh_pearl', resourceType: 'pearl', gatherCount: 6, icon: '🦪', label: '珍珠贝床' },
  ], isRevealed: false, elevation: 0 },
  { id: 'dh_3_0', x: 3, y: 0, terrain: 'water', features: [], isRevealed: false, elevation: 0 },
  { id: 'dh_4_0', x: 4, y: 0, terrain: 'water', features: [
    { type: 'monster', id: 'dh_shark', monsterIds: ['sea_serpent'], spawnRate: 0.5, minLevel: 27, maxLevel: 32, icon: '🦈', label: '鲨群' },
  ], isRevealed: false, elevation: 0 },
  { id: 'dh_5_0', x: 5, y: 0, terrain: 'celestial', features: [
    { type: 'event', id: 'dh_whirlpool', eventId: 'visit_dragon_king', icon: '🌀', label: '大漩涡', description: '通往龙宫的漩涡' },
  ], isRevealed: false, elevation: 1 },
  { id: 'dh_6_0', x: 6, y: 0, terrain: 'water', features: [], isRevealed: false, elevation: 0 },

  // 第 1 行
  { id: 'dh_0_1', x: 0, y: 1, terrain: 'water', features: [
    { type: 'resource', id: 'dh_coral', resourceType: 'coral', gatherCount: 5, icon: '🪸', label: '珊瑚礁' },
  ], isRevealed: false, elevation: 0 },
  { id: 'dh_1_1', x: 1, y: 1, terrain: 'water', features: [], isRevealed: false, elevation: 0 },
  { id: 'dh_2_1', x: 2, y: 1, terrain: 'mountain', features: [
    { type: 'resource', id: 'dh_island_iron', resourceType: 'iron_ore', gatherCount: 4, icon: '⛏️', label: '海岛铁矿' },
  ], isRevealed: false, elevation: 2 },
  { id: 'dh_3_1', x: 3, y: 1, terrain: 'plains', features: [
    { type: 'resource', id: 'dh_island_herb', resourceType: 'herbs', gatherCount: 8, icon: '🌿', label: '仙岛药草' },
  ], isRevealed: true, elevation: 0 },
  { id: 'dh_4_1', x: 4, y: 1, terrain: 'water', features: [
    { type: 'monster', id: 'dh_jellyfish', monsterIds: ['sea_serpent'], spawnRate: 0.6, minLevel: 26, maxLevel: 31, icon: '🎐', label: '水母群' },
  ], isRevealed: false, elevation: 0 },
  { id: 'dh_5_1', x: 5, y: 1, terrain: 'water', features: [], isRevealed: false, elevation: 0 },
  { id: 'dh_6_1', x: 6, y: 1, terrain: 'mountain', features: [
    { type: 'dungeon', id: 'dh_island_tomb', dungeonId: 'donghai', icon: '⚰️', label: '海屿古墓' },
  ], isRevealed: false, elevation: 3 },

  // 第 2 行
  { id: 'dh_0_2', x: 0, y: 2, terrain: 'water', features: [
    { type: 'npc', id: 'dh_old_turtle', npcId: 'donghai_turtle', icon: '🐢', label: '老龟仙人', description: '活了千年的老龟' },
  ], isRevealed: false, elevation: 0 },
  { id: 'dh_1_2', x: 1, y: 2, terrain: 'water', features: [], isRevealed: false, elevation: 0 },
  { id: 'dh_2_2', x: 2, y: 2, terrain: 'plains', features: [
    { type: 'monster', id: 'dh_crab', monsterIds: ['sea_serpent'], spawnRate: 0.5, minLevel: 25, maxLevel: 29, icon: '🦀', label: '巨蟹群' },
  ], isRevealed: false, elevation: 0 },
  { id: 'dh_3_2', x: 3, y: 2, terrain: 'water', features: [], isRevealed: false, elevation: 0 },
  { id: 'dh_4_2', x: 4, y: 2, terrain: 'water', features: [
    { type: 'event', id: 'dh_shipwreck', eventId: 'temple_exploration', icon: '🚢', label: '沉船残骸', description: '一艘沉没的商船' },
  ], isRevealed: false, elevation: 0 },
  { id: 'dh_5_2', x: 5, y: 2, terrain: 'plains', features: [
    { type: 'random', id: 'dh_island_encounter', eventPool: ['lost_traveler', 'treasure_chest', 'mysterious_stranger'], icon: '🏝️', label: '无人荒岛' },
  ], isRevealed: false, elevation: 0 },
  { id: 'dh_6_2', x: 6, y: 2, terrain: 'water', features: [], isRevealed: false, elevation: 0 },

  // 第 3 行（中）
  { id: 'dh_0_3', x: 0, y: 3, terrain: 'water', features: [
    { type: 'monster', id: 'dh_dragon', monsterIds: ['sea_serpent'], spawnRate: 0.4, minLevel: 28, maxLevel: 34, icon: '🐉', label: '蛟龙出没' },
  ], isRevealed: false, elevation: 0 },
  { id: 'dh_1_3', x: 1, y: 3, terrain: 'water', features: [], isRevealed: false, elevation: 0 },
  { id: 'dh_2_3', x: 2, y: 3, terrain: 'water', features: [
    { type: 'npc', id: 'dh_merchant', npcId: 'donghai_merchant', icon: '🐚', label: '海市商人', description: '往来海市的商人' },
  ], isRevealed: false, elevation: 0 },
  { id: 'dh_3_3', x: 3, y: 3, terrain: 'celestial', features: [
    { type: 'city', id: 'donghai_city', cityId: 'donghai', icon: '🌊', label: '东海龙宫', description: '龙王居所' },
  ], isRevealed: true, elevation: 0 },
  { id: 'dh_4_3', x: 4, y: 3, terrain: 'water', features: [
    { type: 'resource', id: 'dh_treasure', resourceType: 'coral', gatherCount: 5, icon: '💰', label: '沉船宝藏' },
  ], isRevealed: false, elevation: 0 },
  { id: 'dh_5_3', x: 5, y: 3, terrain: 'water', features: [
    { type: 'monster', id: 'dh_octopus', monsterIds: ['sea_serpent'], spawnRate: 0.6, minLevel: 27, maxLevel: 33, icon: '🐙', label: '章鱼海妖' },
  ], isRevealed: false, elevation: 0 },
  { id: 'dh_6_3', x: 6, y: 3, terrain: 'water', features: [], isRevealed: false, elevation: 0 },

  // 第 4 行
  { id: 'dh_0_4', x: 0, y: 4, terrain: 'water', features: [
    { type: 'random', id: 'dh_storm', eventPool: ['sandstorm', 'oasis', 'desert_spirit'], icon: '⛈️', label: '海上风暴' },
  ], isRevealed: false, elevation: 0 },
  { id: 'dh_1_4', x: 1, y: 4, terrain: 'water', features: [], isRevealed: false, elevation: 0 },
  { id: 'dh_2_4', x: 2, y: 4, terrain: 'plains', features: [
    { type: 'npc', id: 'dh_fisherman', npcId: 'donghai_fisherman', icon: '🎣', label: '渔翁', description: '海边打鱼的老翁' },
  ], isRevealed: false, elevation: 0 },
  { id: 'dh_3_4', x: 3, y: 4, terrain: 'water', features: [
    { type: 'resource', id: 'dh_fish', resourceType: 'fish', gatherCount: 10, icon: '🐠', label: '鱼群' },
  ], isRevealed: true, elevation: 0 },
  { id: 'dh_4_4', x: 4, y: 4, terrain: 'water', features: [], isRevealed: false, elevation: 0 },
  { id: 'dh_5_4', x: 5, y: 4, terrain: 'mountain', features: [
    { type: 'dungeon', id: 'dh_island_fort', dungeonId: 'donghai', icon: '🏰', label: '海屿要塞' },
  ], isRevealed: false, elevation: 3 },
  { id: 'dh_6_4', x: 6, y: 4, terrain: 'water', features: [
    { type: 'monster', id: 'dh_whale', monsterIds: ['sea_serpent'], spawnRate: 0.5, minLevel: 30, maxLevel: 36, icon: '🐋', label: '巨鲸' },
  ], isRevealed: false, elevation: 0 },

  // 第 5 行
  { id: 'dh_0_5', x: 0, y: 5, terrain: 'mountain', features: [
    { type: 'monster', id: 'dh_island_beast', monsterIds: ['sea_serpent'], spawnRate: 0.5, minLevel: 29, maxLevel: 35, icon: '🦎', label: '海岛巨蜥' },
  ], isRevealed: false, elevation: 2 },
  { id: 'dh_1_5', x: 1, y: 5, terrain: 'water', features: [], isRevealed: false, elevation: 0 },
  { id: 'dh_2_5', x: 2, y: 5, terrain: 'water', features: [
    { type: 'resource', id: 'dh_salt', resourceType: 'salt', gatherCount: 6, icon: '🧂', label: '海盐场' },
  ], isRevealed: false, elevation: 0 },
  { id: 'dh_3_5', x: 3, y: 5, terrain: 'water', features: [
    { type: 'event', id: 'dh_dragon_banquet', eventId: 'visit_dragon_king', icon: '🍶', label: '龙宫盛宴', description: '龙王设宴' },
  ], isRevealed: false, elevation: 0 },
  { id: 'dh_4_5', x: 4, y: 5, terrain: 'water', features: [], isRevealed: false, elevation: 0 },
  { id: 'dh_5_5', x: 5, y: 5, terrain: 'mountain', features: [
    { type: 'resource', id: 'dh_island_crystal', resourceType: 'crystal', gatherCount: 4, icon: '💎', label: '海屿晶矿' },
  ], isRevealed: false, elevation: 2 },
  { id: 'dh_6_5', x: 6, y: 5, terrain: 'water', features: [
    { type: 'monster', id: 'dh_ghost_ship', monsterIds: ['sea_serpent'], spawnRate: 0.6, minLevel: 31, maxLevel: 37, icon: '👻', label: '幽灵船' },
  ], isRevealed: false, elevation: 0 },

  // 第 6 行（南）
  { id: 'dh_0_6', x: 0, y: 6, terrain: 'mountain', features: [
    { type: 'dungeon', id: 'dh_island_ruin', dungeonId: 'donghai', icon: '🗿', label: '海外仙山' },
  ], isRevealed: false, elevation: 3 },
  { id: 'dh_1_6', x: 1, y: 6, terrain: 'water', features: [
    { type: 'random', id: 'dh_buried_ship', eventPool: ['treasure_chest', 'lost_traveler', 'mysterious_stranger'], icon: '🏺', label: '沉宝沉船' },
  ], isRevealed: false, elevation: 0 },
  { id: 'dh_2_6', x: 2, y: 6, terrain: 'water', features: [], isRevealed: false, elevation: 0 },
  { id: 'dh_3_6', x: 3, y: 6, terrain: 'water', features: [
    { type: 'npc', id: 'dh_innkeeper', npcId: 'donghai_fisherman', icon: '🦀', label: '蟹将', description: '龙宫守门蟹将' },
  ], isRevealed: false, elevation: 0 },
  { id: 'dh_4_6', x: 4, y: 6, terrain: 'water', features: [
    { type: 'monster', id: 'dh_kraken', monsterIds: ['sea_serpent'], spawnRate: 0.5, minLevel: 32, maxLevel: 38, icon: '🐙', label: '海怪' },
  ], isRevealed: false, elevation: 0 },
  { id: 'dh_5_6', x: 5, y: 6, terrain: 'mountain', features: [], isRevealed: false, elevation: 3 },
  { id: 'dh_6_6', x: 6, y: 6, terrain: 'water', features: [
    { type: 'event', id: 'dh_sunrise', eventId: 'visit_dragon_king', icon: '🌅', label: '海上日出', description: '东海尽头，日出扶桑' },
  ], isRevealed: false, elevation: 0 },
];
