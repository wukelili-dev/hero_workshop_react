import { GameEngine } from '../engine/GameEngine';

/**
 * 存档系统：封装 GameEngine 的序列化，
 * 提供 localStorage / JSON 文件导入导出，以及自动存档。
 */
export class SaveSystem {
  static readonly DEFAULT_KEY = "hero_workshop_save";
  static readonly AUTO_SAVE_MS = 5 * 60 * 1000; // 5分钟

  private static autoSaveTimer: number | null = null;

  // ═════════════════════════════════════
  // 基础存档 / 读档（localStorage）
  // ═════════════════════════════════════

  /** 存档到 localStorage */
  static save(engine: GameEngine, key: string = SaveSystem.DEFAULT_KEY): void {
    engine.saveToFile(key);
  }

  /** 从 localStorage 读档，返回是否成功 */
  static load(engine: GameEngine, key: string = SaveSystem.DEFAULT_KEY): boolean {
    return engine.loadFromFile(key);
  }

  /** 删除指定存档 */
  static delete(key: string = SaveSystem.DEFAULT_KEY): void {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error("删除存档失败:", e);
    }
  }

  /** 检查是否有存档 */
  static exists(key: string = SaveSystem.DEFAULT_KEY): boolean {
    try {
      return localStorage.getItem(key) !== null;
    } catch {
      return false;
    }
  }

  // ═════════════════════════════════════
  // JSON 文件导出 / 导入
  // ═════════════════════════════════════

  /** 导出存档为 JSON 文件并触发下载 */
  static exportSave(engine: GameEngine): void {
    const json = engine.save();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const dateStr = new Date().toISOString().slice(0, 10);
    a.download = `hero_workshop_save_${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /** 从上传的 JSON 文件读档（返回 Promise<boolean>） */
  static async importSave(engine: GameEngine, file: File): Promise<boolean> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const json = reader.result as string;
          const ok = engine.load(json);
          resolve(ok);
        } catch {
          resolve(false);
        }
      };
      reader.onerror = () => resolve(false);
      reader.readAsText(file);
    });
  }

  // ═════════════════════════════════════
  // 自动存档
  // ═════════════════════════════════════

  /** 启动自动存档（每5分钟） */
  static startAutoSave(engine: GameEngine, key?: string): void {
    SaveSystem.stopAutoSave();
    SaveSystem.autoSaveTimer = window.setInterval(() => {
      SaveSystem.save(engine, key);
      console.log("[SaveSystem] 自动存档完成");
    }, SaveSystem.AUTO_SAVE_MS);
  }

  /** 停止自动存档 */
  static stopAutoSave(): void {
    if (SaveSystem.autoSaveTimer !== null) {
      window.clearInterval(SaveSystem.autoSaveTimer);
      SaveSystem.autoSaveTimer = null;
    }
  }

  // ═════════════════════════════════════
  // 存档信息
  // ═════════════════════════════════════

  /** 获取存档信息（玩家等级/金币/时间） */
  static getSaveInfo(key: string = SaveSystem.DEFAULT_KEY): {
    level: number;
    gold: number;
    map: string;
    timestamp: number;
  } | null {
    try {
      const json = localStorage.getItem(key);
      if (!json) return null;
      const data = JSON.parse(json);
      return {
        level: data.player?.level ?? 1,
        gold: data.player?.gold ?? 0,
        map: data.current_map ?? "傲来国",
        timestamp: data._timestamp ?? 0,
      };
    } catch {
      return null;
    }
  }
}
