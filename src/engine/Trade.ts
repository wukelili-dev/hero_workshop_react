/**
 * Trade — 跑商闭环（世界广度 R3 → 跑商与城市系统 M1/M3/M5）
 *
 * 三件套：
 * 1. 信息差：外地行情靠打听（intel 节点），情报 3 天过期
 * 2. 运力限制：carryCapacity = 基础20 + 车/驮兽 + 队友 + ItemEffects.sum('carry')
 * 3. 路线风险：按距离/治安掷事件——山匪（复用 VisitSystem 思路）、关税、盘查（违禁品没收）
 *
 * 价格唯一出口：priceOf(goodId, cityId, { side }) —— 所有买卖价只走这里，禁止组件散写定价。
 * 净收益 = 卖价 − 买价 − 路费/税 − 风险损失；随距离与价差正相关；超载禁止出发。
 */
import { goodOf, TRADE_GOODS } from '../data/tradeGoods';
import { cityById, isSpecialty, isDemand, stockTargetOf, tradeCities } from '../data/cities';
import { cityOf } from '../data/regions';
import { K_SD, SD_MIN, SD_MAX, VOLATILITY_BASE, DRIFT_DECAY, DRIFT_CAP, STOCK_RECOVER } from '../data/marketTuning';
import { repOf } from './FactionSystem';
import { record } from './Chronicle';
import { advanceRumors, settleRumors } from './Rumor';
import { sum as sumEffect } from './ItemEffects';
import { hash01, hashRange } from './hash';
import { useInventoryStore } from '../store/useInventoryStore';
import { useGameStore } from '../store/useGameStore';
import { useWorldStore } from '../store/useWorldStore';
import { useNpcStore } from '../store/useNpcStore';

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

/**
 * 供需系数：由"库存偏离 vs 基准库存"决定。
 * stock 为偏离值（正=积压、负=稀缺），target 为基准库存。
 * 买空 → 偏离变负 → 系数 >1 涨价；倾销 → 偏离变正 → 系数 <1 降价。
 */
export function supplyDemandMult(cityId: string, goodId: string, stockDeviation: number): number {
  const target = stockTargetOf(cityId, goodId);
  if (target <= 0) return 1;
  return clamp(1 - K_SD * (stockDeviation / target), SD_MIN, SD_MAX);
}

/** 当日世界事件倍率（集市/丰饶/妖气），缺省 1.0 */
export function dailyEventMult(day: number): number {
  const ev = useWorldStore.getState().dailyEvent;
  if (!ev || Math.floor(ev.day) !== day) return 1.0;
  if (ev.kind === 'industry') return 0.9;   // 集市：货多价贱
  if (ev.kind === 'calm') return 1.0;        // 风调雨顺：无影响
  if (ev.kind === 'battle') return 1.1;      // 妖气：路险价高
  return 1.0;
}

/**
 * 唯一价格出口。只对 8 座跑商城（CityDef.trade === true）有效；
 * 非跑商据点返回 null（拒绝报价，避免顺手给大唐东也接上买卖）。
 *
 * 公式（§2，系数集中 marketTuning）：
 *   基准   = basePrice
 *   地域   = 特产×0.70 ｜ 需求×1.35 ｜ 其他×1.00（isSpecialty/isDemand）
 *   全城   = city.goodsScale
 *   供需   = supplyDemandMult（库存偏离 vs 基准库存，SD_MIN~SD_MAX）
 *   波动   = 1 + drift（每日 AR(1) 漂移，E2）
 *   事件   = dailyEventMult
 *   声望   = 1 - min(0.15, factionRep/1000 + 城内亲密度/2000)
 *   买价   = round(基准×地域×全城×供需×波动×事件×声望)
 *   卖价   = round(...×0.85)
 */
export function priceOf(goodId: string, cityId: string, opts?: { side: 'buy' | 'sell' }): number | null {
  const city = cityById(cityId);
  const good = goodOf(goodId);
  if (!city || !good) return null;
  // 非跑商据点没有货架，拒绝报价
  if (!city.trade) return null;

  const side = opts?.side ?? 'buy';
  const day = Math.floor(useWorldStore.getState().day);

  // 地域
  let region = 1.0;
  if (isSpecialty(cityId, goodId)) region = 0.7;
  else if (isDemand(cityId, goodId)) region = 1.35;

  // 供需：库存偏离 vs 基准库存
  const stock = useWorldStore.getState().getMarketStock(cityId, goodId);
  const sdMult = supplyDemandMult(cityId, goodId, stock);

  // 每日波动（E2）
  const drift = useWorldStore.getState().drift[`${cityId}:${goodId}`] ?? 0;
  const driftMult = 1 + drift;

  // 声望：势力声望 + 城内亲密度
  let repDiscount = 0;
  if (city.factionId) {
    repDiscount += Math.max(0, repOf(city.factionId)) / 1000;
  }
  const npcIds = city.npcIds ?? [];
  if (npcIds.length > 0) {
    const avgAffinity = npcIds.reduce((s, id) => s + useNpcStore.getState().getNpcAffinity(id), 0) / npcIds.length;
    repDiscount += Math.max(0, avgAffinity) / 2000;
  }
  const repMult = 1 - Math.min(0.15, repDiscount);

  const raw = good.basePrice
    * region
    * city.goodsScale
    * sdMult
    * driftMult
    * dailyEventMult(day)
    * repMult
    * (side === 'sell' ? 0.85 : 1.0);

  return Math.max(1, Math.round(raw));
}

/** 卖违禁品给城市铺子：价格 ×1.6，但掉该城势力声望 */
export function contrabandPrice(goodId: string, cityId: string): number | null {
  const base = priceOf(goodId, cityId, { side: 'sell' });
  const good = goodOf(goodId);
  if (base == null || !good) return null;
  if (good.category === 'contraband') return Math.round(base * 1.6);
  return base;
}

/** 跨城成交按阈值写入编年史（M6 商路编年史）：单笔套利 ≥ 500 金记录 */
export function recordTradeProfit(cityId: string, goodId: string, qty: number, profit: number): void {
  if (profit < 500) return;
  const city = cityById(cityId);
  const good = goodOf(goodId);
  record({
    kind: 'trade',
    actors: [cityId, 'player'],
    placeId: cityId,
    text: `你在${city?.name ?? cityId}出手${good?.name ?? goodId}×${qty}，一趟净赚 ${profit} 金。`,
    importance: 2,
    tags: ['跑商'],
  });
}

/** 基础运力 + 词条加成 */
export function carryCapacity(): number {
  return 20 + Math.floor(sumEffect('carry'));
}

/** 当前 cargo 已占运力 */
export function cargoWeight(): number {
  return useInventoryStore.getState().getCargoWeight();
}

/** 剩余运力 */
export function freeCapacity(): number {
  return Math.max(0, carryCapacity() - cargoWeight());
}

/** 买入：校验运力，超载返回 null；成交后按数量写库存（买走 → 库存偏离变负 → 涨价） */
export function buyAtCity(cityId: string, goodId: string, qty: number, _day: number): { unitPrice: number; total: number; over: boolean } | null {
  const good = goodOf(goodId);
  if (!good) return null;
  const need = good.weight * qty;
  if (need > freeCapacity()) {
    return { unitPrice: 0, total: 0, over: true };
  }
  const game = useGameStore.getState();
  const unitPrice = priceOf(goodId, cityId, { side: 'buy' }) ?? 0;
  const total = unitPrice * qty;
  if (game.hero.gold < total) return null;
  game.addGold(-total);
  useInventoryStore.getState().addCargo(goodId, qty);
  // 买走货物 → 库存下降（偏离 -qty）→ 价涨
  useWorldStore.getState().adjustMarketStock(cityId, goodId, -qty);
  return { unitPrice, total, over: false };
}

/** 卖出：结算当前价，清空 cargo；成交后按数量写库存（倾销 → 偏离变正 → 降价） */
export function sellAtCity(cityId: string, goodId: string, qty: number, _day: number): { unitPrice: number; total: number } {
  const unitPrice = priceOf(goodId, cityId, { side: 'sell' }) ?? 0;
  const total = unitPrice * qty;
  useInventoryStore.getState().removeCargo(goodId, qty);
  useGameStore.getState().addGold(total);
  // 倾销 → 库存上升（偏离 +qty）→ 降价
  useWorldStore.getState().adjustMarketStock(cityId, goodId, qty);
  return { unitPrice, total };
}

/** 某城某货的当前价（情报/风险估值统一走 priceOf 的买价口径） */
export function effectivePrice(cityId: string, goodId: string, _day: number): number {
  return priceOf(goodId, cityId, { side: 'buy' }) ?? 0;
}

// ── 路线风险 ──

export type RoadEventKind = 'none' | 'bandit' | 'tariff' | 'inspect';

export interface RoadEventResult {
  kind: RoadEventKind;
  text: string;
  goldLost: number;
  /** 违禁品被没收的数量（goodId → count） */
  confiscated?: Record<string, number>;
}

/**
 * 运输途中掷事件（确定性：用 hash(day+fromCity+toCity+cargo) 保证同一次出发结果可复现）。
 * 风险与距离/治安/货值相关：治安越低、货值越高，越易出事。
 */
export function rollRoadEvent(fromCityId: string, toCityId: string, day: number): RoadEventResult {
  const cargo = useInventoryStore.getState().cargo;
  const cargoValue = Object.entries(cargo).reduce((sum, [goodId, count]) => {
    return sum + effectivePrice(fromCityId, goodId, day) * count;
  }, 0);
  const fromCity = cityOf(fromCityId);
  const security = fromCity?.security ?? 0.7;

  // 风险概率：治安低、货值高 → 更容易出事；但总概率封顶 60%
  const danger = (1 - security) * 0.5 + Math.min(0.25, cargoValue / 20000);
  const h = hash01(`${day}:${fromCityId}:${toCityId}:travel`);

  if (h < danger) {
    // 二选一：山匪劫货（损失比例）或 关税/盘查
    const sub = hash01(`${day}:${fromCityId}:${toCityId}:sub`);
    if (sub < 0.5) {
      // 山匪：按货值 20%~40% 损失金币（货物被抢）
      const pct = hashRange(`${day}:${fromCityId}:${toCityId}:bandit`, 20, 40) / 100;
      const goldLost = Math.floor(cargoValue * pct);
      return { kind: 'bandit', text: `途中遭遇山匪，货物被劫，损失 ${goldLost} 金（约 ${Math.round(pct * 100)}%）`, goldLost };
    } else if (sub < 0.8) {
      // 关税：按货值 8%~15%
      const pct = hashRange(`${day}:${fromCityId}:${toCityId}:tariff`, 8, 15) / 100;
      const goldLost = Math.floor(cargoValue * pct);
      return { kind: 'tariff', text: `入关被征收关税 ${goldLost} 金（约 ${Math.round(pct * 100)}%）`, goldLost };
    } else {
      // 盘查：违禁品被没收
      const confiscated: Record<string, number> = {};
      for (const [goodId, count] of Object.entries(cargo)) {
        const good = goodOf(goodId);
        if (good?.category === 'contraband' && count > 0) {
          confiscated[goodId] = count;
        }
      }
      if (Object.keys(confiscated).length === 0) {
        return { kind: 'none', text: '', goldLost: 0 };
      }
      const names = Object.keys(confiscated).map((g) => `${goodOf(g)?.name}×${confiscated[g]}`).join('、');
      return { kind: 'inspect', text: `盘查时违禁品被查获没收：${names}`, goldLost: 0, confiscated };
    }
  }

  return { kind: 'none', text: '', goldLost: 0 };
}

/** 结算一次跨城运输的完整结果（含风险） */
export interface TradeTripResult {
  fromCityId: string;
  toCityId: string;
  soldTotal: number;
  roadEvent: RoadEventResult;
  netProfit: number;
  text: string;
}

/**
 * 跑商：把 cargo 里的货全部在 toCity 卖出，途中掷风险。
 * 返回净收益与文案。超载在 buyAtCity 已拦截，此处不重复。
 */
export function completeTrip(fromCityId: string, toCityId: string, day: number): TradeTripResult {
  const inv = useInventoryStore.getState();

  // 途中风险（先于卖出结算，因为货可能在途中被劫/没收）
  const roadEvent = rollRoadEvent(fromCityId, toCityId, day);

  // 应用风险：山匪/关税扣金币；盘查没收违禁品
  let goldLost = 0;
  if (roadEvent.kind === 'bandit' || roadEvent.kind === 'tariff') {
    goldLost = roadEvent.goldLost;
    useGameStore.getState().addGold(-goldLost);
  }
  if (roadEvent.kind === 'inspect' && roadEvent.confiscated) {
    for (const [goodId, count] of Object.entries(roadEvent.confiscated)) {
      inv.removeCargo(goodId, count);
    }
  }

  // 卖出剩余货物
  let soldTotal = 0;
  for (const [goodId, count] of Object.entries(inv.cargo)) {
    if (count <= 0) continue;
    soldTotal += sellAtCity(toCityId, goodId, count, day).total;
  }

  // 净收益：卖出所得 − 风险损失（买入成本已在 buyAtCity 扣过，此处只算本次旅途）
  const netProfit = soldTotal - goldLost;

  const parts: string[] = [];
  if (soldTotal > 0) parts.push(`售出得 ${soldTotal} 金`);
  if (roadEvent.text) parts.push(roadEvent.text);
  const text = parts.length ? parts.join('；') : '一路无事。';

  return { fromCityId, toCityId, soldTotal, roadEvent, netProfit, text };
}

// ── 信息层（情报） ──

export interface MarketIntel {
  cityId: string;
  goodId: string;
  price: number;
  day: number;
}

/** 情报是否过期（>3 天） */
export function isIntelStale(intel: MarketIntel, currentDay: number): boolean {
  return currentDay - intel.day > 3;
}

/** 打听某城某货的真实报价（intel 节点会调用） */
export function inquirePrice(cityId: string, goodId: string, day: number): MarketIntel {
  return { cityId, goodId, price: effectivePrice(cityId, goodId, day), day };
}

// ── 整城货架快照（原 Market.cityMarket 迁入，唯一价格口径） ──

export interface MarketQuote {
  cityId: string;
  goodId: string;
  day: number;
  price: number;
}

/** 城市市场一览：列出所有货物当日买价（唯一走 priceOf） */
export function cityMarket(cityId: string, day: number): MarketQuote[] {
  return TRADE_GOODS
    .filter((g) => g.category !== 'contraband')
    .map((g) => ({ cityId, goodId: g.id, day, price: priceOf(g.id, cityId, { side: 'buy' }) ?? 0 }));
}

// ── 每日结算（波动 + 回弹；挂 applyDayCrossing，一次跨 N 天结算 N 次） ──

/** 确定性近似正态（3 次均匀和），用 hash01 保证同日同城同货稳定 */
function gauss01(seed: string): number {
  // 3 个 [0,1) 均匀值之和 → 均值 1.5，减 1.5 后近似 N(0, ~0.5)
  const u = hash01(`${seed}:0`) + hash01(`${seed}:1`) + hash01(`${seed}:2`);
  return (u - 1.5) / 0.5; // 归一化到近似标准正态
}

/**
 * 推进市场 N 天（每次跨整数天调用 N 次）。
 * 每天：① 波动 drift 做 AR(1) 漂移；② 库存偏离向 0 回弹；③ 流言生成/过期（E3 由 Rumor 挂接）。
 */
export function advanceMarketDays(days: number): void {
  const world = useWorldStore.getState();
  const day = Math.floor(world.day);
  const drift = { ...world.drift };
  const stock = { ...world.marketStock };

  for (let i = 0; i < days; i++) {
    const curDay = day - days + i + 1; // 逐日推进（第 N 天）
    for (const city of tradeCities()) {
      for (const g of TRADE_GOODS) {
        const key = `${city.id}:${g.id}`;
        // ① 波动：AR(1)
        const sigma = VOLATILITY_BASE * g.volatility;
        const prev = drift[key] ?? 0;
        const next = clamp(prev * DRIFT_DECAY + gauss01(`${curDay}:${key}:drift`) * sigma, -DRIFT_CAP, DRIFT_CAP);
        drift[key] = next;
        // ② 回弹：偏离向 0 回归
        const cur = stock[key] ?? 0;
        stock[key] = cur * (1 - STOCK_RECOVER);
      }
    }
  }

  useWorldStore.setState({ drift, marketStock: stock });

  // 流言：先结算过期（把到期流言计入信誉），再生成新流言（会清理已过期条目）
  const finalDay = Math.floor(useWorldStore.getState().day);
  settleRumors(finalDay);
  advanceRumors(finalDay);
}
