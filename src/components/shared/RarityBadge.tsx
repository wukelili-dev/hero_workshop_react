import React from 'react';
import { RARITY_NAMES, RARITY_COLORS } from '../../data/constants';

interface RarityBadgeProps {
  rarity: number;
  size?: 'sm' | 'md';
}

const RARITY_BG: Record<number, string> = {
  0: 'bg-gray-700',
  1: 'bg-green-800',
  2: 'bg-blue-800',
  3: 'bg-purple-800',
  4: 'bg-orange-700',
};

const RARITY_BORDER: Record<number, string> = {
  0: 'border-gray-500',
  1: 'border-green-500',
  2: 'border-blue-500',
  3: 'border-purple-500',
  4: 'border-orange-500',
};

export const RarityBadge: React.FC<RarityBadgeProps> = ({ rarity, size = 'sm' }) => {
  const name = RARITY_NAMES[rarity] ?? '普通';
  const bg = RARITY_BG[rarity] ?? RARITY_BG[0];
  const border = RARITY_BORDER[rarity] ?? RARITY_BORDER[0];
  const sizeClass = size === 'sm' ? 'text-xs px-1.5 py-0.5' : 'text-sm px-2 py-1';

  return (
    <span
      className={`inline-block rounded border ${bg} ${border} ${sizeClass} font-bold`}
      style={{ color: RARITY_COLORS[rarity] ?? '#888' }}
    >
      {name}
    </span>
  );
};
