import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { formatNumber } from '../../data/constants';

export const TopBar: React.FC = () => {
  const hero = useGameStore((s) => s.hero);
  const resources = useGameStore((s) => s.resources);

  const resEntries: { icon: string; name: string; value: number }[] = [
    { icon: '🪵', name: '木材', value: resources.wood ?? 0 },
    { icon: '⛏', name: '铁矿', value: resources.iron ?? 0 },
    { icon: '🧤', name: '皮革', value: resources.hide ?? 0 },
    { icon: '⛰', name: '石头', value: resources.stone ?? 0 },
    { icon: '🌿', name: '草药', value: resources.herb ?? 0 },
  ];

  return (
    <div className="flex items-center gap-4 px-4 py-2 bg-white border-b border-gray-200">
      {/* Hero info */}
      <div className="flex items-center gap-2 mr-4">
        <span className="text-lg">🧙</span>
        <span className="text-gray-900 font-bold">{hero.name}</span>
        <span className="text-gray-500 text-sm">Lv.{hero.level}</span>
      </div>

      {/* HP */}
      <div className="flex items-center gap-1 text-sm">
        <span className="text-red-500">❤</span>
        <span className="text-gray-600">{hero.hp}/{hero.maxHp}</span>
      </div>

      {/* Gold */}
      <div className="flex items-center gap-1 text-sm">
        <span className="text-yellow-500">💰</span>
        <span className="text-gray-900 font-bold">{formatNumber(hero.gold)}</span>
      </div>

      {/* Separator */}
      <div className="w-px h-5 bg-gray-200" />

      {/* Resources */}
      <div className="flex items-center gap-3 text-sm">
        {resEntries.map((r) => (
          <span key={r.name} className="flex items-center gap-0.5">
            <span>{r.icon}</span>
            <span className="text-gray-600">{formatNumber(r.value)}</span>
          </span>
        ))}
      </div>
    </div>
  );
};
