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
  /** 独特大招（装备后注入技能槽的武学 id，grade 5 仙品） */
  skillId?: string;
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
  // ── armor 型法宝（带独特大招） ──
  {
    id: 'jin_gang_zhuo', name: '金刚琢', ownerId: 'qingniu', ownerName: '青牛精', icon: '⭕', grade: '至宝',
    lore: '太上老君的金刚琢，被独角兕大王盗下界，套尽天下兵器。',
    type: 'armor', form: 'heavy_armor',
    primary: { root: 90, qi: 70 },
    effects: [eff('defPct', 0.25), eff('damageCut', 0.12), eff('reflect', 15)],
    skillId: 'ox_charge',
  },
  {
    id: 'zi_jin_hulu', name: '紫金红葫芦', ownerId: 'jinjiao', ownerName: '金角大王', icon: '🍶', grade: '稀世',
    lore: '太上老君盛丹的紫金红葫芦，叫一声便收人入内。',
    type: 'armor', form: 'robe',
    primary: { spirit: 80, root: 60 },
    effects: [eff('hpPct', 0.20), eff('resist', 0.12), eff('lifesteal', 0.12)],
    skillId: 'gourd_devour',
  },
  {
    id: 'jin_guang_zhao', name: '金光罩', ownerId: 'baiyanmojun', ownerName: '百眼魔君', icon: '☀️', grade: '稀世',
    lore: '百眼魔君胁下千眼，迸发金光，罩定一方，触之即伤。',
    type: 'armor', form: 'robe',
    primary: { root: 75, spirit: 65 },
    effects: [eff('defPct', 0.20), eff('damageCut', 0.10), eff('thorns', 0.15)],
    skillId: 'golden_glow',
  },
  {
    id: 'yin_yang_ping', name: '阴阳二气瓶', ownerId: 'dapengdiao', ownerName: '大鹏金翅雕', icon: '⚱️', grade: '至宝',
    lore: '狮驼岭大鹏雕的阴阳二气瓶，瓶中二气，须臾化尽。',
    type: 'weapon', form: 'talisman',
    primary: { qi: 140, spirit: 80 },
    effects: [eff('atkPct', 0.30), eff('crit', 0.14), eff('lifesteal', 0.15)],
  },
  {
    id: 'qingshi_hou', name: '青狮吞天钹', ownerId: 'qingshijing', ownerName: '青狮精', icon: '🦁', grade: '至宝',
    lore: '狮驼岭青毛狮子怪的镇洞之宝，一钹能吞十万天兵。',
    type: 'armor', form: 'heavy_armor',
    primary: { root: 95, qi: 75 },
    effects: [eff('defPct', 0.22), eff('damageCut', 0.12), eff('thorns', 0.18)],
    skillId: 'lion_roar',
  },
  {
    id: 'baixiang_qiang', name: '白象玉鼻枪', ownerId: 'baixiangjing', ownerName: '白象精', icon: '🐘', grade: '至宝',
    lore: '狮驼岭白象精的长鼻所化，卷山裂岳，无物不摧。',
    type: 'weapon', form: 'heavy_blade',
    primary: { qi: 135, root: 65 },
    effects: [eff('atkPct', 0.26), eff('armorPen', 18), eff('speed', 10)],
    skillId: 'elephant_sweep',
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
    // 法宝独特大招（装备时注入技能槽）
    ...(r.skillId ? { skillId: r.skillId } : {}),
  };
}
