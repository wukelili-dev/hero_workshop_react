/**
 * equipmentForms — 装备形态与套装（C4）
 * 形态决定"你走哪条轴"：bias 倾斜派生属性，signature 是招牌词条（生成时必带 1~2 条）。
 * 套装：同 setId 2 件 / 4 件各给一条流派词条。
 * 数据驱动：全部是数据表，不硬编码进组件/引擎。
 */
import type { EquipmentForm, EquipmentFormId, ItemEffect } from '../types';

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
  if (!setId) return [];
  const bonuses = SET_BONUSES[setId];
  if (!bonuses) return [];
  const sorted = [...bonuses].sort((a, b) => a.count - b.count);
  const out: ItemEffect[] = [];
  for (const b of sorted) {
    if (count >= b.count) out.push(...b.effects);
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
