import React from 'react';
import { ITEM_GRADE_NAME, type ItemEffect, type ItemGrade } from '../../types';
import { EFFECT_LABEL } from '../../engine/ItemEffects';

/** 品阶五色（与 RarityBadge 水墨稀有度一致）：凡品墨灰/良品青/珍品金/秘宝朱/神物紫墨 */
const GRADE_COLORS: Record<number, string> = {
  0: '#6b6252',
  1: '#4f7a8c',
  2: '#b08a2e',
  3: '#b5382f',
  4: '#6b4a7a',
};

/** 百分比类词条（显示 ×100 加 %） */
const PERCENT_KINDS = new Set<string>([
  'crit', 'critDmg', 'armorPen', 'lifesteal', 'combo', 'reflect', 'damageCut',
  'shopPrice', 'sellPrice', 'gatherBonus', 'affinityGain', 'reputation',
]);

const SOURCE_LABEL: Record<string, string> = {
  drop: '掉落', shop: '商店', npc: 'NPC', gather: '采集',
  bounty: '悬赏', steal: '偷窃', craft: '锻造',
};

/** 把单条词条格式化为中文可读文本，如「疾行 +1」「减伤 +10%」 */
export function formatEffect(e: ItemEffect): string {
  const label = EFFECT_LABEL[e.kind] ?? e.kind;
  if (PERCENT_KINDS.has(e.kind)) {
    const pct = Math.round(e.value * 100);
    return `${label} ${e.value > 0 ? '+' : ''}${pct}%`;
  }
  return `${label} ${e.value > 0 ? '+' : ''}${e.value}`;
}

export interface ItemCardProps {
  name: string;
  grade?: number;
  lore?: string;
  effects?: ItemEffect[];
  price?: number;
  source?: string;
  /** 右侧操作区（购买/使用/出售按钮等） */
  footer?: React.ReactNode;
  /** 未发现时置灰 */
  dimmed?: boolean;
}

/**
 * 统一物品卡：品阶 + 来历 + 词条 + 来源 + 售价。
 * 背包 / 材料 / 杂货 / 图鉴四处复用，样式统一为水墨风。
 */
export const ItemCard: React.FC<ItemCardProps> = ({
  name,
  grade = 0,
  lore,
  effects,
  price,
  source,
  footer,
  dimmed,
}) => {
  const color = GRADE_COLORS[grade] ?? GRADE_COLORS[0];
  const gradeName = ITEM_GRADE_NAME[grade as ItemGrade] ?? '凡品';
  const effectList = (effects ?? []).filter((e) => e.trigger !== 'use' || e.kind === 'heal' || e.kind === 'exp');

  return (
    <div
      className={`rounded-lg border p-3 transition-all duration-200 ${
        dimmed
          ? 'bg-gray-100 border-gray-200 opacity-60'
          : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          <span className="font-bold text-sm" style={{ color: color, fontFamily: 'var(--font-kai, KaiTi, serif)' }}>
            {name}
          </span>
          <span
            className="text-[10px] px-1.5 py-0.5 rounded"
            style={{ color, borderColor: color, backgroundColor: `${color}1f`, borderWidth: 1, borderStyle: 'solid' }}
          >
            {gradeName}
          </span>
          {source && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
              {SOURCE_LABEL[source] ?? source}
            </span>
          )}
        </div>
        {typeof price === 'number' && (
          <span className="text-xs text-yellow-600 font-medium shrink-0">💰{price}</span>
        )}
      </div>

      {lore && <div className="text-xs text-gray-500 mt-1.5 leading-relaxed">{lore}</div>}

      {effectList.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {effectList.map((e, i) => (
            <span
              key={i}
              className="text-[10px] px-1.5 py-0.5 rounded"
              style={{ color: '#6b4a7a', backgroundColor: 'rgba(107,74,122,0.10)' }}
            >
              {formatEffect(e)}
            </span>
          ))}
        </div>
      )}

      {footer && <div className="mt-2 flex items-center justify-end gap-2">{footer}</div>}
    </div>
  );
};
