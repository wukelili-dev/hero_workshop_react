// @ts-nocheck — legacy system
// 建筑系统 - 伐木场/铁矿/狩猎场/采石场 运行时管理
import type { BuildingConfig } from '../data/buildings';

export interface BuildingState {
  id: string;
  level: number;           // 0=未建造，1~5=已建
  lastCollectAt: number;   // 上次采集时间
  workers: number;         // 驻场工人数
}

const COLLECT_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6小时

export class BuildingSystem {
  private buildings: Map<string, BuildingState> = new Map();

  constructor() {
    this._init(['wood', 'iron', 'hunting', 'stone']);
  }

  private _init(ids: string[]): void {
    ids.forEach(id => {
      this.buildings.set(id, { id, level: 0, lastCollectAt: 0, workers: 0 });
    });
  }

  getBuilding(id: string): BuildingState | undefined {
    return this.buildings.get(id);
  }

  getAllBuildings(): BuildingState[] {
    return Array.from(this.buildings.values());
  }

  /** 建造建筑 */
  build(id: string, config: BuildingConfig, gold: number, resources: Record<string, number>): { ok: boolean; msg: string } {
    const b = this.buildings.get(id);
    if (!b) return { ok: false, msg: '建筑不存在' };
    if (b.level > 0) return { ok: false, msg: '已建造' };
    const cost = config.buildCost?.gold ?? 0;
    const rc = config.buildCost?.resources ?? {};
    if (gold < cost) return { ok: false, msg: '金币不足！需要 ' + cost + 'G' };
    for (const [res, cnt] of Object.entries(rc)) {
      if ((resources[res] ?? 0) < cnt) return { ok: false, msg: '资源不足：' + res };
    }
    b.level = 1;
    b.lastCollectAt = Date.now();
    return { ok: true, msg: config.name + ' 建造完成！' };
  }

  /** 升级建筑 */
  upgrade(id: string, config: BuildingConfig, level: number, gold: number, resources: Record<string, number>): { ok: boolean; msg: string } {
    const b = this.buildings.get(id);
    if (!b || b.level === 0) return { ok: false, msg: '建筑未建造' };
    if (level >= 5) return { ok: false, msg: '已达最高等级' };
    const upCost = config.upgradeCost?.gold ?? config.buildCost?.gold ?? 0;
    const urc = config.upgradeCost?.resources ?? {};
    if (gold < upCost) return { ok: false, msg: '金币不足！需要 ' + upCost + 'G' };
    for (const [res, cnt] of Object.entries(urc)) {
      if ((resources[res] ?? 0) < cnt) return { ok: false, msg: '资源不足：' + res };
    }
    b.level = level + 1;
    return { ok: true, msg: config.name + ' 升级到 Lv.' + b.level + '！' };
  }

  /** 分配工人 */
  assignWorkers(id: string, count: number): { ok: boolean; msg: string } {
    const b = this.buildings.get(id);
    if (!b || b.level === 0) return { ok: false, msg: '建筑未建造' };
    if (count < 0) return { ok: false, msg: '人数不能为负' };
    if (count > b.level * 2) return { ok: false, msg: '每级最多2名工人，当前最多 ' + (b.level * 2) + ' 人' };
    b.workers = count;
    return { ok: true, msg: '已分配 ' + count + ' 名工人' };
  }

  /** 尝试采集 */
  tryCollect(id: string, workerConfig: Record<string, { output: number }>): { collected: boolean; output: Record<string, number> } {
    const b = this.buildings.get(id);
    if (!b || b.level === 0 || b.workers === 0) return { collected: false, output: {} };
    const now = Date.now();
    if (now - b.lastCollectAt < COLLECT_INTERVAL_MS) return { collected: false, output: {} };
    const cfg = workerConfig[id];
    if (!cfg) return { collected: false, output: {} };
    b.lastCollectAt = now;
    const amount = cfg.output * b.workers * b.level;
    return { collected: true, output: { [id]: amount } };
  }

  // ── 存档 ──
  getState(): BuildingState[] {
    return Array.from(this.buildings.values());
  }
  loadState(states: BuildingState[]): void {
    this.buildings.clear();
    states.forEach(s => this.buildings.set(s.id, s));
  }
}
