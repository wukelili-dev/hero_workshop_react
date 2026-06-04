import React from 'react';
import { PLANTS_CATALOG, type PlantData } from '../../data/plants';
import { useFarmStore } from '../../store/useFarmStore';
import { useGameStore } from '../../store/useGameStore';
import { RarityBadge } from '../shared/RarityBadge';
import { ProgressBar } from '../shared/ProgressBar';
import { RARITY_COLORS, formatTime } from '../../data/constants';

export const FarmTab: React.FC = () => {
  const plots = useFarmStore((s) => s.plots);
  const currentSeason = useFarmStore((s) => s.currentSeason);
  const plant = useFarmStore((s) => s.plant);
  const harvest = useFarmStore((s) => s.harvest);
  const fertilize = useFarmStore((s) => s.fertilize);
  const hero = useGameStore((s) => s.hero);

  const SEASON_ICONS: Record<string, string> = { spring: '🌸', summer: '☀', autumn: '🍂', winter: '❄' };
  const SEASON_NAMES: Record<string, string> = { spring: '春', summer: '夏', autumn: '秋', winter: '冬' };

  const getPlantData = (id: string): PlantData | undefined =>
    PLANTS_CATALOG.find((p) => p.id === id);

  const getGrowthPct = (plantedAt: number | null, growTimeS: number): number => {
    if (!plantedAt) return 0;
    const elapsed = (Date.now() - plantedAt) / 1000;
    return Math.min(1, elapsed / growTimeS);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-amber-300 font-bold text-lg">🌱 农场</h2>
        <div className="flex items-center gap-1 text-sm">
          <span>{SEASON_ICONS[currentSeason]}</span>
          <span className="text-amber-200/60">{SEASON_NAMES[currentSeason]}</span>
        </div>
      </div>

      {/* Plots grid */}
      <div className="grid grid-cols-4 gap-2">
        {plots.map((plot, idx) => {
          const plantData = plot.plantId ? getPlantData(plot.plantId) : null;
          const growthPct = plantData ? getGrowthPct(plot.plantedAt, plantData.growTimeS) : 0;
          const isMature = growthPct >= 1;

          return (
            <div
              key={idx}
              className={`border rounded-lg p-2 text-center transition-colors ${
                plantData
                  ? isMature
                    ? 'border-green-600/50 bg-green-950/20'
                    : 'border-amber-900/30 bg-slate-900/60'
                  : 'border-amber-900/20 bg-slate-900/30 border-dashed'
              }`}
            >
              {plantData ? (
                <>
                  <div className="text-2xl mb-1">{plantData.icon}</div>
                  <div className="text-xs font-bold text-amber-200 mb-1">{plantData.name}</div>
                  {!isMature ? (
                    <>
                      <ProgressBar
                        current={Math.floor(growthPct * 100)}
                        max={100}
                        color="bg-green-500"
                        height="h-1.5"
                        showText={false}
                      />
                      <div className="text-xs text-amber-200/40 mt-0.5">
                        {formatTime(Math.max(0, plantData.growTimeS - (Date.now() - (plot.plantedAt ?? 0)) / 1000))}
                      </div>
                      <button
                        onClick={() => fertilize(idx)}
                        className="mt-1 px-1.5 py-0.5 rounded text-xs bg-amber-900/40 text-amber-200/60 hover:bg-amber-800/40"
                      >
                        施肥({plot.fertilizerCount})
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => harvest(idx)}
                      className="mt-1 px-3 py-1 rounded text-xs font-bold bg-green-700 hover:bg-green-600 text-green-100"
                    >
                      🌾 收获
                    </button>
                  )}
                </>
              ) : (
                <div className="text-amber-200/20 text-xs py-4">
                  空地 #{idx + 1}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Seed shop */}
      <div>
        <h3 className="text-amber-400/80 font-bold text-sm mb-2 border-b border-amber-900/30 pb-1">
          🌿 种子商店
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {PLANTS_CATALOG.map((p) => (
            <div
              key={p.id}
              className="border border-amber-900/30 rounded-lg p-3 bg-slate-900/60"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{p.icon}</span>
                <span className="font-bold text-sm" style={{ color: RARITY_COLORS[p.rarity] }}>
                  {p.name}
                </span>
                <RarityBadge rarity={p.rarity} />
              </div>
              <div className="text-xs text-amber-200/50 mb-1">{p.desc}</div>
              <div className="text-xs text-amber-200/40">
                生长: {formatTime(p.growTimeS)} | 收益: {p.harvestGold}G
                {p.season ? ` | ${p.season}季` : ''}
              </div>
              <button
                onClick={() => {
                  const emptyIdx = plots.findIndex((pl) => !pl.plantId);
                  if (emptyIdx >= 0) plant(emptyIdx, p.id);
                }}
                disabled={hero.gold < p.seedPrice || !plots.some((pl) => !pl.plantId)}
                className={`mt-2 w-full py-1 rounded text-xs font-bold ${
                  hero.gold >= p.seedPrice && plots.some((pl) => !pl.plantId)
                    ? 'bg-amber-700 hover:bg-amber-600 text-amber-100'
                    : 'bg-slate-800 text-amber-200/30 cursor-not-allowed'
                }`}
              >
                种植 ({p.seedPrice}G)
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
