import React from 'react';
import { FaBomb, FaShield, FaBagShopping, FaBox } from 'react-icons/fa6';
import { EXP_PILL_BY_ID, EXP_PILL_IDS } from '../../data/inventory';
import { getItemDef } from '../../data/items/items';
import { useGameStore } from '../../store/useGameStore';
import { useInventoryStore } from '../../store/useInventoryStore';
import { RARITY_COLORS } from '../../data/constants';
import type { InventorySlot } from '../../store/useInventoryStore';
import { getEquipmentSellPrice } from '../../engine/equipmentDrops';

// 杂货目录(用于获取显示名称)
const NOVELTY_NAMES: Record<string, string> = {
  'energy_potion': '能量药水',
  'speed_boots': '加速靴',
  'lucky_charm': '幸运符',
  // 可以根据实际数据补充
};

function getNoveltyDisplayName(id: string): string {
  if (EXP_PILL_IDS.has(id)) {
    return EXP_PILL_BY_ID[id]?.name || id;
  }
  return NOVELTY_NAMES[id] || id;
}

// 药水 HP 恢复表(label -> HP)
const POTION_HP_TABLE: Record<string, number> = {
  '金疮药 [回血+20]': 20,
  '大补丹 [回血+50]': 50,
  '烤全羊 [恢复30HP]': 30,
};

function getPotionHp(id: string): number {
  if (POTION_HP_TABLE[id] !== undefined) return POTION_HP_TABLE[id];
  const m1 = id.match(/回血\+(\d+)/);
  if (m1) return Number(m1[1]);
  const m2 = id.match(/恢复(\d+)HP/);
  if (m2) return Number(m2[1]);
  return 0;
}

export const InventoryTab: React.FC = () => {
  const hero = useGameStore((s) => s.hero);
  const equipWeapon = useGameStore((s) => s.equipWeapon);
  const equipArmor = useGameStore((s) => s.equipArmor);
  const useExpPill = useGameStore((s) => s.useExpPill);
  const useItem = useGameStore((s) => s.useItem);
  const addGold = useGameStore((s) => s.addGold);
  const setHero = useGameStore((s) => s.setHero);
  const addGameLog = useGameStore((s) => s.addGameLog);

  const slots = useInventoryStore((s) => s.slots);
  const removeFromInventory = useInventoryStore((s) => s.removeFromInventory);

  // 使用药水
  const handleUsePotion = (id: string, hp: number, index: number) => {
    if (hp <= 0) return;
    if (hero.hp >= hero.maxHp) {
      addGameLog(`HP 已满，无需使用 ${id}`);
      return;
    }
    const newHp = Math.min(hero.hp + hp, hero.maxHp);
    setHero({ hp: newHp });
    removeFromInventory(index, 1);
    addGameLog(`使用 ${id}，恢复 ${hp}HP（当前 ${newHp}/${hero.maxHp}）`);
  };

  const weapon = hero.weapon;
  const armor = hero.armor;

  // 处理装备/使用物品
  const handleSlotClick = (slot: InventorySlot, index: number) => {
    if (slot.type === 'weapon') {
      // 装备武器
      if (slot.data) {
        equipWeapon(slot.data);
        removeFromInventory(index);
      }
    } else if (slot.type === 'armor') {
      // 装备护甲
      if (slot.data) {
        equipArmor(slot.data);
        removeFromInventory(index);
      }
    } else if (slot.type === 'novelty') {
      // 经验丹:直接使用
      if (EXP_PILL_IDS.has(slot.id)) {
        const ok = useExpPill(slot.id);
        if (!ok) {
          alert('使用失败:背包中没有该经验丹');
        }
        return;
      }
      // 普通杂货:提示去杂货界面
      alert(`杂货:${getNoveltyDisplayName(slot.id)} x${slot.qty}\n请前往杂货界面使用`);
    }
  };

  // 卸下武器
  const handleUnequipWeapon = () => {
    if (!weapon) return;
    // 将武器放回背包
    useInventoryStore.getState().addToInventory('weapon', weapon.id, 1, weapon);
    useGameStore.getState().setHero({
      weapon: null,
      atk: hero.atk - (weapon.stats?.atk ?? 0)
    });
  };

  // 卸下护甲
  const handleUnequipArmor = () => {
    if (!armor) return;
    // 将护甲放回背包
    useInventoryStore.getState().addToInventory('armor', armor.id, 1, armor);
    useGameStore.getState().setHero({
      armor: null,
      def: hero.def - (armor.stats?.def ?? 0)
    });
  };

  // 出售武器(已装备)
  const handleSellWeapon = () => {
    if (!weapon) return;
    const sellPrice = getEquipmentSellPrice(weapon);
    addGold(sellPrice);
    useGameStore.getState().addGameLog(`出售 ${weapon.name},获得 ${sellPrice}G`);
    useGameStore.getState().setHero({
      weapon: null,
      atk: hero.atk - (weapon.stats?.atk ?? 0)
    });
  };

  // 出售护甲(已装备)
  const handleSellArmor = () => {
    if (!armor) return;
    const sellPrice = getEquipmentSellPrice(armor);
    addGold(sellPrice);
    useGameStore.getState().addGameLog(`出售 ${armor.name},获得 ${sellPrice}G`);
    useGameStore.getState().setHero({
      armor: null,
      def: hero.def - (armor.stats?.def ?? 0)
    });
  };

  // 出售背包中的装备
  const handleSellSlot = (slot: InventorySlot, index: number) => {
    if (!slot.data) return;
    const sellPrice = getEquipmentSellPrice(slot.data);
    addGold(sellPrice);
    useInventoryStore.getState().removeFromInventory(index);
    useGameStore.getState().addGameLog(`出售 ${slot.data.name},获得 ${sellPrice}G`);
  };

  // 渲染背包格子
  const renderSlot = (slot: InventorySlot | null, index: number) => {
    if (!slot) {
      return (
        <div
          key={index}
          className="w-full aspect-square border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50"
        >
          <span className="text-gray-300 text-xs">{index + 1}</span>
        </div>
      );
    }

    const bgColor = slot.type === 'weapon' ? 'bg-red-50' : slot.type === 'armor' ? 'bg-blue-50' : 'bg-green-50';
    const borderColor = slot.type === 'weapon' ? 'border-red-300' : slot.type === 'armor' ? 'border-blue-300' : 'border-green-300';

    return (
      <div
        key={index}
        className={`relative w-full aspect-square border-2 ${borderColor} ${bgColor} rounded-lg p-1`}
      >
        {/* 物品类型图标 */}
        <div className="absolute top-0.5 left-0.5">
          {slot.type === 'weapon' && <FaBomb className="text-red-400 text-xs" />}
          {slot.type === 'armor' && <FaShield className="text-blue-400 text-xs" />}
          {slot.type === 'novelty' && <FaBox className="text-green-400 text-xs" />}
        </div>

        {/* 数量(杂货显示堆叠数量) */}
        {slot.type === 'novelty' && slot.qty > 1 && (
          <div className="absolute top-0.5 right-0.5 bg-black/60 text-white text-[10px] px-1 rounded">
            x{slot.qty}
          </div>
        )}

        {/* 物品名称 */}
        <div className="flex items-center justify-center h-full">
          {slot.type === 'weapon' || slot.type === 'armor' ? (
            <div className="flex flex-col items-center gap-0.5">
              <span
                className="text-xs font-bold text-center leading-tight cursor-pointer hover:underline"
                style={{ color: (RARITY_COLORS as Record<string, string>)[slot.data?.rarity ?? 'common'] ?? '#888' }}
                onClick={() => handleSlotClick(slot, index)}
              >
                {slot.data?.name || slot.id}
              </span>
              {/* 背包装备操作栏 */}
              <div className="flex gap-1 mt-0.5">
                <button
                  onClick={(e) => { e.stopPropagation(); handleSlotClick(slot, index); }}
                  className="px-1.5 py-[1px] text-[9px] bg-blue-100 hover:bg-blue-200 text-blue-600 rounded transition-colors"
                >
                  装备
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleSellSlot(slot, index); }}
                  className="px-1.5 py-[1px] text-[9px] bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded transition-colors"
                >
                  卖{getEquipmentSellPrice(slot.data!)}G
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-0.5 w-full">
              <span className="text-xs text-center leading-tight text-green-700">
                {getNoveltyDisplayName(slot.id)}
                {slot.qty > 1 && <span className="text-[10px]"> x{slot.qty}</span>}
              </span>
              {/* 药品/可使用物品：使用按钮 */}
              {(() => {
                const hp = getPotionHp(slot.id);
                if (hp > 0) {
                  return (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleUsePotion(slot.id, hp, index); }}
                      className="px-1.5 py-[1px] text-[9px] bg-green-100 hover:bg-green-200 text-green-700 rounded transition-colors"
                    >
                      使用 +{hp}HP
                    </button>
                  );
                }
                // 可消耗名物（heal/exp use 词条）
                const def = getItemDef(slot.id);
                const useEff = def && def.category === 'consumable' && (def.effects ?? []).some((e) => e.trigger === 'use');
                if (useEff) {
                  const heal = def!.effects!.find((e) => e.kind === 'heal')?.value;
                  const exp = def!.effects!.find((e) => e.kind === 'exp')?.value;
                  const label = heal ? `使用 +${heal}HP` : exp ? `使用 +${exp}经验` : '使用';
                  return (
                    <button
                      onClick={(e) => { e.stopPropagation(); useItem(slot.id); }}
                      className="px-1.5 py-[1px] text-[9px] bg-purple-100 hover:bg-purple-200 text-purple-700 rounded transition-colors"
                    >
                      {label}
                    </button>
                  );
                }
                return null;
              })()}
            </div>
          )}
        </div>

        {/* 装备属性预览 */}
        {slot.type === 'weapon' && slot.data?.stats?.atk && (
          <div className="absolute bottom-0.5 left-0.5 text-[10px] text-red-500">
            ATK+{slot.data.stats.atk}
          </div>
        )}
        {slot.type === 'armor' && slot.data?.stats?.def && (
          <div className="absolute bottom-0.5 left-0.5 text-[10px] text-blue-500">
            DEF+{slot.data.stats.def}
          </div>
        )}
      </div>
    );
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
                出售 {getEquipmentSellPrice(armor)}G
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 10格背包 */}
      <div className="space-y-2">
        <div className="text-xs text-gray-500 font-medium">背包格子</div>
        <div className="grid grid-cols-5 gap-2">
          {slots.map((slot, index) => renderSlot(slot, index))}
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
