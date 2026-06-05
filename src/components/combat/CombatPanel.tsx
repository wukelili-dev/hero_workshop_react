import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useGameStore } from '../../store/useGameStore';
import type { BattleLog } from '../../engine/Combat';

export const CombatPanel: React.FC = () => {
  const hero = useGameStore((s) => s.hero);
  const currentEnemies = useGameStore((s) => s.currentEnemies);
  const fightMonster = useGameStore((s) => s.fightMonster);
  const refreshEnemies = useGameStore((s) => s.refreshEnemies);
  const addExp = useGameStore((s) => s.addExp);
  const addGold = useGameStore((s) => s.addGold);
  const setHp = useGameStore((s) => s.setHp);
  const buyPotion = useGameStore((s) => s.buyPotion);
  const usePotion = useGameStore((s) => s.usePotion);
  const potions = useGameStore((s) => s.hero.potions);
  const autoPotionThreshold = useGameStore((s) => s.autoPotionThreshold);
  const setAutoPotionThreshold = useGameStore((s) => s.setAutoPotionThreshold);

  const handleBuyPotion = () => { if (!buyPotion()) alert('金币不足！'); };
  const handleUsePotion = () => { if (!usePotion()) alert(hero.potions <= 0 ? '没有药水！' : 'HP已满！'); };

  const [battleLogs, setBattleLogs] = useState<BattleLog[]>([]);
  const [visibleCount, setVisibleCount] = useState(0);
  const [fighting, setFighting] = useState(false);
  const [result, setResult] = useState<{ victory: boolean; rewards: { exp: number; gold: number; drops: { itemId: string; quantity: number }[] } } | null>(null);
  const [heroDisplayHp, setHeroDisplayHp] = useState(hero.hp);
  const [monsterDisplayHp, setMonsterDisplayHp] = useState<Record<string, number>>({});

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 清理定时器
  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  // 同步 heroDisplayHp
  useEffect(() => { setHeroDisplayHp(hero.hp); }, [hero.hp]);

  const startBattle = useCallback((monster: typeof currentEnemies[0]) => {
    if (fighting) return;
    setFighting(true);
    setBattleLogs([]);
    setVisibleCount(0);
    setResult(null);
    setMonsterDisplayHp((prev) => ({ ...prev, [monster.name]: monster.hp }));

    const res = fightMonster(monster);
    setBattleLogs(res.logs);

    // 逐帧展示日志
    let idx = 0;
    timerRef.current = setInterval(() => {
      idx++;
      setVisibleCount(idx);
      // 更新显示 HP
      const log = res.logs[idx - 1];
      if (log) {
        if (log.defender === '勇者') setHeroDisplayHp((h) => Math.max(0, h - log.damage));
        else setMonsterDisplayHp((prev) => ({ ...prev, [log.attacker === '勇者' ? log.defender : log.attacker]: Math.max(0, (prev[log.defender] ?? monster.hp) - log.damage) }));
      }
      if (idx >= res.logs.length) {
        if (timerRef.current) clearInterval(timerRef.current);
        setFighting(false);
        setResult({ victory: res.victory, rewards: res.rewards });
        if (res.victory) {
          addExp(res.rewards.exp);
          addGold(res.rewards.gold);
        }
        setHp(res.heroFinalHp);
        setHeroDisplayHp(res.heroFinalHp);
      }
    }, 600);
  }, [fighting, fightMonster, addExp, addGold, setHp]);

  const handleRefresh = () => {
    setBattleLogs([]);
    setVisibleCount(0);
    setResult(null);
    refreshEnemies();
  };

  const hpPct = (current: number, max: number) => Math.max(0, Math.min(100, (current / max) * 100));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-gray-700">⚔ 战斗</h2>
        <button onClick={handleRefresh} className="px-2 py-0.5 bg-gray-100 hover:bg-gray-200 rounded text-xs text-gray-600 transition-colors">🔄 刷新</button>
      </div>

      {/* 敌人列表 */}
      <div className="space-y-2">
        {currentEnemies.map((m, i) => {
          const mHp = monsterDisplayHp[m.name] ?? m.hp;
          const pct = hpPct(mHp, m.hp);
          return (
            <div key={i} className="p-2 border border-gray-200 rounded-lg bg-white">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-800">{m.name} Lv.{m.level ?? '?'}</span>
                <span className={`text-xs ${mHp <= 0 ? 'text-gray-400' : 'text-red-500'}`}>HP {mHp}/{m.hp}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
                <div className={`h-2 rounded-full transition-all ${pct > 50 ? 'bg-green-400' : pct > 20 ? 'bg-yellow-400' : 'bg-red-500'}`} style={{ width: `${pct}%` }} />
              </div>
              <button
                onClick={() => startBattle(m)}
                disabled={fighting || mHp <= 0}
                className={`w-full py-1 rounded-full text-xs font-medium transition-colors ${fighting || mHp <= 0 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600 text-white'}`}
              >{mHp <= 0 ? '已击败' : '攻击'}</button>
            </div>
          );
        })}
      </div>

      {/* 药水栏 */}
      <div className="p-2 border border-amber-200 rounded-lg bg-amber-50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-amber-700">💊 药水</span>
          <span className="text-xs font-bold text-amber-800">x{potions}</span>
        </div>
        <div className="flex gap-2 mb-2">
          <button
            onClick={handleBuyPotion}
            className="flex-1 py-1 bg-amber-400 hover:bg-amber-500 text-white rounded text-xs font-medium transition-colors"
          >购买 (25G)</button>
          <button
            onClick={handleUsePotion}
            disabled={potions <= 0 || hero.hp >= hero.maxHp}
            className={`flex-1 py-1 rounded text-xs font-medium transition-colors ${potions <= 0 || hero.hp >= hero.maxHp ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600 text-white'}`}
          >使用 +20HP</button>
        </div>
        {/* 自动药水阈值 */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-amber-600">自动喝药：</span>
          {[0, 30, 50, 80].map((v) => (
            <button
              key={v}
              onClick={() => setAutoPotionThreshold(v)}
              className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors ${autoPotionThreshold === v ? 'bg-amber-600 text-white' : 'bg-amber-100 text-amber-700 hover:bg-amber-200'}`}
            >{v === 0 ? '关' : `${v}%`}</button>
          ))}
        </div>
      </div>

      {/* 勇者 HP */}
      <div className="p-2 border border-blue-200 rounded-lg bg-blue-50">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-blue-800">勇者 Lv.{hero.level}</span>
          <span className={`text-xs ${heroDisplayHp <= 0 ? 'text-red-500' : 'text-blue-600'}`}>HP {heroDisplayHp}/{hero.maxHp}</span>
        </div>
        <div className="w-full bg-blue-100 rounded-full h-2">
          <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${hpPct(heroDisplayHp, hero.maxHp)}%` }} />
        </div>
      </div>

      {/* 战斗日志 */}
      {battleLogs.length > 0 && (
        <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
          {battleLogs.slice(0, visibleCount).map((log, i) => (
            <div key={i} className={`text-[11px] px-2 py-0.5 rounded ${log.isCrit ? 'bg-yellow-50 text-yellow-700' : 'text-gray-500'}`}>
              R{log.round} | {log.description}
            </div>
          ))}
        </div>
      )}

      {/* 结果 */}
      {result && (
        <div className={`p-2 rounded-lg text-center text-sm font-medium ${result.victory ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
          {result.victory ? `✅ 胜利！获得 ${result.rewards.exp} EXP、${result.rewards.gold} 金币` : '❌ 失败...'}
        </div>
      )}
    </div>
  );
};
