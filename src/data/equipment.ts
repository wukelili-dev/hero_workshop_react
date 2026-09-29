/**
 * 商店装备目录（C7 装备重做）
 *
 * 旧版每件装备手写「攻击/防御/生命/暴击」四维，全部装备长得一样只是数值大小不同。
 * 新版：每件装备 = **形态**（决定主属性偏哪条轴） + **主属性加成** + 1~2 条**招牌词条**。
 * 数值不再手写，由 equipmentForms.ts 的曲线按「档位代表等级 + 形态」生成，
 * 与怪物掉落共用同一套规则，改一个系数就能整体调平衡。
 */
import type { Equipment, EquipmentFormId, Rarity } from '../types';
import {
  craftEquipmentPrimary,
  craftEquipmentEffects,
  formSetId,
  TIER_LEVEL,
} from './equipmentForms';

/** 商城装备最小数据：名字 / 档位(1-5) / 品阶 / 造价 */
type ShopRow = [name: string, tier: number, rarity: Rarity, cost: Record<string, number>];

const RARITY_COLOR = ['#7a7161', '#2f6f8f', '#3f6b3f', '#8a5aa8', '#b5382f'];

// ── 武器（20 把，Tier1-5） ──
const WEAPON_ROWS: ShopRow[] = [
  // Tier1
  ['木棍', 1, 0, { '金币': 10 }],
  ['石斧', 1, 0, { '木材': 15 }],
  ['骨刀', 1, 0, { '皮革': 8, '木材': 8 }],
  ['铁匕首', 1, 0, { '铁矿': 20 }],
  // Tier2
  ['短剑', 2, 1, { '木材': 15, '铁矿': 20 }],
  ['战斧', 2, 1, { '木材': 20, '铁矿': 30, '皮革': 12 }],
  ['弯刀', 2, 1, { '铁矿': 35, '皮革': 18 }],
  ['铁剑', 2, 1, { '铁矿': 50 }],
  // Tier3
  ['长剑', 3, 2, { '木材': 25, '铁矿': 60 }],
  ['钢剑', 3, 2, { '铁矿': 85, '皮革': 30 }],
  ['巨剑', 3, 2, { '木材': 35, '铁矿': 75, '皮革': 25 }],
  ['魔法铁剑', 3, 2, { '铁矿': 100, '皮革': 40 }],
  // Tier4
  ['雷鸣剑', 4, 3, { '铁矿': 120, '皮革': 60, '木材': 40 }],
  ['火焰剑', 4, 3, { '铁矿': 150, '皮革': 80 }],
  ['寒冰剑', 4, 3, { '铁矿': 140, '皮革': 90, '木材': 50 }],
  ['圣剑', 4, 3, { '铁矿': 180, '皮革': 120, '木材': 70 }],
  // Tier5
  ['暗影刃', 5, 4, { '皮革': 200, '铁矿': 220 }],
  ['龙鳞剑', 5, 4, { '皮革': 280, '铁矿': 300, '木材': 120 }],
  ['魔法龙剑', 5, 4, { '皮革': 350, '铁矿': 400, '木材': 180 }],
  ['龙魂剑', 5, 4, { '皮革': 450, '铁矿': 500, '木材': 250 }],
];

// ── 护甲（20 件，Tier1-5） ──
const ARMOR_ROWS: ShopRow[] = [
  // Tier1
  ['布衣', 1, 0, { '金币': 8 }],
  ['皮甲', 1, 0, { '皮革': 15 }],
  ['骨甲', 1, 0, { '皮革': 12, '木材': 10 }],
  ['铁甲', 1, 0, { '铁矿': 25 }],
  // Tier2
  ['铁胸甲', 2, 1, { '铁矿': 40, '皮革': 20 }],
  ['钢甲', 2, 1, { '铁矿': 60 }],
  ['锁子甲', 2, 1, { '铁矿': 55, '皮革': 25 }],
  ['骑士甲', 2, 1, { '铁矿': 80, '皮革': 40, '木材': 30 }],
  // Tier3
  ['银甲', 3, 2, { '铁矿': 100, '皮革': 50 }],
  ['魔法铁甲', 3, 2, { '铁矿': 140, '皮革': 70 }],
  ['符文甲', 3, 2, { '铁矿': 120, '皮革': 80, '木材': 40 }],
  ['闪电甲', 3, 2, { '铁矿': 180, '皮革': 90 }],
  // Tier4
  ['火焰甲', 4, 3, { '铁矿': 200, '皮革': 120 }],
  ['寒冰甲', 4, 3, { '铁矿': 240, '皮革': 140, '木材': 60 }],
  ['暗影甲', 4, 3, { '皮革': 200, '铁矿': 200 }],
  ['圣甲', 4, 3, { '铁矿': 300, '皮革': 180, '木材': 80 }],
  // Tier5
  ['龙鳞甲', 5, 4, { '皮革': 320, '铁矿': 350, '木材': 100 }],
  ['魔法龙甲', 5, 4, { '皮革': 400, '铁矿': 450, '木材': 150 }],
  ['圣光护铠', 5, 4, { '铁矿': 500, '皮革': 380, '木材': 120 }],
  ['龙魂甲', 5, 4, { '皮革': 550, '铁矿': 600, '木材': 200 }],
];

// ── 名称 → 形态映射（商城目录 + 老存档里的旧装备都靠它认形态） ──
// 必须在 craft()/WEAPONS/ARMORS 之前声明：顶层会立即 craft，避免 TDZ。
const WEAPON_FORM_MAP: Record<string, EquipmentFormId> = {
  // 快剑（swift_blade）：命中/连击，轻灵刀剑
  '木棍': 'swift_blade', '短剑': 'swift_blade', '铁剑': 'swift_blade', '长剑': 'swift_blade',
  '骨刀': 'swift_blade', '弯刀': 'swift_blade', '暗影刃': 'swift_blade', '铁匕首': 'swift_blade',
  // 重刀（heavy_blade）：破甲/暴伤，重型打击
  '石斧': 'heavy_blade', '战斧': 'heavy_blade', '巨剑': 'heavy_blade', '钢剑': 'heavy_blade',
  '圣剑': 'heavy_blade', '龙鳞剑': 'heavy_blade', '龙魂剑': 'heavy_blade',
  // 长兵（long_arm）：反击/减伤，以守代攻
  '魔法铁剑': 'long_arm', '雷鸣剑': 'long_arm', '魔法龙剑': 'long_arm',
  // 法器（talisman）：法伤/抗性
  '火焰剑': 'talisman', '寒冰剑': 'talisman',
};

const ARMOR_FORM_MAP: Record<string, EquipmentFormId> = {
  // 轻甲（light_armor）：闪避/速度
  '布衣': 'light_armor', '皮甲': 'light_armor', '骨甲': 'light_armor', '锁子甲': 'light_armor',
  '暗影甲': 'light_armor',
  // 重甲（heavy_armor）：格挡/减伤
  '铁甲': 'heavy_armor', '铁胸甲': 'heavy_armor', '钢甲': 'heavy_armor', '骑士甲': 'heavy_armor',
  '银甲': 'heavy_armor', '闪电甲': 'heavy_armor', '火焰甲': 'heavy_armor', '寒冰甲': 'heavy_armor',
  '圣甲': 'heavy_armor', '龙鳞甲': 'heavy_armor', '魔法龙甲': 'heavy_armor', '龙魂甲': 'heavy_armor',
  // 法衣（robe）：抗性/护盾
  '魔法铁甲': 'robe', '符文甲': 'robe', '圣光护铠': 'robe',
};

function craft(row: ShopRow, type: 'weapon' | 'armor'): Equipment {
  const [name, tier, rarity, cost] = row;
  const form: EquipmentFormId = type === 'weapon' ? getWeaponFormByName(name) : getArmorFormByName(name);
  const level = TIER_LEVEL[tier] ?? tier;
  return {
    id: name,
    name,
    type,
    tier,
    rarity,
    rarityColor: RARITY_COLOR[rarity],
    primary: craftEquipmentPrimary(level, form),
    effects: craftEquipmentEffects(level, form, rarity),
    form,
    setId: formSetId(form),
    enhanceLevel: 0,
    fortifyLevel: 0,
    cost,
  } as Equipment;
}

export const WEAPONS: Record<string, Equipment> = Object.fromEntries(
  WEAPON_ROWS.map((row) => [row[0], craft(row, 'weapon')]),
);

export const ARMORS: Record<string, Equipment> = Object.fromEntries(
  ARMOR_ROWS.map((row) => [row[0], craft(row, 'armor')]),
);

// 获取武器 by name
export function getWeaponByName(name: string): Equipment | undefined {
  return WEAPONS[name];
}

// 获取护甲 by name
export function getArmorByName(name: string): Equipment | undefined {
  return ARMORS[name];
}

// 获取指定 tier 的武器
export function getWeaponsByTier(tier: number): Equipment[] {
  return Object.values(WEAPONS).filter(w => w.tier === tier);
}

// 获取指定 tier 的护甲
export function getArmorsByTier(tier: number): Equipment[] {
  return Object.values(ARMORS).filter(a => a.tier === tier);
}

// ── 名称 → 形态映射（商城目录 + 老存档里的旧装备都靠它认形态） ──
// 注意：这两个 map 必须定义在 craft()/WEAPONS/ARMORS 之前，否则顶层初始化 craft 时会踩 TDZ。
export function getWeaponFormByName(name: string): EquipmentFormId {
  return WEAPON_FORM_MAP[name] ?? 'swift_blade';
}
export function getArmorFormByName(name: string): EquipmentFormId {
  return ARMOR_FORM_MAP[name] ?? 'light_armor';
}

