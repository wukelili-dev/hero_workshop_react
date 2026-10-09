/**
 * 战斗界面渲染冒烟（B6）
 *
 * 为什么要有这个脚本：引擎断言（status-check）只保证"算得对"，管不了"画得出来"。
 * 战斗界面在 B4/B5/B6 连加了三类新按钮、状态图标、狂暴标记与飘字，
 * 任何一处取到 undefined 都会让整场战斗白屏——而白屏只有真正点开才能发现。
 *
 * 做法：用 react-dom/server 把 BattleModal 在若干"关键状态"下渲染成字符串，
 * 断言该出现的东西确实出现、且渲染过程不抛异常。SSR 渲染能覆盖组件树里的
 * 所有取值路径（这正是白屏的成因），且不需要浏览器。
 *
 * 运行方式（需要 JSX 转译，故此文件由 vite 构建后再执行）：
 *   npx vite build --ssr scripts/ui-render-check.tsx --outDir .tmp-ui-check --logLevel warn
 *   node .tmp-ui-check/ui-render-check.js
 */
import React from 'react';
import { renderToString } from 'react-dom/server';
import { BattleModal } from '../src/components/battle/BattleModal';
import { useBattleStore } from '../src/store/useBattleStore';
import { useInventoryStore } from '../src/store/useInventoryStore';
import { addStatus } from '../src/engine/BattleCore';
import type { BattleState } from '../src/engine/Battle';
import type { Combatant } from '../src/types';

const rows: Array<{ name: string; ok: boolean; detail: string }> = [];
const check = (name: string, fn: () => { ok: boolean; detail: string }) => {
  try {
    rows.push({ name, ...fn() });
  } catch (e) {
    rows.push({ name, ok: false, detail: (e as Error).message.split('\n')[0] });
  }
};

function mkCombatant(side: 'ally' | 'foe', name: string): Combatant {
  return {
    id: side, name, side, level: 30,
    primary: { root: 40, qi: 40, agility: 40, spirit: 40, fortune: 20 },
    derived: {
      hpMax: 1200, atk: 260, def: 90, hit: 0.9, dodge: 0.05, speed: 26,
      pen: 12, tenacity: 20, resist: 0.1, crit: 0.1, critDmg: 1.5,
    },
    vars: { rage: 60, shield: 0, statuses: [] },
    lineage: side === 'foe' ? 'demon' : 'human',
  };
}

function mkBattle(over: Partial<BattleState> = {}): BattleState {
  const hero = mkCombatant('ally', '勇者');
  const foe = mkCombatant('foe', '测试妖');
  foe.isBoss = true;
  return {
    monster: {
      id: 'test', name: '测试妖', expReward: 10, goldReward: 10, drops: [], level: 30, isBoss: true,
    } as BattleState['monster'],
    hero, mates: [], foe,
    ctx: { comboChance: 0, reflect: 0, thorns: 0, guardChance: 0, damageCut: 0, lifesteal: 0 },
    heroHp: 900, heroMaxHp: 1200, foeHp: 900, foeMaxHp: 1200, round: 3,
    heroFirst: true, logs: [], over: false, victory: false, fled: false,
    rewards: { exp: 0, gold: 0, drops: [], equipment: [] },
    charged: false, mateOrder: null, foePhase: 1,
    ...over,
  };
}

/** 渲染当前 store 里的战斗并返回 HTML */
function render(): string {
  return renderToString(React.createElement(BattleModal));
}

/**
 * react-dom/server 会在相邻文本节点之间插入 `<!-- -->` 分隔符
 * （"怒 40" 实际输出为 "怒 <!-- -->40"），做字符串断言前必须先去掉，
 * 否则断言失败的原因会和真正的渲染问题混在一起。
 */
const txt = (html: string): string => html.replace(/<!--[\s\S]*?-->/g, '');

// ── 场景 1：正常进行中（无队友、背包无药） ──
check('进行中：武学/基础动作全部渲染', () => {
  useInventoryStore.setState({ slots: new Array(10).fill(null) });
  useBattleStore.setState({ battle: mkBattle() });
  const html = render();
  const body = txt(html);
  const parts = ['招式对决', '武学', '普通攻击', '防御蓄势', '蓄力', '用药', '逃跑', '轻招'];
  const miss = parts.filter((p) => !body.includes(p));
  return { ok: miss.length === 0, detail: miss.length === 0 ? `渲染 ${html.length} 字符` : `缺: ${miss.join(', ')}` };
});

// ── 场景 2：武学卡显示倍率与档位 ──
check('武学卡显示档位与倍率（不是光秃秃的按钮）', () => {
  useBattleStore.setState({ battle: mkBattle() });
  const body = txt(render());
  const ok = body.includes('×1.15') && body.includes('怒 40');
  return { ok, detail: ok ? '含「×1.15」与「怒 40」' : '技能卡缺倍率/档位标注' };
});

// ── 场景 3：状态图标 ──
check('状态以图标 + 层数渲染', () => {
  const st = mkBattle();
  addStatus(st.hero, 'bleed', 3, 2, 100);
  addStatus(st.hero, 'stun', 1, 2);
  st.hero.vars.shield = 200;
  useBattleStore.setState({ battle: st });
  const body = txt(render());
  const ok = body.includes('🩸') && body.includes('⚡') && body.includes('×3') && body.includes('护盾 200');
  return { ok, detail: ok ? '流血/麻痹/护盾图标齐备' : '状态图标缺失' };
});

// ── 场景 4：被麻痹 → 禁用 + 提示 ──
check('被麻痹时禁用操作并给出提示', () => {
  const st = mkBattle();
  addStatus(st.hero, 'stun', 1, 2);
  useBattleStore.setState({ battle: st });
  const html = render();
  const ok = txt(html).includes('本回合递不出手') && html.includes('disabled');
  return { ok, detail: ok ? '麻痹提示 + disabled 属性齐备' : '麻痹态未禁用操作' };
});

// ── 场景 5：Boss 第二阶段 ──
check('Boss 第二阶段显示「狂暴」', () => {
  useBattleStore.setState({ battle: mkBattle({ foePhase: 2 }) });
  const ok = txt(render()).includes('狂暴');
  return { ok, detail: ok ? '狂暴标记可见' : '缺狂暴标记' };
});

// ── 场景 6：有队友 + 背包有药 → 用药/队友令可用 ──
check('有队友与伤药时，用药与队友令入口可用', () => {
  const st = mkBattle();
  st.mates = [mkCombatant('ally', '队友甲')];
  const slots = new Array(10).fill(null);
  slots[0] = { type: 'novelty', id: '金疮药 [回血+20]', qty: 3 };
  useInventoryStore.setState({ slots });
  useBattleStore.setState({ battle: st });
  const body = txt(render());
  const ok = body.includes('用药(3)') && body.includes('队友令');
  return { ok, detail: ok ? '用药(3) 与 队友令 均渲染' : '用药/队友令入口缺失' };
});

// ── 场景 7：结算态 ──
check('胜利结算面板渲染奖励与收招', () => {
  const st = mkBattle({
    over: true, victory: true,
    rewards: { exp: 120, gold: 80, drops: [{ itemId: '铁矿', quantity: 3 }], equipment: [] },
  });
  useBattleStore.setState({ battle: st });
  const body = txt(render());
  const ok = body.includes('战斗胜利') && body.includes('经验 +120') && body.includes('收招');
  return { ok, detail: ok ? '结算面板完整' : '结算面板缺内容' };
});

// ── 场景 8：逃跑态 ──
check('逃跑态渲染', () => {
  useBattleStore.setState({ battle: mkBattle({ over: true, fled: true }) });
  const ok = txt(render()).includes('已脱离战斗');
  return { ok, detail: ok ? '逃跑面板可见' : '缺逃跑面板' };
});

// ── 场景 9：没有战斗时不应渲染任何东西 ──
check('无战斗时不渲染（不残留空面板）', () => {
  useBattleStore.setState({ battle: null });
  const html = render();
  return { ok: html === '', detail: html === '' ? '返回空串' : `意外渲染了 ${html.length} 字符` };
});

const pad = Math.max(...rows.map((r) => r.name.length));
console.log('检查项'.padEnd(pad) + ' | 结果');
console.log('-'.repeat(pad) + '-|------');
for (const r of rows) console.log(`${(r.ok ? '✓ ' : '✗ ') + r.name}`.padEnd(pad + 2) + `| ${r.detail}`);
const failed = rows.filter((r) => !r.ok);
console.log('');
console.log(failed.length === 0 ? `全部通过（${rows.length} 项）` : `${failed.length}/${rows.length} 项未通过`);
process.exitCode = failed.length === 0 ? 0 : 1;
