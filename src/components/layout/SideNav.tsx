import React from 'react';
import { FaCity, FaMapLocationDot, FaUser, FaWheatAwn, FaBagShopping, FaCube, FaBookOpen, FaUserGroup } from 'react-icons/fa6';
import { useWorldStore } from '../../store/useWorldStore';
import { useNpcEcoStore } from '../../store/useNpcEcoStore';
import { getCellEncounter } from '../../data/cellEncounters';
import { cityAtCell } from '../../data/cities';
import { NPCS, getNpcsByMap } from '../../data/npcs';
import { useGameStore } from '../../store/useGameStore';

export type PageId = 'map' | 'city' | 'hero' | 'home';

/** 角色页子标签（左栏平铺，点任一直切到角色页对应子页） */
export type HeroTabId = 'status' | 'inventory' | 'materials' | 'bestiary';

const ITEMS: { id: PageId; label: string; icon: React.ReactNode }[] = [
  { id: 'map', label: '世界地图', icon: <FaMapLocationDot /> },
  { id: 'city', label: '据点', icon: <FaCity /> },
  { id: 'hero', label: '角色', icon: <FaUser /> },
  { id: 'home', label: '家业', icon: <FaWheatAwn /> },
];

/** 「角色」下的子标签（平铺在左栏） */
const HERO_SUB_TABS: { id: HeroTabId; label: string; icon: React.ReactNode }[] = [
  { id: 'status', label: '状态', icon: <FaUser /> },
  { id: 'inventory', label: '行囊', icon: <FaBagShopping /> },
  { id: 'materials', label: '材料', icon: <FaCube /> },
  { id: 'bestiary', label: '图鉴', icon: <FaBookOpen /> },
];

interface SideNavProps {
  page: PageId;
  onNavigate: (page: PageId) => void;
  heroTab: HeroTabId;
  onNavigateHero: (tab: HeroTabId) => void;
  /** 选中某个 NPC（打开其档案） */
  onSelectNpc: (npcId: string) => void;
  /** 当前聚焦的 NPC（高亮用） */
  focusedNpcId: string | null;
}

export const SideNav: React.FC<SideNavProps> = ({ page, onNavigate, heroTab, onNavigateHero, onSelectNpc, focusedNpcId }) => {
  const currentCellId = useWorldStore((s) => s.currentCellId);
  const mapId = useGameStore((s) => s.currentMapId);
  const states = useNpcEcoStore((s) => s.states);
  const place = getCellEncounter(currentCellId)?.label ?? '荒野';

  // 城中 NPC（优先按当前城 npcIds，回退按地图 id）
  const locals = React.useMemo(() => {
    const here = cityAtCell(currentCellId);
    if (here && here.npcIds.length > 0) {
      const set = new Set(here.npcIds);
      const fromIds = NPCS.filter((n) => set.has(n.id));
      if (fromIds.length > 0) return fromIds;
    }
    return getNpcsByMap(mapId);
  }, [currentCellId, mapId]);

  return (
    <nav className="ink-panel m-2 flex w-[200px] flex-shrink-0 flex-col overflow-y-auto p-2">
      {ITEMS.map((item) => {
        const active = item.id === page;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onNavigate(item.id)}
            aria-current={active}
            className={`mb-1 flex items-center gap-2 px-2 py-1.5 text-left text-sm ${
              active
                ? 'ink-title border border-[#8a7a63] bg-[#f3efe4]'
                : 'border border-transparent text-[#6b6252] hover:bg-[#e9e2d2]/60'
            }`}
          >
            <span className={active ? 'text-[#b5382f]' : 'text-[#9c917b]'}>{item.icon}</span>
            {item.label}
          </button>
        );
      })}

      {/* 人物标签栏：角色页四子标签平铺 */}
      <div className="mb-1 border-t border-[#8a7a63]/30 pt-1.5">
        <div className="px-1 pb-1 text-[10px] tracking-[0.2em] text-[#9c917b]">人物</div>
        {HERO_SUB_TABS.map((t) => {
          const active = page === 'hero' && heroTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onNavigateHero(t.id)}
              aria-current={active}
              className={`mb-0.5 flex w-full items-center gap-1.5 px-2 py-1 text-left text-xs ${
                active
                  ? 'ink-title border border-[#8a7a63] bg-[#f3efe4] text-[#b5382f]'
                  : 'text-[#6b6252] hover:bg-[#e9e2d2]/60'
              }`}
            >
              <span className={active ? 'text-[#b5382f]' : 'text-[#9c917b]'}>{t.icon}</span>
              {t.label}
            </button>
          );
        })}
      </div>

      {/* 城中人物：当前所在地的 NPC，点开档案 */}
      <div className="mb-1 border-t border-[#8a7a63]/30 pt-1.5">
        <div className="flex items-center gap-1 px-1 pb-1 text-[10px] tracking-[0.2em] text-[#9c917b]">
          <FaUserGroup /> 城中人物
        </div>
        {locals.length === 0 && <div className="px-2 pb-1 text-[11px] text-[#9c917b]">此地无人。</div>}
        {locals.map((n) => {
          const st = states[n.id];
          const active = focusedNpcId === n.id;
          const enemy = st?.bond === '仇敌';
          return (
            <button
              key={n.id}
              type="button"
              onClick={() => onSelectNpc(n.id)}
              className={`mb-0.5 flex w-full items-center gap-1.5 px-2 py-1 text-left text-xs ${
                active
                  ? 'ink-title border border-[#8a7a63] bg-[#f3efe4] text-[#b5382f]'
                  : 'text-[#6b6252] hover:bg-[#e9e2d2]/60'
              }`}
            >
              <span className={enemy ? 'text-[#b5382f]' : 'text-[#9c917b]'}>{n.avatarEmoji}</span>
              <span className="truncate">{n.name}</span>
              {st && st.mood !== '平静' && <span className="ml-auto text-[9px] text-[#8a6b2a]">{st.mood}</span>}
            </button>
          );
        })}
      </div>

      <hr className="ink-rule my-2" />
      <div className="px-1 pb-1 text-[11px] tracking-[0.2em] text-[#9c917b]">当前所在地</div>
      <button
        type="button"
        onClick={() => onNavigate('city')}
        className="ink-title px-1 text-left text-sm text-[#3f3527] hover:text-[#b5382f]"
      >
        · {place}
      </button>
    </nav>
  );
};
