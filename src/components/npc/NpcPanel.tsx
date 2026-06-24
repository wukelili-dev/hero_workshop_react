/**
 * NpcPanel — NPC 展开式交互面板
 * 显示当前地图的 NPC 列表，点击展开操作面板
 */
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../store/useGameStore';
import { useNpcStore } from '../../store/useNpcStore';
import { getNpcsByMap, hasNpcs, NPCS } from '../../data/npcs';
import type { NpcDefinition } from '../../types';
import {
  greetNpc, chatNpc, inspectNpc, buyNpcTradeItem,
  challengeNpc, giftNpc, stealNpc,
} from '../../engine/NpcSystem';
import {
  FaCommentDots, FaShop, FaSkullCrossbones, FaMagnifyingGlass,
  FaGift, FaHandSparkles,
} from 'react-icons/fa6';
import { FaCoins } from 'react-icons/fa';

// ── 展开/收起动画 ──
const expandVariants = {
  collapsed: { height: 0, opacity: 0 },
  expanded: { height: 'auto', opacity: 1, transition: { duration: 0.3, ease: 'easeOut' } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.07, duration: 0.3, ease: 'easeOut' },
  }),
};

const NpcCard: React.FC<{ npc: NpcDefinition; index: number }> = ({ npc, index }) => {
  const hero = useGameStore((s) => s.hero);
  const addGameLog = useGameStore((s) => s.addGameLog);
  const expandedNpcId = useNpcStore((s) => s.expandedNpcId);
  const setExpanded = useNpcStore((s) => s.setExpanded);
  const instances = useNpcStore((s) => s.instances);
  const initMapNpcs = useNpcStore((s) => s.initMapNpcs);

  const isExpanded = expandedNpcId === npc.id;
  const inst = instances[npc.id];

  const handleToggle = () => {
    if (!inst) initMapNpcs(npc.location);
    setExpanded(isExpanded ? null : npc.id);
  };

  const doGreet = () => {
    const r = greetNpc(npc);
    if (r.type === 'log') addGameLog(r.message);
  };

  const doChat = () => {
    const r = chatNpc(npc);
    if (r.type === 'log') addGameLog(r.message);
  };

  const doInspect = () => {
    const r = inspectNpc(npc);
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
    const r = giftNpc(npc);
    if (r.type === 'log') addGameLog(r.message);
  };

  const doSteal = () => {
    const r = stealNpc(npc);
    if (r.type === 'log') addGameLog(r.message);
  };

  const hasTrades = (npc.tradeItems?.length ?? 0) > 0;
  const hasStats = npc.challengeStats != null;
  const isDefeated = inst?.state === 'defeated';

  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className="bg-white rounded-xl border border-gray-200/80 shadow-sm overflow-hidden"
    >
      {/* ── 折叠态头部 ── */}
      <button
        onClick={handleToggle}
        className="w-full flex items-center gap-3 p-3 hover:bg-gray-50/70 transition-colors text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-gray-900">{npc.name}</span>
            <span className="text-xs text-gray-400">· {npc.title}</span>
          </div>
          <div className="text-xs text-gray-500 truncate mt-0.5">{npc.description.split('\n')[0]}</div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {npc.type === 'merchant' && <FaShop className="text-amber-500 text-xs" />}
          {npc.type === 'challenger' && <FaSkullCrossbones className="text-red-500 text-xs" />}
          {npc.type === 'flavor' && <FaCommentDots className="text-purple-500 text-xs" />}
          <motion.span
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.25 }}
            className="text-gray-400 text-xs"
          >▼</motion.span>
        </div>
      </button>

      {/* ── 展开区 ── */}
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
            <div className="px-3 pb-3 space-y-2 border-t border-gray-100 pt-2">
              {/* 描述 */}
              {npc.description && (
                <div className="text-xs text-gray-500 italic whitespace-pre-line leading-relaxed">
                  {npc.description}
                </div>
              )}

              {/* 已击败标记 */}
              {isDefeated && (
                <div className="text-xs text-red-500 font-medium">⚔️ 已挑战（{inst.defeatedCount}次）</div>
              )}

              {/* ── 通用交互栏：问候 / 交谈 / 查看 / 送礼 / 偷窃 ── */}
              <div className="flex flex-wrap gap-1.5">
                <ActionButton
                  icon={<FaCommentDots />}
                  label="问候"
                  color="blue"
                  onClick={doGreet}
                />
                <ActionButton
                  icon={<FaCommentDots />}
                  label="交谈"
                  color="purple"
                  onClick={doChat}
                />
                <ActionButton
                  icon={<FaMagnifyingGlass />}
                  label="查看"
                  color="gray"
                  onClick={doInspect}
                />
                <ActionButton
                  icon={<FaGift />}
                  label="送礼"
                  color="amber"
                  onClick={doGift}
                />
                <ActionButton
                  icon={<FaHandSparkles />}
                  label="偷窃"
                  color="rose"
                  disabled={hero.hp <= 0}
                  onClick={doSteal}
                />
              </div>

              {/* ── 挑战按钮（独立一行，更显眼） ── */}
              {hasStats && (
                <div className="flex gap-1.5">
                  <ActionButton
                    icon={<FaSkullCrossbones />}
                    label={isDefeated ? '再挑战' : '挑战'}
                    color="red"
                    disabled={hero.hp <= 0}
                    onClick={doChallenge}
                  />
                  {/* 战斗统计信息 */}
                  <div className="flex gap-2 text-[10px] text-gray-400 items-center ml-1">
                    <span>❤️ {npc.challengeStats!.hp}</span>
                    <span>⚔️ {npc.challengeStats!.atk}</span>
                    <span>🛡️ {npc.challengeStats!.def}</span>
                  </div>
                </div>
              )}

              {/* 商品列表 */}
              {hasTrades && (
                <div className="space-y-1">
                  <div className="text-xs font-medium text-amber-700 mt-1">📦 可购买：</div>
                  {npc.tradeItems!.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between bg-amber-50/60 rounded-lg px-2.5 py-1.5"
                    >
                      <div className="text-xs">
                        <span className="text-gray-800 font-medium">{item.label}</span>
                        {item.dialogue && (
                          <span className="text-gray-400 ml-1 text-[11px]">—— {item.dialogue}</span>
                        )}
                      </div>
                      <button
                        onClick={() => doBuy(idx)}
                        disabled={hero.gold < item.price}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors shrink-0 ${
                          hero.gold >= item.price
                            ? 'bg-amber-500 text-white hover:bg-amber-600'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        <FaCoins className="text-[10px]" />
                        {item.price}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

/** 小型操作按钮组件 */
const ActionButton: React.FC<{
  icon: React.ReactNode;
  label: string;
  color: 'blue' | 'purple' | 'gray' | 'red' | 'amber' | 'rose';
  disabled?: boolean;
  onClick: () => void;
}> = ({ icon, label, color, disabled, onClick }) => {
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
      className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] font-medium transition-all ${
        disabled
          ? 'bg-gray-100 text-gray-300 cursor-not-allowed border-gray-100'
          : colorMap[color]
      }`}
    >
      <span className="text-[10px]">{icon}</span>
      {label}
    </button>
  );
};

// ── 主面板 ──

interface NpcPanelProps {
  mapId: string;
}

export const NpcPanel: React.FC<NpcPanelProps> = ({ mapId }) => {
  const mapBattles = useGameStore((s) => s.mapBattles);
  const explorationFlags = useNpcStore((s) => s.explorationFlags);
  const setExplorationFlag = useNpcStore((s) => s.setExplorationFlag);
  const addGameLog = useGameStore((s) => s.addGameLog);

  // 分离隐藏Boss与普通NPC
  const liuerNpc = NPCS.find(n => n.id === 'huaguo_liuermihou');
  const regularNpcs = getNpcsByMap(mapId).filter(n => {
    if (n.id === 'huaguo_liuermihou') return false;
    // 剧情锁：魏征 / 唐王 / 玄奘 需对应事件解锁才显示
    if (n.id === 'changan_weizheng') return !!explorationFlags['weizheng_unlocked'];
    if (n.id === 'changan_tangwang') return !!explorationFlags['tangwang_unlocked'];
    if (n.id === 'changan_xuanzang') return !!explorationFlags['xuanzang_unlocked'];
    return true;
  });
  const isLiuerRevealed = explorationFlags['liuermi_explored'] ?? false;

  // 检查六耳猕猴触发条件
  let canRevealLiuer = false;
  let revealMessage = '';
  if (mapId === 'huaguoshan' && !isLiuerRevealed) {
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

  // 观音事件计数
  const guanyinCount = explorationFlags['guanyin_encounters']
    ? parseInt(explorationFlags['guanyin_encounters'] as any, 10)
    : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1 mb-1">
        <span className="text-sm">🏘️</span>
        <span className="text-sm font-bold text-gray-700">人物</span>
        <span className="text-xs text-gray-400 ml-auto">
          {regularNpcs.length + (isLiuerRevealed ? 1 : 0)}位
        </span>
      </div>

      {/* 隐藏Boss：六耳猕猴探索入口 */}
      {mapId === 'huaguoshan' && !isLiuerRevealed && canRevealLiuer && (
        <motion.div
          custom={999}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-200/80 shadow-sm overflow-hidden"
        >
          <div className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🌊</span>
              <span className="font-bold text-sm text-purple-800">水帘洞深处</span>
              <span className="text-[10px] text-purple-400 ml-auto">隐藏区域</span>
            </div>
            <div className="text-xs text-gray-600 italic mb-2">{revealMessage}</div>
            <button
              onClick={doExploreDeep}
              className="w-full py-2 bg-purple-600 text-white text-xs font-bold rounded-lg hover:bg-purple-700 transition-colors"
            >
              探索深处 →
            </button>
          </div>
        </motion.div>
      )}

      {/* 六耳猕猴（已揭示） */}
      {isLiuerRevealed && liuerNpc && (
        <NpcCard key={liuerNpc.id} npc={liuerNpc} index={0} />
      )}

      {/* 普通NPC列表 */}
      {regularNpcs.map((npc, i) => (
        <NpcCard key={npc.id} npc={npc} index={isLiuerRevealed ? i + 1 : i} />
      ))}

      {/* 观音事件剩余提示 */}
      {guanyinCount > 0 && guanyinCount < 5 && (
        <div className="text-[10px] text-gray-300 text-center mt-2">
          {guanyinCount < 5 ? `莲台微光 ×${guanyinCount}/5` : ''}
        </div>
      )}
    </div>
  );
};

/** 地图的 NPC 数量标记（用于地图按钮右上角标记） */
export const NpcBadge: React.FC<{ mapId: string }> = ({ mapId }) => {
  if (!hasNpcs(mapId)) return null;
  const count = getNpcsByMap(mapId).length;
  return (
    <span className="absolute -top-1 -right-1 text-[9px] bg-amber-500 text-white rounded-full w-3.5 h-3.5 flex items-center justify-center font-bold shadow">
      {count}
    </span>
  );
};
