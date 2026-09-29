/**
 * tradeGoods — 跑商货物数据（跑商与城市系统 M1）
 *
 * 六类货物（food/craft/luxury/medicine/contraband/exotic/relic）。
 * 货物不写"属于哪座城"——归属关系只由 cities.ts 的 specialties/demands 决定（单一真相）。
 */
export type GoodCategory = 'food' | 'craft' | 'luxury' | 'medicine' | 'contraband' | 'exotic' | 'relic';

export interface TradeGood {
  id: string;
  name: string;
  category: GoodCategory;
  basePrice: number;
  /** 占运力 */
  weight: number;
  /** 0~1，日波动幅度（异域/灵物波动大，粮食波动小） */
  volatility: number;
}

export const TRADE_GOODS: TradeGood[] = [
  // ── 粮食（波动小，运力轻） ──
  { id: 'liangshi', name: '粮食', category: 'food', basePrice: 10, weight: 1, volatility: 0.2 },
  { id: 'yan', name: '盐', category: 'food', basePrice: 25, weight: 1, volatility: 0.3 },
  { id: 'haiyan', name: '海盐', category: 'food', basePrice: 45, weight: 2, volatility: 0.3 },
  { id: 'jingyan', name: '井盐', category: 'food', basePrice: 55, weight: 2, volatility: 0.25 },
  { id: 'jiangyu', name: '江鱼', category: 'food', basePrice: 40, weight: 2, volatility: 0.35 },
  { id: 'shanzhen', name: '山珍', category: 'food', basePrice: 120, weight: 2, volatility: 0.4 },
  { id: 'haifood', name: '海货', category: 'food', basePrice: 90, weight: 2, volatility: 0.4 },
  { id: 'xiantao', name: '仙桃', category: 'food', basePrice: 180, weight: 1, volatility: 0.45 },

  // ── 手工艺（craft） ──
  { id: 'porcelain', name: '瓷器', category: 'craft', basePrice: 150, weight: 3, volatility: 0.3 },
  { id: 'tieqi', name: '铁器', category: 'craft', basePrice: 90, weight: 3, volatility: 0.25 },
  { id: 'shuji', name: '书籍', category: 'craft', basePrice: 60, weight: 1, volatility: 0.3 },
  { id: 'yunjin', name: '云锦', category: 'craft', basePrice: 260, weight: 2, volatility: 0.35 },
  { id: 'wuling', name: '吴绫', category: 'craft', basePrice: 200, weight: 1, volatility: 0.35 },
  { id: 'shujin', name: '蜀锦', category: 'craft', basePrice: 280, weight: 2, volatility: 0.35 },
  { id: 'jinduan', name: '锦缎', category: 'craft', basePrice: 160, weight: 2, volatility: 0.3 },
  { id: 'yangzhou_qiqi', name: '扬州漆器', category: 'craft', basePrice: 300, weight: 2, volatility: 0.35 },
  { id: 'jingchu_qiqi', name: '荆楚漆器', category: 'craft', basePrice: 260, weight: 2, volatility: 0.35 },
  { id: 'tangsancai', name: '唐三彩', category: 'craft', basePrice: 320, weight: 3, volatility: 0.3 },
  { id: 'qingci', name: '青瓷', category: 'craft', basePrice: 220, weight: 3, volatility: 0.3 },
  { id: 'tongjing', name: '铜镜', category: 'craft', basePrice: 180, weight: 2, volatility: 0.3 },
  { id: 'heluo_tushu', name: '河洛图书', category: 'craft', basePrice: 240, weight: 1, volatility: 0.35 },
  { id: 'zhujian', name: '竹简', category: 'craft', basePrice: 90, weight: 2, volatility: 0.3 },

  // ── 奢侈品（luxury） ──
  { id: 'mudan', name: '牡丹', category: 'luxury', basePrice: 200, weight: 1, volatility: 0.4 },
  { id: 'yuhuashi', name: '雨花石', category: 'luxury', basePrice: 150, weight: 1, volatility: 0.4 },
  { id: 'zhenzhu', name: '珍珠', category: 'luxury', basePrice: 350, weight: 1, volatility: 0.4 },
  { id: 'shuxiu', name: '蜀绣', category: 'luxury', basePrice: 300, weight: 1, volatility: 0.35 },
  { id: 'guanchou', name: '官绸', category: 'luxury', basePrice: 250, weight: 2, volatility: 0.3 },
  { id: 'gongchou', name: '宫绸', category: 'luxury', basePrice: 270, weight: 2, volatility: 0.3 },

  // ── 药材（medicine） ──
  { id: 'yaocai', name: '药材', category: 'medicine', basePrice: 70, weight: 1, volatility: 0.35 },
  { id: 'chuanxiong', name: '川芎', category: 'medicine', basePrice: 130, weight: 1, volatility: 0.35 },
  { id: 'cha', name: '茶', category: 'medicine', basePrice: 50, weight: 1, volatility: 0.3 },

  // ── 违禁品（contraband，高风险高收益） ──
  { id: 'opium', name: '阿芙蓉', category: 'contraband', basePrice: 400, weight: 1, volatility: 0.5 },
  { id: 'arms', name: '私盐军械', category: 'contraband', basePrice: 500, weight: 3, volatility: 0.5 },

  // ── 异域（exotic，阳关/西域货，波动大） ──
  { id: 'xiyu_sichou', name: '西域丝绸', category: 'exotic', basePrice: 380, weight: 2, volatility: 0.5 },
  { id: 'yutianyu', name: '于阗玉', category: 'exotic', basePrice: 420, weight: 2, volatility: 0.45 },
  { id: 'liuliqi', name: '琉璃器', category: 'exotic', basePrice: 300, weight: 2, volatility: 0.45 },
  { id: 'bosiputao', name: '波斯葡萄酒', category: 'exotic', basePrice: 260, weight: 2, volatility: 0.5 },
  { id: 'hanxue_maan', name: '汗血马鞍', category: 'exotic', basePrice: 500, weight: 3, volatility: 0.45 },
  { id: 'ruxiang', name: '乳香', category: 'exotic', basePrice: 200, weight: 1, volatility: 0.5 },

  // ── 灵物（relic，花果山/东海特产，波动大） ──
  { id: 'jiuzhuan_lingguo', name: '九转灵果', category: 'relic', basePrice: 600, weight: 1, volatility: 0.55 },
  { id: 'houer_jiu', name: '猴儿酒', category: 'relic', basePrice: 400, weight: 2, volatility: 0.5 },
  { id: 'haishe_dan', name: '海蛇胆', category: 'relic', basePrice: 350, weight: 1, volatility: 0.5 },
  { id: 'shanhu', name: '珊瑚', category: 'relic', basePrice: 320, weight: 2, volatility: 0.45 },
  { id: 'yaoshou_neidan', name: '妖兽内丹', category: 'relic', basePrice: 800, weight: 1, volatility: 0.55 },
  { id: 'fuzhi', name: '符纸', category: 'relic', basePrice: 120, weight: 1, volatility: 0.45 },
];

export function goodOf(id: string): TradeGood | undefined {
  return TRADE_GOODS.find((g) => g.id === id);
}

/** 货物显示名 */
export function goodName(id: string): string {
  return goodOf(id)?.name ?? id;
}

// ── 兼容旧引用（世界广度 R2 遗留的供需表已由 cities.ts 的 specialties/demands 取代） ──
/**
 * @deprecated 归属关系已迁到 cities.ts 的 specialties/demands；此函数仅保留供旧调用编译通过。
 * 新的价格逻辑一律走 engine/Trade.ts 的 priceOf()。
 */
export function supplyDemandOf(_cityId: string, _goodId: string): { supply: number; demand: number } {
  return { supply: 1, demand: 1 };
}
