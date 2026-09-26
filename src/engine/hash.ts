/**
 * hash — 确定性哈希工具（世界广度：行情定价 / 格子内容抽样）
 * FNV-1a，禁止 Math.random() / Date.now() 参与定价与格子内容。
 */

/** 稳定字符串哈希（FNV-1a），返回 [0,1) 确定性小数 */
export function hash01(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 0xffffffff;
}

/** 稳定字符串哈希，返回 [0, max) 确定性整数 */
export function hashInt(s: string, max: number): number {
  if (max <= 0) return 0;
  return Math.floor(hash01(s) * max) % max;
}

/** 稳定字符串哈希，返回 [min, max] 确定性整数 */
export function hashRange(s: string, min: number, max: number): number {
  return min + hashInt(s, max - min + 1);
}
