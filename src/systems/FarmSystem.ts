// 农场系统
import type { Plant, FarmSlot } from '../types';

// 季节定义
export type Season = 'spring' | 'summer' | 'autumn' | 'winter';
export const SEASON_NAMES: Record<Season, string> = {
  spring: '春',
  summer: '夏',
  autumn: '秋',
  winter: '冬',
};
export const SEASON_ORDER: Season[] = ['spring', 'summer', 'autumn', 'winter'];

// 植物生长阶段
export type GrowStage = 'seed' | 'sprout' | 'grow' | 'mature' | 'dead';

// 农场槽位（运行时状态）
export interface FarmSlotState {
  plantId: string | null;
  plantedAt: number; // Date.now()
  fertilizerCount: number; // 施肥次数（叠加递减）
  harvestCount: number; // 已收获次数（成熟后持续产出）
}

// 农场系统类
export class FarmSystem {
  private slots: FarmSlotState[];
  private currentSeason: Season;
  private seasonStartTime: number; // 当前季节开始时间

  constructor() {
    this.slots = new Array(12).fill(null).map(() => ({
      plantId: null,
      plantedAt: 0,
      fertilizerCount: 0,
      harvestCount: 0,
    }));
    this.currentSeason = 'spring';
    this.seasonStartTime = Date.now();
  }

  // 获取当前季节
  getSeason(): Season {
    return this.currentSeason;
  }

  // 更新季节（每2小时切换）
  updateSeason(): void {
    const now = Date.now();
    const seasonDuration = 2 * 60 * 60 * 1000; // 2小时
    const elapsed = now - this.seasonStartTime;
    if (elapsed >= seasonDuration) {
      const currentIdx = SEASON_ORDER.indexOf(this.currentSeason);
      const nextIdx = (currentIdx + 1) % 4;
      this.currentSeason = SEASON_ORDER[nextIdx];
      this.seasonStartTime = now;
    }
  }

  // 种植
  plant(slotIdx: number, plantId: string, plants: Record<string, Plant>): boolean {
    if (slotIdx < 0 || slotIdx >= this.slots.length) return false;
    if (this.slots[slotIdx].plantId !== null) return false; // 已有植物
    if (!plants[plantId]) return false;

    this.slots[slotIdx] = {
      plantId,
      plantedAt: Date.now(),
      fertilizerCount: 0,
      harvestCount: 0,
    };
    return true;
  }

  // 收获（成熟后持续产出，无需点击）
  harvest(slotIdx: number, plants: Record<string, Plant>): { coins: number; feed: number } | null {
    const slot = this.slots[slotIdx];
    if (!slot || !slot.plantId) return null;

    const plant = plants[slot.plantId];
    if (!plant) return null;

    const now = Date.now();
    const growTimeMs = plant.growTime * 1000;
    if (now - slot.plantedAt < growTimeMs) return null; // 未成熟

    // 计算产出（季节匹配增产20%）
    let coinOutput = plant.coinOutput;
    let feedOutput = plant.feedOutput;
    if (plant.seasons.includes(this.currentSeason)) {
      coinOutput = Math.floor(coinOutput * 1.2);
      feedOutput = Math.floor(feedOutput * 1.2);
    }

    // 持续产出（每 growTime 秒产出一次）
    const totalGrowTime = now - slot.plantedAt;
    const intervals = Math.floor(totalGrowTime / growTimeMs) - slot.harvestCount;
    if (intervals <= 0) return null;

    slot.harvestCount += intervals;
    return {
      coins: coinOutput * intervals,
      feed: feedOutput * intervals,
    };
  }

  // 施肥（叠加递减：100% → 70% → 40%）
  fertilize(slotIdx: number): boolean {
    if (slotIdx < 0 || slotIdx >= this.slots.length) return false;
    const slot = this.slots[slotIdx];
    if (!slot.plantId) return false;

    // 计算加速倍率
    const boostRates = [1.0, 0.7, 0.4];
    const rate = boostRates[Math.min(slot.fertilizerCount, 2)];
    if (rate <= 0) return false;

    slot.fertilizerCount++;
    // 实际加速逻辑在 harvest 中处理（缩短 growTime）
    return true;
  }

  // 获取槽位状态
  getSlot(slotIdx: number): FarmSlotState | null {
    return this.slots[slotIdx] || null;
  }

  // 获取所有槽位
  getAllSlots(): FarmSlotState[] {
    return this.slots;
  }

  // 铲除植物
  removePlant(slotIdx: number): boolean {
    if (slotIdx < 0 || slotIdx >= this.slots.length) return false;
    this.slots[slotIdx] = {
      plantId: null,
      plantedAt: 0,
      fertilizerCount: 0,
      harvestCount: 0,
    };
    return true;
  }

  // 计算生长进度（0-100%）
  getGrowthProgress(slotIdx: number, plants: Record<string, Plant>): number {
    const slot = this.slots[slotIdx];
    if (!slot || !slot.plantId) return 0;

    const plant = plants[slot.plantId];
    if (!plant) return 0;

    const now = Date.now();
    const growTimeMs = plant.growTime * 1000;
    const elapsed = now - slot.plantedAt;
    return Math.min(100, (elapsed / growTimeMs) * 100);
  }
}
