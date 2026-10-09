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
  DOT_RATIO, RAGE_INIT, addStatus, bonusMultOf, controlResistRate, dotTotalOf, dotsOf,
  isStunned, tickStatuses, useMartialArt,
} from '../src/engine/BattleCore';
import {
  DEFAULT_HERO_SKILLS, MAX_ACTIVE_SKILLS, PASSIVE_SKILLS, RAGE_HEAVY, RAGE_LIGHT, RAGE_ULT,
  SCHOOL_NAME, SKILLS, SKILL_SCHOOL_IDS, artsBySchool, artsNeedingBook, getSkill, learnableArts,
} from '../src/data/skills';
import { ITEM_DEFS } from '../src/data/items/items';
import { weightedPickByGrade } from '../src/engine/Bounty';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const rows: Array<{ name: string; ok: boolean; detail: string }> = [];
const check = (name: string, fn: () => { ok: boolean; detail: string }) => {
  try { rows.push({ name, ...fn() }); }
  catch (e) { rows.push({ name, ok: false, detail: (e as Error).message }); }
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
});

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
