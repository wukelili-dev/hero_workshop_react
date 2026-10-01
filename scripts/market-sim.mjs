#!/usr/bin/env node
/**
 * market-sim — 跑商经济模拟与验收（E1 供需库存 / E2 每日波动）
 *
 * 用 Vite SSR 加载真实模块（Trade / cities / tradeGoods / useWorldStore），
 * 直接操作 zustand store 模拟，断言：
 *   E1：买空 A 城某货 → A 价 +30%~+50%；向 B 城倾销 20 件 → B 价 −20% 以上；
 *        不干预 5 天后回到基准 ±10%
 *   E2：连续 30 天价格序列有波动、不单调爆炸、不出现 >±25% 离谱值；
 *        模拟 200 次 A→B 行程，至少 15% "运过去反而亏"
 *
 * 用法：node scripts/market-sim.mjs
 */
import { createServer } from 'vite';

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });

const fails = [];
const ok = (cond, msg) => { if (!cond) fails.push(msg); };
const pct = (x) => `${(x * 100).toFixed(1)}%`;

try {
  const Trade = await server.ssrLoadModule('/src/engine/Trade.ts');
  const cities = await server.ssrLoadModule('/src/data/cities.ts');
  const goods = await server.ssrLoadModule('/src/data/tradeGoods.ts');
  const world = await server.ssrLoadModule('/src/store/useWorldStore.ts');
  const hash = await server.ssrLoadModule('/src/engine/hash.ts');

  const { priceOf, buyAtCity, sellAtCity, advanceMarketDays, supplyDemandMult } = Trade;
  const { stockTargetOf } = cities;
  const { TRADE_GOODS, goodOf } = goods;
  const { useWorldStore } = world;
  const { hash01, hashInt } = hash;

  const reset = () => useWorldStore.setState({ day: 1, marketStock: {}, drift: {}, dailyStockImpact: {}, rumors: [], npcCredibility: {} });

  // ═══ E1：供需库存 ═══
  console.log('—— E1 供需库存 ——');
  // 找长安的特产（本地便宜）做"买空"测试
  const changan = cities.cityById('changan');
  const spGoodId = changan.specialties[0];
  const target = stockTargetOf('changan', spGoodId);

  reset();
  const baseBefore = priceOf(spGoodId, 'changan', { side: 'buy' });
  // 买空：库存归零（偏离 = -target）
  useWorldStore.getState().adjustMarketStock('changan', spGoodId, -target);
  const priceAfterBuyout = priceOf(spGoodId, 'changan', { side: 'buy' });
  const buyoutRise = (priceAfterBuyout - baseBefore) / baseBefore;
  console.log(`买空 ${spGoodId}（target=${target}，库存归零）：${baseBefore} → ${priceAfterBuyout}（${pct(buyoutRise)}）`);
  ok(buyoutRise >= 0.30 && buyoutRise <= 0.50, `买空涨幅应 +30%~+50%，实际 ${pct(buyoutRise)}`);

  // 倾销：向长安倾销 20 件某需求货（target 小，偏离明显）
  reset();
  const demandGood = TRADE_GOODS.find((g) => changan.demands.includes(g.id));
  const nTarget = stockTargetOf('changan', demandGood.id);
  const baseNormal = priceOf(demandGood.id, 'changan', { side: 'buy' });
  useWorldStore.getState().adjustMarketStock('changan', demandGood.id, 20);
  const priceAfterDump = priceOf(demandGood.id, 'changan', { side: 'buy' });
  const dumpDrop = (priceAfterDump - baseNormal) / baseNormal;
  console.log(`倾销 ${demandGood.id} ×20（target=${nTarget}）：${baseNormal} → ${priceAfterDump}（${pct(dumpDrop)}）`);
  ok(dumpDrop <= -0.20, `倾销跌幅应 ≤ -20%，实际 ${pct(dumpDrop)}`);

  // 回弹：买空后不干预 5 天，回到基准 ±10%
  reset();
  useWorldStore.getState().adjustMarketStock('changan', spGoodId, -target);
  const afterBuy = priceOf(spGoodId, 'changan', { side: 'buy' });
  advanceMarketDays(5);
  useWorldStore.setState({ day: 6 });
  const afterRecover = priceOf(spGoodId, 'changan', { side: 'buy' });
  const recoverDev = (afterRecover - baseBefore) / baseBefore;
  console.log(`回弹：买空后 ${afterBuy} → 5 天后 ${afterRecover}（偏离 ${pct(recoverDev)}，基准 ${baseBefore}）`);
  ok(Math.abs(recoverDev) <= 0.10, `5 天后应回到基准 ±10%，实际偏离 ${pct(recoverDev)}`);

  // 单日冲击封顶：一天内疯狂买，价格影响封顶 ±35%
  reset();
  const cappedBase = priceOf(spGoodId, 'changan', { side: 'buy' });
  for (let i = 0; i < 50; i++) {
    Trade.adjustStockCapped('changan', spGoodId, -50); // 反复买走 50 件
  }
  const cappedPrice = priceOf(spGoodId, 'changan', { side: 'buy' });
  const cappedRise = (cappedPrice - cappedBase) / cappedBase;
  console.log(`单日疯狂买入后：${cappedBase} → ${cappedPrice}（单日影响 ${pct(cappedRise)}，应 ≤35%）`);
  ok(cappedRise <= 0.36, `单日价格影响应封顶 ≤35%，实际 ${pct(cappedRise)}`);

  // ═══ E2：每日波动 ═══
  console.log('');
  console.log('—— E2 每日波动 ——');
  reset();
  const baseP0 = priceOf(spGoodId, 'changan', { side: 'buy' }); // 初始基准（day=0 无波动）
  const seq = [];
  for (let d = 1; d <= 30; d++) {
    useWorldStore.setState({ day: d });
    advanceMarketDays(1);
    seq.push(priceOf(spGoodId, 'changan', { side: 'buy' }));
  }
  const minP = Math.min(...seq);
  const maxP = Math.max(...seq);
  const spread = (maxP - minP) / minP;
  // 不单调爆炸：序列不是单调递增/递减（有波动）
  let monoInc = true, monoDec = true;
  for (let i = 1; i < seq.length; i++) {
    if (seq[i] <= seq[i - 1]) monoInc = false;
    if (seq[i] >= seq[i - 1]) monoDec = false;
  }
  const maxDev = Math.max(Math.abs(maxP - baseP0), Math.abs(minP - baseP0)) / baseP0;
  console.log(`30 天价格：min=${minP} max=${maxP} 初始基准=${baseP0} 波动幅度=${pct(spread)} 最大偏离=${pct(maxDev)}`);
  ok(!monoInc && !monoDec, '价格应有波动（不能单调不变）');
  ok(maxDev <= 0.25, `单日波动不应 >±25%，实际最大偏离 ${pct(maxDev)}`);

  // 模拟 200 次 A→B 行程（随机城市对 + 随机货物）：统计"运过去反而亏"比例
  reset();
  const tradeCityIds = cities.tradeCities().map((c) => c.id);
  const normalGoods = TRADE_GOODS.filter((g) => g.category !== 'contraband');
  let lossTrips = 0;
  const N = 200;
  const tripDays = 5;
  for (let t = 0; t < N; t++) {
    useWorldStore.setState({ day: 1, marketStock: {}, drift: {}, rumors: [], npcCredibility: {} });
    const from = tradeCityIds[Math.floor(hash01(`trip:${t}:from`) * tradeCityIds.length)];
    const to = tradeCityIds[Math.floor(hash01(`trip:${t}:to`) * tradeCityIds.length)];
    if (from === to) continue;
    const good = normalGoods[Math.floor(hash01(`trip:${t}:good`) * normalGoods.length)];
    const buyPrice = priceOf(good.id, from, { side: 'buy' });
    advanceMarketDays(tripDays);
    useWorldStore.setState({ day: tripDays + 1 });
    const sellPrice = priceOf(good.id, to, { side: 'sell' });
    if (sellPrice < buyPrice) lossTrips++;
  }
  const lossRatio = lossTrips / N;
  console.log(`200 次随机 A→B 行程（随机城对+随机货，${tripDays} 天）：亏损 ${lossTrips} 次（${pct(lossRatio)}）`);
  ok(lossRatio >= 0.15 && lossRatio <= 0.95, `"运过去反而亏"比例应在 15%~95% 之间，实际 ${pct(lossRatio)}`);

  // ═══ E3：流言生成与真伪 ═══
  console.log('');
  console.log('—— E3 流言生成与真伪 ——');
  const Rumor = await server.ssrLoadModule('/src/engine/Rumor.ts');
  const { advanceRumors, credibilityOf } = Rumor;

  // 先制造真实市场状态：随机给 20 个 (城,货) 制造短缺（负偏离）或积压（正偏离）
  reset();
  useWorldStore.setState({ day: 1 });
  const madeStates = new Map(); // `${cityId}:${goodId}` -> 'shortage' | 'glut'
  for (let i = 0; i < 20; i++) {
    const cityId = tradeCityIds[hashInt(`seed:${i}:c`, tradeCityIds.length)];
    const goodId = normalGoods[hashInt(`seed:${i}:g`, normalGoods.length)].id;
    const dir = hash01(`seed:${i}:d`) < 0.5 ? 'shortage' : 'glut';
    const delta = dir === 'shortage' ? -30 : 30;
    useWorldStore.getState().adjustMarketStock(cityId, goodId, delta);
    madeStates.set(`${cityId}:${goodId}`, dir);
  }

  // 生成流言（逐日推进收集）
  const allRumors = [];
  for (let d = 1; d <= 30; d++) {
    useWorldStore.setState({ day: d });
    advanceRumors(d);
    allRumors.push(...useWorldStore.getState().rumors.filter((r) => r.bornDay === d));
  }
  const rumors = allRumors.slice(0, 200);
  const truthy = rumors.filter((r) => r.credible).length;
  const truthRatio = truthy / rumors.length;
  const expCred = rumors.reduce((s, r) => s + credibilityOf(r.fromNpcId), 0) / rumors.length;
  console.log(`生成 ${rumors.length} 条流言：真 ${truthy} 条（${pct(truthRatio)}），来源平均可信度 ${pct(expCred)}`);
  ok(Math.abs(truthRatio - expCred) <= 0.05, `真假比例应与来源可信度吻合（±5%），实际 ${pct(truthRatio)} vs ${pct(expCred)}`);

  // 真流言：目标城该货方向与"制造的真实状态"吻合（针对指向已制造状态城货的流言）
  let verified = 0, verifiedTotal = 0;
  for (const r of rumors) {
    const real = madeStates.get(`${r.targetCityId}:${r.goodId}`);
    if (!real) continue; // 该城货没被制造状态，跳过
    verifiedTotal++;
    const match = r.kind === real;
    // 真流言应与真实状态吻合；假流言应与真实状态相反
    if (r.credible === match) verified++;
  }
  const verifyRatio = verifiedTotal > 0 ? verified / verifiedTotal : 1;
  console.log(`可验证流言 ${verifiedTotal} 条，真伪与真实状态吻合 ${verified} 条（${pct(verifyRatio)}）`);
  ok(verifyRatio >= 0.5, `真流言目标城方向吻合应 ≥50%，实际 ${pct(verifyRatio)}`);

  // ═══ E4：打听与信誉 ═══
  console.log('');
  console.log('—— E4 打听与信誉 ——');
  // inquirePrice 与 priceOf 一致
  reset();
  const qGood = 'porcelain';
  const qPrice = priceOf(qGood, 'changan', { side: 'buy' });
  const intel = Trade.inquirePrice('changan', qGood, 1);
  console.log(`inquirePrice(瓷器,长安) = ${intel.price}，priceOf = ${qPrice}`);
  ok(intel.price === qPrice, `inquirePrice 应返回真实价 ${qPrice}，实际 ${intel.price}`);

  // 信誉结算：标记跟单 + 结算，验证 npcCredibility 累计
  reset();
  useWorldStore.setState({ day: 1 });
  advanceRumors(1);
  const aRumor = useWorldStore.getState().rumors[0];
  const npcId = aRumor.fromNpcId;
  // 标记跟单
  useWorldStore.setState({ rumors: useWorldStore.getState().rumors.map((r) => ({ ...r, followed: true })) });
  // 推进到流言过期（先 set day 到目标，再让 advanceMarketDays 用正确的 day 结算）
  const expireDay = aRumor.bornDay + aRumor.ttlDays + 1;
  useWorldStore.setState({ day: expireDay });
  advanceMarketDays(expireDay - 1);
  const rate = Rumor.credibilityRate(npcId);
  console.log(`流言结算后，${npcId} 应验率 = ${rate === null ? 'null' : pct(rate)}（跟单 1 条，真伪=${aRumor.credible}）`);
  ok(rate !== null, '跟单后 npcCredibility 应有记录（应验率非 null）');

} catch (e) {
  fails.push(`执行异常：${e && e.message ? e.message : e}`);
} finally {
  await server.close();
}

console.log('');
if (fails.length > 0) {
  console.log('✗ 未通过：');
  for (const f of fails) console.log('  - ' + f);
  process.exitCode = 1;
} else {
  console.log('✓ 跑商经济模拟（E1~E4）全部通过');
}
