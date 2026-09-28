/**
 * Battle — 回合制招式对决引擎（C8）
 *
 * 一次战斗 = 一个可逐步推进的状态：`createBattle()` 摆好阵势，之后每调用一次
 * `playerAct(state, action)` 就推进「玩家出手 → 队友协战 → 敌方还手 → 回合末」。
 * 自动战斗 / 离线结算 / NPC 切磋走 `autoResolve()`（AI 每回合自动选招），
 * 手动战斗由界面逐回合选招。两条路共用 BattleCore 的同一套数值规则。
 *
 * 先手沿用旧口径：速度高者先动手（同速玩家先手）；敌方更快时，会在你出手前先打你一下。
 */
import type { Combatant, Monster, TeamMember, PrimaryStats, DerivedStats, Equipment } from '../types';
import { buildMonsterDerived } from './Stats';
import { deriveTeammate } from './NpcStats';
import { buildHeroCombatant, heroEquipEffects, type HeroStats } from './HeroCombat';
import { generateDrop } from './equipmentDrops';
import { useGameStore } from '../store/useGameStore';
import {
  RAGE_MAX, addStatus, battleCtxFrom, bossArtsOf, checkCrit, heroArtsOf,
  rollDamage, speedOf, strike, tickStatuses, useMartialArt, type BattleCtx,
} from './BattleCore';

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
  equipment: Equipment[];
  potions?: number;
  resources?: Record<string, number>;
}

/** 玩家在手动战斗里能做的选择 */
export type BattleAction =
  | { kind: 'attack' }
  | { kind: 'defend' }
  | { kind: 'art'; artId: string }
  | { kind: 'flee' };

export interface BattleState {
  monster: Monster;
  hero: Combatant;
  mates: Combatant[];
  foe: Combatant;
  ctx: BattleCtx;
  heroHp: number;
  heroMaxHp: number;
  foeHp: number;
  foeMaxHp: number;
  round: number;
  /** 玩家是否先手（由速度决定） */
  heroFirst: boolean;
  logs: BattleLog[];
  over: boolean;
  victory: boolean;
  fled: boolean;
  rewards: Rewards;
}

const NEUTRAL_AXES = { hit: 0.85, dodge: 0, speed: 14, pen: 0, tenacity: 0, resist: 0 } as const;

const EMPTY_REWARDS: Rewards = { exp: 0, gold: 0, drops: [], equipment: [], potions: 0, resources: {} };

function lineageOf(monster: Monster): 'human' | 'demon' | 'divine' {
  if (monster.npcType === 'human') return 'human';
  if (monster.npcType === 'divine') return 'divine';
  return 'demon';
}

function monsterCombatant(monster: Monster): Combatant {
  const level = monster.level ?? 1;
  const { primary, derived } = monster.primary
    ? { primary: monster.primary, derived: buildMonsterDerived(monster.primary, level) }
    : {
        primary: { root: 1, qi: 1, agility: 1, spirit: 1, fortune: 1 } as PrimaryStats,
        derived: {
          hpMax: monster.hp ?? 0, atk: monster.atk ?? 0, def: monster.def ?? 0,
          ...NEUTRAL_AXES, crit: 0, critDmg: 1.5,
        } as DerivedStats,
      };
  return {
    id: monster.id, name: monster.name, side: 'foe', level,
    primary, derived,
    vars: { rage: 0, shield: 0, statuses: [] },
    lineage: lineageOf(monster),
    isBoss: monster.isBoss,
  };
}

/** 队友（C5 队伍协同）：等级 → 主属性 → 派生 */
function teammateCombatant(member: TeamMember, idx: number): Combatant {
  const { level, primary, derived } = deriveTeammate(member.level, member.isElite);
  return {
    id: `mate_${idx}`, name: member.roleName, side: 'ally', level,
    primary, derived,
    vars: { rage: 0, shield: 0, statuses: [] },
    lineage: 'human',
  };
}

/** 掉落与奖励（战斗结束时结算一次） */
export function battleRewards(monster: Monster, victory: boolean): Rewards {
  const rewards: Rewards = { ...EMPTY_REWARDS, drops: [], equipment: [] };
  if (!victory) return rewards;
  rewards.exp = monster.expReward;
  rewards.gold = monster.goldReward;
  for (const drop of monster.drops ?? []) {
    if (Math.random() < drop.chance) {
      const qty = Math.floor(Math.random() * (drop.quantity[1] - drop.quantity[0] + 1)) + drop.quantity[0];
      rewards.drops.push({ itemId: drop.itemId, quantity: qty });
    }
  }
  const equip = generateDrop(monster.level || 1, monster.isBoss || false);
  if (equip) rewards.equipment.push(equip);
  return rewards;
}

/** 摆开阵势：等级 / 装备 / 加点到派生属性，一次性算清 */
export function createBattle(heroStats: HeroStats, team: TeamMember[], monster: Monster): BattleState {
  const hero = useGameStore.getState().hero;
  const equipEffects = heroEquipEffects(hero);
  const heroC = buildHeroCombatant(hero, equipEffects);
  const foeC = monsterCombatant(monster);
  const mates = (team ?? []).map((m, i) => teammateCombatant(m, i));
  const heroHp = Math.max(1, Math.min(heroStats.hp, heroC.derived.hpMax));
  const heroFirst = speedOf(heroC) >= speedOf(foeC);

  const state: BattleState = {
    monster, hero: heroC, mates, foe: foeC,
    ctx: battleCtxFrom(equipEffects),
    heroHp,
    heroMaxHp: Math.round(heroC.derived.hpMax),
    foeHp: Math.round(foeC.derived.hpMax),
    foeMaxHp: Math.round(foeC.derived.hpMax),
    round: 1,
    heroFirst,
    logs: [],
    over: false,
    victory: false,
    fled: false,
    rewards: { ...EMPTY_REWARDS, drops: [], equipment: [] },
  };

  state.logs.push({
    round: 1, attacker: '勇者', defender: monster.name, damage: 0, isCrit: false,
    description: `遭遇 ${monster.name}（Lv.${monster.level ?? 1}）！${heroFirst ? '你身法更快，抢得先机。' : `${monster.name} 更快，抢先出手。`}`,
  });
  return state;
}

function push(state: BattleState, log: Omit<BattleLog, 'round'>): void {
  state.logs.push({ round: state.round, ...log });
}

function clone(state: BattleState): BattleState {
  return { ...state, logs: [...state.logs] };
}

function finish(state: BattleState, victory: boolean): void {
  state.over = true;
  state.victory = victory;
  state.rewards = battleRewards(state.monster, victory);
  push(state, {
    attacker: victory ? '勇者' : state.monster.name,
    defender: victory ? state.monster.name : '勇者',
    damage: 0, isCrit: false,
    description: victory
      ? `战斗胜利！获得 ${state.rewards.exp} 经验，${state.rewards.gold} 金币。`
      : '战斗失败...勇者倒下了。',
  });
}

/** 玩家出手（普攻 / 武学 / 防御 / 逃跑） */
function heroTurn(state: BattleState, action: BattleAction): void {
  const { hero, foe, ctx } = state;

  if (action.kind === 'flee') {
    state.over = true;
    state.fled = true;
    push(state, { attacker: '勇者', defender: foe.name, damage: 0, isCrit: false, description: '你抽身退走，未分胜负。' });
    return;
  }

  if (action.kind === 'defend') {
    hero.vars.rage = Math.min(RAGE_MAX, hero.vars.rage + 20);
    addStatus(hero, 'guard', 1, 1);
    push(state, { attacker: '勇者', defender: '勇者', damage: 0, isCrit: false, description: `勇者沉身防备，蓄势以待（怒气 ${hero.vars.rage}）。` });
    return;
  }

  if (action.kind === 'art') {
    const art = heroArtsOf(hero).find((a) => a.id === action.artId);
    if (art && hero.vars.rage >= (art.cost ?? RAGE_MAX)) {
      hero.vars.rage = Math.max(0, hero.vars.rage - (art.cost ?? RAGE_MAX));
      const out = useMartialArt(hero, foe, art);
      state.foeHp = Math.max(0, state.foeHp - out.hpDmg);
      if (out.healed > 0) state.heroHp = Math.min(state.heroMaxHp, state.heroHp + out.healed);
      const extra = [
        out.shieldGained > 0 ? `结起 ${out.shieldGained} 点护盾` : '',
        out.healed > 0 ? `回复 ${out.healed} 点生命` : '',
      ].filter(Boolean).join('，');
      push(state, {
        attacker: '勇者', defender: foe.name, damage: out.hpDmg, isCrit: art.kind === 'burst',
        description: out.missed
          ? `勇者施展「${art.name}」，却未击中。`
          : `勇者施展「${art.name}」${out.multihit > 1 ? `（${out.multihit} 段全中）` : ''}，造成 ${out.hpDmg} 点伤害${extra ? `，${extra}` : ''}。${foe.name} 剩余 HP: ${state.foeHp}`,
      });
      if (state.foeHp <= 0) finish(state, true);
      return; // 放武学的回合不再触发普攻/连击
    }
    // 怒气不足或招式不存在 → 退化为普攻，绝不空过一回合
  }

  const isCrit = checkCrit(hero.derived.crit);
  const hpDmg = strike(hero, foe, isCrit);
  if (hpDmg < 0) {
    push(state, { attacker: '勇者', defender: foe.name, damage: 0, isCrit: false, description: `勇者攻击 ${foe.name}，未命中。` });
    return;
  }
  state.foeHp = Math.max(0, state.foeHp - hpDmg);
  if (ctx.lifesteal > 0) state.heroHp = Math.min(state.heroMaxHp, state.heroHp + hpDmg * ctx.lifesteal);
  push(state, {
    attacker: '勇者', defender: foe.name, damage: hpDmg, isCrit,
    description: `勇者攻击 ${foe.name}，造成 ${hpDmg} 点伤害${isCrit ? '（暴击！）' : ''}。${foe.name} 剩余 HP: ${state.foeHp}`,
  });
  if (state.foeHp <= 0) { finish(state, true); return; }

  if (ctx.comboChance > 0 && Math.random() < ctx.comboChance) {
    const comboDmg = Math.max(1, rollDamage(hero, foe, false));
    state.foeHp = Math.max(0, state.foeHp - comboDmg);
    push(state, { attacker: '勇者', defender: foe.name, damage: comboDmg, isCrit: false, description: `勇者连击 ${foe.name}，造成 ${comboDmg} 点伤害。${foe.name} 剩余 HP: ${state.foeHp}` });
    if (state.foeHp <= 0) finish(state, true);
  }
}

/** 队友协战（每回合各出手一次，怪物仍视勇者为唯一目标） */
function matesTurn(state: BattleState): void {
  for (const mate of state.mates) {
    if (state.foeHp <= 0) return;
    const dmg = strike(mate, state.foe, false);
    if (dmg < 0) {
      push(state, { attacker: mate.name, defender: state.foe.name, damage: 0, isCrit: false, description: `${mate.name}协战 ${state.foe.name}，未命中。` });
    } else {
      state.foeHp = Math.max(0, state.foeHp - dmg);
      push(state, { attacker: mate.name, defender: state.foe.name, damage: dmg, isCrit: false, description: `${mate.name}协战 ${state.foe.name}，造成 ${dmg} 点伤害。${state.foe.name} 剩余 HP: ${state.foeHp}` });
    }
  }
  if (state.foeHp <= 0) finish(state, true);
}

/** 敌方出手（Boss 怒气满会放妖术） */
function foeTurn(state: BattleState): void {
  const { foe, hero, ctx } = state;
  const arts = bossArtsOf(foe).filter((a) => foe.vars.rage >= (a.cost ?? RAGE_MAX));
  let hpDmg: number;
  let artName = '';

  if (arts.length > 0) {
    const art = arts[(state.round + foe.vars.rage) % arts.length];
    foe.vars.rage = Math.max(0, foe.vars.rage - (art.cost ?? RAGE_MAX));
    const out = useMartialArt(foe, hero, art);
    artName = art.name;
    hpDmg = out.missed ? -1 : out.hpDmg;
  } else {
    hpDmg = strike(foe, hero, false);
  }

  if (hpDmg < 0) {
    push(state, { attacker: foe.name, defender: '勇者', damage: 0, isCrit: false, description: `${foe.name}${artName ? `施展「${artName}」` : '攻击勇者'}，未命中。` });
    return;
  }

  let afterCut = hpDmg;
  if (ctx.guardChance > 0 && Math.random() < ctx.guardChance) afterCut = Math.floor(afterCut * 0.7);
  afterCut = Math.max(1, Math.floor(afterCut * (1 - ctx.damageCut)));
  state.heroHp = Math.max(0, state.heroHp - afterCut);
  push(state, {
    attacker: foe.name, defender: '勇者', damage: afterCut, isCrit: false,
    description: `${foe.name}${artName ? `施展「${artName}」` : '攻击勇者'}，造成 ${afterCut} 点伤害。勇者剩余 HP: ${state.heroHp}`,
  });

  if (state.foeHp > 0) {
    let recoil = 0;
    if (ctx.reflect > 0) recoil += Math.max(1, Math.floor(ctx.reflect));
    if (ctx.thorns > 0) recoil += Math.max(1, Math.floor(hpDmg * ctx.thorns));
    if (recoil > 0) {
      state.foeHp = Math.max(0, state.foeHp - recoil);
      push(state, { attacker: '勇者', defender: foe.name, damage: recoil, isCrit: false, description: `${foe.name} 攻击勇者，被反震 ${recoil} 点伤害。${foe.name} 剩余 HP: ${state.foeHp}` });
      if (state.foeHp <= 0) { finish(state, true); return; }
    }
  }
  if (state.heroHp <= 0) finish(state, false);
}

function endRound(state: BattleState): void {
  tickStatuses(state.hero);
  tickStatuses(state.foe);
  for (const m of state.mates) tickStatuses(m);
  state.round++;
}

/**
 * 推进一回合：玩家出手 → 队友协战 → 敌方还手 → 回合末。
 * 敌方更快时先挨打一下，再轮到玩家出手。
 */
export function playerAct(state: BattleState, action: BattleAction): BattleState {
  if (state.over) return state;
  const next = clone(state);

  if (!next.heroFirst) {
    foeTurn(next);
    if (next.over) return next;
  }

  heroTurn(next, action);
  if (next.over) return next;

  matesTurn(next);
  if (next.over) return next;

  if (!next.heroFirst) {
    endRound(next);
    return next;
  }

  foeTurn(next);
  if (next.over) return next;
  endRound(next);
  return next;
}

/** 自动战斗 AI：怒气够就放武学，否则普攻 */
function aiAction(state: BattleState): BattleAction {
  const arts = heroArtsOf(state.hero).filter((a) => state.hero.vars.rage >= (a.cost ?? RAGE_MAX));
  if (arts.length > 0) {
    const art = arts[(state.round + state.hero.vars.rage) % arts.length];
    return { kind: 'art', artId: art.id };
  }
  return { kind: 'attack' };
}

/** 自动打完整场（离线结算 / NPC 切磋 / 自动战斗都用它） */
export function autoResolve(state: BattleState): BattleState {
  let s = state;
  let guard = 0;
  while (!s.over && guard++ < 300) {
    s = playerAct(s, aiAction(s));
  }
  if (!s.over) finish(s, false); // 极端情况（双方都打不动）判负收场
  return s;
}

/** 手动战斗：当前能用的选择（怒气不足的武学标 ready=false，UI 直接读它） */
export function availableArts(state: BattleState): Array<{ id: string; name: string; cost: number; desc: string; ready: boolean }> {
  return heroArtsOf(state.hero).map((a) => ({
    id: a.id, name: a.name, cost: a.cost ?? RAGE_MAX, desc: a.desc,
    ready: state.hero.vars.rage >= (a.cost ?? RAGE_MAX),
  }));
}
