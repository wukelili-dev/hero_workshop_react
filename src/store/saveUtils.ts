/**
 * 存档工具 — 存档全量 Zustand stores 到 localStorage
 * v2: 新增 inventory / ranch / factory / farmPlots
 */
import { useGameStore } from '../store/useGameStore';
import { useInventoryStore } from '../store/useInventoryStore';
import { useRanchStore } from '../store/useRanchStore';
import { useFactoryStore } from '../store/useFactoryStore';

const SAVE_KEY = 'hero_workshop_save_v1';

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

    const saveData = {
      version: 'v2',
      timestamp: Date.now(),
      hero: gameState.hero,
      resources: gameState.resources,
      currentMapId: gameState.currentMapId,
      unlockedMaps: gameState.unlockedMaps,
      currentEnemies: gameState.currentEnemies,
      farmPlots: gameState.farmPlots,
      inventory: {
        weapons: invState.weapons,
        armors: invState.armors,
        materials: invState.materials,
        novelties: invState.novelties,
      },
      ranch: { slots: ranchState.slots },
      factory: {
        factoryBuilt: factoryState.factoryBuilt,
        depts: factoryState.depts,
        totalWorkers: factoryState.totalWorkers,
        autoRunning: factoryState.autoRunning,
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

    if (data.inventory) {
      if (data.inventory.weapons) invStore.setWeapons(data.inventory.weapons);
      if (data.inventory.armors) invStore.setArmors(data.inventory.armors);
      if (data.inventory.materials) invStore.setMaterials(data.inventory.materials);
      if (data.inventory.novelties) invStore.setNovelties(data.inventory.novelties);
    }

    if (data.ranch?.slots) ranchStore.setSlots(data.ranch.slots);

    if (data.factory) {
      if (data.factory.factoryBuilt !== undefined) factoryStore.setFactoryBuilt(data.factory.factoryBuilt);
      if (data.factory.depts) factoryStore.setDepts(data.factory.depts);
      if (data.factory.totalWorkers !== undefined) factoryStore.setTotalWorkers(data.factory.totalWorkers);
      if (data.factory.autoRunning !== undefined) factoryStore.setAutoRunning(data.factory.autoRunning);
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
      mapName: data.currentMapId || '傲来国',
    };
  } catch {
    return null;
  }
}

export function hasSave(): boolean {
  return localStorage.getItem(SAVE_KEY) !== null;
}

export function deleteSave(): void {
  localStorage.removeItem(SAVE_KEY);
}
