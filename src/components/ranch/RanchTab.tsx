import React from 'react';
import { RANCH_CATALOG, type RanchCreature } from '../../data/ranch';
import { useRanchStore } from '../../store/useRanchStore';
import { useGameStore } from '../../store/useGameStore';
import { RarityBadge } from '../shared/RarityBadge';
import { RARITY_COLORS, formatNumber } from '../../data/constants';

export const RanchTab: React.FC = () => {
  const slots = useRanchStore((s) => s.slots);
  const buyCreature = useRanchStore((s) => s.buyCreature);
  const feed = useRanchStore((s) => s.feed);
  const harvest = useRanchStore((s) => s.harvest);
  const hero = useGameStore((s) => s.hero);

  const getCreatureData = (id: string): RanchCreature | undefined =>
    RANCH_CATALOG.find((c) => c.id === id);

  // Group catalog by rarity
  const rarityGroups = [0, 1, 2, 3, 4];
  const rarityLabels: Record<number, string> = { 0: '普通', 1: '少见', 2: '稀有', 3: '珍藏', 4: '传说' };

  const canHarvest = (fedAt: number): boolean => {
    const intervalMs = 4 * 60 * 60 * 1000; // 4 hours
    return Date.now() - fedAt >= intervalMs;
  };

  return (
    <div className="space-y-6">
      <h2 className="text-amber-300 font-bold text-lg">🐾 牧场</h2>

      {/* Ranch slots */}
      <div className="grid grid-cols-3 gap-2">
        {slots.map((slot, idx) => {
          const creature = slot.creatureId ? getCreatureData(slot.creatureId) : null;
          const canFeedNow = creature && hero.gold >= creature.feedCost;
          const ready = slot.creatureId ? canHarvest(slot.fedAt) : false;

          return (
            <div
              key={idx}
              className={`border rounded-lg p-2 text-center transition-colors ${
                creature
                  ? ready
                    ? 'border-green-600/50 bg-green-950/20'
                    : 'border-amber-900/30 bg-slate-900/60'
                  : 'border-amber-900/20 bg-slate-900/30 border-dashed'
              }`}
            >
              {creature ? (
                <>
                  <div className="text-2xl mb-1">{creature.icon}</div>
                  <div className="text-xs font-bold text-amber-200">{creature.name}</div>
                  <div className="text-xs text-amber-200/40">{creature.outputDesc}</div>
                  <div className="flex gap-1 mt-1 justify-center">
                    <button
                      onClick={() => feed(idx)}
                      className="px-1.5 py-0.5 rounded text-xs bg-amber-900/40 text-amber-200/60 hover:bg-amber-800/40"
                    >
                      喂食({creature.feedCost}G)
                    </button>
                    {ready && (
                      <button
                        onClick={() => harvest(idx)}
                        className="px-2 py-0.5 rounded text-xs font-bold bg-green-700 hover:bg-green-600 text-green-100"
                      >
                        收获
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-amber-200/20 text-xs py-4">空槽 #{idx + 1}</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Creature shop */}
      <div>
        <h3 className="text-amber-400/80 font-bold text-sm mb-2 border-b border-amber-900/30 pb-1">
          🏪 生物商店
        </h3>
        {rarityGroups.map((rarity) => {
          const creatures = RANCH_CATALOG.filter((c) => c.rarity === rarity);
          if (creatures.length === 0) return null;
          return (
            <div key={rarity} className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <RarityBadge rarity={rarity} size="md" />
                <span className="text-xs text-amber-200/40">{rarityLabels[rarity]}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {creatures.map((c) => {
                  const hasEmptySlot = slots.some((s) => !s.creatureId);
                  const canBuy = hero.gold >= c.price && hasEmptySlot;
                  return (
                    <div key={c.id} className="border border-amber-900/30 rounded-lg p-3 bg-slate-900/60">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{c.icon}</span>
                        <span className="font-bold text-sm" style={{ color: RARITY_COLORS[c.rarity] }}>
                          {c.name}
                        </span>
                      </div>
                      <div className="text-xs text-amber-200/50 mb-1">{c.desc}</div>
                      <div className="text-xs text-amber-200/40 mb-1">
                        性格: {c.personality} | 产出: {c.outputDesc}
                      </div>
                      <button
                        onClick={() => {
                          const emptyIdx = slots.findIndex((s) => !s.creatureId);
                          if (emptyIdx >= 0) buyCreature(emptyIdx, c.id);
                        }}
                        disabled={!canBuy}
                        className={`w-full py-1 rounded text-xs font-bold ${
                          canBuy
                            ? 'bg-amber-700 hover:bg-amber-600 text-amber-100'
                            : 'bg-slate-800 text-amber-200/30 cursor-not-allowed'
                        }`}
                      >
                        购买 ({c.price}G)
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
