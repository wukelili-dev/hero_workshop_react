/**
 * factions — 势力静态数据（活人世界 P1-3）
 * 每个势力：名号 / 类型 / 据点 / 实力 / 描述。
 * 玩家对势力的声望存 useWorldStore.factionRep。
 */
export interface FactionDef {
  id: string;
  name: string;
  kind: 'sect' | 'guild' | 'court' | 'temple' | 'tribe';
  homePlace: string;
  power: number;
  description: string;
}

export const FACTIONS: FactionDef[] = [
  {
    id: 'changan_court',
    name: '官府',
    kind: 'court',
    homePlace: '长安',
    power: 90,
    description: '大唐朝廷。魏征与唐太宗坐镇，管着长安城的一方秩序。',
  },
  {
    id: 'changan_guild',
    name: '西市商会',
    kind: 'guild',
    homePlace: '长安',
    power: 55,
    description: '老张头、孙二娘、裴绣娘这些买卖人抱团取暖，最讲一个"和气生财"。',
  },
  {
    id: 'changan_escort',
    name: '龙门镖局',
    kind: 'guild',
    homePlace: '长安',
    power: 60,
    description: '赵镖头一杆大枪走南闯北，镖局上下最重义气，也最记仇。',
  },
  {
    id: 'changan_temple',
    name: '佛门',
    kind: 'temple',
    homePlace: '长安',
    power: 70,
    description: '玄奘法师讲经，观音菩萨点化。佛门不轻易结怨，但结下了就难解。',
  },
];

/** 声望阈值：≤-60 封锁据点；≤-30 商人涨价拒卖；≥40 解锁势力任务与庇护 */
export const REP_BLOCK = -60;
export const REP_BAN = -30;
export const REP_PROTECT = 40;

export function factionOf(id: string): FactionDef | undefined {
  return FACTIONS.find((f) => f.id === id);
}

/** 势力名（未匹配就原样返回） */
export function factionName(id: string): string {
  return factionOf(id)?.name ?? id;
}
