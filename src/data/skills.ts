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
  // ══════════════════════════════════════════════════════════════════════
  // B3：门派补齐 + 连携 / 克制
  // B3 之前六门类严重失衡：掌法 0 招、拳法只有 1 招，玩家再怎么收集也只有剑/刀可选。
  // 这一批把六门类都补到 ≥3 招，并引入两条新维度：
  //   连携 —— 先挂状态、再用对应招式收割（斩魄刀对流血目标、无相劫指对破防目标）
  //   克制 —— 对特定类型目标额外伤害（撼地拳对大妖）
  // 倍率严格遵守档位区间（轻 0.85~1.45 / 中 1.5~2.0 / 绝 ≥2.4），由断言把关。
  // ══════════════════════════════════════════════════════════════════════
  // ── 掌法（B3 补齐：此前一门全空） ──
  'palm_shock': {
    id: 'palm_shock', name: '震山掌', grade: 1, school: 'palm',
    cost: RAGE_LIGHT, kind: 'strike', power: 1.2, apply: ['sunder'],
    desc: '掌力沉猛，造成 120% 攻击伤害并震松对手护体真气',
  },
  'palm_break': {
    id: 'palm_break', name: '金刚掌', grade: 2, school: 'palm',
    cost: RAGE_HEAVY, kind: 'strike', power: 1.75, hits: 2,
    desc: '两掌连拍，合计 175% 攻击伤害，掌掌透骨',
  },
  'palm_void': {
    id: 'palm_void', name: '无相劫指', grade: 4, school: 'palm',
    cost: RAGE_ULT, kind: 'burst', power: 2.7, apply: ['stun'],
    bonus: [{ when: 'targetSundered', mult: 1.3 }],
    desc: '一指破空，造成 270% 攻击伤害并震得对手动弹不得；对已被破防的目标额外加伤',
  },
  // ── 拳法（B3 补齐：此前只有崩山拳） ──
  'fist_chain': {
    id: 'fist_chain', name: '连环拳', grade: 1, school: 'fist',
    cost: RAGE_LIGHT, kind: 'strike', power: 1.1, hits: 3,
    desc: '三拳连环，合计 110% 攻击伤害；段数多，命中更稳、更易触发附带效果',
  },
  'fist_quake': {
    id: 'fist_quake', name: '撼地拳', grade: 2, school: 'fist',
    cost: RAGE_HEAVY, kind: 'area', power: 1.8, apply: ['sunder'],
    bonus: [{ when: 'targetBoss', mult: 1.15 }],
    desc: '一拳撼地，造成 180% 攻击伤害并震裂护体；对大妖额外加伤',
  },
  // ── 刀法（B3 补齐） ──
  'blade_wave': {
    id: 'blade_wave', name: '断浪刀', grade: 1, school: 'blade',
    cost: RAGE_LIGHT, kind: 'area', power: 1.25, apply: ['bleed'],
    desc: '横刀断浪，造成 125% 攻击伤害并使目标流血',
  },
  'blade_execute': {
    id: 'blade_execute', name: '斩魄刀', grade: 2, school: 'blade',
    cost: RAGE_HEAVY, kind: 'strike', power: 1.85,
    bonus: [{ when: 'targetBleeding', mult: 1.4 }],
    desc: '一刀斩魄，造成 185% 攻击伤害；对正在流血的目标额外加伤（连携）',
  },
  // ── 剑法（B3 补齐） ──
  'sword_qi': {
    id: 'sword_qi', name: '剑气纵横', grade: 1, school: 'sword',
    cost: RAGE_LIGHT, kind: 'strike', power: 1.25, hits: 2,
    desc: '两道剑气交错，合计 125% 攻击伤害',
  },
  // ── 术法（B3 补齐） ──
  'art_frost': {
    id: 'art_frost', name: '玄冰咒', grade: 2, school: 'art',
    cost: RAGE_HEAVY, kind: 'strike', power: 1.6, apply: ['sunder'],
    desc: '寒气冻体，造成 160% 攻击伤害并冻裂护体',
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
  // ══════════════════════════════════════════════════════════════════════
  // B5：名角 Boss 专属招式（monsterOnly）
  // B5 之前所有 Boss 共用 `['blood_frenzy','poison_breath']` 两招 —— 白骨精和
  // 青牛精打起来一模一样，玩家练出来的"针对性打法"毫无意义。
  // 现在每个名角各有 2 招常态 + 1 招半血狂暴，招式口味也按原著设定走：
  // 白骨精（魅惑+白骨）、红孩儿（三昧真火）、牛魔王（蛮力）、青牛精（金刚琢）、
  // 金角（葫芦收人）、百眼魔君（千眼金光）、大鹏（遮天一击）、青狮（吞天）、白象（卷山）。
  // 倍率同样受档位断言约束，不会因为"是 Boss"就随便越档。
  // ══════════════════════════════════════════════════════════════════════
  // ── 白骨精 ──
  'bg_seduce': {
    id: 'bg_seduce', name: '魅惑之舞', grade: 2, school: 'art',
    cost: RAGE_LIGHT, kind: 'strike', power: 1.15, apply: ['sunder'], monsterOnly: true,
    desc: '一舞惑心，造成 115% 攻击伤害并松懈对手护体',
  },
  'bg_bone_claw': {
    id: 'bg_bone_claw', name: '白骨爪', grade: 3, school: 'fist',
    cost: RAGE_HEAVY, kind: 'strike', power: 1.7, apply: ['bleed'], monsterOnly: true,
    desc: '枯爪透体，造成 170% 攻击伤害并使目标流血',
  },
  'bg_three_lives': {
    id: 'bg_three_lives', name: '三戏还魂', grade: 4, school: 'art',
    cost: RAGE_ULT, kind: 'burst', power: 2.6, drain: 0.25, monsterOnly: true,
    desc: '三戏轮回，造成 260% 攻击伤害并夺其精气回己身',
  },
  // ── 红孩儿 ──
  'he_smoke': {
    id: 'he_smoke', name: '烟火迷障', grade: 2, school: 'art',
    cost: RAGE_LIGHT, kind: 'strike', power: 1.2, apply: ['poison'], monsterOnly: true,
    desc: '烟熏火燎，造成 120% 攻击伤害并施加中毒',
  },
  'he_flame': {
    id: 'he_flame', name: '三昧真火', grade: 3, school: 'art',
    cost: RAGE_HEAVY, kind: 'area', power: 1.7, apply: ['bleed'], monsterOnly: true,
    desc: '真火焚身，造成 170% 攻击伤害并使目标灼血不止',
  },
  'he_firecloud': {
    id: 'he_firecloud', name: '火云漫天', grade: 5, school: 'art',
    cost: RAGE_ULT, kind: 'area', power: 2.9, apply: ['bleed'], monsterOnly: true,
    desc: '一洞火云压下，造成 290% 攻击伤害并燃及周身',
  },
  // ── 牛魔王 ──
  'nm_roar': {
    id: 'nm_roar', name: '牛王怒吼', grade: 2, school: 'body',
    cost: RAGE_LIGHT, kind: 'strike', power: 1.15, apply: ['rally'], monsterOnly: true,
    desc: '一声怒吼，造成 115% 攻击伤害并自身进入狂热',
  },
  'nm_staff': {
    id: 'nm_staff', name: '混铁横扫', grade: 3, school: 'blade',
    cost: RAGE_HEAVY, kind: 'strike', power: 1.85, monsterOnly: true,
    desc: '万斤铁棍横扫，造成 185% 攻击伤害',
  },
  'nm_fury': {
    id: 'nm_fury', name: '蛮牛践踏', grade: 5, school: 'body',
    cost: RAGE_ULT, kind: 'burst', power: 3.1, apply: ['sunder'], monsterOnly: true,
    desc: '一身蛮力踏下，造成 310% 攻击伤害并震裂护体',
  },
  // ── 青牛精 ──
  'qn_charge': {
    id: 'qn_charge', name: '独角冲撞', grade: 2, school: 'body',
    cost: RAGE_LIGHT, kind: 'strike', power: 1.25, monsterOnly: true,
    desc: '低头一撞，造成 125% 攻击伤害',
  },
  'qn_ring': {
    id: 'qn_ring', name: '金刚琢套', grade: 3, school: 'art',
    cost: RAGE_HEAVY, kind: 'strike', power: 1.7, apply: ['sunder'], monsterOnly: true,
    desc: '金刚琢一收，造成 170% 攻击伤害并套走对方兵器（破防）',
  },
  'qn_devour': {
    id: 'qn_devour', name: '套尽天下', grade: 5, school: 'art',
    cost: RAGE_ULT, kind: 'drain', power: 3.0, drain: 0.35, monsterOnly: true,
    desc: '琢光罩下，造成 300% 攻击伤害并吞其四成精气',
  },
  // ── 金角大王 ──
  'jj_call': {
    id: 'jj_call', name: '呼名摄魂', grade: 2, school: 'art',
    cost: RAGE_LIGHT, kind: 'strike', power: 1.2, apply: ['stun'], monsterOnly: true,
    desc: '一声呼名，造成 120% 攻击伤害并震摄心神',
  },
  'jj_gourd': {
    id: 'jj_gourd', name: '紫金葫芦', grade: 3, school: 'art',
    cost: RAGE_HEAVY, kind: 'drain', power: 1.7, drain: 0.3, monsterOnly: true,
    desc: '葫芦一吸，造成 170% 攻击伤害并转其三成精气为己用',
  },
  'jj_command': {
    id: 'jj_command', name: '平顶山号令', grade: 4, school: 'body',
    cost: RAGE_ULT, kind: 'burst', power: 2.7, apply: ['rally'], monsterOnly: true,
    desc: '号令群山，造成 270% 攻击伤害并自身狂热',
  },
  // ── 百眼魔君 ──
  'by_glare': {
    id: 'by_glare', name: '金光灼射', grade: 2, school: 'art',
    cost: RAGE_LIGHT, kind: 'strike', power: 1.2, apply: ['sunder'], monsterOnly: true,
    desc: '胁下眼光一射，造成 120% 攻击伤害并灼裂护体',
  },
  'by_web': {
    id: 'by_web', name: '蛛丝缠身', grade: 3, school: 'art',
    cost: RAGE_HEAVY, kind: 'strike', power: 1.7, apply: ['stun'], monsterOnly: true,
    desc: '千丝缚身，造成 170% 攻击伤害并缠得对手动弹不得',
  },
  'by_dazzle': {
    id: 'by_dazzle', name: '千眼齐睁', grade: 5, school: 'art',
    cost: RAGE_ULT, kind: 'area', power: 2.8, apply: ['poison'], monsterOnly: true,
    desc: '千眼同睁，金光罩定一方，造成 280% 攻击伤害并附剧毒',
  },
  // ── 大鹏金翅雕 ──
  'dp_bottle': {
    id: 'dp_bottle', name: '阴阳二气', grade: 2, school: 'art',
    cost: RAGE_LIGHT, kind: 'drain', power: 1.2, drain: 0.3, monsterOnly: true,
    desc: '瓶中二气一泄，造成 120% 攻击伤害并化其三成精气',
  },
  'dp_wing': {
    id: 'dp_wing', name: '遮天翼展', grade: 3, school: 'body',
    cost: RAGE_HEAVY, kind: 'strike', power: 1.8, monsterOnly: true,
    desc: '双翼遮天，造成 180% 攻击伤害',
  },
  'dp_dash': {
    id: 'dp_dash', name: '大鹏一击', grade: 5, school: 'body',
    cost: RAGE_ULT, kind: 'burst', power: 3.3, monsterOnly: true,
    desc: '一翼九万里，俯冲直下，造成 330% 攻击伤害',
  },
  // ── 青狮精 ──
  'qs_roar': {
    id: 'qs_roar', name: '狮吼摄魄', grade: 2, school: 'body',
    cost: RAGE_LIGHT, kind: 'strike', power: 1.15, apply: ['stun'], monsterOnly: true,
    desc: '一声狮吼，造成 115% 攻击伤害并摄人心神',
  },
  'qs_bite': {
    id: 'qs_bite', name: '血盆大口', grade: 3, school: 'body',
    cost: RAGE_HEAVY, kind: 'drain', power: 1.75, drain: 0.25, monsterOnly: true,
    desc: '张口一咬，造成 175% 攻击伤害并吞其气血',
  },
  'qs_swallow': {
    id: 'qs_swallow', name: '吞天之势', grade: 5, school: 'body',
    cost: RAGE_ULT, kind: 'burst', power: 2.8, apply: ['rally'], monsterOnly: true,
    desc: '一钹吞天，造成 280% 攻击伤害并气势暴涨',
  },
  // ── 白象精 ──
  'bx_step': {
    id: 'bx_step', name: '象步震地', grade: 2, school: 'body',
    cost: RAGE_LIGHT, kind: 'strike', power: 1.2, apply: ['sunder'], monsterOnly: true,
    desc: '一步落下，造成 120% 攻击伤害并震松护体',
  },
  'bx_trunk': {
    id: 'bx_trunk', name: '玉鼻横扫', grade: 3, school: 'body',
    cost: RAGE_HEAVY, kind: 'area', power: 1.75, monsterOnly: true,
    desc: '长鼻横扫，造成 175% 攻击伤害',
  },
  'bx_crush': {
    id: 'bx_crush', name: '卷山裂岳', grade: 5, school: 'body',
    cost: RAGE_ULT, kind: 'burst', power: 3.0, apply: ['stun'], monsterOnly: true,
    desc: '鼻卷山岳一搓，造成 300% 攻击伤害并震晕对手',
  },
  // ══ 通用妖类（无专属招式的杂鱼 Boss 用） ══
  'poison_breath': {
    id: 'poison_breath', name: '剧毒吐息', grade: 2, school: 'art',
    cost: RAGE_LIGHT, kind: 'strike', power: 0.95, apply: ['poison'], monsterOnly: true,
    desc: '造成 95% 攻击伤害并施加中毒',
  },
  'blood_frenzy': {
    id: 'blood_frenzy', name: '血性狂暴', grade: 2, school: 'body',
    cost: RAGE_HEAVY, kind: 'burst', power: 1.7, apply: ['rally'], monsterOnly: true,
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

/** 按品级升序列出全部可学武学（自动排除 monsterOnly 的妖类/Boss 招式），供秘籍/师门/图鉴使用 */
export function learnableArts(): SkillDef[] {
  return Object.values(SKILLS)
    .filter((s) => (s.grade ?? 0) < 6 && !s.monsterOnly)
    .sort((a, b) => (a.grade ?? 0) - (b.grade ?? 0));
}

/** 六门类名（断言与界面共用） */
export const SKILL_SCHOOL_IDS = ['sword', 'blade', 'fist', 'palm', 'body', 'art'] as const;

/** 按门类统计可学武学（B3 门派均衡断言用） */
export function artsBySchool(): Record<string, SkillDef[]> {
  const out: Record<string, SkillDef[]> = {};
  for (const id of SKILL_SCHOOL_IDS) out[id] = [];
  for (const s of learnableArts()) {
    if (s.school && out[s.school]) out[s.school].push(s);
  }
  return out;
}

/**
 * 法宝专属大招 id 集合。
 * 这些招式由装备法宝注入技能槽，**不配秘籍**——是"收集法宝"的奖励，
 * 而不是"读书"能拿到的。断言据此区分"需要秘籍的武学"与"法宝附赠"。
 */
export const RELIC_ART_IDS: string[] = [
  'gourd_devour', 'golden_glow', 'ox_charge', 'lion_roar', 'elephant_sweep',
];

/** 需要秘籍才能学到的武学（可学主动 − 起手三招 − 法宝专属） */
export function artsNeedingBook(): SkillDef[] {
  return learnableArts().filter(
    (s) => !DEFAULT_HERO_SKILLS.includes(s.id) && !RELIC_ART_IDS.includes(s.id),
  );
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

/**
 * 无专属招式的普通 Boss 的兜底招式（B5）。
 * 名角 Boss 各自带 arts / artsPhase2；这条只在怪物没配 arts 时使用，
 * 保证"随便一只 isBoss 杂鱼"也有妖术可放，不会退化成只会普攻。
 */
export const DEFAULT_BOSS_ARTS = ['blood_frenzy', 'poison_breath'];

/** 名角 Boss 的专属招式组（B5 断言用：每个名角都要配齐常态 + 狂暴两套） */
export const NAMED_BOSS_ARTS: Record<string, { arts: string[]; phase2: string[] }> = {
  '白骨精': { arts: ['bg_seduce', 'bg_bone_claw'], phase2: ['bg_three_lives', 'bg_bone_claw'] },
  '红孩儿': { arts: ['he_smoke', 'he_flame'], phase2: ['he_firecloud', 'he_flame'] },
  '牛魔王': { arts: ['nm_roar', 'nm_staff'], phase2: ['nm_fury', 'nm_staff'] },
  '青牛精': { arts: ['qn_charge', 'qn_ring'], phase2: ['qn_devour', 'qn_ring'] },
  '金角大王': { arts: ['jj_call', 'jj_gourd'], phase2: ['jj_command', 'jj_gourd'] },
  '百眼魔君': { arts: ['by_glare', 'by_web'], phase2: ['by_dazzle', 'by_web'] },
  '大鹏金翅雕': { arts: ['dp_bottle', 'dp_wing'], phase2: ['dp_dash', 'dp_wing'] },
  '青狮精': { arts: ['qs_roar', 'qs_bite'], phase2: ['qs_swallow', 'qs_bite'] },
  '白象精': { arts: ['bx_step', 'bx_trunk'], phase2: ['bx_crush', 'bx_trunk'] },
};
