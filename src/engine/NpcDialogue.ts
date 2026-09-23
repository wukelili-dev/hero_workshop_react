/**
 * NpcDialogue — 条件驱动的对话引擎
 * 优先级：作者手写规则 > 模板组合（语气 × 渠道 × 状态）> 兜底
 */
import { CHANNEL_LINES, TONE_GREET } from '../data/npcEcology';
import { useGameStore } from '../store/useGameStore';
import { useNpcEcoStore, ecoDef } from '../store/useNpcEcoStore';
import { useNpcStore } from '../store/useNpcStore';
import { useWorldStore } from '../store/useWorldStore';
import type { NpcChannel, NpcCondition, NpcDefinition, NpcEffect, NpcVoice } from '../types';

export interface DialogueResult {
  text: string;
  ruleId: string;
  channel: NpcChannel;
  effects: NpcEffect[];
}

const DEFAULT_VOICE: NpcVoice = {
  tone: '市井',
  selfCall: '我',
  callPlayer: { stranger: '客官', acquaintance: '小友', close: '你', spouse: '当家的' },
};

function voiceOf(npc: NpcDefinition): NpcVoice {
  return ecoDef(npc.id).voice ?? DEFAULT_VOICE;
}

/** 财富档位：以 wallet.base 为基准浮动 */
export function wealthOf(npcId: string): 'poor' | 'normal' | 'rich' {
  const base = ecoDef(npcId).wallet?.base ?? 300;
  const gold = useNpcStore.getState().getNpcGold(npcId);
  if (gold >= base * 1.3) return 'rich';
  if (gold <= base * 0.5) return 'poor';
  return 'normal';
}

function inRange(v: number, r?: { min?: number; max?: number }): boolean {
  if (!r) return true;
  if (r.min !== undefined && v < r.min) return false;
  if (r.max !== undefined && v > r.max) return false;
  return true;
}

/** 条件求值（纯数据） */
export function matches(cond: NpcCondition | undefined, npc: NpcDefinition): boolean {
  if (!cond) return true;
  if (cond.chance !== undefined && Math.random() > cond.chance) return false;

  const ecoStore = useNpcEcoStore.getState();
  const npcStore = useNpcStore.getState();
  const game = useGameStore.getState();
  const eco = ecoStore.getEco(npc.id);
  const affinity = npcStore.getNpcAffinity(npc.id);
  const day = Math.floor(useWorldStore.getState().day);

  if (!inRange(affinity, cond.affinity)) return false;
  if (cond.bond && !cond.bond.includes(eco.bond)) return false;
  if (cond.mood && !cond.mood.includes(eco.mood)) return false;
  if (cond.flags) {
    for (const [k, r] of Object.entries(cond.flags)) {
      if (!inRange(eco.flags[k] ?? 0, r)) return false;
    }
  }
  if (cond.wealth && cond.wealth !== wealthOf(npc.id)) return false;
  if (cond.hasItem && !(ecoDef(npc.id).inventory ?? []).some((i) => i.itemId === cond.hasItem && i.count > 0)) return false;
  if (cond.missingItem && (ecoDef(npc.id).inventory ?? []).some((i) => i.itemId === cond.missingItem && i.count > 0)) return false;
  if (!inRange(game.hero.moralValue, cond.moral)) return false;
  if (cond.faction) {
    for (const [k, r] of Object.entries(cond.faction)) {
      if (!inRange((game.hero.factions as unknown as Record<string, number>)[k] ?? 0, r)) return false;
    }
  }
  if (cond.day && !inRange(day, cond.day)) return false;
  if (cond.playerLevel && !inRange(game.hero.level, cond.playerLevel)) return false;
  if (cond.relationAffinity && !inRange(npcStore.getNpcAffinity(cond.relationAffinity.target), cond.relationAffinity)) return false;
  if (cond.playerBondWith) {
    const other = ecoStore.getEco(cond.playerBondWith.target);
    if (!cond.playerBondWith.bond.includes(other.bond)) return false;
  }
  if (cond.worldFlag && !useWorldStore.getState().hasWorldFlag(cond.worldFlag)) return false;
  if (cond.notWorldFlag && useWorldStore.getState().hasWorldFlag(cond.notWorldFlag)) return false;
  if (cond.all && !cond.all.every((c) => matches(c, npc))) return false;
  if (cond.any && !cond.any.some((c) => matches(c, npc))) return false;
  if (cond.not && matches(cond.not, npc)) return false;
  return true;
}

function callName(voice: NpcVoice, affinity: number, bond: string): string {
  if (bond === '夫妻') return voice.callPlayer.spouse;
  if (affinity >= 60) return voice.callPlayer.close;
  if (affinity >= 25) return voice.callPlayer.acquaintance;
  return voice.callPlayer.stranger;
}

/** 渲染一行台词：替换 ${self}/${call}/${name}/${title}/${catch}/${day} */
export function renderLine(npc: NpcDefinition, raw: string): string {
  const eco = useNpcEcoStore.getState().getEco(npc.id);
  const affinity = useNpcStore.getState().getNpcAffinity(npc.id);
  const day = Math.floor(useWorldStore.getState().day);
  return interpolate(raw, npc, voiceOf(npc), affinity, eco.bond, day);
}

function interpolate(line: string, npc: NpcDefinition, voice: NpcVoice, affinity: number, bond: string, day: number): string {
  return line
    .replace(/\$\{self\}/g, voice.selfCall)
    .replace(/\$\{call\}/g, callName(voice, affinity, bond))
    .replace(/\$\{name\}/g, npc.name)
    .replace(/\$\{title\}/g, npc.title)
    .replace(/\$\{catch\}/g, voice.catchphrase ?? '……')
    .replace(/\$\{day\}/g, String(day));
}

interface Candidate {
  id: string;
  lines: string[];
  weight: number;
  effects?: NpcEffect[];
  cooldownDays?: number;
  once?: boolean;
}

function pick(list: Candidate[]): Candidate | null {
  if (list.length === 0) return null;
  const total = list.reduce((s, c) => s + Math.max(0.01, c.weight), 0);
  let r = Math.random() * total;
  for (const c of list) {
    r -= Math.max(0.01, c.weight);
    if (r <= 0) return c;
  }
  return list[list.length - 1];
}

/** 模板组合：渠道 × 状态档，命中越多组合越多 */
function templateCandidates(npc: NpcDefinition, channel: NpcChannel, affinity: number, bond: string, mood: string): Candidate[] {
  const pools = CHANNEL_LINES[channel];
  if (!pools) return [];
  const out: Candidate[] = [];
  const push = (lines: string[] | undefined, weight: number, tag: string) => {
    if (lines && lines.length) out.push({ id: `tpl_${channel}_${tag}`, lines, weight });
  };
  push(pools.base, 1, 'base');
  if (affinity >= 60) push(pools.warm, 3, 'warm');
  if (mood === '警惕' || mood === '厌恶' || affinity < 0) push(pools.cold, 3, 'cold');
  if (bond === '夫妻') push(pools.spouse, 4, 'spouse');
  const wealth = wealthOf(npc.id);
  if (wealth === 'rich') push(pools.rich, 2, 'rich');
  if (wealth === 'poor') push(pools.poor, 2, 'poor');
  if (channel === 'greet') push(TONE_GREET[voiceOf(npc).tone], 2, 'tone');
  return out;
}

/** 抽一句台词并结算效果 */
export function talk(npc: NpcDefinition, channel: NpcChannel = 'chat'): DialogueResult {
  const ecoStore = useNpcEcoStore.getState();
  const npcStore = useNpcStore.getState();
  const game = useGameStore.getState();
  const day = Math.floor(useWorldStore.getState().day);
  const eco = ecoStore.getEco(npc.id);
  const affinity = npcStore.getNpcAffinity(npc.id);
  const voice = voiceOf(npc);

  const authored: Candidate[] = (ecoDef(npc.id).dialogueRules ?? [])
    .filter((r) =>
      r.channel === channel
      && !(r.once && eco.saidOnce.includes(r.id))
      && (r.cooldownDays === undefined || (eco.cooldowns[r.id] ?? 0) <= day)
      && matches(r.when, npc))
    .map((r) => {
      const base = (r.weight ?? 2) * 3;
      // 近期说过的规则降权 90%，避免复读；once/冷却已在上层过滤
      const w = eco.recentTopics.includes(r.id) ? base * 0.1 : base;
      return { id: r.id, lines: r.lines, weight: w, effects: r.effects, cooldownDays: r.cooldownDays, once: r.once };
    });
  const authoredIds = new Set(authored.map((c) => c.id));

  const chosen = pick([...authored, ...templateCandidates(npc, channel, affinity, eco.bond, eco.mood)])
    ?? { id: 'fallback', lines: [`${voice.selfCall}没有多说什么。`], weight: 1 };

  const raw = chosen.lines[Math.floor(Math.random() * chosen.lines.length)];
  const text = interpolate(raw, npc, voice, affinity, eco.bond, day);

  ecoStore.addMemory(npc.id, channel, day, chosen.id);
  // 手写规则（非模板/兜底）记入近期话题，供下次降权
  if (authoredIds.has(chosen.id)) {
    ecoStore.addRecentTopic(npc.id, chosen.id);
  }
  if (chosen.cooldownDays) {
    ecoStore.patch(npc.id, { cooldowns: { ...eco.cooldowns, [chosen.id]: day + chosen.cooldownDays } });
  }
  if (chosen.once) ecoStore.patch(npc.id, { saidOnce: [...eco.saidOnce, chosen.id] });

  const effects = chosen.effects ?? [];
  for (const e of effects) {
    if (e.affinity) npcStore.modifyNpcAffinity(npc.id, e.affinity);
    if (e.mood) ecoStore.setMood(npc.id, e.mood);
    if (e.bond) ecoStore.setBond(npc.id, e.bond, day);
    if (e.moral) game.changeMoral(e.moral);
    if (e.goldPlayer) game.addGold(e.goldPlayer);
    if (e.setFlag) ecoStore.addFlag(npc.id, e.setFlag);
  }

  return { text, ruleId: chosen.id, channel, effects };
}
