import { composeName, composeLore } from './items/nameParts';

export interface NoveltyItem {
  id: string;
  name: string;
  desc: string;
  price: number;
  rarityIdx: number;
  kind?: string;
  plantId?: string;
}

// 杂物物品列表（名字用 id 哈希组合生成，稳定不重复）
export const NOVELTY_ITEMS: NoveltyItem[] = [
  // 普通 (5-8G)
  { id: 'clover', name: composeName('clover'), desc: composeLore('clover'), price: 5, rarityIdx: 0, kind: "plant_seed", plantId: "clover" },
  { id: 'map_fragment', name: composeName('map_fragment'), desc: composeLore('map_fragment'), price: 8, rarityIdx: 0 },
  { id: 'seashell', name: composeName('seashell'), desc: composeLore('seashell'), price: 6, rarityIdx: 0 },
  { id: 'feather', name: composeName('feather'), desc: composeLore('feather'), price: 5, rarityIdx: 0 },
  { id: 'stone', name: composeName('stone'), desc: composeLore('stone'), price: 3, rarityIdx: 0 },
  // 少见 (10-20G)
  { id: 'mushroom', name: composeName('mushroom'), desc: composeLore('mushroom'), price: 10, rarityIdx: 1, kind: "plant_seed", plantId: "mushroom" },
  { id: 'crystal_ball', name: composeName('crystal_ball'), desc: composeLore('crystal_ball'), price: 20, rarityIdx: 1 },
  { id: 'candle', name: composeName('candle'), desc: composeLore('candle'), price: 18, rarityIdx: 1 },
  { id: 'fluorite', name: composeName('fluorite'), desc: composeLore('fluorite'), price: 16, rarityIdx: 1 },
  { id: 'dormant_seed', name: composeName('dormant_seed'), desc: composeLore('dormant_seed'), price: 12, rarityIdx: 1 },
  { id: 'pumpkin_lantern', name: composeName('pumpkin_lantern'), desc: composeLore('pumpkin_lantern'), price: 14, rarityIdx: 1 },
  { id: 'frozen_tear', name: composeName('frozen_tear'), desc: composeLore('frozen_tear'), price: 19, rarityIdx: 1 },
  // 稀有 (22-38G)
  { id: 'talking_shell', name: composeName('talking_shell'), desc: composeLore('talking_shell'), price: 25, rarityIdx: 2 },
  { id: 'bottled_breeze', name: composeName('bottled_breeze'), desc: composeLore('bottled_breeze'), price: 22, rarityIdx: 2 },
  { id: 'crystal_scry', name: composeName('crystal_scry'), desc: composeLore('crystal_scry'), price: 30, rarityIdx: 2 },
  { id: 'singing_crystal', name: composeName('singing_crystal'), desc: composeLore('singing_crystal'), price: 28, rarityIdx: 2 },
  { id: 'mystery_block', name: composeName('mystery_block'), desc: composeLore('mystery_block'), price: 33, rarityIdx: 2 },
  { id: 'telescope', name: composeName('telescope'), desc: composeLore('telescope'), price: 35, rarityIdx: 2 },
  // 珍藏 (40-55G)
  { id: 'rainbow_shell', name: composeName('rainbow_shell'), desc: composeLore('rainbow_shell'), price: 45, rarityIdx: 3 },
  { id: 'dancing_snow', name: composeName('dancing_snow'), desc: composeLore('dancing_snow'), price: 48, rarityIdx: 3 },
  { id: 'moon_shard', name: composeName('moon_shard'), desc: composeLore('moon_shard'), price: 52, rarityIdx: 3 },
  { id: 'frozen_rainbow', name: composeName('frozen_rainbow'), desc: composeLore('frozen_rainbow'), price: 55, rarityIdx: 3 },
  // 传说 (60G+)
  { id: 'time_hourglass', name: composeName('time_hourglass'), desc: composeLore('time_hourglass'), price: 65, rarityIdx: 4 },
  { id: 'dream_shard', name: composeName('dream_shard'), desc: composeLore('dream_shard'), price: 70, rarityIdx: 4 },
  { id: 'falling_meteor', name: composeName('falling_meteor'), desc: composeLore('falling_meteor'), price: 80, rarityIdx: 4 },
];

// 杂物稀有度颜色
export const NOVELTY_RARITY_COLORS: Record<number, string> = {
  0: "#888888",
  1: "#2E7D32",
  2: "#1565C0",
  3: "#6A1B9A",
  4: "#E65100",
};

// 杂物稀有度名称
export const NOVELTY_RARITY_NAMES: Record<number, string> = {
  0: "普通",
  1: "少见",
  2: "稀有",
  3: "珍藏",
  4: "传说",
};

export const MAX_INVENTORY = 20;

// ── 经验丹 ──
export interface ExpPillItem {
  id: string;
  name: string;
  desc: string;
  price: number;
  exp: number;
  rarityIdx: number;
}

export const EXP_PILL_ITEMS: ExpPillItem[] = [
  { id: 'exp_pill_green', name: '初级经验丹', desc: '使用后获得50点经验', price: 500, exp: 50, rarityIdx: 1 },
  { id: 'exp_pill_blue', name: '中级经验丹', desc: '使用后获得250点经验', price: 2000, exp: 250, rarityIdx: 2 },
  { id: 'exp_pill_purple', name: '高级经验丹', desc: '使用后获得750点经验', price: 5000, exp: 750, rarityIdx: 3 },
  { id: 'exp_pill_gold', name: '特级经验丹', desc: '使用后获得1800点经验', price: 10000, exp: 1800, rarityIdx: 4 },
];

export const EXP_PILL_IDS = new Set(EXP_PILL_ITEMS.map(p => p.id));
export const EXP_PILL_MAX_STACK = 99;

export const EXP_PILL_BY_ID: Record<string, ExpPillItem> = Object.fromEntries(
  EXP_PILL_ITEMS.map(p => [p.id, p])
);

// 背包物品类型
export interface InventoryItem {
  name: string;
  type: "equipment" | "novelty";
  [key: string]: unknown;  // 其他属性
}

// 背包容器（运行时用，数据层只导出接口和初始状态）
export interface InventoryState {
  items: InventoryItem[];
  capacity: number;
}

export function createEmptyInventory(capacity: number = MAX_INVENTORY): InventoryState {
  return {
    items: [],
    capacity,
  };
}

// 获取杂物 by rarity
export function getNoveltyItemsByRarity(rarityIdx: number): NoveltyItem[] {
  return NOVELTY_ITEMS.filter(item => item.rarityIdx === rarityIdx);
}

// 随机获取一个杂物（按稀有度权重）
const RARITY_WEIGHTS = [50, 30, 15, 4, 1];  // 普通=50, 少见=30, ...
export function getRandomNoveltyItem(): NoveltyItem {
  const totalWeight = RARITY_WEIGHTS.reduce((a, b) => a + b, 0);
  let r = Math.random() * totalWeight;
  let chosenRarity = 0;
  for (let i = 0; i < RARITY_WEIGHTS.length; i++) {
    r -= RARITY_WEIGHTS[i];
    if (r <= 0) {
      chosenRarity = i;
      break;
    }
  }
  const candidates = getNoveltyItemsByRarity(chosenRarity);
  return candidates[Math.floor(Math.random() * candidates.length)];
}
