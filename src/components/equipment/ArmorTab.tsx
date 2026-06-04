import React from 'react';
import { WEAPONS, ARMORS } from '../../data/equipment';
import { RARITY_COLORS } from '../../data/constants';

const TIERS = [
  { tier: 1, name: '初阶', level: 'Lv.1~5' },
  { tier: 2, name: '二阶', level: 'Lv.6~10' },
  { tier: 3, name: '三阶', level: 'Lv.11~15' },
  { tier: 4, name: '四阶', level: 'Lv.16~20' },
  { tier: 5, name: '五阶', level: 'Lv.21~25' },
];

export const WeaponTab: React.FC = () => (
  <div className="space-y-5">
    <h2 className="text-sm font-bold text-gray-700">⚔ 武器</h2>
    {TIERS.map(({ tier, name, level }) => {
      const items = Object.values(WEAPONS).filter((w: any) => w.tier === tier);
      if (!items.length) return null;
      return (
        <div key={tier}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-bold text-gray-700">{name}</span>
            <span className="text-xs text-gray-400">{level}</span>
          </div>
          <div className="space-y-1">
            {items.map((w: any) => (
              <div key={w.id} className="flex items-center justify-between px-3 py-2 bg-white border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm" style={{ color: RARITY_COLORS[w.rarity] ?? '#888' }}>{w.name}</span>
                  <span className="text-xs text-gray-400">{w.rarity}</span>
                </div>
                <div className="flex items-center gap-3">
                  {w.stats?.atk ? <span className="text-xs text-red-500">⚔{w.stats.atk}</span> : null}
                  {w.stats?.crit ? <span className="text-xs text-orange-500">CRIT {w.stats.crit * 100}%</span> : null}
                  <span className="text-xs text-yellow-600 font-medium">💰{w.cost?.['金币'] ?? 0}</span>
                  <button className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-full text-xs font-medium transition-colors">
                    购买
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    })}
  </div>
);

export const ArmorTab: React.FC = () => (
  <div className="space-y-5">
    <h2 className="text-sm font-bold text-gray-700">🛡 护甲</h2>
    {TIERS.map(({ tier, name, level }) => {
      const items = Object.values(ARMORS).filter((a: any) => a.tier === tier);
      if (!items.length) return null;
      return (
        <div key={tier}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-bold text-gray-700">{name}</span>
            <span className="text-xs text-gray-400">{level}</span>
          </div>
          <div className="space-y-1">
            {items.map((a: any) => (
              <div key={a.id} className="flex items-center justify-between px-3 py-2 bg-white border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm" style={{ color: RARITY_COLORS[a.rarity] ?? '#888' }}>{a.name}</span>
                  <span className="text-xs text-gray-400">{a.rarity}</span>
                </div>
                <div className="flex items-center gap-3">
                  {a.stats?.def ? <span className="text-xs text-blue-500">🛡{a.stats.def}</span> : null}
                  {a.stats?.hp ? <span className="text-xs text-red-400">❤{a.stats.hp}</span> : null}
                  {a.stats?.crit ? <span className="text-xs text-orange-500">CRIT {a.stats.crit * 100}%</span> : null}
                  <span className="text-xs text-yellow-600 font-medium">💰{a.cost?.['金币'] ?? 0}</span>
                  <button className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-full text-xs font-medium transition-colors">
                    购买
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    })}
  </div>
);
