/**
 * NpcAutonomy — 日推进：NPC 在你不在时也在做事，产出"城中见闻"
 * 只演算当前据点 + 与玩家有交情的 NPC（≤12 个），成本可忽略。
 */
import { NPCS } from '../data/npcs';
import { GOAL_LINES, NPC_ECO, relationsOf } from '../data/npcEcology';
import { useGameStore } from '../store/useGameStore';
import { useNpcEcoStore } from '../store/useNpcEcoStore';
import { useNpcStore } from '../store/useNpcStore';
import { sum as sumEffect } from './ItemEffects';
import type { NpcDefinition, NpcSelfState, WorldEvent } from '../types';

export function nameOf(id: string): string {
  return NPCS.find((n) => n.id === id)?.name ?? id;
}

export function addEvent(e: Omit<WorldEvent, 'id'>): void {
  const store = useNpcEcoStore.getState();
  store.addEvent({ ...e, id: `ev_${e.day}_${Math.random().toString(36).slice(2, 7)}` });
  if (e.aboutPlayer) useGameStore.getState().addGameLog(`[见闻] ${e.text}`);
}

interface GoalActionResult { self: NpcSelfState; text: string; kind: WorldEvent['kind']; }

/** 按 NPC 当前目标执行一个每日行动，真改数值（活人世界 S1） */
function actOnGoal(npc: NpcDefinition, self: NpcSelfState): GoalActionResult {
  const ecoStore = useNpcEcoStore.getState();
  const npcStore = useNpcStore.getState();
  const pool = GOAL_LINES[self.goal.kind] ?? GOAL_LINES.fame;
  const text = (pool[Math.floor(Math.random() * pool.length)] ?? '${name}在做自己的事。').replace(/\$\{name\}/g, npc.name);

  switch (self.goal.kind) {
    case 'power': {
      const gain = 3 + Math.floor(Math.random() * 6);
      return { self: { ...self, power: self.power + gain, reputation: self.reputation + 1 }, text, kind: 'gather' };
    }
    case 'wealth': {
      const assets = 5 + Math.floor(Math.random() * 16);
      const gold = 15 + Math.floor(Math.random() * 26);
      npcStore.modifyNpcGold(npc.id, gold);
      return { self: { ...self, assets: self.assets + assets }, text, kind: 'trade' };
    }
    case 'revenge': {
      const progress = Math.min(100, self.goal.progress + 10 + Math.floor(Math.random() * 16));
      return { self: { ...self, goal: { ...self.goal, progress } }, text, kind: 'gather' };
    }
    case 'love': {
      if (self.goal.target) ecoStore.addRelation(npc.id, self.goal.target, Math.random() < 0.5 ? -5 : 5);
      const progress = Math.min(100, self.goal.progress + 5 + Math.floor(Math.random() * 11));
      return { self: { ...self, goal: { ...self.goal, progress } }, text, kind: 'gather' };
    }
    case 'fame': {
      const rep = 2 + Math.floor(Math.random() * 4);
      return { self: { ...self, reputation: self.reputation + rep }, text, kind: 'gather' };
    }
    case 'wander':
    default: {
      return { self: { ...self, reputation: self.reputation + 1 }, text, kind: 'gather' };
    }
  }
}

/** 每天推进一次 */
export function advanceNpcDay(day: number): void {
  const store = useNpcEcoStore.getState();
  const npcStore = useNpcStore.getState();
  const game = useGameStore.getState();
  store.pruneEvents(day);

  // 慈悲词条：每日善值（持有即生效）
  const moralPerDay = sumEffect('moralPerDay');
  if (moralPerDay > 0) game.changeMoral(moralPerDay);

  const active = NPCS
    .filter((n) => n.location === game.currentMapId || npcStore.getNpcAffinity(n.id) >= 25)
    .slice(0, 12);

  let made = 0;
  // 夫妻每日家用：结婚不只是台词，有实际好处
  for (const spouse of NPCS) {
    const sEco = store.getEco(spouse.id);
    if (sEco.bond !== '夫妻') continue;
    const gift = 20 + Math.floor(npcStore.getNpcAffinity(spouse.id) / 5);
    npcStore.modifyNpcGold(spouse.id, -Math.floor(gift / 4));
    npcStore.modifyNpcAffinity(spouse.id, 1);
    useGameStore.getState().addGold(gift);
    addEvent({ day, kind: 'gift', actors: [spouse.id], text: `${spouse.name}给你送来 ${gift} 金的家用。`, aboutPlayer: true });
  }
  for (const npc of active) {
    if (made >= 3) break;
    if (Math.random() > 0.35) continue;

    const eco = store.getEco(npc.id);
    const result = actOnGoal(npc, eco.self);
    store.patch(npc.id, {
      self: result.self,
      lastActiveDay: day,
      mood: eco.mood === '厌恶' || eco.mood === '警惕' ? eco.mood : (Math.random() < 0.25 ? '喜悦' : '平静'),
    });
    addEvent({
      day, kind: result.kind, actors: [npc.id], place: npc.location, text: result.text,
      aboutPlayer: npcStore.getNpcAffinity(npc.id) >= 40,
    });

    // 关系网里的小摩擦（关系强度会被玩家的挑拨改写）
    const rel = relationsOf(npc.id)[0];
    if (rel && store.relationStrength(npc.id, rel.target) < -20 && Math.random() < 0.35) {
      addEvent({
        day, kind: 'quarrel', actors: [npc.id, rel.target], place: npc.location,
        text: `${npc.name}和${nameOf(rel.target)}在街口争执了几句。`,
      });
    }

    const wallet = NPC_ECO[npc.id]?.wallet;
    if (wallet?.dailyIncome) npcStore.modifyNpcGold(npc.id, Math.round(wallet.dailyIncome * 0.2));
    made++;
  }
}
