// 牧场系统 - 运行时管理
import type { RanchCreature } from '../data/ranch';

// 牧场槽位状态
export interface RanchSlotState {
  creatureId: string | null;
  boughtAt: number;   // Date.now()
  fedAt: number;     // 上次喂食时间
  harvestCount: number;
}

// 牧场系统
export class RanchSystem {
  private slots: RanchSlotState[];
  private readonly maxSlots = 12;
  private readonly feedIntervalMs = 4 * 60 * 60 * 1000; // 4小时

  constructor() {
    this.slots = new Array(this.maxSlots).fill(null).map(() => ({
      creatureId: null,
      boughtAt: 0,
      fedAt: 0,
      harvestCount: 0,
    }));
  }

  getMaxSlots(): number { return this.maxSlots; }

  getSlot(idx: number): RanchSlotState | null {
    return this.slots[idx] ?? null;
  }

  getAllSlots(): RanchSlotState[] {
    return [...this.slots];
  }

  /** 购买生物 */
  buyCreature(slotIdx: number, creatureId: string, catalog: Record<string, RanchCreature>, gold: number): { ok: boolean; msg: string } {
    if (slotIdx < 0 || slotIdx >= this.maxSlots) return { ok: false, msg: '无效槽位' };
    if (this.slots[slotIdx].creatureId !== null) return { ok: false, msg: '该槽位已有生物' };
    const creature = catalog[creatureId];
    if (!creature) return { ok: false, msg: '生物不存在' };
    if (gold < creature.price) return { ok: false, msg: '金币不足！需要 ' + creature.price + 'G' };
    this.slots[slotIdx] = { creatureId, boughtAt: Date.now(), fedAt: Date.now(), harvestCount: 0 };
    return { ok: true, msg: creature.name + ' 入圈！' };
  }

  /** 喂食 */
  feed(slotIdx: number, creature: RanchCreature, feedItemCount: number): { ok: boolean; msg: string } {
    const slot = this.slots[slotIdx];
    if (!slot || !slot.creatureId) return { ok: false, msg: '槽位为空' };
    const cost = creature.feedCost;
    if (feedItemCount < cost) return { ok: false, msg: '饲料不足！需要 ' + cost + ' 份' };
    slot.fedAt = Date.now();
    return { ok: true, msg: '喂食成功！' + creature.name + ' 很开心' };
  }

  /** 收获产物 */
  harvest(slotIdx: number, creature: RanchCreature, personalityBonus: number = 0): { output: string; count: number } | null {
    const slot = this.slots[slotIdx];
    if (!slot || !slot.creatureId) return null;
    const now = Date.now();
    // 喂食后 4 小时内才能产出
    if (now - slot.fedAt > this.feedIntervalMs) return null;
    // 每 4 小时产一次（持续产出）
    const intervals = Math.floor((now - slot.boughtAt) / this.feedIntervalMs) - slot.harvestCount;
    if (intervals <= 0) return null;
    slot.harvestCount += intervals;
    const bonus = 1 + (personalityBonus / 100);
    const count = Math.floor(intervals * bonus);
    return { output: creature.outputType, count };
  }

  /** 铲除生物 */
  remove(slotIdx: number): boolean {
    if (slotIdx < 0 || slotIdx >= this.maxSlots) return false;
    this.slots[slotIdx] = { creatureId: null, boughtAt: 0, fedAt: 0, harvestCount: 0 };
    return true;
  }

  // ── 存档 ──
  getState(): RanchSlotState[] {
    return JSON.parse(JSON.stringify(this.slots));
  }
  loadState(slots: RanchSlotState[]): void {
    this.slots = slots;
  }
}
