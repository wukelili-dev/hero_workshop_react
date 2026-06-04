import React from 'react';
import type { TabId } from './AppShell';

interface TabConfig {
  id: TabId;
  label: string;
  icon: string;
}

interface TabBarProps {
  tabs: TabConfig[];
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export const TabBar: React.FC<TabBarProps> = ({ tabs, activeTab, onTabChange }) => {
  return (
    <div className="flex border-b border-amber-900/30 bg-slate-900/80 overflow-x-auto">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              flex items-center gap-1.5 px-4 py-2.5 text-sm whitespace-nowrap
              border-b-2 transition-colors
              ${isActive
                ? 'border-amber-400 text-amber-300 bg-slate-800/60 font-bold'
                : 'border-transparent text-amber-200/50 hover:text-amber-200/80 hover:bg-slate-800/30'
              }
            `}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};
