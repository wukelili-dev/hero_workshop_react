import type { Monster, GameMap } from '../types';

// 所有怪物数据
export const MONSTERS: Record<string, Monster> = {
  // 傲来国 Lv.1-10
  '蝴蝶': { id: '蝴蝶', name: '蝴蝶', level: 1, hp: 35, atk: 8, def: 2, rarity: 0, expReward: 8, goldReward: 5, drops: [{ itemId: '皮革', chance: 1, quantity: [1, 1] }] },
  '鹦鹉': { id: '鹦鹉', name: '鹦鹉', level: 3, hp: 55, atk: 12, def: 3, rarity: 0, expReward: 12, goldReward: 8, drops: [{ itemId: '皮革', chance: 1, quantity: [1, 1] }] },
  '龙虾': { id: '龙虾', name: '龙虾', level: 5, hp: 85, atk: 18, def: 5, rarity: 0, expReward: 20, goldReward: 15, drops: [{ itemId: '皮革', chance: 1, quantity: [2, 2] }] },
  '巨蟹': { id: '巨蟹', name: '巨蟹', level: 8, hp: 130, atk: 25, def: 8, rarity: 0, expReward: 35, goldReward: 25, drops: [{ itemId: '皮革', chance: 1, quantity: [2, 2] }, { itemId: '铁矿', chance: 0.5, quantity: [1, 1] }] },
  '九头精怪': { id: '九头精怪', name: '九头精怪', level: 10, hp: 400, atk: 35, def: 15, rarity: 1, expReward: 100, goldReward: 80, drops: [{ itemId: '皮革', chance: 1, quantity: [5, 5] }, { itemId: '铁矿', chance: 1, quantity: [3, 3] }, { itemId: '木材', chance: 1, quantity: [5, 5] }], isBoss: true },
  // 大唐东 Lv.11-15
  '太监': { id: '太监', name: '太监', level: 11, hp: 180, atk: 35, def: 12, rarity: 1, expReward: 45, goldReward: 35, drops: [{ itemId: '皮革', chance: 1, quantity: [2, 2] }, { itemId: '铁矿', chance: 0.5, quantity: [1, 1] }] },
  '失控的银甲唐兵': { id: '失控的银甲唐兵', name: '失控的银甲唐兵', level: 12, hp: 240, atk: 42, def: 18, rarity: 1, expReward: 60, goldReward: 45, drops: [{ itemId: '铁矿', chance: 1, quantity: [3, 3] }] },
  '失控的金甲唐兵': { id: '失控的金甲唐兵', name: '失控的金甲唐兵', level: 13, hp: 320, atk: 50, def: 22, rarity: 1, expReward: 80, goldReward: 60, drops: [{ itemId: '铁矿', chance: 1, quantity: [4, 4] }] },
  '唐兵统领': { id: '唐兵统领', name: '唐兵统领', level: 15, hp: 420, atk: 58, def: 28, rarity: 1, expReward: 100, goldReward: 80, drops: [{ itemId: '铁矿', chance: 1, quantity: [5, 5] }, { itemId: '皮革', chance: 1, quantity: [3, 3] }] },
  '千年蛇魅': { id: '千年蛇魅', name: '千年蛇魅', level: 15, hp: 850, atk: 72, def: 35, rarity: 2, expReward: 200, goldReward: 150, drops: [{ itemId: '皮革', chance: 1, quantity: [8, 8] }, { itemId: '铁矿', chance: 1, quantity: [6, 6] }, { itemId: '木材', chance: 1, quantity: [4, 4] }], isBoss: true },
  // 阳关 Lv.15-20
  '突厥弩手': { id: '突厥弩手', name: '突厥弩手', level: 15, hp: 380, atk: 65, def: 25, rarity: 1, expReward: 90, goldReward: 70, drops: [{ itemId: '木材', chance: 1, quantity: [3, 3] }, { itemId: '铁矿', chance: 0.5, quantity: [2, 2] }] },
  '波斯女刀客': { id: '波斯女刀客', name: '波斯女刀客', level: 17, hp: 450, atk: 72, def: 28, rarity: 1, expReward: 110, goldReward: 85, drops: [{ itemId: '皮革', chance: 1, quantity: [4, 4] }, { itemId: '铁矿', chance: 1, quantity: [3, 3] }] },
  '突厥弩王': { id: '突厥弩王', name: '突厥弩王', level: 20, hp: 950, atk: 85, def: 35, rarity: 2, expReward: 250, goldReward: 200, drops: [{ itemId: '木材', chance: 1, quantity: [8, 8] }, { itemId: '铁矿', chance: 1, quantity: [6, 6] }, { itemId: '皮革', chance: 1, quantity: [5, 5] }], isBoss: true },
  '波斯刺客': { id: '波斯刺客', name: '波斯刺客', level: 20, hp: 750, atk: 95, def: 30, rarity: 2, expReward: 220, goldReward: 180, drops: [{ itemId: '皮革', chance: 1, quantity: [8, 8] }, { itemId: '铁矿', chance: 1, quantity: [5, 5] }], isBoss: true },
  // 大唐南 Lv.20-25
  '绝色剑客': { id: '绝色剑客', name: '绝色剑客', level: 20, hp: 480, atk: 78, def: 30, rarity: 2, expReward: 120, goldReward: 95, drops: [{ itemId: '皮革', chance: 1, quantity: [3, 3] }, { itemId: '铁矿', chance: 0.5, quantity: [2, 2] }] },
  '江州衙役': { id: '江州衙役', name: '江州衙役', level: 22, hp: 560, atk: 85, def: 35, rarity: 2, expReward: 140, goldReward: 110, drops: [{ itemId: '铁矿', chance: 1, quantity: [4, 4] }, { itemId: '木材', chance: 0.5, quantity: [2, 2] }] },
  '风流剑客': { id: '风流剑客', name: '风流剑客', level: 25, hp: 650, atk: 92, def: 32, rarity: 2, expReward: 165, goldReward: 130, drops: [{ itemId: '铁矿', chance: 1, quantity: [4, 4] }, { itemId: '皮革', chance: 1, quantity: [3, 3] }] },
  '高丽密探': { id: '高丽密探', name: '高丽密探', level: 25, hp: 1200, atk: 108, def: 42, rarity: 2, expReward: 300, goldReward: 240, drops: [{ itemId: '皮革', chance: 1, quantity: [8, 8] }, { itemId: '铁矿', chance: 1, quantity: [7, 7] }, { itemId: '木材', chance: 1, quantity: [5, 5] }], isBoss: true },
  // 东海 Lv.25-30
  '巡海夜叉': { id: '巡海夜叉', name: '巡海夜叉', level: 25, hp: 600, atk: 92, def: 38, rarity: 2, expReward: 160, goldReward: 130, drops: [{ itemId: '皮革', chance: 1, quantity: [5, 5] }, { itemId: '铁矿', chance: 0.5, quantity: [4, 4] }] },
  '龟丞相': { id: '龟丞相', name: '龟丞相', level: 27, hp: 750, atk: 75, def: 55, rarity: 2, expReward: 180, goldReward: 150, drops: [{ itemId: '皮革', chance: 1, quantity: [6, 6] }, { itemId: '木材', chance: 1, quantity: [5, 5] }] },
  '螺精': { id: '螺精', name: '螺精', level: 29, hp: 550, atk: 105, def: 30, rarity: 2, expReward: 150, goldReward: 120, drops: [{ itemId: '皮革', chance: 1, quantity: [4, 4] }, { itemId: '木材', chance: 1, quantity: [4, 4] }] },
  '万年虾妖': { id: '万年虾妖', name: '万年虾妖', level: 28, hp: 1400, atk: 115, def: 45, rarity: 3, expReward: 420, goldReward: 360, drops: [{ itemId: '皮革', chance: 1, quantity: [12, 12] }, { itemId: '铁矿', chance: 1, quantity: [10, 10] }], isBoss: true },
  '梵天罗刹': { id: '梵天罗刹', name: '梵天罗刹', level: 30, hp: 1200, atk: 135, def: 40, rarity: 3, expReward: 380, goldReward: 340, drops: [{ itemId: '皮革', chance: 1, quantity: [14, 14] }, { itemId: '铁矿', chance: 1, quantity: [9, 9] }, { itemId: '木材', chance: 1, quantity: [8, 8] }], isBoss: true },
  '嗜血妖螺': { id: '嗜血妖螺', name: '嗜血妖螺', level: 30, hp: 1000, atk: 150, def: 35, rarity: 3, expReward: 360, goldReward: 320, drops: [{ itemId: '皮革', chance: 1, quantity: [10, 10] }, { itemId: '铁矿', chance: 1, quantity: [12, 12] }], isBoss: true },
  // 花果山 Lv.30-35
  '猴枪兵': { id: '猴枪兵', name: '猴枪兵', level: 30, hp: 800, atk: 110, def: 42, rarity: 2, expReward: 200, goldReward: 160, drops: [{ itemId: '木材', chance: 1, quantity: [4, 4] }, { itemId: '铁矿', chance: 0.5, quantity: [3, 3] }] },
  '猴刀兵': { id: '猴刀兵', name: '猴刀兵', level: 32, hp: 900, atk: 120, def: 45, rarity: 2, expReward: 230, goldReward: 185, drops: [{ itemId: '铁矿', chance: 1, quantity: [5, 5] }, { itemId: '木材', chance: 0.5, quantity: [3, 3] }] },
  '赤尻马猴': { id: '赤尻马猴', name: '赤尻马猴', level: 34, hp: 1000, atk: 105, def: 55, rarity: 2, expReward: 250, goldReward: 200, drops: [{ itemId: '铁矿', chance: 1, quantity: [5, 5] }, { itemId: '皮革', chance: 1, quantity: [4, 4] }] },
  '混世魔王': { id: '混世魔王', name: '混世魔王', level: 35, hp: 2200, atk: 155, def: 60, rarity: 3, expReward: 650, goldReward: 520, drops: [{ itemId: '铁矿', chance: 1, quantity: [12, 12] }, { itemId: '木材', chance: 1, quantity: [12, 12] }, { itemId: '皮革', chance: 1, quantity: [8, 8] }], isBoss: true },
  // 五指山 Lv.35-40
  '刁蛮女': { id: '刁蛮女', name: '刁蛮女', level: 35, hp: 1000, atk: 130, def: 48, rarity: 3, expReward: 260, goldReward: 210, drops: [{ itemId: '皮革', chance: 1, quantity: [5, 5] }, { itemId: '木材', chance: 0.5, quantity: [3, 3] }] },
  '好色僧人': { id: '好色僧人', name: '好色僧人', level: 37, hp: 1100, atk: 125, def: 55, rarity: 3, expReward: 280, goldReward: 225, drops: [{ itemId: '皮革', chance: 1, quantity: [5, 5] }, { itemId: '铁矿', chance: 0.5, quantity: [4, 4] }] },
  '强盗': { id: '强盗', name: '强盗', level: 39, hp: 1050, atk: 135, def: 50, rarity: 3, expReward: 270, goldReward: 215, drops: [{ itemId: '铁矿', chance: 1, quantity: [5, 5] }, { itemId: '木材', chance: 0.5, quantity: [3, 3] }] },
  '芦花精': { id: '芦花精', name: '芦花精', level: 40, hp: 2800, atk: 175, def: 70, rarity: 3, expReward: 900, goldReward: 720, drops: [{ itemId: '木材', chance: 1, quantity: [15, 15] }, { itemId: '皮革', chance: 1, quantity: [12, 12] }, { itemId: '铁矿', chance: 1, quantity: [13, 13] }], isBoss: true },
  // 地府 Lv.40-45
  '酒鬼': { id: '酒鬼', name: '酒鬼', level: 40, hp: 1200, atk: 145, def: 52, rarity: 3, expReward: 310, goldReward: 250, drops: [{ itemId: '铁矿', chance: 1, quantity: [5, 5] }, { itemId: '木材', chance: 0.5, quantity: [4, 4] }] },
  '赌鬼': { id: '赌鬼', name: '赌鬼', level: 42, hp: 1150, atk: 155, def: 48, rarity: 3, expReward: 300, goldReward: 240, drops: [{ itemId: '铁矿', chance: 1, quantity: [6, 6] }, { itemId: '皮革', chance: 0.5, quantity: [4, 4] }] },
  '尾生': { id: '尾生', name: '尾生', level: 44, hp: 1300, atk: 140, def: 58, rarity: 3, expReward: 330, goldReward: 265, drops: [{ itemId: '木材', chance: 1, quantity: [6, 6] }, { itemId: '铁矿', chance: 0.5, quantity: [4, 4] }] },
  '无常': { id: '无常', name: '无常', level: 45, hp: 3200, atk: 190, def: 75, rarity: 4, expReward: 1100, goldReward: 880, drops: [{ itemId: '铁矿', chance: 1, quantity: [16, 16] }, { itemId: '木材', chance: 1, quantity: [14, 14] }, { itemId: '皮革', chance: 1, quantity: [18, 18] }], isBoss: true },
  // 乌斯藏 Lv.45-55
  '熊罴': { id: '熊罴', name: '熊罴', level: 45, hp: 1500, atk: 165, def: 65, rarity: 3, expReward: 380, goldReward: 310, drops: [{ itemId: '皮革', chance: 1, quantity: [7, 7] }, { itemId: '铁矿', chance: 0.5, quantity: [5, 5] }] },
  '鸟精': { id: '鸟精', name: '鸟精', level: 47, hp: 1350, atk: 180, def: 55, rarity: 3, expReward: 360, goldReward: 290, drops: [{ itemId: '皮革', chance: 1, quantity: [6, 6] }, { itemId: '木材', chance: 0.5, quantity: [5, 5] }] },
  '虎先锋': { id: '虎先锋', name: '虎先锋', level: 50, hp: 1600, atk: 175, def: 68, rarity: 4, expReward: 400, goldReward: 330, drops: [{ itemId: '铁矿', chance: 1, quantity: [7, 7] }, { itemId: '皮革', chance: 0.5, quantity: [5, 5] }] },
  '山神': { id: '山神', name: '山神', level: 52, hp: 1800, atk: 155, def: 80, rarity: 4, expReward: 420, goldReward: 350, drops: [{ itemId: '木材', chance: 1, quantity: [8, 8] }, { itemId: '铁矿', chance: 0.5, quantity: [6, 6] }] },
  '黄风大圣': { id: '黄风大圣', name: '黄风大圣', level: 55, hp: 4000, atk: 220, def: 90, rarity: 4, expReward: 1500, goldReward: 1200, drops: [{ itemId: '铁矿', chance: 1, quantity: [20, 20] }, { itemId: '木材', chance: 1, quantity: [18, 18] }, { itemId: '皮革', chance: 1, quantity: [20, 20] }], isBoss: true },
  // 万寿山 Lv.55+
  '人参娃娃': { id: '人参娃娃', name: '人参娃娃', level: 55, hp: 2000, atk: 200, def: 75, rarity: 4, expReward: 480, goldReward: 400, drops: [{ itemId: '木材', chance: 1, quantity: [8, 8] }, { itemId: '铁矿', chance: 0.5, quantity: [6, 6] }] },
  '五庄道童': { id: '五庄道童', name: '五庄道童', level: 57, hp: 2200, atk: 210, def: 82, rarity: 4, expReward: 520, goldReward: 440, drops: [{ itemId: '铁矿', chance: 1, quantity: [9, 9] }, { itemId: '木材', chance: 0.5, quantity: [7, 7] }] },
  '骷髅怪': { id: '骷髅怪', name: '骷髅怪', level: 59, hp: 1900, atk: 230, def: 68, rarity: 4, expReward: 500, goldReward: 420, drops: [{ itemId: '皮革', chance: 1, quantity: [9, 9] }, { itemId: '铁矿', chance: 0.5, quantity: [7, 7] }] },
  '镇元大仙': { id: '镇元大仙', name: '镇元大仙', level: 60, hp: 5500, atk: 270, def: 110, rarity: 4, expReward: 2200, goldReward: 1700, drops: [{ itemId: '铁矿', chance: 1, quantity: [25, 25] }, { itemId: '木材', chance: 1, quantity: [22, 22] }, { itemId: '皮革', chance: 1, quantity: [25, 25] }], isBoss: true },
};

// 地图数据
export const MAPS: GameMap[] = [
  { id: 'changan', name: '长安', minLevel: 0, unlockCost: 0, monsters: [], boss: MONSTERS['蝴蝶'], description: '大唐国都，天下繁华之所', isCity: true },
  { id: 'aolai', name: '傲来国', minLevel: 1, unlockCost: 0, monsters: [MONSTERS['蝴蝶'], MONSTERS['鹦鹉'], MONSTERS['龙虾'], MONSTERS['巨蟹']], boss: MONSTERS['九头精怪'] },
  { id: 'datangdong', name: '大唐东', minLevel: 11, unlockCost: 500, monsters: [MONSTERS['太监'], MONSTERS['失控的银甲唐兵'], MONSTERS['失控的金甲唐兵'], MONSTERS['唐兵统领']], boss: MONSTERS['千年蛇魅'] },
  { id: 'yangguan', name: '阳关', minLevel: 15, unlockCost: 1000, monsters: [MONSTERS['突厥弩手'], MONSTERS['波斯女刀客']], boss: MONSTERS['突厥弩王'] },
  { id: 'datangnan', name: '大唐南', minLevel: 20, unlockCost: 1500, monsters: [MONSTERS['绝色剑客'], MONSTERS['江州衙役'], MONSTERS['风流剑客']], boss: MONSTERS['高丽密探'] },
  { id: 'donghai', name: '东海', minLevel: 25, unlockCost: 3000, monsters: [MONSTERS['巡海夜叉'], MONSTERS['龟丞相'], MONSTERS['螺精']], boss: MONSTERS['万年虾妖'] },
  { id: 'huaguoshan', name: '花果山', minLevel: 30, unlockCost: 6000, monsters: [MONSTERS['猴枪兵'], MONSTERS['猴刀兵'], MONSTERS['赤尻马猴']], boss: MONSTERS['混世魔王'] },
  { id: 'wuzhishan', name: '五指山', minLevel: 35, unlockCost: 12000, monsters: [MONSTERS['刁蛮女'], MONSTERS['好色僧人'], MONSTERS['强盗']], boss: MONSTERS['芦花精'] },
  { id: 'difu', name: '地府', minLevel: 40, unlockCost: 25000, monsters: [MONSTERS['酒鬼'], MONSTERS['赌鬼'], MONSTERS['尾生']], boss: MONSTERS['无常'] },
  { id: 'wusizang', name: '乌斯藏', minLevel: 45, unlockCost: 35000, monsters: [MONSTERS['熊罴'], MONSTERS['鸟精'], MONSTERS['虎先锋'], MONSTERS['山神']], boss: MONSTERS['黄风大圣'] },
  { id: 'wanshoushan', name: '万寿山', minLevel: 55, unlockCost: 60000, monsters: [MONSTERS['人参娃娃'], MONSTERS['五庄道童'], MONSTERS['骷髅怪']], boss: MONSTERS['镇元大仙'] },
];
