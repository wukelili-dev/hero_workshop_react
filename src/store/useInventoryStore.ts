import { create } from 'zustand';
import type { Equipment } from '../types';

interface InventoryState {
  weapons: Equipment[];
  armors: Equipment[];
  materials: Record<string, number>;
  novelties: Record<string, number>;
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
}

export const useInventoryStore = create<InventoryState & InventoryActions>((set, get) => ({
  weapons: [],
  armors: [],
  materials: {},
  novelties: {},

  addEquipment: (equip) =>
    set((s) => ({
      [equip.type === 'weapon' ? 'weapons' : 'armors']: [
        ...(equip.type === 'weapon' ? s.weapons : s.armors),
        equip,
      ],
    })),

  removeEquipment: (equipId) =>
    set((s) => ({
      weapons: s.weapons.filter((e) => e.id !== equipId),
      armors: s.armors.filter((e) => e.id !== equipId),
    })),

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
    set((s) => ({
      novelties: {
        ...s.novelties,
        [name]: Math.max(0, (s.novelties[name] ?? 0) + count),
      },
    })),

  removeNovelty: (name, count) => {
    const current = get().novelties[name] ?? 0;
    if (current < count) return false;
    set((s) => ({
      novelties: {
        ...s.novelties,
        [name]: Math.max(0, (s.novelties[name] ?? 0) - count),
      },
    }));
    return true;
  },

  setMaterials: (materials) => set({ materials }),

  setWeapons: (weapons) => set({ weapons }),

  setArmors: (armors) => set({ armors }),

  setNovelties: (novelties) => set({ novelties }),
}));
