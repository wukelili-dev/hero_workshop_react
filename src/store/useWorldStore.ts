// ============ 世界状态：时间 + 所在格子 + 迷雾 ============
// 时间在挂机时自己流逝（DAY_MS 毫秒 = 1 天），行军会直接消耗天数。

import { create } from 'zustand';
import { DAY_MS, SHICHEN } from '../data/constants';
import { TERRAIN_CONFIG, findRoute, getCellById, type CellRoute } from '../data/cellMap';
import { getCellEncounter } from '../data/cellEncounters';
import { useGameStore } from './useGameStore';
import { advanceNpcDay } from '../engine/NpcAutonomy';

/** 出生点：傲来国（新手区，与 useGameStore 默认 currentMapId='aolai' 对齐） */
export const START_CELL_ID = 'cp_2_5';

export interface WorldSave {
  day: number;
  currentCellId: string;
  revealedCells: string[];
  visitedCells: string[];
  lastTickAt: number;
  /** 采集点冷却：cellId → 上次采集的游戏日 */
  gathered: Record<string, number>;
  /** 已领奖的悬赏 id */
  bountyClaimed: string[];
  /** 今日世界事件（丰饶/妖气/集市…） */
  dailyEvent: { day: number; kind: 'battle' | 'industry' | 'calm'; text: string } | null;
}

type WorldState = WorldSave;

interface WorldActions {
  tick: (now?: number) => void;
  advanceDays: (days: number) => void;
  moveTo: (cellId: string) => CellRoute | null;
  syncEncounter: () => void;
  loadWorld: (data: Partial<WorldSave>) => void;
  resetWorld: () => void;
  markGathered: (cellId: string) => void;
  claimBounty: (id: string) => void;
  setDailyEvent: (e: WorldSave['dailyEvent']) => void;
}

/** 每日世界事件：挂在日推进上，给世界一点周期感 */
export function rollDailyEvent(day: number): WorldSave['dailyEvent'] {
  if (day % 7 === 0) return { day, kind: 'industry', text: '今日集市大旺：产业产出翻倍（今日）' };
  if (day % 5 === 0) return { day, kind: 'calm', text: '今日风调雨顺：NPC 心情转好' };
  if (day % 3 === 0) return { day, kind: 'battle', text: '今日妖气大盛：战斗收益 +50%' };
  return null;
}

const DEFAULT_WORLD: WorldState = {
  day: 1,
  currentCellId: START_CELL_ID,
  revealedCells: [],
  visitedCells: [START_CELL_ID],
  lastTickAt: Date.now(),
  gathered: {},
  bountyClaimed: [],
  dailyEvent: null,
};

export const useWorldStore = create<WorldState & WorldActions>((set, get) => ({
  ...DEFAULT_WORLD,

  /** 挂机时间流逝 */
  tick: (now) => {
    const t = now ?? Date.now();
    const { lastTickAt, day } = get();
    const delta = t - lastTickAt;
    if (delta <= 0) {
      set({ lastTickAt: t });
      return;
    }
    const next = day + delta / DAY_MS;
    // 跨过整数天：推进 NPC 自主行为（每天一次，只演算活跃 NPC）
    if (Math.floor(next) > Math.floor(day)) {
      const d = Math.floor(next);
      advanceNpcDay(d);
      set({ dailyEvent: rollDailyEvent(d) });
    }
    set({ day: next, lastTickAt: t });
  },

  advanceDays: (days) => {
    if (days === 0) return;
    set((s) => ({ day: s.day + days }));
  },

  /** 移动到任意格子：按地形累计天数、沿途揭开迷雾 */
  moveTo: (cellId) => {
    const state = get();
    if (cellId === state.currentCellId) return { path: [cellId], days: 0 };

    const route = findRoute(state.currentCellId, cellId);
    if (!route) return null;

    const revealed = new Set(state.revealedCells);
    route.path.forEach((id) => revealed.add(id));
    const visited = new Set(state.visitedCells);
    visited.add(cellId);

    set({
      currentCellId: cellId,
      revealedCells: Array.from(revealed),
      visitedCells: Array.from(visited),
      day: state.day + route.days,
    });

    // 同步战斗系统：此地有哪些妖怪
    const game = useGameStore.getState();
    game.enterCell(cellId);

    const cell = getCellById(cellId);
    const enc = getCellEncounter(cellId);
    const terrain = cell ? TERRAIN_CONFIG[cell.terrain] : undefined;
    const where = enc?.label ?? terrain?.name ?? cellId;
    game.addGameLog(
      route.days > 0
        ? `行军 ${route.days} 天，抵达${where}（第 ${Math.floor(get().day)} 天）`
        : `抵达${where}`
    );
    return route;
  },

  /** 让战斗系统读取当前格子的遭遇（开局 / 读档后调用） */
  syncEncounter: () => {
    useGameStore.getState().enterCell(get().currentCellId);
  },

  loadWorld: (data) => {
    set({
      day: typeof data.day === 'number' && data.day >= 1 ? data.day : 1,
      currentCellId: data.currentCellId ?? START_CELL_ID,
      revealedCells: data.revealedCells ?? [],
      visitedCells: data.visitedCells ?? [START_CELL_ID],
      lastTickAt: data.lastTickAt ?? Date.now(),
      gathered: data.gathered ?? {},
      bountyClaimed: data.bountyClaimed ?? [],
      dailyEvent: data.dailyEvent ?? null,
    });
  },

  resetWorld: () => set({ ...DEFAULT_WORLD, lastTickAt: Date.now() }),

  markGathered: (cellId) => set((s) => ({ gathered: { ...s.gathered, [cellId]: Math.floor(s.day) } })),
  claimBounty: (id) => set((s) => ({ bountyClaimed: [...s.bountyClaimed, id] })),
  setDailyEvent: (e) => set({ dailyEvent: e }),
}));

/** 第几天（1 起） */
export function dayNumber(day: number): number {
  return Math.max(1, Math.floor(day));
}

/** 十二时辰 */
export function shichenOf(day: number): string {
  const frac = day - Math.floor(day);
  const idx = Math.min(SHICHEN.length - 1, Math.max(0, Math.floor(frac * SHICHEN.length)));
  return SHICHEN[idx];
}

/** 「第 12 天 · 午时」 */
export function formatDayLabel(day: number): string {
  return `第 ${dayNumber(day)} 天 · ${shichenOf(day)}`;
}

let _worldTimer: ReturnType<typeof setInterval> | null = null;

/** 启动世界时钟（每秒累加一次） */
export function startWorldClock(): void {
  if (_worldTimer) return;
  useWorldStore.setState({ lastTickAt: Date.now() });
  _worldTimer = setInterval(() => {
    useWorldStore.getState().tick(Date.now());
  }, 1000);
}
