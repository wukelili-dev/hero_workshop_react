/**
 * VisitSystem — 主动来访：NPC 会主动找上玩家（寻仇/挑战/求助/送礼/说媒/举报）
 * 队列存在 useWorldStore.visits，本模块负责入队、到期判定与四种应对的结算。
 */
import type { Consequence, Monster, NpcDefinition, PendingVisit } from '../types';
import { NPCS } from '../data/npcs';
import { FACTION_BY_NPC } from '../data/npcEcology';
import { useWorldStore } from '../store/useWorldStore';
import { useGameStore } from '../store/useGameStore';
import { useNpcStore } from '../store/useNpcStore';
import { useNpcEcoStore } from '../store/useNpcEcoStore';
import { executeBattle, type HeroStats } from './Combat';

export type VisitChoice = 'fight' | 'pay' | 'avoid' | 'help';

export interface VisitResolveResult {
  ok: boolean;
  message: string;
  victory?: boolean;
  goldLost?: number;
}

const FACTION_NAME: Record<string, string> = {
  changan_guild: '西市商会',
  changan_escort: '龙门镖局',
  changan_court: '官府',
  changan_temple: '佛门',
};

const dayNow = () => Math.floor(useWorldStore.getState().day);

function npcOf(id: string): NpcDefinition | undefined {
  return NPCS.find((n) => n.id === id);
}

/** 因玩家偷窃/袭击/揭发等原因，让该 NPC 记仇并安排上门（同类 7 天冷却） */
export function enqueueRevenge(npcId: string, reason: string, delayDays = 1): void {
  const world = useWorldStore.getState();
  const day = dayNow();
  const existing = world.visits.find((v) => !v.resolved && v.npcId === npcId && v.kind === 'revenge');
  if (existing) return;
  world.enqueueVisit({ npcId, kind: 'revenge', createdDay: day, arriveDay: day + delayDays, reason });
}

/** 日推进末尾：扫复仇目标，progress ≥ 60 且未排队 → 安排上门 */
export function tickVisits(day: number): void {
  const world = useWorldStore.getState();
  const npcStore = useNpcStore.getState();
  const eco = useNpcEcoStore.getState();
  for (const npc of NPCS) {
    if (npc.location !== useGameStore.getState().currentMapId && npcStore.getNpcAffinity(npc.id) < 25) continue;
    const self = eco.getEco(npc.id).self;
    if (self.goal.kind !== 'revenge') continue;
    if (self.goal.progress < 60) continue;
    const queued = world.visits.some((v) => !v.resolved && v.npcId === npc.id && v.kind === 'revenge');
    if (queued) continue;
    const targetName = self.goal.target ? (npcOf(self.goal.target)?.name ?? self.goal.target) : '你';
    world.enqueueVisit({ npcId: npc.id, kind: 'revenge', createdDay: day, arriveDay: day + 1 + Math.floor(Math.random() * 2), reason: `${npc.name}与${targetName}结怨已深，来找你讨说法。` });
  }
}

/** 到期未处理的来访（arriveDay ≤ 当前日） */
export function dueVisits(day: number): PendingVisit[] {
  return useWorldStore.getState().visits.filter((v) => !v.resolved && v.arriveDay <= day);
}

/** 由 power 或 challengeStats 换算应战怪物 */
function visitMonster(npc: NpcDefinition, power: number): Monster {
  if (npc.challengeStats) {
    return {
      id: `visit_fight_${npc.id}`, name: npc.name,
      hp: npc.challengeStats.hp, atk: npc.challengeStats.atk, def: npc.challengeStats.def,
      expReward: 0, goldReward: 0, drops: [],
    };
  }
  const p = Math.max(20, power);
  return {
    id: `visit_fight_${npc.id}`, name: npc.name,
    hp: 80 + (p - 20) * 3,
    atk: Math.round(5 + (p - 20) / 3),
    def: Math.round(2 + (p - 20) / 6),
    expReward: 0, goldReward: 0, drops: [],
  };
}

/** 破财消灾所需金额：随对方战力/资产水涨船高 */
export function payoffCost(visit: PendingVisit): number {
  const npc = npcOf(visit.npcId);
  if (!npc) return 80;
  const self = useNpcEcoStore.getState().getEco(visit.npcId).self;
  return Math.max(30, 50 + Math.round(self.power / 2));
}

/**
 * 结算一次来访。四选一：应战 / 破财 / 躲开 / 求助。
 * 调用方在结算后自行把 visit 标记 resolved（这里统一处理）。
 */
export function resolveVisit(visit: PendingVisit, choice: VisitChoice): VisitResolveResult {
  const world = useWorldStore.getState();
  const game = useGameStore.getState();
  const npcStore = useNpcStore.getState();
  const eco = useNpcEcoStore.getState();
  const npc = npcOf(visit.npcId);
  if (!npc) return { ok: false, message: '来者不知所踪。' };
  const self = eco.getEco(npc.id).self;

  switch (choice) {
    case 'fight': {
      const hero = game.hero;
      const monster = visitMonster(npc, self.power);
      const result = executeBattle(
        { hp: hero.hp, atk: hero.atk, def: hero.def, crit: hero.critRate } as HeroStats,
        [], monster,
      );
      world.resolveVisit(visit.id);
      if (result.victory) {
        const injuries = Math.min(100, self.injuries + 30);
        eco.patch(npc.id, { self: { ...self, injuries } });
        const faction = self.factionId ?? FACTION_BY_NPC[npc.id];
        if (faction) {
          world.addFactionRep(faction, -10);
          const bounty = Math.max(100, 200 + self.power);
          const until = dayNow() + 10;
          world.addConsequence({ id: `bounty_${faction}_${until}`, kind: 'quest', scope: { factionId: faction }, value: bounty, untilDay: until, reason: `${npc.name}背后的势力悬赏通缉你，悬红 ${bounty} 金` });
        }
        game.addGameLog(`⚔️ 你打退了上门寻仇的${npc.name}。其所在势力对你观感大降，并发布了对你的悬赏。`);
        return { ok: true, victory: true, message: `你击败了${npc.name}。对方负伤而归，其背后势力对你记恨在心（声望 -10），并悬赏通缉你。` };
      }
      const goldLost = Math.floor(hero.gold * 0.3);
      game.addGold(-goldLost);
      eco.setMood(npc.id, '狂热');
      game.addGameLog(`💥 上门寻仇的${npc.name}把你打翻在地，抢走了 ${goldLost} 金。`);
      return { ok: true, victory: false, goldLost, message: `你败给了${npc.name}，被抢走 ${goldLost} 金（30%），对方气焰更盛。` };
    }

    case 'pay': {
      const cost = payoffCost(visit);
      if (game.hero.gold < cost) {
        return { ok: false, message: `破财消灾需要 ${cost} 金，你手头不够。` };
      }
      game.addGold(-cost);
      npcStore.modifyNpcGold(npc.id, cost);
      npcStore.modifyNpcAffinity(npc.id, 10);
      eco.addFlag(npc.id, '破财消灾');
      const g = self.goal;
      if (g.kind === 'revenge') eco.patch(npc.id, { self: { ...self, goal: { ...g, progress: Math.max(0, g.progress - 40) } } });
      world.resolveVisit(visit.id);
      game.addGameLog(`💰 你破财消灾，付了 ${cost} 金，${npc.name}冷哼一声离去（好感 +10）。`);
      return { ok: true, goldLost: cost, message: `你付了 ${cost} 金，${npc.name}掂了掂银袋，转身走了。恩怨消减。` };
    }

    case 'avoid': {
      world.advanceDays(1);
      eco.setMood(npc.id, '厌恶');
      const until = dayNow() + 7;
      const c: Consequence = { id: `ban_${npc.id}_${until}`, kind: 'ban', scope: { npcId: npc.id }, value: 7, untilDay: until, reason: `你躲开了${npc.name}的上门，他拒绝再与你交易` };
      world.addConsequence(c);
      world.resolveVisit(visit.id);
      game.addGameLog(`🚪 你闭门躲了一天，${npc.name}骂骂咧咧地走了，扬言不再与你来往（7 天拒卖）。`);
      return { ok: true, message: `你躲了一天。${npc.name}记恨在心，7 天内拒绝与你交易。` };
    }

    case 'help': {
      const faction = self.factionId ?? FACTION_BY_NPC[npc.id];
      if (!faction) {
        return { ok: false, message: '你在本地无人可求助。' };
      }
      const rep = world.getFactionRep(faction);
      if (rep < 20) {
        return { ok: false, message: `你在该势力的声望不足（${rep}/20），无人愿为你出头。` };
      }
      world.addFactionRep(faction, -15);
      const until = dayNow() + 3;
      const c: Consequence = { id: `service_${faction}_${until}`, kind: 'service', scope: { factionId: faction }, value: 3, untilDay: until, reason: `${FACTION_NAME[faction] ?? faction} 出面替你摆平了 ${npc.name}` };
      world.addConsequence(c);
      world.resolveVisit(visit.id);
      game.addGameLog(`🤝 你托人出面，${FACTION_NAME[faction] ?? faction} 的人把${npc.name}劝走了（势力声望 -15）。`);
      return { ok: true, message: `你消耗了 15 点势力声望，对方看在你背后势力的面子上，悻悻离去。` };
    }

    default:
      return { ok: false, message: '你犹豫了一下。' };
  }
}
