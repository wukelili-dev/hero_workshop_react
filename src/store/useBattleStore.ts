/**
 * useBattleStore — 手动战斗（C8 招式对决）的运行时状态
 *
 * 只做三件事：开局摆阵、按玩家选择推进一回合、结束时把收益交给 useGameStore 结算。
 * 战斗规则本身住 engine/Battle.ts，这里不掺任何数值。
 */
import { create } from 'zustand';
import type { Monster } from '../types';
import { createBattle, playerAct, type BattleAction, type BattleState } from '../engine/Battle';
import { useGameStore } from './useGameStore';

interface BattleStoreState {
  battle: BattleState | null;
  /** 开始一场手动战斗（已在战斗中则忽略） */
  start: (monster: Monster) => void;
  /** 出一个回合（普攻 / 武学 / 防御 / 逃跑） */
  act: (action: BattleAction) => void;
  /** 关闭结算面板 */
  close: () => void;
}

export const useBattleStore = create<BattleStoreState>((set, get) => ({
  battle: null,

  start: (monster) => {
    if (get().battle && !get().battle!.over) return;
    const hero = useGameStore.getState().hero;
    if (hero.hp <= 0) return;
    set({
      battle: createBattle(
        { hp: hero.hp, atk: hero.atk, def: hero.def, crit: hero.critRate },
        hero.team ?? [],
        monster,
      ),
    });
  },

  act: (action) => {
    const cur = get().battle;
    if (!cur || cur.over) return;
    const next = playerAct(cur, action);
    set({ battle: next });
    if (next.over) settle(next);
  },

  close: () => set({ battle: null }),
}));

/** 战斗收尾：逃跑不判死也不给奖励，其余走通用的战斗结算 */
function settle(state: BattleState): void {
  const game = useGameStore.getState();
  if (state.fled) {
    game.setHp(state.heroHp);
    game.addBattleLog(`脱离战斗，剩 ${state.heroHp} HP。`);
    return;
  }
  game.applyBattleOutcome(state.monster, {
    victory: state.victory,
    rewards: state.rewards,
    heroFinalHp: state.heroHp,
  });
}
