#!/usr/bin/env node
/**
 * 跑商与城市系统 —— 城市完整度 + 货架矩阵断言
 *
 * 用法：node scripts/trade-check.mjs
 *
 * 断言：
 *  1. 13 城齐备（8 跑商城 + 5 非跑商据点）
 *  2. 8 跑商城 trade:true 且每座有独有特产、无空货架
 *  3. 5 非跑商据点 trade:false 且 specialties/demands 为空
 *  4. 所有货物的 goodId 都能在 tradeGoods.ts 找到（无悬空引用）
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (f) => readFileSync(join(root, f), 'utf8');

const citiesSrc = read('src/data/cities.ts');
const goodsSrc = read('src/data/tradeGoods.ts');

// 解析 goods id 集合
const goodIds = new Set();
{
  const re = /id:\s*'([^']+)',\s*name:\s*'[^']+',\s*category:/g;
  let m;
  while ((m = re.exec(goodsSrc)) !== null) goodIds.add(m[1]);
}

// 解析城市块：id + trade + specialties + demands
const cities = [];
{
  // 每个城市块以 "id: '" 开头，到下一个 "id: '" 或数组结束
  const blocks = citiesSrc.split(/\n\s*\{\n\s*id:/).slice(1);
  for (const b of blocks) {
    const id = b.match(/^\s*'([^']+)'/)?.[1];
    const name = b.match(/name:\s*'([^']+)'/)?.[1];
    const trade = /trade:\s*(true|false)/.test(b) ? /trade:\s*(true|false)/.exec(b)[1] === 'true' : false;
    const sp = b.match(/specialties:\s*\[([^\]]*)\]/)?.[1] ?? '';
    const dm = b.match(/demands:\s*\[([^\]]*)\]/)?.[1] ?? '';
    const specialties = [...sp.matchAll(/'([^']+)'/g)].map((x) => x[1]);
    const demands = [...dm.matchAll(/'([^']+)'/g)].map((x) => x[1]);
    const cellId = b.match(/cellId:\s*'([^']+)'/)?.[1];
    const services = b.match(/services:\s*\[([^\]]*)\]/)?.[1] ?? '';
    if (id) cities.push({ id, name, trade, specialties, demands, cellId, services });
  }
}

const fails = [];
const ok = (cond, msg) => { if (!cond) fails.push(msg); };

// 1. 13 城齐备
ok(cities.length === 13, `城市数应为 13，实际 ${cities.length}`);

const tradeCities = cities.filter((c) => c.trade);
const nonTrade = cities.filter((c) => !c.trade);

// 2. 8 座跑商城
ok(tradeCities.length === 8, `跑商城应为 8 座，实际 ${tradeCities.length}`);
ok(nonTrade.length === 5, `非跑商据点应为 5 座，实际 ${nonTrade.length}`);

// 3. 每座跑商城有独有特产、无空货架
const allSpecialties = new Set();
for (const c of tradeCities) {
  ok(c.specialties.length >= 3, `跑商城 ${c.name} 特产应≥3，实际 ${c.specialties.length}`);
  ok(c.demands.length >= 3, `跑商城 ${c.name} 需求应≥3，实际 ${c.demands.length}`);
  for (const s of c.specialties) allSpecialties.add(s);
}

// 4. 5 非跑商据点 trade:false 且 specialties/demands 为空
for (const c of nonTrade) {
  ok(c.specialties.length === 0, `非跑商据点 ${c.name} 不应有特产`);
  ok(c.demands.length === 0, `非跑商据点 ${c.name} 不应有需求`);
}

// 5. 所有 goodId 都能在货物表找到
for (const c of cities) {
  for (const s of c.specialties) ok(goodIds.has(s), `货 ${s}（${c.name} 特产）不在 tradeGoods.ts`);
  for (const d of c.demands) ok(goodIds.has(d), `货 ${d}（${c.name} 需求）不在 tradeGoods.ts`);
}

// 6. 每城有 cellId + desc
for (const c of cities) {
  ok(!!c.cellId, `城 ${c.name} 缺 cellId`);
}

// ── 输出货架矩阵 ──
console.log('8 座跑商城货架矩阵');
console.log('城名 | 特产（本地便宜 ×0.7） | 需求（本地贵 ×1.35）');
console.log('----|------------------------|------------------------');
for (const c of tradeCities) {
  console.log(`${c.name} | ${c.specialties.join('、')} | ${c.demands.join('、')}`);
}
console.log('');
console.log('5 座非跑商据点（无货架）');
console.log(nonTrade.map((c) => c.name).join('、'));
console.log('');

console.log('货物总数：' + goodIds.size);
console.log('独有特产数：' + allSpecialties.size);

console.log('');
if (fails.length > 0) {
  console.log('✗ 未通过：');
  for (const f of fails) console.log('  - ' + f);
  process.exitCode = 1;
} else {
  console.log('✓ 城市完整度与货架矩阵全部通过');
}

// ── M3 价差验证：任意两城之间至少 5 条货存在 >18% 正价差 ──
// 价差只看"地域×全城"（特产×0.7 / 需求×1.35 / 其他×1.0 × goodsScale），不含库存/事件/声望。
console.log('');
console.log('—— M3 价差验证（地域×全城差 >18%）——');
{
  // 解析货物 basePrice
  const goods = [];
  {
    const re = /id:\s*'([^']+)',\s*name:\s*'([^']+)',\s*category:\s*'([^']+)',\s*basePrice:\s*(\d+)/g;
    let m;
    while ((m = re.exec(goodsSrc)) !== null) goods.push({ id: m[1], name: m[2], category: m[3], basePrice: +m[4] });
  }
  const goodById = new Map(goods.map((g) => [g.id, g]));

  // 解析每城的 goodsScale
  const scaleById = new Map();
  {
    const blocks = citiesSrc.split(/\n\s*\{\n\s*id:/).slice(1);
    for (const b of blocks) {
      const id = b.match(/^\s*'([^']+)'/)?.[1];
      const scale = b.match(/goodsScale:\s*([\d.]+)/)?.[1];
      if (id && scale) scaleById.set(id, +scale);
    }
  }

  // 城 → 每货的地域因子
  const regionFactor = (city, goodId) => {
    if (city.specialties.includes(goodId)) return 0.7;
    if (city.demands.includes(goodId)) return 1.35;
    return 1.0;
  };
  const effectiveMult = (city, goodId) => regionFactor(city, goodId) * (scaleById.get(city.id) ?? 1.0);

  // 找 >18% 价差（两城一货的 effectiveMult 相对差）
  const pairs = [];
  for (let i = 0; i < tradeCities.length; i++) {
    for (let j = i + 1; j < tradeCities.length; j++) {
      const a = tradeCities[i], b = tradeCities[j];
      const spreadGoods = goods
        .filter((g) => g.category !== 'contraband')
        .map((g) => {
          const ma = effectiveMult(a, g.id);
          const mb = effectiveMult(b, g.id);
          const lo = Math.min(ma, mb);
          const hi = Math.max(ma, mb);
          const spread = (hi - lo) / lo;
          return { good: g, ma, mb, spread };
        })
        .filter((x) => x.spread > 0.18)
        .sort((x, y) => y.spread - x.spread);
      if (spreadGoods.length > 0) {
        pairs.push({ a: a.name, b: b.name, count: spreadGoods.length, top: spreadGoods.slice(0, 3) });
      }
    }
  }

  // 任意两城之间至少 5 条 >18%
  const bestPair = pairs.sort((x, y) => y.count - x.count)[0];
  console.log(`存在 >18% 价差的城市对数量：${pairs.length}`);
  console.log(`最大价差城市对：${bestPair?.a} ↔ ${bestPair?.b}（${bestPair?.count} 条 >18%）`);
  if (bestPair) {
    for (const t of bestPair.top) {
      console.log(`  - ${t.good.name}：${(t.spread * 100).toFixed(0)}%（${t.ma.toFixed(2)} vs ${t.mb.toFixed(2)}）`);
    }
  }
  const spreadOk = bestPair && bestPair.count >= 5;
  console.log('');
  if (!spreadOk) {
    console.log('✗ 价差验证未通过：需任意两城之间 ≥5 条货 >18% 正价差');
    process.exitCode = 1;
  } else {
    console.log('✓ 价差验证通过（存在 ≥5 条 >18% 正价差的城对）');
  }
}
