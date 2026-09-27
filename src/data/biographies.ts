/**
 * biographies — 列传（沉浸感 I5）
 * NPC 列传（kind:'npc'）、Boss 志（kind:'boss'）、地名志（kind:'place'）。
 * 解锁条件用 bond / tags / worldFlag；未解锁显示"尚未知悉此人底细"。
 * 写作铁律：此人何人 → 日常营生 → 一桩旧事 → 与玩家的关系走向。
 */
import type { BiographyDef } from '../types';

export const BIOGRAPHIES: BiographyDef[] = [
  // ═══════════ 长安城 NPC ═══════════
  { id: 'bio_blacksmith', subjectId: 'changan_blacksmith', kind: 'npc', unlock: {}, title: '老张头传', body: [
    '老张头，长安张记铁铺的掌柜，祖上三代打铁，是这西市口的老字号。',
    '他白日抡锤，夜里看炉，一辈子跟火打交道，性子也跟火一样直。凡经他手的刀剑，刃口都得淬上三遍火，少一遍都不肯交货。',
    '旧年随军铸过兵器，亲见太宗还是秦王时到铺里打过马槊，自此把"官家都信我的手艺"挂在嘴边。',
    '他手里有部《程氏铁谱》，是隋末程郑传下的祖谱，轻易不示人——若得他交心，这谱便是给你的信物。',
  ]},
  { id: 'bio_herbalist', subjectId: 'changan_herbalist', kind: 'npc', unlock: {}, title: '孙二娘传', body: [
    '孙二娘，回春堂药铺的掌柜，眉眼利落，抓药不差分毫。',
    '她祖上行医，手里有本不知传了几代的老方。金疮药、大补丹，都是她亲手炮制，长安城里跌打损伤的头一个找她。',
    '她与老张头是几十年的老邻居，两家铺子挨着，一个打铁一个抓药，把西市这条街盘得热热闹闹。',
    '她心里最软处是那些无钱抓药的穷苦人，常暗中赊账。与她交好，能得她一句"妾身信你"。',
  ]},
  { id: 'bio_tavern', subjectId: 'changan_tavern', kind: 'npc', unlock: {}, title: '胡姬传', body: [
    '胡姬，长安胡姬酒肆的老板娘，西域来的女儿，一口长安话说得比本地人还利索。',
    '她酿得一手好酒，高昌的葡萄酒、西域的三勒浆，都是经她手才在长安走俏。',
    '赵镖头是她的常客，也是她推不掉的一段旧情。这段纠葛，是长安西市最让人侧目的谈资。',
    '她面上嬉笑，心里门清，谁真心谁假意，一杯酒下肚便看得透。',
  ]},
  { id: 'bio_biaotou', subjectId: 'changan_biaotou', kind: 'npc', unlock: {}, title: '赵镖头传', body: [
    '赵镖头，龙门镖局的总镖头，一杆大枪走南闯北，是长安城里有名的狠角色。',
    '他重义气，也最记仇。镖局上下，凡他点头保的镖，从没出过岔子。',
    '他心系胡姬，偏又拉不下脸，只能三天两头往酒肆跑，喝到太阳落山才走。',
    '与他交恶，镖局的刀早晚要找上你；与他交好，长安的地界你尽可横着走。',
  ]},
  { id: 'bio_fortune', subjectId: 'changan_fortune', kind: 'npc', unlock: {}, title: '袁守城传', body: [
    '袁守城，长安城里最有名的卜卦先生，一卦千金，据说从没算错过。',
    '他常在城门口摆摊，闭目摇签，来人不必开口，他先说破你的来意。',
    '泾河龙王与他赌降雨时辰，输了，被魏征梦里斩龙——这一卦，改写了整个大唐的命数。',
    '他身后站着太多不可说的天机，与他深交，须提防自己也被算进那盘棋里。',
  ]},
  { id: 'bio_weizheng', subjectId: 'changan_weizheng', kind: 'npc', unlock: {}, title: '魏征传', body: [
    '魏征，大唐丞相，敢于犯颜直谏，太宗最倚重也最忌惮的人。',
    '他有一桩外人不尽知的本事——梦中斩龙。泾河龙王，就是他在梦里一剑斩的。',
    '唐王入冥，是魏征修书一封，托付地府判官崔珏，才添了二十年阳寿。',
    '他一生清正，眼里揉不得沙子。你在他面前，最好句句属实。',
  ]},
  { id: 'bio_tangwang', subjectId: 'changan_tangwang', kind: 'npc', unlock: {}, title: '唐太宗传', body: [
    '唐太宗李世民，大唐天子，贞观之治的开创者。',
    '他夜梦不宁，被泾河龙王的魂魄纠缠，是秦琼、尉迟敬德把守宫门，才得安寝。',
    '水陆大会是他一手发起，玄奘西行取经，也是他点头送行。',
    '与他论道，是天下士人的荣光；与他交恶，则是自绝于整个大唐。',
  ]},
  { id: 'bio_xuanzang', subjectId: 'changan_xuanzang', kind: 'npc', unlock: {}, title: '玄奘传', body: [
    '玄奘，大唐御弟，水陆大会的讲经法师，西行取经的发起人。',
    '他自幼出家，遍读佛典，却总觉得天竺真经才是究竟，于是发愿西行。',
    '观音菩萨赠他紫竹叶护身，唐王与他结为御弟，这一去，便是十万八千里。',
    '他一身佛骨，不涉红尘。与你结缘，必是前世有约。',
  ]},
  { id: 'bio_mysterious', subjectId: 'changan_mysterious', kind: 'npc', unlock: {}, title: '神秘老者传', body: [
    '没人知道这老者的来历，他总在长安城最不显眼的角落，裹着斗篷，像一截枯木。',
    '他手里有半部天机残卷，据说记载着凡人本不该知道的天数。',
    '他与袁守城有旧怨，与聂隐娘是半个故人。凡他想见的人，躲也躲不开；凡他想藏的事，掘也掘不出。',
    '他开口，必是给有缘人指一条路。信或不信，全在你。',
  ]},
  { id: 'bio_embroidery', subjectId: 'changan_embroidery', kind: 'npc', unlock: {}, title: '裴绣娘传', body: [
    '裴绣娘，云锦绣坊的老板娘，一双巧手，绣出的并蒂莲能引来蝴蝶。',
    '她飞针走线，一坐就是一整天，一件绣品九九八十一道线，少一道都不成。',
    '她是西市商会的人，与老张头、孙二娘抱团，最讲"和气生财"。',
    '她性子沉静，轻易不与人交心。你若能让她抬头一笑，便已得了她三分真心。',
  ]},
  { id: 'bio_gongsun', subjectId: 'changan_gongsun', kind: 'npc', unlock: {}, title: '公孙大娘传', body: [
    '公孙大娘，剑器舞的一代宗师，一舞剑器动四方。',
    '她说剑之极处，不在杀，在收；能出鞘而不伤人的剑，才配叫剑，所以她的剑，叫舞。',
    '她与赵镖头不对付，认定他那套刚猛刀法，接不住自己十剑。',
    '想学她的剑，先学她的心。她只收懂得"收"的人。',
  ]},
  { id: 'bio_qinqiong', subjectId: 'changan_qinqiong', kind: 'npc', unlock: {}, title: '秦琼传', body: [
    '秦琼，翼国公，大唐的左门神，一杆熟铜双锏，曾在万军之中取上将首级。',
    '他忠勇无双，太宗夜梦不宁时，与尉迟敬德把守宫门，一夜安寝，自此被民间奉为门神。',
    '他念旧，最重恩义，一句"此恩没齿难忘"挂在嘴边。',
    '与他相交，如饮烈酒，痛快；与他为敌，则如触猛虎逆鳞。',
  ]},
  { id: 'bio_nieyinniang', subjectId: 'changan_nieyinniang', kind: 'npc', unlock: { worldFlag: 'nieyinniang_unlocked' }, title: '聂隐娘传', body: [
    '聂隐娘，隐于市井的传奇女侠，来去无踪，江湖上只闻其名，不见其人。',
    '她随身一柄羊角匕首，削铁如泥；夜行千里，无人能察。',
    '她常在云锦绣坊附近出没，也常入魏征丞相府，是长安最神秘的一抹影。',
    '寻她者众，得见者稀。你若见过她一面，便已是天大的机缘。',
  ]},

  // ═══════════ 各方 NPC（精选代表作） ═══════════
  { id: 'bio_aoguang', subjectId: 'donghai_aoguang', kind: 'npc', unlock: {}, title: '敖广传', body: [
    '敖广，东海龙王，四海龙王之首，坐镇东海龙宫。',
    '五百年前，那猴子闹海，取走了定海神针，也搅得龙宫天翻地覆。',
    '他心结难解的是女婿泾河龙王之死——被袁守城设局，被魏征斩首。',
    '他面上威严，心里记仇，也记恩。与你往来，全看你的分寸。',
  ]},
  { id: 'bio_liuermihou', subjectId: 'huaguo_liuermihou', kind: 'npc', unlock: { worldFlag: 'liuermi_explored' }, title: '六耳猕猴传', body: [
    '六耳猕猴，与孙悟空一般无二的猴子，善聆音，能察理，知前后，万物皆明。',
    '他隐于水帘洞深处，真假难辨，是这天地间最吊诡的存在。',
    '他若现身，必是这世间有大事将起。',
  ]},
  { id: 'bio_niujun', subjectId: 'yaozu_niujun_lang', kind: 'npc', unlock: {}, title: '牛魔王传', body: [
    '牛魔王，平天大圣，妖界的一方霸主，力能移山。',
    '他与孙悟空是结拜兄弟，后因火焰山借扇之事反目。',
    '他有一妻铁扇公主，一子红孩儿，一妾玉面狐狸，家事比妖事还乱。',
    '与他交手，须先掂量自己扛不扛得住那一棍。',
  ]},
  { id: 'bio_guanyin', subjectId: 'xianzu_guanyin', kind: 'npc', unlock: {}, title: '观音传', body: [
    '观音菩萨，南海普陀山紫竹林之主，慈悲为怀，救苦救难。',
    '她点化玄奘西行，也暗中护佑取经一路。',
    '她手中杨柳枝，瓶中甘露水，可化世间一切苦厄。',
    '与她相遇，是一场机缘；听她一言，胜过十年苦修。',
  ]},
  { id: 'bio_nezha', subjectId: 'xianzu_nezha', kind: 'npc', unlock: {}, title: '哪吒传', body: [
    '哪吒三太子，托塔天王李靖之子，脚踩风火轮，手执火尖枪。',
    '他少年英雄，胆大包天，闹过东海，也助过天庭。',
    '他眼里揉不得沙子，最恨仗势欺人之辈。',
  ]},
  { id: 'bio_erlang', subjectId: 'xianzu_erlang', kind: 'npc', unlock: {}, title: '二郎显圣真君传', body: [
    '二郎神，灌江口的守护神，三尖两刃刀，哮天犬相随。',
    '他曾与孙悟空大战，难分胜负，是少有的能压大圣一头的神将。',
    '他法力高强，性情孤傲，等闲之辈入不得他眼。',
  ]},
  { id: 'bio_yanluo', subjectId: 'xianzu_yanluowang', kind: 'npc', unlock: {}, title: '阎罗王传', body: [
    '阎罗王，阴司十殿之主，执掌生死簿，定人生死。',
    '唐王入冥还阳，添了二十年阳寿，便是他经手。',
    '他铁面无私，也通人情，全看你对生死有几分敬畏。',
  ]},
  { id: 'bio_taishang', subjectId: 'xianzu_taishang', kind: 'npc', unlock: {}, title: '太白金星传', body: [
    '太白金星，天庭的信使，专司招安、传旨，一张嘴能把死人说活。',
    '他两次下界招安孙悟空，是这天地间最会说话的人。',
    '与他打交道，需留三分心眼，他的每句话都带着天机。',
  ]},
  { id: 'bio_laozi', subjectId: 'xianzu_laozi', kind: 'npc', unlock: {}, title: '太上老君传', body: [
    '太上老君，兜率宫之主，道祖，炼丹炼器，皆臻化境。',
    '那金箍棒、那火眼金睛，皆出自他手；连那猴子的大闹天宫，也是他棋盘上的一步。',
    '他看破一切，却从不点破。与他论道，是一场造化。',
  ]},
  { id: 'bio_cuijue', subjectId: 'diyu_cuijue', kind: 'npc', unlock: {}, title: '崔珏传', body: [
    '崔珏，地府判官，执掌生死簿，朱笔一勾，便定人生死。',
    '他生前是唐王之友，死后为阴司判官，是少有的阳间人也能见到的阴差。',
    '他手里那页生死簿残页，关乎每个人的命数。',
  ]},

  // ═══════════ Boss 志 ═══════════
  { id: 'bio_boss_aolai', subjectId: '九头精怪', kind: 'boss', unlock: {}, title: '九头精怪志', body: [
    '九头精怪，傲来国海域的妖物，九首九命，凶残狡诈。',
    '它潜伏于傲来国浅海，专吞过往渔船，为祸一方。',
    '传闻它本是一尾九头鲤鱼，吞了海中仙草，方成此怪。',
    '斩其九首，方可绝其性命；留一首，便会卷土重来。',
  ]},
  { id: 'bio_boss_datangdong', subjectId: '千年蛇魅', kind: 'boss', unlock: {}, title: '千年蛇魅志', body: [
    '千年蛇魅，盘踞大唐东的山岭，吸人精血，修炼千年。',
    '它化作人形时，美艳不可方物，专诱贪色之人入彀。',
    '传闻它曾与一僧人有旧，僧人圆寂后，它便遁入山林，再不入世。',
    '它最惧雄黄，也最恨负心人。',
  ]},
  { id: 'bio_boss_yangguan', subjectId: '突厥弩王', kind: 'boss', unlock: {}, title: '突厥弩王志', body: [
    '突厥弩王，西域边关的一代神射，百步穿杨，例无虚发。',
    '他麾下弩手纵横大漠，商旅闻之色变。',
    '传闻他曾一箭射落天上飞雁，也一箭射穿过大唐戍卒的咽喉。',
    '与他对敌，切莫暴露身形，否则那一箭便是你的了结。',
  ]},
  { id: 'bio_boss_datangnan', subjectId: '高丽密探', kind: 'boss', unlock: {}, title: '高丽密探志', body: [
    '高丽密探，潜入大唐南境的谍子，武艺高强，行踪诡秘。',
    '他身负使命，刺探大唐军情，为高丽王庭卖命。',
    '他精通易容，今日是货郎，明日是书生，防不胜防。',
    '识破他，须看他的眼——那双眼里，藏着一国的心事。',
  ]},
  { id: 'bio_boss_donghai', subjectId: '万年虾妖', kind: 'boss', unlock: {}, title: '万年虾妖志', body: [
    '万年虾妖，东海深处的老妖，甲壳坚逾精钢，双钳断金裂石。',
    '它活了万年，见惯了沧海桑田，性情暴戾。',
    '传闻它是龙宫旧臣，因触怒龙王被逐，从此在深海称霸。',
    '它的软肋在甲缝之间，须以巧破力。',
  ]},
  { id: 'bio_boss_huaguo', subjectId: '混世魔王', kind: 'boss', unlock: {}, title: '混世魔王志', body: [
    '混世魔王，花果山一带的妖王，趁孙悟空被压五行山时占了水帘洞。',
    '它欺软怕硬，专欺压山中猴精，后为孙悟空所败。',
    '它的残将流落傲来国，仍是当地一害。',
    '灭此妖，是为花果山除一旧患。',
  ]},
  { id: 'bio_boss_wuzhi', subjectId: '芦花精', kind: 'boss', unlock: {}, title: '芦花精志', body: [
    '芦花精，五指山一带的妖物，藏身芦花荡中，来去如风。',
    '它喜食生人，专在月夜出没，芦花一荡，便是人失踪的时候。',
    '传闻它本是一株芦花，受了山间怨气，方成精怪。',
    '白昼它最弱，入夜则凶性大发。',
  ]},
  { id: 'bio_boss_difu', subjectId: '无常', kind: 'boss', unlock: {}, title: '无常志', body: [
    '无常，地府勾魂使者，一黑一白，索命无形。',
    '它奉阴司之命，勾取将死之人的魂魄，铁链一响，性命难逃。',
    '它不是妖，是神；不是恶，是命。与它为敌，是与整个阴司为敌。',
    '生人见无常，非死即大病一场。',
  ]},
  { id: 'bio_boss_wusi', subjectId: '黄风大圣', kind: 'boss', unlock: {}, title: '黄风大圣志', body: [
    '黄风大圣，乌斯藏黄风岭的妖王，能吹三昧神风，飞沙走石。',
    '它本是灵山脚下的黄毛貂鼠，偷了琉璃盏的灯油，下界为妖。',
    '它的神风一旦吹起，天昏地暗，能迷了人眼，乱了人心。',
    '破它，须有定风之能。',
  ]},
  { id: 'bio_boss_wanshou', subjectId: '镇元大仙', kind: 'boss', unlock: {}, title: '镇元大仙志', body: [
    '镇元大仙，万寿山五庄观之主，地仙之祖，与三清平辈论交。',
    '他观中有人参果树，三千年一开花，三千年一结果，三千年方熟。',
    '他不是妖，是仙。与他交手，非为敌，是为那一个"缘"字。',
    '若能得他一句"小友"，便是天大的造化。',
  ]},

  // ═══════════ 妖族 / 仙族 / 各地 NPC（补充列传） ═══════════
  { id: 'bio_huanyu', subjectId: 'yaozu_huaniaoshou', kind: 'npc', unlock: {}, title: '化羽鸮传', body: ['化羽鸮，鹰族小妖，性情孤傲，一双利爪能碎金石。', '它栖于长安城外的峭壁，昼伏夜出，与人有几分旧怨。', '它的鹰羽轻盈坚韧，是制器的上等材料。'] },
  { id: 'bio_baifu', subjectId: 'yaozu_baifushou', kind: 'npc', unlock: {}, title: '白狐夫人传', body: ['白狐夫人，狐族妖王，道行高深，媚而不俗。', '她坐镇傲来国一带，狐子狐孙遍布，是妖族中有头有脸的人物。', '她的白凤狐丹，是妖族中人人觊觎的至宝。'] },
  { id: 'bio_tuxiong', subjectId: 'yaozu_tuxiong', kind: 'npc', unlock: {}, title: '土熊精传', body: ['土熊精，熊族大力士，力能扛鼎，皮糙肉厚。', '它盘踞五指山一带，靠山吃山，虽凶却也有几分憨直。', '它的熊胆是名贵药材，只是取之不易。'] },
  { id: 'bio_qingshe', subjectId: 'yaozu_qingshe', kind: 'npc', unlock: {}, title: '青鳞蛇姬传', body: ['青鳞蛇姬，蛇族美女，一条青鳞蛇修炼成形。', '她出没于花果山一带，眼波流转间，是致命的诱惑。', '她的蛇蜕可解百毒，是走江湖的保命之物。'] },
  { id: 'bio_hufu', subjectId: 'yaozu_hufu_lang', kind: 'npc', unlock: {}, title: '狐族浪人传', body: ['狐族浪人，流落地府的妖兵，曾是五百年前妖军的一员。', '大圣被压五行山后，妖军四散，它流落至此，成了孤魂野鬼般的游荡者。', '它手里那块妖军令牌，是那段旧日荣光的唯一凭证。'] },
  { id: 'bio_moyan', subjectId: 'yaozu_moyan_nv', kind: 'npc', unlock: {}, title: '墨烟女妖传', body: ['墨烟女妖，黑山女妖，一袭墨烟，怨气缠身。', '她出没于万寿山一带，见者多被其怨气所迷。', '她那只怨气瓶，是至阴至邪之物，等闲碰不得。'] },
  { id: 'bio_laosong', subjectId: 'yaozu_lao_song', kind: 'npc', unlock: {}, title: '老松精传', body: ['老松精，千年树妖，扎根花果山，见惯了山中春秋。', '它不喜杀伐，只愿守着脚下那方水土，看猴儿们嬉闹。', '它的千年松果，有几分灵气，是难得的灵物。'] },
  { id: 'bio_baozi', subjectId: 'yaozu_baozi_xie', kind: 'npc', unlock: {}, title: '獐子小妖传', body: ['獐子小妖，山间小妖，胆子不大，跑得却快。', '它在大唐东的山林里讨生活，见人就躲，见妖就跑。', '它脱落的鹿角碎片，还带着点微弱的灵气。'] },
  { id: 'bio_huashan', subjectId: 'yaozu_huashan_she', kind: 'npc', unlock: {}, title: '华山蛇精传', body: ['华山蛇精，华山妖蛇，盘踞于阳关之外的深山。', '它修炼多年，蜕皮如蜕甲，一身鳞片刀枪难入。', '它的蛇胆可解百毒，是边关一带人人求而不得的灵药。'] },
  { id: 'bio_liuhe', subjectId: 'yaozu_liuhe_wolf', kind: 'npc', unlock: {}, title: '青毛狮子怪传', body: ['青毛狮子怪，狮驼岭三妖之一，青毛覆身，威猛无匹。', '它与白象、大鹏结义，是西天路上最难缠的妖王之一。', '它的狮鬃坚韧如铁，是锻造神兵的上上之选。'] },
  { id: 'bio_tianjiao', subjectId: 'yaozu_tianjiao_girl', kind: 'npc', unlock: {}, title: '玉面狐狸传', body: ['玉面狐狸，万岁狐王之女，貌美而多情，是牛魔王的妾室。', '她出没于五指山一带，与铁扇公主争宠，闹得家宅不宁。', '她的狐裘轻柔温暖，是富贵人家的心头好。'] },
  { id: 'bio_luojia', subjectId: 'xianzu_luoja', kind: 'npc', unlock: {}, title: '骊山老母传', body: ['骊山老母，万灵之母，道行深不可测，与天地同寿。', '她常隐于阳关一带，点化有缘之人。', '她的拂尘可拂去一切迷障，玉佩则能护人周全。'] },
  { id: 'bio_pangu', subjectId: 'xianzu_panpan', kind: 'npc', unlock: {}, title: '盘古传', body: ['盘古，开天辟地之神，以身躯化为山川河岳。', '他早已不在这世间，只留下些许遗迹，供后人凭吊。', '他的盘古斧片，是天地初开时的神物，有开天之力。'] },
  { id: 'bio_gaotaigong', subjectId: 'wusi_gao', kind: 'npc', unlock: {}, title: '高太公传', body: ['高太公，高老庄的庄主，家道殷实，膝下无子。', '他为女儿招赘，却招来了猪八戒，闹出一场乌龙。', '他的桃木符可驱邪祟，是庄上祖传的护身之物。'] },
  { id: 'bio_qingfeng', subjectId: 'wanshou_qingfeng', kind: 'npc', unlock: {}, title: '清风道童传', body: ['清风，万寿山五庄观的道童，镇元大仙的弟子。', '他守着人参果树，却因孙悟空的推倒果树而受责。', '他的性子有几分傲气，是道观里出了名的机灵鬼。'] },
  { id: 'bio_tongbei', subjectId: 'huaguo_tongbei', kind: 'npc', unlock: {}, title: '通背猿猴传', body: ['通背猿猴，花果山四健将之一，白毛老猿，活了不知多少年。', '它辅佐孙悟空，是花果山的老臣。', '它的半熟蟠桃，是蟠桃会上遗落的灵物，灵气尚存。'] },
  { id: 'bio_chencheng', subjectId: 'wuzhi_chen', kind: 'npc', unlock: {}, title: '陈员外传', body: ['陈澄，陈家庄的员外，家境殷实，乐善好施。', '他与佛有缘，常施舍过路的僧人。', '他的庄上干粮，是赶路人最实在的口粮。'] },
];


export function biographyOf(subjectId: string): BiographyDef | undefined {
  return BIOGRAPHIES.find((b) => b.subjectId === subjectId);
}

export function biographiesOfKind(kind: 'npc' | 'boss' | 'place'): BiographyDef[] {
  return BIOGRAPHIES.filter((b) => b.kind === kind);
}
