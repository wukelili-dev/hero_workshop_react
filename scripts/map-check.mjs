#!/usr/bin/env node
/**
 * 地图方位与城市落位断言（跑商与城市系统 M2 验收）
 *
 * 用正则读 cellMap.ts / cellEncounters.ts / cities.ts，不靠肉眼：
 *  1. 中原板 11×9 = 99 格
 *  2. 13 城全部有格子，且每座城都有遭遇绑定
 *  3. 方位断言（3.1.1 硬约束）
 *  4. 遭遇表无悬空 key（指向不存在格子）
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (f) => readFileSync(join(root, f), 'utf8');

const cellSrc = read('src/data/cellMap.ts');
const encSrc = read('src/data/cellEncounters.ts');
const citiesSrc = read('src/data/cities.ts');
const hexiSrc = read('src/data/hexiCells.ts');
const donghaiSrc = read('src/data/donghaiCells.ts');

// 解析所有区域格子：id + x + y（中原 cp + 河西 hx + 东海 dh）
const cells = [];
{
  const re = /id:\s*'((?:cp|hx|dh)_\d+_\d+)',\s*x:\s*(\d+),\s*y:\s*(\d+)/g;
  for (const src of [cellSrc, hexiSrc, donghaiSrc]) {
    let m;
    while ((m = re.exec(src)) !== null) {
      cells.push({ id: m[1], x: +m[2], y: +m[3] });
    }
  }
}
const cpCells = cells.filter((c) => c.id.startsWith('cp_'));
const cellById = new Map(cells.map((c) => [c.id, c]));

// 解析城市：id + name + cellId
const cities = [];
{
  const blocks = citiesSrc.split(/\n\s*\{\n\s*id:/).slice(1);
  for (const b of blocks) {
    const id = b.match(/^\s*'([^']+)'/)?.[1];
    const name = b.match(/name:\s*'([^']+)'/)?.[1];
    const cellId = b.match(/cellId:\s*'([^']+)'/)?.[1];
    if (id && cellId) cities.push({ id, name, cellId });
  }
}

// 解析遭遇表的 key（cellId）与 mapId
const encounterKeys = new Set();
{
  const re = /^\s*(cp_\d+_\d+|hx_\d+_\d+|dh_\d+_\d+):\s*\{/gm;
  let m;
  while ((m = re.exec(encSrc)) !== null) encounterKeys.add(m[1]);
}

const fails = [];
const ok = (cond, msg) => { if (!cond) fails.push(msg); };

// ── 1. 中原板 99 格 ──
ok(cpCells.length === 99, `中原板应为 99 格，实际 ${cpCells.length}`);

// ── 2. 13 城全部有格子 + 遭遇绑定 ──
ok(cities.length === 13, `城市应为 13 座，实际 ${cities.length}`);
for (const c of cities) {
  ok(!!cellById.get(c.cellId), `城 ${c.name} 的格子 ${c.cellId} 不在 cellMap`);
  ok(encounterKeys.has(c.cellId), `城 ${c.name} 的格子 ${c.cellId} 无遭遇绑定`);
}

// ── 3. 方位断言 ──
const at = (cellId) => cellById.get(cellId);
const cityCell = (id) => at(cities.find((c) => c.id === id)?.cellId);

// 3.1 洛阳在长安东
{
  const a = cityCell('changan'), b = cityCell('luoyang');
  ok(a && b && b.x > a.x, `洛阳(x=${b?.x})应在长安(x=${a?.x})之东`);
}
// 3.2 阳关在长安西（阳关在河西板 hx，取其相对中原门户 cp_0_0 在西侧）
{
  const changan = cityCell('changan');
  const yangguanGate = at('cp_0_0');
  ok(changan && yangguanGate && yangguanGate.x < changan.x, `阳关道(x=${yangguanGate?.x})应在长安(x=${changan?.x})之西`);
}
// 3.3 益州在长安西南
{
  const a = cityCell('changan'), b = cityCell('yizhou');
  ok(a && b && b.x < a.x && b.y > a.y, `益州(${b?.x},${b?.y})应在长安(${a?.x},${a?.y})西南`);
}
// 3.4 荆州 y≥5；扬州 y≥7 且比荆州更南偏东
{
  const jz = cityCell('jingzhou'), yz = cityCell('yangzhou');
  ok(jz && jz.y >= 5, `荆州 y=${jz?.y} 应 ≥5（南半图）`);
  ok(yz && yz.y >= 7, `扬州 y=${yz?.y} 应 ≥7（最南）`);
  ok(jz && yz && yz.y > jz.y && yz.x > jz.x, `扬州(${yz?.x},${yz?.y})应比荆州(${jz?.x},${jz?.y})更南偏东`);
}
// 3.5 大唐东 x > 大唐南 x
{
  const a = cityCell('datangdong'), b = cityCell('datangnan');
  ok(a && b && a.x > b.x, `大唐东 x=${a?.x} 应 > 大唐南 x=${b?.x}（位置修正）`);
}
// 3.6 建邺紧贴东海渡口（相邻）
{
  const jy = cityCell('jianye'), ferry = at('cp_9_6');
  const adj = jy && ferry && (Math.abs(jy.x - ferry.x) + Math.abs(jy.y - ferry.y)) === 1;
  ok(adj, `建邺(${jy?.x},${jy?.y})应紧贴东海渡口(${ferry?.x},${ferry?.y})`);
}
// 3.7 傲来国与花果山在东侧（x ≥ 9）
{
  const al = cityCell('aolai'), hgs = cityCell('huaguoshan');
  ok(al && al.x >= 9, `傲来国 x=${al?.x} 应在东侧（≥9）`);
  ok(hgs && hgs.x >= 9, `花果山 x=${hgs?.x} 应在东侧（≥9）`);
}

// ── 4. 遭遇表无悬空 key ──
for (const key of encounterKeys) {
  ok(cellById.has(key), `遭遇表 key ${key} 指向不存在的格子`);
}

// ── 输出 ──
console.log('中原板格子数：' + cpCells.length + '（全部区域格子 ' + cells.length + '）');
console.log('城市数：' + cities.length + '（' + cities.map((c) => c.name).join('、') + '）');
console.log('遭遇绑定：' + encounterKeys.size + ' 格');
console.log('');
if (fails.length > 0) {
  console.log('✗ 方位断言未通过：');
  for (const f of fails) console.log('  - ' + f);
  process.exitCode = 1;
} else {
  console.log('✓ 地图方位与城市落位全部通过（99 格 / 13 城 / 方位 / 无悬空）');
}
