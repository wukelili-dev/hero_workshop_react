export interface PlantData {
  id: string;
  name: string;
  desc: string;
  rarity: number;
  seedPrice: number;
  growTimeS: number;
  adultLifespanS: number;
  harvestGold: number;
  harvestIntervalS: number;
  icon: string;
  season: string | null;
  canMutate: boolean;
}

export const PLANTS_CATALOG: PlantData[] = [
  // 普通 5G
  { id: "clover", name: "🍀 幸运草", desc: "四叶草，快速成长", rarity: 0, seedPrice: 5, growTimeS: 60, adultLifespanS: 300, harvestGold: 2, harvestIntervalS: 30, icon: "🍀", season: "春", canMutate: true },
  { id: "moonlight", name: "🌿 月光草", desc: "夜间叶片微光", rarity: 0, seedPrice: 5, growTimeS: 80, adultLifespanS: 360, harvestGold: 3, harvestIntervalS: 30, icon: "🌿", season: "春", canMutate: true },
  { id: "glowmoss", name: "🌿 微光苔", desc: "星尘雾气中自发光", rarity: 0, seedPrice: 5, growTimeS: 70, adultLifespanS: 330, harvestGold: 2, harvestIntervalS: 25, icon: "🌿", season: "夏", canMutate: true },
  { id: "bubblemush", name: "🍄 泡泡菇", desc: "释放无害彩色泡泡", rarity: 0, seedPrice: 5, growTimeS: 90, adultLifespanS: 420, harvestGold: 3, harvestIntervalS: 35, icon: "🍄", season: "夏", canMutate: true },
  { id: "sweetvine", name: "🌿 甜梦藤", desc: "助眠安神的廉价饮品", rarity: 0, seedPrice: 5, growTimeS: 75, adultLifespanS: 350, harvestGold: 2, harvestIntervalS: 28, icon: "🌿", season: "秋", canMutate: true },
  { id: "gold_grass", name: "🌾 金穗草", desc: "麦穗在阳光下闪着金光", rarity: 0, seedPrice: 5, growTimeS: 65, adultLifespanS: 310, harvestGold: 3, harvestIntervalS: 28, icon: "🌾", season: "春", canMutate: true },
  { id: "sunflower", name: "🌻 向日葵", desc: "永远朝着太阳的方向", rarity: 0, seedPrice: 5, growTimeS: 85, adultLifespanS: 380, harvestGold: 4, harvestIntervalS: 32, icon: "🌻", season: "夏", canMutate: true },
  { id: "mint", name: "🌿 薄荷", desc: "清凉的香气沁人心脾", rarity: 0, seedPrice: 5, growTimeS: 70, adultLifespanS: 330, harvestGold: 2, harvestIntervalS: 26, icon: "🌿", season: "春", canMutate: true },

  // 少见 10G
  { id: "mushroom", name: "🍄 跳舞蘑菇", desc: "随节拍摇摆的奇妙菌类", rarity: 1, seedPrice: 10, growTimeS: 120, adultLifespanS: 600, harvestGold: 6, harvestIntervalS: 45, icon: "🍄", season: "秋", canMutate: true },
  { id: "coppervine", name: "🌿 铜鳞藤", desc: "藤蔓覆盖铜色鳞片", rarity: 1, seedPrice: 10, growTimeS: 150, adultLifespanS: 720, harvestGold: 8, harvestIntervalS: 60, icon: "🌿", season: "夏", canMutate: true },
  { id: "lotus_light", name: "🌸 幻光莲", desc: "花瓣随情绪变色", rarity: 1, seedPrice: 10, growTimeS: 180, adultLifespanS: 900, harvestGold: 10, harvestIntervalS: 70, icon: "🌸", season: null, canMutate: true },
  { id: "stardustcotton", name: "🌸 星尘棉", desc: "棉絮能吸附星尘", rarity: 1, seedPrice: 10, growTimeS: 160, adultLifespanS: 800, harvestGold: 9, harvestIntervalS: 65, icon: "🌸", season: "夏", canMutate: true },
  { id: "echogourd", name: "🎃 回声瓜", desc: "敲击时会重复声音", rarity: 1, seedPrice: 10, growTimeS: 140, adultLifespanS: 700, harvestGold: 7, harvestIntervalS: 55, icon: "🎃", season: null, canMutate: true },
  { id: "fire_flower", name: "🌺 火焰花", desc: "花瓣尖端燃烧着不灭的火焰", rarity: 1, seedPrice: 10, growTimeS: 170, adultLifespanS: 780, harvestGold: 9, harvestIntervalS: 60, icon: "🌺", season: "夏", canMutate: true },
  { id: "thorn_vine", name: "🥀 荆棘藤", desc: "藤蔓上长满尖锐的刺", rarity: 1, seedPrice: 10, growTimeS: 150, adultLifespanS: 650, harvestGold: 7, harvestIntervalS: 50, icon: "🥀", season: "春", canMutate: true },
  { id: "silver_leaf", name: "🍃 银叶草", desc: "叶片泛着金属光泽", rarity: 1, seedPrice: 10, growTimeS: 130, adultLifespanS: 580, harvestGold: 6, harvestIntervalS: 48, icon: "🍃", season: "秋", canMutate: true },

  // 稀有 15G
  { id: "crystal_flower", name: "✨ 发光萤石花", desc: "黑暗中绽放的晶体之花", rarity: 2, seedPrice: 15, growTimeS: 300, adultLifespanS: 1200, harvestGold: 15, harvestIntervalS: 90, icon: "✨", season: null, canMutate: true },
  { id: "frostflower", name: "❄️ 冻脉花", desc: "花瓣常年覆盖薄冰", rarity: 2, seedPrice: 15, growTimeS: 360, adultLifespanS: 1440, harvestGold: 18, harvestIntervalS: 100, icon: "❄️", season: "冬", canMutate: true },
  { id: "bloodroot", name: "🌿 血根草", desc: "根部鲜红如血", rarity: 2, seedPrice: 15, growTimeS: 330, adultLifespanS: 1320, harvestGold: 16, harvestIntervalS: 95, icon: "🌿", season: "冬", canMutate: true },
  { id: "gemcactus", name: "🌵 宝石仙人掌", desc: "刺尖凝结细小水晶", rarity: 2, seedPrice: 15, growTimeS: 380, adultLifespanS: 1500, harvestGold: 20, harvestIntervalS: 110, icon: "🌵", season: null, canMutate: true },
  { id: "gravityoak", name: "🌳 重力橡树", desc: "树干内产生局部重力异常", rarity: 2, seedPrice: 15, growTimeS: 420, adultLifespanS: 1680, harvestGold: 22, harvestIntervalS: 120, icon: "🌳", season: null, canMutate: true },
  { id: "mistlotus", name: "🌸 幻雾莲", desc: "释放致幻孢子云", rarity: 2, seedPrice: 15, growTimeS: 350, adultLifespanS: 1400, harvestGold: 17, harvestIntervalS: 105, icon: "🌸", season: "秋", canMutate: true },
  { id: "shadow_orchid", name: "🌸 暗影兰", desc: "只在月光下绽放的神秘兰花", rarity: 2, seedPrice: 15, growTimeS: 340, adultLifespanS: 1360, harvestGold: 18, harvestIntervalS: 100, icon: "🌸", season: "春", canMutate: true },
  { id: "desert_cactus", name: "🌵 沙漠仙人掌", desc: "能在极端环境中存储生命之水", rarity: 2, seedPrice: 15, growTimeS: 390, adultLifespanS: 1550, harvestGold: 21, harvestIntervalS: 115, icon: "🌵", season: "夏", canMutate: true },
  { id: "crystal_kelp", name: "🌊 水晶海藻", desc: "半透明的海藻折射七彩光芒", rarity: 2, seedPrice: 15, growTimeS: 310, adultLifespanS: 1250, harvestGold: 16, harvestIntervalS: 92, icon: "🌊", season: "冬", canMutate: true },

  // 珍藏 20G
  { id: "rainbow_shell", name: "🪩 彩虹贝壳花", desc: "折射七彩光芒", rarity: 3, seedPrice: 20, growTimeS: 600, adultLifespanS: 2400, harvestGold: 35, harvestIntervalS: 120, icon: "🪩", season: null, canMutate: true },
  { id: "dragonpepper", name: "🌶️ 龙息椒", desc: "果实内封存龙息火焰", rarity: 3, seedPrice: 20, growTimeS: 720, adultLifespanS: 2880, harvestGold: 42, harvestIntervalS: 140, icon: "🌶️", season: null, canMutate: true },
  { id: "startear", name: "🌸 星泪树", desc: "落叶如流星坠落", rarity: 3, seedPrice: 20, growTimeS: 900, adultLifespanS: 3600, harvestGold: 50, harvestIntervalS: 160, icon: "🌸", season: null, canMutate: true },
  { id: "goldpumpkin", name: "🎃 黄金南瓜", desc: "果肉坚硬如黄金永不腐烂", rarity: 3, seedPrice: 20, growTimeS: 840, adultLifespanS: 3360, harvestGold: 48, harvestIntervalS: 150, icon: "🎃", season: "秋", canMutate: true },
  { id: "lawvine", name: "🌿 法则藤蔓", desc: "每7天产出一枚完整法则碎片", rarity: 3, seedPrice: 20, growTimeS: 1000, adultLifespanS: 4000, harvestGold: 55, harvestIntervalS: 180, icon: "🌿", season: "冬", canMutate: true },
  { id: "life_fruit_tree", name: "🍎 生命果实树", desc: "传说食其果可延年益寿", rarity: 3, seedPrice: 20, growTimeS: 780, adultLifespanS: 3100, harvestGold: 45, harvestIntervalS: 145, icon: "🍎", season: "春", canMutate: true },
  { id: "star_grass", name: "🌟 星辰草", desc: "每片叶子都像一颗星星", rarity: 3, seedPrice: 20, growTimeS: 660, adultLifespanS: 2600, harvestGold: 38, harvestIntervalS: 130, icon: "🌟", season: "秋", canMutate: true },
  { id: "eternal_pumpkin", name: "🎃 永恒南瓜", desc: "永远不会腐烂的神奇南瓜", rarity: 3, seedPrice: 20, growTimeS: 920, adultLifespanS: 3600, harvestGold: 52, harvestIntervalS: 170, icon: "🎃", season: "夏", canMutate: true },

  // 传说 25G
  { id: "moon_crystal", name: "💎 月亮水晶藤", desc: "汲取月光生长的传说植物", rarity: 4, seedPrice: 25, growTimeS: 1200, adultLifespanS: 3600, harvestGold: 80, harvestIntervalS: 180, icon: "💎", season: "冬", canMutate: true },
  { id: "eternalrose", name: "🌹 永恒玫瑰", desc: "永不凋谢，正午释放时停领域", rarity: 4, seedPrice: 25, growTimeS: 1500, adultLifespanS: 5400, harvestGold: 100, harvestIntervalS: 200, icon: "🌹", season: null, canMutate: true },
  { id: "clockflower", name: "⏰ 时计花", desc: "花朵呈钟表状，正午时间静止", rarity: 4, seedPrice: 25, growTimeS: 1800, adultLifespanS: 7200, harvestGold: 120, harvestIntervalS: 240, icon: "⏰", season: null, canMutate: true },
  { id: "worldtree", name: "🌲 世界树之苗", desc: "九界之树，树冠下作物加速", rarity: 4, seedPrice: 25, growTimeS: 2400, adultLifespanS: 10800, harvestGold: 150, harvestIntervalS: 300, icon: "🌲", season: "冬", canMutate: true },
  { id: "world_flower", name: "🌐 世界花", desc: "花蕊中能看到整个世界的缩影", rarity: 4, seedPrice: 25, growTimeS: 1800, adultLifespanS: 7200, harvestGold: 130, harvestIntervalS: 250, icon: "🌐", season: "春", canMutate: true },
  { id: "genesis_crystal", name: "💎 创世晶花", desc: "据说世界诞生时开的第一朵花", rarity: 4, seedPrice: 25, growTimeS: 2100, adultLifespanS: 9000, harvestGold: 145, harvestIntervalS: 280, icon: "💎", season: "夏", canMutate: true },
  { id: "void_bloom", name: "🌀 虚空之花", desc: "来自虚空的奇异花朵", rarity: 4, seedPrice: 25, growTimeS: 1600, adultLifespanS: 6000, harvestGold: 110, harvestIntervalS: 220, icon: "🌀", season: "冬", canMutate: true },
];

// 植物稀有度颜色
export const PLANT_RARITY_COLORS: Record<number, string> = {
  0: "#888888",
  1: "#2E7D32",
  2: "#1565C0",
  3: "#6A1B9A",
  4: "#E65100",
};

// 植物稀有度名称
export const PLANT_RARITY_NAMES: Record<number, string> = {
  0: "普通",
  1: "少见",
  2: "稀有",
  3: "珍藏",
  4: "传说",
};

export const MAX_PLANTS = 10;

// 季节系统
export const SEASONS = ["春", "夏", "秋", "冬"];
export const SEASON_DURATION_S = 2 * 3600; // 2小时一个季节

// 生长阶段
export const STAGE_NAMES = ["🌰 种子", "🌱 发芽", "🌿 幼苗", "🌳 成年"];
export const STAGE_ICONS: Record<number, string> = { 0: "🌰", 1: "🌱", 2: "🌿", 3: "🌳" };

// 获取植物 by id
export function getPlantById(id: string): PlantData | undefined {
  return PLANTS_CATALOG.find(p => p.id === id);
}

// 获取指定稀有度的植物
export function getPlantsByRarity(rarity: number): PlantData[] {
  return PLANTS_CATALOG.filter(p => p.rarity === rarity);
}

// 计算生长阶段 (0=种子, 1=发芽, 2=幼苗, 3=成年)
export function calcGrowStage(elapsedS: number, growTimeS: number): number {
  if (elapsedS < growTimeS * 0.33) return 0;
  if (elapsedS < growTimeS * 0.66) return 1;
  if (elapsedS < growTimeS) return 2;
  return 3;
}
