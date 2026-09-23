/**
 * 物品与词条系统 — 物品静态目录（M1）
 * 固定名物：手工命名，带词条。M1 的 8 条词条均为 hold 触发（持在背包即生效）。
 * 存档只存 id → count，定义走这份静态数据；未知 id 在读取侧安全忽略。
 */
import type { ItemDef } from '../../types';

export const ITEM_DEFS: ItemDef[] = [
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
];

export const ITEM_DEF_BY_ID: Record<string, ItemDef> = Object.fromEntries(
  ITEM_DEFS.map((d) => [d.id, d]),
);

export function getItemDef(id: string): ItemDef | undefined {
  return ITEM_DEF_BY_ID[id];
}
