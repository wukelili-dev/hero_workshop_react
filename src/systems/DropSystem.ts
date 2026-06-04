// @ts-nocheck — legacy system, data model incompatible with current types
import { Equipment } from '../types';
/** 稀有度配置 */
const RARITY: Record<string, { color: string; special_chance: number }> = {
  "普通": { color: "#AAAAAA", special_chance: 0 },
  "稀有": { color: "#4477ff", special_chance: 0.10 },
  "史诗": { color: "#aa44ff", special_chance: 0.20 },
  "传说": { color: "#ff8822", special_chance: 0.30 },
};

/** 武器名称池 */
const WEAPON_NAMES = [
  "短刃", "铁剑", "弯刀", "长枪", "战锤",
  "法杖", "短弓", "匕首", "巨斧", "双刃",
  "破风枪", "碎甲锤", "流光杖", "暗影刃", "雷鸣弓",
];

/** 护甲名称池 */
const ARMOR_NAMES = [
  "布甲", "皮铠", "链甲", "板甲", "法袍",
  "铁卫铠", "影舞衣", "圣光袍", "龙鳞甲", "天蚕丝衣",
];

// ══════════════════════════════════════
// 稀有度判定
// ══════════════════════════════════════

/** 根据怪物等级确定掉落稀有度（返回null=无掉落） */
function getRarityByMonsterLevel(level: number): string | null {
  const roll = Math.random();

  if (level >= 20) {
    // 高级地图
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
  // Lv1-9
  if (roll < 0.10) return "稀有";
  if (roll < 0.40) return "普通";
  return null;
}

/** 极品装备掉落概率 */
function getPerfectDropChance(level: number, isBoss: boolean = false): number {
  if (isBoss) return 0.08;
  if (level >= 20) return 0.03;
  if (level >= 15) return 0.015;
  if (level >= 10) return 0.008;
  return 0.003;
}

// ══════════════════════════════════════
// 装备生成
// ══════════════════════════════════════

/** 生成武器 */
function generateWeapon(
  level: number,
  rarity: string = "普通",
  isPerfect: boolean = false,
  isBoss: boolean = false
): Equipment {
  const baseStats: Record<string, { attack: [number, number]; crit_rate: [number, number]; crit_dmg: [number, number] }> = {
    "普通": { attack: [8, 20], crit_rate: [0, 5], crit_dmg: [150, 150] },
    "稀有": { attack: [22, 45], crit_rate: [5, 12], crit_dmg: [150, 160] },
    "史诗": { attack: [50, 90], crit_rate: [12, 22], crit_dmg: [160, 180] },
    "传说": { attack: [100, 150], crit_rate: [20, 35], crit_dmg: [170, 200] },
  };

  const stats = baseStats[rarity] ?? baseStats["普通"];
  let scale = 1 + (level - 1) * 0.03;
  if (isBoss) scale *= 1.25;

  const attack = Math.floor((stats.attack[0] + Math.floor(Math.random() * (stats.attack[1] - stats.attack[0] + 1))) * scale);
  const critRate = Math.min(50, stats.crit_rate[0] + Math.floor(Math.random() * (stats.crit_rate[1] - stats.crit_rate[0] + 1)));
  const critDmg = stats.crit_dmg[0] + Math.floor(Math.random() * (stats.crit_dmg[1] - stats.crit_dmg[0] + 1));

  const name = WEAPON_NAMES[Math.floor(Math.random() * WEAPON_NAMES.length)] + (isPerfect ? "·极品" : "");
  const rarityColor = isPerfect ? "#FF5555" : (RARITY[rarity]?.color ?? "#AAAAAA");

  const equip: Equipment = {
    name,
    type: "weapon",
    rarity: isPerfect ? "极品" : rarity,
    rarity_color: rarityColor,
    attack,
    crit_rate: critRate,
    crit_dmg: critDmg,
    special: null,
    level_req: isPerfect ? 0 : Math.max(1, level - 2),
    is_perfect: isPerfect,
    sell_price: Math.floor((rarity === "传说" ? 500 : rarity === "史诗" ? 300 : rarity === "稀有" ? 150 : 50) * scale),
    forge_level: 0,
    is_forged: false,
    forge_set: null,
    passive: null,
  };

  // 极品装备
  if (isPerfect) {
    equip.attack = Math.floor(equip.attack * 1.4);
    equip.crit_rate = Math.min(50, Math.floor(equip.crit_rate * 1.2));
    equip.crit_dmg = 200;
    equip.special = [
      { name: "吸血", value: 10 + Math.floor(Math.random() * 11) },
      { name: "破甲", value: 15 + Math.floor(Math.random() * 11) },
      { name: "连击", value: 10 + Math.floor(Math.random() * 9) },
    ][Math.floor(Math.random() * 3)];
  } else if ((rarity === "史诗" || rarity === "传说") && Math.random() < (RARITY[rarity]?.special_chance ?? 0)) {
    equip.special = [
      { name: "吸血", value: 3 + Math.floor(Math.random() * 6) },
      { name: "破甲", value: 5 + Math.floor(Math.random() * 11) },
      { name: "连击", value: 5 + Math.floor(Math.random() * 6) },
    ][Math.floor(Math.random() * 3)];
  }

  return equip;
}

/** 生成护甲 */
function generateArmor(
  level: number,
  rarity: string = "普通",
  isPerfect: boolean = false,
  isBoss: boolean = false
): Equipment {
  const baseStats: Record<string, { defense: [number, number]; hp_bonus: [number, number] }> = {
    "普通": { defense: [4, 12], hp_bonus: [20, 60] },
    "稀有": { defense: [15, 35], hp_bonus: [70, 150] },
    "史诗": { defense: [40, 75], hp_bonus: [180, 320] },
    "传说": { defense: [85, 140], hp_bonus: [380, 600] },
  };

  const stats = baseStats[rarity] ?? baseStats["普通"];
  let scale = 1 + (level - 1) * 0.03;
  if (isBoss) scale *= 1.25;

  const defense = Math.floor((stats.defense[0] + Math.floor(Math.random() * (stats.defense[1] - stats.defense[0] + 1))) * scale);
  const hpBonus = Math.floor((stats.hp_bonus[0] + Math.floor(Math.random() * (stats.hp_bonus[1] - stats.hp_bonus[0] + 1))) * scale);

  const name = ARMOR_NAMES[Math.floor(Math.random() * ARMOR_NAMES.length)] + (isPerfect ? "·极品" : "");
  const rarityColor = isPerfect ? "#FF5555" : (RARITY[rarity]?.color ?? "#AAAAAA");

  const equip: Equipment = {
    name,
    type: "armor",
    rarity: isPerfect ? "极品" : rarity,
    rarity_color: rarityColor,
    defense,
    hp_bonus: hpBonus,
    special: null,
    level_req: isPerfect ? 0 : Math.max(1, level - 2),
    is_perfect: isPerfect,
    sell_price: Math.floor((rarity === "传说" ? 500 : rarity === "史诗" ? 300 : rarity === "稀有" ? 150 : 50) * scale),
    forge_level: 0,
    is_forged: false,
    forge_set: null,
    passive: null,
  };

  if (isPerfect) {
    equip.defense = Math.floor(equip.defense * 1.4);
    equip.hp_bonus = Math.floor(equip.hp_bonus * 1.4);
    equip.special = [
      { name: "吸血", value: 10 + Math.floor(Math.random() * 11) },
      { name: "反伤", value: 15 + Math.floor(Math.random() * 11) },
      { name: "护盾", value: 15 + Math.floor(Math.random() * 16) },
    ][Math.floor(Math.random() * 3)];
  } else if ((rarity === "史诗" || rarity === "传说") && Math.random() < (RARITY[rarity]?.special_chance ?? 0)) {
    equip.special = [
      { name: "吸血", value: 2 + Math.floor(Math.random() * 4) },
      { name: "反伤", value: 5 + Math.floor(Math.random() * 6) },
      { name: "护盾", value: 10 + Math.floor(Math.random() * 11) },
    ][Math.floor(Math.random() * 3)];
  }

  return equip;
}

// ══════════════════════════════════════
// DropSystem — 统一掉落入口
// ══════════════════════════════════════

export class DropSystem {

  /** 生成怪物掉落（可能返回null） */
  static generateDrop(monsterLevel: number, isBoss: boolean = false): Equipment | null {
    let rarity = getRarityByMonsterLevel(monsterLevel);
    if (!rarity) return null;

    // Boss 掉率更高
    if (isBoss) {
      const roll = Math.random();
      if (roll < 0.10) rarity = "传说";
      else if (roll < 0.30) rarity = "史诗";
      else if (roll < 0.50) rarity = "稀有";
      else rarity = "普通";
    }

    // 检查极品
    const isPerfect = Math.random() < getPerfectDropChance(monsterLevel, isBoss);

    // 50%武器 / 50%护甲
    if (Math.random() < 0.5) {
      return generateWeapon(monsterLevel, rarity, isPerfect, isBoss);
    } else {
      return generateArmor(monsterLevel, rarity, isPerfect, isBoss);
    }
  }

  /** 获取掉落摘要（用于UI展示） */
  static getDropSummary(equip: Equipment): string {
    const parts: string[] = [];
    if (equip.attack) parts.push(`攻${equip.attack}`);
    if (equip.defense) parts.push(`防${equip.defense}`);
    if (equip.hp_bonus) parts.push(`HP+${equip.hp_bonus}`);
    if (equip.crit_rate) parts.push(`暴${equip.crit_rate}%`);
    if (equip.crit_dmg && equip.crit_dmg !== 150) parts.push(`爆伤${equip.crit_dmg}%`);
    if (equip.special) parts.push(`[${equip.special.name}+${equip.special.value}]`);
    return parts.join(" ");
  }

  /** 计算出售价格（回查用） */
  static calcSellPrice(equip: Equipment): number {
    return equip.sell_price ?? 10;
  }
}
