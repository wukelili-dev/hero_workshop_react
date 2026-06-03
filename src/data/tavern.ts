// 酒馆系统数据

// 普通角色名池
export const ROLE_NAME_POOL: string[] = [
  "剑圣·霜", "影刃·夜", "铁壁·钢", "神射手·翎",
  "狂战士·焚", "圣光使·曦", "暗法师·冥", "龙骑士·渊",
  "风语者·岚", "烈焰·炽", "寒冰·凛", "疾风·逍",
  "守护者·磐", "猎手·矢", "魔导师·墨", "武僧·悟",
  "游侠·云", "召唤师·灵", "刺客·霜", "圣骑士·盾",
];

// 精英角色名（5级后出现，自带装备）
export const ELITE_ROLE_POOL: string[] = [
  "黄金圣骑·裁决", "暗影领主·噬", "苍穹龙将·霄",
  "修罗·杀", "天照·神", "不灭战魂·焚",
];

// 精英自带武器（仅史诗级）
export const ELITE_WEAPONS = [
  { name: "暗影巨剑", attack: 25, critRate: 18, critDmg: 180, rarity: "史诗", rarityColor: "#9370DB", sellPrice: 120 },
  { name: "龙纹长弓", attack: 22, critRate: 25, critDmg: 160, rarity: "史诗", rarityColor: "#9370DB", sellPrice: 110 },
  { name: "雷霆法杖", attack: 18, critRate: 12, critDmg: 200, rarity: "史诗", rarityColor: "#9370DB", sellPrice: 115 },
  { name: "裂空之刃", attack: 28, critRate: 15, critDmg: 170, rarity: "史诗", rarityColor: "#9370DB", sellPrice: 125 },
];

// 精英自带护甲（仅史诗级）
export const ELITE_ARMORS = [
  { name: "玄武战甲", defense: 28, hpBonus: 80, rarity: "史诗", rarityColor: "#9370DB", sellPrice: 130 },
  { name: "天使羽衣", defense: 22, hpBonus: 110, rarity: "史诗", rarityColor: "#9370DB", sellPrice: 135 },
  { name: "龙魂胸甲", defense: 30, hpBonus: 90, rarity: "史诗", rarityColor: "#9370DB", sellPrice: 140 },
  { name: "暗影披风", defense: 15, hpBonus: 130, rarity: "史诗", rarityColor: "#9370DB", sellPrice: 120 },
];

// 酒馆角色接口
export interface TavernRecruit {
  roleName: string;
  level: number;
  isElite: boolean;
  cost: number;
  gear: EquipmentItem[];
}

// 装备接口（简化，来自 equipment.ts）
export interface EquipmentItem {
  type: "weapon" | "armor";
  name: string;
  attack?: number;
  defense?: number;
  hpBonus?: number;
  critRate?: number;
  critDmg?: number;
  rarity: string;
  rarityColor: string;
  sellPrice: number;
  levelReq: number;
  isPerfect: boolean;
}

// 计算招募费用
export function calcRecruitCost(playerLevel: number, isElite: boolean = false): number {
  const base = playerLevel * 100;
  return isElite ? base * 2 : base;
}

// 随机生成队友等级（主角等级或低一级，最低1级）
export function calcRecruitLevel(playerLevel: number): number {
  if (Math.random() < 0.6) {
    return playerLevel;
  }
  return Math.max(1, playerLevel - 1);
}

// 生成一个可招募角色
export function generateRecruit(playerLevel: number): TavernRecruit {
  const canBeElite = playerLevel >= 5;
  const isElite = canBeElite && Math.random() < 0.15;  // 15%精英概率
  const level = calcRecruitLevel(playerLevel);

  let roleName: string;
  let gear: EquipmentItem[] = [];

  if (isElite) {
    roleName = ELITE_ROLE_POOL[Math.floor(Math.random() * ELITE_ROLE_POOL.length)];
    const wpn = ELITE_WEAPONS[Math.floor(Math.random() * ELITE_WEAPONS.length)];
    const arm = ELITE_ARMORS[Math.floor(Math.random() * ELITE_ARMORS.length)];
    gear = [
      {
        type: "weapon",
        name: wpn.name,
        attack: wpn.attack,
        critRate: wpn.critRate,
        critDmg: wpn.critDmg,
        rarity: wpn.rarity,
        rarityColor: wpn.rarityColor,
        sellPrice: wpn.sellPrice,
        levelReq: Math.max(1, level - 3),
        isPerfect: false,
      },
      {
        type: "armor",
        name: arm.name,
        defense: arm.defense,
        hpBonus: arm.hpBonus,
        rarity: arm.rarity,
        rarityColor: arm.rarityColor,
        sellPrice: arm.sellPrice,
        levelReq: Math.max(1, level - 3),
        isPerfect: false,
      },
    ];
  } else {
    roleName = ROLE_NAME_POOL[Math.floor(Math.random() * ROLE_NAME_POOL.length)];
  }

  const cost = calcRecruitCost(playerLevel, isElite);

  return {
    roleName,
    level,
    isElite,
    cost,
    gear,
  };
}

// 生成酒馆当前角色列表（1~3个）
export function generateTavernRoster(playerLevel: number, existingNames?: Set<string>): TavernRecruit[] {
  const seen = existingNames || new Set<string>();
  const count = Math.floor(Math.random() * 3) + 1;  // 1~3
  const roster: TavernRecruit[] = [];
  let attempts = 0;
  while (roster.length < count && attempts < 20) {
    attempts++;
    const recruit = generateRecruit(playerLevel);
    if (!seen.has(recruit.roleName)) {
      roster.push(recruit);
      seen.add(recruit.roleName);
    }
  }
  return roster;
}

// 酒馆列表序列化
export function tavernRosterToDict(roster: TavernRecruit[]): Array<Record<string, unknown>> {
  return roster.map(r => ({
    role_name: r.roleName,
    level: r.level,
    is_elite: r.isElite,
    cost: r.cost,
    gear: r.gear,
  }));
}

// 酒馆列表反序列化
export function tavernRosterFromDict(data: Array<Record<string, unknown>>): TavernRecruit[] {
  return data as unknown as TavernRecruit[];
}
