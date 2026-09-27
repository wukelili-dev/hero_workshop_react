/**
 * skills — 技能表（C5，数据驱动）
 * 怒气满 100 可释放；kind 决定结算方式。
 * power 为系数：strike/burst 乘 atk，guard/support 乘 hpMax，drain 乘 atk 并回血。
 */
import type { SkillDef } from '../types';

export const SKILLS: Record<string, SkillDef> = {
  // ── 通用（玩家默认，人人可学） ──
  'power_strike': {
    id: 'power_strike', name: '破军斩', cost: 100, kind: 'strike', power: 1.6,
    apply: ['sunder'], desc: '全力一击，造成 160% 攻击伤害并削弱目标防御',
  },
  'guard_stance': {
    id: 'guard_stance', name: '铁壁', cost: 100, kind: 'guard', power: 0.3,
    apply: ['guard'], desc: '进入格挡姿态，本回合受伤 -30% 并生成护盾',
  },
  'drain_strike': {
    id: 'drain_strike', name: '噬血', cost: 100, kind: 'drain', power: 1.3,
    desc: '造成 130% 攻击伤害并回复等量生命',
  },
  'burst_rage': {
    id: 'burst_rage', name: '狂怒', cost: 100, kind: 'burst', power: 2.2,
    desc: '倾尽怒气，造成 220% 攻击伤害',
  },
  // ── 妖类（Boss/怪物技能） ──
  'poison_breath': {
    id: 'poison_breath', name: '剧毒吐息', cost: 100, kind: 'strike', power: 1.1,
    apply: ['poison'], desc: '造成 110% 攻击伤害并施加中毒',
  },
  'blood_frenzy': {
    id: 'blood_frenzy', name: '血性狂暴', cost: 100, kind: 'burst', power: 1.8,
    apply: ['rally'], desc: '造成 180% 攻击伤害并进入狂热',
  },
};

export function getSkill(id: string): SkillDef | undefined {
  return SKILLS[id];
}

/** 玩家的默认技能（无装备形态指定时） */
export const DEFAULT_HERO_SKILLS = ['power_strike', 'guard_stance', 'drain_strike'];
