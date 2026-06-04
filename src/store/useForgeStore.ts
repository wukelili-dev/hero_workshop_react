import { create } from 'zustand';
import type { Equipment } from '../types';
import { FORTIFY_CONFIG } from '../data/forge';

interface ForgeState {
  selectedEquip: Equipment | null;
  fortifyLevel: number;
  useCharm: boolean;
  isForging: boolean;
  forgeLogs: string[];
}

interface ForgeActions {
  selectEquip: (equip: Equipment | null) => void;
  setFortifyLevel: (level: number) => void;
  toggleCharm: () => void;
  setForging: (forging: boolean) => void;
  addForgeLog: (log: string) => void;
  clearForgeLogs: () => void;
}

export const useForgeStore = create<ForgeState & ForgeActions>((set) => ({
  selectedEquip: null,
  fortifyLevel: 0,
  useCharm: false,
  isForging: false,
  forgeLogs: [],

  selectEquip: (equip) =>
    set({
      selectedEquip: equip,
      fortifyLevel: equip?.fortifyLevel ?? 0,
    }),

  setFortifyLevel: (level) => set({ fortifyLevel: level }),

  toggleCharm: () => set((s) => ({ useCharm: !s.useCharm })),

  setForging: (forging) => set({ isForging: forging }),

  addForgeLog: (log) =>
    set((s) => ({
      forgeLogs: [...s.forgeLogs.slice(-49), log],
    })),

  clearForgeLogs: () => set({ forgeLogs: [] }),
}));
