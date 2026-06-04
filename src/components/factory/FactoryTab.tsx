import React from 'react';
import { DEPARTMENTS, FACTORY_BUILD_COST, FACTORY_BASE_PROFIT, FACTORY_BASE_INTERVAL_S } from '../../data/factory';
import { useGameStore } from '../../store/useGameStore';
import { useInventoryStore } from '../../store/useInventoryStore';
import { formatNumber, formatTime } from '../../data/constants';

export const FactoryTab: React.FC = () => {
  const hero = useGameStore((s) => s.hero);
  const resources = useGameStore((s) => s.resources);
  const materials = useInventoryStore((s) => s.materials);

  const factoryBuilt = false; // TODO: connect to real state
  const buildCostStr = Object.entries(FACTORY_BUILD_COST).map(([k, v]) => `${k}×${v}`).join(' ');
  const baseProfitStr = `每${formatTime(FACTORY_BASE_INTERVAL_S)}产出 ${FACTORY_BASE_PROFIT}G`;

  return (
    <div className="space-y-6">
      <h2 className="text-amber-300 font-bold text-lg">🏭 工厂</h2>

      {!factoryBuilt ? (
        <div className="border border-amber-900/30 rounded-lg p-6 bg-slate-900/60 text-center">
          <div className="text-3xl mb-3">🏭</div>
          <div className="text-amber-200 font-bold mb-2">建造工厂</div>
          <div className="text-sm text-amber-200/50 mb-4">
            建造费用: {buildCostStr}
          </div>
          <div className="text-xs text-amber-200/40 mb-4">{baseProfitStr}</div>
          <button className="px-6 py-2 rounded bg-amber-700 hover:bg-amber-600 text-amber-100 font-bold">
            建造工厂
          </button>
        </div>
      ) : (
        <>
          {/* Factory overview */}
          <div className="border border-amber-900/30 rounded-lg p-4 bg-slate-900/60">
            <div className="flex items-center justify-between mb-2">
              <span className="text-amber-200 font-bold">工厂总览</span>
              <span className="text-yellow-400 text-sm">💰 {formatNumber(hero.gold)}</span>
            </div>
            <div className="text-xs text-amber-200/50">{baseProfitStr}</div>
          </div>

          {/* Departments */}
          <div>
            <h3 className="text-amber-400/80 font-bold text-sm mb-2 border-b border-amber-900/30 pb-1">
              🏗 部门
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
                        费用: {dept.costGold}G {Object.entries(dept.costResources).map(([k, v]) => `${k}×${v}`).join(' ')}
                      </span>
                      <button className="px-3 py-1 rounded text-xs bg-amber-700 hover:bg-amber-600 text-amber-100 font-bold">
                        建造
                      </button>
                    </div>
                  )}
                  {dept.built && (
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs text-green-300/60">利润 +{dept.bonusFactor * 100}%</span>
                      <div className="flex gap-1">
                        <button className="px-2 py-0.5 rounded text-xs bg-blue-900/60 text-amber-200/60 hover:bg-blue-800/60">
                          雇工
                        </button>
                        <button className="px-2 py-0.5 rounded text-xs bg-red-900/40 text-amber-200/50 hover:bg-red-800/40">
                          解雇
                        </button>
                      </div>
                    </div>
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
