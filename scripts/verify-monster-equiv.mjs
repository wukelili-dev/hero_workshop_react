// 验证怪物「等价主属性化」：反解 → 派生闭环是否精确还原 hp/atk/def
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = readFileSync(join(root, 'src/data/maps.ts'), 'utf8');
const lines = src.split(/\r?\n/);

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const r3 = (v) => Math.round(v * 1000) / 1000;

// 反解（legacyToMonsterPrimary 等价版）
function toPrimary(hp, atk, def, level) {
  return {
    root: clamp((hp - level * 10) / 12, 1, 999),
    qi: clamp((atk - level * 0.8) / 1.6, 1, 999),
    spirit: clamp((def - level * 0.5) / 0.8, 1, 999),
    agility: 0,
    fortune: 1,
  };
}
// 派生（buildMonsterDerived 等价版）
function toDerived(p, level) {
  return {
    hp: Math.round(p.root * 12 + level * 10),
    atk: Math.round(p.qi * 1.6 + level * 0.8),
    def: Math.round(p.spirit * 0.8 + level * 0.5),
  };
}

let count = 0, bad = 0;
for (const line of lines) {
  const m = line.match(/^\s*'([^']+)':\s*\{[^}]*?level:\s*(\d+),\s*hp:\s*(\d+),\s*atk:\s*(\d+),\s*def:\s*(\d+)/);
  if (!m) continue;
  const [, name, lv, hp, atk, def] = m;
  const p = toPrimary(+hp, +atk, +def, +lv);
  const d = toDerived(p, +lv);
  count++;
  if (d.hp !== +hp || d.atk !== +atk || d.def !== +def) {
    bad++;
    console.log(`✗ ${name} Lv${lv}: 原(${hp}/${atk}/${def}) 派生(${d.hp}/${d.atk}/${d.def})  primary=(${r3(p.root)},${r3(p.qi)},${r3(p.spirit)})`);
  }
}
console.log(`\n共 ${count} 只怪，不精确还原 ${bad} 只`);
console.log(bad === 0 ? '✓ 全部精确等价（round 后）' : '✗ 有偏差');
