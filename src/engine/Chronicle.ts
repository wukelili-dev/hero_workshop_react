/**
 * Chronicle — 世界叙事台账（沉浸感 I1 地基）
 *
 * 唯一写入 API：record()；检索 API：query()。
 * - 文本在写入时渲染好，读取只做检索（不二次插值）。
 * - 最多保留 200 条；importance === 3 永不剪枝。
 * - 同 kind + actors[0] 且 3 天内的重复条目合并为一条（避免刷屏）。
 *
 * 依赖方向：Chronicle 单向依赖 useWorldStore；useWorldStore 永不 import 本模块（防循环）。
 */
import { useWorldStore } from '../store/useWorldStore';
import type { ChronicleEntry, ChronicleKind } from '../types';

const MAX_ENTRIES = 200;
const MERGE_WINDOW_DAYS = 3;

let seq = 0;
function nextId(day: number): string {
  seq = (seq + 1) % 100000;
  return `chron_${day}_${seq.toString(36)}_${Math.floor(Math.random() * 1000).toString(36)}`;
}

export interface RecordInput {
  kind: ChronicleKind;
  actors: string[];
  placeId?: string;
  text: string;
  importance: 1 | 2 | 3;
  tags: string[];
}

/** 写入一条台账（唯一入口） */
export function record(input: RecordInput): void {
  const store = useWorldStore.getState();
  const day = Math.floor(store.day);
  const list = store.chronicle ?? [];

  // 合并：同 kind + 同首要 actor，且 3 天内已有 → 更新 text/day，不新增
  const primary = input.actors[0];
  const dupIdx = list.findIndex(
    (e) =>
      e.kind === input.kind &&
      e.actors[0] === primary &&
      Math.abs(day - e.day) <= MERGE_WINDOW_DAYS &&
      e.importance < 3 // importance 3 的重大事件不合并
  );
  if (dupIdx >= 0) {
    const merged: ChronicleEntry = {
      ...list[dupIdx],
      day,
      text: input.text,
      tags: Array.from(new Set([...list[dupIdx].tags, ...input.tags])),
      importance: Math.max(list[dupIdx].importance, input.importance) as 1 | 2 | 3,
      placeId: input.placeId ?? list[dupIdx].placeId,
    };
    const next = [...list];
    next[dupIdx] = merged;
    useWorldStore.setState({ chronicle: next });
    return;
  }

  const entry: ChronicleEntry = {
    id: nextId(day),
    day,
    kind: input.kind,
    actors: input.actors,
    placeId: input.placeId,
    text: input.text,
    importance: input.importance,
    tags: input.tags,
  };

  let next = [entry, ...list];

  // 剪枝：超上限时，从 importance 最低、day 最旧的开始删；importance 3 永不删
  if (next.length > MAX_ENTRIES) {
    const removable = next
      .filter((e) => e.importance < 3)
      .sort((a, b) => a.importance - b.importance || a.day - b.day);
    const toRemove = new Set(removable.slice(0, next.length - MAX_ENTRIES).map((e) => e.id));
    next = next.filter((e) => !toRemove.has(e.id));
  }

  useWorldStore.setState({ chronicle: next });
}

export interface ChronicleQuery {
  aboutNpc?: string;
  placeId?: string;
  tags?: string[];
  minImportance?: number;
  limit?: number;
}

/** 检索台账，按 day 倒序 */
export function query(q: ChronicleQuery): ChronicleEntry[] {
  const list = useWorldStore.getState().chronicle ?? [];
  let out = list;

  if (q.aboutNpc) out = out.filter((e) => e.actors.includes(q.aboutNpc!));
  if (q.placeId) out = out.filter((e) => e.placeId === q.placeId);
  if (q.minImportance !== undefined) out = out.filter((e) => e.importance >= q.minImportance!);
  if (q.tags && q.tags.length > 0) {
    out = out.filter((e) => q.tags!.some((t) => e.tags.includes(t)));
  }

  out = [...out].sort((a, b) => b.day - a.day);
  if (q.limit !== undefined) out = out.slice(0, q.limit);
  return out;
}

/** 某标签（或 kind）出现的总次数，供称号/书信判定 */
export function countTags(tag: string): number {
  const list = useWorldStore.getState().chronicle ?? [];
  return list.filter((e) => e.tags.includes(tag)).length;
}

/** 某 kind 出现的总次数 */
export function countKind(kind: ChronicleKind): number {
  const list = useWorldStore.getState().chronicle ?? [];
  return list.filter((e) => e.kind === kind).length;
}
