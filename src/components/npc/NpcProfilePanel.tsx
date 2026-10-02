/**
 * NpcProfilePanel — 单个 NPC 的档案 + 互动（从人物志关系网中独立出来）
 * 无关系网 SVG，只展示选中 NPC 的活人状态、列传、动作按钮、台词。
 * 供「左栏点 NPC → 主视图打开」使用。
 */
import React, { useState } from 'react';
import { toast } from 'sonner';
import { NPCS } from '../../data/npcs';
import { NPC_SECRETS, relationsOf } from '../../data/npcEcology';
import { useNpcEcoStore } from '../../store/useNpcEcoStore';
import { useNpcStore } from '../../store/useNpcStore';
import { useWorldStore } from '../../store/useWorldStore';
import { wealthOf } from '../../engine/NpcDialogue';
import {
  attackNpc, befriendNpc, challengeNpc, exposeSecretNpc, giftNpc, inspectNpc, proposeNpc, sowDiscordNpc, stealNpc, talkNpc, wedNpc,
} from '../../engine/NpcSystem';
import { GiftModal } from './GiftModal';
import { factionName } from '../../data/factions';
import { allFactionRep } from '../../engine/FactionSystem';
import { query as queryChronicle } from '../../engine/Chronicle';
import { credibilityText } from '../../engine/Rumor';
import { biographyOf } from '../../data/biographies';

const GOAL_ZH: Record<string, string> = {
  wealth: '敛财', power: '精进', revenge: '寻仇', love: '求偶', fame: '扬名', wander: '云游',
};
const goalLabel = (g: { kind: string; target?: string }) => `${GOAL_ZH[g.kind] ?? g.kind}${g.target ? '·' + (NPCS.find((n) => n.id === g.target)?.name ?? g.target) : ''}`;

const REL_LABEL: Record<string, string> = {
  lover: '恋侣', spouse: '夫妻', parent: '亲长', child: '晚辈', sibling: '手足',
  master: '师徒', disciple: '师徒', friend: '友朋', colleague: '同僚', rival: '旧怨', enemy: '仇敌',
};

export const NpcProfilePanel: React.FC<{ npcId: string; onBack?: () => void }> = ({ npcId, onBack }) => {
  const day = Math.floor(useWorldStore((s) => s.day));
  const relationOverride = useNpcEcoStore((s) => s.relationOverride);
  const setBond = useNpcEcoStore((s) => s.setBond);
  const events = useNpcEcoStore((s) => s.events);
  const getNpcGold = useNpcStore((s) => s.getNpcGold);
  const getNpcAffinity = useNpcStore((s) => s.getNpcAffinity);
  const getEco = useNpcEcoStore((s) => s.getEco);

  const [line, setLine] = useState<string | null>(null);
  const [giftFor, setGiftFor] = useState<string | null>(null);

  const sel = NPCS.find((n) => n.id === npcId);
  const eco = sel ? getEco(sel.id) : null;
  if (!sel || !eco) {
    return <div className="p-3 text-xs text-[#9c917b]">未找到此人。</div>;
  }

  const strengthOf = (a: string, b: string) => {
    const o = relationOverride[`${a}->${b}`];
    if (typeof o === 'number') return o;
    return relationsOf(a).find((r) => r.target === b)?.strength ?? 0;
  };

  const run = (fn: () => unknown) => {
    const res = fn() as { message?: string } | null;
    const msg = typeof res?.message === 'string' ? res.message : '对方没有回答。';
    setLine(msg);
    toast(msg, { icon: '📜' });
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto">
      <div className="ink-head flex-shrink-0">
        {onBack && (
          <button type="button" className="ink-btn text-xs" onClick={onBack}>← 返回</button>
        )}
        <h3 className="ink-title text-[15px]">{sel.name}</h3>
        <span className="ink-tag ml-auto">{sel.title}</span>
      </div>

      <div className="p-3 text-xs text-[#6b6252]">
        <div className="flex flex-wrap gap-1">
          <span className="ink-tag">情绪 {eco.mood}</span>
          <span className="ink-tag">关系 {eco.bond}</span>
          <span className="ink-tag">财富 {wealthOf(sel.id)}（{getNpcGold(sel.id)} 金）</span>
          <span className="ink-tag">好感 {Math.round(getNpcAffinity(sel.id))}</span>
          <span className="ink-tag">信誉 {credibilityText(sel.id)}</span>
          {NPC_SECRETS[sel.id] && (
            <span className="ink-tag">{(eco.flags['被揭发'] ?? 0) > 0 ? '把柄已揭' : '有把柄'}</span>
          )}
          {eco.self.factionId && <span className="ink-tag">势力 {factionName(eco.self.factionId)}</span>}
        </div>
        {eco.self && (
          <div className="mt-2 grid grid-cols-2 gap-x-2 text-[11px] text-[#6b6252]">
            <span>战力 {eco.self.power}</span>
            <span>家资 {eco.self.assets}</span>
            <span>伤势 {eco.self.injuries}</span>
            <span>声望 {eco.self.reputation}</span>
            <span className="col-span-2">目标 {goalLabel(eco.self.goal)}（{eco.self.goal.progress}/100）</span>
          </div>
        )}
        {eco.memory.length > 0 && (
          <div className="mt-2 border-l-2 border-[#8a7a63]/50 pl-2 leading-relaxed">
            最近：{eco.memory.slice(0, 3).map((m) => m.key).join('、')}
          </div>
        )}
        {Object.keys(eco.flags).length > 0 && (
          <div className="mt-1 text-[11px] text-[#9c917b]">
            记痕：{Object.entries(eco.flags).map(([k, v]) => `${k}×${v}`).join(' ')}
          </div>
        )}
        <div className="mt-2 text-[11px] text-[#9c917b]">
          关系：{relationsOf(sel.id).length ? relationsOf(sel.id).map((r) => `${NPCS.find((n) => n.id === r.target)?.name ?? r.target}（${REL_LABEL[r.type] ?? r.type}·${Math.round(strengthOf(sel.id, r.target))}）`).join('，') : '暂无关联人物'}
        </div>
        <BiographySection subjectId={sel.id} bond={eco.bond} />
      </div>

      <div className="flex flex-wrap gap-1.5 border-t border-[#8a7a63]/40 px-3 py-2">
        <button className="ink-btn text-xs" onClick={() => run(() => talkNpc(sel, 'greet'))}>问候</button>
        <button className="ink-btn text-xs" onClick={() => run(() => talkNpc(sel, 'chat'))}>闲聊</button>
        <button className="ink-btn text-xs" onClick={() => run(() => talkNpc(sel, 'rumor'))}>打听</button>
        <button className="ink-btn text-xs" onClick={() => run(() => inspectNpc(sel))}>查看</button>
        <button className="ink-btn text-xs" onClick={() => setGiftFor(sel.id)}>送礼</button>
        <button className="ink-btn text-xs" onClick={() => run(() => challengeNpc(sel))}>切磋</button>
        <button className="ink-btn text-xs" onClick={() => run(() => stealNpc(sel))}>偷窃</button>
        <button className="ink-btn text-xs" onClick={() => run(() => befriendNpc(sel))}>结交</button>
        <button className="ink-btn text-xs" onClick={() => run(() => proposeNpc(sel))}>求婚</button>
        <button className="ink-btn text-xs" onClick={() => run(() => wedNpc(sel))}>成婚</button>
        {NPC_SECRETS[sel.id] && (eco.flags['被揭发'] ?? 0) === 0 && (
          <button className="ink-btn text-xs" onClick={() => run(() => exposeSecretNpc(sel))}>揭发</button>
        )}
        <button className="ink-btn text-xs" onClick={() => run(() => attackNpc(sel))}>攻击</button>
        <button className="ink-btn text-xs" onClick={() => run(() => giftNpc(sel, 20))}>赠金 20</button>
        {relationsOf(sel.id)[0] && (
          <button
            className="ink-btn text-xs"
            onClick={() => {
              const other = NPCS.find((n) => n.id === relationsOf(sel.id)[0].target);
              if (other) run(() => sowDiscordNpc(sel, other));
            }}
          >
            挑拨
          </button>
        )}
      </div>

      {line && (
        <div className="mx-3 mb-2 border-l-2 border-[#b5382f]/60 bg-[#f3efe4] p-2 text-xs leading-relaxed text-[#3f3527]">
          {line}
        </div>
      )}
      {eco.bond !== '陌生' && (
        <button className="ink-btn mx-3 mb-2 text-xs" onClick={() => { setBond(sel.id, '陌生', day); toast('关系已重置（调试用）'); }}>
          重置关系（调试）
        </button>
      )}

      {giftFor && (() => {
        const target = NPCS.find((n) => n.id === giftFor);
        return target ? <GiftModal npc={target} onClose={() => setGiftFor(null)} /> : null;
      })()}

      <div className="mt-auto border-t border-[#8a7a63]/40 p-3">
        <div className="ink-title mb-1 text-[13px]">势力声望</div>
        <div className="space-y-1 text-[11px] leading-relaxed text-[#6b6252]">
          {allFactionRep().map(({ def, rep }) => (
            <div key={def.id} className="flex items-center justify-between">
              <span>{def.name}</span>
              <span className={rep <= -60 ? 'text-[#8f2b23]' : rep <= -30 ? 'text-[#8a6b2a]' : rep >= 40 ? 'text-[#4f7a8c]' : ''}>{rep}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-[#8a7a63]/40 p-3">
        <div className="ink-title mb-1 text-[13px]">城中见闻</div>
        <div className="space-y-1 text-[11px] leading-relaxed text-[#6b6252]">
          {queryChronicle({ minImportance: 2, limit: 4 }).map((c) => (
            <div key={c.id} className="text-[#8f2b23]">第{c.day}天 · {c.text}</div>
          ))}
          {events.slice(0, 5).map((e) => (
            <div key={e.id} className={e.aboutPlayer ? 'text-[#8f2b23]' : ''}>第{e.day}天 · {e.text}</div>
          ))}
          {queryChronicle({ minImportance: 2, limit: 4 }).length === 0 && events.length === 0 && (
            <div className="text-[#9c917b]">暂时风平浪静。</div>
          )}
        </div>
      </div>
    </div>
  );
};

/** NPC 列传段：unlock 未满足显示"尚未知悉此人底细"，满足则显示 body */
const BiographySection: React.FC<{ subjectId: string; bond: string }> = ({ subjectId, bond }) => {
  const bio = biographyOf(subjectId);
  if (!bio) return null;
  const unlocked = (() => {
    const u = bio.unlock;
    if (u.bond && !u.bond.includes(bond as never)) return false;
    if (u.worldFlag && !useWorldStore.getState().hasWorldFlag(u.worldFlag)) return false;
    return true;
  })();
  if (!unlocked) {
    return <div className="mt-2 border-t border-[#8a7a63]/40 pt-1.5 text-[11px] italic text-[#9c917b]">尚未知悉此人底细。</div>;
  }
  return (
    <div className="mt-2 border-t border-[#8a7a63]/40 pt-1.5">
      <div className="ink-title text-[12px]">{bio.title}</div>
      <div className="mt-1 space-y-1 text-[11px] leading-relaxed text-[#6b6252]">
        {bio.body.map((para, i) => <div key={i}>{para}</div>)}
      </div>
    </div>
  );
};
