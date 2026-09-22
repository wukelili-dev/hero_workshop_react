import React from 'react';
import { RARITY_NAMES } from '../../data/constants';

interface RarityBadgeProps {
  rarity: number;
  size?: 'sm' | 'md';
}

// 水墨稀有度：普通墨灰 / 少见青 / 稀有金 / 珍藏朱 / 传说紫墨
const INK_RARITY: Record<number, { ink: string; tint: string }> = {
  0: { ink: '#6b6252', tint: 'rgba(107, 98, 82, 0.12)' },
  1: { ink: '#4f7a8c', tint: 'rgba(79, 122, 140, 0.14)' },
  2: { ink: '#b08a2e', tint: 'rgba(193, 147, 47, 0.16)' },
  3: { ink: '#b5382f', tint: 'rgba(181, 56, 47, 0.13)' },
  4: { ink: '#6b4a7a', tint: 'rgba(107, 74, 122, 0.16)' },
};

export const RarityBadge: React.FC<RarityBadgeProps> = ({ rarity, size = 'sm' }) => {
  const name = RARITY_NAMES[rarity] ?? '普通';
  const tone = INK_RARITY[rarity] ?? INK_RARITY[0];
  const sizeClass = size === 'sm' ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-1 text-sm';

  return (
    <span
      className={`ink-tag ${sizeClass}`}
      style={{ color: tone.ink, borderColor: tone.ink, backgroundColor: tone.tint }}
    >
      {name}
    </span>
  );
};
