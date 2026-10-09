/**
 * BattleModal — 手动战斗界面（C8 招式对决 / B6 重做）
 *
 * 逐回合选招。**界面不自己算任何伤害**：血条、怒气、减控率、技能倍率全部读
 * engine/Battle 与 engine/BattleCore 的出口，保证"看到的"和"结算的"是同一套数字。
 *
 * B6 相对 B4 之前的变化：
 *   - 武学从"一排光秃秃的按钮"变成技能卡：标出怒气档、倍率、段数与附带状态
 *   - 状态从纯文字标签变成「图标 + 层数」，一眼能看出身上挂着什么
 *   - 伤害飘字：每次结算在受击方面板上浮一下数字，不用去战报里翻
 *   - Boss 第二阶段（狂暴）显式标出，配合 B5 的换招
 *   - 动作区补齐 B4 的三种新选择：蓄力 / 用药 / 队友指令
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FaBolt, FaHeart, FaFire, FaShieldHalved, FaSackDollar } from 'react-icons/fa6';
import { useBattleStore } from '../../store/useBattleStore';
import { useInventoryStore } from '../../store/useInventoryStore';
import { potionHealOf } from '../../store/useGameStore';
import { availableArts, type BattleState } from '../../engine/Battle';
import { RAGE_MAX, STATUS_NAME, controlResistRate, isStunned } from '../../engine/BattleCore';
import { RAGE_HEAVY, RAGE_LIGHT, RAGE_ULT } from '../../data/skills';
import type { SkillDef, StatusEffectId } from '../../types';

const pct = (v: number, max: number) => `${Math.max(0, Math.min(100, (v / Math.max(1, max)) * 100)).toFixed(1)}%`;

/** 状态图标（B6）：图标比文字更快认出"我身上挂了个什么" */
const STATUS_ICON: Record<StatusEffectId, string> = {
  bleed: '🩸', poison: '☠️', sunder: '💥', shield: '🛡️',
  stun: '⚡', haste: '💨', guard: '🧱', rally: '🔥',
};

const KIND_LABEL: Record<SkillDef['kind'], string> = {
  strike: '单攻', burst: '爆发', area: '群伤', drain: '吸血', guard: '护体', support: '辅助',
};

const BONUS_LABEL: Record<NonNullable<SkillDef['bonus']>[number]['when'], string> = {
  targetBleeding: '对流血',
  targetPoisoned: '对中毒',
  targetSundered: '对破防',
  targetBoss: '对大妖',
  targetDemon: '对妖魔',
};

/** 武学倍率文案：攻击型写倍率，护体/辅助写百分比效果 */
const powerText = (a: ReturnType<typeof availableArts>[number]): string => {
  if (a.kind === 'guard' || a.kind === 'support') return `${Math.round(a.power * 100)}%`;
  return `×${a.power.toFixed(2)}`;
};

const Bar: React.FC<{ value: number; max: number; tone: string; label: string; icon: React.ReactNode }> = ({ value, max, tone, label, icon }) => (
  <div className="flex items-center gap-1.5 text-[11px] text-[#3f3527]">
    <span className="flex w-4 justify-center">{icon}</span>
    <span className="w-12 shrink-0">{label}</span>
    <span className="relative h-2 flex-1 overflow-hidden rounded-sm border border-[#8a7a63]/50 bg-[#e9e2d2]">
      <span className={`absolute inset-y-0 left-0 ${tone}`} style={{ width: pct(value, max) }} />
    </span>
    <span className="w-20 shrink-0 text-right tabular-nums">{Math.round(value)}/{Math.round(max)}</span>
  </div>
);

/** 状态图标 + 层数（B6） */
const StatusTags: React.FC<{ c: BattleState['hero'] }> = ({ c }) => {
  if (c.vars.shield <= 0 && c.vars.statuses.length === 0) return null;
  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {c.vars.shield > 0 && (
        <span className="ink-status ink-tag" title={`护盾 ${Math.round(c.vars.shield)}`}>
          🛡️ 护盾 {Math.round(c.vars.shield)}
        </span>
      )}
      {c.vars.statuses.map((s) => (
        <span key={s.id} className="ink-status ink-tag" title={STATUS_NAME[s.id] ?? s.id}>
          {STATUS_ICON[s.id] ?? '•'} {STATUS_NAME[s.id] ?? s.id}
          {s.stacks > 1 && <b className="ml-0.5">×{s.stacks}</b>}
        </span>
      ))}
    </div>
  );
};

/** 伤害飘字（B6）：key 随战报长度变化 → 重新挂载 → 动画重播，不需要定时器 */
const DamageFloat: React.FC<{ log?: { damage: number; isCrit: boolean }; k: number }> = ({ log, k }) => {
  if (!log || log.damage <= 0) return null;
  return (
    <span
      key={k}
      className="ink-float pointer-events-none absolute right-2 top-8 z-10 select-none tabular-nums"
      style={{
        color: '#b5382f',
        fontFamily: 'var(--font-kai)',
        fontSize: log.isCrit ? '1.35rem' : '1.05rem',
        textShadow: '0 1px 0 rgba(250,246,234,0.9)',
      }}
    >
      -{log.damage}{log.isCrit ? ' 暴' : ''}
    </span>
  );
};

export const BattleModal: React.FC = () => {
  const battle = useBattleStore((s) => s.battle);
  const act = useBattleStore((s) => s.act);
  const close = useBattleStore((s) => s.close);
  const slots = useInventoryStore((s) => s.slots);
  const logRef = useRef<HTMLDivElement>(null);
  const [panel, setPanel] = useState<null | 'item' | 'order'>(null);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [battle?.logs.length, battle?.over]);

  // 背包里能回血的药（B4 的"战斗中用药"要用真实库存，不是凭空回血）
  const potions = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of slots) {
      if (s && s.type === 'novelty' && potionHealOf(s.id) > 0) map.set(s.id, (map.get(s.id) ?? 0) + s.qty);
    }
    return [...map.entries()].map(([id, qty]) => ({ id, qty, heal: potionHealOf(id) }));
  }, [slots]);

  if (!battle) return null;

  const arts = availableArts(battle);
  const rage = battle.hero.vars.rage;
  const stunned = isStunned(battle.hero);

  // 最近一次伤害落在谁身上 → 飘在谁的面板上
  const lastDamage = [...battle.logs].reverse().find((l) => l.damage > 0);
  const floatKey = battle.logs.length;

  const tiered = [
    { cost: RAGE_LIGHT, label: '轻招' },
    { cost: RAGE_HEAVY, label: '中招' },
    { cost: RAGE_ULT, label: '绝招' },
  ]
    .map((t) => ({ ...t, list: arts.filter((a) => a.cost === t.cost) }))
    .filter((t) => t.list.length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#3f3527]/45 p-3">
      <div className="ink-panel ink-frame flex max-h-full w-full max-w-2xl flex-col p-4">
        {/* 标题 */}
        <div className="mb-3 flex flex-wrap items-center gap-2 border-b border-[#8a7a63]/40 pb-2">
          <span className="ink-title text-lg">招式对决</span>
          <span className="ink-tag">第 {battle.round} 回合</span>
          <span className="ink-tag">{battle.heroFirst ? '你身法更快' : `${battle.foe.name} 更快`}</span>
          {battle.charged && <span className="ink-tag" style={{ color: '#8a6b2a' }}>⚡ 蓄势待发</span>}
          <span className="ml-auto text-xs text-[#9c917b]">{battle.monster.name} · Lv.{battle.monster.level ?? 1}</span>
        </div>

        {/* 双方状态 */}
        <div className="grid gap-3 md:grid-cols-2">
          <div className="relative border border-[#8a7a63]/40 p-2">
            <div className="ink-title mb-1 text-sm">勇者</div>
            <Bar value={battle.heroHp} max={battle.heroMaxHp} tone="bg-[#b5382f]" label="生命" icon={<FaHeart className="text-[#b5382f]" />} />
            <Bar value={rage} max={RAGE_MAX} tone="bg-[#b08a2e]" label="怒气" icon={<FaBolt className="text-[#b08a2e]" />} />
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-[#6b6252]">
              <span>攻 {Math.round(battle.hero.derived.atk)}</span>
              <span>防 {Math.round(battle.hero.derived.def)}</span>
              <span>命中 {(battle.hero.derived.hit * 100).toFixed(0)}%</span>
              <span>闪避 {(battle.hero.derived.dodge * 100).toFixed(0)}%</span>
              <span>暴击 {(battle.hero.derived.crit * 100).toFixed(0)}%</span>
              <span>破甲 {Math.round(battle.hero.derived.pen)}</span>
              <span title="韧性带来的控制抵抗率">减控 {(controlResistRate(battle.hero) * 100).toFixed(0)}%</span>
            </div>
            <StatusTags c={battle.hero} />
            <DamageFloat log={lastDamage?.defender === '勇者' ? lastDamage : undefined} k={floatKey} />
          </div>

          <div className="relative border border-[#8a7a63]/40 p-2">
            <div className="ink-title mb-1 flex items-center gap-2 text-sm">
              {battle.foe.name}
              {battle.foe.isBoss && <span className="ink-tag gold">妖将</span>}
              {battle.foePhase === 2 && (
                <span className="ink-status ink-tag" style={{ color: '#8f2b23', borderColor: '#b5382f' }}>
                  <FaFire /> 狂暴
                </span>
              )}
            </div>
            <Bar value={battle.foeHp} max={battle.foeMaxHp} tone="bg-[#8a7a63]" label="生命" icon={<FaHeart className="text-[#b5382f]" />} />
            <Bar value={battle.foe.vars.rage} max={RAGE_MAX} tone="bg-[#8a7a63]" label="怒气" icon={<FaBolt className="text-[#b08a2e]" />} />
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-[#6b6252]">
              <span>攻 {Math.round(battle.foe.derived.atk)}</span>
              <span>防 {Math.round(battle.foe.derived.def)}</span>
              {battle.foe.vars.rage >= RAGE_LIGHT && <span className="text-[#b5382f]">怒气已够，随时出招</span>}
            </div>
            <StatusTags c={battle.foe} />
            <DamageFloat log={lastDamage?.defender !== '勇者' ? lastDamage : undefined} k={floatKey} />
          </div>
        </div>

        {/* 战报 */}
        <div ref={logRef} className="mt-3 max-h-40 min-h-24 overflow-y-auto border border-[#8a7a63]/30 bg-[#faf6ea]/60 p-2 text-xs leading-relaxed">
          {battle.logs.map((l, i) => (
            <div key={i} className={l.defender === '勇者' ? 'text-[#b5382f]' : 'text-[#3f3527]'}>
              <span className="mr-1 text-[#9c917b]">{l.round}.</span>
              {l.description}
            </div>
          ))}
        </div>

        {/* 操作区 */}
        {!battle.over ? (
          <div className="mt-3">
            {stunned && (
              <div className="mb-2 border border-[#b5382f]/40 bg-[#b5382f]/5 px-2 py-1 text-[11px] text-[#b5382f]">
                勇者身中麻痹，本回合递不出手（队友仍会协战）。
              </div>
            )}

            {/* 武学：按怒气档分组，卡片上标倍率/段数/附带状态 */}
            <div className="mb-1 flex items-center gap-2">
              <span className="ink-title text-[11px]">武学</span>
              <span className="ink-rule flex-1" />
              <span className="text-[10px] text-[#9c917b]">
                怒气 {Math.round(rage)}/{RAGE_MAX} · 出手 +15、受击 +10、防御 +20
              </span>
            </div>
            {tiered.map((t) => (
              <div key={t.cost} className="mb-1.5">
                <div className="mb-0.5 flex items-center gap-1.5">
                  <span className={`text-[10px] ${rage >= t.cost ? 'text-[#b08a2e]' : 'text-[#9c917b]'}`}>
                    {t.label} · 怒 {t.cost}
                  </span>
                  <span className="ink-rule flex-1" />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {t.list.map((a) => {
                    const usable = a.ready && !stunned;
                    return (
                      <button
                        key={a.id}
                        type="button"
                        disabled={!usable}
                        onClick={() => act({ kind: 'art', artId: a.id })}
                        title={a.desc}
                        className={`flex min-w-[104px] flex-col items-start rounded-sm border px-2 py-1 text-left transition-colors ${
                          usable
                            ? 'border-[#8a7a63] bg-[#faf6ea]/90 hover:bg-[#e9e2d2]'
                            : 'cursor-not-allowed border-[#8a7a63]/40 opacity-45'
                        }`}
                      >
                        <span className="flex w-full items-baseline gap-1">
                          <span className="ink-title text-xs">{a.name}</span>
                          {a.hits > 1 && <span className="text-[9px] text-[#9c917b]">{a.hits} 段</span>}
                        </span>
                        <span className="text-[9px] text-[#9c917b]">
                          {KIND_LABEL[a.kind]} {powerText(a)}
                        </span>
                        {(a.apply.length > 0 || a.bonus) && (
                          <span className="mt-0.5 flex flex-wrap gap-0.5">
                            {a.apply.map((s) => (
                              <span key={s} className="ink-status text-[9px]" style={{ color: '#6b6252' }}>
                                {STATUS_ICON[s]} {STATUS_NAME[s]}
                              </span>
                            ))}
                            {a.bonus?.map((b, i) => (
                              <span key={i} className="text-[9px]" style={{ color: '#6b4a7a' }}>
                                {BONUS_LABEL[b.when]} ×{b.mult}
                              </span>
                            ))}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* 基础动作 + B4 新增选择 */}
            <div className="mt-2 flex flex-wrap gap-1.5">
              <button type="button" disabled={stunned} className="ink-btn-seal px-3 py-1 text-xs disabled:opacity-40" onClick={() => act({ kind: 'attack' })}>
                普通攻击
              </button>
              <button type="button" disabled={stunned} className="ink-btn px-3 py-1 text-xs disabled:opacity-40" onClick={() => act({ kind: 'defend' })}>
                防御蓄势
              </button>
              <button
                type="button"
                disabled={stunned}
                className={`px-3 py-1 text-xs disabled:opacity-40 ${battle.charged ? 'ink-btn-seal' : 'ink-btn'}`}
                title="本回合不出手：下一击伤害 ×1.6，被击中时反手一下"
                onClick={() => act({ kind: 'charge' })}
              >
                {battle.charged ? '已蓄力' : '蓄力'}
              </button>
              <button
                type="button"
                disabled={stunned || potions.length === 0}
                className={`px-3 py-1 text-xs disabled:opacity-40 ${panel === 'item' ? 'ink-btn-seal' : 'ink-btn'}`}
                title={potions.length === 0 ? '背包里没有可用的伤药' : '消耗一回合服下伤药'}
                onClick={() => setPanel(panel === 'item' ? null : 'item')}
              >
                <FaSackDollar /> 用药{potions.length > 0 ? `(${potions.reduce((a, b) => a + b.qty, 0)})` : ''}
              </button>
              <button
                type="button"
                disabled={stunned || battle.mates.length === 0}
                className={`px-3 py-1 text-xs disabled:opacity-40 ${panel === 'order' ? 'ink-btn-seal' : 'ink-btn'}`}
                title={battle.mates.length === 0 ? '没有队友可以指挥' : '给队友下令（只维持本回合）'}
                onClick={() => setPanel(panel === 'order' ? null : 'order')}
              >
                <FaShieldHalved /> 队友令
              </button>
              <button type="button" disabled={stunned} className="ink-btn ml-auto px-3 py-1 text-xs disabled:opacity-40" onClick={() => act({ kind: 'flee' })}>
                逃跑
              </button>
            </div>

            {/* 用药抽屉 */}
            {panel === 'item' && (
              <div className="mt-1.5 border border-[#8a7a63]/40 bg-[#faf6ea]/70 p-2">
                {potions.length === 0 ? (
                  <div className="text-[11px] text-[#9c917b]">背包里没有可用的伤药。可在杂货店买些金疮药随身带着。</div>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {potions.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        disabled={battle.heroHp >= battle.heroMaxHp}
                        onClick={() => { act({ kind: 'item', itemId: p.id, heal: p.heal }); setPanel(null); }}
                        className="ink-btn px-2 py-1 text-[11px] disabled:opacity-40"
                        title="消耗一回合服下"
                      >
                        {p.id} ×{p.qty} <span style={{ color: '#5d7a4a' }}>+{p.heal}HP</span>
                      </button>
                    ))}
                  </div>
                )}
                {battle.heroHp >= battle.heroMaxHp && (
                  <div className="mt-1 text-[10px] text-[#9c917b]">气血已满，用药是浪费。</div>
                )}
              </div>
            )}

            {/* 队友令抽屉 */}
            {panel === 'order' && (
              <div className="mt-1.5 border border-[#8a7a63]/40 bg-[#faf6ea]/70 p-2">
                <div className="mb-1 text-[10px] text-[#9c917b]">指令只维持本回合，下回合要重新下令。</div>
                <div className="flex flex-wrap gap-1.5">
                  <button type="button" className="ink-btn px-2 py-1 text-[11px]" title="队友协战伤害 ×1.7"
                    onClick={() => { act({ kind: 'order', command: 'focus' }); setPanel(null); }}>
                    强攻（协战 ×1.7）
                  </button>
                  <button type="button" className="ink-btn px-2 py-1 text-[11px]" title="勇者受到的伤害 ×0.75"
                    onClick={() => { act({ kind: 'order', command: 'guard' }); setPanel(null); }}>
                    掩护（受伤 ×0.75）
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-3 border border-[#8a7a63]/40 p-3">
            <div className="ink-title mb-1 text-base">
              {battle.fled ? '已脱离战斗' : battle.victory ? '🏆 战斗胜利' : '💀 败北'}
            </div>
            {battle.victory && (
              <div className="space-y-0.5 text-xs text-[#3f3527]">
                <div>经验 +{battle.rewards.exp} / 金币 +{battle.rewards.gold}</div>
                {battle.rewards.drops.length > 0 && (
                  <div>掉落：{battle.rewards.drops.map((d) => `${d.itemId}×${d.quantity}`).join('、')}</div>
                )}
                {battle.rewards.equipment.length > 0 && (
                  <div>装备：{battle.rewards.equipment.map((e) => e.name).join('、')}</div>
                )}
              </div>
            )}
            {!battle.victory && !battle.fled && (
              <div className="text-xs text-[#6b6252]">已自动复活至五成气血，休整后再来。</div>
            )}
            <button type="button" className="ink-btn-seal mt-2 px-4 py-1 text-xs" onClick={close}>
              收招
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
