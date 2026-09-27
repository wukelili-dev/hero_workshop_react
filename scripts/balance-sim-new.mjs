#!/usr/bin/env node
/**
 * balance-sim-new.mjs —— C2 起的新结算平衡模拟（镜像运行时 Combat.ts）。
 * 运行时（Combat.ts）当前等价策略：
 *   - 英雄/怪物核心 hp/atk/def 用原始手调值（等价，不破坏平衡）
 *   - 新轴中性默认：hit=0.85、dodge=0、speed=14、pen=0、crit(怪)=0
 *   - 克制：人克妖 +15%、妖克人 −10%（英雄 human，普通怪 demon）
 * 读 maps.ts 真实怪物，跑 Lv1→60，找"无可刷地图"卡点。
 * 用法：node scripts/balance-sim-new.mjs
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// ── 运行时中性轴（与 Combat.ts NEUTRAL_AXES 一致） ──
const NEUTRAL = { hit: 0.85, dodge: 0, speed: 14, pen: 0 };
const PEN_RATIO = 0.60;

// ── 旧英雄成长 ──
const BASE_HP = (lv) => Math.floor(80 + lv * 18 + Math.floor(lv / 5) * 5);
const BASE_ATK = (lv) => 5 + lv * 2;
const BASE_DEF = (lv) => 2 + lv;

// 单次期望伤害（命中 × 伤害；破甲扣防；克制）
function dmg(atk, def, pen, hit, dodge, crit, critDmg, lf) {
  const hitRate = clamp(hit - dodge, 0.35, 0.99);
  const effDef = Math.max(0, def - Math.min(pen, def * PEN_RATIO));
  const base = atk * (1 - effDef / (effDef + 50));
  const critFactor = 1 + crit * (critDmg - 1);
  return Math.max(1, base * hitRate * critFactor * lf);
}

// ── 解析怪物 ──
const src = readFileSync(join(root, 'src/data/maps.ts'), 'utf8');
const lines = src.split(/\r?\n/);
const monsters = {};
for (const line of lines) {
  const m = line.match(/^\s*'([^']+)':\s*\{\s*id:\s*'[^']*',\s*name:\s*'[^']*',\s*level:\s*(\d+),\s*hp:\s*(\d+),\s*atk:\s*(\d+),\s*def:\s*(\d+),/);
  if (!m) continue;
  const expM = line.match(/expReward:\s*(\d+)/);
  const goldM = line.match(/goldReward:\s*(\d+)/);
  monsters[m[1]] = { id: m[1], level: +m[2], hp: +m[3], atk: +m[4], def: +m[5], exp: expM ? +expM[1] : 0, gold: goldM ? +goldM[1] : 0, boss: /isBoss:\s*true/.test(line) };
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
  const heroHp = BASE_HP(lv) * hpRatio;
  const heroAtk = BASE_ATK(lv), heroDef = BASE_DEF(lv);
  const heroDmg = dmg(heroAtk, mon.def, NEUTRAL.pen, NEUTRAL.hit, 0, 0.05, 1.5, 1.15);
  const monDmg = dmg(mon.atk, heroDef, NEUTRAL.pen, NEUTRAL.hit, NEUTRAL.dodge, 0, 1.5, 0.9);
  const roundsToKill = Math.ceil(mon.hp / Math.max(1, heroDmg));
  const roundsToDie = Math.ceil(heroHp / Math.max(1, monDmg));
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
    if (!best || target.exp > best.target.exp) best = { map, target, bossReady: wins(lv, monsters[map.boss] ?? target, 1) };
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
