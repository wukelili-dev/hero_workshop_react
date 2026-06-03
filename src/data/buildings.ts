export interface WorkerConfig {
  hireCost: Record<string, number>;
  outputBonus: number;
  wage: number;
  wageInterval: number;
  maxWorkersPerLevel: Record<number, number>;
}

export interface BuildingConfig {
  name: string;
  baseInterval: number;
  baseOutput: number;
  buildCost: Record<string, number>;
  workerCost?: Record<string, number>;
}

export interface WonderConfig {
  name: string;
  description: string;
  buildCost: Record<string, number>;
}

// 建筑最大数量限制
export const MAX_BUILDING_COUNT = 3;

// 劳工配置
export const WORKER_CONFIG: WorkerConfig = {
  hireCost: { "金币": 50 },
  outputBonus: 0.5,
  wage: 5,
  wageInterval: 60,
  maxWorkersPerLevel: { 1: 2, 2: 4, 3: 6, 4: 8, 5: 10 },
};

// 建筑配置
export const BUILDING_CONFIGS: Record<string, BuildingConfig> = {
  "伐木场": { name: "伐木场", baseInterval: 3, baseOutput: 1, buildCost: { "金币": 10 } },
  "铁矿": { name: "铁矿", baseInterval: 5, baseOutput: 1, buildCost: { "木材": 10 } },
  "狩猎场": { name: "狩猎场", baseInterval: 4, baseOutput: 1, buildCost: { "木材": 10, "铁矿": 5 } },
  "采石场": { name: "采石场", baseInterval: 6, baseOutput: 1, buildCost: { "金币": 15, "木材": 20 } },
};

// 建筑产出资源映射
export const BUILDING_OUTPUTS: Record<string, string> = {
  "伐木场": "木材",
  "铁矿": "铁矿",
  "狩猎场": "皮革",
  "采石场": "石头",
};

// 奇观配置
export const WONDERS: Record<string, WonderConfig> = {
  "天空之城": {
    name: "天空之城",
    description: "传说中的浮空城市，象征着无上的荣耀",
    buildCost: { "金币": 10000, "木材": 5000, "铁矿": 3000, "石头": 2000, "皮革": 1000 },
  },
  "永恒熔炉": {
    name: "永恒熔炉",
    description: "永不熄灭的熔炉，工匠们的终极梦想",
    buildCost: { "金币": 8000, "木材": 3000, "铁矿": 5000, "石头": 3000 },
  },
  "生命之树": {
    name: "生命之树",
    description: "古老的神树，据说能带来好运",
    buildCost: { "金币": 6000, "木材": 6000, "铁矿": 2000, "石头": 2000, "皮革": 2000 },
  },
};

// 获取建筑配置
export function getBuildingConfig(name: string): BuildingConfig | undefined {
  return BUILDING_CONFIGS[name];
}

// 获取所有建筑名称
export function getAllBuildingNames(): string[] {
  return Object.keys(BUILDING_CONFIGS);
}

// 获取建筑产出资源
export function getBuildingOutputResource(name: string): string {
  return BUILDING_OUTPUTS[name] || "木材";
}

// 获取建筑建造成本
export function getBuildingCost(name: string): Record<string, number> {
  const config = BUILDING_CONFIGS[name];
  if (config) {
    return config.buildCost;
  }
  return {};
}

// 获取奇观配置
export function getWonderConfig(name: string): WonderConfig | undefined {
  return WONDERS[name];
}

// 获取所有奇观名称
export function getWonderNames(): string[] {
  return Object.keys(WONDERS);
}

// 计算建筑间隔（随等级降低）
export function getBuildingInterval(config: BuildingConfig, level: number): number {
  return Math.max(1, Math.floor(config.baseInterval * (1 - (level - 1) * 0.1)));
}

// 计算建筑产量（随等级和劳工数增加）
export function getBuildingOutput(config: BuildingConfig, level: number, workerCount: number = 0): number {
  const base = Math.floor(config.baseOutput * (1 + (level - 1) * 0.5));
  const bonus = 1 + (workerCount * WORKER_CONFIG.outputBonus);
  return Math.floor(base * bonus);
}

// 计算建筑升级成本
export function getUpgradeCost(level: number): Record<string, number> {
  const gold = Math.floor(20 * Math.pow(level, 1.5));
  const wood = Math.floor(15 * Math.pow(level, 1.3));
  return { "金币": gold, "木材": wood };
}

// 获取该等级下最大劳工数
export function getMaxWorkers(level: number): number {
  const maxWorkersMap = WORKER_CONFIG.maxWorkersPerLevel;
  const keys = Object.keys(maxWorkersMap).map(Number).sort((a, b) => b - a);
  for (const lvl of keys) {
    if (level >= lvl) {
      return maxWorkersMap[lvl];
    }
  }
  return maxWorkersMap[1];
}
