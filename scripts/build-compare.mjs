#!/usr/bin/env node
/**
 * 三 build 对比验证（验收 #5）—— 快剑 / 重刀 / 法衣 在同类对手上的表现差异。
 *
 * 与 combat-axes-check.mjs 一样是「公式层」镜像：复制 src/engine/Stats.ts 的换算表 +
 * src/engine/Combat.ts 的结算口径（命中 × 伤害 × 暴击，破甲扣防），不依赖 zustand store。
 * 用法：node scripts/build-compare.mjs
 */
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const CAPS = { dodge: 0.40, hit: 0.99, crit: 0.60, critDmg: 4.0, penRatio: 0.60 };

/** 英雄派生（镜像 Stats.buildDerived） */
function heroDerived(p, lv) {
  const { root, qi, agility, spirit, fortune } = p;
  return {
    hpMax: 60 + root * 12 + lv * 10,
    def: 2 + root * 0.8 + lv * 0.5,
    atk: 4 + qi * 1.6 + lv * 0.8,
    pen: qi * 0.25,
    speed: 8 + agility * 1.2,
    dodge: clamp(agility * 0.004, 0, CAPS.dodge),
    hit: clamp(0.85 + spirit * 0.006, 0, CAPS.hit),
    crit: clamp(0.03 + spirit * 0.004, 0, CAPS.crit),
    critDmg: clamp(1.5 + fortune * 0.01, 0, CAPS.critDmg),
  };
}

/** 怪物派生（镜像 Stats.buildMonsterDerived：root→血、qi→攻、spirit→防；速度固定、不闪避不暴击） */
function monsterDerived(level, isBoss = false) {
  const k = isBoss ? 1.6 : 1.0;
  const lv = Math.max(1, level);
  return {
    hpMax: Math.round(lv * 1.3 * k * 12 + lv * 10),
    atk: Math.round(lv * 1.5 * k * 1.6 + lv * 0.8),
    def: Math.round(lv * 0.6 * 0.8 + lv * 0.5),
    speed: 14,
    dodge: 0,
    hit: 0.85,
    crit: 0,
    critDmg: 1.5,
  };
}

/** 单次期望伤害（命中 × 伤害 × 暴击期望；破甲上限为目标防御 60%） */
function dpr(atk, def, pen, hit, dodge, crit, critDmg) {
  const hitRate = clamp(hit - dodge, 0.35, 0.99);
  const effDef = Math.max(0, def - Math.min(pen, def * CAPS.penRatio));
  const base = atk * (1 - effDef / (effDef + 50));
  return base * hitRate * (1 + crit * (critDmg - 1));
}

const LEVEL = 30;
const BUDGET = 150; // 三套 build 共用同样的主属性总点数，只有分配不同
const BUILDS = {
  '快剑(身法/神识)': { agility: 0.40, spirit: 0.30, qi: 0.20, root: 0.05, fortune: 0.05 },
  '重刀(气力/机缘)': { qi: 0.45, fortune: 0.20, root: 0.20, agility: 0.05, spirit: 0.10 },
  '法衣(根骨/神识)': { root: 0.40, spirit: 0.35, qi: 0.15, agility: 0.05, fortune: 0.05 },
};
const shape = (w) => ({
  root: BUDGET * w.root, qi: BUDGET * w.qi, agility: BUDGET * w.agility,
  spirit: BUDGET * w.spirit, fortune: BUDGET * w.fortune,
});

const OPPONENTS = [
  { name: '同级怪', level: LEVEL, boss: false },
  { name: '+5 级怪', level: LEVEL + 5, boss: false },
  { name: '同级 Boss', level: LEVEL, boss: true },
];

const rows = [];
for (const [buildName, weights] of Object.entries(BUILDS)) {
  const hero = heroDerived(shape(weights), LEVEL);
  for (const opp of OPPONENTS) {
    const mon = monsterDerived(opp.level, opp.boss);
    const heroDpr = dpr(hero.atk, mon.def, hero.pen, hero.hit, mon.dodge, hero.crit, hero.critDmg);
    const monDpr = dpr(mon.atk, hero.def, 0, mon.hit, hero.dodge, mon.crit, mon.critDmg);
    const roundsToKill = Math.ceil(mon.hpMax / Math.max(0.01, heroDpr));
    const roundsToDie = Math.ceil(hero.hpMax / Math.max(0.01, monDpr));
    // 先手：速度高者先出手，等价于对方少打一轮
    const firstStrike = hero.speed >= mon.speed ? 1 : 0;
    const win = roundsToKill <= roundsToDie - 1 + firstStrike;
    rows.push({
      build: buildName, opp: opp.name, win,
      rounds: roundsToKill, survive: roundsToDie,
      heroDpr: Math.round(heroDpr), heroHp: Math.round(hero.hpMax),
    });
  }
}

const pad = (s, n) => String(s).padEnd(n);
console.log(`三 build × 三类对手（Lv.${LEVEL}，主属性总点数 ${BUDGET}）`);
console.log(`${pad('build', 20)}${pad('对手', 12)}${pad('胜', 5)}${pad('需回合', 8)}${pad('可撑回合', 10)}期望伤/回合`);
console.log('-'.repeat(64));
for (const r of rows) {
  console.log(`${pad(r.build, 20)}${pad(r.opp, 12)}${pad(r.win ? '✓' : '✗', 5)}${pad(r.rounds, 8)}${pad(r.survive, 10)}${r.heroDpr}`);
}

// 判定
const normal = rows.filter((r) => r.opp === '同级怪');
const boss = rows.filter((r) => r.opp === '同级 Boss');
const allPassNormal = normal.every((r) => r.win);
const bossDiffers = new Set(boss.map((r) => r.win)).size > 1;
const dprs = normal.map((r) => r.heroDpr);
const spread = (Math.max(...dprs) - Math.min(...dprs)) / Math.min(...dprs);

console.log('');
console.log(`三 build 都能过同级怪：${allPassNormal ? '✓' : '✗'}`);
console.log(`Boss 结果因 build 而异（差异化）：${bossDiffers ? '✓' : '✗ 需要拉开形态差异'}`);
console.log(`相邻 build 期望伤差异：${(spread * 100).toFixed(0)}%（判据 >20%）`);
process.exitCode = allPassNormal && spread > 0.2 ? 0 : 1;
