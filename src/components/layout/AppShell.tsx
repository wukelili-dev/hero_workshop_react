import React, { useState } from 'react';
import { TopBar } from './TopBar';
import { TabBar } from './TabBar';
import { MainCityPanel } from '../city/MainCityPanel';
import { CombatPanel } from '../combat/CombatPanel';
import { WeaponTab } from '../equipment/WeaponTab';
import { ArmorTab } from '../equipment/ArmorTab';
import { NoveltyTab } from '../equipment/NoveltyTab';
import { InventoryTab } from '../inventory/InventoryTab';
import { MaterialsTab } from '../materials/MaterialsTab';
import { TavernTab } from '../tavern/TavernTab';
import { FarmTab } from '../farm/FarmTab';
import { FactoryTab } from '../factory/FactoryTab';
import { RanchTab } from '../ranch/RanchTab';
import { ForgeTab } from '../forge/ForgeTab';

export type TabId = 'weapon' | 'armor' | 'novelty' | 'inventory' | 'materials' | 'tavern' | 'farm' | 'factory' | 'ranch' | 'forge';

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'weapon', label: '武器', icon: '⚔' },
  { id: 'armor', label: '护甲', icon: '🛡' },
  { id: 'novelty', label: '杂货', icon: '🎁' },
  { id: 'inventory', label: '背包', icon: '🎒' },
  { id: 'materials', label: '材料', icon: '⭐' },
  { id: 'tavern', label: '酒馆', icon: '🍺' },
  { id: 'farm', label: '农场', icon: '🌱' },
  { id: 'factory', label: '工厂', icon: '🏭' },
  { id: 'ranch', label: '牧场', icon: '🐾' },
  { id: 'forge', label: '锻造', icon: '🔨' },
];

export const AppShell: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('weapon');
  const [leftWidth, setLeftWidth] = useState(260);

  const renderTab = () => {
    switch (activeTab) {
      case 'weapon': return <WeaponTab />;
      case 'armor': return <ArmorTab />;
      case 'novelty': return <NoveltyTab />;
      case 'inventory': return <InventoryTab />;
      case 'materials': return <MaterialsTab />;
      case 'tavern': return <TavernTab />;
      case 'farm': return <FarmTab />;
      case 'factory': return <FactoryTab />;
      case 'ranch': return <RanchTab />;
      case 'forge': return <ForgeTab />;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-amber-100 overflow-hidden">
      {/* Top bar */}
      <TopBar />

      {/* Main content: left panel + right tab area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel — Main City (resources, buildings, wonders, combat) */}
        <div
          className="flex-shrink-0 overflow-y-auto border-r border-amber-900/30"
          style={{ width: leftWidth }}
        >
          <MainCityPanel />
        </div>

        {/* Draggable divider */}
        <div
          className="w-1 cursor-col-resize bg-amber-900/20 hover:bg-amber-700/40 transition-colors"
          onMouseDown={(e) => {
            const startX = e.clientX;
            const startWidth = leftWidth;
            const onMove = (ev: MouseEvent) => {
              const delta = ev.clientX - startX;
              setLeftWidth(Math.max(200, Math.min(450, startWidth + delta)));
            };
            const onUp = () => {
              window.removeEventListener('mousemove', onMove);
              window.removeEventListener('mouseup', onUp);
            };
            window.addEventListener('mousemove', onMove);
            window.addEventListener('mouseup', onUp);
          }}
        />

        {/* Right panel — Tab bar + content */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <TabBar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />
          <div className="flex-1 overflow-y-auto p-4">
            {renderTab()}
          </div>
        </div>
      </div>
    </div>
  );
};
