import React, { useState, useMemo } from 'react';
import { ROLE_NAME_POOL, ELITE_ROLE_POOL, ELITE_WEAPONS, ELITE_ARMORS } from '../../data/tavern';
import { useGameStore } from '../../store/useGameStore';
import { RarityBadge } from '../shared/RarityBadge';
import { RARITY_COLORS, formatNumber } from '../../data/constants';

interface TavernRecruit {
  roleName: string;
  level: number;
  isElite: boolean;
  cost: number;
}

function generateRoster(heroLevel: number): TavernRecruit[] {
  const roster: TavernRecruit[] = [];
  const count = 4 + Math.floor(Math.random() * 3); // 4-6 recruits
  for (let i = 0; i < count; i++) {
    const isElite = heroLevel >= 5 && Math.random() < 0.2;
    const pool = isElite ? ELITE_ROLE_POOL : ROLE_NAME_POOL;
    const roleName = pool[Math.floor(Math.random() * pool.length)];
    const level = isElite
      ? Math.max(5, heroLevel + Math.floor(Math.random() * 5) - 2)
      : Math.max(1, heroLevel - 2 + Math.floor(Math.random() * 5));
    const cost = isElite
      ? 500 + level * 50
      : 50 + level * 20;
    roster.push({ roleName, level, isElite, cost });
  }
  return roster.sort((a, b) => a.level - b.level);
}

export const TavernTab: React.FC = () => {
  const hero = useGameStore((s) => s.hero);
  const [roster, setRoster] = useState<TavernRecruit[]>(() => generateRoster(hero.level));
  const [refreshCost, setRefreshCost] = useState(0);

  const refreshRoster = () => {
    const cost = 50 + Math.floor(hero.level * 10);
    if (hero.gold < cost) return;
    // Would deduct gold via store action in real implementation
    setRoster(generateRoster(hero.level));
    setRefreshCost(cost);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-amber-300 font-bold text-lg">🍺 酒馆</h2>
        <button
          onClick={refreshRoster}
          className="px-3 py-1.5 rounded bg-blue-900/60 text-sm text-amber-200/80 hover:bg-blue-800/60"
        >
          🔄 刷新（50G）
        </button>
      </div>

      <div className="text-xs text-amber-200/40">
        招募队友并肩作战！每小时自动刷新一次
      </div>

      <div className="grid grid-cols-1 gap-3">
        {roster.map((recruit, idx) => (
          <div
            key={`${recruit.roleName}-${idx}`}
            className={`border rounded-lg p-4 bg-slate-900/60 transition-colors ${
              recruit.isElite
                ? 'border-purple-600/50 bg-purple-950/20'
                : 'border-amber-900/30'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">{recruit.isElite ? '⭐' : '👤'}</span>
                <span className={`font-bold ${recruit.isElite ? 'text-purple-300' : 'text-amber-200'}`}>
                  {recruit.roleName}
                </span>
                {recruit.isElite && <RarityBadge rarity={3} />}
              </div>
              <span className="text-amber-200/60 text-sm">Lv.{recruit.level}</span>
            </div>

            {recruit.isElite && (
              <div className="text-xs text-purple-200/60 mb-2">
                精英角色，自带史诗装备
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-yellow-400 text-sm">💰 {formatNumber(recruit.cost)}</span>
              <button
                className={`px-4 py-1.5 rounded text-sm font-bold ${
                  hero.gold >= recruit.cost
                    ? 'bg-amber-700 hover:bg-amber-600 text-amber-100'
                    : 'bg-slate-800 text-amber-200/30 cursor-not-allowed'
                }`}
                disabled={hero.gold < recruit.cost}
              >
                招募
              </button>
            </div>
          </div>
        ))}
      </div>

      {roster.length === 0 && (
        <div className="text-center text-amber-200/30 py-8">暂无可招募角色</div>
      )}
    </div>
  );
};
