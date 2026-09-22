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
        <Tabs.List className="flex overflow-x-auto border-b border-[#8a7a63]/45 bg-[#faf6ea]/70">
          {tabs.map((tab) => (
            <Tooltip.Root key={tab.id}>
              <Tooltip.Trigger asChild>
                <Tabs.Trigger
                  value={tab.id}
                  className="
                    flex cursor-pointer items-center gap-1.5 whitespace-nowrap border-b-2 border-transparent
                    px-3 py-2 text-sm text-[#6b6252] outline-none transition-colors hover:bg-[#e9e2d2]/60
                    data-[state=active]:border-[#b5382f] data-[state=active]:bg-[#f3efe4] data-[state=active]:font-bold
                    data-[state=active]:text-[#3f3527]
                  "
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </Tabs.Trigger>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content
                  side="bottom"
                  className="z-50 border border-[#8a7a63] bg-[#faf6ea] px-2 py-1 text-xs text-[#3f3527]"
                  sideOffset={4}
                >
                  {tab.description || tab.label}
                  <Tooltip.Arrow className="fill-[#8a7a63]" />
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
          ))}
        </Tabs.List>
      </Tabs.Root>
    </Tooltip.Provider>
  );
};
