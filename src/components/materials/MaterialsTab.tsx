import React from 'react';
import { useInventoryStore } from '../../store/useInventoryStore';
import { RARITY_COLORS, RARITY_NAMES, formatNumber } from '../../data/constants';

export const MaterialsTab: React.FC = () => {
  const materials = useInventoryStore((s) => s.materials);

  const entries = Object.entries(materials).filter(([_, v]) => v > 0);

  return (
    <div className="space-y-6">
      <h2 className="text-amber-300 font-bold text-lg">⭐ 材料仓库</h2>

      {entries.length > 0 ? (
        <div className="grid grid-cols-2 gap-2">
          {entries.map(([name, count]) => {
            // Try to determine rarity from name heuristics
            const rarity = name.includes('精') || name.includes('灵') ? 3
              : name.includes('王') || name.includes('圣') || name.includes('龙') ? 4
              : name.includes('羽') || name.includes('骨') || name.includes('牙') ? 2
              : 1;
            return (
              <div key={name} className="border border-amber-900/30 rounded-lg p-3 bg-slate-900/60">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm" style={{ color: RARITY_COLORS[rarity] }}>
                    {name}
                  </span>
                  <span className="text-amber-400 font-bold">{formatNumber(count)}</span>
                </div>
                <div className="text-xs text-amber-200/40">{RARITY_NAMES[rarity]}</div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center text-amber-200/30 py-8">
          暂无材料，去战斗获取吧！
        </div>
      )}

      {/* Summary */}
      {entries.length > 0 && (
        <div className="border border-amber-900/30 rounded-lg p-3 bg-slate-900/40">
          <div className="text-xs text-amber-200/50">
            共 {entries.length} 种材料
          </div>
        </div>
      )}
    </div>
  );
};
