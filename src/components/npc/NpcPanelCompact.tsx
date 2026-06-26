/**
 * NpcPanelCompact — 紧凑版NPC面板（右上角）
 * 显示当前地图的NPC列表，简化交互
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../store/useGameStore';
import { useNpcStore } from '../../store/useNpcStore';
import { getNpcsByMap, hasNpcs, NPCS } from '../../data/npcs';
import type { NpcDefinition } from '../../types';
import {
  greetNpc, chatNpc, buyNpcTradeItem,
  challengeNpc, stealNpc, isNpcUnlocked,
} from '../../engine/NpcSystem';
import { GiftModal } from './GiftModal';
import {
  FaCommentDots, FaShop, FaSkullCrossbones,
  FaGift, FaHandSparkles,
} from 'react-icons/fa6';
import { FaCoins } from 'react-icons/fa';

const expandVariants = {
  collapsed: { height: 0, opacity: 0 },
  expanded: { height: 'auto', opacity: 1, transition: { duration: 0.25, ease: 'easeOut' as const } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.05, duration: 0.2, ease: 'easeOut' as const },
  }),
};

const NpcCardCompact: React.FC<{ npc: NpcDefinition; index: number }> = ({ npc, index }) => {
  const hero = useGameStore((s) => s.hero);
  const addGameLog = useGameStore((s) => s.addGameLog);
  const expandedNpcId = useNpcStore((s) => s.expandedNpcId);
  const setExpanded = useNpcStore((s) => s.setExpanded);
  const instances = useNpcStore((s) => s.instances);
  const initMapNpcs = useNpcStore((s) => s.initMapNpcs);
  const getNpcGold = useNpcStore((s) => s.getNpcGold);
  const getNpcAffinity = useNpcStore((s) => s.getNpcAffinity);
  const getAffinityDiscount = useNpcStore((s) => s.getAffinityDiscount);

  const isExpanded = expandedNpcId === npc.id;
  const inst = instances[npc.id];
  const [showGift, setShowGift] = useState(false);

  const handleToggle = () => {
    if (!inst) initMapNpcs(npc.location);
    setExpanded(isExpanded ? null : npc.id);
    if (!isExpanded) {
      const addDiscoveredNpc = useGameStore.getState().addDiscoveredNpc;
      addDiscoveredNpc(npc.id);
    }
  };

  const doGreet = () => {
    const r = greetNpc(npc);
    if (r.type === 'log') addGameLog(r.message);
  };

  const doChat = () => {
    const r = chatNpc(npc);
    if (r.type === 'log') addGameLog(r.message);
  };

  const doBuy = (idx: number) => {
    const r = buyNpcTradeItem(npc, idx);
    if (r.type === 'log') addGameLog(r.message);
  };

  const doChallenge = () => {
    const r = challengeNpc(npc);
    if (r.type === 'log') addGameLog(r.message);
  };

  const doGift = () => {
    setShowGift(true);
  };

  const doSteal = () => {
    stealNpc(npc);
  };

  const npcGold = getNpcGold(npc.id);
  const npcAffinity = getNpcAffinity(npc.id);
  const discount = getAffinityDiscount(npc.id);
  const isBroken = npcGold <= 0;

  const stealRateDisplay = (() => {
    const baseRate = 0.05 + (hero.level ?? 1) * 0.008;
    const difficultyMod = npc.stealDifficulty ?? 0;
    const rate = Math.max(0.02, Math.min(baseRate * (1 - difficultyMod), 0.20));
    return (rate * 100).toFixed(1);
  })();

  const hasTrades = (npc.tradeItems?.length ?? 0) > 0;
  const hasStats = npc.challengeStats != null;
  const isDefeated = inst?.state === 'defeated';

  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className="bg-white rounded-lg border border-gray-200/80 shadow-sm overflow-hidden"
    >
      {/* 折叠态头部 */}
      <button
        onClick={handleToggle}
        className="w-full flex items-center gap-2 p-2 hover:bg-gray-50/70 transition-colors text-left"
      >
        <span className="text-base">{npc.avatarEmoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span className="font-medium text-xs text-gray-900">{npc.name}</span>
            <span className="text-[10px] text-gray-400">· {npc.title}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {npc.type === 'merchant' && <FaShop className="text-amber-500 text-[10px]" />}
          {npc.type === 'challenger' && <FaSkullCrossbones className="text-red-500 text-[10px]" />}
          {isDefeated && <span className="text-[9px] text-red-400">已击败</span>}
          <motion.span
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="text-gray-400 text-[10px]"
          >▼</motion.span>
        </div>
      </button>

      {/* 展开区 */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            key="expand"
            variants={expandVariants}
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
            className="overflow-hidden"
          >
            <div className="px-2 pb-2 space-y-1.5 border-t border-gray-100 pt-1.5">
              {/* 金币 + 亲密度 */}
              <div className="flex items-center gap-2 text-[10px]">
                <span className={`flex items-center gap-0.5 ${isBroken ? 'text-red-400' : 'text-amber-600'}`}>
                  <FaCoins className="text-[9px]" />
                  {npcGold}G
                </span>
                <span className="flex items-center gap-0.5 text-pink-600">
                  <span className="text-[9px] font-medium">亲密度</span>
                  <span className="text-pink-500 text-[9px]">{npcAffinity}</span>
                </span>
                {discount < 1 && (
                  <span className="text-green-600 font-medium text-[9px]">{Math.round((1 - discount) * 100)}%OFF</span>
                )}
              </div>

              {/* 快捷交互栏 */}
              <div className="flex flex-wrap gap-1">
                <ActionButton icon={<FaCommentDots />} label="问候" onClick={doGreet} />
                <ActionButton icon={<FaCommentDots />} label="交谈" onClick={doChat} />
                <ActionButton icon={<FaGift />} label="送礼" onClick={doGift} />
                <ActionButton
                  icon={<FaHandSparkles />}
                  label={`偷窃(${stealRateDisplay}%)`}
                  color="rose"
                  disabled={hero.hp <= 0}
                  onClick={doSteal}
                />
                {hasStats && (
                  <ActionButton
                    icon={<FaSkullCrossbones />}
                    label={isDefeated ? '再挑战' : '挑战'}
                    color="red"
                    disabled={hero.hp <= 0}
                    onClick={doChallenge}
                  />
                )}
              </div>

              {/* 商品列表 */}
              {hasTrades && (
                <div className="space-y-0.5">
                  <div className="text-[10px] font-medium text-amber-700">📦 商品：</div>
                  {npc.tradeItems!.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between bg-amber-50/60 rounded px-2 py-1"
                    >
                      <span className="text-[10px] text-gray-800">{item.label}</span>
                      <button
                        onClick={() => doBuy(idx)}
                        disabled={hero.gold < Math.ceil(item.price * discount)}
                        className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-medium transition-colors ${
                          hero.gold >= Math.ceil(item.price * discount)
                            ? 'bg-amber-500 text-white hover:bg-amber-600'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        <FaCoins className="text-[8px]" />
                        {Math.ceil(item.price * discount)}
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {/* 送礼弹窗 */}
              {showGift && (
                <GiftModal npc={npc} onClose={() => setShowGift(false)} />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const ActionButton: React.FC<{
  icon: React.ReactNode;
  label: string;
  color?: 'blue' | 'purple' | 'gray' | 'red' | 'amber' | 'rose';
  disabled?: boolean;
  onClick: () => void;
}> = ({ icon, label, color = 'blue', disabled, onClick }) => {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200',
    purple: 'bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200',
    gray: 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-gray-200',
    red: 'bg-red-50 text-red-600 hover:bg-red-100 border-red-200',
    amber: 'bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200',
    rose: 'bg-rose-50 text-rose-600 hover:bg-rose-100 border-rose-200',
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded border text-[9px] font-medium transition-all ${
        disabled ? 'bg-gray-100 text-gray-300 cursor-not-allowed border-gray-100' : colorMap[color]
      }`}
    >
      <span className="text-[8px]">{icon}</span>
      {label}
    </button>
  );
};

export const NpcPanelCompact: React.FC = () => {
  const currentMapId = useGameStore((s) => s.currentMapId);
  const explorationFlags = useNpcStore((s) => s.explorationFlags);
  const setExplorationFlag = useNpcStore((s) => s.setExplorationFlag);
  const addGameLog = useGameStore((s) => s.addGameLog);
  const mapBattles = useGameStore((s) => s.mapBattles);

  if (!hasNpcs(currentMapId)) {
    return (
      <div className="p-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-1 mb-1">
          <span className="text-sm">🏘️</span>
          <span className="text-sm font-bold text-gray-700">人物</span>
        </div>
        <div className="text-xs text-gray-400 text-center py-2">当前地图暂无人物</div>
      </div>
    );
  }

  // 分离隐藏Boss与普通NPC
  const liuerNpc = NPCS.find(n => n.id === 'huaguo_liuermihou');
  const regularNpcs = getNpcsByMap(currentMapId).filter(n => {
    if (n.id === 'huaguo_liuermihou') return false;
    if (n.unlockCondition) return isNpcUnlocked(n);
    return true;
  });
  const isLiuerRevealed = explorationFlags['liuermi_explored'] ?? false;

  // 检查六耳猕猴触发条件
  let canRevealLiuer = false;
  let revealMessage = '';
  if (currentMapId === 'huaguoshan' && !isLiuerRevealed) {
    const tongbeiDefeated = useNpcStore.getState().instances['huaguo_tongbei']?.defeatedCount > 0;
    const huaguoBattles = mapBattles?.['huaguoshan'] ?? 0;
    if (tongbeiDefeated && huaguoBattles >= 500) {
      canRevealLiuer = true;
      revealMessage = '你在水帘洞深处听到洞壁传来若有若无的回声——似乎别有洞天。';
    }
  }

  const doExploreDeep = () => {
    setExplorationFlag('liuermi_explored');
    addGameLog('✨ 你循着回声深入水帘洞深处……\n一个与孙悟空一般无二的猴子端坐在石台上，正等着你。\n\n【六耳猕猴现身！】');
  };

  return (
    <div className="p-2 bg-gray-50 border-b border-gray-200 overflow-y-auto">
      <div className="flex items-center gap-1 mb-2">
        <span className="text-sm">🏘️</span>
        <span className="text-sm font-bold text-gray-700">人物</span>
        <span className="text-xs text-gray-400 ml-auto">
          {regularNpcs.length + (isLiuerRevealed ? 1 : 0)}位
        </span>
      </div>

      {/* 隐藏Boss：六耳猕猴探索入口 */}
      {currentMapId === 'huaguoshan' && !isLiuerRevealed && canRevealLiuer && (
        <motion.div
          custom={999}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200/80 shadow-sm overflow-hidden mb-2"
        >
          <div className="p-2">
            <div className="flex items-center gap-1 mb-1">
              <span className="text-base">🌊</span>
              <span className="font-bold text-xs text-purple-800">水帘洞深处</span>
            </div>
            <div className="text-[10px] text-gray-600 italic mb-1">{revealMessage}</div>
            <button
              onClick={doExploreDeep}
              className="w-full py-1.5 bg-purple-600 text-white text-xs font-bold rounded hover:bg-purple-700 transition-colors"
            >
              探索深处 →
            </button>
          </div>
        </motion.div>
      )}

      {/* 六耳猕猴（已揭示） */}
      {isLiuerRevealed && liuerNpc && (
        <NpcCardCompact key={liuerNpc.id} npc={liuerNpc} index={0} />
      )}

      {/* 普通NPC列表 */}
      <div className="space-y-1.5">
        {regularNpcs.map((npc, i) => (
          <NpcCardCompact key={npc.id} npc={npc} index={isLiuerRevealed ? i + 1 : i} />
        ))}
      </div>
    </div>
  );
};
