import { create } from 'zustand';
import { useInventoryStore } from './useInventoryStore';
import type { HeroState, Resources, Monster, Equipment, Factions, MoralLevel } from '../types';
import { MAPS } from '../data/maps';
import { executeBattle, type BattleLog, type Rewards } from '../engine/Combat';
import { EXP_PILL_BY_ID } from '../data/inventory';
import { PLANTS_CATALOG } from '../data/plants';
import { RANCH_CATALOG } from '../data/ranch';
import { NPCS } from '../data/npcs';
import { generateTavernRoster, type TavernRecruit } from '../data/tavern';
import { BUILDING_CONFIGS, BUILDING_OUTPUTS } from '../data/buildings';
import { getCellEncounter } from '../data/cellEncounters';
import { deriveTeammate } from '../engine/NpcStats';
import { sum as sumEffect } from '../engine/ItemEffects';
import { getItemDef } from '../data/items/items';
import { getWeaponFormByName, getArmorFormByName } from '../data/equipment';
import { formSetId } from '../data/equipmentForms';
import { SKILLS, PASSIVE_SKILLS, DEFAULT_HERO_SKILLS } from '../data/skills';
import { FREE_POINTS_PER_LEVEL, PRIMARY_NAME, LEVEL_BASE_ATK, LEVEL_BASE_DEF, LEVEL_BASE_HP } from '../engine/Stats';
import { syncHeroDerived } from '../engine/HeroCombat';
import type { PrimaryStats } from '../types';

// 掉落物品 itemId → 资源 key 映射（怪物掉落用中文，资源状态用英文）
const DROP_TO_RESOURCE: Record<string, string> = {
  '皮革': 'hide', '铁矿': 'iron', '木材': 'wood', '石头': 'stone', '药草': 'herb',
  '金币': 'gold',
};
let _autoBattleTimer: ReturnType<typeof setInterval> | null = null;

/** 商店药水（购买后进背包格子） */
export const SHOP_POTION_ID = '金疮药 [回血+20]';
/** 背包杂货的回血量（与 InventoryTab 的 POTION_HP_TABLE 同一口径） */
export function potionHealOf(id: string): number {
  const m1 = id.match(/回血\+(\d+)/);
  if (m1) return Number(m1[1]);
  const m2 = id.match(/恢复(\d+)HP/);
  if (m2) return Number(m2[1]);
  return 0;
}

// 自动药水：先买后喝（低于阈值时触发；药水在背包格子里）
function _autoPotionIfNeeded() {
  const { autoPotionThreshold } = useGameStore.getState();
  if (autoPotionThreshold <= 0) return;
  let h = useGameStore.getState().hero;
  const hasBagPotion = () => useInventoryStore.getState().slots.some(
    (s) => s && s.type === 'novelty' && potionHealOf(s.id) > 0,
  );
  if (!hasBagPotion() && h.potions <= 0 && h.gold >= 25) {
    useGameStore.getState().buyPotion();
    h = useGameStore.getState().hero;
  }
  if ((hasBagPotion() || h.potions > 0) && h.hp < h.maxHp * (autoPotionThreshold / 100)) {
    useGameStore.getState().usePotion();
  }
}

/** 从妖怪表里抽 2~3 只作为当前敌人 */
function drawEnemies(roster: Monster[]): Monster[] {
  if (roster.length === 0) return [];
  const pool = [...roster];
  const n = Math.min(2 + Math.floor(Math.random() * 2), pool.length);
  const out: Monster[] = [];
  for (let i = 0; i < n && pool.length > 0; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    out.push(pool.splice(idx, 1)[0]);
  }
  return out;
}

// 判断英雄是否能打过怪物
function canDefeat(hero: any, monster: any): boolean {
  const result = executeBattle(
    { hp: hero.hp, atk: hero.atk, def: hero.def, crit: hero.critRate },
    hero.team || [],
    monster
  );
  return result.victory;
}

interface GameState {
  hero: HeroState;
  resources: Resources;
  currentMapId: string;
  unlockedMaps: string[];
  currentEnemies: Monster[];
  /** 当前所在地的妖怪表（null = 未绑定格子，沿用地图池） */
  currentRoster: Monster[] | null;
  /** 当前所在地的 Boss */
  currentBoss: Monster | null;
  moralValue: number;
  factions: Factions;
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
  discoveredNpcs: string[];
  autoPotionThreshold: number;
  autoBattle: boolean;
  buildings: Record<string, number>;   // { "伐木场: 2, "铁矿": 1 }
  mapBattles: Record<string, number>; // 各地图累计战斗次数
  /** 每只怪的累计击杀数（悬赏用） */
  killCounts: Record<string, number>;
}

interface GameActions {
  setHero: (hero: Partial<HeroState>) => void;
  setResources: (resources: Partial<Resources>) => void;
  setCurrentMap: (mapId: string) => void;
  /** 进入世界地图上的某格：把该格的妖怪同步为当前敌人 */
  enterCell: (cellId: string) => void;
  unlockMap: (mapId: string) => void;
  addGold: (amount: number) => void;
  addResource: (key: string, amount: number) => void;
  setRunning: (running: boolean) => void;
  resetGame: () => void;
  refreshEnemies: () => void;
  addExp: (amount: number) => void;
  setHp: (hp: number) => void;
  fightMonster: (monster: Monster) => { logs: BattleLog[]; victory: boolean; rewards: Rewards; heroFinalHp: number };
  /** 结算一场已打完的战斗（自动/手动战斗共用） */
  applyBattleOutcome: (
    monster: Monster,
    result: { victory: boolean; rewards: Rewards; heroFinalHp: number },
  ) => void;
  equipWeapon: (weapon: Equipment) => boolean;
  equipArmor: (armor: Equipment) => boolean;
  buyNovelty: (itemName: string, price: number) => boolean;
  sellNovelty: (itemName: string, sellPrice: number) => boolean;
  buyItem: (itemId: string) => boolean;
  useItem: (itemId: string) => boolean;
  buyExpPill: (pillId: string, price: number) => boolean;
  useExpPill: (pillId: string) => boolean;
  plantCrop: (plotIdx: number, plantId: string) => boolean;
  harvestCrop: (plotIdx: number) => boolean;
  refreshTavern: () => void;
  recruitMember: (recruit: TavernRecruit) => boolean;
  setFarmPlots: (plots: { plantId: string | null; plantedAt: number | null; lastHarvest: number | null; accumulatedGold: number }[]) => void;
  addBattleLog: (message: string) => void;
  addGameLog: (message: string) => void;
  addDiscoveredMonster: (id: string) => void;
  addDiscoveredNovelty: (name: string) => void;
  addDiscoveredPlant: (id: string) => void;
  addDiscoveredCreature: (id: string) => void;
  addDiscoveredNpc: (id: string) => void;
  addBuilding: (name: string) => void;
  incrementMapBattles: (mapId: string) => void;
  buyPotion: () => boolean;
  usePotion: () => boolean;
  setAutoPotionThreshold: (val: number) => void;
  setAutoBattle: (v: boolean) => void;
  changeMoral: (delta: number) => void;
  getMoralLevel: () => MoralLevel;
  getMoralTitle: () => string | null;
  /** 加点：把 1 点自由点分配到某条主属性 */
  allocatePrimary: (key: keyof PrimaryStats) => boolean;
  /** 依据主属性 + 装备重算英雄派生缓存（换装/卸装/读档后调用） */
  syncHero: () => void;
  /** 卸下带大招的法宝后，从技能槽移除其独特大招 */
  unequipSkill: (skillId: string) => void;
}

// 中文材料名store resources key 映射
const RES_KEY_MAP: Record<string, string> = {
  '木材': 'wood', '铁矿': 'iron', '皮革': 'hide', '石头': 'stone', '药草': 'herb',
};

// 等级基线统一由 engine/Stats 提供，避免"两套成长公式"
const BASE_ATK = LEVEL_BASE_ATK;
const BASE_DEF = LEVEL_BASE_DEF;
const BASE_HP = LEVEL_BASE_HP;

const initHero: HeroState = {
  name: '无名侠客', level: 1, exp: 0,
  hp: BASE_HP(1), maxHp: BASE_HP(1),
  atk: BASE_ATK(1), def: BASE_DEF(1),
  critRate: 0.05, critDmg: 1.5,
  gold: 100, weapon: null, armor: null,
  passives: [], skills: undefined, allocated: {}, freePoints: 0,
  noveltyItems: [], team: [],
  discoveredMonsters: [],
  potions: 0,
  kills: 0,
  moralValue: 0,
  factions: { human: 50, demon: 50, divine: 50 },
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

// 启动建筑定时器（每1 秒检查一次）
export function startBuildingTimer() {
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
  '伐木场': 'wood', '铁矿': 'iron', '狩猎场': 'hide', '采石场': 'stone',
};

// 建筑自动产出定时器引用
let _buildingTimer: ReturnType<typeof setInterval> | null = null;
const _lastBuildingTick: Record<string, number> = {};

export const useGameStore = create<GameState & GameActions>((set, get) => ({
  hero: { ...initHero },
  resources: { ...initRes },
  currentMapId: 'aolai',
  unlockedMaps: ['aolai'],
  currentEnemies: getEnemies('aolai'),
  currentRoster: null,
  currentBoss: null,
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
  discoveredNpcs: [],
  autoPotionThreshold: 0,
  autoBattle: false,
  buildings: {},   // 建筑数量统计，key=建筑名，value=数量
  mapBattles: {},
  killCounts: {},
  moralValue: 0,
  factions: { human: 50, demon: 50, divine: 50 },


  setHero: (p) => set((s) => ({ hero: { ...s.hero, ...p } })),
  setResources: (p) => set((s) => ({ resources: { ...s.resources, ...p } })),
  setCurrentMap: (id) => set(() => {
    const map = MAPS.find((m) => m.id === id);
    return {
      currentMapId: id,
      currentRoster: map?.monsters ?? null,
      currentBoss: map?.boss ?? null,
      currentEnemies: getEnemies(id),
    };
  }),
  enterCell: (cellId) => set((s) => {
    const enc = getCellEncounter(cellId);
    if (!enc) {
      return { currentRoster: [], currentBoss: null, currentEnemies: [] };
    }
    return {
      currentMapId: enc.mapId ?? s.currentMapId,
      currentRoster: enc.monsters,
      currentBoss: enc.boss ?? null,
      currentEnemies: drawEnemies(enc.monsters),
    };
  }),
  unlockMap: (id) => set((s) => {
    if (s.unlockedMaps.includes(id)) return {};
    const map = MAPS.find(m => m.id === id);
    get().addGameLog(`解锁地图: ${map?.name ?? id}`);
    return { unlockedMaps: [...s.unlockedMaps, id] };
  }),
  addGold: (amt) => set((s) => ({ hero: { ...s.hero, gold: Math.max(0, s.hero.gold + amt) } })),
  addResource: (key, amt) => set((s) => ({ resources: { ...s.resources, [key]: Math.max(0, (s.resources[key] ?? 0) + amt) } })),
  setRunning: (r) => set({ isRunning: r }),
  refreshEnemies: () => set((s) => {
    const roster = s.currentRoster;
    // 站在没有妖怪的格子上：不刷新敌人
    if (roster && roster.length === 0) return { currentEnemies: [] };

    const boundMap = MAPS.find((x) => x.id === s.currentMapId);
    const pool = roster && roster.length > 0 ? roster : (boundMap?.monsters ?? []);
    const boss = s.currentBoss ?? boundMap?.boss ?? null;
    let enemies = roster && roster.length > 0 ? drawEnemies(roster) : getEnemies(s.currentMapId);

    // Boss 概率刷新：此地普通怪图鉴全部点亮后，10% 概率出现 Boss
    if (boss && pool.length > 0 && pool.every((mon) => s.discoveredMonsters.includes(mon.id)) && Math.random() < 0.1 && enemies.length > 0) {
      const idx = Math.floor(Math.random() * enemies.length);
      enemies = [...enemies.slice(0, idx), boss, ...enemies.slice(idx + 1)];
    }
    return { currentEnemies: enemies };
  }),

  resetGame: () => ({
    hero: { ...initHero },
    resources: { ...initRes },
    currentMapId: 'aolai',
    unlockedMaps: ['aolai'],
    currentEnemies: getEnemies('aolai'),
    currentRoster: null,
    currentBoss: null,
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
    discoveredNpcs: [],
    autoPotionThreshold: 0,
    autoBattle: false,
    buildings: {},
    mapBattles: {},
    killCounts: {},
    moralValue: 0,
    factions: { human: 50, demon: 50, divine: 50 },
  }),

  addExp: (amt) => set((s) => {
    let exp = s.hero.exp + amt;
    let lv = s.hero.level;
    while (exp >= lv * 100) { exp -= lv * 100; lv++; }
    // 升级发自由点（流派的来源）：每升 1 级 +FREE_POINTS_PER_LEVEL
    const gained = Math.max(0, lv - s.hero.level);
    const freePoints = (s.hero.freePoints ?? 0) + gained * FREE_POINTS_PER_LEVEL;
    // 派生属性（含加点/装备收益）统一重算后写回缓存
    return { hero: syncHeroDerived({ ...s.hero, exp, level: lv, freePoints }) };
  }),

  /** 加点：1 点自由点 → 1 点主属性；派生属性由 HeroCombat 统一重算 */
  allocatePrimary: (key) => {
    const { hero } = get();
    const free = hero.freePoints ?? 0;
    if (free <= 0) return false;
    const allocated = { ...(hero.allocated ?? {}) };
    allocated[key] = (allocated[key] ?? 0) + 1;
    set({ hero: syncHeroDerived({ ...hero, allocated, freePoints: free - 1 }) });
    get().addGameLog(`加点：${PRIMARY_NAME[key]} +1（剩 ${free - 1} 点）`);
    return true;
  },

  syncHero: () => set((s) => ({ hero: syncHeroDerived(s.hero) })),

  unequipSkill: (skillId) => set((s) => ({
    hero: { ...s.hero, skills: (s.hero.skills ?? [...DEFAULT_HERO_SKILLS]).filter((x) => x !== skillId) },
  })),

  setHp: (hp) => set((s) => ({ hero: { ...s.hero, hp: Math.max(0, Math.min(hp, s.hero.maxHp)) } })),

  fightMonster: (monster) => {
    const { hero } = get();
    const result = executeBattle(
      { hp: hero.hp, atk: hero.atk, def: hero.def, crit: hero.critRate },
      hero.team ?? [],
      monster
    );
    get().applyBattleOutcome(monster, result);
    return result;
  },

  /**
   * 结算一场战斗的结果（奖励 / 掉落 / 图鉴 / 击杀数 / 战败复活）。
   * 自动战斗（fightMonster）与手动战斗（useBattleStore）共用这一处，
   * 保证两条路的收益规则完全一致。
   */
  applyBattleOutcome: (monster, result) => {
    const hero = get().hero;
    const now = Date.now();
    const hhmm = new Date(now).toTimeString().slice(0, 5);
    const hhmmss = new Date(now).toTimeString().slice(0, 8);
    if (result.victory) {
      get().addBattleLog(`[${hhmm}] 战胜${monster.name}！获得${result.rewards.exp} EXP，${result.rewards.gold} 金币`);

      // 应用奖励
      get().addGold(result.rewards?.gold ?? 0);
      get().addExp(result.rewards?.exp ?? 0);
      if (typeof result.heroFinalHp === 'number') get().setHp(result.heroFinalHp);
      if (result.rewards?.drops) {
        for (const drop of result.rewards.drops) {
          if (drop?.itemId) get().addResource(DROP_TO_RESOURCE[drop.itemId] ?? drop.itemId, drop.quantity ?? 1);
        }
      }

      // 处理装备掉落
      if (result.rewards?.equipment && result.rewards.equipment.length > 0) {
        for (const equip of result.rewards.equipment) {
          useInventoryStore.getState().addEquipment(equip);
          get().addBattleLog(`[${hhmm}] 获得装备：${equip.name}（${equip.type === 'weapon' ? '武器' : '护甲'}）`);
        }
      }

      // 检查新发现
      const { discoveredMonsters } = get();
      const isNewDiscovery = !discoveredMonsters.includes(monster.id);
      get().addDiscoveredMonster(monster.id);
      if (isNewDiscovery) {
        get().addGameLog(`[${hhmmss}] 已点亮新图鉴：${monster.name}`);
      }

      // 递增击杀数
      set((s) => ({ hero: { ...s.hero, kills: s.hero.kills + 1 } }));

      // 记录地图战斗次数
      get().incrementMapBattles(get().currentMapId);
      set((s) => ({ killCounts: { ...(s.killCounts ?? {}), [monster.id]: ((s.killCounts ?? {})[monster.id] ?? 0) + 1 } }));

      // 自动药水（战胜后血量低于阈值时自动买药+喝药）
      _autoPotionIfNeeded();
    } else {
      // 死亡：自动复活到50% HP
      get().addBattleLog(`[${hhmm}] 被${monster.name} 击败！自动复活至 50% HP`);
      const reviveHp = Math.floor(hero.maxHp * 0.5);
      set((s) => ({ hero: { ...s.hero, hp: reviveHp } }));
      // 复活后也检查自动药水
      _autoPotionIfNeeded();
    }
  },

  incrementMapBattles: (mapId: string) => {
    set((s) => ({
      mapBattles: { ...(s.mapBattles ?? {}), [mapId]: ((s.mapBattles ?? {})[mapId] ?? 0) + 1 },
    }));
  },

  buyPotion: () => {
    const { hero } = get();
    if (hero.gold < 25) return false;
    const inv = useInventoryStore.getState();
    if (!inv.hasRoomFor(SHOP_POTION_ID, 1)) {
      get().addGameLog('背包已满，买不下药水了');
      return false;
    }
    set((s) => ({ hero: { ...s.hero, gold: s.hero.gold - 25 } }));
    inv.addToInventory('novelty', SHOP_POTION_ID, 1);
    get().addGameLog(`购买 ${SHOP_POTION_ID} ×1（放入背包）`);
    return true;
  },

  usePotion: () => {
    const { hero } = get();
    // 优先从背包格子喝药水（金疮药 / 大补丹等带回血量的杂货）
    const inv = useInventoryStore.getState();
    const idx = inv.slots.findIndex((s) => s && s.type === 'novelty' && potionHealOf(s.id) > 0);
    if (idx >= 0) {
      const slot = inv.slots[idx]!;
      const heal = Math.min(potionHealOf(slot.id), hero.maxHp - hero.hp);
      if (heal <= 0) return false;
      inv.removeFromInventory(idx, 1);
      set((s) => ({ hero: { ...s.hero, hp: s.hero.hp + heal } }));
      get().addGameLog(`使用 ${slot.id} +${heal} HP`);
      return true;
    }
    // 回退：旧档的 hero.potions 计数
    if (hero.potions <= 0) return false;
    const heal = Math.min(20, hero.maxHp - hero.hp);
    if (heal <= 0) return false;
    set((s) => ({ hero: { ...s.hero, potions: s.hero.potions - 1, hp: s.hero.hp + heal } }));
    get().addGameLog(`使用药水 +${heal} HP（剩：${get().hero.potions} 瓶）`);
    return true;
  },

  setAutoPotionThreshold: (val) => set({ autoPotionThreshold: val }),

  setAutoBattle: (v: boolean) => {
    if (v && !_autoBattleTimer) {
      _autoBattleTimer = setInterval(() => {
        const state = get();
        if (!state.autoBattle || state.hero.hp <= 0) {
          if (_autoBattleTimer) { clearInterval(_autoBattleTimer); _autoBattleTimer = null; }
          return;
        }
        // 用满血状态判断能否击败（避免残血误判所有怪都打不过）
        const heroAtFull = { ...state.hero, hp: state.hero.maxHp };
        let winnable = state.currentEnemies.filter(m => canDefeat(heroAtFull, m));
        if (winnable.length === 0) {
          // 没有能打过的怪，持续刷新直到出现可击败的敌人
          get().refreshEnemies();
          const retryEnemies = get().currentEnemies;
          const retryHero = { ...get().hero, hp: get().hero.maxHp };
          winnable = retryEnemies.filter(m => canDefeat(retryHero, m));
          if (winnable.length === 0) {
            // 刷新后仍无可敌目标，本轮跳过（不停止自动战斗）
            return;
          }
        }
        const target = winnable.reduce((a, b) => ((a.expReward || 0) > (b.expReward || 0) ? a : b));
        get().fightMonster(target);
        get().refreshEnemies();
      }, 600);
    } else if (!v && _autoBattleTimer) {
      clearInterval(_autoBattleTimer);
      _autoBattleTimer = null;
    }
    set(() => ({ autoBattle: v }));
  },

  changeMoral: (delta: number) => {
    const prev = get().hero.moralValue;
    const next = Math.max(-100, Math.min(100, prev + delta));
    const actualDelta = next - prev;
    if (actualDelta === 0) return;
    const factions = { ...get().hero.factions };
    if (actualDelta > 0) {
      // 行善：人族+，妖族-
      factions.human = Math.min(100, factions.human + actualDelta * 0.5);
      factions.demon = Math.max(0, factions.demon - actualDelta * 0.5);
    } else {
      // 作恶：妖族+，人族-
      const absD = Math.abs(actualDelta);
      factions.demon = Math.min(100, factions.demon + absD * 0.5);
      factions.human = Math.max(0, factions.human - absD * 0.5);
    }
    set((s) => ({ hero: { ...s.hero, moralValue: next, factions } }));
  },

  getMoralLevel: (): MoralLevel => {
    const v = get().hero.moralValue;
    if (v >= 60) return 'saint';
    if (v >= 30) return 'good';
    if (v <= -60) return 'demon';
    if (v <= -30) return 'evil';
    return 'neutral';
  },

  getMoralTitle: (): string | null => {
    const v = get().hero.moralValue;
    if (v >= 99) return '至圣';
    if (v <= -99) return '魔王';
    return null;
  },

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
    // 建造日志
    const outputRes = BUILDING_OUTPUTS[name] || name;
    const outputPerTick = cfg ? cfg.baseOutput * newCount : 0;
    get().addGameLog(`建造${name}x${newCount}完成，当前产量：${outputRes}X${outputPerTick}/tick`);
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
    // C4：形态 + 套装（按名字映射）
    const form = w.form ?? getWeaponFormByName(w.name);
    const setId = w.setId ?? formSetId(form);
    const wEquip: Equipment = { ...w, form, setId };
    // 法宝独特大招：装备后注入技能槽（满 3 顶替最旧）
    let skills = hero.skills ?? [...DEFAULT_HERO_SKILLS];
    if (w.skillId && SKILLS[w.skillId] && !skills.includes(w.skillId)) {
      const next = [...skills];
      if (next.length >= 3) next.shift();
      next.push(w.skillId);
      skills = next;
      get().addGameLog(`法宝「${w.name}」附灵，习得大招「${SKILLS[w.skillId].name}」`);
    }
    // 装备词条（atk/crit/critDmg/…）全部由 engine/HeroCombat 的派生层统一结算
    set((s2) => ({
      hero: syncHeroDerived({
        ...s2.hero,
        gold: s2.hero.gold - goldCost,
        weapon: wEquip,
        skills,
      }),
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
    // C4：形态 + 套装（按名字映射）
    const form = a.form ?? getArmorFormByName(a.name);
    const setId = a.setId ?? formSetId(form);
    const aEquip: Equipment = { ...a, form, setId };
    // 法宝独特大招：装备后注入技能槽（满 3 顶替最旧）
    let skills = hero.skills ?? [...DEFAULT_HERO_SKILLS];
    if (a.skillId && SKILLS[a.skillId] && !skills.includes(a.skillId)) {
      const next = [...skills];
      if (next.length >= 3) next.shift();
      next.push(a.skillId);
      skills = next;
      get().addGameLog(`法宝「${a.name}」附灵，习得大招「${SKILLS[a.skillId].name}」`);
    }
    // 护甲词条（def/hpMax/defPct/hpPct）同样由派生层统一结算
    set((s2) => ({
      hero: syncHeroDerived({
        ...s2.hero,
        gold: s2.hero.gold - goldCost,
        armor: aEquip,
        skills,
      }),
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
    // 记录到图鉴
    get().addDiscoveredNovelty(itemName);
    get().addGameLog(`购买杂货 ${itemName}，花费${price} 金币`);
    return true;
  },

  // 按 ItemDef.id 购买名物（M3：持在背包即触发 hold 词条，存档只存 id）
  buyItem: (itemId) => {
    const def = getItemDef(itemId);
    if (!def) return false;
    const { hero } = get();
    if (hero.gold < def.price) return false;
    set((s) => ({ hero: { ...s.hero, gold: s.hero.gold - def.price } }));
    useInventoryStore.getState().addNovelty(itemId, 1);
    get().addDiscoveredNovelty(def.name);
    get().addGameLog(`购得名物「${def.name}」，花费${def.price} 金币`);
    return true;
  },

  // 使用可消耗名物（M3：结算 use 词条，如 heal/exp）
  useItem: (itemId) => {
    const def = getItemDef(itemId);
    if (!def) return false;

    // C5：技能书 —— 主动技能进技能槽（上限 3，满则替换），被动技能进 passives
    if (def.category === 'skillbook') {
      const sid = def.skillId;
      if (!sid) return false;
      const { hero } = get();
      const isActive = !!SKILLS[sid];
      const isPassive = !!PASSIVE_SKILLS[sid];
      if (!isActive && !isPassive) return false;
      if (isPassive && hero.passives.includes(sid)) {
        get().addGameLog(`已参悟「${PASSIVE_SKILLS[sid].name}」，无需再读`);
        return false;
      }
      const current = hero.skills ?? [...DEFAULT_HERO_SKILLS];
      if (isActive && current.includes(sid)) {
        get().addGameLog(`已会「${SKILLS[sid].name}」，无需再读`);
        return false;
      }
      const removed = useInventoryStore.getState().removeNovelty(itemId, 1);
      if (!removed) return false;
      if (isPassive) {
        set((s) => ({ hero: { ...s.hero, passives: [...(s.hero.passives ?? []), sid] } }));
        get().addGameLog(`参悟被动「${PASSIVE_SKILLS[sid].name}」：${PASSIVE_SKILLS[sid].desc}`);
        return true;
      }
      let next = [...current];
      let replaced: string | undefined;
      if (next.length >= 3) replaced = next.shift();
      next.push(sid);
      set((s) => ({ hero: { ...s.hero, skills: next } }));
      get().addGameLog(
        replaced
          ? `习得「${SKILLS[sid].name}」，技能槽已满，顶替「${SKILLS[replaced]?.name ?? replaced}」`
          : `习得「${SKILLS[sid].name}」`,
      );
      return true;
    }

    if (def.category !== 'consumable') return false;
    const removed = useInventoryStore.getState().removeNovelty(itemId, 1);
    if (!removed) return false;
    for (const e of def.effects ?? []) {
      if (e.trigger !== 'use') continue;
      switch (e.kind) {
        case 'heal':
          get().setHp(get().hero.hp + e.value);
          break;
        case 'exp':
          get().addExp(e.value);
          break;
        default:
          break;
      }
    }
    get().addGameLog(`使用「${def.name}」`);
    return true;
  },

  sellNovelty: (itemName, sellPrice) => {
    // 从背包移除（可叠加）
    const removed = useInventoryStore.getState().removeNovelty(itemName, 1);
    if (!removed) return false;
    // 囤积词条：出售价提高，再返还 80% 基础价
    const sellBoost = sumEffect('sellPrice');
    const refund = Math.floor(sellPrice * 0.8 * (1 + sellBoost));
    set((s) => ({
      hero: {
        ...s.hero,
        gold: s.hero.gold + refund,
      },
    }));
    get().addGameLog(`出售杂货 ${itemName}，获得${refund} 金币（80%）`);
    return true;
  },

  buyExpPill: (pillId, price) => {
    const pill = EXP_PILL_BY_ID[pillId];
    if (!pill) return false;
    const { hero } = get();
    if (hero.gold < price) return false;
    // 扣除金币
    set((s) => ({
      hero: {
        ...s.hero,
        gold: s.hero.gold - price,
      },
    }));
    // 添加到背包（可叠加，上限99）
    useInventoryStore.getState().addNovelty(pillId, 1);
    get().addGameLog(`购买 ${pill.name}，花费${price} 金币`);
    return true;
  },

  useExpPill: (pillId) => {
    const pill = EXP_PILL_BY_ID[pillId];
    if (!pill) return false;
    // 从背包移除
    const removed = useInventoryStore.getState().removeNovelty(pillId, 1);
    if (!removed) return false;
    // 增加经验
    get().addExp(pill.exp);
    get().addGameLog(`使用 ${pill.name}，获得${pill.exp} 经验`);
    return true;
  },

  plantCrop: (plotIdx, plantId) => {
    const plant = PLANTS_CATALOG.find((p: any) => p.id === plantId);
    if (!plant || get().hero.gold < plant.seedPrice) return false;
    set((s) => {
      const plots = [...s.farmPlots];
      plots[plotIdx] = { plantId, plantedAt: Date.now(), lastHarvest: null, accumulatedGold: 0 };
      return {
        hero: { ...s.hero, gold: s.hero.gold - plant.seedPrice },
        farmPlots: plots,
      };
    });
    // 记录到图鉴
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
    // P0-1：队友也走「等级 → 主属性 → 派生」，与怪物/NPC 同一套语言
    const mate = deriveTeammate(recruit.level, recruit.isElite);
    const mateHp = Math.round(mate.derived.hpMax);
    set((s) => ({
      hero: {
        ...s.hero,
        gold: s.hero.gold - recruit.cost,
        team: [
          ...s.hero.team,
          {
            roleName: recruit.roleName,
            level: recruit.level,
            maxHp: mateHp,
            hp: mateHp,
            atk: Math.round(mate.derived.atk),
            def: Math.round(mate.derived.def),
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
  addDiscoveredNpc: (id) => set((s) => {
    const list = s.discoveredNpcs || [];
    if (list.includes(id)) return {};
    const npc = NPCS.find(n => n.id === id);
    const name = npc ? npc.name : id;
    const now = Date.now();
    const hhmmss = new Date(now).toTimeString().slice(0, 8);
    get().addGameLog(`[${hhmmss}] 已点亮新图鉴：${name}`);
    return { discoveredNpcs: [...list, id] };
  }),
}));
