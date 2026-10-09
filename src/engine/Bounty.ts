/** 每日悬赏：按击杀数领奖，给玩家一个每天回来的理由 */
import { MONSTERS } from '../data/maps';
import { useGameStore } from '../store/useGameStore';
import { useWorldStore } from '../store/useWorldStore';
import { useInventoryStore } from '../store/useInventoryStore';
import { getItemsBySource } from '../data/items/items';

export interface Bounty {
  id: string;
  monsterId: string;
  /** 目标怪物等级（界面要显示，让玩家一眼看出这条活接不接得动） */
  level: number;
  need: number;
  gold: number;
  resource?: { key: string; name: string; amount: number };
}

const POOL = Object.keys(MONSTERS).filter((k) => !MONSTERS[k].isBoss);

function levelOf(id: string): number {
  return MONSTERS[id]?.level ?? 1;
}

/** 悬赏目标的等级上限：玩家等级 + 该容差 */
export const BOUNTY_LEVEL_MARGIN = 5;

/** 悬赏池大小：从"与玩家等级最接近"的怪里取这么多只 */
export const BOUNTY_POOL_SIZE = 12;

/**
 * 悬赏池 = 「等级不超过玩家 + MARGIN」再取「与玩家等级最接近的 12 只」。
 *
 * 修的是一个真实体感 bug：此前 POOL 是全部非 Boss 怪物（Lv1~59 一锅端），
 * 1 级新手会接到「讨伐酒鬼（Lv40）×5」这种当天绝无可能完成的活。
 * 只加上限还不够 —— 那样高等级玩家会反过来天天刷蝴蝶，所以两头都收：
 * 上限挡住"打不动的"，距离排序挡住"太没意思的"。
 * 池子不会空（上限内不足时自动收敛到现有怪），所以永远能凑满三条悬赏。
 */
function poolFor(heroLevel: number): string[] {
  const ceiling = heroLevel + BOUNTY_LEVEL_MARGIN;
  const eligible = POOL.filter((id) => levelOf(id) <= ceiling);
  if (eligible.length === 0) return POOL;
  return [...eligible]
    .sort((a, b) => Math.abs(levelOf(a) - heroLevel) - Math.abs(levelOf(b) - heroLevel))
    .slice(0, BOUNTY_POOL_SIZE);
}

/** 等级越接近玩家权重越高（相差 10 级权重约减半），让悬赏难度自然贴合当前进度 */
function pickWeighted(pool: string[], heroLevel: number, rnd: () => number): string {
  const weights = pool.map((id) => 1 / (1 + Math.abs(levelOf(id) - heroLevel) * 0.1));
  const total = weights.reduce((a, b) => a + b, 0);
  let roll = rnd() * total;
  for (let i = 0; i < pool.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return pool[i];
  }
  return pool[pool.length - 1];
}

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

/**
 * 今日悬赏（同一天 + 同一等级刷新页面结果不变）。
 * heroLevel 决定难度窗口；同日三条不会指向同一只怪。
 */
export function bountiesFor(day: number, heroLevel = 1): Bounty[] {
  const pool = poolFor(heroLevel);
  const rnd = rng(day * 7919 + 13);
  const out: Bounty[] = [];
  const used = new Set<string>();
  for (let i = 0; i < 3; i++) {
    let monsterId = pickWeighted(pool, heroLevel, rnd);
    // 同日不刷重复目标；pool 长度必然 ≥6，这个循环不会空转
    for (let guard = 0; used.has(monsterId) && guard < pool.length; guard++) {
      monsterId = pickWeighted(pool, heroLevel, rnd);
    }
    used.add(monsterId);
    const m = MONSTERS[monsterId];
    const need = 3 + Math.floor(rnd() * 5);
    const iron = rnd() < 0.5;
    out.push({
      id: `b_${day}_${i}`,
      monsterId,
      level: levelOf(monsterId),
      need,
      gold: Math.max(20, Math.round(m.goldReward * need * 1.6)),
      resource: iron
        ? { key: 'iron', name: '铁矿', amount: 2 + Math.floor(rnd() * 4) }
        : { key: 'hide', name: '皮革', amount: 2 + Math.floor(rnd() * 4) },
    });
  }
  return out;
}

export function bountyProgress(monsterId: string): number {
  return useGameStore.getState().killCounts?.[monsterId] ?? 0;
}

/**
 * 按品级加权抽取掉落物（B3）。
 *
 * B3 之前是 `dropItems[floor(random * len)]` —— 8 个掉落物均匀随机，
 * 于是仙品《太上忘情》和凡品杂货一个概率，高阶武学很快就白菜价。
 * 改成权重 = 1 / (grade + 1)：凡品权重最高，每高一阶掉率约降三成，
 * 让"刷到一本仙品秘籍"重新变成值得截图的事。
 */
export function weightedPickByGrade<T extends { grade: number }>(items: T[], rnd: () => number = Math.random): T | null {
  if (items.length === 0) return null;
  const weights = items.map((i) => 1 / (Math.max(0, i.grade) + 1));
  const total = weights.reduce((a, b) => a + b, 0);
  let roll = rnd() * total;
  for (let i = 0; i < items.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return items[i];
  }
  return items[items.length - 1];
}

export function claimBounty(b: Bounty): string {
  const world = useWorldStore.getState();
  if (world.bountyClaimed.includes(b.id)) return '这条悬赏已经领过了。';
  const has = bountyProgress(b.monsterId);
  const monsterName = MONSTERS[b.monsterId]?.name ?? b.monsterId;
  if (has < b.need) return `还差 ${b.need - has} 只${monsterName}。`;
  const game = useGameStore.getState();
  game.addGold(b.gold);
  if (b.resource) game.addResource(b.resource.key, b.resource.amount);
  world.claimBounty(b.id);
  game.addGameLog(`领悬赏：讨伐${monsterName}×${b.need}，得 ${b.gold} 金`);

  // 名物产出：drop 来源的名物有小概率作为悬赏奖励掉落（B3 起按品级加权，高阶更稀有）
  const dropItems = getItemsBySource('drop');
  if (dropItems.length > 0 && Math.random() < 0.2) {
    const item = weightedPickByGrade(dropItems);
    if (item) {
      useInventoryStore.getState().addNovelty(item.id, 1);
      game.addGameLog(`\u2728 悬赏额外掉落名物「${item.name}」！`);
      return `领取成功：+${b.gold} 金${b.resource ? `、${b.resource.name}×${b.resource.amount}` : ''}，另得名物「${item.name}」`;
    }
  }

  return `领取成功：+${b.gold} 金${b.resource ? `、${b.resource.name}×${b.resource.amount}` : ''}`;
}
