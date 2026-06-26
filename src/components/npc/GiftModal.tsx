/**
 * GiftModal - 送礼模态框
 * 玩家选择背包物品 + 金币输入后送礼
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaGift, FaCoins, FaTimes, FaCheck } from 'react-icons/fa';
import { useGameStore } from '../../store/useGameStore';
import { useInventoryStore } from '../../store/useInventoryStore';
import { giftNpc } from '../../engine/NpcSystem';
import type { NpcDefinition } from '../../types';

interface GiftModalProps {
  npc: NpcDefinition;
  onClose: () => void;
}

export const GiftModal: React.FC<GiftModalProps> = ({ npc, onClose }) => {
  const hero = useGameStore((s) => s.hero);
  const addGameLog = useGameStore((s) => s.addGameLog);
  const novelties = useInventoryStore((s) => s.novelties);

  // 构建可送礼物品列表（排除经验丹）
  const giftableItems = Object.entries(novelties)
    .filter(([, count]) => count > 0 && !count.toString().includes('经验丹'))
    .map(([name, count]) => ({ name, count }));

  // 选中的物品: { name -> count }
  const [selected, setSelected] = useState<Record<string, number>>({});
  // 自定义金币
  const [goldAmount, setGoldAmount] = useState(0);

  const toggleItem = (name: string, maxCount: number) => {
    setSelected(prev => {
      if (prev[name] !== undefined) {
        const next = { ...prev };
        delete next[name];
        return next;
      }
      return { ...prev, [name]: Math.min(1, maxCount) };
    });
  };

  const adjustCount = (name: string, delta: number) => {
    const maxCount = novelties[name] ?? 0;
    setSelected(prev => {
      const cur = prev[name] ?? 0;
      const next = Math.max(1, Math.min(maxCount, cur + delta));
      if (next <= 0) {
        const m = { ...prev };
        delete m[name];
        return m;
      }
      return { ...prev, [name]: next };
    });
  };

  const totalGold = goldAmount;
  const selectedCount = Object.values(selected).reduce((a, b) => a + b, 0);

  const canSend = (totalGold > 0 || selectedCount > 0) && goldAmount <= hero.gold;

  const handleGift = () => {
    if (!canSend) return;

    // 调用 giftNpc：金币 + 物品列表
    const items = Object.entries(selected).map(([name, count]) => ({ name, count }));
    const r = giftNpc(npc, totalGold, items);

    if (r.type === 'log') addGameLog(r.message);
    onClose();
  };

  // 计算总礼金价值（用于显示）
  const estimatedValue = totalGold + selectedCount * 50; // 粗估每件物品50G价值

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-2xl shadow-2xl w-[90vw] max-w-md max-h-[80vh] flex flex-col overflow-hidden"
        >
          {/* 标题 */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100">
            <div className="flex items-center gap-2">
              <FaGift className="text-amber-600" />
              <span className="font-bold text-gray-900">送礼给 {npc.name}</span>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <FaTimes />
            </button>
          </div>

          {/* 内容区 */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* 金币输入 */}
            <div className="bg-amber-50 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-amber-800">
                  <FaCoins className="text-sm" />
                  <span className="text-sm font-medium">赠送金币</span>
                </div>
                <span className="text-xs text-amber-500">持有: {hero.gold}G</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={0}
                  max={hero.gold}
                  value={goldAmount}
                  onChange={e => setGoldAmount(Number(e.target.value))}
                  className="flex-1 accent-amber-500"
                />
                <div className="flex items-center gap-1 bg-white rounded-lg px-2 py-1 border border-amber-200">
                  <FaCoins className="text-amber-500 text-xs" />
                  <input
                    type="number"
                    min={0}
                    max={hero.gold}
                    value={goldAmount}
                    onChange={e => setGoldAmount(Math.max(0, Math.min(hero.gold, Number(e.target.value))))}
                    className="w-16 text-sm text-right outline-none text-amber-700 font-medium"
                  />
                </div>
              </div>
              {goldAmount > 0 && (
                <div className="text-xs text-amber-600">≈ 亲密度 +{Math.floor(goldAmount / 50)}</div>
              )}
            </div>

            {/* 物品选择 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-gray-700">
                  <FaGift className="text-gray-500 text-sm" />
                  <span className="text-sm font-medium">选择物品</span>
                </div>
                {selectedCount > 0 && (
                  <span className="text-xs text-amber-600">已选 {selectedCount} 件</span>
                )}
              </div>

              {giftableItems.length === 0 ? (
                <div className="text-center py-4 text-gray-400 text-sm">
                  背包空空如也，无法送礼
                </div>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {giftableItems.map(({ name, count }) => {
                    const isSelected = selected[name] !== undefined;
                    return (
                      <div
                        key={name}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all ${
                          isSelected
                            ? 'border-amber-400 bg-amber-50'
                            : 'border-gray-200 bg-white hover:bg-gray-50'
                        }`}
                        onClick={() => toggleItem(name, count)}
                      >
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                          isSelected ? 'border-amber-500 bg-amber-500' : 'border-gray-300'
                        }`}>
                          {isSelected && <FaCheck className="text-white text-[8px]" />}
                        </div>
                        <span className="flex-1 text-xs text-gray-800">{name}</span>
                        <span className="text-[10px] text-gray-400">x{count}</span>
                        {isSelected && count > 1 && (
                          <div className="flex items-center gap-0.5 ml-1">
                            <button
                              onClick={(e) => { e.stopPropagation(); adjustCount(name, -1); }}
                              className="w-5 h-5 rounded bg-gray-200 text-xs hover:bg-gray-300 flex items-center justify-center"
                            >-</button>
                            <span className="text-xs font-medium w-4 text-center">{selected[name]}</span>
                            <button
                              onClick={(e) => { e.stopPropagation(); adjustCount(name, 1); }}
                              className="w-5 h-5 rounded bg-gray-200 text-xs hover:bg-gray-300 flex items-center justify-center"
                            >+</button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* 底部确认 */}
          <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 space-y-2">
            {estimatedValue > 0 && (
              <div className="text-xs text-center text-gray-500">
                总价值 ≈ <span className="text-amber-600 font-medium">{estimatedValue}</span> G
                → 预计 <span className="text-pink-600 font-medium">亲密度 +{Math.max(1, Math.floor(estimatedValue / 50))}</span>
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 py-2 rounded-xl border border-gray-200 text-gray-600 text-sm hover:bg-gray-100 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleGift}
                disabled={!canSend}
                className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors ${
                  canSend
                    ? 'bg-amber-500 text-white hover:bg-amber-600 shadow'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                <FaGift className="inline mr-1" />
                送出礼物
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
