/**
 * MainCityPanel - 左侧面板：资源 + 建筑
 * 对照原版界面设计
 */

import React, { useState } from 'react';
import { motion, type Variants } from 'framer-motion';
import { AnimatedNumber } from '../../hooks/useCountUp';
import { useGameStore } from '../../store/useGameStore';
import { BUILDING_CONFIGS, WONDERS, getAllBuildingNames, getWonderNames } from '../../data/buildings';

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

// ── framer-motion 动画变体 ──
const cardVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.35, ease: 'easeOut' },
  }),
};

const resourceVariants: Variants = {
  hidden: { opacity: 0, x: -10 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.05, duration: 0.3, ease: 'easeOut' },
  }),
};

export const MainCityPanel: React.FC = () => {
  const hero = useGameStore((s) => s.hero);
  const resources = useGameStore((s) => s.resources);
  const addGold = useGameStore((s) => s.addGold);
  const addResource = useGameStore((s) => s.addResource);
  const addGameLog = useGameStore((s) => s.addGameLog);

  const addBuilding = useGameStore((s) => s.addBuilding);
  const buildings = useGameStore((s) => s.buildings);
  const [builtWonders, setBuiltWonders] = useState<Set<string>>(new Set());

  const MATERIALS_DATA = [
    { name: '木材', icon: <FaTree className="text-amber-600" />, key: 'wood' as const, sellPrice: 8, buyPrice: 10 },
    { name: '铁矿', icon: <FaMagnet className="text-gray-500" />, key: 'iron' as const, sellPrice: 12, buyPrice: 15 },
    { name: '皮革', icon: <FaPaw className="text-orange-700" />, key: 'hide' as const, sellPrice: 10, buyPrice: 12 },
    { name: '石头', icon: <FaMountain className="text-stone-400" />, key: 'stone' as const, sellPrice: 15, buyPrice: 20 },
  ];
  const [batchMode, setBatchMode] = useState<'1' | '10' | '100' | 'max'>('1');

  const getBatchAmount = (mode: 'buy' | 'sell', key: string, price: number): number => {
    if (batchMode === 'max') {
      if (mode === 'buy') {
        return Math.floor(hero.gold / price);
      } else {
        return resources[key] ?? 0;
      }
    }
    const n = batchMode === '1' ? 1 : batchMode === '10' ? 10 : 100;
    if (mode === 'buy') {
      return Math.min(n, Math.floor(hero.gold / price));
    } else {
      return Math.min(n, resources[key] ?? 0);
    }
  };

  const handleBuyMaterial = (key: string, price: number) => {
    const qty = getBatchAmount('buy', key, price);
    if (qty <= 0) return;
    if (hero.gold >= price * qty) {
      addGold(-price * qty);
      addResource(key, qty);
      const name = MATERIALS_DATA.find(m => m.key === key)?.name ?? key;
      addGameLog(`购买 ${name} ×${qty}，花费 ${price * qty} 金币`);
    }
  };

  const handleSellMaterial = (key: string, price: number) => {
    const qty = getBatchAmount('sell', key, price);
    if (qty <= 0) return;
    if ((resources[key] || 0) >= qty) {
      addResource(key, -qty);
      addGold(price * qty);
      const name = MATERIALS_DATA.find(m => m.key === key)?.name ?? key;
      addGameLog(`出售 ${name} ×${qty}，获得 ${price * qty} 金币`);
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
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-gray-700 flex items-center gap-1.5"><FaBoxOpen className="text-amber-600" /> 资源</h3>
          <div className="flex items-center gap-1 text-xs">
            <span className="text-gray-400">批量:</span>
            {(['1', '10', '100', 'max'] as const).map(m => (
              <button
                key={m}
                onClick={() => setBatchMode(m)}
                className={`px-1.5 py-0.5 rounded text-xs font-bold transition-colors ${
                  batchMode === m
                    ? 'bg-amber-500 text-white'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {m === 'max' ? 'MAX' : m}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-1">
          {MATERIALS_DATA.map((mat, i) => (
            <motion.div
              key={mat.key}
              custom={i}
              variants={resourceVariants}
              initial="hidden"
              animate="visible"
              className="flex items-center gap-2 py-1"
            >
              <span>{mat.icon}</span>
              <span className="text-sm text-gray-700 w-8">{mat.name}:</span>
              <span className="font-bold text-sm w-10 text-right">
                <AnimatedNumber value={resources[mat.key] ?? 0} />
              </span>
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={() => handleSellMaterial(mat.key, mat.sellPrice)}
                className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 hover:bg-red-100 text-gray-500 hover:text-red-500 transition-colors text-xs font-bold"
                title={`卖出${batchMode === 'max' ? '全部' : ` ×${batchMode}`} (+${mat.sellPrice * (batchMode === 'max' ? (resources[mat.key] ?? 0) : batchMode === '1' ? 1 : batchMode === '10' ? 10 : 100)}G)`}
              >−</motion.button>
              <span className="text-xs text-gray-400 w-6 text-center">
                {batchMode === 'max' ? 'MAX' : batchMode}
              </span>
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={() => handleBuyMaterial(mat.key, mat.buyPrice)}
                className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 hover:bg-green-100 text-gray-500 hover:text-green-500 transition-colors text-xs font-bold"
                title={`购买${batchMode === 'max' ? '满' : ` ×${batchMode}`} (-${mat.buyPrice * (batchMode === 'max' ? Math.floor(hero.gold / mat.buyPrice) : batchMode === '1' ? 1 : batchMode === '10' ? 10 : 100)}G)`}
              >+</motion.button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* 建筑区 */}
      <div>
        <h3 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-1.5"><FaBuilding className="text-blue-600" /> 建筑</h3>
        <div className="space-y-2">
          {getAllBuildingNames().map((name, i) => {
            const config = BUILDING_CONFIGS[name];
            const count = buildings[name] || 0;
            return (
              <motion.div
                key={name}
                custom={i}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                whileHover={{ scale: 1.015, boxShadow: '0 4px 20px rgba(59,130,246,0.12)' }}
                className="bg-white rounded-xl border border-gray-200/80 p-2.5 cursor-default shadow-sm hover:border-blue-200/80 transition-colors duration-200"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-800">{name}</span>
                  <span className="text-xs text-gray-500">x{count}</span>
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-xs text-gray-400">
                    {formatCost(config.buildCost)}
                  </span>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleBuildBuilding(name)}
                    className="px-2.5 py-0.5 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 border border-blue-200 rounded-full text-xs text-blue-700 transition-all duration-150 shadow-sm hover:shadow"
                  >建造 +1</motion.button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* 奇观区 */}
      <div>
        <h3 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-1.5"><FaStar className="text-yellow-500" /> 奇观</h3>
        <div className="space-y-2">
          {getWonderNames().map((name, i) => {
            const config = WONDERS[name];
            const isBuilt = builtWonders.has(name);
            return (
              <motion.div
                key={name}
                custom={i}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                whileHover={isBuilt ? {} : { scale: 1.015, boxShadow: '0 4px 20px rgba(251,146,60,0.15)' }}
                className={`rounded-xl border p-2.5 shadow-sm transition-colors duration-200 ${
                  isBuilt
                    ? 'border-green-300 bg-gradient-to-r from-green-50/60 to-emerald-50/40 shadow-green-100/50'
                    : 'border-orange-200/80 bg-white hover:border-orange-300/80'
                }`}
              >
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
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleBuildWonder(name)}
                      className="px-2.5 py-0.5 bg-orange-50 hover:bg-orange-100 active:bg-orange-200 border border-orange-200 rounded-full text-xs text-orange-700 transition-all duration-150 shadow-sm hover:shadow"
                    >建造</motion.button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
