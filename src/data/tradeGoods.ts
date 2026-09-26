/**
 * tradeGoods — 跑商货物数据（世界广度 R2）
 * 五类货物，每城有不同 supply/demand（特产本地多 → 便宜；稀缺 → 贵）。
 */
export type GoodCategory = 'food' | 'craft' | 'luxury' | 'medicine' | 'contraband';

export interface TradeGood {
  id: string;
  name: string;
  category: GoodCategory;
  basePrice: number;
  /** 占运力 */
  weight: number;
  /** 0~1，日波动幅度 */
  volatility: number;
}

export const TRADE_GOODS: TradeGood[] = [
  // 粮食
  { id: 'grain', name: '粮食', category: 'food', basePrice: 10, weight: 1, volatility: 0.3 },
  { id: 'salt', name: '盐', category: 'food', basePrice: 25, weight: 1, volatility: 0.4 },
  { id: 'tea', name: '茶叶', category: 'food', basePrice: 40, weight: 1, volatility: 0.35 },
  { id: 'wine', name: '美酒', category: 'food', basePrice: 60, weight: 2, volatility: 0.3 },
  // 手工艺品
  { id: 'silk', name: '丝绸', category: 'craft', basePrice: 120, weight: 2, volatility: 0.35 },
  { id: 'porcelain', name: '瓷器', category: 'craft', basePrice: 150, weight: 3, volatility: 0.3 },
  { id: 'ironware', name: '铁器', category: 'craft', basePrice: 90, weight: 3, volatility: 0.25 },
  { id: 'paper', name: '纸张', category: 'craft', basePrice: 50, weight: 1, volatility: 0.3 },
  // 奢侈品
  { id: 'jade', name: '玉石', category: 'luxury', basePrice: 300, weight: 2, volatility: 0.4 },
  { id: 'fur', name: '皮毛', category: 'luxury', basePrice: 220, weight: 2, volatility: 0.35 },
  { id: 'pearl', name: '珍珠', category: 'luxury', basePrice: 350, weight: 1, volatility: 0.4 },
  { id: 'spice', name: '香料', category: 'luxury', basePrice: 280, weight: 1, volatility: 0.45 },
  // 药材
  { id: 'herb', name: '药材', category: 'medicine', basePrice: 70, weight: 1, volatility: 0.35 },
  { id: 'ginseng', name: '人参', category: 'medicine', basePrice: 200, weight: 1, volatility: 0.4 },
  { id: 'bezoar', name: '牛黄', category: 'medicine', basePrice: 260, weight: 1, volatility: 0.35 },
  // 违禁品（高风险高收益，可被盘查没收）
  { id: 'opium', name: '阿芙蓉', category: 'contraband', basePrice: 400, weight: 1, volatility: 0.5 },
  { id: 'arms', name: '私盐军械', category: 'contraband', basePrice: 500, weight: 3, volatility: 0.5 },
];

export function goodOf(id: string): TradeGood | undefined {
  return TRADE_GOODS.find((g) => g.id === id);
}

/** 每城对每种货的供需（supply 高=本地产出多=便宜；demand 高=稀缺=贵） */
export interface CitySupplyDemand {
  cityId: string;
  /** goodId → { supply, demand } */
  entries: Record<string, { supply: number; demand: number }>;
}

/**
 * 各城供需表（基础值；跑商价差由此产生）。
 * supply/demand 取值范围建议 0~5，`supplyDemandFactor` 按其差值放大价格。
 */
export const CITY_SUPPLY_DEMAND: CitySupplyDemand[] = [
  {
    cityId: 'changan',
    entries: {
      // 长安：中原腹地，粮盐茶充足，丝绸瓷器（特产）便宜；缺玉/皮毛/珍珠（西域货）
      grain: { supply: 3, demand: 1 },
      salt: { supply: 2, demand: 1 },
      tea: { supply: 3, demand: 2 },
      wine: { supply: 2, demand: 2 },
      silk: { supply: 4, demand: 1 },
      porcelain: { supply: 3, demand: 1 },
      ironware: { supply: 2, demand: 1 },
      paper: { supply: 2, demand: 2 },
      jade: { supply: 0, demand: 4 },
      fur: { supply: 0, demand: 3 },
      pearl: { supply: 1, demand: 3 },
      spice: { supply: 1, demand: 3 },
      herb: { supply: 2, demand: 2 },
      ginseng: { supply: 1, demand: 3 },
      bezoar: { supply: 1, demand: 3 },
      opium: { supply: 0, demand: 3 },
      arms: { supply: 0, demand: 2 },
    },
  },
  {
    cityId: 'yangguan',
    entries: {
      // 阳关：西域门户，玉石皮毛（特产）便宜；缺粮盐茶丝绸瓷器（中原货）
      grain: { supply: 1, demand: 4 },
      salt: { supply: 1, demand: 4 },
      tea: { supply: 0, demand: 4 },
      wine: { supply: 2, demand: 3 },
      silk: { supply: 0, demand: 4 },
      porcelain: { supply: 0, demand: 4 },
      ironware: { supply: 1, demand: 3 },
      paper: { supply: 0, demand: 3 },
      jade: { supply: 4, demand: 1 },
      fur: { supply: 4, demand: 1 },
      pearl: { supply: 2, demand: 2 },
      spice: { supply: 3, demand: 2 },
      herb: { supply: 2, demand: 2 },
      ginseng: { supply: 1, demand: 3 },
      bezoar: { supply: 1, demand: 3 },
      opium: { supply: 3, demand: 1 },
      arms: { supply: 2, demand: 2 },
    },
  },
  {
    cityId: 'donghai',
    entries: {
      // 东海龙宫：珍珠海盐（特产）便宜；缺陆上丝绸瓷器铁器
      grain: { supply: 2, demand: 3 },
      salt: { supply: 4, demand: 1 },
      tea: { supply: 1, demand: 3 },
      wine: { supply: 2, demand: 3 },
      silk: { supply: 0, demand: 4 },
      porcelain: { supply: 0, demand: 3 },
      ironware: { supply: 1, demand: 3 },
      paper: { supply: 1, demand: 3 },
      jade: { supply: 2, demand: 3 },
      fur: { supply: 1, demand: 3 },
      pearl: { supply: 4, demand: 1 },
      spice: { supply: 2, demand: 2 },
      herb: { supply: 2, demand: 2 },
      ginseng: { supply: 2, demand: 2 },
      bezoar: { supply: 2, demand: 2 },
      opium: { supply: 1, demand: 2 },
      arms: { supply: 1, demand: 2 },
    },
  },
];

export function supplyDemandOf(cityId: string, goodId: string): { supply: number; demand: number } {
  const city = CITY_SUPPLY_DEMAND.find((c) => c.cityId === cityId);
  return city?.entries[goodId] ?? { supply: 1, demand: 1 };
}
