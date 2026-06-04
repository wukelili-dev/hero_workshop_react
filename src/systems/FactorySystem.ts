// @ts-nocheck — legacy system
// 工厂系统 - 运行时管理
import type { DepartmentConfig, WorkerConfig } from '../data/factory';

export interface FactoryDepartmentState {
  departmentId: string;
  level: number;         // 1~5
  workerCount: number;
  built: boolean;
  lastProduceAt: number;  // 上次产出时间
}

const PRODUCER_INTERVAL_MS = 8 * 60 * 60 * 1000; // 8小时

export class FactorySystem {
  private departments: Map<string, FactoryDepartmentState> = new Map();

  constructor() {
    this._initDepartments();
  }

  private _initDepartments(): void {
    const ids = ['wood', 'iron', 'hunting', 'stone', 'guild'];
    ids.forEach(id => {
      this.departments.set(id, {
        departmentId: id,
        level: 0,
        workerCount: 0,
        built: false,
        lastProduceAt: Date.now(),
      });
    });
  }

  getDepartment(id: string): FactoryDepartmentState | undefined {
    return this.departments.get(id);
  }

  getAllDepartments(): FactoryDepartmentState[] {
    return Array.from(this.departments.values());
  }

  /** 建造部门 */
  buildDepartment(id: string, config: DepartmentConfig, gold: number): { ok: boolean; msg: string } {
    const dept = this.departments.get(id);
    if (!dept) return { ok: false, msg: '部门不存在' };
    if (dept.built) return { ok: false, msg: '已建造' };
    if (gold < config.costGold) return { ok: false, msg: '金币不足！需要 ' + config.costGold + 'G' };
    dept.built = true;
    dept.level = 1;
    return { ok: true, msg: config.name + ' 建造完成！' };
  }

  /** 升级部门 */
  upgradeDepartment(id: string, config: DepartmentConfig, level: number, gold: number): { ok: boolean; msg: string } {
    const dept = this.departments.get(id);
    if (!dept || !dept.built) return { ok: false, msg: '部门未建造' };
    if (level >= 5) return { ok: false, msg: '已达最高等级' };
    const upgradeCost = config.costGold * level;
    if (gold < upgradeCost) return { ok: false, msg: '金币不足！需要 ' + upgradeCost + 'G' };
    dept.level = level + 1;
    return { ok: true, msg: config.name + ' 升级到 Lv.' + dept.level + '！' };
  }

  /** 雇佣工人 */
  hireWorker(id: string, config: WorkerConfig, gold: number): { ok: boolean; msg: string } {
    const dept = this.departments.get(id);
    if (!dept || !dept.built) return { ok: false, msg: '部门未建造' };
    if (gold < config.hireCost.gold) return { ok: false, msg: '金币不足！' };
    const maxWorkers = config.maxWorkersPerLevel[dept.level] ?? 1;
    if (dept.workerCount >= maxWorkers) return { ok: false, msg: '该等级最多 ' + maxWorkers + ' 名工人' };
    dept.workerCount++;
    return { ok: true, msg: '工人已雇佣！' };
  }

  /** 解雇工人 */
  fireWorker(id: string): { ok: boolean; msg: string } {
    const dept = this.departments.get(id);
    if (!dept) return { ok: false, msg: '部门不存在' };
    if (dept.workerCount <= 0) return { ok: false, msg: '没有工人' };
    dept.workerCount--;
    return { ok: true, msg: '已解雇一名工人' };
  }

  /** 尝试自动产出 */
  tryProduce(id: string, workerConfig: WorkerConfig): { produced: boolean; profit: number } {
    const dept = this.departments.get(id);
    if (!dept || !dept.built || dept.workerCount === 0) return { produced: false, profit: 0 };
    const now = Date.now();
    if (now - dept.lastProduceAt >= PRODUCER_INTERVAL_MS) {
      dept.lastProduceAt = now;
      const profit = Math.floor(dept.level * dept.workerCount * workerConfig.outputBonus);
      return { produced: true, profit };
    }
    return { produced: false, profit: 0 };
  }

  // ── 存档 ──
  getState(): FactoryDepartmentState[] {
    return Array.from(this.departments.values());
  }
  loadState(states: FactoryDepartmentState[]): void {
    this.departments.clear();
    states.forEach(s => this.departments.set(s.departmentId, s));
  }
}
