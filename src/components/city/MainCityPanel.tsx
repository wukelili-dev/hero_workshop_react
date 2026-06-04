/**
 * MainCityPanel - 左侧面板：资源 + 建筑 + 奇观
 */

import React, { useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { BUILDING_CONFIGS, WONDERS, BUILDING_OUTPUTS, getAllBuildingNames, getWonderNames } from '../../data/buildings';
import { formatNumber } from '../../data/constants';

export const MainCityPanel: React.FC = () => {
  const hero = useGameStore((s) => s.hero);
  const resources = useGameStore((s) => s.resources);
  const addGold = useGameStore((s) => s.addGold);
  const addResource = useGameStore((s) => s.addResource);

  const [buildingCounts, setBuildingCounts] = useState<Record<string, number>>({});
  const [builtWonders, setBuiltWonders] = useState<Set<string>>(new Set());

  const MATERIALS_DATA = [
    { name: '木材', icon: '🪵', key: 'wood' as const, sellPrice: 8, buyPrice: 10 },
    { name: '铁矿', icon: '⛏', key: 'iron' as const, sellPrice: 12, buyPrice: 15 },
    { name: '皮革', icon: '🧤', key: 'hide' as const, sellPrice: 10, buyPrice: 12 },
    { name: '石头', icon: '⛰', key: 'stone' as const, sellPrice: 15, buyPrice: 20 },
  ];

  const handleBuyMaterial = (key: string, price: number) => {
    if (hero.gold >= price) {
      addGold(-price);
      addResource(key, 1);
    }
  };

  const handleSellMaterial = (key: string, price: number) => {
    if ((resources[key] || 0) > 0) {
      addResource(key, -1);
      addGold(price);
    }
  };

  const handleBuildBuilding = (name: string) => {
    const config = BUILDING_CONFIGS[name];
    if (!config) return;
    const cost = config.buildCost;
    const costMap: Record<string, string> = { '金币': 'gold', '木材': 'wood', '铁矿': 'iron', '皮革': 'hide', '石头': 'stone' };
    let canBuild = true;
    for (const [mat, amount] of Object.entries(cost)) {
      const resourceKey = costMap[mat];
      if (resourceKey === 'gold') { if (hero.gold < amount) canBuild = false; }
      else if (resourceKey) { if ((resources[resourceKey as keyof typeof resources] || 0) < amount) canBuild = false; }
    }
    if (!canBuild) return;
    for (const [mat, amount] of Object.entries(cost)) {
      const resourceKey = costMap[mat];
      if (resourceKey === 'gold') addGold(-amount);
      else if (resourceKey) addResource(resourceKey, -amount);
    }
    setBuildingCounts(prev => ({ ...prev, [name]: (prev[name] || 0) + 1 }));
  };

  const handleBuildWonder = (name: string) => {
    if (builtWonders.has(name)) return;
    const config = WONDERS[name];
    if (!config) return;
    const cost = config.buildCost;
    const costMap: Record<string, string> = { '金币': 'gold', '木材': 'wood', '铁矿': 'iron', '皮革': 'hide', '石头': 'stone' };
    let canBuild = true;
    for (const [mat, amount] of Object.entries(cost)) {
      const resourceKey = costMap[mat];
      if (resourceKey === 'gold') { if (hero.gold < amount) canBuild = false; }
      else if (resourceKey) { if ((resources[resourceKey as keyof typeof resources] || 0) < amount) canBuild = false; }
    }
    if (!canBuild) return;
    for (const [mat, amount] of Object.entries(cost)) {
      const resourceKey = costMap[mat];
      if (resourceKey === 'gold') addGold(-amount);
      else if (resourceKey) addResource(resourceKey, -amount);
    }
    setBuiltWonders(prev => new Set([...prev, name]));
  };

  return (
    <div className="h-full overflow-y-auto p-3 space-y-4">
      {/* 资源区 */}
      <div>
        <h3 className="text-sm font-bold text-gray-700 mb-2">📦 资源</h3>
        <div className="bg-white rounded-lg border border-gray-200 p-2">
          {MATERIALS_DATA.map((mat) => (
            <div key={mat.key} className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
              <div className="flex items-center gap-1.5">
                <span>{mat.icon}</span>
                <span className="text-gray-700 text-sm">{mat.name}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-gray-900 font-bold min-w-[36px] text-right text-sm">
                  {formatNumber(resources[mat.key] ?? 0)}
                </span>
                <button
                  onClick={() => handleSellMaterial(mat.key, mat.sellPrice)}
                  className="w-5 h-5 flex items-center justify-center rounded bg-red-50 hover:bg-red-100 text-red-500 transition-colors text-xs"
                  title={`卖出 (+${mat.sellPrice}G)`}
                >−</button>
                <button
                  onClick={() => handleBuyMaterial(mat.key, mat.buyPrice)}
                  className="w-5 h-5 flex items-center justify-center rounded bg-green-50 hover:bg-green-100 text-green-600 transition-colors text-xs"
                  title={`购买 (-${mat.buyPrice}G)`}
                >+</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 建筑区 */}
      <div>
        <h3 className="text-sm font-bold text-gray-700 mb-2">🏗️ 建筑</h3>
        <div className="space-y-2">
          {getAllBuildingNames().map((name) => {
            const config = BUILDING_CONFIGS[name];
            const count = buildingCounts[name] || 0;
            return (
              <div key={name} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-3 py-1.5 flex items-center justify-between">
                  <span className="text-gray-700 font-medium text-sm">{name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-xs">产出: {BUILDING_OUTPUTS[name]}</span>
                    <span className="text-gray-600 text-xs font-bold">x{count}</span>
                  </div>
                </div>
                <div className="px-3 py-2">
                  <div className="text-xs text-gray-400 mb-1.5">
                    需要: {Object.entries(config.buildCost).map(([m, v]) => `${m}×${v}`).join(' ')}
                  </div>
                  <button
                    onClick={() => handleBuildBuilding(name)}
                    className="w-full py-1 rounded bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 text-xs font-medium transition-colors"
                  >建造 +1</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 奇观区 */}
      <div>
        <h3 className="text-sm font-bold text-gray-700 mb-2">✨ 奇观</h3>
        <div className="space-y-2">
          {getWonderNames().map((name) => {
            const config = WONDERS[name];
            const isBuilt = builtWonders.has(name);
            return (
              <div
                key={name}
                className={`bg-white rounded-lg border overflow-hidden ${
                  isBuilt ? 'border-amber-300' : 'border-gray-200'
                }`}
              >
                <div className={`px-3 py-1.5 flex items-center justify-between ${
                  isBuilt ? 'bg-amber-50' : 'bg-gray-50'
                }`}>
                  <span className="text-gray-700 font-medium text-sm">{name}</span>
                  <span className={`text-xs ${isBuilt ? 'text-amber-600' : 'text-gray-400'}`}>
                    {isBuilt ? '已建造' : '未建造'}
                  </span>
                </div>
                <div className="px-3 py-2">
                  <p className="text-gray-500 text-xs mb-1.5">{config.description}</p>
                  {!isBuilt && (
                    <>
                      <div className="text-xs text-gray-400 mb-1.5">
                        需要: {Object.entries(config.buildCost).map(([m, v]) => `${m}×${v}`).join(' ')}
                      </div>
                      <button
                        onClick={() => handleBuildWonder(name)}
                        className="w-full py-1 rounded bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-600 text-xs font-medium transition-colors"
                      >建造奇观</button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
