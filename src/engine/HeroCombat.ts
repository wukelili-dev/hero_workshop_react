/**
 * HeroCombat — 英雄战斗态构建（人物面板与 executeBattle 共用同一份口径）
 *
 * 为什么单独一层：面板如果自己拿 hero.atk 画数字，就会出现"面板一套、结算另一套"
 * 的半新半旧。这里把「词条收集 + 主属性 → 派生属性」收敛成一个函数，
 * 面板读它、战斗也读它，看到的数字必然一致。
 */
import type { HeroState, ItemEffect, Combatant, PrimaryStats, DerivedStats } from '../types';
import { buildDerived, autoAllocatePrimary, STAT_CAPS } from './Stats';
import { sumList, equipEffectsOf } from './ItemEffects';
import { setBonusEffects } from '../data/equipmentForms';
import { passiveEffectsOf, DEFAULT_HERO_SKILLS } from '../data/skills';

export interface HeroStats {
  hp: number;
  atk: number;
  def: number;
  crit: number; // 暴击率 0-1
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** 英雄当前生效的全部词条：装备(equip) + 套装(2 件档) + 已学被动 */
export function heroEquipEffects(hero: HeroState): ItemEffect[] {
  const weaponSet = hero.weapon?.setId;
  const armorSet = hero.armor?.setId;
  // 英雄当前只有「武器 + 护甲」两个槽，套装最多 2 件；4 件档待饰品槽上线
  const setCount = weaponSet && weaponSet === armorSet ? 2 : 0;
  const setEffects = setBonusEffects(weaponSet, setCount);
  return [
    ...equipEffectsOf(hero.weapon?.effects),
    ...equipEffectsOf(hero.armor?.effects),
    ...equipEffectsOf(setEffects),
    // C5：已学会的被动技能按「持有词条」常驻生效
    ...passiveEffectsOf(hero.passives),
  ];
}

/** 英雄主属性：缺省按等级自动分配（2:2:2:2:1） */
export function heroPrimaryOf(hero: HeroState): PrimaryStats {
  return hero.primary ?? autoAllocatePrimary(hero.level);
}

/**
 * 英雄派生属性（战斗唯一读取层）
 * A 方案：攻击 = 旧基线(等级+装备) + 身法×0.5 + 神识×0.3，其余轴走 buildDerived。
 */
export function heroDerivedOf(hero: HeroState, heroStats: HeroStats, equipEffects: ItemEffect[]): DerivedStats {
  const primary = heroPrimaryOf(hero);
  const ax = buildDerived(primary, hero.level);
  const hitBonus = sumList(equipEffects, 'hit');
  const dodgeBonus = sumList(equipEffects, 'dodge');
  const speedBonus = sumList(equipEffects, 'speed');
  const resistBonus = sumList(equipEffects, 'resist');
  return {
    hpMax: hero.maxHp,
    atk: heroStats.atk + primary.agility * 0.5 + primary.spirit * 0.3,
    def: heroStats.def,
    hit: clamp(Math.max(0.85, ax.hit) + hitBonus, 0, STAT_CAPS.hit),
    dodge: clamp(ax.dodge + dodgeBonus, 0, STAT_CAPS.dodge),
    speed: Math.max(14, ax.speed) + speedBonus,
    pen: ax.pen,
    tenacity: ax.tenacity,
    resist: clamp(ax.resist + resistBonus, 0, STAT_CAPS.resist),
    crit: clamp(Math.max(heroStats.crit, ax.crit), 0, STAT_CAPS.crit),
    critDmg: hero.critDmg ?? ax.critDmg,
  };
}

/** 英雄 Combatant（executeBattle 用） */
export function buildHeroCombatant(hero: HeroState, heroStats: HeroStats, equipEffects: ItemEffect[]): Combatant {
  return {
    id: 'hero',
    name: '勇者',
    side: 'ally',
    level: hero.level,
    primary: heroPrimaryOf(hero),
    derived: heroDerivedOf(hero, heroStats, equipEffects),
    vars: { rage: 0, shield: 0, statuses: [] },
    lineage: 'human',
    equipmentEffects: equipEffects,
    skills: hero.skills ?? DEFAULT_HERO_SKILLS,
  };
}

/** 面板用：满血口径的英雄派生属性快照 */
export function heroBattlePreview(hero: HeroState): {
  primary: PrimaryStats;
  derived: DerivedStats;
  equipEffects: ItemEffect[];
} {
  const equipEffects = heroEquipEffects(hero);
  const stats: HeroStats = { hp: hero.maxHp, atk: hero.atk, def: hero.def, crit: hero.critRate };
  return {
    primary: heroPrimaryOf(hero),
    derived: heroDerivedOf(hero, stats, equipEffects),
    equipEffects,
  };
}
