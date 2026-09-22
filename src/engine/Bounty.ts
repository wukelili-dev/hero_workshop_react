/** 每日悬赏：按击杀数领奖，给玩家一个每天回来的理由 */
import { MONSTERS } from '../data/maps';
import { useGameStore } from '../store/useGameStore';
import { useWorldStore } from '../store/useWorldStore';

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

export function claimBounty(b: Bounty): string {
  const world = useWorldStore.getState();
  if (world.bountyClaimed.includes(b.id)) return '这条悬赏已经领过了。';
  const has = bountyProgress(b.monsterId);
  if (has < b.need) return `还差 ${b.need - has} 只${b.monsterId}。`;
  const game = useGameStore.getState();
  game.addGold(b.gold);
  if (b.resource) game.addResource(b.resource.key, b.resource.amount);
  world.claimBounty(b.id);
  game.addGameLog(`领悬赏：讨伐${b.monsterId}×${b.need}，得 ${b.gold} 金`);
  return `领取成功：+${b.gold} 金${b.resource ? `、${b.resource.name}×${b.resource.amount}` : ''}`;
}
