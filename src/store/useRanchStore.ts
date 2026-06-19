import { create } from 'zustand';
import type { RanchSlotState } from '../types';
import { RANCH_CATALOG } from '../data/ranch';
import { useGameStore } from './useGameStore';
import { useInventoryStore } from './useInventoryStore';

interface RanchState {
  slots: RanchSlotState[];
}

interface RanchActions {
  buyCreature: (slotIdx: number, creatureId: string) => void;
  feed: (slotIdx: number) => void;
  harvest: (slotIdx: number) => void;
  autoHarvestAll: () => void;
  resetSlots: () => void;
  setSlots: (slots: RanchSlotState[]) => void;
}

const FEED_INTERVAL_MS = 4 * 60 * 60 * 1000; // 4小时
const AUTO_HARVEST_INTERVAL_MS = 60 * 1000; // 自动收获检查间隔：1分钟

const MAX_SLOTS = 12;

const emptySlot = (): RanchSlotState => ({
  creatureId: null,
  boughtAt: 0,
  fedAt: 0,
  harvestCount: 0,
});

// 自动收获定时器
let _ranchTimer: ReturnType<typeof setInterval> | null = null;

function startRanchTimer() {
  if (_ranchTimer) return;
  _ranchTimer = setInterval(() => {
    const store = useRanchStore.getState();
    const hasCreatures = store.slots.some(s => s.creatureId !== null);
    if (hasCreatures) {
      store.autoHarvestAll();
    } else {
      stopRanchTimer();
    }
  }, AUTO_HARVEST_INTERVAL_MS);
}

function stopRanchTimer() {
  if (_ranchTimer) {
    clearInterval(_ranchTimer);
    _ranchTimer = null;
  }
}

export const useRanchStore = create<RanchState & RanchActions>((set, get) => ({
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
      // 记录到图鉴
      useGameStore.getState().addDiscoveredCreature(creatureId);
      // 启动自动收获定时器
      startRanchTimer();
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
      const creature = RANCH_CATALOG.find(c => c.id === slot.creatureId);
      if (!creature) return s;
      
      const now = Date.now();
      const intervals = Math.floor((now - slot.boughtAt) / FEED_INTERVAL_MS) - slot.harvestCount;
      if (intervals <= 0) return s;
      
      const newSlots = [...s.slots];
      newSlots[slotIdx] = { ...slot, harvestCount: slot.harvestCount + 1 };
      
      // 添加材料到背包
      const count = Math.max(1, intervals);
      useInventoryStore.getState().addMaterial(creature.outputType, count);
      
      useGameStore.getState().addGameLog(`收获 ${creature?.name ?? slot.creatureId} 产品×${count}（槽位${slotIdx + 1}）`);
      return { slots: newSlots };
    }),

  autoHarvestAll: () => {
    const { slots } = get();
    const now = Date.now();
    let hasUpdate = false;
    const newSlots = [...slots];
    
    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i];
      if (!slot || !slot.creatureId) continue;
      
      const creature = RANCH_CATALOG.find(c => c.id === slot.creatureId);
      if (!creature) continue;
      
      // 检查是否需要喂食
      const fedAgo = now - slot.fedAt;
      if (fedAgo > FEED_INTERVAL_MS) continue; // 超过4小时没喂食，不产出
      
      // 计算可收获次数
      const intervals = Math.floor((now - slot.boughtAt) / FEED_INTERVAL_MS) - slot.harvestCount;
      if (intervals <= 0) continue;
      
      // 自动收获
      const count = Math.max(1, intervals);
      newSlots[i] = { ...slot, harvestCount: slot.harvestCount + 1 };
      useInventoryStore.getState().addMaterial(creature.outputType, count);
      hasUpdate = true;
      
      useGameStore.getState().addGameLog(`[自动] ${creature.name} 产出 ${creature.outputType}×${count}`);
    }
    
    if (hasUpdate) {
      set({ slots: newSlots });
    }
  },

  resetSlots: () =>
    set({ slots: Array.from({ length: MAX_SLOTS }, () => emptySlot()) }),

  setSlots: (slots) => set({ slots }),
}));

// 监听slots变化，自动启停定时器
let _prevSlotsStr: string | null = null;
useRanchStore.subscribe((s) => {
  const str = JSON.stringify(s.slots.map(x => x.creatureId));
  if (str === _prevSlotsStr) return;
  _prevSlotsStr = str;
  
  const hasCreatures = s.slots.some(x => x.creatureId !== null);
  if (hasCreatures) {
    startRanchTimer();
  } else {
    stopRanchTimer();
  }
});
