/**
 * hexiCells — 河西区域 7×7 棋盘格子数据（世界广度 R1）
 * cell id = `hx_x_y`，与中原 `cp_x_y` 并列，接入统一的 getCellById 跨区域查找。
 */
import type { MapCell } from './cellMap';

// 河西 7×7 棋盘：阳关（hx_3_3）居中，四周荒漠/山地/绿洲
export const HEXI_CELLS: MapCell[] = [
  // 第 0 行（北）
  { id: 'hx_0_0', x: 0, y: 0, terrain: 'mountain', features: [], isRevealed: true, elevation: 3 },
  { id: 'hx_1_0', x: 1, y: 0, terrain: 'mountain', features: [
    { type: 'resource', id: 'hx_jade_mine', resourceType: 'jade_ore', gatherCount: 5, icon: '🟢', label: '玉石矿' },
  ], isRevealed: false, elevation: 2 },
  { id: 'hx_2_0', x: 2, y: 0, terrain: 'desert', features: [
    { type: 'monster', id: 'hx_scorpion', monsterIds: ['sand_worm'], spawnRate: 0.5, minLevel: 16, maxLevel: 20, icon: '🦂', label: '蝎群' },
  ], isRevealed: false, elevation: 0 },
  { id: 'hx_3_0', x: 3, y: 0, terrain: 'desert', features: [], isRevealed: false, elevation: 0 },
  { id: 'hx_4_0', x: 4, y: 0, terrain: 'mountain', features: [
    { type: 'dungeon', id: 'hx_mogao', dungeonId: 'yangguan', icon: '🛕', label: '莫高窟', description: '千佛洞，壁画斑驳' },
  ], isRevealed: false, elevation: 3 },
  { id: 'hx_5_0', x: 5, y: 0, terrain: 'desert', features: [
    { type: 'random', id: 'hx_mirage', eventPool: ['sandstorm', 'oasis', 'desert_spirit'], icon: '🏜️', label: '海市蜃楼' },
  ], isRevealed: false, elevation: 0 },
  { id: 'hx_6_0', x: 6, y: 0, terrain: 'mountain', features: [], isRevealed: false, elevation: 3 },

  // 第 1 行
  { id: 'hx_0_1', x: 0, y: 1, terrain: 'mountain', features: [
    { type: 'monster', id: 'hx_eagle', monsterIds: ['sand_worm'], spawnRate: 0.4, minLevel: 18, maxLevel: 22, icon: '🦅', label: '荒漠鹰巢' },
  ], isRevealed: false, elevation: 2 },
  { id: 'hx_1_1', x: 1, y: 1, terrain: 'desert', features: [], isRevealed: false, elevation: 0 },
  { id: 'hx_2_1', x: 2, y: 1, terrain: 'desert', features: [
    { type: 'resource', id: 'hx_oasis_herb', resourceType: 'herbs', gatherCount: 8, icon: '🌿', label: '绿洲药草' },
  ], isRevealed: false, elevation: 0 },
  { id: 'hx_3_1', x: 3, y: 1, terrain: 'plains', features: [
    { type: 'resource', id: 'hx_well', resourceType: 'water', gatherCount: 10, icon: '💧', label: '月牙泉' },
  ], isRevealed: true, elevation: 0 },
  { id: 'hx_4_1', x: 4, y: 1, terrain: 'desert', features: [
    { type: 'monster', id: 'hx_bandit', monsterIds: ['bandit'], spawnRate: 0.6, minLevel: 17, maxLevel: 21, icon: '⚔️', label: '马贼营地' },
  ], isRevealed: false, elevation: 0 },
  { id: 'hx_5_1', x: 5, y: 1, terrain: 'desert', features: [], isRevealed: false, elevation: 0 },
  { id: 'hx_6_1', x: 6, y: 1, terrain: 'mountain', features: [
    { type: 'resource', id: 'hx_crystal', resourceType: 'crystal', gatherCount: 4, icon: '💎', label: '晶石矿脉' },
  ], isRevealed: false, elevation: 2 },

  // 第 2 行
  { id: 'hx_0_2', x: 0, y: 2, terrain: 'desert', features: [
    { type: 'npc', id: 'hx_hermit', npcId: 'yangguan_hermit', icon: '🧙', label: '大漠隐者', description: '避世于大漠的术士' },
  ], isRevealed: false, elevation: 0 },
  { id: 'hx_1_2', x: 1, y: 2, terrain: 'desert', features: [], isRevealed: false, elevation: 0 },
  { id: 'hx_2_2', x: 2, y: 2, terrain: 'plains', features: [
    { type: 'monster', id: 'hx_wolf', monsterIds: ['wolf'], spawnRate: 0.5, minLevel: 16, maxLevel: 19, icon: '🐺', label: '荒漠狼群' },
  ], isRevealed: false, elevation: 0 },
  { id: 'hx_3_2', x: 3, y: 2, terrain: 'plains', features: [], isRevealed: false, elevation: 0 },
  { id: 'hx_4_2', x: 4, y: 2, terrain: 'desert', features: [
    { type: 'event', id: 'hx_ruins', eventId: 'temple_exploration', icon: '🏚️', label: '楼兰故城', description: '被黄沙掩埋的古城' },
  ], isRevealed: false, elevation: 0 },
  { id: 'hx_5_2', x: 5, y: 2, terrain: 'plains', features: [
    { type: 'random', id: 'hx_caravan', eventPool: ['merchant_caravan', 'wounded_soldier', 'mysterious_stranger'], icon: '🐪', label: '驼队驿站' },
  ], isRevealed: false, elevation: 0 },
  { id: 'hx_6_2', x: 6, y: 2, terrain: 'mountain', features: [], isRevealed: false, elevation: 2 },

  // 第 3 行（中）
  { id: 'hx_0_3', x: 0, y: 3, terrain: 'desert', features: [
    { type: 'monster', id: 'hx_sandworm', monsterIds: ['sand_worm'], spawnRate: 0.4, minLevel: 20, maxLevel: 26, icon: '🐛', label: '沙虫之海' },
  ], isRevealed: false, elevation: 0 },
  { id: 'hx_1_3', x: 1, y: 3, terrain: 'plains', features: [], isRevealed: false, elevation: 0 },
  { id: 'hx_2_3', x: 2, y: 3, terrain: 'plains', features: [
    { type: 'npc', id: 'hx_merchant', npcId: 'yangguan_merchant', icon: '🐪', label: '行商马掌柜', description: '往来丝路的商人' },
  ], isRevealed: false, elevation: 0 },
  { id: 'hx_3_3', x: 3, y: 3, terrain: 'plains', features: [
    { type: 'city', id: 'yangguan_city', cityId: 'yangguan', icon: '🏘️', label: '阳关', description: '西域门户' },
  ], isRevealed: true, elevation: 0 },
  { id: 'hx_4_3', x: 4, y: 3, terrain: 'plains', features: [
    { type: 'resource', id: 'hx_market', resourceType: 'fur', gatherCount: 6, icon: '🧥', label: '皮毛集市' },
  ], isRevealed: false, elevation: 0 },
  { id: 'hx_5_3', x: 5, y: 3, terrain: 'desert', features: [
    { type: 'monster', id: 'hx_brigand', monsterIds: ['bandit'], spawnRate: 0.7, minLevel: 18, maxLevel: 24, icon: '🏴', label: '沙匪巢穴' },
  ], isRevealed: false, elevation: 0 },
  { id: 'hx_6_3', x: 6, y: 3, terrain: 'desert', features: [], isRevealed: false, elevation: 0 },

  // 第 4 行
  { id: 'hx_0_4', x: 0, y: 4, terrain: 'desert', features: [
    { type: 'random', id: 'hx_quicksand', eventPool: ['sandstorm', 'oasis', 'desert_spirit'], icon: '🕳️', label: '流沙地' },
  ], isRevealed: false, elevation: 0 },
  { id: 'hx_1_4', x: 1, y: 4, terrain: 'plains', features: [], isRevealed: false, elevation: 0 },
  { id: 'hx_2_4', x: 2, y: 4, terrain: 'plains', features: [
    { type: 'npc', id: 'hx_guard', npcId: 'yangguan_guard', icon: '🛡️', label: '戍边校尉', description: '镇守阳关的边军' },
  ], isRevealed: false, elevation: 0 },
  { id: 'hx_3_4', x: 3, y: 4, terrain: 'plains', features: [
    { type: 'resource', id: 'hx_farm', resourceType: 'herbs', gatherCount: 8, icon: '🌾', label: '屯田' },
  ], isRevealed: true, elevation: 0 },
  { id: 'hx_4_4', x: 4, y: 4, terrain: 'desert', features: [], isRevealed: false, elevation: 0 },
  { id: 'hx_5_4', x: 5, y: 4, terrain: 'mountain', features: [
    { type: 'dungeon', id: 'hx_fortress', dungeonId: 'yangguan', icon: '🏰', label: '玉门关故垒', description: '废弃的边关要塞' },
  ], isRevealed: false, elevation: 3 },
  { id: 'hx_6_4', x: 6, y: 4, terrain: 'desert', features: [
    { type: 'monster', id: 'hx_vulture', monsterIds: ['sand_worm'], spawnRate: 0.5, minLevel: 22, maxLevel: 28, icon: '🦅', label: '秃鹫崖' },
  ], isRevealed: false, elevation: 1 },

  // 第 5 行
  { id: 'hx_0_5', x: 0, y: 5, terrain: 'mountain', features: [
    { type: 'monster', id: 'hx_ibex', monsterIds: ['wolf'], spawnRate: 0.5, minLevel: 24, maxLevel: 30, icon: '🐐', label: '崖羊群' },
  ], isRevealed: false, elevation: 2 },
  { id: 'hx_1_5', x: 1, y: 5, terrain: 'desert', features: [], isRevealed: false, elevation: 0 },
  { id: 'hx_2_5', x: 2, y: 5, terrain: 'desert', features: [
    { type: 'resource', id: 'hx_salt', resourceType: 'salt', gatherCount: 6, icon: '🧂', label: '盐池' },
  ], isRevealed: false, elevation: 0 },
  { id: 'hx_3_5', x: 3, y: 5, terrain: 'plains', features: [
    { type: 'event', id: 'hx_inn', eventId: 'temple_exploration', icon: '🏮', label: '龙门客栈', description: '大漠中的客栈' },
  ], isRevealed: false, elevation: 0 },
  { id: 'hx_4_5', x: 4, y: 5, terrain: 'desert', features: [], isRevealed: false, elevation: 0 },
  { id: 'hx_5_5', x: 5, y: 5, terrain: 'mountain', features: [
    { type: 'resource', id: 'hx_iron', resourceType: 'iron_ore', gatherCount: 5, icon: '⛏️', label: '铁矿' },
  ], isRevealed: false, elevation: 2 },
  { id: 'hx_6_5', x: 6, y: 5, terrain: 'desert', features: [
    { type: 'monster', id: 'hx_ghost', monsterIds: ['sand_worm'], spawnRate: 0.6, minLevel: 26, maxLevel: 32, icon: '👻', label: '沙鬼' },
  ], isRevealed: false, elevation: 0 },

  // 第 6 行（南）
  { id: 'hx_0_6', x: 0, y: 6, terrain: 'mountain', features: [
    { type: 'dungeon', id: 'hx_gaochang', dungeonId: 'yangguan', icon: '🗿', label: '高昌故城', description: '丝路古国遗址' },
  ], isRevealed: false, elevation: 3 },
  { id: 'hx_1_6', x: 1, y: 6, terrain: 'desert', features: [
    { type: 'random', id: 'hx_buried', eventPool: ['treasure_chest', 'lost_traveler', 'sandstorm'], icon: '🏺', label: '流沙古冢' },
  ], isRevealed: false, elevation: 0 },
  { id: 'hx_2_6', x: 2, y: 6, terrain: 'desert', features: [], isRevealed: false, elevation: 0 },
  { id: 'hx_3_6', x: 3, y: 6, terrain: 'plains', features: [
    { type: 'npc', id: 'hx_innkeeper', npcId: 'yangguan_innkeeper', icon: '🍶', label: '客栈老板娘', description: '龙门客栈的掌柜' },
  ], isRevealed: false, elevation: 0 },
  { id: 'hx_4_6', x: 4, y: 6, terrain: 'desert', features: [
    { type: 'monster', id: 'hx_scorpion2', monsterIds: ['sand_worm'], spawnRate: 0.5, minLevel: 24, maxLevel: 30, icon: '🦂', label: '毒蝎沙丘' },
  ], isRevealed: false, elevation: 0 },
  { id: 'hx_5_6', x: 5, y: 6, terrain: 'mountain', features: [], isRevealed: false, elevation: 3 },
  { id: 'hx_6_6', x: 6, y: 6, terrain: 'desert', features: [
    { type: 'event', id: 'hx_sunset', eventId: 'visit_dragon_king', icon: '🌅', label: '长河落日', description: '大漠尽头，长河落日' },
  ], isRevealed: false, elevation: 0 },
];
