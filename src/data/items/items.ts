/**
 * 物品与词条系统 — 物品静态目录（M1）
 * 固定名物：手工命名，带词条。M1 的 8 条词条均为 hold 触发（持在背包即生效）。
 * 存档只存 id → count，定义走这份静态数据；未知 id 在读取侧安全忽略。
 */
import type { ItemDef } from '../../types';

export const ITEM_DEFS: ItemDef[] = [
  // ── 技能书（C5）：使用后学会对应技能，占用技能槽（上限见 data/skills 的 MAX_ACTIVE_SKILLS） ──
  // 高级武学秘籍（C8）：品级越高，招式的倍率/段数/附加效果越强
  { id: 'book_falling_petals', name: '落英剑法·剑谱', grade: 2, category: 'skillbook', price: 700, source: 'shop', skillId: 'falling_petals', effects: [], lore: '剑谱上画满飘落的桃花，每一片都是一剑。' },
  { id: 'book_mountain_fist', name: '崩山拳·拳经', grade: 2, category: 'skillbook', price: 0, source: 'drop', skillId: 'mountain_fist', effects: [], lore: '拳经开篇只有四字：拳出山崩。' },
  { id: 'book_calm_mind', name: '静心诀·残卷', grade: 2, category: 'skillbook', price: 660, source: 'shop', skillId: 'calm_mind', effects: [], lore: '残卷教你如何在一剑落下之前先安静下来。' },
  { id: 'book_five_thunder', name: '五雷正法·雷符', grade: 3, category: 'skillbook', price: 0, source: 'drop', skillId: 'five_thunder', effects: [], lore: '符上朱砂写着五个雷字，纸面至今发烫。' },
  { id: 'book_taiyi_sword', name: '太乙玄门剑·真解', grade: 4, category: 'skillbook', price: 0, source: 'drop', skillId: 'taiyi_sword', effects: [], lore: '真解共两页，字迹却是两个人的手笔。' },
  { id: 'book_taishang_forget', name: '太上忘情·仙箓', grade: 5, category: 'skillbook', price: 0, source: 'drop', skillId: 'taishang_forget', effects: [], lore: '仙箓无字，读它的人在读自己。' },
  { id: 'book_burst_rage', name: '狂怒·血书', grade: 3, category: 'skillbook', price: 520, source: 'shop', skillId: 'burst_rage', effects: [], lore: '书页被反复揉皱，边上写着"再快一点"。' },
  { id: 'book_whirlwind', name: '旋风斩·刀谱', grade: 2, category: 'skillbook', price: 300, source: 'drop', skillId: 'whirlwind', effects: [], lore: '刀谱画着一个人转了三圈，圈里全是别人的血。' },
  { id: 'book_mend', name: '回春诀·残页', grade: 2, category: 'skillbook', price: 280, source: 'shop', skillId: 'mend', effects: [], lore: '残页只有半句口诀，却够救人一命。' },
  { id: 'book_iron_shirt', name: '铁布衫·拳谱', grade: 2, category: 'skillbook', price: 260, source: 'shop', skillId: 'iron_shirt', effects: [], lore: '少林旧拓，纸页发黄，字口却依旧刚硬。' },
  { id: 'book_swift_step', name: '疾风步·残卷', grade: 2, category: 'skillbook', price: 220, source: 'drop', skillId: 'swift_step', effects: [], lore: '据说是一位剑客逃命时写下的心得。' },
  { id: 'book_tiger_fist', name: '伏虎劲·秘录', grade: 3, category: 'skillbook', price: 480, source: 'drop', skillId: 'tiger_fist', effects: [], lore: '拳法秘录，末页画着一只下山的虎。' },
  // ── B3：补齐「可学武学 = 有秘籍」的闭环，并救回 3 个此前定义了却拿不到的孤儿武学 ──
  { id: 'book_palm_shock', name: '震山掌·掌诀', grade: 1, category: 'skillbook', price: 240, source: 'shop', skillId: 'palm_shock', effects: [], lore: '掌诀只画了一双手，掌心却是空的。' },
  { id: 'book_palm_break', name: '金刚掌·掌经', grade: 2, category: 'skillbook', price: 560, source: 'shop', skillId: 'palm_break', effects: [], lore: '掌经扉页写着：掌不空落，落处见石裂。' },
  { id: 'book_palm_void', name: '无相劫指·指诀', grade: 4, category: 'skillbook', price: 0, source: 'drop', skillId: 'palm_void', effects: [], lore: '指诀无图，只有一行小字：指到空处，劫由心生。' },
  { id: 'book_fist_chain', name: '连环拳·拳谱', grade: 1, category: 'skillbook', price: 200, source: 'shop', skillId: 'fist_chain', effects: [], lore: '拳谱共三页，一页一拳，翻完了拳还没收。' },
  { id: 'book_fist_quake', name: '撼地拳·拳经', grade: 2, category: 'skillbook', price: 0, source: 'drop', skillId: 'fist_quake', effects: [], lore: '拳经末尾补着一句：力从地起，还之于地。' },
  { id: 'book_blade_wave', name: '断浪刀·刀谱', grade: 1, category: 'skillbook', price: 220, source: 'shop', skillId: 'blade_wave', effects: [], lore: '刀谱上画着一道横刀劈开的江面。' },
  { id: 'book_blade_execute', name: '斩魄刀·刀法', grade: 2, category: 'skillbook', price: 0, source: 'drop', skillId: 'blade_execute', effects: [], lore: '刀法只有一句：见血，再出刀。' },
  { id: 'book_sword_qi', name: '剑气纵横·剑诀', grade: 1, category: 'skillbook', price: 210, source: 'shop', skillId: 'sword_qi', effects: [], lore: '剑诀无剑，只有两行交错的墨痕。' },
  { id: 'book_art_frost', name: '玄冰咒·符箓', grade: 2, category: 'skillbook', price: 600, source: 'shop', skillId: 'art_frost', effects: [], lore: '符箓入手冰凉，朱砂却是热的。' },
  { id: 'book_golden_bell', name: '金钟罩·秘要', grade: 3, category: 'skillbook', price: 0, source: 'drop', skillId: 'golden_bell', effects: [], lore: '秘要据说出自少林，纸页被汗浸得发硬。' },
  { id: 'book_immovable_seal', name: '不动明王印·法印', grade: 4, category: 'skillbook', price: 0, source: 'drop', skillId: 'immovable_seal', effects: [], lore: '法印画在绢上，指尖抚过像是按在了山石上。' },
  { id: 'book_zhou_tian', name: '周天星斗·星图', grade: 5, category: 'skillbook', price: 0, source: 'drop', skillId: 'zhou_tian', effects: [], lore: '星图摊开占满一室，四象之位各有一笔剑痕。' },
  {
    id: 'travel_boots',
    name: '行脚快靴',
    grade: 2,
    category: 'keepsake',
    lore: '此物出自长安西市，鞋底暗纳行旅符，日行千里不显疲。',
    price: 320,
    source: 'shop',
    effects: [{ kind: 'travelDays', trigger: 'hold', value: 1 }],
  },
  {
    id: 'pathfinding_talisman',
    name: '识途罗盘符',
    grade: 1,
    category: 'keepsake',
    lore: '据说是老驿丞的传家物，行路时能多瞧见一程风光。',
    price: 180,
    source: 'shop',
    effects: [{ kind: 'revealExtra', trigger: 'hold', value: 1 }],
  },
  {
    id: 'gather_compass',
    name: '寻宝司南',
    grade: 3,
    category: 'keepsake',
    lore: '此物出自东海龙宫，所指之处，土膏地沃，采获更丰。',
    price: 680,
    source: 'gather',
    effects: [{ kind: 'gatherBonus', trigger: 'hold', value: 0.25 }],
  },
  {
    id: 'trade_seal',
    name: '通商腰牌',
    grade: 2,
    category: 'keepsake',
    lore: '西市商会所颁，凭此采买，掌柜多让几分利。',
    price: 420,
    source: 'npc',
    effects: [{ kind: 'shopPrice', trigger: 'hold', value: 0.1 }],
  },
  {
    id: 'hoard_rune',
    name: '囤积符篆',
    grade: 2,
    category: 'keepsake',
    lore: '此物出自长安当铺，售物时价高一成半。',
    price: 380,
    source: 'shop',
    effects: [{ kind: 'sellPrice', trigger: 'hold', value: 0.15 }],
  },
  {
    id: 'guard_jade',
    name: '护主灵玉',
    grade: 3,
    category: 'keepsake',
    lore: '温润如脂，危急时化气护体，减伤一成。',
    price: 720,
    source: 'drop',
    effects: [{ kind: 'damageCut', trigger: 'hold', value: 0.1 }],
  },
  {
    id: 'lifesteal_dagger',
    name: '饮血短匕',
    grade: 3,
    category: 'keepsake',
    lore: '刃上暗纹如饮血，伤人时反哺己身。',
    price: 760,
    source: 'steal',
    effects: [{ kind: 'lifesteal', trigger: 'hold', value: 0.1 }],
  },
  {
    id: 'compassion_beads',
    name: '慈悲念珠',
    grade: 2,
    category: 'keepsake',
    lore: '玄奘法师所赠旧物，日日诵持，善念自生。',
    price: 300,
    source: 'npc',
    effects: [{ kind: 'moralPerDay', trigger: 'hold', value: 1 }],
  },
  {
    id: 'healing_balm',
    name: '回春膏',
    grade: 1,
    category: 'consumable',
    lore: '孙二娘亲手熬制，敷于伤处，血止如初。',
    price: 90,
    source: 'npc',
    effects: [{ kind: 'heal', trigger: 'use', value: 60 }],
  },
  {
    id: 'enlighten_pill',
    name: '顿悟丹',
    grade: 2,
    category: 'consumable',
    lore: '云游僧所赠，服之灵台清明，一日千里。',
    price: 260,
    source: 'shop',
    effects: [{ kind: 'exp', trigger: 'use', value: 120 }],
  },
];

export const ITEM_DEF_BY_ID: Record<string, ItemDef> = Object.fromEntries(
  ITEM_DEFS.map((d) => [d.id, d]),
);

export function getItemDef(id: string): ItemDef | undefined {
  return ITEM_DEF_BY_ID[id];
}

/** 按来源筛名物（M3 获取途径铺开用） */
export function getItemsBySource(source: NonNullable<ItemDef['source']>): ItemDef[] {
  return ITEM_DEFS.filter((d) => d.source === source);
}
