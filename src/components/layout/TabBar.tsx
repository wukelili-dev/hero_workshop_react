/**
 * TabBar - 右侧 Tab 切换栏
 * 10个Tab：武器/护甲/杂货/背包/材料/酒馆/农场/工厂/牧场/锻造
 */

import { useGameStore } from '../../store/useGameStore';

export type TabId = 'weapon' | 'armor' | 'novelty' | 'inventory' | 'materials' | 'tavern' | 'farm' | 'factory' | 'ranch' | 'forge';

interface TabConfig {
  id: TabId;
  label: string;
  icon: string;
}

const TABS: TabConfig[] = [
  { id: 'weapon', label: '武器', icon: '⚔️' },
  { id: 'armor', label: '护甲', icon: '🛡️' },
  { id: 'novelty', label: '杂货', icon: '🎁' },
  { id: 'inventory', label: '背包', icon: '🎒' },
  { id: 'materials', label: '材料', icon: '⭐' },
  { id: 'tavern', label: '酒馆', icon: '🍺' },
  { id: 'farm', label: '农场', icon: '🌱' },
  { id: 'factory', label: '工厂', icon: '🏭' },
  { id: 'ranch', label: '牧场', icon: '🐾' },
  { id: 'forge', label: '锻造', icon: '🔨' },
];

interface TabBarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export function TabBar({ activeTab, onTabChange }: TabBarProps) {
  return (
    <nav className="flex items-center gap-1 px-2 py-2 bg-[#0A1E36] border-b border-[#1A4080]/50 overflow-x-auto">
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 whitespace-nowrap
              ${isActive
                ? 'bg-[#1A4080] text-[#C8A44A] border border-[#C8A44A]/50 shadow-lg shadow-[#C8A44A]/20'
                : 'text-[#7AAAC8] hover:bg-[#1A4080]/40 hover:text-[#D8EEFF] border border-transparent'
              }
            `}
          >
            <span className="text-lg">{tab.icon}</span>
            <span className="text-sm font-medium">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
