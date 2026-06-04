import { create } from 'zustand';
import type { Monster } from '../types';

interface CombatState {
  currentEnemy: Monster | null;
  currentEnemyHp: number;
  isBattling: boolean;
  autoBattle: boolean;
  battleLogs: string[];
  currentMapId: string;
}

interface CombatActions {
  setCurrentEnemy: (enemy: Monster | null) => void;
  setEnemyHp: (hp: number) => void;
  startBattle: () => void;
  stopBattle: () => void;
  toggleAutoBattle: () => void;
  addBattleLog: (log: string) => void;
  clearLogs: () => void;
  setCurrentMap: (mapId: string) => void;
}

export const useCombatStore = create<CombatState & CombatActions>((set) => ({
  currentEnemy: null,
  currentEnemyHp: 0,
  isBattling: false,
  autoBattle: false,
  battleLogs: [],
  currentMapId: 'aolai',

  setCurrentEnemy: (enemy) =>
    set({ currentEnemy: enemy, currentEnemyHp: enemy?.hp ?? 0 }),

  setEnemyHp: (hp) => set({ currentEnemyHp: hp }),

  startBattle: () => set({ isBattling: true }),
  stopBattle: () => set({ isBattling: false }),

  toggleAutoBattle: () => set((s) => ({ autoBattle: !s.autoBattle })),

  addBattleLog: (log) =>
    set((s) => ({
      battleLogs: [...s.battleLogs.slice(-99), log],
    })),

  clearLogs: () => set({ battleLogs: [] }),

  setCurrentMap: (mapId) => set({ currentMapId: mapId }),
}));
