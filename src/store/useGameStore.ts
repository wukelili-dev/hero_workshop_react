import { create } from 'zustand';
import type { HeroState, Resources, Monster, Equipment } from '../types';
import { MAPS } from '../data/maps';
import { executeBattle, type BattleLog, type Rewards } from '../engine/Combat';
import { PLANTS_CATALOG } from '../data/plants';
import { generateTavernRoster, type TavernRecruit } from '../data/tavern';

interface GameState {
  hero: HeroState;
  resources: Resources;
  currentMapId: string;
  unlockedMaps: string[];
  currentEnemies: Monster[];
  isRunning: boolean;
  farmPlots: { plantId: string | null; plantedAt: number | null; lastHarvest: number | null }[];
  tavernRoster: TavernRecruit[];
  tavernLastRefresh: number;
  battleLogs: { timestamp: number; message: string }[];
  gameLogs: { timestamp: number; message: string }[];
  discoveredMonsters: string[];
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
  fightMonster: (monster: Monster) => { logs: BattleLog[]; victory: boolean; rewards: Rewards; heroFinalHp: number };
  equipWeapon: (weapon: Equipment) => boolean;
  equipArmor: (armor: Equipment) => boolean;
  buyNovelty: (itemName: string, price: number) => boolean;
  sellNovelty: (itemName: string, sellPrice: number) => boolean;
  plantCrop: (plotIdx: number, plantId: string) => boolean;
  harvestCrop: (plotIdx: number) => boolean;
  refreshTavern: () => void;
  recruitMember: (recruit: TavernRecruit) => boolean;
  setFarmPlots: (plots: typeof initState.farmPlots) => void;
  addBattleLog: (message: string) => void;
  addGameLog: (message: string) => void;
  addDiscoveredMonster: (id: string) => void;
}

// 中文材料名 → store resources key 映射
const RES_KEY_MAP: Record<string, string> = {
  '木材': 'wood', '铁矿': 'iron', '皮革': 'hide', '石头': 'stone', '药草': 'herb',
};

const BASE_ATK = (lv: number) => 5 + lv * 2;
const BASE_DEF = (lv: number) => 2 + lv;
const BASE_HP = (lv: number) => Math.floor(80 + lv * 18 + Math.floor(lv / 5) * 5);

const initHero: HeroState = {
  name: '无名侠客', level: 1, exp: 0,
  hp: BASE_HP(1), maxHp: BASE_HP(1),
  atk: BASE_ATK(1), def: BASE_DEF(1),
  critRate: 0.05, critDmg: 1.5,
  gold: 100, weapon: null, armor: null,
  passives: [], noveltyItems: [], team: [],
};

const initRes: Resources = { wood: 0, iron: 0, hide: 0, stone: 0, herb: 0 };

function getEnemies(mapId: string): Monster[] {
  const m = MAPS.find(x => x.id === mapId);
  if (!m) return [];
  const pool = [...(m.monsters ?? [])];
  const n = Math.min(2 + Math.floor(Math.random() * 2), pool.length);
  const out: Monster[] = [];
  for (let i = 0; i < n && pool.length; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    out.push(pool.splice(idx, 1)[0]);
  }
  return out;
}

export const useGameStore = create<GameState & GameActions>((set, get) => ({
  hero: { ...initHero },
  resources: { ...initRes },
  currentMapId: 'aolai',
  unlockedMaps: ['aolai'],
  currentEnemies: getEnemies('aolai'),
  isRunning: false,
  farmPlots: Array.from({ length: 6 }, () => ({ plantId: null, plantedAt: null, lastHarvest: null })),
  tavernRoster: [],
  tavernLastRefresh: 0,
  battleLogs: [],
  gameLogs: [],
  discoveredMonsters: [],

  setHero: (p) => set((s) => ({ hero: { ...s.hero, ...p } })),
  setResources: (p) => set((s) => ({ resources: { ...s.resources, ...p } })),
  setCurrentMap: (id) => set({ currentMapId: id, currentEnemies: getEnemies(id) }),
  unlockMap: (id) => set((s) => (s.unlockedMaps.includes(id) ? {} : { unlockedMaps: [...s.unlockedMaps, id] })),
  addGold: (amt) => set((s) => ({ hero: { ...s.hero, gold: Math.max(0, s.hero.gold + amt) } })),
  addResource: (key, amt) => set((s) => ({ resources: { ...s.resources, [key]: Math.max(0, (s.resources[key] ?? 0) + amt) } })),
  setRunning: (r) => set({ isRunning: r }),
  refreshEnemies: () => set((s) => ({ currentEnemies: getEnemies(s.currentMapId) })),

  resetGame: () => ({
    hero: { ...initHero },
    resources: { ...initRes },
    currentMapId: 'aolai',
    unlockedMaps: ['aolai'],
    currentEnemies: getEnemies('aolai'),
    isRunning: false,
    farmPlots: Array.from({ length: 6 }, () => ({ plantId: null, plantedAt: null, lastHarvest: null })),
    tavernRoster: [],
    tavernLastRefresh: 0,
    battleLogs: [],
    gameLogs: [],
    discoveredMonsters: [],
  }),

  addExp: (amt) => set((s) => {
    let exp = s.hero.exp + amt;
    let lv = s.hero.level;
    while (exp >= lv * 100) { exp -= lv * 100; lv++; }
    const mhp = BASE_HP(lv);
    const atk = BASE_ATK(lv) + (s.hero.weapon?.stats?.atk ?? 0);
    const def = BASE_DEF(lv) + (s.hero.armor?.stats?.def ?? 0);
    return { hero: { ...s.hero, exp, level: lv, maxHp: mhp, hp: Math.min(s.hero.hp, mhp), atk, def } };
  }),

  setHp: (hp) => set((s) => ({ hero: { ...s.hero, hp: Math.max(0, Math.min(hp, s.hero.maxHp)) } })),

  fightMonster: (monster) => {
    const { hero } = get();
    const result = executeBattle(
      { hp: hero.hp, atk: hero.atk, def: hero.def, crit: hero.critRate },
      [],
      monster
    );
    const now = Date.now();
    const hhmm = new Date(now).toTimeString().slice(0, 5);
    if (result.victory) {
      get().addBattleLog(`[${hhmm}] 战胜${monster.name}！获得 ${result.rewards.exp} EXP，${result.rewards.gold} 金币`);
      get().addDiscoveredMonster(monster.id);
    } else {
      get().addBattleLog(`[${hhmm}] 战斗失败...被 ${monster.name} 击败`);
    }
    return result;
  },

  equipWeapon: (w) => {
    const { hero, resources } = get();
    if (hero.level < (w.levelReq ?? 0)) return false;
    const cost = w.cost ?? {};
    // 检查所有资源是否足够
    for (const [res, amt] of Object.entries(cost)) {
      const numAmt = Number(amt);
      if (res === '金币') {
        if (hero.gold < numAmt) return false;
      } else {
        const rKey = RES_KEY_MAP[res] ?? res;
        if ((resources as any)[rKey] < numAmt) return false;
      }
    }
    // 扣减所有资源
    const goldCost = cost['金币'] ? Number(cost['金币']) : 0;
    const newRes = { ...resources };
    for (const [res, amt] of Object.entries(cost)) {
      if (res === '金币') continue;
      const rKey = RES_KEY_MAP[res] ?? res;
      newRes[rKey] = Math.max(0, (newRes as any)[rKey] - Number(amt));
    }
    const oldAtk = hero.weapon?.stats?.atk ?? 0;
    const newAtk = w.stats?.atk ?? 0;
    const oldCrit = hero.weapon?.stats?.crit ?? 0;
    const newCrit = w.stats?.crit ?? 0;
    set((s) => ({
      hero: {
        ...s.hero,
        gold: s.hero.gold - goldCost,
        weapon: w,
        atk: BASE_ATK(s.hero.level) + newAtk,
        critRate: Math.max(0, Math.min(1, s.hero.critRate - oldCrit + newCrit)),
      },
      resources: newRes,
    }));
    return true;
  },

  equipArmor: (a) => {
    const { hero, resources } = get();
    if (hero.level < (a.levelReq ?? 0)) return false;
    const cost = a.cost ?? {};
    // 检查所有资源是否足够
    for (const [res, amt] of Object.entries(cost)) {
      const numAmt = Number(amt);
      if (res === '金币') {
        if (hero.gold < numAmt) return false;
      } else {
        const rKey = RES_KEY_MAP[res] ?? res;
        if ((resources as any)[rKey] < numAmt) return false;
      }
    }
    // 扣减所有资源
    const goldCost = cost['金币'] ? Number(cost['金币']) : 0;
    const newRes = { ...resources };
    for (const [res, amt] of Object.entries(cost)) {
      if (res === '金币') continue;
      const rKey = RES_KEY_MAP[res] ?? res;
      newRes[rKey] = Math.max(0, (newRes as any)[rKey] - Number(amt));
    }
    const newHp = (a.stats?.hp ?? 0);
    const mhp = BASE_HP(hero.level) + newHp;
    set((s) => ({
      hero: {
        ...s.hero,
        gold: s.hero.gold - goldCost,
        armor: a,
        def: BASE_DEF(s.hero.level) + (a.stats?.def ?? 0),
        maxHp: mhp,
        hp: Math.min(s.hero.hp, mhp),
      },
      resources: newRes,
    }));
    return true;
  },

  buyNovelty: (itemName, price) => {
    const { hero } = get();
    if (hero.gold < price || hero.noveltyItems.includes(itemName)) return false;
    set((s) => ({
      hero: {
        ...s.hero,
        gold: s.hero.gold - price,
        noveltyItems: [...s.hero.noveltyItems, itemName],
      },
    }));
    return true;
  },

  sellNovelty: (itemName, sellPrice) => {
    const { hero } = get();
    if (!hero.noveltyItems.includes(itemName)) return false;
    set((s) => ({
      hero: {
        ...s.hero,
        gold: s.hero.gold + sellPrice,
        noveltyItems: s.hero.noveltyItems.filter((x) => x !== itemName),
      },
    }));
    return true;
  },

  plantCrop: (plotIdx, plantId) => {
    const plant = PLANTS_CATALOG.find((p: any) => p.id === plantId);
    if (!plant || get().hero.gold < plant.seedPrice) return false;
    set((s) => {
      const plots = [...s.farmPlots];
      plots[plotIdx] = { plantId, plantedAt: Date.now(), lastHarvest: null };
      return {
        hero: { ...s.hero, gold: s.hero.gold - plant.seedPrice },
        farmPlots: plots,
      };
    });
    return true;
  },

  harvestCrop: (plotIdx) => {
    const { farmPlots } = get();
    const plot = farmPlots[plotIdx];
    if (!plot || !plot.plantId || !plot.plantedAt) return false;
    const plant = PLANTS_CATALOG.find((p: any) => p.id === plot.plantId);
    if (!plant) return false;
    const now = Date.now();
    if (now < plot.plantedAt + plant.growTimeS * 1000) return false;
    set((s) => {
      const plots = [...s.farmPlots];
      if (plant.adultLifespanS > 0) {
        plots[plotIdx] = { ...plots[plotIdx], lastHarvest: now };
      } else {
        plots[plotIdx] = { plantId: null, plantedAt: null, lastHarvest: null };
      }
      return {
        hero: { ...s.hero, gold: s.hero.gold + (plant.harvestGold ?? 0) },
        farmPlots: plots,
      };
    });
    return true;
  },

  refreshTavern: () => {
    const { hero } = get();
    set({
      tavernRoster: generateTavernRoster(hero.level),
      tavernLastRefresh: Date.now(),
    });
  },

  recruitMember: (recruit) => {
    const { hero } = get();
    if (hero.gold < recruit.cost || hero.team.length >= 3) return false;
    set((s) => ({
      hero: {
        ...s.hero,
        gold: s.hero.gold - recruit.cost,
        team: [
          ...s.hero.team,
          {
            roleName: recruit.roleName,
            level: recruit.level,
            maxHp: 80 + recruit.level * 18,
            hp: 80 + recruit.level * 18,
            atk: 5 + recruit.level * 2,
            def: 2 + recruit.level,
            isElite: recruit.isElite,
          },
        ],
      },
    }));
    return true;
  },

  setFarmPlots: (plots) => set({ farmPlots: plots }),

  addBattleLog: (message) => set((s) => {
    const logs = [{ timestamp: Date.now(), message }, ...s.battleLogs];
    return { battleLogs: logs.slice(0, 50) };
  }),

  addGameLog: (message) => set((s) => {
    const logs = [{ timestamp: Date.now(), message }, ...s.gameLogs];
    return { gameLogs: logs.slice(0, 50) };
  }),

  addDiscoveredMonster: (id) => set((s) => {
    if (s.discoveredMonsters.includes(id)) return {};
    return { discoveredMonsters: [...s.discoveredMonsters, id] };
  }),
}));
