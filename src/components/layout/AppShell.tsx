/**
 * AppShell — 四去处布局
 * 左：世界地图 / 据点 / 角色 / 家业；中：该去处的主视图；右：卷轴日志
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import * as Dialog from '@radix-ui/react-dialog';
import { Toaster, toast } from 'sonner';
import { TopBar } from './TopBar';
import { TabBar } from './TabBar';
import { SideNav, type PageId } from './SideNav';
import { MainCityPanel } from '../city/MainCityPanel';
import { CenterPanel } from '../city/CenterPanel';
import { GameLogPanel } from '../city/GameLogPanel';
import { HeroInfoPanel } from '../city/HeroInfoPanel';
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
import { NpcEcology } from '../npc/NpcEcology';
import { OfflineModal } from '../shared/OfflineModal';
import { claimOffline, computeOffline, markSeen, type OfflineReport } from '../../engine/OfflineReport';
import { saveGame, loadGame, hasSave, getSaveMeta } from '../../store/saveUtils';
import { startWorldClock, useWorldStore } from '../../store/useWorldStore';
import {
  FaFloppyDisk, FaFolderOpen, FaBookOpen, FaCircleQuestion, FaMapLocationDot, FaCity,
  FaUser, FaWheatAwn, FaSkullCrossbones, FaBagShopping, FaHammer, FaPaw,
  FaShieldHalved, FaCube, FaBeerMugEmpty, FaIndustry, FaGift,
} from 'react-icons/fa6';
import { FaBomb } from 'react-icons/fa';

export type TabId =
  | 'status' | 'weapon' | 'armor' | 'novelty' | 'inventory' | 'materials' | 'bestiary'
  | 'farm' | 'ranch' | 'factory' | 'forge' | 'tavern' | 'estate';

interface SubTab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
  description: string;
}

/** 角色：我的东西 */
const HERO_TABS: SubTab[] = [
  { id: 'status', label: '状态', icon: <FaUser />, description: '勇者属性与装备' },
  { id: 'inventory', label: '行囊', icon: <FaBagShopping />, description: '查看和管理背包物品' },
  { id: 'materials', label: '材料', icon: <FaCube />, description: '查看材料库存' },
  { id: 'bestiary', label: '图鉴', icon: <FaBookOpen />, description: '查看已击败的怪物' },
];

/** 家业：挂机产出与经营 */
const HOME_TABS: SubTab[] = [
  { id: 'farm', label: '农桑', icon: <FaWheatAwn />, description: '种植作物获取金币' },
  { id: 'ranch', label: '牧场', icon: <FaPaw />, description: '养殖灵兽获取资源' },
  { id: 'factory', label: '工坊', icon: <FaIndustry />, description: '建部门雇工人被动产金' },
  { id: 'forge', label: '锻造', icon: <FaHammer />, description: '强化装备提升属性' },
  { id: 'tavern', label: '酒馆', icon: <FaBeerMugEmpty />, description: '招募同伴组队' },
  { id: 'estate', label: '产业', icon: <FaCity />, description: '建筑与奇观' },
];

const MOBILE_NAV: { id: PageId; label: string; icon: React.ReactNode }[] = [
  { id: 'map', label: '地图', icon: <FaMapLocationDot /> },
  { id: 'city', label: '据点', icon: <FaSkullCrossbones /> },
  { id: 'hero', label: '角色', icon: <FaUser /> },
  { id: 'home', label: '家业', icon: <FaWheatAwn /> },
];

type ShopId = 'none' | 'weapon' | 'armor' | 'novelty';

const SHOPS: { id: ShopId; label: string; icon: React.ReactNode }[] = [
  { id: 'weapon', label: '兵器铺', icon: <FaBomb /> },
  { id: 'armor', label: '甲胄铺', icon: <FaShieldHalved /> },
  { id: 'novelty', label: '杂货铺', icon: <FaGift /> },
];

export const AppShell: React.FC = () => {
  const [page, setPage] = useState<PageId>('map');
  const [heroTab, setHeroTab] = useState<TabId>('status');
  const [homeTab, setHomeTab] = useState<TabId>('farm');
  const [shop, setShop] = useState<ShopId>('none');
  const [cityView, setCityView] = useState<'eco' | 'team'>('eco');
  const [offline, setOffline] = useState<OfflineReport | null>(null);
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  const [saveMeta, setSaveMeta] = useState<ReturnType<typeof getSaveMeta>>(null);

  useEffect(() => {
    // 有存档就自动接着玩（放置游戏不该让人每次手动读档）
    if (hasSave()) loadGame();
    startWorldClock();
    useWorldStore.getState().syncEncounter();
    // 离线结算：先告诉玩家"你不在的时候发生了什么"
    setOffline(computeOffline());
    markSeen();
    const onHide = () => markSeen();
    window.addEventListener('beforeunload', onHide);
    document.addEventListener('visibilitychange', onHide);
    return () => {
      window.removeEventListener('beforeunload', onHide);
      document.removeEventListener('visibilitychange', onHide);
    };
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
    setSaveMeta(getSaveMeta());
    setLoadDialogOpen(true);
  };

  const handleLoadConfirm = () => {
    const ok = loadGame();
    toast.success(ok ? '读档成功' : '读档失败', { icon: ok ? '✅' : '❌' });
    setLoadDialogOpen(false);
  };

  const renderSubTab = (id: TabId) => {
    switch (id) {
      case 'status': return <HeroInfoPanel />;
      case 'weapon': return <WeaponTab />;
      case 'armor': return <ArmorTab />;
      case 'novelty': return <NoveltyTab />;
      case 'inventory': return <InventoryTab />;
      case 'materials': return <MaterialsTab />;
      case 'bestiary': return <BestiaryTab />;
      case 'farm': return <FarmTab />;
      case 'ranch': return <RanchTab />;
      case 'factory': return <FactoryTab />;
      case 'forge': return <ForgeTab />;
      case 'tavern': return <TavernTab />;
      case 'estate': return <MainCityPanel onOpenWorldMap={() => setPage('map')} />;
    }
  };

  /** 角色 / 家业：子功能栏 + 内容 */
  const renderGroup = (tabs: SubTab[], active: TabId, onChange: (t: TabId) => void) => (
    <div className="ink-panel ink-frame flex min-h-full flex-col">
      <TabBar tabs={tabs} activeTab={active} onTabChange={(t) => onChange(t as TabId)} />
      <div className="flex-1 p-3">{renderSubTab(active)}</div>
    </div>
  );

  const renderShop = () => {
    if (shop === 'weapon') return <WeaponTab />;
    if (shop === 'armor') return <ArmorTab />;
    if (shop === 'novelty') return <NoveltyTab />;
    return null;
  };

  /** 据点：城中铺子（兵器/甲胄/杂货）+ 队伍与遭遇 */
  const renderCity = () => (
    <div className="flex h-full min-h-0 flex-col gap-2 p-3">
      <div className="ink-panel ink-frame flex-shrink-0">
        <div className="ink-head">
          <h3 className="ink-title text-[15px]">城中铺子</h3>
          <span className="ink-tag ml-auto">买卖也可直接找城中商人</span>
        </div>
        <div className="flex flex-wrap gap-2 p-3">
          {SHOPS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setShop(shop === s.id ? 'none' : s.id)}
              className={shop === s.id ? 'ink-btn-seal text-sm' : 'ink-btn text-sm'}
            >
              {s.icon} {s.label}
            </button>
          ))}
        </div>
        {shop !== 'none' && <div className="border-t border-[#8a7a63]/40 p-3">{renderShop()}</div>}
      </div>
      <div className="flex flex-shrink-0 gap-2">
        <button
          type="button"
          onClick={() => setCityView('eco')}
          className={cityView === 'eco' ? 'ink-btn-seal text-sm' : 'ink-btn text-sm'}
        >
          人物志 · 关系网
        </button>
        <button
          type="button"
          onClick={() => setCityView('team')}
          className={cityView === 'team' ? 'ink-btn-seal text-sm' : 'ink-btn text-sm'}
        >
          队伍与遭遇
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">
        {cityView === 'eco' ? <NpcEcology /> : <CenterPanel />}
      </div>
    </div>
  );

  const renderMain = () => {
    if (page === 'map') return <InkMapPanel embedded />;
    if (page === 'city') return renderCity();
    if (page === 'hero') {
      return <div className="h-full overflow-y-auto p-3">{renderGroup(HERO_TABS, heroTab, setHeroTab)}</div>;
    }
    return <div className="h-full overflow-y-auto p-3">{renderGroup(HOME_TABS, homeTab, setHomeTab)}</div>;
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#f3efe4] text-[#3f3527]">
      <Toaster />
      <TopBar />
      {offline && (
        <OfflineModal
          report={offline}
          onClaim={() => { claimOffline(offline); markSeen(); setOffline(null); }}
          onSkip={() => setOffline(null)}
        />
      )}

      {/* === 桌面端：左去处 / 中主视图 / 右日志 === */}
      <div className="hidden min-h-0 flex-1 overflow-hidden md:flex">
        <SideNav page={page} onNavigate={setPage} />
        <motion.main
          key={page}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="min-w-0 flex-1 overflow-hidden"
        >
          {renderMain()}
        </motion.main>
        {page !== 'map' && (
          <aside className="hidden w-[320px] flex-shrink-0 flex-col overflow-hidden border-l border-[#8a7a63]/45 bg-[#faf6ea]/60 xl:flex">
            <GameLogPanel />
          </aside>
        )}
      </div>

      {/* === 移动端 === */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:hidden">
        <div className="min-h-0 flex-1 overflow-hidden">
          {renderMain()}
        </div>
        <div className="flex flex-shrink-0 items-center justify-around border-t border-[#8a7a63] bg-[#faf6ea] px-1 py-1.5">
          {MOBILE_NAV.map((nav) => (
            <button
              key={nav.id}
              type="button"
              onClick={() => setPage(nav.id)}
              className={`flex min-w-0 flex-col items-center gap-0.5 rounded-[3px] px-2 py-1 text-xs ${
                page === nav.id ? 'text-[#b5382f]' : 'text-[#6b6252]'
              }`}
            >
              <span className="text-lg">{nav.icon}</span>
              <span className="truncate">{nav.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* === 底部操作栏 === */}
      <div className="flex flex-shrink-0 items-center justify-center gap-2 border-t border-[#8a7a63] bg-[#faf6ea]/95 px-2 py-1.5 md:gap-3 md:px-4 md:py-2">
        <button onClick={handleSave} className="ink-btn-seal px-3 py-1 text-xs md:px-4 md:py-1.5 md:text-sm">
          <FaFloppyDisk /> 存档
        </button>
        <Dialog.Root open={loadDialogOpen} onOpenChange={setLoadDialogOpen}>
          <Dialog.Trigger asChild>
            <button onClick={handleLoadClick} className="ink-btn px-3 py-1 text-xs md:px-4 md:py-1.5 md:text-sm">
              <FaFolderOpen /> 读档
            </button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-40 bg-[#3f3527]/45" />
            <Dialog.Content className="ink-panel ink-frame fixed left-1/2 top-1/2 z-50 w-80 -translate-x-1/2 -translate-y-1/2 p-5">
              <Dialog.Title className="ink-title mb-2 text-lg">确认读档？</Dialog.Title>
              {saveMeta && (
                <div className="mb-4 space-y-1 text-sm text-[#6b6252]">
                  <p><span className="font-medium">{saveMeta.heroName}</span> Lv.{saveMeta.heroLevel}</p>
                  <p>金币: {saveMeta.gold.toLocaleString()}</p>
                  <p className="text-xs text-[#9c917b]">{new Date(saveMeta.timestamp).toLocaleString()}</p>
                </div>
              )}
              <div className="flex justify-end gap-3">
                <Dialog.Close asChild>
                  <button className="ink-btn text-sm">取消</button>
                </Dialog.Close>
                <button onClick={handleLoadConfirm} className="ink-btn-seal text-sm">确认读档</button>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
        <button
          onClick={() => { setPage('hero'); setHeroTab('bestiary'); }}
          className="ink-btn hidden px-3 py-1 text-xs md:inline-flex md:px-4 md:py-1.5 md:text-sm"
        >
          <FaBookOpen /> 图鉴
        </button>
        <button
          className="ink-btn hidden cursor-not-allowed px-3 py-1 text-xs opacity-60 md:inline-flex md:px-4 md:py-1.5 md:text-sm"
          disabled
        >
          <FaCircleQuestion /> 帮助
        </button>
      </div>
    </div>
  );
};
