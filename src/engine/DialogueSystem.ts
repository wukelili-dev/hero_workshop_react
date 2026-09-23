/**
 * DialogueSystem — 玩家方向盘层：闲聊话题 + 分支对话树 + 世界级效果结算
 *
 * 与 NpcDialogue（NPC 单句独白）互补：
 *  - ChatTopic：NPC 抛话题 → 玩家接 → NPC 回应（轻量，闲聊每次不同）
 *  - DialogueTree：有剧情目的的树，选项落 worldFlag / 改第三方关系
 */
import { chatTopicsFor, dialogueTreesFor } from '../data/dialogues';
import { matches, renderLine } from './NpcDialogue';
import { useGameStore } from '../store/useGameStore';
import { useNpcStore } from '../store/useNpcStore';
import { useNpcEcoStore } from '../store/useNpcEcoStore';
import { useWorldStore } from '../store/useWorldStore';
import { useInventoryStore } from '../store/useInventoryStore';
import { nameOf } from './NpcAutonomy';
import { factionName } from '../data/factions';
import type {
  ChatTopic, DialogueNode, DialogueOption, DialogueTree, NpcDefinition, WorldEffect,
} from '../types';

/** 结算一个世界级效果 */
export function applyWorldEffect(npcId: string, e: WorldEffect): void {
  const game = useGameStore.getState();
  const npcStore = useNpcStore.getState();
  const ecoStore = useNpcEcoStore.getState();
  const world = useWorldStore.getState();
  const day = Math.floor(world.day);

  if (e.affinity) npcStore.modifyNpcAffinity(npcId, e.affinity);
  if (e.mood) ecoStore.setMood(npcId, e.mood);
  if (e.bond) ecoStore.setBond(npcId, e.bond, day);
  if (e.setFlag) ecoStore.addFlag(npcId, e.setFlag, 1);
  if (e.addFlag) ecoStore.addFlag(npcId, e.addFlag, 1);
  if (e.gold) game.addGold(e.gold);
  if (e.item) useInventoryStore.getState().addNovelty(e.item.id, e.item.count);
  if (e.moral) game.changeMoral(e.moral);
  if (e.worldFlag) world.setWorldFlag(e.worldFlag);
  if (e.relationShift) ecoStore.addRelation(npcId, e.relationShift.target, e.relationShift.affinity);
  if (e.rumor) {
    ecoStore.addEvent({
      id: `rumor_${npcId}_${day}_${Date.now()}`,
      day, kind: 'rumor', actors: [npcId], text: e.rumor, aboutPlayer: true,
    });
  }
  if (e.factionRep) {
    world.addFactionRep(e.factionRep.factionId, e.factionRep.delta);
  }
  if (e.worldEvent) {
    game.addGameLog(`🌍 ${e.worldEvent}`);
  }
}

/** 结算一串效果 */
export function applyWorldEffects(npcId: string, effects?: WorldEffect[]): void {
  (effects ?? []).forEach((e) => applyWorldEffect(npcId, e));
}

// ═══════════ 闲聊话题 ═══════════

export interface TopicResult {
  topic: ChatTopic;
  /** NPC 抛出的话（已插值） */
  lines: string[];
  /** 可接的选项（已按条件过滤置灰） */
  options: DialogueOption[];
}

/** 从该 NPC 的话题池挑一个可用话题（加权，跳过 once/冷却/不满足条件的） */
export function pickTopic(npc: NpcDefinition): TopicResult | null {
  const topics = chatTopicsFor(npc.id);
  if (!topics.length) return null;

  const ecoStore = useNpcEcoStore.getState();
  const eco = ecoStore.getEco(npc.id);
  const day = Math.floor(useWorldStore.getState().day);

  const usable = topics.filter((t) => {
    if (t.once && eco.saidOnce.includes(t.id)) return false;
    if (t.cooldownDays !== undefined && (eco.cooldowns[t.id] ?? 0) > day) return false;
    return matches(t.when, npc);
  });
  if (!usable.length) return null;

  // 加权抽取：近期说过的话题降权 90%
  const total = usable.reduce((s, t) => s + Math.max(0.01, (t.weight ?? 2) * (eco.recentTopics.includes(t.id) ? 0.1 : 1)), 0);
  let r = Math.random() * total;
  let chosen = usable[usable.length - 1];
  for (const t of usable) {
    r -= Math.max(0.01, (t.weight ?? 2) * (eco.recentTopics.includes(t.id) ? 0.1 : 1));
    if (r <= 0) { chosen = t; break; }
  }

  const options = (chosen.options ?? []).map((o) => {
    const ok = matches(o.condition, npc);
    return ok ? o : { ...o, locked: true };
  });

  // 记账
  ecoStore.addRecentTopic(npc.id, chosen.id);
  if (chosen.cooldownDays) ecoStore.patch(npc.id, { cooldowns: { ...eco.cooldowns, [chosen.id]: day + chosen.cooldownDays } });
  if (chosen.once) ecoStore.patch(npc.id, { saidOnce: [...eco.saidOnce, chosen.id] });

  return {
    topic: chosen,
    lines: chosen.lines.map((l) => renderLine(npc, l)),
    options,
  };
}

/** 玩家接话题选项：结算效果，返回 NPC 回应 */
export function resolveTopicOption(npc: NpcDefinition, topic: ChatTopic, optionId: string): string | null {
  const opt = (topic.options ?? []).find((o) => o.id === optionId);
  if (!opt) return null;
  if (opt.condition && !matches(opt.condition, npc)) return null;

  applyWorldEffects(npc.id, opt.effects);
  if (opt.reply?.length) {
    const line = opt.reply[Math.floor(Math.random() * opt.reply.length)];
    return renderLine(npc, line);
  }
  return null;
}

// ═══════════ 分支对话树 ═══════════

export interface TreeSession {
  tree: DialogueTree;
  currentNodeId: string;
  /** 当前节点内容 */
  node: DialogueNode;
  /** 已选项 id（用于 once 隐藏） */
  chosenOnce: string[];
}

/** 情报节点：把 ${intel} 替换为真实 store 查询结果 */
export function resolveIntel(npc: NpcDefinition, node: DialogueNode, raw: string): string {
  if (!node.intel || !raw.includes('${intel}')) return raw;
  const ecoStore = useNpcEcoStore.getState();
  let result = '';
  if (node.intel.kind === 'relation') {
    const t = node.intel.target;
    const strength = ecoStore.relationStrength(npc.id, t);
    const targetName = nameOf(t);
    result = `${targetName}（关系强度 ${strength}）`;
  } else {
    const rep = useWorldStore.getState().getFactionRep(node.intel.target);
    result = `${factionName(node.intel.target)}（声望 ${rep}）`;
  }
  return raw.replace(/\$\{intel\}/g, result);
}

/** 打开一个分支树：取第一个满足条件的树，进入根节点 */
export function openTree(npc: NpcDefinition): TreeSession | null {
  const trees = dialogueTreesFor(npc.id);
  const tree = trees.find((t) => matches(t.when, npc));
  if (!tree) return null;
  return stepTree(npc, tree, tree.root, []);
}

/** 推进树：进入指定节点，结算 onEnter，返回节点与可见选项 */
export function stepTree(npc: NpcDefinition, tree: DialogueTree, nodeId: string, chosenOnce: string[]): TreeSession {
  const node = tree.nodes[nodeId] ?? tree.nodes[tree.root];
  applyWorldEffects(npc.id, node.onEnter);
  return { tree, currentNodeId: node.id, node, chosenOnce };
}

/** 玩家选树选项：结算 → 跳 next 或 end。返回新 session（或 null 结束） */
export function advanceTree(npc: NpcDefinition, session: TreeSession, optionId: string): { session: TreeSession | null; replies: string[]; done: boolean } {
  const opt = (session.node.options ?? []).find((o) => o.id === optionId);
  if (!opt) return { session, replies: [], done: false };
  if (opt.condition && !matches(opt.condition, npc)) return { session, replies: [], done: false };

  applyWorldEffects(npc.id, opt.effects);
  const replies = (opt.reply ?? []).map((l) => renderLine(npc, l));
  const nextChosen = opt.once ? [...session.chosenOnce, opt.id] : session.chosenOnce;

  if (opt.end || !opt.next) return { session: null, replies, done: true };
  return { session: stepTree(npc, session.tree, opt.next, nextChosen), replies, done: false };
}
