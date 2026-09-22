/**
 * 数值平衡模拟：直接读 src/data/maps.ts 的真实怪物数据，
 * 按游戏里的成长与伤害公式跑 Lv1→60 曲线，找出"卡点"。
 * 用法：node scripts/balance-sim.mjs
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = readFileSync(join(root, 'src/data/maps.ts'), 'utf8');
const lines = src.split(/\r?\n/);

// ── 公式（与 src 保持一致） ──
const DEF_COEFF = 50;
const BASE_HP = (lv) => Math.floor(80 + lv * 18 + Math.floor(lv / 5) * 5);
const BASE_ATK = (lv) => 5 + lv * 2;
const BASE_DEF = (lv) => 2 + lv;
const dmg = (atk, def) => Math.max(1, atk * (1 - def / (def + DEF_COEFF)));

// ── 解析怪物（逐行，避免多行结构干扰正则） ──
const monsters = {};
for (const line of lines) {
  const m = line.match(
    /^\s*'([^']+)':\s*\{\s*id:\s*'[^']*',\s*name:\s*'[^']*',\s*level:\s*(\d+),\s*hp:\s*(\d+),\s*atk:\s*(\d+),\s*def:\s*(\d+),\s*rarity:\s*\d+,\s*expReward:\s*(\d+),\s*goldReward:\s*(\d+)/
  );
  if (!m) continue;
  monsters[m[1]] = {
    id: m[1], level: +m[2], hp: +m[3], atk: +m[4], def: +m[5],
    exp: +m[6], gold: +m[7], boss: /isBoss:\s*true/.test(line),
  };
}

// ── 解析地图（monsters: [MONSTERS['a'], …], boss: MONSTERS['x']） ──
const maps = [];
for (const line of lines) {
  const idM = line.match(/^\s*\{\s*id:\s*'([^']+)',\s*name:\s*'([^']+)',\s*minLevel:\s*(\d+)/);
  if (!idM) continue;
  const refs = [...line.matchAll(/MONSTERS\['([^']+)'\]/g)].map((x) => x[1]).filter((id) => monsters[id]);
  if (refs.length === 0) continue;
  const bossM = line.slice(line.indexOf('boss:')).match(/MONSTERS\['([^']+)'\]/);
  const bossId = bossM ? bossM[1] : null;
  maps.push({
    id: idM[1], name: idM[2], minLevel: +idM[3],
    monsters: refs.filter((id) => id !== bossId),
    boss: bossId,
  });
}
if (process.argv.includes('--debug')) {
  console.log('怪物解析数', Object.keys(monsters).length, '地图解析数', maps.length);
  console.log('地图样例', JSON.stringify(maps.slice(0, 2)));
}

// ── 战斗判定：双方互殴，看谁先倒下（无暴击、取期望伤害） ──
function wins(heroLv, mon, hpRatio = 1) {
  const hHp = BASE_HP(heroLv) * hpRatio;
  const hAtk = BASE_ATK(heroLv);
  const hDef = BASE_DEF(heroLv);
  const roundsToKill = Math.ceil(mon.hp / dmg(hAtk, mon.def));
  const roundsToDie = Math.ceil(hHp / dmg(mon.atk, hDef));
  return roundsToKill <= roundsToDie;
}

const maxHpLeft = (heroLv, mon) => {
  const rounds = Math.ceil(mon.hp / dmg(BASE_ATK(heroLv), mon.def));
  const taken = dmg(mon.atk, BASE_DEF(heroLv)) * Math.max(0, rounds - 1);
  return Math.max(0, (BASE_HP(heroLv) - taken) / BASE_HP(heroLv));
};

console.log('等级 | 可刷地图        | 每场经验/金币 | 升一级需要 | 最强能打的怪');
console.log('-----|-----------------|---------------|------------|---------------');
let firstGap = null;
for (let lv = 1; lv <= 60; lv++) {
  let best = null;
  for (const map of maps) {
    const normals = map.monsters.map((id) => monsters[id]);
    const pool = normals.filter((m) => !m.boss);
    if (pool.length === 0) continue;
    // 与游戏内自动战斗一致：只挑"能打赢（且留 25% 血）"的目标
    const beatable = pool.filter((m) => wins(lv, m) && maxHpLeft(lv, m) >= 0.25);
    if (beatable.length === 0) continue;
    const target = beatable.reduce((a, b) => (a.exp > b.exp ? a : b));
    const exp = target.exp;
    const gold = target.gold;
    if (!best || exp > best.exp) best = { map, exp, gold, hardest: target, bossReady: wins(lv, monsters[map.boss] ?? target) };
  }
  if (!best) {
    if (firstGap === null) firstGap = lv;
    console.log(`${String(lv).padStart(4)} | ${'— 无可刷地图 —'.padEnd(15)} |               |            |`);
    continue;
  }
  const need = lv * 100;
  const battles = Math.ceil(need / best.exp);
  console.log(
    `${String(lv).padStart(4)} | ${best.map.name.padEnd(15)} | ` +
    `${String(Math.round(best.exp)).padStart(6)} / ${String(Math.round(best.gold)).padStart(5)} | ` +
    `${String(battles).padStart(10)} | ${best.hardest.id}${best.bossReady ? '（Boss 可斩）' : ''}`
  );
}

console.log('');
if (firstGap !== null) console.log(`⚠ 最早卡点：Lv.${firstGap} 没有任何地图可以安全刷`);
else console.log('✓ 1→60 级全程都有可刷地图');
