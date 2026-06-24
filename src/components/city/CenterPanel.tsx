/**
 * CenterPanel - 中间面板：队伍标签 + 英雄属性 + 地图选择 + 战斗
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, type Variants } from 'framer-motion';
import { useGameStore } from '../../store/useGameStore';
import { useNpcStore } from '../../store/useNpcStore';
import { MAPS } from '../../data/maps';
import { getNpcsByMap, hasNpcs } from '../../data/npcs';
import { formatNumber } from '../../data/constants';
import { RARITY_NAME, RARITY_COLOR } from '../../types';
import type { Monster } from '../../types';
import type { BattleLog, Rewards } from '../../engine/Combat';
import { FaSkullCrossbones, FaBomb, FaShield, FaUsers } from 'react-icons/fa6';
import { AnimatedNumber } from '../../hooks/useCountUp';
import { NpcPanel, NpcBadge } from '../npc/NpcPanel';

type TeamTab = 'hero' | 'teammate' | 'all';
type BattlePhase = 'idle' | 'fighting' | 'result';

interface BattleResult {
  victory: boolean;
  logs: BattleLog[];
  rewards: Rewards;
  monsterName: string;
}

const EMPTY_LOGS: BattleLog[] = [];

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

const enemyVariants: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.08, duration: 0.3, ease: 'easeOut' },
  }),
};

const resultVariants: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 260, damping: 20 } },
};

export const CenterPanel: React.FC = () => {
  const hero = useGameStore((s) => s.hero);
  const currentMapId = useGameStore((s) => s.currentMapId);
  const setCurrentMapId = useGameStore((s) => s.setCurrentMap);
  const unlockedMaps = useGameStore((s) => s.unlockedMaps);
  const currentEnemies = useGameStore((s) => s.currentEnemies);
  const refreshEnemies = useGameStore((s) => s.refreshEnemies);
  const fightMonster = useGameStore((s) => s.fightMonster);

  const autoBattle = useGameStore((s) => s.autoBattle);
  const setAutoBattle = useGameStore((s) => s.setAutoBattle);

  const [teamTab, setTeamTab] = useState<TeamTab>('hero');
  const [battlePhase, setBattlePhase] = useState<BattlePhase>('idle');
  const [battleLogs, setBattleLogs] = useState<BattleLog[]>(EMPTY_LOGS);
  const [battleResult, setBattleResult] = useState<BattleResult | null>(null);
  const [fightingMonster, setFightingMonster] = useState<Monster | null>(null);
  const logsRef = useRef<HTMLDivElement>(null);
  const animTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearAnimTimer = useCallback(() => {
    if (animTimerRef.current !== null) {
      clearInterval(animTimerRef.current);
      animTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => clearAnimTimer();
  }, [clearAnimTimer]);

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
    clearAnimTimer();
    setFightingMonster(monster);
    setBattlePhase('fighting');
    setBattleLogs(EMPTY_LOGS);
    setBattleResult(null);

    try {
      const result = fightMonster(monster);
      if (!result || !result.logs) throw new Error('Invalid battle result');

      // 奖励和自动药水已由 fightMonster 内部处理

      const logs = result.logs;
      let lineIdx = 0;
      animTimerRef.current = setInterval(() => {
        if (lineIdx < logs.length) {
          setBattleLogs((prev) => {
            if (lineIdx >= logs.length) return prev;
            return [...prev, logs[lineIdx]];
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
  }, [hero.hp, fightMonster, clearAnimTimer, resetBattleState]);

  const handleConfirmResult = () => resetBattleState();

  const currentMap = MAPS.find(m => m.id === currentMapId);

  const getRarityColor = (r: number | undefined): string =>
    (RARITY_COLOR as Record<number, string>)[r ?? 0] ?? '#C0C0C0';
  const getRarityName = (r: number | undefined): string =>
    (RARITY_NAME as Record<number, string>)[r ?? 0] ?? '';

  const battleSection = (
    <div className="battle-section">
      <div className="flex items-center gap-1 mb-2">
        <FaSkullCrossbones className="text-gray-600" />
        <span className="text-sm font-bold text-gray-700">敌人</span>
      </div>

      {/* 刷新按钮 */}
      <motion.button
        whileTap={{ scale: 0.88 }}
        onClick={handleRefreshEnemies}
        disabled={battlePhase === 'fighting'}
        className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded text-sm text-blue-700 transition-colors disabled:opacity-50"
      >
        🔄 刷新敌人
      </motion.button>

      {/* 战斗日志 / 结果区 */}
      {battlePhase === 'fighting' && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-50 rounded-lg p-2 text-xs space-y-1"
        >
          <div className="font-medium text-gray-700">⚔️ {fightingMonster?.name ?? '战斗进行中…'}</div>
          <div className="max-h-24 overflow-y-auto" ref={logsRef}>
            {battleLogs.map((log, i) => (
              <div key={i} className={log.isPlayer ? 'text-blue-600' : 'text-red-600'}>
                {log.text}
              </div>
            ))}
          </div>
          {battlePhase === 'fighting' && <span className="text-gray-400">• • •</span>}
        </motion.div>
      )}

      {battlePhase === 'result' && battleResult && (
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`p-3 rounded-lg text-sm ${
            battleResult.victory
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
          }`}
        >
          <div className={`flex items-center gap-1 font-bold mb-1 ${battleResult.victory ? 'text-green-700' : 'text-red-700'}`}>
            {battleResult.victory ? '🏆 胜利！' : '💀 败北…'}
          </div>
          <div className="text-xs space-y-1">
            {battleResult.victory ? (
              <>
                <div>获得 {battleResult.rewards.exp} 经验</div>
                <div>获得金币 {battleResult.rewards.gold}</div>
                {(battleResult.rewards.potions ?? 0) > 0 && <div>获得药水 {battleResult.rewards.potions} 瓶</div>}
                {battleResult.rewards.resources && Object.entries(battleResult.rewards.resources).length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {Object.entries(battleResult.rewards.resources).map(([key, value]) => (
                      <span key={key} className="px-1.5 py-0.5 bg-white/60 rounded border text-gray-600">{key} ×{value}</span>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="text-gray-500">在客栈休息恢复体力吧。</div>
            )}
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={battleResult.victory ? handleRefreshEnemies : () => setBattlePhase('idle')}
            className={`mt-2 px-3 py-1 rounded-full text-xs font-bold transition-all ${
              battleResult.victory
                ? 'bg-green-500 hover:bg-green-600 text-white'
                : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
            }`}
          >
            {battleResult.victory ? '继续探索' : '返回'}
          </motion.button>
        </motion.div>
      )}

      {/* 敌人列表（仅在空闲时显示） */}
      {battlePhase === 'idle' && currentEnemies.length > 0 && (
        <div className="space-y-2">
          {currentEnemies.map((enemy, i) => {
            if (!enemy) return null;
            const rarityColor = getRarityColor(enemy.rarity);
            const rarityName = getRarityName(enemy.rarity);
            const canFight = hero.hp > 0;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white rounded-xl border border-gray-200/80 shadow-sm p-3"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: rarityColor + '22', color: rarityColor }}>
                      {enemy.rarity !== undefined ? ['☆','★','◆','◇','♛'][enemy.rarity] ?? '?' : '?'}
                    </span>
                    <span className="font-medium text-sm text-gray-800">{enemy.name}</span>
                    <span className="text-xs text-gray-400">{rarityName}</span>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.85 }}
                    onClick={() => handleFight(enemy)}
                    disabled={!canFight}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                      canFight
                        ? 'bg-red-500 hover:bg-red-600 text-white shadow-sm hover:shadow'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <FaBomb className="inline" /> 战斗
                  </motion.button>
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
              </motion.div>
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
            <motion.button
              key={tab.id}
              whileTap={{ scale: 0.92 }}
              onClick={() => setTeamTab(tab.id)}
              className={`px-4 py-1 rounded-full text-sm font-medium transition-colors ${
                teamTab === tab.id
                  ? 'bg-orange-500 text-white shadow'
                  : 'bg-gray-300 text-gray-600 hover:bg-gray-400'
              }`}
            >
              {tab.label}
            </motion.button>
          ))}
        </div>
        <div className="ml-auto flex gap-1.5">
          <div className="w-8 h-8 rounded border border-gray-300 flex items-center justify-center text-xs text-gray-400" title="武器">
            <FaBomb />
          </div>
        </div>
      </div>

      {/* 英雄属性卡 */}
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="bg-white rounded-xl border border-gray-200/80 p-3 shadow-sm"
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">🧙</span>
          <span className="font-bold text-gray-900">{hero.name}</span>
          {(() => { const t = useGameStore((s) => s.getMoralTitle)?.(); return t === '至圣' ? <span className="text-yellow-400 font-bold ml-1">✨ 至圣</span> : t === '魔王' ? <span className="text-red-500 font-bold ml-1">💀 魔王</span> : null; })()}
          <span className="text-sm text-blue-600 font-bold">Lv.{hero.level}</span>
        </div>
        <div className="space-y-0.5 text-sm">
          <div className="flex"><span className="text-gray-500 w-14">生命:</span>
            <span className={hero.hp < hero.maxHp * 0.3 ? 'text-red-600 font-bold' : ''}>
              <AnimatedNumber value={hero.hp} duration={400} />/{hero.maxHp}
            </span>
          </div>
          <div className="flex"><span className="text-gray-500 w-14">攻击:</span><span className="text-red-600 font-medium">{hero.atk}</span></div>
          <div className="flex"><span className="text-gray-500 w-14">防御:</span><span className="text-blue-600 font-medium">{hero.def}</span></div>
          <div className="flex"><span className="text-gray-500 w-14">CRIT:</span><span>{(hero.critRate * 100).toFixed(0)}%</span></div>
          <div className="flex"><span className="text-gray-500 w-14">经验:</span><span><AnimatedNumber value={hero.exp} duration={400} />/{hero.level * 100}</span></div>
          <div className="flex"><span className="text-gray-500 w-14">武器:</span><span className="text-gray-600">{hero.weapon?.name ?? '空手'}</span></div>
          <div className="flex"><span className="text-gray-500 w-14">护甲:</span><span className="text-gray-600">{hero.armor?.name ?? '布衣'}</span></div>
        </div>
      </motion.div>

      {/* 药水栏 */}
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.15 }}
        className="p-2 border border-amber-200/80 rounded-xl bg-gradient-to-r from-amber-50/60 to-yellow-50/40"
      >
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-amber-700">💊 药水</span>
          <span className="text-xs font-bold text-amber-800">x{hero.potions ?? 0}</span>
        </div>
        <div className="flex gap-2">
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={() => { if (!useGameStore.getState().buyPotion()) alert('金币不足！'); }}
            className="flex-1 py-1 bg-amber-400 hover:bg-amber-500 active:bg-amber-600 text-white rounded text-[11px] font-medium transition-colors shadow-sm hover:shadow"
          >购买 (25G)</motion.button>
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={() => { if (!useGameStore.getState().usePotion()) alert((hero.potions ?? 0) <= 0 ? '没有药水！' : 'HP已满！'); }}
            disabled={(hero.potions ?? 0) <= 0 || hero.hp >= hero.maxHp}
            className={`flex-1 py-1 rounded text-[11px] font-medium transition-colors ${(hero.potions ?? 0) <= 0 || hero.hp >= hero.maxHp ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600 active:bg-green-700 text-white shadow-sm hover:shadow'}`}
          >使用 +20HP</motion.button>
        </div>
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
        <div className="flex items-center gap-1.5 mt-1.5">
          <span className="text-[10px] text-amber-600">自动战斗：</span>
          <button
            onClick={() => setAutoBattle(!autoBattle)}
            className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${autoBattle ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
          >{autoBattle ? '🔴 开启' : '⚪ 关闭'}</button>
        </div>
      </motion.div>

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
              <motion.button
                key={map.id}
                whileTap={{ scale: 0.9 }}
                onClick={() => isUnlocked ? handleSelectMap(map.id) : handleUnlockMap(map)}
                className={`relative px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  isActive && isUnlocked
                    ? 'bg-green-600 text-white shadow'
                    : isUnlocked
                    ? 'bg-gray-500 text-white hover:bg-gray-600'
                    : 'bg-gray-400 text-white/80 hover:bg-gray-500'
                }`}
                disabled={!isUnlocked && hero.gold < map.unlockCost}
              >
                {map.name}{!isUnlocked ? ` (${formatNumber(map.unlockCost)}G)` : ''}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* NPC 面板（所有有NPC的地图都显示） */}
      {hasNpcs(currentMapId) && <NpcPanel mapId={currentMapId} />}
      {/* 战斗区域（仅非城市地图） */}
      {!currentMap?.isCity && battleSection}
    </div>
  );
};
