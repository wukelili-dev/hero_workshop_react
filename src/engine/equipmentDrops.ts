/**
 * 装备掉落系统 - 随机生成装备
 * 翻译自 Python 版本的 equipment_drops.py
 */

import type { Equipment, Rarity } from '../types';
import { RARITY_NAME } from '../types';

// 装备名称前缀
const WEAPON_PREFIXES = ["铁", "钢", "银", "金", "魔法", "神圣", "暗黑", "冰霜", "火焰", "雷电", "远古", "圣", "恶魔", "龙"];
const ARMOR_PREFIXES = ["皮", "铁", "钢", "银", "金", "魔法", "神圣", "暗黑", "冰霜", "火焰", "雷电", "远古", "圣", "魔"];
const WEAPON_SUFFIXES = ["剑", "刀", "斧", "锤", "戟", "弓", "匕首", "杖"];
const ARMOR_SUFFIXES = ["甲", "盔", "盾", "袍", "衣", "铠", "胄", "披风"];

// 特殊装备名称
const SPECIAL_WEAPON_NAMES = ["轩辕剑", "青龙偃月刀", "方天画戟", "丈八蛇矛", "倚天剑", "屠龙刀"];

// 极品装备(无等级限制,商店不可购买)
const PERFECT_ARMOR_NAMES = ["锁子黄金甲", "藕丝步云履", "凤翅紫金冠", "凯甲", "天蚕丝披风"];

// 稀有度配置
const RARITY_CONFIG: Record<string, {
  color: string;
  stat_range: number;
  drop_rate: number;
  special_chance: number;
  stat_bonus?: number;
}> = {
  "普通": { color: "#AAAAAA", stat_range: 0.3, drop_rate: 0.15, special_chance: 0 },
  "稀有": { color: "#55AAFF", stat_range: 0.5, drop_rate: 0.10, special_chance: 0.05 },
  "史诗": { color: "#AA55FF", stat_range: 0.8, stat_bonus: 0.5, drop_rate: 0.05, special_chance: 0.15 },
  "传说": { color: "#FFAA00", stat_range: 1.0, stat_bonus: 1.0, drop_rate: 0.02, special_chance: 0.30 },
};

/**
 * 生成武器名称
 */
function generateWeaponName(perfect: boolean = false): string {
  if (perfect) {
    return SPECIAL_WEAPON_NAMES[Math.floor(Math.random() * SPECIAL_WEAPON_NAMES.length)];
  }
  const prefix = WEAPON_PREFIXES[Math.floor(Math.random() * WEAPON_PREFIXES.length)];
  const suffix = WEAPON_SUFFIXES[Math.floor(Math.random() * WEAPON_SUFFIXES.length)];
  return `${prefix}${suffix}`;
}

/**
 * 生成护甲名称
 */
function generateArmorName(perfect: boolean = false): string {
  if (perfect) {
    return PERFECT_ARMOR_NAMES[Math.floor(Math.random() * PERFECT_ARMOR_NAMES.length)];
  }
  const prefix = ARMOR_PREFIXES[Math.floor(Math.random() * ARMOR_PREFIXES.length)];
  const suffix = ARMOR_SUFFIXES[Math.floor(Math.random() * ARMOR_SUFFIXES.length)];
  return `${prefix}${suffix}`;
}

/**
 * 根据怪物等级确定掉落稀有度
 */
function getRarityByMonsterLevel(level: number): string | null {
  const roll = Math.random();

  if (level >= 20) { // 高级地图
    if (roll < 0.05) return "传说";      // 5%
    if (roll < 0.20) return "史诗";      // 15%
    if (roll < 0.45) return "稀有";      // 25%
    return "普通";                         // 55%
  }

  if (level >= 15) { // 中级地图
    if (roll < 0.02) return "传说";
    if (roll < 0.10) return "史诗";
    if (roll < 0.25) return "稀有";
    if (roll < 0.50) return "普通";
    return null;
  }

  if (level >= 10) { // 初级进阶
    if (roll < 0.05) return "史诗";
    if (roll < 0.20) return "稀有";
    if (roll < 0.50) return "普通";
    return null;
  }

  // 新手地图 (Lv1-9)
  if (roll < 0.10) return "稀有";
  if (roll < 0.40) return "普通";
  return null;
}

/**
 * 获取极品装备掉落概率
 */
function getPerfectDropChance(level: number, isBoss: boolean = false): number {
  if (isBoss) return 0.08;         // Boss 8%
  if (level >= 20) return 0.03;    // 3%
  if (level >= 15) return 0.015;   // 1.5%
  if (level >= 10) return 0.008;    // 0.8%
  return 0.003;                     // Lv1-9: 0.3%
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
    "普通": { attack: [8, 20], crit_rate: [0, 5], crit_dmg: [150, 150] },
    "稀有": { attack: [22, 45], crit_rate: [5, 12], crit_dmg: [150, 160] },
    "史诗": { attack: [50, 90], crit_rate: [12, 22], crit_dmg: [160, 180] },
    "传说": { attack: [100, 150], crit_rate: [20, 35], crit_dmg: [170, 200] },
  };

  const stats = baseStats[rarity] || baseStats["普通"];

  // 缩放公式:每级+3%基础属性
  let scale = 1 + (level - 1) * 0.03;
  if (isBoss) scale *= 1.25; // Boss加成25%

  const attack = Math.floor(
    (Math.floor(Math.random() * (stats.attack[1] - stats.attack[0] + 1)) + stats.attack[0]) * scale
  );
  const crit_rate = Math.min(50, Math.floor(Math.random() * (stats.crit_rate[1] - stats.crit_rate[0] + 1)) + stats.crit_rate[0]);
  const crit_dmg = Math.floor(Math.random() * (stats.crit_dmg[1] - stats.crit_dmg[0] + 1)) + stats.crit_dmg[0];

  const name = generateWeaponName(isPerfect);

  // 映射稀有度到 Rarity 类型
  const rarityMap: Record<string, Rarity> = {
    "普通": 0, "稀有": 1, "珍稀": 2, "史诗": 3, "传说": 4
  };

  const equip: Equipment = {
    id: `weapon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: 'weapon',
    name,
    tier: level,
    levelReq: isPerfect ? 0 : Math.max(1, level - 2),
    rarity: isPerfect ? 4 : (rarityMap[rarity] || 0), // 极品视为传说
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

  // 极品装备:在传说基础上×1.4,无等级限制,必带特殊属性,暴击伤害固定200%
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

  // 史诗/传说有概率带特殊属性
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
    "普通": { defense: [4, 12], hp_bonus: [20, 60] },
    "稀有": { defense: [15, 35], hp_bonus: [70, 150] },
    "史诗": { defense: [40, 75], hp_bonus: [180, 320] },
    "传说": { defense: [85, 140], hp_bonus: [380, 600] },
  };

  const stats = baseStats[rarity] || baseStats["普通"];

  let scale = 1 + (level - 1) * 0.03;
  if (isBoss) scale *= 1.25;

  const defense = Math.floor(
    (Math.floor(Math.random() * (stats.defense[1] - stats.defense[0] + 1)) + stats.defense[0]) * scale
  );
  const hp_bonus = Math.floor(
    (Math.floor(Math.random() * (stats.hp_bonus[1] - stats.hp_bonus[0] + 1)) + stats.hp_bonus[0]) * scale
  );

  const name = generateArmorName(isPerfect);

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

  // 极品装备:在传说基础上×1.4,无等级限制,必带特殊属性
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

  // 史诗/传说有概率带特殊属性
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
  const rarity = getRarityByMonsterLevel(monsterLevel);

  // Boss掉落概率更高
  let finalRarity = rarity;
  if (isBoss && !rarity) {
    finalRarity = "普通";
  } else if (isBoss) {
    // Boss更容易掉好东西
    const roll = Math.random();
    if (roll < 0.10) finalRarity = "传说";
    else if (roll < 0.30) finalRarity = "史诗";
    else if (roll < 0.50) finalRarity = "稀有";
    else finalRarity = "普通";
  }

  if (!finalRarity) return null;

  // 检查极品装备掉落
  let isPerfect = false;
  if (Math.random() < getPerfectDropChance(monsterLevel, isBoss)) {
    isPerfect = true;
  }

  // 生成武器或护甲
  if (Math.random() < 0.5) {
    return generateWeapon(monsterLevel, finalRarity, isPerfect, isBoss);
  } else {
    return generateArmor(monsterLevel, finalRarity, isPerfect, isBoss);
  }
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
