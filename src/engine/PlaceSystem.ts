/**
 * PlaceSystem — 地方状态（沉浸感 I2）
 * 让格子/城市记住"这里发生过什么"。
 * prosperity 由跑商/交易推动；unrest 由闹事/击杀/通缉推动。
 * unrest 高 → 城门盘查、商人涨价；prosperity 高 → 商品更多、价格更低。
 *
 * 依赖方向：PlaceSystem 单向依赖 useWorldStore（读 places）。
 */
import { useWorldStore } from '../store/useWorldStore';
import type { PlaceState } from '../types';

export function getPlace(placeId: string): PlaceState {
  const places = useWorldStore.getState().places ?? {};
  const existing = places[placeId];
  if (existing) return existing;
  const fresh: PlaceState = { placeId, prosperity: 0, unrest: 0, scars: [], flags: {} };
  useWorldStore.setState({ places: { ...places, [placeId]: fresh } });
  return fresh;
}

export function patchPlace(placeId: string, p: Partial<PlaceState>): void {
  const cur = getPlace(placeId);
  useWorldStore.setState((s) => ({
    places: { ...s.places, [placeId]: { ...cur, ...p } },
  }));
}

export function adjustUnrest(placeId: string, delta: number): void {
  const cur = getPlace(placeId);
  const next = Math.max(0, Math.min(100, cur.unrest + delta));
  patchPlace(placeId, { unrest: next });
}

export function adjustProsperity(placeId: string, delta: number): void {
  const cur = getPlace(placeId);
  const next = Math.max(0, Math.min(100, cur.prosperity + delta));
  patchPlace(placeId, { prosperity: next });
}

export function addScar(placeId: string, kind: PlaceState['scars'][number]['kind'], text: string): void {
  const cur = getPlace(placeId);
  const day = Math.floor(useWorldStore.getState().day);
  patchPlace(placeId, { scars: [...cur.scars, { kind, day, text }].slice(-5) });
}

export function unrestOf(placeId: string): number {
  return useWorldStore.getState().places?.[placeId]?.unrest ?? 0;
}

export function prosperityOf(placeId: string): number {
  return useWorldStore.getState().places?.[placeId]?.prosperity ?? 0;
}

/** 盘查提示（unrest 高时城门加强盘查） */
export function unrestNote(placeId: string): string | null {
  const u = unrestOf(placeId);
  if (u >= 70) return '街上满是巡卒，进城门得被盘问半天。';
  if (u >= 40) return '近来不太平，城门口多了盘查的兵丁。';
  return null;
}
