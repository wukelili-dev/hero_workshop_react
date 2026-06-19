import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { useRanchStore } from '../../store/useRanchStore';
import { useInventoryStore } from '../../store/useInventoryStore';
import { RANCH_CATALOG, getPersonalityMultiplier } from '../../data/ranch';
import type { RanchCreature } from '../../data/ranch';

const RARITY_COLOR: Record<number, string> = { 0: '#C0C0C0', 1: '#22C55E', 2: '#3B82F6', 3: '#A855F7', 4: '#F59E0B' };
const FEED_INTERVAL_MS = 4 * 60 * 60 * 1000; // 4小时
const RARITY_NAMES = ['白', '绿', '蓝', '紫', '橙'];

export const RanchTab: React.FC = () => {
  const hero = useGameStore(s => s.hero);
  const addGold = useGameStore(s => s.addGold);
  const slots = useRanchStore(s => s.slots);
  const { buyCreature, feed, harvest, resetSlots } = useRanchStore();
  const { materials, addMaterial } = useInventoryStore();

  const [showCatalog, setShowCatalog] = useState(false);
  const [buySlotIdx, setBuySlotIdx] = useState<number | null>(null);
  const [filterRarity, setFilterRarity] = useState<number | 'all'>('all');
  const [msg, setMsg] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const ranchGold = hero.gold ?? 0;

  const showMsg = (text: string) => {
    setMsg(text);
    setTimeout(() => setMsg(null), 2500);
  };

  // 购买生物
  const handleBuy = useCallback((slotIdx: number, creature: RanchCreature) => {
    if (ranchGold < creature.price) { showMsg(`⚠️ 金币不足（需要 ${creature.price}）`); useGameStore.getState().addGameLog(`牧场购买失败: ${creature.name} 金币不足(需要${creature.price}G)`); return; }
    addGold(-creature.price);
    buyCreature(slotIdx, creature.id);
    showMsg(`✅ ${creature.icon} ${creature.name} 入圈！`);
    setShowCatalog(false);
    setBuySlotIdx(null);
  }, [ranchGold, addGold, buyCreature]);

  // 喂食
  const handleFeed = useCallback((slotIdx: number) => {
    const slot = slots[slotIdx];
    if (!slot || !slot.creatureId) return;
    const creature = RANCH_CATALOG.find(c => c.id === slot.creatureId);
    if (!creature) return;
    if (ranchGold < creature.feedCost) { showMsg(`⚠️ 金币不足（需要 ${creature.feedCost}）`); useGameStore.getState().addGameLog(`牧场喂食失败: ${creature.name} 金币不足(需要${creature.feedCost}G)`); return; }
    addGold(-creature.feedCost);
    feed(slotIdx);
    showMsg(`✅ 喂食成功！${creature.name} 很开心`);
  }, [slots, ranchGold, addGold, feed]);

  // 收获
  const handleHarvest = useCallback((slotIdx: number) => {
    const slot = slots[slotIdx];
    if (!slot || !slot.creatureId) return;
    const creature = RANCH_CATALOG.find(c => c.id === slot.creatureId);
    if (!creature) return;

    const now = Date.now();
    const fedAgo = now - slot.fedAt;
    if (fedAgo > FEED_INTERVAL_MS) { showMsg(`⚠️ 需要先喂食（${creature.name} 饿了）`); return; }

    const intervals = Math.floor((now - slot.boughtAt) / FEED_INTERVAL_MS) - slot.harvestCount;
    if (intervals <= 0) { showMsg('⚠️ 暂无产物可收获'); return; }

    const personalityMult = getPersonalityMultiplier(creature.personality);
    const count = Math.max(1, Math.floor(intervals * personalityMult));

    addMaterial(creature.outputType, count);
    harvest(slotIdx);
    showMsg(`✅ 收获 ${creature.outputType}×${count}`);
  }, [slots, addMaterial, harvest]);

  // 铲除
  const handleRemove = useCallback((slotIdx: number) => {
    const slot = slots[slotIdx];
    if (!slot || !slot.creatureId) return;
    const newSlots = [...slots];
    newSlots[slotIdx] = { creatureId: null, boughtAt: 0, fedAt: 0, harvestCount: 0 };
    useRanchStore.setState({ slots: newSlots });
    showMsg('🗑️ 已铲除');
  }, [slots]);

  // 过滤目录
  const filteredCatalog = useMemo(() => {
    if (filterRarity === 'all') return RANCH_CATALOG;
    return RANCH_CATALOG.filter(c => c.rarity === filterRarity);
  }, [filterRarity]);

  // 收获倒计时
  const getHarvestStatus = (slot: typeof slots[0]): { ready: boolean; text: string } => {
    if (!slot || !slot.creatureId) return { ready: false, text: '' };
    const fedAgo = now - slot.fedAt;
    if (fedAgo > FEED_INTERVAL_MS) return { ready: false, text: '需喂食' };
    const intervals = Math.floor((now - slot.boughtAt) / FEED_INTERVAL_MS) - slot.harvestCount;
    if (intervals > 0) return { ready: true, text: `可收获×${intervals}` };
    const nextIn = FEED_INTERVAL_MS - (now - Math.max(slot.fedAt, slot.boughtAt));
    const min = Math.ceil(nextIn / 60000);
    return { ready: false, text: `${min}分钟后` };
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-gray-700">🐾 牧场</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-yellow-600 font-medium">💰 {ranchGold}</span>
          <button onClick={() => { resetSlots(); showMsg('🗑️ 已重置所有槽位'); }}
            className="px-2 py-0.5 bg-red-100 hover:bg-red-200 text-red-700 rounded text-[10px] transition-colors">
            重置
          </button>
        </div>
      </div>

      {msg && <div className="px-3 py-1.5 bg-gray-100 rounded text-sm text-center">{msg}</div>}

      <p className="text-[10px] text-gray-400">购买生物→喂食（每4h）→收获材料（用于锻造）</p>

      {/* 槽位网格 */}
      <div className="grid grid-cols-2 gap-2">
        {slots.map((slot, idx) => {
          const creature = slot.creatureId ? RANCH_CATALOG.find(c => c.id === slot.creatureId) : null;
          const harvestStatus = getHarvestStatus(slot);
          return (
            <div key={idx} className={`p-2 border rounded-lg text-xs ${creature ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
              {creature ? (
                <>
                  <div className="flex items-center gap-1 mb-1">
                    <span className="text-lg">{creature.icon}</span>
                    <div>
                      <div className="font-medium" style={{ color: RARITY_COLOR[creature.rarity] ?? '#888' }}>{creature.name}</div>
                      <div className="text-[9px] text-gray-400">{RARITY_NAMES[creature.rarity] ?? '白'}·{creature.personality}</div>
                    </div>
                  </div>
                  <div className="text-[9px] text-gray-400 mb-1">{creature.outputType}（{creature.outputDesc}）</div>
                  <div className={`text-[9px] mb-1 ${harvestStatus.ready ? 'text-green-500 font-medium' : 'text-gray-400'}`}>
                    {harvestStatus.text}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => handleFeed(idx)}
                      className="flex-1 py-0.5 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded text-[9px] transition-colors">
                      🍽️ 喂（{creature.feedCost}💰）
                    </button>
                    <button onClick={() => handleHarvest(idx)}
                      disabled={!harvestStatus.ready}
                      className={`flex-1 py-0.5 rounded text-[9px] transition-colors ${harvestStatus.ready ? 'bg-blue-100 hover:bg-blue-200 text-blue-800' : 'bg-gray-100 text-gray-300 cursor-not-allowed'}`}>
                      🧺 收获
                    </button>
                    <button onClick={() => handleRemove(idx)}
                      className="px-1 py-0.5 bg-red-100 hover:bg-red-200 text-red-600 rounded text-[9px] transition-colors">
                      ✕
                    </button>
                  </div>
                </>
              ) : (
                <button onClick={() => { setBuySlotIdx(idx); setShowCatalog(true); }}
                  className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-400 hover:border-green-400 hover:text-green-500 transition-colors text-[10px]">
                  + 购买生物（槽位 {idx + 1}）
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* 材料库存 */}
      <div>
        <div className="text-[10px] text-gray-400 mb-1">仓库材料</div>
        <div className="flex flex-wrap gap-1">
          {Object.entries(materials).filter(([, v]) => (v as number) > 0).map(([k, v]) => (
            <span key={k} className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px] text-gray-600">{k}×{v as number}</span>
          ))}
          {Object.values(materials).every(v => (v as number) <= 0) && <span className="text-[10px] text-gray-300">空</span>}
        </div>
      </div>

      {/* 生物目录弹窗 */}
      {showCatalog && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowCatalog(false)}>
          <div className="bg-white rounded-xl p-4 w-80 max-h-96 overflow-y-auto space-y-2" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold">🐾 生物目录</h3>
              <button onClick={() => setShowCatalog(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            {/* 稀有度过滤 */}
            <div className="flex gap-1 mb-2">
              {(['all', 0, 1, 2, 3, 4] as const).map(r => (
                <button key={String(r)} onClick={() => setFilterRarity(r)}
                  className={`px-1.5 py-0.5 rounded text-[9px] ${filterRarity === r ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                  {r === 'all' ? '全部' : RARITY_NAMES[r as number]}
                </button>
              ))}
            </div>
            {/* 列表 */}
            <div className="space-y-1">
              {filteredCatalog.map(c => (
                <div key={c.id} className="p-1.5 border border-gray-200 rounded flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">{c.icon}</span>
                    <div>
                      <div className="text-[11px] font-medium" style={{ color: RARITY_COLOR[c.rarity] ?? '#888' }}>{c.name}</div>
                      <div className="text-[9px] text-gray-400">{c.personality}·{c.outputType}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => buySlotIdx !== null && handleBuy(buySlotIdx, c)}
                    disabled={ranchGold < c.price}
                    className={`px-2 py-0.5 rounded text-[9px] ${ranchGold >= c.price ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
                    {c.price}💰
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
