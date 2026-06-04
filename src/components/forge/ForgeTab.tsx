import React, { useState } from 'react';
import { FORGE_RECIPES, FORTIFY_CONFIG, SET_EFFECTS, FORGE_RARITY_COLORS } from '../../data/forge';
import { useForgeStore } from '../../store/useForgeStore';
import { useInventoryStore } from '../../store/useInventoryStore';
import { useGameStore } from '../../store/useGameStore';
import { RarityBadge } from '../shared/RarityBadge';
import { RARITY_COLORS, RARITY_NAMES, formatNumber } from '../../data/constants';

type ForgeMode = 'fortify' | 'craft';

export const ForgeTab: React.FC = () => {
  const [mode, setMode] = useState<ForgeMode>('fortify');
  const { selectedEquip, fortifyLevel, useCharm, forgeLogs } = useForgeStore();
  const hero = useGameStore((s) => s.hero);
  const weapons = useInventoryStore((s) => s.weapons);
  const armors = useInventoryStore((s) => s.armors);
  const materials = useInventoryStore((s) => s.materials);

  const allEquips = [...weapons, ...armors];

  // Forge recipes grouped by rarity
  const rarityGroups = [0, 1, 2, 3, 4];
  const rarityLabels: Record<number, string> = { 0: '普通', 1: '少见', 2: '稀有', 3: '珍藏', 4: '传说' };

  const currentFortifyInfo = fortifyLevel < 10 ? FORTIFY_CONFIG[fortifyLevel] : null;
  const nextLevel = fortifyLevel + 1;

  return (
    <div className="space-y-6">
      <h2 className="text-amber-300 font-bold text-lg">🔨 锻造</h2>

      {/* Mode switch */}
      <div className="flex gap-2">
        <button
          onClick={() => setMode('fortify')}
          className={`px-4 py-2 rounded text-sm font-bold ${
            mode === 'fortify' ? 'bg-amber-700 text-amber-100' : 'bg-slate-800 text-amber-200/50'
          }`}
        >
          ⚡ 强化
        </button>
        <button
          onClick={() => setMode('craft')}
          className={`px-4 py-2 rounded text-sm font-bold ${
            mode === 'craft' ? 'bg-amber-700 text-amber-100' : 'bg-slate-800 text-amber-200/50'
          }`}
        >
          🔨 专属锻造
        </button>
      </div>

      {mode === 'fortify' && (
        <>
          {/* Equipment selector */}
          <div>
            <h3 className="text-amber-400/80 font-bold text-sm mb-2">选择装备强化</h3>
            {allEquips.length === 0 ? (
              <div className="text-amber-200/30 text-sm text-center py-4">背包中没有可强化的装备</div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {allEquips.map((e, i) => (
                  <div
                    key={`${e.id}-${i}`}
                    onClick={() => useForgeStore.getState().selectEquip(e)}
                    className={`border rounded p-2 cursor-pointer transition-colors ${
                      selectedEquip?.id === e.id
                        ? 'border-amber-500 bg-amber-950/30'
                        : 'border-amber-900/30 bg-slate-900/60 hover:border-amber-700/50'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-sm" style={{ color: e.rarityColor || RARITY_COLORS[e.rarity] }}>
                        {e.name}
                      </span>
                      {e.fortifyLevel ? <span className="text-yellow-400 text-xs">+{e.fortifyLevel}</span> : null}
                    </div>
                    <div className="text-xs text-amber-200/50">
                      {e.attack ? `ATK+${e.attack} ` : ''}{e.defense ? `DEF+${e.defense}` : ''}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Fortify panel */}
          {selectedEquip && (
            <div className="border border-amber-700/40 rounded-lg p-4 bg-slate-900/60">
              <div className="flex items-center gap-2 mb-3">
                <span className="font-bold" style={{ color: selectedEquip.rarityColor || RARITY_COLORS[selectedEquip.rarity] }}>
                  {selectedEquip.name}
                </span>
                {fortifyLevel > 0 && <span className="text-yellow-400 font-bold">+{fortifyLevel}</span>}
              </div>

              {currentFortifyInfo ? (
                <>
                  <div className="text-sm text-amber-200/80 mb-2">
                    强化至 +{nextLevel}：属性 +{currentFortifyInfo.bonusPct}%
                  </div>
                  <div className="text-xs text-amber-200/50 space-y-1 mb-3">
                    <div>铁矿: {currentFortifyInfo.ironCost}（拥有: {materials['铁矿'] ?? 0}）</div>
                    <div>金币: {currentFortifyInfo.goldCost}（拥有: {formatNumber(hero.gold)}）</div>
                    <div>成功率: <span className={currentFortifyInfo.successRate >= 0.5 ? 'text-green-400' : 'text-red-400'}>
                      {(currentFortifyInfo.successRate * 100).toFixed(0)}%
                    </span></div>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <label className="flex items-center gap-1 text-xs text-amber-200/60">
                      <input
                        type="checkbox"
                        checked={useCharm}
                        onChange={() => useForgeStore.getState().toggleCharm()}
                      />
                      护锻符（失败不降级，额外铁矿×50 金币×500）
                    </label>
                  </div>

                  <button className="w-full py-2 rounded bg-red-800 hover:bg-red-700 text-white font-bold">
                    ⚡ 强化 +{nextLevel}
                  </button>
                </>
              ) : (
                <div className="text-amber-200/50 text-sm">已达最高强化等级</div>
              )}
            </div>
          )}

          {/* Fortify config reference */}
          <div>
            <h3 className="text-amber-400/80 font-bold text-sm mb-2 border-b border-amber-900/30 pb-1">
              强化概率表
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-amber-200/50 border-b border-amber-900/20">
                    <th className="py-1 text-left">等级</th>
                    <th className="py-1 text-right">加成</th>
                    <th className="py-1 text-right">铁矿</th>
                    <th className="py-1 text-right">金币</th>
                    <th className="py-1 text-right">成功率</th>
                  </tr>
                </thead>
                <tbody>
                  {FORTIFY_CONFIG.map((c) => (
                    <tr key={c.level} className="border-b border-amber-900/10">
                      <td className="py-1 text-amber-200">+{c.level}</td>
                      <td className="py-1 text-right text-amber-200/60">+{c.bonusPct}%</td>
                      <td className="py-1 text-right text-amber-200/60">{c.ironCost}</td>
                      <td className="py-1 text-right text-amber-200/60">{formatNumber(c.goldCost)}</td>
                      <td className={`py-1 text-right ${c.successRate >= 0.5 ? 'text-green-400' : 'text-red-400'}`}>
                        {(c.successRate * 100).toFixed(0)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {mode === 'craft' && (
        <>
          {/* Forge recipes by rarity */}
          {rarityGroups.map((rarity) => {
            const recipes = FORGE_RECIPES.filter((r) => r.rarity === rarity);
            if (recipes.length === 0) return null;
            return (
              <div key={rarity}>
                <div className="flex items-center gap-2 mb-2">
                  <RarityBadge rarity={rarity} size="md" />
                  <span className="text-sm text-amber-200/60">{rarityLabels[rarity]}配方</span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {recipes.map((recipe) => {
                    const hasMaterial = (materials[recipe.material] ?? 0) >= recipe.materialCount;
                    const hasIron = (materials['铁矿'] ?? 0) >= recipe.iron;
                    const hasGold = hero.gold >= recipe.gold;
                    const canForge = hasMaterial && hasIron && hasGold;

                    return (
                      <div key={recipe.name} className="border border-amber-900/30 rounded-lg p-3 bg-slate-900/60">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold" style={{ color: FORGE_RARITY_COLORS[rarity] }}>
                              {recipe.name}
                            </span>
                            <span className="text-xs text-amber-200/40">{recipe.type === 'weapon' ? '⚔' : '🛡'}</span>
                            {recipe.forgeSet && (
                              <span className="text-xs text-purple-300/60">[{recipe.forgeSet}]</span>
                            )}
                          </div>
                          <button
                            disabled={!canForge}
                            className={`px-3 py-1 rounded text-xs font-bold ${
                              canForge
                                ? 'bg-amber-700 hover:bg-amber-600 text-amber-100'
                                : 'bg-slate-800 text-amber-200/30 cursor-not-allowed'
                            }`}
                          >
                            锻造
                          </button>
                        </div>

                        {/* Stats */}
                        <div className="text-xs text-amber-200/50 mb-1">
                          {recipe.stats.atk ? `ATK+${recipe.stats.atk} ` : ''}
                          {recipe.stats.def ? `DEF+${recipe.stats.def} ` : ''}
                          {recipe.stats.hp ? `HP+${recipe.stats.hp} ` : ''}
                          {recipe.stats.crit ? `CRIT+${(recipe.stats.crit * 100).toFixed(0)}% ` : ''}
                        </div>

                        {/* Passive */}
                        <div className="text-xs text-purple-300/60 mb-2">
                          🌟 {recipe.passive.name}: {recipe.passive.desc}
                        </div>

                        {/* Cost */}
                        <div className="flex gap-3 text-xs text-amber-200/40">
                          <span className={hasMaterial ? 'text-green-400/60' : 'text-red-400/60'}>
                            {recipe.material}×{recipe.materialCount}
                          </span>
                          <span className={hasIron ? 'text-green-400/60' : 'text-red-400/60'}>
                            铁矿×{recipe.iron}
                          </span>
                          <span className={hasGold ? 'text-green-400/60' : 'text-red-400/60'}>
                            💰{formatNumber(recipe.gold)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Set effects */}
          {Object.keys(SET_EFFECTS).length > 0 && (
            <div>
              <h3 className="text-amber-400/80 font-bold text-sm mb-2 border-b border-amber-900/30 pb-1">
                套装效果
              </h3>
              {Object.entries(SET_EFFECTS).map(([setName, setData]) => (
                <div key={setName} className="border border-purple-800/30 rounded-lg p-3 bg-slate-900/40 mb-2">
                  <div className="font-bold text-sm text-purple-300 mb-2">{setName}</div>
                  <div className="text-xs text-amber-200/50 mb-1">
                    包含: {setData.pieces.join('、')}
                  </div>
                  {Object.entries(setData.effects).map(([threshold, effect]) => (
                    <div key={threshold} className="text-xs text-purple-200/60">
                      {threshold}件: {effect.name} — {effect.desc}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Forge logs */}
      {forgeLogs.length > 0 && (
        <div>
          <h3 className="text-amber-400/80 font-bold text-sm mb-2 border-b border-amber-900/30 pb-1">
            锻造日志
          </h3>
          <div className="max-h-32 overflow-y-auto text-xs space-y-0.5">
            {forgeLogs.map((log, i) => (
              <div key={i} className="text-amber-200/50">{log}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
