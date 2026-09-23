// ============ 世界状态：时间 + 所在格子 + 迷雾 ============
// 时间在挂机时自己流逝（DAY_MS 毫秒 = 1 天），行军会直接消耗天数。

import { create } from 'zustand';
import { DAY_MS, SHICHEN } from '../data/constants';
import { TERRAIN_CONFIG, findRoute, getCellById, getNeighbors, type CellRoute } from '../data/cellMap';
import { getCellEncounter } from '../data/cellEncounters';
import { useGameStore } from './useGameStore';
import { advanceNpcDay } from '../engine/NpcAutonomy';
import { tickVisits } from '../engine/VisitSystem';
import { sum as sumEffect } from '../engine/ItemEffects';
import type { Consequence, PendingVisit } from '../types';

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
  /** 全局剧情旗标（对话分支/彩蛋落下的世界级旗标） */
  worldFlags: Record<string, boolean>;
  /** 今日世界事件（丰饶/妖气/集市…） */
  dailyEvent: { day: number; kind: 'battle' | 'industry' | 'calm'; text: string } | null;
  /** 待上门的 NPC 行动队列 */
  visits: PendingVisit[];
  /** 跨系统后果（价格/拒卖/封锁/任务） */
  consequences: Consequence[];
  /** 玩家对每个势力的声望 */
  factionRep: Record<string, number>;
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
  setWorldFlag: (key: string) => void;
  hasWorldFlag: (key: string) => boolean;
  setDailyEvent: (e: WorldSave['dailyEvent']) => void;
  enqueueVisit: (v: Omit<PendingVisit, 'id'>) => void;
  resolveVisit: (visitId: string) => void;
  addConsequence: (c: Consequence) => void;
  pruneConsequences: (day: number) => void;
  addFactionRep: (factionId: string, delta: number) => void;
  getFactionRep: (factionId: string) => number;
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
  worldFlags: {},
  dailyEvent: null,
  visits: [],
  consequences: [],
  factionRep: {},
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
      tickVisits(d);
      get().pruneConsequences(d);
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

    // 势力封锁：被封城的据点不允许进入（后果由 FactionSystem 结出）
    const destMapId = getCellEncounter(cellId)?.mapId;
    if (destMapId) {
      const block = state.consequences.find(
        (c) => c.kind === 'block' && c.scope.placeId === destMapId && c.untilDay > Math.floor(state.day)
      );
      if (block) {
        useGameStore.getState().addGameLog(`无法前往：${block.reason}`);
        return null;
      }
    }

    const route = findRoute(state.currentCellId, cellId);
    if (!route) return null;

    // 行脚词条：行军天数减少（最低 1 天）
    const travelCut = sumEffect('travelDays');
    const days = Math.max(route.days > 0 ? 1 : 0, route.days - travelCut);

    const revealed = new Set(state.revealedCells);
    route.path.forEach((id) => revealed.add(id));
    // 识途词条：沿途多揭 1 格（终点的邻格）
    if (sumEffect('revealExtra') > 0) {
      for (const nb of getNeighbors(cellId)) revealed.add(nb);
    }
    const visited = new Set(state.visitedCells);
    visited.add(cellId);

    set({
      currentCellId: cellId,
      revealedCells: Array.from(revealed),
      visitedCells: Array.from(visited),
      day: state.day + days,
    });

    // 同步战斗系统：此地有哪些妖怪
    const game = useGameStore.getState();
    game.enterCell(cellId);

    const cell = getCellById(cellId);
    const enc = getCellEncounter(cellId);
    const terrain = cell ? TERRAIN_CONFIG[cell.terrain] : undefined;
    const where = enc?.label ?? terrain?.name ?? cellId;
    game.addGameLog(
      days > 0
        ? `行军 ${days} 天，抵达${where}（第 ${Math.floor(get().day)} 天）`
        : `抵达${where}`
    );
    // 返回调整后的天数（行脚词条会减天），否则 UI/提示会显示未减天的旧值
    return { ...route, days };
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
      worldFlags: data.worldFlags ?? {},
      dailyEvent: data.dailyEvent ?? null,
      visits: (data as WorldSave & { visits?: PendingVisit[] }).visits ?? [],
      consequences: (data as WorldSave & { consequences?: Consequence[] }).consequences ?? [],
      factionRep: (data as WorldSave & { factionRep?: Record<string, number> }).factionRep ?? {},
    });
  },

  resetWorld: () => set({ ...DEFAULT_WORLD, lastTickAt: Date.now() }),

  markGathered: (cellId) => set((s) => ({ gathered: { ...s.gathered, [cellId]: Math.floor(s.day) } })),
  claimBounty: (id) => set((s) => ({ bountyClaimed: [...s.bountyClaimed, id] })),
  setWorldFlag: (key) => set((s) => ({ worldFlags: { ...s.worldFlags, [key]: true } })),
  hasWorldFlag: (key) => Boolean(get().worldFlags[key]),
  setDailyEvent: (e) => set({ dailyEvent: e }),

  enqueueVisit: (v) => set((s) => {
    if (s.visits.filter((x) => !x.resolved).length >= 3) return {};
    const visit: PendingVisit = { ...v, id: `visit_${v.npcId}_${v.arriveDay}_${Date.now().toString(36)}` };
    return { visits: [...s.visits, visit] };
  }),

  resolveVisit: (visitId) => set((s) => ({
    visits: s.visits.map((v) => (v.id === visitId ? { ...v, resolved: true } : v)),
  })),

  addConsequence: (c) => set((s) => ({ consequences: [...s.consequences, c] })),

  pruneConsequences: (day) => set((s) => ({ consequences: s.consequences.filter((c) => c.untilDay > day) })),

  addFactionRep: (factionId, delta) => set((s) => {
    const cur = s.factionRep[factionId] ?? 0;
    return { factionRep: { ...s.factionRep, [factionId]: Math.max(-100, Math.min(100, cur + delta)) } };
  }),

  getFactionRep: (factionId) => get().factionRep[factionId] ?? 0,
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
