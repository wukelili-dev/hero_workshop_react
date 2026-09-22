// ═══════════ NPC 生态静态数据（关系网 / 语气 / 台词片段 / 自主行为） ═══════════
import type { NpcChannel, NpcDefinition, NpcDialogueRule, NpcEcoDef, NpcRelation, NpcRelationType, NpcVoice } from '../types';

/** 关系定义索引：单向声明，读取时两个方向都成立 */
const REL_OWNER: Record<string, NpcRelation[]> = {
  // 长安：胡姬 × 赵镖头 —— 情侣（吃醋样板）
  changan_tavern: [{ target: 'changan_biaotou', type: 'lover', strength: 70, jealous: true }],
  changan_biaotou: [{ target: 'changan_tavern', type: 'lover', strength: 70, jealous: true }],
  // 老张头 × 孙二娘：西市老街坊
  changan_blacksmith: [{ target: 'changan_herbalist', type: 'friend', strength: 55 }],
  changan_herbalist: [{ target: 'changan_blacksmith', type: 'friend', strength: 55 }],
  // 魏征 × 唐太宗：君臣
  changan_weizheng: [{ target: 'changan_tangwang', type: 'colleague', strength: 80 }],
  changan_tangwang: [{ target: 'changan_weizheng', type: 'colleague', strength: 80 }],
  changan_xuanzang: [{ target: 'changan_weizheng', type: 'colleague', strength: 40 }],
  // 神秘老者 × 袁守城：旧怨
  changan_mysterious: [{ target: 'changan_fortune', type: 'rival', strength: -30 }],
  changan_fortune: [{ target: 'changan_mysterious', type: 'rival', strength: -30 }],
};

export function getRelationDef(a: string, b: string): NpcRelation | undefined {
  return REL_OWNER[a]?.find((r) => r.target === b);
}
export function relationsOf(a: string): NpcRelation[] {
  return REL_OWNER[a] ?? [];
}
export function allRelationPairs(): { a: string; b: string; rel: NpcRelation }[] {
  return Object.keys(REL_OWNER).flatMap((a) => (REL_OWNER[a] ?? []).map((rel) => ({ a, b: rel.target, rel })));
}

/** 玩家动作 → 关系网传导表 */
export const PROPAGATION: Record<string, { types: NpcRelationType[]; affinity: number; mood?: '厌恶' | '警惕' }[]> = {
  wed: [
    { types: ['lover', 'spouse'], affinity: -40, mood: '厌恶' },
    { types: ['parent', 'child', 'sibling'], affinity: 20 },
    { types: ['rival', 'enemy'], affinity: 15 },
  ],
  steal: [{ types: ['friend', 'colleague'], affinity: -8, mood: '警惕' }],
  attack: [
    { types: ['parent', 'child', 'sibling', 'lover', 'spouse', 'master', 'disciple'], affinity: -35, mood: '厌恶' },
    { types: ['enemy', 'rival'], affinity: 15 },
  ],
  gift: [{ types: ['friend', 'colleague', 'lover'], affinity: 6 }],
  befriend: [{ types: ['friend', 'colleague'], affinity: 5 }],
};

/** 招呼语：按 voice.tone 分（${self}=自称，${call}=对玩家的称呼） */
export const TONE_GREET: Record<string, string[]> = {
  市井: ['${self}把手里的活计放下：「${call}，来啦？」', '${self}抬了抬下巴：「${call}，今天看点什么？」'],
  文士: ['${self}放下书卷，拱了拱手：「${call}。」', '${self}打量你一眼：「${call}，坐。」'],
  江湖: ['${self}把刀横在桌上，笑道：「${call}，喝一碗？」', '${self}拍了下你的肩：「${call}，来得正好。」'],
  仙家: ['${self}垂目一瞬，方道：「${call}，你来了。」'],
  番邦: ['${self}用生硬的官话招呼：「${call}，钱带来了？」'],
};

/** 各渠道台词池：base + 状态附加池，命中越多组合越多 */
export const CHANNEL_LINES: Record<NpcChannel, {
  base: string[]; warm?: string[]; cold?: string[]; spouse?: string[]; rich?: string[]; poor?: string[];
}> = {
  greet: {
    base: ['${self}点了点头，没多说话。'],
    warm: ['看见是你，${self}的神色松了下来：「${call}，正想着你呢。」', '${self}笑了：「${call}，来得巧，刚温了酒。」'],
    cold: ['${self}的眼神在你身上停了一瞬，又移开了。', '${self}把东西往身后挪了挪：「……有什么事？」'],
    spouse: ['${self}顺手把你的外袍接过去挂好：「回来了。」', '「灶上温着东西。」${self}边说边往里走。'],
    rich: ['${self}摸出几枚钱在指间转着：「最近生意还行。」'],
    poor: ['${self}搓了搓手：「……手头有点紧。」'],
  },
  chat: {
    base: ['${self}想了想：「这条街上，人多，话也多。」', '「你问这个做什么？」${self}反问你。'],
    warm: ['${self}压低声音：「有话我只跟你说——${catch}」'],
    cold: ['${self}摆摆手：「没什么好说的。」'],
    spouse: ['「你出门在外，夜里冷。」${self}说着又给你添了一件。'],
  },
  trade: {
    base: ['「看中哪个了？」${self}把货摆开。'],
    rich: ['「镔铁最近涨了。」${self}报了价，没打算让步。'],
    poor: ['「……先欠着吧，下回一起算。」'],
    cold: ['${self}按住了货：「老规矩，先付钱。」'],
    warm: ['${self}把最好的那份推到你面前：「挑这个，算你便宜点。」'],
    spouse: ['「家里的东西，拿就是了。」${self}把账本合上。'],
  },
  gift: {
    base: ['${self}接过来看了看：「……有心了。」'],
    warm: ['${self}捧着礼物笑出了声：「你倒是记得。」'],
    cold: ['${self}没有伸手：「这东西，我不能收。」'],
  },
  challenge: {
    base: ['「要动手？」${self}把袖子挽了起来。'],
    warm: ['「点到为止。」${self}笑着摆了个架势。'],
  },
  steal: {
    base: ['${self}忽然回头，你把手缩了回去。'],
    cold: ['「你手往哪儿放？」${self}盯着你。'],
  },
  attack: {
    base: ['${self}愣住了：「你来真的？」'],
    cold: ['「我早该防着你。」${self}咬着牙。'],
  },
  befriend: {
    base: ['${self}沉默片刻，点了点头：「行，往后算你一个。」'],
    warm: ['${self}大笑：「早就当你是自己人了！」'],
  },
  propose: {
    base: ['${self}怔住了，半晌没说话。'],
    warm: ['${self}低下头，耳根有点红：「……你认真的？」'],
  },
  wed: { base: ['礼成。${self}把合卺酒一饮而尽。'] },
  spouse: {
    base: ['${self}把灯挑亮了些：「今日早些歇。」'],
    warm: ['「有你这句话就够了。」${self}笑着说。'],
  },
  rumor: { base: ['「听说了吗？${catch}」${self}压低声音。'] },
  idle: { base: ['${self}在做自己的事。'] },
};

/** 自主行为（每日推进）台词池 */
export const AUTONOMY_LINES: Record<string, string[]> = {
  cultivate: ['${name}在城外练了半天功。', '${name}闭门不出，据说在参研招式。'],
  trade: ['${name}出城进了一批货。', '${name}在摊前盘了一上午的账。'],
  drink: ['${name}在酒肆里喝到深夜。', '${name}要了一壶酒，独自坐在角落。'],
  patrol: ['${name}在街上走了两圈，没说什么。', '${name}夜里巡了半座城。'],
  rest: ['${name}今天闭了门，说是身子不爽。', '${name}睡了整整一天。'],
  visit: ['${name}去拜访了老朋友。', '${name}提着东西登门，坐了半个时辰。'],
  gossip: ['${name}在茶摊上说了半天闲话。', '${name}和人嘀咕了一阵，见你过来就散了。'],
};

/** 少数 NPC 的生态设定；其余走默认推导 */
export const NPC_ECO: Record<string, NpcEcoDef> = {
  changan_blacksmith: {
    traits: ['好酒', '重名声', '护短'],
    voice: { tone: '市井', selfCall: '老夫', callPlayer: { stranger: '客官', acquaintance: '小友', close: '你这小子', spouse: '当家的' }, catchphrase: '这铺子传了三代了' },
    wallet: { base: 300, dailyIncome: 20 },
    agenda: ['trade', 'drink', 'rest'],
    inventory: [
      { itemId: '上品镔铁刀', count: 1, price: 200, tag: 'tool' },
      { itemId: '玄铁匕首', count: 1, price: 120, tag: 'treasure' },
    ],
    dialogueRules: [
      { id: 'zhang_wed', channel: 'spouse', when: { bond: ['夫妻'] }, lines: ['回来了？灶上温着酒——铺子我让学徒看着。', '（他把账本往你面前一推）你签个字就成，早晚是你的。'] },
      { id: 'zhang_stolen', channel: 'greet', when: { flags: { 被偷: { min: 1 } } }, weight: 6, cooldownDays: 3, lines: ['（他把钱袋往里挪了挪）……客官，今天只看不买？'] },
      { id: 'zhang_poor', channel: 'trade', when: { wealth: 'poor' }, weight: 4, lines: ['……先欠着吧，下回一起算。老夫记着你的账。'] },
      { id: 'zhang_courtship', channel: 'chat', when: { affinity: { min: 70 }, bond: ['挚友'], not: { bond: ['夫妻'] }, chance: 0.4 }, lines: ['……你天天往我这铺子跑，图什么？图我打的刀好？'] },
    ],
  },
  changan_herbalist: {
    traits: ['心细', '爱打听', '嘴严'],
    voice: { tone: '市井', selfCall: '奴家', callPlayer: { stranger: '客官', acquaintance: '小友', close: '你呀', spouse: '当家的' }, catchphrase: '长安城里找不出第二家比我这全的' },
    wallet: { base: 300, dailyIncome: 15 },
    agenda: ['trade', 'gossip'],
    dialogueRules: [
      { id: 'sun_wed', channel: 'spouse', when: { bond: ['夫妻'] }, lines: ['药铺的账我来管，你只管在外头跑。', '（她把一碗药推过来）喝了再走。'] },
      { id: 'sun_rumor', channel: 'rumor', when: { affinity: { min: 40 } }, weight: 3, lines: ['「西市那两家最近闹得不太好看。」她压低声音，「你听听就罢。」'] },
    ],
  },
  changan_tavern: {
    traits: ['爽利', '爱笑', '记仇'],
    voice: { tone: '江湖', selfCall: '奴家', callPlayer: { stranger: '客官', acquaintance: '老客', close: '你', spouse: '当家的' }, catchphrase: '这壶酒算奴家请的' },
    wallet: { base: 500, dailyIncome: 30 },
    agenda: ['trade', 'drink', 'gossip'],
    dialogueRules: [
      { id: 'hu_wed', channel: 'wed', when: { bond: ['夫妻'] }, lines: ['（她把酒壶往桌上一顿）往后这酒肆，也是你的家。'] },
      { id: 'hu_hint', channel: 'chat', when: { affinity: { min: 60 }, not: { bond: ['夫妻'] }, chance: 0.35 }, lines: ['赵镖头那人……你不必理他。奴家自己的事，自己做主。'] },
    ],
  },
  changan_biaotou: {
    traits: ['寡言', '重义', '护短'],
    voice: { tone: '江湖', selfCall: '在下', callPlayer: { stranger: '这位', acquaintance: '兄弟', close: '兄弟', spouse: '——' }, catchphrase: '镖在人在' },
    wallet: { base: 600, dailyIncome: 25 },
    agenda: ['patrol', 'drink'],
    dialogueRules: [
      { id: 'zhao_jealous', channel: 'greet', weight: 8, cooldownDays: 1, when: { relationAffinity: { target: 'changan_tavern', min: 60 } }, lines: ['（他打量你两眼）常去酒肆？那儿的酒，后劲大。'] },
      { id: 'zhao_hate', channel: 'greet', when: { bond: ['仇敌'] }, weight: 10, lines: ['（他手按在刀上，没拔）……你娶了她。往后镖局的镖，我另找人押。'] },
    ],
  },
};

// ═══════════ 「渠道 × 状态」通用矩阵：全部 NPC 共用，靠 ${self}/${call} 适配每人语气 ═══════════

/** 语气档：自称与对玩家的称呼（陌生 / 相识 / 亲近 / 夫妻） */
const TONE_VOICE: Record<string, { selfCall: string; call: [string, string, string, string] }> = {
  市井: { selfCall: '我', call: ['这位客官', '小友', '你', '当家的'] },
  文士: { selfCall: '在下', call: ['足下', '阁下', '兄台', '贤内助'] },
  江湖: { selfCall: '在下', call: ['这位', '兄弟', '兄弟', '当家的'] },
  仙家: { selfCall: '贫道', call: ['施主', '善信', '小友', '爱侣'] },
  番邦: { selfCall: '本商', call: ['贵人', '朋友', '朋友', '家人'] },
};

/** 通用规则：覆盖 婚后/恋人/挚友/警惕/厌恶/仇敌/被偷/被袭击/被揭发/穷/富 + 各渠道回应 */
export const GENERIC_RULES: NpcDialogueRule[] = [
  { id: 'g_spouse_1', channel: 'spouse', when: { bond: ['夫妻'] }, weight: 4, lines: ['${self}把灯挑亮了些，顺手给你添了碗热汤。', '「回来了？」${self}头也不抬，手里的活计却停了。'] },
  { id: 'g_spouse_greet', channel: 'greet', when: { bond: ['夫妻'] }, weight: 5, lines: ['${self}看了你一眼：「${call}，先坐下。」', '${self}把门帘掀开半边：「外头风大。」'] },
  { id: 'g_spouse_chat', channel: 'chat', when: { bond: ['夫妻'] }, weight: 3, lines: ['「家里的账我记着，你别操心。」${self}说，「外头的事，说给我听。」'] },
  { id: 'g_lover_1', channel: 'chat', when: { bond: ['恋人'] }, weight: 4, lines: ['${self}避开你的目光：「……别总盯着我。」', '${self}顿了顿：「这事，你容我再想想。」'] },
  { id: 'g_propose_1', channel: 'propose', when: { affinity: { min: 80 } }, weight: 5, lines: ['${self}沉默了很久：「你……想清楚了？」'] },
  { id: 'g_warm_1', channel: 'greet', when: { affinity: { min: 60 } }, weight: 3, lines: ['看见是你，${self}的神色松了下来：「${call}。」'] },
  { id: 'g_enemy_1', channel: 'greet', when: { bond: ['仇敌'] }, weight: 9, lines: ['${self}手按在腰间，没说话。', '「你还有脸来。」${self}冷冷道。'] },
  { id: 'g_wary_1', channel: 'greet', when: { mood: ['警惕', '厌恶'] }, weight: 5, lines: ['${self}把东西往身后挪了挪：「有事？」'] },
  { id: 'g_stolen_1', channel: 'greet', when: { flags: { 被偷: { min: 1 } } }, weight: 7, cooldownDays: 2, lines: ['${self}数了数钱袋，又看了你一眼。'] },
  { id: 'g_attacked_1', channel: 'greet', when: { flags: { 被袭击: { min: 1 } } }, weight: 8, lines: ['${self}脸上还带着伤：「……你还敢来。」'] },
  { id: 'g_exposed_1', channel: 'greet', when: { flags: { 被揭发: { min: 1 } } }, weight: 8, lines: ['「你揭的那事，我记着。」${self}说得很轻。'] },
  { id: 'g_cold_1', channel: 'greet', when: { affinity: { max: -20 } }, weight: 6, lines: ['${self}别过脸去，只当没看见你。'] },
  { id: 'g_poor_1', channel: 'trade', when: { wealth: 'poor' }, weight: 4, lines: ['「……先欠着吧。」${self}说得有点艰难。'] },
  { id: 'g_rich_1', channel: 'trade', when: { wealth: 'rich' }, weight: 3, lines: ['「最近的行情涨了。」${self}报的价很硬。'] },
  { id: 'g_gift_1', channel: 'gift', weight: 2, lines: ['${self}接过去看了看：「……有心了。」'] },
  { id: 'g_challenge_1', channel: 'challenge', weight: 2, lines: ['「点到为止。」${self}挽起袖子。'] },
  { id: 'g_steal_1', channel: 'steal', weight: 2, lines: ['${self}忽然回头，你把手缩了回去。'] },
  { id: 'g_attack_1', channel: 'attack', weight: 2, lines: ['${self}愣住了：「你来真的？」'] },
  { id: 'g_befriend_1', channel: 'befriend', weight: 2, lines: ['${self}点了点头：「往后算你一个。」'] },
  { id: 'g_rumor_1', channel: 'rumor', weight: 2, lines: ['「听说了吗？」${self}压低声音，「街头巷尾都在传。」', '${self}左右看了看：「这事我只跟你说。」'] },
  { id: 'g_chat_1', channel: 'chat', weight: 1, lines: ['${self}想了想：「这条街上，人多，话也多。」'] },
];

/** 从 NPC 的称号/描述推断语气 */
const TONE_BY_PATTERN: [RegExp, string][] = [
  [/道|仙|菩萨|金星|天|佛|僧|法师|真人|观音|玄奘|哪吒|三太子/, '仙家'],
  [/波斯|胡|西域|高昌|番|龟兹/, '番邦'],
  [/镖|刀|剑|侠|将|兵|妖|魔|鬼|鹰|掌柜|老板娘/, '江湖'],
  [/书|史|丞相|学士|先生|儒|卜|公主|天子|太宗/, '文士'],
];

export function inferTone(npc: NpcDefinition): string {
  const hay = `${npc.name}${npc.title}${npc.description ?? ''}`;
  for (const [re, tone] of TONE_BY_PATTERN) if (re.test(hay)) return tone;
  return npc.type === 'merchant' ? '市井' : npc.type === 'challenger' ? '江湖' : '文士';
}

/** 由现有 NPC 数据自动生成生态设定：42 个 NPC 一次性获得完整「渠道 × 状态」覆盖 */
export function buildEco(npc: NpcDefinition): NpcEcoDef {
  const tone = inferTone(npc);
  const v = TONE_VOICE[tone] ?? TONE_VOICE['市井'];
  const isMerchant = npc.type === 'merchant';
  const isChallenger = npc.type === 'challenger';
  const inventory = [
    ...(npc.personalItem
      ? [{ itemId: npc.personalItem.name, count: 1, price: npc.personalItem.sellPrice ?? 0, tag: 'keepsake' as const, description: npc.personalItem.description }]
      : []),
    ...(npc.tradeItems ?? [])
      .filter((t) => Boolean(t.name))
      .slice(0, 3)
      .map((t) => ({ itemId: t.name as string, count: 1, price: t.price, tag: 'gift' as const })),
  ];
  return {
    traits: isMerchant ? ['重利', '爱打听'] : isChallenger ? ['好胜', '重义'] : ['健谈', '和气'],
    voice: {
      tone: tone as NpcVoice['tone'],
      selfCall: v.selfCall,
      callPlayer: { stranger: v.call[0], acquaintance: v.call[1], close: v.call[2], spouse: v.call[3] },
      catchphrase: npc.greetings?.[0]?.slice(0, 14),
    },
    wallet: { base: npc.initialGold ?? (isMerchant ? 400 : isChallenger ? 500 : 250), dailyIncome: isMerchant ? 20 : 8 },
    agenda: isMerchant ? ['trade', 'gossip'] : isChallenger ? ['patrol', 'cultivate', 'drink'] : ['gossip', 'rest', 'visit'],
    inventory,
    dialogueRules: GENERIC_RULES,
  };
}
