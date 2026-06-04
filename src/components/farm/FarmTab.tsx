import React, { useState, useEffect, useMemo } from 'react';
import { PLANTS_CATALOG, SEASON_DURATION_S, SEASONS, type PlantData } from '../../data/plants';
import { useFarmStore } from '../../store/useFarmStore';
import { useGameStore } from '../../store/useGameStore';
import { RarityBadge } from '../shared/RarityBadge';
import { ProgressBar } from '../shared/ProgressBar';
import { RARITY_COLORS, formatTime } from '../../data/constants';

const SEASON_ICONS: Record<string, string> = {
  spring: '🌸',
  summer: '☀️',
  autumn: '🍂',
  winter: '❄️',
};
const SEASON_NAMES: Record<string, string> = {
  spring: '春',
  summer: '夏',
  autumn: '秋',
  winter: '冬',
};
const SEASONS_LIST = ['spring', 'summer', 'autumn', 'winter'] as const;

function getPlantData(id: string): PlantData | undefined {
  return PLANTS_CATALOG.find((p) => p.id === id);
}

function formatSeasonTime(remainingS: number): string {
  if (remainingS <= 0) return '即将换季';
  const h = Math.floor(remainingS / 3600);
  const m = Math.floor((remainingS % 3600) / 60);
  if (h > 0) return `${h}时${m}分`;
  return `${m}分`;
}

export const FarmTab: React.FC = () => {
  const plots = useFarmStore((s) => s.plots);
  const currentSeason = useFarmStore((s) => s.currentSeason);
  const seasonStartTime = useFarmStore((s) => s.seasonStartTime);
  const plant = useFarmStore((s) => s.plant);
  const harvest = useFarmStore((s) => s.harvest);
  const fertilize = useFarmStore((s) => s.fertilize);
  const hero = useGameStore((s) => s.hero);

  const [selectingSlot, setSelectingSlot] = useState<number | null>(null);
  const [seasonFilter, setSeasonFilter] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  // Tick every second for live progress
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Season countdown
  const seasonElapsed = (now - seasonStartTime) / 1000;
  const seasonRemaining = Math.max(0, SEASON_DURATION_S - seasonElapsed);
  const currentSeasonIdx = SEASONS_LIST.indexOf(currentSeason as (typeof SEASONS_LIST)[number]);
  const nextSeason = SEASONS_LIST[(currentSeasonIdx + 1) % 4];

  // Plants filtered by season
  const filteredPlants = useMemo(() => {
    let plants = PLANTS_CATALOG;
    if (seasonFilter) {
      plants = plants.filter((p) => p.season === seasonFilter);
    }
    return plants.sort((a, b) => a.rarity - b.rarity || a.seedPrice - b.seedPrice);
  }, [seasonFilter]);

  const getGrowthPct = (plantedAt: number | null, growTimeS: number): number => {
    if (!plantedAt) return 0;
    const elapsed = (now - plantedAt) / 1000;
    return Math.min(1, elapsed / growTimeS);
  };

  const handlePlotClick = (idx: number) => {
    const plot = plots[idx];
    if (plot.plantId) return; // occupied
    setSelectingSlot(idx);
  };

  const handlePlantSelect = (plantId: string) => {
    if (selectingSlot === null) return;
    plant(selectingSlot, plantId);
    setSelectingSlot(null);
  };

  return (
    <div className="space-y-6">
      {/* Header with season indicator */}
      <div className="flex items-center justify-between">
        <h2 className="text-amber-300 font-bold text-lg">🌱 农场</h2>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-amber-200/80">
            {SEASON_ICONS[currentSeason]} {SEASON_NAMES[currentSeason]}季
          </span>
          <span className="text-amber-200/40 text-xs">
            → {SEASON_ICONS[nextSeason]} {SEASON_NAMES[nextSeason]}季 {formatSeasonTime(seasonRemaining)}
          </span>
        </div>
      </div>

      {/* Plots grid */}
      <div>
        <h3 className="text-amber-400/80 font-bold text-sm mb-2 border-b border-amber-900/30 pb-1">
          🌾 种植区域
        </h3>
        <div className="grid grid-cols-4 gap-2">
          {plots.map((plot, idx) => {
            const plantData = plot.plantId ? getPlantData(plot.plantId) : null;
            const growthPct = plantData
              ? getGrowthPct(plot.plantedAt, plantData.growTimeS)
              : 0;
            const isMature = growthPct >= 1;
            const isSelecting = selectingSlot === idx;

            return (
              <div
                key={idx}
                onClick={() => handlePlotClick(idx)}
                className={`border rounded-lg p-2 text-center transition-colors cursor-pointer ${
                  isSelecting
                    ? 'border-amber-500/60 bg-amber-950/30 ring-1 ring-amber-500/40'
                    : plantData
                      ? isMature
                        ? 'border-green-600/50 bg-green-950/20'
                        : 'border-amber-900/30 bg-slate-900/60'
                      : 'border-amber-900/20 bg-slate-900/30 border-dashed hover:border-amber-700/40'
                }`}
              >
                {plantData ? (
                  <>
                    <div className="text-2xl mb-1">{plantData.icon}</div>
                    <div
                      className="text-xs font-bold truncate"
                      style={{ color: RARITY_COLORS[plantData.rarity] }}
                    >
                      {plantData.name}
                    </div>
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
                          {formatTime(
                            Math.max(
                              0,
                              plantData.growTimeS -
                                (now - (plot.plantedAt ?? 0)) / 1000
                            )
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            fertilize(idx);
                          }}
                          className="mt-1 px-1.5 py-0.5 rounded text-xs bg-amber-900/40 text-amber-200/60 hover:bg-amber-800/40"
                        >
                          🧪 {plot.fertilizerCount}
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          harvest(idx);
                        }}
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
      </div>

      {/* Plant selection panel (shown when selecting a slot) */}
      {selectingSlot !== null && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-amber-400/80 font-bold text-sm border-b border-amber-900/30 pb-1">
              🌿 选择种植 #{selectingSlot + 1}
            </h3>
            <button
              onClick={() => setSelectingSlot(null)}
              className="text-amber-200/40 text-xs hover:text-amber-200/70"
            >
              ✕ 取消
            </button>
          </div>

          {/* Season filter */}
          <div className="flex flex-wrap gap-1 mb-3">
            <button
              onClick={() => setSeasonFilter(null)}
              className={`px-2 py-1 rounded text-xs ${
                seasonFilter === null
                  ? 'bg-amber-700 text-amber-100'
                  : 'bg-slate-800 text-amber-200/50 hover:bg-slate-700'
              }`}
            >
              全部
            </button>
            {['春', '夏', '秋', '冬'].map((s) => (
              <button
                key={s}
                onClick={() => setSeasonFilter(s)}
                className={`px-2 py-1 rounded text-xs ${
                  seasonFilter === s
                    ? 'bg-amber-700 text-amber-100'
                    : 'bg-slate-800 text-amber-200/50 hover:bg-slate-700'
                }`}
              >
                {s === '春' ? '🌸' : s === '夏' ? '☀️' : s === '秋' ? '🍂' : '❄️'} {s}季
              </button>
            ))}
          </div>

          {/* Plant grid */}
          <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto pr-1">
            {filteredPlants.map((p) => {
              const isCurrentSeason = !p.season || p.season === SEASON_NAMES[currentSeason];
              return (
                <button
                  key={p.id}
                  onClick={() => handlePlantSelect(p.id)}
                  disabled={hero.gold < p.seedPrice}
                  className={`border rounded-lg p-3 text-left transition-colors ${
                    hero.gold >= p.seedPrice
                      ? 'border-amber-900/30 bg-slate-900/60 hover:bg-slate-800/60 hover:border-amber-700/50'
                      : 'border-slate-800 bg-slate-900/30 opacity-50 cursor-not-allowed'
                  } ${!isCurrentSeason ? 'opacity-40' : ''}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{p.icon}</span>
                    <span
                      className="font-bold text-sm truncate flex-1"
                      style={{ color: RARITY_COLORS[p.rarity] }}
                    >
                      {p.name}
                    </span>
                    <RarityBadge rarity={p.rarity} />
                  </div>
                  <div className="text-xs text-amber-200/50 mb-1 line-clamp-1">{p.desc}</div>
                  <div className="flex items-center justify-between text-xs text-amber-200/40">
                    <span>⏱ {formatTime(p.growTimeS)}</span>
                    <span>💰 {p.harvestGold}G</span>
                  </div>
                  <div className="text-xs text-amber-400 mt-1 font-bold">
                    种植 {p.seedPrice}G
                  </div>
                  {p.season && (
                    <div className="text-xs text-amber-200/30 mt-0.5">
                      🌱 推荐季节: {p.season}季
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Default: show seed shop overview when not selecting */}
      {selectingSlot === null && (
        <div>
          <h3 className="text-amber-400/80 font-bold text-sm mb-2 border-b border-amber-900/30 pb-1">
            🌿 种子商店
            <span className="text-amber-200/30 ml-2 text-xs">（点击空地选择种植）</span>
          </h3>
          <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
            {PLANTS_CATALOG.map((p) => (
              <div
                key={p.id}
                className="border border-amber-900/30 rounded-lg p-3 bg-slate-900/60"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{p.icon}</span>
                  <span
                    className="font-bold text-sm truncate flex-1"
                    style={{ color: RARITY_COLORS[p.rarity] }}
                  >
                    {p.name}
                  </span>
                  <RarityBadge rarity={p.rarity} />
                </div>
                <div className="text-xs text-amber-200/50 mb-1 line-clamp-1">{p.desc}</div>
                <div className="flex items-center justify-between text-xs text-amber-200/40">
                  <span>⏱ {formatTime(p.growTimeS)}</span>
                  <span>💰 {p.harvestGold}G</span>
                </div>
                <button
                  onClick={() => {
                    const emptyIdx = plots.findIndex((pl) => !pl.plantId);
                    if (emptyIdx >= 0) {
                      setSelectingSlot(emptyIdx);
                    }
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
      )}
    </div>
  );
};
