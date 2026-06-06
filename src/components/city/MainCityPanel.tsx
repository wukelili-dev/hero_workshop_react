/**
 * MainCityPanel - 左侧面板：资源 + 建筑
 * 对照原版界面设计
 */

import React, { useState } from 'react';
import { AnimatedNumber } from '../../hooks/useCountUp';
import { useGameStore } from '../../store/useGameStore';
import { BUILDING_CONFIGS, WONDERS, getAllBuildingNames, getWonderNames } from '../../data/buildings';
import { formatNumber } from '../../data/constants';
import { FaTree, FaMagnet, FaPaw, FaMountain, FaBoxOpen, FaBuilding, FaStar, FaCoins } from 'react-icons/fa6';

// 造价显示：图标+简短数字（如 💰10K 🪵5K）
const COST_ICON_MAP: Record<string, React.ReactNode> = {
  '金币': <FaCoins className="text-yellow-500" />,
  '木材': <FaTree className="text-amber-600" />,
  '铁矿': <FaMagnet className="text-gray-500" />,
  '皮革': <FaPaw className="text-orange-700" />,
  '石头': <FaMountain className="text-stone-400" />,
};

function formatCost(cost: Record<string, number>): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let first = true;
  for (const [mat, v] of Object.entries(cost)) {
    if (!first) nodes.push(<span key={`s_${mat}`} className="mx-0.5" />);
    first = false;
    const label = v >= 1000 ? `${Math.round(v / 1000)}K` : `${v}`;
    nodes.push(
      <span key={mat} className="inline-flex items-center gap-0.5 text-xs text-gray-400">
        {COST_ICON_MAP[mat] ?? mat}
        {label}
      </span>
    );
  }
  return nodes;
}

export const MainCityPanel: React.FC = () => {
  const hero = useGameStore((s) => s.hero);
  const resources = useGameStore((s) => s.resources);
  const addGold = useGameStore((s) => s.addGold);
  const addResource = useGameStore((s) => s.addResource);

  const addBuilding = useGameStore((s) => s.addBuilding);
  const buildings = useGameStore((s) => s.buildings);
  const [builtWonders, setBuiltWonders] = useState<Set<string>>(new Set());

  const MATERIALS_DATA = [
    { name: '木材', icon: <FaTree className="text-amber-600" />, key: 'wood' as const, sellPrice: 8, buyPrice: 10 },
    { name: '铁矿', icon: <FaMagnet className="text-gray-500" />, key: 'iron' as const, sellPrice: 12, buyPrice: 15 },
    { name: '皮革', icon: <FaPaw className="text-orange-700" />, key: 'hide' as const, sellPrice: 10, buyPrice: 12 },
    { name: '石头', icon: <FaMountain className="text-stone-400" />, key: 'stone' as const, sellPrice: 15, buyPrice: 20 },
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
    addBuilding(name);
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
        <h3 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-1.5"><FaBoxOpen className="text-amber-600" /> 资源</h3>
        <div className="space-y-1">
          {MATERIALS_DATA.map((mat) => (
            <div key={mat.key} className="flex items-center gap-2 py-1">
              <span>{mat.icon}</span>
              <span className="text-sm text-gray-700 w-8">{mat.name}:</span>
              <span className="font-bold text-sm w-10 text-right">
                <AnimatedNumber value={resources[mat.key] ?? 0} />
              </span>
              <button
                onClick={() => handleSellMaterial(mat.key, mat.sellPrice)}
                className="w-6 h-6 flex items-center justify-center rounded bg-gray-200 hover:bg-gray-300 text-gray-600 transition-colors text-xs font-bold"
                title={`卖出 (+${mat.sellPrice}G)`}
              >−</button>
              <button
                onClick={() => handleBuyMaterial(mat.key, mat.buyPrice)}
                className="w-6 h-6 flex items-center justify-center rounded bg-gray-200 hover:bg-gray-300 text-gray-600 transition-colors text-xs font-bold"
                title={`购买 (-${mat.buyPrice}G)`}
              >+</button>
            </div>
          ))}
        </div>
      </div>

      {/* 建筑区 */}
      <div>
        <h3 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-1.5"><FaBuilding className="text-blue-600" /> 建筑</h3>
        <div className="space-y-2">
          {getAllBuildingNames().map((name) => {
            const config = BUILDING_CONFIGS[name];
            const count = buildings[name] || 0;
            return (
              <div key={name} className="bg-white rounded-lg border border-gray-200 p-2.5 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-800">{name}</span>
                  <span className="text-xs text-gray-500">x{count}</span>
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-xs text-gray-400">
                    {formatCost(config.buildCost)}
                  </span>
                  <button
                    onClick={() => handleBuildBuilding(name)}
                    className="px-2 py-0.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded text-xs text-blue-700 transition-colors"
                  >建造 +1</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 奇观区 */}
      <div>
        <h3 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-1.5"><FaStar className="text-yellow-500" /> 奇观</h3>
        <div className="space-y-2">
          {getWonderNames().map((name) => {
            const config = WONDERS[name];
            const isBuilt = builtWonders.has(name);
            return (
              <div key={name} className={`bg-white rounded-lg border p-2.5 hover:shadow-md transition-shadow ${isBuilt ? 'border-green-200 bg-green-50/30' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-800">{name}</span>
                  <span className={`text-xs ${isBuilt ? 'text-green-600 font-medium' : 'text-gray-500'}`}>
                    x{isBuilt ? 1 : 0}
                  </span>
                </div>
                {!isBuilt && (
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-xs text-gray-400">
                      {formatCost(config.buildCost)}
                    </span>
                    <button
                      onClick={() => handleBuildWonder(name)}
                      className="px-2 py-0.5 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded text-xs text-orange-700 transition-colors"
                    >建造</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
