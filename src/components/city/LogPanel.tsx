import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaBomb, FaScroll } from 'react-icons/fa6';
import { useGameStore } from '../../store/useGameStore';

type LogTab = 'battle' | 'game';

const logVariants = {
  hidden: { opacity: 0, x: -8 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: Math.min(i, 10) * 0.03, duration: 0.2, ease: 'easeOut' as const },
  }),
};

export const LogPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<LogTab>('battle');
  const battleLogs = useGameStore((s) => s.battleLogs);
  const gameLogs = useGameStore((s) => s.gameLogs);

  const logs = activeTab === 'battle' ? battleLogs : gameLogs;

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toTimeString().slice(0, 8); // HH:mm:ss
  };

  return (
    <div className="border-t border-gray-200 bg-gray-50/80 flex flex-col" style={{ height: 200 }}>
      {/* Tab 切换 */}
      <div className="flex gap-0 border-b border-gray-200 flex-shrink-0">
        {(['battle', 'game'] as LogTab[]).map((tab) => (
          <motion.button
            key={tab}
            whileTap={{ scale: 0.92 }}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-1 text-xs font-medium transition-colors relative ${
              activeTab === tab
                ? 'text-blue-600 bg-white'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            {tab === 'battle' ? <><FaBomb className="inline text-red-400" /> 战斗日志</> : <><FaScroll className="inline text-blue-400" /> 杂项日志</>}
            {activeTab === tab && (
              <motion.div
                layoutId="logTabIndicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
          </motion.button>
        ))}
      </div>

      {/* 日志列表 */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5 text-xs">
        {logs.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400 text-xs">
            暂无日志
          </div>
        ) : (
          logs.map((log, i) => (
            <motion.div
              key={log.timestamp + log.message.slice(0, 10)}
              custom={i}
              variants={logVariants}
              initial="hidden"
              animate="visible"
              className="flex gap-1.5 leading-relaxed"
            >
              <span className="text-gray-400 shrink-0 font-mono text-[11px]">
                [{formatTime(log.timestamp)}]
              </span>
              <span className="text-gray-700 break-all">{log.message}</span>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};
