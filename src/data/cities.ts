/**
 * cities — 城市名册（跑商与城市系统 M1）
 *
 * 13 城 = 8 座跑商城（trade: true，有铺子货架）+ 5 座非跑商据点（trade: false，无货架）。
 * 归属关系（特产/需求）只在这里声明，货物数据（tradeGoods.ts）不写"属于哪座城"——单一真相。
 *
 * 方位是硬约束（见实现文档 3.1.1）：
 *   洛阳在长安东、阳关在长安西、益州在长安西南、荆州/扬州在南半图与底部、
 *   大唐东在大唐南右侧、建邺紧贴东海、傲来国/花果山在东海外侧。
 */
export type CityRank = 'capital' | 'prefecture' | 'gate' | 'port' | 'tribal' | 'starter';

export type CityService = 'shop' | 'inn' | 'forge' | 'bounty' | 'estate' | 'dock';

export interface CityDef {
  id: string;
  name: string;
  rank: CityRank;
  regionId: string;
  /** 地图上的入口格子（城市上地图的锚点，必填） */
  cellId: string;
  /** 对应 MAPS 里的城（isCity） */
  mapId?: string;
  factionId?: string;
  /** 全城物价系数（0.9 便宜 ~ 1.15 贵） */
  goodsScale: number;
  /** 是否有货架（跑商城）。只有 8 座为 true */
  trade: boolean;
  npcIds: string[];
  /** 特产 goodsId：本地便宜（×0.7）；非跑商城留空 */
  specialties: string[];
  /** 需求 goodsId：本地贵（×1.35）；非跑商城留空 */
  demands: string[];
  /** 禁售/违禁 */
  banned: string[];
  services: CityService[];
  desc: string;
}

export const CITIES: CityDef[] = [
  // ═══════════ A. 跑商城（8 座，trade: true） ═══════════
  {
    id: 'changan', name: '长安', rank: 'capital', regionId: 'central_plain', cellId: 'cp_3_0',
    mapId: 'changan', factionId: 'changan_court', goodsScale: 1.0, trade: true,
    npcIds: ['changan_blacksmith', 'changan_herbalist', 'changan_tavern', 'changan_biaotou', 'changan_embroidery', 'changan_gongsun', 'changan_qinqiong'],
    specialties: ['guanchou', 'porcelain', 'shuji'],
    demands: ['shanzhen', 'haifood', 'yaoshou_neidan'],
    banned: ['opium', 'arms'],
    services: ['shop', 'inn', 'forge', 'bounty', 'estate'],
    desc: '大唐国都，天下繁华之所。官府与商会并立，规矩森严。',
  },
  {
    id: 'luoyang', name: '洛阳', rank: 'capital', regionId: 'dongdu', cellId: 'cp_5_1',
    mapId: 'changan', factionId: 'changan_court', goodsScale: 1.0, trade: true,
    npcIds: ['luoyang_merchant', 'luoyang_poet', 'luoyang_guard', 'luoyang_innkeeper', 'luoyang_porcelain', 'luoyang_scholar'],
    specialties: ['mudan', 'tangsancai', 'heluo_tushu', 'gongchou'],
    demands: ['zhenzhu', 'haiyan', 'shujin'],
    banned: ['opium'],
    services: ['shop', 'inn', 'forge', 'bounty', 'estate'],
    desc: '东都洛阳，河洛图书之府。牡丹一开，满城倾动。',
  },
  {
    id: 'yangguan', name: '阳关', rank: 'gate', regionId: 'hexi', cellId: 'hx_3_3',
    mapId: 'yangguan', factionId: 'changan_escort', goodsScale: 1.25, trade: true,
    npcIds: ['yangguan_merchant', 'yangguan_guard', 'yangguan_innkeeper', 'yangguan_hermit'],
    specialties: ['xiyu_sichou', 'liuliqi', 'bosiputao', 'hanxue_maan'],
    demands: ['liangshi', 'tieqi', 'yaocai'],
    banned: ['arms'],
    services: ['shop', 'inn', 'bounty'],
    desc: '西域门户，边贸驼队云集。鱼龙混杂，盗匪出没。',
  },
  {
    id: 'yizhou', name: '益州', rank: 'prefecture', regionId: 'shuzhong', cellId: 'cp_1_4',
    mapId: 'datangnan', factionId: 'changan_guild', goodsScale: 0.95, trade: true,
    npcIds: ['yizhou_broker', 'yizhou_weaver', 'yizhou_saltman', 'yizhou_herbalist', 'yizhou_guide'],
    specialties: ['shujin', 'jingyan', 'chuanxiong', 'shuxiu'],
    demands: ['porcelain', 'shuji', 'haifood'],
    banned: [],
    services: ['shop', 'inn', 'forge', 'bounty'],
    desc: '蜀中益州，天府之国。蜀锦云集，井盐丰饶。',
  },
  {
    id: 'jingzhou', name: '荆州', rank: 'prefecture', regionId: 'jingchu', cellId: 'cp_3_6',
    mapId: 'datangnan', factionId: 'changan_guild', goodsScale: 0.95, trade: true,
    npcIds: ['jingzhou_lacquerer', 'jingzhou_scribe', 'jingzhou_fisherman', 'jingzhou_merchant'],
    specialties: ['jingchu_qiqi', 'zhujian', 'jiangyu', 'jinduan'],
    demands: ['tieqi', 'yan', 'shuji'],
    banned: [],
    services: ['shop', 'inn', 'forge', 'bounty'],
    desc: '荆楚荆州，九省通衢。漆器竹简，江鱼肥美。',
  },
  {
    id: 'yangzhou', name: '扬州', rank: 'prefecture', regionId: 'jiangnan', cellId: 'cp_5_8',
    mapId: 'datangdong', factionId: 'changan_guild', goodsScale: 1.0, trade: true,
    npcIds: ['yangzhou_lacquerer', 'yangzhou_mirrormaker', 'yangzhou_broker', 'yangzhou_boatman'],
    specialties: ['yangzhou_qiqi', 'tongjing', 'jinduan', 'haiyan'],
    demands: ['yaocai', 'shanzhen', 'yaoshou_neidan'],
    banned: [],
    services: ['shop', 'inn', 'bounty'],
    desc: '江都扬州，烟花三月。漆器铜镜，天下闻名。',
  },
  {
    id: 'jianye', name: '建邺', rank: 'prefecture', regionId: 'jiangnan', cellId: 'cp_8_6',
    mapId: 'aolai', factionId: 'changan_guild', goodsScale: 1.0, trade: true,
    npcIds: ['jianye_weaver', 'jianye_stone', 'jianye_potter', 'jianye_tea', 'jianye_boatman'],
    specialties: ['yunjin', 'yuhuashi', 'qingci', 'wuling', 'cha'],
    demands: ['tieqi', 'shuji', 'yaocai'],
    banned: [],
    services: ['shop', 'inn', 'estate'],
    desc: '升州建邺，江南水乡门户。云锦青瓷，吴绫飘香。',
  },
  {
    id: 'donghai', name: '东海', rank: 'port', regionId: 'donghai', cellId: 'dh_3_3',
    mapId: 'donghai', factionId: 'donghai_dragon', goodsScale: 1.1, trade: true,
    npcIds: ['donghai_aoguang', 'donghai_merchant', 'donghai_fisherman', 'donghai_turtle'],
    specialties: ['zhenzhu', 'haiyan', 'shanhu', 'haishe_dan'],
    demands: ['porcelain', 'tieqi', 'shuji'],
    banned: ['opium'],
    services: ['shop', 'inn', 'bounty', 'dock'],
    desc: '东海龙宫，碧波深处的琉璃殿宇。海货丰饶，珠光潋滟。',
  },

  // ═══════════ B. 非跑商据点（5 座，trade: false，无货架） ═══════════
  {
    id: 'datangdong', name: '大唐东', rank: 'prefecture', regionId: 'central_plain', cellId: 'cp_6_3',
    mapId: 'datangdong', factionId: 'changan_court', goodsScale: 1.0, trade: false,
    npcIds: ['dong_liu', 'dong_merchant', 'dong_innkeeper', 'dong_guard'],
    specialties: [], demands: [], banned: [],
    services: ['inn', 'forge', 'bounty'],
    desc: '东方重镇，客栈云集，行旅如织。',
  },
  {
    id: 'datangnan', name: '大唐南', rank: 'prefecture', regionId: 'central_plain', cellId: 'cp_4_3',
    mapId: 'datangnan', factionId: 'changan_court', goodsScale: 1.0, trade: false,
    npcIds: ['nan_zhang', 'nan_merchant', 'nan_innkeeper', 'nan_guard'],
    specialties: [], demands: [], banned: [],
    services: ['inn', 'forge', 'bounty'],
    desc: '南方商埠，南来北往，货物集散。',
  },
  {
    id: 'huaguoshan', name: '花果山', rank: 'tribal', regionId: 'central_plain', cellId: 'cp_10_3',
    mapId: 'huaguoshan', factionId: 'yaozu', goodsScale: 1.0, trade: false,
    npcIds: ['huaguo_tongbei', 'huaguo_liuermihou', 'huaguo_monkeymerchant'],
    specialties: [], demands: [], banned: [],
    services: ['inn'],
    desc: '齐天大圣的故乡，猴群遍山，灵气逼人。',
  },
  {
    id: 'wuzhishan', name: '五指山', rank: 'starter', regionId: 'central_plain', cellId: 'cp_1_3',
    mapId: 'datangdong', factionId: 'changan_temple', goodsScale: 1.0, trade: false,
    npcIds: ['wuzhi_chen', 'wuzhi_monk'],
    specialties: [], demands: [], banned: [],
    services: ['bounty'],
    desc: '边地小镇，五行山下，曾有猢狲被压五百年。',
  },
  {
    id: 'aolai', name: '傲来国', rank: 'starter', regionId: 'central_plain', cellId: 'cp_9_2',
    mapId: 'aolai', factionId: 'changan_court', goodsScale: 1.0, trade: false,
    npcIds: ['aolai_wanderer', 'aolai_nightpatrol'],
    specialties: [], demands: [], banned: [],
    services: ['inn'],
    desc: '海外小国，花果山下的国度，你的出生之地。',
  },
];

// ── 查询工具 ──

export function cityById(id: string): CityDef | undefined {
  return CITIES.find((c) => c.id === id);
}

export function cityAtCell(cellId: string): CityDef | undefined {
  return CITIES.find((c) => c.cellId === cellId);
}

/** 8 座跑商城 */
export function tradeCities(): CityDef[] {
  return CITIES.filter((c) => c.trade);
}

/** 某城特产判定：本地便宜（×0.7） */
export function isSpecialty(cityId: string, goodId: string): boolean {
  return cityById(cityId)?.specialties.includes(goodId) ?? false;
}

/** 某城需求判定：本地贵（×1.35） */
export function isDemand(cityId: string, goodId: string): boolean {
  return cityById(cityId)?.demands.includes(goodId) ?? false;
}
