/**
 * marketTuning — 跑商经济旋钮表（每日波动 / 供需库存 / 流言）
 *
 * 所有经济系数集中在此一处，命名导出，禁止散落到组件或其它引擎。
 * 调平衡只改这里，不要碰 Trade.ts / Rumor.ts 里的公式本体。
 */

// ── 每日波动（AR(1) 均值回归漂移） ──
// 注意：稳态 drift 标准差 = VOLATILITY_BASE×volatility / sqrt(1-DRIFT_DECAY²)。
// 为满足 E2"运过去反而亏 ≥15%"（波动要能翻掉 15% 买卖价差），VOLATILITY_BASE 取 0.12：
// 高波动货（volatility 0.55）稳态 drift ≈ ±8%，与特产路线净价差（~15%）相当，盈亏由波动决定。
export const VOLATILITY_BASE = 0.12;    // 基准日波动（经 volatility 放大）
export const DRIFT_DECAY = 0.55;        // 均值回归：昨天的偏离只保留一半多
export const DRIFT_CAP = 0.22;          // 单城单货最大偏离 ±22%

// ── 供需库存 ──
export const K_SD = 0.48;               // 库存偏离 → 价格弹性（买空涨 48%、倾销降 40%）
export const SD_MIN = 0.60;             // 供需系数下限
export const SD_MAX = 1.60;             // 供需系数上限
export const STOCK_RECOVER = 0.3;       // 每日库存回弹比例（5 天基本回平）
export const DAILY_IMPACT_CAP = 0.35;   // 单日单货价格影响上限

// ── 基准库存（target） ──
/** 特产城的基准库存（货多便宜） */
export const TARGET_SPECIALTY = 120;
/** 普通货物的基准库存 */
export const TARGET_NORMAL = 60;
/** 需求城的基准库存（货少贵） */
export const TARGET_DEMAND = 20;

// ── 流言 ──
export const RUMOR_PER_CITY_MIN = 0;    // 每日每城流言条数下限
export const RUMOR_PER_CITY_MAX = 2;    // 每日每城流言条数上限
export const RUMOR_TTL_MIN = 2;         // 流言寿命（天）下限
export const RUMOR_TTL_MAX = 4;         // 流言寿命（天）上限

/**
 * 来源可信度表：流言真假概率 = 该来源的可信度。
 * 值越高越"说真话"（credible 的概率）。
 */
export const SOURCE_CREDIBILITY: Record<string, number> = {
  // 按 NPC title/type 推断的兜底（具体 NPC 见下）
  市井闲汉: 0.35,
  脚夫: 0.55,
  船夫: 0.55,
  客栈掌柜: 0.70,
  商会掌柜: 0.80,
  情报贩子: 0.90,
};

/** 由 NPC 的 title/type 推断来源可信度（落在 0~1） */
export function sourceCredibility(title: string, type: string): number {
  const hay = `${title}${type}`;
  if (/情报|包打听|探子|密探/.test(hay)) return 0.90;
  if (/商会|牙人|掌柜|大贾|商/.test(hay)) return 0.80;
  if (/客栈|店小|酒肆|老板/.test(hay)) return 0.70;
  if (/脚夫|船|渡|车|马夫|带路/.test(hay)) return 0.55;
  if (/闲汉|泼皮|无赖|游方|浪人/.test(hay)) return 0.35;
  return 0.5;
}
