import { create } from 'zustand';
import { DEPARTMENTS, MAX_FACTORY_WORKERS, FACTORY_WORKER_COST_GOLD, FACTORY_WORKER_BONUS, FACTORY_BASE_PROFIT, FACTORY_BUILD_COST, getDeptById } from '../data/factory';
import { useGameStore } from './useGameStore';

// 中文材料名 → store resources key（与 useGameStore 中的 RES_KEY_MAP 保持一致）
const CHINESE_TO_ENGLISH: Record<string, string> = {
  '木材': 'wood', '铁矿': 'iron', '皮革': 'hide', '石头': 'stone', '药草': 'herb',
};

export interface FactoryDeptState {
  id: string;
  built: boolean;
  level: number;
  workerCount: number;
}

interface FactoryState {
  factoryBuilt: boolean;   // 工厂是否已建造（默认 false）
  depts: FactoryDeptState[];
  totalWorkers: number;
}

interface FactoryActions {
  buildFactory: () => boolean;        // 建造工厂（花费资源，解锁 basic 部门）
  buyDepartment: (deptId: string) => void;  // 购买部门（需先 buildFactory）
  hireWorker: (deptId: string) => void;
  fireWorker: (deptId: string) => void;
  resetFactory: () => void;
  setDepts: (depts: FactoryDeptState[]) => void;
  setTotalWorkers: (n: number) => void;
  setFactoryBuilt: (v: boolean) => void;
  /** 获取工厂每秒金币产出速率（用于UI显示） */
  getGoldPerSecond: () => number;
}

const initDepts: FactoryDeptState[] = DEPARTMENTS.map(d => ({
  id: d.id,
  built: false,   // 全部未建造，factoryBuilt=true 时 basic 由 buildFactory 解锁
  level: 1,
  workerCount: 0,
}));

// 工厂自动入账定时器（每秒 tick，与建筑定时器一致）
let _factoryTimer: ReturnType<typeof setInterval> | null = null;
let _lastFactoryTick: number = 0;
// 累积的秒数（用于支持非整数间隔）
let _accumulatedFraction: number = 0;

function startFactoryTimer() {
  if (_factoryTimer) return;
  _lastFactoryTick = Date.now();
  _factoryTimer = setInterval(tickFactory, 1000);
}

function stopFactoryTimer() {
  if (_factoryTimer) { clearInterval(_factoryTimer); _factoryTimer = null; }
}

function tickFactory() {
  const state = useFactoryStore.getState();
  if (!state.factoryBuilt) {
    _accumulatedFraction = 0;
    return;
  }
  const builtDepts = state.depts.filter(d => d.built);
  if (builtDepts.length === 0) return;

  const now = Date.now();
  const deltaS = (now - _lastFactoryTick) / 1000;
  _lastFactoryTick = now;

  // 计算总倍率
  const totalBonus = state.getGoldPerSecond(); // 这是每秒金币，但我们需要倍率
  // 不对，getGoldPerSecond 已经是最终金币了，直接用
  const goldThisTick = totalBonus * deltaS;

  if (goldThisTick >= 1) {
    useGameStore.getState().addGold(Math.floor(goldThisTick));
    // 保留不足 1G 的零头
    _accumulatedFraction += goldThisTick - Math.floor(goldThisTick);
    if (_accumulatedFraction >= 1) {
      useGameStore.getState().addGold(1);
      _accumulatedFraction -= 1;
    }
  } else {
    _accumulatedFraction += goldThisTick;
    if (_accumulatedFraction >= 1) {
      useGameStore.getState().addGold(1);
      _accumulatedFraction -= 1;
    }
  }
}

export const useFactoryStore = create<FactoryState & FactoryActions>((set, get) => ({
  factoryBuilt: false,
  depts: initDepts,
  totalWorkers: 0,

  // ── 建造工厂（一次性，花资源，解锁 basic） ──
  buildFactory: () => {
    const resources = useGameStore.getState().resources;
    const buildCost = FACTORY_BUILD_COST;
    // 检查材料（ FACTORY_BUILD_COST 用中文 key，resources 用英文 key，需要映射）
    for (const [cnKey, amt] of Object.entries(buildCost)) {
      const enKey = CHINESE_TO_ENGLISH[cnKey] ?? cnKey;
      if ((resources[enKey] ?? 0) < amt) {
        useGameStore.getState().addGameLog(`建造工厂：${cnKey} 不足（持有 0，需要 ${amt}）`);
        return false;
      }
    }
    // 扣材料
    for (const [cnKey, amt] of Object.entries(buildCost)) {
      const enKey = CHINESE_TO_ENGLISH[cnKey] ?? cnKey;
      useGameStore.getState().addResource(enKey, -amt);
    }
    // 建造工厂，解锁基础车间
    set((s) => ({
      factoryBuilt: true,
      depts: s.depts.map(d => d.id === 'basic' ? { ...d, built: true } : d),
    }));
    useGameStore.getState().addGameLog('工厂建造完成！基础车间已解锁！');
    startFactoryTimer();
    return true;
  },

  // ── 购买部门 ──
  buyDepartment: (deptId) => {
    const { factoryBuilt } = get();
    if (!factoryBuilt) return;
    const cfg = getDeptById(deptId);
    if (!cfg || cfg.id === 'basic') return;
    const existing = get().depts.find(d => d.id === deptId);
    if (existing?.built) return;
    const resources = useGameStore.getState().resources;
    const hero = useGameStore.getState().hero;
    if (hero.gold < cfg.costGold) {
      useGameStore.getState().addGameLog(`购买部门：金币不足（需要 ${cfg.costGold}）`);
      return;
    }
    for (const [cnKey, amt] of Object.entries(cfg.costResources)) {
      const enKey = CHINESE_TO_ENGLISH[cnKey] ?? cnKey;
      if ((resources[enKey] ?? 0) < amt) {
        useGameStore.getState().addGameLog(`购买部门：${cnKey} 不足（持有 0，需要 ${amt}）`);
        return;
      }
    }
    useGameStore.getState().addGold(-cfg.costGold);
    for (const [cnKey, amt] of Object.entries(cfg.costResources)) {
      const enKey = CHINESE_TO_ENGLISH[cnKey] ?? cnKey;
      useGameStore.getState().addResource(enKey, -amt);
    }
    set((s) => ({
      depts: s.depts.map(d => d.id === deptId ? { ...d, built: true } : d),
    }));
    useGameStore.getState().addGameLog(`部门「${cfg.name}」解锁！（利润 +${Math.round(cfg.bonusFactor * 100)}%）`);
  },

  hireWorker: (deptId) =>
    set((s) => {
      if (s.totalWorkers >= MAX_FACTORY_WORKERS) return s;
      const cfg = DEPARTMENTS.find(c => c.id === deptId);
      useGameStore.getState().addGameLog(`雇佣工人：${cfg?.name ?? deptId}（总工人：${s.totalWorkers + 1}）`);
      return {
        depts: s.depts.map(d => d.id === deptId ? { ...d, workerCount: d.workerCount + 1 } : d),
        totalWorkers: s.totalWorkers + 1,
      };
    }),

  fireWorker: (deptId) =>
    set((s) => {
      const dept = s.depts.find(d => d.id === deptId);
      if (!dept || dept.workerCount <= 0) return s;
      return {
        depts: s.depts.map(d => d.id === deptId ? { ...d, workerCount: d.workerCount - 1 } : d),
        totalWorkers: s.totalWorkers - 1,
      };
    }),

  // ── 每秒金币产出速率 ──
  getGoldPerSecond: () => {
    const { depts, totalWorkers, factoryBuilt } = get();
    if (!factoryBuilt) return 0;
    const builtDepts = depts.filter(d => d.built);
    if (builtDepts.length === 0) return 0;
    let bonus = 1.0;
    for (const d of depts) {
      if (!d.built) continue;
      const cfg = DEPARTMENTS.find(c => c.id === d.id);
      if (cfg) bonus += cfg.bonusFactor;
    }
    bonus += totalWorkers * FACTORY_WORKER_BONUS;
    return FACTORY_BASE_PROFIT * bonus / FACTORY_BASE_INTERVAL_S;
  },

  resetFactory: () => {
    stopFactoryTimer();
    _accumulatedFraction = 0;
    set({ factoryBuilt: false, depts: initDepts, totalWorkers: 0 });
  },

  setDepts: (depts) => set({ depts }),
  setTotalWorkers: (n) => set({ totalWorkers: n }),
  setFactoryBuilt: (v) => {
    if (v) startFactoryTimer();
    else stopFactoryTimer();
    set({ factoryBuilt: v });
  },
}));
