import React, { useState } from 'react';
import { ARMORS } from '../../data/equipment';
import { RARITY_COLORS } from '../../data/constants';
import { useGameStore } from '../../store/useGameStore';
import type { Equipment } from '../../types';

const TIERS = [
  { tier: 1, name: '初阶', level: 'Lv.1~5' },
  { tier: 2, name: '二阶', level: 'Lv.6~10' },
  { tier: 3, name: '三阶', level: 'Lv.11~15' },
  { tier: 4, name: '四阶', level: 'Lv.16~20' },
  { tier: 5, name: '五阶', level: 'Lv.21~25' },
];

export const ArmorTab: React.FC = () => {
  const hero = useGameStore((s) => s.hero);
  const equipArmor = useGameStore((s) => s.equipArmor);
  const [msg, setMsg] = useState<string | null>(null);

  const handleBuy = (armor: Equipment) => {
    const cost = armor.cost?.['金币'] ?? 0;
    if (hero.gold < cost) {
      setMsg('❌ 金币不足');
      setTimeout(() => setMsg(null), 2000);
      return;
    }
    const ok = equipArmor(armor);
    if (ok) {
      setMsg(`✅ 购买 ${armor.name} 成功！`);
      setTimeout(() => setMsg(null), 2000);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-gray-700">🛡 护甲</h2>
        <span className="text-xs text-yellow-600 font-medium">💰 {hero.gold}</span>
      </div>

      {/* 提示消息 */}
      {msg && (
        <div className="px-3 py-1.5 bg-gray-100 rounded text-sm text-center">{msg}</div>
      )}

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
              {items.map((a: any) => {
                const cost = a.cost?.['金币'] ?? 0;
                const canAfford = hero.gold >= cost;
                const isEquipped = hero.armor?.id === a.id;

                return (
                  <div
                    key={a.id}
                    className="flex items-center justify-between px-3 py-2 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="font-bold text-sm"
                        style={{ color: RARITY_COLORS[a.rarity] ?? '#888' }}
                      >
                        {a.name}
                      </span>
                      {isEquipped && (
                        <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-600 rounded">已装备</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {a.stats?.def && <span className="text-xs text-blue-500">🛡{a.stats.def}</span>}
                      {a.stats?.hp && <span className="text-xs text-red-400">❤{a.stats.hp}</span>}
                      {a.stats?.crit && <span className="text-xs text-orange-500">CRIT {(a.stats.crit * 100).toFixed(0)}%</span>}
                      <span className="text-xs text-yellow-600 font-medium">💰{cost}</span>
                      <button
                        onClick={() => handleBuy(a)}
                        disabled={!canAfford || isEquipped}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          isEquipped
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : canAfford
                            ? 'bg-blue-500 hover:bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {isEquipped ? '已装备' : '购买'}
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
