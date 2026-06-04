import React from 'react';
import { WEAPONS } from '../../data/equipment';
import { useGameStore } from '../../store/useGameStore';
import { RarityBadge } from '../shared/RarityBadge';
import { Tooltip } from '../shared/Tooltip';
import { RARITY_COLORS, formatNumber } from '../../data/constants';

export const WeaponTab: React.FC = () => {
  const hero = useGameStore((s) => s.hero);
  const weapons = Object.values(WEAPONS);

  // Group by tier
  const tiers = [1, 2, 3, 4, 5];
  const tierNames: Record<number, string> = { 1: '初阶', 2: '二阶', 3: '三阶', 4: '四阶', 5: '五阶' };

  return (
    <div className="space-y-6">
      <h2 className="text-amber-300 font-bold text-lg">⚔ 武器店</h2>
      {tiers.map((tier) => {
        const items = weapons.filter((w) => w.tier === tier);
        if (items.length === 0) return null;
        return (
          <div key={tier}>
            <h3 className="text-amber-400/80 font-bold text-sm mb-2 border-b border-amber-900/30 pb-1">
              {tierNames[tier]}（Lv.{(tier - 1) * 5 + 1}~{tier * 5}）
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {items.map((w) => {
                const canBuy = hero.gold >= (w.cost?.['金币'] ?? 0) && hero.level >= (w.levelReq ?? 1);
                const costStr = Object.entries(w.cost || {}).map(([k, v]) => `${k}×${v}`).join(' ');
                return (
                  <div
                    key={w.id}
                    className="border border-amber-900/30 rounded-lg p-3 bg-slate-900/60 hover:border-amber-700/50 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-sm" style={{ color: RARITY_COLORS[w.rarity] ?? '#888' }}>
                        {w.name}
                      </span>
                      <RarityBadge rarity={w.rarity} />
                    </div>
                    <div className="text-xs text-amber-200/60 space-y-0.5">
                      <div>⚔ ATK +{w.stats?.atk ?? 0}</div>
                      {w.stats?.crit ? <div>💥 暴击 {(w.stats.crit * 100).toFixed(0)}%</div> : null}
                      {w.stats?.critDmg ? <div>🗡 暴伤 x{w.stats.critDmg}</div> : null}
                    </div>
                    <div className="text-xs text-amber-200/40 mt-1">费用: {costStr}</div>
                    <button
                      disabled={!canBuy}
                      className={`mt-2 w-full py-1 rounded text-xs font-bold ${
                        canBuy
                          ? 'bg-amber-700 hover:bg-amber-600 text-amber-100'
                          : 'bg-slate-800 text-amber-200/30 cursor-not-allowed'
                      }`}
                    >
                      购买
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
