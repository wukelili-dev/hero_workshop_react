import type { Equipment, Rarity } from '../types';

// 武器数据（20把，Tier1-5）
export const WEAPONS: Record<string, Equipment> = {
  // Tier1 (Lv1-4)
  '木棍': { id: '木棍', name: '木棍', type: 'weapon', rarity: 0, tier: 1, stats: { atk: 8, crit: 0, critDmg: 1.5 }, enhanceLevel: 0, cost: { '金币': 10 } } as Equipment,
  '石斧': { id: '石斧', name: '石斧', type: 'weapon', rarity: 0, tier: 1, stats: { atk: 12, crit: 0.03, critDmg: 1.5 }, enhanceLevel: 0, cost: { '木材': 15 } } as Equipment,
  '骨刀': { id: '骨刀', name: '骨刀', type: 'weapon', rarity: 0, tier: 1, stats: { atk: 10, crit: 0.08, critDmg: 1.6 }, enhanceLevel: 0, cost: { '皮革': 8, '木材': 8 } } as Equipment,
  '铁匕首': { id: '铁匕首', name: '铁匕首', type: 'weapon', rarity: 0, tier: 1, stats: { atk: 18, crit: 0.05, critDmg: 1.5 }, enhanceLevel: 0, cost: { '铁矿': 20 } } as Equipment,

  // Tier2 (Lv5-9)
  '短剑': { id: '短剑', name: '短剑', type: 'weapon', rarity: 1, tier: 2, stats: { atk: 22, crit: 0.05, critDmg: 1.5 }, enhanceLevel: 0, cost: { '木材': 15, '铁矿': 20 } } as Equipment,
  '战斧': { id: '战斧', name: '战斧', type: 'weapon', rarity: 1, tier: 2, stats: { atk: 30, crit: 0.06, critDmg: 1.5 }, enhanceLevel: 0, cost: { '木材': 20, '铁矿': 30, '皮革': 12 } } as Equipment,
  '弯刀': { id: '弯刀', name: '弯刀', type: 'weapon', rarity: 1, tier: 2, stats: { atk: 24, crit: 0.15, critDmg: 1.7 }, enhanceLevel: 0, cost: { '铁矿': 35, '皮革': 18 } } as Equipment,
  '铁剑': { id: '铁剑', name: '铁剑', type: 'weapon', rarity: 1, tier: 2, stats: { atk: 38, crit: 0.08, critDmg: 1.5 }, enhanceLevel: 0, cost: { '铁矿': 50 } } as Equipment,

  // Tier3 (Lv10-14)
  '长剑': { id: '长剑', name: '长剑', type: 'weapon', rarity: 2, tier: 3, stats: { atk: 45, crit: 0.08, critDmg: 1.5 }, enhanceLevel: 0, cost: { '木材': 25, '铁矿': 60 } } as Equipment,
  '钢剑': { id: '钢剑', name: '钢剑', type: 'weapon', rarity: 2, tier: 3, stats: { atk: 55, crit: 0.10, critDmg: 1.5 }, enhanceLevel: 0, cost: { '铁矿': 85, '皮革': 30 } } as Equipment,
  '巨剑': { id: '巨剑', name: '巨剑', type: 'weapon', rarity: 2, tier: 3, stats: { atk: 48, crit: 0.20, critDmg: 1.8 }, enhanceLevel: 0, cost: { '木材': 35, '铁矿': 75, '皮革': 25 } } as Equipment,
  '魔法铁剑': { id: '魔法铁剑', name: '魔法铁剑', type: 'weapon', rarity: 2, tier: 3, stats: { atk: 65, crit: 0.12, critDmg: 1.5 }, enhanceLevel: 0, cost: { '铁矿': 100, '皮革': 40 } } as Equipment,

  // Tier4 (Lv15-19)
  '雷鸣剑': { id: '雷鸣剑', name: '雷鸣剑', type: 'weapon', rarity: 3, tier: 4, stats: { atk: 75, crit: 0.12, critDmg: 1.5 }, enhanceLevel: 0, cost: { '铁矿': 120, '皮革': 60, '木材': 40 } } as Equipment,
  '火焰剑': { id: '火焰剑', name: '火焰剑', type: 'weapon', rarity: 3, tier: 4, stats: { atk: 85, crit: 0.14, critDmg: 1.6 }, enhanceLevel: 0, cost: { '铁矿': 150, '皮革': 80 } } as Equipment,
  '寒冰剑': { id: '寒冰剑', name: '寒冰剑', type: 'weapon', rarity: 3, tier: 4, stats: { atk: 78, crit: 0.22, critDmg: 1.8 }, enhanceLevel: 0, cost: { '铁矿': 140, '皮革': 90, '木材': 50 } } as Equipment,
  '圣剑': { id: '圣剑', name: '圣剑', type: 'weapon', rarity: 3, tier: 4, stats: { atk: 100, crit: 0.15, critDmg: 1.5 }, enhanceLevel: 0, cost: { '铁矿': 180, '皮革': 120, '木材': 70 } } as Equipment,

  // Tier5 (Lv20-30)
  '暗影刃': { id: '暗影刃', name: '暗影刃', type: 'weapon', rarity: 4, tier: 5, stats: { atk: 115, crit: 0.18, critDmg: 1.7 }, enhanceLevel: 0, cost: { '皮革': 200, '铁矿': 220 } } as Equipment,
  '龙鳞剑': { id: '龙鳞剑', name: '龙鳞剑', type: 'weapon', rarity: 4, tier: 5, stats: { atk: 130, crit: 0.20, critDmg: 1.6 }, enhanceLevel: 0, cost: { '皮革': 280, '铁矿': 300, '木材': 120 } } as Equipment,
  '魔法龙剑': { id: '魔法龙剑', name: '魔法龙剑', type: 'weapon', rarity: 4, tier: 5, stats: { atk: 145, crit: 0.22, critDmg: 1.8 }, enhanceLevel: 0, cost: { '皮革': 350, '铁矿': 400, '木材': 180 } } as Equipment,
  '龙魂剑': { id: '龙魂剑', name: '龙魂剑', type: 'weapon', rarity: 4, tier: 5, stats: { atk: 160, crit: 0.25, critDmg: 2.0 }, enhanceLevel: 0, cost: { '皮革': 450, '铁矿': 500, '木材': 250 } } as Equipment,
};

// 护甲数据（20件，Tier1-5）
export const ARMORS: Record<string, Equipment> = {
  // Tier1 (Lv1-4)
  '布衣': { id: '布衣', name: '布衣', type: 'armor', rarity: 0, tier: 1, stats: { def: 4, hp: 15 }, enhanceLevel: 0, cost: { '金币': 8 } } as Equipment,
  '皮甲': { id: '皮甲', name: '皮甲', type: 'armor', rarity: 0, tier: 1, stats: { def: 8, hp: 30 }, enhanceLevel: 0, cost: { '皮革': 15 } } as Equipment,
  '骨甲': { id: '骨甲', name: '骨甲', type: 'armor', rarity: 0, tier: 1, stats: { def: 6, hp: 45 }, enhanceLevel: 0, cost: { '皮革': 12, '木材': 10 } } as Equipment,
  '铁甲': { id: '铁甲', name: '铁甲', type: 'armor', rarity: 0, tier: 1, stats: { def: 12, hp: 50 }, enhanceLevel: 0, cost: { '铁矿': 25 } } as Equipment,

  // Tier2 (Lv5-9)
  '铁胸甲': { id: '铁胸甲', name: '铁胸甲', type: 'armor', rarity: 1, tier: 2, stats: { def: 15, hp: 70 }, enhanceLevel: 0, cost: { '铁矿': 40, '皮革': 20 } } as Equipment,
  '钢甲': { id: '钢甲', name: '钢甲', type: 'armor', rarity: 1, tier: 2, stats: { def: 20, hp: 90 }, enhanceLevel: 0, cost: { '铁矿': 60 } } as Equipment,
  '锁子甲': { id: '锁子甲', name: '锁子甲', type: 'armor', rarity: 1, tier: 2, stats: { def: 18, hp: 110 }, enhanceLevel: 0, cost: { '铁矿': 55, '皮革': 25 } } as Equipment,
  '骑士甲': { id: '骑士甲', name: '骑士甲', type: 'armor', rarity: 1, tier: 2, stats: { def: 25, hp: 100 }, enhanceLevel: 0, cost: { '铁矿': 80, '皮革': 40, '木材': 30 } } as Equipment,

  // Tier3 (Lv10-14)
  '银甲': { id: '银甲', name: '银甲', type: 'armor', rarity: 2, tier: 3, stats: { def: 30, hp: 140 }, enhanceLevel: 0, cost: { '铁矿': 100, '皮革': 50 } } as Equipment,
  '魔法铁甲': { id: '魔法铁甲', name: '魔法铁甲', type: 'armor', rarity: 2, tier: 3, stats: { def: 38, hp: 170 }, enhanceLevel: 0, cost: { '铁矿': 140, '皮革': 70 } } as Equipment,
  '符文甲': { id: '符文甲', name: '符文甲', type: 'armor', rarity: 2, tier: 3, stats: { def: 32, hp: 200 }, enhanceLevel: 0, cost: { '铁矿': 120, '皮革': 80, '木材': 40 } } as Equipment,
  '闪电甲': { id: '闪电甲', name: '闪电甲', type: 'armor', rarity: 2, tier: 3, stats: { def: 45, hp: 180 }, enhanceLevel: 0, cost: { '铁矿': 180, '皮革': 90 } } as Equipment,

  // Tier4 (Lv15-19)
  '火焰甲': { id: '火焰甲', name: '火焰甲', type: 'armor', rarity: 3, tier: 4, stats: { def: 50, hp: 250 }, enhanceLevel: 0, cost: { '铁矿': 200, '皮革': 120 } } as Equipment,
  '寒冰甲': { id: '寒冰甲', name: '寒冰甲', type: 'armor', rarity: 3, tier: 4, stats: { def: 58, hp: 280 }, enhanceLevel: 0, cost: { '铁矿': 240, '皮革': 140, '木材': 60 } } as Equipment,
  '暗影甲': { id: '暗影甲', name: '暗影甲', type: 'armor', rarity: 3, tier: 4, stats: { def: 52, hp: 320 }, enhanceLevel: 0, cost: { '皮革': 200, '铁矿': 200 } } as Equipment,
  '圣甲': { id: '圣甲', name: '圣甲', type: 'armor', rarity: 3, tier: 4, stats: { def: 70, hp: 300 }, enhanceLevel: 0, cost: { '铁矿': 300, '皮革': 180, '木材': 80 } } as Equipment,

  // Tier5 (Lv20-30)
  '龙鳞甲': { id: '龙鳞甲', name: '龙鳞甲', type: 'armor', rarity: 4, tier: 5, stats: { def: 80, hp: 420 }, enhanceLevel: 0, cost: { '皮革': 320, '铁矿': 350, '木材': 100 } } as Equipment,
  '魔法龙甲': { id: '魔法龙甲', name: '魔法龙甲', type: 'armor', rarity: 4, tier: 5, stats: { def: 90, hp: 480 }, enhanceLevel: 0, cost: { '皮革': 400, '铁矿': 450, '木材': 150 } } as Equipment,
  '圣光护铠': { id: '圣光护铠', name: '圣光护铠', type: 'armor', rarity: 4, tier: 5, stats: { def: 85, hp: 550 }, enhanceLevel: 0, cost: { '铁矿': 500, '皮革': 380, '木材': 120 } } as Equipment,
  '龙魂甲': { id: '龙魂甲', name: '龙魂甲', type: 'armor', rarity: 4, tier: 5, stats: { def: 110, hp: 600 }, enhanceLevel: 0, cost: { '皮革': 550, '铁矿': 600, '木材': 200 } } as Equipment,
};

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
