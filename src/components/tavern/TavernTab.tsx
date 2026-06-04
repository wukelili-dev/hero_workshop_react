import React, { useState, useCallback } from 'react';
import {
  generateTavernRoster,
  type TavernRecruit,
} from '../../data/tavern';
import { useGameStore } from '../../store/useGameStore';
import { RarityBadge } from '../shared/RarityBadge';
import { RARITY_COLORS, formatNumber } from '../../data/constants';

// 招募费用 = 基础 + 角色等级 * 系数
const REFRESH_COST = 50;

export const TavernTab: React.FC = () => {
  const hero = useGameStore((s) => s.hero);
  const gold = hero.gold;
  const addGold = useGameStore((s) => s.addGold);
  const [roster, setRoster] = useState<TavernRecruit[]>(() =>
    generateTavernRoster(hero.level)
  );
  const [recruited, setRecruited] = useState<TavernRecruit[]>([]);

  const refreshRoster = useCallback(() => {
    if (gold < REFRESH_COST) return;
    addGold(-REFRESH_COST);
    const newRoster = generateTavernRoster(hero.level);
    setRoster(newRoster);
  }, [gold, hero.level, addGold]);

  const recruit = useCallback(
    (idx: number) => {
      const target = roster[idx];
      if (!target || gold < target.cost) return;
      addGold(-target.cost);
      setRecruited((prev) => [...prev, target]);
      setRoster((prev) => prev.filter((_, i) => i !== idx));
    },
    [roster, gold, addGold]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-amber-300 font-bold text-lg">🍺 英雄酒馆</h2>
        <button
          onClick={refreshRoster}
          disabled={gold < REFRESH_COST}
          className={`px-3 py-1.5 rounded text-sm font-bold transition-colors ${
            gold >= REFRESH_COST
              ? 'bg-blue-900/60 text-amber-200/80 hover:bg-blue-800/60'
              : 'bg-slate-800 text-amber-200/30 cursor-not-allowed'
          }`}
        >
          🔄 刷新 ({REFRESH_COST}G)
        </button>
      </div>

      <div className="text-xs text-amber-200/40">
        招募队友并肩作战！当前等级: Lv.{hero.level}
      </div>

      {/* Current roster — 3 slots */}
      <div>
        <h3 className="text-amber-400/80 font-bold text-sm mb-2 border-b border-amber-900/30 pb-1">
          🏆 可招募角色
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {roster.slice(0, 3).map((recruit, idx) => (
            <div
              key={`${recruit.roleName}-${idx}`}
              className={`border rounded-lg p-4 bg-slate-900/60 transition-colors ${
                recruit.isElite
                  ? 'border-purple-600/50 bg-purple-950/20'
                  : 'border-amber-900/30'
              }`}
            >
              {/* Name & level */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{recruit.isElite ? '⭐' : '👤'}</span>
                  <span
                    className={`font-bold text-sm ${
                      recruit.isElite ? 'text-purple-300' : 'text-amber-200'
                    }`}
                  >
                    {recruit.roleName}
                  </span>
                  {recruit.isElite && <RarityBadge rarity={3} />}
                </div>
                <span className="text-amber-200/60 text-sm">Lv.{recruit.level}</span>
              </div>

              {/* Estimated stats */}
              <div className="grid grid-cols-2 gap-1 text-xs text-amber-200/50 mb-2">
                <span>⚔️ 攻击: {recruit.level * 8 + (recruit.isElite ? 20 : 0)}</span>
                <span>🛡️ 防御: {recruit.level * 5 + (recruit.isElite ? 15 : 0)}</span>
                <span>❤️ 血量: {recruit.level * 30 + (recruit.isElite ? 100 : 0)}</span>
                <span>⚡ 暴击: {recruit.isElite ? '15%' : '5%'}</span>
              </div>

              {/* Elite gear */}
              {recruit.isElite && recruit.gear.length > 0 && (
                <div className="border-t border-purple-800/30 pt-2 mb-2 space-y-1">
                  {recruit.gear.map((g, gi) => (
                    <div
                      key={gi}
                      className="flex items-center justify-between text-xs"
                    >
                      <span style={{ color: g.rarityColor }}>
                        {g.type === 'weapon' ? '⚔️' : '🛡️'} {g.name}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Recruit button */}
              <div className="flex items-center justify-between mt-2">
                <span className="text-yellow-400 text-sm">
                  💰 {formatNumber(recruit.cost)}
                </span>
                <button
                  onClick={() => recruit(idx)}
                  disabled={gold < recruit.cost}
                  className={`px-4 py-1.5 rounded text-sm font-bold transition-colors ${
                    gold >= recruit.cost
                      ? 'bg-amber-700 hover:bg-amber-600 text-amber-100'
                      : 'bg-slate-800 text-amber-200/30 cursor-not-allowed'
                  }`}
                >
                  招募
                </button>
              </div>
            </div>
          ))}
        </div>

        {roster.length === 0 && (
          <div className="text-center text-amber-200/30 py-8">
            暂无可招募角色，点击刷新
          </div>
        )}
      </div>

      {/* Recruited list */}
      {recruited.length > 0 && (
        <div>
          <h3 className="text-amber-400/80 font-bold text-sm mb-2 border-b border-amber-900/30 pb-1">
            📋 已招募 ({recruited.length})
          </h3>
          <div className="space-y-2">
            {recruited.map((r, idx) => (
              <div
                key={`recruited-${idx}`}
                className={`border rounded-lg p-3 bg-slate-900/40 flex items-center justify-between ${
                  r.isElite ? 'border-purple-600/30' : 'border-amber-900/20'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>{r.isElite ? '⭐' : '👤'}</span>
                  <span
                    className={`font-bold text-sm ${
                      r.isElite ? 'text-purple-300' : 'text-amber-200'
                    }`}
                  >
                    {r.roleName}
                  </span>
                  <span className="text-amber-200/40 text-xs">Lv.{r.level}</span>
                </div>
                {r.isElite && r.gear.length > 0 && (
                  <div className="flex gap-1">
                    {r.gear.map((g, gi) => (
                      <span
                        key={gi}
                        className="text-xs px-1.5 py-0.5 rounded"
                        style={{
                          color: g.rarityColor,
                          backgroundColor: `${g.rarityColor}15`,
                        }}
                      >
                        {g.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
