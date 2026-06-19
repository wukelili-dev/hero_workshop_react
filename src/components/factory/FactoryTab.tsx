import React from 'react';
import { FaIndustry, FaCoins } from 'react-icons/fa6';
import { useGameStore } from '../../store/useGameStore';
import { useFactoryStore } from '../../store/useFactoryStore';
import { DEPARTMENTS, MAX_FACTORY_WORKERS, FACTORY_WORKER_COST_GOLD, FACTORY_WORKER_BONUS, FACTORY_BASE_PROFIT, FACTORY_BUILD_COST } from '../../data/factory';

export const FactoryTab: React.FC = () => {
  const hero = useGameStore(s => s.hero);
  const resources = useGameStore(s => s.resources);
  const factoryBuilt = useFactoryStore(s => s.factoryBuilt);
  const depts = useFactoryStore(s => s.depts);
  const totalWorkers = useFactoryStore(s => s.totalWorkers);
  const { buildFactory, buyDepartment, hireWorker, fireWorker, getGoldPerSecond } = useFactoryStore();

  // 中文材料名 → resources 英文 key
  const CN_TO_EN: Record<string, string> = { '木材': 'wood', '铁矿': 'iron', '皮革': 'hide', '石头': 'stone', '药草': 'herb' };

  // ── 计算总倍率 ──
  const builtDeptIds = depts.filter(d => d.built).map(d => d.id);
  let totalBonus = 1.0;
  for (const d of depts) {
    if (!d.built) continue;
    const cfg = DEPARTMENTS.find(c => c.id === d.id);
    if (cfg) totalBonus += cfg.bonusFactor;
  }
  totalBonus += totalWorkers * FACTORY_WORKER_BONUS;
  const estimatedProfit = Math.floor(FACTORY_BASE_PROFIT * totalBonus);
  const goldPerSecond = getGoldPerSecond();

  // ── 建造工厂 ──
  const handleBuildFactory = () => {
    const ok = buildFactory();
    if (!ok) alert('资源不足，无法建造工厂！');
  };

  // ── 工厂未建造时 ──
  if (!factoryBuilt) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-700 flex items-center gap-1"><FaIndustry /> 工厂</h2>
        </div>

        <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 text-center">
          <div className="text-3xl mb-2">🏗️</div>
          <div className="text-sm font-medium text-gray-700 mb-1">工厂尚未建造</div>
          <div className="text-xs text-gray-400 mb-3">建造后可开启工厂生产系统</div>

          {/* 建造费用 */}
          <div className="text-[11px] text-gray-500 mb-3 space-y-0.5">
            <div>建造费用：</div>
            <div className="flex flex-wrap gap-1 justify-center">
              {Object.entries(FACTORY_BUILD_COST).map(([res, amt]) => (
                <span key={res} className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                  res === '金币'
                    ? (hero.gold >= amt ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-600')
                    : ((resources[CN_TO_EN[res] ?? res] ?? 0) >= amt ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-600')
                }`}>
                  {res} ×{amt}
                </span>
              ))}
            </div>
          </div>

          <button
            onClick={handleBuildFactory}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs font-medium transition-colors"
          >
            建造工厂
          </button>
        </div>
      </div>
    );
  }

  // ── 工厂已建造时 ──
  return (
    <div className="space-y-3">
      {/* 标题栏 */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-gray-700 flex items-center gap-1"><FaIndustry /> 工厂</h2>
        <span className="text-xs text-yellow-600 font-medium flex items-center gap-0.5"><FaCoins /> {hero.gold}</span>
      </div>

      {/* 每秒产出 */}
      <div className="p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-center justify-between text-xs">
          <span className="text-yellow-700">每秒产出</span>
          <span className="font-bold text-yellow-600">+{goldPerSecond.toFixed(2)} G/s</span>
        </div>
        <div className="text-[9px] text-yellow-500 mt-0.5">
          倍率：{totalBonus.toFixed(1)}x（部门 +{(totalBonus - 1 - totalWorkers * FACTORY_WORKER_BONUS).toFixed(2)} + 工人 +{(totalWorkers * FACTORY_WORKER_BONUS).toFixed(2)}）
        </div>
        <div className="text-[9px] text-yellow-500">
          每轮利润：{estimatedProfit}G / {FACTORY_BASE_INTERVAL_S}s
        </div>
      </div>

      {/* 部门列表 */}
      <div className="space-y-2">
        {DEPARTMENTS.map(cfg => {
          const dept = depts.find(d => d.id === cfg.id);
          if (!dept) return null;

          const isBasic = cfg.id === 'basic';
          const isBuilt = dept.built;

          // 建造/购买条件
          const buildCostMet = hero.gold >= cfg.costGold && Object.entries(cfg.costResources).every(
            ([r, a]) => (resources[CN_TO_EN[r] ?? r] ?? 0) >= (a ?? 0)
          );

          // 雇佣条件
          const canHire = isBuilt && totalWorkers < MAX_FACTORY_WORKERS && hero.gold >= FACTORY_WORKER_COST_GOLD;

          if (!isBuilt) {
            // 未建造/购买
            return (
              <div key={cfg.id} className="p-2 border border-gray-200 rounded-lg bg-gray-50">
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <div className="text-xs font-medium text-gray-600">{cfg.name}</div>
                    <div className="text-[9px] text-gray-400">{cfg.desc}（利润+{(cfg.bonusFactor * 100).toFixed(0)}%）</div>
                  </div>
                </div>
                <button
                  onClick={() => buyDepartment(cfg.id)}
                  disabled={!buildCostMet}
                  className={`w-full py-1 rounded text-[10px] font-medium transition-colors ${
                    buildCostMet
                      ? 'bg-blue-500 hover:bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  购买（{cfg.costGold}💰 {Object.entries(cfg.costResources).map(([k, v]) => `${k}×${v}`).join(' ')})
                </button>
              </div>
            );
          }

          // 已建造部门
          return (
            <div key={cfg.id} className="p-2 border rounded-lg bg-blue-50 border-blue-200">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-medium text-gray-800">{cfg.name}</span>
                  {isBasic && <span className="text-[9px] px-1 py-0.5 bg-blue-100 text-blue-600 rounded">自带</span>}
                </div>
                <div className="text-[10px] font-medium text-green-600">+{(cfg.bonusFactor * goldPerSecond / totalBonus).toFixed(3)} G/s</div>
              </div>

              {/* 工人管理 */}
              {isBasic && (
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-gray-500">工人：{dept.workerCount} / {MAX_FACTORY_WORKERS}</span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => hireWorker(cfg.id)}
                      disabled={!canHire}
                      className={`px-1.5 py-0.5 rounded ${canHire ? 'bg-green-100 hover:bg-green-200 text-green-700' : 'bg-gray-100 text-gray-300 cursor-not-allowed'}`}>
                      +雇佣（{FACTORY_WORKER_COST_GOLD}💰）
                    </button>
                    <button
                      onClick={() => fireWorker(cfg.id)}
                      disabled={dept.workerCount <= 0}
                      className={`px-1.5 py-0.5 rounded ${dept.workerCount > 0 ? 'bg-red-100 hover:bg-red-200 text-red-600' : 'bg-gray-100 text-gray-300 cursor-not-allowed'}`}>
                      -解雇
                    </button>
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
