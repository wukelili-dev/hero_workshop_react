/**
 * relics — 西游名角法宝（收集向终极目标 / 强力装备）
 *
 * 名角大 BOSS（isNamedBoss）击败后首次掉落其法宝（100%），法宝兼作强力装备：
 *   - 数据：id / name / owner / grade（稀世/至宝）/ lore（一句话考据）/ effects（词条）
 *   - buildRelicEquipment() 把法宝构造成完整 Equipment（rarity 4 传说），供装备系统直接使用
 */
import type { Equipment, ItemEffect } from '../types';

export type RelicGrade = '稀世' | '至宝';

export interface Relic {
  id: string;
  name: string;
  ownerId: string;      // 名角怪物 id
  ownerName: string;    // 名角名
  icon: string;
  grade: RelicGrade;
  lore: string;         // 一句话考据
  /** 装备形态 */
  type: 'weapon' | 'armor';
  form: Equipment['form'];
  /** 主属性加成 */
  primary: Equipment['primary'];
  /** 装备词条（equip 触发） */
  effects: ItemEffect[];
}

const eff = (kind: ItemEffect['kind'], value: number): ItemEffect => ({ kind, trigger: 'equip', value });

export const RELICS: Relic[] = [
  {
    id: 'baigu_zhang', name: '白骨法杖', ownerId: 'baigujing', ownerName: '白骨精', icon: '🦴', grade: '稀世',
    lore: '白骨夫人第三戏所持，白骨为杖，魅惑众生。',
    type: 'weapon', form: 'talisman',
    primary: { qi: 90, spirit: 55 },
    effects: [eff('atkPct', 0.18), eff('lifesteal', 0.10), eff('speed', 8)],
  },
  {
    id: 'sanmei_shan', name: '三昧真火扇', ownerId: 'honghaier', ownerName: '红孩儿', icon: '🔥', grade: '至宝',
    lore: '圣婴大王在枯松涧火云洞练成的三昧真火，一扇焚天。',
    type: 'weapon', form: 'talisman',
    primary: { qi: 110, spirit: 70 },
    effects: [eff('atkPct', 0.24), eff('crit', 0.12), eff('critDmg', 0.5)],
  },
  {
    id: 'hun_tie_gun', name: '混铁棍', ownerId: 'niumowang', ownerName: '牛魔王', icon: '🔩', grade: '至宝',
    lore: '大力牛魔王手中混铁棍，与金箍棒齐名，重逾万斤。',
    type: 'weapon', form: 'heavy_blade',
    primary: { qi: 130, root: 60 },
    effects: [eff('atkPct', 0.28), eff('armorPen', 20), eff('damageCut', 0.08)],
  },
];

/** 按 id 查法宝 */
export function relicOf(id: string): Relic | undefined {
  return RELICS.find((r) => r.id === id);
}

/** 把法宝构造成完整 Equipment（传说级，供装备系统直接使用） */
export function buildRelicEquipment(relicId: string): Equipment | null {
  const r = relicOf(relicId);
  if (!r) return null;
  return {
    id: `relic_${r.id}`,
    type: r.type,
    name: r.name,
    tier: 5,
    rarity: 4, // 传说
    primary: r.primary,
    effects: r.effects,
    form: r.form,
    sellPrice: 5000,
    cost: { 金币: 0 },
  };
}
