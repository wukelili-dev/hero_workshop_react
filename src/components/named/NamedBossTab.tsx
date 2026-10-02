/**
 * NamedBossTab — 降妖台（西游名角大 BOSS 菜单式挑战）
 *
 * 列出所有名角（isNamedBoss），满足等级即可挑战；击败后点亮图鉴、掉落专属法宝。
 * 未降伏：显示推荐等级 + 法宝预告；已降伏：显示"已降伏"。
 */
import React from 'react';
import { toast } from 'sonner';
import { FaSkull } from 'react-icons/fa6';
import { MONSTERS } from '../../data/maps';
import type { Monster } from '../../types';
import { useGameStore } from '../../store/useGameStore';
import { useBattleStore } from '../../store/useBattleStore';
import { relicOf } from '../../data/relics';

const NAMED_BOSSES: Monster[] = Object.values(MONSTERS)
  .filter((m) => m.isNamedBoss)
  .sort((a, b) => (a.level ?? 0) - (b.level ?? 0));

export const NamedBossTab: React.FC = () => {
  const hero = useGameStore((s) => s.hero);
  const discoveredMonsters = useGameStore((s) => s.discoveredMonsters) || [];
  const startBattle = useBattleStore((s) => s.start);

  const challenge = (m: Monster) => {
    if (hero.hp <= 0) { toast.error('你已重伤，无法挑战。'); return; }
    startBattle(m);
  };

  return (
    <div className="space-y-3">
      <div className="ink-head">
        <h3 className="ink-title text-[15px]"><FaSkull className="inline text-[#8f2b23]" /> 降妖台 · 西游名角</h3>
        <span className="ink-tag ml-auto">击败名角可得其法宝</span>
      </div>
      <div className="text-[11px] text-[#6b6252]">
        这些是《西游记》里赫赫有名的大妖，远非寻常山精可比。法宝是他们压箱底的神物，击败方可夺取。
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {NAMED_BOSSES.map((m) => {
          const relic = relicOf(m.relicId ?? '');
          const defeated = discoveredMonsters.includes(m.id);
          const canFight = hero.level >= (m.level ?? 0);
          return (
            <div
              key={m.id}
              className={`rounded-xl border p-3 transition-colors ${
                defeated ? 'border-[#4f7a8c]/40 bg-[#f3efe4]' : 'border-[#8a7a63]/30 bg-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-2xl">{relic?.icon ?? '👹'}</span>
                <div className="min-w-0">
                  <div className="font-bold text-sm text-[#3f3527]">{m.name}</div>
                  <div className="text-[10px] text-[#9c917b]">{m.chapter ?? ''}</div>
                </div>
                <span className="ml-auto ink-tag">Lv.{m.level}</span>
              </div>

              <div className="mt-1.5 text-[11px] text-[#6b6252]">
                法宝：<b className="text-[#8f2b23]">{relic?.name ?? '——'}</b>
                {relic && <span className="ml-1 text-[10px] text-[#c1932f]">（{relic.grade}）</span>}
              </div>

              {defeated ? (
                <div className="mt-2 text-center text-xs text-[#4f7a8c]">✓ 已降伏</div>
              ) : canFight ? (
                <button
                  type="button"
                  className="ink-btn-seal mt-2 w-full text-xs"
                  onClick={() => challenge(m)}
                >
                  挑战
                </button>
              ) : (
                <div className="mt-2 text-center text-xs text-[#9c917b]">需 Lv.{m.level}（当前 Lv.{hero.level}）</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
