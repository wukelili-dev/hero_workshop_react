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
import { priceOf, contrabandPrice, carryCapacity, cargoWeight, freeCapacity, isIntelStale, recordTradeProfit, adjustStockCapped } from '../../engine/Trade';
import { markRumorFollowed, credibilityText } from '../../engine/Rumor';
import { addRep } from '../../engine/FactionSystem';
import { goodOf, TRADE_GOODS } from '../../data/tradeGoods';
import { cityById, stockTargetOf } from '../../data/cities';
import { NPCS } from '../../data/npcs';

const CATEGORY_LABEL: Record<string, string> = {
  food: '粮食', craft: '手工艺', luxury: '奢侈品', medicine: '药材',
  contraband: '违禁品', exotic: '异域', relic: '灵物',
};

export const MarketPanel: React.FC<{ cityId: string }> = ({ cityId }) => {
  const cargo = useInventoryStore((s) => s.cargo);
  const gold = useGameStore((s) => s.hero.gold);
  const marketStock = useWorldStore((s) => s.marketStock);
  const marketIntel = useWorldStore((s) => s.marketIntel);
  const rumors = useWorldStore((s) => s.rumors);
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
      const target = stockTargetOf(cityId, g.id);
      const isSp = city.specialties.includes(g.id);
      const isDm = city.demands.includes(g.id);
      // 库存档位：偏离/target 归一化到 -1..1，正=积压、负=稀缺
      const level = Math.max(-1, Math.min(1, stock / Math.max(1, target)));
      return { good: g, buy, sell, base, stock, target, level, isSp, isDm };
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
    // 买走货物 → 库存下降 → 价涨；单日冲击封顶；同时标记相关流言"已跟单"
    adjustStockCapped(cityId, goodId, -n);
    markRumorFollowed(cityId, goodId);
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
    // 倾销 → 库存上升 → 价降；单日冲击封顶；同时标记相关流言"已跟单"
    adjustStockCapped(cityId, goodId, n);
    markRumorFollowed(cityId, goodId);
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

      {/* 今日流言（本城听到的、关于别城的货流言；真伪自辨） */}
      {(() => {
        const localRumors = rumors.filter((r) => r.fromCityId === cityId && day - r.bornDay < r.ttlDays);
        if (localRumors.length === 0) return null;
        return (
          <div className="rounded-xl border border-[#8a7a63]/30 bg-[#faf6ea] p-2">
            <div className="ink-title text-[12px] mb-1">📣 今日流言</div>
            <div className="space-y-1">
              {localRumors.map((r) => {
                const npc = NPCS.find((n) => n.id === r.fromNpcId);
                const target = cityById(r.targetCityId);
                const good = goodOf(r.goodId);
                const age = day - r.bornDay;
                const stale = age >= r.ttlDays;
                return (
                  <div key={r.id} className={`text-[11px] leading-relaxed ${stale ? 'opacity-40' : ''}`}>
                    <span className="text-[#6b6252]">
                      「{target?.name ?? r.targetCityId}的{good?.name ?? r.goodId}
                      {r.kind === 'shortage' ? '紧缺，去卖必赚' : '积压，千万别去'}」
                    </span>
                    <span className="text-[#9c917b]">—— {npc?.name ?? r.fromNpcId} 言</span>
                    <span className="ml-1 text-[10px] text-[#9c917b]">{age > 0 ? `${age} 天前` : '今日'}{stale ? ' · 旧讯' : ''}</span>
                    <span className="ml-1 text-[10px] text-[#4f7a8c]">({credibilityText(r.fromNpcId)})</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

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
                    {diff !== 0 && <span className={`ml-1 text-[11px] ${diff > 0 ? 'text-[#8f2b23]' : 'text-green-700'}`}>{diff > 0 ? '↑' : '↓'}</span>}
                    {isStale(r.good.id) && <span className="ml-1 text-[10px] text-[#9c917b]">（旧讯）</span>}
                  </td>
                  <td className="px-2 py-1.5 text-gray-600">{r.sell}</td>
                  <td className="px-2 py-1.5">
                    {/* 库存条：中点为 target（满库存），左=稀缺右=积压 */}
                    <div className="relative h-1.5 w-16 rounded-full bg-[#e8e2d2] overflow-hidden">
                      <div
                        className="absolute top-0 h-full rounded-full"
                        style={{
                          left: r.level >= 0 ? '50%' : `${50 + r.level * 50}%`,
                          width: `${Math.abs(r.level) * 50}%`,
                          backgroundColor: r.level < 0 ? '#b5382f' : '#4f7a8c',
                        }}
                      />
                      <div className="absolute left-1/2 top-0 h-full w-px bg-[#8a7a63]" />
                    </div>
                    <span className={`ml-1 text-[10px] ${r.level < -0.3 ? 'text-[#8f2b23]' : r.level > 0.3 ? 'text-[#4f7a8c]' : 'text-[#9c917b]'}`}>
                      {r.level < -0.3 ? '稀缺' : r.level > 0.3 ? '积压' : '充足'}
                    </span>
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
