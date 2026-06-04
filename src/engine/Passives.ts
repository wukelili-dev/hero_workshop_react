// @ts-nocheck — legacy engine
import { Hero } from '../types';

/**
 * 被动技能效果接口
 * 每个被动技能可以包含多个效果字段
 */
export interface PassiveEffect {
  name: string;
  desc: string;
  // ── 战斗属性 ──
  dodge?: number;              // 闪避%
  poison_pct?: number;         // 毒伤（最大生命%）
  def_pct?: number;            // 防御%
  atk_pct?: number;            // 攻击%
  hp_pct?: number;             // HP%
  crit_bonus_pct?: number;     // 暴击额外伤害%
  ignore_def_chance?: number;   // 破甲概率%
  ignore_def_pct?: number;     // 破浪（固定无视%防御）
  stun_chance?: number;        // 眩晕概率%
  confuse_chance?: number;      // 混乱概率%
  fire_dmg_pct?: number;       // 火焰伤害（攻击力%）

  // ── 战斗触发 ──
  start_heal_pct?: number;     // 战斗开始回血%
  death_save_heal?: number;    // 濒死回血%
  death_save?: boolean;         // 免死1次
  death_buff_atk_pct?: number; // 死亡时队友攻%
  death_buff_turns?: number;    // 死亡buff持续回合
  kill_heal_pct?: number;      // 击杀回血%
  kill_atk_buff?: number;      // 击杀攻%
  kill_buff_turns?: number;     // 击杀buff持续回合
  kill_gold_pct?: number;      // 击杀金币%

  // ── 周期性 ──
  regen_interval?: number;     // 回血间隔（回合）
  regen_pct?: number;          // 回血%
  cloud_shield_interval?: number; // 云盾间隔（回合）
  cloud_shield_pct?: number;    // 云盾（最大生命%）

  // ── 首回合 ──
  first_strike_pct?: number;    // 首回合伤害%

  // ── 全局 ──
  gold_bonus_pct?: number;      // 金币掉落%
  exp_bonus_pct?: number;       // 经验%
  all_stats_pct?: number;       // 全属性%
  random_buff?: boolean;         // 每场随机buff
  cloud_shield_per_turn?: boolean; // 每回合云盾
}

// ══════════════════════════════════════
// 全部37种被动技能定义
// ══════════════════════════════════════

export const ALL_PASSIVES: Record<string, PassiveEffect> = {
  // ── 白品质（基础型）──
  "闪避": { name: "闪避", desc: "闪避+8%", dodge: 8 },
  "毒伤": { name: "毒伤", desc: "攻击附带3%最大生命毒伤", poison_pct: 3 },
  "铁壁1": { name: "铁壁", desc: "防御+10%", def_pct: 10 },
  "生机": { name: "生机", desc: "战斗开始回复10%HP", start_heal_pct: 10 },

  // ── 绿品质（进阶型）──
  "招财": { name: "招财", desc: "金币掉落+15%", gold_bonus_pct: 15 },
  "狂战": { name: "狂战", desc: "攻击+8%", atk_pct: 8 },
  "噬魂": { name: "噬魂", desc: "击杀回复3%HP", kill_heal_pct: 3 },
  "贪婪": { name: "贪婪", desc: "击杀怪物金币+20%", kill_gold_pct: 20 },

  // ── 蓝品质（强力型）──
  "涅槃": { name: "涅槃", desc: "濒死回复30%HP（每场1次）", death_save_heal: 30 },
  "长生": { name: "长生", desc: "每3回合回复5%HP", regen_interval: 3, regen_pct: 5 },
  "碎骨": { name: "碎骨", desc: "暴击时额外+20%暴击伤害", crit_bonus_pct: 20 },
  "荆棘": { name: "荆棘", desc: "防御+15%，受击5%概率眩晕攻击者", def_pct: 15, stun_chance: 5 },
  "威压": { name: "威压", desc: "攻击+10%，首回合伤害+15%", atk_pct: 10, first_strike_pct: 15 },
  "嗜血": { name: "嗜血", desc: "击杀后攻击+8%持续2回合", kill_atk_buff: 8, kill_buff_turns: 2 },
  "破甲": { name: "破甲", desc: "攻击15%概率无视防御", ignore_def_chance: 15 },
  "铁壁2": { name: "铁壁", desc: "HP+15%", hp_pct: 15 },
  "幻惑": { name: "幻惑", desc: "10%概率使敌人混乱1回合", confuse_chance: 10 },
  "焚天": { name: "焚天", desc: "攻击附带5%攻击力的火焰伤害", fire_dmg_pct: 5 },
  "灵森": { name: "灵森", desc: "每5回合回复8%HP", regen_interval: 5, regen_pct: 8 },

  // ── 紫品质（稀有型）──
  "冲锋": { name: "冲锋", desc: "首回合攻击+25%", first_strike_pct: 25 },
  "玄心": { name: "玄心", desc: "全属性+5%", all_stats_pct: 5 },
  "圣佑": { name: "圣佑", desc: "受致命伤害免死1次（保留1HP），每场限1次", death_save: true },
  "五行": { name: "五行", desc: "每场随机：攻+10%/防+10%/暴击+10%/吸血+8%/HP+10%", random_buff: true },

  // ── 橙品质（传说型）──
  "云盾": { name: "云盾", desc: "每2回合获云盾（吸收15%最大HP伤害）", cloud_shield_interval: 2, cloud_shield_pct: 15 },
  "破浪": { name: "破浪", desc: "无视20%防御", ignore_def_pct: 20 },
  "牺牲": { name: "牺牲", desc: "死亡时队友+20%攻击3回合", death_buff_atk_pct: 20, death_buff_turns: 3 },
  "书香": { name: "书香", desc: "经验+25% 金币+25%", exp_bonus_pct: 25, gold_bonus_pct: 25 },
};

// ══════════════════════════════════════
// 被动技能应用函数
// ══════════════════════════════════════

/** 获取装备上的被动效果 */
export function getEquipPassive(equip: any): PassiveEffect | null {
  if (!equip || !equip.passive || !equip.passive.name) return null;
  return ALL_PASSIVES[equip.passive.name] ?? null;
}

/** 获取英雄全部被动效果（遍历武器+护甲） */
export function getHeroPassives(hero: Hero): PassiveEffect[] {
  const passives: PassiveEffect[] = [];
  if (hero.weapon) {
    const p = getEquipPassive(hero.weapon);
    if (p) passives.push(p);
  }
  if (hero.armor) {
    const p = getEquipPassive(hero.armor);
    if (p) passives.push(p);
  }
  return passives;
}

/** 计算英雄被动带来的属性加成（攻击/防御/HP/闪避%） */
export function calcPassiveStatBonus(hero: Hero): {
  atk_pct: number;
  def_pct: number;
  hp_pct: number;
  dodge: number;
  crit_bonus_pct: number;
} {
  const passives = getHeroPassives(hero);
  const result = { atk_pct: 0, def_pct: 0, hp_pct: 0, dodge: 0, crit_bonus_pct: 0 };
  for (const p of passives) {
    if (p.atk_pct) result.atk_pct += p.atk_pct;
    if (p.def_pct) result.def_pct += p.def_pct;
    if (p.hp_pct) result.hp_pct += p.hp_pct;
    if (p.dodge) result.dodge += p.dodge;
    if (p.crit_bonus_pct) result.crit_bonus_pct += p.crit_bonus_pct;
  }
  return result;
}

/** 战斗开始前触发（生机/涅槃/云盾标记重置） */
export function onBattleStart(hero: Hero): void {
  // 重置每场限制标记
  (hero as any)._death_save_used = false;
  (hero as any)._cloud_shield_hp = 0;
}

/** 攻击时触发（毒伤/焚天/破甲/嗜血标记） */
export function onAttack(attacker: Hero, defender: Hero): void {
  const passives = getHeroPassives(attacker);
  for (const p of passives) {
    // 嗜血：击杀后处理（在onKill中）
    // 毒伤/焚天：在伤害计算时处理（Combat.ts中调用）
  }
}

/** 受击时触发（荆棘/圣佑） */
export function onDefend(defender: Hero, attacker: Hero): void {
  const passives = getHeroPassives(defender);
  for (const p of passives) {
    // 荆棘：防御+15%已通过calcPassiveStatBonus处理
    // 圣佑：在death check时处理
  }
}

/** 击杀时触发（噬魂/贪婪/嗜血） */
export function onKill(killer: Hero): void {
  const passives = getHeroPassives(killer);
  for (const p of passives) {
    if (p.kill_heal_pct) {
      const heal = Math.floor((killer.max_hp ?? 100) * p.kill_heal_pct / 100);
      killer.hp = Math.min(killer.max_hp ?? 100, killer.hp + heal);
    }
    if (p.kill_gold_pct) {
      // 金币加成在实际金币结算时处理
    }
    if (p.kill_atk_buff) {
      // 添加攻击buff（持续kill_buff_turns回合）
      (killer as any)._kill_atk_buff = p.kill_atk_buff;
      (killer as any)._kill_buff_turns = p.kill_buff_turns ?? 2;
    }
  }
}

/** 回合结束时触发（长生/灵森/云盾） */
export function onTurnEnd(hero: Hero, turnCount: number): void {
  const passives = getHeroPassives(hero);
  for (const p of passives) {
    if (p.regen_interval && turnCount % p.regen_interval === 0 && p.regen_pct) {
      const heal = Math.floor((hero.max_hp ?? 100) * p.regen_pct / 100);
      hero.hp = Math.min(hero.max_hp ?? 100, hero.hp + heal);
    }
    if (p.cloud_shield_interval && turnCount % p.cloud_shield_interval === 0 && p.cloud_shield_pct) {
      (hero as any)._cloud_shield_hp = Math.floor((hero.max_hp ?? 100) * p.cloud_shield_pct / 100);
    }
  }
}

/** 检查免死（圣佑/涅槃）返回实际扣除HP后的HP，若触发免死则返回1 */
export function checkDeathSave(hero: Hero, damage: number): number {
  const passives = getHeroPassives(hero);
  for (const p of passives) {
    if (p.death_save && !(hero as any)._death_save_used) {
      (hero as any)._death_save_used = true;
      return 1; // 保留1HP
    }
    if (p.death_save_heal && hero.hp - damage <= 0 && !(hero as any)._death_save_used) {
      (hero as any)._death_save_used = true;
      return Math.floor((hero.max_hp ?? 100) * p.death_save_heal / 100);
    }
  }
  return hero.hp - damage;
}
