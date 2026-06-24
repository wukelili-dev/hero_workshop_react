/**
 * NpcSystem — NPC 交互逻辑
 * 交易/挑战/对话/送礼/偷窃 返回 action 结果
 */
import type { NpcDefinition, NpcPersonalItem } from '../types';
import { useGameStore } from '../store/useGameStore';
import { useNpcStore } from '../store/useNpcStore';
import { useInventoryStore } from '../store/useInventoryStore';
import { randomGreeting, randomDialogue, NPCS } from '../data/npcs';

// ── 偷窃结果类型 ──
export interface StealResult {
  success: boolean;
  item: NpcPersonalItem | null;
  goldBonus: number;
  stealRate: number;
}

type ActionResult =
  | { type: 'log'; message: string }
  | { type: 'trade'; items: { label: string; price: number; action: () => boolean }[] }
  | { type: 'battle_result'; victory: boolean; message: string; exp: number; gold: number };

const STEAL_FAIL_DAMAGE = 0; // 失败不再扣血，直接进战斗

/** 根据当前善恶值选择合适的道德对话 */
function _getMoralDialogue(npc: NpcDefinition): string | null {
  const morals = npc.moralDialogues;
  if (!morals) return null;
  const moralValue = useGameStore.getState().hero.moralValue;
  let kind: 'good' | 'neutral' | 'evil';
  if (moralValue >= 50) kind = 'good';
  else if (moralValue <= -50) kind = 'evil';
  else kind = 'neutral';
  const list = morals[kind];
  if (!list || list.length === 0) return null;
  return list[Math.floor(Math.random() * list.length)];
}

/** 根据 NPC id 前缀或特征推断阵营 */
function _npcFaction(npc: NpcDefinition): 'human' | 'demon' | 'divine' {
  if (npc.id.startsWith('yaozu_')) return 'demon';
  if (npc.id.startsWith('xianzu_')) return 'divine';
  // 按已知 NPC id 手动映射
  const map: Record<string, 'human' | 'demon' | 'divine'> = {
    'donghai_aoguang': 'divine',
    'huaguo_tongbei': 'demon',
    'huaguo_liuermihou': 'demon',
    'wanshou_zhenyuan': 'divine',
    'diyu_cuijue': 'divine',
    'gaolao_gaotaigong': 'human',
    'wuzhuangguan_qingfeng': 'divine',
    'changan_guanyin': 'divine',
    'tianting_nezha': 'divine',
    'tianting_taibai': 'divine',
    'difu_yanluo': 'divine',
    'lishan_laomu': 'divine',
    'erlang_erlangshen': 'divine',
    'pangu': 'divine',
    'taishang_laojun': 'divine',
  };
  return map[npc.id] ?? 'human';
}

const GIFT_REWARDS: Record<string, { minGold: number; returnGold: number; item: string; dialogue: string }> = {
  '*': { minGold: 50, returnGold: 0, item: '', dialogue: '无功不受禄——不过既然你诚心，这个你拿着！' },
  changan_fortune: { minGold: 200, returnGold: 0, item: '灵符×1', dialogue: '贫道观你印堂发紫，近日必有机缘。这枚灵符你贴身收好，能挡一劫。' },
  donghai_dragon_king: { minGold: 500, returnGold: 0, item: '定海珠×1', dialogue: '一个凡人进到龙宫送礼……倒是有趣。这粒定海珠给你把玩。' },
  difu_judge: { minGold: 300, returnGold: 0, item: '生死簿残页×1', dialogue: '地府八百年来，你是第二个给判官送礼的活人。第一个是只猴子。这页东西你留着。' },
};

/** 玩家主动「打招呼」 */
export function greetNpc(npc: NpcDefinition): ActionResult {
  const store = useNpcStore.getState();
  const inst = store.getInstance(npc.id);

  // 善恶对话优先
  const moralLine = _getMoralDialogue(npc);

  if (!inst?.greeted) {
    store.markGreeted(npc.id);
    store.recordInteraction(npc.id);
    const line = moralLine ?? randomGreeting(npc);
    return { type: 'log', message: `【${npc.title}】${npc.name}：「${line}」` };
  }

  store.recordInteraction(npc.id);

  // 记录袁守城对话次数
  if (npc.id === 'changan_fortune') {
    const key = 'yuanshou_talks';
    const cur = parseInt(useNpcStore.getState().explorationFlags[key] as any || '0', 10);
    useNpcStore.getState().setExplorationFlag(key);
    (useNpcStore.getState().explorationFlags as any)[key] = String(cur + 1);
  }
  // 观音随机事件
  const guanyinResult = tryTriggerGuanyin(npc.location, npc.id);
  if (guanyinResult) return guanyinResult;

  const line = moralLine ?? randomDialogue(npc);
  return { type: 'log', message: `【${npc.title}】${npc.name}：「${line}」` };
}

/** 根据 unlockCondition 判断 NPC 是否已解锁 */
export function isNpcUnlocked(npc: NpcDefinition): boolean {
  const cond = npc.unlockCondition;
  if (!cond) return true;
  const state = useGameStore.getState();
  const npcStore = useNpcStore.getState();
  let curVal = 0;
  switch (cond.kind) {
    case 'level': curVal = state.hero.level; break;
    case 'gold': curVal = state.hero.gold; break;
    case 'moralValue': curVal = state.hero.moralValue; break;
    case 'mapBattles': curVal = state.mapBattles?.[cond.compare] ?? 0; break; // compare field holds mapId for this kind
    case 'defeatedNpc': curVal = npcStore.instances[cond.compare]?.defeatedCount ?? 0; break;
    case 'faction': {
      const f = state.hero.factions?.human ?? 50;
      if (cond.compare === 'demon') curVal = state.hero.factions?.demon ?? 50;
      else if (cond.compare === 'divine') curVal = state.hero.factions?.divine ?? 50;
      else curVal = f;
      break;
    }
    case 'explorationFlag': curVal = npcStore.explorationFlags[cond.compare] ? 1 : 0; break;
    default: return true;
  }
  return curVal >= cond.value;
}

/** 玩家「交谈」 */
export function chatNpc(npc: NpcDefinition): ActionResult {
  useNpcStore.getState().recordInteraction(npc.id);

  // 记录袁守城对话次数（仅用于解锁魏征）
  if (npc.id === 'changan_fortune') {
    const key = 'yuanshou_talks';
    const cur = parseInt(useNpcStore.getState().explorationFlags[key] as any || '0', 10);
    useNpcStore.getState().setExplorationFlag(key);
    (useNpcStore.getState().explorationFlags as any)[key] = String(cur + 1);

    const dialogues = [
      '"你可知那泾河龙王为何被斩？"袁守城悠然道，"他与我打赌降雨时辰，私自改了玉帝旨意上的雨量——这便是欺天。魏征梦里斩龙，那天长安城上空乌云三日不散。"',
      '"唐王被龙王魂魄纠缠，一病不起。魏征修书一封，交与唐王带至阴间，其友崔珏乃酆都判官。崔珏阅后，私自添了二十年阳寿。唐王还阳后大开水陆大会——这便是玄奘法师西行的由头了。"',
      '"说来可笑：若无渔夫与樵夫那盘棋，便无人寻在下算卦；若无在下算卦，便无龙王打赌违天条；若无龙王违天条，便无魏征斩龙；若无斩龙，便无唐王入冥；若无唐王入冥还阳，便无水陆大会；若无水陆大会——便无西天取经。一局棋，引出一部经。"',
    ];
    const talked = dialogues.some(d => d.includes('魏征'));
    if (talked) {
      const f = useNpcStore.getState().explorationFlags;
      if (!f['weizheng_unlocked']) {
        useNpcStore.getState().setExplorationFlag('weizheng_unlocked');
        (f as any)['weizheng_unlocked'] = '1';
        useGameStore.getState().addGameLog(
          '\n✨ 袁守城捋须叹道：「既然你已听过斩龙之事……魏征丞相便不得不提了。他是大唐丞相，也是那梦里斩龙的人。你若有兴趣，不妨去会会他。」'
        );
      }
    }
  }
  // 观音随机事件
  const guanyinResult = tryTriggerGuanyin(npc.location, npc.id);
  if (guanyinResult) return guanyinResult;

  // 唐王剧情链：对话≥5次后解锁玄奘（水陆大会）
  if (npc.id === 'changan_tangwang') {
    const key = 'tangwang_talks';
    const cur = parseInt(useNpcStore.getState().explorationFlags[key] as any || '0', 10);
    useNpcStore.getState().setExplorationFlag(key);
    (useNpcStore.getState().explorationFlags as any)[key] = String(cur + 1);
    if (cur + 1 >= 5 && !useNpcStore.getState().explorationFlags['xuanzang_unlocked']) {
      useNpcStore.getState().setExplorationFlag('xuanzang_unlocked');
      (useNpcStore.getState().explorationFlags as any)['xuanzang_unlocked'] = '1';
      useGameStore.getState().addGameLog(
        '\n🪷 唐王拍掌笑道：「先生与朕谈得投机，不妨去水陆大会走一遭——玄奘法师正在城门讲经，你与他有缘。」\n【玄奘现身长安！】'
      );
    }
  }

  // ── 对话彩蛋：敖广 ↔ 崔珏 串联 ──
  const crossLine = _checkCrossNpcDialogue(npc.id);
  if (crossLine) return crossLine;

  // 善恶对话优先
  const moralLine = _getMoralDialogue(npc);
  const line = moralLine ?? randomDialogue(npc);
  return { type: 'log', message: `【${npc.title}】${npc.name}：「${line}」` };
}

/** 玩家「查看」NPC */
export function inspectNpc(npc: NpcDefinition): ActionResult {
  useNpcStore.getState().recordInteraction(npc.id);
  const stats = npc.challengeStats;
  const statsText = stats
    ? `（HP ${stats.hp} / ATK ${stats.atk} / DEF ${stats.def}）`
    : '';
  return { type: 'log', message: `你打量着${npc.name}。${statsText}\n${npc.description}` };
}

/** 玩家购买物品 */
export function buyNpcTradeItem(npc: NpcDefinition, itemIdx: number): ActionResult {
  const item = npc.tradeItems?.[itemIdx];
  if (!item) return { type: 'log', message: '无可购买之物。' };

  const state = useGameStore.getState();
  const price = item.price;
  if (state.hero.gold < price) {
    return { type: 'log', message: '你囊中羞涩，只好作罢。' };
  }

  state.addGold(-price);
  const dialogue = item.dialogue ?? '一手交钱一手交货。';

  if (item.type === 'potion') {
    const count = item.potionCount ?? 1;
    state.setHero({ potions: (state.hero.potions ?? 0) + count });
    state.addGameLog(`从${npc.name}处购得 ${item.label}，花费 ${price} 金币`);
    return { type: 'log', message: `【${npc.title}】${npc.name}：「${dialogue}」` };
  }

  if (item.type === 'material' && item.resourceKey) {
    state.addResource(item.resourceKey, 10);
    state.addGameLog(`从${npc.name}处购得 ${item.label}，花费 ${price} 金币`);
    return { type: 'log', message: `【${npc.title}】${npc.name}：「${dialogue}」` };
  }

  state.addGameLog(`从${npc.name}处购得 ${item.label}，花费 ${price} 金币`);
  return { type: 'log', message: `【${npc.title}】${npc.name}：「${dialogue}」` };
}

/** 玩家挑战 */
export function challengeNpc(npc: NpcDefinition): ActionResult {
  const stats = npc.challengeStats;
  if (!stats) return { type: 'log', message: `${npc.name}没有要与你动手的意思。` };
  if (!npc.challengeReward) return { type: 'log', message: `${npc.name}摇了摇头。` };

  const state = useGameStore.getState();
  const hero = state.hero;

  const heroEffectiveAtk = Math.max(1, hero.atk - stats.def / 2);
  const npcEffectiveAtk = Math.max(1, stats.atk - hero.def / 2);

  const heroRounds = Math.ceil(stats.hp / heroEffectiveAtk);
  const npcRounds = Math.ceil(hero.hp / npcEffectiveAtk);

  const victory = heroRounds <= npcRounds;

  if (victory) {
    const npcStore = useNpcStore.getState();
    const inst = npcStore.getInstance(npc.id);
    const isFirstDefeat = !inst || inst.defeatedCount === 0;

    npcStore.setDefeated(npc.id);
    state.addGold(npc.challengeReward.gold);
    state.addExp(npc.challengeReward.exp);

    // 善恶值变化
    const faction = _npcFaction(npc);
    const moralDelta = faction === 'human' ? -20 : faction === 'demon' ? 10 : -5;
    const moralLabel = faction === 'human' ? '击败人族' : faction === 'demon' ? '击败妖族' : '击败仙族';
    state.changeMoral(moralDelta);
    const moralSign = moralDelta >= 0 ? '+' : '';

    let msg = npc.challengeReward.message;

    // 首次击败名角 NPC → 掉落专属神装
    if (isFirstDefeat && npc.uniqueDrop) {
      const inv = useInventoryStore.getState();
      inv.addEquipment(npc.uniqueDrop.equipment);
      msg += `\n\n【传说】${npc.uniqueDrop.message}\n 获得神兵：【${npc.uniqueDrop.equipment.name}】！`;
      state.addGameLog(`\n⚡首次击败【${npc.name}】！获得隐藏神装【${npc.uniqueDrop.equipment.name}】⚡`);
    }

    // 魏征剧情链：与魏征对话一次后解锁唐王
    if (npc.id === 'changan_weizheng') {
      const f = useNpcStore.getState().explorationFlags;
      if (!f['tangwang_unlocked']) {
        useNpcStore.getState().setExplorationFlag('tangwang_unlocked');
        (f as any)['tangwang_unlocked'] = '1';
        useGameStore.getState().addGameLog(
          '\n👑 魏征忽然住了口，神色复杂：「你……竟能听进这些话。唐王病了多日，日夜被泾河龙王的魂魄纠缠。你若愿见唐王一面，便去宫中吧。」\n【唐太宗现身长安！】'
        );
      }
    }

    state.addGameLog(`挑战${npc.name}胜利！${msg}\n 获得 ${npc.challengeReward.exp} 经验，${npc.challengeReward.gold} 金币`);
    return { type: 'battle_result', victory: true, message: msg, exp: npc.challengeReward.exp, gold: npc.challengeReward.gold };
  } else {
    state.setHero({ hp: Math.max(0, hero.hp - npcRounds)});
    state.addGameLog(`你被${npc.name}击败了……修养一番再来吧。`);
    return { type: 'battle_result', victory: false, message: '你被击败了……修养一番再来吧。', exp: 0, gold: 0 };
  }
}

/** 玩家送礼 */
export function giftNpc(npc: NpcDefinition): ActionResult {
  const state = useGameStore.getState();
  const hero = state.hero;
  const npcId = npc.id;

  // 查找匹配的送礼规则
  let rule = GIFT_REWARDS[npcId] ?? GIFT_REWARDS['*'];
  if (!rule) return { type: 'log', message: '对方婉拒了你的好意。' };

  if (hero.gold < rule.minGold) {
    return { type: 'log', message: `你摸了摸口袋——没有 ${rule.minGold} 金，这点小钱拿不出手。` };
  }

  state.addGold(-rule.minGold);
  if (rule.returnGold > 0) state.addGold(rule.returnGold);
  if (rule.item) state.addGameLog(`收到 ${rule.item}`);

  const line = rule.dialogue;
  useNpcStore.getState().recordInteraction(npc.id);
  const extra = rule.item ? `\n（获得 ${rule.item}）` : '';
  return { type: 'log', message: `你恭敬地奉上 ${rule.minGold} 两银子。\n【${npc.title}】${npc.name}：「${line}」${extra}` };
}

/** 玩家偷窃 — 重构：偷随身物品，极低成功率，善恶值联动 */
export function stealNpc(
  npc: NpcDefinition,
  onBattle?: (npc: NpcDefinition) => void,
): StealResult {
  const state = useGameStore.getState();
  const hero = state.hero;

  // 1. 成功率计算（仅基于等级，无 dex 字段）
  const stealRate = Math.min(
    0.05 + hero.level * 0.008,
    0.20
  );
  const roll = Math.random();
  const success = roll < stealRate;

  // 2. 失败 → 战斗
  if (!success) {
    state.changeMoral(-15);
    state.addGameLog(`偷窃${npc.name}失败（成功率 ${(stealRate*100).toFixed(1)}%），进入战斗！善恶值 -15`);
    onBattle?.(npc);
    return { success: false, item: null, goldBonus: 0, stealRate };
  }

  // 3. 成功 → 偷到物品
  const item = npc.personalItem ?? null;
  const goldChance = npc.stealGoldChance ?? 0.2;
  const goldMin = npc.stealGoldMin ?? 5;
  const goldMax = npc.stealGoldMax ?? 20;
  const goldBonus = Math.random() < goldChance
    ? Math.floor(Math.random() * (goldMax - goldMin + 1)) + goldMin
    : 0;

  state.changeMoral(-15);
  state.addGameLog(
    `成功偷窃${npc.name}${item ? '，获得 ' + item.icon + item.name : ''}${goldBonus > 0 ? ' +' + goldBonus + 'G' : ''}`
  );

  // 奖励：物品进入背包，金币直接加
  if (item) {
    const inv = useInventoryStore.getState();
    inv.addNovelty(item.name, 1);
  }
  if (goldBonus > 0) {
    state.addGold(goldBonus);
  }

  return { success: true, item, goldBonus, stealRate };
}

/** 观音随机事件 */
const GUANYIN_DIALOGUES = [
  '"你这一路上遇到的人和事，我大多看在眼里。那泾河龙王，是我让魏征斩的。"',
  '"那六耳猕猴……不该死在孙悟空棒下。但佛祖说那是定数，我不便多言。"',
  '"你心里有疑惑。问吧。——不过我只能答一个问题。"',
  '"你要去西天？还早。等你真正准备好了，会有人来找你的。"',
];

const GUANYIN_REWARD_DIALOGUES = 5; // 第5次触发时给净瓶甘露
function tryTriggerGuanyin(location: string, npcId: string): ActionResult | null {
  const gameState = useGameStore.getState();
  const npcStore = useNpcStore.getState();
  const invStore = useInventoryStore.getState();

  // 必须与袁守城对话10次以上 + 在长安 + 等级>=55
  if (npcId !== 'changan_fortune') return null;
  if (gameState.hero.level < 55) return null;
  if (location !== 'changan') return null;

  const yuanshouKey = 'yuanshou_talks';
  const yuanshouTalks = parseInt(npcStore.explorationFlags[yuanshouKey] as any || '0', 10);
  if (yuanshouTalks < 10) return null;

  const encounterKey = 'guanyin_encounters';
  const encounters = parseInt(npcStore.explorationFlags[encounterKey] as any || '0', 10);

  if (encounters >= 4) return null; // 最多触发4次（4条台词）

  // 5% 概率触发
  if (Math.random() > 0.05) return null;

  // 更新触发次数
  const nextCount = encounters + 1;
  npcStore.setExplorationFlag(encounterKey);
  (npcStore.explorationFlags as any)[encounterKey] = String(nextCount);

  const dialogue = GUANYIN_DIALOGUES[(nextCount - 1) % GUANYIN_DIALOGUES.length];

  let extra = '';
  if (nextCount === 4) {
    // 第4次送净瓶甘露
    gameState.addGameLog('\u2728 观音将净瓶中的甘露洒在你身上，你感到一股暖流贯通全身\n获得：净瓶甘露 x1');
    extra = '\n\n观音将净瓶中的甘露洒在你身上，你感到一股暖流贯通全身。获得净瓶甘露 x1。';
    gameState.setHero({ hp: gameState.hero.maxHp });
  }

  return {
    type: 'log',
    message: `试卦之时，一位白衣女子站在你身旁。\n观音开口道：「${dialogue}」${extra}`,
  };
}

// ── 跨NPC对话彩蛋：敖广 ↔ 崔珏 串联 ──
const CROSS_DIALOGUE_CHAINS: Record<string, { triggerNpcId: string; checkKey: string; flagKey: string; line: string; notify?: { npcId: string; msg: string } }> = {
  // 敖广提及崔珏 → 崔珏解锁隐藏对话
  'donghai_aoguang_reveal': {
    triggerNpcId: 'donghai_aoguang',
    checkKey: 'aoguang_talks',
    flagKey: 'aoguang_mentioned_cuijue',
    line: '"那魏征在人间斩了泾河龙王，龙王魂魄到了地府找崔珏评理……咳咳，这事我不便多说。你若有机会见着崔判官，问问他泾河龙王的事。"',
    notify: { npcId: 'diyu_cuijue', msg: '崔珏似乎感知到远处有人提及他……' },
  },
  // 崔珏回应敖广提问
  'diyu_cuijue_reply': {
    triggerNpcId: 'diyu_cuijue',
    checkKey: 'cuijue_talks',
    flagKey: 'cuijue_answered_aoguang',
    line: '"泾河龙王的事……"崔珏沉默良久，"他确实是被人算计的。那个叫袁守城的术士算出了降雨时辰，故意让他触犯天条。魏征不过是递刀的人。"他抬头看了看天，"东海那位应该也知道真相，只不过不便明说。这枚龙鳞，你拿回去还给敖广吧。"',
  },
};

function _checkCrossNpcDialogue(npcId: string): ActionResult | null {
  const npcStore = useNpcStore.getState();
  const gameStore = useGameStore.getState();

  for (const [chainId, chain] of Object.entries(CROSS_DIALOGUE_CHAINS)) {
    if (chain.triggerNpcId !== npcId) continue;
    if (npcStore.explorationFlags[chain.flagKey]) continue; // already triggered

    const cur = parseInt(npcStore.explorationFlags[chain.checkKey] as any || '0', 10) + 1;
    npcStore.setExplorationFlag(chain.checkKey);
    (npcStore.explorationFlags as any)[chain.checkKey] = String(cur);

    // 敖广链：对话≥5次触发；崔珏链：需敖广已提及
    if (chainId === 'donghai_aoguang_reveal' && cur < 5) continue;
    if (chainId === 'diyu_cuijue_reply' && !npcStore.explorationFlags['aoguang_mentioned_cuijue'] && cur < 3) continue;

    // 触发！
    npcStore.setExplorationFlag(chain.flagKey);
    (npcStore.explorationFlags as any)[chain.flagKey] = '1';

    if (chain.notify) {
      gameStore.addGameLog(`\n${chain.notify.msg}`);
    }

    const npc = _getNpcById(npcId);
    const name = npc?.name ?? '???'; const title = npc?.title ?? 'NPC';
    return { type: 'log', message: `【${title}】${name}：「${chain.line}」` };
  }
  return null;
}

function _getNpcById(npcId: string): NpcDefinition | undefined {
  return NPCS.find(n => n.id === npcId);
}
