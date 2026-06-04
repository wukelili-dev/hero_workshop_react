import React from 'react';
import { WEAPONS, getWeaponsByTier } from '../../data/equipment';
import { RarityBadge } from '../shared/RarityBadge';
import type { Equipment } from '../../types';

interface WeaponCardProps {
  weapon: Equipment;
  onBuy?: () => void;
}

const WeaponCard: React.FC<WeaponCardProps> = ({ weapon, onBuy }) => {
  const totalCost = Object.entries(weapon.cost || {})
    .map(([name, count]) => `${name} x${count}`)
    .join(', ') || '免费';

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-amber-500/30 rounded-lg p-3 hover:border-amber-400/50 transition-all">
      {/* 标题行 */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-amber-200 font-bold text-sm">{weapon.name}</h3>
        <RarityBadge rarity={weapon.rarity} size="sm" />
      </div>

      {/* 属性 */}
      <div className="space-y-1 mb-3 text-xs">
        <div className="flex justify-between text-slate-300">
          <span>攻击力</span>
          <span className="text-red-400 font-bold">{weapon.stats?.atk ?? 0}</span>
        </div>
        <div className="flex justify-between text-slate-400">
          <span>暴击率</span>
          <span className="text-yellow-400">{((weapon.stats?.crit ?? 0) * 100).toFixed(0)}%</span>
        </div>
        <div className="flex justify-between text-slate-400">
          <span>暴击伤害</span>
          <span className="text-orange-400">{((weapon.stats?.critDmg ?? 1.5) * 100).toFixed(0)}%</span>
        </div>
      </div>

      {/* 价格 */}
      <div className="text-xs text-slate-400 mb-2 truncate">{totalCost}</div>

      {/* 购买按钮 */}
      <button
        onClick={onBuy}
        className="w-full py-1.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white text-xs font-bold rounded border border-amber-400/50 transition-all"
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
  const weapons = getWeaponsByTier(tier);

  return (
    <div className="mb-6">
      <h2 className="text-amber-400 font-bold mb-3 pb-1 border-b border-amber-500/30 flex items-center gap-2">
        <span className="text-lg">⚔️</span>
        <span>Tier {tier} 武器</span>
        <span className="text-xs text-slate-500 ml-auto">Lv{(tier - 1) * 5 + 1}+</span>
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {weapons.map((weapon) => (
          <WeaponCard
            key={weapon.id}
            weapon={weapon}
            onBuy={() => console.log(`购买武器: ${weapon.name}`)}
          />
        ))}
      </div>
    </div>
  );
};

export const WeaponTab: React.FC = () => {
  return (
    <div className="p-4 bg-slate-950 min-h-full">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-amber-300 mb-1">⚔️ 武器商店</h1>
        <p className="text-slate-400 text-sm">锻造神兵，斩妖除魔</p>
      </div>

      {[1, 2, 3, 4, 5].map((tier) => (
        <TierSection key={tier} tier={tier} />
      ))}
    </div>
  );
};

export default WeaponTab;
