/**
 * 装备掉落系统 - 随机生成装备
 * 翻译自 Python 版本的 equipment_drops.py
 */

import type { Equipment, Rarity, ItemEffect, EquipmentFormId, PrimaryStats } from '../types';
import { RARITY_NAME } from '../types';
import { EFFECT_LABEL } from './ItemEffects';
import {
  WEAPON_FORMS, ARMOR_FORMS,
  craftEquipmentPrimary, craftEquipmentEffects, formSetId,
} from '../data/equipmentForms';

// ─── 特殊属性 → 词条映射（M3：special 死字段迁移到 effects 的 equip 词条） ───
// scale：value 与词条数值的换算比例（百分比类 ×0.01，固定点数类 ×1）
const SPECIAL_TO_EFFECT: Record<string, { kind: ItemEffect['kind']; scale: number }> = {
  '吸血': { kind: 'lifesteal', scale: 0.01 },
  '破甲': { kind: 'armorPen', scale: 1 },
  '连击': { kind: 'combo', scale: 0.01 },
  '反伤': { kind: 'reflect', scale: 1 },
  '护盾': { kind: 'damageCut', scale: 0.01 },
};

function specialToEffect(special: { name: string; value: number }): ItemEffect {
  const map = SPECIAL_TO_EFFECT[special.name];
  const kind: ItemEffect['kind'] = map?.kind ?? 'atk';
  const scale = map?.scale ?? 1;
  const value = Math.round(special.value * scale * 100) / 100;
  return { kind, trigger: 'equip', value };
}

/** 主属性整体缩放（极品装备 ×1.4 之类） */
function scalePrimary(p: Partial<PrimaryStats> | undefined, k: number): Partial<PrimaryStats> {
  const out: Partial<PrimaryStats> = {};
  for (const [key, v] of Object.entries(p ?? {})) {
    out[key as keyof PrimaryStats] = Math.round((v as number) * k);
  }
  return out;
}

const PRIMARY_LABEL: Record<keyof PrimaryStats, string> = {
  root: '根骨', qi: '气力', agility: '身法', spirit: '神识', fortune: '机缘',
};

/** 按百分比展示的词条（其余按固定点数展示） */
const PCT_KINDS = new Set<ItemEffect['kind']>([
  'hit', 'dodge', 'combo', 'guard', 'resist', 'damageCut', 'lifesteal',
  'atkPct', 'defPct', 'hpPct', 'thorns', 'crit',
]);

/**
 * 装备面板展示口径（唯一出口）：UI 各处都调它，避免漏改某个页面。
 * 返回主属性行 + 词条行，顺序固定，数字已格式化。
 */
export function equipmentLines(equip: Equipment): Array<{ label: string; value: string; kind: 'primary' | 'effect' }> {
  const out: Array<{ label: string; value: string; kind: 'primary' | 'effect' }> = [];
  for (const [key, v] of Object.entries(equip.primary ?? {})) {
    if (!v) continue;
    out.push({ label: PRIMARY_LABEL[key as keyof PrimaryStats], value: `+${Math.round(v as number)}`, kind: 'primary' });
  }
  for (const e of equip.effects ?? []) {
    if (e.trigger !== 'equip') continue;
    const label = EFFECT_LABEL[e.kind] ?? e.kind;
    const value = PCT_KINDS.has(e.kind) ? `+${Math.round(e.value * 100)}%` : `+${Math.round(e.value)}`;
    out.push({ label, value, kind: 'effect' });
  }
  return out;
}

// ─── 名称前缀（按地图怪物等级分层） ───
const WEAPON_PREFIXES: [number, number, string[]][] = [
  [1,  5,  ["铁", "钢", "铜", "木"]],
  [6,  10, ["银", "秘银", "魔法"]],
  [11, 15, ["金", "冰霜", "火焰", "雷电"]],
  [16, 20, ["远古", "圣", "神圣"]],
  [21, 99, ["暗黑", "恶魔", "龙"]],
];
const ARMOR_PREFIXES: [number, number, string[]][] = [
  [1,  5,  ["皮", "布", "铁", "铜"]],
  [6,  10, ["钢", "秘银", "魔法"]],
  [11, 15, ["金", "冰霜", "火焰", "雷电"]],
  [16, 20, ["远古", "圣", "神圣"]],
  [21, 99, ["暗黑", "恶魔", "魔"]],
];

const WEAPON_SUFFIXES = ["剑", "刀", "斧", "锤", "戟", "弓", "匕首", "杖", "枪", "镰"];
const ARMOR_SUFFIXES = ["甲", "盔", "盾", "袍", "衣", "铠", "胄", "披风", "冠", "靴"];

// 极品装备名（仅Lv20+可掉）
const SPECIAL_WEAPON_NAMES = ["轩辕剑", "青龙偃月刀", "方天画戟", "丈八蛇矛", "倚天剑", "屠龙刀"];
const PERFECT_ARMOR_NAMES = ["锁子黄金甲", "藕丝步云履", "凤翅紫金冠", "天蚕丝披风", "金蝉袈裟"];

// 稀有度配置（只保留需要的字段）
const RARITY_CONFIG: Record<string, {
  color: string;
  special_chance: number;
}> = {
  "普通": { color: "#AAAAAA", special_chance: 0 },
  "稀有": { color: "#55AAFF", special_chance: 0.05 },
  "史诗": { color: "#AA55FF", special_chance: 0.15 },
  "传说": { color: "#FFAA00", special_chance: 0.30 },
};

/**
 * 根据怪物等级获取对应档位的前缀列表
 */
function getPrefixForLevel(level: number, type: 'weapon' | 'armor'): string[] {
  const table = type === 'weapon' ? WEAPON_PREFIXES : ARMOR_PREFIXES;
  for (const [minLv, maxLv, prefixes] of table) {
    if (level >= minLv && level <= maxLv) return prefixes;
  }
  return table[table.length - 1][2];
}

/**
 * 生成武器名称
 */
function generateWeaponName(level: number, perfect: boolean = false): string {
  if (perfect) {
    return SPECIAL_WEAPON_NAMES[Math.floor(Math.random() * SPECIAL_WEAPON_NAMES.length)];
  }
  const prefixes = getPrefixForLevel(level, 'weapon');
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffix = WEAPON_SUFFIXES[Math.floor(Math.random() * WEAPON_SUFFIXES.length)];
  return `${prefix}${suffix}`;
}

/**
 * 生成护甲名称
 */
function generateArmorName(level: number, perfect: boolean = false): string {
  if (perfect) {
    return PERFECT_ARMOR_NAMES[Math.floor(Math.random() * PERFECT_ARMOR_NAMES.length)];
  }
  const prefixes = getPrefixForLevel(level, 'armor');
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffix = ARMOR_SUFFIXES[Math.floor(Math.random() * ARMOR_SUFFIXES.length)];
  return `${prefix}${suffix}`;
}

/**
 * 根据怪物等级确定掉落稀有度
 */
function getRarityByMonsterLevel(level: number): string | null {
  const roll = Math.random();

  if (level >= 20) {
    if (roll < 0.05) return "传说";
    if (roll < 0.20) return "史诗";
    if (roll < 0.45) return "稀有";
    return "普通";
  }

  if (level >= 15) {
    if (roll < 0.02) return "传说";
    if (roll < 0.10) return "史诗";
    if (roll < 0.25) return "稀有";
    if (roll < 0.50) return "普通";
    return null;
  }

  if (level >= 10) {
    if (roll < 0.05) return "史诗";
    if (roll < 0.20) return "稀有";
    if (roll < 0.50) return "普通";
    return null;
  }

  // 新手地图 (Lv1-9)
  if (roll < 0.05) return "稀有";       // 10% → 5%
  if (roll < 0.35) return "普通";       // 40% → 30%
  return null;
}

/**
 * 获取极品装备掉落概率
 */
function getPerfectDropChance(level: number, isBoss: boolean = false): number {
  if (isBoss) return 0.08;
  if (level >= 20) return 0.03;
  if (level >= 15) return 0.015;
  if (level >= 10) return 0.008;
  return 0.003;
}

/**
 * 生成武器（C7：随机形态；数值由「等级预算 × 形态权重」生成，与商城同一条曲线）
 */
function generateWeapon(
  level: number,
  rarity: string = "普通",
  isPerfect: boolean = false,
  isBoss: boolean = false
): Equipment {
  const name = generateWeaponName(level, isPerfect);

  const rarityMap: Record<string, Rarity> = {
    "普通": 0, "稀有": 1, "珍稀": 2, "史诗": 3, "传说": 4
  };

  // C7：随机形态；装备价值由「等级预算 × 形态权重」决定（与商城同一条曲线）
  const formIds = Object.keys(WEAPON_FORMS) as EquipmentFormId[];
  const form = formIds[Math.floor(Math.random() * formIds.length)];
  const rarityIdx = isPerfect ? 4 : (rarityMap[rarity] || 0);
  // Boss 掉落：整体数值 ×1.25
  const budgetLevel = isBoss ? level * 1.25 : level;

  const equip: Equipment = {
    id: `weapon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: 'weapon',
    name,
    tier: level,
    levelReq: isPerfect ? 0 : Math.max(1, level - 2),
    rarity: rarityIdx,
    rarityColor: isPerfect ? "#FF5555" : (RARITY_CONFIG[rarity]?.color || "#AAAAAA"),
    primary: craftEquipmentPrimary(budgetLevel, form),
    effects: craftEquipmentEffects(budgetLevel, form, rarityIdx),
    isPerfect,
    enhanceLevel: 0,
    fortifyLevel: 0,
    form,
    setId: formSetId(form),
  };

  // 极品装备：主属性×1.4，无等级限制，必带一条特殊词条
  if (isPerfect) {
    equip.primary = scalePrimary(equip.primary, 1.4);
    equip.levelReq = 0;
    const special = [
      { name: "吸血", value: Math.floor(Math.random() * 11) + 10 },
      { name: "破甲", value: Math.floor(Math.random() * 11) + 15 },
      { name: "连击", value: Math.floor(Math.random() * 9) + 10 },
    ][Math.floor(Math.random() * 3)];
    equip.effects = [...(equip.effects ?? []), specialToEffect(special)];
  }

  return equip;
}

/**
 * 生成护甲
 */
function generateArmor(
  level: number,
  rarity: string = "普通",
  isPerfect: boolean = false,
  isBoss: boolean = false
): Equipment {
  const name = generateArmorName(level, isPerfect);

  const rarityMap: Record<string, Rarity> = {
    "普通": 0, "稀有": 1, "珍稀": 2, "史诗": 3, "传说": 4
  };

  // C7：随机形态 + 主属性（与商城同一条曲线）
  const formIds = Object.keys(ARMOR_FORMS) as EquipmentFormId[];
  const form = formIds[Math.floor(Math.random() * formIds.length)];
  const rarityIdx = isPerfect ? 4 : (rarityMap[rarity] || 0);
  const budgetLevel = isBoss ? level * 1.25 : level;

  const equip: Equipment = {
    id: `armor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: 'armor',
    name,
    tier: level,
    levelReq: isPerfect ? 0 : Math.max(1, level - 2),
    rarity: rarityIdx,
    rarityColor: isPerfect ? "#FF5555" : (RARITY_CONFIG[rarity]?.color || "#AAAAAA"),
    primary: craftEquipmentPrimary(budgetLevel, form),
    effects: craftEquipmentEffects(budgetLevel, form, rarityIdx),
    isPerfect,
    enhanceLevel: 0,
    fortifyLevel: 0,
    form,
    setId: formSetId(form),
  };

  // 极品装备
  if (isPerfect) {
    equip.primary = scalePrimary(equip.primary, 1.4);
    equip.levelReq = 0;
    const special = [
      { name: "吸血", value: Math.floor(Math.random() * 11) + 10 },
      { name: "反伤", value: Math.floor(Math.random() * 11) + 15 },
      { name: "护盾", value: Math.floor(Math.random() * 16) + 15 },
    ][Math.floor(Math.random() * 3)];
    equip.effects = [...(equip.effects ?? []), specialToEffect(special)];
  }

  return equip;
}

/**
 * 生成怪物掉落装备(可能掉落武器或护甲)
 */
export function generateDrop(monsterLevel: number, isBoss: boolean = false): Equipment | null {
  let rarity = getRarityByMonsterLevel(monsterLevel);

  // Boss：若没roll到稀有度则保底普通，否则有额外概率提升一档
  if (isBoss) {
    if (!rarity) {
      rarity = "普通";
    } else {
      const upgradeRoll = Math.random();
      if (rarity === "普通" && upgradeRoll < 0.30) rarity = "稀有";
      else if (rarity === "稀有" && upgradeRoll < 0.20) rarity = "史诗";
      else if (rarity === "史诗" && upgradeRoll < 0.10) rarity = "传说";
    }
  }

  if (!rarity) return null;

  // 检查极品装备掉落（极品只在Lv15+出现）
  let isPerfect = false;
  if (monsterLevel >= 15 && Math.random() < getPerfectDropChance(monsterLevel, isBoss)) {
    isPerfect = true;
  }

  if (Math.random() < 0.5) {
    return generateWeapon(monsterLevel, rarity, isPerfect, isBoss);
  } else {
    return generateArmor(monsterLevel, rarity, isPerfect, isBoss);
  }
}

// ─── 出售价格计算 ───

// 材料→金币转换率（shop装备的材料造价）
const MATERIAL_GOLD_RATES: Record<string, number> = {
  '金币': 1,
  '铁矿': 5,
  '皮革': 8,
  '木材': 3,
};

// 怪物等级→价值阶位（匹配 shop tier 1-5）
function monsterLevelToValueTier(level: number): number {
  if (level >= 20) return 5;
  if (level >= 15) return 4;
  if (level >= 10) return 3;
  if (level >= 5) return 2;
  return 1;
}

// 各阶位基础金币价值（shop装备材料消耗的平均金币等价）
const TIER_BASE_GOLD: number[] = [0, 60, 250, 500, 900, 2000];

// 稀有度溢价倍率
const RARITY_PREMIUM: number[] = [1.0, 1.5, 2.0, 3.0, 5.0];

// 出售比例（shop价的50%）
const SELL_RATIO = 0.5;

/**
 * 计算装备出售价格
 * - drop装备：基于怪物等级+稀有度估算shop等价，半价回收
 * - shop装备：材料成本换算金币，半价回收
 */
export function getEquipmentSellPrice(equip: Equipment): number {
  if (!equip) return 0;

  // 如果有成本数据（shop装备），直接换算
  if (equip.cost && Object.keys(equip.cost).length > 0) {
    let materialValue = 0;
    for (const [mat, qty] of Object.entries(equip.cost)) {
      materialValue += (MATERIAL_GOLD_RATES[mat] ?? 1) * Number(qty);
    }
    return Math.floor(materialValue * SELL_RATIO);
  }

  // 掉落装备：基于等级阶位+稀有度估算
  const valueTier = monsterLevelToValueTier(equip.tier ?? 1);
  const baseGold = TIER_BASE_GOLD[valueTier] ?? 60;
  const rarity = Math.min(equip.rarity ?? 0, 4);
  const premium = RARITY_PREMIUM[rarity] ?? 1.0;
  const perfectMul = equip.isPerfect ? 1.5 : 1.0;

  // 强化/锻造加的额外价值
  const enhanceBonus = (equip.enhanceLevel ?? 0) * 20;
  const fortifyBonus = (equip.fortifyLevel ?? 0) * 50;

  return Math.floor(baseGold * premium * perfectMul * SELL_RATIO + enhanceBonus + fortifyBonus);
}

/**
 * 获取装备掉落摘要
 */
export function getDropSummary(equip: Equipment): string | null {
  if (!equip) return null;

  const name = equip.name;
  const levelReq = equip.levelReq || 0;
  const isPerfect = equip.isPerfect || false;

  let info = "";
  if (isPerfect) {
    info = `[极品] ${name} (无等级限制)`;
  } else {
    info = `[${RARITY_NAME[equip.rarity as Rarity] || '普通'}] ${name} (Lv.${levelReq}+)`;
  }

  // C7：主属性 + 词条（旧装备仍回退到四维显示）
  const lines = equipmentLines(equip);
  if (lines.length > 0) {
    info += ' ' + lines.map((l) => `${l.label}${l.value}`).join(' ');
  } else if (equip.type === 'weapon') {
    info += ` ATK:${equip.attack || equip.stats?.atk || 0} CRIT:${equip.critRate || equip.stats?.crit || 0}%`;
  } else {
    info += ` DEF:${equip.defense || equip.stats?.def || 0} HP+:${equip.hpBonus || equip.stats?.hp || 0}`;
  }

  return info;
}
