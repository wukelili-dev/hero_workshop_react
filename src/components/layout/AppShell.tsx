import React, { useState, useCallback } from 'react';
import { TopBar } from './TopBar';
import { TabBar } from './TabBar';
import { MainCityPanel } from '../city/MainCityPanel';
import { CenterPanel } from '../city/CenterPanel';
import { LogPanel } from '../city/LogPanel';
import { WeaponTab } from '../equipment/WeaponTab';
import { ArmorTab } from '../equipment/ArmorTab';
import { NoveltyTab } from '../novelty/NoveltyTab';
import { InventoryTab } from '../inventory/InventoryTab';
import { MaterialsTab } from '../materials/MaterialsTab';
import { TavernTab } from '../tavern/TavernTab';
import { FarmTab } from '../farm/FarmTab';
import { FactoryTab } from '../factory/FactoryTab';
import { RanchTab } from '../ranch/RanchTab';
import { ForgeTab } from '../forge/ForgeTab';
import { BestiaryTab } from '../bestiary/BestiaryTab';
import { saveGame, loadGame, hasSave, getSaveMeta } from '../../store/saveUtils';

export type TabId = 'weapon' | 'armor' | 'novelty' | 'inventory' | 'materials' | 'tavern' | 'farm' | 'factory' | 'ranch' | 'forge' | 'bestiary';
type MobileView = 'city' | 'combat' | TabId;

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
  { id: 'bestiary', label: '图鉴', icon: '📖' },
];

const MOBILE_NAV: { id: MobileView; label: string; icon: string }[] = [
  { id: 'city', label: '主城', icon: '🏰' },
  { id: 'combat', label: '战斗', icon: '⚔' },
  { id: 'inventory', label: '背包', icon: '🎒' },
  { id: 'forge', label: '锻造', icon: '🔨' },
  { id: 'ranch', label: '牧场', icon: '🐾' },
];

export const AppShell: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('weapon');
  const [mobileView, setMobileView] = useState<MobileView>('city');
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
      case 'bestiary': return <BestiaryTab />;
    }
  };

  const renderMobileContent = () => {
    switch (mobileView) {
      case 'city': return <MainCityPanel />;
      case 'combat': return <CenterPanel />;
      default: return renderTab();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white text-gray-800 overflow-hidden">
      {/* Top bar */}
      <TopBar />

      {/* === 桌面端：三栏布局 === */}
      <div className="hidden md:flex flex-1 overflow-hidden">
        <div className="w-72 flex-shrink-0 overflow-y-auto border-r border-gray-200 bg-gray-50/50">
          <MainCityPanel />
        </div>
        <div className="w-80 flex-shrink-0 overflow-y-auto border-r border-gray-200 bg-white flex flex-col">
          <div className="flex-1 overflow-y-auto"><CenterPanel /></div>
          <LogPanel />
        </div>
        <div className="flex flex-col flex-1 max-w-5xl overflow-hidden">
          <TabBar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />
          <div className="flex-1 overflow-y-auto p-4">
            {renderTab()}
          </div>
        </div>
      </div>

      {/* === 移动端：底部导航切换 === */}
      <div className="flex md:hidden flex-1 overflow-hidden flex-col">
        <div className="flex-1 overflow-y-auto p-2">
          {renderMobileContent()}
        </div>
        {/* 移动端底部导航 */}
        <div className="flex items-center justify-around px-1 py-1.5 bg-white border-t border-gray-200 flex-shrink-0">
          {MOBILE_NAV.map((nav) => (
            <button
              key={nav.id}
              onClick={() => setMobileView(nav.id)}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-xs transition-colors min-w-0 ${
                mobileView === nav.id
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="text-lg">{nav.icon}</span>
              <span className="truncate">{nav.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-50 px-5 py-2 bg-gray-900 text-white text-sm rounded-full shadow-lg">
          {toast}
        </div>
      )}

      {/* Bottom action bar */}
      <div className="flex items-center justify-center gap-2 md:gap-3 px-2 md:px-4 py-1.5 md:py-2 bg-white border-t border-gray-200 flex-shrink-0">
        <button
          onClick={handleSave}
          className="px-3 md:px-4 py-1 md:py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-full text-xs md:text-sm font-medium transition-colors shadow-sm"
        >
          💾 存档
        </button>
        <button
          onClick={handleLoad}
          className="px-3 md:px-4 py-1 md:py-1.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-full text-xs md:text-sm font-medium transition-colors shadow-sm"
        >
          📂 读档
        </button>
        <button
          onClick={() => setActiveTab('bestiary')}
          className="px-3 md:px-4 py-1 md:py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-full text-xs md:text-sm font-medium transition-colors shadow-sm hidden md:block"
        >
          📖 图鉴
        </button>
        <button className="px-3 md:px-4 py-1 md:py-1.5 bg-red-500 text-white rounded-full text-xs md:text-sm font-medium shadow-sm cursor-not-allowed opacity-60 hidden md:block">
          ❓ 帮助
        </button>
      </div>
    </div>
  );
};
