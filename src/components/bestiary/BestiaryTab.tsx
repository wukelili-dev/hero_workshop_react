import React, { useMemo } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { MAPS } from '../../data/maps';
import type { Monster } from '../../types';
import {
  FaCrow,
  FaFish,
  FaGhost,
  FaSkull,
  FaSkullCrossbones,
  FaPaw,
  FaStaffSnake,
  FaCrown,
  FaLeaf,
  FaUserSecret,
} from 'react-icons/fa6';

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

// 怪物图标映射（按怪物语义分配）
const MONSTER_ICON_MAP: Record<string, React.ReactNode> = {
  // 傲来国
  '蝴蝶': <FaCrow className="text-pink-500" />,
  '鹦鹉': <FaCrow className="text-green-500" />,
  '龙虾': <FaFish className="text-red-500" />,
  '巨蟹': <FaFish className="text-orange-500" />,
  '九头精怪': <FaGhost className="text-purple-500" />,
  // 大唐东
  '太监': <FaUserSecret className="text-gray-500" />,
  '失控的银甲唐兵': <FaSkull className="text-gray-600" />,
  '失控的金甲唐兵': <FaSkull className="text-yellow-600" />,
  '唐兵统领': <FaCrown className="text-yellow-500" />,
  '千年蛇魅': <FaStaffSnake className="text-green-600" />,
  // 阳关
  '突厥弩手': <FaSkull className="text-gray-700" />,
  '波斯女刀客': <FaSkull className="text-pink-600" />,
  '突厥弩王': <FaCrown className="text-yellow-500" />,
  '波斯刺客': <FaSkull className="text-red-600" />,
  // 大唐南
  '绝色剑客': <FaSkull className="text-blue-500" />,
  '江州衙役': <FaSkull className="text-gray-600" />,
  '风流剑客': <FaSkull className="text-purple-500" />,
  '高丽密探': <FaUserSecret className="text-green-700" />,
  // 东海
  '巡海夜叉': <FaFish className="text-blue-400" />,
  '龟丞相': <FaFish className="text-green-700" />,
  '螺精': <FaFish className="text-teal-600" />,
  '万年虾妖': <FaFish className="text-red-400" />,
  '梵天罗刹': <FaGhost className="text-red-600" />,
  '嗜血妖螺': <FaFish className="text-pink-600" />,
  // 花果山
  '猴枪兵': <FaCrow className="text-yellow-600" />,
  '猴刀兵': <FaCrow className="text-orange-600" />,
  '赤尻马猴': <FaCrow className="text-red-700" />,
  '混世魔王': <FaCrown className="text-red-500" />,
  // 五指山
  '刁蛮女': <FaSkull className="text-pink-500" />,
  '好色僧人': <FaGhost className="text-orange-400" />,
  '强盗': <FaSkull className="text-gray-700" />,
  '芦花精': <FaGhost className="text-green-400" />,
  // 地府
  '酒鬼': <FaGhost className="text-purple-400" />,
  '赌鬼': <FaGhost className="text-red-500" />,
  '尾生': <FaGhost className="text-blue-400" />,
  '无常': <FaGhost className="text-white" />,
  // 乌斯藏
  '熊罴': <FaPaw className="text-brown-600" />,
  '鸟精': <FaCrow className="text-sky-500" />,
  '虎先锋': <FaPaw className="text-orange-700" />,
  '山神': <FaGhost className="text-yellow-400" />,
  '黄风大圣': <FaCrown className="text-yellow-600" />,
  // 万寿山
  '人参娃娃': <FaLeaf className="text-green-400" />,
  '五庄道童': <FaSkull className="text-teal-600" />,
  '骷髅怪': <FaSkullCrossbones className="text-gray-800" />,
  '镇元大仙': <FaCrown className="text-yellow-400" />,
};

const DEFAULT_MONSTER_ICON: React.ReactNode = <FaSkull className="text-gray-400" />;

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
          const icon = MONSTER_ICON_MAP[monster.id] || DEFAULT_MONSTER_ICON;
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
                      className="text-xl w-8 h-8 flex items-center justify-center shrink-0"
                    >
                      {icon}
                    </span>
                    <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                      <span className="font-bold text-sm text-gray-800">
                        {icon} {monster.name}
                      </span>
                      <span
                        className="text-xs px-1.5 py-0.5 rounded text-white font-medium"
                        style={{
                          backgroundColor:
                            RARITY_COLOR[monster.rarity ?? 0] || '#C0C0C0',
                        }}
                      >
                        {RARITY_NAME[monster.rarity ?? 0] || '普通'}
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
                <div className="flex flex-col items-center justify-center h-20 text-gray-400 text-lg font-mono gap-1">
                  <span className="text-2xl opacity-40">{icon}</span>
                  未发现
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
