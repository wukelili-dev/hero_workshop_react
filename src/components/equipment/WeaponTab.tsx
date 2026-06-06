import React from 'react';
import { toast } from 'sonner';
import { WEAPONS } from '../../data/equipment';
import { RARITY_COLORS } from '../../data/constants';
import { useGameStore } from '../../store/useGameStore';
import type { Equipment } from '../../types';
import { FaBomb, FaTree, FaMagnet, FaPaw, FaMountain, FaLeaf, FaCoins } from 'react-icons/fa6';

const TIERS = [
  { tier: 1, name: '初阶', level: 'Lv.1~5' },
  { tier: 2, name: '二阶', level: 'Lv.6~10' },
  { tier: 3, name: '三阶', level: 'Lv.11~15' },
  { tier: 4, name: '四阶', level: 'Lv.16~20' },
  { tier: 5, name: '五阶', level: 'Lv.21~25' },
];

const RES_LABELS: Record<string, string> = {
  '金币': '💰', '木材': '🪵', '铁矿': '⛏', '皮革': '🧶', '石头': '🪨', '药草': '🌿',
};

const RES_ICONS: Record<string, React.ReactNode> = {
  '金币': <FaCoins className="inline text-yellow-500" />,
  '木材': <FaTree className="inline text-green-600" />,
  '铁矿': <FaMagnet className="inline text-gray-400" />,
  '皮革': <FaPaw className="inline text-orange-600" />,
  '石头': <FaMountain className="inline text-gray-500" />,
  '药草': <FaLeaf className="inline text-green-500" />,
};

// 中文材料名 → store resources key 映射
const RES_KEY_MAP: Record<string, string> = {
  '木材': 'wood', '铁矿': 'iron', '皮革': 'hide', '石头': 'stone', '药草': 'herb',
};

export const WeaponTab: React.FC = () => {
  const hero = useGameStore((s) => s.hero);
  const resources = useGameStore((s) => s.resources);
  const equipWeapon = useGameStore((s) => s.equipWeapon);

  const canAfford = (w: Equipment) => {
    if (hero.level < (w.levelReq ?? 0)) return false;
    const cost = w.cost ?? {};
    for (const [res, amt] of Object.entries(cost)) {
      const numAmt = Number(amt);
      if (res === '金币') {
        if (hero.gold < numAmt) return false;
      } else {
        const rKey = RES_KEY_MAP[res] ?? res;
        if ((resources as any)[rKey] < numAmt) return false;
      }
    }
    return true;
  };

  const handleBuy = (weapon: Equipment) => {
    if (!canAfford(weapon)) {
      toast.error('资源不足');
      useGameStore.getState().addGameLog(`购买武器失败: ${weapon.name} 资源不足`);
      return;
    }
    if (hero.level < (weapon.levelReq ?? 0)) {
      toast.error('等级不足');
      useGameStore.getState().addGameLog(`购买武器失败: ${weapon.name} 等级不足(Lv.${weapon.levelReq})`);
      return;
    }
    const ok = equipWeapon(weapon);
    if (ok) {
      toast.success(`购买 ${weapon.name} 成功！`);
    }
  };

  const CostDisplay = ({ cost }: { cost: Record<string, number | string> }) => (
    <span className="flex items-center gap-1 flex-wrap">
      {Object.entries(cost).map(([res, amt]) => {
        const numAmt = Number(amt);
        const icon = RES_ICONS[res] ?? res;
        const current = res === '金币' ? hero.gold : (resources as any)[RES_KEY_MAP[res] ?? res] ?? 0;
        const enough = current >= numAmt;
        return (
          <span key={res} className={`text-xs ${enough ? 'text-yellow-600' : 'text-red-500'}`}>
            {icon}{numAmt}
            <span className="text-gray-400">({current})</span>
          </span>
        );
      })}
    </span>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between items-center">
        <h2 className="text-sm font-bold text-gray-700 flex items-center gap-1"><FaBomb className="text-red-500" /> 武器</h2>
        <span className="text-xs text-yellow-600 font-medium">💰 {hero.gold}</span>
      </div>

      {/* 提示消息 */}


      {TIERS.map(({ tier, name, level }) => {
        const items = Object.values(WEAPONS).filter((w: any) => w.tier === tier);
        if (!items.length) return null;
        return (
          <div key={tier}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-bold text-gray-700">{name}</span>
              <span className="text-xs text-gray-400">{level}</span>
            </div>
            <div className="space-y-1">
              {items.map((w: any) => {
                const affordable = canAfford(w);
                const isEquipped = hero.weapon?.id === w.id;

                return (
                  <div
                    key={w.id}
                    className="flex items-center justify-between px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-200 hover:shadow-sm hover:-translate-y-0.5 transition-all duration-200"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="font-bold text-sm"
                        style={{ color: RARITY_COLORS[w.rarity] ?? '#888' }}
                      >
                        {w.name}
                      </span>
                      {isEquipped && (
                        <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-600 rounded">已装备</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {w.stats?.atk && <span className="text-xs text-red-500 flex items-center gap-0.5"><FaBomb className="text-red-400" />{w.stats.atk}</span>}
                      {w.stats?.crit && <span className="text-xs text-orange-500">CRIT {(w.stats.crit * 100).toFixed(0)}%</span>}
                      <CostDisplay cost={w.cost ?? {}} />
                      <button
                        onClick={() => handleBuy(w)}
                        disabled={!affordable || isEquipped}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          isEquipped
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : affordable
                            ? 'bg-blue-500 hover:bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {isEquipped ? '已装备' : '购买'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
