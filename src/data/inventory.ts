export interface NoveltyItem {
  name: string;
  desc: string;
  price: number;
  rarityIdx: number;
  kind?: string;
  plantId?: string;
}

// 杂物物品列表
export const NOVELTY_ITEMS: NoveltyItem[] = [
  // 普通 (5-8G)
  { name: "🍀 幸运草", desc: "据说能带来好运的四叶草", price: 5, rarityIdx: 0, kind: "plant_seed", plantId: "clover" },
  { name: "🗺️ 破旧地图碎片", desc: "像是某个宝藏的一部分", price: 8, rarityIdx: 0 },
  { name: "🐚 普通贝壳", desc: "大海的味道，若有若无", price: 6, rarityIdx: 0 },
  { name: "🪶 褪色羽毛", desc: "曾经鲜艳，如今黯淡", price: 5, rarityIdx: 0 },
  { name: "🪨 普通石头", desc: "形状还算圆润", price: 3, rarityIdx: 0 },
  // 少见 (10-20G)
  { name: "🍄 跳舞的蘑菇", desc: "随着节拍轻轻摇摆", price: 10, rarityIdx: 1, kind: "plant_seed", plantId: "mushroom" },
  { name: "🔮 迷你水晶球", desc: "偶尔会闪烁一下", price: 20, rarityIdx: 1 },
  { name: "🕯️ 永不熄灭的蜡烛", desc: "火焰永不熄灭", price: 18, rarityIdx: 1 },
  { name: "✨ 发光萤石", desc: "在黑暗中散发柔光", price: 16, rarityIdx: 1 },
  { name: "🌱 沉睡的种子", desc: "似乎永远不会发芽", price: 12, rarityIdx: 1 },
  { name: "🎃 迷你南瓜灯", desc: "万圣节纪念品", price: 14, rarityIdx: 1 },
  { name: "🧊 冰冻的眼泪", desc: "永远不会融化的冰晶", price: 19, rarityIdx: 1 },
  // 稀有 (22-38G)
  { name: "🐚 会说话的贝壳", desc: "会重复最后听到的话", price: 25, rarityIdx: 2 },
  { name: "🎈 装在瓶中的微风", desc: "打开时会有风轻轻吹过", price: 22, rarityIdx: 2 },
  { name: "🔮 占卜水晶球", desc: "偶尔能看到模糊的影像", price: 30, rarityIdx: 2 },
  { name: "🎵 会唱歌的水晶", desc: "轻敲会发出清脆声响", price: 28, rarityIdx: 2 },
  { name: "🧱 谜之方块", desc: "没人知道它是怎么出现的", price: 33, rarityIdx: 2 },
  { name: "🔭 迷你望远镜", desc: "据说能看见月亮背面", price: 35, rarityIdx: 2 },
  // 珍藏 (40-55G)
  { name: "🪩 彩虹贝壳", desc: "折射出七彩光芒", price: 45, rarityIdx: 3 },
  { name: "❄️ 跳舞的雪花", desc: "在温暖的地方也能存在", price: 48, rarityIdx: 3 },
  { name: "💎 月亮碎片", desc: "散发着淡淡的银光", price: 52, rarityIdx: 3 },
  { name: "🌈 凝固的彩虹", desc: "触碰它就会消失", price: 55, rarityIdx: 3 },
  // 传说 (60G+)
  { name: "⏳ 时间的沙漏", desc: "沙子流向不明", price: 65, rarityIdx: 4 },
  { name: "🌙 梦境碎片", desc: "收藏着一个完整的梦", price: 70, rarityIdx: 4 },
  { name: "☄️ 坠落的流星", desc: "许愿成功率提升100%", price: 80, rarityIdx: 4 },
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
