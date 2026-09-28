/**
 * NpcStats — NPC / 队友的「等级 + 主属性」换算（P0-1）
 *
 * 设计意图：让 NPC 挑战怪与队友和怪物共用同一套属性语言（Stats.ts 的三层属性），
 * 而不是继续手写 hp/atk/def 四维。
 *
 * 等价性保证：NPC 的旧 `challengeStats{hp,atk,def}` 通过 `legacyToMonsterPrimary` 反解成主属性
 * （与 C3 怪物迁移同一套算法，三轴独立反解、round 后等价），因此**不会让 NPC 变弱**。
 */
import {
  buildDerived,
  buildMonsterDerived,
  legacyToMonsterPrimary,
  type LegacyStats,
} from './Stats';

/** NPC 挑战属性的等价等级估值（仅用于派生与面板展示，不影响等价性） */
export function estimateNpcLevel(stats: { hp: number; atk: number; def: number }): number {
  // 怪物 atk ≈ (1.5×lv)×1.6 + lv×0.8 ≈ 3.2×lv → 以 atk 反推等级
  return Math.max(1, Math.round(stats.atk / 3.2));
}

/** NPC 挑战怪：旧四维 → 主属性 → 派生（等价、不变弱） */
export function deriveNpcStats(stats: { hp: number; atk: number; def: number }): {
  level: number;
  primary: ReturnType<typeof legacyToMonsterPrimary>;
  derived: ReturnType<typeof buildMonsterDerived>;
} {
  const level = estimateNpcLevel(stats);
  const legacy: LegacyStats = {
    hp: stats.hp,
    atk: stats.atk,
    def: stats.def,
    crit: 0,
    critDmg: 1.5,
  };
  const primary = legacyToMonsterPrimary(legacy, level);
  return { level, primary, derived: buildMonsterDerived(primary, level) };
}

/** 队友：等级 + 精英标记 → 主属性 → 派生（英雄用 buildDerived，队友不闪避/不暴击由 Combat 侧决定） */
export function deriveTeammate(level: number, isElite = false): {
  level: number;
  primary: ReturnType<typeof legacyToMonsterPrimary>;
  derived: ReturnType<typeof buildDerived>;
} {
  const lv = Math.max(1, level);
  const k = isElite ? 1.25 : 1.0;
  const primary = {
    root: lv * 1.0 * k,
    qi: lv * 1.2 * k,
    agility: lv * 0.7 * k,
    spirit: lv * 0.6 * k,
    fortune: lv * 0.3 * k,
  };
  return { level: lv, primary, derived: buildDerived(primary, lv) };
}
