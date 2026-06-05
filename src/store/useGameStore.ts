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
  autoPotionThreshold: number;
  buildings: Record<string, number>;   // { "伐木场": 2, "铁矿": 1 }
  buildings: Record<string, number>;   // { "伐木场": 2, "铁矿": 1 }
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
  addBuilding: (name: string) => void;
  addBuilding: (name: string) => void;
  buyPotion: () => boolean;
  usePotion: () => boolean;
  setAutoPotionThreshold: (val: number) => void;
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
  potions: 0,
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

// 启动建筑定时器（每 1 秒检查一次）
function startBuildingTimer() {
  if (_buildingTimer) return;
  _buildingTimer = setInterval(tickBuildings, 1000);
}

function tickBuildings() {
  const { buildings } = useGameStore.getState();
  if (!buildings || Object.keys(buildings).length === 0) return;
  const now = Date.now();
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
  '伐木场': 'wood', '铁矿': 'iron', '狩猎场': 'hide', '采石场': 'stone',
};

// 建筑自动产出定时器引用
let _buildingTimer: ReturnType<typeof setInterval> | null = null;

// ── 监听 buildings 变化自动启停定时器 ──
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
  farmPlots: Array.from({ length: 6 }, () => ({ plantId: null, plantedAt: null, lastHarvest: null })),
  tavernRoster: [],
  tavernLastRefresh: 0,
  battleLogs: [],
  gameLogs: [],
  discoveredMonsters: [],
  autoPotionThreshold: 0,
  buildings: {},   // 建筑数量统计，key=建筑名，value=数量

  // ── 建筑自动产出定时器（模块级，不受 React 重渲染影响）
  // 记录每个建筑上次产出时间
  _lastBuildingTick: {} as Record<string, number>,

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
    if (result.victory) {
      get().addBattleLog(`[${hhmm}] 战胜${monster.name}！获得 ${result.rewards.exp} EXP，${result.rewards.gold} 金币`);
      get().addDiscoveredMonster(monster.id);
    } else {
      // 死亡：自动复活到50% HP
      get().addBattleLog(`[${hhmm}] 被 ${monster.name} 击败！自动复活至 50% HP`);
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
            get().addBattleLog(`[${hhmm}] 💊 自动药水！+${heal} HP（剩余 ${hero.potions - 1} 瓶）`);
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
    get().addGameLog(`购买药水 x1（剩余 ${get().hero.potions} 瓶）`);
    return true;
  },

  usePotion: () => {
    const { hero } = get();
    if (hero.potions <= 0) return false;
    const heal = Math.min(20, hero.maxHp - hero.hp);
    if (heal <= 0) return false;
    set((s) => ({ hero: { ...s.hero, potions: s.hero.potions - 1, hp: s.hero.hp + heal } }));
    get().addGameLog(`使用药水 +${heal} HP（剩余 ${get().hero.potions} 瓶）`);
    return true;
  },

  setAutoPotionThreshold: (val) => set({ autoPotionThreshold: val }),

  addBuilding: (name) => set((s) => {
    const newCount = (s.buildings[name] ?? 0) + 1;
    const updated = { ...s.buildings, [name]: newCount };
    // 有建筑时确保定时器运行
    if (!_buildingTimer) startBuildingTimer();
    // 初始化该建筑的产出时间（减去 interval 让首次立即触发）
    const cfg = BUILDING_CONFIGS[name];
    if (cfg && !_lastBuildingTick[name]) {
      _lastBuildingTick[name] = Date.now() - cfg.baseInterval * 1000;
    }
    return { buildings: updated };
  }),

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
    get().addGameLog(`购买武器 ${w.name}`);
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
    get().addGameLog(`购买护甲 ${a.name}`);
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
    get().addGameLog(`购买杂货 ${itemName}，花费 ${price} 金币`);
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
    get().addGameLog(`出售杂货 ${itemName}，获得 ${sellPrice} 金币`);
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
        plots[plotIdx] = { plantId: null, plantedAt: null, lastHarvest: null };
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
    get().addGameLog(`招募 ${recruit.roleName}（精英${recruit.isElite ? '是' : '否'}），花费 ${recruit.cost} 金币`);
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
