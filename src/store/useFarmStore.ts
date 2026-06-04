import { create } from 'zustand';
import type { FarmPlotState } from '../types';
import { SEASON_ORDER, type Season } from '../systems/FarmSystem';

interface FarmState {
  plots: FarmPlotState[];
  currentSeason: Season;
  seasonStartTime: number;
}

interface FarmActions {
  plant: (slotIdx: number, plantId: string) => void;
  harvest: (slotIdx: number) => void;
  fertilize: (slotIdx: number) => void;
  setSeason: (season: Season) => void;
  resetPlots: () => void;
}

const MAX_PLOTS = 12;

const emptyPlot = (): FarmPlotState => ({
  plantId: null,
  plantedAt: null,
  lastHarvest: null,
  fertilizerCount: 0,
});

export const useFarmStore = create<FarmState & FarmActions>((set) => ({
  plots: Array.from({ length: MAX_PLOTS }, () => emptyPlot()),
  currentSeason: 'spring',
  seasonStartTime: Date.now(),

  plant: (slotIdx, plantId) =>
    set((s) => {
      if (slotIdx < 0 || slotIdx >= s.plots.length) return s;
      if (s.plots[slotIdx].plantId !== null) return s;
      const newPlots = [...s.plots];
      newPlots[slotIdx] = { plantId, plantedAt: Date.now(), lastHarvest: null, fertilizerCount: 0 };
      return { plots: newPlots };
    }),

  harvest: (slotIdx) =>
    set((s) => {
      const plot = s.plots[slotIdx];
      if (!plot || !plot.plantId) return s;
      const newPlots = [...s.plots];
      newPlots[slotIdx] = emptyPlot();
      return { plots: newPlots };
    }),

  fertilize: (slotIdx) =>
    set((s) => {
      const plot = s.plots[slotIdx];
      if (!plot || !plot.plantId) return s;
      const newPlots = [...s.plots];
      newPlots[slotIdx] = {
        ...plot,
        fertilizerCount: plot.fertilizerCount + 1,
      };
      return { plots: newPlots };
    }),

  setSeason: (season) => set({ currentSeason: season }),

  resetPlots: () =>
    set({ plots: Array.from({ length: MAX_PLOTS }, () => emptyPlot()) }),
}));
