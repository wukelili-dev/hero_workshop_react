// ============ 等距菱形 2.5D 地图面板（SVG 精确命中版）============
// 黑框白格子 + 玩家位置标记 + 迷雾
// 用 SVG polygon 做点击区，hit-test 精确到菱形边界，无空隙

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  CENTRAL_PLAIN_CELLS,
  TERRAIN_CONFIG,
  getCellById,
  getNeighbors,
  calcMoveCost,
  type MapCell,
  type CellFeature,
} from '../../data/cellMap';

interface IsoMapProps {
  currentCellId: string;
  revealedCells: string[];
  onMoveToCell: (cellId: string) => void;
  onCellFeatureClick: (feature: CellFeature, cell: MapCell) => void;
}

// ───── 尺寸 ─────
const TILE_W = 80;
const TILE_H = 48;
const HW = TILE_W / 2;
const HH = TILE_H / 2;
const PAD = 20; // SVG 边距

function toIso(cx: number, cy: number) {
  return { x: (cx - cy) * HW, y: (cx + cy) * HH };
}

// 菱形 4 个顶点（相对格子左上角）
const DIAMOND_PTS = `${HW},0 ${TILE_W},${HH} ${HW},${TILE_H} 0,${HH}`;

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
      const mapW = 6 * TILE_W + 2 * HW + 2 * PAD;
      const mapH = 6 * TILE_H + 2 * HH + 2 * PAD;
      const s = Math.min(w / mapW, h / mapH, 1.4);
      setScale(Math.max(0.4, s));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  // ── 预计算格子等距坐标 + SVG 坐标 ──
  const cellData = useMemo(() => {
    return CENTRAL_PLAIN_CELLS.map(cell => {
      const iso = toIso(cell.x, cell.y);
      // SVG 坐标：以左上角为原点，需要偏移使格子居中
      const ox = PAD + HW + iso.x; // 格子中心 X
      const oy = PAD + HH + iso.y; // 格子中心 Y
      // 菱形 4 顶点的绝对 SVG 坐标
      const pts = [
        `${ox - HW},${oy - HH}`, // top
        `${ox + HW},${oy}`,      // right
        `${ox},${oy + HH}`,      // bottom
        `${ox - HW},${oy}`,      // left
      ].join(' ');
      return { cell, ox, oy, pts };
    });
  }, []);

  const MAP_W = 6 * TILE_W + 2 * HW + 2 * PAD;
  const MAP_H = 6 * TILE_H + 2 * HH + 2 * PAD;

  // ── 点击处理 ──
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
          background: '#fff', borderRadius: 8, padding: 20, maxWidth: 360, width: '90%',
          border: '1px solid #000',
        }} onClick={e => e.stopPropagation()}>
          <h2 style={{ margin: '0 0 12px 0', fontSize: 16, color: '#000' }}>
            {selectedCell.id}
          </h2>
          <div style={{ color: '#333', fontSize: 13, marginBottom: 8 }}>地形：{t.name}</div>
          <div style={{ color: '#666', fontSize: 12, marginBottom: 12 }}>{t.description}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 12, color: '#444' }}>
            <div>移动：{t.moveCost} 天</div>
            <div>遇敌：{Math.round((t.encounterRate || 0) * 100)}%</div>
            <div>海拔：{selectedCell.elevation || 0}</div>
            <div>状态：<span style={{ color: isRevealed ? '#000' : '#999' }}>{isRevealed ? '已探索' : '未探索'}</span></div>
          </div>
          {selectedCell.features.length > 0 && (
            <div style={{ marginTop: 12, padding: 8, background: '#f5f5f5', borderRadius: 4 }}>
              {selectedCell.features.map((f, i) => (
                <div key={i} style={{ fontSize: 12, padding: '2px 0' }}>
                  <b>{f.label}</b>
                  {f.description && <span style={{ color: '#666' }}> — {f.description}</span>}
                </div>
              ))}
            </div>
          )}
          {isNeighbor && !isCurrent && (
            <button onClick={() => { onMoveToCell(selectedCell.id); setSelectedCell(null); }}
              style={{
                width: '100%', marginTop: 12, padding: 8,
                background: '#000', border: 'none', borderRadius: 4,
                color: '#fff', cursor: 'pointer', fontSize: 13,
              }}
            >移动至此</button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f5f5', position: 'relative' }}>
      <div ref={containerRef} style={{
        flex: 1, overflow: 'hidden', position: 'relative',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#f5f5f5',
      }}>
        <svg
          width={MAP_W * scale}
          height={MAP_H * scale}
          viewBox={`0 0 ${MAP_W} ${MAP_H}`}
          style={{ display: 'block' }}
        >
          {cellData.map(({ cell, ox, oy, pts }) => {
            const isRevealed = revealedCells.includes(cell.id) || cell.isRevealed;
            const isCurrent = cell.id === currentCellId;
            const isHovered = hoveredCell === cell.id;
            const isNeighbor = (neighbors as string[]).includes(cell.id);
            const hasFeature = cell.features.length > 0;

            // 填充色
            let fill = '#ffffff';
            if (!isRevealed) {
              fill = isHovered ? '#d0d0d0' : '#e0e0e0';
            } else if (isHovered) {
              fill = '#e8e8e8';
            }

            // 边框
            const stroke = isNeighbor && !isCurrent ? '#333' : '#000';
            const strokeWidth = isNeighbor && !isCurrent ? 1.5 : 1;

            return (
              <g key={cell.id}>
                {/* 菱形主体（点击+hover） */}
                <polygon
                  points={pts}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={strokeWidth}
                  style={{ cursor: 'pointer', transition: 'fill 0.1s' }}
                  onClick={() => handleCellClick(cell.id)}
                  onMouseEnter={() => setHoveredCell(cell.id)}
                  onMouseLeave={() => setHoveredCell(null)}
                />

                {/* 未探索：斜线纹理 */}
                {!isRevealed && (
                  <polygon
                    points={pts}
                    fill="url(#fogPattern)"
                    pointerEvents="none"
                  />
                )}

                {/* 玩家位置：黑色小菱形 */}
                {isCurrent && (
                  <polygon
                    points={`${ox - 6},${oy} ${ox},${oy - 4} ${ox + 6},${oy} ${ox},${oy + 4}`}
                    fill="#000"
                    pointerEvents="none"
                  />
                )}

                {/* 特征提示：黑色小圆点 */}
                {hasFeature && !isCurrent && isRevealed && (
                  <circle cx={ox} cy={oy} r={3} fill="#000" pointerEvents="none" />
                )}

                {/* 格子坐标 */}
                <text
                  x={ox} y={oy + 14}
                  textAnchor="middle"
                  fontSize={7}
                  fill="#bbb"
                  fontFamily="monospace"
                  pointerEvents="none"
                >
                  {cell.x},{cell.y}
                </text>
              </g>
            );
          })}

          {/* 斜线纹理定义 */}
          <defs>
            <pattern id="fogPattern" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
              <rect width="6" height="6" fill="#e0e0e0" />
              <line x1="0" y1="0" x2="0" y2="6" stroke="#bbb" strokeWidth="1.5" />
            </pattern>
          </defs>
        </svg>
      </div>

      {/* 图例（右上角） */}
      <div style={{
        position: 'absolute', top: 8, right: 8,
        background: 'rgba(255,255,255,0.95)',
        border: '1px solid #000',
        padding: '6px 8px',
        fontSize: 10, color: '#000',
        fontFamily: 'monospace',
        lineHeight: 1.6,
        zIndex: 2000,
        pointerEvents: 'none',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <svg width="16" height="10"><polygon points="8,0 16,5 8,10 0,5" fill="#fff" stroke="#000" strokeWidth="1" /></svg>
          <span>已探索</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <svg width="16" height="10"><polygon points="8,0 16,5 8,10 0,5" fill="url(#fogLegend)" stroke="#000" strokeWidth="1" /></svg>
          <span>未探索</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <svg width="16" height="10"><polygon points="8,0 16,5 8,10 0,5" fill="#fff" stroke="#000" strokeWidth="1" /><polygon points="5,5 8,3 11,5 8,7" fill="#000" /></svg>
          <span>当前</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <svg width="16" height="10"><polygon points="8,0 16,5 8,10 0,5" fill="#fff" stroke="#333" strokeWidth="1.5" /><circle cx="8" cy="5" r="1.5" fill="#000" /></svg>
          <span>可移动</span>
        </div>
        <svg width="0" height="0"><defs><pattern id="fogLegend" patternUnits="userSpaceOnUse" width="4" height="4" patternTransform="rotate(45)"><rect width="4" height="4" fill="#e0e0e0" /><line x1="0" y1="0" x2="0" y2="4" stroke="#bbb" strokeWidth="1" /></pattern></defs></svg>
      </div>

      {/* 状态栏 */}
      <div style={{
        padding: '6px 10px',
        background: '#fff',
        borderTop: '1px solid #000',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        fontSize: 11, color: '#333', fontFamily: 'monospace',
      }}>
        <span style={{ color: '#000' }}>◉ {currentCellId}</span>
        <span>{revealedCells.length}/{CENTRAL_PLAIN_CELLS.length}</span>
        <span style={{ color: '#666' }}>
          {hoveredCell ? `${hoveredCell}` : '点击格子查看/移动'}
        </span>
      </div>

      {renderDetail()}
    </div>
  );
};
