/**
 * Stats — 属性换算与迁移的**唯一**数据层（C1）。
 *
 * 三层属性：
 *   主属性 PrimaryStats（成长/加点）
 *     → 派生属性 DerivedStats（战斗唯一读取层，公式全部集中在本文件）
 *       → 战斗变量 CombatVars（怒气/护盾/状态，战斗内存在，见 types.ts）
 *
 * 铁律（见 docs/战斗与属性重构_实现文档_20260927.md §0）：
 *   - 所有换算系数与各处上限只写在本文件，禁止散落到业务代码。
 *   - 怪物/NPC 只写"等级 + 主属性"，派生一律走 buildDerived()。
 *   - C1 阶段本文件只被"迁移 + 验证"使用，战斗结算（Combat.ts）规则尚未切换。
 */
import type {
  PrimaryStats,
  DerivedStats,
  ItemEffect,
  StatusEffect,
} from '../types';

// ═══════════════════════════ 上限（平衡的唯一出口） ═══════════════════════════
export const STAT_CAPS = {
  dodge: 0.40,   // 闪避率上限
  hit: 0.99,     // 命中率上限
  crit: 0.60,    // 暴击率上限
  critDmg: 4.0,  // 暴伤倍率上限
  resist: 0.60,  // 抗性上限
  penRatio: 0.60, // 破甲不超过目标防御的 60%（战斗时约束）
} as const;

/** 主属性 clamp 下界/上界（反解迁移时用） */
const PRIMARY_MIN = 1;
const PRIMARY_MAX = 999;

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

// ═══════════════════════════ 主属性运算工具（加点 / 装备共用） ═══════════════════════════

export const PRIMARY_KEYS: (keyof PrimaryStats)[] = ['root', 'qi', 'agility', 'spirit', 'fortune'];

export const PRIMARY_NAME: Record<keyof PrimaryStats, string> = {
  root: '根骨', qi: '气力', agility: '身法', spirit: '神识', fortune: '机缘',
};

export const ZERO_PRIMARY: PrimaryStats = { root: 0, qi: 0, agility: 0, spirit: 0, fortune: 0 };

/** 若干份主属性相加（缺省视为 0） */
export function addPrimary(...list: (Partial<PrimaryStats> | null | undefined)[]): PrimaryStats {
  const out: PrimaryStats = { ...ZERO_PRIMARY };
  for (const p of list) {
    if (!p) continue;
    for (const k of PRIMARY_KEYS) out[k] += p[k] ?? 0;
  }
  return out;
}

/**
 * 旧四维 → 主属性（给"老数据装备"用）。
 * 口径与反解一致：atk→气力、crit→神识、critDmg→机缘；
 * def 与 hp 同时由根骨供给，所以根骨取两者的平均值，避免一头塌一头涨。
 */
export function primaryFromLegacy(stats: {
  atk?: number; def?: number; hp?: number; crit?: number; critDmg?: number;
}): PrimaryStats {
  return {
    root: ((stats.def ?? 0) / 0.8 + (stats.hp ?? 0) / 12) / 2,
    qi: (stats.atk ?? 0) / 1.6,
    agility: 0,
    spirit: (stats.crit ?? 0) / 0.004,
    fortune: ((stats.critDmg ?? 1.5) - 1.5) / 0.01,
  };
}

// ═══════════════════════════ 主 → 派生 换算表（规格 §4） ═══════════════════════════

/** 由主属性 + 等级计算派生属性（纯函数，无随机）。equip/statuses 供 C2/C4 扩展。 */
export function buildDerived(
  primary: PrimaryStats,
  level: number,
  _equip?: ItemEffect[],
  _statuses?: StatusEffect[],
): DerivedStats {
  const { root, qi, agility, spirit, fortune } = primary;
  return {
    hpMax: 60 + root * 12 + level * 10,
    def: 2 + root * 0.8 + level * 0.5,
    // A 方案（C6 收尾）：气力仍是攻击主轴，但身法/神识也给少量输出贡献，
    // 否则「快剑/法衣」这类不走气力的流派完全没有伤害出口，三 build 只剩一条路。
    atk: 4 + qi * 1.6 + agility * 0.5 + spirit * 0.3 + level * 0.8,
    pen: qi * 0.25,
    speed: 8 + agility * 1.2,
    dodge: clamp(agility * 0.004, 0, STAT_CAPS.dodge),
    hit: clamp(0.85 + spirit * 0.006, 0, STAT_CAPS.hit),
    crit: clamp(0.03 + spirit * 0.004, 0, STAT_CAPS.crit),
    critDmg: clamp(1.5 + fortune * 0.01, 0, STAT_CAPS.critDmg),
    tenacity: spirit * 0.5,
    resist: clamp(spirit * 0.3, 0, STAT_CAPS.resist),
  };
}

// ═══════════════════════════ 升级成长 ═══════════════════════════

/** 每升 1 级给玩家的自由加点数（主属性 5 选 1 分配；流派的核心旋钮） */
export const FREE_POINTS_PER_LEVEL = 2;

// ── 等级基线（不含任何主属性加成） ──
// 保留旧的成长公式语义：它代表"完全自动分配主属性"时英雄的裸成长。
// 加点与装备的收益一律作为**相对这条基线的增量**，这样老档不会因为改口径变弱。
export const LEVEL_BASE_ATK = (lv: number) => 5 + lv * 2;
export const LEVEL_BASE_DEF = (lv: number) => 2 + lv;
export const LEVEL_BASE_HP = (lv: number) => Math.floor(80 + lv * 18 + Math.floor(lv / 5) * 5);

/**
 * 每级 1 点主属性，按 根骨/气力/身法/神识/机缘 = 2:2:2:2:1 循环自动分配
 * （9 级一轮：root×2 → qi×2 → agility×2 → spirit×2 → fortune×1）；另每 5 级全属性 +1。
 * C3 用于怪物/NPC「等级 → 主属性」正向生成。
 */
export function levelUpPrimary(primary: PrimaryStats, newLevel: number): PrimaryStats {
  const order: (keyof PrimaryStats)[] = [
    'root', 'root', 'qi', 'qi', 'agility', 'agility', 'spirit', 'spirit', 'fortune',
  ];
  const out: PrimaryStats = { ...primary };
  for (let lv = 2; lv <= newLevel; lv++) {
    const key = order[(lv - 2) % order.length];
    out[key] += 1;
    if (lv % 5 === 0) {
      out.root += 1; out.qi += 1; out.agility += 1; out.spirit += 1; out.fortune += 1;
    }
  }
  return out;
}

/** 生成某等级的基础主属性（新建英雄/NPC 用，按 2:2:2:2:1 从 0 累积）。 */
export function autoAllocatePrimary(level: number): PrimaryStats {
  const base: PrimaryStats = { root: 0, qi: 0, agility: 0, spirit: 0, fortune: 0 };
  return levelUpPrimary(base, level);
}

// ═══════════════════════════ 老数据迁移（规格 §4.1） ═══════════════════════════

/** 旧战斗属性（英雄 / 怪物 / NPC challengeStats 通用） */
export interface LegacyStats {
  hp: number;
  atk: number;
  def: number;
  crit?: number;   // 暴击率 0~1（缺省 0.05）
  critDmg?: number; // 暴伤倍率（缺省 1.5）
}

/** 派生 → 旧四维（只读映射，供怪物面板/验证显示）。 */
export function derivedToLegacy(d: DerivedStats): { hp: number; atk: number; def: number; crit: number; critDmg: number } {
  return { hp: Math.floor(d.hpMax), atk: Math.floor(d.atk), def: Math.floor(d.def), crit: d.crit, critDmg: d.critDmg };
}

// ═══════════════════════════ 怪物/NPC 生成（C3：等级 + 主属性） ═══════════════════════════

/**
 * 由「等级」正向生成怪物主属性（新增一只怪只需一行：等级 + 是否 Boss + 派系）。
 * 与英雄不同：怪物根骨/气力随等级线性成长且无装备，用同一张换算表派生。
 * isBoss 整体放大主属性（Boss 更高血/攻/防）。
 */
export function monsterPrimary(level: number, isBoss = false): PrimaryStats {
  const k = isBoss ? 1.6 : 1.0;
  const lv = Math.max(1, level);
  return {
    root: lv * 1.3 * k,
    qi: lv * 1.5 * k,
    agility: lv * 0.9,
    spirit: lv * 0.6,
    fortune: lv * 0.4,
  };
}

/** 由等级生成怪物派生属性 + 旧四维（供 Combat 与面板回退显示）。 */
export function deriveMonster(
  level: number,
  isBoss = false,
): { primary: PrimaryStats; derived: DerivedStats; legacy: { hp: number; atk: number; def: number } } {
  const primary = monsterPrimary(level, isBoss);
  const derived = buildDerived(primary, level);
  return { primary, derived, legacy: derivedToLegacy(derived) };
}

// ═══════════════════════════ 怪物专用派生（C3 等价主属性化） ═══════════════════════════
//
// 为什么不用 buildDerived？英雄换算表里 root 双职（同时决定 hpMax 与 def），
// 反解手调的怪物 hp/def 时会出现「血量优先则防御被抬高」的地板效应（C3 已踩过）。
// 怪物需要表达「高血低防 / 低血高防」的多样性，故将 def 从 root 解耦到 spirit：
//   root → hpMax、qi → atk、spirit → def（三独立映射，精确等价反解手调数值）。
// 其余轴怪物给中性默认（速度固定、不闪避、不暴击）。

/** 怪物主属性 → 派生（无地板，三轴独立；其余轴中性 = 旧 NEUTRAL_AXES 行为，保证等价）。 */
export function buildMonsterDerived(
  primary: PrimaryStats,
  level: number,
): DerivedStats {
  const { root, qi, spirit } = primary;
  return {
    hpMax: Math.round(root * 12 + level * 10),
    atk: Math.round(qi * 1.6 + level * 0.8),
    def: Math.round(spirit * 0.8 + level * 0.5),
    pen: 0,         // 中性（怪物暂无破甲轴）
    speed: 14,      // 中性固定
    dodge: 0,       // 怪物不闪避
    hit: 0.85,      // 中性命中
    crit: 0,        // 怪物不暴击
    critDmg: 1.5,
    tenacity: 0,    // 中性
    resist: 0,      // 中性
  };
}

/** 旧怪物四维 → 主属性（三独立反解，与 buildMonsterDerived 互为逆运算，round 后等价）。 */
export function legacyToMonsterPrimary(legacy: LegacyStats, level: number): PrimaryStats {
  return {
    root: clamp((legacy.hp - level * 10) / 12, PRIMARY_MIN, PRIMARY_MAX),
    qi: clamp((legacy.atk - level * 0.8) / 1.6, PRIMARY_MIN, PRIMARY_MAX),
    spirit: clamp((legacy.def - level * 0.5) / 0.8, PRIMARY_MIN, PRIMARY_MAX),
    agility: 5,   // 中性
    fortune: 1,   // 中性（怪物不暴击）
  };
}

/** 怪物当前 hp/atk/def（有 primary 则正向派生；否则回退原始手调值）。供显示层与回退逻辑统一读。 */
export function monsterStatsOf(monster: {
  level?: number;
  primary?: PrimaryStats;
  hp?: number;
  atk?: number;
  def?: number;
}): { hp: number; atk: number; def: number } {
  const level = monster.level ?? 1;
  if (monster.primary) {
    const d = buildMonsterDerived(monster.primary, level);
    return { hp: d.hpMax, atk: d.atk, def: d.def };
  }
  return { hp: monster.hp ?? 0, atk: monster.atk ?? 0, def: monster.def ?? 0 };
}
