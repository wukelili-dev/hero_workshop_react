/**
 * useBattleStore — 手动战斗（C8 招式对决）的运行时状态
 *
 * 只做三件事：开局摆阵、按玩家选择推进一回合、结束时把收益交给 useGameStore 结算。
 * 战斗规则本身住 engine/Battle.ts，这里不掺任何数值。
 */
import { create } from 'zustand';
import type { Monster } from '../types';
import { createBattle, playerAct, type BattleAction, type BattleState } from '../engine/Battle';
import { isStunned } from '../engine/BattleCore';
import { useGameStore } from './useGameStore';
import { useInventoryStore } from './useInventoryStore';

interface BattleStoreState {
  battle: BattleState | null;
  /** 开始一场手动战斗（已在战斗中则忽略） */
  start: (monster: Monster) => void;
  /** 出一个回合（普攻 / 武学 / 防御 / 逃跑 / 蓄力 / 用药 / 队友指令） */
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

    // B4：战斗中用药要先真的从背包扣掉，否则就是无中生有的无限回血。
    // 两种情况不消耗：已被麻痹（这一手递不出去）、背包里没有这瓶药。
    if (action.kind === 'item') {
      if (isStunned(cur.hero)) return;
      const removed = useInventoryStore.getState().removeNovelty(action.itemId, 1);
      if (!removed) return;
    }

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
