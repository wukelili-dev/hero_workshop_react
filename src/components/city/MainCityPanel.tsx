/**
 * MainCityPanel - 主城左侧面板
 * 仙侠深蓝渐变背景 + 云雾装饰
 * 包含：资源行 + 建筑卡片列表 + 奇观卡片列表
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

  // 本地状态：建筑数量和奇观建造状态
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
    const costMap: Record<string, string> = {
      '金币': 'gold',
      '木材': 'wood',
      '铁矿': 'iron',
      '皮革': 'hide',
      '石头': 'stone',
    };

    // 检查资源是否足够
    let canBuild = true;
    for (const [mat, amount] of Object.entries(cost)) {
      const resourceKey = costMap[mat];
      if (resourceKey === 'gold') {
        if (hero.gold < amount) canBuild = false;
      } else if (resourceKey) {
        if ((resources[resourceKey as keyof typeof resources] || 0) < amount) canBuild = false;
      }
    }

    if (!canBuild) return;

    // 扣除资源
    for (const [mat, amount] of Object.entries(cost)) {
      const resourceKey = costMap[mat];
      if (resourceKey === 'gold') {
        addGold(-amount);
      } else if (resourceKey) {
        addResource(resourceKey, -amount);
      }
    }

    setBuildingCounts(prev => ({ ...prev, [name]: (prev[name] || 0) + 1 }));
  };

  const handleBuildWonder = (name: string) => {
    if (builtWonders.has(name)) return;
    const config = WONDERS[name];
    if (!config) return;

    const cost = config.buildCost;
    const costMap: Record<string, string> = {
      '金币': 'gold',
      '木材': 'wood',
      '铁矿': 'iron',
      '皮革': 'hide',
      '石头': 'stone',
    };

    // 检查资源是否足够
    let canBuild = true;
    for (const [mat, amount] of Object.entries(cost)) {
      const resourceKey = costMap[mat];
      if (resourceKey === 'gold') {
        if (hero.gold < amount) canBuild = false;
      } else if (resourceKey) {
        if ((resources[resourceKey as keyof typeof resources] || 0) < amount) canBuild = false;
      }
    }

    if (!canBuild) return;

    // 扣除资源
    for (const [mat, amount] of Object.entries(cost)) {
      const resourceKey = costMap[mat];
      if (resourceKey === 'gold') {
        addGold(-amount);
      } else if (resourceKey) {
        addResource(resourceKey, -amount);
      }
    }

    setBuiltWonders(prev => new Set([...prev, name]));
  };

  return (
    <div className="h-full w-full relative overflow-hidden">
      {/* 深蓝渐变背景 */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, #060E1C 0%, #0A1E36 50%, #112244 100%)',
        }}
      />

      {/* 云雾装饰层 */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* 底层大雾团 */}
        <div className="absolute left-[-40px] top-[400px] w-[280px] h-[100px] rounded-[50%] bg-[#1A4080]/40 blur-xl" />
        <div className="absolute right-[-20px] top-[500px] w-[200px] h-[80px] rounded-[50%] bg-[#1A4080]/30 blur-xl" />
        <div className="absolute left-[20px] top-[600px] w-[220px] h-[90px] rounded-[50%] bg-[#1A4080]/40 blur-xl" />
        
        {/* 中层雾气 */}
        <div className="absolute left-[-30px] top-[250px] w-[180px] h-[60px] rounded-[50%] bg-[#1E5090]/30 blur-lg" />
        <div className="absolute right-[10px] top-[350px] w-[150px] h-[55px] rounded-[50%] bg-[#1E5090]/30 blur-lg" />
        
        {/* 散落光点（小星星）*/}
        <div className="absolute left-[30px] top-[60px] w-[6px] h-[6px] rounded-full bg-white/60" />
        <div className="absolute left-[100px] top-[40px] w-[5px] h-[5px] rounded-full bg-white/50" />
        <div className="absolute left-[180px] top-[80px] w-[6px] h-[6px] rounded-full bg-white/60" />
        <div className="absolute left-[230px] top-[50px] w-[4px] h-[4px] rounded-full bg-white/50" />
        <div className="absolute left-[80px] top-[120px] w-[5px] h-[5px] rounded-full bg-white/50" />
      </div>

      {/* 内容层 */}
      <div className="relative z-10 h-full overflow-y-auto p-4 custom-scrollbar">
        {/* 标题 */}
        <div className="text-center mb-4">
          <h2 className="text-2xl font-bold text-[#C8A44A]" style={{ fontFamily: 'SimHei, sans-serif' }}>
            白玉京阙
          </h2>
          <p className="text-xs text-[#7AAAC8] italic mt-1">
            白玉为阶云为伴，仙友初临白玉京
          </p>
        </div>

        {/* 资源区 */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3 px-2">
            <span className="text-lg">📦</span>
            <h3 className="text-sm font-bold text-[#D8EEFF]">资源</h3>
          </div>
          <div className="bg-[#0A1E36]/80 rounded-lg border border-[#1A4080]/50 p-3">
            {MATERIALS_DATA.map((mat) => (
              <div key={mat.key} className="flex items-center justify-between py-2 border-b border-[#1A4080]/30 last:border-0">
                <div className="flex items-center gap-2">
                  <span>{mat.icon}</span>
                  <span className="text-[#D8EEFF] text-sm">{mat.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#C8A44A] font-bold min-w-[40px] text-right">
                    {formatNumber(resources[mat.key] ?? 0)}
                  </span>
                  <button
                    onClick={() => handleSellMaterial(mat.key, mat.sellPrice)}
                    className="w-6 h-6 flex items-center justify-center rounded bg-[#C06060]/40 hover:bg-[#C06060]/60 text-[#D8EEFF] transition-colors text-xs"
                    title={`卖出 (+${mat.sellPrice}G)`}
                  >
                    −
                  </button>
                  <button
                    onClick={() => handleBuyMaterial(mat.key, mat.buyPrice)}
                    className="w-6 h-6 flex items-center justify-center rounded bg-[#60A060]/40 hover:bg-[#60A060]/60 text-[#D8EEFF] transition-colors text-xs"
                    title={`购买 (-${mat.buyPrice}G)`}
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 建筑区 */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3 px-2">
            <span className="text-lg">🏗️</span>
            <h3 className="text-sm font-bold text-[#D8EEFF]">建筑</h3>
          </div>
          <div className="space-y-2">
            {getAllBuildingNames().map((name) => {
              const config = BUILDING_CONFIGS[name];
              const count = buildingCounts[name] || 0;
              return (
                <div 
                  key={name} 
                  className="bg-[#0A1E36]/80 rounded-lg border border-[#1A4080]/50 overflow-hidden"
                >
                  {/* 建筑标题 */}
                  <div className="bg-[#1A4080]/60 px-3 py-2 flex items-center justify-between">
                    <span className="text-[#D8EEFF] font-medium text-sm">{name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[#7AAAC8] text-xs">产出: {BUILDING_OUTPUTS[name]}</span>
                      <span className="text-[#C8A44A] text-xs font-bold">x{count}</span>
                    </div>
                  </div>
                  
                  {/* 建造信息 */}
                  <div className="px-3 py-2">
                    <div className="text-xs text-[#7AAAC8] mb-2">
                      需要: {Object.entries(config.buildCost).map(([m, v]) => `${m}×${v}`).join(' ')}
                    </div>
                    <button
                      onClick={() => handleBuildBuilding(name)}
                      className="w-full py-1.5 rounded bg-[#1A4080]/60 hover:bg-[#1A4080] border border-[#60A8E0]/50 text-[#60A8E0] text-xs font-medium transition-colors"
                    >
                      建造 +1
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 奇观区 */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-3 px-2">
            <span className="text-lg">✨</span>
            <h3 className="text-sm font-bold text-[#D8EEFF]">奇观</h3>
          </div>
          <div className="space-y-2">
            {getWonderNames().map((name) => {
              const config = WONDERS[name];
              const isBuilt = builtWonders.has(name);
              return (
                <div 
                  key={name} 
                  className={`bg-[#0A1E36]/80 rounded-lg border overflow-hidden ${
                    isBuilt ? 'border-[#FFA726]/50' : 'border-[#1A4080]/50'
                  }`}
                >
                  {/* 奇观标题 */}
                  <div className={`px-3 py-2 flex items-center justify-between ${
                    isBuilt ? 'bg-[#FFA726]/20' : 'bg-[#1A4080]/40'
                  }`}>
                    <span className="text-[#D8EEFF] font-medium text-sm">{name}</span>
                    <span className={`text-xs ${isBuilt ? 'text-[#FFA726]' : 'text-[#7AAAC8]'}`}>
                      {isBuilt ? '已建造' : '未建造'}
                    </span>
                  </div>
                  
                  {/* 奇观信息 */}
                  <div className="px-3 py-2">
                    <p className="text-[#7AAAC8] text-xs mb-2">{config.description}</p>
                    {!isBuilt && (
                      <>
                        <div className="text-xs text-[#7AAAC8] mb-2">
                          需要: {Object.entries(config.buildCost).map(([m, v]) => `${m}×${v}`).join(' ')}
                        </div>
                        <button
                          onClick={() => handleBuildWonder(name)}
                          className="w-full py-1.5 rounded bg-[#FFA726]/20 hover:bg-[#FFA726]/30 border border-[#FFA726]/50 text-[#FFA726] text-xs font-medium transition-colors"
                        >
                          建造奇观
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 底部提示 */}
        <div className="text-center py-2">
          <p className="text-xs text-[#7AAAC8]/60">点击建筑进入对应功能</p>
        </div>
      </div>

      {/* 自定义滚动条样式 */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(26, 64, 128, 0.2);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(200, 164, 74, 0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(200, 164, 74, 0.5);
        }
      `}</style>
    </div>
  );
};
