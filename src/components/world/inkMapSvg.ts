// ============ 宣纸水墨风地图渲染器 ============
// 纯代码生成 SVG：纸纹 = feTurbulence，水墨晕染 = 抖动路径 + feDisplacementMap，
// 图标/笔触 = 手写 path。不依赖任何图片素材。

import {
  CENTRAL_PLAIN_CELLS,
  CELL_ROADS,
  type MapCell,
  type TerrainType,
} from '../../data/cellMap';

const S = 72;      // 每格边长（未缩放）
const OX = 108;    // 网格左上角 x
const OY = 28;     // 网格左上角 y
const VB_W = 720;
const VB_H = 560;
const FONT_KAI = 'KaiTi, STKaiti, Kaiti SC, SimSun, serif';

/** 地形的水墨色（wash = 淡墨晕染，ink = 浓墨笔触） */
const INK: Record<TerrainType, { wash: string; ink: string }> = {
  plains: { wash: '#cfd6b8', ink: '#a9b48c' },
  forest: { wash: '#bcc9a8', ink: '#7f9468' },
  mountain: { wash: '#cec7ba', ink: '#8c8375' },
  water: { wash: '#c6d6de', ink: '#87a3b2' },
  swamp: { wash: '#c8c9ae', ink: '#87886e' },
  desert: { wash: '#e5d5b2', ink: '#c2a880' },
  snow: { wash: '#e6ecf2', ink: '#b9c6d2' },
  volcanic: { wash: '#ddc2b7', ink: '#a8786c' },
  celestial: { wash: '#dad2e7', ink: '#a99bc0' },
};

type IconKind = 'city' | 'sect' | 'dungeon' | 'village' | 'npc' | 'monster' | 'event' | 'random' | 'resource';

const FEATURE_ICON: Record<string, IconKind> = {
  city: 'city',
  sect: 'sect',
  dungeon: 'dungeon',
  npc: 'npc',
  monster: 'monster',
  event: 'event',
  random: 'random',
  resource: 'resource',
};

/** 需要写名字的地标类型 */
const NAMED: IconKind[] = ['city', 'sect', 'dungeon'];

export interface InkMapOptions {
  currentCellId: string;
  /** 玩家点击选中的目标格（显示路线预览） */
  selectedCellId?: string | null;
  /** 预览路线（含起点、终点） */
  routePath?: string[];
  /** 预览所需天数 */
  routeDays?: number;
  /** 存档中额外揭开的格子 */
  revealedCells?: string[];
}

// ── 小工具 ──
function r1(v: number): number {
  return Math.round(v * 10) / 10;
}
function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function smoothClosed(pts: number[][]): string {
  const mid = (p: number[], q: number[]) => [r1((p[0] + q[0]) / 2), r1((p[1] + q[1]) / 2)];
  const m0 = mid(pts[pts.length - 1], pts[0]);
  let d = `M ${m0[0]} ${m0[1]}`;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const q = pts[(i + 1) % pts.length];
    const m = mid(p, q);
    d += ` Q ${p[0]} ${p[1]} ${m[0]} ${m[1]}`;
  }
  return `${d} Z`;
}
function blobPath(cx: number, cy: number, r: number, seed: number, n: number, jit: number): string {
  const rand = mulberry32(seed);
  const pts: number[][] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const rr = r * (1 - jit / 2 + rand() * jit);
    pts.push([r1(cx + Math.cos(a) * rr), r1(cy + Math.sin(a) * rr)]);
  }
  return smoothClosed(pts);
}
function star4(x: number, y: number, s: number, c: string): string {
  return `<path d="M ${x} ${y - s} L ${r1(x + s * 0.26)} ${r1(y - s * 0.26)} L ${x + s} ${y} L ${r1(x + s * 0.26)} ${r1(y + s * 0.26)} L ${x} ${y + s} L ${r1(x - s * 0.26)} ${r1(y + s * 0.26)} L ${x - s} ${y} L ${r1(x - s * 0.26)} ${r1(y - s * 0.26)} Z" fill="${c}"/>`;
}

// ── 图标（手写 path） ──
function gCity(x: number, y: number, s: number, c: string): string {
  return `<path d="M ${r1(x - s)} ${r1(y + s * 0.55)} L ${r1(x - s)} ${r1(y - s * 0.1)} h ${r1(s * 0.4)} v ${r1(-s * 0.3)} h ${r1(s * 0.3)} v ${r1(s * 0.3)} h ${r1(s * 0.6)} v ${r1(-s * 0.3)} h ${r1(s * 0.3)} v ${r1(s * 0.3)} h ${r1(s * 0.4)} L ${r1(x + s)} ${r1(y + s * 0.55)} Z" fill="${c}"/><rect x="${r1(x - s * 0.16)}" y="${r1(y + s * 0.12)}" width="${r1(s * 0.32)}" height="${r1(s * 0.43)}" fill="#f4ead2" opacity="0.75"/>`;
}
function gSect(x: number, y: number, s: number, c: string): string {
  return `<path d="M ${r1(x - s)} ${r1(y + s * 0.55)} L ${r1(x - s * 0.42)} ${r1(y - s * 0.1)} L ${r1(x - s * 0.1)} ${r1(y + s * 0.2)} L ${x} ${r1(y - s * 0.7)} L ${r1(x + s * 0.12)} ${r1(y + s * 0.2)} L ${r1(x + s * 0.45)} ${r1(y - s * 0.12)} L ${r1(x + s)} ${r1(y + s * 0.55)} Z" fill="${c}"/>`;
}
function gArch(x: number, y: number, s: number, c: string): string {
  return `<path d="M ${r1(x - s * 0.8)} ${r1(y + s * 0.6)} L ${r1(x - s * 0.8)} ${r1(y - s * 0.05)} A ${r1(s * 0.8)} ${r1(s * 0.8)} 0 0 1 ${r1(x + s * 0.8)} ${r1(y - s * 0.05)} L ${r1(x + s * 0.8)} ${r1(y + s * 0.6)} Z" fill="${c}"/><path d="M ${r1(x - s * 0.28)} ${r1(y + s * 0.6)} L ${r1(x - s * 0.28)} ${r1(y + s * 0.05)} A ${r1(s * 0.28)} ${r1(s * 0.28)} 0 0 1 ${r1(x + s * 0.28)} ${r1(y + s * 0.05)} L ${r1(x + s * 0.28)} ${r1(y + s * 0.6)} Z" fill="#2b241c" opacity="0.7"/>`;
}
function gVillage(x: number, y: number, s: number, c: string): string {
  return `<path d="M ${r1(x - s * 0.95)} ${r1(y + s * 0.15)} L ${r1(x - s * 0.5)} ${r1(y - s * 0.45)} L ${r1(x - s * 0.05)} ${r1(y + s * 0.15)} Z" fill="${c}"/><path d="M ${r1(x - s * 0.15)} ${r1(y + s * 0.55)} L ${r1(x + s * 0.35)} ${r1(y - s * 0.2)} L ${r1(x + s * 0.85)} ${r1(y + s * 0.55)} Z" fill="${c}"/>`;
}
function gPerson(x: number, y: number, s: number, c: string): string {
  return `<circle cx="${x}" cy="${r1(y - s * 0.45)}" r="${r1(s * 0.3)}" fill="${c}"/><path d="M ${r1(x - s * 0.55)} ${r1(y + s * 0.6)} Q ${x} ${r1(y - s * 0.1)} ${r1(x + s * 0.55)} ${r1(y + s * 0.6)} Z" fill="${c}"/>`;
}
function gBeast(x: number, y: number, s: number, c: string): string {
  return `<path d="M ${r1(x - s * 0.55)} ${r1(y - s * 0.15)} L ${r1(x - s * 0.78)} ${r1(y - s * 0.75)} L ${r1(x - s * 0.22)} ${r1(y - s * 0.42)} Z" fill="${c}"/><path d="M ${r1(x + s * 0.55)} ${r1(y - s * 0.15)} L ${r1(x + s * 0.78)} ${r1(y - s * 0.75)} L ${r1(x + s * 0.22)} ${r1(y - s * 0.42)} Z" fill="${c}"/><circle cx="${x}" cy="${r1(y + s * 0.1)}" r="${r1(s * 0.52)}" fill="${c}"/><circle cx="${r1(x - s * 0.2)}" cy="${r1(y + s * 0.02)}" r="${r1(s * 0.09)}" fill="#f4ead2"/><circle cx="${r1(x + s * 0.2)}" cy="${r1(y + s * 0.02)}" r="${r1(s * 0.09)}" fill="#f4ead2"/>`;
}
function gScroll(x: number, y: number, s: number, c: string): string {
  return `<rect x="${r1(x - s * 0.62)}" y="${r1(y - s * 0.5)}" width="${r1(s * 1.24)}" height="${r1(s)}" rx="2" fill="none" stroke="${c}" stroke-width="${r1(s * 0.17)}"/><path d="M ${r1(x - s * 0.3)} ${r1(y - s * 0.22)} h ${r1(s * 0.6)} M ${r1(x - s * 0.3)} ${r1(y + s * 0.02)} h ${r1(s * 0.6)} M ${r1(x - s * 0.3)} ${r1(y + s * 0.26)} h ${r1(s * 0.36)}" stroke="${c}" stroke-width="${r1(s * 0.13)}"/>`;
}
function gQuestion(x: number, y: number, s: number, c: string): string {
  return `<circle cx="${x}" cy="${y}" r="${r1(s * 0.72)}" fill="none" stroke="${c}" stroke-width="${r1(s * 0.14)}" stroke-dasharray="${r1(s * 0.3)} ${r1(s * 0.22)}"/><text x="${x}" y="${r1(y + s * 0.42)}" text-anchor="middle" font-size="${r1(s * 1.2)}" font-weight="700" fill="${c}">?</text>`;
}
function gGem(x: number, y: number, s: number, c: string): string {
  return `<path d="M ${x} ${r1(y - s * 0.62)} L ${r1(x + s * 0.58)} ${y} L ${x} ${r1(y + s * 0.62)} L ${r1(x - s * 0.58)} ${y} Z" fill="${c}"/><path d="M ${r1(x - s * 0.24)} ${y} L ${x} ${r1(y - s * 0.62)} L ${r1(x + s * 0.24)} ${y} Z" fill="#f4ead2" opacity="0.45"/>`;
}
function iconFor(kind: IconKind, x: number, y: number, s: number, c: string): string {
  switch (kind) {
    case 'city': return gCity(x, y, s, c);
    case 'sect': return gSect(x, y, s, c);
    case 'dungeon': return gArch(x, y, s, c);
    case 'village': return gVillage(x, y, s, c);
    case 'npc': return gPerson(x, y, s, c);
    case 'monster': return gBeast(x, y, s, c);
    case 'event': return gScroll(x, y, s, c);
    case 'resource': return gGem(x, y, s, c);
    default: return gQuestion(x, y, s, c);
  }
}

/** 已探索格子的水墨笔触（山势、林木、水纹…） */
function inkDetail(t: TerrainType, px: number, py: number, seed: number): string {
  const rand = mulberry32(seed);
  let s = '';
  if (t === 'mountain' || t === 'volcanic') {
    for (let i = 0; i < 3; i++) {
      const ax = px + (rand() - 0.5) * 34;
      const ay = py + (rand() - 0.5) * 30;
      s += `<path d="M ${r1(ax - 12)} ${r1(ay + 8)} Q ${r1(ax - 3)} ${r1(ay - 12)} ${r1(ax + 2)} ${r1(ay + 8)} M ${r1(ax + 1)} ${r1(ay + 8)} Q ${r1(ax + 7)} ${r1(ay - 8)} ${r1(ax + 13)} ${r1(ay + 8)}" fill="none" stroke="${t === 'volcanic' ? '#a8786c' : '#6f6759'}" stroke-width="1.4" opacity="0.55"/>`;
    }
  } else if (t === 'forest') {
    for (let i = 0; i < 5; i++) {
      s += `<circle cx="${r1(px + (rand() - 0.5) * 40)}" cy="${r1(py + (rand() - 0.5) * 34)}" r="${r1(2.6 + rand() * 2.6)}" fill="#5f7a4c" opacity="0.5"/>`;
    }
  } else if (t === 'water' || t === 'swamp') {
    for (let i = 0; i < 3; i++) {
      const wy = r1(py - 14 + i * 14);
      s += `<path d="M ${r1(px - 22)} ${wy} q 8 -5 16 0 t 16 0 t 14 0" fill="none" stroke="${t === 'water' ? '#6d8fa2' : '#7c8464'}" stroke-width="1.2" opacity="0.5"/>`;
    }
  } else if (t === 'celestial') {
    s += star4(px + 16, py - 16, 6, '#8d7cb8');
  } else if (t === 'desert') {
    for (let i = 0; i < 6; i++) {
      s += `<circle cx="${r1(px + (rand() - 0.5) * 44)}" cy="${r1(py + (rand() - 0.5) * 40)}" r="1.2" fill="#b99a63" opacity="0.7"/>`;
    }
  }
  return s;
}

function centerOf(cell: MapCell): [number, number] {
  return [OX + cell.x * S + S / 2, OY + cell.y * S + S / 2];
}

export function buildInkMapSvg(opts: InkMapOptions): string {
  const revealedExtra = new Set(opts.revealedCells ?? []);
  const isExplored = (cell: MapCell) => Boolean(cell.isRevealed) || revealedExtra.has(cell.id);
  const byId = new Map<string, MapCell>(CENTRAL_PLAIN_CELLS.map((c) => [c.id, c] as [string, MapCell]));
  const explored = CENTRAL_PLAIN_CELLS.filter(isExplored);
  const route = opts.routePath ?? [];

  const out: string[] = [];
  out.push(`<svg viewBox="0 0 ${VB_W} ${VB_H}" class="inkmap-svg" role="img" aria-label="中原地区世界地图">`);
  out.push(
    `<style>.inkmap-cell .hl{opacity:0;transition:opacity .12s}` +
      `.inkmap-cell:hover .hl{opacity:1}.inkmap-hit{fill:transparent;cursor:pointer}.inkmap-label{font-family:${FONT_KAI};fill:#3f3527;paint-order:stroke;stroke:#efe9dc;stroke-width:3px}</style>`
  );
  out.push(
    `<defs>` +
      `<filter id="ink-fiber" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" seed="3"/><feColorMatrix type="matrix" values="0 0 0 0 0.58  0 0 0 0 0.52  0 0 0 0 0.42  0 0 0 0.4 0"/></filter>` +
      `<filter id="ink-wet" x="-30%" y="-30%" width="160%" height="160%"><feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="3" seed="9" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="18" xChannelSelector="R" yChannelSelector="G"/><feGaussianBlur stdDeviation="1.2"/></filter>` +
      `<radialGradient id="ink-vig" cx="50%" cy="46%" r="70%"><stop offset="58%" stop-color="#efe9dc" stop-opacity="0"/><stop offset="100%" stop-color="#c4b79b" stop-opacity="0.85"/></radialGradient>` +
      `<clipPath id="ink-reveal">${explored
        .map((c) => `<path d="${blobPath(centerOf(c)[0], centerOf(c)[1], S * 0.58, c.x * 97 + c.y * 13 + 7, 11, 0.3)}"/>`)
        .join('')}</clipPath>` +
      `</defs>`
  );
  out.push(`<rect width="${VB_W}" height="${VB_H}" fill="#efe9dc"/>`);
  out.push(`<rect width="${VB_W}" height="${VB_H}" filter="url(#ink-fiber)" opacity="0.5"/>`);

  // 未探索：空白宣纸上的淡墨界格
  out.push('<g opacity="0.55">');
  CENTRAL_PLAIN_CELLS.filter((c) => !isExplored(c)).forEach((c) => {
    const [px, py] = centerOf(c);
    out.push(`<path d="${blobPath(px, py, S * 0.5, c.x * 31 + c.y * 17 + 3, 9, 0.18)}" fill="#e9e3d5" stroke="#c7bfab" stroke-width="0.9" stroke-dasharray="4 5"/>`);
  });
  out.push('</g>');

  // 已探索：水墨晕染
  out.push('<g filter="url(#ink-wet)">');
  explored.forEach((c) => {
    const [px, py] = centerOf(c);
    const palette = INK[c.terrain];
    out.push(`<path d="${blobPath(px, py, S * 0.58, c.x * 97 + c.y * 13 + 7, 11, 0.3)}" fill="${palette.wash}" opacity="0.95"/>`);
    out.push(`<path d="${blobPath(px, py, S * 0.34, c.x * 53 + c.y * 29 + 11, 9, 0.42)}" fill="${palette.ink}" opacity="0.5"/>`);
  });
  out.push('</g>');

  // 界格 + 驿道（只出现在已探索区域）
  out.push('<g clip-path="url(#ink-reveal)">');
  out.push('<g stroke="#6b6252" stroke-width="0.8" opacity="0.16">');
  for (let i = 0; i <= 7; i++) {
    out.push(`<line x1="${OX + i * S}" y1="${OY}" x2="${OX + i * S}" y2="${OY + 7 * S}"/>`);
    out.push(`<line x1="${OX}" y1="${OY + i * S}" x2="${OX + 7 * S}" y2="${OY + i * S}"/>`);
  }
  out.push('</g>');
  CELL_ROADS.forEach(([from, to]) => {
    const a = byId.get(from);
    const b = byId.get(to);
    if (!a || !b) return;
    const [x1, y1] = centerOf(a);
    const [x2, y2] = centerOf(b);
    const mx = (x1 + x2) / 2 + (y2 - y1) * 0.14;
    const my = (y1 + y2) / 2 - (x2 - x1) * 0.14;
    out.push(`<path d="M ${r1(x1)} ${r1(y1)} Q ${r1(mx)} ${r1(my)} ${r1(x2)} ${r1(y2)}" fill="none" stroke="#8a7a63" stroke-width="1.8" stroke-dasharray="7 6" opacity="0.9"/>`);
  });
  explored.forEach((c) => {
    const [px, py] = centerOf(c);
    out.push(inkDetail(c.terrain, px, py, c.x * 41 + c.y * 7 + 5));
  });
  out.push('</g>');

  // 地标 + 地名
  out.push('<g>');
  explored.forEach((c) => {
    const feature = c.features[0];
    if (!feature) return;
    const kind = FEATURE_ICON[feature.type] ?? 'random';
    const [px, py] = centerOf(c);
    const inkColor = kind === 'city' ? '#8f2b23' : '#3f3527';
    out.push(iconFor(kind, px, py - 6, 13, inkColor));
    if (NAMED.indexOf(kind) >= 0) {
      out.push(`<text class="inkmap-label" x="${px}" y="${r1(py + 28)}" text-anchor="middle" font-size="14">${feature.label}</text>`);
    }
  });
  out.push('</g>');

  // 行军路线预览
  if (route.length > 1) {
    const pts = route.map((id) => byId.get(id)).filter(Boolean) as MapCell[];
    const d = pts.map((c, i) => {
      const [px, py] = centerOf(c);
      return `${i === 0 ? 'M' : 'L'} ${r1(px)} ${r1(py)}`;
    }).join(' ');
    out.push(`<path d="${d}" fill="none" stroke="#c1932f" stroke-width="2.4" stroke-dasharray="9 6" opacity="0.95"/>`);
    pts.forEach((c) => {
      const [px, py] = centerOf(c);
      out.push(`<circle cx="${px}" cy="${py}" r="3" fill="#c1932f"/>`);
    });
    const last = pts[pts.length - 1];
    const [lx, ly] = centerOf(last);
    out.push(`<g><rect x="${r1(lx - 26)}" y="${r1(ly - 46)}" width="52" height="20" rx="10" fill="#fdf7e6" stroke="#c1932f"/><text x="${lx}" y="${r1(ly - 32)}" text-anchor="middle" font-size="12" fill="#8a6b2a" font-family="${FONT_KAI}">${opts.routeDays ?? 0} 天</text></g>`);
  }

  // 选中格
  if (opts.selectedCellId) {
    const sel = byId.get(opts.selectedCellId);
    if (sel) {
      const [px, py] = centerOf(sel);
      out.push(`<path d="${blobPath(px, py, S * 0.46, sel.x * 19 + sel.y * 23 + 2, 9, 0.16)}" fill="none" stroke="#c1932f" stroke-width="2"/>`);
    }
  }

  // 玩家：朱印
  const current = byId.get(opts.currentCellId);
  if (current) {
    const [px, py] = centerOf(current);
    out.push(`<circle cx="${px}" cy="${py}" r="${r1(S * 0.44)}" fill="none" stroke="#b5382f" stroke-width="1.6" stroke-dasharray="6 5"/>`);
    out.push(`<circle cx="${r1(px + 19)}" cy="${r1(py - 21)}" r="11" fill="#b5382f" stroke="#f7f1e4" stroke-width="1.5"/>`);
    out.push(`<text x="${r1(px + 19)}" y="${r1(py - 17)}" text-anchor="middle" font-size="12" fill="#f7f1e4" font-family="${FONT_KAI}">你</text>`);
  }

  // 题款 + 闲章
  out.push(`<text x="56" y="96" class="inkmap-label" font-size="20" letter-spacing="4" style="writing-mode:vertical-rl">中原地區</text>`);
  out.push(`<rect x="40" y="252" width="30" height="30" rx="3" fill="#b5382f"/>`);
  out.push(`<text x="55" y="273" text-anchor="middle" font-size="15" fill="#f7f1e4" font-family="${FONT_KAI}">勇</text>`);
  out.push(`<text x="704" y="549" text-anchor="end" font-size="11" fill="#9c917b" font-family="${FONT_KAI}">未探之地，云雾缭绕</text>`);

  // 悬停 / 点击热区（放在最上层）
  out.push('<g>');
  CENTRAL_PLAIN_CELLS.forEach((c) => {
    const [px, py] = centerOf(c);
    out.push(
      `<g class="inkmap-cell">` +
        `<g class="hl"><path d="${blobPath(px, py, S * 0.44, c.x * 19 + c.y * 23 + 2, 9, 0.16)}" fill="#ffffff" fill-opacity="0.22" stroke="#b5382f" stroke-width="1.4"/></g>` +
        `<rect class="inkmap-hit" data-cell="${c.id}" x="${OX + c.x * S}" y="${OY + c.y * S}" width="${S}" height="${S}"/>` +
        `</g>`
    );
  });
  out.push('</g>');

  out.push('</svg>');
  return out.join('');
}
