/**
 * TopBar - 顶部横条
 * 显示：角色名/等级/金币/资源图标
 */

import { useGameStore } from '../../store/useGameStore';

export function TopBar() {
  const { hero, materials } = useGameStore();

  const resourceIcons: Record<string, string> = {
    木材: '🌲',
    铁矿: '⛏️',
    皮革: '🧤',
    石头: '⛰️',
  };

  return (
    <header className="h-12 bg-gradient-to-r from-[#0A1E36] to-[#112244] border-b border-[#1A4080]/50 flex items-center px-4 justify-between shadow-lg shadow-[#0A1E36]/50">
      {/* 左侧：标题 */}
      <div className="flex items-center gap-3">
        <span className="text-xl">⚔️</span>
        <h1 className="text-lg font-bold text-[#C8A44A]">勇者工坊</h1>
      </div>

      {/* 中间：角色信息 */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="text-[#7AAAC8]">👤</span>
          <span className="text-[#D8EEFF] font-medium">
            {hero.name} Lv.{hero.level}
          </span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-[#1A4080]/40 rounded-lg border border-[#C8A44A]/30">
          <span className="text-[#C8A44A]">💰</span>
          <span className="text-[#C8A44A] font-bold">{hero.gold.toLocaleString()}</span>
        </div>
      </div>

      {/* 右侧：资源栏 */}
      <div className="flex items-center gap-4">
        {Object.entries(materials).map(([name, count]) => (
          <div key={name} className="flex items-center gap-1 px-2 py-1 bg-[#0A1E36]/60 rounded border border-[#1A4080]/40">
            <span>{resourceIcons[name] || '📦'}</span>
            <span className="text-[#D8EEFF] text-sm font-medium">{count}</span>
          </div>
        ))}
      </div>
    </header>
  );
}
