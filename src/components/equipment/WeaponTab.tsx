import React from 'react';
import { motion, type Variants } from 'framer-motion';
import { toast } from 'sonner';
import { WEAPONS } from '../../data/equipment';
import { RARITY_COLORS } from '../../data/constants';
import { useGameStore } from '../../store/useGameStore';
import type { Equipment } from '../../types';
import { FaBomb, FaTree, FaMagnet, FaPaw, FaMountain, FaLeaf, FaCoins } from 'react-icons/fa6';

const TIERS = [
  { tier: 1, name: '初阶', level: 'Lv.1~5', hoverClass: 'hover:border-green-300/80 hover:shadow-sm hover:shadow-green-100/50', borderClass: 'border-green-200/80' },
  { tier: 2, name: '二阶', level: 'Lv.6~10', hoverClass: 'hover:border-blue-300/80 hover:shadow-sm hover:shadow-blue-100/50', borderClass: 'border-blue-200/80' },
  { tier: 3, name: '三阶', level: 'Lv.11~15', hoverClass: 'hover:border-purple-300/80 hover:shadow-sm hover:shadow-purple-100/50', borderClass: 'border-purple-200/80' },
  { tier: 4, name: '四阶', level: 'Lv.16~20', hoverClass: 'hover:border-yellow-300/80 hover:shadow-sm hover:shadow-yellow-100/50', borderClass: 'border-yellow-200/80' },
  { tier: 5, name: '五阶', level: 'Lv.21~25', hoverClass: 'hover:border-orange-300/80 hover:shadow-sm hover:shadow-orange-100/50', borderClass: 'border-orange-200/80' },
];

const RES_ICONS: Record<string, React.ReactNode> = {
  '金币': <FaCoins className="inline text-yellow-500" />,
  '木材': <FaTree className="inline text-green-600" />,
  '铁矿': <FaMagnet className="inline text-gray-400" />,
  '皮革': <FaPaw className="inline text-orange-600" />,
  '石头': <FaMountain className="inline text-gray-500" />,
  '药草': <FaLeaf className="inline text-green-500" />,
};

const RES_KEY_MAP: Record<string, string> = {
  '木材': 'wood', '铁矿': 'iron', '皮革': 'hide', '石头': 'stone', '药草': 'herb',
};

const listVariants: Variants = {
  hidden: { opacity: 0, x: -16 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.05, duration: 0.3, ease: 'easeOut' },
  }),
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

      {TIERS.map(({ tier, name, level, hoverClass, borderClass }) => {
        const items = Object.values(WEAPONS).filter((w: any) => w.tier === tier);
        if (!items.length) return null;
        return (
          <div key={tier}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-bold text-gray-700">{name}</span>
              <span className="text-xs text-gray-400">{level}</span>
            </div>
            <div className="space-y-1.5">
              {items.map((w: any, i: number) => {
                const affordable = canAfford(w);
                const isEquipped = hero.weapon?.id === w.id;

                return (
                  <motion.div
                    key={w.id}
                    custom={i}
                    variants={listVariants}
                    initial="hidden"
                    animate="visible"
                    whileHover={{ scale: 1.012 }}
                    className={`flex items-center justify-between px-3 py-2 bg-white border ${borderClass} rounded-xl transition-all duration-200 cursor-default shadow-sm ${hoverClass}`}
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
                      <motion.button
                        whileTap={{ scale: 0.88 }}
                        onClick={() => handleBuy(w)}
                        disabled={!affordable || isEquipped}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          isEquipped
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : affordable
                            ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-sm hover:shadow'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {isEquipped ? '已装备' : '购买'}
                      </motion.button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
