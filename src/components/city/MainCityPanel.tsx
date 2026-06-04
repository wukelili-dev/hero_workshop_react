import React, { useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { useCombatStore } from '../../store/useCombatStore';
import { MAPS, MONSTERS } from '../../data/maps';
import { BUILDING_CONFIGS, WONDERS, BUILDING_OUTPUTS, getAllBuildingNames, getWonderNames, getBuildingCost } from '../../data/buildings';
import { formatNumber, formatTime, getRarityColor, getRarityName } from '../../data/constants';
import { ProgressBar } from '../shared/ProgressBar';
import { RarityBadge } from '../shared/RarityBadge';

export const MainCityPanel: React.FC = () => {
  const hero = useGameStore((s) => s.hero);
  const resources = useGameStore((s) => s.resources);
  const addGold = useGameStore((s) => s.addGold);
  const addResource = useGameStore((s) => s.addResource);
  const currentMapId = useCombatStore((s) => s.currentMapId);
  const currentEnemy = useCombatStore((s) => s.currentEnemy);
  const currentEnemyHp = useCombatStore((s) => s.currentEnemyHp);
  const isBattling = useCombatStore((s) => s.isBattling);
  const autoBattle = useCombatStore((s) => s.autoBattle);
  const battleLogs = useCombatStore((s) => s.battleLogs);
  const setCurrentMap = useCombatStore((s) => s.setCurrentMap);
  const setCurrentEnemy = useCombatStore((s) => s.setCurrentEnemy);
  const startBattle = useCombatStore((s) => s.startBattle);
  const stopBattle = useCombatStore((s) => s.stopBattle);
  const toggleAutoBattle = useCombatStore((s) => s.toggleAutoBattle);

  const MATERIALS: { name: string; icon: string; key: string; sellPrice: number; buyPrice: number }[] = [
    { name: '木材', icon: '🪵', key: 'wood', sellPrice: 1, buyPrice: 3 },
    { name: '铁矿', icon: '⛏', key: 'iron', sellPrice: 2, buyPrice: 5 },
    { name: '皮革', icon: '🧤', key: 'hide', sellPrice: 1, buyPrice: 4 },
    { name: '石头', icon: '⛰', key: 'stone', sellPrice: 2, buyPrice: 5 },
  ];

  const currentMap = MAPS.find((m) => m.id === currentMapId);

  return (
    <div
      className="h-full p-3 text-amber-100 overflow-y-auto"
      style={{
        background: 'linear-gradient(180deg, #060E1C 0%, #0A1E36 40%, #112244 100%)',
      }}
    >
      {/* ── Resources ── */}
      <div className="mb-4 border border-blue-800/40 rounded-lg p-3 bg-slate-900/60">
        <h3 className="text-amber-400 font-bold text-sm mb-2">📦 资源</h3>
        {MATERIALS.map((mat) => (
          <div key={mat.key} className="flex items-center gap-1 mb-1 text-sm">
            <span>{mat.icon}</span>
            <span className="flex-1">{mat.name}</span>
            <span className="font-bold text-amber-200">{formatNumber(resources[mat.key] ?? 0)}</span>
            <button
              onClick={() => { addResource(mat.key, -1); addGold(mat.sellPrice); }}
              className="w-6 h-5 rounded bg-red-900/60 text-xs hover:bg-red-800"
            >−</button>
            <button
              onClick={() => { addGold(-mat.buyPrice); addResource(mat.key, 1); }}
              className="w-6 h-5 rounded bg-green-900/60 text-xs hover:bg-green-800"
            >+</button>
          </div>
        ))}
      </div>

      {/* ── Hero Stats ── */}
      <div className="mb-4 border border-blue-800/40 rounded-lg p-3 bg-slate-900/60">
        <div className="text-amber-300 font-bold text-base mb-2">🧙 {hero.name} Lv.{hero.level}</div>
        <ProgressBar current={hero.hp} max={hero.maxHp} color="bg-red-500" label="生命" />
        <div className="mt-1 space-y-0.5 text-xs text-amber-200/70">
          <div>⚔ 攻击: <span className="text-amber-200">{hero.atk}</span></div>
          <div>🛡 防御: <span className="text-amber-200">{hero.def}</span></div>
          <div>💥 暴击: <span className="text-amber-200">{(hero.critRate * 100).toFixed(0)}%</span></div>
          <div>🗡 暴伤: <span className="text-amber-200">x{hero.critDmg.toFixed(1)}</span></div>
          {hero.weapon && <div>🗡 武器: <span style={{ color: hero.weapon.rarityColor }}>{hero.weapon.name}</span></div>}
          {hero.armor && <div>🛡 护甲: <span style={{ color: hero.armor.rarityColor }}>{hero.armor.name}</span></div>}
        </div>
      </div>

      {/* ── Map & Enemy ── */}
      <div className="mb-4 border border-blue-800/40 rounded-lg p-3 bg-slate-900/60">
        <h3 className="text-amber-400 font-bold text-sm mb-2">🗺 地图</h3>
        <div className="flex flex-wrap gap-1 mb-2">
          {MAPS.map((m) => (
            <button
              key={m.id}
              onClick={() => setCurrentMap(m.id)}
              className={`px-2 py-1 text-xs rounded ${
                currentMapId === m.id
                  ? 'bg-blue-700 text-white font-bold'
                  : 'bg-slate-700/60 text-amber-200/60 hover:bg-slate-600/60'
              }`}
            >
              {m.name}
            </button>
          ))}
        </div>
        {currentEnemy && (
          <div className="border border-red-800/40 rounded p-2 bg-red-950/30 mb-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold text-red-300">{currentEnemy.name}</span>
              {currentEnemy.rarity !== undefined && <RarityBadge rarity={currentEnemy.rarity} />}
              {currentEnemy.isBoss && <span className="text-yellow-400 text-xs">👑 BOSS</span>}
            </div>
            <ProgressBar current={currentEnemyHp} max={currentEnemy.hp} color="bg-red-600" />
            <div className="text-xs text-amber-200/60 mt-1">
              ATK:{currentEnemy.atk} DEF:{currentEnemy.def} EXP:{currentEnemy.exp || 0} 💰{currentEnemy.gold || 0}
            </div>
          </div>
        )}
        <button
          onClick={() => {
            if (currentMap) {
              const enemies = currentMap.enemies || currentMap.monsters || [];
              if (enemies.length > 0) {
                const e = enemies[Math.floor(Math.random() * enemies.length)];
                setCurrentEnemy(e);
              }
            }
          }}
          className="w-full py-1.5 rounded bg-slate-700 text-amber-200 text-sm hover:bg-slate-600"
        >
          🔄 刷新敌人
        </button>
      </div>

      {/* ── Battle Controls ── */}
      <div className="mb-4 border border-blue-800/40 rounded-lg p-3 bg-slate-900/60 space-y-2">
        <button
          onClick={() => isBattling ? stopBattle() : startBattle()}
          className={`w-full py-2 rounded font-bold text-sm ${
            isBattling ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-800 hover:bg-red-700 text-white'
          }`}
        >
          {isBattling ? '⏹ 停止' : '⚔ 战斗'}
        </button>
        <button
          onClick={toggleAutoBattle}
          className={`w-full py-1.5 rounded text-sm ${
            autoBattle ? 'bg-amber-700 text-white' : 'bg-slate-700 text-amber-200/70'
          }`}
        >
          ⚡ 自动战斗: {autoBattle ? '开' : '关'}
        </button>
      </div>

      {/* ── Battle Log ── */}
      <div className="mb-4 border border-blue-800/40 rounded-lg p-3 bg-slate-900/60">
        <h3 className="text-red-400 font-bold text-sm mb-2">📋 战斗日志</h3>
        <div className="max-h-40 overflow-y-auto text-xs space-y-0.5">
          {battleLogs.slice(-20).map((log, i) => (
            <div key={i} className="text-amber-200/60">{log}</div>
          ))}
          {battleLogs.length === 0 && <div className="text-amber-200/30">暂无日志</div>}
        </div>
      </div>

      {/* ── Buildings ── */}
      <div className="mb-4">
        <h3 className="text-amber-400 font-bold text-sm mb-2">🏗 建筑</h3>
        {getAllBuildingNames().map((name) => {
          const cfg = BUILDING_CONFIGS[name];
          return (
            <div key={name} className="border border-blue-800/30 rounded p-2 mb-1.5 bg-slate-900/40">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-sm text-amber-200">{name}</span>
                <span className="text-xs text-amber-200/50">产出: {BUILDING_OUTPUTS[name]}</span>
              </div>
              <div className="text-xs text-amber-200/40 mb-1">
                建造: {Object.entries(cfg.buildCost).map(([k, v]) => `${k}×${v}`).join(' ')}
              </div>
              <button className="w-full py-1 rounded bg-blue-900/60 text-xs text-amber-200/70 hover:bg-blue-800/60">
                建造 +1
              </button>
            </div>
          );
        })}
      </div>

      {/* ── Wonders ── */}
      <div className="mb-4">
        <h3 className="text-amber-400 font-bold text-sm mb-2">✨ 奇观</h3>
        {getWonderNames().map((name) => {
          const cfg = WONDERS[name];
          return (
            <div key={name} className="border border-orange-800/30 rounded p-2 mb-1.5 bg-slate-900/40">
              <div className="font-bold text-sm text-orange-300 mb-1">{name}</div>
              <div className="text-xs text-amber-200/50 mb-1">{cfg.description}</div>
              <div className="text-xs text-amber-200/40 mb-1">
                需要: {Object.entries(cfg.buildCost).map(([k, v]) => `${k}×${v}`).join(' ')}
              </div>
              <button className="w-full py-1 rounded bg-orange-900/40 text-xs text-amber-200/60 hover:bg-orange-800/40">
                建造奇观
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
