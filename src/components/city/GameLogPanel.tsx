/**
 * GameLogPanel - 杂项日志面板（右侧上部）
 */
import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaScroll } from 'react-icons/fa6';
import { useGameStore } from '../../store/useGameStore';

const logVariants = {
  hidden: { opacity: 0, x: -8 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: Math.min(i, 10) * 0.03, duration: 0.2, ease: 'easeOut' as const },
  }),
};

export const GameLogPanel: React.FC = () => {
  const gameLogs = useGameStore((s) => s.gameLogs);
  const logsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logsRef.current && gameLogs.length > 0) {
      logsRef.current.scrollTop = logsRef.current.scrollHeight;
    }
  }, [gameLogs]);

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toTimeString().slice(0, 5); // HH:mm
  };

  return (
    <div className="flex flex-col h-full bg-gray-50/80">
      {/* 标题 */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-gray-200 bg-white">
        <FaScroll className="text-blue-400 text-xs" />
        <span className="text-xs font-medium text-gray-700">杂项日志</span>
      </div>

      {/* 日志列表 */}
      <div ref={logsRef} className="flex-1 overflow-y-auto p-2 space-y-1">
        {gameLogs.length === 0 ? (
          <div className="text-xs text-gray-400 text-center py-4">暂无日志</div>
        ) : (
          gameLogs.slice(-50).map((log, i) => (
            <motion.div
              key={log.id}
              custom={i}
              variants={logVariants}
              initial="hidden"
              animate="visible"
              className="text-[11px] text-gray-600 leading-relaxed py-0.5 border-b border-gray-100 last:border-0"
            >
              <span className="text-gray-400 text-[10px]">{formatTime(log.timestamp)}</span>
              {' '}{log.message}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};
