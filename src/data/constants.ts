// ═══════════════ 稀有度系统（统一） ═══════════════

// 稀有度颜色（统一，适用于动物/植物/装备/杂物）
export const RARITY_COLORS: Record<number, string> = {
  0: "#888888",  // 普通
  1: "#2E7D32",  // 少见
  2: "#1565C0",  // 稀有
  3: "#6A1B9A",  // 珍藏
  4: "#E65100",   // 传说
};

// 稀有度名称（统一）
export const RARITY_NAMES: Record<number, string> = {
  0: "普通",
  1: "少见",
  2: "稀有",
  3: "珍藏",
  4: "传说",
};

// ═══════════════ 伤害公式常量 ═══════════════
export const DEF_COEFF = 50;  // 防御衰减系数，DEF越高边际收益递减

// ═══════════════ 农场系统常量 ═══════════════
// 饲料产出间隔（秒）按稀有度
export const FEED_INTERVAL_BY_RARITY: Record<number, number> = {
  0: 600,
  1: 600,
  2: 480,
  3: 480,
  4: 360,
};

// 饲料类型按稀有度
export const FEED_TYPE_BY_RARITY: Record<number, string> = {
  0: "普通饲料",
  1: "普通饲料",
  2: "高级饲料",
  3: "高级饲料",
  4: "精华饲料",
};

// 肥料递减系数（第1次→第5次效果）
export const FERTILIZER_DIMINISHING: number[] = [1.0, 0.7, 0.4, 0.25, 0.15, 0.1];

// 最大植物数量
export const MAX_PLANTS = 20;

// 变异概率基数
export const MUTATION_CHANCE = 0.05;  // 5% 基础变异概率

// 加速生长费用系数（剩余秒数 * 0.5 = 金币）
export const SPEEDUP_COST_FACTOR = 0.5;

// ═══════════════ 战斗系统常量 ═══════════════
// 伤害波动范围
export const DAMAGE_VARIANCE_MIN = 0.9;
export const DAMAGE_VARIANCE_MAX = 1.1;

// 战斗tick间隔（秒）
export const BATTLE_TICK_S = 1.5;

// 自动战斗血量阈值选项
export const AUTO_POTION_OPTIONS = [0, 30, 50, 80];  // 0=关

// ═══════════════ 资源系统常量 ═══════════════
// 最大资源堆叠
export const MAX_RESOURCE_STACK = 99999;

// 最大金币
export const MAX_GOLD = 999999999;

// ═══════════════ 牧场系统常量 ═══════════════
// 牧场最大动物数量
export const MAX_RANCH_CREATURES = 20;

// 动物收获间隔（秒）按稀有度
export const CREATURE_HARVEST_INTERVAL_BY_RARITY: Record<number, number> = {
  0: 300,   // 普通 5分钟
  1: 300,
  2: 240,   // 少见 4分钟
  3: 240,
  4: 180,   // 稀有 3分钟
};

// 性格收益系数
export const TRAIT_BONUS_FACTOR = 0.1;  // 每个性格等级+10%

// ═══════════════ 建筑系统常量 ═══════════════
// 最大建筑数量
export const MAX_BUILDING_COUNT = 3;

// 工资支付间隔（秒）
export const WAGE_INTERVAL_S = 60;

// 每个劳工工资（金币）
export const WORKER_WAGE = 5;

// 每个劳工产量加成
export const WORKER_OUTPUT_BONUS = 0.5;

// ═══════════════ 工厂系统常量 ═══════════════
// 工厂最大劳工数
export const MAX_FACTORY_WORKERS = 5;

// 每个工厂劳工费用
export const FACTORY_WORKER_COST_GOLD = 80;

// 每个工厂劳工利润加成
export const FACTORY_WORKER_BONUS = 0.15;

// ═══════════════ 图鉴系统常量 ═══════════════
// 图鉴分类
export const CODEX_CATEGORIES = ["plants", "creatures", "equipment", "enemies"] as const;
export type CodexCategory = typeof CODEX_CATEGORIES[number];

// ═══════════════ 游戏核心常量 ═══════════════
// 游戏tick间隔（秒）
export const TICK_S = 1;

// 自动保存间隔（秒）
export const SAVE_INTERVAL_S = 30;

// 日志最大条目
export const MAX_LOG_ENTRIES = 100;

// ═══════════════ 酒馆系统常量 ═══════════════
// 酒馆刷新间隔（秒）
export const TAVERN_REFRESH_INTERVAL_S = 3600;  // 1小时

// 队伍最大人数
export const MAX_TEAM_SIZE = 4;

// ═══════════════ UI常量 ═══════════════
// Tab 列表（主界面）
export const MAIN_TABS = [
  "主城",
  "牧场",
  "农场",
  "背包",
  "地图",
  "锻造",
  "工厂",
  "建筑",
  "图鉴",
  "系统",
] as const;
export type MainTab = typeof MAIN_TABS[number];

// 主城子Tab
export const HERO_SUB_TABS = ["状态", "技能", "转生"] as const;
export type HeroSubTab = typeof HERO_SUB_TABS[number];

// ═══════════════ 计算工具函数 ═══════════════

// 计算伤害（防御衰减公式）
// 公式: 伤害 = ATK × (1 - DEF/(DEF+DEF_COEFF)) × random(0.9~1.1)
export function calcDamage(attack: number, defense: number): number {
  const reduction = defense / (defense + DEF_COEFF);
  const base = attack * (1 - reduction);
  const variance = DAMAGE_VARIANCE_MIN + Math.random() * (DAMAGE_VARIANCE_MAX - DAMAGE_VARIANCE_MIN);
  return Math.max(1, Math.floor(base * variance));
}

// 计算植物生长阶段（0=种子, 1=发芽, 2=成长, 3=成年）
export function calcGrowStage(elapsedS: number, growTimeS: number): number {
  const pct = elapsedS / growTimeS;
  if (pct >= 1) return 3;       // 成年
  if (pct >= 0.6) return 2;    // 成长
  if (pct >= 0.25) return 1;   // 发芽
  return 0;                      // 种子
}

// 格式化时间为 mm:ss
export function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
}

// 格式化数字（大数用 k/m/b）
export function formatNumber(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}b`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}m`;
  if (n >= 10_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toString();
}

// 根据稀有度获取颜色
export function getRarityColor(rarity: number): string {
  return RARITY_COLORS[rarity] || RARITY_COLORS[0];
}

// 根据稀有度获取名称
export function getRarityName(rarity: number): string {
  return RARITY_NAMES[rarity] || RARITY_NAMES[0];
}
