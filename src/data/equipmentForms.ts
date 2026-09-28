/**
 * equipmentForms — 装备形态与套装（C4）
 * 形态决定"你走哪条轴"：bias 倾斜派生属性，signature 是招牌词条（生成时必带 1~2 条）。
 * 套装：同 setId 2 件 / 4 件各给一条流派词条。
 * 数据驱动：全部是数据表，不硬编码进组件/引擎。
 */
import type { EquipmentForm, EquipmentFormId, ItemEffect, PrimaryStats } from '../types';

// ── 武器 4 形态 ──
export const WEAPON_FORMS: Record<string, EquipmentForm> = {
  swift_blade: {
    id: 'swift_blade', kind: 'weapon', form: 'swift_blade',
    bias: { hit: 0.04, dodge: 0.02, speed: 3, crit: 0.03 },
    signature: ['combo', 'hit'],
    desc: '快剑：命中/连击，以速度和连续出手取胜',
  },
  heavy_blade: {
    id: 'heavy_blade', kind: 'weapon', form: 'heavy_blade',
    bias: { atk: 6, pen: 3, critDmg: 0.2 },
    signature: ['armorPen', 'critDmg'],
    desc: '重刀：破甲/暴伤，一刀重创',
  },
  long_arm: {
    id: 'long_arm', kind: 'weapon', form: 'long_arm',
    bias: { def: 2, hpMax: 10, tenacity: 4 },
    signature: ['reflect', 'damageCut'],
    desc: '长兵：反击/减伤，以守代攻',
  },
  talisman: {
    id: 'talisman', kind: 'weapon', form: 'talisman',
    bias: { atk: 2, resist: 0.05, speed: 1 },
    signature: ['resist', 'rage'],
    desc: '法器：法伤/持续伤害，借力天地',
  },
};

// ── 护甲 3 形态 ──
export const ARMOR_FORMS: Record<string, EquipmentForm> = {
  light_armor: {
    id: 'light_armor', kind: 'armor', form: 'light_armor',
    bias: { dodge: 0.03, speed: 2, hit: 0.02 },
    signature: ['dodge', 'speed'],
    desc: '轻甲：闪避/速度，灵巧身法',
  },
  heavy_armor: {
    id: 'heavy_armor', kind: 'armor', form: 'heavy_armor',
    bias: { def: 4, hpMax: 15, tenacity: 3 },
    signature: ['guard', 'damageCut'],
    desc: '重甲：格挡/减伤，稳如泰山',
  },
  robe: {
    id: 'robe', kind: 'armor', form: 'robe',
    bias: { resist: 0.06, hpMax: 8, speed: 1 },
    signature: ['resist', 'rage'],
    desc: '法衣：抗性/护盾，御气护体',
  },
};

export function getWeaponForm(form: EquipmentFormId): EquipmentForm | undefined {
  return WEAPON_FORMS[form];
}
export function getArmorForm(form: EquipmentFormId): EquipmentForm | undefined {
  return ARMOR_FORMS[form];
}

// ── 套装（同 setId 2 件 / 4 件给流派词条） ──
export interface SetBonus {
  count: number;                 // 触发所需件数
  effects: ItemEffect[];         // 追加的流派词条
  desc: string;
}

export const SET_BONUSES: Record<string, SetBonus[]> = {
  'swift_set': [
    { count: 2, effects: [{ kind: 'combo', trigger: 'equip', value: 0.04 }], desc: '疾风二连（连击 +4%）' },
    { count: 4, effects: [{ kind: 'speed', trigger: 'equip', value: 4 }, { kind: 'dodge', trigger: 'equip', value: 0.03 }], desc: '风影四散（速度 +4，闪避 +3%）' },
  ],
  'heavy_set': [
    { count: 2, effects: [{ kind: 'armorPen', trigger: 'equip', value: 4 }], desc: '破阵二式（破甲 +4）' },
    { count: 4, effects: [{ kind: 'critDmg', trigger: 'equip', value: 0.3 }, { kind: 'atk', trigger: 'equip', value: 10 }], desc: '裂地四击（暴伤 +0.3，攻击 +10）' },
  ],
  'guard_set': [
    { count: 2, effects: [{ kind: 'damageCut', trigger: 'equip', value: 0.03 }], desc: '铜墙二重（减伤 +3%）' },
    { count: 4, effects: [{ kind: 'guard', trigger: 'equip', value: 0.05 }, { kind: 'def', trigger: 'equip', value: 12 }], desc: '不动四岳（格挡 +5%，防御 +12）' },
  ],
};

/** 按套装件数返回应追加的词条（2 件取第 1 档，4 件取第 2 档，不足 2 件无） */
export function setBonusEffects(setId: string | undefined, count: number): ItemEffect[] {
  // 当前英雄只有 2 个装备槽（武器+护甲），套装最多 2 件；
  // 数据里的 count: 4 分支保留不删，等「饰品槽」任务上线后把这一行去掉即可启用
  const reachable = Math.min(count, 2);
  if (!setId) return [];
  const bonuses = SET_BONUSES[setId];
  if (!bonuses) return [];
  const sorted = [...bonuses].sort((a, b) => a.count - b.count);
  const out: ItemEffect[] = [];
  for (const b of sorted) {
    if (reachable >= b.count) out.push(...b.effects);
  }
  return out;
}

/** 形态 → 套装 id（同套装武器+护甲 2 件即可凑成 2 件套） */
const FORM_TO_SET: Record<EquipmentFormId, string> = {
  swift_blade: 'swift_set',
  light_armor: 'swift_set',
  heavy_blade: 'heavy_set',
  heavy_armor: 'heavy_set',
  long_arm: 'guard_set',
  talisman: 'guard_set',
  robe: 'guard_set',
};

export function formSetId(form: EquipmentFormId | undefined): string | undefined {
  return form ? FORM_TO_SET[form] : undefined;
}

// ═══════════════ 装备数值生成（C7：装备重做，主口径改成主属性 + 词条） ═══════════════
//
// 目标：装备不再只给"攻/防/暴击"三件套，而是给**主属性**（喂派生轴）与**流派词条**。
// 一件装备 = 主属性（形态决定往哪偏） + 1~2 条招牌词条（形态决定是哪种玩法）。
// 商城与掉落共用同一条曲线，改一个数字就能整体调平衡。

/** 形态的主属性倾向（权重合计约 1） */
export const FORM_PRIMARY_WEIGHTS: Record<EquipmentFormId, Partial<Record<keyof PrimaryStats, number>>> = {
  swift_blade: { agility: 0.45, spirit: 0.35, qi: 0.20 },
  heavy_blade: { qi: 0.65, fortune: 0.20, root: 0.15 },
  long_arm:    { root: 0.40, qi: 0.35, spirit: 0.25 },
  talisman:    { spirit: 0.40, fortune: 0.35, qi: 0.25 },
  light_armor: { agility: 0.55, root: 0.25, spirit: 0.20 },
  heavy_armor: { root: 0.60, qi: 0.20, spirit: 0.20 },
  robe:        { spirit: 0.45, root: 0.35, fortune: 0.20 },
};

/** 商城 5 档代表的等级（用于把 tier 换算成主属性预算） */
export const TIER_LEVEL = [0, 1, 6, 12, 18, 26];

/** 主属性总量曲线：等级越高给得越多（掉落按怪物等级、商城按档位代表等级） */
export function primaryBudgetForLevel(level: number): number {
  return Math.round(8 + Math.max(0, level) * 3.5);
}

/** 等级 + 形态 → 装备主属性（护甲整体略低于武器，因为根骨同时给血与防） */
export function craftEquipmentPrimary(level: number, form: EquipmentFormId): Partial<PrimaryStats> {
  const isArmor = !!ARMOR_FORMS[form];
  const budget = primaryBudgetForLevel(level) * (isArmor ? 0.85 : 1);
  const weights = FORM_PRIMARY_WEIGHTS[form] ?? {};
  const out: Partial<PrimaryStats> = {};
  for (const [k, w] of Object.entries(weights)) {
    const v = Math.round(budget * (w as number));
    if (v > 0) out[k as keyof PrimaryStats] = v;
  }
  return out;
}

/** 招牌词条数值基准（随等级放大，高品阶再翻 1.5 倍） */
export function signatureValue(kind: ItemEffect['kind'], scale = 1): number {
  const pct = (v: number) => Math.round(v * scale * 100) / 100;
  switch (kind) {
    case 'combo': return pct(0.05);
    case 'hit': return pct(0.04);
    case 'dodge': return pct(0.03);
    case 'speed': return Math.round(3 * scale);
    case 'guard': return pct(0.04);
    case 'resist': return pct(0.04);
    case 'damageCut': return pct(0.03);
    case 'thorns': return pct(0.05);
    case 'reflect': return Math.round(6 * scale);
    case 'armorPen': return Math.round(5 * scale);
    case 'critDmg': return pct(0.12);
    case 'rage': return Math.round(4 * scale);
    case 'lifesteal': return pct(0.04);
    case 'atkPct': return Math.round(5 * scale);
    case 'defPct': return Math.round(6 * scale);
    case 'hpPct': return Math.round(6 * scale);
    default: return Math.round(3 * scale);
  }
}

/** 等级 + 形态 + 品阶 → 招牌词条（品阶 ≥3 必带 2 条） */
export function craftEquipmentEffects(level: number, form: EquipmentFormId, rarity = 0): ItemEffect[] {
  const def = WEAPON_FORMS[form] ?? ARMOR_FORMS[form];
  if (!def) return [];
  const scale = (1 + Math.max(0, level - 1) * 0.35) * (rarity >= 3 ? 1.5 : 1);
  const count = rarity >= 3 ? 2 : 1;
  return def.signature.slice(0, count).map((kind) => ({
    kind,
    trigger: 'equip' as const,
    value: signatureValue(kind, scale),
  }));
}
