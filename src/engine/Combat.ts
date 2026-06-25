// 战斗系统核心模块
// 参考 Python 版 game_core.py 的伤害公式和战斗逻辑
import type { Monster, Equipment } from '../types';
import { generateDrop } from './equipmentDrops';
import { useGameStore } from '../store/useGameStore';

export interface HeroStats {
  hp: number;
  atk: number;
  def: number;
  crit: number; // 暴击率 0-1
}

export interface BattleLog {
  round: number;
  attacker: string;
  defender: string;
  damage: number;
  isCrit: boolean;
  description: string;
}

export interface Rewards {
  exp: number;
  gold: number;
  drops: Array<{ itemId: string; quantity: number }>;
  equipment: Equipment[];  // 掉落的装备
  potions?: number;
  resources?: Record<string, number>;
}

/**
 * 计算伤害
 * 公式：dmg = ATK * (1 - DEF/(DEF+50)) * random(0.9, 1.1)
 * 最低 1 伤害
 */
export function calculateDamage(attackerATK: number, defenderDEF: number, isCrit: boolean = false): number {
  const baseDmg = attackerATK * (1 - defenderDEF / (defenderDEF + 50));
  const randomFactor = 0.9 + Math.random() * 0.2; // random(0.9, 1.1)
  let dmg = baseDmg * randomFactor;
  
  // 暴击伤害倍率 1.5x
  if (isCrit) {
    dmg *= 1.5;
  }
  
  return Math.max(1, Math.floor(dmg));
}

/** 根据派系亲和度计算英雄对怪物的伤害加成倍率 */
function _factionMultiplier(monster: Monster): number {
  const factions = useGameStore.getState().hero.factions;
  const npcType = monster.npcType ?? 'normal';
  if (npcType === 'human' && factions.human > 70) return 1.15;
  if (npcType === 'human' && factions.human < 30) return 0.85;
  if (npcType === 'demon' && factions.demon > 70) return 1.15;
  if (npcType === 'demon' && factions.demon < 30) return 0.85;
  return 1.0;
}

/**
 * 检查是否暴击
 */
function checkCrit(critRate: number): boolean {
  return Math.random() < critRate;
}

/**
 * 生成随机整数 [min, max]
 */
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 执行战斗
 * 回合制，玩家先手
 * @param heroStats 主角属性
 * @param team 队伍成员属性数组（可选，暂时只实现单人）
 * @param monster 怪物
 * @returns 战斗日志、胜负结果、奖励
 */
export function executeBattle(
  heroStats: HeroStats,
  _team: HeroStats[],
  monster: Monster
): { logs: BattleLog[]; victory: boolean; rewards: Rewards; heroFinalHp: number } {
  const logs: BattleLog[] = [];
  
  // 复制 HP 以避免修改原对象
  let heroCurrentHP = heroStats.hp;
  let monsterCurrentHP = monster.hp;
  
  let round = 1;
  
  while (heroCurrentHP > 0 && monsterCurrentHP > 0) {
    // 玩家先手
    // 玩家攻击
    const heroCrit = checkCrit(heroStats.crit);
    const baseHeroDmg = calculateDamage(heroStats.atk, monster.def, heroCrit);
    const heroDmg = Math.floor(baseHeroDmg * _factionMultiplier(monster));
    monsterCurrentHP = Math.max(0, monsterCurrentHP - heroDmg);
    
    logs.push({
      round,
      attacker: '勇者',
      defender: monster.name,
      damage: heroDmg,
      isCrit: heroCrit,
      description: `勇者攻击 ${monster.name}，造成 ${heroDmg} 点伤害${heroCrit ? '（暴击！）' : ''}。${monster.name} 剩余 HP: ${monsterCurrentHP}`,
    });
    
    if (monsterCurrentHP <= 0) break;
    
    // 怪物攻击
    const monsterCrit = false; // 怪物暂不支持暴击
    const monsterDmg = calculateDamage(monster.atk, heroStats.def, monsterCrit);
    heroCurrentHP = Math.max(0, heroCurrentHP - monsterDmg);
    
    logs.push({
      round,
      attacker: monster.name,
      defender: '勇者',
      damage: monsterDmg,
      isCrit: false,
      description: `${monster.name} 攻击勇者，造成 ${monsterDmg} 点伤害。勇者剩余 HP: ${heroCurrentHP}`,
    });
    
    round++;
  }
  
  const victory = monsterCurrentHP <= 0;

  
  // 计算奖励
  const rewards: Rewards = {
    exp: victory ? monster.expReward : 0,
    gold: victory ? monster.goldReward : 0,
    drops: [],
    equipment: [],
    potions: 0,
    resources: {},
  };
  
  // 计算掉落（材料）
  if (victory && monster.drops) {
    for (const drop of monster.drops) {
      if (Math.random() < drop.chance) {
        const qty = randomInt(drop.quantity[0], drop.quantity[1]);
        rewards.drops.push({
          itemId: drop.itemId,
          quantity: qty,
        });
      }
    }
  }
  
  // 计算掉落（装备）
  if (victory) {
    const monsterLevel = monster.level || 1;
    const isBoss = monster.isBoss || false;
    const equip = generateDrop(monsterLevel, isBoss);
    if (equip) {
      rewards.equipment.push(equip);
    }
  }
  
  // 添加战斗结果日志
  logs.push({
    round: round + 1,
    attacker: victory ? '勇者' : monster.name,
    defender: victory ? monster.name : '勇者',
    damage: 0,
    isCrit: false,
    description: victory 
      ? `战斗胜利！获得 ${rewards.exp} 经验，${rewards.gold} 金币。`
      : '战斗失败...勇者倒下了。',
  });
  
  return { logs, victory, rewards, heroFinalHp: heroCurrentHP };
}

/**
 * 简易战斗模拟（不生成详细日志，用于快速计算）
 */
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
    
    const battleRounds = logs.filter(log => log.damage > 0).length;
    totalRounds += battleRounds;
    
    // 计算玩家受到的总伤害
    const damageTaken = logs
      .filter(log => log.defender === '勇者')
      .reduce((sum, log) => sum + log.damage, 0);
    totalDamageTaken += damageTaken;
  }
  
  return {
    winRate: wins / iterations,
    avgRounds: totalRounds / iterations,
    avgDamageTaken: totalDamageTaken / iterations,
  };
}
