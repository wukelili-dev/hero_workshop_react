export interface DepartmentConfig {
  id: string;
  name: string;
  costGold: number;
  costResources: Record<string, number>;
  bonusFactor: number;
  desc: string;
  built?: boolean;
}

// 工厂建造费用
export const FACTORY_BUILD_COST: Record<string, number> = {
  "木材": 50,
  "铁矿": 30,
  "石头": 40,
  "皮革": 20,
};

// 工厂基础产出
export const FACTORY_BASE_INTERVAL_S = 300;   // 基准结算周期（5分钟）
export const FACTORY_BASE_PROFIT = 50;        // 基准每次利润（金币）

// 部门配置
export const DEPARTMENTS: DepartmentConfig[] = [
  {
    id: "basic",
    name: "基础车间",
    costGold: 0,
    costResources: {},
    bonusFactor: 1.0,
    desc: "工厂原始部门",
    built: true,      // 建造工厂时自带
  },
  {
    id: "craft",
    name: "加工车间",
    costGold: 200,
    costResources: { "木材": 30, "石头": 20 },
    bonusFactor: 0.3,
    desc: "利润 +30%",
  },
  {
    id: "logistics",
    name: "物流部门",
    costGold: 350,
    costResources: { "铁矿": 25, "皮革": 20 },
    bonusFactor: 0.4,
    desc: "利润 +40%",
  },
  {
    id: "research",
    name: "研发部门",
    costGold: 500,
    costResources: { "铁矿": 40, "石头": 30 },
    bonusFactor: 0.6,
    desc: "利润 +60%",
  },
  {
    id: "magic",
    name: "魔法工坊",
    costGold: 1000,
    costResources: { "石头": 50, "铁矿": 50, "皮革": 30 },
    bonusFactor: 1.0,
    desc: "利润 +100%（传说级）",
  },
];

// 工厂劳工
export const MAX_FACTORY_WORKERS = 5;
export const FACTORY_WORKER_COST_GOLD = 80;   // 每位劳工费用
export const FACTORY_WORKER_BONUS = 0.15;     // 每位劳工利润 +15%

// 获取部门 by id
export function getDeptById(deptId: string): DepartmentConfig | undefined {
  return DEPARTMENTS.find(d => d.id === deptId);
}

// 计算工厂总利润倍率
export function calcFactoryBonus(deptIds: string[], workerCount: number): number {
  let base = 1.0;
  for (const did of deptIds) {
    const dept = getDeptById(did);
    if (dept) {
      base += dept.bonusFactor;
    }
  }
  // 劳工加成
  base += workerCount * FACTORY_WORKER_BONUS;
  return base;
}

// 获取工厂利润（需要外部传入 interval_s）
export function getFactoryProfit(intervalS: number = FACTORY_BASE_INTERVAL_S): number {
  const ratio = intervalS / FACTORY_BASE_INTERVAL_S;
  return ratio;
}
