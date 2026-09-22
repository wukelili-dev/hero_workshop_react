import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Dialog from '@radix-ui/react-dialog';
import { Toaster, toast } from 'sonner';
import { TopBar } from './TopBar';
import { TabBar } from './TabBar';
import { MainCityPanel } from '../city/MainCityPanel';
import { CenterPanel } from '../city/CenterPanel';
import { GameLogPanel } from '../city/GameLogPanel';
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
import { InkMapPanel } from '../world/InkMapPanel';
import { saveGame, loadGame, hasSave, getSaveMeta } from '../../store/saveUtils';
import { startWorldClock, useWorldStore } from '../../store/useWorldStore';

// Icon imports
import {
  FaBomb, FaShieldHalved, FaBagShopping,
  FaBeerMugEmpty, FaWheatAwn, FaIndustry, FaPaw,
  FaBookOpen, FaCity, FaFloppyDisk, FaFolderOpen, FaCircleQuestion,
} from 'react-icons/fa6';
import { FaGift, FaCube, FaHammer, FaSkullCrossbones } from 'react-icons/fa';

export type TabId = 'weapon' | 'armor' | 'novelty' | 'inventory' | 'materials' | 'tavern' | 'farm' | 'factory' | 'ranch' | 'forge' | 'bestiary';
type MobileView = 'city' | 'combat' | TabId;

const TABS: { id: TabId; label: string; icon: React.ReactNode; description: string }[] = [
  { id: 'weapon', label: '武器', icon: <FaBomb />, description: '购买和装备武器' },
  { id: 'armor', label: '护甲', icon: <FaShieldHalved />, description: '购买和装备护甲' },
  { id: 'novelty', label: '杂货', icon: <FaGift />, description: '购买各类杂货道具' },
  { id: 'inventory', label: '背包', icon: <FaBagShopping />, description: '查看和管理背包物品' },
  { id: 'materials', label: '材料', icon: <FaCube />, description: '查看材料库存' },
  { id: 'tavern', label: '酒馆', icon: <FaBeerMugEmpty />, description: '招募英雄和刷新英雄' },
  { id: 'farm', label: '农场', icon: <FaWheatAwn />, description: '种植作物获取金币' },
  { id: 'factory', label: '工厂', icon: <FaIndustry />, description: '雇佣工人自动生产' },
  { id: 'ranch', label: '牧场', icon: <FaPaw />, description: '养殖生物获取资源' },
  { id: 'forge', label: '锻造', icon: <FaHammer />, description: '合成高级装备' },
  { id: 'bestiary', label: '图鉴', icon: <FaBookOpen />, description: '查看已击败的怪物' },
];

const MOBILE_NAV: { id: MobileView; label: string; icon: React.ReactNode }[] = [
  { id: 'city', label: '主城', icon: <FaCity /> },
  { id: 'combat', label: '战斗', icon: <FaSkullCrossbones /> },
  { id: 'inventory', label: '背包', icon: <FaBagShopping /> },
  { id: 'forge', label: '锻造', icon: <FaHammer /> },
  { id: 'ranch', label: '牧场', icon: <FaPaw /> },
];

export const AppShell: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('weapon');
  const [mobileView, setMobileView] = useState<MobileView>('city');
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  const [saveMeta, setSaveMeta] = useState<ReturnType<typeof getSaveMeta>>(null);
  const [showApp, setShowApp] = useState(false);
  const [showWorldMap, setShowWorldMap] = useState(false);

  useEffect(() => {
    // 世界时钟（挂机时间流逝）+ 把当前格子的妖怪同步给战斗系统
    startWorldClock();
    useWorldStore.getState().syncEncounter();
    const t = setTimeout(() => setShowApp(true), 30);
    return () => clearTimeout(t);
  }, []);

  const handleSave = () => {
    const ok = saveGame();
    toast.success(ok ? '存档成功' : '存档失败', { icon: ok ? '✅' : '❌' });
  };

  const handleLoadClick = () => {
    if (!hasSave()) {
      toast.info('没有存档记录', { icon: '📭' });
      return;
    }
    const meta = getSaveMeta();
    setSaveMeta(meta);
    setLoadDialogOpen(true);
  };

  const handleLoadConfirm = () => {
    const ok = loadGame();
    toast.success(ok ? '读档成功' : '读档失败', { icon: ok ? '✅' : '❌' });
    setLoadDialogOpen(false);
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
    <div className="flex h-screen flex-col overflow-hidden bg-[#f3efe4] text-[#3f3527]">
      <Toaster />
      {/* Top bar */}
      <TopBar />

      {/* === 桌面端布局 === */}
      <div className="hidden md:flex flex-1 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={showApp ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex-[2_0_0] min-w-0 overflow-y-auto border-r border-gray-200/70 bg-gradient-to-b from-gray-50/80 to-gray-100/40"
        >
          <MainCityPanel onOpenWorldMap={() => setShowWorldMap(true)} />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={showApp ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="flex-[3_0_0] min-w-0 overflow-y-auto border-r border-gray-200/70 bg-white/90 flex flex-col"
        >
          <CenterPanel />
        </motion.div>
        {/* 右侧：人物/日志(上) + Tab内容(下) */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={showApp ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="flex-[2_0_0] min-w-0 flex flex-col overflow-hidden"
        >
          {/* 右上：日志 */}
          <div className="flex-1 min-h-0 flex flex-col border-b border-gray-200">
            <GameLogPanel />
          </div>
          {/* 右下：Tab栏 + 内容 */}
          <div className="flex-1 min-h-0 flex flex-col">
            <TabBar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />
            <div className="flex-1 overflow-y-auto p-3">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                >
                  {renderTab()}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>

      {/* === 世界地图全屏覆盖层 === */}
      <AnimatePresence>
        {showWorldMap && (
          <motion.div
            key="world-map"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50"
          >
            <InkMapPanel onClose={() => setShowWorldMap(false)} />
          </motion.div>
        )}
      </AnimatePresence>

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

      {/* Bottom action bar */}
      <div className="flex flex-shrink-0 items-center justify-center gap-2 border-t border-[#8a7a63] bg-[#faf6ea]/95 px-2 py-1.5 md:gap-3 md:px-4 md:py-2">
        <button
          onClick={handleSave}
          className="ink-btn-seal px-3 py-1 text-xs md:px-4 md:py-1.5 md:text-sm"
        >
          <FaFloppyDisk /> 存档
        </button>
        <Dialog.Root open={loadDialogOpen} onOpenChange={setLoadDialogOpen}>
          <Dialog.Trigger asChild>
            <button
              onClick={handleLoadClick}
              className="ink-btn px-3 py-1 text-xs md:px-4 md:py-1.5 md:text-sm"
            >
              <FaFolderOpen /> 读档
            </button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-40 bg-[#3f3527]/45 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
            <Dialog.Content className="ink-panel ink-frame fixed left-1/2 top-1/2 z-50 w-80 -translate-x-1/2 -translate-y-1/2 p-5 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
              <Dialog.Title className="ink-title mb-2 text-lg">确认读档？</Dialog.Title>
              {saveMeta && (
                <div className="mb-4 space-y-1 text-sm text-[#6b6252]">
                  <p><span className="font-medium">{saveMeta.heroName}</span> Lv.{saveMeta.heroLevel}</p>
                  <p>金币: {saveMeta.gold.toLocaleString()}</p>
                  <p className="text-xs text-[#9c917b]">{new Date(saveMeta.timestamp).toLocaleString()}</p>
                </div>
              )}
              <div className="flex gap-3 justify-end">
                <Dialog.Close asChild>
                  <button className="ink-btn text-sm">
                    取消
                  </button>
                </Dialog.Close>
                <button
                  onClick={handleLoadConfirm}
                  className="ink-btn-seal text-sm"
                >
                  确认读档
                </button>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
        <button
          onClick={() => setActiveTab('bestiary')}
          className="ink-btn hidden px-3 py-1 text-xs md:inline-flex md:px-4 md:py-1.5 md:text-sm"
        >
          <FaBookOpen /> 图鉴
        </button>
        <button className="ink-btn hidden cursor-not-allowed px-3 py-1 text-xs opacity-60 md:inline-flex md:px-4 md:py-1.5 md:text-sm" disabled>
          <FaCircleQuestion /> 帮助
        </button>
      </div>
    </div>
  );
};
