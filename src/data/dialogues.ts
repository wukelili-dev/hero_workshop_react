/**
 * dialogues.ts — NPC 闲聊话题池 + 分支对话树（玩家方向盘层）
 *
 * 两层：
 *  - CHAT_TOPICS：闲聊话题（NPC 抛话题 → 玩家接 → NPC 回应，轻量、每次不同）
 *  - DIALOGUE_TREES：分支树（有明确剧情目的，选项改变世界走向，落 worldFlag）
 *
 * 变量插值：${self}=自称 ${call}=对玩家称呼 ${name}=名 ${title}=称号 ${catch}=口头禅 ${day}=天
 */
import type { ChatTopic, DialogueTree, NpcCondition } from '../types';

// ═══════════ 闲聊话题池 ═══════════

export const CHAT_TOPICS: Record<string, ChatTopic[]> = {
  // ── 老张头 · 铁匠铺 ──
  changan_blacksmith: [
    {
      id: 'zhang_chat_forge', kind: 'personality', weight: 3,
      lines: ['${self}抡着锤，头也不抬：「这刀口，得淬三遍火，一遍都省不得。」', '${self}往炉里添了把炭：「好铁难寻，好主顾更难寻。」'],
      options: [
        { id: 'a1', text: '“打刀有什么讲究？”', reply: ['${self}来了兴致：「讲究大了——炭是青冈炭，水是山泉水。你听着，${call}……」'], effects: [{ affinity: 5 }] },
        { id: 'a2', text: '“我先看看货。”', reply: ['${self}指了指墙上：「都在那儿挂着，随便看。」'] },
      ],
    },
    {
      id: 'zhang_chat_wine', kind: 'personality', weight: 3,
      lines: ['${self}咂了咂嘴：「忙了一上午，就想来口酒。」'],
      options: [
        { id: 'a1', text: '“我请。”', reply: ['${self}眼睛一亮：「${call}，够意思！」'], effects: [{ affinity: 12, gold: -20 }] },
        { id: 'a2', text: '“改天再喝。”', reply: ['${self}摆摆手：「行，正事要紧。」'] },
      ],
    },
    {
      id: 'zhang_chat_memory', kind: 'memory', weight: 2, when: { flags: { 借过钱: { min: 1 } } },
      lines: ['${self}见你，点了点头：「${call}，上回那钱，老夫记着。」'],
      options: [
        { id: 'a1', text: '“不急。”', reply: ['${self}正色道：「不，欠债还钱，天经地义。」'], effects: [{ affinity: 5 }] },
      ],
    },
    {
      id: 'zhang_easter_forge', kind: 'easter', weight: 1, once: true, isEaster: true,
      when: { all: [{ flags: { 借过钱: { min: 1 } } }, { affinity: { min: 70 } }] },
      lines: ['${self}忽然把你拉进里屋，从墙缝里摸出一个油布包：「老夫一辈子就这点念想……程氏铁谱，送你。」'],
      options: [
        { id: 'a1', text: '（收下）', reply: ['${self}郑重道：「这是隋末程郑传下的祖谱，你好生收着。」'], effects: [{ item: { id: '程氏铁谱', count: 1 }, affinity: 30, worldFlag: '得程氏铁谱' }], isEaster: true },
      ],
    },
  ],

  // ── 孙二娘 · 药铺 ──
  changan_herbalist: [
    {
      id: 'sun_chat_gossip', kind: 'rumor', weight: 3, when: { affinity: { min: 30 } },
      lines: ['${self}边抓药边嘀咕：「西市那两家最近闹得不太好看，你听听就罢。」'],
      options: [
        { id: 'a1', text: '“什么两家？”', reply: ['${self}压低声音：「布庄和当铺，为了个典当的镯子，都要动家伙了。」'], effects: [{ affinity: 3 }] },
        { id: 'a2', text: '“我不爱听闲话。”', reply: ['${self}撇嘴：「那你还来问。」'] },
      ],
    },
    {
      id: 'sun_easter_palace', kind: 'easter', weight: 1, once: true, isEaster: true, when: { affinity: { min: 60 } },
      lines: ['${self}忽然压低声音：「宫里来抓药的公公说，皇上最近……罢了，这话传出去要掉脑袋。」'],
      options: [
        {
          id: 'a1', text: '“但说无妨。”',
          reply: ['${self}凑近：「金銮殿里出了怪事——值夜的侍卫说夜里听见有人唱曲，像是先皇的声音。」'],
          effects: [{ worldFlag: '听说宫闱秘辛', relationShift: { target: 'changan_weizheng', affinity: -10 }, rumor: '长安城开始流传宫闱闹鬼的传闻', affinity: 5 }],
          isEaster: true,
        },
        },
        { id: 'a2', text: '“我不听，怕事。”', reply: ['${self}松了口气：「识趣。」'], effects: [{ affinity: 3 }] },
      ],
    },
  ],

  // ── 胡姬 · 酒肆 ──
  changan_tavern: [
    {
      id: 'hu_chat_zhao', kind: 'state', weight: 3, when: { affinity: { min: 25 } },
      lines: ['${self}斜倚着柜台：「赵镖头今儿又来了，喝到太阳落山才走。你说，他图什么？」'],
      options: [
        { id: 'a1', text: '“图你。”', reply: ['${self}笑骂：「就你嘴甜。」'], effects: [{ affinity: 8 }] },
        { id: 'a2', text: '“图酒。”', reply: ['${self}哼道：「那老东西，酒量倒是不小。」'], effects: [{ affinity: 3 }] },
        { id: 'a3', text: '“他这人，配不上你。”', reply: ['${self}笑容淡了：「这话……以后别说了。」'], effects: [{ relationShift: { target: 'changan_biaotou', affinity: -30 }, worldFlag: '挑拨胡姬赵镖头', affinity: 2 }] },
      ],
    },
    {
      id: 'hu_chat_drink', kind: 'personality', weight: 3,
      lines: ['${self}给你倒了杯酒：「${catch}」', '${self}哼着小曲，把酒壶转了个圈。'],
      options: [
        { id: 'a1', text: '“来壶好酒。”', reply: ['${self}一笑：「好酒有，就怕${call}的荷包受不住。」'], effects: [{ gold: -30, affinity: 6 }] },
        { id: 'a2', text: '“改日再来。”', reply: ['${self}挥挥手：「慢走，${call}。」'] },
      ],
    },
  ],

  // ── 赵镖头 · 镖局 ──
  changan_biaotou: [
    {
      id: 'zhao_chat_road', kind: 'personality', weight: 3,
      lines: ['${self}擦着刀：「这几日道上不太平，你出门多留神。」'],
      options: [
        { id: 'a1', text: '“有什么风声？”', reply: ['${self}道：「西边来了伙山匪，专劫单身的客。」'], effects: [{ affinity: 4 }] },
        { id: 'a2', text: '“我本事不差。”', reply: ['${self}打量你一眼：「那也得多个心眼。」'], effects: [{ affinity: 2 }] },
      ],
    },
    {
      id: 'zhao_chat_hu', kind: 'state', weight: 3, when: { relationAffinity: { target: 'changan_tavern', min: 40 } },
      lines: ['${self}像是随口一问：「常去酒肆？那儿的酒，后劲大。」'],
      options: [
        { id: 'a1', text: '“老板娘人好。”', reply: ['${self}脸色微变：「……她待客，自然好。」'], effects: [{ affinity: -3, relationShift: { target: 'changan_tavern', affinity: -5 } }] },
        { id: 'a2', text: '“我只喝酒。”', reply: ['${self}神色缓和：「那就好。」'], effects: [{ affinity: 3 }] },
      ],
    },
  ],

  // ── 裴绣娘 · 云锦绣坊 ──
  changan_embroidery: [
    {
      id: 'pei_chat_embroidery', kind: 'personality', weight: 3,
      lines: ['${self}飞针走线，头也不抬：「这并蒂莲，要绣九九八十一道线，少一道都不成。」'],
      options: [
        { id: 'a1', text: '“绣工当真了得。”', reply: ['${self}抬头一笑：「客官谬赞了，不过是熟能生巧。」'], effects: [{ affinity: 6 }] },
        { id: 'a2', text: '“我先看看别的。”', reply: ['${self}点头：「客官自便。」'] },
      ],
    },
    {
      id: 'pei_chat_gossip', kind: 'rumor', weight: 2, when: { affinity: { min: 30 } },
      lines: ['${self}压低声音：「听说城南绸缎庄的东家，最近和西市布庄闹得不可开交。」'],
      options: [
        { id: 'a1', text: '“为何事？”', reply: ['${self}道：「一匹蜀锦的来历，两家都说是自己的。」'], effects: [{ affinity: 3 }] },
        { id: 'a2', text: '“闲事莫管。”', reply: ['${self}笑了笑：「也是，做生意的，多一事不如少一事。」'] },
      ],
    },
  ],

  // ── 公孙大娘 · 剑器舞 ──
  changan_gongsun: [
    {
      id: 'gongsun_chat_sword', kind: 'personality', weight: 3,
      lines: ['${self}把剑一横：「剑之极处，不在杀，在收。你懂么？」'],
      options: [
        { id: 'a1', text: '“愿闻其详。”', reply: ['${self}道：「能出鞘而不伤人的剑，才叫剑。所以我的剑，叫舞。」'], effects: [{ affinity: 6 }] },
        { id: 'a2', text: '“不懂，动手便知。”', reply: ['${self}大笑：「痛快！那就来！」'], effects: [{ affinity: 4 }] },
      ],
    },
    {
      id: 'gongsun_chat_zhao', kind: 'state', weight: 2, when: { affinity: { min: 25 } },
      lines: ['${self}擦着剑：「赵镖头那刀法，刚猛有余，灵动不足。真打起来，接不住我十剑。」'],
      options: [
        { id: 'a1', text: '“你们交过手？”', reply: ['${self}轻笑：「他不敢。输给一个女人，他那张脸挂不住。」'], effects: [{ affinity: 3 }] },
        { id: 'a2', text: '“各有所长。”', reply: ['${self}不置可否：「也许吧。」'] },
      ],
    },
  ],

  // ── 秦琼 · 翼国公 ──
  changan_qinqiong: [
    {
      id: 'qin_chat_gate', kind: 'personality', weight: 3,
      lines: ['${self}拄着熟铜锏：「太宗夜梦不宁，是某与敬德把守宫门，方得安寝。」'],
      options: [
        { id: 'a1', text: '“将军辛苦。”', reply: ['${self}摇头：「为臣者，分内之事。」'], effects: [{ affinity: 6 }] },
        { id: 'a2', text: '“想讨教两招。”', reply: ['${self}精神一振：「正合我意！」'], effects: [{ affinity: 4 }] },
      ],
    },
    {
      id: 'qin_chat_grateful', kind: 'memory', weight: 2, when: { affinity: { min: 30 } },
      lines: ['${self}摸着锏柄：「当年某病重，太宗割须发为某入药。此恩，没齿难忘。」'],
      options: [
        { id: 'a1', text: '“太宗待臣，可谓厚矣。”', reply: ['${self}慨然：「所以某这条命，早已许给大唐。」'], effects: [{ affinity: 5 }] },
      ],
    },
  ],
};

// ═══════════ 分支对话树 ═══════════

export const DIALOGUE_TREES: Record<string, DialogueTree[]> = {
  // ── 老张头借钱树：借不借影响后续（worldFlag 欠老张头人情） ──
  changan_blacksmith: [
    {
      id: 'zhang_loan',
      npcId: 'changan_blacksmith',
      when: { notWorldFlag: '欠老张头人情' },
      root: 'ask',
      nodes: {
        ask: {
          id: 'ask', speaker: 'npc',
          text: '${self}搓着手，有些难为情：「${call}，老夫想跟你借五十金，铺子进料周转不开。三天，就三天，连本带利还你。」',
          options: [
            { id: 'lend', text: '“借。区区五十金。”', hint: '+15 好感', reply: ['「好！老夫记下了。」他重重一拍你的肩。'], effects: [{ gold: -50, affinity: 15, setFlag: '借过钱', worldFlag: '欠老张头人情' }], end: true },
            { id: 'terms', text: '“利息怎么算？”', reply: ['他愣了愣，笑了：「亲兄弟明算账，三分利，如何？」'], next: 'terms' },
            { id: 'refuse', text: '“不借，我没闲钱。”', hint: '-5 好感', reply: ['他叹了口气，没再说什么。'], effects: [{ affinity: -5 }], end: true },
          ],
        },
        terms: {
          id: 'terms', speaker: 'npc',
          text: '${self}竖起三根手指：「三分利，童叟无欺。」',
          options: [
            { id: 'deal', text: '“成交。”', reply: ['「痛快！」${self}大笑。'], effects: [{ gold: -50, affinity: 15, setFlag: '借过钱', worldFlag: '欠老张头人情' }], end: true },
            { id: 'backout', text: '“还是算了。”', reply: ['「行，不勉强。」他点点头。'], end: true },
          ],
        },
      },
    },
    // ── 还钱树：世界旗标「欠老张头人情」触发，还钱送刀 ──
    {
      id: 'zhang_repay',
      npcId: 'changan_blacksmith',
      when: { worldFlag: '欠老张头人情' },
      root: 'repay',
      nodes: {
        repay: {
          id: 'repay', speaker: 'npc',
          text: '${self}见你，从怀里摸出个钱袋：「${call}，那五十金，老夫连本带利还你六十。这刀，也是给你的。」',
          options: [
            { id: 'take', text: '“谢了。”', reply: ['「客气啥，往后铺子的事，${call}一句话。」'], effects: [{ gold: 60, item: { id: '上品镔铁刀', count: 1 }, affinity: 20, worldFlag: '老张头还清人情', setFlag: '还过钱' }], end: true },
          ],
        },
      },
    },
  ],

  // ── 胡姬站队树：善恶分叉，改第三方关系 ──
  changan_tavern: [
    {
      id: 'hu_sides',
      npcId: 'changan_tavern',
      when: { affinity: { min: 40 } },
      root: 'open',
      nodes: {
        open: {
          id: 'open', speaker: 'npc',
          text: '${self}把酒壶往桌上一顿，似有心事：「赵镖头……又派人送来了聘礼，这是第三回了。${call}，你说奴家该怎么办？」',
          options: [
            { id: 'accept', text: '“从了他吧，安稳。”', reply: ['${self}苦笑：「安稳？奴家要的不是安稳。」'], effects: [{ affinity: -5, moral: -3 }], end: true },
            { id: 'defend', text: '“你自己的事，自己做主。”', reply: ['${self}眼睛亮起来：「还是${call}懂我！」'], effects: [{ affinity: 15, moral: 5 }], end: true },
            { id: 'sow', text: '“他缠着你，我替你教训他。”', hint: '⚠ 改第三方关系', reply: ['${self}一怔，随即摇头：「别胡来，他好歹是我故人。」'], effects: [{ affinity: -10, moral: -8, relationShift: { target: 'changan_biaotou', affinity: -40 }, worldFlag: '挑拨胡姬赵镖头' }], end: true },
          ],
        },
      },
    },
  ],

  // ── 神秘老者 → 聂隐娘 解锁树 ──
  changan_mysterious: [
    {
      id: 'mysterious_nieyinniang',
      npcId: 'changan_mysterious',
      when: { notWorldFlag: 'nieyinniang_unlocked' },
      root: 'open',
      nodes: {
        open: {
          id: 'open', speaker: 'npc',
          text: '${self}把斗篷裹紧，低声笑道：「你又来了。既是有缘，老夫倒想问你——这长安城里，可有什么人是你想寻却寻不着的？」',
          options: [
            { id: 'ask', text: '“听闻有位女侠，来去无踪。”', reply: ['${self}眼中精光一闪：「聂隐娘。她也算老夫半个故人。」'], next: 'hint' },
            { id: 'leave', text: '“没什么想寻的。”', reply: ['${self}摆摆手：「那就去吧。」'], end: true },
          ],
        },
        hint: {
          id: 'hint', speaker: 'npc',
          text: '${self}伸出枯瘦的手，指向东市方向：「她在东市云锦绣坊附近出没。魏征丞相府，她也常去。夜里子时，你到绣坊后巷转转，或可见她。」',
          options: [
            { id: 'go', text: '“多谢指点。”', reply: ['${self}咧嘴一笑：「不必谢。她若知道是老夫多嘴，少不得要来找老夫算账。」'], effects: [{ worldFlag: 'nieyinniang_unlocked' }], end: true },
          ],
        },
      },
    },
  ],
};

/** 供 UI / 引擎查询 */
export function chatTopicsFor(npcId: string): ChatTopic[] {
  return CHAT_TOPICS[npcId] ?? [];
}

export function dialogueTreesFor(npcId: string): DialogueTree[] {
  return DIALOGUE_TREES[npcId] ?? [];
}
