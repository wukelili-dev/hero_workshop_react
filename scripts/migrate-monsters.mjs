#!/usr/bin/env node
/**
 * migrate-monsters.mjs —— C3：把 maps.ts 的 62 只怪从"手写 hp/atk/def"迁移到
 * "等级 + 主属性 primary"数据模型。反向拟合 primary（镜像 Stats.migrateLegacyStats），
 * 使 buildDerived(primary) 反算出的 atk/def 精确还原、hp 不降（与运行时一致）。
 * 用法：node scripts/migrate-monsters.mjs  （原地改写 src/data/maps.ts；git 可回滚）
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const file = join(root, 'src/data/maps.ts');
const src = readFileSync(file, 'utf8');
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const r2 = (v) => Math.round(v * 100) / 100;

function primaryFor(level, hp, atk, def) {
  const qi = clamp((atk - 4 - level * 0.8) / 1.6, 1, 999);
  const rootDef = clamp((def - 2 - level * 0.5) / 0.8, 1, 999);
  const rootHp = clamp((hp - 60 - level * 10) / 12, 1, 999);
  const root = Math.max(rootDef, rootHp);
  return { root: r2(root), qi: r2(qi), agility: 5, spirit: 1, fortune: 1 };
}

let count = 0;
let out = src;
// 匹配每个怪物条目里的 level/hp/atk/def 四元组（同一条目内）
out = out.replace(/(level:\s*\d+,\s*hp:\s*(\d+),\s*atk:\s*(\d+),\s*def:\s*(\d+),)/g, (m, full, hp, atk, def) => {
  const lm = full.match(/level:\s*(\d+)/);
  const level = +lm[1];
  const p = primaryFor(level, +hp, +atk, +def);
  count++;
  return `${full} primary: { root: ${p.root}, qi: ${p.qi}, agility: ${p.agility}, spirit: ${p.spirit}, fortune: ${p.fortune} },`;
});

writeFileSync(file, out, 'utf8');
console.log(`已注入 primary：${count} 只怪`);
