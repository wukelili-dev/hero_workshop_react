import React from 'react';
import { FaBomb, FaShield, FaBagShopping } from 'react-icons/fa6';
import { useGameStore } from '../../store/useGameStore';
import { useInventoryStore } from '../../store/useInventoryStore';
import { RARITY_COLORS } from '../../data/constants';
import { getEquipmentSellPrice, equipmentLines } from '../../engine/equipmentDrops';
import { InventoryGrid } from './InventoryGrid';

export const InventoryTab: React.FC = () => {
  const hero = useGameStore((s) => s.hero);
  const addGold = useGameStore((s) => s.addGold);

  const weapon = hero.weapon;
  const armor = hero.armor;

  // 卸下武器
  const handleUnequipWeapon = () => {
    if (!weapon) return;
    // 将武器放回背包
    useInventoryStore.getState().addToInventory('weapon', weapon.id, 1, weapon);
    useGameStore.getState().setHero({ weapon: null });
    useGameStore.getState().syncHero();
  };

  // 卸下护甲
  const handleUnequipArmor = () => {
    if (!armor) return;
    // 将护甲放回背包
    useInventoryStore.getState().addToInventory('armor', armor.id, 1, armor);
    useGameStore.getState().setHero({ armor: null });
    useGameStore.getState().syncHero();
  };

  // 出售武器(已装备)
  const handleSellWeapon = () => {
    if (!weapon) return;
    const sellPrice = getEquipmentSellPrice(weapon);
    addGold(sellPrice);
    useGameStore.getState().addGameLog(`出售 ${weapon.name},获得 ${sellPrice}G`);
    useGameStore.getState().setHero({ weapon: null });
    useGameStore.getState().syncHero();
  };

  // 出售护甲(已装备)
  const handleSellArmor = () => {
    if (!armor) return;
    const sellPrice = getEquipmentSellPrice(armor);
    addGold(sellPrice);
    useGameStore.getState().addGameLog(`出售 ${armor.name},获得 ${sellPrice}G`);
    useGameStore.getState().setHero({ armor: null });
    useGameStore.getState().syncHero();
  };

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-bold text-gray-700 flex items-center gap-1">
        <FaBagShopping /> 背包(10格)
      </h2>

      {/* 已装备物品 */}
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
                {equipmentLines(weapon).map((l) => (
                  <span key={l.label} className={l.kind === 'primary' ? 'text-xs text-[#3f3527]' : 'text-xs text-[#2f6f8f]'}>
                    {l.label}{l.value}
                  </span>
                ))}
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
                出售 {getEquipmentSellPrice(weapon)}G
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
                {equipmentLines(armor).map((l) => (
                  <span key={l.label} className={l.kind === 'primary' ? 'text-xs text-[#3f3527]' : 'text-xs text-[#2f6f8f]'}>
                    {l.label}{l.value}
                  </span>
                ))}
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
                出售 {getEquipmentSellPrice(armor)}G
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 10格背包 */}
      <div className="space-y-2">
        <div className="text-xs text-gray-500 font-medium">背包格子</div>
        <InventoryGrid />
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
