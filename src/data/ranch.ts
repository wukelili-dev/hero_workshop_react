export interface RanchCreature {
  id: string;
  name: string;
  icon: string;
  desc: string;
  rarity: number;
  price: number;
  feedCost: number;
  personality: string;
  outputType: string;
  outputDesc: string;
  growthStages: number[];
  special: string;
}

export const RANCH_CATALOG: RanchCreature[] = [
  // 白品质 (rarity=0) 11种
  { id: "rabbit_white", name: "霜绒兔", icon: "🐰", desc: "霜白绒软，灵韵初生", rarity: 0, price: 10, feedCost: 5, personality: "乖巧", outputType: "霜绒", outputDesc: "霜绒×1（乖巧+20%）", growthStages: [], special: "" },
  { id: "rabbit_cotton", name: "云绒兽", icon: "🐇", desc: "如云似绒，柔若无骨", rarity: 0, price: 15, feedCost: 8, personality: "乖巧", outputType: "兔绒", outputDesc: "兔绒×1（乖巧+20%）", growthStages: [], special: "" },
  { id: "frog_jump", name: "碧蟾", icon: "🐸", desc: "碧色如玉，跳掷如簧", rarity: 0, price: 8, feedCost: 4, personality: "活泼", outputType: "蟾露", outputDesc: "蟾露×1（活泼+15%）", growthStages: [], special: "" },
  { id: "kitty_gray", name: "玄猫", icon: "🐱", desc: "玄黑灵猫，目光幽邃", rarity: 0, price: 12, feedCost: 6, personality: "乖巧", outputType: "玄丝", outputDesc: "玄丝×1（乖巧+20%）", growthStages: [], special: "" },
  { id: "pup_brown", name: "玄犬", icon: "🐶", desc: "玄毛护主，忠诚无二", rarity: 0, price: 15, feedCost: 8, personality: "忠诚", outputType: "玄毫", outputDesc: "玄毫×1（忠诚+15%）", growthStages: [], special: "" },
  { id: "chick_yellow", name: "赤凤", icon: "🐤", desc: "赤羽如火，凤仪初显", rarity: 0, price: 8, feedCost: 4, personality: "活泼", outputType: "凤卵", outputDesc: "凤卵×1（活泼+15%）", growthStages: [], special: "" },
  { id: "chick_white", name: "素羽鸡", icon: "🐔", desc: "素羽如雪，清雅不凡", rarity: 0, price: 12, feedCost: 6, personality: "乖巧", outputType: "凤卵", outputDesc: "凤卵×1（乖巧+20%）", growthStages: [], special: "" },
  { id: "duck_yellow", name: "黄绒鸭", icon: "🐤", desc: "绒黄似金，游弋悠然", rarity: 0, price: 10, feedCost: 5, personality: "活泼", outputType: "绒卵", outputDesc: "绒卵×1（活泼+15%）", growthStages: [], special: "" },
  { id: "slime_blue", name: "水精", icon: "🟦", desc: "凝水为形，灵动如溪", rarity: 0, price: 10, feedCost: 5, personality: "乖巧", outputType: "凝露", outputDesc: "凝露×1（乖巧+20%）", growthStages: [], special: "" },
  { id: "bat_flying", name: "夜蝠", icon: "🦇", desc: "隐于夜暮，悄然无声", rarity: 0, price: 12, feedCost: 6, personality: "暴躁", outputType: "暗翼", outputDesc: "暗翼×1（暴躁+30%）", growthStages: [], special: "" },
  { id: "turtle_green", name: "翠甲龟", icon: "🐢", desc: "翠甲如玉，寿比南山", rarity: 0, price: 15, feedCost: 8, personality: "睿智", outputType: "翠甲", outputDesc: "翠甲×1（睿智+20%）", growthStages: [], special: "" },

  // 绿品质 (rarity=1) 8种
  { id: "frog_gold", name: "金蟾", icon: "🐸", desc: "金肌如玉，招财进宝", rarity: 1, price: 25, feedCost: 12, personality: "幸运", outputType: "金蟾油", outputDesc: "金蟾油×1（幸运+25%）", growthStages: [], special: "" },
  { id: "kitty_orange", name: "赤狸", icon: "🐈", desc: "赤毛如火，灵动机敏", rarity: 1, price: 20, feedCost: 10, personality: "懒惰", outputType: "玄丝", outputDesc: "玄丝×2（懒惰-30%产量）", growthStages: [], special: "" },
  { id: "pup_black", name: "玄卫犬", icon: "🐕", desc: "玄背护主，警觉如卫", rarity: 1, price: 30, feedCost: 15, personality: "忠诚", outputType: "犬牙", outputDesc: "犬牙×1（忠诚+25%）", growthStages: [], special: "" },
  { id: "goose_white", name: "素羽鹅", icon: "🦢", desc: "素羽高洁，领地意识强", rarity: 1, price: 25, feedCost: 12, personality: "高傲", outputType: "鹅绒", outputDesc: "鹅绒×1（高傲+20%）", growthStages: [], special: "" },
  { id: "parrot_green", name: "紫翼鹦鹉", icon: "🦜", desc: "紫翼绚丽，善学人言", rarity: 1, price: 30, feedCost: 15, personality: "活泼", outputType: "羽毛", outputDesc: "羽毛×1（活泼+15%）", growthStages: [], special: "" },
  { id: "owl_gray", name: "灰羽鸮", icon: "🦉", desc: "灰羽静立，夜行智者", rarity: 1, price: 35, feedCost: 18, personality: "睿智", outputType: "鸮羽", outputDesc: "鸮羽×1（睿智+20%）", growthStages: [], special: "" },
  { id: "slime_gold", name: "金髓", icon: "🟨", desc: "金色凝髓，价值不菲", rarity: 1, price: 30, feedCost: 15, personality: "幸运", outputType: "黄金凝胶", outputDesc: "黄金凝胶×1（幸运+25%）", growthStages: [], special: "" },
  { id: "slime_dark", name: "暗髓", icon: "🟪", desc: "暗色凝聚，幽隐难测", rarity: 1, price: 35, feedCost: 18, personality: "暴躁", outputType: "暗凝胶", outputDesc: "暗凝胶×1（暴躁+30%）", growthStages: [], special: "" },

  // 蓝品质 (rarity=2) 11种
  { id: "phoenix_chick", name: "赤凤", icon: "🔥", desc: "赤羽如火，凤仪初显", rarity: 2, price: 80, feedCost: 40, personality: "高傲", outputType: "凤羽", outputDesc: "凤羽×1（高傲+25%）", growthStages: [], special: "" },
  { id: "crane_white", name: "玄羽鹤", icon: "🦢", desc: "玄羽素雅，仙风道骨", rarity: 2, price: 100, feedCost: 50, personality: "睿智", outputType: "鹤羽", outputDesc: "鹤羽×1（睿智+25%）", growthStages: [], special: "" },
  { id: "turtle_gold", name: "金甲玄龟", icon: "🐢", desc: "金甲玄纹，坚不可摧", rarity: 2, price: 60, feedCost: 30, personality: "忠诚", outputType: "金龟壳", outputDesc: "金龟壳×1（忠诚+25%）", growthStages: [], special: "" },
  { id: "fox_white", name: "九尾狐", icon: "🦊", desc: "九尾之狐，传说之灵", rarity: 2, price: 90, feedCost: 45, personality: "幸运", outputType: "狐尾", outputDesc: "狐尾×1（幸运+25%）", growthStages: [], special: "" },
  { id: "fox_red", name: "赤焰妖狐", icon: "🔥", desc: "赤焰为毛，妖媚如火", rarity: 2, price: 100, feedCost: 50, personality: "暴躁", outputType: "火狐毛", outputDesc: "火狐毛×1（暴躁+30%）", growthStages: [], special: "" },
  { id: "lion_king", name: "鬃狮", icon: "🦁", desc: "鬃毛如王，百兽敬畏", rarity: 2, price: 120, feedCost: 60, personality: "高傲", outputType: "王鬃", outputDesc: "王鬃×1（高傲+25%）", growthStages: [], special: "" },
  { id: "tiger_stripe", name: "斑斓虎", icon: "🐯", desc: "斑斓如画，力与敏捷", rarity: 2, price: 110, feedCost: 55, personality: "暴躁", outputType: "虎骨", outputDesc: "虎骨×1（暴躁+30%）", growthStages: [], special: "" },
  { id: "bear_brown", name: "熊罴", icon: "🐻", desc: "体壮如罴，威猛憨厚", rarity: 2, price: 100, feedCost: 50, personality: "忠诚", outputType: "熊胆", outputDesc: "熊胆×1（忠诚+25%）", growthStages: [], special: "" },
  { id: "wolf_silver", name: "霜银狼", icon: "🐺", desc: "银毛如霜，孤傲猎手", rarity: 2, price: 105, feedCost: 52, personality: "睿智", outputType: "狼牙", outputDesc: "狼牙×1（睿智+25%）", growthStages: [], special: "" },
  { id: "panther_black", name: "玄影豹", icon: "🐆", desc: "黑如玄影，行动无踪", rarity: 2, price: 115, feedCost: 58, personality: "暴躁", outputType: "玄影豹皮", outputDesc: "玄影豹皮×1（暴躁+30%）", growthStages: [], special: "" },
  { id: "fairy_elf", name: "林灵", icon: "🧚", desc: "林间之灵，与自然共鸣", rarity: 2, price: 90, feedCost: 45, personality: "睿智", outputType: "精灵粉", outputDesc: "精灵粉×1（睿智+25%）", growthStages: [], special: "" },

  // 紫品质 (rarity=3) 4种
  { id: "rhino_gray", name: "甲犀", icon: "🦏", desc: "皮坚甲厚，正面冲锋无惧", rarity: 3, price: 140, feedCost: 70, personality: "忠诚", outputType: "甲犀角", outputDesc: "甲犀角×1（忠诚+25%）", growthStages: [], special: "" },
  { id: "bear_panda", name: "玄墨", icon: "🐼", desc: "玄墨之色，灵韵内敛", rarity: 3, price: 200, feedCost: 100, personality: "乖巧", outputType: "竹心", outputDesc: "竹心×1（乖巧+20%）", growthStages: [], special: "" },
  { id: "baiyu", name: "白羽", icon: "👼", desc: "羽翼洁白，治愈之力温和", rarity: 3, price: 180, feedCost: 90, personality: "乖巧", outputType: "圣羽", outputDesc: "圣羽×1（乖巧+20%）", growthStages: [], special: "" },
  { id: "wuye", name: "五叶", icon: "🍀", desc: "五叶灵草，世间罕见", rarity: 3, price: 180, feedCost: 90, personality: "乖巧", outputType: "灵叶", outputDesc: "灵叶×1（乖巧+20%）", growthStages: [], special: "五叶" },

  // 橙品质 (rarity=4) 4种
  { id: "chuiyun_oldman", name: "垂云叟", icon: "🧙", desc: "隐居云端，长须垂落千年", rarity: 4, price: 220, feedCost: 110, personality: "睿智", outputType: "云须", outputDesc: "云须×1（睿智+25%）", growthStages: [], special: "垂云" },
  { id: "langtaosha", name: "浪淘沙", icon: "🌊", desc: "浪涛中淘尽沙砾，力量磅礴", rarity: 4, price: 160, feedCost: 80, personality: "暴躁", outputType: "浪核", outputDesc: "浪核×1（暴躁+30%）", growthStages: [], special: "淘沙" },
  { id: "fanshizhihun", name: "范式之魂", icon: "🔥", desc: "范式之魂，薪火相传不灭", rarity: 4, price: 250, feedCost: 125, personality: "高傲", outputType: "薪火", outputDesc: "薪火×1（高傲+25%）", growthStages: [], special: "范式" },
  { id: "yanruyu", name: "颜如玉", icon: "📖", desc: "书中自有颜如玉，温文尔雅", rarity: 4, price: 170, feedCost: 85, personality: "乖巧", outputType: "书香", outputDesc: "书香×1（乖巧+20%）", growthStages: [], special: "颜如玉" },
];

// 性格列表
export const PERSONALITIES = ["乖巧", "活泼", "幸运", "睿智", "忠诚", "暴躁", "高傲", "懒惰"];

// 性格产出倍率（懒惰0.7倍）
export function getPersonalityMultiplier(personality: string): number {
  return personality === "懒惰" ? 0.7 : 1.0;
}

// 性格肥料掉落加成
export function getFertilizerDropRate(personality: string): number {
  const rates: Record<string, number> = {
    "乖巧": 0.25, "活泼": 0.25, "幸运": 0.25, "睿智": 0.25, "忠诚": 0.25,
    "高傲": 0.20, "暴躁": 0.30, "懒惰": -0.30,
  };
  return rates[personality] || 0;
}

// 获取生物 by id
export function getCreatureById(id: string): RanchCreature | undefined {
  return RANCH_CATALOG.find(c => c.id === id);
}

// 获取指定稀有度的生物
export function getCreaturesByRarity(rarity: number): RanchCreature[] {
  return RANCH_CATALOG.filter(c => c.rarity === rarity);
}
