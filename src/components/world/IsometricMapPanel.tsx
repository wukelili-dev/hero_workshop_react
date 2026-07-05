// ============ 方格平面地图（左信息+右格子 联动版）============
// 白格子 = 已探索 | 灰格子 = 迷雾 | 黑色粗边框
// hover 格子 → 左侧实时显示地块信息，不需要弹窗

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
  onClose?: () => void; // 返回按钮回调
}

const CELL_SIZE = 56;
const GAP = 2;
const GRID_COLS = 7;
const GRID_ROWS = 7;

export const IsometricMapPanel: React.FC<GridMapProps> = ({
  currentCellId,
  revealedCells,
  onMoveToCell,
  onCellFeatureClick,
  onClose,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredCell, setHoveredCell] = useState<MapCell | null>(null);
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
      const s = Math.min(w / mapW, h / mapH, 1.3);
      setScale(Math.max(0.3, s));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  const mapPixelW = GRID_COLS * (CELL_SIZE + GAP);
  const mapPixelH = GRID_ROWS * (CELL_SIZE + GAP);

  // ── 点击处理：点相邻格直接移动，无弹窗 ──
  const handleCellClick = useCallback((cellId: string) => {
    if (cellId === currentCellId) return;
    if ((neighbors as string[]).includes(cellId)) {
      onMoveToCell(cellId);
    }
  }, [currentCellId, neighbors, onMoveToCell]);

  // ── 左侧信息面板显示的格子（hover 优先，否则显示当前格） ──
  const displayCell = hoveredCell ?? currentCell;

  // ── 左侧信息面板 ──
  const renderInfoPanel = () => {
    if (!displayCell) return null;
    const t = TERRAIN_CONFIG[displayCell.terrain] ?? {
      name: '未知', color: '#888', moveCost: 1, encounterRate: 0, description: '',
    };
    const isRevealed = revealedCells.includes(displayCell.id) || displayCell.isRevealed;
    const isCurrent = displayCell.id === currentCellId;
    const isNeighbor = (neighbors as string[]).includes(displayCell.id);
    const canMove = isNeighbor && !isCurrent;

    return (
      <div style={{
        width: '100%', height: '100%',
        background: '#fff',
        borderRight: '2px solid #000',
        padding: 12,
        display: 'flex', flexDirection: 'column',
        fontSize: 12, color: '#000', fontFamily: 'monospace',
        overflowY: 'auto',
      }}>
        {/* 格子 ID + 状态 */}
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>
          {displayCell.id}
          <span style={{ marginLeft: 8, fontSize: 11, color: isRevealed ? '#000' : '#999' }}>
            {isRevealed ? '已探索' : '未探索'}
          </span>
          {isCurrent && <span style={{ marginLeft: 4, fontSize: 11, color: '#000', fontWeight: 700 }}>[当前]</span>}
          {canMove && <span style={{ marginLeft: 4, fontSize: 11, color: '#555' }}>[可移动]</span>}
        </div>

        {/* 地形 */}
        <div style={{ marginBottom: 4 }}>地形：{t.name}</div>
        <div style={{ color: '#666', marginBottom: 8, lineHeight: 1.5 }}>{t.description}</div>

        {/* 数值 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, marginBottom: 8 }}>
          <div>移动：{t.moveCost} 天</div>
          <div>遇敌：{Math.round((t.encounterRate || 0) * 100)}%</div>
          <div>海拔：{displayCell.elevation || 0}</div>
          <div>坐标：{displayCell.x}, {displayCell.y}</div>
        </div>

        {/* 特征列表 */}
        {isRevealed && displayCell.features.length > 0 && (
          <div style={{ marginTop: 4 }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>地标：</div>
            {displayCell.features.map((f, i) => (
              <div key={i} style={{
                padding: '4px 6px', marginBottom: 3,
                background: '#f5f5f5', borderLeft: '3px solid #000',
                fontSize: 11,
              }}>
                <b>{f.label}</b>
                {f.description && <div style={{ color: '#666', marginTop: 2 }}>{f.description}</div>}
              </div>
            ))}
          </div>
        )}

        {!isRevealed && (
          <div style={{ color: '#999', fontStyle: 'italic', marginTop: 8 }}>
            迷雾覆盖，尚未探索
          </div>
        )}

        {/* 移动按钮 */}
        {canMove && (
          <button
            onClick={() => handleCellClick(displayCell.id)}
            style={{
              marginTop: 'auto', padding: '8px 0',
              background: '#000', border: 'none', borderRadius: 4,
              color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 700,
            }}
          >
            移动至此（{calcMoveCost(currentCellId, displayCell.id)} 天）
          </button>
        )}

        {/* 提示 */}
        {!hoveredCell && !isNeighbor && !isCurrent && (
          <div style={{ marginTop: 'auto', color: '#999', fontSize: 10 }}>
            悬停格子查看信息
          </div>
        )}
      </div>
    );
  };

  // ── 右侧格子地图 ──
  const renderGrid = () => {
    return (
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
            const isHovered = hoveredCell?.id === cell.id;
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
              bg = '#d0d0d0';
            }

            // 边框
            const border = isCurrent ? '3px solid #000'
              : isNeighbor ? '2px solid #555'
              : '2px solid #000';

            return (
              <div key={cell.id}
                onClick={() => handleCellClick(cell.id)}
                onMouseEnter={() => setHoveredCell(cell)}
                onMouseLeave={() => setHoveredCell(null)}
                style={{
                  position: 'absolute',
                  left, top, width: size, height: size,
                  background: bg,
                  border,
                  cursor: 'pointer',
                  transition: 'background 0.08s',
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
                  bottom: 1, right: 2,
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
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f5f5', position: 'relative' }}>
      {/* 顶部 Tab 栏（仅全屏模式显示） */}
      {onClose && (
        <div style={{
          flex: '0 0 36px',
          background: '#fff',
          borderBottom: '1px solid #000',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 12px',
          fontSize: 12, fontFamily: 'monospace',
        }}>
          <span style={{ fontWeight: 700 }}>世界地图</span>
          <button
            onClick={onClose}
            style={{
              padding: '4px 12px',
              background: '#000', border: 'none', borderRadius: 4,
              color: '#fff', cursor: 'pointer', fontSize: 11,
            }}
          >返回</button>
        </div>
      )}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
      {/* 左侧：地块信息 */}
      <div style={{ flex: '0 0 38%', maxWidth: 200, minWidth: 120, overflow: 'hidden' }}>
        {renderInfoPanel()}
      </div>

      {/* 右侧：格子地图 */}
      {renderGrid()}

      {/* 图例（右上角浮层） */}
      <div style={{
        position: 'absolute', top: 6, right: 6,
        background: 'rgba(255,255,255,0.95)',
        border: '1px solid #000',
        padding: '5px 7px',
        fontSize: 9, color: '#000',
        fontFamily: 'monospace',
        lineHeight: 1.5,
        zIndex: 2000,
        pointerEvents: 'none',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <div style={{ width: 12, height: 9, background: '#fff', border: '2px solid #000' }} />
          <span>已探索</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <div style={{ width: 12, height: 9, background: '#c8c8c8', border: '2px solid #000' }} />
          <span>迷雾</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <div style={{ width: 12, height: 9, background: '#fff', border: '3px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 4, height: 4, background: '#000' }} />
          </div>
          <span>当前</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <div style={{ width: 12, height: 9, background: '#fff', border: '2px solid #555' }} />
          <span>可移动</span>
        </div>
      </div>

      {/* 状态栏 */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '4px 8px',
        background: '#fff',
        borderTop: '1px solid #000',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        fontSize: 10, color: '#333', fontFamily: 'monospace',
        zIndex: 2000,
      }}>
        <span style={{ color: '#000' }}>■ {currentCellId}</span>
        <span>{revealedCells.length}/{CENTRAL_PLAIN_CELLS.length}</span>
        <span style={{ color: '#666' }}>
          {hoveredCell ? hoveredCell.id : '悬停查看 · 点击移动'}
        </span>
      </div>

      </div>
    </div>
  );
};
