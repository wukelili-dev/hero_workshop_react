/**
 * WildCell — 野地格子随机生成（跑商与城市系统之后的探索层）
 *
 * 野地空格子（cellMap 里 features 为空的格子）在**未探索时**不写死内容，
 * 由这里按「确定性哈希」生成随机状态 + 随机机遇：
 *   - 状态：地形衍生（如森林「瘴气弥漫」、山地「古洞森森」、荒漠「风沙蔽日」…）
 *   - 机遇：遇怪 / 采集 / 奇遇（金银、宝箱、仙人） / 平静
 *
 * 同一格子每次探索结果稳定（hash01(cellId)），符合项目「禁止 Math.random 定价/内容」铁律。
 */
import { getCellById, type TerrainType } from '../data/cellMap';
import { MONSTERS } from '../data/maps';
import { hash01, hashRange, hashInt } from './hash';

export interface WildState {
  /** 状态名，如「瘴气弥漫」 */
  label: string;
  /** 一句水墨描述 */
  desc: string;
  /** 图标 */
  icon: string;
  /** 对遇怪概率的加成（-0.2 ~ +0.2） */
  dangerBias: number;
  /** 对机遇奖励的加成（0.8 ~ 1.3） */
  rewardMult: number;
}

export type WildOpportunityKind = 'monster' | 'gather' | 'fortune' | 'calm';

export interface WildOpportunity {
  kind: WildOpportunityKind;
  label: string;
  desc: string;
  icon: string;
  /** 遇怪：怪物 id 列表 */
  monsterIds?: string[];
  /** 采集：资源类型 */
  resourceType?: string;
  /** 奇遇：奖励类型 gold/exp/loot */
  rewardType?: 'gold' | 'exp' | 'loot';
  /** 奖励数值 */
  rewardValue?: number;
}

// ── 状态池（按地形） ──
const STATE_POOL: Record<TerrainType, WildState[]> = {
  plains: [
    { label: '荒草没膝', desc: '齐腰的荒草随风起伏，藏着不知名的窸窣声。', icon: '🌾', dangerBias: 0.05, rewardMult: 1.0 },
    { label: '野兽出没', desc: '草叶上有新鲜的血迹与爪痕。', icon: '🐾', dangerBias: 0.2, rewardMult: 1.1 },
    { label: '商队歇脚', desc: '官道旁有熄灭的篝火，似有商队在此过夜。', icon: '🏕️', dangerBias: -0.15, rewardMult: 1.2 },
    { label: '风吹草低', desc: '天朗气清，一眼望到天边。', icon: '🌬️', dangerBias: -0.1, rewardMult: 0.9 },
    { label: '野花遍野', desc: '不知名的野花开得正盛，蜂蝶飞舞。', icon: '🌸', dangerBias: -0.05, rewardMult: 1.0 },
  ],
  forest: [
    { label: '瘴气弥漫', desc: '林间浮着淡青的瘴气，久留恐伤身。', icon: '🌫️', dangerBias: 0.2, rewardMult: 1.15 },
    { label: '古木参天', desc: '遮天蔽日的古木间，透下几缕天光。', icon: '🌲', dangerBias: 0.0, rewardMult: 1.0 },
    { label: '野蜂飞舞', desc: '蜂群嗡嗡，暗处或藏着野蜂蜜。', icon: '🐝', dangerBias: 0.05, rewardMult: 1.2 },
    { label: '虎啸隐隐', desc: '远处传来低沉的虎啸，林鸟惊飞。', icon: '🐅', dangerBias: 0.25, rewardMult: 1.25 },
    { label: '落叶如毯', desc: '踩上去沙沙作响，林间幽静。', icon: '🍂', dangerBias: -0.1, rewardMult: 0.9 },
  ],
  mountain: [
    { label: '古洞森森', desc: '山壁上一处黑黢黢的洞，寒气逼人。', icon: '🕳️', dangerBias: 0.2, rewardMult: 1.2 },
    { label: '云海翻涌', desc: '半山之上，云海如涛，似有仙人踏云。', icon: '☁️', dangerBias: -0.15, rewardMult: 1.3 },
    { label: '险峰绝壁', desc: '一侧是万丈深渊，风大得站不稳。', icon: '⛰️', dangerBias: 0.1, rewardMult: 1.0 },
    { label: '矿脉露头', desc: '岩缝里泛着金属的光，似有矿脉。', icon: '💎', dangerBias: -0.05, rewardMult: 1.2 },
    { label: '山风呼啸', desc: '风过谷口，呜呜作响，如泣如诉。', icon: '🌪️', dangerBias: 0.0, rewardMult: 0.95 },
  ],
  water: [
    { label: '碧波荡漾', desc: '水色清冽，游鱼可数。', icon: '🌊', dangerBias: -0.1, rewardMult: 1.0 },
    { label: '暗流涌动', desc: '水下有暗流，水面却平静得诡异。', icon: '🌀', dangerBias: 0.2, rewardMult: 1.15 },
    { label: '鱼跃鳞光', desc: '不时有鱼跃出水面，银鳞一闪。', icon: '🐟', dangerBias: -0.15, rewardMult: 1.2 },
    { label: '水雾氤氲', desc: '水汽蒸腾，远处迷迷蒙蒙。', icon: '🌁', dangerBias: 0.0, rewardMult: 0.95 },
  ],
  swamp: [
    { label: '泥沼深陷', desc: '脚下的泥地软得陷人，步步惊心。', icon: '🫠', dangerBias: 0.2, rewardMult: 1.1 },
    { label: '沼气升腾', desc: '腐臭的沼气从水泡里翻上来。', icon: '💨', dangerBias: 0.25, rewardMult: 1.2 },
    { label: '芦苇摇荡', desc: '大片的芦苇荡里，藏得住人也藏得住妖。', icon: '🌾', dangerBias: 0.1, rewardMult: 1.0 },
    { label: '孤鹭独立', desc: '一只白鹭单足立在浅水，静静不动。', icon: '🦢', dangerBias: -0.1, rewardMult: 0.9 },
  ],
  desert: [
    { label: '风沙蔽日', desc: '风卷着黄沙，天地昏黄一片。', icon: '🏜️', dangerBias: 0.2, rewardMult: 1.1 },
    { label: '海市蜃楼', desc: '远处的绿洲忽隐忽现，真假难辨。', icon: '🌅', dangerBias: -0.1, rewardMult: 1.25 },
    { label: '沙丘连绵', desc: '一座座沙丘如凝固的波浪。', icon: '⛱️', dangerBias: 0.0, rewardMult: 0.95 },
    { label: '绿洲一汪', desc: '一汪清泉在沙海中格外珍贵。', icon: '💧', dangerBias: -0.2, rewardMult: 1.3 },
  ],
  snow: [
    { label: '白雪皑皑', desc: '天地素白，雪光刺目。', icon: '❄️', dangerBias: -0.05, rewardMult: 1.0 },
    { label: '风雪交加', desc: '寒风裹着雪粒，打得人脸生疼。', icon: '🌨️', dangerBias: 0.15, rewardMult: 1.1 },
    { label: '冰棱垂挂', desc: '崖边垂着晶莹的冰棱，寒气逼人。', icon: '🧊', dangerBias: 0.05, rewardMult: 1.15 },
    { label: '雪地足印', desc: '一串足印通向远处，不知是人还是兽。', icon: '🐾', dangerBias: 0.2, rewardMult: 1.2 },
  ],
  volcanic: [
    { label: '硫磺刺鼻', desc: '空气里弥漫着刺鼻的硫磺味。', icon: '🌋', dangerBias: 0.25, rewardMult: 1.2 },
    { label: '地热蒸腾', desc: '地面的裂缝里喷着滚烫的热气。', icon: '♨️', dangerBias: 0.15, rewardMult: 1.1 },
    { label: '熔岩暗红', desc: '远处的山坳里，熔岩泛着暗红的光。', icon: '🔥', dangerBias: 0.3, rewardMult: 1.3 },
  ],
  celestial: [
    { label: '仙气氤氲', desc: '薄薄的仙雾缭绕，令人心旷神怡。', icon: '✨', dangerBias: -0.2, rewardMult: 1.3 },
    { label: '祥云缭绕', desc: '脚下似有祥云托举，如履平地。', icon: '☁️', dangerBias: -0.25, rewardMult: 1.35 },
    { label: '仙乐隐隐', desc: '隐约有丝竹之声从天外飘来。', icon: '🎐', dangerBias: -0.15, rewardMult: 1.25 },
  ],
};

// ── 机遇：怪物主题词（按地形） ──
const MONSTER_THEME: Record<TerrainType, string[]> = {
  plains: ['狼', '山贼', '强盗', '贼', '熊'],
  forest: ['虎', '熊', '蛇', '精', '妖', '狼'],
  mountain: ['山', '石', '鹰', '妖', '精', '熊'],
  water: ['鱼', '虾', '蟹', '海', '蛟', '蛇', '螺'],
  swamp: ['蜥', '蛇', '蛤', '妖'],
  desert: ['沙', '蝎', '狼', '贼'],
  snow: ['狼', '熊', '雪', '妖'],
  volcanic: ['火', '妖', '魔', '熊'],
  celestial: ['仙', '精', '妖', '神'],
};

/** 该地形可出的怪物（按主题词匹配 MONSTERS，含等级约束兜底） */
function monstersOfTerrain(terrain: TerrainType): string[] {
  const themes = MONSTER_THEME[terrain] ?? ['妖'];
  const hits = Object.values(MONSTERS).filter((m) => themes.some((t) => m.name.includes(t)));
  const ids = hits.slice(0, 8).map((m) => m.id);
  if (ids.length === 0) {
    // 兜底：取所有怪物里名字含「妖/精/怪」的
    return Object.values(MONSTERS).filter((m) => /妖|精|怪/.test(m.name)).slice(0, 4).map((m) => m.id);
  }
  return ids;
}

// ── 资源类型（按地形） ──
const RESOURCE_OF: Record<TerrainType, string> = {
  plains: 'herbs', forest: 'herbs', mountain: 'iron_ore', water: 'fish',
  swamp: 'herbs', desert: 'crystal', snow: 'crystal', volcanic: 'crystal', celestial: 'crystal',
};

/** 某格野地资源采光/领取后的重生周期：带权重随机，多数集中在 5 天左右（1~10） */
export function wildRespawnDays(cellId: string): number {
  // 两个均匀分布之和 → 近似三角分布（中心 5 天），映射到 1~10
  const a = hash01(`${cellId}:respawn:a`);
  const b = hash01(`${cellId}:respawn:b`);
  const centered = (a + b - 1) * 4.5; // [-4.5, +4.5]，中心 0
  return Math.max(1, Math.min(10, Math.round(5 + centered)));
}

// ── 查询 ──

/** 某野地格子的随机状态（确定性） */
export function wildStateOf(cellId: string): WildState | null {
  const cell = getCellById(cellId);
  if (!cell) return null;
  const pool = STATE_POOL[cell.terrain] ?? STATE_POOL.plains;
  return pool[hashInt(`${cellId}:state`, pool.length)];
}

/** 某野地格子的随机机遇（确定性） */
export function wildOpportunityOf(cellId: string): WildOpportunity | null {
  const cell = getCellById(cellId);
  if (!cell) return null;
  const state = wildStateOf(cellId)!;
  const roll = hash01(`${cellId}:opp`);

  // 遇怪（受状态 dangerBias 影响）
  const danger = 0.35 + state.dangerBias;
  if (roll < danger) {
    const pool = monstersOfTerrain(cell.terrain);
    const count = 1 + hashInt(`${cellId}:monsterCount`, 2);
    const picked: string[] = [];
    const used = new Set<string>();
    let guard = 0;
    while (picked.length < count && guard < 12 && pool.length > 0) {
      const id = pool[hashInt(`${cellId}:monster${guard}`, pool.length)];
      guard++;
      if (used.has(id)) continue;
      used.add(id);
      picked.push(id);
    }
    return { kind: 'monster', label: '妖物盘踞', desc: state.desc, icon: '👹', monsterIds: picked };
  }

  // 采集
  if (roll < danger + 0.25) {
    return { kind: 'gather', label: '可采之物', desc: state.desc, icon: '🌿', resourceType: RESOURCE_OF[cell.terrain] };
  }

  // 奇遇（金币/经验/宝箱）
  if (roll < danger + 0.45) {
    const kind = hashInt(`${cellId}:fortune`, 3);
    if (kind === 0) {
      const gold = hashRange(`${cellId}:gold`, 20, 80) * (1 + (state.rewardMult - 1));
      return { kind: 'fortune', label: '遗落的钱袋', desc: '草丛里躺着半袋铜钱，无人认领。', icon: '💰', rewardType: 'gold', rewardValue: Math.round(gold) };
    }
    if (kind === 1) {
      const exp = hashRange(`${cellId}:exp`, 15, 50);
      return { kind: 'fortune', label: '前辈刻痕', desc: '石上刻着前辈留下的心法残句，似有所悟。', icon: '📜', rewardType: 'exp', rewardValue: exp };
    }
    const res = hashInt(`${cellId}:loot`, 4);
    return { kind: 'fortune', label: '无主宝箱', desc: '一个半埋土中的旧木箱，锁已朽坏。', icon: '🎁', rewardType: 'loot', rewardValue: res };
  }

  // 平静
  return { kind: 'calm', label: '风平浪静', desc: state.desc, icon: '🍃' };
}

/** 某格是否为「随机野地格」（无任何固定 feature 的空地） */
export function isWildCell(cellId: string): boolean {
  const cell = getCellById(cellId);
  return Boolean(cell && cell.features.length === 0);
}
