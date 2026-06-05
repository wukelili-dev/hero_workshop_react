import React from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import * as Tooltip from '@radix-ui/react-tooltip';
import type { TabId } from './AppShell';

interface TabConfig {
  id: TabId;
  label: string;
  icon: React.ReactNode;
  description?: string;
}

interface TabBarProps {
  tabs: TabConfig[];
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export const TabBar: React.FC<TabBarProps> = ({ tabs, activeTab, onTabChange }) => {
  return (
    <Tooltip.Provider delayDuration={200}>
      <Tabs.Root value={activeTab} onValueChange={(v) => onTabChange(v as TabId)}>
        <Tabs.List className="flex border-b border-gray-200 bg-gray-50 overflow-x-auto">
          {tabs.map((tab) => (
            <Tooltip.Root key={tab.id}>
              <Tooltip.Trigger asChild>
                <Tabs.Trigger
                  value={tab.id}
                  className="
                    flex items-center gap-1.5 px-4 py-2.5 text-sm whitespace-nowrap
                    border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:bg-white/60
                    transition-colors data-[state=active]:border-amber-500 data-[state=active]:text-amber-700
                    data-[state=active]:bg-white data-[state=active]:font-bold
                    cursor-pointer outline-none
                  "
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </Tabs.Trigger>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content
                  side="bottom"
                  className="px-2 py-1 bg-gray-900 text-white text-xs rounded shadow-lg z-50"
                  sideOffset={4}
                >
                  {tab.description || tab.label}
                  <Tooltip.Arrow className="fill-gray-900" />
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
          ))}
        </Tabs.List>
      </Tabs.Root>
    </Tooltip.Provider>
  );
};
