// ============ 世界状态：时间 + 所在格子 + 迷雾 ============
// 世界时间不自动流动（设计取向 ③）：天数只由「行军 / 消耗天数的行动」推进。
// 界面上仍以 1 天 = DAY_MS 的旧口径做离线收益换算（OfflineReport），那是独立系统。

import { create } from 'zustand';
import { SHICHEN } from '../data/constants';
import { TERRAIN_CONFIG, findRoute, getCellById, getNeighbors, type CellRoute } from '../data/cellMap';
import { getCellEncounter } from '../data/cellEncounters';
import { useGameStore } from './useGameStore';
import { useInventoryStore } from './useInventoryStore';
import { advanceNpcDay } from '../engine/NpcAutonomy';
import { tickVisits } from '../engine/VisitSystem';
import { sum as sumEffect } from '../engine/ItemEffects';
import { regionOfCell, gateBetween, type RegionGate } from '../data/regions';
import type { ChronicleEntry, Consequence, PendingVisit, PlaceState } from '../types';

/** 出生点：傲来国（新手区，与 useGameStore 默认 currentMapId='aolai' 对齐） */
export const START_CELL_ID = 'cp_2_5';

/**
 * 跨过整数天时的副作用，集中在这一处（原本挂在每秒 tick 上）。
 * 取向 ③ 之后天数只由行军/行动推进，所以触发点改为「任何 day 增加的地方」：
 * advanceDays()、moveTo() 都会调用它。
 */
function applyDayCrossing(from: number, to: number): void {
  if (Math.floor(to) <= Math.floor(from)) return;
  const d = Math.floor(to);
  advanceNpcDay(d);
  tickVisits(d);
  useWorldStore.getState().pruneConsequences(d);
  useWorldStore.setState({ dailyEvent: rollDailyEvent(d) });
}

export interface WorldSave {
  day: number;
  currentCellId: string;
  /** 当前所在区域 id（多区域世界 R1） */
  currentRegionId: string;
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
  /** 市场库存（跑商价格冲击）：key = `${cityId}:${goodId}` → 偏离基准的存量 */
  marketStock: Record<string, number>;
  /** 打听到的行情情报（3 天过期） */
  marketIntel: { cityId: string; goodId: string; price: number; day: number }[];
  /** 世界叙事台账（回声层：玩家行为史） */
  chronicle: ChronicleEntry[];
  /** 地方状态（城市/区域记忆） */
  places: Record<string, PlaceState>;
  /** 信箱：NPC 来信 */
  letters: import('../types').LetterInstance[];
}

type WorldState = WorldSave;

interface WorldActions {
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
  /** 调整某城某货的库存（正=买入推高价格，负=卖出压低），并返回新库存 */
  adjustMarketStock: (cityId: string, goodId: string, delta: number) => number;
  getMarketStock: (cityId: string, goodId: string) => number;
  /** 记录一条行情情报（同城同货覆盖为最新） */
  setMarketIntel: (intel: { cityId: string; goodId: string; price: number; day: number }) => void;
  getMarketIntel: (cityId: string, goodId: string) => { cityId: string; goodId: string; price: number; day: number } | undefined;
}

/** 每日世界事件：挂在日推进上，给世界一点周期感 */
export function rollDailyEvent(day: number): WorldSave['dailyEvent'] {
  if (day % 7 === 0) return { day, kind: 'industry', text: '今日集市大旺：产业产出翻倍（今日）' };
  if (day % 5 === 0) return { day, kind: 'calm', text: '今日风调雨顺：NPC 心情转好' };
  if (day % 3 === 0) return { day, kind: 'battle', text: '今日妖气大盛：战斗收益 +50%' };
  return null;
}

/** 关隘通行校验：返回拦截原因（null = 放行） */
export function checkGate(gate: RegionGate): string | null {
  const game = useGameStore.getState();
  const world = useWorldStore.getState();
  const req = gate.require;
  if (!req) return null;
  if (req.minLevel !== undefined && game.hero.level < req.minLevel) {
    return `需等级 ${req.minLevel}（当前 Lv.${game.hero.level}）`;
  }
  if (req.itemId) {
    const has = (useInventoryStore.getState().novelties[req.itemId] ?? 0) > 0
      || (useInventoryStore.getState().materials[req.itemId] ?? 0) > 0;
    if (!has) return `需持有「${req.itemId}」`;
  }
  if (req.factionRep) {
    const rep = world.getFactionRep(req.factionRep.id);
    if (rep < req.factionRep.min) {
      return `需 ${req.factionRep.id} 声望 ≥ ${req.factionRep.min}（当前 ${rep}）`;
    }
  }
  return null;
}

const DEFAULT_WORLD: WorldState = {
  day: 1,
  currentCellId: START_CELL_ID,
  currentRegionId: 'central_plain',
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
  marketStock: {},
  marketIntel: [],
  chronicle: [],
  places: {},
  letters: [],
};

export const useWorldStore = create<WorldState & WorldActions>((set, get) => ({
  ...DEFAULT_WORLD,

  /** 消耗天数（行军之外的所有"过一天"行动走这里） */
  advanceDays: (days) => {
    if (days === 0) return;
    const cur = get().day;
    const next = cur + days;
    set({ day: next });
    applyDayCrossing(cur, next);
  },

  /** 移动到任意格子：按地形累计天数、沿途揭开迷雾；跨区域走关隘（校验门槛） */
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

    // 关隘校验：目标格跨区域时，须满足通往该区域的关隘门槛
    const destRegion = regionOfCell(cellId);
    if (destRegion && destRegion.id !== state.currentRegionId) {
      const gate = gateBetween(state.currentRegionId, destRegion.id);
      if (!gate) {
        useGameStore.getState().addGameLog(`此去${destRegion.name}并无通路。`);
        return null;
      }
      const refuse = checkGate(gate);
      if (refuse) {
        useGameStore.getState().addGameLog(`无法前往${destRegion.name}：${refuse}`);
        return null;
      }
    }

    const route = findRoute(state.currentCellId, cellId);
    if (!route) return null;

    // 行脚词条：行军天数减少（最低 1 天）
    const travelCut = sumEffect('travelDays');
    // 关隘通行耗时叠加在行军天数上
    const gateExtra = destRegion && destRegion.id !== state.currentRegionId
      ? (gateBetween(state.currentRegionId, destRegion.id)?.days ?? 0)
      : 0;
    const days = Math.max(route.days > 0 ? 1 : 0, route.days + gateExtra - travelCut);

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
      currentRegionId: destRegion?.id ?? state.currentRegionId,
      revealedCells: Array.from(revealed),
      visitedCells: Array.from(visited),
      day: state.day + days,
    });
    // 天数推进的副作用（NPC 自主行为 / 来访 / 每日事件）在行军这里补齐
    applyDayCrossing(state.day, state.day + days);

    // 同步战斗系统：此地有哪些妖怪
    const game = useGameStore.getState();
    game.enterCell(cellId);

    const cell = getCellById(cellId);
    const enc = getCellEncounter(cellId);
    const terrain = cell ? TERRAIN_CONFIG[cell.terrain] : undefined;
    const where = enc?.label ?? terrain?.name ?? cellId;
    const regionTag = destRegion && destRegion.id !== state.currentRegionId ? `（进入${destRegion.name}）` : '';
    game.addGameLog(
      days > 0
        ? `行军 ${days} 天，抵达${where}${regionTag}（第 ${Math.floor(get().day)} 天）`
        : `抵达${where}${regionTag}`
    );
    // 返回调整后的天数（行脚词条会减天），否则 UI/提示会显示未减天的旧值
    return { ...route, days };
  },

  /** 让战斗系统读取当前格子的遭遇（开局 / 读档后调用） */
  syncEncounter: () => {
    useGameStore.getState().enterCell(get().currentCellId);
  },

  loadWorld: (data) => {
    const cellId = data.currentCellId ?? START_CELL_ID;
    set({
      day: typeof data.day === 'number' && data.day >= 1 ? data.day : 1,
      currentCellId: cellId,
      currentRegionId: data.currentRegionId ?? regionOfCell(cellId)?.id ?? 'central_plain',
      revealedCells: data.revealedCells ?? [],
      visitedCells: data.visitedCells ?? [START_CELL_ID],
      // 注意：这里必须用「现在」而不是存档里的 lastTickAt。
      // 读档（含启动时自动读档）发生在 syncWorldClock 之后，若沿用旧时间戳，
      // 下一次 tick 会把「存档至今的真实间隔」整段换算成游戏日 → 天数控式膨胀。
      lastTickAt: Date.now(),
      gathered: data.gathered ?? {},
      bountyClaimed: data.bountyClaimed ?? [],
      worldFlags: data.worldFlags ?? {},
      dailyEvent: data.dailyEvent ?? null,
      visits: (data as WorldSave & { visits?: PendingVisit[] }).visits ?? [],
      consequences: (data as WorldSave & { consequences?: Consequence[] }).consequences ?? [],
      factionRep: (data as WorldSave & { factionRep?: Record<string, number> }).factionRep ?? {},
      marketStock: (data as WorldSave & { marketStock?: Record<string, number> }).marketStock ?? {},
      marketIntel: (data as WorldSave & { marketIntel?: { cityId: string; goodId: string; price: number; day: number }[] }).marketIntel ?? [],
      chronicle: (data as WorldSave & { chronicle?: ChronicleEntry[] }).chronicle ?? [],
      places: (data as WorldSave & { places?: Record<string, PlaceState> }).places ?? {},
      letters: (data as WorldSave & { letters?: import('../types').LetterInstance[] }).letters ?? [],
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

  adjustMarketStock: (cityId, goodId, delta) => {
    const key = `${cityId}:${goodId}`;
    const next = Math.max(-50, Math.min(50, (get().marketStock[key] ?? 0) + delta));
    set((s) => ({ marketStock: { ...s.marketStock, [key]: next } }));
    return next;
  },

  getMarketStock: (cityId, goodId) => get().marketStock[`${cityId}:${goodId}`] ?? 0,

  setMarketIntel: (intel) => set((s) => {
    const rest = s.marketIntel.filter((i) => !(i.cityId === intel.cityId && i.goodId === intel.goodId));
    return { marketIntel: [intel, ...rest].slice(0, 60) };
  }),

  getMarketIntel: (cityId, goodId) => get().marketIntel.find((i) => i.cityId === cityId && i.goodId === goodId),
}));

/** 第几天（1 起） */
export function dayNumber(day: number): number {
  return Math.max(1, Math.floor(day));
}

/**
 * 十二时辰。取向 ③ 之后天数只按整日推进，UI 暂不显示时辰；
 * 作为工具函数保留（将来的"半日/几个时辰"行动可直接复用）。
 */
export function shichenOf(day: number): string {
  const frac = day - Math.floor(day);
  const idx = Math.min(SHICHEN.length - 1, Math.max(0, Math.floor(frac * SHICHEN.length)));
  return SHICHEN[idx];
}

/** 「第 12 天」 */
export function formatDayLabel(day: number): string {
  return `第 ${dayNumber(day)} 天`;
}

/**
 * 世界时钟同步（取向 ③：不自动流动）。
 * 只刷新 lastTickAt 这个存档字段，不再起定时器 —— 天数只由行军/行动推进。
 */
export function syncWorldClock(): void {
  useWorldStore.setState({ lastTickAt: Date.now() });
}
