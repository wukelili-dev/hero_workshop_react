import React, { useState, useCallback, useMemo } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { useFactoryStore } from '../../store/useFactoryStore';
import { DEPARTMENTS, MAX_FACTORY_WORKERS, FACTORY_WORKER_COST_GOLD, FACTORY_BASE_PROFIT, FACTORY_BASE_INTERVAL_S, getDeptById, calcFactoryBonus } from '../../data/factory';
import { FACTORY_BUILD_COST } from '../../data/factory';

const RARITY_NAMES = ['白', '绿', '蓝', '紫', '橙'];

export const FactoryTab: React.FC = () => {
  const hero = useGameStore(s => s.hero);
  const addGold = useGameStore(s => s.addGold);
  const resources = useGameStore(s => s.resources);
  const addResource = useGameStore(s => s.addResource);
  const depts = useFactoryStore(s => s.depts);
  const totalWorkers = useFactoryStore(s => s.totalWorkers);
  const autoRunning = useFactoryStore(s => s.autoRunning);
  const { buildDept, hireWorker, fireWorker, startProduction, collectProfit, setAutoRunning } = useFactoryStore();

  const [msg, setMsg] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  const ranchGold = hero.gold ?? 0;

  // 刷新当前时间（用于倒计时）
  React.useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const showMsg = (text: string) => {
    setMsg(text);
    setTimeout(() => setMsg(null), 2500);
  };

  // 建造部门
  const handleBuild = useCallback((deptId: string) => {
    const cfg = getDeptById(deptId);
    if (!cfg) return;
    if (ranchGold < cfg.costGold) { showMsg(`⚠️ 金币不足（需要 ${cfg.costGold}）`); return; }
    // 检查资源
    for (const [res, amt] of Object.entries(cfg.costResources)) {
      if ((resources[res] ?? 0) < amt) { showMsg(`⚠️ ${res}不足（需要 ${amt}）`); return; }
    }
    addGold(-cfg.costGold);
    for (const [res, amt] of Object.entries(cfg.costResources)) {
      addResource(res, -amt);
    }
    buildDept(deptId);
    showMsg(`✅ ${cfg.name} 建造完成！`);
  }, [ranchGold, resources, addGold, addResource, buildDept]);

  // 雇佣工人
  const handleHire = useCallback((deptId: string) => {
    if (totalWorkers >= MAX_FACTORY_WORKERS) { showMsg(`⚠️ 工人已满（${MAX_FACTORY_WORKERS}人）`); return; }
    if (ranchGold < FACTORY_WORKER_COST_GOLD) { showMsg(`⚠️ 金币不足（需要 ${FACTORY_WORKER_COST_GOLD}）`); return; }
    addGold(-FACTORY_WORKER_COST_GOLD);
    hireWorker(deptId);
    showMsg(`✅ 雇佣成功！`);
  }, [totalWorkers, ranchGold, addGold, hireWorker]);

  // 解雇工人
  const handleFire = useCallback((deptId: string) => {
    fireWorker(deptId);
    showMsg(`✅ 解雇成功`);
  }, [fireWorker]);

  // 开始生产
  const handleStart = useCallback(() => {
    startProduction();
    showMsg('✅ 生产已开始！');
  }, [startProduction]);

  // 收取利润
  const handleCollect = useCallback(() => {
    const { gold } = collectProfit();
    if (gold <= 0) { showMsg('⚠️ 暂无利润可收取'); return; }
    addGold(gold);
    showMsg(`✅ 收取利润 ${gold} 金币！`);
  }, [collectProfit, addGold]);

  // 计算总利润倍率
  const totalBonus = useMemo(() => {
    const builtIds = depts.filter(d => d.built).map(d => d.id);
    const workerCount = depts.reduce((sum, d) => sum + d.workerCount, 0);
    return calcFactoryBonus(builtIds, workerCount);
  }, [depts]);

  const estimatedProfit = Math.floor(FACTORY_BASE_PROFIT * totalBonus);

  // 生产倒计时
  const getProdStatus = (dept: typeof depts[0]): { ready: boolean; text: string } => {
    if (!dept.built) return { ready: false, text: '未建造' };
    const elapsed = (now - dept.lastProduceAt) / 1000;
    if (elapsed >= FACTORY_BASE_INTERVAL_S) return { ready: true, text: '可收取' };
    const remain = Math.ceil(FACTORY_BASE_INTERVAL_S - elapsed);
    const min = Math.ceil(remain / 60);
    return { ready: false, text: `${min}分钟后` };
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-gray-700">🏭 工厂</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-yellow-600 font-medium">💰 {ranchGold}</span>
          <button onClick={() => setAutoRunning(!autoRunning)}
            className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors ${autoRunning ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
            {autoRunning ? '自动中' : '自动'}
          </button>
        </div>
      </div>

      {msg && <div className="px-3 py-1.5 bg-gray-100 rounded text-sm text-center">{msg}</div>}

      <p className="text-[10px] text-gray-400">建造部门→雇佣工人→开始生产→收取金币利润</p>

      {/* 总利润预览 */}
      <div className="p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-center justify-between text-xs">
          <span className="text-yellow-700">预计利润（每5分钟）</span>
          <span className="font-bold text-yellow-600">💰 {estimatedProfit}</span>
        </div>
        <div className="text-[9px] text-yellow-500 mt-0.5">
          倍率：{totalBonus.toFixed(1)}x（部门+{(totalBonus - 1).toFixed(1)} + 工人{(totalWorkers * 0.15).toFixed(1)}）
        </div>
      </div>

      {/* 部门列表 */}
      <div className="space-y-2">
        {DEPARTMENTS.map(cfg => {
          const dept = depts.find(d => d.id === cfg.id) ?? { id: cfg.id, built: false, level: 0, workerCount: 0, lastProduceAt: 0 };
          const prodStatus = getProdStatus(dept);
          const canBuild = !dept.built && ranchGold >= cfg.costGold;
          const canHire = dept.built && totalWorkers < MAX_FACTORY_WORKERS && ranchGold >= FACTORY_WORKER_COST_GOLD;
          return (
            <div key={cfg.id} className={`p-2 border rounded-lg ${dept.built ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center justify-between mb-1">
                <div>
                  <div className="text-xs font-medium text-gray-800">{cfg.name}</div>
                  <div className="text-[9px] text-gray-400">{cfg.desc}（利润+{(cfg.bonusFactor * 100).toFixed(0)}%）</div>
                </div>
                {dept.built && (
                  <span className="text-[9px] px-1 py-0.5 bg-green-100 text-green-700 rounded">已建造</span>
                )}
              </div>

              {!dept.built ? (
                <button onClick={() => handleBuild(cfg.id)}
                  disabled={!canBuild}
                  className={`w-full py-1 rounded text-[10px] font-medium transition-colors ${canBuild ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
                  建造（{cfg.costGold}💰 {Object.entries(cfg.costResources).map(([k, v]) => `${k}×${v}`).join(' ')}）
                </button>
              ) : (
                <div className="space-y-1">
                  {/* 工人管理 */}
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-gray-500">工人：{dept.workerCount} / {Math.floor(1 + (hero.level ?? 1) / 5)}</span>
                    <div className="flex gap-1">
                      <button onClick={() => handleHire(cfg.id)} disabled={!canHire}
                        className={`px-1.5 py-0.5 rounded ${canHire ? 'bg-green-100 hover:bg-green-200 text-green-700' : 'bg-gray-100 text-gray-300 cursor-not-allowed'}`}>
                        +雇佣（{FACTORY_WORKER_COST_GOLD}💰）
                      </button>
                      <button onClick={() => handleFire(cfg.id)} disabled={dept.workerCount <= 0}
                        className={`px-1.5 py-0.5 rounded ${dept.workerCount > 0 ? 'bg-red-100 hover:bg-red-200 text-red-600' : 'bg-gray-100 text-gray-300 cursor-not-allowed'}`}>
                        -解雇
                      </button>
                    </div>
                  </div>
                  {/* 生产状态 */}
                  <div className="flex items-center justify-between text-[10px]">
                    <span className={prodStatus.ready ? 'text-green-600 font-medium' : 'text-gray-400'}>{prodStatus.text}</span>
                    <div className="flex gap-1">
                      {!prodStatus.ready && dept.lastProduceAt === 0 && (
                        <button onClick={handleStart}
                          className="px-1.5 py-0.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded text-[9px]">
                          开始生产
                        </button>
                      )}
                      <button onClick={handleCollect}
                        disabled={!prodStatus.ready}
                        className={`px-1.5 py-0.5 rounded text-[9px] ${prodStatus.ready ? 'bg-yellow-100 hover:bg-yellow-200 text-yellow-700' : 'bg-gray-100 text-gray-300 cursor-not-allowed'}`}>
                        收取利润
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 工人总数 */}
      <div className="text-[10px] text-gray-400 text-center">总工人：{totalWorkers} / {MAX_FACTORY_WORKERS}</div>
    </div>
  );
};
