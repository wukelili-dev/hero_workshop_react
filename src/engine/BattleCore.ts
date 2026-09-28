/**
 * BattleCore — 战斗原语（命中 / 伤害 / 破甲 / 状态 / 怒气）
 *
 * 从 Combat.ts 原样搬出来的那套结算规则，**数值一行没改**，只是变成可被复用的纯函数：
 * 回合引擎（engine/Battle.ts）与自动结算（Combat.executeBattle）共用它，
 * 保证"手动打"和"自动打"跑的是同一套规则，不会出现两套平衡。
 */
import type { Combatant, ItemEffect, SkillDef, StatusEffectId } from '../types';
import { sum as sumEffect, sumList } from './ItemEffects';
import { STAT_CAPS } from './Stats';
import { getSkill, DEFAULT_HERO_SKILLS } from '../data/skills';

// ── 怒气常量 ──
export const RAGE_MAX = 100;
export const RAGE_GAIN_ATK = 15;
export const RAGE_GAIN_HIT = 10;

/** 战斗上下文：来自装备/名物的那些"每次受击/出手才结算"的词条 */
export interface BattleCtx {
  comboChance: number;
  reflect: number;
  thorns: number;
  guardChance: number;
  damageCut: number;
  lifesteal: number;
}

export const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

// ── 状态层 ──
export function stacksOf(c: Combatant, id: StatusEffectId): number {
  const s = c.vars.statuses.find((x) => x.id === id);
  return s ? s.stacks : 0;
}

export function hasStatus(c: Combatant, id: StatusEffectId): boolean {
  return c.vars.statuses.some((x) => x.id === id && x.turns > 0);
}

/** 施加状态：同种刷新不叠层（刷新层数与回合），上限 5 层 */
export function addStatus(c: Combatant, id: StatusEffectId, stacks = 1, turns = 2): void {
  const existing = c.vars.statuses.find((x) => x.id === id);
  if (existing) {
    existing.stacks = Math.min(5, existing.stacks + stacks);
    existing.turns = Math.max(existing.turns, turns);
  } else {
    c.vars.statuses.push({ id, stacks: Math.min(5, stacks), turns });
  }
}

/** 回合末：状态层数/回合递减，过期移除 */
export function tickStatuses(c: Combatant): void {
  c.vars.statuses = c.vars.statuses
    .map((s) => ({ ...s, turns: s.turns - 1 }))
    .filter((s) => s.turns > 0);
}

export function speedOf(c: Combatant): number {
  return c.derived.speed * (hasStatus(c, 'haste') ? 1.2 : 1);
}

/** 有效防御：先结算破甲（sunder 减防 → pen 扣除，pen ≤ 目标防御 60%） */
export function effectiveDef(defender: Combatant, attacker: Combatant): number {
  let def = defender.derived.def;
  const sunder = Math.min(stacksOf(defender, 'sunder'), 3);
  if (sunder > 0) def *= 1 - 0.1 * sunder;
  const equipPen = sumList(attacker.equipmentEffects ?? [], 'armorPen');
  const pen = attacker.derived.pen + equipPen;
  const cappedPen = Math.min(pen, def * STAT_CAPS.penRatio);
  return Math.max(0, def - cappedPen);
}

/** 命中率：命中 − 闪避，clamp 0.35~0.99 */
export function hitRateOf(attacker: Combatant, defender: Combatant): number {
  return clamp(attacker.derived.hit - defender.derived.dodge, 0.35, 0.99);
}

/** 单次伤害结算（破甲/暴击/克制/状态，含随机方差） */
export function rollDamage(attacker: Combatant, defender: Combatant, isCrit: boolean): number {
  const effDef = effectiveDef(defender, attacker);
  let atk = attacker.derived.atk;
  const rally = Math.min(stacksOf(attacker, 'rally'), 3);
  if (rally > 0) atk *= 1 + 0.15 * rally;

  const critFactor = isCrit ? clamp(attacker.derived.critDmg, 1.5, STAT_CAPS.critDmg) : 1.0;
  const lf = lineageFactor(attacker.lineage, defender.lineage);
  const guard = hasStatus(defender, 'guard') ? 0.7 : 1.0;
  const variance = 0.9 + Math.random() * 0.2;

  const base = atk * (1 - effDef / (effDef + 50));
  return Math.max(1, Math.floor(base * variance * critFactor * lf * guard));
}

/** 克制循环 human → demon → divine → human（克制方 +15%，被克 −10%） */
const LINEAGE_CYCLE = { human: 'demon', demon: 'divine', divine: 'human' } as const;
export function lineageFactor(attacker: 'human' | 'demon' | 'divine', defender: 'human' | 'demon' | 'divine'): number {
  if (LINEAGE_CYCLE[attacker] === defender) return 1.15;
  if (LINEAGE_CYCLE[defender] === attacker) return 0.9;
  return 1.0;
}

export function checkCrit(rate: number): boolean {
  return Math.random() < rate;
}

/** 扣护盾，返回真正落到血量上的伤害 */
export function applyShield(defender: Combatant, dmg: number): number {
  let hpDmg = dmg;
  if (defender.vars.shield > 0 && hpDmg > 0) {
    const absorbed = Math.min(defender.vars.shield, hpDmg);
    defender.vars.shield -= absorbed;
    hpDmg -= absorbed;
  }
  return Math.max(0, hpDmg);
}

/**
 * 一次普通攻击：返回落到血量上的伤害；未命中返回 -1。
 * 命中/受击各累积怒气。
 */
export function strike(attacker: Combatant, defender: Combatant, isCrit: boolean): number {
  if (Math.random() > hitRateOf(attacker, defender)) return -1;
  const hpDmg = applyShield(defender, rollDamage(attacker, defender, isCrit));
  attacker.vars.rage = Math.min(RAGE_MAX, attacker.vars.rage + RAGE_GAIN_ATK);
  defender.vars.rage = Math.min(RAGE_MAX, defender.vars.rage + RAGE_GAIN_HIT);
  return hpDmg;
}

export interface ArtOutcome {
  hpDmg: number;      // 落到目标血量上的总伤害
  missed: boolean;    // 全部段数都未命中
  multihit: number;   // 命中段数
  healed: number;     // 自身回复量（含吸血）
  shieldGained: number;
  skill: SkillDef;
}

/**
 * 释放一招武学：按 kind 结算，支持多段、吸血、回气、护体。
 * 调用方负责扣除怒气（cost）与把 hpDmg 落到目标血量上。
 */
export function useMartialArt(attacker: Combatant, defender: Combatant, skill: SkillDef): ArtOutcome {
  const hits = Math.max(1, skill.hits ?? 1);
  let hpDmg = 0;
  let landed = 0;

  for (let i = 0; i < hits; i++) {
    if (Math.random() > hitRateOf(attacker, defender)) continue;
    landed++;
    // power 是总倍率 → 按段数摊分，多段不会直接翻倍
    const per = rollDamage(attacker, defender, skill.kind === 'burst') * (skill.power / hits);
    hpDmg += applyShield(defender, Math.max(1, Math.floor(per)));
  }

  // 附带状态：增益类挂自己，其余挂目标
  if (skill.apply && landed > 0) {
    const self = skill.kind === 'support' || skill.kind === 'guard';
    for (const s of skill.apply) addStatus(self ? attacker : defender, s, 1, 2);
  }

  const shieldGained = skill.shield ? Math.floor(attacker.derived.hpMax * skill.shield) : 0;
  if (shieldGained > 0) {
    attacker.vars.shield += shieldGained;
    addStatus(attacker, 'guard', 1, 1);
  }
  const healedBase = skill.heal ? Math.floor(attacker.derived.hpMax * skill.heal) : 0;
  const healed = healedBase + Math.floor(hpDmg * (skill.drain ?? 0));

  if (landed > 0) attacker.vars.rage = Math.min(RAGE_MAX, attacker.vars.rage + RAGE_GAIN_ATK);
  defender.vars.rage = Math.min(RAGE_MAX, defender.vars.rage + RAGE_GAIN_HIT);

  return { hpDmg, missed: landed === 0, multihit: landed, healed, shieldGained, skill };
}

/** 玩家已学武学（缺省起手三招） */
export function heroArtsOf(c: Combatant): SkillDef[] {
  return (c.skills ?? DEFAULT_HERO_SKILLS).map(getSkill).filter((s): s is SkillDef => !!s);
}

/** Boss 武学 */
export function bossArtsOf(c: Combatant): SkillDef[] {
  return c.isBoss
    ? (['blood_frenzy', 'poison_breath'].map(getSkill).filter(Boolean) as SkillDef[])
    : [];
}

/** 把装备/套装/被动词条与名物持有词条折算成战斗上下文 */
export function battleCtxFrom(equipEffects: ItemEffect[]): BattleCtx {
  const total = (kind: ItemEffect['kind']) => sumList(equipEffects, kind) + sumEffect(kind);
  return {
    comboChance: Math.min(0.5, total('combo')),
    reflect: total('reflect'),
    thorns: Math.min(0.6, total('thorns')),
    guardChance: Math.min(0.3, total('guard')),
    damageCut: Math.min(0.9, total('damageCut')),
    lifesteal: total('lifesteal'),
  };
}
