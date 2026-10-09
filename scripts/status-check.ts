/**
 * 战斗状态断言（B1）
 *
 * 为什么要有这个脚本：状态是"看不见的规则"——界面只显示一个标签，结算错了肉眼
 * 完全发现不了（B1 之前流血/中毒就是不掉血的装饰）。这里用 jiti 直接 import 真引擎
 * 跑数字，不复制公式，改坏了立刻红。
 *
 * 用法：npx jiti scripts/status-check.ts
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import type { Combatant } from '../src/types';
import {
  DOT_RATIO, addStatus, controlResistRate, dotTotalOf, dotsOf,
  isStunned, tickStatuses, useMartialArt,
} from '../src/engine/BattleCore';
import { getSkill } from '../src/data/skills';

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

const pad = Math.max(...rows.map((r) => r.name.length));
console.log('检查项'.padEnd(pad) + ' | 结果');
console.log('-'.repeat(pad) + '-|------');
for (const r of rows) console.log(`${(r.ok ? '✓ ' : '✗ ') + r.name}`.padEnd(pad + 2) + `| ${r.detail}`);
const failed = rows.filter((r) => !r.ok);
console.log('');
console.log(failed.length === 0 ? `全部通过（${rows.length} 项）` : `${failed.length}/${rows.length} 项未通过`);
process.exitCode = failed.length === 0 ? 0 : 1;
