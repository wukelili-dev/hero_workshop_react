import React from 'react';
import { useInventoryStore } from '../../store/useInventoryStore';
import { useGameStore } from '../../store/useGameStore';
import { RarityBadge } from '../shared/RarityBadge';
import { RARITY_COLORS, formatNumber } from '../../data/constants';

export const InventoryTab: React.FC = () => {
  const weapons = useInventoryStore((s) => s.weapons);
  const armors = useInventoryStore((s) => s.armors);
  const novelties = useInventoryStore((s) => s.novelties);
  const hero = useGameStore((s) => s.hero);

  return (
    <div className="space-y-6">
      <h2 className="text-amber-300 font-bold text-lg">🎒 背包</h2>

      {/* Equipped */}
      <div>
        <h3 className="text-amber-400/80 font-bold text-sm mb-2 border-b border-amber-900/30 pb-1">
          已装备
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <div className="border border-amber-700/30 rounded p-3 bg-amber-950/20">
            <div className="text-xs text-amber-200/40 mb-1">🗡 武器</div>
            {hero.weapon ? (
              <div>
                <span className="font-bold text-sm" style={{ color: hero.weapon.rarityColor }}>
                  {hero.weapon.name}
                </span>
                {hero.weapon.fortifyLevel ? <span className="text-yellow-400 text-xs ml-1">+{hero.weapon.fortifyLevel}</span> : null}
                {hero.weapon.attack && <div className="text-xs text-amber-200/60">ATK +{hero.weapon.attack}</div>}
              </div>
            ) : (
              <div className="text-amber-200/30 text-sm">空</div>
            )}
          </div>
          <div className="border border-amber-700/30 rounded p-3 bg-amber-950/20">
            <div className="text-xs text-amber-200/40 mb-1">🛡 护甲</div>
            {hero.armor ? (
              <div>
                <span className="font-bold text-sm" style={{ color: hero.armor.rarityColor }}>
                  {hero.armor.name}
                </span>
                {hero.armor.fortifyLevel ? <span className="text-yellow-400 text-xs ml-1">+{hero.armor.fortifyLevel}</span> : null}
                {hero.armor.defense && <div className="text-xs text-amber-200/60">DEF +{hero.armor.defense}</div>}
              </div>
            ) : (
              <div className="text-amber-200/30 text-sm">空</div>
            )}
          </div>
        </div>
      </div>

      {/* Weapons */}
      {weapons.length > 0 && (
        <div>
          <h3 className="text-amber-400/80 font-bold text-sm mb-2 border-b border-amber-900/30 pb-1">
            🗡 武器 ({weapons.length})
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {weapons.map((w, i) => (
              <div key={`${w.id}-${i}`} className="border border-amber-900/30 rounded p-2 bg-slate-900/60">
                <div className="flex items-center gap-1 mb-1">
                  <span className="font-bold text-sm" style={{ color: w.rarityColor || RARITY_COLORS[w.rarity] }}>
                    {w.name}
                  </span>
                  {w.fortifyLevel ? <span className="text-yellow-400 text-xs">+{w.fortifyLevel}</span> : null}
                  <RarityBadge rarity={w.rarity} />
                </div>
                <div className="text-xs text-amber-200/60">
                  {w.attack ? `ATK +${w.attack}` : ''} {w.defense ? `DEF +${w.defense}` : ''}
                </div>
                <div className="flex gap-1 mt-1">
                  <button className="px-2 py-0.5 rounded text-xs bg-blue-900/60 text-amber-200/70 hover:bg-blue-800/60">装备</button>
                  <button className="px-2 py-0.5 rounded text-xs bg-red-900/40 text-amber-200/50 hover:bg-red-800/40">
                    出售 {w.sellPrice}G
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Armors */}
      {armors.length > 0 && (
        <div>
          <h3 className="text-amber-400/80 font-bold text-sm mb-2 border-b border-amber-900/30 pb-1">
            🛡 护甲 ({armors.length})
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {armors.map((a, i) => (
              <div key={`${a.id}-${i}`} className="border border-amber-900/30 rounded p-2 bg-slate-900/60">
                <div className="flex items-center gap-1 mb-1">
                  <span className="font-bold text-sm" style={{ color: a.rarityColor || RARITY_COLORS[a.rarity] }}>
                    {a.name}
                  </span>
                  {a.fortifyLevel ? <span className="text-yellow-400 text-xs">+{a.fortifyLevel}</span> : null}
                  <RarityBadge rarity={a.rarity} />
                </div>
                <div className="text-xs text-amber-200/60">
                  {a.defense ? `DEF +${a.defense}` : ''} {a.hpBonus ? `HP +${a.hpBonus}` : ''}
                </div>
                <div className="flex gap-1 mt-1">
                  <button className="px-2 py-0.5 rounded text-xs bg-blue-900/60 text-amber-200/70 hover:bg-blue-800/60">装备</button>
                  <button className="px-2 py-0.5 rounded text-xs bg-red-900/40 text-amber-200/50 hover:bg-red-800/40">
                    出售 {a.sellPrice}G
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Novelties */}
      {Object.keys(novelties).length > 0 && (
        <div>
          <h3 className="text-amber-400/80 font-bold text-sm mb-2 border-b border-amber-900/30 pb-1">
            🎁 杂物
          </h3>
          <div className="grid grid-cols-3 gap-1">
            {Object.entries(novelties).map(([name, count]) => (
              <div key={name} className="border border-amber-900/20 rounded p-1.5 bg-slate-900/40 text-xs">
                <span className="text-amber-200/80">{name}</span>
                <span className="text-amber-400 ml-1">×{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {weapons.length === 0 && armors.length === 0 && Object.keys(novelties).length === 0 && (
        <div className="text-center text-amber-200/30 py-8">背包空空如也</div>
      )}
    </div>
  );
};
