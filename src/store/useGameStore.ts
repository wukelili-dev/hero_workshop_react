import { create } from 'zustand';
import type { HeroState, Resources, Monster } from '../types';
import { MAPS } from '../data/maps';
import { executeBattle } from '../engine/Combat';

interface GameState {
  hero: HeroState;
  resources: Resources;
  currentMapId: string;
  unlockedMaps: string[];
  currentEnemies: Monster[];
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
  refreshEnemies: () => void;
  addExp: (amount: number) => void;
  setHp: (hp: number) => void;
  fightMonster: (monster: Monster) => { logs: import('../engine/Combat').BattleLog[]; victory: boolean; rewards: import('../engine/Combat').Rewards; heroFinalHp: number };
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

const getMapEnemies = (mapId: string): Monster[] => {
  const map = MAPS.find(m => m.id === mapId);
  if (!map) return [];
  // 随机选2~3个普通怪物
  const pool = [...map.monsters];
  const count = Math.min(2 + Math.floor(Math.random() * 2), pool.length);
  const selected: Monster[] = [];
  for (let i = 0; i < count && pool.length > 0; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    selected.push(pool.splice(idx, 1)[0]);
  }
  return selected;
};

export const useGameStore = create<GameState & GameActions>((set, get) => ({
  hero: { ...initialHero },
  resources: { ...initialResources },
  currentMapId: 'aolai',
  unlockedMaps: ['aolai'],
  currentEnemies: getMapEnemies('aolai'),
  isRunning: false,

  setHero: (partial) =>
    set((s) => ({ hero: { ...s.hero, ...partial } })),

  setResources: (partial) =>
    set((s) => ({ resources: { ...s.resources, ...partial } })),

  setCurrentMap: (mapId) => {
    const enemies = getMapEnemies(mapId);
    set({ currentMapId: mapId, currentEnemies: enemies });
  },

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
      currentEnemies: getMapEnemies('aolai'),
      isRunning: false,
    }),

  refreshEnemies: () => {
    const { currentMapId } = get();
    set({ currentEnemies: getMapEnemies(currentMapId) });
  },

  addExp: (amount) =>
    set((s) => {
      let exp = s.hero.exp + amount;
      let level = s.hero.level;
      let maxHp = s.hero.maxHp;
      let hp = s.hero.hp;
      // 简单升级逻辑
      while (exp >= level * 100) {
        exp -= level * 100;
        level += 1;
        maxHp += 10;
        hp = maxHp; // 升级回满血
      }
      return {
        hero: { ...s.hero, exp, level, maxHp, hp },
      };
    }),

  setHp: (hp) =>
    set((s) => ({
      hero: { ...s.hero, hp: Math.max(0, Math.min(hp, s.hero.maxHp)) },
    })),

  fightMonster: (monster) => {
    const { hero } = get();
    const heroStats = {
      hp: hero.hp,
      atk: hero.atk,
      def: hero.def,
      crit: hero.critRate,
    };
    return executeBattle(heroStats, [], monster);
  },
}));
