/**
 * HeroInfoPanel - 人物信息面板
 *
 * 三层属性都显示出来（C6 面板收尾）：
 *   核心 生命/攻击/防御/暴击 → 派生轴 命中/闪避/速度/暴击/暴伤/破甲/韧性/抗性 → 主属性 根骨/气力/身法/神识/机缘
 * 派生数字一律来自 engine/HeroCombat.heroBattlePreview，与 executeBattle 同源，
 * 面板不会出现"显示一套、结算另一套"。
 */
import React from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../store/useGameStore';
import { formatNumber, expRequired } from '../../data/constants';
import { AnimatedNumber } from '../../hooks/useCountUp';
import { FaHeart, FaBolt, FaShield, FaStar } from 'react-icons/fa6';
import { heroBattlePreview, heroBasePrimaryOf, heroGearPrimary } from '../../engine/HeroCombat';
import { sum as sumEffect, sumList } from '../../engine/ItemEffects';
import { getSkill, DEFAULT_HERO_SKILLS, MAX_ACTIVE_SKILLS } from '../../data/skills';
import type { ItemEffect, PrimaryStats } from '../../types';

const pct = (v: number) => `${(v * 100).toFixed(1)}%`;

/** 主属性 → 它主要喂哪几条派生轴（悬停提示，让玩家知道这条属性干嘛用） */
const PRIMARY_ROWS: Array<{ key: keyof PrimaryStats; label: string; feeds: string }> = [
  { key: 'root', label: '根骨', feeds: '生命 / 防御' },
  { key: 'qi', label: '气力', feeds: '攻击 / 破甲' },
  { key: 'agility', label: '身法', feeds: '速度 / 闪避 / 攻击' },
  { key: 'spirit', label: '神识', feeds: '命中 / 暴击 / 抗性 / 攻击' },
  { key: 'fortune', label: '机缘', feeds: '暴伤 / 掉落' },
];

export const HeroInfoPanel: React.FC = () => {
  const hero = useGameStore((s) => s.hero);
  const moralValue = useGameStore((s) => s.moralValue);
  const allocatePrimary = useGameStore((s) => s.allocatePrimary);

  const maxExp = expRequired(hero.level);
  const expPercent = maxExp > 0 ? (hero.exp / maxExp) * 100 : 0;

  const { derived, equipEffects } = heroBattlePreview(hero);
  /** 加点面板：只有「等级成长 + 玩家加点」是玩家能改的，装备加成单独标注 */
  const basePrimary = heroBasePrimaryOf(hero);
  const gearPrimary = heroGearPrimary(hero);
  const freePoints = hero.freePoints ?? 0;
  /** 战斗实际生效的词条 = 装备/套装/被动词条 + 随身名物持有词条（与 executeBattle 的 battleSum 同口径） */
  const eff = (kind: ItemEffect['kind']) => sumList(equipEffects, kind) + sumEffect(kind);

  const axes: Array<[string, string]> = [
    ['命中', pct(derived.hit)],
    ['闪避', pct(derived.dodge)],
    ['速度', String(Math.round(derived.speed))],
    ['暴击', pct(derived.crit)],
    ['暴伤', `${derived.critDmg.toFixed(2)}×`],
    ['破甲', String(Math.round(derived.pen))],
    ['韧性', String(Math.round(derived.tenacity))],
    ['抗性', pct(derived.resist)],
  ];

  const chips: Array<[string, string]> = [];
  const push = (label: string, value: number, asPct = false) => {
    if (value > 0) chips.push([label, asPct ? pct(Math.min(1, value)) : String(Math.round(value))]);
  };
  push('连击', eff('combo'), true);
  push('减伤', eff('damageCut'), true);
  push('吸血', eff('lifesteal'), true);
  push('反伤', eff('reflect'));
  push('反震', eff('thorns'), true);
  push('格挡', eff('guard'), true);
  push('破甲', eff('armorPen'));

  const skills = (hero.skills ?? DEFAULT_HERO_SKILLS)
    .map(getSkill)
    .filter((s): s is NonNullable<typeof s> => Boolean(s));

  const getMoralLabel = (val: number) => {
    if (val >= 50) return { text: '侠义', color: 'text-[#2f6f8f]' };
    if (val <= -50) return { text: '邪道', color: 'text-[#b5382f]' };
    return { text: '中立', color: 'text-[#6b6252]' };
  };
  const moral = getMoralLabel(moralValue);

  return (
    <div className="border-b border-[#8a7a63]/40 bg-[#faf6ea]/70 p-3">
      {/* 标题行 */}
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">🧙‍♂️</span>
          <span className="ink-title font-bold">{hero.name}</span>
          <span className="ink-tag">Lv.{hero.level}</span>
        </div>
        <span className={`text-xs font-medium ${moral.color}`}>{moral.text}</span>
      </div>

      {/* 经验条 */}
      <div className="mb-2">
        <div className="mb-0.5 flex items-center justify-between text-[10px] text-[#9c917b]">
          <span className="flex items-center gap-1"><FaStar className="text-[#b08a2e]" /> EXP</span>
          <span><AnimatedNumber value={hero.exp} /> / <AnimatedNumber value={maxExp} /></span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-[#ded6c6]">
          <motion.div
            className="h-full bg-gradient-to-r from-[#c9a24a] to-[#b5382f]"
            initial={{ width: 0 }}
            animate={{ width: `${expPercent}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* 核心四项（攻击取派生值，含身法/神识的 A 方案加成） */}
      <div className="grid grid-cols-4 gap-2 text-xs">
        <div className="flex items-center gap-1 text-[#3f3527]" title="当前生命 / 生命上限">
          <FaHeart className="text-[10px] text-[#b5382f]" />
          <span className="font-medium"><AnimatedNumber value={hero.hp} /></span>
          <span className="text-[#9c917b]">/</span>
          <span className="text-[#9c917b]">{formatNumber(hero.maxHp)}</span>
        </div>
        <div className="flex items-center gap-1 text-[#3f3527]" title="攻击：等级+装备基线，另加身法×0.5、神识×0.3">
          <span className="text-[10px] text-[#b5382f]">⚔️</span>
          <span className="font-medium">{formatNumber(Math.round(derived.atk))}</span>
        </div>
        <div className="flex items-center gap-1 text-[#3f3527]" title="防御">
          <FaShield className="text-[10px] text-[#2f6f8f]" />
          <span className="font-medium">{formatNumber(Math.round(derived.def))}</span>
        </div>
        <div className="flex items-center gap-1 text-[#3f3527]" title="暴击率">
          <FaBolt className="text-[10px] text-[#b08a2e]" />
          <span className="font-medium">{pct(derived.crit)}</span>
        </div>
      </div>

      {/* 派生轴（战斗真正读取的一层） */}
      <div className="mt-2">
        <div className="mb-1 flex items-center gap-2">
          <span className="ink-title text-[11px]">战斗属性</span>
          <span className="ink-rule flex-1" />
        </div>
        <div className="grid grid-cols-4 gap-1 text-center text-[10px]">
          {axes.map(([label, value]) => (
            <div key={label} className="ink-tag flex flex-col px-0.5 py-0.5">
              <span className="text-[#9c917b]">{label}</span>
              <span className="font-bold text-[#3f3527]">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 主属性 */}
      <div className="mt-2">
        <div className="mb-1 flex items-center gap-2">
          <span className="ink-title text-[11px]">主属性</span>
          {freePoints > 0 && (
            <span className="ink-tag gold" title="升级获得的自由点，点主属性下方的 + 分配">
              可分配 {freePoints}
            </span>
          )}
          <span className="ink-rule flex-1" />
        </div>
        <div className="grid grid-cols-5 gap-1 text-center text-[10px]">
          {PRIMARY_ROWS.map((row) => (
            <div
              key={row.key}
              className="ink-tag relative flex flex-col px-0.5 py-0.5"
              title={`${row.label}：${row.feeds}${gearPrimary[row.key] ? `（装备 +${Math.round(gearPrimary[row.key])}）` : ''}`}
            >
              <span className="text-[#9c917b]">{row.label}</span>
              <span className="font-bold text-[#3f3527]">
                {Math.round(basePrimary[row.key])}
                {gearPrimary[row.key] > 0 && (
                  <span className="text-[9px] text-[#2f6f8f]">+{Math.round(gearPrimary[row.key])}</span>
                )}
              </span>
              {freePoints > 0 && (
                <button
                  type="button"
                  onClick={() => allocatePrimary(row.key)}
                  className="absolute -right-1 -top-1 h-4 w-4 rounded-full border border-[#b5382f] bg-[#b5382f] text-[10px] leading-none text-[#fdf6e8]"
                  title={`${row.label} +1`}
                >
                  ＋
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 词条摘要 + 技能槽 */}
      {(chips.length > 0 || skills.length > 0) && (
        <div className="mt-2 flex flex-wrap items-center gap-1">
          {chips.map(([label, value]) => (
            <span key={label} className="ink-tag" title="来自装备 / 套装 / 被动 / 随身名物">
              {label} <b className="text-[#3f3527]">{value}</b>
            </span>
          ))}
          {skills.length > 0 && (
            <span className="text-[10px] text-[#9c917b]">武学 {skills.length}/{MAX_ACTIVE_SKILLS}</span>
          )}
          {skills.map((s) => (
            <span key={s.id} className="ink-tag" title={`${s.desc}（怒气 ${s.cost}）`}>
              {s.name}
              <b className="ml-0.5 text-[#b08a2e]">{s.cost}</b>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
