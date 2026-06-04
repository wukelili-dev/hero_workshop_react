/**
 * 存档工具 — 直接序列化 Zustand store 到 localStorage
 * 不依赖破损的 GameEngine
 */
import { useGameStore } from '../store/useGameStore';

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
    const state = useGameStore.getState();
    const saveData = {
      version: 'v1',
      timestamp: Date.now(),
      hero: state.hero,
      resources: state.resources,
      currentMapId: state.currentMapId,
      unlockedMaps: state.unlockedMaps,
      currentEnemies: state.currentEnemies,
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
    const store = useGameStore.getState();
    store.setHero(data.hero);
    store.setResources(data.resources);
    if (data.currentMapId) store.setCurrentMap(data.currentMapId);
    if (data.unlockedMaps) {
      for (const mapId of data.unlockedMaps) {
        if (!useGameStore.getState().unlockedMaps.includes(mapId)) {
          store.unlockMap(mapId);
        }
      }
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
