// 战斗系统核心模块（C2 重写：多轴结算）
//
// 结算顺序（写死，顺序即规范，见 docs/战斗与属性重构_实现文档_20260927.md §5）：
//   先手(speed) → 命中(hit−dodge) → 伤害(atk/pen/crit/克制/状态) → 护盾 → 状态 → 怒气 → 克制 → 连击
//
// C2 阶段：保持 executeBattle 对外签名兼容（旧 HeroStats + Monster），
// 内部改由 Combatant（主属性→派生属性）驱动，结算规则切换为多轴。
// 怪物/NPC 目前仍是旧 hp/atk/def，由 migrateLegacyStats 反解为派生属性；
// C3 起怪物改为「等级+主属性」直接 buildDerived，无需再迁移。
import type { Monster, Equipment, ItemEffect, Lineage, Combatant, StatusEffectId, PrimaryStats, DerivedStats } from '../types';
import { generateDrop } from './equipmentDrops';
import { useGameStore } from '../store/useGameStore';
import { sum as sumEffect, sumList, equipEffectsOf } from './ItemEffects';
import { buildDerived, STAT_CAPS } from './Stats';

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

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

// ── 怒气常量（C2：技能留空壳，怒气只累积；C5 接技能释放） ──
const RAGE_MAX = 100;
const RAGE_GAIN_ATK = 15;
const RAGE_GAIN_HIT = 10;

// ── 克制循环 human → demon → divine → human（克制方 +15%，被克 −10%） ──
const LINEAGE_CYCLE: Record<Lineage, Lineage> = { human: 'demon', demon: 'divine', divine: 'human' };

function lineageOf(monster: Monster): Lineage {
  if (monster.npcType === 'human') return 'human';
  if (monster.npcType === 'divine') return 'divine';
  return 'demon'; // 妖怪默认（含 normal / undefined）
}

function lineageFactor(attacker: Lineage, defender: Lineage): number {
  if (LINEAGE_CYCLE[attacker] === defender) return 1.15;
  if (LINEAGE_CYCLE[defender] === attacker) return 0.9;
  return 1.0;
}

// ── 状态层 ──
function stacksOf(c: Combatant, id: StatusEffectId): number {
  const s = c.vars.statuses.find((x) => x.id === id);
  return s ? s.stacks : 0;
}

function hasStatus(c: Combatant, id: StatusEffectId): boolean {
  return c.vars.statuses.some((x) => x.id === id && x.turns > 0);
}

/** 回合末：状态层数/回合递减，过期移除 */
function tickStatuses(c: Combatant): void {
  c.vars.statuses = c.vars.statuses
    .map((s) => ({ ...s, turns: s.turns - 1 }))
    .filter((s) => s.turns > 0);
}

function checkCrit(rate: number): boolean {
  return Math.random() < rate;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ── Combatant 构建 ──
// 过渡期策略（C2/C3）：核心三项 hp/atk/def 保持原始手调值（等价，不破坏平衡），
// 新轴（命中/闪避/速度/破甲/暴击）先给中性默认，由 C3 怪物主属性 / C4 装备词条逐步赋予真值。
// 英雄 lineage 固定 human（玩家凡人；人克妖、被仙克），克制关系见 §5。
const NEUTRAL_AXES = { hit: 0.85, dodge: 0, speed: 14, pen: 0, tenacity: 0, resist: 0 } as const;

function heroCombatant(heroStats: HeroStats, equipEffects: ItemEffect[]): Combatant {
  const hero = useGameStore.getState().hero;
  const derived: DerivedStats = {
    hpMax: hero.maxHp,
    atk: heroStats.atk,
    def: heroStats.def,
    ...NEUTRAL_AXES,
    crit: heroStats.crit,
    critDmg: hero.critDmg ?? 1.5,
  };
  return {
    id: 'hero', name: '勇者', side: 'ally', level: hero.level,
    primary: { root: 1, qi: 1, agility: 1, spirit: 1, fortune: 1 },
    derived,
    vars: { rage: 0, shield: 0, statuses: [] },
    lineage: 'human',
    equipmentEffects: equipEffects,
  };
}

function monsterCombatant(monster: Monster): Combatant {
  const level = monster.level ?? 1;
  // C3：有 primary 则正向 buildDerived（怪物/NPC 重算）；否则用原始手调值（等价）
  const { primary, derived } = monster.primary
    ? { primary: monster.primary, derived: buildDerived(monster.primary, level) }
    : {
        primary: { root: 1, qi: 1, agility: 1, spirit: 1, fortune: 1 } as PrimaryStats,
        derived: {
          hpMax: monster.hp, atk: monster.atk, def: monster.def,
          ...NEUTRAL_AXES, crit: 0, critDmg: 1.5,
        } as DerivedStats,
      };
  return {
    id: monster.id, name: monster.name, side: 'foe', level,
    primary,
    derived,
    vars: { rage: 0, shield: 0, statuses: [] },
    lineage: lineageOf(monster),
    isBoss: monster.isBoss,
  };
}

/** 有效防御：先结算破甲（sunder 减防 → pen 扣除，pen ≤ 目标防御 60%） */
function effectiveDef(defender: Combatant, attacker: Combatant): number {
  let def = defender.derived.def;
  const sunder = Math.min(stacksOf(defender, 'sunder'), 3);
  if (sunder > 0) def *= 1 - 0.10 * sunder;
  const equipPen = sumList(attacker.equipmentEffects ?? [], 'armorPen');
  const pen = attacker.derived.pen + equipPen;
  const cappedPen = Math.min(pen, def * STAT_CAPS.penRatio);
  return Math.max(0, def - cappedPen);
}

/** 命中率：命中 − 闪避，clamp 0.35~0.99 */
function hitRateOf(attacker: Combatant, defender: Combatant): number {
  return clamp(attacker.derived.hit - defender.derived.dodge, 0.35, 0.99);
}

/** 单次伤害结算（破甲/暴击/克制/状态，含随机方差） */
function rollDamage(attacker: Combatant, defender: Combatant, isCrit: boolean): number {
  const effDef = effectiveDef(defender, attacker);
  let atk = attacker.derived.atk;
  const rally = Math.min(stacksOf(attacker, 'rally'), 3);
  if (rally > 0) atk *= 1 + 0.15 * rally;

  const critFactor = isCrit ? clamp(attacker.derived.critDmg, 1.5, STAT_CAPS.critDmg) : 1.0;
  const lf = lineageFactor(attacker.lineage, defender.lineage);
  const guard = hasStatus(defender, 'guard') ? 0.7 : 1.0;
  const variance = 0.9 + Math.random() * 0.2;

  const base = atk * (1 - effDef / (effDef + 50));
  return Math.max(1, Math.floor(base * variance * critFactor * lf * guard));
}

/**
 * 执行战斗（回合制，速度高者先手，同速攻方先手）
 * 保留对外签名兼容：内部改 Combatant 驱动。
 */
export function executeBattle(
  heroStats: HeroStats,
  _team: HeroStats[],
  monster: Monster
): { logs: BattleLog[]; victory: boolean; rewards: Rewards; heroFinalHp: number } {
  const logs: BattleLog[] = [];

  const hero = useGameStore.getState().hero;
  const equipEffects: ItemEffect[] = [
    ...equipEffectsOf(hero.weapon?.effects),
    ...equipEffectsOf(hero.armor?.effects),
  ];
  const equipSum = (kind: ItemEffect['kind']) => sumList(equipEffects, kind);
  const battleSum = (kind: ItemEffect['kind']) => equipSum(kind) + sumEffect(kind);

  // 连击：额外再打一次的概率
  const comboChance = Math.min(0.5, battleSum('combo'));
  // 反伤：怪物攻击时反弹固定伤害
  const reflect = battleSum('reflect');
  // 减伤：受伤减免
  const damageCut = Math.min(0.9, battleSum('damageCut'));
  // 吸血：按造成伤害比例回血
  const lifesteal = battleSum('lifesteal');

  const heroC = heroCombatant(heroStats, equipEffects);
  const monC = monsterCombatant(monster);

  let heroHP = heroStats.hp;
  let monsterHP = monster.hp;
  const heroMaxHP = heroC.derived.hpMax;

  let round = 1;

  const speedOf = (c: Combatant) => c.derived.speed * (hasStatus(c, 'haste') ? 1.2 : 1);

  /** 结算一次攻击，返回 { hpDmg }（已扣护盾与命中判定）；不写日志 */
  const strike = (attacker: Combatant, defender: Combatant, isCrit: boolean): number => {
    if (Math.random() > hitRateOf(attacker, defender)) return -1; // 未命中
    const dmg = rollDamage(attacker, defender, isCrit);
    let hpDmg = dmg;
    if (defender.vars.shield > 0) {
      const absorbed = Math.min(defender.vars.shield, hpDmg);
      defender.vars.shield -= absorbed;
      hpDmg -= absorbed;
    }
    attacker.vars.rage = Math.min(RAGE_MAX, attacker.vars.rage + RAGE_GAIN_ATK);
    defender.vars.rage = Math.min(RAGE_MAX, defender.vars.rage + RAGE_GAIN_HIT);
    return Math.max(0, hpDmg);
  };

  while (heroHP > 0 && monsterHP > 0) {
    const heroFirst = speedOf(heroC) >= speedOf(monC);
    const order: Array<'hero' | 'monster'> = heroFirst ? ['hero', 'monster'] : ['monster', 'hero'];

    for (const side of order) {
      if (heroHP <= 0 || monsterHP <= 0) break;

      if (side === 'hero') {
        const heroCrit = checkCrit(heroC.derived.crit);
        const hpDmg = strike(heroC, monC, heroCrit);

        if (hpDmg < 0) {
          logs.push({
            round, attacker: '勇者', defender: monster.name, damage: 0, isCrit: false,
            description: `勇者攻击 ${monster.name}，未命中。`,
          });
        } else {
          monsterHP = Math.max(0, monsterHP - hpDmg);
          if (lifesteal > 0 && hpDmg > 0) {
            heroHP = Math.min(heroMaxHP, heroHP + hpDmg * lifesteal);
          }
          logs.push({
            round, attacker: '勇者', defender: monster.name,
            damage: hpDmg, isCrit: heroCrit,
            description: `勇者攻击 ${monster.name}，造成 ${hpDmg} 点伤害${heroCrit ? '（暴击！）' : ''}。${monster.name} 剩余 HP: ${monsterHP}`,
          });
        }

        if (monsterHP <= 0) break;

        // 连击：额外追加一次攻击（不触发连击链）
        if (comboChance > 0 && Math.random() < comboChance) {
          const comboDmg = Math.max(1, rollDamage(heroC, monC, false));
          monsterHP = Math.max(0, monsterHP - comboDmg);
          logs.push({
            round, attacker: '勇者', defender: monster.name,
            damage: comboDmg, isCrit: false,
            description: `勇者连击 ${monster.name}，造成 ${comboDmg} 点伤害。${monster.name} 剩余 HP: ${monsterHP}`,
          });
          if (monsterHP <= 0) break;
        }
      } else {
        const monsterCrit = false;
        const hpDmg = strike(monC, heroC, monsterCrit);

        if (hpDmg < 0) {
          logs.push({
            round, attacker: monster.name, defender: '勇者', damage: 0, isCrit: false,
            description: `${monster.name} 攻击勇者，未命中。`,
          });
        } else {
          const afterCut = Math.max(1, Math.floor(hpDmg * (1 - damageCut)));
          heroHP = Math.max(0, heroHP - afterCut);
          logs.push({
            round, attacker: monster.name, defender: '勇者',
            damage: afterCut, isCrit: false,
            description: `${monster.name} 攻击勇者，造成 ${afterCut} 点伤害。勇者剩余 HP: ${heroHP}`,
          });
        }

        // 反伤
        if (reflect > 0 && monsterHP > 0 && hpDmg >= 0) {
          const reflectDmg = Math.max(1, Math.floor(reflect));
          monsterHP = Math.max(0, monsterHP - reflectDmg);
          logs.push({
            round, attacker: '勇者', defender: monster.name,
            damage: reflectDmg, isCrit: false,
            description: `${monster.name} 攻击勇者，被反伤 ${reflectDmg} 点伤害。${monster.name} 剩余 HP: ${monsterHP}`,
          });
        }
      }
    }

    // 回合末状态递减
    tickStatuses(heroC);
    tickStatuses(monC);

    round++;
  }

  const victory = monsterHP <= 0;

  const rewards: Rewards = {
    exp: victory ? monster.expReward : 0,
    gold: victory ? monster.goldReward : 0,
    drops: [],
    equipment: [],
    potions: 0,
    resources: {},
  };

  if (victory && monster.drops) {
    for (const drop of monster.drops) {
      if (Math.random() < drop.chance) {
        const qty = randomInt(drop.quantity[0], drop.quantity[1]);
        rewards.drops.push({ itemId: drop.itemId, quantity: qty });
      }
    }
  }

  if (victory) {
    const monsterLevel = monster.level || 1;
    const isBoss = monster.isBoss || false;
    const equip = generateDrop(monsterLevel, isBoss);
    if (equip) rewards.equipment.push(equip);
  }

  logs.push({
    round: round + 1,
    attacker: victory ? '勇者' : monster.name,
    defender: victory ? monster.name : '勇者',
    damage: 0, isCrit: false,
    description: victory
      ? `战斗胜利！获得 ${rewards.exp} 经验，${rewards.gold} 金币。`
      : '战斗失败...勇者倒下了。',
  });

  return { logs, victory, rewards, heroFinalHp: heroHP };
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

    const battleRounds = logs.filter((log) => log.damage > 0).length;
    totalRounds += battleRounds;

    const damageTaken = logs
      .filter((log) => log.defender === '勇者')
      .reduce((sum, log) => sum + log.damage, 0);
    totalDamageTaken += damageTaken;
  }

  return {
    winRate: wins / iterations,
    avgRounds: totalRounds / iterations,
    avgDamageTaken: totalDamageTaken / iterations,
  };
}
