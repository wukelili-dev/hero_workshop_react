import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { generateTavernRoster, type TavernRecruit } from '../../data/tavern';

export const TavernTab: React.FC = () => {
  const hero = useGameStore((s) => s.hero);
  const [roster, setRoster] = useState<TavernRecruit[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  const refresh = () => {
    const newRoster = generateTavernRoster(hero.level);
    setRoster(newRoster);
  };

  useEffect(() => {
    refresh();
  }, [hero.level]);

  const handleRecruit = (recruit: TavernRecruit) => {
    if (hero.gold < recruit.cost) {
      setMsg('❌ 金币不足');
      setTimeout(() => setMsg(null), 2000);
      return;
    }
    if (hero.team.length >= 3) {
      setMsg('❌ 队伍已满（最多3人）');
      setTimeout(() => setMsg(null), 2000);
      return;
    }
    const ok = useGameStore.getState().recruitMember(recruit);
    if (ok) {
      setMsg(`✅ ${recruit.roleName} 加入队伍！`);
      refresh();
      setTimeout(() => setMsg(null), 2000);
    }
  };

  const costColor = (cost: number) =>
    hero.gold >= cost ? 'text-yellow-600' : 'text-red-500';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-gray-700">🍺 酒馆</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-yellow-600 font-medium">💰 {hero.gold}</span>
          <button
            onClick={refresh}
            className="px-2 py-0.5 bg-amber-100 hover:bg-amber-200 rounded text-xs text-amber-800 transition-colors"
          >
            🔄 刷新
          </button>
        </div>
      </div>

      {msg && (
        <div className="px-3 py-1.5 bg-gray-100 rounded text-sm text-center">{msg}</div>
      )}

      <p className="text-xs text-gray-400">花费金币招募队友，最多3人。Lv.5后可能出现精英。</p>

      <div className="space-y-3">
        {roster.map((recruit, idx) => {
          const canAfford = hero.gold >= recruit.cost;
          const teamFull = hero.team.length >= 3;
          return (
            <div
              key={`${recruit.roleName}-${idx}`}
              className={`p-3 border rounded-lg transition-colors ${
                recruit.isElite
                  ? 'border-purple-300 bg-purple-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-gray-800">{recruit.roleName}</span>
                  {recruit.isElite && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-200 text-purple-800 font-medium">精英</span>
                  )}
                  <span className="text-xs text-gray-400">Lv.{recruit.level}</span>
                </div>
                <span className={`text-xs font-medium ${costColor(recruit.cost)}`}>💰{recruit.cost}</span>
              </div>

              {recruit.gear && recruit.gear.length > 0 && (
                <div className="flex gap-1 mb-2 flex-wrap">
                  {recruit.gear.map((g, i) => (
                    <span
                      key={i}
                      className="text-[10px] px-1.5 py-0.5 rounded"
                      style={{ backgroundColor: g.rarityColor + '22', color: g.rarityColor }}
                    >
                      {g.type === 'weapon' ? '⚔' : '🛡'} {g.name}
                    </span>
                  ))}
                </div>
              )}

              <button
                onClick={() => handleRecruit(recruit)}
                disabled={!canAfford || teamFull}
                className={`w-full py-1 rounded-full text-xs font-medium transition-colors ${
                  teamFull
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : canAfford
                    ? 'bg-amber-500 hover:bg-amber-600 text-white'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {teamFull ? '队伍已满' : canAfford ? '招募' : '金币不足'}
              </button>
            </div>
          );
        })}
      </div>

      {/* 当前队伍 */}
      {hero.team.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-gray-500 mb-2">当前队伍</h3>
          <div className="space-y-1">
            {hero.team.map((m, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-gray-600">
                <span>👤</span>
                <span className="font-medium">{m.roleName}</span>
                <span className="text-gray-400">Lv.{m.level}</span>
                <span className="text-red-400">⚔{m.atk}</span>
                <span className="text-blue-400">🛡{m.def}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
