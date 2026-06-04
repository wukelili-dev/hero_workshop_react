import React, { useState, useMemo } from 'react';
import { useInventoryStore } from '../../store/useInventoryStore';
import { RARITY_COLORS, RARITY_NAMES, formatNumber } from '../../data/constants';

// 材料分类定义
type MaterialCategory = 'forge' | 'monster' | 'plant' | 'ranch';

const CATEGORIES: { key: MaterialCategory; label: string; icon: string; keywords: string[] }[] = [
  { key: 'forge', label: '锻造材料', icon: '⚒️', keywords: ['铁', '钢', '精铁', '秘银', '矿石', '晶石', '石', '锭'] },
  { key: 'monster', label: '怪物掉落', icon: '💀', keywords: ['骨', '牙', '爪', '皮', '鳞', '核', '魂', '眼', '角', '毒'] },
  { key: 'plant', label: '植物产出', icon: '🌿', keywords: ['草', '花', '叶', '根', '藤', '果实', '种子', '药', '香'] },
  { key: 'ranch', label: '牧场产出', icon: '🐄', keywords: ['奶', '蛋', '毛', '肉', '蜜', '蜡', '绒', '饲料'] },
];

function classifyMaterial(name: string): MaterialCategory {
  for (const cat of CATEGORIES) {
    for (const kw of cat.keywords) {
      if (name.includes(kw)) return cat.key;
    }
  }
  return 'monster';
}

// 推断稀有度（启发式）
function inferRarity(name: string): number {
  if (name.includes('传说') || name.includes('龙') || name.includes('圣') || name.includes('神')) return 4;
  if (name.includes('精') || name.includes('灵') || name.includes('暗') || name.includes('魔')) return 3;
  if (name.includes('王') || name.includes('羽') || name.includes('牙') || name.includes('晶')) return 2;
  if (name.includes('硬') || name.includes('铁') || name.includes('钢')) return 1;
  return 0;
}

export const MaterialsTab: React.FC = () => {
  const materials = useInventoryStore((s) => s.materials);
  const [activeCategory, setActiveCategory] = useState<MaterialCategory | 'all'>('all');

  const entries = useMemo(() => {
    return Object.entries(materials)
      .filter(([_, v]) => v > 0)
      .map(([name, count]) => ({
        name,
        count,
        rarity: inferRarity(name),
        category: classifyMaterial(name),
      }))
      .sort((a, b) => b.rarity - a.rarity || a.name.localeCompare(b.name, 'zh'));
  }, [materials]);

  const filtered = useMemo(() => {
    if (activeCategory === 'all') return entries;
    return entries.filter((e) => e.category === activeCategory);
  }, [entries, activeCategory]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const e of entries) {
      counts[e.category] = (counts[e.category] || 0) + 1;
    }
    return counts;
  }, [entries]);

  return (
    <div className="space-y-6">
      <h2 className="text-amber-300 font-bold text-lg">⭐ 材料仓库</h2>

      {/* Category filter tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-3 py-1.5 rounded text-xs font-bold transition-colors ${
            activeCategory === 'all'
              ? 'bg-amber-700 text-amber-100'
              : 'bg-slate-800 text-amber-200/50 hover:bg-slate-700'
          }`}
        >
          全部 ({entries.length})
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className={`px-3 py-1.5 rounded text-xs font-bold transition-colors ${
              activeCategory === cat.key
                ? 'bg-amber-700 text-amber-100'
                : 'bg-slate-800 text-amber-200/50 hover:bg-slate-700'
            }`}
          >
            {cat.icon} {cat.label} ({categoryCounts[cat.key] || 0})
          </button>
        ))}
      </div>

      {/* Material cards */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 gap-2">
          {filtered.map(({ name, count, rarity, category }) => {
            const catInfo = CATEGORIES.find((c) => c.key === category);
            return (
              <div
                key={name}
                className="border border-amber-900/30 rounded-lg p-3 bg-slate-900/60 hover:bg-slate-800/60 transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm" style={{ color: RARITY_COLORS[rarity] }}>
                    {name}
                  </span>
                  <span className="text-amber-400 font-bold">{formatNumber(count)}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-amber-200/40">
                  <span>{catInfo?.icon} {catInfo?.label}</span>
                  <span style={{ color: RARITY_COLORS[rarity] }}>{RARITY_NAMES[rarity]}</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center text-amber-200/30 py-8">
          {activeCategory === 'all' ? '暂无材料，去战斗获取吧！' : `暂无${CATEGORIES.find(c => c.key === activeCategory)?.label}`}
        </div>
      )}

      {/* Summary */}
      {entries.length > 0 && (
        <div className="border border-amber-900/30 rounded-lg p-3 bg-slate-900/40">
          <div className="text-xs text-amber-200/50">
            共 {entries.length} 种材料，{formatNumber(entries.reduce((sum, e) => sum + e.count, 0))} 个
          </div>
        </div>
      )}
    </div>
  );
};
