// ============ 世界地图（宣纸水墨） ============
// 左：水墨棋盘（点击任意格子选中，显示行军路线与天数）
// 右：所在地情报 + 此处妖怪（可直接讨伐）

import React, { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useGameStore } from '../../store/useGameStore';
import { formatDayLabel, useWorldStore } from '../../store/useWorldStore';
import { TERRAIN_CONFIG, findRoute, getCellById } from '../../data/cellMap';
import { CELL_ENCOUNTERS, getCellEncounter } from '../../data/cellEncounters';
import { MAPS } from '../../data/maps';
import { RARITY_COLOR, RARITY_NAME } from '../../types';
import type { Monster } from '../../types';
import { buildInkMapSvg } from './inkMapSvg';
import { FaMapLocationDot, FaSkullCrossbones, FaXmark, FaLock, FaShoePrints } from 'react-icons/fa6';

interface InkMapPanelProps {
  onClose?: () => void;
  /** 嵌入页面内使用（而不是全屏覆盖层） */
  embedded?: boolean;
}

interface FightResult {
  monster: string;
  victory: boolean;
  exp: number;
  gold: number;
}

const rarityColor = (r?: number) => (RARITY_COLOR as Record<number, string>)[r ?? 0] ?? '#C0C0C0';
const rarityName = (r?: number) => (RARITY_NAME as Record<number, string>)[r ?? 0] ?? '';

/** 一张妖怪卡片（地图右侧面板用） */
const MonsterCard: React.FC<{ monster: Monster; disabled: boolean; onFight: (m: Monster) => void }> = ({
  monster,
  disabled,
  onFight,
}) => {
  const color = rarityColor(monster.rarity);
  return (
    <div className={`border p-2.5 ${monster.isBoss ? 'border-[#b08a2e] bg-[#f6edd6]' : 'border-[#8a7a63]/45 bg-[#fdfbf4]'}`}>
      <div className="flex items-center gap-2">
        <span className="text-base">{monster.isBoss ? '👑' : '👹'}</span>
        <span className="text-sm font-semibold text-gray-800">{monster.name}</span>
        {monster.isBoss && (
          <span className="rounded bg-amber-200 px-1 text-[10px] font-bold text-amber-800">首领</span>
        )}
        <span className="text-[11px]" style={{ color }}>{rarityName(monster.rarity)}</span>
        {monster.level !== undefined && <span className="ml-auto text-[11px] text-gray-400">Lv.{monster.level}</span>}
      </div>
      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-gray-500">
        <span>HP {monster.hp}</span>
        <span>攻 {monster.atk}</span>
        <span>防 {monster.def}</span>
        <span className="text-blue-500">{monster.expReward} EXP</span>
        <span className="text-amber-600">{monster.goldReward} 金</span>
      </div>
      <button
        type="button"
        onClick={() => onFight(monster)}
        disabled={disabled}
        className={`mt-2 w-full py-1 text-xs font-bold transition-colors ${
          disabled ? 'bg-[#e9e2d2] text-[#9c917b]' : 'bg-[#b5382f] text-[#fdf6e8] hover:bg-[#a2332b]'
        }`}
      >
        <FaSkullCrossbones className="mr-1 inline" />
        讨伐
      </button>
    </div>
  );
};

export const InkMapPanel: React.FC<InkMapPanelProps> = ({ onClose, embedded = false }) => {
  const day = useWorldStore((s) => s.day);
  const currentCellId = useWorldStore((s) => s.currentCellId);
  const revealedCells = useWorldStore((s) => s.revealedCells);
  const moveTo = useWorldStore((s) => s.moveTo);

  const hero = useGameStore((s) => s.hero);
  const unlockedMaps = useGameStore((s) => s.unlockedMaps);
  const fightMonster = useGameStore((s) => s.fightMonster);

  const [selectedCellId, setSelectedCellId] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<FightResult | null>(null);

  const currentCell = getCellById(currentCellId);
  const currentEncounter = useMemo(() => getCellEncounter(currentCellId), [currentCellId]);
  const route = useMemo(
    () => (selectedCellId && selectedCellId !== currentCellId ? findRoute(currentCellId, selectedCellId) : null),
    [currentCellId, selectedCellId]
  );

  const svg = useMemo(
    () =>
      buildInkMapSvg({
        currentCellId,
        selectedCellId,
        routePath: route?.path ?? [],
        routeDays: route?.days ?? 0,
        revealedCells,
      }),
    [currentCellId, selectedCellId, route, revealedCells]
  );

  const boundMap = currentEncounter?.mapId ? MAPS.find((m) => m.id === currentEncounter.mapId) : undefined;
  const locked = boundMap ? !unlockedMaps.includes(boundMap.id) : false;
  const levelReady = boundMap ? hero.level >= boundMap.minLevel : true;

  /** 目标阶梯：按怪物最低等级给出「推荐等级 + 相对难度」 */
  const recommendOf = (enc: { monsters: Monster[]; boss?: Monster } | null) => {
    if (!enc) return null;
    const levels = enc.monsters.map((m) => m.level ?? 1);
    if (enc.boss?.level) levels.push(enc.boss.level);
    if (levels.length === 0) return null;
    const lv = Math.min(...levels);
    const diff = lv - hero.level;
    const label = diff <= -3 ? '可轻松应对' : diff <= 2 ? '势均力敌' : diff <= 6 ? '有些吃力' : '危险';
    return { lv, label, dangerous: diff > 2 };
  };
  const currentRec = recommendOf(currentEncounter);

  /** 下一目标：还没解锁的据点里门槛最低的那个 */
  const nextGoal = useMemo(() => {
    const lockedMaps = MAPS.filter((m) => !unlockedMaps.includes(m.id) && !m.isCity && m.minLevel > 0);
    if (lockedMaps.length === 0) return null;
    return [...lockedMaps].sort((a, b) => a.minLevel - b.minLevel)[0];
  }, [unlockedMaps]);
  const goalCell = nextGoal
    ? Object.entries(CELL_ENCOUNTERS).find(([, e]) => e.mapId === nextGoal.id)?.[0]
    : undefined;
  const goalLabel = goalCell ? (getCellById(goalCell)?.features[0]?.label ?? goalCell) : null;

  const handleMapClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const target = e.target as Element;
      const hit = target.closest('[data-cell]');
      const cellId = hit?.getAttribute('data-cell');
      if (!cellId) return;
      setSelectedCellId(cellId === currentCellId ? null : cellId);
    },
    [currentCellId]
  );

  const handleTravel = () => {
    if (!selectedCellId) return;
    const result = moveTo(selectedCellId);
    if (!result) {
      toast.error('无从抵达该地');
      return;
    }
    const dest = getCellById(selectedCellId);
    const label = getCellEncounter(selectedCellId)?.label ?? (dest ? TERRAIN_CONFIG[dest.terrain].name : '目的地');
    toast.success(`行军 ${result.days} 天，抵达${label}`, { icon: '🐎' });
    setSelectedCellId(null);
    setLastResult(null);
  };

  const handleFight = (monster: Monster) => {
    const result = fightMonster(monster);
    setLastResult({
      monster: monster.name,
      victory: result.victory,
      exp: result.rewards?.exp ?? 0,
      gold: result.rewards?.gold ?? 0,
    });
    if (result.victory) toast.success(`战胜${monster.name}`, { icon: '🏆' });
    else toast.error(`被${monster.name}击败，已复活至 50% HP`, { icon: '💀' });
  };

  const handleUnlock = () => {
    if (!boundMap) return;
    if (hero.level < boundMap.minLevel) {
      toast.error(`需要 Lv.${boundMap.minLevel} 才能进入${boundMap.name}`);
      return;
    }
    if (hero.gold < boundMap.unlockCost) {
      toast.error(`金币不足，解锁${boundMap.name}需要 ${boundMap.unlockCost} 金`);
      return;
    }
    useGameStore.getState().addGold(-boundMap.unlockCost);
    useGameStore.getState().unlockMap(boundMap.id);
    toast.success(`已解锁${boundMap.name}`, { icon: '🔓' });
  };

  const targetCell = selectedCellId ? getCellById(selectedCellId) : null;
  const targetEncounter = selectedCellId ? getCellEncounter(selectedCellId) : null;
  const targetRec = recommendOf(targetEncounter);
  const currentTerrain = currentCell ? TERRAIN_CONFIG[currentCell.terrain] : undefined;
  const isSect = currentCell?.features[0]?.type === 'sect';
  const monsters = [...(currentEncounter?.monsters ?? [])].sort((a, b) => (a.level ?? 0) - (b.level ?? 0));

  return (
    <div className={embedded ? 'flex h-full min-h-0 flex-col bg-[#f3efe4]' : 'fixed inset-0 z-50 flex flex-col bg-[#f3efe4]'}>
      {/* 顶栏 */}
      <div className="flex flex-wrap items-center gap-2 border-b border-amber-900/10 bg-white/85 px-3 py-2 backdrop-blur">
        <FaMapLocationDot className="text-amber-700" />
        <span className="text-sm font-bold text-gray-800">世界地图 · 中原地区</span>
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
          {formatDayLabel(day)}
        </span>
        <span className="hidden text-xs text-gray-500 sm:inline">
          所在：{currentEncounter?.label ?? currentTerrain?.name ?? '未知'}
        </span>
        {!embedded && (
          <button type="button" onClick={onClose} className="ink-btn ml-auto text-xs">
            <FaXmark /> 返回主城
          </button>
        )}
      </div>

      {/* 主体 */}
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* 地图 */}
        <div
          className="flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-[#f3efe4] p-2"
          onClick={handleMapClick}
        >
          <div className="h-full w-full" dangerouslySetInnerHTML={{ __html: svg }} />
        </div>

        {/* 右侧情报 */}
        <aside className="flex w-full shrink-0 flex-col gap-2 overflow-y-auto border-amber-900/10 bg-white/70 p-3 lg:w-[300px] lg:border-l">
          {/* 所在地 */}
          <div className="rounded-2xl border border-amber-900/10 bg-white p-3 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-900">
                {currentEncounter?.label ?? currentTerrain?.name ?? '荒野'}
              </span>
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800">
                {boundMap ? (boundMap.isCity ? '城镇' : '据点') : '野外'}
              </span>
            </div>
            <div className="mt-1 text-[11px] text-gray-500">
              {currentTerrain?.name} · 海拔 {currentCell?.elevation ?? 0} · 坐标 ({currentCell?.x ?? 0}, {currentCell?.y ?? 0})
            </div>
            {currentRec && (
              <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
                <span className="ink-tag">推荐 Lv.{currentRec.lv}</span>
                <span className={currentRec.dangerous ? 'text-[#8f2b23]' : ''}>{currentRec.label}</span>
              </div>
            )}
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] text-gray-500">
              <span>生命 <b className="text-gray-700">{hero.hp}</b>/{hero.maxHp}</span>
              <span>金币 <b className="text-amber-600">{hero.gold.toLocaleString()}</b></span>
              <span>药水 <b className="text-gray-700">{hero.potions ?? 0}</b></span>
            </div>
          </div>

          {/* 此处妖怪 */}
          <div className="rounded-2xl border border-amber-900/10 bg-white p-3 shadow-sm">
            <div className="mb-2 flex items-center gap-2">
              <FaSkullCrossbones className="text-red-500" />
              <span className="text-sm font-bold text-gray-800">此处妖怪</span>
              {monsters.length > 0 && (
                <span className="ml-auto text-[11px] text-gray-400">{monsters.length} 种</span>
              )}
            </div>

            {locked && boundMap ? (
              <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50/60 p-3 text-center">
                <FaLock className="mx-auto mb-1 text-amber-600" />
                <div className="text-xs text-amber-800">
                  {boundMap.name}尚未开放
                </div>
                <div className="mt-0.5 text-[11px] text-amber-700/80">
                  需要 Lv.{boundMap.minLevel} · 解锁费 {boundMap.unlockCost} 金
                </div>
                <button
                  type="button"
                  onClick={handleUnlock}
                  disabled={!levelReady}
                  className={`mt-2 w-full rounded-lg py-1 text-xs font-bold ${
                    levelReady
                      ? 'bg-amber-500 text-white hover:bg-amber-600'
                      : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  {levelReady ? `花 ${boundMap.unlockCost} 金解锁` : `等级不足（需 Lv.${boundMap.minLevel}）`}
                </button>
              </div>
            ) : monsters.length > 0 ? (
              <div className="space-y-2">
                {monsters.map((m, i) => (
                  <MonsterCard key={`${m.id}-${i}`} monster={m} disabled={hero.hp <= 0} onFight={handleFight} />
                ))}
                {currentEncounter?.boss && !monsters.some((m) => m.id === currentEncounter.boss?.id) && (
                  <MonsterCard monster={currentEncounter.boss} disabled={hero.hp <= 0} onFight={handleFight} />
                )}
              </div>
            ) : (
              <div className="py-3 text-center text-xs text-gray-400">
                {currentEncounter ? '此地暂无妖怪' : isSect ? '门派驻地 · 暂无战事' : '此地荒僻，没有妖怪出没'}
              </div>
            )}

            {lastResult && (
              <div
                className={`mt-2 rounded-xl p-2 text-[11px] ${
                  lastResult.victory ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}
              >
                {lastResult.victory
                  ? `🏆 战胜${lastResult.monster}：+${lastResult.exp} EXP · +${lastResult.gold} 金`
                  : `💀 败于${lastResult.monster}，已复活至 50% HP`}
              </div>
            )}
          </div>

          {nextGoal && (
            <div className="rounded-2xl border border-amber-900/10 bg-white p-3 shadow-sm">
              <div className="text-sm font-bold text-gray-900">下一目标 · {nextGoal.name}</div>
              <div className="mt-1 text-[11px] text-gray-500">
                需要 Lv.{nextGoal.minLevel}，或花 {nextGoal.unlockCost} 金解锁
                {goalLabel ? `；在地图上找「${goalLabel}」` : ''}
              </div>
            </div>
          )}

          {/* 前往目标 */}
          {targetCell && selectedCellId && (
            <div className="rounded-2xl border border-amber-900/10 bg-white p-3 shadow-sm">
              <div className="text-sm font-bold text-gray-900">
                前往 {targetEncounter?.label ?? TERRAIN_CONFIG[targetCell.terrain].name}
              </div>
              <div className="mt-1 text-[11px] text-gray-500">
                {TERRAIN_CONFIG[targetCell.terrain].name} · 途经 {Math.max((route?.path.length ?? 1) - 1, 0)} 格
              </div>
              {targetRec && (
                <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
                  <span className="ink-tag">推荐 Lv.{targetRec.lv}</span>
                  <span className={targetRec.dangerous ? 'text-[#8f2b23]' : ''}>{targetRec.label}</span>
                </div>
              )}
              {targetEncounter && (
                <div className="mt-1 text-[11px] text-gray-500">
                  {targetEncounter.monsters.length > 0
                    ? `此处有 ${targetEncounter.monsters.length} 种妖怪${targetEncounter.boss ? ' · 藏有首领' : ''}`
                    : '此地无战事'}
                </div>
              )}
              <button
                type="button"
                onClick={handleTravel}
                disabled={!route}
                className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg bg-amber-600 py-1.5 text-xs font-bold text-white hover:bg-amber-700 disabled:bg-gray-200 disabled:text-gray-400"
              >
                <FaShoePrints /> 前往（{route?.days ?? 0} 天）
              </button>
            </div>
          )}

          {!selectedCellId && (
            <div className="rounded-2xl border border-dashed border-gray-200 p-3 text-center text-[11px] text-gray-400">
              点击地图上任意格子查看路程，再点「前往」即可出发
            </div>
          )}
        </aside>
      </div>

      {/* 图例 */}
      <div className="flex flex-wrap items-center gap-3 border-t border-amber-900/10 bg-white/85 px-3 py-1.5 text-[11px] text-gray-500">
        <span className="flex items-center gap-1"><i className="inline-block h-2.5 w-2.5 rounded-full bg-red-600" />当前位置</span>
        <span className="flex items-center gap-1"><i className="inline-block h-2.5 w-2.5 rounded bg-[#8fa87a]" />已探索</span>
        <span className="flex items-center gap-1"><i className="inline-block h-2.5 w-2.5 rounded border border-dashed border-[#c7bfab]" />未探索</span>
        <span className="flex items-center gap-1"><i className="inline-block h-2.5 w-2.5 rounded bg-[#c1932f]" />行军路线</span>
        <span className="ml-auto hidden sm:inline">1 天 ≈ 2 分钟（挂机时时间照样流逝）</span>
      </div>
    </div>
  );
};
