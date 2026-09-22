import React from 'react';
import { FaCoins } from 'react-icons/fa6';
import { AnimatedNumber } from '../../hooks/useCountUp';
import { useGameStore } from '../../store/useGameStore';
import { dayNumber, shichenOf, useWorldStore } from '../../store/useWorldStore';

export const TopBar: React.FC = () => {
  const hero = useGameStore((s) => s.hero);
  const dayNo = useWorldStore((s) => dayNumber(s.day));
  const shichen = useWorldStore((s) => shichenOf(s.day));
  return (
    <div className="flex items-center gap-2 border-b border-[#8a7a63] bg-[#faf6ea]/95 px-3 py-1.5 md:gap-3 md:px-4 md:py-2">
      {/* 左：印 + 题名 */}
      <div className="flex items-center gap-2">
        <span className="ink-title inline-flex h-6 min-w-6 items-center justify-center rounded-[3px] bg-[#b5382f] px-1.5 text-[15px] text-[#fdf6e8]">
          勇
        </span>
        <span className="ink-title text-base md:text-lg">勇者工坊</span>
      </div>
      <span className="ink-tag hidden px-2 py-0.5 sm:inline-block">第 {dayNo} 天 · {shichen}</span>
      <span className="ink-tag px-2 py-0.5 sm:hidden">{dayNo} 天</span>

      {/* 右：击杀 + 金币 */}
      <div className="ml-auto flex items-center gap-2 md:gap-4">
        <span className="hidden text-sm text-[#6b6252] sm:inline">
          击杀 <b className="text-[#3f3527]">{hero.kills ?? 0}</b>
        </span>
        <span className="inline-flex items-center gap-1 border border-[#b08a2e] bg-[#f6edd6] px-2 py-0.5 text-sm font-bold text-[#8a6b2a]">
          <FaCoins />
          <AnimatedNumber value={hero.gold} />
        </span>
        <button className="ink-btn px-2 py-0.5 text-sm" type="button" aria-label="菜单">
          ☰
        </button>
      </div>
    </div>
  );
};
