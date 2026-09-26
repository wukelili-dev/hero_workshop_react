/**
 * MarketPanel — 城中市场 + 跑商（世界广度 R2/R3）
 * 展示当前主城货物报价、买卖（入 cargo）、运力、跨城跑商（掷风险）。
 */
import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useWorldStore } from '../../store/useWorldStore';
import { useInventoryStore } from '../../store/useInventoryStore';
import { useGameStore } from '../../store/useGameStore';
import { cityMarket, effectivePrice } from '../../engine/Market';
import { buyAtCity, sellAtCity, carryCapacity, cargoWeight, freeCapacity, completeTrip } from '../../engine/Trade';
import { goodOf } from '../../data/tradeGoods';
import { cityOf, REGIONS } from '../../data/regions';

const CATEGORY_LABEL: Record<string, string> = {
  food: '粮食', craft: '手工艺', luxury: '奢侈品', medicine: '药材', contraband: '违禁品',
};

export const MarketPanel: React.FC<{ cityId: string }> = ({ cityId }) => {
  const day = useWorldStore((s) => s.day);
  const d = Math.floor(day);
  const cargo = useInventoryStore((s) => s.cargo);
  const gold = useGameStore((s) => s.hero.gold);

  const [qty, setQty] = useState<Record<string, number>>({});

  const city = cityOf(cityId);
  const quotes = useMemo(() => cityMarket(cityId, d), [cityId, d]);
  const otherCity = cityOf(REGIONS.find((r) => r.id !== city?.regionId)?.cityId ?? '');

  if (!city) return null;

  const cap = carryCapacity();
  const weight = cargoWeight();
  const free = freeCapacity();

  const setQ = (goodId: string, v: number) => setQty((q) => ({ ...q, [goodId]: Math.max(0, Math.min(99, v)) }));

  const doBuy = (goodId: string) => {
    const n = qty[goodId] ?? 1;
    const res = buyAtCity(cityId, goodId, n, d);
    if (!res) { toast.error('金币不足'); return; }
    if (res.over) { toast.error('运力不足，无法装载'); return; }
    toast.success(`购入 ${goodOf(goodId)?.name ?? goodId} ×${n}，花 ${res.total} 金`, { icon: '🧺' });
  };

  const doSell = (goodId: string) => {
    const have = cargo[goodId] ?? 0;
    const n = Math.min(qty[goodId] ?? 1, have);
    if (have <= 0) { toast.error('没有该货物'); return; }
    const res = sellAtCity(cityId, goodId, n, d);
    toast.success(`售出 ${goodOf(goodId)?.name ?? goodId} ×${n}，得 ${res.total} 金`, { icon: '💰' });
  };

  const doTrip = () => {
    if (!otherCity) return;
    const result = completeTrip(cityId, otherCity.id, d);
    toast.success(`抵达${otherCity.name}：${result.text}`, { icon: '🐎', duration: 6000 });
  };

  return (
    <div className="space-y-2">
      <div className="ink-head">
        <h3 className="ink-title text-[15px]">市场行情 · {city.name}</h3>
        <span className="ink-tag ml-auto">物价基数 ×{city.priceIndex.toFixed(2)}</span>
      </div>

      <div className="flex flex-wrap gap-3 rounded-xl border border-[#8a7a63]/30 bg-[#f3efe4] px-3 py-2 text-[11px] text-gray-600">
        <span>💰 金币 <b className="text-amber-700">{gold.toLocaleString()}</b></span>
        <span>🧺 运力 <b className={free < 0 ? 'text-[#8f2b23]' : 'text-gray-800'}>{weight}</b>/{cap}</span>
        <span className="text-gray-400">剩余 {free}</span>
        {otherCity && (
          <button type="button" onClick={doTrip} disabled={weight === 0} className="ink-btn-seal ml-auto text-[11px]">
            🐎 跑商前往{otherCity.name}
          </button>
        )}
      </div>

      {otherCity && (
        <div className="text-[11px] text-gray-500">
          对照城：{otherCity.name}。低价买、异地卖赚差价；违禁品获利高但路上易被盘查没收。
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-[#8a7a63]/30">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#f3efe4] text-[#6b6252]">
            <tr>
              <th className="px-2 py-1.5 font-medium">货物</th>
              <th className="px-2 py-1.5 font-medium">品类</th>
              <th className="px-2 py-1.5 font-medium">本城价</th>
              <th className="px-2 py-1.5 font-medium">持有</th>
              <th className="px-2 py-1.5 font-medium">数量</th>
              <th className="px-2 py-1.5 font-medium">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#8a7a63]/15">
            {quotes.map((q) => {
              const good = goodOf(q.goodId);
              if (!good) return null;
              const price = effectivePrice(cityId, q.goodId, d);
              const have = cargo[q.goodId] ?? 0;
              const isContraband = good.category === 'contraband';
              const n = qty[q.goodId] ?? 1;
              return (
                <tr key={q.goodId} className="bg-white">
                  <td className={`px-2 py-1.5 ${isContraband ? 'text-[#8f2b23]' : 'text-gray-800'}`}>
                    {good.name}{isContraband && <span className="ml-1 text-[10px]">⚠</span>}
                  </td>
                  <td className="px-2 py-1.5 text-gray-500">{CATEGORY_LABEL[good.category]}</td>
                  <td className="px-2 py-1.5 font-medium text-amber-700">{price} 金</td>
                  <td className="px-2 py-1.5 text-gray-600">{have}</td>
                  <td className="px-2 py-1.5">
                    <input
                      type="number"
                      min={1}
                      max={99}
                      value={n}
                      onChange={(e) => setQ(q.goodId, Number(e.target.value))}
                      className="w-12 rounded border border-[#8a7a63]/40 px-1 py-0.5 text-xs"
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <div className="flex gap-1">
                      <button type="button" onClick={() => doBuy(q.goodId)} className="ink-btn text-[11px] px-2 py-0.5">买</button>
                      <button type="button" onClick={() => doSell(q.goodId)} disabled={have <= 0} className="ink-btn text-[11px] px-2 py-0.5">卖</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="text-[10px] text-gray-400">
        行情每日波动，当日稳定；买多涨价、卖多跌价。跑商途中可能遇山匪/关税/盘查，风险与货值、治安相关。
      </div>
    </div>
  );
};
