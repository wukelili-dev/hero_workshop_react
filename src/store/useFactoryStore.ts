import { create } from 'zustand';
import { DEPARTMENTS, MAX_FACTORY_WORKERS, FACTORY_WORKER_COST_GOLD, FACTORY_WORKER_BONUS, FACTORY_BASE_PROFIT, FACTORY_BASE_INTERVAL_S, FACTORY_BUILD_COST, getDeptById } from '../data/factory';
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
  lastProduceAt: number;  // 上次收取时间戳，0=从未收取
}

interface FactoryState {
  factoryBuilt: boolean;   // 工厂是否已建造（默认 false）
  depts: FactoryDeptState[];
  totalWorkers: number;
  autoRunning: boolean;
}

interface FactoryActions {
  buildFactory: () => boolean;        // 建造工厂（花费资源，解锁 basic 部门）
  buyDepartment: (deptId: string) => void;  // 购买部门（需先 buildFactory）
  hireWorker: (deptId: string) => void;
  fireWorker: (deptId: string) => void;
  collectProfit: () => { gold: number };
  setAutoRunning: (v: boolean) => void;
  resetFactory: () => void;
  setDepts: (depts: FactoryDeptState[]) => void;
  setTotalWorkers: (n: number) => void;
  setFactoryBuilt: (v: boolean) => void;
}

// 自动产出定时器引用（模块级，不受 React 重渲染影响）
let _autoTimer: ReturnType<typeof setInterval> | null = null;

const initDepts: FactoryDeptState[] = DEPARTMENTS.map(d => ({
  id: d.id,
  built: false,   // 全部未建造，factoryBuilt=true 时 basic 由 buildFactory 解锁
  level: 1,
  workerCount: 0,
  lastProduceAt: 0,
}));

export const useFactoryStore = create<FactoryState & FactoryActions>((set, get) => ({
  factoryBuilt: false,
  depts: initDepts,
  totalWorkers: 0,
  autoRunning: false,

  // ── 建造工厂（一次性，花资源，解锁 basic） ──
  buildFactory: () => {
    const resources = useGameStore.getState().resources;
    const hero = useGameStore.getState().hero;
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
      depts: s.depts.map(d => d.id === 'basic' ? { ...d, built: true, lastProduceAt: Date.now() } : d),
    }));
    useGameStore.getState().addGameLog('工厂建造完成！基础车间已解锁！');
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
      depts: s.depts.map(d => d.id === deptId ? { ...d, built: true, lastProduceAt: Date.now() } : d),
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

  // ── 收取利润：必须有至少一个部门冷却完毕才能收 ──
  collectProfit: () => {
    const { depts, totalWorkers } = get();
    const now = Date.now();
    // basic 车间不受冷却限制；其他部门需等待 FACTORY_BASE_INTERVAL_S
    const cooledDepts = depts.filter(d => {
      if (!d.built) return false;
      if (d.id === 'basic') return true;
      return (now - d.lastProduceAt) / 1000 >= FACTORY_BASE_INTERVAL_S;
    });
    if (cooledDepts.length === 0) {
      useGameStore.getState().addGameLog('工厂：各部门冷却中，暂时无法收取！');
      return { gold: 0 };
    }
    // 计算利润倍率（只统计已冷却的部门）
    let bonus = 1.0;
    for (const d of cooledDepts) {
      const cfg = DEPARTMENTS.find(c => c.id === d.id);
      if (cfg) bonus += cfg.bonusFactor;
    }
    bonus += totalWorkers * FACTORY_WORKER_BONUS;
    const profit = Math.floor(FACTORY_BASE_PROFIT * bonus);
    // 收取后重置冷却（basic 不动；basic 在首次建造时已设 lastProduceAt，之后不再变）
    set((s) => ({
      depts: s.depts.map(d => {
        if (!d.built) return d;
        if (d.id === 'basic') return d;
        return { ...d, lastProduceAt: now };
      }),
    }));
    useGameStore.getState().addGold(profit);
    useGameStore.getState().addGameLog(`工厂收款：+${profit} 金币（倍率 ×${bonus.toFixed(1)}）`);
    return { gold: profit };
  },

  setAutoRunning: (v) => {
    if (v) {
      // 启动自动产出定时器：每 60 秒检查一次是否可收取
      if (!_autoTimer) {
        _autoTimer = setInterval(() => {
          const state = useFactoryStore.getState();
          if (!state.autoRunning) return;
          const { depts } = state;
          const now = Date.now();
          const cooled = depts.filter(d => {
            if (!d.built) return false;
            if (d.id === 'basic') return true;
            return (now - d.lastProduceAt) / 1000 >= FACTORY_BASE_INTERVAL_S;
          });
          if (cooled.length > 0) {
            useFactoryStore.getState().collectProfit();
          }
        }, 60_000);
      }
      set({ autoRunning: true });
    } else {
      if (_autoTimer) { clearInterval(_autoTimer); _autoTimer = null; }
      set({ autoRunning: false });
    }
  },

  resetFactory: () => set({ factoryBuilt: false, depts: initDepts, totalWorkers: 0, autoRunning: false }),

  setDepts: (depts) => set({ depts }),
  setTotalWorkers: (n) => set({ totalWorkers: n }),
  setFactoryBuilt: (v) => set({ factoryBuilt: v }),
}));
