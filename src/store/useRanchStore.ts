import { create } from 'zustand';
import type { RanchSlotState } from '../types';
import { RANCH_CATALOG } from '../data/ranch';
import { useGameStore } from './useGameStore';

interface RanchState {
  slots: RanchSlotState[];
}

interface RanchActions {
  buyCreature: (slotIdx: number, creatureId: string) => void;
  feed: (slotIdx: number) => void;
  harvest: (slotIdx: number) => void;
  resetSlots: () => void;
  setSlots: (slots: RanchSlotState[]) => void;
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
      const creature = RANCH_CATALOG.find(c => c.id === creatureId);
      useGameStore.getState().addGameLog(`购买牧场生物 ${creature?.name ?? creatureId}（槽位${slotIdx + 1}）`);
      return { slots: newSlots };
    }),

  feed: (slotIdx) =>
    set((s) => {
      const slot = s.slots[slotIdx];
      if (!slot || !slot.creatureId) return s;
      const newSlots = [...s.slots];
      newSlots[slotIdx] = { ...slot, fedAt: Date.now() };
      const creature = RANCH_CATALOG.find(c => c.id === slot.creatureId);
      useGameStore.getState().addGameLog(`喂养 ${creature?.name ?? slot.creatureId}（槽位${slotIdx + 1}）`);
      return { slots: newSlots };
    }),

  harvest: (slotIdx) =>
    set((s) => {
      const slot = s.slots[slotIdx];
      if (!slot || !slot.creatureId) return s;
      const newSlots = [...s.slots];
      newSlots[slotIdx] = { ...slot, harvestCount: slot.harvestCount + 1 };
      const creature = RANCH_CATALOG.find(c => c.id === slot.creatureId);
      useGameStore.getState().addGameLog(`收获 ${creature?.name ?? slot.creatureId} 产品（槽位${slotIdx + 1}），第${slot.harvestCount + 1}次收获`);
      return { slots: newSlots };
    }),

  resetSlots: () =>
    set({ slots: Array.from({ length: MAX_SLOTS }, () => emptySlot()) }),

  setSlots: (slots) => set({ slots }),
}));
