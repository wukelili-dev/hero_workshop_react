import type { Equipment } from '../types';

// 强化配置（+1~+10）
export interface FortifyConfig {
  level: number;
  bonusPct: number;
  ironCost: number;
  goldCost: number;
  successRate: number;
}

export const FORTIFY_CONFIG: FortifyConfig[] = [
  { level: 1,  bonusPct: 5,  ironCost: 5,    goldCost: 50,   successRate: 1.00 },
  { level: 2,  bonusPct: 10, ironCost: 10,   goldCost: 100,  successRate: 0.95 },
  { level: 3,  bonusPct: 15, ironCost: 20,   goldCost: 200,  successRate: 0.90 },
  { level: 4,  bonusPct: 20, ironCost: 35,   goldCost: 350,  successRate: 0.80 },
  { level: 5,  bonusPct: 25, ironCost: 50,   goldCost: 500,  successRate: 0.70 },
  { level: 6,  bonusPct: 30, ironCost: 70,   goldCost: 700,  successRate: 0.55 },
  { level: 7,  bonusPct: 40, ironCost: 100,  goldCost: 1000, successRate: 0.40 },
  { level: 8,  bonusPct: 50, ironCost: 150,  goldCost: 1500, successRate: 0.25 },
  { level: 9,  bonusPct: 65, ironCost: 200,  goldCost: 2000, successRate: 0.15 },
  { level: 10, bonusPct: 80, ironCost: 300,  goldCost: 3000, successRate: 0.05 },
];

// 锻造配方
export interface ForgeRecipe {
  name: string;
  type: 'weapon' | 'armor';
  stats: { atk?: number; def?: number; hp?: number; crit?: number; critDmg?: number };
  passive: PassiveEffect;
  material: string;
  materialCount: number;
  iron: number;
  gold: number;
  rarity: number;
  forgeSet?: string;
}

// 被动效果（简化，用 Record<string, number> 存储）
export interface PassiveEffect {
  name: string;
  desc: string;
  [key: string]: string | number | boolean;
}

export const FORGE_RECIPES: ForgeRecipe[] = [
  // 白品质（rarity 0）
  { name: '霜绒软甲', type: 'armor', stats: { def: 25, hp: 80 }, passive: { name: '闪避', desc: '闪避+8%', dodge: 8 }, material: '霜绒', materialCount: 10, iron: 30, gold: 200, rarity: 0, forgeSet: undefined },
  { name: '蟾露短刃', type: 'weapon', stats: { atk: 35, crit: 0.10, critDmg: 1.5 }, passive: { name: '毒伤', desc: '攻击附带3%最大生命毒伤', poisonPct: 3 }, material: '蟾露', materialCount: 10, iron: 30, gold: 200, rarity: 0, forgeSet: undefined },
  { name: '翠甲圆盾', type: 'armor', stats: { def: 30, hp: 60 }, passive: { name: '铁壁', desc: '防御+10%', defPct: 10 }, material: '翠甲', materialCount: 10, iron: 30, gold: 200, rarity: 0, forgeSet: undefined },
  { name: '凤卵法杖', type: 'weapon', stats: { atk: 30, crit: 0.08, critDmg: 1.5 }, passive: { name: '生机', desc: '战斗开始回复10%HP', startHealPct: 10 }, material: '凤卵', materialCount: 10, iron: 30, gold: 200, rarity: 0, forgeSet: undefined },

  // 绿品质（rarity 1）
  { name: '招财护符', type: 'armor', stats: { def: 35, hp: 120 }, passive: { name: '招财', desc: '金币掉落+15%', goldBonusPct: 15 }, material: '金蟾油', materialCount: 10, iron: 50, gold: 500, rarity: 1, forgeSet: undefined },
  { name: '噬牙短剑', type: 'weapon', stats: { atk: 50, crit: 0.12, critDmg: 1.5 }, passive: { name: '狂战', desc: '攻击+8%', atkPct: 8 }, material: '犬牙', materialCount: 10, iron: 50, gold: 500, rarity: 1, forgeSet: undefined },
  { name: '暗噬之刃', type: 'weapon', stats: { atk: 55, crit: 0.15, critDmg: 1.5 }, passive: { name: '噬魂', desc: '击杀回复3%HP', killHealPct: 3 }, material: '暗凝胶', materialCount: 10, iron: 50, gold: 500, rarity: 1, forgeSet: undefined },
  { name: '镀金护手', type: 'weapon', stats: { atk: 48, crit: 0.10, critDmg: 1.5 }, passive: { name: '贪婪', desc: '击杀怪物金币+20%', killGoldPct: 20 }, material: '黄金凝胶', materialCount: 10, iron: 50, gold: 500, rarity: 1, forgeSet: undefined },

  // 蓝品质（rarity 2）
  { name: '凤羽长弓', type: 'weapon', stats: { atk: 85, crit: 0.18, critDmg: 1.5 }, passive: { name: '涅槃', desc: '濒死回复30%HP（每场1次）', deathSaveHeal: 30 }, material: '凤羽', materialCount: 15, iron: 80, gold: 1000, rarity: 2, forgeSet: undefined },
  { name: '鹤翎剑', type: 'weapon', stats: { atk: 78, crit: 0.25, critDmg: 1.5 }, passive: { name: '长生', desc: '每3回合回复5%HP', regenInterval: 3, regenPct: 5 }, material: '鹤羽', materialCount: 15, iron: 60, gold: 1000, rarity: 2, forgeSet: undefined },
  { name: '虎骨碎锤', type: 'weapon', stats: { atk: 120, crit: 0.08, critDmg: 1.7 }, passive: { name: '碎骨', desc: '暴击时额外+20%暴击伤害', critBonusPct: 20 }, material: '虎骨', materialCount: 15, iron: 120, gold: 1200, rarity: 2, forgeSet: undefined },
  { name: '玄甲重铠', type: 'armor', stats: { def: 55, hp: 300 }, passive: { name: '荆棘', desc: '防御+15%，受击5%概率眩晕攻击者', defPct: 15, stunChance: 5 }, material: '金龟壳', materialCount: 10, iron: 80, gold: 1000, rarity: 2, forgeSet: undefined },
  { name: '王鬃战盔', type: 'weapon', stats: { atk: 100, crit: 0.15, critDmg: 1.5 }, passive: { name: '威压', desc: '攻击+10%，首回合伤害+15%', atkPct: 10, firstStrikePct: 15 }, material: '王鬃', materialCount: 15, iron: 100, gold: 1100, rarity: 2, forgeSet: undefined },
  { name: '嗜血狼牙', type: 'weapon', stats: { atk: 92, crit: 0.12, critDmg: 1.5 }, passive: { name: '嗜血', desc: '击杀后攻击+8%持续2回合', killAtkBuff: 8, killBuffTurns: 2 }, material: '狼牙', materialCount: 15, iron: 100, gold: 1100, rarity: 2, forgeSet: undefined },
  { name: '暗影豹刺', type: 'weapon', stats: { atk: 95, crit: 0.20, critDmg: 1.5 }, passive: { name: '破甲', desc: '攻击15%概率无视防御', ignoreDefChance: 15 }, material: '玄影豹皮', materialCount: 15, iron: 90, gold: 1100, rarity: 2, forgeSet: undefined },
  { name: '熊罴铁壁', type: 'armor', stats: { def: 65, hp: 350 }, passive: { name: '铁壁', desc: 'HP+15%', hpPct: 15 }, material: '熊胆', materialCount: 15, iron: 100, gold: 1100, rarity: 2, forgeSet: undefined },
  { name: '幻狐之刃', type: 'weapon', stats: { atk: 90, crit: 0.22, critDmg: 1.5 }, passive: { name: '幻惑', desc: '10%概率使敌人混乱1回合', confuseChance: 10 }, material: '狐尾', materialCount: 15, iron: 90, gold: 1100, rarity: 2, forgeSet: undefined },
  { name: '焚天刃', type: 'weapon', stats: { atk: 98, crit: 0.18, critDmg: 1.5 }, passive: { name: '焚天', desc: '攻击附带5%攻击力的火焰伤害', fireDmgPct: 5 }, material: '火狐毛', materialCount: 15, iron: 100, gold: 1100, rarity: 2, forgeSet: undefined },
  { name: '灵森法衣', type: 'armor', stats: { def: 42, hp: 280 }, passive: { name: '灵森', desc: '每5回合回复8%HP', regenInterval: 5, regenPct: 8 }, material: '精灵粉', materialCount: 15, iron: 80, gold: 1000, rarity: 2, forgeSet: undefined },

  // 紫品质（rarity 3）
  { name: '冲锋角铠', type: 'armor', stats: { def: 60, hp: 320 }, passive: { name: '冲锋', desc: '首回合攻击+25%', firstStrikePct: 25 }, material: '甲犀角', materialCount: 10, iron: 150, gold: 2000, rarity: 3, forgeSet: undefined },
  { name: '玄心玉佩', type: 'armor', stats: { def: 48, hp: 400 }, passive: { name: '玄心', desc: '全属性+5%', allStatsPct: 5 }, material: '竹心', materialCount: 10, iron: 150, gold: 2000, rarity: 3, forgeSet: undefined },
  { name: '圣羽法杖', type: 'weapon', stats: { atk: 70, crit: 0.15, critDmg: 1.5 }, passive: { name: '圣佑', desc: '受致命伤害免死1次（保留1HP），每场限1次', deathSave: true }, material: '圣羽', materialCount: 10, iron: 150, gold: 2000, rarity: 3, forgeSet: undefined },
  { name: '五行灵环', type: 'armor', stats: { def: 50, hp: 350 }, passive: { name: '五行', desc: '每场随机：攻+10%/防+10%/暴击+10%/吸血+8%/HP+10%', randomBuff: true }, material: '灵叶', materialCount: 10, iron: 150, gold: 2000, rarity: 3, forgeSet: undefined },

  // 橙品质（rarity 4）
  { name: '垂云杖', type: 'weapon', stats: { atk: 150, crit: 0.15, critDmg: 1.5 }, passive: { name: '云盾', desc: '每2回合获云盾（吸收15%最大HP伤害）', cloudShieldInterval: 2, cloudShieldPct: 15 }, material: '云须', materialCount: 20, iron: 200, gold: 5000, rarity: 4, forgeSet: '垂云套' },
  { name: '浪淘沙刃', type: 'weapon', stats: { atk: 160, crit: 0.20, critDmg: 1.5 }, passive: { name: '破浪', desc: '无视20%防御', ignoreDefPct: 20 }, material: '浪核', materialCount: 20, iron: 250, gold: 5000, rarity: 4, forgeSet: '垂云套' },
  { name: '范式圣剑', type: 'weapon', stats: { atk: 140, crit: 0.25, critDmg: 1.5 }, passive: { name: '牺牲', desc: '死亡时队友+20%攻击3回合', deathBuffAtkPct: 20, deathBuffTurns: 3 }, material: '薪火', materialCount: 20, iron: 200, gold: 5000, rarity: 4, forgeSet: '垂云套' },
  { name: '颜如玉卷', type: 'weapon', stats: { atk: 130, crit: 0.18, critDmg: 1.5 }, passive: { name: '书香', desc: '经验+25% 金币+25%', expBonusPct: 25, goldBonusPct: 25 }, material: '书香', materialCount: 20, iron: 180, gold: 5000, rarity: 4, forgeSet: '垂云套' },
];

// 套装效果
export interface SetEffect {
  pieces: string[];
  effects: Record<number, PassiveEffect>;
}

export const SET_EFFECTS: Record<string, SetEffect> = {
  '垂云套': {
    pieces: ['垂云杖', '浪淘沙刃', '范式圣剑', '颜如玉卷'],
    effects: {
      2: { name: '垂云2件', desc: '全属性+5%', allStatsPct: 5 },
      3: { name: '垂云3件', desc: '全属性+10% + 每回合云盾', allStatsPct: 10, cloudShieldPerTurn: true },
    },
  },
};

// 锻造品质颜色
export const FORGE_RARITY_COLORS: Record<number, string> = {
  0: '#cccccc',  // 白
  1: '#4caf50',  // 绿
  2: '#2196f3',  // 蓝
  3: '#9c27b0',  // 紫
  4: '#ff9800',  // 橙
};

// 获取强化配置
export function getFortifyInfo(level: number): FortifyConfig | null {
  if (level < 1 || level > 10) return null;
  return FORTIFY_CONFIG[level - 1];
}

// 获取锻造配方 by name
export function getForgeRecipeByName(name: string): ForgeRecipe | undefined {
  return FORGE_RECIPES.find(r => r.name === name);
}

// 获取指定品质的锻造配方
export function getForgeRecipesByRarity(rarity: number): ForgeRecipe[] {
  return FORGE_RECIPES.filter(r => r.rarity === rarity);
}

// 获取套装效果
export function getSetEffect(forgeSet: string, pieceCount: number): PassiveEffect | null {
  if (!forgeSet || !(forgeSet in SET_EFFECTS)) return null;
  const effects = SET_EFFECTS[forgeSet].effects;
  let result: PassiveEffect | null = null;
  for (const threshold of Object.keys(effects).map(Number).sort((a, b) => a - b)) {
    if (pieceCount >= threshold) result = effects[threshold];
  }
  return result;
}
