#!/usr/bin/env node
/**
 * 内容密度审计 —— 世界广度 R4 验收（第 10 节第 5 条）
 * 统计每个区域的内容池占比 + 模拟 7×7 格子抽样占比，对照密度下限：
 *   野怪 ≥40%、采集 ≥15%、奇遇/发现 ≥15%、遭遇NPC ≥5%、副本 1~2 个。
 *
 * 用法：node scripts/content-audit.mjs
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (f) => readFileSync(join(root, f), 'utf8');

// ── 解析 sites.ts 的 SiteDef ──
const sitesSrc = read('src/data/sites.ts');
const siteDefs = [];
{
  // 每个 SiteDef 形如：{ id: 'x', kind: 'monster', regionId: 'y', terrain: [...], levelRange: [...], weight: N, ... }
  const re = /\{\s*id:\s*'([^']+)',\s*kind:\s*'([^']+)',\s*regionId:\s*'([^']+)'/g;
  let m;
  while ((m = re.exec(sitesSrc)) !== null) {
    siteDefs.push({ id: m[1], kind: m[2], regionId: m[3] });
  }
}

// ── 解析 regionId 映射（regions.ts 里 REGIONS 数组的 id + name，用 cellPrefix 区分区域 vs 主城） ──
const regionsSrc = read('src/data/regions.ts');
const regions = [];
{
  // 只取带 cellPrefix 字段的 WorldRegion 定义
  const re = /id:\s*'([^']+)',\s*name:\s*'([^']+)',\s*description:[\s\S]*?cellPrefix:\s*'([^']+)'/g;
  let m;
  while ((m = re.exec(regionsSrc)) !== null) {
    regions.push({ id: m[1], name: m[2], prefix: m[3] });
  }
}

// ── 解析格子地形（cellMap.ts 的 CENTRAL + hexiCells.ts 的 HEXI + donghaiCells.ts 的 DONGHAI） ──
const cellMapSrc = read('src/data/cellMap.ts');
const hexiSrc = read('src/data/hexiCells.ts');
const donghaiSrc = read('src/data/donghaiCells.ts');
const cellTerrains = []; // { id, terrain }
{
  const re = /id:\s*'([^']+)',\s*x:\s*\d+,\s*y:\s*\d+,\s*terrain:\s*'([^']+)'/g;
  for (const src of [cellMapSrc, hexiSrc, donghaiSrc]) {
    let m;
    while ((m = re.exec(src)) !== null) {
      cellTerrains.push({ id: m[1], terrain: m[2] });
    }
  }
}

// ── 确定性哈希（复刻 pickSiteForCell 的加权抽取） ──
function hash01(s) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0) / 0xffffffff;
}

// 从 sites.ts 提取每个 site 的 terrain/levelRange/weight（用于格子模拟）
const siteFull = [];
{
  // 更宽松地按块解析：每个 site 块从 "id:" 到 "}," 结束
  const blocks = sitesSrc.split(/\{\s*id:/).slice(1);
  for (const b of blocks) {
    const id = b.match(/^\s*'([^']+)'/)?.[1];
    const kind = b.match(/kind:\s*'([^']+)'/)?.[1];
    const regionId = b.match(/regionId:\s*'([^']+)'/)?.[1];
    const terrain = [...b.matchAll(/terrain:\s*\[([^\]]*)\]/g)].flatMap((x) =>
      [...x[1].matchAll(/'([^']+)'/g)].map((y) => y[1])
    );
    const lr = b.match(/levelRange:\s*\[(\d+),\s*(\d+)\]/);
    const weight = Number(b.match(/weight:\s*(\d+)/)?.[1] ?? 1);
    if (id && kind && regionId) {
      siteFull.push({
        id, kind, regionId, terrain,
        levelMin: lr ? +lr[1] : 0, levelMax: lr ? +lr[2] : 99, weight,
      });
    }
  }
}

const KIND_LABEL = {
  monster: '野怪', gather: '采集', encounter: '奇遇', discovery: '发现',
  npc: '遭遇NPC', dungeon: '副本', landmark: '地标',
};

// 从 regions.ts 解析每个区域的 contentBudget（与 src 保持一致，避免两处漂移）
const BUDGET = {};
{
  const re = /id:\s*'([^']+)'[\s\S]*?contentBudget:\s*\{\s*monster:\s*(\d+),\s*gather:\s*(\d+),\s*encounter:\s*(\d+),\s*discovery:\s*(\d+),\s*npc:\s*(\d+),\s*dungeon:\s*(\d+)\s*\}/g;
  let m;
  while ((m = re.exec(regionsSrc)) !== null) {
    BUDGET[m[1]] = { monster: +m[2], gather: +m[3], encounter: +m[4], discovery: +m[5], npc: +m[6], dungeon: +m[7] };
  }
}

// 复刻 assignSiteKinds：确定性密度分配
function assignKinds(regionId, cells, level) {
  const budget = BUDGET[regionId] ?? { monster: 20, gather: 8, encounter: 6, discovery: 6, npc: 4, dungeon: 2 };
  const queue = [];
  for (const k of ['monster', 'gather', 'encounter', 'discovery', 'npc', 'dungeon']) {
    for (let i = 0; i < (budget[k] ?? 0); i++) queue.push(k);
  }
  const sorted = [...cells].sort((a, b) => hash01(regionId + ':' + a.id) - hash01(regionId + ':' + b.id));
  const result = {};
  const pending = [];
  const sites = siteFull.filter((s) => s.regionId === regionId);
  for (const cell of sorted) {
    if (queue.length === 0) { pending.push(cell); continue; }
    const kind = queue.shift();
    const pool = sites.filter((s) => s.terrain.includes(cell.terrain) && level >= s.levelMin && level <= s.levelMax && s.kind === kind);
    if (pool.length === 0) { queue.push(kind); pending.push(cell); }
    else {
      // 加权选具体 site
      const total = pool.reduce((sum, s) => sum + s.weight, 0);
      let r = hash01(regionId + ':' + cell.id + ':pick') * total;
      let chosen = pool[pool.length - 1];
      for (const s of pool) { r -= s.weight; if (r <= 0) { chosen = s; break; } }
      result[cell.id] = chosen;
    }
  }
  for (const cell of pending) {
    const pool = sites.filter((s) => s.terrain.includes(cell.terrain) && level >= s.levelMin && level <= s.levelMax);
    const fb = pool.filter((s) => s.kind === 'monster' || s.kind === 'gather');
    const target = fb.length > 0 ? fb : pool;
    if (target.length > 0) result[cell.id] = target[0];
  }
  return result;
}

// ── 输出 ──
let failed = false;
console.log('区域         | 内容池（原始占比）');
console.log('-------------|--------------------------------------------------------');

for (const region of regions) {
  const pool = siteFull.filter((s) => s.regionId === region.id);
  const regionPrefix = region.prefix + '_';
  const regionCells = cellTerrains.filter((c) => c.id.startsWith(regionPrefix));

  // 池级统计
  const poolCount = {};
  for (const s of pool) poolCount[s.kind] = (poolCount[s.kind] ?? 0) + 1;
  const poolPct = Object.fromEntries(Object.entries(poolCount).map(([k, v]) => [k, ((v / pool.length) * 100).toFixed(0) + '%']));

  // 格子级模拟（用区域中位等级，确定性密度分配）
  const lv = Math.round((regionLevel(region.id) ?? 15));
  const assignment = assignKinds(region.id, regionCells, lv);
  const cellCount = {};
  for (const c of regionCells) {
    const site = assignment[c.id];
    const k = site ? site.kind : 'empty';
    cellCount[k] = (cellCount[k] ?? 0) + 1;
  }
  const totalCells = regionCells.length || 1;
  const cellPct = Object.fromEntries(Object.entries(cellCount).map(([k, v]) => [k, ((v / totalCells) * 100).toFixed(0) + '%']));

  console.log(`${region.name.padEnd(12)} | 池[${pool.length}项] ${fmt(poolPct)}`);
  console.log(`             | 格[${regionCells.length}格] ${fmt(cellPct)}`);

  // 校验格子级密度下限
  const mPct = (cellCount.monster ?? 0) / totalCells;
  const gPct = (cellCount.gather ?? 0) / totalCells;
  const ePct = ((cellCount.encounter ?? 0) + (cellCount.discovery ?? 0)) / totalCells;
  const nPct = (cellCount.npc ?? 0) / totalCells;
  const dCnt = cellCount.dungeon ?? 0;
  const emptyPct = (cellCount.empty ?? 0) / totalCells;

  const checks = [
    ['野怪≥40%', mPct >= 0.4],
    ['采集≥15%', gPct >= 0.15],
    ['奇遇/发现≥15%', ePct >= 0.15],
    ['遭遇NPC≥5%', nPct >= 0.05],
    ['副本1~2个', dCnt >= 1 && dCnt <= 2],
    ['空野地<30%', emptyPct < 0.3],
  ];
  const pass = checks.every(([, ok]) => ok);
  if (!pass) failed = true;
  console.log(`             | ${checks.map(([n, ok]) => (ok ? '✓' : '✗') + n).join('  ')}  ${pass ? '✅' : '❌'}`);
}

function fmt(obj) {
  const order = ['monster', 'gather', 'encounter', 'discovery', 'npc', 'dungeon', 'landmark', 'empty'];
  return order.filter((k) => obj[k]).map((k) => `${KIND_LABEL[k] ?? k}:${obj[k]}`).join(' ');
}

function regionLevel(regionId) {
  const m = regionsSrc.match(new RegExp(`id:\\s*'${regionId}'[\\s\\S]{0,400}?levelRange:\\s*\\[(\\d+),\\s*(\\d+)\\]`));
  if (!m) return null;
  return Math.round((+m[1] + +m[2]) / 2);
}

console.log('');
console.log(failed ? '✗ 内容密度未达标' : '✓ 所有区域内容密度达标');
process.exitCode = failed ? 1 : 0;
