/**
 * FactionSystem — 势力声望查询与后果计算（活人世界 P1-3 / P1-5）
 * 声望 ≤-30：商人涨价 ×1.3 且部分拒卖；≤-60：封锁据点；≥40：庇护。
 */
import { FACTIONS, REP_BAN, REP_BLOCK, REP_PROTECT, factionName, factionOf, type FactionDef } from '../data/factions';
import { MAPS } from '../data/maps';
import { FACTION_BY_NPC } from '../data/npcEcology';
import { useWorldStore } from '../store/useWorldStore';

export function repOf(factionId: string): number {
  return useWorldStore.getState().getFactionRep(factionId);
}

/** 势力据点对应的地图 id（factions.homePlace 存的是地图名） */
function placeIdOf(factionId: string): string | undefined {
  const def = FACTIONS.find((f) => f.id === factionId);
  if (!def) return undefined;
  return MAPS.find((m) => m.name === def.homePlace)?.id ?? def.homePlace;
}

/** 某据点是否被势力封锁；返回原因或 null（世界地图用于禁用「前往」） */
export function blockReasonFor(placeId: string | undefined): string | null {
  if (!placeId) return null;
  const { consequences, day } = useWorldStore.getState();
  const hit = consequences.find(
    (c) => c.kind === 'block' && c.scope.placeId === placeId && c.untilDay > Math.floor(day)
  );
  return hit ? hit.reason : null;
}

/**
 * 加减声望；跨越阈值时自动落后果：
 * ≤ REP_BLOCK → 该势力据点对你封城 30 天；声望回到 -40 以上 → 自动解封。
 */
export function addRep(factionId: string, delta: number): void {
  const store = useWorldStore.getState();
  store.addFactionRep(factionId, delta);

  const world = useWorldStore.getState();
  const rep = world.getFactionRep(factionId);
  const day = Math.floor(world.day);
  const placeId = placeIdOf(factionId);
  const name = factionName(factionId);
  const blocked = world.consequences.some((c) => c.kind === 'block' && c.scope.factionId === factionId);

  if (rep <= REP_BLOCK && !blocked && placeId) {
    world.addConsequence({
      id: `blk_${factionId}_${day}`,
      kind: 'block',
      scope: { factionId, placeId },
      value: 30,
      untilDay: day + 30,
      reason: `${name}已与你决裂，${factionOf(factionId)?.homePlace ?? placeId}的城门不再为你开`,
    });
  } else if (rep > REP_BLOCK + 20 && blocked) {
    useWorldStore.setState({
      consequences: world.consequences.filter((c) => !(c.kind === 'block' && c.scope.factionId === factionId)),
    });
  }
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
