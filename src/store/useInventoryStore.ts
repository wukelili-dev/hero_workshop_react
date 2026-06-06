import { create } from 'zustand';
import type { Equipment } from '../types';

// 背包格子项
interface InventorySlot {
  type: 'weapon' | 'armor' | 'novelty';
  id: string;        // weapon/armor: Equipment.id; novelty: 杂货名称
  qty: number;       // weapon/armor: 始终为1; novelty: 1-20
  data?: Equipment;  // 存储完整的Equipment对象（用于weapon/armor）
}

interface InventoryState {
  weapons: Equipment[];
  armors: Equipment[];
  materials: Record<string, number>;
  novelties: Record<string, number>;
  slots: (InventorySlot | null)[];  // 10格通用背包
}

interface InventoryActions {
  addEquipment: (equip: Equipment) => void;
  removeEquipment: (equipId: string) => void;
  addMaterial: (name: string, count: number) => void;
  removeMaterial: (name: string, count: number) => boolean;
  addNovelty: (name: string, count: number) => void;
  removeNovelty: (name: string, count: number) => boolean;
  setMaterials: (materials: Record<string, number>) => void;
  setWeapons: (weapons: Equipment[]) => void;
  setArmors: (armors: Equipment[]) => void;
  setNovelties: (novelties: Record<string, number>) => void;
  // 背包格子相关
  addToInventory: (type: 'weapon' | 'armor' | 'novelty', id: string, qty?: number, data?: Equipment) => void;
  removeFromInventory: (slotIndex: number, qty?: number) => void;
}

export const useInventoryStore = create<InventoryState & InventoryActions>((set, get) => ({
  weapons: [],
  armors: [],
  materials: {},
  novelties: {},
  slots: new Array(10).fill(null) as (InventorySlot | null)[],

  addEquipment: (equip) =>
    set((s) => {
      const newState = {
        [equip.type === 'weapon' ? 'weapons' : 'armors']: [
          ...(equip.type === 'weapon' ? s.weapons : s.armors),
          equip,
        ],
      };
      
      // 同时添加到背包格子
      const slots = [...s.slots];
      const emptyIdx = slots.findIndex(slot => slot === null);
      if (emptyIdx >= 0) {
        slots[emptyIdx] = {
          type: equip.type as 'weapon' | 'armor',
          id: equip.id,
          qty: 1,
          data: equip,
        };
        return { ...newState, slots };
      }
      
      return newState;
    }),

  removeEquipment: (equipId) =>
    set((s) => {
      const newState = {
        weapons: s.weapons.filter((e) => e.id !== equipId),
        armors: s.armors.filter((e) => e.id !== equipId),
      };
      
      // 同时从背包格子移除
      const slots = [...s.slots];
      const slotIdx = slots.findIndex(slot => slot && (slot.type === 'weapon' || slot.type === 'armor') && slot.id === equipId);
      if (slotIdx >= 0) {
        slots[slotIdx] = null;
      }
      
      return { ...newState, slots };
    }),

  addMaterial: (name, count) =>
    set((s) => ({
      materials: {
        ...s.materials,
        [name]: Math.max(0, (s.materials[name] ?? 0) + count),
      },
    })),

  removeMaterial: (name, count) => {
    const current = get().materials[name] ?? 0;
    if (current < count) return false;
    set((s) => ({
      materials: {
        ...s.materials,
        [name]: Math.max(0, (s.materials[name] ?? 0) - count),
      },
    }));
    return true;
  },

  addNovelty: (name, count) =>
    set((s) => {
      const newState = {
        novelties: {
          ...s.novelties,
          [name]: Math.max(0, (s.novelties[name] ?? 0) + count),
        },
      };
      
      // 同时添加到背包格子（堆叠逻辑）
      const slots = [...s.slots];
      let remaining = count;
      
      // 先尝试堆叠到现有格子
      for (let i = 0; i < slots.length && remaining > 0; i++) {
        if (slots[i] && slots[i]!.type === 'novelty' && slots[i]!.id === name && slots[i]!.qty < 20) {
          const canAdd = Math.min(remaining, 20 - slots[i]!.qty);
          slots[i] = { ...slots[i]!, qty: slots[i]!.qty + canAdd };
          remaining -= canAdd;
        }
      }
      
      // 剩余开新格
      for (let i = 0; i < slots.length && remaining > 0; i++) {
        if (slots[i] === null) {
          const addQty = Math.min(remaining, 20);
          slots[i] = { type: 'novelty', id: name, qty: addQty };
          remaining -= addQty;
        }
      }
      
      if (remaining > 0) {
        console.warn('背包已满！无法添加更多杂货');
      }
      
      return { ...newState, slots };
    }),

  removeNovelty: (name, count) => {
    const current = get().novelties[name] ?? 0;
    if (current < count) return false;
    
    set((s) => {
      const newState = {
        novelties: {
          ...s.novelties,
          [name]: Math.max(0, (s.novelties[name] ?? 0) - count),
        },
      };
      
      // 同时从背包格子移除
      const slots = [...s.slots];
      let remaining = count;
      
      for (let i = slots.length - 1; i >= 0 && remaining > 0; i--) {
        if (slots[i] && slots[i]!.type === 'novelty' && slots[i]!.id === name) {
          const removeQty = Math.min(remaining, slots[i]!.qty);
          if (slots[i]!.qty - removeQty <= 0) {
            slots[i] = null;
          } else {
            slots[i] = { ...slots[i]!, qty: slots[i]!.qty - removeQty };
          }
          remaining -= removeQty;
        }
      }
      
      return { ...newState, slots };
    });
    
    return true;
  },

  setMaterials: (materials) => set({ materials }),

  setWeapons: (weapons) => set({ weapons }),

  setArmors: (armors) => set({ armors }),

  setNovelties: (novelties) => set({ novelties }),

  // 添加物品到背包格子（10格通用背包）
  addToInventory: (type: 'weapon' | 'armor' | 'novelty', id: string, qty: number = 1, data?: Equipment) => {
    set((s) => {
      const newSlots = [...s.slots];
      
      if (type === 'novelty') {
        // 杂货：先尝试堆叠到现有格子（最多20个）
        const existingIdx = newSlots.findIndex(
          slot => slot && slot.type === 'novelty' && slot.id === id && slot.qty < 20
        );
        
        if (existingIdx >= 0 && newSlots[existingIdx]) {
          // 堆叠到现有格子
          const canAdd = Math.min(qty, 20 - newSlots[existingIdx]!.qty);
          newSlots[existingIdx] = {
            ...newSlots[existingIdx]!,
            qty: newSlots[existingIdx]!.qty + canAdd,
          };
          qty -= canAdd;
        }
        
        // 剩余数量开新格
        while (qty > 0) {
          const emptyIdx = newSlots.findIndex(slot => slot === null);
          if (emptyIdx < 0) {
            console.warn('背包已满！无法添加更多杂货');
            break;
          }
          const addQty = Math.min(qty, 20);
          newSlots[emptyIdx] = { type: 'novelty', id, qty: addQty };
          qty -= addQty;
        }
      } else {
        // 武器/护甲：每个占一格
        const emptyIdx = newSlots.findIndex(slot => slot === null);
        if (emptyIdx < 0) {
          console.warn('背包已满！无法添加装备');
          return s;
        }
        newSlots[emptyIdx] = { type, id, qty: 1, data };
      }
      
      return { slots: newSlots };
    });
  },

  // 从背包格子移除物品
  removeFromInventory: (slotIndex: number, qty: number = 1) => {
    set((s) => {
      const newSlots = [...s.slots];
      const slot = newSlots[slotIndex];
      
      if (!slot) return s;
      
      if (slot.type === 'novelty') {
        const newQty = slot.qty - qty;
        if (newQty <= 0) {
          newSlots[slotIndex] = null;
        } else {
          newSlots[slotIndex] = { ...slot, qty: newQty };
        }
      } else {
        // 武器/护甲：直接移除
        newSlots[slotIndex] = null;
      }
      
      return { slots: newSlots };
    });
  },
}));
