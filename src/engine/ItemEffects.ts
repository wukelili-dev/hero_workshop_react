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

/** 某类词条的生效数值总和 */
export function sum(kind: EffectKind): number {
  let total = 0;
  for (const e of heldEffects()) if (e.kind === kind) total += e.value;
  return total;
}

/** 是否持有任一指定 kind 的词条（用于布尔型挂点） */
export function has(kind: EffectKind): boolean {
  return sum(kind) !== 0;
}
