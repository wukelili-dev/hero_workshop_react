/**
 * InventoryGrid — 10 格背包格子（共享组件）
 * 从 InventoryTab 抽出，供「背包」页与「队伍 · 勇者」页共用。
 * 药水/消耗品可直接在格子上使用；装备可穿上/出售。
 */
import React from 'react';
import { FaBomb, FaShield, FaBox } from 'react-icons/fa6';
import { EXP_PILL_BY_ID, EXP_PILL_IDS } from '../../data/inventory';
import { getItemDef } from '../../data/items/items';
import { useGameStore, potionHealOf } from '../../store/useGameStore';
import { useInventoryStore } from '../../store/useInventoryStore';
import { RARITY_COLORS } from '../../data/constants';
import type { InventorySlot } from '../../store/useInventoryStore';
import { getEquipmentSellPrice, equipmentLines } from '../../engine/equipmentDrops';

// 杂货目录(用于获取显示名称)
const NOVELTY_NAMES: Record<string, string> = {
  'energy_potion': '能量药水',
  'speed_boots': '加速靴',
  'lucky_charm': '幸运符',
};

function getNoveltyDisplayName(id: string): string {
  if (EXP_PILL_IDS.has(id)) {
    return EXP_PILL_BY_ID[id]?.name || id;
  }
  return NOVELTY_NAMES[id] || id;
}

export const InventoryGrid: React.FC = () => {
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

  // 处理装备/使用物品
  const handleSlotClick = (slot: InventorySlot, index: number) => {
    if (slot.type === 'weapon') {
      if (slot.data) {
        equipWeapon(slot.data);
        removeFromInventory(index);
      }
    } else if (slot.type === 'armor') {
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
                const hp = potionHealOf(slot.id);
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
                // 技能书（C5）：学习主动技能或参悟被动
                if (def?.category === 'skillbook') {
                  return (
                    <button
                      onClick={(e) => { e.stopPropagation(); useItem(slot.id); }}
                      className="px-1.5 py-[1px] text-[9px] bg-purple-100 hover:bg-purple-200 text-purple-700 rounded transition-colors"
                    >
                      学习
                    </button>
                  );
                }
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
        {slot.data && equipmentLines(slot.data).length > 0 && (
          <div className="absolute bottom-0.5 left-0.5 text-[10px] text-[#2f6f8f]">
            {equipmentLines(slot.data).slice(0, 2).map((l) => `${l.label}${l.value}`).join(' ')}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-5 gap-2">
      {slots.map((slot, index) => renderSlot(slot, index))}
    </div>
  );
};
