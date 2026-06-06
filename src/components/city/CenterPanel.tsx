/**
 * CenterPanel - 中间面板：队伍标签 + 英雄属性 + 地图选择 + 战斗
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { MAPS } from '../../data/maps';
import { formatNumber } from '../../data/constants';
import { RARITY_NAME, RARITY_COLOR } from '../../types';
import type { Monster } from '../../types';
import type { BattleLog, Rewards } from '../../engine/Combat';
import { FaSkullCrossbones, FaBomb, FaShield, FaUsers } from 'react-icons/fa6';

type TeamTab = 'hero' | 'teammate' | 'all';
type BattlePhase = 'idle' | 'fighting' | 'result';

interface BattleResult {
  victory: boolean;
  logs: BattleLog[];
  rewards: Rewards;
  monsterName: string;
}

const EMPTY_LOGS: BattleLog[] = [];

export const CenterPanel: React.FC = () => {
  const hero = useGameStore((s) => s.hero);
  const currentMapId = useGameStore((s) => s.currentMapId);
  const setCurrentMapId = useGameStore((s) => s.setCurrentMap);
  const unlockedMaps = useGameStore((s) => s.unlockedMaps);
  const currentEnemies = useGameStore((s) => s.currentEnemies);
  const refreshEnemies = useGameStore((s) => s.refreshEnemies);
  const fightMonster = useGameStore((s) => s.fightMonster);
  const addGold = useGameStore((s) => s.addGold);
  const addExp = useGameStore((s) => s.addExp);
  const setHp = useGameStore((s) => s.setHp);
  const addResource = useGameStore((s) => s.addResource);

  const [teamTab, setTeamTab] = useState<TeamTab>('hero');
  const [battlePhase, setBattlePhase] = useState<BattlePhase>('idle');
  const [battleLogs, setBattleLogs] = useState<BattleLog[]>(EMPTY_LOGS);
  const [battleResult, setBattleResult] = useState<BattleResult | null>(null);
  const [fightingMonster, setFightingMonster] = useState<Monster | null>(null);
  const logsRef = useRef<HTMLDivElement>(null);
  const animTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup animation timer on unmount / phase change
  const clearAnimTimer = useCallback(() => {
    if (animTimerRef.current !== null) {
      clearInterval(animTimerRef.current);
      animTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => clearAnimTimer();
  }, [clearAnimTimer]);

  // Auto-scroll battle logs
  useEffect(() => {
    if (logsRef.current && battleLogs.length > 0) {
      logsRef.current.scrollTop = logsRef.current.scrollHeight;
    }
  }, [battleLogs]);

  const resetBattleState = useCallback(() => {
    clearAnimTimer();
    setBattlePhase('idle');
    setBattleLogs(EMPTY_LOGS);
    setBattleResult(null);
    setFightingMonster(null);
  }, [clearAnimTimer]);

  const handleSelectMap = (mapId: string) => {
    if (unlockedMaps.includes(mapId)) {
      setCurrentMapId(mapId);
      resetBattleState();
    }
  };

  const handleUnlockMap = (map: typeof MAPS[number]) => {
    if (unlockedMaps.includes(map.id)) return;
    if (hero.gold < map.unlockCost) {
      useGameStore.getState().addGameLog(`金币不足! 解锁${map.name}需要 ${map.unlockCost}G`);
      return;
    }
    useGameStore.getState().addGold(-map.unlockCost);
    useGameStore.getState().unlockMap(map.id);
  };

  const handleRefreshEnemies = () => {
    refreshEnemies();
    resetBattleState();
  };

  const handleFight = useCallback((monster: Monster) => {
    if (hero.hp <= 0) return;

    // Clear any running animation
    clearAnimTimer();

    // Set fighting state atomically
    setFightingMonster(monster);
    setBattlePhase('fighting');
    setBattleLogs(EMPTY_LOGS);
    setBattleResult(null);

    try {
      // Run battle synchronously
      const result = fightMonster(monster);
      if (!result || !result.logs) {
        throw new Error('Invalid battle result');
      }

      // Apply results to game state
      if (result.victory) {
        addGold(result.rewards?.gold ?? 0);
        addExp(result.rewards?.exp ?? 0);
        setHp(result.heroFinalHp ?? hero.hp);
        if (result.rewards?.drops) {
          for (const drop of result.rewards.drops) {
            if (drop && drop.itemId) {
              addResource(drop.itemId, drop.quantity ?? 1);
            }
          }
        }
      } else {
        setHp(0);
      }

      // Animate battle logs line by line
      const logs = result.logs;
      let lineIdx = 0;
      animTimerRef.current = setInterval(() => {
        if (lineIdx < logs.length) {
          setBattleLogs((prev) => {
            // Safety: don't exceed logs length
            if (lineIdx >= logs.length) return prev;
            const newLogs = [...prev, logs[lineIdx]];
            return newLogs;
          });
          lineIdx++;
        } else {
          clearAnimTimer();
          setBattleResult({
            victory: result.victory,
            logs: result.logs,
            rewards: result.rewards,
            monsterName: monster.name,
          });
          setBattlePhase('result');
        }
      }, 180);
    } catch (err) {
      console.error('Battle error:', err);
      resetBattleState();
    }
  }, [hero.hp, fightMonster, addGold, addExp, setHp, addResource, clearAnimTimer, resetBattleState]);

  const handleConfirmResult = () => {
    resetBattleState();
  };

  const currentMap = MAPS.find(m => m.id === currentMapId);

  // Safe rarity helpers
  const getRarityColor = (r: number | undefined): string => {
    if (r === undefined || r === null) return '#C0C0C0';
    return (RARITY_COLOR as Record<number, string>)[r] ?? '#C0C0C0';
  };
  const getRarityName = (r: number | undefined): string => {
    if (r === undefined || r === null) return '';
    return (RARITY_NAME as Record<number, string>)[r] ?? '';
  };

  return (
    <div className="h-full overflow-y-auto p-3 space-y-3">
      {/* 队伍标签栏 */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold text-gray-700 flex items-center gap-1"><FaUsers /> 队伍</span>
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
        <div className="ml-auto flex gap-1.5">
          <div className="w-8 h-8 rounded border border-gray-300 flex items-center justify-center text-xs text-gray-400" title="武器">
            <FaBomb />
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
        <div className="space-y-0.5 text-sm">
          <div className="flex"><span className="text-gray-500 w-14">生命:</span>
            <span className={hero.hp < hero.maxHp * 0.3 ? 'text-red-600 font-bold' : ''}>
              {hero.hp}/{hero.maxHp}
            </span>
          </div>
          <div className="flex"><span className="text-gray-500 w-14">攻击:</span><span className="text-red-600 font-medium">{hero.atk}</span></div>
          <div className="flex"><span className="text-gray-500 w-14">防御:</span><span className="text-blue-600 font-medium">{hero.def}</span></div>
          <div className="flex"><span className="text-gray-500 w-14">CRIT:</span><span>{(hero.critRate * 100).toFixed(0)}%</span></div>
          <div className="flex"><span className="text-gray-500 w-14">经验:</span><span>{formatNumber(hero.exp)}/{hero.level * 100}</span></div>
          <div className="flex"><span className="text-gray-500 w-14">武器:</span><span className="text-gray-600">{hero.weapon?.name ?? '空手'}</span></div>
          <div className="flex"><span className="text-gray-500 w-14">护甲:</span><span className="text-gray-600">{hero.armor?.name ?? '布衣'}</span></div>
        </div>
      </div>

      {/* 药水栏 */}
      <div className="p-2 border border-amber-200 rounded-lg bg-amber-50">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-amber-700">💊 药水</span>
          <span className="text-xs font-bold text-amber-800">x{hero.potions ?? 0}</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { if (!useGameStore.getState().buyPotion()) alert('金币不足！'); }}
            className="flex-1 py-1 bg-amber-400 hover:bg-amber-500 text-white rounded text-[11px] font-medium transition-colors"
          >购买 (25G)</button>
          <button
            onClick={() => { if (!useGameStore.getState().usePotion()) alert((hero.potions ?? 0) <= 0 ? '没有药水！' : 'HP已满！'); }}
            disabled={(hero.potions ?? 0) <= 0 || hero.hp >= hero.maxHp}
            className={`flex-1 py-1 rounded text-[11px] font-medium transition-colors ${(hero.potions ?? 0) <= 0 || hero.hp >= hero.maxHp ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600 text-white'}`}
          >使用 +20HP</button>
        </div>
        {/* 自动喝药阈值 */}
        <div className="flex items-center gap-1.5 mt-1.5">
          <span className="text-[10px] text-amber-600">自动喝药：</span>
          {[0, 30, 50, 80].map((v) => (
            <button
              key={v}
              onClick={() => useGameStore.getState().setAutoPotionThreshold(v)}
              className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors ${useGameStore.getState().autoPotionThreshold === v ? 'bg-amber-600 text-white' : 'bg-amber-100 text-amber-700 hover:bg-amber-200'}`}
            >{v === 0 ? '关' : `${v}%`}</button>
          ))}
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
                disabled={!isUnlocked && hero.gold < map.unlockCost}
              >
                {map.name}{!isUnlocked ? ` (${formatNumber(map.unlockCost)}G)` : ''}
              </button>
            );
          })}
        </div>
      </div>

      {/* 战斗区域 */}
      <div>
        <div className="flex items-center gap-1 mb-2">
          <FaSkullCrossbones className="text-gray-600" />
          <span className="text-sm font-bold text-gray-700">敌人</span>
        </div>

        {/* 刷新按钮 */}
        <button
          onClick={handleRefreshEnemies}
          disabled={battlePhase === 'fighting'}
          className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded text-sm text-blue-700 transition-colors disabled:opacity-50"
        >
          🔄 刷新敌人
        </button>

        {/* 战斗日志 / 结果区 */}
        {battlePhase !== 'idle' && (
          <div className="mt-2 border border-gray-200 rounded-lg overflow-hidden">
            {/* 战斗中的 HP 条 */}
            {fightingMonster && battlePhase === 'fighting' && (
              <div className="p-2 bg-gray-50 border-b border-gray-200 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-blue-700">🧙 {hero.name}</span>
                  <span className="text-gray-500">HP {hero.hp} / {hero.maxHp}</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 transition-all duration-300"
                    style={{ width: `${Math.max(0, (hero.hp / Math.max(1, hero.maxHp)) * 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-red-700">
                    {fightingMonster?.isBoss ? '👑 ' : ''}{fightingMonster?.name ?? '???'}
                  </span>
                  <span className="text-gray-500">HP {fightingMonster?.hp ?? 0}</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-red-500 transition-all duration-300" style={{ width: '100%' }} />
                </div>
              </div>
            )}

            {/* 战斗日志滚动区 */}
            <div
              ref={logsRef}
              className="p-2 space-y-0.5 max-h-40 overflow-y-auto bg-gray-900 text-xs font-mono"
            >
              {(battleLogs.length > 0 ? battleLogs : (battlePhase === 'fighting' ? [{ round: 0, attacker: '', defender: '', damage: 0, isCrit: false, description: '准备战斗...' }] : [])).map((log, i) => (
                <div
                  key={i}
                  className={`${
                    log.isCrit ? 'text-yellow-300' : log.damage === 0 ? 'text-cyan-300 font-bold' : 'text-green-300'
                  }`}
                >
                  {log.description}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 战斗结果 */}
        {battlePhase === 'result' && battleResult && (
          <div className={`mt-2 p-3 rounded-lg border-2 ${
            battleResult.victory
              ? 'bg-green-50 border-green-400'
              : 'bg-red-50 border-red-400'
          }`}>
            <div className="text-lg font-bold mb-2">
              {battleResult.victory ? '🎉 战斗胜利！' : '💀 战斗失败...'}
            </div>

            {battleResult.victory && (
              <div className="space-y-1 text-sm mb-2">
                <div className="flex gap-3">
                  <span>⭐ 经验 +{formatNumber(battleResult.rewards?.exp ?? 0)}</span>
                  <span>💰 金币 +{formatNumber(battleResult.rewards?.gold ?? 0)}</span>
                </div>
                {(battleResult.rewards?.drops?.length ?? 0) > 0 && (
                  <div>
                    <div className="text-gray-600 text-xs mb-1">📦 掉落：</div>
                    {battleResult.rewards.drops.map((drop, i) => (
                      <span
                        key={i}
                        className="inline-block mr-2 px-2 py-0.5 bg-white rounded border border-gray-200 text-xs"
                      >
                        {drop?.itemId ?? '?'} ×{drop?.quantity ?? 0}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {!battleResult.victory && (
              <div className="text-sm text-gray-600 mb-2">
                勇者倒下了... 休息一下再来吧。
              </div>
            )}

            <button
              onClick={handleConfirmResult}
              className={`px-4 py-1.5 rounded-full text-sm font-medium text-white transition-colors ${
                battleResult.victory
                  ? 'bg-green-500 hover:bg-green-600'
                  : 'bg-gray-500 hover:bg-gray-600'
              }`}
            >
              确认
            </button>
          </div>
        )}
      </div>

      {/* 敌人列表（仅在空闲时显示） */}
      {battlePhase === 'idle' && currentEnemies.length > 0 && (
        <div className="space-y-2">
          {currentEnemies.map((enemy) => {
            if (!enemy) return null;
            const rarityColor = getRarityColor(enemy.rarity);
            const rarityName = getRarityName(enemy.rarity);
            const canFight = hero.hp > 0;

            return (
              <div
                key={enemy.id}
                className="bg-white rounded-lg border border-gray-200 p-2.5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    {enemy.isBoss && <span>👑</span>}
                    <span className="font-bold text-sm">{enemy.name}</span>
                    <span className="text-xs text-gray-400">Lv.{enemy.level ?? '?'}</span>
                    {rarityName && (
                      <span
                        className="text-xs px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: rarityColor + '20', color: rarityColor }}
                      >
                        {rarityName}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleFight(enemy)}
                    disabled={!canFight}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                      canFight
                        ? 'bg-red-500 hover:bg-red-600 text-white shadow-sm'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <FaBomb className="inline" /> 战斗
                  </button>
                </div>

                {/* HP Bar */}
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: '100%', backgroundColor: rarityColor }}
                    />
                  </div>
                  <span className="text-xs text-gray-400">HP {enemy.hp}</span>
                </div>

                {/* Stats row */}
                <div className="flex gap-3 text-xs text-gray-500">
                  <span><FaBomb className="inline" /> ATK {enemy.atk}</span>
                  <span><FaShield className="inline" /> DEF {enemy.def}</span>
                </div>

                {/* Drop preview */}
                {(enemy.drops?.length ?? 0) > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {enemy.drops.map((drop, i) => (
                      <span
                        key={i}
                        className="text-xs px-1.5 py-0.5 bg-gray-50 rounded border border-gray-100 text-gray-500"
                      >
                        {drop?.itemId ?? '?'} {((drop?.chance ?? 0) * 100).toFixed(0)}%
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 无敌人提示 */}
      {battlePhase === 'idle' && currentEnemies.length === 0 && (
        <div className="text-center py-4 text-gray-400 text-sm">
          暂无敌人，点击「刷新敌人」探索
        </div>
      )}
    </div>
  );
};
