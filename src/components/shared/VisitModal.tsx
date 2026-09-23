/**
 * VisitModal — 主动来访弹窗
 * 到期来访：NPC 上门寻仇，玩家四选一（应战/破财/躲开/求助）。
 */
import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { FaCrosshairs, FaCoins, FaDoorOpen, FaHandshakeAngle } from 'react-icons/fa6';
import { NPCS } from '../../data/npcs';
import type { PendingVisit } from '../../types';
import { payoffCost, resolveVisit } from '../../engine/VisitSystem';

interface VisitModalProps {
  visit: PendingVisit;
  onClose: () => void;
}

export const VisitModal: React.FC<VisitModalProps> = ({ visit, onClose }) => {
  const npc = useMemo(() => NPCS.find((n) => n.id === visit.npcId), [visit.npcId]);
  const cost = useMemo(() => payoffCost(visit), [visit]);
  const [result, setResult] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handle = (choice: 'fight' | 'pay' | 'avoid' | 'help') => {
    const r = resolveVisit(visit, choice);
    setResult(r.message);
    setDone(r.ok);
  };

  const name = npc?.name ?? '陌生人';
  const emoji = npc?.avatarEmoji ?? '🚪';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && done && onClose()}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="ink-panel ink-frame w-full max-w-sm p-5 text-[#3f3527]"
      >
        <div className="ink-head mb-3">
          <span className="text-2xl">{emoji}</span>
          <h3 className="ink-title ml-2 text-lg">有人找上门</h3>
          <span className="ink-tag ml-auto">第 {visit.arriveDay} 天</span>
        </div>

        <p className="mb-4 text-sm leading-relaxed text-[#6b6252]">
          {npc?.title ? `【${npc.title}】` : ''}{name} 拦在了你面前：<span className="text-[#b5382f]">{visit.reason}</span>
        </p>

        {!done ? (
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => handle('fight')} className="ink-btn flex items-center justify-center gap-1.5 text-sm">
              <FaCrosshairs /> 应战
            </button>
            <button type="button" onClick={() => handle('pay')} className="ink-btn flex items-center justify-center gap-1.5 text-sm">
              <FaCoins /> 破财（{cost} 金）
            </button>
            <button type="button" onClick={() => handle('avoid')} className="ink-btn flex items-center justify-center gap-1.5 text-sm">
              <FaDoorOpen /> 躲开
            </button>
            <button type="button" onClick={() => handle('help')} className="ink-btn flex items-center justify-center gap-1.5 text-sm">
              <FaHandshakeAngle /> 求助
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm leading-relaxed text-[#3f3527]">{result}</p>
            <button type="button" onClick={onClose} className="ink-btn-seal w-full text-sm">知道了</button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};
