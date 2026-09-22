// ============ 格子遭遇表 ============
// 把棋盘上的每一格接到实际可战斗的妖怪上。
// - 据点/副本：绑 data/maps.ts 的战斗地图（自带 Boss、解锁等级与解锁费）
// - 野外遭遇：直接列出该格出没的妖怪（id 见 MONSTERS）

import { MAPS, MONSTERS } from './maps';
import type { Monster } from '../types';

export interface CellEncounter {
  /** 遭遇组名（一般是格子地标名） */
  label: string;
  /** 绑定到 data/maps.ts 的地图 id */
  mapId?: string;
  /** 野外妖怪表（MONSTERS 的 id） */
  monsters?: string[];
  /** 该地 Boss（MONSTERS 的 id） */
  boss?: string;
}

export const CELL_ENCOUNTERS: Record<string, CellEncounter> = {
  // ── 主城 / 据点（复用已有战斗地图的怪物表与 Boss） ──
  cp_3_0: { label: '长安城', mapId: 'changan' },
  cp_2_5: { label: '傲来国', mapId: 'aolai' },
  cp_1_3: { label: '大唐东', mapId: 'datangdong' },
  cp_5_1: { label: '阳关', mapId: 'yangguan' },
  cp_5_3: { label: '大唐南', mapId: 'datangnan' },
  cp_3_6: { label: '东海龙宫', mapId: 'donghai' },
  cp_3_5: { label: '花果山', mapId: 'huaguoshan' },

  // ── 副本 ──
  cp_6_2: { label: '匪寨', mapId: 'datangdong' },
  cp_6_4: { label: '古墓', mapId: 'datangnan' },
  cp_0_6: { label: '火云洞', mapId: 'datangdong' },

  // ── 野外遭遇 ──
  cp_2_0: { label: '狼群', monsters: ['灰狼', '毒蛇'], boss: '狼王' },
  cp_5_0: { label: '河妖', monsters: ['河妖', '毒蛇'] },
  cp_4_1: { label: '强盗营地', monsters: ['山贼'], boss: '山贼头目' },
  cp_0_2: { label: '虎啸山林', monsters: ['山君', '沼泽巨蜥'] },
  cp_6_3: { label: '毒蛇谷', monsters: ['毒蛇', '灰狼'] },
  cp_0_3: { label: '湖底蛟龙', monsters: ['河妖', '沼泽巨蜥'], boss: '蛟' },
  cp_0_4: { label: '沼泽怪兽', monsters: ['沼泽巨蜥', '毒蛇'] },
  cp_4_5: { label: '猴群', monsters: ['野猴'] },
  cp_0_5: { label: '熊洞', monsters: ['沼泽巨蜥', '毒蛇'], boss: '黑熊精' },
  cp_1_6: { label: '沙虫', monsters: ['沙虫', '沼泽巨蜥'] },
  cp_4_6: { label: '海怪', monsters: ['海蛇'] },
};

export interface ResolvedEncounter {
  label: string;
  monsters: Monster[];
  boss?: Monster;
  mapId?: string;
}

/** 取某格的遭遇内容；没有战斗内容的格子返回 null */
export function getCellEncounter(cellId: string): ResolvedEncounter | null {
  const enc = CELL_ENCOUNTERS[cellId];
  if (!enc) return null;
  const map = enc.mapId ? MAPS.find((m) => m.id === enc.mapId) : undefined;
  const monsters = enc.monsters
    ? enc.monsters.map((id) => MONSTERS[id]).filter(Boolean)
    : (map?.monsters ?? []);
  const boss = enc.boss ? MONSTERS[enc.boss] : map?.boss;
  return { label: enc.label, monsters, boss, mapId: enc.mapId };
}

/** 图鉴用：世界地图上所有可能遇到的妖怪（去重） */
export function getAllEncounterMonsters(): Monster[] {
  const out: Monster[] = [];
  const seen = new Set<string>();
  const push = (m?: Monster) => {
    if (!m || seen.has(m.id)) return;
    seen.add(m.id);
    out.push(m);
  };
  for (const cellId of Object.keys(CELL_ENCOUNTERS)) {
    const enc = getCellEncounter(cellId);
    if (!enc) continue;
    enc.monsters.forEach(push);
    push(enc.boss);
  }
  return out;
}
