// ============ 方格平面地图（极简黑白版）============
// 白格子 = 已探索 | 灰格子 = 迷雾 | 黑色粗边框

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

interface GridMapProps {
  currentCellId: string;
  revealedCells: string[];
  onMoveToCell: (cellId: string) => void;
  onCellFeatureClick: (feature: CellFeature, cell: MapCell) => void;
}

const CELL_SIZE = 64;
const GAP = 2;
const GRID_COLS = 7;
const GRID_ROWS = 7;

export const IsometricMapPanel: React.FC<GridMapProps> = ({
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
      const mapW = GRID_COLS * (CELL_SIZE + GAP);
      const mapH = GRID_ROWS * (CELL_SIZE + GAP);
      const s = Math.min(w / mapW, h / mapH, 1.5);
      setScale(Math.max(0.3, s));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  const mapPixelW = GRID_COLS * (CELL_SIZE + GAP);
  const mapPixelH = GRID_ROWS * (CELL_SIZE + GAP);

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
          border: '2px solid #000',
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
        <div style={{
          position: 'relative',
          width: mapPixelW * scale,
          height: mapPixelH * scale,
        }}>
          {CENTRAL_PLAIN_CELLS.map(cell => {
            const isRevealed = revealedCells.includes(cell.id) || cell.isRevealed;
            const isCurrent = cell.id === currentCellId;
            const isHovered = hoveredCell === cell.id;
            const isNeighbor = (neighbors as string[]).includes(cell.id);
            const hasFeature = cell.features.length > 0;

            const left = cell.x * (CELL_SIZE + GAP) * scale;
            const top = cell.y * (CELL_SIZE + GAP) * scale;
            const size = CELL_SIZE * scale;

            // 背景色
            let bg = '#ffffff';
            if (!isRevealed) {
              bg = isHovered ? '#b0b0b0' : '#c8c8c8';
            } else if (isHovered) {
              bg = '#e0e0e0';
            }

            // 边框
            const border = isCurrent ? '3px solid #000'
              : isNeighbor ? '2px solid #555'
              : '2px solid #000';

            return (
              <div key={cell.id}
                onClick={() => handleCellClick(cell.id)}
                onMouseEnter={() => setHoveredCell(cell.id)}
                onMouseLeave={() => setHoveredCell(null)}
                style={{
                  position: 'absolute',
                  left, top, width: size, height: size,
                  background: bg,
                  border,
                  cursor: 'pointer',
                  transition: 'background 0.1s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxSizing: 'border-box',
                }}
              >
                {/* 玩家位置：黑色实心方块 */}
                {isCurrent && (
                  <div style={{
                    width: size * 0.3, height: size * 0.3,
                    background: '#000',
                  }} />
                )}

                {/* 特征提示：黑色小圆点 */}
                {hasFeature && !isCurrent && isRevealed && (
                  <div style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: '#000',
                  }} />
                )}

                {/* 迷雾斜线 */}
                {!isRevealed && (
                  <div style={{
                    position: 'absolute', inset: 0,
                    backgroundImage: 'repeating-linear-gradient(45deg, transparent 0 4px, rgba(0,0,0,0.08) 4px 8px)',
                    pointerEvents: 'none',
                  }} />
                )}

                {/* 坐标 */}
                <span style={{
                  position: 'absolute',
                  bottom: 2, right: 3,
                  fontSize: Math.max(7, size * 0.12),
                  color: '#999',
                  fontFamily: 'monospace',
                  pointerEvents: 'none',
                }}>
                  {cell.x},{cell.y}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 图例 */}
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
          <div style={{ width: 14, height: 10, background: '#fff', border: '2px solid #000' }} />
          <span>已探索</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 14, height: 10, background: '#c8c8c8', border: '2px solid #000', backgroundImage: 'repeating-linear-gradient(45deg, transparent 0 2px, rgba(0,0,0,0.08) 2px 4px)' }} />
          <span>未探索</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 14, height: 10, background: '#fff', border: '3px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 4, height: 4, background: '#000' }} />
          </div>
          <span>当前</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 14, height: 10, background: '#fff', border: '2px solid #555' }} />
          <span>可移动</span>
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
        <span style={{ color: '#000' }}>■ {currentCellId}</span>
        <span>{revealedCells.length}/{CENTRAL_PLAIN_CELLS.length}</span>
        <span style={{ color: '#666' }}>
          {hoveredCell ? `${hoveredCell}` : '点击格子查看/移动'}
        </span>
      </div>

      {renderDetail()}
    </div>
  );
};
