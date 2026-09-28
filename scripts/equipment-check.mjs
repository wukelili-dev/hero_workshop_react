#!/usr/bin/env node
/**
 * 装备数值校验（C7 装备重做）
 *
 * 直接从 src/data/equipmentForms.ts 里用正则取出「曲线系数 + 各形态权重」，
 * 不复制常量（避免两套真相），再换算成实际的攻击/生命收益来断言：
 *   1. 主属性预算随等级单调不减；
 *   2. 三个武器流派在同一档位的攻击收益差异 > 20%（流派真的分得开）；
 *   3. 护甲根骨够厚（T5 重甲给的生命 ≥ 300），否则"堆血"没有意义。
 *
 * 用法：node scripts/equipment-check.mjs
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = readFileSync(join(root, 'src/data/equipmentForms.ts'), 'utf8');

// ── 取曲线：return Math.round(8 + Math.max(0, level) * 3.5) ──
const budgetMatch = src.match(/return Math\.round\((\d+(?:\.\d+)?) \+ Math\.max\(0, level\) \* (\d+(?:\.\d+)?)\)/);
if (!budgetMatch) throw new Error('未能从 equipmentForms.ts 解析出 primaryBudgetForLevel');
const BUDGET_BASE = Number(budgetMatch[1]);
const BUDGET_PER_LV = Number(budgetMatch[2]);
const budgetFor = (level) => Math.round(BUDGET_BASE + Math.max(0, level) * BUDGET_PER_LV);

// ── 取形态权重表 ──
const weightBlock = src.split('FORM_PRIMARY_WEIGHTS')[1]?.split('};')[0] ?? '';
const weights = {};
for (const m of weightBlock.matchAll(/(\w+):\s*\{([^}]*)\}/g)) {
  const entry = {};
  for (const kv of m[2].split(',')) {
    const [k, v] = kv.split(':').map((s) => s.trim());
    if (k && v) entry[k] = Number(v);
  }
  weights[m[1]] = entry;
}
if (Object.keys(weights).length === 0) throw new Error('未能从 equipmentForms.ts 解析出 FORM_PRIMARY_WEIGHTS');

// ── 主属性 → 实际收益（与 engine/Stats.ts 换算表一致） ──
const ARMOR_FORMS = new Set(['light_armor', 'heavy_armor', 'robe']);
const atkGain = (p) => (p.qi ?? 0) * 1.6 + (p.agility ?? 0) * 0.5 + (p.spirit ?? 0) * 0.3;
const hpGain = (p) => (p.root ?? 0) * 12;
const defGain = (p) => (p.root ?? 0) * 0.8;
const TIER_LEVEL = [1, 6, 12, 18, 26];

function craft(level, form) {
  const budget = budgetFor(level) * (ARMOR_FORMS.has(form) ? 0.85 : 1);
  const out = {};
  for (const [k, w] of Object.entries(weights[form] ?? {})) {
    const v = Math.round(budget * w);
    if (v > 0) out[k] = v;
  }
  return out;
}

console.log('档位  等级  快剑(atk)  重刀(atk)  长兵(atk) | 轻甲(hp/def)  重甲(hp/def)  法衣(hp/def)');
console.log('-'.repeat(84));
const rows = [];
for (const [i, lv] of TIER_LEVEL.entries()) {
  const swift = craft(lv, 'swift_blade');
  const heavy = craft(lv, 'heavy_blade');
  const longArm = craft(lv, 'long_arm');
  const light = craft(lv, 'light_armor');
  const heavyA = craft(lv, 'heavy_armor');
  const robe = craft(lv, 'robe');
  const cell = (p) => `${Math.round(hpGain(p))}/${Math.round(defGain(p))}`;
  console.log(
    `T${i + 1}    ${String(lv).padEnd(5)} ${String(Math.round(atkGain(swift))).padEnd(10)} ` +
    `${String(Math.round(atkGain(heavy))).padEnd(10)} ${String(Math.round(atkGain(longArm))).padEnd(10)}| ` +
    `${cell(light).padEnd(13)} ${cell(heavyA).padEnd(13)} ${cell(robe)}`,
  );
  rows.push({ lv, swift: atkGain(swift), heavy: atkGain(heavy), longArm: atkGain(longArm), heavyArmorHp: hpGain(heavyA) });
}

const budgetMono = TIER_LEVEL.every((lv, i) => i === 0 || budgetFor(lv) >= budgetFor(TIER_LEVEL[i - 1]));
const t5 = rows[rows.length - 1];
const spread = (Math.max(t5.swift, t5.heavy, t5.longArm) - Math.min(t5.swift, t5.heavy, t5.longArm))
  / Math.min(t5.swift, t5.heavy, t5.longArm);
const armorThick = t5.heavyArmorHp >= 300;

console.log('');
console.log(`主属性预算随等级单调不减：${budgetMono ? '✓' : '✗'}`);
console.log(`T5 三武器流派攻击收益差异：${(spread * 100).toFixed(0)}%（判据 >20%）${spread > 0.2 ? '✓' : '✗'}`);
console.log(`T5 重甲生命加成：${Math.round(t5.heavyArmorHp)}（判据 ≥300）${armorThick ? '✓' : '✗'}`);
process.exitCode = budgetMono && spread > 0.2 && armorThick ? 0 : 1;
