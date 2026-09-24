#!/usr/bin/env node
/**
 * 一键体检 —— 替代"核对文档"时的人工反复 grep / 反复起浏览器。
 *
 * 用法：
 *   node scripts/verify.mjs         静态检查（默认，不依赖任何服务）
 *   node scripts/verify.mjs --ui    额外检查 dev server 与关键模块能否被转译（需先 npm run dev）
 *
 * 输出一张 PASS/FAIL 表；任何 FAIL 都以非 0 退出码结束。
 */
import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const wantUi = process.argv.includes('--ui');
const rows = [];
const read = (f) => (existsSync(f) ? readFileSync(f, 'utf8') : '');
const has = (f, needle) => read(f).includes(needle);
const run = (cmd) => {
  try {
    return { ok: true, out: execSync(cmd, { encoding: 'utf8', stdio: 'pipe' }).trim() };
  } catch (e) {
    return { ok: false, out: String(e.stdout || e.message).split('\n').slice(0, 6).join('\n') };
  }
};
const check = (name, fn) => {
  let result;
  try {
    result = fn();
  } catch (e) {
    result = { ok: false, out: e.message };
  }
  rows.push({ name, ok: result.ok, detail: result.out });
};

// 1) 类型检查
check('tsc 类型检查', () => {
  const r = run('npx tsc -p tsconfig.app.json --noEmit');
  return { ok: r.ok, out: r.ok ? 'TSC CLEAN' : r.out };
});

// 2) 关键文件齐全
check('关键文件存在', () => {
  const must = [
    'src/engine/ItemEffects.ts', 'src/data/items/items.ts', 'src/data/items/nameParts.ts',
    'src/components/shared/ItemCard.tsx', 'src/engine/VisitSystem.ts', 'src/components/shared/VisitModal.tsx',
    'src/data/factions.ts', 'src/engine/FactionSystem.ts', 'src/engine/OfflineReport.ts',
  ];
  const miss = must.filter((f) => !existsSync(f));
  return { ok: miss.length === 0, out: miss.length ? `缺失: ${miss.join(', ')}` : `OK（${must.length} 个）` };
});

// 3) 词条挂点接线（含离线结算）
check('词条挂点接线', () => {
  const files = [
    'src/store/useWorldStore.ts', 'src/engine/NpcBenefits.ts', 'src/engine/NpcSystem.ts',
    'src/store/useGameStore.ts', 'src/engine/Combat.ts', 'src/engine/NpcAutonomy.ts',
    'src/engine/OfflineReport.ts',
  ];
  const miss = files.filter((f) => !has(f, 'ItemEffects'));
  return { ok: miss.length === 0, out: miss.length ? `未接: ${miss.join(', ')}` : `OK（${files.length}/${files.length}）` };
});

// 4) 死字段清理
check('死字段 passiveId 已清', () => {
  const bad = ['src/types.ts', 'src/data/equipment.ts', 'src/engine/equipmentDrops.ts'].filter((f) => has(f, 'passiveId'));
  return { ok: bad.length === 0, out: bad.length ? `仍有: ${bad.join(', ')}` : 'OK' };
});

// 5) 文档不入库
check('docs 未进版本库', () => {
  const r = run('git ls-files docs');
  const n = r.out ? r.out.split('\n').filter(Boolean).length : 0;
  return { ok: n === 0, out: n === 0 ? 'OK（0 个跟踪文件）' : `FAIL：仍跟踪 ${n} 个文档` };
});

// 6) 未推送提交数（只报告，不算失败）
const ahead = run('git rev-list --count origin/main..HEAD');
rows.push({ name: '未推送提交', ok: true, detail: `${ahead.out} 个（约定：不 push）` });

// 7) 可选：开发服务器与关键模块可转译
if (wantUi) {
  const mods = ['/src/data/items/items.ts', '/src/engine/ItemEffects.ts', '/src/components/shared/ItemCard.tsx'];
  const results = await Promise.all(mods.map(async (m) => {
    try {
      const r = await fetch(`http://127.0.0.1:5173${m}`, { signal: AbortSignal.timeout(5000) });
      return `${m}=${r.status}`;
    } catch {
      return `${m}=unreachable`;
    }
  }));
  const ok = results.every((r) => r.endsWith('=200'));
  rows.push({ name: 'dev server 模块转译', ok, detail: results.join(' ') });
}

// 输出
const pad = Math.max(...rows.map((r) => r.name.length));
console.log('检查项'.padEnd(pad) + ' | 结果');
console.log('-'.repeat(pad) + '-|------');
for (const r of rows) console.log(`${(r.ok ? '✓ ' : '✗ ') + r.name}`.padEnd(pad + 2) + `| ${r.detail}`);
const failed = rows.filter((r) => !r.ok);
console.log('');
console.log(failed.length === 0 ? '全部通过' : `${failed.length} 项未通过`);
// 用 exitCode 而不是 process.exit()：让 Node 自然收尾，避免 --ui 下 fetch 句柄未释放触发的断言噪音
process.exitCode = failed.length === 0 ? 0 : 1;
