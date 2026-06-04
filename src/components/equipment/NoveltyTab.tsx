import React from 'react';
import { NOVELTY_ITEMS } from '../../data/inventory';
import { useGameStore } from '../../store/useGameStore';
import { RarityBadge } from '../shared/RarityBadge';
import { RARITY_COLORS } from '../../data/constants';

export const NoveltyTab: React.FC = () => {
  const hero = useGameStore((s) => s.hero);

  // Group by rarity
  const rarityGroups = [0, 1, 2, 3, 4];
  const rarityLabels: Record<number, string> = { 0: '普通', 1: '少见', 2: '稀有', 3: '珍藏', 4: '传说' };

  return (
    <div className="space-y-6">
      <h2 className="text-amber-300 font-bold text-lg">🎁 杂货铺</h2>
      {rarityGroups.map((rarity) => {
        const items = NOVELTY_ITEMS.filter((item) => item.rarityIdx === rarity);
        if (items.length === 0) return null;
        return (
          <div key={rarity}>
            <h3 className="text-amber-400/80 font-bold text-sm mb-2 border-b border-amber-900/30 pb-1">
              {rarityLabels[rarity]}
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {items.map((item, idx) => {
                const canBuy = hero.gold >= item.price;
                return (
                  <div
                    key={`${item.name}-${idx}`}
                    className="border border-amber-900/30 rounded-lg p-3 bg-slate-900/60"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-sm" style={{ color: RARITY_COLORS[item.rarityIdx] ?? '#888' }}>
                        {item.name}
                      </span>
                      <RarityBadge rarity={item.rarityIdx} />
                    </div>
                    <div className="text-xs text-amber-200/60 mb-1">{item.desc}</div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-yellow-400">💰 {item.price}</span>
                      <button
                        disabled={!canBuy}
                        className={`px-3 py-1 rounded text-xs font-bold ${
                          canBuy
                            ? 'bg-amber-700 hover:bg-amber-600 text-amber-100'
                            : 'bg-slate-800 text-amber-200/30 cursor-not-allowed'
                        }`}
                      >
                        购买
                      </button>
                    </div>
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
