import React from 'react';
import { FaBomb, FaCoins } from 'react-icons/fa6';
import { AnimatedNumber } from '../../hooks/useCountUp';
import { useGameStore } from '../../store/useGameStore';

export const TopBar: React.FC = () => {
  const hero = useGameStore((s) => s.hero);
  return (
    <div className="flex items-center justify-between px-4 py-2 bg-blue-600 text-white">
      {/* Left: Title */}
      <div className="flex items-center gap-2">
        <FaBomb className="text-lg text-red-500" />
        <span className="font-bold text-base">勇者工坊 v5.1</span>
      </div>

      {/* Right: Kill count + Gold */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-blue-200">击杀: {hero.kills ?? 0}</span>
        <div className="px-3 py-0.5 bg-yellow-400 text-gray-900 rounded-full font-bold text-sm">
          <FaCoins /><AnimatedNumber value={hero.gold} />
        </div>
        <button className="text-white/80 hover:text-white text-lg">☰</button>
      </div>
    </div>
  );
};
