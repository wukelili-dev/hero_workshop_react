/**
 * grades — 全项目统一的品阶色阶（物品 / 装备 / 怪物 / 灵兽 / 植物 / 丹药共用）
 *
 * 六档，色系沿用项目水墨令牌，递进关系与《太吾绘卷》一致：
 * 墨灰 → 青 → 金 → 朱 → 紫墨 → 墨底描金（最高档）
 *
 * 只在这里定义颜色；其它地方一律 gradeInk()/gradeTint() 取色，不要再各写一份色板。
 */

export interface GradeDef {
  index: number;
  /** 名物名（物品用） */
  name: string;
  /** 旧稀有度名（装备/怪物等兼容显示） */
  rarityName: string;
  /** 主色：文字 / 描边 */
  ink: string;
  /** 底色：淡染 */
  tint: string;
}

export const GRADES: GradeDef[] = [
  { index: 0, name: '凡品', rarityName: '普通', ink: '#6b6252', tint: 'rgba(107, 98, 82, 0.12)' },
  { index: 1, name: '良品', rarityName: '少见', ink: '#4f7a8c', tint: 'rgba(79, 122, 140, 0.14)' },
  { index: 2, name: '珍品', rarityName: '稀有', ink: '#b08a2e', tint: 'rgba(193, 147, 47, 0.16)' },
  { index: 3, name: '秘宝', rarityName: '珍藏', ink: '#b5382f', tint: 'rgba(181, 56, 47, 0.13)' },
  { index: 4, name: '神物', rarityName: '传说', ink: '#6b4a7a', tint: 'rgba(107, 74, 122, 0.16)' },
  { index: 5, name: '仙品', rarityName: '仙品', ink: '#3f3527', tint: 'rgba(193, 147, 47, 0.22)' },
];

/** 取档位定义（越界自动夹到 0~5） */
export function gradeOf(index: number | undefined): GradeDef {
  const i = Math.max(0, Math.min(GRADES.length - 1, Math.floor(index ?? 0)));
  return GRADES[i];
}

export const gradeName = (index?: number): string => gradeOf(index).name;
export const gradeInk = (index?: number): string => gradeOf(index).ink;
export const gradeTint = (index?: number): string => gradeOf(index).tint;

/** 是否最高档（用于"墨底描金"之类的特殊呈现） */
export const isTopGrade = (index?: number): boolean => gradeOf(index).index === GRADES.length - 1;
