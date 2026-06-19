import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { FaTree, FaMagnet, FaPaw, FaMountain, FaLeaf } from 'react-icons/fa6';

const RESOURCE_ICONS: Record<string, React.ReactNode> = {
  wood: <FaTree />,
  iron: <FaMagnet />,
  hide: <FaPaw />,
  stone: <FaMountain />,
  herb: <FaLeaf />,
};

const RESOURCE_NAMES: Record<string, string> = {
  wood: '木材',
  iron: '铁矿',
  hide: '皮革',
  stone: '石头',
  herb: '草药',
};

export const MaterialsTab: React.FC = () => {
  const resources = useGameStore((s) => s.resources);

  const entries = Object.entries(resources).filter(([_, v]) => (v ?? 0) > 0);
  const hasMaterials = entries.length > 0;

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-bold text-gray-700">⭐ 材料</h2>

      {!hasMaterials ? (
        <div className="text-center py-8 text-gray-400 text-sm">
          暂无材料<br />
          <span className="text-xs">战斗掉落、农场收获可获得材料</span>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {entries.map(([key, value]) => (
            <div
              key={key}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg"
            >
              <span className="text-lg flex items-center justify-center w-6 h-6">
                {RESOURCE_ICONS[key] || <FaLeaf />}
              </span>
              <div className="flex-1">
                <div className="text-xs text-gray-500">{RESOURCE_NAMES[key] || key}</div>
                <div className="font-bold text-sm">{value}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 提示 */}
      <div className="text-xs text-gray-400 border-t border-gray-100 pt-3 mt-4">
        💡 材料用于锻造装备。不同地图的怪物掉落不同材料。
      </div>
    </div>
  );
};
