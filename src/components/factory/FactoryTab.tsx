import React, { useState } from 'react';
import { DEPARTMENTS, FACTORY_BUILD_COST, FACTORY_BASE_PROFIT, FACTORY_BASE_INTERVAL_S, MAX_FACTORY_WORKERS, FACTORY_WORKER_COST_GOLD, FACTORY_WORKER_BONUS, calcFactoryBonus } from '../../data/factory';
import { useGameStore } from '../../store/useGameStore';
import { formatNumber, formatTime } from '../../data/constants';

// 五大生产部门（仙侠工坊）
const PRODUCTION_DEPTS = [
  { id: 'logging', name: '伐木场', icon: '🪓', resource: '木材', baseRate: 2, desc: '伐木采集木材' },
  { id: 'mining', name: '矿坑', icon: '⛏️', resource: '铁矿', baseRate: 1, desc: '开采铁矿' },
  { id: 'hunting', name: '猎场', icon: '🏹', resource: '皮革', baseRate: 1, desc: '狩猎获取皮革' },
  { id: 'quarry', name: '采石场', icon: '🪨', resource: '石头', baseRate: 2, desc: '采石获取石材' },
  { id: 'processing', name: '加工坊', icon: '🔧', resource: '金币', baseRate: 5, desc: '加工产出金币' },
] as const;

interface DeptWorkerState {
  workerCount: number;
}

export const FactoryTab: React.FC = () => {
  const hero = useGameStore((s) => s.hero);
  const resources = useGameStore((s) => s.resources);

  // Local worker allocation state (in real app this would be in a store)
  const [deptWorkers, setDeptWorkers] = useState<Record<string, number>>(
    Object.fromEntries(PRODUCTION_DEPTS.map(d => [d.id, 0]))
  );
  const [factoryBuilt, setFactoryBuilt] = useState(false);
  const [totalMaxWorkers, setTotalMaxWorkers] = useState(MAX_FACTORY_WORKERS);

  const buildCostStr = Object.entries(FACTORY_BUILD_COST).map(([k, v]) => `${k}×${v}`).join(' ');
  const totalWorkers = Object.values(deptWorkers).reduce((a, b) => a + b, 0);
  const idleWorkers = totalMaxWorkers - totalWorkers;

  const assignWorker = (deptId: string, delta: number) => {
    setDeptWorkers(prev => {
      const current = prev[deptId] ?? 0;
      const next = Math.max(0, Math.min(current + delta, totalMaxWorkers));
      // Check total workers constraint
      const newTotal = totalWorkers - current + next;
      if (newTotal > totalMaxWorkers) return prev;
      return { ...prev, [deptId]: next };
    });
  };

  const buildFactory = () => {
    // Simple build logic - in real app this would check resources and deduct
    setFactoryBuilt(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-amber-300 font-bold text-lg">🏭 工厂</h2>
        <span className="text-yellow-400 text-sm">💰 {formatNumber(hero.gold)}</span>
      </div>

      {!factoryBuilt ? (
        <div className="border border-amber-900/30 rounded-lg p-6 bg-slate-900/60 text-center">
          <div className="text-3xl mb-3">🏭</div>
          <div className="text-amber-200 font-bold mb-2">建造工厂</div>
          <div className="text-sm text-amber-200/50 mb-4">
            建造费用: {buildCostStr}
          </div>
          <div className="text-xs text-amber-200/40 mb-4">
            每{formatTime(FACTORY_BASE_INTERVAL_S)}产出 {FACTORY_BASE_PROFIT}G
          </div>
          <button
            onClick={buildFactory}
            className="px-6 py-2 rounded bg-amber-700 hover:bg-amber-600 text-amber-100 font-bold"
          >
            建造工厂
          </button>
        </div>
      ) : (
        <>
          {/* Worker overview */}
          <div className="border border-amber-900/30 rounded-lg p-4 bg-slate-900/60">
            <div className="flex items-center justify-between mb-2">
              <span className="text-amber-200 font-bold">劳工总览</span>
              <span className="text-amber-300 text-sm">
                👷 {totalWorkers}/{totalMaxWorkers}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-green-400/80">空闲劳工: {idleWorkers}</span>
              <span className="text-amber-200/40">
                雇工费: {FACTORY_WORKER_COST_GOLD}G/人
              </span>
            </div>
            {/* Worker bar */}
            <div className="mt-2 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-600 rounded-full transition-all"
                style={{ width: `${(totalWorkers / totalMaxWorkers) * 100}%` }}
              />
            </div>
          </div>

          {/* Production departments */}
          <div>
            <h3 className="text-amber-400/80 font-bold text-sm mb-2 border-b border-amber-900/30 pb-1">
              🏗 生产部门
            </h3>
            <div className="space-y-2">
              {PRODUCTION_DEPTS.map((dept) => {
                const workers = deptWorkers[dept.id];
                const outputRate = dept.baseRate * (1 + workers * FACTORY_WORKER_BONUS);

                return (
                  <div
                    key={dept.id}
                    className="border border-amber-900/30 rounded-lg p-3 bg-slate-900/60"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{dept.icon}</span>
                        <span className="font-bold text-sm text-amber-200">{dept.name}</span>
                      </div>
                      <span className="text-amber-200/40 text-xs">{dept.desc}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      {/* Worker count & controls */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => assignWorker(dept.id, -1)}
                          disabled={workers <= 0}
                          className={`w-7 h-7 rounded text-sm font-bold ${
                            workers > 0
                              ? 'bg-red-900/60 text-red-300 hover:bg-red-800/60'
                              : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                          }`}
                        >
                          −
                        </button>
                        <span className="text-amber-200 font-bold text-sm w-12 text-center">
                          👷 {workers}/{totalMaxWorkers}
                        </span>
                        <button
                          onClick={() => assignWorker(dept.id, 1)}
                          disabled={idleWorkers <= 0}
                          className={`w-7 h-7 rounded text-sm font-bold ${
                            idleWorkers > 0
                              ? 'bg-blue-900/60 text-blue-300 hover:bg-blue-800/60'
                              : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                          }`}
                        >
                          +
                        </button>
                      </div>

                      {/* Output rate */}
                      <div className="text-right">
                        <div className="text-xs text-amber-200/40">产出速率</div>
                        <div className="text-sm text-green-400/80 font-bold">
                          {dept.resource} +{outputRate.toFixed(1)}/周期
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Upgrade departments (from factory.ts DEPARTMENTS) */}
          <div>
            <h3 className="text-amber-400/80 font-bold text-sm mb-2 border-b border-amber-900/30 pb-1">
              📈 部门升级
            </h3>
            <div className="space-y-2">
              {DEPARTMENTS.map((dept) => (
                <div
                  key={dept.id}
                  className={`border rounded-lg p-3 ${
                    dept.built
                      ? 'border-green-700/40 bg-green-950/10'
                      : 'border-amber-900/30 bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm text-amber-200">{dept.name}</span>
                    {dept.built ? (
                      <span className="text-green-400 text-xs">已建造</span>
                    ) : (
                      <span className="text-amber-200/40 text-xs">未建造</span>
                    )}
                  </div>
                  <div className="text-xs text-amber-200/50">{dept.desc}</div>
                  {!dept.built && (
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs text-amber-200/40">
                        费用: {dept.costGold}G{' '}
                        {Object.entries(dept.costResources).map(([k, v]) => `${k}×${v}`).join(' ')}
                      </span>
                      <button className="px-3 py-1 rounded text-xs bg-amber-700 hover:bg-amber-600 text-amber-100 font-bold">
                        建造
                      </button>
                    </div>
                  )}
                  {dept.built && (
                    <div className="mt-1 text-xs text-green-300/60">利润 +{dept.bonusFactor * 100}%</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
