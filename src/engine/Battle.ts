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
import type {
  Combatant, Monster, TeamMember, PrimaryStats, DerivedStats, Equipment, SkillDef, StatusEffectId,
} from '../types';
import { buildMonsterDerived } from './Stats';
import { deriveTeammate } from './NpcStats';
import { buildHeroCombatant, heroEquipEffects, type HeroStats } from './HeroCombat';
import { generateDrop } from './equipmentDrops';
import { buildRelicEquipment } from '../data/relics';
import { NAMED_BOSS_ARTS } from '../data/skills';
import { useGameStore } from '../store/useGameStore';
import {
  RAGE_MAX, RAGE_INIT, STATUS_NAME, addStatus, applyShield, battleCtxFrom, bossArtsOf, checkCrit,
  dotsOf, heroArtsOf, isStunned, rollDamage, speedOf, strike, tickStatuses, useMartialArt,
  type BattleCtx,
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

/** 队友指令（B4）：让协战从"每回合自动打一下"变成一条可指挥的战线 */
export type MateOrder = 'focus' | 'guard';

/** B4：蓄力后下一击的伤害倍率 */
export const CHARGE_MULT = 1.6;
/** B4：蓄力期间被击中时的反击系数（按普攻期望伤害折算） */
export const CHARGE_COUNTER_RATIO = 0.5;
/** B4：队友指令效果 —— 强攻增伤 / 掩护减伤 */
export const ORDER_FOCUS_MULT = 1.7;
export const ORDER_GUARD_CUT = 0.75;

/** 玩家在手动战斗里能做的选择 */
export type BattleAction =
  | { kind: 'attack' }
  | { kind: 'defend' }
  | { kind: 'art'; artId: string }
  | { kind: 'flee' }
  // B4：动作空间扩容
  | { kind: 'charge' }
  | { kind: 'item'; itemId: string; heal: number }
  | { kind: 'order'; command: MateOrder };

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
  /** B4：是否处于蓄力态（下一击 ×CHARGE_MULT，被击时可反击） */
  charged: boolean;
  /** B4：本回合队友指令（回合末清空，需要每回合重新下令） */
  mateOrder: MateOrder | null;
  /** B5：Boss 当前阶段（1 常在 / 2 半血后的狂暴姿态） */
  foePhase: 1 | 2;
}

const NEUTRAL_AXES = { hit: 0.85, dodge: 0, speed: 14, pen: 0, tenacity: 0, resist: 0 } as const;

const EMPTY_REWARDS: Rewards = { exp: 0, gold: 0, drops: [], equipment: [], potions: 0, resources: {} };

function lineageOf(monster: Monster): 'human' | 'demon' | 'divine' {
  if (monster.npcType === 'human') return 'human';
  if (monster.npcType === 'divine') return 'divine';
  return 'demon';
}

/** B5：Boss 默认在半血时进入第二阶段 */
export const DEFAULT_ENRAGE_AT = 0.5;

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
  const named = monster.isNamedBoss
    ? (NAMED_BOSS_ARTS[monster.id] ?? NAMED_BOSS_ARTS[monster.name])
    : undefined;
  const arts = monster.arts ?? named?.arts;
  const phaseArts = monster.artsPhase2 ?? named?.phase2;
  return {
    id: monster.id, name: monster.name, side: 'foe', level,
    primary, derived,
    vars: { rage: 0, shield: 0, statuses: [] },
    lineage: lineageOf(monster),
    isBoss: monster.isBoss,
    // B5：Boss 招式按怪物数据走；名角从 NAMED_BOSS_ARTS 取，没配的自动回退
    // DEFAULT_BOSS_ARTS（见 BattleCore.bossArtsOf）
    ...(arts && arts.length > 0 ? { skills: arts } : {}),
    ...(phaseArts && phaseArts.length > 0 ? { phaseArts } : {}),
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
  // 名角大 BOSS：掉落专属法宝（100% 首次，之后不再掉法宝，只走下方随机装备）
  if (monster.isNamedBoss && monster.relicId) {
    const kills = useGameStore.getState().killCounts?.[monster.id] ?? 0;
    if (kills === 0) {
      const relic = buildRelicEquipment(monster.relicId);
      if (relic) rewards.equipment.push(relic);
      return rewards;
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

  // B2：开局怒气 —— 轻招只要 40 点，起手 25 点意味着第二回合就能发招
  heroC.vars.rage = RAGE_INIT;
  foeC.vars.rage = RAGE_INIT;

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
    charged: false,
    mateOrder: null,
    foePhase: 1,
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

/** 玩家出手（普攻 / 武学 / 防御 / 逃跑 / 蓄力 / 用药 / 队友指令） */
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

  // B4：蓄力 —— 本回合不出手，换下一击 ×1.6 且被击时反击
  if (action.kind === 'charge') {
    state.charged = true;
    hero.vars.rage = Math.min(RAGE_MAX, hero.vars.rage + 20);
    addStatus(hero, 'guard', 1, 1);
    push(state, {
      attacker: '勇者', defender: '勇者', damage: 0, isCrit: false,
      description: `勇者沉腰蓄力，真气在周身流转（怒气 ${hero.vars.rage}）：下一击伤害大增，被击中时还会反手一下。`,
    });
    return;
  }

  // B4：用药 —— 消耗一回合换一口血
  if (action.kind === 'item') {
    const before = state.heroHp;
    state.heroHp = Math.min(state.heroMaxHp, state.heroHp + Math.max(0, Math.floor(action.heal)));
    const gained = state.heroHp - before;
    push(state, {
      attacker: '勇者', defender: '勇者', damage: 0, isCrit: false,
      description: gained > 0
        ? `勇者服下伤药，回复 ${gained} 点生命。勇者剩余 HP: ${state.heroHp}`
        : '勇者服下伤药，却已无伤可愈。',
    });
    return;
  }

  // B4：队友指令 —— 本回合队友改为强攻或掩护
  if (action.kind === 'order') {
    state.mateOrder = action.command;
    const label = action.command === 'focus' ? '全力强攻' : '回身掩护';
    const note = action.command === 'focus'
      ? `队友本回合协战伤害 ×${ORDER_FOCUS_MULT}`
      : `队友本回合替你挡下部分伤害（勇者受伤 ×${ORDER_GUARD_CUT}）`;
    push(state, {
      attacker: '勇者', defender: '勇者', damage: 0, isCrit: false,
      description: state.mates.length > 0
        ? `勇者向队友传令：${label}。${note}。`
        : `勇者向队友传令，却无人应声。`,
    });
    return;
  }

  // B4：蓄力倍率只在这一次出手时消费掉
  const dmgMult = state.charged ? CHARGE_MULT : 1;
  const chargedNote = state.charged ? '（蓄力一击）' : '';

  if (action.kind === 'art') {
    const art = heroArtsOf(hero).find((a) => a.id === action.artId);
    if (art && hero.vars.rage >= (art.cost ?? RAGE_MAX)) {
      hero.vars.rage = Math.max(0, hero.vars.rage - (art.cost ?? RAGE_MAX));
      const out = useMartialArt(hero, foe, art, dmgMult);
      if (state.charged) state.charged = false;
      state.foeHp = Math.max(0, state.foeHp - out.hpDmg);
      if (out.healed > 0) state.heroHp = Math.min(state.heroMaxHp, state.heroHp + out.healed);
      const extra = [
        out.shieldGained > 0 ? `结起 ${out.shieldGained} 点护盾` : '',
        out.healed > 0 ? `回复 ${out.healed} 点生命` : '',
      ].filter(Boolean).join('，');
      // B1：被韧性抵抗掉的控制要如实写出来，否则玩家会以为招式白放了
      const resistNote = out.resisted.length > 0
        ? `，但${out.resisted.map((r) => STATUS_NAME[r]).join('、')}被对方硬抗住了`
        : '';
      // B3：连携/克制生效时也要让玩家看得见，否则组合玩法等于白做
      const comboNote = out.bonusMult > 1 ? `，连携加成 ×${out.bonusMult}` : '';
      push(state, {
        attacker: '勇者', defender: foe.name, damage: out.hpDmg, isCrit: art.kind === 'burst',
        description: out.missed
          ? `勇者施展「${art.name}」，却未击中。`
          : `勇者施展「${art.name}」${chargedNote}${out.multihit > 1 ? `（${out.multihit} 段全中）` : ''}，造成 ${out.hpDmg} 点伤害${comboNote}${resistNote}${extra ? `，${extra}` : ''}。${foe.name} 剩余 HP: ${state.foeHp}`,
      });
      if (state.foeHp <= 0) finish(state, true);
      return; // 放武学的回合不再触发普攻/连击
    }
    // 怒气不足或招式不存在 → 退化为普攻，绝不空过一回合
  }

  const isCrit = checkCrit(hero.derived.crit);
  const hpDmg = strike(hero, foe, isCrit, dmgMult);
  if (hpDmg < 0) {
    push(state, { attacker: '勇者', defender: foe.name, damage: 0, isCrit: false, description: `勇者攻击 ${foe.name}，未命中。` });
    return;
  }
  if (state.charged) state.charged = false;
  state.foeHp = Math.max(0, state.foeHp - hpDmg);
  if (ctx.lifesteal > 0) state.heroHp = Math.min(state.heroMaxHp, state.heroHp + hpDmg * ctx.lifesteal);
  push(state, {
    attacker: '勇者', defender: foe.name, damage: hpDmg, isCrit,
    description: `勇者攻击 ${foe.name}${chargedNote}，造成 ${hpDmg} 点伤害${isCrit ? '（暴击！）' : ''}。${foe.name} 剩余 HP: ${state.foeHp}`,
  });
  if (state.foeHp <= 0) { finish(state, true); return; }

  if (ctx.comboChance > 0 && Math.random() < ctx.comboChance) {
    const comboDmg = Math.max(1, rollDamage(hero, foe, false));
    state.foeHp = Math.max(0, state.foeHp - comboDmg);
    push(state, { attacker: '勇者', defender: foe.name, damage: comboDmg, isCrit: false, description: `勇者连击 ${foe.name}，造成 ${comboDmg} 点伤害。${foe.name} 剩余 HP: ${state.foeHp}` });
    if (state.foeHp <= 0) finish(state, true);
  }
}

/** 队友协战（每回合各出手一次，怪物仍视勇者为唯一目标）；B4 起受队友指令影响 */
function matesTurn(state: BattleState): void {
  // B4：强攻增伤 / 掩护降伤（掩护的减伤在 foeTurn 结算）
  const mult = state.mateOrder === 'focus' ? ORDER_FOCUS_MULT : state.mateOrder === 'guard' ? 0.6 : 1;
  const tag = state.mateOrder === 'focus' ? '（强攻）' : state.mateOrder === 'guard' ? '（虚应）' : '';
  for (const mate of state.mates) {
    if (state.foeHp <= 0) return;
    const dmg = strike(mate, state.foe, false, mult);
    if (dmg < 0) {
      push(state, { attacker: mate.name, defender: state.foe.name, damage: 0, isCrit: false, description: `${mate.name}协战${tag} ${state.foe.name}，未命中。` });
    } else {
      state.foeHp = Math.max(0, state.foeHp - dmg);
      push(state, { attacker: mate.name, defender: state.foe.name, damage: dmg, isCrit: false, description: `${mate.name}协战${tag} ${state.foe.name}，造成 ${dmg} 点伤害。${state.foe.name} 剩余 HP: ${state.foeHp}` });
    }
  }
  if (state.foeHp <= 0) finish(state, true);
}

/**
 * B5：半血换阶段 —— Boss 血量跌破阈值时换一套招式并涨怒。
 * 只在第一阶段触发一次；切换后战报明确说出来，否则玩家只会觉得"它突然变强了"。
 */
function maybeEnrage(state: BattleState): void {
  if (state.foePhase >= 2) return;
  const { monster, foe } = state;
  if (!foe.phaseArts || foe.phaseArts.length === 0) return;
  const threshold = monster.enrageAt ?? DEFAULT_ENRAGE_AT;
  if (state.foeHp > state.foeMaxHp * threshold) return;
  state.foePhase = 2;
  foe.skills = foe.phaseArts;
  foe.vars.rage = Math.min(RAGE_MAX, foe.vars.rage + 30);
  push(state, {
    attacker: foe.name, defender: '勇者', damage: 0, isCrit: false,
    description: `${foe.name} 气血大损，凶性大发，换了一套打法！（怒气 +30）`,
  });
}

/** 敌方出手（Boss 会放专属妖术；B1 起麻痹会直接封掉这一手） */
function foeTurn(state: BattleState): void {
  const { foe, hero, ctx } = state;

  maybeEnrage(state);

  if (isStunned(foe)) {
    push(state, { attacker: foe.name, defender: '勇者', damage: 0, isCrit: false, description: `${foe.name} 被麻痹，妖气凝滞，这一手没能使出来。` });
    return;
  }

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
  // B4：队友「掩护」指令 —— 队友替你挡下部分伤害
  let guardNote = '';
  if (state.mateOrder === 'guard') {
    const before = afterCut;
    afterCut = Math.max(1, Math.floor(afterCut * ORDER_GUARD_CUT));
    guardNote = `（队友掩护，${before} → ${afterCut}）`;
  }
  state.heroHp = Math.max(0, state.heroHp - afterCut);
  push(state, {
    attacker: foe.name, defender: '勇者', damage: afterCut, isCrit: false,
    description: `${foe.name}${artName ? `施展「${artName}」` : '攻击勇者'}，造成 ${afterCut} 点伤害${guardNote}。勇者剩余 HP: ${state.heroHp}`,
  });

  // B4：蓄力反击 —— 蓄力期间挨打会反手一下（同时消耗掉蓄力态）
  if (state.charged && state.heroHp > 0) {
    const counter = Math.max(1, Math.floor(rollDamage(hero, foe, false) * CHARGE_COUNTER_RATIO));
    const applied = applyShield(state.foe, counter);
    state.foeHp = Math.max(0, state.foeHp - applied);
    push(state, {
      attacker: '勇者', defender: foe.name, damage: applied, isCrit: false,
      description: `勇者趁隙反击，反震 ${foe.name} ${applied} 点伤害。${foe.name} 剩余 HP: ${state.foeHp}`,
    });
    if (state.foeHp <= 0) { finish(state, true); return; }
  }

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

/**
 * 回合末持续伤害（B1）：流血 / 中毒无视防御与护盾，直接扣血。
 * 队友没有独立血条（协战只输出伤害、不单独受击），因此只结算勇者与敌方。
 */
function tickDots(state: BattleState): void {
  const heroDots = dotsOf(state.hero);
  if (heroDots.length > 0 && state.heroHp > 0) {
    const total = heroDots.reduce((s, d) => s + d.dmg, 0);
    state.heroHp = Math.max(0, state.heroHp - total);
    push(state, {
      attacker: heroDots[0].name, defender: '勇者', damage: total, isCrit: false,
      description: `勇者受${heroDots.map((d) => `${d.name} ${d.dmg}`).join('、')}侵蚀，损失 ${total} 点生命。勇者剩余 HP: ${state.heroHp}`,
    });
    if (state.heroHp <= 0) { finish(state, false); return; }
  }

  const foeDots = dotsOf(state.foe);
  if (foeDots.length > 0 && state.foeHp > 0) {
    const total = foeDots.reduce((s, d) => s + d.dmg, 0);
    state.foeHp = Math.max(0, state.foeHp - total);
    push(state, {
      attacker: foeDots[0].name, defender: state.foe.name, damage: total, isCrit: false,
      description: `${state.foe.name} 受${foeDots.map((d) => `${d.name} ${d.dmg}`).join('、')}侵蚀，损失 ${total} 点生命。${state.foe.name} 剩余 HP: ${state.foeHp}`,
    });
    if (state.foeHp <= 0) { finish(state, true); return; }
  }
}

function endRound(state: BattleState): void {
  tickDots(state);
  if (state.over) return;
  tickStatuses(state.hero);
  tickStatuses(state.foe);
  for (const m of state.mates) tickStatuses(m);
  // B4：队友指令只维持一回合，下一回合要用就得重新下令（否则等于常驻 buff）
  state.mateOrder = null;
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

  // B1：麻痹 → 这一手递不出去（队友协战与敌方还手照常结算，不会白过一整回合）
  if (isStunned(next.hero)) {
    push(next, {
      attacker: '勇者', defender: next.foe.name, damage: 0, isCrit: false,
      description: '勇者周身麻痹，动弹不得，这一手没能递出去。',
    });
  } else {
    heroTurn(next, action);
    if (next.over) return next;
  }

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

/** 手动战斗里一张武学卡所需的信息（B6：技能卡要显示倍率/段数/附带状态） */
export interface ArtChoice {
  id: string;
  name: string;
  cost: number;
  desc: string;
  ready: boolean;
  kind: SkillDef['kind'];
  power: number;
  hits: number;
  apply: StatusEffectId[];
  bonus?: SkillDef['bonus'];
}

/** 手动战斗：当前能用的选择（怒气不足的武学标 ready=false，UI 直接读它） */
export function availableArts(state: BattleState): ArtChoice[] {
  return heroArtsOf(state.hero).map((a) => ({
    id: a.id, name: a.name, cost: a.cost ?? RAGE_MAX, desc: a.desc,
    ready: state.hero.vars.rage >= (a.cost ?? RAGE_MAX),
    kind: a.kind, power: a.power, hits: a.hits ?? 1,
    apply: a.apply ?? [], bonus: a.bonus,
  }));
}
