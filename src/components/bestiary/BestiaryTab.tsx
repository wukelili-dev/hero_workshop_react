import React, { useMemo } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { MAPS } from '../../data/maps';
import type { Monster } from '../../types';

const ALL_MONSTERS: Monster[] = MAPS.flatMap((m) => m.monsters);

const RARITY_COLOR: Record<number, string> = {
  0: '#C0C0C0',
  1: '#4CAF50',
  2: '#2196F3',
  3: '#9370DB',
  4: '#FF9800',
};

const RARITY_NAME: Record<number, string> = {
  0: '普通',
  1: '稀有',
  2: '珍稀',
  3: '史诗',
  4: '传说',
};

export const BestiaryTab: React.FC = () => {
  const discoveredMonsters = useGameStore((s) => s.discoveredMonsters);

  const discoveredSet = useMemo(
    () => new Set(discoveredMonsters),
    [discoveredMonsters]
  );

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-gray-800">📖 怪物图鉴</h2>
      <p className="text-xs text-gray-500">
        已发现 {discoveredSet.size} / {ALL_MONSTERS.length} 种怪物
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {ALL_MONSTERS.map((monster) => {
          const discovered = discoveredSet.has(monster.id);
          return (
            <div
              key={monster.id}
              className={`rounded-lg border p-3 transition-colors ${
                discovered
                  ? 'bg-white border-gray-200'
                  : 'bg-gray-100 border-gray-200 opacity-60'
              }`}
            >
              {discovered ? (
                <>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span
                      className="text-xs px-1.5 py-0.5 rounded text-white font-medium"
                      style={{
                        backgroundColor:
                          RARITY_COLOR[monster.rarity ?? 0] || '#C0C0C0',
                      }}
                    >
                      {RARITY_NAME[monster.rarity ?? 0] || '普通'}
                    </span>
                    <span className="font-bold text-sm text-gray-800">
                      {monster.name}
                    </span>
                    {monster.isBoss && (
                      <span className="text-xs text-red-500 font-bold">BOSS</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-600 space-y-0.5">
                    <div>等级：Lv.{monster.level ?? '?'}</div>
                    <div>HP：{monster.hp}</div>
                    <div>ATK：{monster.atk}　DEF：{monster.def}</div>
                    {monster.drops && monster.drops.length > 0 && (
                      <div className="text-[11px] text-gray-400">
                        掉落：
                        {monster.drops.map((d, i) => (
                          <span key={i}>
                            {i > 0 && '、'}
                            {d.itemId} ×{d.quantity[0]}
                            {d.quantity[0] !== d.quantity[1] ? `~${d.quantity[1]}` : ''}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-20 text-gray-400 text-lg font-mono">
                  ？？？
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
