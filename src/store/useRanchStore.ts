import { create } from 'zustand';
import type { RanchSlotState } from '../types';

interface RanchState {
  slots: RanchSlotState[];
}

interface RanchActions {
  buyCreature: (slotIdx: number, creatureId: string) => void;
  feed: (slotIdx: number) => void;
  harvest: (slotIdx: number) => void;
  resetSlots: () => void;
}

const MAX_SLOTS = 12;

const emptySlot = (): RanchSlotState => ({
  creatureId: null,
  boughtAt: 0,
  fedAt: 0,
  harvestCount: 0,
});

export const useRanchStore = create<RanchState & RanchActions>((set) => ({
  slots: Array.from({ length: MAX_SLOTS }, () => emptySlot()),

  buyCreature: (slotIdx, creatureId) =>
    set((s) => {
      if (slotIdx < 0 || slotIdx >= s.slots.length) return s;
      if (s.slots[slotIdx].creatureId !== null) return s;
      const now = Date.now();
      const newSlots = [...s.slots];
      newSlots[slotIdx] = { creatureId, boughtAt: now, fedAt: now, harvestCount: 0 };
      return { slots: newSlots };
    }),

  feed: (slotIdx) =>
    set((s) => {
      const slot = s.slots[slotIdx];
      if (!slot || !slot.creatureId) return s;
      const newSlots = [...s.slots];
      newSlots[slotIdx] = { ...slot, fedAt: Date.now() };
      return { slots: newSlots };
    }),

  harvest: (slotIdx) =>
    set((s) => {
      const slot = s.slots[slotIdx];
      if (!slot || !slot.creatureId) return s;
      const newSlots = [...s.slots];
      newSlots[slotIdx] = { ...slot, harvestCount: slot.harvestCount + 1 };
      return { slots: newSlots };
    }),

  resetSlots: () =>
    set({ slots: Array.from({ length: MAX_SLOTS }, () => emptySlot()) }),
}));
