// ============ 等距菱形 2.5D 地图面板（极简线条版）============
// 黑框白格子 + 玩家位置标记 + 迷雾

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
const TILE_W = 72;
const TILE_H = 44;
const HW = TILE_W / 2;
const HH = TILE_H / 2;

function toIso(cx: number, cy: number) {
  return { x: (cx - cy) * HW, y: (cx + cy) * HH };
}

const DIAMOND_CLIP = 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)';

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
      const mapW = 6 * TILE_W + 2 * HW;
      const mapH = 6 * TILE_H + 2 * HH;
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
    CENTRAL_PLAIN_CELLS.forEach(c => { map[c.id] = toIso(c.x, c.y); });
    return map;
  }, []);

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

  const MAP_W = 6 * TILE_W + 2 * HW;
  const MAP_H = 6 * TILE_H + 2 * HH;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f5f5' }}>
      <div ref={containerRef} style={{
        flex: 1, overflow: 'hidden', position: 'relative',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#f5f5f5',
      }}>
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
            const isNeighbor = (neighbors as string[]).includes(cell.id);
            const hasFeature = cell.features.length > 0;

            return (
              <div key={cell.id}
                onClick={() => handleCellClick(cell.id)}
                onMouseEnter={() => setHoveredCell(cell.id)}
                onMouseLeave={() => setHoveredCell(null)}
                style={{
                  position: 'absolute',
                  left: MAP_W / 2 + iso.x - HW,
                  top: HH + iso.y,
                  width: TILE_W, height: TILE_H,
                  cursor: 'pointer',
                  zIndex: 1000 + (isCurrent ? 100 : 0),
                }}
              >
                {/* 菱形白格 + 黑边 */}
                <div style={{
                  position: 'absolute', inset: 0,
                  clipPath: DIAMOND_CLIP,
                  background: isHovered ? '#e8e8e8' : '#ffffff',
                  boxShadow: isNeighbor && !isCurrent
                    ? 'inset 0 0 0 1.5px #333'
                    : 'inset 0 0 0 1px #000',
                  transition: 'background 0.1s',
                }} />

                {/* 玩家位置：黑点 */}
                {isCurrent && (
                  <div style={{
                    position: 'absolute', inset: 0,
                    clipPath: DIAMOND_CLIP,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    pointerEvents: 'none',
                  }}>
                    <div style={{
                      width: 10, height: 10,
                      background: '#000',
                      clipPath: DIAMOND_CLIP,
                    }} />
                  </div>
                )}

                {/* 特征提示：黑点（如果有 features） */}
                {hasFeature && !isCurrent && isRevealed && (
                  <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    pointerEvents: 'none',
                  }}>
                    <div style={{
                      width: 4, height: 4, borderRadius: '50%',
                      background: '#000',
                    }} />
                  </div>
                )}

                {/* 未探索：斜线纹理 */}
                {!isRevealed && (
                  <div style={{
                    position: 'absolute', inset: 0,
                    clipPath: DIAMOND_CLIP,
                    background: 'repeating-linear-gradient(45deg, #ccc 0 2px, #f5f5f5 2px 5px)',
                    pointerEvents: 'none',
                  }} />
                )}

                {/* 格子坐标：左下角（很淡） */}
                <div style={{
                  position: 'absolute',
                  left: 0, top: '50%',
                  transform: 'translateY(-50%)',
                  width: '100%', textAlign: 'center',
                  fontSize: 7, color: '#bbb',
                  fontFamily: 'monospace',
                  pointerEvents: 'none',
                }}>
                  {cell.x},{cell.y}
                </div>
              </div>
            );
          })}
        </div>
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
    </div>
  );
};
