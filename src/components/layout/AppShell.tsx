import React, { useState, useCallback } from 'react';
import { TopBar } from './TopBar';
import { TabBar } from './TabBar';
import { MainCityPanel } from '../city/MainCityPanel';
import { CenterPanel } from '../city/CenterPanel';
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
import { saveGame, loadGame, hasSave, getSaveMeta } from '../../store/saveUtils';

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
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }, []);

  const handleSave = () => {
    const ok = saveGame();
    showToast(ok ? '✅ 存档成功' : '❌ 存档失败');
  };

  const handleLoad = () => {
    if (!hasSave()) {
      showToast('📭 没有存档记录');
      return;
    }
    const meta = getSaveMeta();
    if (meta && !window.confirm(
      `确认读档？\n\n${meta.heroName} Lv.${meta.heroLevel}\n金币: ${meta.gold}\n${new Date(meta.timestamp).toLocaleString()}`
    )) return;
    const ok = loadGame();
    showToast(ok ? '✅ 读档成功' : '❌ 读档失败');
  };

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
    <div className="flex flex-col h-screen bg-white text-gray-800 overflow-hidden">
      {/* Top bar */}
      <TopBar />

      {/* Main content: left + center + right */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel — Resources + Buildings */}
        <div className="w-56 flex-shrink-0 overflow-y-auto border-r border-gray-200 bg-gray-50/50">
          <MainCityPanel />
        </div>

        {/* Center panel — Hero + Map + Combat */}
        <div className="w-80 flex-shrink-0 overflow-y-auto border-r border-gray-200 bg-white">
          <CenterPanel />
        </div>

        {/* Right panel — Tab bar + content */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <TabBar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />
          <div className="flex-1 overflow-y-auto p-4">
            {renderTab()}
          </div>
        </div>
      </div>

      {/* Toast notification */}
      {toast && (
        <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-50 px-5 py-2 bg-gray-900 text-white text-sm rounded-full shadow-lg animate-pulse">
          {toast}
        </div>
      )}

      {/* Bottom action bar */}
      <div className="flex items-center justify-center gap-3 px-4 py-2 bg-white border-t border-gray-200">
        <button
          onClick={handleSave}
          className="px-4 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-full text-sm font-medium transition-colors shadow-sm"
        >
          💾 存档
        </button>
        <button
          onClick={handleLoad}
          className="px-4 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-full text-sm font-medium transition-colors shadow-sm"
        >
          📂 读档
        </button>
        <button className="px-4 py-1.5 bg-blue-400 hover:bg-blue-500 text-white rounded-full text-sm font-medium transition-colors shadow-sm cursor-not-allowed opacity-60">
          📖 图鉴
        </button>
        <button className="px-4 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full text-sm font-medium transition-colors shadow-sm cursor-not-allowed opacity-60">
          ❓ 帮助
        </button>
      </div>
    </div>
  );
};
