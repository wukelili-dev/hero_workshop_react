"""Apply npcs.ts edits: personalItem, moralDialogues, and new NPCs."""
import re

path = r"D:\pyproject\hero_workshop_react\src\data\npcs.ts"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# ── 1. 老张头 (changan_blacksmith) ──
old = """    challengeReward: { exp: 30, gold: 40, message: '老张头"哎哟"一声蹲坐在地，连连摆手："好汉饶命！这锭银子你拿去！"' },
  },

  {
    id: 'changan_herbalist',"""
new = """    challengeReward: { exp: 30, gold: 40, message: '老张头"哎哟"一声蹲坐在地，连连摆手："好汉饶命！这锭银子你拿去！"' },
    personalItem: { name: '程氏铁谱', icon: '📜', description: '隋末唐初铁匠程郑所著，唐朝铁匠行会奉为祖师', sellPrice: 500 },
  },

  {
    id: 'changan_herbalist',"""
content = content.replace(old, new, 1)

# ── 2. 孙二娘 (changan_herbalist) ──
old = """    challengeReward: { exp: 20, gold: 30, message: '孙二娘一个趔趄扶住药柜："好……好俊的功夫！这里有瓶自配的大补丹，算我送的。"' },
  },

  {
    id: 'changan_tavern',"""
new = """    challengeReward: { exp: 20, gold: 30, message: '孙二娘一个趔趄扶住药柜："好……好俊的功夫！这里有瓶自配的大补丹，算我送的。"' },
    personalItem: { name: '江南绣帕', icon: '🧵', description: '苏州绣坊所制，唐女随身信物', sellPrice: 80 },
  },

  {
    id: 'changan_tavern',"""
content = content.replace(old, new, 1)

# ── 3. 赵镖头 (changan_biaotou) ──
old = """    tradeItems: [],
  },

  {
    id: 'changan_fortune',"""
new = """    tradeItems: [],
    personalItem: { name: '赏金令牌', icon: '🎴', description: '官府发行的缉盗令牌', sellPrice: 150 },
  },

  {
    id: 'changan_fortune',"""
content = content.replace(old, new, 1)

# ── 4. 袁守城 (changan_fortune) — personalItem + moralDialogues ──
old = """    uniqueDrop: {
      message: '古轴落地，化作一道流光没入你掌心——你感到一股浩瀚的力量涌入四肢百骸。',
      equipment: {
        id: 'celestial_iron',
        type: 'weapon',
        name: '通天神铁',
        tier: 10,
        rarity: 4,
        stats: { atk: 300, def: 50, hp: 500, crit: 30, critDmg: 80 },
      },
    },
  },

  // ── 长安 · 魏征 ──"""
new = """    uniqueDrop: {
      message: '古轴落地，化作一道流光没入你掌心——你感到一股浩瀚的力量涌入四肢百骸。',
      equipment: {
        id: 'celestial_iron',
        type: 'weapon',
        name: '通天神铁',
        tier: 10,
        rarity: 4,
        stats: { atk: 300, def: 50, hp: 500, crit: 30, critDmg: 80 },
      },
    },
    personalItem: { name: '占卜铜钱', icon: '🪙', description: '袁守城占卜用的铜钱，可转动命运之轮', sellPrice: 0 },
    moralDialogues: {
      good: ['先生功德无量，龙王冤魂不敢近身。西北有妖龙作祟……'],
      neutral: ['在下观先生面相，一时难断吉凶。来，坐下喝杯茶。'],
      evil: ['阁下周身死气环绕……在下不便多言。'],
    },
  },

  // ── 长安 · 魏征 ──"""
content = content.replace(old, new, 1)

# ── 5. 魏征 (changan_weizheng) ──
old = """    uniqueDrop: {
      message: '剑刃上的「天命」二字骤然亮起，一股凛然正气涌入你丹田——此剑名为「斩龙」，专克龙族。',
      equipment: {
        id: 'weizheng_sword',
        type: 'weapon',
        name: '斩龙剑',
        tier: 9,
        rarity: 4,
        stats: { atk: 220, def: 30, hp: 300, crit: 25, critDmg: 60 },
      },
    },
  },

  // ── 长安 · 唐王 ──"""
new = """    uniqueDrop: {
      message: '剑刃上的「天命」二字骤然亮起，一股凛然正气涌入你丹田——此剑名为「斩龙」，专克龙族。',
      equipment: {
        id: 'weizheng_sword',
        type: 'weapon',
        name: '斩龙剑',
        tier: 9,
        rarity: 4,
        stats: { atk: 220, def: 30, hp: 300, crit: 25, critDmg: 60 },
      },
    },
    personalItem: { name: '斩龙剑柄碎片', icon: '⚔️', description: '魏征梦斩泾河龙王，剑柄断落之碎片', sellPrice: 200 },
  },

  // ── 长安 · 唐王 ──"""
content = content.replace(old, new, 1)

# ── 6. 唐王 (changan_tangwang) ──
old = """      '"足下屡次拜访袁守城，又挑战魏征丞相，想必不是寻常旅人。朕有一事相托：水陆大会之后，玄奘便要启程西去。若足下得闲，愿否替朕送一程？"',
      '"朕还阳那日，崔珏悄悄塞给朕一件东西——说是「日后取经人路过阴间时用的」。朕不知是什么，放在宫中已多年。若足下需要，朕可以赐你。"',
    ],
  },

  // ── 长安 · 玄奘（水陆大会后现身） ──"""
new = """      '"足下屡次拜访袁守城，又挑战魏征丞相，想必不是寻常旅人。朕有一事相托：水陆大会之后，玄奘便要启程西去。若足下得闲，愿否替朕送一程？"',
      '"朕还阳那日，崔珏悄悄塞给朕一件东西——说是「日后取经人路过阴间时用的」。朕不知是什么，放在宫中已多年。若足下需要，朕可以赐你。"',
    ],
    personalItem: { name: '传国玉玺拓印', icon: '💎', description: '唐王御笔拓印，可作通行凭证', sellPrice: 800 },
  },

  // ── 长安 · 玄奘（水陆大会后现身） ──"""
content = content.replace(old, new, 1)

# ── 7. 玄奘 (changan_xuanzang) ──
old = """      '"贫僧启程在即。长安城外，灞桥折柳，唐王亲自相送。足下若来送行，咱们便算有缘——西天路上，说不定能再见。"',
    ],
  },

  // ── 傲来国 ──"""
new = """      '"贫僧启程在即。长安城外，灞桥折柳，唐王亲自相送。足下若来送行，咱们便算有缘——西天路上，说不定能再见。"',
    ],
    personalItem: { name: '观音紫竹叶', icon: '🌿', description: '观音菩萨所赠紫竹叶，可辨妖邪', sellPrice: 0 },
  },

  // ── 傲来国 ──"""
content = content.replace(old, new, 1)

# ── 8. 巡海夜叉 (aolai_nightpatrol) ──
old = """    tradeItems: [],
  },

  {
    id: 'dong_liu',"""
new = """    tradeItems: [],
    personalItem: { name: '夜叉牙', icon: '🦷', description: '巡海夜叉掉落的獠牙，有辟邪之效', sellPrice: 80 },
  },

  {
    id: 'dong_liu',"""
content = content.replace(old, new, 1)

# ── 9. 敖广 (donghai_aoguang) — personalItem + moralDialogues ──
old = """    uniqueDrop: {
      message: '敖广龙吟一声，周身金光大作，一枚通透的珠子从龙首中飞出，落入你掌心——那是龙宫镇海之宝。',
      equipment: {
        id: 'dinghai_pearl', name: '定海珠', type: 'accessory',
        tier: 10, rarity: 4,
        stats: { atk: 50, def: 200, hp: 800, crit: 5, critDmg: 20 },
      },
    },
  },

  // ── 花果山 ──"""
new = """    uniqueDrop: {
      message: '敖广龙吟一声，周身金光大作，一枚通透的珠子从龙首中飞出，落入你掌心——那是龙宫镇海之宝。',
      equipment: {
        id: 'dinghai_pearl', name: '定海珠', type: 'accessory',
        tier: 10, rarity: 4,
        stats: { atk: 50, def: 200, hp: 800, crit: 5, critDmg: 20 },
      },
    },
    personalItem: { name: '东海珊瑚枝', icon: '🐚', description: '龙宫珊瑚，至宝之一', sellPrice: 600 },
    moralDialogues: {
      good: ['贵客临东海！老夫备了珊瑚露一杯，不成敬意。'],
      neutral: ['泾河那边的事，听说了吧。玉帝降旨，斩了那老龙。'],
      evil: ['来我东海做什么？讨打的吗？'],
    },
  },

  // ── 花果山 ──"""
content = content.replace(old, new, 1)

# ── 10. 通背猿猴 (huaguo_tongbei) ──
old = """    uniqueDrop: {
      message: '通背猿猴长啸一声，从怀中摸出一个葫芦抛向你："老猿我酿了千年的玄天酒，今日便宜你了！"',
      equipment: {
        id: 'linghou_xuantian', name: '玄天酒', type: 'consumable',
        tier: 10, rarity: 4,
        stats: { atk: 100, def: 50, hp: 500, crit: 15, critDmg: 40 },
      },
    },
    tradeItems: [],
  },

  // ── 五指山 ──"""
new = """    uniqueDrop: {
      message: '通背猿猴长啸一声，从怀中摸出一个葫芦抛向你："老猿我酿了千年的玄天酒，今日便宜你了！"',
      equipment: {
        id: 'linghou_xuantian', name: '玄天酒', type: 'consumable',
        tier: 10, rarity: 4,
        stats: { atk: 100, def: 50, hp: 500, crit: 15, critDmg: 40 },
      },
    },
    tradeItems: [],
    personalItem: { name: '半熟蟠桃', icon: '🍑', description: '蟠桃会上遗落的半熟蟠桃，灵气尚存', sellPrice: 300 },
  },

  // ── 五指山 ──"""
content = content.replace(old, new, 1)

# ── 11. 崔珏 (diyu_cuijue) — personalItem + moralDialogues ──
old = """    uniqueDrop: {
      message: '崔珏提笔在虚空中写了一个"赦"字，一道金光没入你体内。他将判官笔往你面前一推："这支笔……老夫用不着了。"',
      equipment: {
        id: 'panguan_bi', name: '判官笔', type: 'weapon',
        tier: 10, rarity: 4,
        stats: { atk: 200, def: 50, hp: 300, crit: 10, critDmg: 30 },
      },
    },
  },

  // ── 万寿山 ──"""
new = """    uniqueDrop: {
      message: '崔珏提笔在虚空中写了一个"赦"字，一道金光没入你体内。他将判官笔往你面前一推："这支笔……老夫用不着了。"',
      equipment: {
        id: 'panguan_bi', name: '判官笔', type: 'weapon',
        tier: 10, rarity: 4,
        stats: { atk: 200, def: 50, hp: 300, crit: 10, critDmg: 30 },
      },
    },
    personalItem: { name: '判官朱笔', icon: '🖋️', description: '崔珏以朱笔定人生死', sellPrice: 500 },
    moralDialogues: {
      good: ['阁下阳寿尚足，且生前积德，来世必有好报。这笔……我替您收着。'],
      neutral: ['判官笔定生死，但我更愿替活人多写几笔福禄。'],
      evil: ['生死簿上阁下之名已被朱笔圈了三圈。多做善事，少杀生。'],
    },
  },

  // ── 万寿山 ──"""
content = content.replace(old, new, 1)

# ── 12. 高太公 (wusi_gao) ──
old = """    challengeReward: { exp: 25, gold: 30, message: '高太公连连作揖："多谢壮士！这包银两你拿着，路上买碗酒喝。"' },
    tradeItems: [],
  },

  // ── 万寿山 ──"""
new = """    challengeReward: { exp: 25, gold: 30, message: '高太公连连作揖："多谢壮士！这包银两你拿着，路上买碗酒喝。"' },
    tradeItems: [],
    personalItem: { name: '驱邪桃木符', icon: '📿', description: '高老庄桃木所制，可驱散邪祟', sellPrice: 100 },
  },

  // ── 万寿山 ──"""
content = content.replace(old, new, 1)

print("All existing NPC edits applied.")

# ── 13. Append 20 new NPCs before the export functions ──
new_npcs = """

  // ═══════════════════════════════════════
  // 妖族 NPC（12个）
  // ═══════════════════════════════════════

  {
    id: 'yaozu_huaniaoshou',
    name: '化羽鸮',
    title: '鹰族小妖',
    type: 'challenger',
    location: 'changan',
    avatarEmoji: '🦅',
    description: '一只修炼百年的鹰妖，化为人形时羽翼尚残留在肩后，\n目光锐利如刀，正盯着一名路过的行人。',
    greetings: [
      '站住！这片天是我鹰族的领地！',
      '你身上的气息……有仙气？不可能！一定是我的错觉！',
    ],
    chatDialogues: [
      '化羽鸮收拢翅膀，落在屋檐上："你们人族总说我们妖族邪恶，可我只是想在这山里安安静静修炼。是谁先来犯的？"',
      '"我见过很多自称正道的人，他们杀妖取丹，眼睛都不眨一下。你们和他们有什么不同？"',
      '"五百年前有个叫孙悟空的猴子妖王，打上了天庭。我们妖族都以为出头了，结果……"化羽鸮冷笑一声，"天庭一个巴掌，全压五行山下去了。"',
    ],
    challengeStats: { hp: 1500, atk: 70, def: 40 },
    challengeReward: { exp: 35, gold: 45, message: '化羽鸮狼狈逃入云层："你等着！我鹰族不会善罢甘休！"' },
    tradeItems: [],
    personalItem: { name: '鹰羽', icon: '🪶', description: '百年鹰妖的羽毛，轻盈坚韧', sellPrice: 50 },
  },

  {
    id: 'yaozu_baifushou',
    name: '白狐夫人',
    title: '狐族妖王',
    type: 'challenger',
    location: 'aolai',
    avatarEmoji: '🦊',
    description: '一个身着白衣的美艳妇人，举止优雅，\n身后隐约可见一条蓬松的白色狐尾。',
    greetings: [
      '这位公子/姑娘，相貌堂堂，不知可否进来喝杯茶？',
      '咯咯咯……来都来了，进来坐坐吧。',
    ],
    chatDialogues: [
      '白狐夫人纤手轻摇："五百年前那场大战，妖族死伤无数。玉帝一道圣旨，把我们这些不肯归附天庭的，全打成妖魔。"',
      '"我见过那孙悟空。他不是天生的大圣，是被逼出来的。我们妖族哪一个不是被逼上梁山的？"',
      '"人族的寿命太短了。你们一辈子忙忙碌碌，争名夺利，可曾想过天道是什么？"白狐夫人笑了，"天道就是——谁拳头大，谁说了算。"',
      '"你要杀我？好呀。"白狐夫人轻轻一笑，"只是我死之后，我的那些小狐狸们可就没了依靠。你忍心吗？"',
    ],
    challengeStats: { hp: 2800, atk: 120, def: 65 },
    challengeReward: { exp: 70, gold: 90, message: '白狐夫人身形一晃，化为一缕白烟消失在林间，只留下一地狐毛："你我缘分未尽，后会有期。"' },
    uniqueDrop: {
      message: '白狐夫人身形消散，一枚狐丹滚落掌心。',
      equipment: { id: 'hudan_baifeng', name: '白凤狐丹', type: 'consumable', tier: 8, rarity: 3, stats: { atk: 80, def: 80, hp: 400, crit: 10, critDmg: 25 } },
    },
    tradeItems: [],
    personalItem: { name: '狐尾围巾', icon: '🧣', description: '白狐夫人的围巾，带有淡淡妖气', sellPrice: 200 },
  },

  {
    id: 'yaozu_tuxiong',
    name: '土熊精',
    title: '熊族大力士',
    type: 'challenger',
    location: 'wuzhishan',
    avatarEmoji: '🐻',
    description: '一头足有两丈高的黑熊直立行走，\n拳头有如磨盘，双目如两盏红灯笼。',
    greetings: [
      '哈！又来一个！今天已经有三个猎户被我打跑了！',
      '你是来找我打架的还是来找我聊天的？都欢迎！',
    ],
    chatDialogues: [
      '土熊精拍了拍胸膛："我力气大，但我不想害人。这山里野兽多的是，我抓几只吃，管好自己的山头就行了。"',
      '"天蓬元帅被贬下凡间，投了猪胎的事你知道吗？"土熊精挠挠头，"我本来还指望他那天上的威风，带我们妖族翻身呢。结果……唉。"',
      '"那猴子大闹天宫的时候，我在花果山远远看过一眼。那场面……啧，我这辈子都忘不了。"土熊精的眼睛里竟有些神往。',
    ],
    challengeStats: { hp: 3200, atk: 110, def: 75 },
    challengeReward: { exp: 85, gold: 100, message: '土熊精一屁股坐在地上，喘着粗气："好汉！我服了！这件熊皮大氅你拿走！"' },
    tradeItems: [],
    personalItem: { name: '熊胆', icon: '💧', description: '百年土熊精的熊胆，可入药', sellPrice: 120 },
  },

  {
    id: 'yaozu_qingshe',
    name: '青鳞蛇姬',
    title: '蛇族美女',
    type: 'challenger',
    location: 'huaguo',
    avatarEmoji: '🐍',
    description: '一名绿衣女子立在溪边，\n裙下隐约可见一条青色的蛇尾在轻轻摆动。',
    greetings: [
      '公子……你来了……',
      '我等你很久了，你知道吗？',
    ],
    chatDialogues: [
      '青鳞蛇姬幽幽道："我本是一条修炼三百年的青蛇，那日路过这花果山，便不愿走了。这里山水灵秀，比我的老家好太多了。"',
      '"那猴子走之前，曾对我说：\'你这蛇妖，心地不坏，在此好好修炼，日后自有出头之日。\'"她掩嘴一笑，"我便信了，在这里等了几百年。"',
      '"你知道蛇族最怕什么吗？"青鳞蛇姬的目光忽然锐利起来，"是孤独。修炼的路太长了，长到你会忘记自己曾经是什么。"',
    ],
    challengeStats: { hp: 1600, atk: 85, def: 45 },
    challengeReward: { exp: 40, gold: 55, message: '青鳞蛇姬化回原形遁入溪中："公子好身手……我们还会再见的！"' },
    tradeItems: [],
    personalItem: { name: '蛇蜕', icon: '🐍', description: '百年青蛇的蜕皮，可解蛇毒', sellPrice: 60 },
  },

  {
    id: 'yaozu_hufu_lang',
    name: '狐族浪人',
    title: '流落妖兵',
    type: 'challenger',
    location: 'diyu',
    avatarEmoji: '🦊',
    description: '一个满脸风霜的狐妖，身上还穿着当年\n齐天大圣麾下的战袍残片。',
    greetings: [
      '……又见面了，还是老规矩，打一架再说？',
      '五百年前的旧账还没算清呢。',
    ],
    chatDialogues: [
      '狐族浪人苦笑道："当年大圣招兵买马，七十二洞妖王响应，我们这些小妖也跟着去闹天宫。结果天兵一来，跑得跑，降的降，降的都被收去做坐骑了。"',
      '"我从南天门一路杀到北天门，杀了七天七夜。最后呢？"他掀开残破的战袍，"身上挨了十七道天雷，侥幸没死，逃到了这里。"',
      '"你问我后不后悔？"狐族浪人摇摇头，"不后悔。那是我这辈子活得最像自己的七天。"',
    ],
    challengeStats: { hp: 2000, atk: 90, def: 55 },
    challengeReward: { exp: 55, gold: 70, message: '狐族浪人扔下一枚令牌："拿去吧，这是我当年在大圣军中的编号牌。"' },
    tradeItems: [],
    personalItem: { name: '妖军令牌', icon: '🎴', description: '五百年前齐天大圣妖军的令牌', sellPrice: 150 },
  },

  {
    id: 'yaozu_moyan_nv',
    name: '墨烟女妖',
    title: '黑山女妖',
    type: 'challenger',
    location: 'wanshou',
    avatarEmoji: '👩',
    description: '一个周身缠绕着黑烟的女子，\n面容绝美却透着诡异，\n每走一步，脚下便枯死一片草。',
    greetings: [
      '你来了……我等了很久。',
      '这山里没有别人。你是第一个。',
    ],
    chatDialogues: [
      '墨烟女妖："我原是万寿山下一户人家的女儿，生得美貌，被当地官员强抢为妾。我在新婚之夜悬梁自尽，死后怨气不散，便化为了妖。"',
      '"那镇元大仙本可以超度我，但他只顾着种他的果树，说我\'戾气太重，不值得救\'。"墨烟女妖的声音渐渐冰冷，"他大概是对的。"',
      '"你可知道，一个人绝望到极点的时候，会变成什么？"墨烟女妖轻轻笑了，"会变成我。"',
    ],
    challengeStats: { hp: 1800, atk: 100, def: 50 },
    challengeReward: { exp: 50, gold: 65, message: '墨烟女妖身形散入黑烟，只留下一缕墨香："你的灵魂……比我想象的要干净。"' },
    tradeItems: [],
    personalItem: { name: '怨气瓶', icon: '🧪', description: '墨烟女妖遗留的怨气，可怖邪物', sellPrice: 0 },
  },

  {
    id: 'yaozu_lao_song',
    name: '老松精',
    title: '千年树妖',
    type: 'flavor',
    location: 'huaguo',
    avatarEmoji: '🌲',
    description: '一棵千年古松化为人形，\n躯干虬结如龙，须发皆为松针，\n端坐于山巅一块巨石上。',
    greetings: [
      '小友，你来了。老朽在这山头站了一千二百年，你是第九千九百九十九个来客。',
      '前头那些，有些成了王侯将相，有些埋骨荒山。你嘛……且让我看看。',
    ],
    chatDialogues: [
      '老松精闭目道："我见过这块土地上所有王朝的兴衰更替。秦皇汉武，唐宗宋祖，在我眼里不过是朝生暮死的蜉蝣。"',
      '"那猴子是从我身旁的仙石里蹦出来的。我看着他学爬、学走、学跑、学打闹。"老松精笑了，"然后他漂洋过海去学艺，回来时已是大闹天宫的齐天大圣。"',
      '"天道循环，报应不爽。"老松精睁开眼，"那猴子被压五行山五百年，是报应。五百年后他护送取经人成佛，也是报应。你我，皆在报应之中。"',
      '"你想问我长生不老的秘诀？"老松精大笑，"秘诀就是——别动。别争。别想。凡事顺其自然，草木便能活千年。"',
    ],
    challengeStats: { hp: 4000, atk: 130, def: 90 },
    challengeReward: { exp: 110, gold: 130, message: '老松精微微点头："好，好。年轻人有这股锐气，不错。这根松枝你拿去，可挡百邪。"' },
    tradeItems: [],
    personalItem: { name: '千年松果', icon: '🌰', description: '老松精所结的松果，有灵气', sellPrice: 250 },
  },

  {
    id: 'yaozu_baozi_xie',
    name: '獐子小妖',
    title: '山间小妖',
    type: 'challenger',
    location: 'dong',
    avatarEmoji: '🦌',
    description: '一个矮小的獐子精，拿着根削尖的木棍，\n蹲在草丛里鬼鬼祟祟地张望。',
    greetings: [
      '别、别过来！我可是会咬人的！',
      '我只是路过……真的只是路过！',
    ],
    chatDialogues: [
      '獐子小妖抱着头蹲在地上："大王们总说我们獐子族没用，修炼也修不出名堂。可我只是想活下去而已啊！"',
      '"那些大妖吃人，我不吃。我就吃草、吃果子、吃蚂蚱。为什么他们还是要吃我？"獐子小妖哭丧着脸。',
    ],
    challengeStats: { hp: 800, atk: 40, def: 25 },
    challengeReward: { exp: 10, gold: 15, message: '獐子小妖一溜烟逃进树林："下次再找你玩！"' },
    tradeItems: [],
    personalItem: { name: '鹿角碎片', icon: '🦴', description: '小獐子精脱落的角，有微弱的灵气', sellPrice: 10 },
  },

  {
    id: 'yaozu_huashan_she',
    name: '华山蛇精',
    title: '华山妖蛇',
    type: 'challenger',
    location: 'yangguan',
    avatarEmoji: '🐲',
    description: '一条通体碧绿的巨蛇盘踞在华山山道上，\n蛇身足有水缸粗细，吐出的信子殷红如血。',
    greetings: [
      '嘶嘶嘶……又一个人来送死？',
      '这华山是我的地盘，谁来都得留下买路钱。',
    ],
    chatDialogues: [
      '华山蛇精冷笑道："西岳华山，五岳之首。天庭封我为华山山神，可那些神仙从来不把我当回事。"',
      '"你知道为什么华山这么险吗？"蛇精眯起眼睛，"是我一寸一寸堆出来的。天庭说是他们造的，我就让他们信了。"',
      '"人族的皇帝来祭山，封禅大典搞得热热闹闹。可他们祭的是天，不是山。"华山蛇精吐了吐信子，"天高皇帝远，可我就在这儿。"',
    ],
    challengeStats: { hp: 3500, atk: 145, def: 80 },
    challengeReward: { exp: 95, gold: 110, message: '华山蛇精缩回山洞深处："算你狠！这块蛇鳞你拿走，别再来烦我！"' },
    uniqueDrop: {
      message: '华山蛇精脱落的蛇鳞滚落山道，鳞片上隐隐有华山图纹。',
      equipment: { id: 'huashan_sheyu', name: '华山蛇蜕', type: 'armor', tier: 9, rarity: 3, stats: { atk: 30, def: 150, hp: 300, crit: 5, critDmg: 10 } },
    },
    tradeItems: [],
    personalItem: { name: '蛇胆', icon: '💚', description: '华山蛇精的胆，可解百毒', sellPrice: 180 },
  },

  {
    id: 'yaozu_liuhe_wolf',
    name: '青毛狮子怪',
    title: '狮驼岭三妖之一',
    type: 'challenger',
    location: 'wusizang',
    avatarEmoji: '🦁',
    description: '一头青毛巨狮，青面獠牙，\n张口便是一口吞下半座山的架势。',
    greetings: [
      '嘿嘿嘿……小东西，送上门来了？',
      '我青毛狮王的胃口，一向很好。',
    ],
    chatDialogues: [
      '青毛狮王得意洋洋："当年我和大鹏金翅雕、白象精占了狮驼岭，吃光了整整一个国家的人！那皇帝的宫殿，被我一爪子就拍平了！"',
      '"那孙悟空来挑战，我张开大口就把他吞了。"青毛狮王哈哈大笑，"可惜他在我肚子里闹，我只好吐了出来。换成别人，早被我消化成渣了！"',
      '"不过那猴子确实有两下子。他请了如来佛祖，才把我们三个收了。"青毛狮王缩了缩脖子，"佛祖的手段……不提也罢。"',
    ],
    challengeStats: { hp: 4500, atk: 170, def: 95 },
    challengeReward: { exp: 140, gold: 160, message: '青毛狮王被打得连连后退："你这小子有两下子！青山不改，绿水长流，咱们后会有期！"' },
    uniqueDrop: {
      message: '青毛狮王脱落的一绺青毛，坚硬如铁。',
      equipment: { id: 'qingmao_shimao', name: '青毛狮鬃', type: 'accessory', tier: 10, rarity: 4, stats: { atk: 100, def: 100, hp: 500, crit: 15, critDmg: 30 } },
    },
    tradeItems: [],
    personalItem: { name: '狮王牙', icon: '🦷', description: '青毛狮王的獠牙，坚硬无比', sellPrice: 300 },
  },

  {
    id: 'yaozu_niujun_lang',
    name: '牛魔王',
    title: '平天大圣',
    type: 'challenger',
    location: 'huaguo',
    avatarEmoji: '🐂',
    description: '一个身高三丈的牛头巨人，\n身着铠甲，手持混铁棍，\n坐在火焰山前的一方岩石上。',
    greetings: [
      '你是哪路神仙？报上名来！',
      '我牛魔王纵横三界的时候，你还没出生呢！',
    ],
    chatDialogues: [
      '牛魔王叹了口气："那猴子是我结拜兄弟，五百年前大闹天宫，我们一帮兄弟跟着他闹了个痛快。结果……他被压五行山，我被天兵围剿，家破人亡。"',
      '"我儿子红孩儿被观音收去做了善财童子。"牛魔王的眼眶竟有些发红，"我那铁扇公主妹妹，为了儿子，三借芭蕉扇……唉。"',
      '"那猴子后来护送取经人成正果，我呢？"牛魔王仰天长叹，"我不过是如来的坐骑，罢了。"',
      '"你来找我打架？"牛魔王站起身，"来吧。我这些年，正愁没人练手！"',
    ],
    challengeStats: { hp: 6000, atk: 250, def: 120 },
    challengeReward: { exp: 200, gold: 300, message: '牛魔王拄着混铁棍，单膝跪地："好汉！老夫服了！这根牛角你拿去，算我的敬意！"' },
    uniqueDrop: {
      message: '牛魔王断裂的一截牛角落入你手中，隐隐发烫——那是火焰山千年地火的余温。',
      equipment: { id: 'niumo_horn', name: '牛魔王角', type: 'weapon', tier: 11, rarity: 4, stats: { atk: 280, def: 60, hp: 400, crit: 20, critDmg: 50 } },
    },
    tradeItems: [],
    personalItem: { name: '混铁棍碎片', icon: '🔧', description: '牛魔王混铁棍的碎片，有万钧之力', sellPrice: 400 },
  },

  {
    id: 'yaozu_tianjiao_girl',
    name: '玉面狐狸',
    title: '万岁狐王之女',
    type: 'challenger',
    location: 'wuzhishan',
    avatarEmoji: '🐱',
    description: '一个倾国倾城的少女，肌肤胜雪，\n裙下偶尔露出毛茸茸的狐狸尾巴。',
    greetings: [
      '公子好生面熟……可是来寻我的？',
      '我家被那牛魔王占了，无处可去……',
    ],
    chatDialogues: [
      '玉面狐狸轻泣道："我父王是万岁狐王，积攒了无数金银。我招赘了牛魔王为夫，谁知他……他霸占了我的家产，赶走了我。"',
      '"你们人族有句话：\'仗义每多屠狗辈，负心多是读书人。\'这话放在妖族身上，也是一样。"玉面狐狸冷笑。',
      '"那铁扇公主恨我入骨，可她也不想想——是牛魔王自己来找我的。"玉面狐狸叹了口气，"这笔烂账，谁说得清呢？"',
    ],
    challengeStats: { hp: 1200, atk: 60, def: 35 },
    challengeReward: { exp: 30, gold: 40, message: '玉面狐狸化为一只小狐狸，窜入草丛不见了："公子若有心……后会有期。"' },
    tradeItems: [],
    personalItem: { name: '狐裘', icon: '🧥', description: '玉面狐狸的皮裘，轻柔温暖', sellPrice: 500 },
  },

  // ═══════════════════════════════════════
  // 仙族 NPC（8个）
  // ═══════════════════════════════════════

  {
    id: 'xianzu_guanyin',
    name: '观音菩萨',
    title: '南海普陀山紫竹林主',
    type: 'flavor',
    location: 'changan',
    avatarEmoji: '🪷',
    description: '一位手持净瓶杨柳的庄严女性形象，\n足踏金莲，周身祥云环绕，\n慈眉善目中透着无边智慧。',
    greetings: [
      '善哉善哉。施主与贫僧有缘。',
      '玄奘西去取经，一路艰难。你可愿助他一臂之力？',
    ],
    chatDialogues: [
      '"玄奘乃金蝉子转世，十世修行，这一世终成正果。"观音轻轻摇动净瓶，"可正果之前，他必须经历九九八十一难。少一难，便不得圆满。"',
      '"那孙悟空生性顽劣，当年大闹天宫，搅乱三界。"观音微微一笑，"可他也有一颗向佛之心。紧箍咒不是束缚，是渡他的舟。"',
      '"善恶一念间。施主今日的每一个选择，都在书写自己的命数。"观音将一粒种子放入你掌心，"这是善根种，播下便有收获。"',
      '"袁守城是聪明人，算尽了天机。可他终究是凡人，跳不出如来的掌心。"观音道，"你呢？"',
      '"那泾河龙王之死，是天意。袁守城不过是替天行道。"观音平静地说，"天意不可违，人心亦不可欺。你若明白了这个道理，西行路上便少些迷茫。"',
    ],
    challengeStats: { hp: 99999, atk: 9999, def: 9999 },
    challengeReward: { exp: 0, gold: 0, message: '观音轻轻一笑："施主勇气可嘉，只是贫僧这三界之内，还无人能伤。"她从净瓶中取出一片柳叶，"这柳叶送你，可保你一路平安。"' },
    uniqueDrop: {
      message: '观音柳叶轻拂你面，沁人心脾的清香笼罩周身。你感到一股温暖的力量在体内流转。',
      equipment: { id: 'guanyin_liuye', name: '观音柳叶', type: 'accessory', tier: 12, rarity: 4, stats: { atk: 100, def: 200, hp: 1000, crit: 10, critDmg: 30 } },
    },
    tradeItems: [],
    personalItem: { name: '观音玉净瓶柳枝', icon: '🌿', description: '观音菩萨净瓶中的杨柳枝，可净化一切邪气', sellPrice: 0 },
  },

  {
    id: 'xianzu_nezha',
    name: '哪吒三太子',
    title: '托塔天王李靖之子',
    type: 'challenger',
    location: 'changan',
    avatarEmoji: '🦭',
    description: '一个少年形象，脚踏风火轮，\n手执火尖枪，乾坤圈在腰间叮当作响。',
    greetings: [
      '你这凡人，见到本太子还不下跪？',
      '父亲总是说我闯祸，可他当年不也……哼，不提了！',
    ],
    chatDialogues: [
      '哪吒抱着火尖枪："我当年闹海，龙筋都给我抽了。我爹说我是逆子，可那些海里的妖精欺负人族的时候，天庭怎么不管？"',
      '"那猴子大闹天宫的时候，我和父亲奉旨捉他。"哪吒撇撇嘴，"他倒有点本事，居然和我打了个平手。"',
      '"你知道我为什么总踩风火轮吗？"哪吒低下头，"因为这样就不用看见那些不喜欢看的东西。比如我父亲的脸色。"',
    ],
    challengeStats: { hp: 5000, atk: 220, def: 110 },
    challengeReward: { exp: 180, gold: 250, message: '哪吒收起风火轮："有意思！你这小子有胆量！这枚混天绫碎片你拿走，是我当年闹海的纪念！"' },
    uniqueDrop: {
      message: '哪吒解下混天绫的一角递给你——那是一件曾缠住龙身的至宝。',
      equipment: { id: 'huntainling_fra', name: '混天绫残片', type: 'accessory', tier: 10, rarity: 4, stats: { atk: 80, def: 120, hp: 600, crit: 15, critDmg: 35 } },
    },
    tradeItems: [],
    personalItem: { name: '风火轮印', icon: '🔥', description: '哪吒三太子的风火轮留下的印迹', sellPrice: 300 },
  },

  {
    id: 'xianzu_taishang',
    name: '太白金星',
    title: '天庭信使',
    type: 'flavor',
    location: 'changan',
    avatarEmoji: '⭐',
    description: '一位白发白须的老仙人，\n手持拂尘，身着月白道袍，\n笑容和蔼，一团和气。',
    greetings: [
      '老朽太白，见过这位施主。',
      '天庭公务繁忙，老朽正要下凡透透气。',
    ],
    chatDialogues: [
      '太白金星捻着胡须笑道："那猴子被压五行山的时候，玉帝本想放他出来，是老朽劝住了。悟空啊悟空，性子太野，得磨。"',
      '"你知道天庭为什么叫天庭吗？"太白金星眨眨眼，"因为天上的神仙，也要讲道理。道理讲不通，就讲拳头。拳头大的说了算。"',
      '"那泾河龙王的事，老朽也听说了。"太白金星叹了口气，"袁守城那老道，算得太准了。准到让龙都害怕。这种人……要么成仙，要么成鬼。"',
      '"施主往西去，一路上会遇到很多神仙。有些是真心帮忙，有些是奉旨行事，有些……是在看戏。"太白金星笑了笑，"你看戏的时候，也得留个心眼。"',
    ],
    challengeStats: { hp: 2000, atk: 80, def: 60 },
    challengeReward: { exp: 60, gold: 80, message: '太白金星哈哈大笑，化为一道金光冲天而去，只留下一把拂尘："这拂尘送你，可扫清前路障碍！"' },
    tradeItems: [],
    personalItem: { name: '天庭令牌', icon: '🎫', description: '太白金星所赐天庭通行证，可觐见天颜', sellPrice: 0 },
  },

  {
    id: 'xianzu_yanluowang',
    name: '阎罗王',
    title: '阴司十殿之主',
    type: 'flavor',
    location: 'diyu',
    avatarEmoji: '👹',
    description: '一位面目威严的帝王，\n坐于阴森森的森罗殿上，\n两侧鬼卒林立，判官执笔。',
    greetings: [
      '阳寿未尽之人，竟敢擅闯阴司？',
      '崔珏！你怎么放人进来的？',
    ],
    chatDialogues: [
      '阎罗王拍案道："那孙悟空当年大闹地府，把我的生死簿撕了个稀烂！我十殿阎罗花了一百年才理清账目，那猴子……唉，不提也罢。"',
      '"你知道地府最怕什么吗？"阎罗王苦笑道，"不是妖魔鬼怪，是天庭的条条框框。每年要超度多少亡灵，要审理多少案子，玉帝都给你定好了。"',
      '"生死簿被那猴子毁了之后，我才知道——原来没有簿子，我们阎罗也不是什么都能管的。"阎罗王叹了口气，"天道无常，我们这些管天道的，也是如履薄冰。"',
    ],
    challengeStats: { hp: 6000, atk: 200, def: 110 },
    challengeReward: { exp: 150, gold: 200, message: '阎罗王大怒："来人！送客！"一阵阴风吹过，你被送出了地府。' },
    tradeItems: [],
    personalItem: { name: '阎罗令牌', icon: '🏷️', description: '阎罗王的令牌，可号令阴兵', sellPrice: 500 },
  },

  {
    id: 'xianzu_luoja',
    name: '骊山老母',
    title: '万灵之母',
    type: 'flavor',
    location: 'yangguan',
    avatarEmoji: '👵',
    description: '一位苍老却威严的女性，\n端坐于山巅，身边有各色灵兽环绕，\n仿佛是天地间一切生灵的守护者。',
    greetings: [
      '孩子，你来了。',
      '这世上的路有很多条，你选了一条最难走的。',
    ],
    chatDialogues: [
      '骊山老母慈祥地说："我见过这片土地上最早的生灵，也见过最后的消亡。天地轮回，万物更替，没有什么是永恒的。"',
      '"那白骨精变化了三次，被孙悟空打死了三次。"骊山老母叹了口气，"可她真的是妖吗？她只是想吃饱，想活下去。这世上的恶，有时不过是绝望的另一种名字。"',
      '"观音是我的弟子。如来也是我的晚辈。"骊山老母轻轻笑了，"可我从不干涉他们的决定。每个生灵，都有自己的路要走。"',
      '"你要问我如何看待这个世界？"骊山老母望向远方，"天地不仁，以万物为刍狗。可正因为如此，我们这些不仁之下的生灵，才更应相互扶持。"',
    ],
    challengeStats: { hp: 8888, atk: 180, def: 150 },
    challengeReward: { exp: 200, gold: 0, message: '骊山老母微微点头，从袖中取出一枚玉佩："拿着这个，见到观音时，她会知道是我让你去的。"' },
    uniqueDrop: {
      message: '骊山老母将一枚温润的玉佩放入你掌心，暖意瞬间传遍全身。',
      equipment: { id: 'lishan_yupei', name: '骊山玉佩', type: 'accessory', tier: 12, rarity: 4, stats: { atk: 50, def: 250, hp: 1200, crit: 5, critDmg: 20 } },
    },
    tradeItems: [],
    personalItem: { name: '骊山老母拂尘', icon: '🪭', description: '骊山老母的拂尘，可拂去一切迷障', sellPrice: 0 },
  },

  {
    id: 'xianzu_erlang',
    name: '二郎显圣真君',
    title: '灌江口守护神',
    type: 'challenger',
    location: 'huaguo',
    avatarEmoji: '🐕',
    description: '一位英武的青年神将，\n三只眼，牵着一只啸天犬，\n银甲在阳光下闪闪发光。',
    greetings: [
      '来者何人？报上名来！',
      '你这凡人闯到我灌江口来做什么？',
    ],
    chatDialogues: [
      '二郎神横枪而立："当年我与那猴子斗了三天三夜不分胜负。他的七十二变，我也有。他的筋斗云，我也不差。"',
      '"那猴子被压五行山后，天庭开了庆功宴。"二郎神冷笑一声，"我没去。那种胜之不武的胜利，不值得庆祝。"',
      '"你知道为什么我总带着啸天犬吗？"二郎神蹲下身，抚摸着哮天犬的头，"因为只有它，从来不把我当神看。它眼里，我就是它的主人。这么简单的信任……在天庭里反而是最稀罕的。"',
      '"你要和那猴子比？"二郎神来了兴致，"好！来吧！"',
    ],
    challengeStats: { hp: 7000, atk: 280, def: 130 },
    challengeReward: { exp: 250, gold: 350, message: '二郎神收枪而立，眼中竟有几分欣赏："好！你的身手，值得我认真出手。这枚三尖两刃刀碎片你拿走！"' },
    uniqueDrop: {
      message: '二郎神三尖两刃刀上的一枚刀镡脱落，入手竟微微震动——那是神器的一角。',
      equipment: { id: 'erlang_daoxin', name: '二郎刀镡', type: 'weapon', tier: 11, rarity: 4, stats: { atk: 260, def: 40, hp: 300, crit: 25, critDmg: 55 } },
    },
    tradeItems: [],
    personalItem: { name: '啸天犬毛', icon: '🐶', description: '哮天犬脱落的狗毛，灵气逼人', sellPrice: 100 },
  },

  {
    id: 'xianzu_panpan',
    name: '盘古',
    title: '开天辟地之神',
    type: 'flavor',
    location: 'huaguo',
    avatarEmoji: '🪓',
    description: '一位身披兽皮的巨人，\n手持巨斧，周身环绕混沌之气，\n只是静静地坐在那里，便如一座山岳。',
    greetings: [
      '……',
      '你看到我了？很久没有人能看到我了。',
    ],
    chatDialogues: [
      '盘古的声音如洪钟大吕："我开天辟地的时候，没有天，没有地，没有光，没有暗。唯一有的，是混沌。"',
      '"我用了一万八千年，才把混沌劈开。轻的上升为天，重的下沉为地。"盘古的目光深远，"可你知道最让我意外的是什么吗？是那些被我劈死的混沌生灵。"',
      '"天地初开时，有很多混沌中诞生的生灵。我为了开天地，不得不将他们一并毁灭。"盘古叹了口气，"这是我心中永远的遗憾。"',
      '"那猴子——灵明石猴——是从我的仙石里蹦出来的？"盘古露出一丝困惑，"我不记得了。太久了。但或许……万物的因缘，本就是相连的。"',
    ],
    challengeStats: { hp: 99999, atk: 9999, def: 9999 },
    challengeReward: { exp: 0, gold: 0, message: '盘古缓缓站起身，巨人般的身影遮蔽了天空："你的勇气……我收到了。这枚盘古斧的碎片你拿去——它或许会指引你找到答案。"' },
    uniqueDrop: {
      message: '一枚巨大的斧刃碎片从天而降，没入你的身体。你感到自己继承了开天辟地的力量的一角。',
      equipment: { id: 'pangu_axe', name: '盘古斧片', type: 'weapon', tier: 12, rarity: 4, stats: { atk: 500, def: 100, hp: 1000, crit: 30, critDmg: 100 } },
    },
    tradeItems: [],
    personalItem: { name: '混沌石', icon: '💎', description: '开天辟地前就存在的混沌石，天地之始', sellPrice: 0 },
  },

  {
    id: 'xianzu_laozi',
    name: '太上老君',
    title: '兜率宫之主',
    type: 'flavor',
    location: 'yangguan',
    avatarEmoji: '☯️',
    description: '一位白发苍苍的老者，\n骑着一头青牛，\n道袍飘飘，如仙人降临。',
    greetings: [
      '施主，贫道有礼了。',
      '兜率宫寂寞，今日难得有客。',
    ],
    chatDialogues: [
      '太上老君捋着胡须道："那猴子大闹天宫时，偷了我兜率宫的仙丹。他以为他占了便宜，却不知那些仙丹，本就是为他准备的。"',
      '"炼丹之道，在于'九转'。一转为尘，二转为灵，三转为神，九转之后，便是大道。"太上老君从袖中取出一枚丹药，"这一枚送你，可解百毒。"',
      '"那金箍棒是我八卦炉里炼的，那火眼金睛也是我炉子里烧出来的。"太上老君笑道，"那猴子以为他在反抗命运，却不知他的命运，也是我早就布好的棋局的一部分。"',
      '"道可道，非常道。你以为的偶然，不过是必然的伪装。"太上老君深深看了你一眼，"施主以为然否？"',
    ],
    challengeStats: { hp: 8000, atk: 240, def: 140 },
    challengeReward: { exp: 220, gold: 0, message: '太上老君轻轻一笑，骑牛而去，留下一枚九转金丹悬在半空："这金丹，你且拿去。"' },
    uniqueDrop: {
      message: '九转金丹落入你掌心，灼热之后是一股清凉。你感到五脏六腑都在震颤——这是道祖的丹药。',
      equipment: { id: 'jiuzhuan_dan', name: '九转金丹', type: 'consumable', tier: 12, rarity: 4, stats: { atk: 150, def: 150, hp: 2000, crit: 20, critDmg: 40 } },
    },
    tradeItems: [],
    personalItem: { name: '太极图残卷', icon: '☯️', description: '太上老君随身携带的太极图，蕴含无上道法', sellPrice: 0 },
  },

"""

# Insert new NPCs before export functions
marker = "\n// ── 导出函数 ──"
if marker in content:
    content = content.replace(marker, new_npcs + "\n" + marker, 1)
    print("New NPCs appended successfully.")
else:
    print("WARNING: Export function marker not found!")

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("Done. File written.")
