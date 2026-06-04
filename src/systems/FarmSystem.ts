// @ts-nocheck — legacy system
import type { Plant, FarmSlot } from '../types';

// 季节定义
export type Season = 'spring' | 'summer' | 'autumn' | 'winter';
export const SEASON_NAMES: Record<Season, string> = { spring: '春', summer: '夏', autumn: '秋', winter: '冬' };
export const SEASON_ORDER: Season[] = ['spring', 'summer', 'autumn', 'winter'];

// 农场槽位状态
export interface FarmSlotState {
  plantId: string | null;
  plantedAt: number;
  fertilizerCount: number;
  harvestCount: number;
}

// 农场系统
export class FarmSystem {
  private slots: FarmSlotState[];
  private currentSeason: Season;
  private seasonStartTime: number;

  constructor() {
    this.slots = new Array(12).fill(null).map(() => ({ plantId: null, plantedAt: 0, fertilizerCount: 0, harvestCount: 0 }));
    this.currentSeason = 'spring';
    this.seasonStartTime = Date.now();
  }

  getSeason(): Season { return this.currentSeason; }

  updateSeason(): void {
    const now = Date.now();
    const seasonDuration = 2 * 60 * 60 * 1000;
    if (now - this.seasonStartTime >= seasonDuration) {
      const idx = SEASON_ORDER.indexOf(this.currentSeason);
      this.currentSeason = SEASON_ORDER[(idx + 1) % 4];
      this.seasonStartTime = now;
    }
  }

  plant(slotIdx: number, plantId: string, plants: Record<string, Plant>): boolean {
    if (slotIdx < 0 || slotIdx >= this.slots.length) return false;
    if (this.slots[slotIdx].plantId !== null) return false;
    if (!plants[plantId]) return false;
    this.slots[slotIdx] = { plantId, plantedAt: Date.now(), fertilizerCount: 0, harvestCount: 0 };
    return true;
  }

  harvest(slotIdx: number, plants: Record<string, Plant>): { coins: number; feed: number } | null {
    const slot = this.slots[slotIdx];
    if (!slot || !slot.plantId) return null;
    const plant = plants[slot.plantId];
    if (!plant) return null;
    const now = Date.now();
    const growTimeMs = plant.growTime * 1000;
    if (now - slot.plantedAt < growTimeMs) return null;
    let coinOutput = plant.coinOutput;
    let feedOutput = plant.feedOutput;
    if (plant.seasons.includes(this.currentSeason)) {
      coinOutput = Math.floor(coinOutput * 1.2);
      feedOutput = Math.floor(feedOutput * 1.2);
    }
    const intervals = Math.floor((now - slot.plantedAt) / growTimeMs) - slot.harvestCount;
    if (intervals <= 0) return null;
    slot.harvestCount += intervals;
    return { coins: coinOutput * intervals, feed: feedOutput * intervals };
  }

  fertilize(slotIdx: number): boolean {
    if (slotIdx < 0 || slotIdx >= this.slots.length) return false;
    const slot = this.slots[slotIdx];
    if (!slot.plantId) return false;
    const boostRates = [1.0, 0.7, 0.4];
    const rate = boostRates[Math.min(slot.fertilizerCount, 2)];
    if (rate <= 0) return false;
    slot.fertilizerCount++;
    return true;
  }

  removePlant(slotIdx: number): boolean {
    if (slotIdx < 0 || slotIdx >= this.slots.length) return false;
    this.slots[slotIdx] = { plantId: null, plantedAt: 0, fertilizerCount: 0, harvestCount: 0 };
    return true;
  }

  getSlot(slotIdx: number): FarmSlotState | null {
    return this.slots[slotIdx] || null;
  }

  getAllSlots(): FarmSlotState[] { return this.slots; }

  getGrowthProgress(slotIdx: number, plants: Record<string, Plant>): number {
    const slot = this.slots[slotIdx];
    if (!slot || !slot.plantId) return 0;
    const plant = plants[slot.plantId];
    if (!plant) return 0;
    const elapsed = Date.now() - slot.plantedAt;
    return Math.min(100, (elapsed / (plant.growTime * 1000)) * 100);
  }
}
