// @ts-nocheck — legacy engine
// 队伍 + 酒馆系统
import type { HeroState } from './Hero';
import {
  generateTavernRoster,
  calcRecruitCost,
  type TavernRecruit,
  type EquipmentItem,
} from '../data/tavern';

// 队伍成员状态
export interface TeamMember {
  roleName: string;
  level: number;
  maxHp: number;
  hp: number;
  atk: number;
  def: number;
  isElite: boolean;
}

export interface TeamState {
  members: TeamMember[];
  currentIdx: number;
  tavernRoster: TavernRecruit[];
  tavernLastRefresh: number; // Date.now()
}

export class Team {
  private state: TeamState;

  constructor(playerName: string, playerLevel: number) {
    this.state = {
      members: [{ roleName: playerName, level: playerLevel, maxHp: 100, hp: 100, atk: 10, def: 5, isElite: false }],
      currentIdx: 0,
      tavernRoster: generateTavernRoster(playerLevel),
      tavernLastRefresh: Date.now(),
    };
  }

  // ── 队伍操作 ──

  getTeam(): TeamMember[] {
    return [...this.state.members];
  }

  getCurrentMember(): TeamMember {
    return this.state.members[this.state.currentIdx];
  }

  switchMember(idx: number): { ok: boolean; msg: string } {
    if (idx < 0 || idx >= this.state.members.length) {
      return { ok: false, msg: '无效成员' };
    }
    this.state.currentIdx = idx;
    return { ok: true, msg: '已切换到 ' + this.state.members[idx].roleName };
  }

  // ── 酒馆操作 ──

  getTavernRoster(): TavernRecruit[] {
    return [...this.state.tavernRoster];
  }

  /** 尝试自动刷新酒馆（每小时一次） */
  tryRefreshTavern(playerLevel: number): boolean {
    const now = Date.now();
    const interval = 60 * 60 * 1000; // 1小时
    if (now - this.state.tavernLastRefresh >= interval) {
      this.state.tavernRoster = generateTavernRoster(playerLevel);
      this.state.tavernLastRefresh = now;
      return true;
    }
    return false;
  }

  /** 手动刷新酒馆（免费，每分钟最多1次） */
  manualRefreshTavern(playerLevel: number): { ok: boolean; msg: string } {
    const now = Date.now();
    const minInterval = 60 * 1000; // 1分钟冷却
    if (now - this.state.tavernLastRefresh < minInterval) {
      return { ok: false, msg: '刷新太频繁，请稍后再试' };
    }
    this.state.tavernRoster = generateTavernRoster(playerLevel);
    this.state.tavernLastRefresh = now;
    return { ok: true, msg: '酒馆已刷新' };
  }

  /** 招募队友 */
  recruitMember(idx: number, gold: number, onRecruit: (gear: EquipmentItem[]) => void): { ok: boolean; msg: string } {
    if (this.state.members.length >= 3) {
      return { ok: false, msg: '队伍已满！最多3人' };
    }
    if (idx < 0 || idx >= this.state.tavernRoster.length) {
      return { ok: false, msg: '无效角色' };
    }
    const recruit = this.state.tavernRoster[idx];
    if (gold < recruit.cost) {
      return { ok: false, msg: '金币不足！需要 ' + recruit.cost + 'G' };
    }

    const newMember: TeamMember = {
      roleName: recruit.roleName,
      level: recruit.level,
      maxHp: Math.floor(80 + recruit.level * 18),
      hp: Math.floor(80 + recruit.level * 18),
      atk: Math.floor(5 + recruit.level * 2),
      def: Math.floor(2 + recruit.level),
      isElite: recruit.isElite,
    };

    this.state.members.push(newMember);
    if (recruit.gear.length > 0) {
      onRecruit(recruit.gear);
    }

    // 从酒馆移除（替换）
    this.state.tavernRoster[idx] = generateTavernRoster(this.state.members[0].level)[0];

    return { ok: true, msg: '招募成功！' + recruit.roleName + ' 加入队伍！' };
  }

  /** 踢出队友（index 0 是主角，不能踢） */
  kickMember(idx: number): { ok: boolean; msg: string } {
    if (idx === 0) return { ok: false, msg: '不能踢出主角！' };
    if (idx < 0 || idx >= this.state.members.length) {
      return { ok: false, msg: '无效成员' };
    }
    const name = this.state.members[idx].roleName;
    this.state.members.splice(idx, 1);
    if (this.state.currentIdx >= this.state.members.length) {
      this.state.currentIdx = this.state.members.length - 1;
    }
    return { ok: true, msg: name + ' 已离队' };
  }

  // ── 存档 ──

  getState(): TeamState {
    return JSON.parse(JSON.stringify(this.state));
  }

  loadState(state: TeamState): void {
    this.state = state;
  }
}
