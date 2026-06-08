import React, { useMemo, useState } from 'react';
import { FaBookOpen, FaGift, FaSeedling, FaPaw } from 'react-icons/fa6';
import * as Tooltip from '@radix-ui/react-tooltip';
import { useGameStore } from '../../store/useGameStore';
import { useInventoryStore } from '../../store/useInventoryStore';
import { MAPS } from '../../data/maps';
import type { Monster } from '../../types';
import { NOVELTY_ITEMS, NOVELTY_RARITY_COLORS, NOVELTY_RARITY_NAMES } from '../../data/inventory';
import { PLANTS_CATALOG, PLANT_RARITY_COLORS, PLANT_RARITY_NAMES } from '../../data/plants';
import { RANCH_CATALOG } from '../../data/ranch';

const ALL_MONSTERS: Monster[] = MAPS.flatMap((m) => [...(m.monsters ?? []), ...(m.boss ? [m.boss] : [])]);

const RARITY_COLOR: Record<number, string> = {
  0: '#C0C0C0', 1: '#4CAF50', 2: '#2196F3', 3: '#9370DB', 4: '#FF9800',
};
const RARITY_NAME: Record<number, string> = {
  0: '普通', 1: '稀有', 2: '珍稀', 3: '史诗', 4: '传说',
};

const MONSTER_ICON_MAP: Record<string, React.ReactNode> = {
  '蝴蝶': <span>🦋</span>, '鹦鹉': <span>🦜</span>, '龙虾': <span>🦞</span>,
  '巨蟹': <span>🦀</span>, '九头精怪': <span>👹</span>,
  '太监': <span>👤</span>, '失控的银甲唐兵': <span>⚔️</span>,
  '失控的金甲唐兵': <span>🛡️</span>, '唐兵统领': <span>👑</span>,
  '千年蛇魅': <span>🐍</span>, '突厥弩手': <span>🏹</span>,
  '波斯女刀客': <span>⚔️</span>, '突厥弩王': <span>👑</span>,
  '波斯刺客': <span>🗡️</span>, '绝色剑客': <span>⚔️</span>,
  '江州衙役': <span>👮</span>, '风流剑客': <span>⚔️</span>,
  '高丽密探': <span>🕵️</span>, '巡海夜叉': <span>🐙</span>,
  '龟丞相': <span>🐢</span>, '螺精': <span>🐌</span>,
  '万年虾妖': <span>🦐</span>, '梵天罗刹': <span>👹</span>,
  '嗜血妖螺': <span>🐚</span>, '猴枪兵': <span>🐒</span>,
  '猴刀兵': <span>🐒</span>, '赤尻马猴': <span>🐒</span>,
  '混世魔王': <span>👑</span>, '刁蛮女': <span>👩</span>,
  '好色僧人': <span>👨🦲</span>, '强盗': <span>🗡️</span>,
  '芦花精': <span>👻</span>, '酒鬼': <span>👻</span>,
  '赌鬼': <span>👻</span>, '尾生': <span>👻</span>,
  '无常': <span>💀</span>, '熊罴': <span>🐻</span>,
  '鸟精': <span>🐦</span>, '虎先锋': <span>🐯</span>,
  '山神': <span>👻</span>, '黄风大圣': <span>👑</span>,
  '人参娃娃': <span>👶</span>, '五庄道童': <span>👦</span>,
  '骷髅怪': <span>💀</span>, '镇元大仙': <span>👑</span>,
};
const DEFAULT_MONSTER_ICON: React.ReactNode = <span>👹</span>;

type TabKey = 'monster' | 'novelty' | 'plant' | 'creature';

const TABS = [
  { key: 'monster' as const, label: '怪物', icon: <FaBookOpen /> },
  { key: 'novelty' as const, label: '杂货', icon: <FaGift /> },
  { key: 'plant' as const, label: '植物', icon: <FaSeedling /> },
  { key: 'creature' as const, label: '动物', icon: <FaPaw /> },
];

export const BestiaryTab: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('monster');

  // 全部用 || [] 兜底，防止旧存档缺少这些字段
  const discoveredMonsters = useGameStore((s) => s.discoveredMonsters) || [];
  const discoveredNovelties = useGameStore((s) => s.discoveredNovelties) || [];
  const discoveredPlants = useGameStore((s) => s.discoveredPlants) || [];
  const discoveredCreatures = useGameStore((s) => s.discoveredCreatures) || [];
  const novelties = useInventoryStore((s) => s.novelties) || {};

  const discoveredMonsterSet = useMemo(
    () => new Set(discoveredMonsters),
    [discoveredMonsters],
  );

  return (
    <Tooltip.Provider delayDuration={100}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-1">
            <FaBookOpen /> 图鉴
          </h2>
          <span className="text-xs text-gray-400">
            {activeTab === 'monster' && `已发现 ${discoveredMonsterSet.size} / ${ALL_MONSTERS.length}`}
            {activeTab === 'novelty' && `已发现 ${discoveredNovelties.length} / ${NOVELTY_ITEMS.length}`}
            {activeTab === 'plant' && `已种植 ${discoveredPlants.length} / ${PLANTS_CATALOG.length}`}
            {activeTab === 'creature' && `已饲养 ${discoveredCreatures.length} / ${RANCH_CATALOG.length}`}
          </span>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 flex-wrap">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* 怪物 Tab */}
        {activeTab === 'monster' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {ALL_MONSTERS.map((monster) => {
              const discovered = discoveredMonsterSet.has(monster.id);
              const icon = MONSTER_ICON_MAP[monster.name] || DEFAULT_MONSTER_ICON;
              const drops = monster.drops || [];
              return (
                <div
                  key={monster.id}
                  className={`rounded-lg border p-3 transition-all duration-200 hover:shadow-md hover:border-blue-300 ${
                    discovered
                      ? 'bg-white border-gray-200 hover:scale-[1.02]'
                      : 'bg-gray-100 border-gray-200 opacity-60'
                  }`}
                >
                  {discovered ? (
                    <Tooltip.Root>
                      <Tooltip.Trigger asChild>
                        <div className="flex items-center gap-2 mb-1.5 cursor-pointer">
                          <span className="text-xl w-8 h-8 flex items-center justify-center shrink-0">
                            {icon}
                          </span>
                          <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                            <span className="font-bold text-sm text-gray-800">{monster.name}</span>
                            <span
                              className="text-xs px-1.5 py-0.5 rounded text-white font-medium"
                              style={{ backgroundColor: RARITY_COLOR[monster.rarity ?? 0] || '#C0C0C0' }}
                            >
                              {RARITY_NAME[monster.rarity ?? 0] || '普通'}
                            </span>
                            {monster.isBoss && (
                              <span className="text-xs text-red-500 font-bold">BOSS</span>
                            )}
                          </div>
                        </div>
                      </Tooltip.Trigger>
                      <Tooltip.Portal>
                        <Tooltip.Content
                          className="bg-gray-800 text-white text-xs rounded-lg px-3 py-2 shadow-lg max-w-xs"
                          sideOffset={5}
                        >
                          <div className="space-y-1">
                            <div className="font-bold">{monster.name}</div>
                            <div>等级：Lv.{monster.level ?? '?'}</div>
                            <div>HP：{monster.hp}　ATK：{monster.atk}　DEF：{monster.def}</div>
                            {drops.length > 0 && (
                              <div className="text-[11px] text-gray-300">
                                掉落：{drops.map((d, i) => (
                                  <span key={i}>
                                    {i > 0 && '、'}
                                    {d.itemId} ×{d.quantity[0]}
                                    {d.quantity[0] !== d.quantity[1] ? `~${d.quantity[1]}` : ''}
                                    ({Math.round(d.chance * 100)}%)
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <Tooltip.Arrow className="fill-gray-800" />
                        </Tooltip.Content>
                      </Tooltip.Portal>
                    </Tooltip.Root>
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
        )}

        {/* 杂货 Tab */}
        {activeTab === 'novelty' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {NOVELTY_ITEMS.map((item) => {
              const discovered = discoveredNovelties.includes(item.name);
              const owned = (novelties[item.name] || 0) > 0;
              const color = NOVELTY_RARITY_COLORS[item.rarityIdx] ?? '#888';
              const rarityName = NOVELTY_RARITY_NAMES[item.rarityIdx] ?? '普通';
              return (
                <div
                  key={item.name}
                  className={`rounded-lg border p-3 transition-all duration-200 hover:shadow-md ${
                    discovered
                      ? 'bg-white border-gray-200 hover:border-blue-300 hover:scale-[1.02]'
                      : 'bg-gray-100 border-gray-200 opacity-60'
                  }`}
                >
                  {discovered ? (
                    <>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xl">🎁</span>
                        <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                          <span className="font-bold text-sm text-gray-800">{item.name}</span>
                          <span
                            className="text-xs px-1.5 py-0.5 rounded text-white font-medium"
                            style={{ backgroundColor: color }}
                          >
                            {rarityName}
                          </span>
                          {owned && (
                            <span className="text-[10px] px-1 rounded bg-blue-100 text-blue-600">
                              拥有: {novelties[item.name]}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-gray-600">{item.desc}</div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-20 text-gray-400 text-lg font-mono gap-1">
                      <span className="text-2xl opacity-40">🎁</span>
                      未发现
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 植物 Tab */}
        {activeTab === 'plant' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {PLANTS_CATALOG.map((plant) => {
              const discovered = discoveredPlants.includes(plant.id);
              const color = PLANT_RARITY_COLORS[plant.rarity] ?? '#888';
              const rarityName = PLANT_RARITY_NAMES[plant.rarity] ?? '普通';
              return (
                <div
                  key={plant.id}
                  className={`rounded-lg border p-3 transition-all duration-200 hover:shadow-md ${
                    discovered
                      ? 'bg-white border-gray-200 hover:border-blue-300 hover:scale-[1.02]'
                      : 'bg-gray-100 border-gray-200 opacity-60'
                  }`}
                >
                  {discovered ? (
                    <>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xl">{plant.icon}</span>
                        <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                          <span className="font-bold text-sm text-gray-800">{plant.name}</span>
                          <span
                            className="text-xs px-1.5 py-0.5 rounded text-white font-medium"
                            style={{ backgroundColor: color }}
                          >
                            {rarityName}
                          </span>
                        </div>
                      </div>
                      <div className="text-xs text-gray-600">{plant.desc}</div>
                      <div className="text-[10px] text-gray-400 mt-1">
                        生长: {plant.growTimeS}s | 收获: {plant.harvestGold}G
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-20 text-gray-400 text-lg font-mono gap-1">
                      <span className="text-2xl opacity-40">{plant.icon}</span>
                      未种植
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 动物 Tab */}
        {activeTab === 'creature' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {RANCH_CATALOG.map((creature) => {
              const discovered = discoveredCreatures.includes(creature.id);
              const color = PLANT_RARITY_COLORS[creature.rarity] ?? '#888';
              const rarityName = PLANT_RARITY_NAMES[creature.rarity] ?? '普通';
              return (
                <div
                  key={creature.id}
                  className={`rounded-lg border p-3 transition-all duration-200 hover:shadow-md ${
                    discovered
                      ? 'bg-white border-gray-200 hover:border-blue-300 hover:scale-[1.02]'
                      : 'bg-gray-100 border-gray-200 opacity-60'
                  }`}
                >
                  {discovered ? (
                    <>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xl">{creature.icon}</span>
                        <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                          <span className="font-bold text-sm text-gray-800">{creature.name}</span>
                          <span
                            className="text-xs px-1.5 py-0.5 rounded text-white font-medium"
                            style={{ backgroundColor: color }}
                          >
                            {rarityName}
                          </span>
                        </div>
                      </div>
                      <div className="text-xs text-gray-600">{creature.desc}</div>
                      <div className="text-[10px] text-gray-400 mt-1">
                        产出: {creature.outputType} | 性格: {creature.personality}
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-20 text-gray-400 text-lg font-mono gap-1">
                      <span className="text-2xl opacity-40">{creature.icon}</span>
                      未饲养
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Tooltip.Provider>
  );
};
