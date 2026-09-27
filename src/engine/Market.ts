/**
 * Market — 跑商价格单出口（世界广度 R2/R3）
 *
 * 所有货物报价一律走 quote()，禁止在业务里散写定价。
 * 价格公式：
 *   price = basePrice
 *         × city.priceIndex                    （城市物价基数）
 *         × supplyDemandFactor(city, good)     （本地 supply 高→便宜，demand 高→贵）
 *         × factionRepFactor(city.factionIds)  （复用 FactionSystem.priceMultiplier）
 *         × eventFactor(day, city, good)       （每日事件，hash 确定性，同日稳定）
 *         × (1 - shopPrice 词条)               （复用 ItemEffects.sum('shopPrice')）
 *
 * 同一天内价格必须稳定：eventFactor 用 hash(day + cityId + goodId)，禁止随机/时间戳。
 * 每城 stock 有限，买卖有价格冲击，防无限套利。
 */
import { TRADE_GOODS, goodOf, supplyDemandOf } from '../data/tradeGoods';
import { cityOf } from '../data/regions';
import { priceMultiplier } from './FactionSystem';
import { sum as sumEffect } from './ItemEffects';
import { hash01 } from './hash';
import { useWorldStore } from '../store/useWorldStore';
import { unrestOf } from './PlaceSystem';

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

/** 供需因子：supply 高→低，demand 高→高，clamp 到 [0.6, 1.8] */
export function supplyDemandFactor(cityId: string, goodId: string): number {
  const { supply, demand } = supplyDemandOf(cityId, goodId);
  return clamp(1 + (demand - supply) * 0.08, 0.6, 1.8);
}

/** 每日事件因子：灾荒/丰饶/战事，用 hash 确定性生成，同日稳定 */
export function eventFactor(day: number, cityId: string, goodId: string): number {
  const h = hash01(`${day}:${cityId}:${goodId}`);
  // 约 16% 概率触发事件，幅度 ±25%
  if (h < 0.06) return 1.35;      // 灾荒：稀缺，涨价
  if (h < 0.12) return 0.75;      // 丰饶：过剩，跌价
  if (h < 0.16) return 1.2;       // 战事：需求激增
  return 1.0;
}

/** 某城某货的当日报价（纯行情，不含买卖冲击） */
export function quote(cityId: string, goodId: string, day: number): number {
  const good = goodOf(goodId);
  const city = cityOf(cityId);
  if (!good || !city) return 0;

  const factionMult = city.factionIds.reduce((acc, f) => acc * priceMultiplier(f), 1);
  const shopCut = sumEffect('shopPrice');
  // 地方状态：治安恶化 → 涨价；繁荣 → 略降
  const unrest = unrestOf(cityId);
  const prosperity = useWorldStore.getState().places?.[cityId]?.prosperity ?? 0;
  const unrestMult = unrest >= 70 ? 1.3 : unrest >= 40 ? 1.15 : 1;
  const prosperityMult = prosperity >= 50 ? 0.95 : 1;

  const raw =
    good.basePrice
    * city.priceIndex
    * supplyDemandFactor(cityId, goodId)
    * factionMult
    * eventFactor(day, cityId, goodId)
    * unrestMult
    * prosperityMult
    * (1 - shopCut);

  return Math.max(1, Math.round(raw));
}

/** 买卖价格冲击：stock 为正（买多）→ 涨，为负（卖多）→ 跌，幅度 clamp ±40% */
export function priceImpactFactor(stock: number): number {
  return clamp(1 + stock * 0.02, 0.6, 1.4);
}

/** 含库存冲击的实际成交价 */
export function effectivePrice(cityId: string, goodId: string, day: number): number {
  const stock = useWorldStore.getState().getMarketStock(cityId, goodId);
  return Math.max(1, Math.round(quote(cityId, goodId, day) * priceImpactFactor(stock)));
}

/** 买入：按当前冲击价成交，推高库存（卖压上升 → 下次更贵） */
export function buyGood(cityId: string, goodId: string, qty: number, day: number): { unitPrice: number; total: number } {
  const unitPrice = effectivePrice(cityId, goodId, day);
  useWorldStore.getState().adjustMarketStock(cityId, goodId, qty);
  return { unitPrice, total: unitPrice * qty };
}

/** 卖出：按当前冲击价成交，压低库存（买压上升 → 下次更便宜） */
export function sellGood(cityId: string, goodId: string, qty: number, day: number): { unitPrice: number; total: number } {
  const unitPrice = effectivePrice(cityId, goodId, day);
  useWorldStore.getState().adjustMarketStock(cityId, goodId, -qty);
  return { unitPrice, total: unitPrice * qty };
}

/** 行情快照（供打听/情报层与 UI） */
export interface MarketQuote {
  cityId: string;
  goodId: string;
  day: number;
  price: number;
}

/** 城市市场一览：列出所有货物当日报价 */
export function cityMarket(cityId: string, day: number): MarketQuote[] {
  return TRADE_GOODS.map((g) => ({ cityId, goodId: g.id, day, price: quote(cityId, g.id, day) }));
}

/** 货物显示名 */
export function goodName(goodId: string): string {
  return goodOf(goodId)?.name ?? goodId;
}
