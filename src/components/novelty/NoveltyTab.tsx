import React, { useState } from 'react';
import { FaGift } from 'react-icons/fa6';
import { NOVELTY_ITEMS, NOVELTY_RARITY_COLORS, NOVELTY_RARITY_NAMES } from '../../data/inventory';
import { useGameStore } from '../../store/useGameStore';
import { useInventoryStore } from '../../store/useInventoryStore';

export const NoveltyTab: React.FC = () => {
  const hero = useGameStore((s) => s.hero);
  const buyNovelty = useGameStore((s) => s.buyNovelty);
  const sellNovelty = useGameStore((s) => s.sellNovelty);
  const novelties = useInventoryStore((s) => s.novelties);
  const [msg, setMsg] = useState<string | null>(null);

  const handleBuy = (item: { name: string; price: number }) => {
    if (hero.gold < item.price) {
      setMsg('❌ 金币不足');
      useGameStore.getState().addGameLog(`购买杂货失败: ${item.name} 金币不足(需要${item.price}G)`);
      setTimeout(() => setMsg(null), 2000);
      return;
    }
    const ok = buyNovelty(item.name, item.price);
    if (ok) {
      setMsg(`✅ 购买成功: ${item.name}`);
      setTimeout(() => setMsg(null), 2000);
    }
  };

  const handleSell = (item: { name: string; price: number }) => {
    const owned = novelties[item.name] ?? 0;
    if (owned <= 0) {
      setMsg('❌ 未拥有该杂货');
      setTimeout(() => setMsg(null), 2000);
      return;
    }
    const ok = sellNovelty(item.name, item.price);
    if (ok) {
      setMsg(`✅ 出售成功: ${item.name}（80%价格）`);
      setTimeout(() => setMsg(null), 2000);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-gray-700 flex items-center gap-1"><FaGift /> 杂货店</h2>
        <span className="text-xs text-yellow-600 font-medium">💰 {hero.gold}</span>
      </div>

      {msg && (
        <div className="px-3 py-1.5 bg-gray-100 rounded text-sm text-center">{msg}</div>
      )}

      <p className="text-xs text-gray-400">收藏各种稀奇古怪的玩意儿，纯装饰，无实际用途。可出售（80%价格）。</p>

      {NOVELTY_ITEMS.map((item) => {
        const owned = novelties[item.name] ?? 0;
        const canAfford = hero.gold >= item.price;
        const color = NOVELTY_RARITY_COLORS[item.rarityIdx] ?? '#888';
        const rarityName = NOVELTY_RARITY_NAMES[item.rarityIdx] ?? '普通';

        return (
          <div
            key={item.name}
            className="flex items-center justify-between px-3 py-2 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm" style={{ color }}>{item.name}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">{rarityName}</span>
              {owned > 0 && (
                <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded">拥有: {owned}</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400 max-w-[140px] truncate">{item.desc}</span>
              <span className="text-xs text-yellow-600 font-medium">💰{item.price}</span>
              <div className="flex gap-1">
                <button
                  onClick={() => handleBuy(item)}
                  disabled={!canAfford}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    canAfford
                      ? 'bg-blue-500 hover:bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  购买
                </button>
                {owned > 0 && (
                  <button
                    onClick={() => handleSell(item)}
                    className="px-3 py-1 rounded-full text-xs font-medium bg-red-500 hover:bg-red-600 text-white transition-colors"
                  >
                    出售(80%)
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
