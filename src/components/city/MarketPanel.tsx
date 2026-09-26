/**
 * MarketPanel — 城中市场行情（世界广度 R2）
 * 展示当前主城所有货物的当日报价与相邻城价差；R3 扩展买入卖出与跑商。
 */
import React, { useMemo } from 'react';
import { useWorldStore } from '../../store/useWorldStore';
import { cityMarket, quote } from '../../engine/Market';
import { TRADE_GOODS } from '../../data/tradeGoods';
import { cityOf, REGIONS } from '../../data/regions';

const CATEGORY_LABEL: Record<string, string> = {
  food: '粮食', craft: '手工艺', luxury: '奢侈品', medicine: '药材', contraband: '违禁品',
};

export const MarketPanel: React.FC<{ cityId: string }> = ({ cityId }) => {
  const day = useWorldStore((s) => s.day);
  const d = Math.floor(day);

  const city = cityOf(cityId);
  const quotes = useMemo(() => cityMarket(cityId, d), [cityId, d]);

  // 相邻城（同区域外的其它主城）用于展示价差
  const otherCity = cityOf(REGIONS.find((r) => r.id !== city?.regionId)?.cityId ?? '');

  if (!city) return null;

  return (
    <div className="space-y-2">
      <div className="ink-head">
        <h3 className="ink-title text-[15px]">市场行情 · {city.name}</h3>
        <span className="ink-tag ml-auto">物价基数 ×{city.priceIndex.toFixed(2)}</span>
      </div>

      {otherCity && (
        <div className="text-[11px] text-gray-500">
          对照城：{otherCity.name}（{otherCity.name === '长安' ? '中原腹地' : '西域门户'}）。价差越大，跑商利越厚。
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-[#8a7a63]/30">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#f3efe4] text-[#6b6252]">
            <tr>
              <th className="px-2 py-1.5 font-medium">货物</th>
              <th className="px-2 py-1.5 font-medium">品类</th>
              <th className="px-2 py-1.5 font-medium">本城价</th>
              {otherCity && <th className="px-2 py-1.5 font-medium">{otherCity.name}价</th>}
              {otherCity && <th className="px-2 py-1.5 font-medium">价差</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#8a7a63]/15">
            {quotes.map((q) => {
              const good = TRADE_GOODS.find((g) => g.id === q.goodId);
              if (!good) return null;
              const otherPrice = otherCity ? quote(otherCity.id, q.goodId, d) : null;
              const spread = otherPrice
                ? ((q.price - otherPrice) / Math.min(q.price, otherPrice)) * 100
                : 0;
              const isContraband = good.category === 'contraband';
              return (
                <tr key={q.goodId} className="bg-white">
                  <td className={`px-2 py-1.5 ${isContraband ? 'text-[#8f2b23]' : 'text-gray-800'}`}>
                    {good.name}{isContraband && <span className="ml-1 text-[10px]">⚠违禁</span>}
                  </td>
                  <td className="px-2 py-1.5 text-gray-500">{CATEGORY_LABEL[good.category]}</td>
                  <td className="px-2 py-1.5 font-medium text-amber-700">{q.price} 金</td>
                  {otherPrice != null && (
                    <td className="px-2 py-1.5 text-gray-500">{otherPrice} 金</td>
                  )}
                  {otherPrice != null && (
                    <td className={`px-2 py-1.5 font-medium ${spread > 0 ? 'text-[#8f2b23]' : spread < 0 ? 'text-green-700' : 'text-gray-400'}`}>
                      {spread > 0 ? '+' : ''}{spread.toFixed(0)}%
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="text-[10px] text-gray-400">
        行情每日波动（灾荒 / 丰饶 / 战事），当日进出价格不变。违禁品获利高，但路上易被盘查。
      </div>
    </div>
  );
};
