import React, { useState, useMemo } from 'react';
import { useGameStore } from '../../store/useGameStore';

type LogTab = 'battle' | 'game';

export const LogPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<LogTab>('battle');
  const battleLogs = useGameStore((s) => s.battleLogs);
  const gameLogs = useGameStore((s) => s.gameLogs);

  const logs = activeTab === 'battle' ? battleLogs : gameLogs;

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toTimeString().slice(0, 5); // HH:mm
  };

  return (
    <div className="border-t border-gray-200 bg-gray-50/80 flex flex-col" style={{ height: 200 }}>
      {/* Tab 切换 */}
      <div className="flex gap-0 border-b border-gray-200 flex-shrink-0">
        {(['battle', 'game'] as LogTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-1 text-xs font-medium transition-colors ${
              activeTab === tab
                ? 'text-blue-600 border-b-2 border-blue-500 bg-white'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            {tab === 'battle' ? '⚔ 战斗日志' : '📋 杂项日志'}
          </button>
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
            <div key={i} className="flex gap-1.5 leading-relaxed">
              <span className="text-gray-400 shrink-0 font-mono text-[11px]">
                [{formatTime(log.timestamp)}]
              </span>
              <span className="text-gray-700 break-all">{log.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
