import React, { useState, useCallback, useMemo } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { useInventoryStore } from '../../store/useInventoryStore';
import { useForgeStore } from '../../store/useForgeStore';
import { FORGE_RECIPES, FORTIFY_CONFIG, FORGE_RARITY_COLORS, SET_EFFECTS } from '../../data/forge';
import type { Equipment, FortifyConfig as FortifyConfigType } from '../../types';

// 强化配置按等级索引（1-based）
const FORTIFY_BY_LEVEL = new Map<number, FortifyConfigType>(
  FORTIFY_CONFIG.map(c => [c.level, c])
);

const RARITY_NAMES = ['白', '绿', '蓝', '紫', '橙'];

export const ForgeTab: React.FC = () => {
  const hero = useGameStore(s => s.hero);
  const addGold = useGameStore(s => s.addGold);
  const setHp = useGameStore(s => s.setHp);
  const { weapons, armors, materials, removeMaterial } = useInventoryStore();
  const { selectedEquip, fortifyLevel, useCharm, isForging, forgeLogs,
          selectEquip, setFortifyLevel, toggleCharm, setForging, addForgeLog, clearForgeLogs } = useForgeStore();

  const [tab, setTab] = useState<'fortify' | 'forge'>('fortify');
  const [msg, setMsg] = useState<string | null>(null);
  const [forgeFilter, setForgeFilter] = useState<'all' | 'weapon' | 'armor'>('all');

  const allEquips = [...weapons, ...armors];
  const currentFortify = selectedEquip ? FORTIFY_BY_LEVEL.get((selectedEquip.fortifyLevel ?? 0) + 1) : null;

  // 强化
  const handleFortify = useCallback(() => {
    if (!selectedEquip || isForging) return;
    const curLv = selectedEquip.fortifyLevel ?? 0;
    if (curLv >= 10) { setMsg('⚠️ 已达最高强化等级+10'); setTimeout(() => setMsg(null), 2000); return; }
    if (!currentFortify) return;

    const ironCost = currentFortify.ironCost;
    const goldCost = currentFortify.goldCost;
    const charmIron = useCharm ? 50 : 0;
    const charmGold = useCharm ? 500 : 0;
    const totalIron = ironCost + charmIron;
    const totalGold = goldCost + charmGold;

    if ((hero.gold ?? 0) < totalGold) { setMsg('⚠️ 金币不足'); useGameStore.getState().addGameLog(`锻造失败: 金币不足(需要${totalGold}G)`); setTimeout(() => setMsg(null), 2000); return; }
    if ((materials['铁矿'] ?? 0) < totalIron) { setMsg('⚠️ 铁矿不足'); useGameStore.getState().addGameLog(`锻造失败: 铁矿不足(需要${totalIron})`); setTimeout(() => setMsg(null), 2000); return; }

    setForging(true);
    // 扣费
    addGold(-totalGold);
    removeMaterial('铁矿', totalIron);

    const success = Math.random() < currentFortify.successRate;
    let resultMsg = '';

    if (success) {
      const newLv = curLv + 1;
      resultMsg = `✅ 强化成功！${selectedEquip.name} +${newLv}（${currentFortify.bonusPct}%）`;
      // 更新装备强化等级（直接修改对象）
      (selectedEquip as any).fortifyLevel = newLv;
      selectEquip({ ...selectedEquip });
    } else {
      if (useCharm) {
        resultMsg = `❌ 强化失败！护锻符保护，保持 +${curLv}`;
      } else if (curLv > 5) {
        const newLv = curLv - 1;
        resultMsg = `❌ 强化失败！掉回 +${newLv}`;
        (selectedEquip as any).fortifyLevel = newLv;
        selectEquip({ ...selectedEquip });
      } else {
        resultMsg = `❌ 强化失败！保持 +${curLv}`;
      }
    }

    setMsg(resultMsg);
    addForgeLog(resultMsg);
    setForging(false);
    setTimeout(() => setMsg(null), 3000);
  }, [selectedEquip, isForging, currentFortify, useCharm, hero.gold, materials, addGold, removeMaterial, selectEquip, setForging, addForgeLog]);

  // 锻造
  const canForge = useCallback((recipe: typeof FORGE_RECIPES[0]): { ok: boolean; reason?: string } => {
    const matCount = materials[recipe.material] ?? 0;
    if (matCount < recipe.materialCount) return { ok: false, reason: `${recipe.material}不足（需要${recipe.materialCount}，现有${matCount}）` };
    if ((materials['铁矿'] ?? 0) < recipe.iron) return { ok: false, reason: `铁矿不足（需要${recipe.iron}）` };
    if ((hero.gold ?? 0) < recipe.gold) return { ok: false, reason: `金币不足（需要${recipe.gold}）` };
    const totalEquips = weapons.length + armors.length;
    if (totalEquips >= 20) return { ok: false, reason: '背包已满（最多20件）' };
    return { ok: true };
  }, [materials, hero.gold, weapons.length, armors.length]);

  const handleForge = useCallback((recipe: typeof FORGE_RECIPES[0]) => {
    const check = canForge(recipe);
    if (!check.ok) { setMsg(`⚠️ ${check.reason}`); setTimeout(() => setMsg(null), 2500); return; }

    // 扣材料
    removeMaterial(recipe.material, recipe.materialCount);
    removeMaterial('铁矿', recipe.iron);
    addGold(-recipe.gold);

    // 生成装备
    const equipId = `forge_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const newEquip: Equipment = {
      id: equipId,
      type: recipe.type,
      name: recipe.name,
      tier: recipe.rarity,
      rarity: recipe.rarity as any,
      rarityColor: FORGE_RARITY_COLORS[recipe.rarity] ?? '#ccc',
      stats: recipe.stats,
      fortifyLevel: 0,
      cost: { '金币': Math.floor(recipe.gold / 2) },
      sellPrice: Math.floor(recipe.gold / 2),
      isPerfect: false,
    };

    // 存入背包
    if (recipe.type === 'weapon') {
      useInventoryStore.setState(s => ({ weapons: [...s.weapons, newEquip] }));
    } else {
      useInventoryStore.setState(s => ({ armors: [...s.armors, newEquip] }));
    }

    const msgText = `✅ 锻造成功！获得 ${recipe.name}`;
    setMsg(msgText);
    addForgeLog(msgText);
    setTimeout(() => setMsg(null), 3000);
  }, [canForge, removeMaterial, addGold]);

  // 锻造配方过滤
  const filteredRecipes = useMemo(() => {
    if (forgeFilter === 'all') return FORGE_RECIPES;
    return FORGE_RECIPES.filter(r => r.type === forgeFilter);
  }, [forgeFilter]);

  const fortifyBonus = currentFortify ? `${currentFortify.bonusPct}%` : '—';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-gray-700">🔨 锻造</h2>
        <div className="flex gap-1">
          {(['fortify', 'forge'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors ${tab === t ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
              {t === 'fortify' ? '强化' : '锻造'}
            </button>
          ))}
        </div>
      </div>

      {msg && <div className="px-3 py-1.5 bg-gray-100 rounded text-sm text-center">{msg}</div>}

      {/* ═══ 强化 ═══ */}
      {tab === 'fortify' && (
        <div className="space-y-3">
          {/* 选择装备 */}
          <div>
            <div className="text-[10px] text-gray-400 mb-1">选择装备</div>
            <div className="grid grid-cols-4 gap-1.5">
              {allEquips.map(eq => {
                const isSel = selectedEquip?.id === eq.id;
                const lv = eq.fortifyLevel ?? 0;
                return (
                  <button key={eq.id} onClick={() => selectEquip(eq)}
                    className={`p-1.5 border rounded-lg text-center transition-colors ${isSel ? 'border-orange-400 bg-orange-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                    <div className="text-[10px] font-medium truncate" style={{ color: eq.rarityColor ?? '#888' }}>{eq.name}</div>
                    <div className="text-[9px] text-gray-400">+{lv}</div>
                  </button>
                );
              })}
              {allEquips.length === 0 && <div className="col-span-4 text-[10px] text-gray-400 text-center py-2">背包为空</div>}
            </div>
          </div>

          {/* 强化信息 */}
          {selectedEquip && currentFortify && (
            <div className="p-2 border border-orange-200 rounded-lg bg-orange-50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-orange-800">{selectedEquip.name} +{selectedEquip.fortifyLevel ?? 0}</span>
                <span className="text-[10px] text-orange-500">→ +{(selectedEquip.fortifyLevel ?? 0) + 1}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-[10px]">
                <div className="text-center">
                  <div className="text-gray-400">属性加成</div>
                  <div className="font-medium text-orange-600">+{currentFortify.bonusPct}%</div>
                </div>
                <div className="text-center">
                  <div className="text-gray-400">成功率</div>
                  <div className="font-medium text-green-600">{(currentFortify.successRate * 100).toFixed(0)}%</div>
                </div>
                <div className="text-center">
                  <div className="text-gray-400">费用</div>
                  <div className="font-medium text-yellow-600">🪨{currentFortify.ironCost} 💰{currentFortify.goldCost}</div>
                </div>
              </div>

              {/* 护锻符 */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1 text-[10px] text-gray-600">
                  <input type="checkbox" checked={useCharm} onChange={toggleCharm} className="rounded" />
                  使用护锻符（失败不掉级）
                </label>
                {useCharm && <span className="text-[10px] text-red-500">+🪨50 +💰500</span>}
              </div>

              <button onClick={handleFortify} disabled={isForging}
                className="w-full py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-full text-xs font-medium transition-colors disabled:bg-gray-300">
                {isForging ? '强化中...' : `强化 +${(selectedEquip.fortifyLevel ?? 0) + 1}`}
              </button>
            </div>
          )}

          {/* 强化配置表 */}
          <div>
            <div className="text-[10px] text-gray-400 mb-1">强化等级表</div>
            <div className="space-y-0.5 max-h-40 overflow-y-auto">
              {FORTIFY_CONFIG.slice(0, 10).map(cfg => (
                <div key={cfg.level} className="flex items-center justify-between text-[10px] px-2 py-0.5 bg-gray-50 rounded">
                  <span className="w-8">+{cfg.level}</span>
                  <span className="w-10 text-center">+{cfg.bonusPct}%</span>
                  <span className="w-12 text-center text-yellow-600">🪨{cfg.ironCost}</span>
                  <span className="w-12 text-center text-yellow-600">💰{cfg.goldCost}</span>
                  <span className={`w-10 text-right ${cfg.successRate >= 0.5 ? 'text-green-600' : cfg.successRate >= 0.2 ? 'text-yellow-600' : 'text-red-500'}`}>{(cfg.successRate * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ 锻造 ═══ */}
      {tab === 'forge' && (
        <div className="space-y-3">
          {/* 过滤栏 */}
          <div className="flex gap-1">
            {(['all', 'weapon', 'armor'] as const).map(f => (
              <button key={f} onClick={() => setForgeFilter(f)}
                className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors ${forgeFilter === f ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                {f === 'all' ? '全部' : f === 'weapon' ? '武器' : '防具'}
              </button>
            ))}
          </div>

          {/* 配方列表 */}
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {filteredRecipes.map(recipe => {
              const check = canForge(recipe);
              const color = FORGE_RARITY_COLORS[recipe.rarity] ?? '#ccc';
              const rName = RARITY_NAMES[recipe.rarity] ?? '白';
              return (
                <div key={recipe.name} className="p-2 border border-gray-200 rounded-lg bg-white space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">{recipe.type === 'weapon' ? '🗡️' : '🛡️'}</span>
                      <span className="text-xs font-medium" style={{ color }}>{recipe.name}</span>
                      <span className="text-[9px] px-1 rounded bg-gray-100 text-gray-500">{rName}</span>
                    </div>
                    <button onClick={() => handleForge(recipe)} disabled={!check.ok}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors ${check.ok ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
                      锻造
                    </button>
                  </div>
                  {/* 属性 */}
                  <div className="flex gap-2 text-[10px] text-gray-500 flex-wrap">
                    {recipe.stats.atk && <span>ATK+{recipe.stats.atk}</span>}
                    {recipe.stats.def && <span>DEF+{recipe.stats.def}</span>}
                    {recipe.stats.hp && <span>HP+{recipe.stats.hp}</span>}
                    {recipe.stats.crit && <span>暴击+{(recipe.stats.crit * 100).toFixed(0)}%</span>}
                  </div>
                  {/* 需求 */}
                  <div className="flex gap-2 text-[10px] text-gray-400">
                    <span>{recipe.material}×{recipe.materialCount}</span>
                    <span>🪨{recipe.iron}</span>
                    <span>💰{recipe.gold}</span>
                  </div>
                  {/* 被动 */}
                  {recipe.passive && recipe.passive.name !== '无' && (
                    <div className="text-[10px] text-purple-500">✦ {recipe.passive.name}：{recipe.passive.desc}</div>
                  )}
                  {!check.ok && <div className="text-[10px] text-red-400">{check.reason}</div>}
                </div>
              );
            })}
          </div>

          {/* 套装效果 */}
          {Object.keys(SET_EFFECTS).length > 0 && (
            <div>
              <div className="text-[10px] text-gray-400 mb-1">套装效果</div>
              <div className="space-y-1">
                {Object.entries(SET_EFFECTS).map(([setName, effect]) => (
                  <div key={setName} className="p-1.5 bg-purple-50 rounded text-[10px]">
                    <div className="font-medium text-purple-700">{setName}</div>
                    <div className="text-purple-500">{effect.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 日志 */}
      {forgeLogs.length > 0 && (
        <div>
          <div className="flex items-center justify-between">
            <div className="text-[10px] text-gray-400">锻造日志</div>
            <button onClick={clearForgeLogs} className="text-[10px] text-gray-400 hover:text-gray-600">清空</button>
          </div>
          <div className="space-y-0.5 max-h-24 overflow-y-auto">
            {forgeLogs.slice(-10).map((log, i) => (
              <div key={i} className="text-[10px] text-gray-500 px-1">{log}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
