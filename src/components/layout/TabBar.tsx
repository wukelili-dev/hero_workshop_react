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
    <div className="flex border-b border-gray-200 bg-gray-50 overflow-x-auto">
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
                ? 'border-amber-500 text-amber-700 bg-white font-bold'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-white/60'
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
