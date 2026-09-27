/**
 * titles — 玩家称号（沉浸感 I3）
 * 身份来自行为史，从台账标签 / 善恶 / 旗标算出，不是玩家自己选。
 * when 支持 moral / flags（NPC 记痕计数）/ tags（台账标签计数）；priority 越大越优先显示。
 */
import type { PlayerTitle } from '../types';

export const TITLES: PlayerTitle[] = [
  { id: 't_novice', name: '初出茅庐', when: {}, priority: 1, flavor: '刚踏上这江湖，名声还没传开。' },
  { id: 't_changan_swordsman', name: '长安剑客', when: { tags: { 袭击: { min: 1 } } }, priority: 2, flavor: '在长安城动过刀，城里人看你的眼神都变了。' },
  { id: 't_merchant', name: '行商', when: { tags: { 跑商: { min: 3 } } }, priority: 3, flavor: '走南闯北，靠差价吃饭的买卖人。' },
  { id: 't_donghai_angler', name: '东海钓客', when: { tags: { 初访: { min: 1 } } }, priority: 2, flavor: '到过东海，见过龙宫的人。' },
  { id: 't_blood_hand', name: '血手人屠', when: { tags: { 袭击: { min: 3 } } }, priority: 8, flavor: '手上沾了三条人命，满城的人都不敢正眼看你。' },
  { id: 't_thief', name: '梁上君子', when: { tags: { 偷窃: { min: 3 } } }, priority: 5, flavor: '惯偷，城里丢了东西头一个怀疑你。' },
  { id: 't_wanted', name: '通缉要犯', when: { tags: { 结仇: { min: 3 } } }, priority: 7, flavor: '结下的仇家太多，官府已经张了榜。' },
  { id: 't_living_bodhisattva', name: '活菩萨', when: { moral: { min: 80 } }, priority: 6, flavor: '慈悲为怀，见不得人受苦。' },
  { id: 't_demon_slayer', name: '斩妖者', when: { tags: { boss: { min: 1 } } }, priority: 4, flavor: '斩过一方大妖，妖物见你绕道走。' },
  { id: 't_benefactor', name: '大善人', when: { tags: { 结交: { min: 5 } } }, priority: 3, flavor: '广结善缘，走到哪都有人敬你。' },
  { id: 't_married', name: '有家室的人', when: { tags: { 成婚: { min: 1 } } }, priority: 2, flavor: '已经成家，行事多了份牵挂。' },
  { id: 't_trader_tycoon', name: '富甲一方', when: { tags: { 跑商: { min: 10 } } }, priority: 6, flavor: '生意做得大，坊间都传你是财神下凡。' },
  { id: 't_gossip', name: '包打听', when: { tags: { 揭发: { min: 3 } } }, priority: 3, flavor: '专爱揭人老底，谁都怕被你盯上。' },
  { id: 't_villain', name: '恶贯满盈', when: { moral: { max: -80 } }, priority: 7, flavor: '作恶多端，连官府都拿你没辙。' },
  { id: 't_wanderer', name: '云游四海', when: { tags: { 初访: { min: 3 } } }, priority: 3, flavor: '去过很多地方，见多识广。' },
  { id: 't_legend', name: '一方传奇', when: { tags: { boss: { min: 3 } } }, priority: 9, flavor: '斩妖除魔，江湖上到处是你的传说。' },
];

export function titleById(id: string): PlayerTitle | undefined {
  return TITLES.find((t) => t.id === id);
}
