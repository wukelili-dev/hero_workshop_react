/**
 * OfflineReport — 离线结算
 * 用 localStorage 记录"上次在线时间"，回来时按挂机模型折算收益：
 * 战斗（仅当自动战斗开着）× 天数推进。
 */
import { DAY_MS } from '../data/constants';
import { MAPS } from '../data/maps';
import { useGameStore } from '../store/useGameStore';
import { executeBattle } from './Combat';
import { sum as sumEffect } from './ItemEffects';
import type { Monster } from '../types';

const SEEN_KEY = 'hero_workshop_last_seen';

/** 少于这个时长不算离线（避免刷新页面也弹结算） */
export const OFFLINE_MIN_MS = 3 * 60 * 1000;

/** 每天大约打几场（自动战斗节奏的估算值） */
const BATTLES_PER_DAY = 12;
const MAX_BATTLES = 3000;

/** 掉落物 → 资源 key */
const DROP_TO_RESOURCE: Record<string, string> = {
  皮革: 'hide', 铁矿: 'iron', 木材: 'wood', 石头: 'stone', 药草: 'herb',
};

export interface OfflineReport {
  ms: number;
  days: number;
  autoBattle: boolean;
  battles: number;
  exp: number;
  gold: number;
  materials: Record<string, number>;
  placeName: string;
  /** 只能打到"打不过的怪"时为 true（收益打折） */
  risky: boolean;
  claimed: boolean;
}

export function markSeen(at: number = Date.now()): void {
  try { localStorage.setItem(SEEN_KEY, String(at)); } catch { /* ignore */ }
}

function lastSeen(): number | null {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    const n = raw ? Number(raw) : NaN;
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

const avg = (list: Monster[], f: (m: Monster) => number): number =>
  list.length === 0 ? 0 : list.reduce((s, m) => s + f(m), 0) / list.length;

export function computeOffline(now: number = Date.now()): OfflineReport | null {
  const last = lastSeen();
  if (last === null) return null;
  const ms = now - last;
  if (ms < OFFLINE_MIN_MS) return null;

  const game = useGameStore.getState();
  const hero = game.hero;
  const map = MAPS.find((m) => m.id === game.currentMapId);
  const monsters = map && !map.isCity ? map.monsters : [];
  const days = ms / DAY_MS;

  const beatable = monsters.filter(
    (m) => executeBattle({ hp: hero.maxHp, atk: hero.atk, def: hero.def, crit: hero.critRate }, [], m).victory
  );
  const pool = beatable.length > 0 ? beatable : monsters;
  const risky = beatable.length === 0 && monsters.length > 0;
  const factor = risky ? 0.4 : 1;

  const autoBattle = game.autoBattle;
  const battles = autoBattle ? Math.min(Math.round(days * BATTLES_PER_DAY), MAX_BATTLES) : 0;
  const exp = Math.round(avg(pool, (m) => m.expReward) * battles * factor);
  const gold = Math.round(avg(pool, (m) => m.goldReward) * battles * factor);

  const materials: Record<string, number> = {};
  pool.forEach((m) => {
    m.drops.forEach((d) => {
      const key = DROP_TO_RESOURCE[d.itemId] ?? d.itemId;
      const qty = (d.quantity[0] + d.quantity[1]) / 2;
      const gain = qty * d.chance * 0.35 * (battles / Math.max(1, pool.length));
      materials[key] = (materials[key] ?? 0) + gain;
    });
  });
  // 词条：寻宝（gatherBonus）同样作用于离线收获，避免"离线绕过词条"
  const gatherBonus = sumEffect('gatherBonus');
  Object.keys(materials).forEach((k) => { materials[k] = Math.floor(materials[k] * (1 + gatherBonus)); });

  return { ms, days, autoBattle, battles, exp, gold, materials, placeName: map?.name ?? '此地', risky, claimed: false };
}

/** 领取离线收益 */
export function claimOffline(r: OfflineReport): void {
  const game = useGameStore.getState();
  // 词条：慈悲（每日善值）/ 嗜杀（每杀恶值）在离线结算时同样生效
  const moralPerDay = sumEffect('moralPerDay');
  const moralPerKill = sumEffect('moralPerKill');
  if (moralPerDay !== 0 && r.days >= 1) game.changeMoral(Math.round(moralPerDay * Math.floor(r.days)));
  if (moralPerKill !== 0 && r.battles > 0) game.changeMoral(-Math.round(moralPerKill * r.battles));
  if (r.exp > 0) game.addExp(r.exp);
  if (r.gold > 0) game.addGold(r.gold);
  Object.entries(r.materials).forEach(([k, v]) => { if (v > 0) game.addResource(k, v); });
  const matText = Object.entries(r.materials).filter(([, v]) => v > 0).map(([k, v]) => `${k}×${v}`).join(' ');
  game.addGameLog(
    `离线 ${Math.max(1, Math.floor(r.days))} 天：${r.battles} 场战斗，+${r.exp} 经验、+${r.gold} 金币${matText ? `、${matText}` : ''}`
  );
}

/** 毫秒 → "X 天 Y 时辰" */
export function formatOffline(ms: number): string {
  const days = Math.floor(ms / DAY_MS);
  const hours = Math.floor((ms % DAY_MS) / (DAY_MS / 12));
  if (days > 0) return `${days} 天 ${hours} 时辰`;
  return `${Math.max(1, Math.round(ms / 60000))} 分钟`;
}
