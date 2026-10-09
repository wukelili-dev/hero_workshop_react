/**
 * 战斗状态与怒气分档断言（B1 / B2）
 *
 * 为什么要有这个脚本：状态与怒气是"看不见的规则"——界面只显示一个标签，结算错了
 * 肉眼完全发现不了（B1 之前流血/中毒就是不掉血的装饰；B2 之前所有招都是一刀切 100 怒气）。
 * 这里用 jiti 直接 import 真引擎跑数字，不复制公式，改坏了立刻红。
 *
 * 用法：npx jiti scripts/status-check.ts
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import type { Combatant } from '../src/types';
import {
  DOT_RATIO, RAGE_INIT, addStatus, bonusMultOf, bossArtsOf, controlResistRate, dotTotalOf, dotsOf,
  isStunned, tickStatuses, useMartialArt,
} from '../src/engine/BattleCore';
import {
  DEFAULT_HERO_SKILLS, MAX_ACTIVE_SKILLS, PASSIVE_SKILLS, RAGE_HEAVY, RAGE_LIGHT, RAGE_ULT,
  SCHOOL_NAME, SKILLS, SKILL_SCHOOL_IDS, artsBySchool, artsNeedingBook, getSkill, learnableArts,
} from '../src/data/skills';
import { ITEM_DEFS } from '../src/data/items/items';
import { BOUNTY_LEVEL_MARGIN, bountiesFor, weightedPickByGrade } from '../src/engine/Bounty';
import {
  CHARGE_MULT, ORDER_FOCUS_MULT, ORDER_GUARD_CUT, playerAct,
  type BattleState,
} from '../src/engine/Battle';
import { NAMED_BOSS_ARTS, DEFAULT_BOSS_ARTS } from '../src/data/skills';
import { MONSTERS } from '../src/data/maps';
import { autoAllocatePrimary, buildDerived, buildMonsterDerived } from '../src/engine/Stats';
import { deriveTeammate } from '../src/engine/NpcStats';
import { autoResolve } from '../src/engine/Battle';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const rows: Array<{ name: string; ok: boolean; detail: string }> = [];
/**
 * 跑一项断言。tries > 1 用于**含随机采样**的项：伤害有 ±10% 方差、战斗有暴击与命中骰，
 * 单次采样偶尔擦到阈值边缘并不代表规则坏了。重试仍然只认"任一次通过"，
 * 真正的逻辑错误会 3 次全部失败，不会被掩盖。
 */
const check = (name: string, fn: () => { ok: boolean; detail: string }, tries = 1) => {
  let last: { ok: boolean; detail: string } = { ok: false, detail: '未执行' };
  for (let i = 0; i < Math.max(1, tries); i++) {
    try {
      last = fn();
    } catch (e) {
      last = { ok: false, detail: (e as Error).message };
    }
    if (last.ok) break;
  }
  rows.push({ name, ...last });
};

function mk(over: Partial<Combatant['derived']> = {}): Combatant {
  return {
    id: 't', name: '测试', side: 'ally', level: 10,
    primary: { root: 20, qi: 20, agility: 20, spirit: 20, fortune: 10 },
    derived: {
      hpMax: 1000, atk: 200, def: 50, hit: 0.9, dodge: 0, speed: 20,
      pen: 0, tenacity: 0, resist: 0, crit: 0, critDmg: 1.5,
      ...over,
    },
    vars: { rage: 0, shield: 0, statuses: [] },
    lineage: 'human',
  };
}

check('流血每回合真的掉血', () => {
  const c = mk();
  addStatus(c, 'bleed', 2, 2, 200);
  const dmg = dotTotalOf(c);
  const expect = Math.floor(200 * (DOT_RATIO.bleed ?? 0) * 2);
  return { ok: dmg === expect && dmg > 0, detail: `2 层流血 = ${dmg} 点（期望 ${expect}）` };
});

check('中毒每回合真的掉血', () => {
  const c = mk();
  addStatus(c, 'poison', 1, 2, 200);
  const dmg = dotTotalOf(c);
  const expect = Math.floor(200 * (DOT_RATIO.poison ?? 0) * 1);
  return { ok: dmg === expect && dmg > 0, detail: `1 层中毒 = ${dmg} 点（期望 ${expect}）` };
});

check('层数越高伤害越高', () => {
  const vals = [1, 2, 3, 5].map((s) => {
    const c = mk();
    addStatus(c, 'bleed', s, 2, 200);
    return dotTotalOf(c);
  });
  const inc = vals.every((v, i) => i === 0 || v > vals[i - 1]);
  return { ok: inc, detail: `1/2/3/5 层 = ${vals.join(' / ')}` };
});

check('持续伤害无视护盾与防御', () => {
  const c = mk();
  c.vars.shield = 9999;
  addStatus(c, 'bleed', 3, 2, 200);
  const dmg = dotTotalOf(c);
  return {
    ok: dmg > 0 && c.vars.shield === 9999,
    detail: `护盾 ${c.vars.shield} 未被抵扣，流血仍造成 ${dmg} 点`,
  };
});

check('流血与中毒可共存且各自结算', () => {
  const c = mk();
  addStatus(c, 'bleed', 2, 2, 200);
  addStatus(c, 'poison', 2, 2, 200);
  const parts = dotsOf(c);
  const ok = parts.length === 2 && parts[0].dmg !== parts[1].dmg && dotTotalOf(c) === parts[0].dmg + parts[1].dmg;
  return { ok, detail: parts.map((p) => `${p.name} ${p.dmg}`).join(' + ') };
});

check('麻痹持续 2 回合后解除', () => {
  const c = mk();
  addStatus(c, 'stun', 1, 2);
  const t0 = isStunned(c);
  tickStatuses(c);
  const t1 = isStunned(c);
  tickStatuses(c);
  const t2 = isStunned(c);
  return { ok: t0 && t1 && !t2, detail: `施加时=${t0} → 1 回合后=${t1} → 2 回合后=${t2}` };
});

check('韧性越高减控越强（递增且有上限）', () => {
  const rates = [0, 25, 50, 100, 200, 1000].map((t) => controlResistRate(mk({ tenacity: t })));
  const inc = rates.every((v, i) => i === 0 || v >= rates[i - 1]);
  const capped = rates[rates.length - 1] <= 0.7 + 1e-9;
  return {
    ok: inc && capped && rates[0] === 0,
    detail: `韧性 0/25/50/100/200/1000 → ${rates.map((r) => `${(r * 100).toFixed(0)}%`).join(' / ')}`,
  };
});

check('高韧性真的挡下麻痹（4000 次实测）', () => {
  const thunder = getSkill('five_thunder');
  if (!thunder) throw new Error('five_thunder 技能不存在');
  const measure = (tenacity: number) => {
    const atk = mk();
    let resisted = 0;
    for (let i = 0; i < 4000; i++) {
      if (useMartialArt(atk, mk({ tenacity }), thunder).resisted.includes('stun')) resisted++;
    }
    return resisted / 4000;
  };
  const low = measure(0);
  const high = measure(300);
  return {
    ok: low < 0.02 && high > 0.5,
    detail: `韧性 0 → 抵抗 ${(low * 100).toFixed(1)}%；韧性 300 → 抵抗 ${(high * 100).toFixed(1)}%`,
  };
}, 3);

check('同种状态 5 层封顶', () => {
  const c = mk();
  for (let i = 0; i < 9; i++) addStatus(c, 'bleed', 1, 2, 200);
  const st = c.vars.statuses.find((s) => s.id === 'bleed');
  return { ok: !!st && st.stacks === 5, detail: `连加 9 层后实际 = ${st?.stacks} 层` };
});

check('技能挂记攻击力快照（DOT 不随目标防御失真）', () => {
  const atk = mk();
  const def = mk();
  addStatus(def, 'bleed', 1, 2, atk.derived.atk);
  const before = dotTotalOf(def);
  def.derived.def *= 4; // 目标防御翻 4 倍，DOT 不该受影响
  const after = dotTotalOf(def);
  return { ok: before === after && before > 0, detail: `防御 ×4 前后 ${before} → ${after}` };
});

check('回合流程已接入 DOT 与麻痹（接线断言）', () => {
  const src = readFileSync(join(root, 'src/engine/Battle.ts'), 'utf8');
  const wiredDot = /function endRound[\s\S]{0,240}tickDots\(state\)/.test(src);
  const wiredHero = /isStunned\(next\.hero\)/.test(src);
  const wiredFoe = /isStunned\(foe\)/.test(src);
  return {
    ok: wiredDot && wiredHero && wiredFoe,
    detail: `endRound→tickDots=${wiredDot} 玩家麻痹=${wiredHero} 敌方麻痹=${wiredFoe}`,
  };
});

// ═══ B2：怒气分档 / 技能槽 ═══

const TIERS = [
  { cost: RAGE_LIGHT, label: '轻招' },
  { cost: RAGE_HEAVY, label: '中招' },
  { cost: RAGE_ULT, label: '绝招' },
];
const isOffensive = (s: { kind: string }) => s.kind !== 'guard' && s.kind !== 'support';

check('所有武学怒气消耗只有 40 / 70 / 100 三档', () => {
  const allowed = TIERS.map((t) => t.cost);
  const bad = Object.values(SKILLS).filter((s) => !allowed.includes(s.cost));
  return {
    ok: bad.length === 0,
    detail: bad.length === 0
      ? `${Object.keys(SKILLS).length} 条全部落档`
      : `越档：${bad.map((s) => `${s.name}(${s.cost})`).join(', ')}`,
  };
});

check('三档都有技能，且玩家可用轻招 ≥ 5', () => {
  const count = (c: number) => Object.values(SKILLS).filter((s) => s.cost === c).length;
  const playableLight = Object.values(SKILLS)
    .filter((s) => s.cost === RAGE_LIGHT && !['poison_breath', 'blood_frenzy'].includes(s.id)).length;
  const ok = TIERS.every((t) => count(t.cost) >= 3) && playableLight >= 5;
  return { ok, detail: `${TIERS.map((t) => `${t.label} ${count(t.cost)}`).join(' / ')}；玩家可用轻招 ${playableLight}` };
});

check('轻招倍率 0.85~1.45（不能弱过普攻或强过中招）', () => {
  const lights = Object.values(SKILLS).filter((s) => s.cost === RAGE_LIGHT && isOffensive(s));
  const bad = lights.filter((s) => s.power < 0.85 || s.power > 1.45);
  return {
    ok: bad.length === 0,
    detail: bad.length === 0
      ? `${lights.length} 个攻击型轻招合规（${Math.min(...lights.map((s) => s.power))}~${Math.max(...lights.map((s) => s.power))}）`
      : `越界：${bad.map((s) => `${s.name}(${s.power})`).join(', ')}`,
  };
});

check('中招倍率 1.5~2.0', () => {
  const heavies = Object.values(SKILLS).filter((s) => s.cost === RAGE_HEAVY && isOffensive(s));
  const bad = heavies.filter((s) => s.power < 1.5 || s.power > 2.0);
  return {
    ok: bad.length === 0,
    detail: bad.length === 0 ? `${heavies.length} 个中招合规` : `越界：${bad.map((s) => `${s.name}(${s.power})`).join(', ')}`,
  };
});

check('绝招倍率至少是轻招峰值的 1.8 倍（档位差距成立）', () => {
  const off = (c: number) => Object.values(SKILLS).filter((s) => s.cost === c && isOffensive(s));
  const maxLight = Math.max(...off(RAGE_LIGHT).map((s) => s.power));
  const minUlt = Math.min(...off(RAGE_ULT).map((s) => s.power));
  return { ok: minUlt >= maxLight * 1.8, detail: `绝招最低 ${minUlt} vs 轻招最高 ${maxLight}（比值 ${(minUlt / maxLight).toFixed(2)}）` };
});

check('默认起手三招全是轻招（开局第一回合就有招可放）', () => {
  const costs = DEFAULT_HERO_SKILLS.map((id) => getSkill(id)?.cost);
  return { ok: costs.every((c) => c === RAGE_LIGHT), detail: `破军斩/铁壁/噬血 怒气 = ${costs.join(' / ')}` };
});

check('开局怒气已接入（不会先空转三轮）', () => {
  const src = readFileSync(join(root, 'src/engine/Battle.ts'), 'utf8');
  const wired = /heroC\.vars\.rage = RAGE_INIT/.test(src) && /foeC\.vars\.rage = RAGE_INIT/.test(src);
  return { ok: RAGE_INIT >= 25 && wired, detail: `RAGE_INIT=${RAGE_INIT}，双方接入=${wired}` };
});

check('技能槽上限由常量统一驱动（无 length>=3 顶替残留）', () => {
  const store = readFileSync(join(root, 'src/store/useGameStore.ts'), 'utf8');
  const uses = (store.match(/MAX_ACTIVE_SKILLS/g) || []).length;
  // 顶替逻辑出现在两个地方：技能书学习 + 法宝大招注入，两处都必须走常量
  const guarded = (store.match(/MAX_ACTIVE_SKILLS\) next\.shift\(\)/g) || []).length;
  const leaked = /length >= 3\) next\.shift\(\)/.test(store);
  return {
    ok: MAX_ACTIVE_SKILLS === 6 && uses >= 3 && guarded === 2 && !leaked,
    detail: `上限 ${MAX_ACTIVE_SKILLS}，store 引用 ${uses} 处，常量顶替 ${guarded}/2，残留硬编码=${leaked}`,
  };
});

// ═══ B3：技能库扩容 / 秘籍闭环 / 连携克制 ═══

check('六门类各有 ≥3 招可学武学（门派均衡）', () => {
  const bySchool = artsBySchool();
  const counts = SKILL_SCHOOL_IDS.map((id) => `${SCHOOL_NAME[id]} ${bySchool[id].length}`);
  const bad = SKILL_SCHOOL_IDS.filter((id) => bySchool[id].length < 3);
  return { ok: bad.length === 0, detail: bad.length === 0 ? counts.join(' / ') : `不足：${bad.join(', ')}` };
});

check('每个可学武学都有且仅有一本秘籍（无孤儿）', () => {
  const need = artsNeedingBook();
  const books = ITEM_DEFS.filter((d) => d.category === 'skillbook');
  const missing = need.filter((s) => !books.some((b) => b.skillId === s.id));
  // 反向：秘籍指向的招式必须存在
  const dangling = books.filter((b) => {
    const sid = b.skillId;
    return !sid || (!SKILLS[sid] && !PASSIVE_SKILLS[sid]);
  });
  return {
    ok: missing.length === 0 && dangling.length === 0,
    detail: missing.length === 0 && dangling.length === 0
      ? `${need.length} 招武学 ↔ ${books.length} 本秘籍一一对应`
      : `缺秘籍：${missing.map((s) => s.name).join(', ') || '无'}；空指向：${dangling.map((b) => b.id).join(', ') || '无'}`,
  };
});

check('monsterOnly 招式不进玩家武学库', () => {
  const leak = learnableArts().filter((s) => s.monsterOnly);
  const pool = Object.values(SKILLS).filter((s) => s.monsterOnly);
  return {
    ok: leak.length === 0 && pool.length >= 2,
    detail: `妖类招式 ${pool.length} 条（${pool.map((s) => s.name).join('、')}），泄漏进武学库 ${leak.length} 条`,
  };
});

check('连携/克制加成真的生效（斩魄刀对流血目标）', () => {
  const skill = getSkill('blade_execute');
  if (!skill) throw new Error('blade_execute 不存在');
  const atk = mk();
  const plain = bonusMultOf(mk(), skill);
  const bleeding = mk();
  addStatus(bleeding, 'bleed', 1, 2, 100);
  const combo = bonusMultOf(bleeding, skill);
  return { ok: plain === 1 && combo > 1.3, detail: `无流血 ×${plain} → 有流血 ×${combo}（设计 1.4）` };
});

check('克制加成对大妖生效（撼地拳）', () => {
  const skill = getSkill('fist_quake');
  if (!skill) throw new Error('fist_quake 不存在');
  const boss = mk();
  boss.isBoss = true;
  return {
    ok: bonusMultOf(mk(), skill) === 1 && bonusMultOf(boss, skill) > 1.1,
    detail: `普通目标 ×${bonusMultOf(mk(), skill)} → 大妖 ×${bonusMultOf(boss, skill)}`,
  };
});

check('悬赏掉落按品级加权（每高一阶更稀有）', () => {
  const pool = ITEM_DEFS.filter((d) => d.source === 'drop');
  let s = 12345;
  const rnd = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
  const tally: Record<number, number> = {};
  const N = 20000;
  for (let i = 0; i < N; i++) {
    const it = weightedPickByGrade(pool, rnd);
    if (it) tally[it.grade] = (tally[it.grade] ?? 0) + 1;
  }
  const grades = [...new Set(pool.map((i) => i.grade))].sort((a, b) => a - b);
  const counts = grades.map((g) => tally[g] ?? 0);
  const decreasing = counts.every((c, i) => i === 0 || c < counts[i - 1]);
  return {
    ok: decreasing && counts.every((c) => c > 0),
    detail: grades.map((g, i) => `G${g}:${counts[i]}`).join(' / '),
  };
}, 3);

// ═══ 今日悬赏：难度按玩家等级开窗（2026-10-09 修：1 级刷出 Lv40 酒鬼） ═══

check('悬赏目标等级不超过玩家等级 + 容差（1~80 级逐级抽查）', () => {
  const bad: string[] = [];
  for (let lv = 1; lv <= 80; lv++) {
    for (const b of bountiesFor(1000 + lv, lv)) {
      if (b.level > lv + BOUNTY_LEVEL_MARGIN) bad.push(`Lv${lv}→${b.monsterId}(Lv${b.level})`);
    }
  }
  return {
    ok: bad.length === 0,
    detail: bad.length === 0 ? `1~80 级全部落在 +${BOUNTY_LEVEL_MARGIN} 窗口内` : `越窗：${bad.slice(0, 5).join(', ')}`,
  };
});

check('1 级玩家不会再接到酒鬼 / 五庄道童（本次回归用例）', () => {
  const seen = new Set<string>();
  let hit = 0;
  for (let day = 1; day <= 400; day++) {
    for (const b of bountiesFor(day, 1)) {
      seen.add(b.monsterId);
      if (b.monsterId === '酒鬼' || b.monsterId === '五庄道童') hit++;
    }
  }
  const maxLv = Math.max(...[...seen].map((id) => MONSTERS[id]?.level ?? 1));
  return {
    ok: hit === 0 && seen.size >= 3,
    detail: `400 天共 ${seen.size} 种目标，最高 Lv${maxLv}；酒鬼/道童出现 ${hit} 次`,
  };
});

check('悬赏池随玩家等级上移（高等级不再刷新手怪）', () => {
  const poolAt = (lv: number) => {
    const s = new Set<string>();
    for (let day = 1; day <= 200; day++) for (const b of bountiesFor(day, lv)) s.add(b.monsterId);
    return s;
  };
  const low = poolAt(1);
  const high = poolAt(55);
  const lvOf = (id: string) => MONSTERS[id]?.level ?? 1;
  const maxLow = Math.max(...[...low].map(lvOf));
  const maxHigh = Math.max(...[...high].map(lvOf));
  const avgHigh = [...high].reduce((a, id) => a + lvOf(id), 0) / high.size;
  return {
    ok: maxHigh > maxLow && avgHigh >= 40,
    detail: `Lv1 池最高 Lv${maxLow}；Lv55 池最高 Lv${maxHigh}（均值 ${avgHigh.toFixed(1)}）`,
  };
});

check('悬赏同日同等级结果稳定，且三条不重复', () => {
  const sig = (lv: number) => bountiesFor(777, lv).map((b) => `${b.monsterId}:${b.need}:${b.gold}`);
  const stable = sig(12).join('|') === sig(12).join('|');
  const ids = bountiesFor(777, 12).map((b) => b.monsterId);
  return {
    ok: stable && new Set(ids).size === ids.length,
    detail: `稳定=${stable}，去重=${new Set(ids).size === ids.length}（${ids.join('、')}）`,
  };
});

check('任何等级都能凑满 3 条悬赏（不会因过滤而空池）', () => {
  const bad: string[] = [];
  for (let lv = 1; lv <= 120; lv++) {
    const n = bountiesFor(500 + lv, lv).length;
    if (n !== 3) bad.push(`Lv${lv}:${n}`);
  }
  return { ok: bad.length === 0, detail: bad.length === 0 ? '1~120 级均给出 3 条' : bad.slice(0, 5).join(', ') };
});

check('悬赏条按玩家等级生成并显示目标等级（接线断言）', () => {
  const shell = readFileSync(join(root, 'src/components/layout/AppShell.tsx'), 'utf8');
  const passLevel = /bountiesFor\(day,\s*heroLevel\)/.test(shell);
  const depLevel = /\[day,\s*heroLevel\]/.test(shell);
  const showsLv = /b\.level/.test(shell);
  return {
    ok: passLevel && depLevel && showsLv,
    detail: `传等级=${passLevel} 依赖刷新=${depLevel} 显示 Lv=${showsLv}`,
  };
});

// ═══ B4：动作空间（用药 / 蓄力反击 / 队友指令） ═══

/** 造一个"打不死"的战斗场景：双方血厚到不会分胜负，只用来量伤害与回血 */
function mkBattle(over: Partial<BattleState> = {}): BattleState {
  const make = (side: 'ally' | 'foe'): Combatant => ({
    id: side, name: side === 'ally' ? '勇者' : '测试妖', side, level: 10,
    primary: { root: 20, qi: 20, agility: 20, spirit: 20, fortune: 10 },
    derived: {
      hpMax: 1e9, atk: 200, def: 50, hit: 0.9, dodge: 0, speed: 20,
      pen: 0, tenacity: 0, resist: 0, crit: 0, critDmg: 1.5,
    },
    vars: { rage: 100, shield: 0, statuses: [] },
    lineage: side === 'foe' ? 'demon' : 'human',
  });
  return {
    monster: {
      id: 'test_mon', name: '测试妖', expReward: 0, goldReward: 0, drops: [], level: 10,
    } as BattleState['monster'],
    hero: make('ally'), mates: [], foe: make('foe'),
    ctx: { comboChance: 0, reflect: 0, thorns: 0, guardChance: 0, damageCut: 0, lifesteal: 0 },
    heroHp: 1e9, heroMaxHp: 1e9, foeHp: 1e9, foeMaxHp: 1e9, round: 1,
    heroFirst: true, logs: [], over: false, victory: false, fled: false,
    rewards: { exp: 0, gold: 0, drops: [], equipment: [] },
    charged: false, mateOrder: null, foePhase: 1,
    ...over,
  };
}

function mkMate(name = '队友'): Combatant {
  const c = mkBattle().hero;
  return { ...c, id: `mate_${name}`, name, side: 'ally' };
}

const avg = (fn: () => number, n = 400): number => {
  let s = 0;
  for (let i = 0; i < n; i++) s += fn();
  return s / n;
};

check(`蓄力后一击伤害 ×${CHARGE_MULT}（400 次实测）`, () => {
  const plain = avg(() => {
    const s = mkBattle();
    const n = playerAct(s, { kind: 'attack' });
    return s.foeHp - n.foeHp;
  });
  const charged = avg(() => {
    const s = mkBattle();
    const a = playerAct(s, { kind: 'charge' });
    const b = playerAct(a, { kind: 'attack' });
    return a.foeHp - b.foeHp;
  });
  const ratio = charged / plain;
  return { ok: ratio >= 1.45 && ratio <= 1.75, detail: `普通 ${plain.toFixed(0)} → 蓄力 ${charged.toFixed(0)}（×${ratio.toFixed(2)}）` };
}, 3);

check('蓄力期间挨打会反击（战报可见）', () => {
  let hit = false;
  for (let i = 0; i < 30 && !hit; i++) {
    const s = mkBattle({ heroFirst: true });
    const a = playerAct(s, { kind: 'charge' });
    hit = a.logs.some((l) => l.description.includes('趁隙反击'));
  }
  return { ok: hit, detail: hit ? '战报出现「勇者趁隙反击」' : '30 次尝试均未触发' };
}, 3);

check(`队友「强攻」令提高协战伤害 ×${ORDER_FOCUS_MULT}（400 次实测）`, () => {
  const base = avg(() => {
    const s = mkBattle({ mates: [mkMate()] });
    const n = playerAct(s, { kind: 'order', command: 'guard' });
    return s.foeHp - n.foeHp;
  });
  const focus = avg(() => {
    const s = mkBattle({ mates: [mkMate()] });
    const n = playerAct(s, { kind: 'order', command: 'focus' });
    return s.foeHp - n.foeHp;
  });
  const ratio = focus / base;
  return { ok: ratio >= 1.5, detail: `虚应 ${base.toFixed(0)} → 强攻 ${focus.toFixed(0)}（×${ratio.toFixed(2)}，设计 1.7/0.6=${(1.7 / 0.6).toFixed(2)}）` };
}, 3);

check(`队友「掩护」令降低勇者受伤 ×${ORDER_GUARD_CUT}（400 次实测）`, () => {
  const loose = avg(() => {
    const s = mkBattle({ mates: [mkMate()] });
    const n = playerAct(s, { kind: 'order', command: 'focus' });
    return s.heroHp - n.heroHp;
  });
  const guarded = avg(() => {
    const s = mkBattle({ mates: [mkMate()] });
    const n = playerAct(s, { kind: 'order', command: 'guard' });
    return s.heroHp - n.heroHp;
  });
  const ratio = guarded / loose;
  return { ok: ratio <= 0.85 && ratio > 0.5, detail: `无掩护 ${loose.toFixed(0)} → 掩护 ${guarded.toFixed(0)}（×${ratio.toFixed(2)}）` };
}, 3);

check('战斗中用药按上限结算（不溢出）', () => {
  const s1 = mkBattle({ heroHp: 500, heroMaxHp: 1000 });
  const a1 = playerAct(s1, { kind: 'item', itemId: 'x', heal: 300 });
  const heal1 = a1.logs.find((l) => l.description.includes('服下伤药'));
  const s2 = mkBattle({ heroHp: 900, heroMaxHp: 1000 });
  const a2 = playerAct(s2, { kind: 'item', itemId: 'x', heal: 300 });
  const heal2 = a2.logs.find((l) => l.description.includes('服下伤药'));
  const ok = !!heal1?.description.includes('回复 300 点生命') && !!heal2?.description.includes('回复 100 点生命');
  return { ok, detail: `${heal1?.description.match(/回复 \d+ 点生命/)?.[0]} / ${heal2?.description.match(/回复 \d+ 点生命/)?.[0]}` };
});

check('战斗中用药会真的扣背包（接线断言）', () => {
  const src = readFileSync(join(root, 'src/store/useBattleStore.ts'), 'utf8');
  const consumes = /removeNovelty\(action\.itemId, 1\)/.test(src);
  const guards = /isStunned\(cur\.hero\)/.test(src);
  return { ok: consumes && guards, detail: `扣背包=${consumes} 麻痹保护=${guards}` };
});

check('动作空间四种新选择都已接线', () => {
  const src = readFileSync(join(root, 'src/engine/Battle.ts'), 'utf8');
  const parts = {
    charge: /action\.kind === 'charge'/.test(src),
    item: /action\.kind === 'item'/.test(src),
    order: /action\.kind === 'order'/.test(src),
    reset: /state\.mateOrder = null/.test(src),
  };
  const ok = Object.values(parts).every(Boolean);
  return { ok, detail: Object.entries(parts).map(([k, v]) => `${k}=${v}`).join(' ') };
});

// ═══ B5：名角 Boss 差异化 ═══

check('每个名角 Boss 都配了常态 + 狂暴两套招式', () => {
  const named = Object.values(MONSTERS).filter((m) => m.isNamedBoss);
  const cfgOf = (m: (typeof named)[number]) => NAMED_BOSS_ARTS[m.id] ?? NAMED_BOSS_ARTS[m.name];
  const missing = named.filter((m) => {
    const cfg = cfgOf(m);
    return !cfg || cfg.arts.length < 2 || cfg.phase2.length < 1;
  });
  // 反向：NAMED_BOSS_ARTS 里不能有多余的、地图上不存在的名角
  const extra = Object.keys(NAMED_BOSS_ARTS).filter(
    (n) => !named.some((m) => m.name === n || m.id === n),
  );
  return {
    ok: missing.length === 0 && extra.length === 0 && named.length >= 9,
    detail: missing.length === 0 && extra.length === 0
      ? `${named.length} 个名角招式齐备（${named.map((m) => m.name).join('、')}）`
      : `缺配置：${missing.map((m) => m.name).join(', ') || '无'}；多余：${extra.join(', ') || '无'}`,
  };
});

check('名角招式都是 monsterOnly 且引用的武学存在', () => {
  const ids = new Set<string>();
  for (const cfg of Object.values(NAMED_BOSS_ARTS)) {
    for (const id of [...cfg.arts, ...cfg.phase2]) ids.add(id);
  }
  const dangling = [...ids].filter((id) => !SKILLS[id]);
  const leaky = [...ids].filter((id) => SKILLS[id] && !SKILLS[id].monsterOnly);
  return {
    ok: dangling.length === 0 && leaky.length === 0,
    detail: dangling.length === 0 && leaky.length === 0
      ? `${ids.size} 条专属招式全部 monsterOnly`
      : `空指向：${dangling.join(', ') || '无'}；未标 monsterOnly：${leaky.join(', ') || '无'}`,
  };
});

check('名角两阶段招式确实不同（换阶段不是换个说法）', () => {
  const same = Object.entries(NAMED_BOSS_ARTS).filter(
    ([, c]) => c.arts.length === c.phase2.length && c.arts.every((a, i) => a === c.phase2[i]),
  );
  return { ok: same.length === 0, detail: same.length === 0 ? '9 个名角狂暴后都换了招' : `未换招：${same.map(([n]) => n).join(', ')}` };
});

check('Boss 招式读取 combatant.skills（接线断言）', () => {
  const src = readFileSync(join(root, 'src/engine/BattleCore.ts'), 'utf8');
  const reads = /export function bossArtsOf[\s\S]{0,320}c\.skills/.test(src);
  const fallback = /DEFAULT_BOSS_ARTS/.test(src);
  return { ok: reads && fallback, detail: `读 c.skills=${reads} 回退兜底=${fallback}` };
});

check('未配招式的普通 Boss 回退到默认妖术', () => {
  const boss = mkBattle().foe;
  boss.isBoss = true;
  const arts = bossArtsOf(boss).map((a) => a.id);
  return { ok: arts.join(',') === DEFAULT_BOSS_ARTS.join(','), detail: `回退为 ${arts.join('、')}` };
});

check('名角半血真的换阶段（实测）', () => {
  const cfg = NAMED_BOSS_ARTS['白骨精'];
  const foe = mkBattle().foe;
  foe.isBoss = true;
  foe.skills = cfg.arts;
  foe.phaseArts = cfg.phase2;
  const s = mkBattle({
    monster: {
      id: '白骨精', name: '白骨精', expReward: 0, goldReward: 0, drops: [], level: 65,
      isBoss: true, isNamedBoss: true, relicId: 'baigu_zhang',
    } as BattleState['monster'],
    foe,
    foeHp: 40,
    foeMaxHp: 100,
  });
  const n = playerAct(s, { kind: 'defend' });
  const switched = n.foePhase === 2 && n.foe.skills === cfg.phase2;
  const logged = n.logs.some((l) => l.description.includes('凶性大发'));
  return {
    ok: switched && logged,
    detail: `阶段 ${n.foePhase}，招式 ${n.foe.skills?.join('/')}，战报提示=${logged}`,
  };
});

// ═══ B6：战斗 UI 接线 + 名角实战可用性 ═══

check('战斗界面已接上 B4 的三种新选择与 B5 的狂暴标记', () => {
  const src = readFileSync(join(root, 'src/components/battle/BattleModal.tsx'), 'utf8');
  const parts = {
    charge: /kind: 'charge'/.test(src),
    item: /kind: 'item'/.test(src),
    order: /kind: 'order'/.test(src),
    phase: /foePhase === 2/.test(src),
    float: /DamageFloat/.test(src),
    icons: /STATUS_ICON/.test(src),
  };
  const ok = Object.values(parts).every(Boolean);
  return { ok, detail: Object.entries(parts).map(([k, v]) => `${k}=${v}`).join(' ') };
});

check('伤害飘字动画已定义（水墨关键帧）', () => {
  const css = readFileSync(join(root, 'src/index.css'), 'utf8');
  const ok = /@keyframes inkFloat/.test(css) && /\.ink-float\b/.test(css);
  return { ok, detail: ok ? 'inkFloat + .ink-float 均在 index.css' : '缺关键帧' };
});

/** 造一场接近真实的名角战：满加点英雄 + 3 人队友 + 中期装备词条 */
function mkBossFight(heroLv: number, monName: string, mateLv: number): BattleState {
  const p = autoAllocatePrimary(heroLv);
  const d = buildDerived(p, heroLv);
  const hero: Combatant = {
    id: 'hero', name: '勇者', side: 'ally', level: heroLv, primary: p,
    derived: {
      ...d,
      hpMax: Math.round(d.hpMax * 1.3),
      atk: Math.floor(d.atk * 1.4),
      crit: Math.min(0.6, d.crit + 0.15),
    },
    vars: { rage: 100, shield: 0, statuses: [] }, lineage: 'human',
    skills: ['power_strike', 'mountain_fist', 'taishang_forget', 'whirlwind', 'mend', 'five_thunder'],
  };
  const mates: Combatant[] = [0, 1, 2].map((i) => {
    const t = deriveTeammate(mateLv, i === 0);
    return {
      id: `mate_${i}`, name: t.roleName ?? `队友${i}`, side: 'ally', level: t.level,
      primary: t.primary, derived: t.derived,
      vars: { rage: 0, shield: 0, statuses: [] }, lineage: 'human',
    };
  });
  const m = MONSTERS[monName]!;
  const fd = buildMonsterDerived(m.primary!, m.level ?? 1);
  const cfg = NAMED_BOSS_ARTS[m.name];
  const foe: Combatant = {
    id: m.id, name: m.name, side: 'foe', level: m.level ?? 1, primary: m.primary!,
    derived: fd, vars: { rage: RAGE_INIT, shield: 0, statuses: [] }, lineage: 'demon', isBoss: true,
    ...(cfg ? { skills: cfg.arts, phaseArts: cfg.phase2 } : {}),
  };
  return {
    monster: m, hero, mates, foe,
    ctx: { comboChance: 0, reflect: 0, thorns: 0, guardChance: 0, damageCut: 0.15, lifesteal: 0.1 },
    heroHp: hero.derived.hpMax, heroMaxHp: hero.derived.hpMax,
    foeHp: fd.hpMax, foeMaxHp: fd.hpMax,
    round: 1, heroFirst: true, logs: [], over: false, victory: false, fled: false,
    rewards: { exp: 0, gold: 0, drops: [], equipment: [] },
    charged: false, mateOrder: null, foePhase: 1,
  } as BattleState;
}

check('名角在实战里真的会放专属招式并进入狂暴', () => {
  const name = '白骨精';
  const names = [...NAMED_BOSS_ARTS[name].arts, ...NAMED_BOSS_ARTS[name].phase2]
    .map((id) => SKILLS[id]?.name)
    .filter(Boolean) as string[];
  const out = autoResolve(mkBossFight(90, name, 87));
  const used = names.filter((n) => out.logs.some((l) => l.description.includes(`「${n}」`)));
  return {
    ok: used.length >= 2 && out.foePhase === 2,
    detail: `用出 ${used.join('、')}；阶段 ${out.foePhase}`,
  };
}, 3);

check('名角难度落在"要练但要练得动"（+25 级带队友胜率 ≥20%）', () => {
  const N = 120;
  const rowsOut: string[] = [];
  let worst = 1;
  for (const name of Object.keys(NAMED_BOSS_ARTS)) {
    const lv = MONSTERS[name]?.level ?? 65;
    let wins = 0;
    for (let i = 0; i < N; i++) {
      if (autoResolve(mkBossFight(lv + 25, name, lv + 22)).victory) wins++;
    }
    const rate = wins / N;
    worst = Math.min(worst, rate);
    rowsOut.push(`${name} ${(rate * 100).toFixed(0)}%`);
  }
  return {
    ok: worst >= 0.2,
    detail: `最差 ${(worst * 100).toFixed(0)}% — ${rowsOut.join(' / ')}`,
  };
}, 3);

check('端到端自动战斗必定收敛（不会卡死）', () => {
  const names = ['白骨精', '红孩儿', '大鹏金翅雕'];
  const results = names.map((n) => {
    const s = autoResolve(mkBossFight(95, n, 92));
    return `${n}:${s.over ? 'over' : 'STUCK'}/${s.round}回合`;
  });
  return { ok: results.every((r) => r.includes('over')), detail: results.join(' ') };
});

const pad = Math.max(...rows.map((r) => r.name.length));
console.log('检查项'.padEnd(pad) + ' | 结果');
console.log('-'.repeat(pad) + '-|------');
for (const r of rows) console.log(`${(r.ok ? '✓ ' : '✗ ') + r.name}`.padEnd(pad + 2) + `| ${r.detail}`);
// ── 附：档位收益对照（信息输出，不参与判定）──
// 设计意图：三档的「每点怒气效率」刻意保持接近，档位差异体现在释放频率与附带效果上，
// 而不是逼玩家只放大招——否则轻招又会沦为没人点的按钮。
console.log('怒气档位     | 攻击型技能数 | 倍率区间      | 每点怒气效率');
console.log('-------------|--------------|---------------|--------------');
for (const t of TIERS) {
  const list = Object.values(SKILLS).filter((s) => s.cost === t.cost && isOffensive(s));
  const lo = Math.min(...list.map((s) => s.power));
  const hi = Math.max(...list.map((s) => s.power));
  console.log(
    `${t.label} ${t.cost}`.padEnd(13)
    + `| ${String(list.length).padEnd(13)}| ${`${lo} ~ ${hi}`.padEnd(14)}| ${(lo / t.cost).toFixed(3)} ~ ${(hi / t.cost).toFixed(3)}`,
  );
}
console.log('');

const failed = rows.filter((r) => !r.ok);
console.log('');
console.log(failed.length === 0 ? `全部通过（${rows.length} 项）` : `${failed.length}/${rows.length} 项未通过`);
process.exitCode = failed.length === 0 ? 0 : 1;
