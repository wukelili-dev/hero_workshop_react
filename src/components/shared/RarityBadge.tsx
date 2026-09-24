import React from 'react';
import { RARITY_NAMES } from '../../data/constants';
import { GRADES, gradeInk, gradeTint } from '../../data/grades';

interface RarityBadgeProps {
  rarity: number;
  size?: 'sm' | 'md';
}

// 水墨稀有度：普通墨灰 / 少见青 / 稀有金 / 珍藏朱 / 传说紫墨
const INK_RARITY: Record<number, { ink: string; tint: string }> = Object.fromEntries(
  GRADES.map((g) => [g.index, { ink: gradeInk(g.index), tint: gradeTint(g.index) }])
);

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
