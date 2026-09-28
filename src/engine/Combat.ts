/**
 * Combat — 对外的自动战斗入口（C8 起是回合引擎的薄封装）
 *
 * 结算规则全部在 engine/BattleCore.ts，流程在 engine/Battle.ts：
 * 这里只负责"摆阵 → 自动打完整场 → 交回日志与奖励"。
 * 手动战斗走 store/useBattleStore + components/battle/BattleModal，用的是同一个引擎。
 */
import type { Monster, TeamMember } from '../types';
import { autoResolve, createBattle } from './Battle';
import type { HeroStats } from './HeroCombat';

// 旧引用保持不变：HeroStats 在 HeroCombat，BattleLog/Rewards 在 Battle
export type { HeroStats } from './HeroCombat';
export type { BattleLog, Rewards } from './Battle';

/** 自动打完整场（自动战斗 / 离线结算 / NPC 切磋 / 队友协战都用它） */
export function executeBattle(
  heroStats: HeroStats,
  team: TeamMember[],
  monster: Monster
): { logs: import('./Battle').BattleLog[]; victory: boolean; rewards: import('./Battle').Rewards; heroFinalHp: number } {
  const state = autoResolve(createBattle(heroStats, team, monster));
  return {
    logs: state.logs,
    victory: state.victory,
    rewards: state.rewards,
    heroFinalHp: state.heroHp,
  };
}

/** 简易战斗模拟（不生成详细日志，用于快速估算胜率） */
export function simulateBattle(
  heroStats: HeroStats,
  monster: Monster,
  iterations: number = 1000
): { winRate: number; avgRounds: number; avgDamageTaken: number } {
  let wins = 0;
  let totalRounds = 0;
  let totalDamageTaken = 0;

  for (let i = 0; i < iterations; i++) {
    const { victory, logs } = executeBattle(heroStats, [], monster);
    if (victory) wins++;
    totalRounds += logs.filter((log) => log.damage > 0).length;
    totalDamageTaken += logs
      .filter((log) => log.defender === '勇者')
      .reduce((sum, log) => sum + log.damage, 0);
  }

  return {
    winRate: wins / iterations,
    avgRounds: totalRounds / iterations,
    avgDamageTaken: totalDamageTaken / iterations,
  };
}
