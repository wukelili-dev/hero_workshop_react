/**
 * 存档工具 — 存档全量 Zustand stores 到 localStorage
 * v2: 新增 inventory / ranch / factory / farmPlots
 */
import { useGameStore, startBuildingTimer } from '../store/useGameStore';
import { useInventoryStore } from '../store/useInventoryStore';
import { useRanchStore } from '../store/useRanchStore';
import { useFactoryStore } from '../store/useFactoryStore';
import { useNpcStore } from '../store/useNpcStore';
import { useWorldStore } from './useWorldStore';
import { MAPS } from '../data/maps';
import { getCellEncounter } from '../data/cellEncounters';
import { useNpcEcoStore } from './useNpcEcoStore';

// 存档键 + 版本：口径大改（战斗/属性/装备/加点）时不迁移旧档，直接换键开新档。
// 旧键会在一处统一清掉，避免占用 localStorage。
const SAVE_KEY = 'hero_workshop_save_v4';
const SAVE_VERSION = 'v4';
const LEGACY_SAVE_KEYS = ['hero_workshop_save_v1', 'hero_workshop_save_v2', 'hero_workshop_save_v3'];

export interface SaveMeta {
  version: string;
  timestamp: number;
  heroLevel: number;
  heroName: string;
  gold: number;
  mapName: string;
}

export function saveGame(): boolean {
  try {
    const gameState = useGameStore.getState();
    const invState = useInventoryStore.getState();
    const ranchState = useRanchStore.getState();
    const factoryState = useFactoryStore.getState();

    const npcState = useNpcStore.getState();
    const worldState = useWorldStore.getState();

    const saveData = {
      version: SAVE_VERSION,
      timestamp: Date.now(),
      hero: gameState.hero,
      resources: gameState.resources,
      currentMapId: gameState.currentMapId,
      unlockedMaps: gameState.unlockedMaps,
      currentEnemies: gameState.currentEnemies,
      farmPlots: gameState.farmPlots,
      // 图鉴数据
      discoveredMonsters: gameState.discoveredMonsters,
      discoveredNovelties: gameState.discoveredNovelties,
      discoveredPlants: gameState.discoveredPlants,
      discoveredCreatures: gameState.discoveredCreatures,
      // 建筑统计
      buildings: gameState.buildings,
      // NPC 状态
      npcInstances: npcState.instances,
      npcEco: {
        states: useNpcEcoStore.getState().states,
        events: useNpcEcoStore.getState().events,
        relationOverride: useNpcEcoStore.getState().relationOverride,
      },
      inventory: {
        weapons: invState.weapons,
        armors: invState.armors,
        materials: invState.materials,
        novelties: invState.novelties,
      },
      // 世界时间 / 所在格子 / 迷雾
      world: {
        day: worldState.day,
        currentCellId: worldState.currentCellId,
        currentRegionId: worldState.currentRegionId,
        revealedCells: worldState.revealedCells,
        visitedCells: worldState.visitedCells,
        lastTickAt: worldState.lastTickAt,
        gathered: worldState.gathered,
        bountyClaimed: worldState.bountyClaimed,
        worldFlags: worldState.worldFlags,
        dailyEvent: worldState.dailyEvent,
        visits: worldState.visits,
        consequences: worldState.consequences,
        factionRep: worldState.factionRep,
        marketStock: worldState.marketStock,
        marketIntel: worldState.marketIntel,
        chronicle: worldState.chronicle,
        places: worldState.places,
        letters: worldState.letters,
      },
      ranch: { slots: ranchState.slots },
      factory: {
        factoryBuilt: factoryState.factoryBuilt,
        depts: factoryState.depts,
        totalWorkers: factoryState.totalWorkers,
      },
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
    return true;
  } catch (e) {
    console.error('存档失败:', e);
    return false;
  }
}

export function loadGame(): boolean {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);
    // 版本不符 = 旧档：不迁移，直接丢弃开新档（战斗/属性/装备口径已大改）
    if (data.version !== SAVE_VERSION) {
      deleteSave();
      console.warn(`[存档] 版本不符（${data.version} ≠ ${SAVE_VERSION}），已丢弃旧档并开新档`);
      return false;
    }

    const gameStore = useGameStore.getState();
    const invStore = useInventoryStore.getState();
    const ranchStore = useRanchStore.getState();
    const factoryStore = useFactoryStore.getState();

    // 英雄 + 资源
    if (data.hero) gameStore.setHero(data.hero);
    if (data.resources) gameStore.setResources(data.resources);

    // 地图
    if (data.currentMapId) gameStore.setCurrentMap(data.currentMapId);
    if (data.unlockedMaps) {
      for (const mapId of data.unlockedMaps) {
        if (!useGameStore.getState().unlockedMaps.includes(mapId)) {
          gameStore.unlockMap(mapId);
        }
      }
    }

    // v2 新增字段
    if (data.farmPlots) gameStore.setFarmPlots(data.farmPlots);

    // 世界时间 / 位置 / 迷雾，并把当前格子的妖怪同步给战斗系统
    if (data.world) {
      useWorldStore.getState().loadWorld(data.world);
    }
    useWorldStore.getState().syncEncounter();

    // 读档后按主属性 + 装备重算派生缓存（加点/装备口径变了，缓存必须重算）
    useGameStore.getState().syncHero();

    // NPC 状态
    if (data.npcInstances) {
      useNpcStore.setState({ instances: data.npcInstances });
    }
    if (data.npcEco) {
      useNpcEcoStore.getState().loadEco(data.npcEco);
    }

    // 图鉴数据
    if (data.discoveredMonsters) {
      useGameStore.setState({ discoveredMonsters: data.discoveredMonsters });
    }
    if (data.discoveredNovelties) {
      useGameStore.setState({ discoveredNovelties: data.discoveredNovelties });
    }
    if (data.discoveredPlants) {
      useGameStore.setState({ discoveredPlants: data.discoveredPlants });
    }
    if (data.discoveredCreatures) {
      useGameStore.setState({ discoveredCreatures: data.discoveredCreatures });
    }
    // 建筑统计
    if (data.buildings) {
      useGameStore.setState({ buildings: data.buildings });
    }

    if (data.inventory) {
      if (data.inventory.weapons) invStore.setWeapons(data.inventory.weapons);
      if (data.inventory.armors) invStore.setArmors(data.inventory.armors);
      if (data.inventory.materials) invStore.setMaterials(data.inventory.materials);
      if (data.inventory.novelties) invStore.setNovelties(data.inventory.novelties);
    }

    if (data.ranch?.slots) ranchStore.setSlots(data.ranch.slots);

    if (data.factory) {
      if (data.factory.factoryBuilt !== undefined) factoryStore.setFactoryBuilt(data.factory.factoryBuilt);
      if (data.factory.depts) {
        // 旧存档可能有 lastCollectAt 字段，忽略即可
        factoryStore.setDepts(data.factory.depts);
      }
      if (data.factory.totalWorkers !== undefined) factoryStore.setTotalWorkers(data.factory.totalWorkers);
      // autoRunning 已移除（工厂改为自动入账）
    }

    // 不迁移旧档：版本不符在上面已直接丢弃（不要求存档兼容），这里不再补字段。
    // ── 读档后启动建筑定时器 ──
    const { buildings } = useGameStore.getState();
    const hasBuildings = buildings && Object.keys(buildings).some(k => (buildings as any)[k] > 0);
    if (hasBuildings) {
      startBuildingTimer();
    }

    return true;
  } catch (e) {
    console.error('读档失败:', e);
    return false;
  }
}

export function getSaveMeta(): SaveMeta | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    return {
      version: data.version || 'unknown',
      timestamp: data.timestamp || 0,
      heroLevel: data.hero?.level || 1,
      heroName: data.hero?.name || '未知',
      gold: data.hero?.gold || 0,
      mapName:
        (data.world?.currentCellId && getCellEncounter(data.world.currentCellId)?.label) ||
        MAPS.find((m) => m.id === data.currentMapId)?.name ||
        '傲来国',
    };
  } catch {
    return null;
  }
}

export function hasSave(): boolean {
  // 顺手清掉历史版本的存档键（口径大改，不做迁移）
  for (const key of LEGACY_SAVE_KEYS) {
    try { localStorage.removeItem(key); } catch { /* ignore */ }
  }
  return localStorage.getItem(SAVE_KEY) !== null;
}

export function deleteSave(): void {
  localStorage.removeItem(SAVE_KEY);
}
