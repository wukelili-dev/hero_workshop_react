/**
 * useNpcStore — NPC 运行时状态管理
 */
import { create } from 'zustand';
import type { NpcInstance } from '../types';
import { NPCS } from '../data/npcs';

interface NpcState {
  /** npcId → NpcInstance 映射 */
  instances: Record<string, NpcInstance>;

  /** 当前展开的 NPC id（-1 = 全部收起） */
  expandedNpcId: string | null;

  /** 隐藏Boss/事件探索标记 */
  explorationFlags: Record<string, boolean>;

  /** 初始化 NPC 实例（第一次访问某地图时调用） */
  initMapNpcs: (mapId: string) => void;

  /** 设置展开状态 */
  setExpanded: (npcId: string | null) => void;

  /** 记录交互 */
  recordInteraction: (npcId: string) => void;

  /** 标记已问候 */
  markGreeted: (npcId: string) => void;

  /** 标记挑战结果 */
  setDefeated: (npcId: string) => void;

  /** 获取 NPC 实例（若不存在则自动初始化） */
  getInstance: (npcId: string) => NpcInstance | null;

  /** 重置所有 NPC */
  resetNpcs: () => void;
  /** 设置探索标记 */
  setExplorationFlag: (key: string) => void;
  /** 偷窃失败计数 */
  stealFailCounts: Record<string, number>;
  incrementStealFail: (npcId: string) => void;
  resetStealFails: (npcId: string) => void;
  /** 赏金猎人击败次数 */
  bountyWins: number;
  setBountyWins: (n: number) => void;
}

function makeInstance(npcId: string): NpcInstance {
  return { npcId, state: 'idle', defeatedCount: 0, lastInteractedAt: 0, greeted: false };
}

export const useNpcStore = create<NpcState>((set, get) => ({
  instances: {},
  expandedNpcId: null,
  explorationFlags: {},

  initMapNpcs: (mapId) => {
    const npcs = NPCS.filter(n => n.location === mapId);
    set((s) => {
      const next = { ...s.instances };
      for (const npc of npcs) {
        if (!next[npc.id]) {
          next[npc.id] = makeInstance(npc.id);
        }
      }
      return { instances: next };
    });
  },

  setExpanded: (npcId) => {
    set({ expandedNpcId: npcId });
    if (npcId && !get().instances[npcId]) {
      set((s) => ({
        instances: { ...s.instances, [npcId]: makeInstance(npcId) },
      }));
    }
  },

  recordInteraction: (npcId) => {
    set((s) => {
      const inst = s.instances[npcId];
      if (!inst) return {};
      return {
        instances: {
          ...s.instances,
          [npcId]: { ...inst, lastInteractedAt: Date.now() },
        },
      };
    });
  },

  markGreeted: (npcId) => {
    set((s) => {
      const inst = s.instances[npcId];
      if (!inst) return {};
      return {
        instances: {
          ...s.instances,
          [npcId]: { ...inst, greeted: true },
        },
      };
    });
  },

  setDefeated: (npcId) => {
    set((s) => {
      const inst = s.instances[npcId];
      if (!inst) return {};
      return {
        instances: {
          ...s.instances,
          [npcId]: { ...inst, state: 'defeated', defeatedCount: inst.defeatedCount + 1 },
        },
      };
    });
  },

  getInstance: (npcId) => {
    const inst = get().instances[npcId];
    if (inst) return inst;
    return null;
  },

  setExplorationFlag: (key) => {
    set((s) => ({
      explorationFlags: { ...s.explorationFlags, [key]: true },
    }));
  },

  resetNpcs: () => {
    set({ instances: {}, expandedNpcId: null, explorationFlags: {} });
  },

  stealFailCounts: {},
  incrementStealFail: (npcId) => {
    set((s) => {
      const counts = { ...(s.stealFailCounts ?? {}) };
      counts[npcId] = (counts[npcId] ?? 0) + 1;
      return { stealFailCounts: counts };
    });
  },
  resetStealFails: (npcId) => {
    set((s) => {
      const counts = { ...(s.stealFailCounts ?? {}) };
      delete counts[npcId];
      return { stealFailCounts: counts };
    });
  },

  bountyWins: 0,
  setBountyWins: (n) => set({ bountyWins: n }),
}));
