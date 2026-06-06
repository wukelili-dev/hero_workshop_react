import React, { useState, useEffect } from 'react';
import { FaSeedling } from 'react-icons/fa6';
import { toast } from 'sonner';
import { useGameStore } from '../../store/useGameStore';
import { PLANTS_CATALOG, PLANT_RARITY_COLORS, PLANT_RARITY_NAMES } from '../../data/plants';

export const FarmTab: React.FC = () => {
  const hero = useGameStore((s) => s.hero);
  const farmPlots = useGameStore((s) => s.farmPlots);
  const plantCrop = useGameStore((s) => s.plantCrop);
  const harvestCrop = useGameStore((s) => s.harvestCrop);
  const [showPlantModal, setShowPlantModal] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handlePlant = (plotIdx: number, plantId: string) => {
    const ok = plantCrop(plotIdx, plantId);
    if (ok) {
      toast.success('种植成功！');
      setShowPlantModal(false);
    } else {
      toast.error('金币不足或地块已被占用');
      useGameStore.getState().addGameLog(`种植失败: 地块${plotIdx + 1} 金币不足或已占用`);
    }
  };

  const handleHarvest = (plotIdx: number) => {
    const ok = harvestCrop(plotIdx);
    if (ok) {
      toast.success('收获成功！');
    } else {
      toast.error('作物尚未成熟');
    }
  };

  const getPlotStatus = (plot: { plantId: string | null; plantedAt: number | null; lastHarvest: number | null; accumulatedGold?: number }, idx: number) => {
    if (!plot.plantId) return { status: 'empty', text: '空地', pct: 0, accGold: 0 };
    const plant = PLANTS_CATALOG.find(p => p.id === plot.plantId);
    if (!plant) return { status: 'unknown', text: '未知', pct: 0, accGold: 0 };
    const growDone = (plot.plantedAt ?? 0) + plant.growTimeS * 1000;
    if (now < growDone) {
      const pct = Math.min(100, ((now - (plot.plantedAt ?? 0)) / (plant.growTimeS * 1000)) * 100);
      const remain = Math.ceil((growDone - now) / 1000);
      return { status: 'growing', text: `生长中 ${remain}s`, pct, accGold: 0 };
    }
    const accGold = plot.accumulatedGold ?? 0;
    return { status: 'ready', text: accGold > 0 ? `💰${accGold}` : '积累中...', pct: 100, accGold };
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-gray-700 flex items-center gap-1"><FaSeedling /> 农场</h2>
        <span className="text-xs text-yellow-600 font-medium">💰 {hero.gold}</span>
      </div>

      <p className="text-xs text-gray-400">种植作物，成熟后收获金币。6块地，每块独立。</p>

      {/* 地块网格 */}
      <div className="grid grid-cols-3 gap-2">
        {farmPlots.map((plot, idx) => {
          const { status, text, pct, accGold } = getPlotStatus(plot, idx);
          const plant = plot.plantId ? PLANTS_CATALOG.find(p => p.id === plot.plantId) : null;
          const rarityColor = plant ? (PLANT_RARITY_COLORS[plant.rarity] ?? '#888') : '#888';
          return (
            <div key={idx} className="border border-gray-200 rounded-lg p-2 text-center space-y-1 bg-white">
              <div className="text-lg">{plant ? plant.icon : '🟫'}</div>
              <div className="text-[10px] text-gray-400">地块 {idx + 1}</div>
              {plant && (<div className="text-[10px] font-medium truncate" style={{ color: rarityColor }}>{plant.name}</div>)}
              <div className="text-[10px] text-gray-400">{text}</div>
              {status === 'growing' && (
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div className="bg-green-400 h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
              )}
              <div className="flex gap-1 justify-center">
                {status === 'empty' && (
                  <button
                    onClick={() => setShowPlantModal(true)}
                    className="px-2 py-0.5 bg-green-100 hover:bg-green-200 rounded text-[10px] text-green-800 transition-colors"
                  >种植</button>
                )}
                {status === 'ready' && accGold > 0 && (
                  <button
                    onClick={() => handleHarvest(idx)}
                    className="px-2 py-0.5 bg-yellow-100 hover:bg-yellow-200 rounded text-[10px] text-yellow-800 transition-colors"
                  >收获 +{accGold}G</button>
                )}
                {status === 'ready' && accGold <= 0 && (
                  <span className="text-[10px] text-gray-400">⏳ 积累中</span>
                )}
                {status === 'growing' && (
                  <span className="text-[10px] text-gray-300">🕐</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 选择植物弹窗 */}
      {showPlantModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center" onClick={() => setShowPlantModal(false)}>
          <div className="bg-white w-full max-w-md rounded-t-2xl p-4 space-y-3" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-gray-700">选择作物购买并种植</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {PLANTS_CATALOG.map(plant => {
                const afford = hero.gold >= plant.seedPrice;
                const color = PLANT_RARITY_COLORS[plant.rarity] ?? '#888';
                const rName = PLANT_RARITY_NAMES[plant.rarity] ?? '普通';
                return (
                  <div key={plant.id} className="flex items-center justify-between px-2 py-1.5 border border-gray-100 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span>{plant.icon}</span>
                      <span className="text-sm font-medium" style={{ color }}>{plant.name}</span>
                      <span className="text-[10px] px-1 rounded bg-gray-100 text-gray-500">{rName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-yellow-600">💰{plant.seedPrice}</span>
                      <button
                        onClick={() => {
                          const idx = farmPlots.findIndex(p => !p.plantId);
                          if (idx === -1) { toast.error('没有空地了'); return; }
                          handlePlant(idx, plant.id);
                        }}
                        disabled={!afford}
                        className={`px-2 py-0.5 rounded text-[10px] font-medium ${afford ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                      >购买并种植</button>
                    </div>
                  </div>
                );
              })}
            </div>
            <button onClick={() => setShowPlantModal(false)} className="w-full py-1.5 text-xs text-gray-400">取消</button>
          </div>
        </div>
      )}
    </div>
  );
};
