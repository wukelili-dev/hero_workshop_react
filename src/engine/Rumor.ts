/**
 * Rumor — 城内流言（跑商经济 E3/E4）
 *
 * 每日每城生成 0~2 条流言，真伪由来源 NPC 可信度决定：
 *   - "真"落在数据上：先算目标城该货的真实状态（库存偏离方向 / drift 趋势），
 *     再按来源可信度决定"这条流言说真话还是假话"；不先掷骰子再编内容。
 *   - 假流言 = 指向一个并不短缺/积压的城货（玩家跑去无利甚至亏）。
 * 到期结算：跟单则按真伪累计到 npcCredibility（hits/misses）。
 */
import type { Rumor } from '../types';
import { NPCS } from '../data/npcs';
import { tradeCities, cityById } from '../data/cities';
import { TRADE_GOODS } from '../data/tradeGoods';
import { RUMOR_PER_CITY_MIN, RUMOR_PER_CITY_MAX, RUMOR_TTL_MIN, RUMOR_TTL_MAX, sourceCredibility } from '../data/marketTuning';
import { hash01, hashInt } from './hash';
import { useWorldStore } from '../store/useWorldStore';

/** 某来源 NPC 的可信度（title/type → 0~1） */
export function credibilityOf(npcId: string): number {
  const npc = NPCS.find((n) => n.id === npcId);
  if (!npc) return 0.5;
  return sourceCredibility(npc.title, npc.type);
}

/**
 * 生成一条流言（确定性：同日同城同序稳定）。
 * 真伪：先看目标城真实状态 → 定"真话"内容 → 再按可信度决定是否反着说。
 */
function makeRumor(day: number, fromCityId: string, seq: number): Rumor {
  const city = cityById(fromCityId);
  const npcIds = city?.npcIds ?? [];
  const fromNpcId = npcIds.length > 0 ? npcIds[hashInt(`${day}:${fromCityId}:${seq}:npc`, npcIds.length)] : 'changan_blacksmith';
  const cred = credibilityOf(fromNpcId);

  // 随机挑一个目标城（≠ 出处）与一种货（非违禁品）
  const targets = tradeCities().filter((c) => c.id !== fromCityId);
  const targetCity = targets[hashInt(`${day}:${fromCityId}:${seq}:target`, targets.length)];
  const goods = TRADE_GOODS.filter((g) => g.category !== 'contraband');
  const good = goods[hashInt(`${day}:${fromCityId}:${seq}:good`, goods.length)];

  // 真实状态：短缺 or 积压（库存偏离方向；偏离为 0 时看 drift 趋势）
  let realKind: 'shortage' | 'glut';
  const stock = useWorldStore.getState().getMarketStock(targetCity.id, good.id);
  if (stock !== 0) {
    realKind = stock < 0 ? 'shortage' : 'glut';
  } else {
    // 库存中性：用当日 drift 趋势外推（drift 正=涨价=可能短缺，负=跌价=积压）
    const drift = useWorldStore.getState().drift[`${targetCity.id}:${good.id}`] ?? 0;
    realKind = drift >= 0 ? 'shortage' : 'glut';
  }

  // 按可信度决定说真话还是假话
  const tellTruth = hash01(`${day}:${fromCityId}:${seq}:truth`) < cred;
  const kind: 'shortage' | 'glut' = tellTruth ? realKind : (realKind === 'shortage' ? 'glut' : 'shortage');
  const ttl = RUMOR_TTL_MIN + hashInt(`${day}:${fromCityId}:${seq}:ttl`, RUMOR_TTL_MAX - RUMOR_TTL_MIN + 1);

  return {
    id: `rumor_${day}_${fromCityId}_${seq}`,
    bornDay: day,
    ttlDays: ttl,
    fromCityId,
    fromNpcId,
    goodId: good.id,
    targetCityId: targetCity.id,
    kind,
    credible: tellTruth,
  };
}

/** 每日推进：生成流言 + 清理过期（挂 advanceMarketDays） */
export function advanceRumors(day: number): void {
  const world = useWorldStore.getState();
  // 清理过期流言
  const active = world.rumors.filter((r) => day - r.bornDay < r.ttlDays);

  // 每城生成 0~2 条
  const fresh: Rumor[] = [...active];
  for (const city of tradeCities()) {
    const n = RUMOR_PER_CITY_MIN + hashInt(`${day}:${city.id}:count`, RUMOR_PER_CITY_MAX - RUMOR_PER_CITY_MIN + 1);
    for (let i = 0; i < n; i++) {
      fresh.push(makeRumor(day, city.id, i));
    }
  }
  useWorldStore.setState({ rumors: fresh.slice(-120) });
}

/** 玩家在 targetCity 买卖过 goodId → 标记相关流言"已跟单" */
export function markRumorFollowed(targetCityId: string, goodId: string): void {
  const world = useWorldStore.getState();
  const rumors = world.rumors.map((r) =>
    r.targetCityId === targetCityId && r.goodId === goodId && !r.followed ? { ...r, followed: true } : r
  );
  useWorldStore.setState({ rumors });
}

/**
 * 结算过期流言（跟单才记信誉）：命中=可信且短缺（去卖确实赚），
 * 落空=可信但方向错，或不可信但玩家跟了导致亏损。
 * 简化口径：真流言+短缺 → 命中；假流言 → 落空。
 */
export function settleRumors(day: number): void {
  const world = useWorldStore.getState();
  const cred = { ...world.npcCredibility };
  for (const r of world.rumors) {
    if (day - r.bornDay < r.ttlDays) continue; // 未到期
    if (!r.followed) continue; // 没跟单，不计信誉
    const key = r.fromNpcId;
    const c = cred[key] ?? { hits: 0, misses: 0 };
    if (r.credible && r.kind === 'shortage') c.hits += 1;
    else c.misses += 1;
    cred[key] = c;
  }
  useWorldStore.setState({ npcCredibility: cred });
}

/** 某 NPC 的信誉应验率（0~1，无记录返回 null） */
export function credibilityRate(npcId: string): number | null {
  const c = useWorldStore.getState().npcCredibility[npcId];
  if (!c || c.hits + c.misses === 0) return null;
  return c.hits / (c.hits + c.misses);
}

/** 某 NPC 的信誉文案："此人消息 7 准 3 空" */
export function credibilityText(npcId: string): string {
  const c = useWorldStore.getState().npcCredibility[npcId];
  if (!c || c.hits + c.misses === 0) return '此人消息尚无凭据';
  return `此人消息 ${c.hits} 准 ${c.misses} 空`;
}
