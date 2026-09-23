/**
 * NpcEcology — 人物志：关系网 + 活人状态 + 深度互动
 * 左：关系网（SVG 节点连线）；右：档案（情绪/关系/财富/记忆）+ 动作 + 台词
 */
import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { getNpcsByMap, NPCS } from '../../data/npcs';
import { allRelationPairs, relationsOf } from '../../data/npcEcology';
import { useGameStore } from '../../store/useGameStore';
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

const GOAL_ZH: Record<string, string> = {
  wealth: '敛财', power: '精进', revenge: '寻仇', love: '求偶', fame: '扬名', wander: '云游',
};
const goalLabel = (g: { kind: string; target?: string }) => `${GOAL_ZH[g.kind] ?? g.kind}${g.target ? '·' + (NPCS.find((n) => n.id === g.target)?.name ?? g.target) : ''}`;

const REL_COLOR: Record<string, { c: string; dash?: string; label: string }> = {
  lover: { c: '#c1932f', label: '恋侣' },
  spouse: { c: '#b5382f', label: '夫妻' },
  parent: { c: '#8a6b2a', label: '亲长' },
  child: { c: '#8a6b2a', label: '晚辈' },
  sibling: { c: '#8a6b2a', dash: '4 3', label: '手足' },
  master: { c: '#4f7a8c', label: '师徒' },
  disciple: { c: '#4f7a8c', dash: '4 3', label: '师徒' },
  friend: { c: '#6b6252', label: '友朋' },
  colleague: { c: '#6b6252', dash: '3 3', label: '同僚' },
  rival: { c: '#6b4a7a', dash: '5 3', label: '旧怨' },
  enemy: { c: '#b5382f', dash: '6 4', label: '仇敌' },
};

const W = 420;
const H = 360;

export const NpcEcology: React.FC = () => {
  const mapId = useGameStore((s) => s.currentMapId);
  const day = Math.floor(useWorldStore((s) => s.day));
  const states = useNpcEcoStore((s) => s.states);
  const events = useNpcEcoStore((s) => s.events);
  const relationOverride = useNpcEcoStore((s) => s.relationOverride);
  const setBond = useNpcEcoStore((s) => s.setBond);
  const getNpcGold = useNpcStore((s) => s.getNpcGold);
  const getNpcAffinity = useNpcStore((s) => s.getNpcAffinity);
  const getEco = useNpcEcoStore((s) => s.getEco);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [line, setLine] = useState<string | null>(null);
  const [giftFor, setGiftFor] = useState<string | null>(null);

  const locals = useMemo(() => getNpcsByMap(mapId), [mapId]);
  const nodes = useMemo(() => {
    const ids = new Set(locals.map((n) => n.id));
    allRelationPairs().forEach(({ a, b }) => {
      if (ids.has(a) || ids.has(b)) { ids.add(a); ids.add(b); }
    });
    return NPCS.filter((n) => ids.has(n.id));
  }, [locals]);

  const pos = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    nodes.forEach((n, i) => {
      const a = (i / Math.max(1, nodes.length)) * Math.PI * 2 - Math.PI / 2;
      map.set(n.id, { x: W / 2 + Math.cos(a) * (W / 2 - 46), y: H / 2 + Math.sin(a) * (H / 2 - 40) });
    });
    return map;
  }, [nodes]);

  const links = useMemo(
    () => allRelationPairs().filter(({ a, b }) => pos.has(a) && pos.has(b)),
    [pos]
  );

  const sel = selectedId ? locals.find((n) => n.id === selectedId) ?? nodes.find((n) => n.id === selectedId) ?? null : null;
  const eco = sel ? getEco(sel.id) : null;
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
    <div className="flex h-full min-h-0 gap-3">
      {/* 关系网 */}
      <div className="ink-panel ink-frame min-w-0 flex-1 overflow-auto p-2">
        <div className="mb-1 flex items-center gap-2">
          <h3 className="ink-title text-[15px]">人物志 · 关系网</h3>
          <span className="ink-tag ml-auto">{nodes.length} 人 · 第 {day} 天</span>
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} className="inkmap-svg">
          {links.map(({ a, b, rel }) => {
            const pa = pos.get(a);
            const pb = pos.get(b);
            if (!pa || !pb) return null;
            const st = REL_COLOR[rel.type] ?? REL_COLOR.friend;
            const s = strengthOf(a, b);
            return (
              <line
                key={`${a}-${b}`}
                x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y}
                stroke={s < -20 ? '#b5382f' : st.c}
                strokeWidth={s < -20 ? 2.4 : 1.4}
                strokeDasharray={st.dash}
                opacity={0.85}
              />
            );
          })}
          {Array.from(pos.entries()).map(([id, p]) => {
            const npc = nodes.find((n) => n.id === id);
            const st = states[id];
            const isSel = id === selectedId;
            const enemy = st?.bond === '仇敌';
            return (
              <g key={id} onClick={() => setSelectedId(id)} style={{ cursor: 'pointer' }}>
                <circle cx={p.x} cy={p.y} r={isSel ? 9 : 7} fill={enemy ? '#b5382f' : '#fdfbf4'} stroke="#8a7a63" strokeWidth={isSel ? 2.4 : 1.2} />
                <text x={p.x} y={p.y + 21} textAnchor="middle" fontSize="11" fill="#3f3527" fontFamily="KaiTi, STKaiti, serif">
                  {npc?.name ?? id}
                </text>
                {st && st.mood !== '平静' && (
                  <text x={p.x} y={p.y - 13} textAnchor="middle" fontSize="9" fill="#8a6b2a">{st.mood}</text>
                )}
              </g>
            );
          })}
        </svg>
        <div className="mt-1 flex flex-wrap gap-1 text-[11px] text-[#6b6252]">
          {Object.entries(REL_COLOR).slice(0, 7).map(([k, v]) => (
            <span key={k} className="inline-flex items-center gap-1">
              <i className="inline-block h-[2px] w-4" style={{ background: v.c }} />
              {v.label}
            </span>
          ))}
        </div>
      </div>

      {/* 档案 + 互动 */}
      <div className="ink-panel flex w-[300px] flex-shrink-0 flex-col overflow-y-auto">
        {!sel || !eco ? (
          <div className="p-3 text-xs text-[#9c917b]">点左侧关系网上的姓名，查看此人的活人状态与可做的事。</div>
        ) : (
          <>
            <div className="ink-head">
              <h3 className="ink-title text-[15px]">{sel.name}</h3>
              <span className="ink-tag ml-auto">{sel.title}</span>
            </div>
            <div className="p-3 text-xs text-[#6b6252]">
              <div className="flex flex-wrap gap-1">
                <span className="ink-tag">情绪 {eco.mood}</span>
                <span className="ink-tag">关系 {eco.bond}</span>
                <span className="ink-tag">财富 {wealthOf(sel.id)}（{getNpcGold(sel.id)} 金）</span>
                <span className="ink-tag">好感 {Math.round(getNpcAffinity(sel.id))}</span>
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
                关系：{relationsOf(sel.id).length ? relationsOf(sel.id).map((r) => `${NPCS.find((n) => n.id === r.target)?.name ?? r.target}（${REL_COLOR[r.type]?.label ?? r.type}·${Math.round(strengthOf(sel.id, r.target))}）`).join('，') : '暂无关联人物'}
              </div>
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
              <button className="ink-btn text-xs" onClick={() => run(() => exposeSecretNpc(sel))}>揭发</button>
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
          </>
        )}

        {/* 城中见闻 */}
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
            {events.slice(0, 5).map((e) => (
              <div key={e.id} className={e.aboutPlayer ? 'text-[#8f2b23]' : ''}>
                第{e.day}天 · {e.text}
              </div>
            ))}
            {events.length === 0 && <div className="text-[#9c917b]">暂时风平浪静。</div>}
          </div>
        </div>
      </div>
    </div>
  );
};
