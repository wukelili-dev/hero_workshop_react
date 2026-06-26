/**
 * HeroInfoPanel - 人物信息面板（右侧上部）
 */
import React from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../store/useGameStore';
import { formatNumber } from '../../data/constants';
import { AnimatedNumber } from '../../hooks/useCountUp';
import { FaHeart, FaBolt, FaShield, FaStar } from 'react-icons/fa6';

export const HeroInfoPanel: React.FC = () => {
  const hero = useGameStore((s) => s.hero);
  const moralValue = useGameStore((s) => s.moralValue);

  const expPercent = hero.maxExp > 0 ? (hero.exp / hero.maxExp) * 100 : 0;
  const hpPercent = hero.maxHp > 0 ? (hero.hp / hero.maxHp) * 100 : 0;

  const getMoralLabel = (val: number) => {
    if (val >= 50) return { text: '侠义', color: 'text-blue-600' };
    if (val <= -50) return { text: '邪道', color: 'text-red-600' };
    return { text: '中立', color: 'text-gray-600' };
  };
  const moral = getMoralLabel(moralValue);

  return (
    <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 border-b border-gray-200">
      {/* 标题行 */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">🧙‍♂️</span>
          <span className="font-bold text-gray-900">{hero.name}</span>
          <span className="text-xs text-gray-500">Lv.{hero.level}</span>
        </div>
        <span className={`text-xs font-medium ${moral.color}`}>{moral.text}</span>
      </div>

      {/* 经验条 */}
      <div className="mb-2">
        <div className="flex items-center justify-between text-[10px] text-gray-500 mb-0.5">
          <span className="flex items-center gap-1"><FaStar className="text-amber-400" /> EXP</span>
          <span><AnimatedNumber value={hero.exp} /> / <AnimatedNumber value={hero.maxExp} /></span>
        </div>
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-amber-400 to-orange-400"
            initial={{ width: 0 }}
            animate={{ width: `${expPercent}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* 属性网格 */}
      <div className="grid grid-cols-4 gap-2 text-xs">
        <div className="flex items-center gap-1 text-gray-600">
          <FaHeart className="text-red-500 text-[10px]" />
          <span className="font-medium"><AnimatedNumber value={hero.hp} /></span>
          <span className="text-gray-400">/</span>
          <span className="text-gray-400">{formatNumber(hero.maxHp)}</span>
        </div>
        <div className="flex items-center gap-1 text-gray-600">
          <span className="text-red-600 text-[10px]">⚔️</span>
          <span className="font-medium">{formatNumber(hero.atk)}</span>
        </div>
        <div className="flex items-center gap-1 text-gray-600">
          <FaShield className="text-blue-500 text-[10px]" />
          <span className="font-medium">{formatNumber(hero.def)}</span>
        </div>
        <div className="flex items-center gap-1 text-gray-600">
          <FaBolt className="text-yellow-500 text-[10px]" />
          <span className="font-medium">{hero.critRate.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
};
