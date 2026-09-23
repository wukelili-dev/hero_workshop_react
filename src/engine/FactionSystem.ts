/**
 * FactionSystem — 势力声望查询与后果计算（活人世界 P1-3 / P1-5）
 * 声望 ≤-30：商人涨价 ×1.3 且部分拒卖；≤-60：封锁据点；≥40：庇护。
 */
import { FACTIONS, REP_BAN, REP_BLOCK, REP_PROTECT, factionName, type FactionDef } from '../data/factions';
import { FACTION_BY_NPC } from '../data/npcEcology';
import { useWorldStore } from '../store/useWorldStore';

export function repOf(factionId: string): number {
  return useWorldStore.getState().getFactionRep(factionId);
}

export function addRep(factionId: string, delta: number): void {
  useWorldStore.getState().addFactionRep(factionId, delta);
}

/** 某 NPC 所属势力 id（可能 undefined） */
export function factionOfNpc(npcId: string): string | undefined {
  return FACTION_BY_NPC[npcId];
}

/** 玩家对某 NPC 所在势力的声望 */
export function repOfNpc(npcId: string): number {
  const f = factionOfNpc(npcId);
  return f ? repOf(f) : 0;
}

/** 交易价格倍率：声望越差越贵 */
export function priceMultiplier(factionId: string | undefined): number {
  if (!factionId) return 1;
  const r = repOf(factionId);
  if (r <= REP_BAN) return 1.3;
  return 1;
}

/** 是否拒卖（仇恨势力） */
export function isBanned(factionId: string | undefined): boolean {
  if (!factionId) return false;
  return repOf(factionId) <= REP_BLOCK;
}

/** 是否受庇护（高声望） */
export function isProtected(factionId: string | undefined): boolean {
  if (!factionId) return false;
  return repOf(factionId) >= REP_PROTECT;
}

/** 全势力声望快照（人物志/档案页用） */
export function allFactionRep(): Array<{ def: FactionDef; rep: number }> {
  return FACTIONS.map((def) => ({ def, rep: repOf(def.id) }));
}

/** 文本描述当前声望档位 */
export function repLabel(factionId: string): string {
  const r = repOf(factionId);
  if (r >= REP_PROTECT) return `【${factionName(factionId)}】庇护着你（${r}）`;
  if (r <= REP_BLOCK) return `【${factionName(factionId)}】已与你决裂（${r}）`;
  if (r <= REP_BAN) return `【${factionName(factionId)}】对你冷眼相待（${r}）`;
  if (r > 0) return `【${factionName(factionId)}】对你略有好感（${r}）`;
  return `【${factionName(factionId)}】与你不熟（${r}）`;
}
