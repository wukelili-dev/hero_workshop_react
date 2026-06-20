/**
 * 装备掉落系统 - 随机生成装备
 * 翻译自 Python 版本的 equipment_drops.py
 */

import type { Equipment, Rarity } from '../types';
import { RARITY_NAME } from '../types';

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
 * 获取该稀有度对应的等级缩放系数（每级增加百分比）
 */
function getScalePerLevel(rarity: string): number {
  switch (rarity) {
    case "普通": return 0.05;
    case "稀有": return 0.08;
    case "史诗": return 0.10;
    case "传说": return 0.12;
    default: return 0.05;
  }
}

/**
 * 生成武器
 */
function generateWeapon(
  level: number,
  rarity: string = "普通",
  isPerfect: boolean = false,
  isBoss: boolean = false
): Equipment {
  const baseStats: Record<string, {
    attack: [number, number];
    crit_rate: [number, number];
    crit_dmg: [number, number];
  }> = {
    // 基础值压缩：Lv1时数值
    "普通": { attack: [3, 8],   crit_rate: [0, 3],   crit_dmg: [150, 150] },
    "稀有": { attack: [8, 15],  crit_rate: [3, 8],   crit_dmg: [150, 155] },
    "史诗": { attack: [18, 30], crit_rate: [8, 15],  crit_dmg: [155, 170] },
    "传说": { attack: [35, 55], crit_rate: [15, 25], crit_dmg: [170, 190] },
  };

  const stats = baseStats[rarity] || baseStats["普通"];
  const scalePerLv = getScalePerLevel(rarity);

  // 缩放：按等级线性提升，等级越高差异越明显
  let scale = 1 + (level - 1) * scalePerLv;
  if (isBoss) scale *= 1.25;

  const attack = Math.floor(
    (Math.floor(Math.random() * (stats.attack[1] - stats.attack[0] + 1)) + stats.attack[0]) * scale
  );
  const crit_rate = Math.min(50, Math.floor(Math.random() * (stats.crit_rate[1] - stats.crit_rate[0] + 1)) + stats.crit_rate[0]);
  const crit_dmg = Math.floor(Math.random() * (stats.crit_dmg[1] - stats.crit_dmg[0] + 1)) + stats.crit_dmg[0];

  const name = generateWeaponName(level, isPerfect);

  const rarityMap: Record<string, Rarity> = {
    "普通": 0, "稀有": 1, "珍稀": 2, "史诗": 3, "传说": 4
  };

  const equip: Equipment = {
    id: `weapon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: 'weapon',
    name,
    tier: level,
    levelReq: isPerfect ? 0 : Math.max(1, level - 2),
    rarity: isPerfect ? 4 : (rarityMap[rarity] || 0),
    rarityColor: isPerfect ? "#FF5555" : (RARITY_CONFIG[rarity]?.color || "#AAAAAA"),
    stats: {
      atk: attack,
      crit: crit_rate,
      critDmg: crit_dmg,
    },
    attack,
    critRate: crit_rate,
    critDmg: crit_dmg,
    isPerfect,
    enhanceLevel: 0,
    fortifyLevel: 0,
    special: undefined,
  };

  // 极品装备：在传说基础上×1.4，无等级限制，必带特殊属性
  if (isPerfect) {
    equip.stats!.atk = Math.floor(equip.stats!.atk! * 1.4);
    equip.attack = equip.stats!.atk;
    equip.stats!.crit = Math.min(50, Math.floor(equip.stats!.crit! * 1.2));
    equip.critRate = equip.stats!.crit;
    equip.levelReq = 0;
    equip.stats!.critDmg = 200;
    equip.critDmg = 200;
    equip.special = [
      { name: "吸血", value: Math.floor(Math.random() * 11) + 10 },
      { name: "破甲", value: Math.floor(Math.random() * 11) + 15 },
      { name: "连击", value: Math.floor(Math.random() * 9) + 10 },
    ][Math.floor(Math.random() * 3)];
  }

  // 史诗/传说的带特殊属性
  if (!isPerfect && ["史诗", "传说"].includes(rarity) && Math.random() < RARITY_CONFIG[rarity].special_chance) {
    const specialOptions = [
      { name: "吸血", value: Math.floor(Math.random() * 6) + 3 },
      { name: "破甲", value: Math.floor(Math.random() * 11) + 5 },
      { name: "连击", value: Math.floor(Math.random() * 6) + 5 },
    ];
    equip.special = specialOptions[Math.floor(Math.random() * specialOptions.length)];
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
  const baseStats: Record<string, {
    defense: [number, number];
    hp_bonus: [number, number];
  }> = {
    // 基础值压缩
    "普通": { defense: [2, 6],    hp_bonus: [10, 30] },
    "稀有": { defense: [6, 12],   hp_bonus: [30, 60] },
    "史诗": { defense: [14, 25],  hp_bonus: [60, 120] },
    "传说": { defense: [30, 45],  hp_bonus: [130, 250] },
  };

  const stats = baseStats[rarity] || baseStats["普通"];
  const scalePerLv = getScalePerLevel(rarity);

  let scale = 1 + (level - 1) * scalePerLv;
  if (isBoss) scale *= 1.25;

  const defense = Math.floor(
    (Math.floor(Math.random() * (stats.defense[1] - stats.defense[0] + 1)) + stats.defense[0]) * scale
  );
  const hp_bonus = Math.floor(
    (Math.floor(Math.random() * (stats.hp_bonus[1] - stats.hp_bonus[0] + 1)) + stats.hp_bonus[0]) * scale
  );

  const name = generateArmorName(level, isPerfect);

  const rarityMap: Record<string, Rarity> = {
    "普通": 0, "稀有": 1, "珍稀": 2, "史诗": 3, "传说": 4
  };

  const equip: Equipment = {
    id: `armor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: 'armor',
    name,
    tier: level,
    levelReq: isPerfect ? 0 : Math.max(1, level - 2),
    rarity: isPerfect ? 4 : (rarityMap[rarity] || 0),
    rarityColor: isPerfect ? "#FF5555" : (RARITY_CONFIG[rarity]?.color || "#AAAAAA"),
    stats: {
      def: defense,
      hp: hp_bonus,
    },
    defense,
    hpBonus: hp_bonus,
    isPerfect,
    enhanceLevel: 0,
    fortifyLevel: 0,
    special: undefined,
  };

  // 极品装备
  if (isPerfect) {
    equip.stats!.def = Math.floor(equip.stats!.def! * 1.4);
    equip.defense = equip.stats!.def;
    equip.stats!.hp = Math.floor(equip.stats!.hp! * 1.4);
    equip.hpBonus = equip.stats!.hp;
    equip.levelReq = 0;
    equip.special = [
      { name: "吸血", value: Math.floor(Math.random() * 11) + 10 },
      { name: "反伤", value: Math.floor(Math.random() * 11) + 15 },
      { name: "护盾", value: Math.floor(Math.random() * 16) + 15 },
    ][Math.floor(Math.random() * 3)];
  }

  // 史诗/传说带特殊属性
  if (!isPerfect && ["史诗", "传说"].includes(rarity) && Math.random() < RARITY_CONFIG[rarity].special_chance) {
    const specialOptions = [
      { name: "吸血", value: Math.floor(Math.random() * 4) + 2 },
      { name: "反伤", value: Math.floor(Math.random() * 6) + 5 },
      { name: "护盾", value: Math.floor(Math.random() * 11) + 10 },
    ];
    equip.special = specialOptions[Math.floor(Math.random() * specialOptions.length)];
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

  if (equip.type === "weapon") {
    info += ` ATK:${equip.attack || equip.stats?.atk || 0} CRIT:${equip.critRate || equip.stats?.crit || 0}%`;
  } else {
    info += ` DEF:${equip.defense || equip.stats?.def || 0} HP+:${equip.hpBonus || equip.stats?.hp || 0}`;
  }

  if (equip.special) {
    const special = typeof equip.special === 'string'
      ? equip.special
      : `${equip.special.name}+${equip.special.value}`;
    info += ` [${special}]`;
  }

  return info;
}
