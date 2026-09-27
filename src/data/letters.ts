/**
 * letters — 书信模板（沉浸感 I4）
 * NPC 主动来信，可回信改变世界。写作模板：称呼 → 事由 → 一句体己话 → 落款。
 * when 用 bond / tags（台账标签计数）/ daysSinceBond 判定；once 只投一次。
 */
import type { LetterDef } from '../types';

export const LETTERS: LetterDef[] = [
  // ── 伴侣家书（成婚后次日） ──
  {
    id: 'l_spouse_1', fromNpcId: 'changan_herbalist',
    when: { bond: ['夫妻'], daysSinceBond: { min: 1 } }, once: true,
    subject: '家书',
    body: [
      '见字如面。',
      '自那日礼成，家中一切都好。我把铺子里的账理了理，余下些银钱，给你缝了件冬衣，等你回来试。',
      '外头风大，早些回家。',
      '——妻 孙二娘',
    ],
  },
  {
    id: 'l_spouse_2', fromNpcId: 'changan_tavern',
    when: { bond: ['夫妻'], daysSinceBond: { min: 1 } }, once: true,
    subject: '家书',
    body: [
      '当家的：',
      '酒肆这几日忙得很，可我心里头空落落的。',
      '你在外头，凡事多留个心眼。酒我给你温着，灯给你留着。',
      '——妻 胡姬',
    ],
  },
  {
    id: 'l_spouse_3', fromNpcId: 'changan_embroidery',
    when: { bond: ['夫妻'], daysSinceBond: { min: 1 } }, once: true,
    subject: '家书',
    body: [
      '夫君亲启：',
      '并蒂莲的绣样我已描好了，只等你回来挑线。',
      '夜里凉，别贪赶路。',
      '——妻 裴绣娘',
    ],
  },

  // ── 被偷者的战书 ──
  {
    id: 'l_stolen_war', fromNpcId: 'changan_blacksmith',
    when: { tags: { 偷窃: { min: 1 } } }, once: true,
    subject: '算账',
    body: [
      '好大的胆子。',
      '老夫的银子，可不是那么好拿的。三日之内，到铺子里来给个交代；不然，老夫的锤子可不认人。',
      '——老张头',
    ],
    options: [
      { id: 'pay', text: '赔礼道歉（-50 金）', effects: [{ gold: -50, affinity: 10 }], reply: '算你识相。这事，老夫权当没发生过。' },
      { id: 'ignore', text: '不予理会', effects: [{ affinity: -10, setFlag: '被记恨' }], reply: '你等着。' },
    ],
  },

  // ── 旧友问候 ──
  {
    id: 'l_friend_greet', fromNpcId: 'changan_biaotou',
    when: { bond: ['好友', '挚友'] }, once: false,
    subject: '许久不见',
    body: [
      '兄弟：',
      '听说你近来走动得勤，我这儿有几趟镖要往南边，正缺个照应的。你若有空，来镖局喝碗酒。',
      '——赵镖头',
    ],
  },

  // ── 官府传票（通缉） ──
  {
    id: 'l_court_summon', fromNpcId: 'changan_weizheng',
    when: { tags: { 结仇: { min: 3 } } }, once: true,
    subject: '官府传唤',
    body: [
      '查：近日城中多有斗殴，汝行迹可疑。',
      '限三日内到丞相府说明缘由。逾期不至，后果自负。',
      '——魏征',
    ],
  },

  // ── 门派邀约（高声望） ──
  {
    id: 'l_sect_invite', fromNpcId: 'changan_qinqiong',
    when: { bond: ['好友', '挚友'] }, once: true,
    subject: '邀约',
    body: [
      '贤弟：',
      '秦某府上近日宴请宾客，太宗亦将驾临。你若有暇，务必赏光，某自当为贤弟引荐。',
      '——秦琼',
    ],
  },

  // ── 恩人致谢 ──
  {
    id: 'l_benefactor_thanks', fromNpcId: 'changan_herbalist',
    when: { bond: ['好友', '挚友', '恋人'] }, once: false,
    subject: '谢意',
    body: [
      '上回的事，多亏了你。',
      '铺子里新到了一批上好的药材，我给你留了一份。得空来取。',
      '——孙二娘',
    ],
  },

  // ── 仇敌恫吓 ──
  {
    id: 'l_enemy_threat', fromNpcId: 'changan_biaotou',
    when: { tags: { 结仇: { min: 1 } } }, once: true,
    subject: '一字一句',
    body: [
      '你我之间，早晚有个了断。',
      '莫要以为躲得开。镖局的刀，从不落空。',
      '——赵镖头',
    ],
  },
];

export function lettersFor(npcId: string): LetterDef[] {
  return LETTERS.filter((l) => l.fromNpcId === npcId);
}

export function letterById(id: string): LetterDef | undefined {
  return LETTERS.find((l) => l.id === id);
}
