/**
 * ItemEffects — 词条 → 真实玩法挂点的唯一出口（M1）
 * 所有词条读取走 sum(kind)；挂点只调它，不在业务里散写 if。
 * M1 的 8 条词条均为 hold 触发（持在背包即生效），来源是 novelties（id → count）。
 * 装备（equip）词条与基础数值词条留待 M3 接线，类型已就绪。
 */
import { useInventoryStore } from '../store/useInventoryStore';
import { getItemDef } from '../data/items/items';
import type { ItemEffect } from '../types';

type EffectKind = ItemEffect['kind'];

/** 词条显示名（M4 物品卡复用） */
export const EFFECT_LABEL: Record<EffectKind, string> = {
  atk: '攻击',
  def: '防御',
  crit: '暴击',
  critDmg: '爆伤',
  hpMax: '生命',
  armorPen: '破甲',
  lifesteal: '吸血',
  combo: '连击',
  reflect: '反伤',
  damageCut: '减伤',
  travelDays: '疾行',
  revealExtra: '识途',
  gatherBonus: '寻宝',
  shopPrice: '通商',
  sellPrice: '囤积',
  affinityGain: '亲和',
  proposeBonus: '求亲',
  reputation: '声望',
  moralPerDay: '向善',
  moralPerKill: '惩恶',
  heal: '疗愈',
  exp: '顿悟',
};

/** 收集当前生效的「持有」词条：来自 novelties（id → count）里的名物 */
function heldEffects(): ItemEffect[] {
  const novelties = useInventoryStore.getState().novelties;
  const out: ItemEffect[] = [];
  for (const id of Object.keys(novelties)) {
    const count = novelties[id];
    if (!count || count <= 0) continue;
    const def = getItemDef(id);
    if (!def?.effects) continue;
    for (const e of def.effects) {
      if (e.trigger !== 'hold') continue;
      out.push(e);
    }
  }
  return out;
}

/** 对给定词条列表求和（纯函数，供 equip 词条复用） */
export function sumList(list: ItemEffect[], kind: EffectKind): number {
  let total = 0;
  for (const e of list) if (e.kind === kind) total += e.value;
  return total;
}

/** 某类词条的生效数值总和（hold 词条：持在背包即生效） */
export function sum(kind: EffectKind): number {
  return sumList(heldEffects(), kind);
}

/** 从装备 effects 里筛出 equip 触发词条（供 Combat 使用，避免循环依赖） */
export function equipEffectsOf(list?: ItemEffect[]): ItemEffect[] {
  return (list ?? []).filter((e) => e.trigger === 'equip');
}

/** 是否持有任一指定 kind 的词条（用于布尔型挂点） */
export function has(kind: EffectKind): boolean {
  return sum(kind) !== 0;
}
