/**
 * BattleModal — 手动战斗界面（C8 招式对决）
 *
 * 逐回合选招：普攻 / 已学武学（怒气满才亮）/ 防御 / 逃跑。
 * 数字全部来自 engine/Battle 的状态，界面不自己算任何伤害。
 */
import React, { useEffect, useRef } from 'react';
import { FaBolt, FaHeart } from 'react-icons/fa6';
import { useBattleStore } from '../../store/useBattleStore';
import { availableArts, type BattleState } from '../../engine/Battle';
import type { StatusEffectId } from '../../types';

const STATUS_NAME: Record<StatusEffectId, string> = {
  bleed: '流血', poison: '中毒', sunder: '破防', shield: '护盾',
  stun: '麻痹', haste: '疾行', guard: '格挡', rally: '狂热',
};

const pct = (v: number, max: number) => `${Math.max(0, Math.min(100, (v / Math.max(1, max)) * 100)).toFixed(1)}%`;

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

const StatusTags: React.FC<{ c: BattleState['hero'] }> = ({ c }) => (
  <div className="mt-1 flex flex-wrap gap-1">
    {c.vars.shield > 0 && <span className="ink-tag">护盾 {Math.round(c.vars.shield)}</span>}
    {c.vars.statuses.map((s) => (
      <span key={s.id} className="ink-tag">{STATUS_NAME[s.id] ?? s.id} ×{s.stacks}</span>
    ))}
  </div>
);

export const BattleModal: React.FC = () => {
  const battle = useBattleStore((s) => s.battle);
  const act = useBattleStore((s) => s.act);
  const close = useBattleStore((s) => s.close);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [battle?.logs.length, battle?.over]);

  if (!battle) return null;

  const arts = availableArts(battle);
  const rage = battle.hero.vars.rage;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#3f3527]/45 p-3">
      <div className="ink-panel ink-frame flex max-h-full w-full max-w-2xl flex-col p-4">
        {/* 标题 */}
        <div className="mb-3 flex items-center gap-2 border-b border-[#8a7a63]/40 pb-2">
          <span className="ink-title text-lg">招式对决</span>
          <span className="ink-tag">第 {battle.round} 回合</span>
          <span className="ink-tag">
            {battle.heroFirst ? '你身法更快' : `${battle.foe.name} 更快`}
          </span>
          <span className="ml-auto text-xs text-[#9c917b]">{battle.monster.name} · Lv.{battle.monster.level ?? 1}</span>
        </div>

        {/* 双方状态 */}
        <div className="grid gap-3 md:grid-cols-2">
          <div className="border border-[#8a7a63]/40 p-2">
            <div className="ink-title mb-1 text-sm">勇者</div>
            <Bar value={battle.heroHp} max={battle.heroMaxHp} tone="bg-[#b5382f]" label="生命" icon={<FaHeart className="text-[#b5382f]" />} />
            <Bar value={rage} max={100} tone="bg-[#b08a2e]" label="怒气" icon={<FaBolt className="text-[#b08a2e]" />} />
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-[#6b6252]">
              <span>攻 {Math.round(battle.hero.derived.atk)}</span>
              <span>防 {Math.round(battle.hero.derived.def)}</span>
              <span>命中 {(battle.hero.derived.hit * 100).toFixed(0)}%</span>
              <span>闪避 {(battle.hero.derived.dodge * 100).toFixed(0)}%</span>
              <span>暴击 {(battle.hero.derived.crit * 100).toFixed(0)}%</span>
              <span>破甲 {Math.round(battle.hero.derived.pen)}</span>
            </div>
            <StatusTags c={battle.hero} />
          </div>

          <div className="border border-[#8a7a63]/40 p-2">
            <div className="ink-title mb-1 flex items-center gap-2 text-sm">
              {battle.foe.name}
              {battle.foe.isBoss && <span className="ink-tag gold">妖将</span>}
            </div>
            <Bar value={battle.foeHp} max={battle.foeMaxHp} tone="bg-[#8a7a63]" label="生命" icon={<FaHeart className="text-[#b5382f]" />} />
            <Bar value={battle.foe.vars.rage} max={100} tone="bg-[#8a7a63]" label="怒气" icon={<FaBolt className="text-[#b08a2e]" />} />
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-[#6b6252]">
              <span>攻 {Math.round(battle.foe.derived.atk)}</span>
              <span>防 {Math.round(battle.foe.derived.def)}</span>
              {battle.foe.vars.rage >= 100 && <span className="text-[#b5382f]">怒气已满，将放妖术</span>}
            </div>
            <StatusTags c={battle.foe} />
          </div>
        </div>

        {/* 战报 */}
        <div ref={logRef} className="mt-3 max-h-40 min-h-24 overflow-y-auto border border-[#8a7a63]/30 bg-[#faf6ea]/60 p-2 text-xs leading-relaxed">
          {battle.logs.map((l, i) => (
            <div key={i} className={l.attacker === '勇者' || l.attacker === '你' ? 'text-[#3f3527]' : 'text-[#b5382f]'}>
              <span className="mr-1 text-[#9c917b]">{l.round}.</span>
              {l.description}
            </div>
          ))}
        </div>

        {/* 操作区 */}
        {!battle.over ? (
          <div className="mt-3">
            <div className="mb-1 flex items-center gap-2">
              <span className="ink-title text-[11px]">武学</span>
              <span className="ink-rule flex-1" />
              <span className="text-[10px] text-[#9c917b]">怒气满 100 可释放</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {arts.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  disabled={!a.ready}
                  onClick={() => act({ kind: 'art', artId: a.id })}
                  title={a.desc}
                  className={`ink-btn px-2 py-1 text-xs ${a.ready ? '' : 'opacity-40'}`}
                >
                  {a.name}
                </button>
              ))}
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <button type="button" className="ink-btn-seal px-3 py-1 text-xs" onClick={() => act({ kind: 'attack' })}>
                普通攻击
              </button>
              <button type="button" className="ink-btn px-3 py-1 text-xs" onClick={() => act({ kind: 'defend' })}>
                防御蓄势
              </button>
              <button type="button" className="ink-btn px-3 py-1 text-xs" onClick={() => act({ kind: 'flee' })}>
                逃跑
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-3 border border-[#8a7a63]/40 p-3">
            <div className="ink-title mb-1 text-base">
              {battle.fled ? '已脱离战斗' : battle.victory ? '🏆 战斗胜利' : '💀 败北'}
            </div>
            {battle.victory && (
              <div className="space-y-0.5 text-xs text-[#3f3527]">
                <div>经验 +{battle.rewards.exp}　金币 +{battle.rewards.gold}</div>
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
