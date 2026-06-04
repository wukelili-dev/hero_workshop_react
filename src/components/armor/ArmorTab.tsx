import React from 'react';
import { ARMORS, getArmorsByTier } from '../../data/equipment';
import { RarityBadge } from '../shared/RarityBadge';
import type { Equipment } from '../../types';

interface ArmorCardProps {
  armor: Equipment;
  onBuy?: () => void;
}

const ArmorCard: React.FC<ArmorCardProps> = ({ armor, onBuy }) => {
  const totalCost = Object.entries(armor.cost || {})
    .map(([name, count]) => `${name} x${count}`)
    .join(', ') || '免费';

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-blue-500/30 rounded-lg p-3 hover:border-blue-400/50 transition-all">
      {/* 标题行 */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-blue-200 font-bold text-sm">{armor.name}</h3>
        <RarityBadge rarity={armor.rarity} size="sm" />
      </div>

      {/* 属性 */}
      <div className="space-y-1 mb-3 text-xs">
        <div className="flex justify-between text-slate-300">
          <span>防御力</span>
          <span className="text-blue-400 font-bold">{armor.stats?.def ?? 0}</span>
        </div>
        <div className="flex justify-between text-slate-400">
          <span>生命加成</span>
          <span className="text-green-400">+{armor.stats?.hp ?? 0}</span>
        </div>
      </div>

      {/* 价格 */}
      <div className="text-xs text-slate-400 mb-2 truncate">{totalCost}</div>

      {/* 购买按钮 */}
      <button
        onClick={onBuy}
        className="w-full py-1.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white text-xs font-bold rounded border border-blue-400/50 transition-all"
      >
        购买
      </button>
    </div>
  );
};

interface TierSectionProps {
  tier: number;
}

const TierSection: React.FC<TierSectionProps> = ({ tier }) => {
  const armors = getArmorsByTier(tier);

  return (
    <div className="mb-6">
      <h2 className="text-blue-400 font-bold mb-3 pb-1 border-b border-blue-500/30 flex items-center gap-2">
        <span className="text-lg">🛡️</span>
        <span>Tier {tier} 护甲</span>
        <span className="text-xs text-slate-500 ml-auto">Lv{(tier - 1) * 5 + 1}+</span>
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {armors.map((armor) => (
          <ArmorCard
            key={armor.id}
            armor={armor}
            onBuy={() => console.log(`购买护甲: ${armor.name}`)}
          />
        ))}
      </div>
    </div>
  );
};

export const ArmorTab: React.FC = () => {
  return (
    <div className="p-4 bg-slate-950 min-h-full">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-blue-300 mb-1">🛡️ 护甲商店</h1>
        <p className="text-slate-400 text-sm">坚甲护身，万夫莫开</p>
      </div>

      {[1, 2, 3, 4, 5].map((tier) => (
        <TierSection key={tier} tier={tier} />
      ))}
    </div>
  );
};

export default ArmorTab;
