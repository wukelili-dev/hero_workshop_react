import { create } from 'zustand';
import type { HeroState, Resources } from '../types';

interface GameState {
  hero: HeroState;
  resources: Resources;
  currentMapId: string;
  unlockedMaps: string[];
  isRunning: boolean;
}

interface GameActions {
  setHero: (hero: Partial<HeroState>) => void;
  setResources: (resources: Partial<Resources>) => void;
  setCurrentMap: (mapId: string) => void;
  unlockMap: (mapId: string) => void;
  addGold: (amount: number) => void;
  addResource: (key: string, amount: number) => void;
  setRunning: (running: boolean) => void;
  resetGame: () => void;
}

const initialHero: HeroState = {
  name: '无名侠客',
  level: 1,
  exp: 0,
  hp: 100,
  maxHp: 100,
  atk: 10,
  def: 5,
  critRate: 0.05,
  critDmg: 1.5,
  gold: 100,
  weapon: null,
  armor: null,
  passives: [],
};

const initialResources: Resources = {
  wood: 0,
  iron: 0,
  hide: 0,
  stone: 0,
  herb: 0,
};

export const useGameStore = create<GameState & GameActions>((set) => ({
  hero: { ...initialHero },
  resources: { ...initialResources },
  currentMapId: 'aolai',
  unlockedMaps: ['aolai'],
  isRunning: false,

  setHero: (partial) =>
    set((s) => ({ hero: { ...s.hero, ...partial } })),

  setResources: (partial) =>
    set((s) => ({ resources: { ...s.resources, ...partial } })),

  setCurrentMap: (mapId) => set({ currentMapId: mapId }),

  unlockMap: (mapId) =>
    set((s) => ({
      unlockedMaps: s.unlockedMaps.includes(mapId)
        ? s.unlockedMaps
        : [...s.unlockedMaps, mapId],
    })),

  addGold: (amount) =>
    set((s) => ({
      hero: { ...s.hero, gold: Math.max(0, s.hero.gold + amount) },
    })),

  addResource: (key, amount) =>
    set((s) => ({
      resources: {
        ...s.resources,
        [key]: Math.max(0, (s.resources[key] ?? 0) + amount),
      },
    })),

  setRunning: (running) => set({ isRunning: running }),

  resetGame: () =>
    set({
      hero: { ...initialHero },
      resources: { ...initialResources },
      currentMapId: 'aolai',
      unlockedMaps: ['aolai'],
      isRunning: false,
    }),
}));
