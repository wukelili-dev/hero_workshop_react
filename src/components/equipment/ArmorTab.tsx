import React, { useState } from 'react';
import { ARMORS } from '../../data/equipment';
import { RARITY_COLORS } from '../../data/constants';
import { useGameStore } from '../../store/useGameStore';
import type { Equipment } from '../../types';
import { FaShield, FaTree, FaMagnet, FaPaw, FaMountain, FaLeaf, FaCoins } from 'react-icons/fa6';

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

export const ArmorTab: React.FC = () => {
  const hero = useGameStore((s) => s.hero);
  const resources = useGameStore((s) => s.resources);
  const equipArmor = useGameStore((s) => s.equipArmor);
  const [msg, setMsg] = useState<string | null>(null);

  const canAfford = (a: Equipment) => {
    if (hero.level < (a.levelReq ?? 0)) return false;
    const cost = a.cost ?? {};
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

  const handleBuy = (armor: Equipment) => {
    if (!canAfford(armor)) {
      setMsg('❌ 资源不足');
      useGameStore.getState().addGameLog(`购买护甲失败: ${armor.name} 资源不足`);
      setTimeout(() => setMsg(null), 2000);
      return;
    }
    if (hero.level < (armor.levelReq ?? 0)) {
      setMsg('❌ 等级不足');
      useGameStore.getState().addGameLog(`购买护甲失败: ${armor.name} 等级不足(Lv.${armor.levelReq})`);
      setTimeout(() => setMsg(null), 2000);
      return;
    }
    const ok = equipArmor(armor);
    if (ok) {
      setMsg(`✅ 购买 ${armor.name} 成功！`);
      setTimeout(() => setMsg(null), 2000);
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
        <h2 className="text-sm font-bold text-gray-700 flex items-center gap-1"><FaShield className="text-blue-500" /> 护甲</h2>
        <span className="text-xs text-yellow-600 font-medium">💰 {hero.gold}</span>
      </div>

      {/* 提示消息 */}
      {msg && (
        <div className="px-3 py-1.5 bg-gray-100 rounded text-sm text-center">{msg}</div>
      )}

      {TIERS.map(({ tier, name, level }) => {
        const items = Object.values(ARMORS).filter((a: any) => a.tier === tier);
        if (!items.length) return null;
        return (
          <div key={tier}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-bold text-gray-700">{name}</span>
              <span className="text-xs text-gray-400">{level}</span>
            </div>
            <div className="space-y-1">
              {items.map((a: any) => {
                const affordable = canAfford(a);
                const isEquipped = hero.armor?.id === a.id;

                return (
                  <div
                    key={a.id}
                    className="flex items-center justify-between px-3 py-2 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="font-bold text-sm"
                        style={{ color: RARITY_COLORS[a.rarity] ?? '#888' }}
                      >
                        {a.name}
                      </span>
                      {isEquipped && (
                        <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-600 rounded">已装备</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {a.stats?.def && <span className="text-xs text-blue-500">🛡{a.stats.def}</span>}
                      {a.stats?.hp && <span className="text-xs text-red-400">❤{a.stats.hp}</span>}
                      {a.stats?.crit && <span className="text-xs text-orange-500">CRIT {(a.stats.crit * 100).toFixed(0)}%</span>}
                      <CostDisplay cost={a.cost ?? {}} />
                      <button
                        onClick={() => handleBuy(a)}
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
