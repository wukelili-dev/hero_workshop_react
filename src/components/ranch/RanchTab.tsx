import React, { useState, useEffect } from 'react';
import { RANCH_CATALOG, type RanchCreature } from '../../data/ranch';
import { useRanchStore } from '../../store/useRanchStore';
import { useGameStore } from '../../store/useGameStore';
import { RarityBadge } from '../shared/RarityBadge';
import { RARITY_COLORS, CREATURE_HARVEST_INTERVAL_BY_RARITY, formatNumber } from '../../data/constants';

// 三档饲料
const FEED_TIERS = [
  { key: 'normal', label: '普通饲料', costMultiplier: 1, bonusMultiplier: 1, color: 'text-gray-300' },
  { key: 'quality', label: '优质饲料', costMultiplier: 2, bonusMultiplier: 1.5, color: 'text-blue-300' },
  { key: 'premium', label: '顶级饲料', costMultiplier: 5, bonusMultiplier: 2.5, color: 'text-yellow-300' },
] as const;

export const RanchTab: React.FC = () => {
  const slots = useRanchStore((s) => s.slots);
  const buyCreature = useRanchStore((s) => s.buyCreature);
  const feed = useRanchStore((s) => s.feed);
  const harvest = useRanchStore((s) => s.harvest);
  const hero = useGameStore((s) => s.hero);
  const [feedTier, setFeedTier] = useState<0 | 1 | 2>(0);
  const [now, setNow] = useState(Date.now());

  // Tick every second for countdown
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getCreatureData = (id: string): RanchCreature | undefined =>
    RANCH_CATALOG.find((c) => c.id === id);

  // Group catalog by rarity
  const rarityGroups = [0, 1, 2, 3, 4];
  const rarityLabels: Record<number, string> = { 0: '普通', 1: '少见', 2: '稀有', 3: '珍藏', 4: '传说' };

  const getHarvestIntervalMs = (rarity: number): number =>
    (CREATURE_HARVEST_INTERVAL_BY_RARITY[rarity] ?? 300) * 1000;

  const canHarvest = (fedAt: number, rarity: number): boolean => {
    const intervalMs = getHarvestIntervalMs(rarity);
    return now - fedAt >= intervalMs;
  };

  const getHarvestCountdown = (fedAt: number, rarity: number): string => {
    const intervalMs = getHarvestIntervalMs(rarity);
    const remaining = Math.max(0, intervalMs - (now - fedAt));
    const totalSec = Math.ceil(remaining / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const getFedStatus = (fedAt: number, rarity: number): 'ready' | 'hungry' | 'fed' => {
    if (canHarvest(fedAt, rarity)) return 'ready';
    const intervalMs = getHarvestIntervalMs(rarity);
    const elapsed = now - fedAt;
    if (elapsed < intervalMs * 0.3) return 'fed'; // just fed
    return 'hungry'; // waiting
  };

  const feedCost = (baseCost: number) => Math.floor(baseCost * FEED_TIERS[feedTier].costMultiplier);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-amber-300 font-bold text-lg">🐾 牧场</h2>
        <span className="text-yellow-400 text-sm">💰 {formatNumber(hero.gold)}</span>
      </div>

      {/* Feed tier selector */}
      <div className="flex gap-2 items-center">
        <span className="text-amber-200/60 text-xs">饲料：</span>
        {FEED_TIERS.map((tier, idx) => (
          <button
            key={tier.key}
            onClick={() => setFeedTier(idx as 0 | 1 | 2)}
            className={`px-2 py-1 rounded text-xs font-bold transition-colors ${
              feedTier === idx
                ? 'bg-amber-700 text-amber-100'
                : 'bg-slate-800 text-amber-200/50 hover:bg-slate-700'
            }`}
          >
            <span className={feedTier === idx ? 'text-amber-100' : tier.color}>
              {tier.label}
            </span>
          </button>
        ))}
      </div>

      {/* Ranch slots - owned creatures */}
      <div>
        <h3 className="text-amber-400/80 font-bold text-sm mb-2 border-b border-amber-900/30 pb-1">
          🏠 已拥有生物
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {slots.map((slot, idx) => {
            const creature = slot.creatureId ? getCreatureData(slot.creatureId) : null;
            if (!creature) {
              return (
                <div
                  key={idx}
                  className="border border-amber-900/20 bg-slate-900/30 border-dashed rounded-lg p-2 text-center"
                >
                  <div className="text-amber-200/20 text-xs py-4">空槽 #{idx + 1}</div>
                </div>
              );
            }

            const ready = canHarvest(slot.fedAt, creature.rarity);
            const countdown = getHarvestCountdown(slot.fedAt, creature.rarity);
            const fedStatus = getFedStatus(slot.fedAt, creature.rarity);
            const currentFeedCost = feedCost(creature.feedCost);
            const canFeedNow = hero.gold >= currentFeedCost;

            return (
              <div
                key={idx}
                className={`border rounded-lg p-2 text-center transition-colors ${
                  ready
                    ? 'border-green-600/50 bg-green-950/20'
                    : 'border-amber-900/30 bg-slate-900/60'
                }`}
              >
                <div className="text-2xl mb-1">{creature.icon}</div>
                <div className="text-xs font-bold text-amber-200">{creature.name}</div>
                <div className="text-xs" style={{ color: RARITY_COLORS[creature.rarity] }}>
                  {rarityLabels[creature.rarity]}
                </div>

                {/* Level / harvest count */}
                <div className="text-xs text-amber-200/40 mt-1">
                  Lv.{1 + Math.floor(slot.harvestCount / 10)} · 收获×{slot.harvestCount}
                </div>

                {/* Feed status */}
                <div className="mt-1">
                  {fedStatus === 'ready' ? (
                    <span className="text-xs text-green-400 font-bold">✦ 可收获</span>
                  ) : fedStatus === 'fed' ? (
                    <span className="text-xs text-blue-300/60">已喂食</span>
                  ) : (
                    <span className="text-xs text-amber-200/40">等待中</span>
                  )}
                </div>

                {/* Countdown */}
                {!ready && (
                  <div className="text-xs text-amber-200/30 mt-0.5">
                    ⏱ {countdown}
                  </div>
                )}

                {/* Output info */}
                <div className="text-xs text-amber-200/30 mt-0.5">{creature.outputDesc}</div>

                {/* Action buttons */}
                <div className="flex gap-1 mt-1.5 justify-center">
                  <button
                    onClick={() => feed(idx)}
                    disabled={!canFeedNow}
                    className={`px-1.5 py-0.5 rounded text-xs ${
                      canFeedNow
                        ? 'bg-amber-900/40 text-amber-200/80 hover:bg-amber-800/40'
                        : 'bg-slate-800 text-amber-200/20 cursor-not-allowed'
                    }`}
                  >
                    喂食({currentFeedCost}G)
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
              </div>
            );
          })}
        </div>
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
                <span className="text-xs text-amber-200/40">
                  {rarityLabels[rarity]}（{creatures.length}种）
                </span>
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
