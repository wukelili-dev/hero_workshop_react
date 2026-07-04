// ============ 等距菱形 2.5D 地图面板 ============
// 太吾绘卷风格：Canvas 手绘图标 + 菱形贴片 + 暗色描边 + 玩家金框

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { 
  CENTRAL_PLAIN_CELLS, 
  TERRAIN_CONFIG,
  getCellById,
  getNeighbors,
  calcMoveCost,
  type MapCell,
  type CellFeature,
  type TerrainType,
  type FeatureType,
} from '../../data/cellMap';

interface IsoMapProps {
  currentCellId: string;
  revealedCells: string[];
  onMoveToCell: (cellId: string) => void;
  onCellFeatureClick: (feature: CellFeature, cell: MapCell) => void;
}

// ───── 尺寸 ─────
const TILE_W = 72;
const TILE_H = 44;
const HW = TILE_W / 2;
const HH = TILE_H / 2;

// 等距坐标映射
function toIso(cx: number, cy: number) {
  return { x: (cx - cy) * HW, y: (cx + cy) * HH };
}

// ───── 手绘风格图标生成器（Canvas 2D）─────

type IconCache = Map<string, string>; // key → dataURL
const iconCache: IconCache = new Map();

function getOrCreateIcon(key: string, draw: (ctx: CanvasRenderingContext2D, s: number) => void, size = 32): string {
  if (iconCache.has(key)) return iconCache.get(key)!;
  const c = document.createElement('canvas');
  c.width = size; c.height = size;
  const ctx = c.getContext('2d')!;
  draw(ctx, size);
  const url = c.toDataURL();
  iconCache.set(key, url);
  return url;
}

// ─── 地形装饰图标 ───

const terrainIconFns: Record<string, (ctx: CanvasRenderingContext2D, s: number) => void> = {
  plains(ctx, s) {
    // 草地纹理：深浅色块间隔
    ctx.fillStyle = '#7ec850';
    ctx.fillRect(0, 0, s, s);
    ctx.fillStyle = '#6ab840';
    for (let y = 0; y < s; y += 4) {
      for (let x = (y % 8 === 0 ? 0 : 4); x < s; x += 8) {
        ctx.fillRect(x, y, 2, 3);
      }
    }
    // 几根草
    ctx.strokeStyle = '#5a9a30';
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      const bx = 6 + i * 10 + Math.sin(i * 5) * 3;
      const by = s - 4;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.quadraticCurveTo(bx - 2, by - 6, bx + 1, by - 10);
      ctx.stroke();
    }
  },
  forest(ctx, s) {
    ctx.fillStyle = '#2d6a2d';
    ctx.fillRect(0, 0, s, s);
    // 树冠三层
    const cx = s / 2, by = s - 2;
    for (let layer = 0; layer < 3; layer++) {
      ctx.fillStyle = ['#2a6a2a', '#3a8a3a', '#4a9a4a'][layer];
      const ly = by - layer * 5;
      ctx.beginPath();
      ctx.moveTo(cx, ly - 10 + layer * 2);
      ctx.lineTo(cx - 8 + layer * 2, ly);
      ctx.lineTo(cx + 8 - layer * 2, ly);
      ctx.fill();
    }
    // 树干
    ctx.fillStyle = '#5a3a1a';
    ctx.fillRect(cx - 1.5, by - 4, 3, 6);
  },
  mountain(ctx, s) {
    ctx.fillStyle = '#7a6a4a';
    ctx.fillRect(0, 0, s, s);
    // 山峰
    ctx.beginPath();
    ctx.moveTo(s * 0.5, s * 0.08);
    ctx.lineTo(s * 0.12, s * 0.85);
    ctx.lineTo(s * 0.88, s * 0.85);
    ctx.fillStyle = '#8a7a5a';
    ctx.fill();
    // 雪顶
    ctx.beginPath();
    ctx.moveTo(s * 0.5, s * 0.08);
    ctx.lineTo(s * 0.38, s * 0.32);
    ctx.lineTo(s * 0.5, s * 0.28);
    ctx.lineTo(s * 0.62, s * 0.32);
    ctx.fillStyle = '#f0f8ff';
    ctx.fill();
    // 山体纹理线
    ctx.strokeStyle = '#6a5a3a';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      const t = 0.3 + i * 0.15;
      ctx.moveTo(s * 0.5, s * 0.15 + s * t * 0.5);
      ctx.lineTo(s * 0.2 + s * t * 0.2, s * 0.85);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(s * 0.5, s * 0.15 + s * t * 0.5);
      ctx.lineTo(s * 0.8 - s * t * 0.2, s * 0.85);
      ctx.stroke();
    }
  },
  water(ctx, s) {
    ctx.fillStyle = '#2a6ba0';
    ctx.fillRect(0, 0, s, s);
    // 波浪
    ctx.strokeStyle = '#4a8bc0';
    ctx.lineWidth = 1.5;
    for (let row = 0; row < 3; row++) {
      ctx.beginPath();
      const y = 8 + row * 9;
      for (let x = 0; x <= s; x += 4) {
        const yy = y + Math.sin((x + row * 12) * 0.4) * 2.5;
        x === 0 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy);
      }
      ctx.stroke();
    }
    // 高光点
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.arc(6 + i * 7, 6 + (i % 3) * 4, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  },
  swamp(ctx, s) {
    ctx.fillStyle = '#4a5b2e';
    ctx.fillRect(0, 0, s, s);
    // 暗色斑块
    ctx.fillStyle = '#3a4b1e';
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.ellipse(5 + i * 7, 6 + (i % 4) * 6, 5, 3, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // 枯木
    ctx.strokeStyle = '#3a2a1a';
    ctx.lineWidth = 2;
    for (let i = 0; i < 2; i++) {
      const bx = 8 + i * 18;
      ctx.beginPath();
      ctx.moveTo(bx, s - 2);
      ctx.lineTo(bx - 2, s - 8);
      ctx.lineTo(bx + 1, s - 14);
      ctx.stroke();
    }
    // 气泡
    ctx.fillStyle = 'rgba(150,200,100,0.3)';
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(4 + i * 12, 8 + i * 3, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  },
  desert(ctx, s) {
    ctx.fillStyle = '#c4a050';
    ctx.fillRect(0, 0, s, s);
    // 沙丘线
    ctx.fillStyle = '#b89040';
    ctx.beginPath();
    ctx.ellipse(s * 0.35, s * 0.55, s * 0.3, s * 0.12, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(s * 0.7, s * 0.75, s * 0.25, s * 0.08, -0.3, 0, Math.PI * 2);
    ctx.fill();
    // 仙人掌
    ctx.fillStyle = '#3a6a2a';
    ctx.fillRect(s * 0.45, s * 0.25, 3, s * 0.4);
    ctx.fillRect(s * 0.38, s * 0.35, 4, 2.5);
    ctx.fillRect(s * 0.50, s * 0.32, 4, 2.5);
    // 阴影点
    ctx.fillStyle = 'rgba(0,0,0,0.05)';
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.arc(4 + i * 6, s - 2 - (i % 3) * 4, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  },
  snow(ctx, s) {
    ctx.fillStyle = '#d0e0e8';
    ctx.fillRect(0, 0, s, s);
    // 雪堆
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = ['#ffffff', '#e8f0f8'][i % 2];
      ctx.beginPath();
      ctx.ellipse(6 + i * 8, 6 + (i % 3) * 7, 6, 3, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // 暗色阴影
    ctx.fillStyle = 'rgba(150,170,190,0.15)';
    ctx.beginPath();
    ctx.ellipse(s * 0.7, s * 0.62, s * 0.2, s * 0.08, 0, 0, Math.PI * 2);
    ctx.fill();
  },
  volcanic(ctx, s) {
    ctx.fillStyle = '#4a1a0a';
    ctx.fillRect(0, 0, s, s);
    // 火山锥
    ctx.beginPath();
    ctx.moveTo(s * 0.5, s * 0.1);
    ctx.lineTo(s * 0.15, s * 0.8);
    ctx.lineTo(s * 0.85, s * 0.8);
    ctx.fillStyle = '#3a1008';
    ctx.fill();
    // 岩浆线条
    ctx.strokeStyle = '#ff5500';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(s * 0.5, s * 0.12);
    ctx.lineTo(s * 0.48, s * 0.25);
    ctx.lineTo(s * 0.42, s * 0.35);
    ctx.lineTo(s * 0.30, s * 0.55);
    ctx.stroke();
    ctx.strokeStyle = '#ff8800';
    ctx.beginPath();
    ctx.moveTo(s * 0.52, s * 0.12);
    ctx.lineTo(s * 0.55, s * 0.3);
    ctx.lineTo(s * 0.60, s * 0.45);
    ctx.stroke();
    // 火山口光晕
    ctx.fillStyle = 'rgba(255,80,0,0.2)';
    ctx.beginPath();
    ctx.arc(s * 0.5, s * 0.12, 6, 0, Math.PI * 2);
    ctx.fill();
  },
  celestial(ctx, s) {
    ctx.fillStyle = '#1a1040';
    ctx.fillRect(0, 0, s, s);
    // 光晕
    const grad = ctx.createRadialGradient(s * 0.5, s * 0.5, 2, s * 0.5, s * 0.5, s * 0.5);
    grad.addColorStop(0, 'rgba(255,215,0,0.6)');
    grad.addColorStop(0.5, 'rgba(200,180,255,0.2)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, s, s);
    // 星星
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = `rgba(255,255,255,${0.3 + Math.sin(i * 2) * 0.3})`;
      const angle = i * 1.2;
      const r = 8 + i * 3;
      ctx.beginPath();
      ctx.arc(s * 0.5 + Math.cos(angle) * r, s * 0.5 + Math.sin(angle) * r, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
  },
};

function getTerrainIcon(terrain: TerrainType): string {
  const fn = terrainIconFns[terrain];
  if (!fn) return terrainIconFns.plains.toString();
  return getOrCreateIcon(`terrain_${terrain}`, fn, 32);
}

// ─── 特征图标 ───

const featureIconFns: Record<string, (ctx: CanvasRenderingContext2D, s: number) => void> = {
  city(ctx, s) {
    // 中式建筑轮廓
    ctx.fillStyle = '#c0a060';
    ctx.fillRect(s * 0.2, s * 0.45, s * 0.6, s * 0.45);
    // 屋顶
    ctx.beginPath();
    ctx.moveTo(s * 0.1, s * 0.45);
    ctx.lineTo(s * 0.5, s * 0.05);
    ctx.lineTo(s * 0.9, s * 0.45);
    ctx.fillStyle = '#8a3020';
    ctx.fill();
    // 门
    ctx.fillStyle = '#4a2a1a';
    ctx.fillRect(s * 0.4, s * 0.6, s * 0.2, s * 0.3);
    // 窗
    ctx.fillStyle = '#4a3a2a';
    ctx.fillRect(s * 0.25, s * 0.5, s * 0.1, s * 0.08);
    ctx.fillRect(s * 0.65, s * 0.5, s * 0.1, s * 0.08);
  },
  npc(ctx, s) {
    // 人物简笔画
    // 头
    ctx.fillStyle = '#e0c090';
    ctx.beginPath();
    ctx.arc(s * 0.5, s * 0.18, 5, 0, Math.PI * 2);
    ctx.fill();
    // 身体
    ctx.fillStyle = '#6a5a4a';
    ctx.fillRect(s * 0.38, s * 0.28, s * 0.24, s * 0.3);
    // 斗笠/帽子
    ctx.beginPath();
    ctx.moveTo(s * 0.2, s * 0.15);
    ctx.lineTo(s * 0.5, s * 0.04);
    ctx.lineTo(s * 0.8, s * 0.15);
    ctx.fillStyle = '#5a4a3a';
    ctx.fill();
    // 腰带
    ctx.fillStyle = '#3a2a1a';
    ctx.fillRect(s * 0.38, s * 0.48, s * 0.24, 3);
  },
  monster(ctx, s) {
    // 怪物头像
    ctx.fillStyle = '#4a2020';
    ctx.beginPath();
    ctx.arc(s * 0.5, s * 0.45, s * 0.35, 0, Math.PI * 2);
    ctx.fill();
    // 眼睛（红色发光）
    ctx.fillStyle = '#ff2200';
    ctx.beginPath();
    ctx.arc(s * 0.35, s * 0.38, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(s * 0.65, s * 0.38, 3, 0, Math.PI * 2);
    ctx.fill();
    // 眼镜光晕
    ctx.fillStyle = 'rgba(255,0,0,0.15)';
    ctx.beginPath();
    ctx.arc(s * 0.35, s * 0.38, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(s * 0.65, s * 0.38, 6, 0, Math.PI * 2);
    ctx.fill();
    // 嘴
    ctx.strokeStyle = '#6a3020';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(s * 0.5, s * 0.52, 5, 0.1, Math.PI - 0.1);
    ctx.stroke();
    // 角
    ctx.fillStyle = '#3a1010';
    ctx.beginPath();
    ctx.moveTo(s * 0.3, s * 0.18);
    ctx.lineTo(s * 0.22, s * 0.05);
    ctx.lineTo(s * 0.35, s * 0.12);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(s * 0.7, s * 0.18);
    ctx.lineTo(s * 0.78, s * 0.05);
    ctx.lineTo(s * 0.65, s * 0.12);
    ctx.fill();
  },
  event(ctx, s) {
    // 卷轴/书
    ctx.fillStyle = '#d4b878';
    ctx.fillRect(s * 0.2, s * 0.2, s * 0.6, s * 0.5);
    // 卷轴轴
    ctx.fillStyle = '#8a6a3a';
    ctx.fillRect(s * 0.15, s * 0.18, s * 0.08, s * 0.54);
    ctx.fillRect(s * 0.77, s * 0.18, s * 0.08, s * 0.54);
    // 文字线条
    ctx.strokeStyle = '#6a5a3a';
    ctx.lineWidth = 0.8;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(s * 0.3, s * 0.3 + i * 8);
      ctx.lineTo(s * 0.7, s * 0.3 + i * 8);
      ctx.stroke();
    }
  },
  random(ctx, s) {
    // 问号
    ctx.fillStyle = '#d4a060';
    ctx.beginPath();
    ctx.arc(s * 0.5, s * 0.55, s * 0.35, 0, Math.PI * 2);
    ctx.fill();
    // 问号文字
    ctx.fillStyle = '#4a3a2a';
    ctx.font = `bold ${s * 0.55}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('?', s * 0.5, s * 0.53);
  },
  resource(ctx, s) {
    // 矿石/草药
    ctx.fillStyle = '#6a8a3a';
    ctx.fillRect(0, s * 0.7, s, s * 0.3);
    // 草药
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = ['#4a9a4a', '#5aaa5a', '#3a8a3a'][i];
      const bx = 6 + i * 11;
      ctx.beginPath();
      ctx.moveTo(bx, s * 0.7);
      ctx.lineTo(bx - 3, s * 0.4);
      ctx.lineTo(bx + 3, s * 0.4);
      ctx.fill();
    }
    // 小花朵
    ctx.fillStyle = '#ffaa44';
    ctx.beginPath();
    ctx.arc(10, s * 0.38, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ff4a6a';
    ctx.beginPath();
    ctx.arc(22, s * 0.42, 2, 0, Math.PI * 2);
    ctx.fill();
  },
  dungeon(ctx, s) {
    // 洞穴入口
    ctx.fillStyle = '#2a1a0a';
    ctx.beginPath();
    ctx.ellipse(s * 0.5, s * 0.6, s * 0.35, s * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
    // 岩框
    ctx.fillStyle = '#5a4a3a';
    ctx.beginPath();
    ctx.moveTo(s * 0.12, s * 0.45);
    ctx.lineTo(s * 0.2, s * 0.15);
    ctx.lineTo(s * 0.35, s * 0.3);
    ctx.lineTo(s * 0.5, s * 0.1);
    ctx.lineTo(s * 0.65, s * 0.3);
    ctx.lineTo(s * 0.8, s * 0.15);
    ctx.lineTo(s * 0.88, s * 0.45);
    ctx.fillStyle = '#6a5a4a';
    ctx.fill();
    // 内部发光
    ctx.fillStyle = 'rgba(255,180,0,0.12)';
    ctx.beginPath();
    ctx.ellipse(s * 0.5, s * 0.55, s * 0.18, s * 0.15, 0, 0, Math.PI * 2);
    ctx.fill();
  },
  sect(ctx, s) {
    // 宝塔
    for (let tier = 0; tier < 3; tier++) {
      const ty = s * 0.05 + tier * s * 0.17;
      const tw = s * (0.5 - tier * 0.08);
      // 屋顶
      ctx.beginPath();
      ctx.moveTo(s * 0.5, ty);
      ctx.lineTo(s * 0.5 - tw, ty + s * 0.08);
      ctx.lineTo(s * 0.5 + tw, ty + s * 0.08);
      ctx.fillStyle = '#8a3020';
      ctx.fill();
      // 塔身
      ctx.fillStyle = '#c0a060';
      ctx.fillRect(s * 0.5 - tw * 0.6, ty + s * 0.08, tw * 1.2, s * 0.09);
    }
    // 底座
    ctx.fillStyle = '#8a7a5a';
    ctx.fillRect(s * 0.15, s * 0.72, s * 0.7, s * 0.08);
  },
};

function getFeatureIcon(feature: CellFeature, size = 28): string {
  const fn = featureIconFns[feature.type];
  if (!fn) return featureIconFns.event.toString(); // fallback
  return getOrCreateIcon(`feature_${feature.type}_${size}`, fn, size);
}

// ─── 玩家头像（人物剪影）───

function getPlayerAvatar(size = 32): string {
  return getOrCreateIcon('player_avatar', (ctx, s) => {
    // 背景圆
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(s * 0.5, s * 0.5, s * 0.48, 0, Math.PI * 2);
    ctx.fill();
    // 身体（深色斗篷）
    ctx.fillStyle = '#3a1a1a';
    ctx.beginPath();
    ctx.arc(s * 0.5, s * 0.75, s * 0.25, Math.PI, 0);
    ctx.fill();
    // 头（肤色）
    ctx.fillStyle = '#e0c090';
    ctx.beginPath();
    ctx.arc(s * 0.5, s * 0.4, s * 0.16, 0, Math.PI * 2);
    ctx.fill();
    // 斗笠（深色）
    ctx.fillStyle = '#2a1a1a';
    ctx.beginPath();
    ctx.ellipse(s * 0.5, s * 0.28, s * 0.22, s * 0.05, 0, 0, Math.PI * 2);
    ctx.fill();
    // 斗笠顶部
    ctx.beginPath();
    ctx.arc(s * 0.5, s * 0.25, s * 0.04, 0, Math.PI * 2);
    ctx.fill();
    // 斗笠边阴影
    ctx.fillStyle = '#1a0a0a';
    ctx.fillRect(s * 0.25, s * 0.28, s * 0.5, 2);
  }, size);
}

// ───── 主组件 ─────

export const IsometricMapPanel: React.FC<IsoMapProps> = ({
  currentCellId,
  revealedCells,
  onMoveToCell,
  onCellFeatureClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedCell, setSelectedCell] = useState<MapCell | null>(null);
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);
  const [scale, setScale] = useState(1);

  const currentCell = getCellById(currentCellId);
  const neighbors = currentCell ? getNeighbors(currentCellId) : [];

  // ── 自适应缩放 ──
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const fit = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w <= 0 || h <= 0) return;
      // 地图设计尺寸（含左右上下各 1 个半格 padding）
      const mapW = 6 * TILE_W + 2 * HW; // 504
      const mapH = 6 * TILE_H + 2 * HH; // 308
      const s = Math.min(w / mapW, h / mapH, 1.4);
      setScale(Math.max(0.4, s));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  // ── 预计算格子等距坐标 ──
  const cellPositions = useMemo(() => {
    const map: Record<string, { x: number; y: number }> = {};
    CENTRAL_PLAIN_CELLS.forEach(c => {
      map[c.id] = toIso(c.x, c.y);
    });
    return map;
  }, []);

  // ── 处理点击 ──
  const handleCellClick = useCallback((cellId: string) => {
    const cell = getCellById(cellId);
    if (!cell) return;
    if (cellId === currentCellId) {
      setSelectedCell(cell);
    } else if ((neighbors as string[]).includes(cellId)) {
      const cost = calcMoveCost(currentCellId, cellId);
      if (window.confirm(`移动到 ${TERRAIN_CONFIG[cell.terrain]?.name ?? '未知'}？\n消耗 ${cost} 天`)) {
        onMoveToCell(cellId);
      }
    } else {
      setSelectedCell(cell);
    }
  }, [currentCellId, neighbors, onMoveToCell]);

  // ── 详情弹窗 ──
  const renderDetail = () => {
    if (!selectedCell) return null;
    const t = TERRAIN_CONFIG[selectedCell.terrain] ?? {
      name: '未知', color: '#888', moveCost: 1, encounterRate: 0, description: '',
    };
    const isRevealed = revealedCells.includes(selectedCell.id) || selectedCell.isRevealed;
    const isCurrent = selectedCell.id === currentCellId;
    const isNeighbor = (neighbors as string[]).includes(selectedCell.id);
    return (
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
      }} onClick={() => setSelectedCell(null)}>
        <div style={{
          background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
          borderRadius: 16, padding: 24, maxWidth: 400, width: '90%',
          border: '2px solid #FFD700',
        }} onClick={e => e.stopPropagation()}>
          <h2 style={{ color: '#FFD700', margin: '0 0 16px 0' }}>
            {isCurrent ? '✦ ' : ''}{selectedCell.id}
          </h2>
          <div style={{ color: '#FFF', marginBottom: 8 }}>地形：{t.name}</div>
          <div style={{ color: '#AAA', fontSize: 14, marginBottom: 16 }}>{t.description}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 14, color: '#CCC' }}>
            <div>移动消耗：{t.moveCost} 天</div>
            <div>遇敌概率：{Math.round((t.encounterRate || 0) * 100)}%</div>
            <div>海拔：{'▲'.repeat(selectedCell.elevation || 0) || '平原'}</div>
            <div>状态：<span style={{ color: isRevealed ? '#90EE90' : '#FF6B6B' }}>{isRevealed ? '已探索' : '未探索'}</span></div>
          </div>
          {selectedCell.features.length > 0 && (
            <div style={{ marginTop: 12, padding: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 8 }}>
              <div style={{ color: '#AAA', fontSize: 12, marginBottom: 4 }}>内容：</div>
              {selectedCell.features.map((f, i) => (
                <div key={i} style={{ color: '#FFF', fontSize: 13, padding: '2px 0' }}>
                  {f.label}
                  {f.description && <span style={{ color: '#888' }}> — {f.description}</span>}
                  <span style={{ color: '#666', marginLeft: 6, fontSize: 11 }}>({f.type})</span>
                </div>
              ))}
            </div>
          )}
          {isNeighbor && !isCurrent && (
            <button onClick={() => { onMoveToCell(selectedCell.id); setSelectedCell(null); }}
              style={{
                width: '100%', marginTop: 16, padding: 12,
                background: '#FFD700', border: 'none', borderRadius: 8,
                color: '#000', fontWeight: 'bold', cursor: 'pointer',
              }}
            >移动至此</button>
          )}
        </div>
      </div>
    );
  };

  // ── 地图设计尺寸常量（用于外层 wrapper） ──
  const MAP_W = 6 * TILE_W + 2 * HW; // 504
  const MAP_H = 6 * TILE_H + 2 * HH; // 308

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#0c0c1a' }}>
      <div ref={containerRef} style={{
        flex: 1, overflow: 'hidden', position: 'relative',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'radial-gradient(ellipse at center, #141428 0%, #0a0a16 70%)',
      }}>
        {/* 地图 wrapper：固定设计尺寸，靠 transform scale 缩放 */}
        <div style={{
          position: 'relative',
          width: MAP_W, height: MAP_H,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
        }}>
            {CENTRAL_PLAIN_CELLS.map(cell => {
              const iso = cellPositions[cell.id];
              if (!iso) return null;
              const isRevealed = revealedCells.includes(cell.id) || cell.isRevealed;
              const isCurrent = cell.id === currentCellId;
              const isHovered = hoveredCell === cell.id;
              const hasNpc = cell.features.some(f => f.type === 'npc' || f.type === 'monster');
              const hasFeature = cell.features.length > 0;
              const t = TERRAIN_CONFIG[cell.terrain];

              return (
                <div key={cell.id}
                  onClick={() => handleCellClick(cell.id)}
                  onMouseEnter={() => setHoveredCell(cell.id)}
                  onMouseLeave={() => setHoveredCell(null)}
                  style={{
                    position: 'absolute',
                    left: MAP_W / 2 + iso.x - HW,
                    top: HH + iso.y - (cell.elevation || 0) * 4,
                    width: TILE_W, height: TILE_H,
                    cursor: 'pointer',
                    zIndex: 1000 + (cell.elevation || 0) + (isCurrent ? 100 : 0),
                  }}
                >
                  {/* ---- 海拔阴影 ---- */}
                  {(cell.elevation || 0) > 0 && (
                    <div style={{
                      position: 'absolute',
                      left: -TILE_W * 0.02, top: (cell.elevation || 0) * 4 + TILE_H - 8,
                      width: TILE_W * 1.04, height: 8,
                      clipPath: 'polygon(50% 0%, 100% 50%, 100% 100%, 0% 100%, 0% 50%)',
                      background: 'rgba(0,0,0,0.15)',
                      zIndex: -1,
                    }} />
                  )}

                  {/* ---- 格子菱形 + 地形 ---- */}
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
                    background: t?.color || '#666',
                    border: 'none',
                    overflow: 'hidden',
                    transition: 'filter 0.15s',
                    filter: isHovered ? 'brightness(1.2)' : 'brightness(1)',
                  }}>
                    {/* 地形装饰图 - 完全覆盖菱形 */}
                    <div style={{
                      position: 'absolute', inset: 0,
                      backgroundImage: `url(${getTerrainIcon(cell.terrain)})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      opacity: cell.elevation && cell.elevation > 1 ? 0.7 : 0.9,
                    }} />
                    {/* 海拔高的格子更暗 */}
                    {(cell.elevation || 0) > 1 && (
                      <div style={{
                        position: 'absolute', inset: 0,
                        background: 'rgba(0,0,0,0.15)',
                      }} />
                    )}
                  </div>

                  {/* ---- 暗色边框 ---- */}
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
                    pointerEvents: 'none',
                    boxShadow: `inset 0 0 0 1px rgba(0,0,0,0.5), inset 0 0 0 2px rgba(0,0,0,0.1)`,
                  }} />

                  {/* ---- 特征图标 ---- */}
                  {hasFeature && (
                    <div style={{
                      position: 'absolute',
                      left: '50%', top: '40%',
                      transform: 'translate(-50%, -50%)',
                      width: 22, height: 22,
                      backgroundImage: `url(${getFeatureIcon(cell.features[0])})`,
                      backgroundSize: 'contain',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat',
                      opacity: isRevealed ? 1 : 0,
                      zIndex: 2,
                      filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.6))',
                    }} />
                  )}

                  {/* ---- NPC/怪物光柱 ---- */}
                  {hasNpc && isRevealed && (
                    <>
                      <div style={{
                        position: 'absolute',
                        left: '50%', top: -4,
                        transform: 'translateX(-50%)',
                        width: 4, height: 20,
                        background: 'linear-gradient(to top, rgba(68,170,255,0.4), rgba(68,170,255,0))',
                        borderRadius: '2px 2px 0 0',
                        zIndex: 3,
                      }} />
                      <div style={{
                        position: 'absolute',
                        left: '50%', top: -6,
                        transform: 'translateX(-50%)',
                        width: 5, height: 5,
                        borderRadius: '50%',
                        background: '#88ccff',
                        boxShadow: '0 0 6px rgba(68,170,255,0.6)',
                        zIndex: 3,
                      }} />
                    </>
                  )}

                  {/* ---- 玩家金框 ---- */}
                  {isCurrent && (
                    <>
                      <div style={{
                        position: 'absolute',
                        left: -4, top: -4,
                        width: TILE_W + 8, height: TILE_H + 8,
                        clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
                        background: '#FFD700',
                        zIndex: -1,
                        opacity: 0.6,
                        animation: 'isoGoldPulse 2s ease-in-out infinite',
                      }} />
                      {/* 头像（Canvas 绘制）*/}
                      <div style={{
                        position: 'absolute',
                        left: '50%', top: -22,
                        transform: 'translateX(-50%)',
                        width: 26, height: 26,
                        borderRadius: '50%',
                        border: '2px solid #FFD700',
                        backgroundColor: '#FFD700',
                        backgroundImage: `url(${getPlayerAvatar(26)})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        zIndex: 5,
                        boxShadow: '0 0 8px rgba(255,215,0,0.5)',
                        animation: 'isoAvatarFloat 2.5s ease-in-out infinite',
                      }} />
                    </>
                  )}

                  {/* ---- 迷雾 ---- */}
                  {!isRevealed && (
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
                      background: 'rgba(12,12,26,0.78)',
                      zIndex: 4,
                      backdropFilter: 'blur(1px)',
                    }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

      {/* 底部状态栏 */}
      <div style={{
        padding: '4px 10px',
        background: '#000',
        borderTop: '1px solid #222',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        fontSize: 11, color: '#666', fontFamily: 'monospace',
      }}>
        <span style={{ color: '#0f0' }}>📍 {currentCellId}</span>
        <span>已探索 {revealedCells.length}/{CENTRAL_PLAIN_CELLS.length}</span>
        <span style={{ color: hoveredCell ? '#FFD700' : '#666' }}>
          {hoveredCell ? `👆 ${hoveredCell}` : '—'}
        </span>
      </div>
      <div style={{
        padding: '6px 10px',
        background: 'rgba(0,0,0,0.85)',
        borderTop: '1px solid #222',
        display: 'flex', alignItems: 'center',
      }}>
        <span style={{ color: '#FFD700', fontSize: 12 }}>🗺️ 等距 2.5D 地图</span>
        <span style={{ color: '#555', fontSize: 11, marginLeft: 10 }}>悬停高亮 · 点击相邻移动</span>
      </div>

      {/* 动画 keyframes */}
      <style>{`
        @keyframes isoGoldPulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.7; }
        }
        @keyframes isoAvatarFloat {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(-3px); }
        }
      `}</style>

      {renderDetail()}
    </div>
  );
};
