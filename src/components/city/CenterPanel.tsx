/**
 * CenterPanel - 中间面板：英雄属性 + 地图选择
 */

import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { MAPS } from '../../data/maps';
import { formatNumber } from '../../data/constants';

// 地图图标映射
const MAP_ICONS: Record<string, string> = {
  aolai: '🏝️',
  datangdong: '🏯',
  yangguan: '🏜️',
  datangnan: '🎋',
  donghai: '🌊',
  huaguoshan: '🐒',
  wuzhishan: '⛰️',
  difu: '💀',
  wusizang: '🏔️',
  wanshoushan: '🌳',
};

export const CenterPanel: React.FC = () => {
  const hero = useGameStore((s) => s.hero);
  const currentMapId = useGameStore((s) => s.currentMapId);
  const setCurrentMapId = useGameStore((s) => s.setCurrentMap);
  const unlockedMaps = useGameStore((s) => s.unlockedMaps);

  const handleSelectMap = (mapId: string) => {
    if (unlockedMaps.includes(mapId)) {
      setCurrentMapId(mapId);
    }
  };

  const handleUnlockMap = (map: typeof MAPS[number]) => {
    if (hero.gold >= map.unlockCost && !unlockedMaps.includes(map.id)) {
      useGameStore.getState().addGold(-map.unlockCost);
      useGameStore.getState().unlockMap(map.id);
    }
  };

  const currentMap = MAPS.find(m => m.id === currentMapId);

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      {/* 英雄属性卡 */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-2xl shadow">
            🧙
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-lg">{hero.name}</h3>
            <span className="text-sm text-gray-500">Lv.{hero.level}</span>
          </div>
          {/* 装备槽 */}
          <div className="ml-auto flex gap-2">
            <div className="w-10 h-10 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-sm" title="武器">
              {hero.weapon ? hero.weapon.name.slice(0, 2) : '⚔️'}
            </div>
            <div className="w-10 h-10 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-sm" title="护甲">
              {hero.armor ? hero.armor.name.slice(0, 2) : '🛡️'}
            </div>
          </div>
        </div>

        {/* HP条 */}
        <div className="mb-3">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>❤️ HP</span>
            <span>{hero.hp} / {hero.maxHp}</span>
          </div>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-red-400 to-red-500 rounded-full transition-all"
              style={{ width: `${Math.max(0, (hero.hp / hero.maxHp) * 100)}%` }}
            />
          </div>
        </div>

        {/* EXP条 */}
        <div className="mb-3">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>✨ EXP</span>
            <span>{formatNumber(hero.exp)}</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full transition-all"
              style={{ width: `${Math.min(100, (hero.exp / 100) * 100)}%` }}
            />
          </div>
        </div>

        {/* 属性网格 */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-gray-50 rounded-lg p-2 text-center">
            <div className="text-xs text-gray-400">攻击</div>
            <div className="font-bold text-red-600">{hero.atk}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-2 text-center">
            <div className="text-xs text-gray-400">防御</div>
            <div className="font-bold text-blue-600">{hero.def}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-2 text-center">
            <div className="text-xs text-gray-400">暴击率</div>
            <div className="font-bold text-orange-600">{(hero.critRate * 100).toFixed(0)}%</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-2 text-center">
            <div className="text-xs text-gray-400">暴击伤害</div>
            <div className="font-bold text-purple-600">{(hero.critDmg * 100).toFixed(0)}%</div>
          </div>
        </div>

        {/* 金币 */}
        <div className="mt-3 text-center">
          <span className="text-yellow-500 text-sm">💰</span>
          <span className="font-bold text-gray-800">{formatNumber(hero.gold)}</span>
        </div>
      </div>

      {/* 地图选择 */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <h4 className="font-bold text-gray-700 mb-1">🗺️ 当前地图</h4>
        <p className="text-sm text-gray-500 mb-3">
          {currentMap ? `${MAP_ICONS[currentMap.id] || ''} ${currentMap.name} (Lv.${currentMap.minLevel}+)` : '未选择'}
        </p>

        <h4 className="font-bold text-gray-700 mb-2">选择地图</h4>
        <div className="grid grid-cols-2 gap-2">
          {MAPS.map((map) => {
            const isUnlocked = unlockedMaps.includes(map.id);
            const isActive = currentMapId === map.id;
            const canAfford = hero.gold >= map.unlockCost;

            return (
              <button
                key={map.id}
                onClick={() => isUnlocked ? handleSelectMap(map.id) : handleUnlockMap(map)}
                className={`relative rounded-lg p-2.5 text-left transition-all border ${
                  isActive
                    ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-300'
                    : isUnlocked
                    ? 'bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300'
                    : 'bg-gray-50 border-gray-200 opacity-70 hover:opacity-90'
                }`}
                disabled={!isUnlocked && !canAfford}
              >
                <div className="text-lg mb-0.5">{MAP_ICONS[map.id] || '🗺️'}</div>
                <div className={`text-sm font-medium ${isActive ? 'text-amber-700' : 'text-gray-700'}`}>
                  {map.name}
                </div>
                <div className="text-xs text-gray-400">Lv.{map.minLevel}+</div>
                {!isUnlocked && (
                  <div className="text-xs mt-1 text-yellow-600">
                    🔓 {formatNumber(map.unlockCost)}G
                  </div>
                )}
                {isActive && (
                  <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-400" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
