/**
 * useNpcEcoStore — NPC 生态运行时状态（情绪/关系/记忆/恩怨/世界见闻）
 * 与 useNpcStore 分开：前者是"活人"层，后者保留原有好感度与金钱。
 */
import { create } from 'zustand';
import type { NpcBond, NpcEcoState, NpcMood, WorldEvent } from '../types';
import { NPCS } from '../data/npcs';
import { getRelationDef, NPC_ECO } from '../data/npcEcology';

export interface NpcEcoSave {
  states: Record<string, NpcEcoState>;
  events: WorldEvent[];
  relationOverride: Record<string, number>;
}

interface EcoStore extends NpcEcoSave {
  getEco: (npcId: string) => NpcEcoState;
  patch: (npcId: string, p: Partial<NpcEcoState>) => void;
  addMemory: (npcId: string, key: string, day: number, detail?: string) => void;
  addFlag: (npcId: string, key: string, delta?: number) => void;
  setBond: (npcId: string, bond: NpcBond, day?: number) => void;
  setMood: (npcId: string, mood: NpcMood) => void;
  addEvent: (e: WorldEvent) => void;
  pruneEvents: (currentDay: number) => void;
  /** 关系强度：覆盖值优先，否则取定义值 */
  relationStrength: (a: string, b: string) => number;
  addRelation: (a: string, b: string, delta: number) => void;
  loadEco: (data: Partial<NpcEcoSave>) => void;
  resetEco: () => void;
}

const key = (a: string, b: string) => `${a}->${b}`;

function defaultEco(affinity: number): NpcEcoState {
  const bond: NpcBond = affinity >= 80 ? '挚友' : affinity >= 60 ? '好友' : affinity >= 30 ? '熟客' : affinity > 0 ? '相识' : '陌生';
  const mood: NpcMood = affinity >= 70 ? '喜悦' : affinity <= -30 ? '厌恶' : '平静';
  return {
    mood, bond, memory: [], flags: {}, cooldowns: {}, saidOnce: [],
    health: 100, enemies: [], benefactors: [], lastActiveDay: 0,
  };
}

export const useNpcEcoStore = create<EcoStore>((set, get) => ({
  states: {},
  events: [],
  relationOverride: {},

  getEco: (npcId) => {
    const cur = get().states[npcId];
    if (cur) return cur;
    // 首次访问：按现有好感度推导一个合理初始状态
    const eco = defaultEco(0);
    set((s) => ({ states: { ...s.states, [npcId]: eco } }));
    return eco;
  },

  patch: (npcId, p) => set((s) => ({
    states: { ...s.states, [npcId]: { ...get().getEco(npcId), ...p } },
  })),

  addMemory: (npcId, k, day, detail) => set((s) => {
    const eco = get().getEco(npcId);
    const memory = [{ key: k, day, detail }, ...eco.memory].slice(0, 20);
    return { states: { ...s.states, [npcId]: { ...eco, memory } } };
  }),

  addFlag: (npcId, k, delta = 1) => set((s) => {
    const eco = get().getEco(npcId);
    const flags = { ...eco.flags, [k]: (eco.flags[k] ?? 0) + delta };
    return { states: { ...s.states, [npcId]: { ...eco, flags } } };
  }),

  setBond: (npcId, bond, day) => set((s) => {
    const eco = get().getEco(npcId);
    return { states: { ...s.states, [npcId]: { ...eco, bond, bondedDay: day ?? eco.bondedDay } } };
  }),

  setMood: (npcId, mood) => set((s) => {
    const eco = get().getEco(npcId);
    return { states: { ...s.states, [npcId]: { ...eco, mood } } };
  }),

  addEvent: (e) => set((s) => ({ events: [e, ...s.events].slice(0, 60) })),

  pruneEvents: (currentDay) => set((s) => ({ events: s.events.filter((e) => currentDay - e.day <= 30) })),

  relationStrength: (a, b) => {
    const o = get().relationOverride[key(a, b)];
    if (typeof o === 'number') return o;
    return getRelationDef(a, b)?.strength ?? 0;
  },

  addRelation: (a, b, delta) => set((s) => {
    const cur = get().relationStrength(a, b);
    const next = Math.max(-100, Math.min(100, cur + delta));
    return { relationOverride: { ...s.relationOverride, [key(a, b)]: next, [key(b, a)]: next } };
  }),

  loadEco: (data) => set({
    states: data.states ?? {},
    events: data.events ?? [],
    relationOverride: data.relationOverride ?? {},
  }),

  resetEco: () => set({ states: {}, events: [], relationOverride: {} }),
}));

/** 取 NPC 的静态生态设定（没有则返回空对象） */
export function ecoDef(npcId: string) {
  return NPC_ECO[npcId] ?? NPCS.find((n) => n.id === npcId)?.eco ?? {};
}
