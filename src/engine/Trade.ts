/**
 * Trade — 跑商闭环（世界广度 R3）
 *
 * 三件套：
 * 1. 信息差：外地行情靠打听（intel 节点），情报 3 天过期
 * 2. 运力限制：carryCapacity = 基础20 + 车/驮兽 + 队友 + ItemEffects.sum('carry')
 * 3. 路线风险：按距离/治安掷事件——山匪（复用 VisitSystem 思路）、关税、盘查（违禁品没收）
 *
 * 净收益 = 卖价 − 买价 − 路费/税 − 风险损失；随距离与价差正相关；超载禁止出发。
 */
import { goodOf } from '../data/tradeGoods';
import { cityOf } from '../data/regions';
import { sum as sumEffect } from './ItemEffects';
import { hash01, hashRange } from './hash';
import { useInventoryStore } from '../store/useInventoryStore';
import { useGameStore } from '../store/useGameStore';
import { effectivePrice, buyGood, sellGood } from './Market';

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

/** 买入：校验运力，超载返回 null */
export function buyAtCity(cityId: string, goodId: string, qty: number, day: number): { unitPrice: number; total: number; over: boolean } | null {
  const good = goodOf(goodId);
  if (!good) return null;
  const need = good.weight * qty;
  if (need > freeCapacity()) {
    return { unitPrice: 0, total: 0, over: true };
  }
  const game = useGameStore.getState();
  const { unitPrice, total } = buyGood(cityId, goodId, qty, day);
  if (game.hero.gold < total) return null;
  game.addGold(-total);
  useInventoryStore.getState().addCargo(goodId, qty);
  return { unitPrice, total, over: false };
}

/** 卖出：结算当前价，清空 cargo */
export function sellAtCity(cityId: string, goodId: string, qty: number, day: number): { unitPrice: number; total: number } {
  const { unitPrice, total } = sellGood(cityId, goodId, qty, day);
  useInventoryStore.getState().removeCargo(goodId, qty);
  useGameStore.getState().addGold(total);
  return { unitPrice, total };
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
