/**
 * WorldOverview — 「天下」总览（世界广度 R5）
 * 展示所有区域卡片（名称/等级区间/主城/内容计数/关隘门槛），关隘连线，点击切换区域。
 */
import React from 'react';
import { REGIONS, regionOf, cityOf } from '../../data/regions';
import { useWorldStore } from '../../store/useWorldStore';
import { useGameStore } from '../../store/useGameStore';
import { sitesOfRegion } from '../../data/sites';

const GATE_KIND_LABEL: Record<string, string> = { road: '官道', ferry: '渡口', pass: '山关' };

export const WorldOverview: React.FC<{ onEnter: (regionId: string) => void }> = ({ onEnter }) => {
  const currentRegionId = useWorldStore((s) => s.currentRegionId);
  const visitedCells = useWorldStore((s) => s.visitedCells);
  const heroLevel = useGameStore((s) => s.hero.level);

  const currentRegion = regionOf(currentRegionId);

  return (
    <div className="space-y-3 p-3">
      <div className="ink-head">
        <h3 className="ink-title text-[16px]">天下 · 舆图总览</h3>
        <span className="ink-tag ml-auto">点击区域即可进入</span>
      </div>

      <div className="text-[11px] text-gray-500">
        当前所在：<b className="text-gray-800">{currentRegion?.name ?? '未知'}</b>
        {currentRegion && ` · 等级 ${currentRegion.levelRange[0]}~${currentRegion.levelRange[1]}`}
      </div>

      {/* 区域连线图（横向示意） */}
      <div className="flex items-center justify-center gap-2 overflow-x-auto py-2">
        {REGIONS.map((region, i) => {
          const city = cityOf(region.cityId);
          const isCurrent = region.id === currentRegionId;
          return (
            <React.Fragment key={region.id}>
              {i > 0 && (
                <div className="flex flex-col items-center text-[9px] text-gray-400">
                  {region.gates.some((g) => g.toRegionId === REGIONS[i - 1]?.id) || REGIONS[i - 1]?.gates.some((g) => g.toRegionId === region.id) ? (
                    <span className="border-t-2 border-dashed border-[#8a7a63] w-10" />
                  ) : (
                    <span className="w-10 text-center">···</span>
                  )}
                  <span>{GATE_KIND_LABEL[region.gates[0]?.kind ?? 'road']}</span>
                </div>
              )}
              <div
                onClick={() => onEnter(region.id)}
                className={`cursor-pointer rounded-xl border p-3 text-center transition-all ${
                  isCurrent
                    ? 'border-[#b5382f] bg-[#f6edd6] shadow-sm'
                    : 'border-[#8a7a63]/30 bg-white hover:border-[#b5382f]/50'
                }`}
              >
                <div className="text-2xl">{city?.name === '长安' ? '🏯' : '🏘️'}</div>
                <div className="text-sm font-bold text-gray-800">{region.name}</div>
                <div className="text-[10px] text-gray-500">Lv.{region.levelRange[0]}~{region.levelRange[1]}</div>
                <div className="text-[10px] text-amber-700">{city?.name ?? region.cityId}</div>
                {isCurrent && <div className="mt-1 text-[10px] text-[#b5382f]">● 当前</div>}
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* 区域详情卡片 */}
      <div className="grid gap-3 sm:grid-cols-2">
        {REGIONS.map((region) => {
          const city = cityOf(region.cityId);
          const siteCount = sitesOfRegion(region.id).length;
          const visited = visitedCells.filter((c) => c.startsWith(region.cellPrefix + '_')).length;
          const gates = region.gates.map((g) => {
            const target = regionOf(g.toRegionId);
            const req = g.require;
            const lvOk = !req?.minLevel || heroLevel >= req.minLevel;
            const reqText = req
              ? (req.minLevel ? `需 Lv.${req.minLevel}` : '') + (req.itemId ? ` · 需「${req.itemId}」` : '') + (req.factionRep ? ` · 需声望≥${req.factionRep.min}` : '')
              : '无门槛';
            return { target, reqText, lvOk, kind: g.kind, days: g.days };
          });
          const isCurrent = region.id === currentRegionId;

          return (
            <div key={region.id} className={`rounded-xl border p-3 ${isCurrent ? 'border-[#b5382f] bg-[#fdfbf4]' : 'border-[#8a7a63]/30 bg-white'}`}>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-800">{region.name}</span>
                <span className="text-[10px] text-gray-400">Lv.{region.levelRange[0]}~{region.levelRange[1]}</span>
                {isCurrent && <span className="ml-auto ink-tag">当前</span>}
              </div>
              <div className="mt-1 text-[11px] text-gray-500">{region.description}</div>
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-gray-600">
                <span>🏙 主城 <b>{city?.name}</b></span>
                <span>🗺 内容 {siteCount} 项</span>
                <span>👣 已探 {visited}/{region.size * region.size} 格</span>
              </div>
              {gates.length > 0 && (
                <div className="mt-2 space-y-1">
                  {gates.map((g, i) => (
                    <div key={i} className="flex items-center gap-2 rounded bg-[#f3efe4] px-2 py-1 text-[10px]">
                      <span>🏔 {GATE_KIND_LABEL[g.kind]} → {g.target?.name}</span>
                      <span className="text-gray-500">{g.reqText} · {g.days} 天</span>
                      <span className={g.lvOk ? 'text-green-700' : 'text-[#8f2b23]'}>{g.lvOk ? '可通行' : '门槛未达'}</span>
                    </div>
                  ))}
                </div>
              )}
              {!isCurrent && (
                <button type="button" onClick={() => onEnter(region.id)} className="ink-btn mt-2 w-full text-xs">
                  进入{region.name}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
