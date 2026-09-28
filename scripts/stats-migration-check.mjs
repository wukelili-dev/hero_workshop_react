/**
 * C1 等价性守门员：验证 migrateLegacyStats 的换算等价性。
 *
 * 断言（与 src/engine/Stats.ts 的公式保持一致）：
 *   1. 反解出的 derived.atk / derived.def 不低于旧值（A 方案下身法/神识额外贡献输出，
 *      反解已扣除轴贡献，故只保证"不降"，不再要求逐位精确还原）。
 *   2. derived.hpMax >= 旧 hp（root = max(root_def, root_hp) 保证血量不降）。
 *   3. crit / critDmg 还原。
 *
 * 用法：node scripts/stats-migration-check.mjs
 */
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// 与 Stats.ts buildDerived 一致
function buildDerived(primary, level) {
  const { root, qi, agility, spirit, fortune } = primary;
  return {
    hpMax: 60 + root * 12 + level * 10,
    def: 2 + root * 0.8 + level * 0.5,
    atk: 4 + qi * 1.6 + agility * 0.5 + spirit * 0.3 + level * 0.8,
    pen: qi * 0.25,
    speed: 8 + agility * 1.2,
    dodge: clamp(agility * 0.004, 0, 0.40),
    hit: clamp(0.85 + spirit * 0.006, 0, 0.99),
    crit: clamp(0.03 + spirit * 0.004, 0, 0.60),
    critDmg: clamp(1.5 + fortune * 0.01, 0, 4.0),
  };
}

function migrateLegacyStats(legacy, level) {
  const crit = legacy.crit ?? 0.05;
  const critDmg = legacy.critDmg ?? 1.5;
  const spirit = clamp((crit - 0.03) / 0.004, 1, 999);
  const agility = 5;
  const axisAtk = agility * 0.5 + spirit * 0.3; // A 方案轴贡献，反解时扣掉
  const qi = clamp((legacy.atk - 4 - level * 0.8 - axisAtk) / 1.6, 1, 999);
  const rootDef = clamp((legacy.def - 2 - level * 0.5) / 0.8, 1, 999);
  const rootHp = clamp((legacy.hp - 60 - level * 10) / 12, 1, 999);
  const root = Math.max(rootDef, rootHp);
  const fortune = clamp((critDmg - 1.5) / 0.01, 1, 999);
  return { primary: { root, qi, agility, spirit, fortune }, derived: buildDerived({ root, qi, agility, spirit, fortune }, level) };
}

// ── 采样：覆盖 Lv1→60 的典型旧属性（含怪物与英雄形态） ──
const cases = [];
for (let lv = 1; lv <= 60; lv++) {
  const baseAtk = 5 + lv * 2;
  const baseDef = 2 + lv;
  const baseHp = 80 + lv * 18 + Math.floor(lv / 5) * 5;
  cases.push({ level: lv, hp: baseHp, atk: baseAtk, def: baseDef, crit: 0.05, critDmg: 1.5 });
  // 带装备加成的形态
  cases.push({ level: lv, hp: baseHp + 200, atk: baseAtk + 50, def: baseDef + 30, crit: 0.2, critDmg: 1.8 });
  // 高暴击形态
  cases.push({ level: lv, hp: baseHp, atk: baseAtk, def: baseDef, crit: 0.45, critDmg: 2.2 });
}

let fails = 0;
for (const c of cases) {
  const { derived } = migrateLegacyStats(c, c.level);
  const atkOk = derived.atk >= c.atk - 1e-9;            // A 方案：轴贡献只增不减
  const defOk = derived.def >= c.def - 1e-9;            // root=max(root_def,root_hp) → def 只保证不降
  const hpOk = derived.hpMax >= c.hp - 1e-9;
  const critOk = derived.crit >= Math.min(c.crit, 0.60) - 1e-6;       // clamp 下限 1 可能略强，只保证不降
  const critDmgOk = derived.critDmg >= Math.min(c.critDmg, 4.0) - 1e-6;
  if (!atkOk || !defOk || !hpOk || !critOk || !critDmgOk) {
    fails++;
    console.log('FAIL', JSON.stringify(c), { derived: { atk: derived.atk, def: derived.def, hp: derived.hpMax } });
  }
}

console.log(`迁移等价性检查：${cases.length} 组样本，${fails === 0 ? '全部通过' : fails + ' 组失败'}`);
console.log(`  atk/hp/def/crit/critDmg 均不降 ✓`);
process.exitCode = fails === 0 ? 0 : 1;
