import React, { useState } from 'react';
import { useInventoryStore } from '../../store/useInventoryStore';
import { RarityBadge } from '../shared/RarityBadge';
import { NOVELTY_RARITY_NAMES } from '../../data/inventory';
import type { Equipment } from '../../types';

type FilterCategory = 'all' | 'weapon' | 'armor' | 'material' | 'novelty';

const FILTER_LABELS: Record<FilterCategory, string> = {
  all: '全部',
  weapon: '武器',
  armor: '护甲',
  material: '材料',
  novelty: '杂货',
};

const FILTER_ICONS: Record<FilterCategory, string> = {
  all: '📦',
  weapon: '⚔️',
  armor: '🛡️',
  material: '🪨',
  novelty: '✨',
};

interface InventoryItemCardProps {
  name: string;
  icon?: string;
  count?: number;
  rarity?: number;
  type?: string;
  onClick?: () => void;
}

const InventoryItemCard: React.FC<InventoryItemCardProps> = ({
  name,
  icon = '📦',
  count = 1,
  rarity,
  type,
  onClick,
}) => {
  const getBgGradient = () => {
    switch (rarity) {
      case 0: return 'from-gray-800 to-gray-900';
      case 1: return 'from-green-900 to-green-950';
      case 2: return 'from-blue-900 to-blue-950';
      case 3: return 'from-purple-900 to-purple-950';
      case 4: return 'from-orange-900 to-orange-950';
      default: return 'from-slate-800 to-slate-900';
    }
  };

  return (
    <div
      onClick={onClick}
      className={`bg-gradient-to-br ${getBgGradient()} border border-slate-600/50 rounded-lg p-2 hover:border-amber-500/50 transition-all cursor-pointer aspect-square flex flex-col items-center justify-center relative`}
    >
      {/* 数量角标 */}
      {count > 1 && (
        <div className="absolute top-1 right-1 bg-amber-600 text-white text-xs font-bold px-1.5 rounded">
          {count}
        </div>
      )}
      
      {/* 图标 */}
      <div className="text-2xl mb-1">{icon}</div>
      
      {/* 名称 */}
      <div className="text-xs text-center text-slate-200 truncate w-full px-1">
        {name}
      </div>

      {/* 稀有度指示器 */}
      {rarity !== undefined && rarity > 0 && (
        <div className="absolute bottom-1 left-1">
          <RarityBadge rarity={rarity} size="sm" />
        </div>
      )}
    </div>
  );
};

const WeaponCard: React.FC<{ weapon: Equipment }> = ({ weapon }) => (
  <InventoryItemCard
    name={weapon.name}
    icon="⚔️"
    rarity={weapon.rarity}
    type="weapon"
  />
);

const ArmorCard: React.FC<{ armor: Equipment }> = ({ armor }) => (
  <InventoryItemCard
    name={armor.name}
    icon="🛡️"
    rarity={armor.rarity}
    type="armor"
  />
);

const MaterialCard: React.FC<{ name: string; count: number }> = ({ name, count }) => {
  const iconMap: Record<string, string> = {
    '金币': '💰',
    '木材': '🪵',
    '铁矿': '⛰️',
    '皮革': '🧤',
    '草药': '🌿',
  };
  return (
    <InventoryItemCard
      name={name}
      icon={iconMap[name] || '📦'}
      count={count}
      type="material"
    />
  );
};

const NoveltyCard: React.FC<{ name: string; count: number; rarity: number }> = ({ name, count, rarity }) => (
  <InventoryItemCard
    name={name.split(' ').pop() || name}
    icon={name.split(' ')[0] || '✨'}
    count={count}
    rarity={rarity}
    type="novelty"
  />
);

export const InventoryTab: React.FC = () => {
  const [filter, setFilter] = useState<FilterCategory>('all');
  const { weapons, armors, materials, novelties } = useInventoryStore();

  return (
    <div className="p-4 bg-slate-950 min-h-full">
      {/* 标题 */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-amber-300 mb-1">🎒 背包</h1>
        <p className="text-slate-400 text-sm">存放物品，随身携带</p>
      </div>

      {/* 筛选按钮 */}
      <div className="flex flex-wrap gap-2 mb-4">
        {(Object.keys(FILTER_LABELS) as FilterCategory[]).map((key) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
              filter === key
                ? 'bg-amber-600 text-white border border-amber-400'
                : 'bg-slate-800 text-slate-300 border border-slate-600 hover:bg-slate-700'
            }`}
          >
            <span>{FILTER_ICONS[key]}</span>
            <span>{FILTER_LABELS[key]}</span>
          </button>
        ))}
      </div>

      {/* 物品网格 */}
      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2">
        {/* 武器 */}
        {(filter === 'all' || filter === 'weapon') &&
          weapons.map((weapon, idx) => (
            <WeaponCard key={`weapon-${idx}-${weapon.id}`} weapon={weapon} />
          ))}

        {/* 护甲 */}
        {(filter === 'all' || filter === 'armor') &&
          armors.map((armor, idx) => (
            <ArmorCard key={`armor-${idx}-${armor.id}`} armor={armor} />
          ))}

        {/* 材料 */}
        {(filter === 'all' || filter === 'material') &&
          Object.entries(materials).map(([name, count]) => (
            <MaterialCard key={`material-${name}`} name={name} count={count} />
          ))}

        {/* 杂货 */}
        {(filter === 'all' || filter === 'novelty') &&
          Object.entries(novelties).map(([name, count]) => (
            <NoveltyCard
              key={`novelty-${name}`}
              name={name}
              count={count}
              rarity={Object.keys(NOVELTY_RARITY_NAMES).findIndex(
                (r) => NOVELTY_RARITY_NAMES[parseInt(r)] === name.split(' ').pop()
              )}
            />
          ))}
      </div>

      {/* 空状态 */}
      {weapons.length === 0 &&
        armors.length === 0 &&
        Object.keys(materials).length === 0 &&
        Object.keys(novelties).length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500">
            <div className="text-4xl mb-2">📦</div>
            <p className="text-sm">背包空空如也</p>
            <p className="text-xs text-slate-600 mt-1">去商店逛逛吧</p>
          </div>
        )}
    </div>
  );
};

export default InventoryTab;
