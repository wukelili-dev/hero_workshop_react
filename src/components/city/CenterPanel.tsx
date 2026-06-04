/**
 * CenterPanel - 中间面板：队伍标签 + 英雄属性 + 地图选择 + 刷新敌人
 * 对照原版界面设计
 */

import React, { useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { MAPS } from '../../data/maps';
import { formatNumber } from '../../data/constants';

type TeamTab = 'hero' | 'teammate' | 'all';

export const CenterPanel: React.FC = () => {
  const hero = useGameStore((s) => s.hero);
  const currentMapId = useGameStore((s) => s.currentMapId);
  const setCurrentMapId = useGameStore((s) => s.setCurrentMap);
  const unlockedMaps = useGameStore((s) => s.unlockedMaps);
  const [teamTab, setTeamTab] = useState<TeamTab>('hero');

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
    <div className="h-full overflow-y-auto p-3 space-y-3">
      {/* 队伍标签栏 */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold text-gray-700">👥 队伍</span>
        <div className="flex gap-1.5">
          {([
            { id: 'hero' as TeamTab, label: '勇者' },
            { id: 'teammate' as TeamTab, label: '队友' },
            { id: 'all' as TeamTab, label: '全队' },
          ]).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTeamTab(tab.id)}
              className={`px-4 py-1 rounded-full text-sm font-medium transition-colors ${
                teamTab === tab.id
                  ? 'bg-orange-500 text-white shadow'
                  : 'bg-gray-300 text-gray-600 hover:bg-gray-400'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {/* 装备槽 */}
        <div className="ml-auto flex gap-1.5">
          <div className="w-8 h-8 rounded border border-gray-300 flex items-center justify-center text-xs text-gray-400" title="武器">
            ⚔️
          </div>
        </div>
      </div>

      {/* 英雄属性卡 */}
      <div className="bg-white rounded-lg border border-gray-200 p-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">🧙</span>
          <span className="font-bold text-gray-900">{hero.name}</span>
          <span className="text-sm text-blue-600 font-bold">Lv.{hero.level}</span>
        </div>

        {/* 属性列表 — 原版风格 */}
        <div className="space-y-0.5 text-sm">
          <div className="flex"><span className="text-gray-500 w-14">生命:</span><span>{hero.hp}/{hero.maxHp}</span></div>
          <div className="flex"><span className="text-gray-500 w-14">攻击:</span><span className="text-red-600 font-medium">{hero.atk}</span></div>
          <div className="flex"><span className="text-gray-500 w-14">防御:</span><span className="text-blue-600 font-medium">{hero.def}</span></div>
          <div className="flex"><span className="text-gray-500 w-14">CRIT:</span><span>{(hero.critRate * 100).toFixed(0)}%</span></div>
          <div className="flex"><span className="text-gray-500 w-14">经验:</span><span>{formatNumber(hero.exp)}/100</span></div>
          <div className="flex"><span className="text-gray-500 w-14">武器:</span><span className="text-gray-600">{hero.weapon ? hero.weapon.name : 'None'}</span></div>
          <div className="flex"><span className="text-gray-500 w-14">护甲:</span><span className="text-gray-600">{hero.armor ? hero.armor.name : 'None'}</span></div>
        </div>
      </div>

      {/* 地图区域 */}
      <div>
        <div className="flex items-center gap-1 mb-2">
          <span className="text-sm">🗺️</span>
          <span className="text-sm font-bold text-gray-700">地图</span>
        </div>
        <div className="text-xs text-blue-600 mb-2">{currentMap?.name ?? '傲来国'}</div>

        <div className="flex flex-wrap gap-1.5">
          {MAPS.map((map) => {
            const isUnlocked = unlockedMaps.includes(map.id);
            const isActive = currentMapId === map.id;

            return (
              <button
                key={map.id}
                onClick={() => isUnlocked ? handleSelectMap(map.id) : handleUnlockMap(map)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  isActive && isUnlocked
                    ? 'bg-green-600 text-white shadow'
                    : isUnlocked
                    ? 'bg-gray-500 text-white hover:bg-gray-600'
                    : 'bg-gray-400 text-white/80 hover:bg-gray-500'
                }`}
                disabled={!isUnlocked}
              >
                {map.name}{!isUnlocked ? `(${formatNumber(map.unlockCost)}G)` : ''}
              </button>
            );
          })}
        </div>
      </div>

      {/* ??? 刷新敌人 */}
      <div>
        <div className="flex items-center gap-1 mb-1.5">
          <span>💀</span>
          <span className="text-sm font-bold text-gray-700">???</span>
        </div>
        <button className="flex items-center gap-1 px-3 py-1 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded text-sm text-blue-700 transition-colors">
          🔄 刷新敌人
        </button>
      </div>
    </div>
  );
};
