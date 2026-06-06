import React from 'react';
import { FaBomb, FaShield } from 'react-icons/fa6';
import { useGameStore } from '../../store/useGameStore';
import { RARITY_COLORS } from '../../data/constants';

export const InventoryTab: React.FC = () => {
  const hero = useGameStore((s) => s.hero);
  const addGold = useGameStore((s) => s.addGold);
  const setHero = useGameStore((s) => s.setHero);

  const weapon = hero.weapon;
  const armor = hero.armor;

  const handleUnequipWeapon = () => {
    if (!weapon) return;
    setHero({ weapon: null, atk: hero.atk - (weapon.stats?.atk ?? 0) });
  };

  const handleUnequipArmor = () => {
    if (!armor) return;
    setHero({ armor: null, def: hero.def - (armor.stats?.def ?? 0) });
  };

  const handleSellWeapon = () => {
    if (!weapon) return;
    const sellPrice = Math.floor((weapon.cost?.['金币'] ?? 0) * 0.5);
    addGold(sellPrice);
    setHero({ weapon: null, atk: hero.atk - (weapon.stats?.atk ?? 0) });
  };

  const handleSellArmor = () => {
    if (!armor) return;
    const sellPrice = Math.floor((armor.cost?.['金币'] ?? 0) * 0.5);
    addGold(sellPrice);
    setHero({ armor: null, def: hero.def - (armor.stats?.def ?? 0) });
  };

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-bold text-gray-700">🎒 背包</h2>

      {/* 装备槽 */}
      <div className="space-y-2">
        <div className="text-xs text-gray-500 font-medium">已装备</div>

        {/* 武器槽 */}
        <div className="flex items-center justify-between px-3 py-2 bg-white border border-gray-200 rounded-lg">
          <div className="flex items-center gap-2">
            <FaBomb className="text-gray-400" />
            {weapon ? (
              <>
                <span className="font-bold text-sm" style={{ color: RARITY_COLORS[weapon.rarity] ?? '#888' }}>
                  {weapon.name}
                </span>
                {weapon.stats?.atk && <span className="text-xs text-red-500">ATK+{weapon.stats.atk}</span>}
                {weapon.stats?.crit && <span className="text-xs text-orange-500">CRIT {(weapon.stats.crit * 100).toFixed(0)}%</span>}
              </>
            ) : (
              <span className="text-sm text-gray-400">空</span>
            )}
          </div>
          {weapon && (
            <div className="flex gap-1">
              <button
                onClick={handleUnequipWeapon}
                className="px-2 py-0.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 rounded transition-colors"
              >
                卸下
              </button>
              <button
                onClick={handleSellWeapon}
                className="px-2 py-0.5 text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded transition-colors"
              >
                出售 {Math.floor((weapon.cost?.['金币'] ?? 0) * 0.5)}G
              </button>
            </div>
          )}
        </div>

        {/* 护甲槽 */}
        <div className="flex items-center justify-between px-3 py-2 bg-white border border-gray-200 rounded-lg">
          <div className="flex items-center gap-2">
            <FaShield className="text-gray-400" />
            {armor ? (
              <>
                <span className="font-bold text-sm" style={{ color: RARITY_COLORS[armor.rarity] ?? '#888' }}>
                  {armor.name}
                </span>
                {armor.stats?.def && <span className="text-xs text-blue-500">DEF+{armor.stats.def}</span>}
                {armor.stats?.hp && <span className="text-xs text-red-400">HP+{armor.stats.hp}</span>}
              </>
            ) : (
              <span className="text-sm text-gray-400">空</span>
            )}
          </div>
          {armor && (
            <div className="flex gap-1">
              <button
                onClick={handleUnequipArmor}
                className="px-2 py-0.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 rounded transition-colors"
              >
                卸下
              </button>
              <button
                onClick={handleSellArmor}
                className="px-2 py-0.5 text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded transition-colors"
              >
                出售 {Math.floor((armor.cost?.['金币'] ?? 0) * 0.5)}G
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 英雄属性摘要 */}
      <div className="border-t border-gray-100 pt-3">
        <div className="text-xs text-gray-500 font-medium mb-2">英雄属性</div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex justify-between px-2 py-1 bg-gray-50 rounded">
            <span className="text-gray-500">等级</span>
            <span className="font-bold">{hero.level}</span>
          </div>
          <div className="flex justify-between px-2 py-1 bg-gray-50 rounded">
            <span className="text-gray-500">生命</span>
            <span className="font-bold text-red-600">{hero.hp}/{hero.maxHp}</span>
          </div>
          <div className="flex justify-between px-2 py-1 bg-gray-50 rounded">
            <span className="text-gray-500">攻击</span>
            <span className="font-bold text-orange-600">{hero.atk}</span>
          </div>
          <div className="flex justify-between px-2 py-1 bg-gray-50 rounded">
            <span className="text-gray-500">防御</span>
            <span className="font-bold text-blue-600">{hero.def}</span>
          </div>
          <div className="flex justify-between px-2 py-1 bg-gray-50 rounded">
            <span className="text-gray-500">暴击率</span>
            <span className="font-bold">{(hero.critRate * 100).toFixed(0)}%</span>
          </div>
          <div className="flex justify-between px-2 py-1 bg-gray-50 rounded">
            <span className="text-gray-500">金币</span>
            <span className="font-bold text-yellow-600">{hero.gold}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
