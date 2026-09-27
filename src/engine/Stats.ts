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
    atk: 4 + qi * 1.6 + level * 0.8,
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

/**
 * 把旧四维（+暴击）反解为主属性，并给出派生快照。
 * 反解用新换算表的逆公式，保证 buildDerived 反算出的 atk/def 精确还原；
 * hp 通过 root = max(root_def, root_hp) 保证**不低于旧值**（规格要求）。
 */
export function migrateLegacyStats(
  legacy: LegacyStats,
  level: number,
): { primary: PrimaryStats; derived: DerivedStats } {
  const crit = legacy.crit ?? 0.05;
  const critDmg = legacy.critDmg ?? 1.5;

  const qi = clamp((legacy.atk - 4 - level * 0.8) / 1.6, PRIMARY_MIN, PRIMARY_MAX);
  const rootDef = clamp((legacy.def - 2 - level * 0.5) / 0.8, PRIMARY_MIN, PRIMARY_MAX);
  const rootHp = clamp((legacy.hp - 60 - level * 10) / 12, PRIMARY_MIN, PRIMARY_MAX);
  const root = Math.max(rootDef, rootHp); // 保证血量不降
  const spirit = clamp((crit - 0.03) / 0.004, PRIMARY_MIN, PRIMARY_MAX);
  const fortune = clamp((critDmg - 1.5) / 0.01, PRIMARY_MIN, PRIMARY_MAX);
  // 旧数据无身法维度 → 中性默认（C2 启用速度轴前无影响）
  const agility = 5;

  const primary: PrimaryStats = { root, qi, agility, spirit, fortune };
  return { primary, derived: buildDerived(primary, level) };
}

/** 派生 → 旧四维（只读映射，供旧面板/验证显示）。 */
export function derivedToLegacy(d: DerivedStats): { hp: number; atk: number; def: number; crit: number; critDmg: number } {
  return { hp: Math.floor(d.hpMax), atk: Math.floor(d.atk), def: Math.floor(d.def), crit: d.crit, critDmg: d.critDmg };
}
