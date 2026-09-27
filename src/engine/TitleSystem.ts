/**
 * TitleSystem — 玩家称号判定 + 玩家志汇总（沉浸感 I3）
 *
 * 称号从行为史（台账标签计数 + 善恶值）算出，priority 越大越优先。
 * 依赖方向：TitleSystem 单向依赖 Chronicle/useGameStore/useWorldStore/useNpcEcoStore，无环。
 */
import { TITLES } from '../data/titles';
import { query as queryChronicle, countTags } from './Chronicle';
import { useGameStore } from '../store/useGameStore';
import { useWorldStore } from '../store/useWorldStore';
import { useNpcEcoStore } from '../store/useNpcEcoStore';
import { NPCS } from '../data/npcs';
import type { PlayerTitle } from '../types';

function titleMatches(t: PlayerTitle): boolean {
  const w = t.when;
  const moral = useGameStore.getState().hero.moralValue;
  if (w.moral) {
    if (w.moral.min !== undefined && moral < w.moral.min) return false;
    if (w.moral.max !== undefined && moral > w.moral.max) return false;
  }
  if (w.tags) {
    for (const [tag, r] of Object.entries(w.tags)) {
      if (countTags(tag) < (r.min ?? 1)) return false;
    }
  }
  if (w.flags) {
    const worldFlags = useWorldStore.getState().worldFlags;
    for (const [flag, r] of Object.entries(w.flags)) {
      if (!worldFlags[flag]) return false;
      void r;
    }
  }
  return true;
}

/** 当前生效的称号（priority 降序取第一个命中） */
export function currentTitle(): PlayerTitle | null {
  const matched = TITLES.filter(titleMatches).sort((a, b) => b.priority - a.priority);
  return matched[0] ?? null;
}

/** 称号名（无称号返回空串，供 ${call} 用） */
export function titleName(): string {
  return currentTitle()?.name ?? '';
}

/** 称号来历说明 */
export function titleFlavor(): string {
  return currentTitle()?.flavor ?? '';
}

/** 玩家志：当前称号 + 行迹时间线 + 恩怨 + 婚配 + 击杀数 + 去过的地方 */
export interface PlayerChronicle {
  title: PlayerTitle | null;
  titleFlavor: string;
  timeline: { day: number; text: string }[];
  enemies: string[];
  benefactors: string[];
  spouse: string | null;
  kills: number;
  visitedRegions: string[];
}

export function buildPlayerChronicle(): PlayerChronicle {
  const title = currentTitle();
  const game = useGameStore.getState();
  const world = useWorldStore.getState();
  const eco = useNpcEcoStore.getState();

  const timeline = queryChronicle({ minImportance: 2, limit: 20 }).map((e) => ({ day: e.day, text: e.text }));

  // 恩怨名单：遍历 NPC 生态的 enemies / benefactors
  const enemies: string[] = [];
  const benefactors: string[] = [];
  let spouse: string | null = null;
  for (const npc of NPCS) {
    const e = eco.getEco(npc.id);
    if (e.enemies.includes('player')) enemies.push(npc.name);
    if (e.benefactors.includes('player')) benefactors.push(npc.name);
    if (e.bond === '夫妻') spouse = npc.name;
  }

  const kills = Object.values(game.killCounts ?? {}).reduce((s, n) => s + n, 0);
  const visitedRegions = world.visitedCells
    .map((c) => c.split('_')[0])
    .filter((v, i, a) => a.indexOf(v) === i);

  return {
    title,
    titleFlavor: title?.flavor ?? '',
    timeline,
    enemies,
    benefactors,
    spouse,
    kills,
    visitedRegions,
  };
}
