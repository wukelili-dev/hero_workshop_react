/**
 * CenterPanel - 中间面板：勇者面板（完整属性 + 红血条/绿经验条 + 背包）
 *
 * 怪物与战斗只在「世界地图」页（InkMapPanel 的 MonsterCard）；本页不再出现敌人。
 */
import React from 'react';
import { motion, type Variants } from 'framer-motion';
import { useGameStore } from '../../store/useGameStore';
import { useInventoryStore } from '../../store/useInventoryStore';
import { FaUsers, FaBagShopping } from 'react-icons/fa6';
import { heroBattlePreview } from '../../engine/HeroCombat';
import { sumList } from '../../engine/ItemEffects';
import { potionHealOf } from '../../store/useGameStore';
import { InventoryGrid } from '../inventory/InventoryGrid';

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

/** 血条（朱红）与经验条（翠绿） */
function StatBar({ value, max, color, label }: { value: number; max: number; color: string; label: string }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div className="relative h-5 w-full rounded-full overflow-hidden bg-[#e8e2d2] border border-[#c7bfab]">
      <div className="h-full rounded-full transition-all duration-300" style={{ width: `${pct}%`, backgroundColor: color }} />
      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-[#3f3527] drop-shadow-[0_1px_0_rgba(255,255,255,0.6)]">
        {label}
      </span>
    </div>
  );
}

export const CenterPanel: React.FC = () => {
  const hero = useGameStore((s) => s.hero);
  const autoBattle = useGameStore((s) => s.autoBattle);
  const setAutoBattle = useGameStore((s) => s.setAutoBattle);
  const moralTitle = useGameStore((s) => s.getMoralTitle?.());

  // 面板唯一读取层：与战斗同一份口径（C6/C7）
  const preview = heroBattlePreview(hero);
  const d = preview.derived;
  const eff = preview.equipEffects;

  // 战斗词条（只显示非零项）
  const lifesteal = sumList(eff, 'lifesteal');
  const combo = sumList(eff, 'combo');
  const reflect = sumList(eff, 'reflect');
  const damageCut = sumList(eff, 'damageCut');

  // 背包里的药水总数（购买进的背包格）+ 旧档 potions 计数
  const slots = useInventoryStore((s) => s.slots);
  const bagPotions = slots.reduce((n, s) => (s && s.type === 'novelty' && potionHealOf(s.id) > 0 ? n + s.qty : n), 0);
  const potionTotal = bagPotions + (hero.potions ?? 0);

  const primaryRows: [string, number][] = [
    ['根骨', preview.primary.root],
    ['气力', preview.primary.qi],
    ['身法', preview.primary.agility],
    ['神识', preview.primary.spirit],
    ['机缘', preview.primary.fortune],
  ];

  const combatRows: [string, string][] = [
    ['攻击', String(Math.round(d.atk))],
    ['防御', String(Math.round(d.def))],
    ['命中', `${(d.hit * 100).toFixed(0)}%`],
    ['闪避', `${(d.dodge * 100).toFixed(0)}%`],
    ['速度', String(Math.round(d.speed))],
    ['暴击', `${(d.crit * 100).toFixed(0)}%`],
    ['暴伤', `${d.critDmg.toFixed(2)}x`],
    ['破甲', String(Math.round(d.pen))],
    ['韧性', String(Math.round(d.tenacity))],
    ['抗性', `${(d.resist * 100).toFixed(0)}%`],
  ];

  return (
    <div className="h-full overflow-y-auto p-2 space-y-2.5">
      {/* 队伍标签栏 */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold text-gray-700 flex items-center gap-1"><FaUsers /> 队伍</span>
        <div className="flex gap-1.5">
          {(['勇者', '队友', '全队'] as const).map((label, i) => (
            <motion.button
              key={label}
              whileTap={{ scale: 0.92 }}
              className={`px-4 py-1 rounded-full text-sm font-medium transition-colors ${
                i === 0 ? 'bg-[#b5382f] text-white shadow' : 'bg-gray-200 text-gray-500'
              }`}
            >
              {label}
            </motion.button>
          ))}
        </div>
        <span className="ml-auto text-xs text-gray-400">🧙 {hero.name}</span>
      </div>

      {/* 英雄属性卡：红血条 + 绿经验条 + 完整属性 */}
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="ink-panel ink-frame rounded-xl p-2 space-y-2"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">🧙</span>
          <span className="font-bold text-[#3f3527]">{hero.name}</span>
          {moralTitle === '至圣' && <span className="text-[#c1932f] font-bold ml-1">✨ 至圣</span>}
          {moralTitle === '魔王' && <span className="text-[#b5382f] font-bold ml-1">💀 魔王</span>}
          <span className="text-sm text-[#2f6f8f] font-bold">Lv.{hero.level}</span>
          <span className="ml-auto text-xs text-[#c1932f] font-bold">💰 {hero.gold.toLocaleString()}</span>
        </div>

        {/* 血量条（红） */}
        <StatBar
          value={hero.hp}
          max={hero.maxHp}
          color="#b5382f"
          label={`生命 ${hero.hp}/${hero.maxHp}`}
        />
        {/* 经验条（绿） */}
        <StatBar
          value={hero.exp}
          max={hero.level * 100}
          color="#4a7c59"
          label={`经验 ${hero.exp}/${hero.level * 100}`}
        />

        {/* 五行主属性 */}
        <div>
          <div className="text-[11px] font-medium text-[#6b6252] mb-1">主属性</div>
          <div className="grid grid-cols-5 gap-1 text-center">
            {primaryRows.map(([label, v]) => (
              <div key={label} className="rounded bg-[#f3efe4] py-1">
                <div className="text-[10px] text-[#9c917b]">{label}</div>
                <div className="text-sm font-bold text-[#3f3527]">{v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 战斗属性 */}
        <div>
          <div className="text-[11px] font-medium text-[#6b6252] mb-1">战斗</div>
          <div className="grid grid-cols-5 gap-1 text-center">
            {combatRows.map(([label, v]) => (
              <div key={label} className="rounded bg-[#f3efe4] py-1">
                <div className="text-[10px] text-[#9c917b]">{label}</div>
                <div className="text-xs font-bold text-[#3f3527]">{v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 装备词条（非零才显示） */}
        {(lifesteal > 0 || combo > 0 || reflect > 0 || damageCut > 0) && (
          <div className="flex flex-wrap gap-1">
            {lifesteal > 0 && <span className="ink-tag text-[10px]">吸血 +{lifesteal}%</span>}
            {combo > 0 && <span className="ink-tag text-[10px]">连击 +{combo}%</span>}
            {reflect > 0 && <span className="ink-tag text-[10px]">反弹 +{reflect}%</span>}
            {damageCut > 0 && <span className="ink-tag text-[10px]">减伤 +{damageCut}%</span>}
          </div>
        )}

        {/* 装备 + 其他 */}
        <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-[#6b6252] border-t border-[#8a7a63]/30 pt-1.5">
          <span>武器 <b className="text-[#3f3527]">{hero.weapon?.name ?? '空手'}</b></span>
          <span>护甲 <b className="text-[#3f3527]">{hero.armor?.name ?? '布衣'}</b></span>
          <span>善恶 <b className={hero.moralValue >= 0 ? 'text-[#4f7a8c]' : 'text-[#b5382f]'}>{hero.moralValue}</b></span>
          <span>击杀 <b className="text-[#3f3527]">{hero.kills ?? 0}</b></span>
        </div>
      </motion.div>

      {/* 药水与自动挂机 */}
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.1 }}
        className="p-2 border border-[#c1932f]/40 rounded-xl bg-[#f6edd6]/60"
      >
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-[#8a6b2a]">💊 药水（背包）</span>
          <span className="text-xs font-bold text-[#8a6b2a]">x{potionTotal}</span>
        </div>
        <div className="flex gap-2">
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={() => { if (!useGameStore.getState().buyPotion()) alert(useGameStore.getState().hero.gold < 25 ? '金币不足！' : '背包已满！'); }}
            className="flex-1 py-1 bg-[#c1932f] hover:bg-[#a87e26] text-white rounded text-[11px] font-medium transition-colors shadow-sm"
          >购买 (25G)</motion.button>
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={() => { if (!useGameStore.getState().usePotion()) alert(potionTotal <= 0 ? '没有药水！' : 'HP已满！'); }}
            disabled={potionTotal <= 0 || hero.hp >= hero.maxHp}
            className={`flex-1 py-1 rounded text-[11px] font-medium transition-colors ${potionTotal <= 0 || hero.hp >= hero.maxHp ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-[#4a7c59] hover:bg-[#3d6a4b] text-white shadow-sm'}`}
          >喝药（从背包）</motion.button>
        </div>
        <div className="flex items-center gap-1.5 mt-1.5">
          <span className="text-[10px] text-[#8a6b2a]">自动喝药：</span>
          {[0, 30, 50, 80].map((v) => (
            <button
              key={v}
              onClick={() => useGameStore.getState().setAutoPotionThreshold(v)}
              className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors ${useGameStore.getState().autoPotionThreshold === v ? 'bg-[#8a6b2a] text-white' : 'bg-[#ede2c4] text-[#8a6b2a] hover:bg-[#e2d3ab]'}`}
            >{v === 0 ? '关' : `${v}%`}</button>
          ))}
          <span className="ml-auto text-[10px] text-[#8a6b2a]">自动战斗：</span>
          <button
            onClick={() => setAutoBattle(!autoBattle)}
            className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${autoBattle ? 'bg-[#b5382f] text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
          >{autoBattle ? '🔴 开启' : '⚪ 关闭'}</button>
        </div>
      </motion.div>

      {/* 背包（购买/掉落的药水都放这里） */}
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.15 }}
        className="ink-panel ink-frame rounded-xl p-2"
      >
        <div className="text-xs font-bold text-[#3f3527] flex items-center gap-1 mb-2">
          <FaBagShopping /> 背包
          <span className="text-[10px] font-normal text-[#9c917b] ml-1">点装备穿上 · 点药水使用</span>
        </div>
        <InventoryGrid />
      </motion.div>

      {/* 提示：怪物与人物的去处 */}
      <div className="ink-panel p-2 text-xs leading-relaxed text-[#6b6252]">
        与妖怪的战斗请到「世界地图」点妖怪出手；此处的人物、关系与全部互动（交谈 / 赠礼 / 偷窃 / 结交 / 求婚…）都在「人物志 · 关系网」。
      </div>
    </div>
  );
};
