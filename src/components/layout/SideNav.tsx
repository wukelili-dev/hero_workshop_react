import React from 'react';
import { FaCity, FaMapLocationDot, FaUser, FaWheatAwn } from 'react-icons/fa6';
import { useWorldStore } from '../../store/useWorldStore';
import { getCellEncounter } from '../../data/cellEncounters';

export type PageId = 'map' | 'city' | 'hero' | 'home';

const ITEMS: { id: PageId; label: string; icon: React.ReactNode }[] = [
  { id: 'map', label: '世界地图', icon: <FaMapLocationDot /> },
  { id: 'city', label: '据点', icon: <FaCity /> },
  { id: 'hero', label: '角色', icon: <FaUser /> },
  { id: 'home', label: '家业', icon: <FaWheatAwn /> },
];

interface SideNavProps {
  page: PageId;
  onNavigate: (page: PageId) => void;
}

export const SideNav: React.FC<SideNavProps> = ({ page, onNavigate }) => {
  const currentCellId = useWorldStore((s) => s.currentCellId);
  const place = getCellEncounter(currentCellId)?.label ?? '荒野';

  return (
    <nav className="ink-panel m-2 flex w-[148px] flex-shrink-0 flex-col p-2">
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
