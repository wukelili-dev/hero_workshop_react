/** 每日悬赏：按击杀数领奖，给玩家一个每天回来的理由 */
import { MONSTERS } from '../data/maps';
import { useGameStore } from '../store/useGameStore';
import { useWorldStore } from '../store/useWorldStore';
import { useInventoryStore } from '../store/useInventoryStore';
import { getItemsBySource } from '../data/items/items';

export interface Bounty {
  id: string;
  monsterId: string;
  need: number;
  gold: number;
  resource?: { key: string; name: string; amount: number };
}

const POOL = Object.keys(MONSTERS).filter((k) => !MONSTERS[k].isBoss);

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

/** 同一天刷新页面结果不变 */
export function bountiesFor(day: number): Bounty[] {
  const rnd = rng(day * 7919 + 13);
  const out: Bounty[] = [];
  for (let i = 0; i < 3; i++) {
    const monsterId = POOL[Math.floor(rnd() * POOL.length)];
    const m = MONSTERS[monsterId];
    const need = 3 + Math.floor(rnd() * 5);
    const iron = rnd() < 0.5;
    out.push({
      id: `b_${day}_${i}`,
      monsterId,
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
