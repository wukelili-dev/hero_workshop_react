/**
 * skills — 武学表（C8：手动战斗 · 招式对决）
 *
 * 一款武学 = 品级（0 凡品 ~ 5 仙品） + 门类（剑/刀/拳/掌/体/术） + 结算方式（kind） + 附加效果。
 * 数值口径：
 *   power 是**总倍率**（strike/burst/area 乘攻击；guard/support 乘最大生命）；
 *   hits > 1 时按段数摊分，多段只换来更稳的命中与更多状态触发次数，不会直接翻倍伤害；
 *   drain/heal/shield 分别是吸血 / 回气 / 护体比例。
 * 怒气来源与结算见 engine/BattleCore.ts；消耗见下方 RAGE_* 三档。
 */
import type { ItemEffect, SkillDef } from '../types';

/**
 * 怒气分档（B2）
 *
 * B2 之前所有武学一刀切 cost 100 —— 一场 6~10 回合的战斗只够放 1~2 次，
 * 招式退化成"攒满放一次的必杀"，加再多招也没意义。改三档后一场战斗能轮转 4~6 次：
 *   轻招 40：约 3 回合一次，倍率贴近普攻，价值在附带效果（破甲/流血/回血）
 *   中招 70：约 5 回合一次，主力输出
 *   绝招 100：约 7 回合一次，定胜负的那一下
 * 倍率区间：轻招 0.85~1.45、中招 1.6~1.9、绝招 2.4+，档位之间拉开体感差距。
 */
export const RAGE_LIGHT = 40;
export const RAGE_HEAVY = 70;
export const RAGE_ULT = 100;

/**
 * 技能槽上限（B2：3 → 6）
 * 之前是 3，而默认起手三招正好占满 —— 读技能书等于"顶替第一个"，
 * 成长体验从"解锁"退化成"换装"。扩到 6 后玩家才能真的做搭配。
 */
export const MAX_ACTIVE_SKILLS = 6;

export const SKILLS: Record<string, SkillDef> = {
  // ══ 凡品（人人可学，起手三招 —— 全是轻招，开局就能轮转） ══
  'power_strike': {
    id: 'power_strike', name: '破军斩', grade: 0, school: 'sword',
    cost: RAGE_LIGHT, kind: 'strike', power: 1.15, apply: ['sunder'],
    desc: '一记重斩，造成 115% 攻击伤害并削弱目标防御',
  },
  'guard_stance': {
    id: 'guard_stance', name: '铁壁', grade: 0, school: 'body',
    cost: RAGE_LIGHT, kind: 'guard', power: 0.3, apply: ['guard'],
    desc: '沉身架势，获得 30% 最大生命的护盾并进入格挡',
  },
  'drain_strike': {
    id: 'drain_strike', name: '噬血', grade: 0, school: 'blade',
    cost: RAGE_LIGHT, kind: 'drain', power: 1.05, drain: 0.35,
    desc: '造成 105% 攻击伤害，并回复其中 35% 为自身生命',
  },
  // ══ 良品 ══
  'burst_rage': {
    id: 'burst_rage', name: '狂怒', grade: 1, school: 'blade',
    cost: RAGE_HEAVY, kind: 'burst', power: 1.9,
    desc: '倾力一击，造成 190% 攻击伤害',
  },
  'whirlwind': {
    id: 'whirlwind', name: '旋风斩', grade: 1, school: 'blade',
    cost: RAGE_LIGHT, kind: 'area', power: 1.1, apply: ['bleed'],
    desc: '横扫一周，造成 110% 攻击伤害并使目标流血',
  },
  'mend': {
    id: 'mend', name: '回春诀', grade: 1, school: 'art',
    cost: RAGE_LIGHT, kind: 'support', power: 0.25, heal: 0.25, apply: ['haste'],
    desc: '运功自愈，回复 25% 最大生命并身法加速',
  },
  // ══ 珍品 ══
  'falling_petals': {
    id: 'falling_petals', name: '落英剑法', grade: 2, school: 'sword',
    cost: RAGE_HEAVY, kind: 'strike', power: 1.6, hits: 3, apply: ['bleed'],
    desc: '三剑连刺，合计 160% 攻击伤害，剑剑催血',
  },
  'mountain_fist': {
    id: 'mountain_fist', name: '崩山拳', grade: 2, school: 'fist',
    cost: RAGE_HEAVY, kind: 'strike', power: 1.8, apply: ['sunder'],
    desc: '一拳崩山，造成 180% 攻击伤害并重创护体真气',
  },
  'calm_mind': {
    id: 'calm_mind', name: '静心诀', grade: 2, school: 'art',
    cost: RAGE_HEAVY, kind: 'support', power: 0.3, heal: 0.3, shield: 0.2,
    desc: '凝神内视，回复 30% 最大生命并举 20% 最大生命的护盾',
  },
  // ══ 秘宝 ══
  'five_thunder': {
    id: 'five_thunder', name: '五雷正法', grade: 3, school: 'art',
    cost: RAGE_HEAVY, kind: 'strike', power: 1.7, apply: ['stun'],
    desc: '引雷落顶，造成 170% 攻击伤害并震得对手动弹不得',
  },
  'golden_bell': {
    id: 'golden_bell', name: '金钟罩', grade: 3, school: 'body',
    cost: RAGE_HEAVY, kind: 'guard', power: 0.35, shield: 0.35, apply: ['guard'],
    desc: '真气罩体，获得 35% 最大生命的护盾并格挡',
  },
  // ══ 神物 ══
  'taiyi_sword': {
    id: 'taiyi_sword', name: '太乙玄门剑', grade: 4, school: 'sword',
    cost: RAGE_ULT, kind: 'burst', power: 2.4, hits: 2, apply: ['sunder'],
    desc: '两剑连环，合计 240% 攻击伤害，破去目标护体',
  },
  'immovable_seal': {
    id: 'immovable_seal', name: '不动明王印', grade: 4, school: 'body',
    cost: RAGE_ULT, kind: 'guard', power: 0.5, shield: 0.3, apply: ['guard'],
    desc: '结印如山，获得 50% 最大生命的护盾，几近无隙',
  },
  // ══ 仙品 ══
  'taishang_forget': {
    id: 'taishang_forget', name: '太上忘情', grade: 5, school: 'art',
    cost: RAGE_ULT, kind: 'burst', power: 3.2, drain: 0.25,
    desc: '忘情一击，造成 320% 攻击伤害并夺其精气回复自身',
  },
  'zhou_tian': {
    id: 'zhou_tian', name: '周天星斗', grade: 5, school: 'sword',
    cost: RAGE_ULT, kind: 'burst', power: 3.0, hits: 4, apply: ['bleed', 'stun'],
    desc: '四象连击，合计 300% 攻击伤害，血光与雷震齐下',
  },
  // ══ 法宝专属大招（装备名角法宝解锁） ══
  'gourd_devour': {
    id: 'gourd_devour', name: '葫芦吞天', grade: 5, school: 'art',
    cost: RAGE_ULT, kind: 'drain', power: 3.0, drain: 0.4, apply: ['sunder'],
    desc: '紫金红葫芦一吸，造成 300% 攻击伤害并吞其四成精气回血',
  },
  'golden_glow': {
    id: 'golden_glow', name: '金光护体', grade: 5, school: 'body',
    cost: RAGE_ULT, kind: 'guard', power: 0.5, shield: 0.5, apply: ['guard'],
    desc: '百眼金光罩一开，举 50% 最大生命护盾并格挡',
  },
  'ox_charge': {
    id: 'ox_charge', name: '青兕撞天', grade: 5, school: 'body',
    cost: RAGE_ULT, kind: 'burst', power: 3.4, apply: ['sunder'],
    desc: '金刚琢护体，青牛之力直撞，造成 340% 攻击伤害并破其防御',
  },
  'lion_roar': {
    id: 'lion_roar', name: '狮吼吞天', grade: 5, school: 'body',
    cost: RAGE_ULT, kind: 'drain', power: 3.2, drain: 0.35, apply: ['stun'],
    desc: '青狮吞天钹一震，狮吼摄魄，造成 320% 攻击伤害并吞其精气回血、震晕敌方',
  },
  'elephant_sweep': {
    id: 'elephant_sweep', name: '象鼻卷山', grade: 5, school: 'body',
    cost: RAGE_ULT, kind: 'burst', power: 3.5, hits: 2, apply: ['stun'],
    desc: '白象玉鼻横扫，两段合计 350% 攻击伤害并震晕敌方',
  },
  // ══ 妖类（怪物 / Boss 使用） ══
  'poison_breath': {
    id: 'poison_breath', name: '剧毒吐息', grade: 2, school: 'art',
    cost: RAGE_LIGHT, kind: 'strike', power: 0.95, apply: ['poison'],
    desc: '造成 95% 攻击伤害并施加中毒',
  },
  'blood_frenzy': {
    id: 'blood_frenzy', name: '血性狂暴', grade: 2, school: 'body',
    cost: RAGE_HEAVY, kind: 'burst', power: 1.7, apply: ['rally'],
    desc: '造成 170% 攻击伤害并进入狂热',
  },
};

export function getSkill(id: string): SkillDef | undefined {
  return SKILLS[id];
}

/** 品级名（与物品品阶同一套口径） */
export const MARTIAL_GRADE_NAME = ['凡品', '良品', '珍品', '秘宝', '神物', '仙品'] as const;

/** 门类名 */
export const SCHOOL_NAME: Record<NonNullable<SkillDef['school']>, string> = {
  sword: '剑法', blade: '刀法', fist: '拳法', palm: '掌法', body: '体术', art: '术法',
};

/** 按品级升序列出全部可学武学（不含妖类招式），供秘籍/师门/图鉴使用 */
export function learnableArts(): SkillDef[] {
  return Object.values(SKILLS)
    .filter((s) => (s.grade ?? 0) < 6 && s.id !== 'poison_breath' && s.id !== 'blood_frenzy')
    .sort((a, b) => (a.grade ?? 0) - (b.grade ?? 0));
}

// ── 被动技能（C5）：学得后作为「持有类词条」常驻生效，复用 ItemEffects 的全部挂点 ──
export const PASSIVE_SKILLS: Record<string, { name: string; desc: string; effects: ItemEffect[] }> = {
  iron_shirt: {
    name: '铁布衫',
    desc: '常年硬功，受伤减少 10%',
    effects: [{ kind: 'damageCut', trigger: 'hold', value: 0.1 }],
  },
  swift_step: {
    name: '疾风步',
    desc: '身法轻灵，闪避 +6%',
    effects: [{ kind: 'dodge', trigger: 'hold', value: 0.06 }],
  },
  tiger_fist: {
    name: '伏虎劲',
    desc: '拳脚刚猛，攻击 +8%',
    effects: [{ kind: 'atkPct', trigger: 'hold', value: 0.08 }],
  },
};

/** 把已学会的被动技能折算成词条（供战斗侧合并到装备词条里） */
export function passiveEffectsOf(passiveIds: string[] | undefined): ItemEffect[] {
  if (!passiveIds || passiveIds.length === 0) return [];
  return passiveIds.flatMap((id) => PASSIVE_SKILLS[id]?.effects ?? []);
}

/** 玩家的默认武学（无秘籍时的起手三招，全是轻招，开局就能放） */
export const DEFAULT_HERO_SKILLS = ['power_strike', 'guard_stance', 'drain_strike'];
