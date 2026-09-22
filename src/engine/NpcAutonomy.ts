/**
 * NpcAutonomy — 日推进：NPC 在你不在时也在做事，产出"城中见闻"
 * 只演算当前据点 + 与玩家有交情的 NPC（≤12 个），成本可忽略。
 */
import { NPCS } from '../data/npcs';
import { AUTONOMY_LINES, NPC_ECO, relationsOf } from '../data/npcEcology';
import { useGameStore } from '../store/useGameStore';
import { useNpcEcoStore } from '../store/useNpcEcoStore';
import { useNpcStore } from '../store/useNpcStore';
import type { WorldEvent } from '../types';

export function nameOf(id: string): string {
  return NPCS.find((n) => n.id === id)?.name ?? id;
}

export function addEvent(e: Omit<WorldEvent, 'id'>): void {
  const store = useNpcEcoStore.getState();
  store.addEvent({ ...e, id: `ev_${e.day}_${Math.random().toString(36).slice(2, 7)}` });
  if (e.aboutPlayer) useGameStore.getState().addGameLog(`[见闻] ${e.text}`);
}

/** 每天推进一次 */
export function advanceNpcDay(day: number): void {
  const store = useNpcEcoStore.getState();
  const npcStore = useNpcStore.getState();
  const game = useGameStore.getState();
  store.pruneEvents(day);

  const active = NPCS
    .filter((n) => n.location === game.currentMapId || npcStore.getNpcAffinity(n.id) >= 25)
    .slice(0, 12);

  let made = 0;
  for (const npc of active) {
    if (made >= 3) break;
    if (Math.random() > 0.35) continue;

    const eco = store.getEco(npc.id);
    const agenda = NPC_ECO[npc.id]?.agenda ?? ['gossip', 'rest', 'trade'];
    const kind = agenda[Math.floor(Math.random() * agenda.length)];
    const pool = AUTONOMY_LINES[kind] ?? AUTONOMY_LINES.gossip;
    const text = pool[Math.floor(Math.random() * pool.length)].replace(/\$\{name\}/g, npc.name);
    const affinity = npcStore.getNpcAffinity(npc.id);

    addEvent({ day, kind: 'gather', actors: [npc.id], place: npc.location, text, aboutPlayer: affinity >= 40 });

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
    store.patch(npc.id, {
      lastActiveDay: day,
      mood: eco.mood === '厌恶' || eco.mood === '警惕' ? eco.mood : (Math.random() < 0.25 ? '喜悦' : '平静'),
    });
    made++;
  }
}
