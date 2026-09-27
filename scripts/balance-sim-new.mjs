#!/usr/bin/env node
/**
 * balance-sim-new.mjs —— C2 起的新结算平衡模拟。
 * 镜像 src/engine/Stats.ts 换算表 + src/engine/Combat.ts 多轴结算（确定性期望值），
 * 读 maps.ts 真实怪物，跑 Lv1→60，找"无可刷地图"卡点。
 * 英雄仍按旧成长（BASE_HP/ATK/DEF）反解派生（与 useGameStore 一致），直到 C3 改成长。
 * 用法：node scripts/balance-sim-new.mjs
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const CAPS = { dodge: 0.40, hit: 0.99, crit: 0.60, critDmg: 4.0, penRatio: 0.60 };

// ── Stats.ts 换算 ──
function buildDerived(p, lv) {
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
function migrate(hp, atk, def, crit, critDmg, lv) {
  const qi = clamp((atk - 4 - lv * 0.8) / 1.6, 1, 999);
  const rootDef = clamp((def - 2 - lv * 0.5) / 0.8, 1, 999);
  const rootHp = clamp((hp - 60 - lv * 10) / 12, 1, 999);
  const root = Math.max(rootDef, rootHp);
  const spirit = clamp((crit - 0.03) / 0.004, 1, 999);
  const fortune = clamp((critDmg - 1.5) / 0.01, 1, 999);
  return buildDerived({ root, qi, agility: 5, spirit, fortune }, lv);
}

// ── 旧英雄成长 ──
const BASE_HP = (lv) => Math.floor(80 + lv * 18 + Math.floor(lv / 5) * 5);
const BASE_ATK = (lv) => 5 + lv * 2;
const BASE_DEF = (lv) => 2 + lv;

// ── 多轴单次期望伤害（克制：human→demon 1.15） ──
function heroDmgPerAtk(hero, mon) {
  const hitRate = clamp(hero.hit - mon.dodge, 0.35, 0.99);
  const effDef = Math.max(0, mon.def - Math.min(hero.pen, mon.def * CAPS.penRatio));
  const base = hero.atk * (1 - effDef / (effDef + 50));
  const critFactor = 1 + hero.crit * (hero.critDmg - 1);
  return base * hitRate * critFactor * 1.15; // 人克妖
}
function monDmgPerAtk(mon, hero) {
  const hitRate = clamp(mon.hit - hero.dodge, 0.35, 0.99);
  const effDef = Math.max(0, hero.def - Math.min(mon.pen, hero.def * CAPS.penRatio));
  const base = mon.atk * (1 - effDef / (effDef + 50));
  return base * hitRate * 0.9; // 妖克人被反克 −10%
}

// ── 解析怪物 ──
const src = readFileSync(join(root, 'src/data/maps.ts'), 'utf8');
const lines = src.split(/\r?\n/);
const monsters = {};
for (const line of lines) {
  const m = line.match(/^\s*'([^']+)':\s*\{\s*id:\s*'[^']*',\s*name:\s*'[^']*',\s*level:\s*(\d+),\s*hp:\s*(\d+),\s*atk:\s*(\d+),\s*def:\s*(\d+),\s*rarity:\s*\d+,\s*expReward:\s*(\d+),\s*goldReward:\s*(\d+)/);
  if (!m) continue;
  monsters[m[1]] = { id: m[1], level: +m[2], hp: +m[3], atk: +m[4], def: +m[5], exp: +m[6], gold: +m[7], boss: /isBoss:\s*true/.test(line) };
}
const maps = [];
for (const line of lines) {
  const idM = line.match(/^\s*\{\s*id:\s*'([^']+)',\s*name:\s*'([^']+)',\s*minLevel:\s*(\d+)/);
  if (!idM) continue;
  const refs = [...line.matchAll(/MONSTERS\['([^']+)'\]/g)].map((x) => x[1]).filter((id) => monsters[id]);
  if (refs.length === 0) continue;
  const bossM = line.slice(line.indexOf('boss:')).match(/MONSTERS\['([^']+)'\]/);
  const bossId = bossM ? bossM[1] : null;
  maps.push({ id: idM[1], name: idM[2], minLevel: +idM[3], monsters: refs.filter((id) => id !== bossId), boss: bossId });
}

function wins(lv, mon, hpRatio = 1) {
  const hero = migrate(BASE_HP(lv) * hpRatio, BASE_ATK(lv), BASE_DEF(lv), 0.05, 1.5, lv);
  const m = migrate(mon.hp, mon.atk, mon.def, 0, 1.5, mon.level);
  const roundsToKill = Math.ceil(mon.hp / Math.max(1, heroDmgPerAtk(hero, m)));
  const roundsToDie = Math.ceil((BASE_HP(lv) * hpRatio) / Math.max(1, monDmgPerAtk(m, hero)));
  return roundsToKill <= roundsToDie;
}

console.log('等级 | 可刷地图        | 每场经验/金币 | 升一级需要 | 最强能打的怪');
console.log('-----|-----------------|---------------|------------|---------------');
let firstGap = null;
for (let lv = 1; lv <= 60; lv++) {
  let best = null;
  for (const map of maps) {
    const normals = map.monsters.map((id) => monsters[id]).filter((m) => !m.boss);
    if (normals.length === 0) continue;
    const beatable = normals.filter((m) => wins(lv, m, 1) && wins(lv, m, 0.75));
    if (beatable.length === 0) continue;
    const target = beatable.reduce((a, b) => (a.exp > b.exp ? a : b));
    if (!best || target.exp > best.exp) best = { map, target, bossReady: wins(lv, monsters[map.boss] ?? target, 1) };
  }
  if (!best) {
    if (firstGap === null) firstGap = lv;
    console.log(`${String(lv).padStart(4)} | ${'— 无可刷地图 —'.padEnd(15)} |               |            |`);
    continue;
  }
  const need = lv * 100;
  const battles = Math.ceil(need / best.target.exp);
  console.log(`${String(lv).padStart(4)} | ${best.map.name.padEnd(15)} | ${String(Math.round(best.target.exp)).padStart(6)} / ${String(Math.round(best.target.gold)).padStart(5)} | ${String(battles).padStart(10)} | ${best.target.id}${best.bossReady ? '（Boss 可斩）' : ''}`);
}
console.log('');
if (firstGap !== null) console.log(`⚠ 最早卡点：Lv.${firstGap} 没有任何地图可以安全刷`);
else console.log('✓ 1→60 级全程都有可刷地图');
process.exitCode = firstGap !== null ? 1 : 0;
