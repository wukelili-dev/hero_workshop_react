/**
 * MarketPanel — 城中铺子（跑商与城市系统 M3）
 * 只对 8 座跑商城（trade:true）显示货架；非跑商据点显示"此城无铺子"。
 * 价格一律走 engine/Trade.ts 的 priceOf() 唯一出口，组件不写价格算术。
 */
import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useWorldStore } from '../../store/useWorldStore';
import { useInventoryStore } from '../../store/useInventoryStore';
import { useGameStore } from '../../store/useGameStore';
import { priceOf, contrabandPrice, carryCapacity, cargoWeight, freeCapacity, isIntelStale, recordTradeProfit } from '../../engine/Trade';
import { addRep } from '../../engine/FactionSystem';
import { goodOf, TRADE_GOODS } from '../../data/tradeGoods';
import { cityById } from '../../data/cities';

const CATEGORY_LABEL: Record<string, string> = {
  food: '粮食', craft: '手工艺', luxury: '奢侈品', medicine: '药材',
  contraband: '违禁品', exotic: '异域', relic: '灵物',
};

export const MarketPanel: React.FC<{ cityId: string }> = ({ cityId }) => {
  const cargo = useInventoryStore((s) => s.cargo);
  const gold = useGameStore((s) => s.hero.gold);
  const marketStock = useWorldStore((s) => s.marketStock);
  const marketIntel = useWorldStore((s) => s.marketIntel);
  const day = useWorldStore((s) => Math.floor(s.day));

  const [qty, setQty] = useState<Record<string, number>>({});
  const city = cityById(cityId);

  // 本城行情情报（3 天过期，过期标"旧讯"）
  const intelOf = (goodId: string) => marketIntel.find((i) => i.cityId === cityId && i.goodId === goodId);
  const isStale = (goodId: string) => {
    const i = intelOf(goodId);
    return i ? isIntelStale(i, day) : false;
  };

  const rows = useMemo(() => {
    if (!city || !city.trade) return [];
    return TRADE_GOODS.filter((g) => g.category !== 'contraband').map((g) => {
      const buy = priceOf(g.id, cityId, { side: 'buy' }) ?? 0;
      const sell = priceOf(g.id, cityId, { side: 'sell' }) ?? 0;
      const base = Math.round(g.basePrice * city.goodsScale);
      const stock = marketStock[`${cityId}:${g.id}`] ?? 0;
      const isSp = city.specialties.includes(g.id);
      const isDm = city.demands.includes(g.id);
      return { good: g, buy, sell, base, stock, isSp, isDm };
    });
  }, [city, cityId, marketStock]);

  if (!city) return null;

  // 非跑商据点：无货架
  if (!city.trade) {
    return (
      <div className="space-y-2">
        <div className="ink-head">
          <h3 className="ink-title text-[15px]">{city.name} · 无铺子</h3>
        </div>
        <div className="rounded-xl border border-dashed border-[#8a7a63]/40 p-4 text-center text-xs text-[#9c917b]">
          {city.name}只是途经的据点，没有货架可买卖。跑商请往长安、洛阳、建邺、扬州、益州、荆州、阳关、东海。
        </div>
        <div className="text-[10px] text-[#9c917b]">{city.desc}</div>
      </div>
    );
  }

  const cap = carryCapacity();
  const weight = cargoWeight();
  const free = freeCapacity();

  const setQ = (goodId: string, v: number) => setQty((q) => ({ ...q, [goodId]: Math.max(1, Math.min(99, v)) }));

  const doBuy = (goodId: string) => {
    const n = qty[goodId] ?? 1;
    const unit = priceOf(goodId, cityId, { side: 'buy' });
    if (unit == null) return;
    const good = goodOf(goodId);
    if (!good) return;
    const total = unit * n;
    const game = useGameStore.getState();
    if (game.hero.gold < total) { toast.error('金币不足'); return; }
    if (good.weight * n > free) { toast.error('运力不足'); return; }
    game.addGold(-total);
    useInventoryStore.getState().addCargo(goodId, n);
    useWorldStore.getState().adjustMarketStock(cityId, goodId, n);
    toast.success(`购入 ${good.name} ×${n}，花 ${total} 金（你抬高了本城价）`, { icon: '🧺' });
  };

  const doSell = (goodId: string) => {
    const have = cargo[goodId] ?? 0;
    const n = Math.min(qty[goodId] ?? 1, have);
    if (have <= 0) { toast.error('没有该货物'); return; }
    const good = goodOf(goodId);
    if (!good) return;
    const isContraband = good.category === 'contraband';
    // 违禁品：价格 ×1.6，但掉该城势力声望（可能引发封锁）
    const unit = isContraband ? (contrabandPrice(goodId, cityId) ?? 0) : (priceOf(goodId, cityId, { side: 'sell' }) ?? 0);
    if (unit == null || unit === 0) return;
    const total = unit * n;
    useInventoryStore.getState().removeCargo(goodId, n);
    useGameStore.getState().addGold(total);
    useWorldStore.getState().adjustMarketStock(cityId, goodId, -n);
    if (isContraband && city.factionId) {
      addRep(city.factionId, -8);
      toast.success(`售出违禁品 ${good.name} ×${n}，得 ${total} 金；${city.name} 势力声望下降`, { icon: '⚠️' });
    } else {
      // 跨城套利：卖出价相对基准成本的利润 ≥500 金 → 写编年史
      const profit = (unit - good.basePrice) * n;
      recordTradeProfit(cityId, goodId, n, profit);
      toast.success(`售出 ${good.name} ×${n}，得 ${total} 金（你压低了本城价）`, { icon: '💰' });
    }
  };

  return (
    <div className="space-y-2">
      <div className="ink-head">
        <h3 className="ink-title text-[15px]">铺子 · {city.name}</h3>
        <span className="ink-tag ml-auto">物价 ×{city.goodsScale.toFixed(2)}</span>
      </div>

      <div className="flex flex-wrap gap-3 rounded-xl border border-[#8a7a63]/30 bg-[#f3efe4] px-3 py-2 text-[11px] text-gray-600">
        <span>💰 金币 <b className="text-amber-700">{gold.toLocaleString()}</b></span>
        <span>🧺 运力 <b className="text-gray-800">{weight}</b>/{cap}</span>
        <span className="text-gray-400">剩余 {free}</span>
      </div>

      <div className="text-[11px] text-gray-500">{city.desc}</div>

      <div className="overflow-hidden rounded-xl border border-[#8a7a63]/30">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#f3efe4] text-[#6b6252]">
            <tr>
              <th className="px-2 py-1.5 font-medium">货物</th>
              <th className="px-2 py-1.5 font-medium">买价</th>
              <th className="px-2 py-1.5 font-medium">卖价</th>
              <th className="px-2 py-1.5 font-medium">库存</th>
              <th className="px-2 py-1.5 font-medium">持有</th>
              <th className="px-2 py-1.5 font-medium">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#8a7a63]/15">
            {rows.map((r) => {
              const have = cargo[r.good.id] ?? 0;
              const n = qty[r.good.id] ?? 1;
              const diff = r.buy - r.base;
              return (
                <tr key={r.good.id} className="bg-white">
                  <td className="px-2 py-1.5 text-gray-800">
                    {r.good.name}
                    {r.isSp && <span className="ml-1 rounded bg-[#4f7a8c]/10 px-1 text-[10px] text-[#4f7a8c]">特产</span>}
                    {r.isDm && <span className="ml-1 rounded bg-[#8f2b23]/10 px-1 text-[10px] text-[#8f2b23]">需求</span>}
                    <div className="text-[10px] text-gray-400">{CATEGORY_LABEL[r.good.category]}</div>
                  </td>
                  <td className="px-2 py-1.5 font-medium text-amber-700">
                    {r.buy}
                    {isStale(r.good.id) && <span className="ml-1 text-[10px] text-[#9c917b]">（旧讯）</span>}
                  </td>
                  <td className="px-2 py-1.5 text-gray-600">{r.sell}</td>
                  <td className="px-2 py-1.5">
                    <span className={r.stock >= 20 ? 'text-[#8f2b23]' : r.stock <= -20 ? 'text-green-700' : 'text-gray-500'}>
                      {r.stock > 0 ? `+${r.stock}` : r.stock}
                    </span>
                    {diff !== 0 && <span className={`ml-1 text-[10px] ${diff > 0 ? 'text-[#8f2b23]' : 'text-green-700'}`}>{diff > 0 ? '↑' : '↓'}</span>}
                  </td>
                  <td className="px-2 py-1.5 text-gray-600">{have}</td>
                  <td className="px-2 py-1.5">
                    <div className="flex items-center gap-1">
                      <input
                        type="number" min={1} max={99} value={n}
                        onChange={(e) => setQ(r.good.id, Number(e.target.value))}
                        className="w-12 rounded border border-[#8a7a63]/40 px-1 py-0.5 text-xs"
                      />
                      <button type="button" onClick={() => doBuy(r.good.id)} className="ink-btn px-2 py-0.5 text-[11px]">买</button>
                      <button type="button" onClick={() => doSell(r.good.id)} disabled={have <= 0} className="ink-btn px-2 py-0.5 text-[11px]">卖</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="text-[10px] text-gray-400">
        特产本地便宜（×0.7）、需求本地贵（×1.35）；买多涨价、卖多跌价，当日进出价格立刻变化。
      </div>
    </div>
  );
};
