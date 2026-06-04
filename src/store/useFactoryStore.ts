import { create } from 'zustand';
import { DEPARTMENTS, MAX_FACTORY_WORKERS, FACTORY_WORKER_COST_GOLD, FACTORY_WORKER_BONUS, FACTORY_BASE_PROFIT, FACTORY_BASE_INTERVAL_S } from '../data/factory';

export interface FactoryDeptState {
  id: string;
  built: boolean;
  level: number;
  workerCount: number;
  lastProduceAt: number;
}

interface FactoryState {
  depts: FactoryDeptState[];
  totalWorkers: number;
  autoRunning: boolean;
}

interface FactoryActions {
  buildDept: (deptId: string) => void;
  hireWorker: (deptId: string) => void;
  fireWorker: (deptId: string) => void;
  startProduction: () => void;
  collectProfit: () => { gold: number };
  setAutoRunning: (v: boolean) => void;
  resetFactory: () => void;
}

const initDepts: FactoryDeptState[] = DEPARTMENTS.map(d => ({
  id: d.id,
  built: d.built ?? false,
  level: 1,
  workerCount: 0,
  lastProduceAt: 0,
}));

export const useFactoryStore = create<FactoryState & FactoryActions>((set, get) => ({
  depts: initDepts,
  totalWorkers: 0,
  autoRunning: false,

  buildDept: (deptId) =>
    set((s) => ({
      depts: s.depts.map(d => d.id === deptId ? { ...d, built: true } : d),
    })),

  hireWorker: (deptId) =>
    set((s) => {
      if (s.totalWorkers >= MAX_FACTORY_WORKERS) return s;
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

  startProduction: () => set((s) => ({
    depts: s.depts.map(d => d.built ? { ...d, lastProduceAt: Date.now() } : d),
  })),

  collectProfit: () => {
    const { depts, totalWorkers } = get();
    let bonus = 1.0;
    for (const d of depts) {
      if (d.built) {
        const cfg = DEPARTMENTS.find(c => c.id === d.id);
        if (cfg) bonus += cfg.bonusFactor;
      }
    }
    bonus += totalWorkers * FACTORY_WORKER_BONUS;
    const profit = Math.floor(FACTORY_BASE_PROFIT * bonus);
    return { gold: profit };
  },

  setAutoRunning: (v) => set({ autoRunning: v }),

  resetFactory: () => set({ depts: initDepts, totalWorkers: 0, autoRunning: false }),
}));
