import { create } from 'zustand';
import { useInventoryStore } from './useInventoryStore';
import type { HeroState, Resources, Monster, Equipment } from '../types';
import { MAPS } from '../data/maps';
import { executeBattle, type BattleLog, type Rewards } from '../engine/Combat';
import { PLANTS_CATALOG } from '../data/plants';
import { RANCH_CATALOG } from '../data/ranch';
import { generateTavernRoster, type TavernRecruit } from '../data/tavern';
import { BUILDING_CONFIGS, getAllBuildingNames, BUILDING_OUTPUTS } from '../data/buildings';

interface GameState {
  hero: HeroState;
  resources: Resources;
  currentMapId: string;
  unlockedMaps: string[];
  currentEnemies: Monster[];
  isRunning: boolean;
  farmPlots: { plantId: string | null; plantedAt: number | null; lastHarvest: number | null; accumulatedGold: number }[];
  tavernRoster: TavernRecruit[];
  tavernLastRefresh: number;
  battleLogs: { timestamp: number; message: string }[];
  gameLogs: { timestamp: number; message: string }[];
  discoveredMonsters: string[];
  discoveredNovelties: string[];
  discoveredPlants: string[];
  discoveredCreatures: string[];
  autoPotionThreshold: number;
  buildings: Record<string, number>;   // { "伐木�?: 2, "铁矿": 1 }
  buildings: Record<string, number>;   // { "伐木�?: 2, "铁矿": 1 }
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
  addDiscoveredNovelty: (name: string) => void;
  addDiscoveredPlant: (id: string) => void;
  addDiscoveredCreature: (id: string) => void;
  addBuilding: (name: string) => void;
  addBuilding: (name: string) => void;
  buyPotion: () => boolean;
  usePotion: () => boolean;
  setAutoPotionThreshold: (val: number) => void;
}

// 中文材料�?�?store resources key 映射
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
  potions: 0,
  kills: 0,
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

// 启动建筑定时器（�?1 秒检查一次）
function startBuildingTimer() {
  if (_buildingTimer) return;
  _buildingTimer = setInterval(tickBuildings, 1000);
}

function tickBuildings() {
  const state = useGameStore.getState();
  const { buildings, farmPlots } = state;
  const now = Date.now();

  // ── 农场积累金币 ──
  if (farmPlots && farmPlots.length > 0) {
    let changed = false;
    const newPlots = farmPlots.map((plot) => {
      if (!plot.plantId || !plot.plantedAt) return plot;
      const plant = PLANTS_CATALOG.find((p: any) => p.id === plot.plantId);
      if (!plant) return plot;
      // 未成熟不积累
      if (now < plot.plantedAt + plant.growTimeS * 1000) return plot;
      // 已成熟，按 harvestIntervalS 积累金币
      const lastT = (plot.lastHarvest ?? plot.plantedAt + plant.growTimeS * 1000);
      const elapsed = (now - lastT) / 1000; // 秒
      const intervals = Math.floor(elapsed / (plant.harvestIntervalS || 30));
      if (intervals <= 0) return plot;
      const goldToAdd = intervals * (plant.harvestGold ?? 0);
      if (goldToAdd <= 0) return plot;
      changed = true;
      return { ...plot, accumulatedGold: (plot.accumulatedGold ?? 0) + goldToAdd, lastHarvest: now - ((elapsed % (plant.harvestIntervalS || 30)) * 1000) };
    });
    if (changed) {
      useGameStore.setState({ farmPlots: newPlots });
    }
  }

  // ── 建筑产出 ──
  if (!buildings || Object.keys(buildings).length === 0) return;
  for (const [bName, count] of Object.entries(buildings)) {
    if (!count) continue;
    const cfg = BUILDING_CONFIGS[bName];
    if (!cfg) continue;
    const resourceKey = BUILDING_OUTPUT_MAP[bName];
    if (!resourceKey) continue;
    const lastTick = (_lastBuildingTick[bName] ?? (now - cfg.baseInterval * 1000));
    if ((now - lastTick) / 1000 >= cfg.baseInterval) {
      useGameStore.getState().addResource(resourceKey, cfg.baseOutput * count);
      _lastBuildingTick[bName] = now;
    }
  }
}

// 中文建筑名 → 产出资源 key
const BUILDING_OUTPUT_MAP: Record<string, string> = {
  '伐木厂': 'wood', '铁矿': 'iron', '狩猎场': 'hide', '采石场': 'stone',
};

// 建筑自动产出定时器引�?
let _buildingTimer: ReturnType<typeof setInterval> | null = null;
const _lastBuildingTick: Record<string, number> = {};

// ── 监听 buildings 变化自动启停定时�?──
let _prevBuildings: string | null = null;
function syncBuildingTimer() {
  const { buildings } = useGameStore.getState();
  const hasAny = buildings && Object.keys(buildings).some(k => (buildings as any)[k] > 0);
  const currentKey = JSON.stringify(buildings);
  if (currentKey === _prevBuildings) return;
  _prevBuildings = currentKey;
  if (hasAny) startBuildingTimer();
}

export const useGameStore = create<GameState & GameActions>((set, get) => ({
  hero: { ...initHero },
  resources: { ...initRes },
  currentMapId: 'aolai',
  unlockedMaps: ['aolai'],
  currentEnemies: getEnemies('aolai'),
  isRunning: false,
  farmPlots: Array.from({ length: 6 }, () => ({ plantId: null, plantedAt: null, lastHarvest: null, accumulatedGold: 0 })),
  tavernRoster: [],
  tavernLastRefresh: 0,
  battleLogs: [],
  gameLogs: [],
  discoveredMonsters: [],
  discoveredNovelties: [],
  discoveredPlants: [],
  discoveredCreatures: [],
  autoPotionThreshold: 0,
  buildings: {},   // 建筑数量统计，key=建筑名，value=数量


  setHero: (p) => set((s) => ({ hero: { ...s.hero, ...p } })),
  setResources: (p) => set((s) => ({ resources: { ...s.resources, ...p } })),
  setCurrentMap: (id) => set({ currentMapId: id, currentEnemies: getEnemies(id) }),
  unlockMap: (id) => set((s) => {
    if (s.unlockedMaps.includes(id)) return {};
    get().addGameLog(`解锁地图: ${id}`);
    return { unlockedMaps: [...s.unlockedMaps, id] };
  }),
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
    farmPlots: Array.from({ length: 6 }, () => ({ plantId: null, plantedAt: null, lastHarvest: null, accumulatedGold: 0 })),
    tavernRoster: [],
    battleLogs: [],
    gameLogs: [],
    discoveredMonsters: [],
    discoveredNovelties: [],
    discoveredPlants: [],
    discoveredCreatures: [],
    tavernLastRefresh: 0,
    battleLogs: [],
    gameLogs: [],
    discoveredMonsters: [],
    discoveredNovelties: [],
    discoveredPlants: [],
    discoveredCreatures: [],
    autoPotionThreshold: 0,
    buildings: {},
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
    const hhmmss = new Date(now).toTimeString().slice(0, 8);
    if (result.victory) {
      get().addBattleLog(`[${hhmm}] 战胜${monster.name}！获�?${result.rewards.exp} EXP�?{result.rewards.gold} 金币`);
      
      // 检查是否新发现怪物
      const { discoveredMonsters } = get();
      const isNewDiscovery = !discoveredMonsters.includes(monster.id);
      
      get().addDiscoveredMonster(monster.id);
      
      // 新发现时输出杂项日志
      if (isNewDiscovery) {
        get().addGameLog(`[${hhmmss}] 已点亮新图鉴：${monster.name}`);
      }
      
      // 递增击杀�?
      set((s) => ({ hero: { ...s.hero, kills: s.hero.kills + 1 } }));
    } else {
      // 死亡：自动复活到50% HP
      get().addBattleLog(`[${hhmm}] �?${monster.name} 击败！自动复活至 50% HP`);
      const reviveHp = Math.floor(hero.maxHp * 0.5);
      set((s) => ({ hero: { ...s.hero, hp: reviveHp } }));
      // 尝试自动药水（复活后如果血量仍低）
      const { autoPotionThreshold } = get();
      if (autoPotionThreshold > 0 && hero.potions > 0) {
        const hpPct = reviveHp / hero.maxHp;
        if (hpPct * 100 < autoPotionThreshold) {
          const heal = Math.min(20, hero.maxHp - reviveHp);
          if (heal > 0) {
            set((s) => ({ hero: { ...s.hero, potions: s.hero.potions - 1, hp: s.hero.hp + heal } }));
            get().addBattleLog(`[${hhmm}] 💊 自动药水�?${heal} HP（剩�?${hero.potions - 1} 瓶）`);
          }
        }
      }
    }
    return result;
  },

  buyPotion: () => {
    const { hero } = get();
    if (hero.gold < 25) return false;
    set((s) => ({ hero: { ...s.hero, gold: s.hero.gold - 25, potions: s.hero.potions + 1 } }));
    get().addGameLog(`购买药水 x1（剩：${get().hero.potions} 瓶）`);
    return true;
  },

  usePotion: () => {
    const { hero } = get();
    if (hero.potions <= 0) return false;
    const heal = Math.min(20, hero.maxHp - hero.hp);
    if (heal <= 0) return false;
    set((s) => ({ hero: { ...s.hero, potions: s.hero.potions - 1, hp: s.hero.hp + heal } }));
    get().addGameLog(`使用药水 +${heal} HP（剩：${get().hero.potions} 瓶）`);
    return true;
  },

  setAutoPotionThreshold: (val) => set({ autoPotionThreshold: val }),

  addBuilding: (name) => set((s) => {
    const newCount = (s.buildings[name] ?? 0) + 1;
    const updated = { ...s.buildings, [name]: newCount };
    // 有建筑时确保定时器运�?
    if (!_buildingTimer) startBuildingTimer();
    // 初始化该建筑的产出时间（减去 interval 让首次立即触发）
    const cfg = BUILDING_CONFIGS[name];
    if (cfg && !_lastBuildingTick[name]) {
      _lastBuildingTick[name] = Date.now() - cfg.baseInterval * 1000;
    }
    // 建造日�?
    const outputRes = BUILDING_OUTPUTS[name] || name;
    const outputPerTick = cfg ? cfg.baseOutput * newCount : 0;
    get().addGameLog(`建造${name}x${newCount}完成，当前产量：${outputRes}X${outputPerTick}/tick`);
    return { buildings: updated };
  }),

  equipWeapon: (w) => {
    const { hero, resources } = get();
    if (hero.level < (w.levelReq ?? 0)) return false;
    const cost = w.cost ?? {};
    // 检查所有资源是否足�?
    for (const [res, amt] of Object.entries(cost)) {
      const numAmt = Number(amt);
      if (res === '金币') {
        if (hero.gold < numAmt) return false;
      } else {
        const rKey = RES_KEY_MAP[res] ?? res;
        if ((resources as any)[rKey] < numAmt) return false;
      }
    }
    // 扣减所有资�?
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
    get().addGameLog(`购买武器 ${w.name}`);
    return true;
  },

  equipArmor: (a) => {
    const { hero, resources } = get();
    if (hero.level < (a.levelReq ?? 0)) return false;
    const cost = a.cost ?? {};
    // 检查所有资源是否足�?
    for (const [res, amt] of Object.entries(cost)) {
      const numAmt = Number(amt);
      if (res === '金币') {
        if (hero.gold < numAmt) return false;
      } else {
        const rKey = RES_KEY_MAP[res] ?? res;
        if ((resources as any)[rKey] < numAmt) return false;
      }
    }
    // 扣减所有资�?
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
    get().addGameLog(`购买护甲 ${a.name}`);
    return true;
  },

  buyNovelty: (itemName, price) => {
    const { hero } = get();
    if (hero.gold < price) return false;
    // 扣除金币
    set((s) => ({
      hero: {
        ...s.hero,
        gold: s.hero.gold - price,
      },
    }));
    // 添加到背包（可叠加）
    useInventoryStore.getState().addNovelty(itemName, 1);
    // 记录到图�?
    get().addDiscoveredNovelty(itemName);
    get().addGameLog(`购买杂货 ${itemName}，花费${price} 金币`);
    return true;
  },

  sellNovelty: (itemName, sellPrice) => {
    // 从背包移除（可叠加）
    const removed = useInventoryStore.getState().removeNovelty(itemName, 1);
    if (!removed) return false;
    // 返还80%金币
    const refund = Math.floor(sellPrice * 0.8);
    set((s) => ({
      hero: {
        ...s.hero,
        gold: s.hero.gold + refund,
      },
    }));
    get().addGameLog(`出售杂货 ${itemName}，获得${refund} 金币（80%）`);
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
    // 记录到图�?
    get().addDiscoveredPlant(plantId);
    get().addGameLog(`种植 ${plantId}（地块${plotIdx + 1}）`);
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
        plots[plotIdx] = { plantId: null, plantedAt: null, lastHarvest: null, accumulatedGold: 0 };
      }
      return {
        hero: { ...s.hero, gold: s.hero.gold + (plant.harvestGold ?? 0) },
        farmPlots: plots,
      };
    });
    get().addGameLog(`收获 ${plot.plantId}（地块${plotIdx + 1}），获得 ${plant.harvestGold ?? 0} 金币`);
    return true;
  },

  refreshTavern: () => {
    const { hero } = get();
    set({
      tavernRoster: generateTavernRoster(hero.level),
      tavernLastRefresh: Date.now(),
    });
    get().addGameLog('刷新酒馆阵容');
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
    get().addGameLog(`招募 ${recruit.roleName}（精英：${recruit.isElite ? '是' : '否'}），花费 ${recruit.cost} 金币`);
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

  addDiscoveredNovelty: (name) => set((s) => {
    const list = s.discoveredNovelties || [];
    if (list.includes(name)) return {};
    const now = Date.now();
    const hhmmss = new Date(now).toTimeString().slice(0, 8);
    get().addGameLog(`[${hhmmss}] 已点亮新图鉴：${name}`);
    return { discoveredNovelties: [...list, name] };
  }),

  addDiscoveredPlant: (id) => set((s) => {
    const list = s.discoveredPlants || [];
    if (list.includes(id)) return {};
    const plant = PLANTS_CATALOG.find(p => p.id === id);
    const name = plant ? plant.name : id;
    const now = Date.now();
    const hhmmss = new Date(now).toTimeString().slice(0, 8);
    get().addGameLog(`[${hhmmss}] 已点亮新图鉴：${name}`);
    return { discoveredPlants: [...list, id] };
  }),

  addDiscoveredCreature: (id) => set((s) => {
    const list = s.discoveredCreatures || [];
    if (list.includes(id)) return {};
    const creature = RANCH_CATALOG.find(c => c.id === id);
    const name = creature ? creature.name : id;
    const now = Date.now();
    const hhmmss = new Date(now).toTimeString().slice(0, 8);
    get().addGameLog(`[${hhmmss}] 已点亮新图鉴：${name}`);
    return { discoveredCreatures: [...list, id] };
  }),
}));
