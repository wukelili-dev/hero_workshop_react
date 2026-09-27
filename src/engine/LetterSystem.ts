/**
 * LetterSystem — 书信投递与回信（沉浸感 I4）
 *
 * 日推进时扫描 LETTERS，条件命中且未投递过 → 投递到 useWorldStore.letters。
 * 回信效果统一走 DialogueSystem.applyWorldEffect()。
 *
 * 依赖方向：LetterSystem 单向依赖 useWorldStore / useNpcEcoStore / Chronicle / DialogueSystem，无环。
 */
import { LETTERS } from '../data/letters';
import { NPCS } from '../data/npcs';
import { useWorldStore } from '../store/useWorldStore';
import { useGameStore } from '../store/useGameStore';
import { useNpcEcoStore } from '../store/useNpcEcoStore';
import { countTags } from './Chronicle';
import { applyWorldEffect } from './DialogueSystem';
import type { LetterDef, LetterInstance } from '../types';

function letterConditionMet(def: LetterDef, day: number): boolean {
  const w = def.when;
  const eco = useNpcEcoStore.getState().getEco(def.fromNpcId);
  const npc = NPCS.find((n) => n.id === def.fromNpcId);

  if (w.bond && !w.bond.includes(eco.bond)) return false;
  if (w.tags) {
    for (const [tag, r] of Object.entries(w.tags)) {
      if (countTags(tag) < (r.min ?? 1)) return false;
    }
  }
  if (w.daysSinceBond && eco.bondedDay !== undefined) {
    if (day - eco.bondedDay < w.daysSinceBond.min) return false;
  }
  // 无 fromNpc 的 NPC（如通用模板）跳过
  if (def.fromNpcId && !npc) return false;
  return true;
}

/** 日推进扫描：条件命中且未投递 → 投递 */
export function scanLetters(day: number): void {
  const store = useWorldStore.getState();
  const delivered = new Set(store.letters.map((l) => l.defId));

  const toAdd: LetterInstance[] = [];
  for (const def of LETTERS) {
    if (def.once && delivered.has(def.id)) continue;
    if (letterConditionMet(def, day)) {
      toAdd.push({ defId: def.id, fromNpcId: def.fromNpcId, day, read: false, repliedOptionIds: [] });
    }
  }
  if (toAdd.length > 0) {
    useWorldStore.setState({ letters: [...store.letters, ...toAdd] });
    const game = useGameStore.getState();
    for (const l of toAdd) {
      const npc = NPCS.find((n) => n.id === l.fromNpcId);
      game.addGameLog(`📬 ${npc?.name ?? '神秘人'} 给你寄来一封信。`);
    }
  }
}

/** 到期（可读）的信件 */
export function dueLetters(): LetterInstance[] {
  return useWorldStore.getState().letters;
}

/** 未读数量（供红点） */
export function unreadCount(): number {
  return useWorldStore.getState().letters.filter((l) => !l.read).length;
}

/** 标记已读 */
export function markRead(letterId: string): void {
  useWorldStore.setState((s) => ({
    letters: s.letters.map((l) => (l.defId === letterId ? { ...l, read: true } : l)),
  }));
}

/** 回信：结算效果，返回回信文案 */
export function replyLetter(defId: string, optionId: string): string {
  const def = LETTERS.find((l) => l.id === defId);
  if (!def) return '信已不知所踪。';
  const opt = def.options?.find((o) => o.id === optionId);
  if (!opt) return '没有这个选择。';

  // 效果统一走 applyWorldEffect（以发信 NPC 为执行主体）
  for (const e of opt.effects) {
    applyWorldEffect(def.fromNpcId, e);
  }

  useWorldStore.setState((s) => ({
    letters: s.letters.map((l) =>
      l.defId === defId ? { ...l, repliedOptionIds: [...l.repliedOptionIds, optionId] } : l
    ),
  }));

  return opt.reply;
}
