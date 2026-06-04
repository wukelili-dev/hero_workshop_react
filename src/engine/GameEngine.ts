// @ts-nocheck — legacy engine, references non-existent modules/types
import { Hero, PlantState, RecruitRole, FarmSlotState } from '../types';
import { FarmSystem } from '../systems/FarmSystem';
import { RanchManager } from './RanchSystem';
import { BuildingSystem } from './BuildingSystem';
import { FactorySystem } from './FactorySystem';
import { CombatSystem } from './Combat';
import { TeamManager } from './Team';
import { TavernManager } from './Tavern';
import { CodexManager } from './Codex';
import { EquipmentSystem } from './EquipmentSystem';
import { ForgeSystem } from './ForgeSystem';
import { DropSystem } from './DropSystem';
import { PassivesSystem } from './Passives';
import { EconomySystem } from './Economy';

// 游戏引擎：持有全部状态 + tick循环 + 存档
export class GameEngine {
  // ── 核心状态 ──
  resources: Record<string, number>;
  buildings: Record<string, number>;
  buildingLevels: Record<string, number[]>;
  buildingWorkers: Record<string, number[]>;
  player: Hero;
  currentMap: string;
  unlockedMaps: Set<string>;
  currentEnemyIdx: number;
  currentEnemy: any | null;
  currentEnemyIsBoss: boolean;
  isBattling: boolean;
  autoBattle: boolean;
  autoPotionThreshold: number; // 0=关, 30/50/80
  running: boolean;
  logs: string[];
  battleLogs: string[];
  productionActive: Set<string>;
  wonders: Set<string>;

  // ── 队伍系统 ──
  team: Hero[];
  currentMemberIdx: number;

  // ── 酒馆系统 ──
  tavernRoster: RecruitRole[];
  tavernLastRefresh: number;

  // ── 农场 ──
  plants: PlantState[];
  mutatedPlants: Record<string, boolean>;
  farmSystem: FarmSystem;

  // ── 工厂 ──
  factory: { built: boolean } | null;
  factoryDepartments: string[];
  factoryWorkers: number;
  factoryLastProfitTime: number;

  // ── 图鉴 ──
  codex: CodexManager;

  // ── 牧场 ──
  ranch: RanchManager;

  // ── 背包 ──
  feedBag: Record<string, number>;
  fertilizerBag: Record<string, number>;

  // ── 子系统引用 ──
  buildingSystem: BuildingSystem;
  factorySystem: FactorySystem;
  combatSystem: CombatSystem;
  teamManager: TeamManager;
  tavernManager: TavernManager;
  equipmentSystem: EquipmentSystem;
  forgeSystem: ForgeSystem;
  dropSystem: DropSystem;
  passivesSystem: PassivesSystem;
  economySystem: EconomySystem;

  private tickTimer: number | null = null;
  private tickIntervalMs: number = 1000; // 1秒tick

  constructor() {
    // 初始化全部状态
    this.resources = { "木材": 0, "铁矿": 0, "皮革": 0, "石头": 0 };
    this.buildings = {};
    this.buildingLevels = {};
    this.buildingWorkers = {};
    this.player = new Hero();
    this.currentMap = "傲来国";
    this.unlockedMaps = new Set(["傲来国"]);
    this.currentEnemyIdx = 0;
    this.currentEnemy = null;
    this.currentEnemyIsBoss = false;
    this.isBattling = false;
    this.autoBattle = false;
    this.autoPotionThreshold = 0;
    this.running = true;
    this.logs = [];
    this.battleLogs = [];
    this.productionActive = new Set();
    this.wonders = new Set();

    this.team = [this.player];
    this.currentMemberIdx = 0;

    this.tavernRoster = [];
    this.tavernLastRefresh = Date.now();

    this.plants = [];
    this.mutatedPlants = {};
    this.farmSystem = new FarmSystem();

    this.factory = null;
    this.factoryDepartments = [];
    this.factoryWorkers = 0;
    this.factoryLastProfitTime = 0;

    this.codex = new CodexManager();
    this.ranch = new RanchManager();

    this.feedBag = {};
    this.fertilizerBag = {};

    // 初始化子系统
    this.buildingSystem = new BuildingSystem(this);
    this.factorySystem = new FactorySystem(this);
    this.combatSystem = new CombatSystem(this);
    this.teamManager = new TeamManager(this);
    this.tavernManager = new TavernManager(this);
    this.equipmentSystem = new EquipmentSystem(this);
    this.forgeSystem = new ForgeSystem(this);
    this.dropSystem = new DropSystem(this);
    this.passivesSystem = new PassivesSystem(this);
    this.economySystem = new EconomySystem(this);

    this.startGameLoop();
  }

  // ══════════════════════════════════════
  // 游戏主循环
  // ══════════════════════════════════════

  startGameLoop(): void {
    if (this.tickTimer !== null) return;
    this.tickTimer = window.setInterval(() => this.tick(), this.tickIntervalMs);
  }

  stopGameLoop(): void {
    if (this.tickTimer !== null) {
      window.clearInterval(this.tickTimer);
      this.tickTimer = null;
    }
    this.running = false;
  }

  tick(): void {
    if (!this.running) return;
    const now = Date.now();

    // 农场系统tick
    this.farmSystem.tick(this);

    // 牧场系统tick
    this.ranch.tick(this);

    // 建筑生产tick
    this.buildingSystem.tick(this);

    // 工厂结算tick
    this.factorySystem.tick(this);

    // 自动战斗tick
    if (this.autoBattle && !this.isBattling) {
      this.combatSystem.autoBattleTick(this);
    }

    // 工资扣除tick（每60秒检查）
    this.economySystem.tickWages(this);
  }

  // ══════════════════════════════════════
  // 日志
  // ══════════════════════════════════════

  addLog(msg: string): void {
    const now = new Date();
    const ts = now.toTimeString().slice(0, 8);
    this.logs.push(`[${ts}] ${msg}`);
    if (this.logs.length > 100) this.logs.shift();
  }

  addBattleLog(msg: string): void {
    const now = new Date();
    const ts = now.toTimeString().slice(0, 8);
    this.battleLogs.push(`[${ts}] ${msg}`);
    if (this.battleLogs.length > 100) this.battleLogs.shift();
  }

  // ══════════════════════════════════════
  // 地图管理
  // ══════════════════════════════════════

  unlockMap(mapName: string, unlockCost: number): boolean {
    if (this.unlockedMaps.has(mapName)) return false;
    if (this.player.gold < unlockCost) return false;
    this.player.gold -= unlockCost;
    this.unlockedMaps.add(mapName);
    this.addLog(`🗺️ 解锁地图: ${mapName}`);
    return true;
  }

  switchMap(mapName: string): boolean {
    if (!this.unlockedMaps.has(mapName)) return false;
    this.currentMap = mapName;
    this.currentEnemyIdx = 0;
    this.addLog(`🗺️ 切换地图: ${mapName}`);
    return true;
  }

  // ══════════════════════════════════════
  // 序列化 / 存档
  // ══════════════════════════════════════

  toDict(): Record<string, any> {
    return {
      resources: this.resources,
      buildings: this.buildings,
      building_levels: this.buildingLevels,
      building_workers: this.buildingWorkers,
      player: this.player.toDict(),
      current_map: this.currentMap,
      unlocked_maps: Array.from(this.unlockedMaps),
      current_enemy_idx: this.currentEnemyIdx,
      wonders: Array.from(this.wonders),
      plants: this.plants,
      factory: this.factory,
      factory_departments: this.factoryDepartments,
      factory_workers: this.factoryWorkers,
      factory_last_profit_time: this.factoryLastProfitTime,
      auto_potion_threshold: this.autoPotionThreshold,
      team: this.teamToDict(),
      tavern: this.tavernToDict(),
      codex: this.codex.toDict(),
      ranch: this.ranch.toDict(),
      current_member_idx: this.currentMemberIdx,
      mutated_plants: this.mutatedPlants,
      feed_bag: this.feedBag,
      fertilizer_bag: this.fertilizerBag,
      battle_logs: this.battleLogs,
    };
  }

  fromDict(data: Record<string, any>): void {
    this.resources = data.resources ?? {};
    this.buildings = data.buildings ?? {};
    this.buildingLevels = data.building_levels ?? {};
    this.buildingWorkers = data.building_workers ?? {};
    this.player.fromDict(data.player ?? {});
    this.currentMap = data.current_map ?? "傲来国";
    this.unlockedMaps = new Set(data.unlocked_maps ?? ["傲来国"]);
    this.currentEnemyIdx = data.current_enemy_idx ?? 0;
    this.wonders = new Set(data.wonders ?? []);
    this.plants = data.plants ?? [];
    this.factory = data.factory ?? null;
    this.factoryDepartments = data.factory_departments ?? [];
    this.factoryWorkers = data.factory_workers ?? 0;
    this.factoryLastProfitTime = data.factory_last_profit_time ?? 0;
    this.autoPotionThreshold = data.auto_potion_threshold ?? 0;
    this.teamFromDict(data.team ?? []);
    this.tavernFromDict(data.tavern ?? {});
    this.codex.fromDict(data.codex ?? {});
    this.ranch.fromDict(data.ranch ?? {});
    this.currentMemberIdx = data.current_member_idx ?? 0;
    this.mutatedPlants = data.mutated_plants ?? {};
    this.feedBag = data.feed_bag ?? {};
    this.fertilizerBag = data.fertilizer_bag ?? {};
    this.battleLogs = data.battle_logs ?? [];
  }

  save(): string {
    return JSON.stringify(this.toDict());
  }

  load(json: string): boolean {
    try {
      const data = JSON.parse(json);
      this.fromDict(data);
      return true;
    } catch (e) {
      console.error("读档失败:", e);
      return false;
    }
  }

  saveToFile(key: string = "hero_workshop_save"): void {
    try {
      localStorage.setItem(key, this.save());
    } catch (e) {
      console.error("localStorage 存档失败:", e);
    }
  }

  loadFromFile(key: string = "hero_workshop_save"): boolean {
    try {
      const json = localStorage.getItem(key);
      if (!json) return false;
      return this.load(json);
    } catch (e) {
      console.error("localStorage 读档失败:", e);
      return false;
    }
  }

  // ══════════════════════════════════════
  // 队伍序列化辅助
  // ══════════════════════════════════════

  teamToDict(): any[] {
    return this.team.map(h => h.toDict());
  }

  teamFromDict(data: any[]): void {
    if (!data || data.length === 0) {
      this.team = [this.player];
      return;
    }
    this.team = data.map(d => {
      const h = new Hero();
      h.fromDict(d);
      return h;
    });
    // 确保 player 是 team[0]
    this.player = this.team[0];
  }

  tavernToDict(): Record<string, any> {
    return {
      roster: this.tavernRoster,
      last_refresh: this.tavernLastRefresh,
    };
  }

  tavernFromDict(data: Record<string, any>): void {
    this.tavernRoster = data.roster ?? [];
    this.tavernLastRefresh = data.last_refresh ?? Date.now();
  }

  // ══════════════════════════════════════
  // 销毁
  // ══════════════════════════════════════

  destroy(): void {
    this.stopGameLoop();
  }
}
