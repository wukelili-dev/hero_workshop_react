// ============ 棋盘式格子地图 UI ============
// 太吾绘卷风格：点击格子探索，显示 NPC/怪物/事件

import React, { useState, useCallback } from 'react';
import { 
  CENTRAL_PLAIN_CELLS, 
  CENTRAL_PLAIN_REGION,
  TERRAIN_CONFIG,
  getCellById,
  getNeighbors,
  calcMoveCost,
  type MapCell,
  type CellFeature 
} from '../../data/cellMap';

interface CellMapPanelProps {
  // 当前玩家位置
  currentCellId: string;
  // 已探索的格子
  revealedCells: string[];
  // 移动回调
  onMoveToCell: (cellId: string) => void;
  // 点击格子内容
  onCellFeatureClick: (feature: CellFeature, cell: MapCell) => void;
}

export const CellMapPanel: React.FC<CellMapPanelProps> = ({
  currentCellId,
  revealedCells,
  onMoveToCell,
  onCellFeatureClick,
}) => {
  const [selectedCell, setSelectedCell] = useState<MapCell | null>(null);
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);

  const currentCell = getCellById(currentCellId);
  const neighbors = currentCell ? getNeighbors(currentCellId) : [];

  // 获取格子样式
  const getCellStyle = useCallback((cell: MapCell) => {
    const terrain = TERRAIN_CONFIG[cell.terrain];
    const isCurrent = cell.id === currentCellId;
    const isNeighbor = neighbors.includes(cell.id);
    const isRevealed = revealedCells.includes(cell.id) || cell.isRevealed;
    const isHovered = hoveredCell === cell.id;

    let opacity = 0.3; // 未探索
    if (isRevealed || isCurrent) opacity = 1;
    if (isNeighbor && !isCurrent) opacity = 0.7;

    return {
      background: terrain?.gradient ?? 'linear-gradient(135deg, #ccc 0%, #999 100%)',
      opacity,
      border: isCurrent ? '3px solid #FFD700' : isNeighbor ? '2px dashed #FFF' : '1px solid #666',
      transform: isHovered ? 'scale(1.05)' : 'scale(1)',
      zIndex: isHovered ? 10 : 1,
    };
  }, [currentCellId, neighbors, revealedCells, hoveredCell]);

  // 获取格子图标
  const getCellIcons = (cell: MapCell) => {
    if (!revealedCells.includes(cell.id) && !cell.isRevealed && cell.id !== currentCellId) {
      return ['❓']; // 未探索
    }
    
    const icons: string[] = [];
    for (const feature of cell.features) {
      icons.push(feature.icon);
    }
    
    if (icons.length === 0) {
      icons.push('🌾'); // 空地
    }
    
    return icons.slice(0, 3); // 最多显示 3 个图标
  };

  // 点击格子
  const handleCellClick = (cell: MapCell) => {
    if (cell.id === currentCellId) {
      // 点击当前格子：显示详情
      setSelectedCell(cell);
    } else if (neighbors.includes(cell.id)) {
      // 点击相邻格子：移动
      const cost = calcMoveCost(currentCellId, cell.id);
      if (window.confirm(`移动到 ${TERRAIN_CONFIG[cell.terrain]?.name ?? '未知地形'}？\n消耗 ${cost} 天`)) {
        onMoveToCell(cell.id);
      }
    } else {
      // 点击远处格子：先选中看详情
      setSelectedCell(cell);
    }
  };

  // 渲染 7x7 网格
  const renderGrid = () => {
    const grid = [];
    for (let y = 0; y < 7; y++) {
      const row = [];
      for (let x = 0; x < 7; x++) {
        const cell = CENTRAL_PLAIN_CELLS.find(c => c.x === x && c.y === y);
        if (!cell) {
          row.push(<div key={`empty_${x}_${y}`} style={{ width: 80, height: 80 }} />);
          continue;
        }

        const style = getCellStyle(cell);
        const icons = getCellIcons(cell);

        row.push(
          <div
            key={cell.id}
            onClick={() => handleCellClick(cell)}
            onMouseEnter={() => setHoveredCell(cell.id)}
            onMouseLeave={() => setHoveredCell(null)}
            style={{
              width: 80,
              height: 80,
              ...style,
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 8,
              transition: 'all 0.2s',
              position: 'relative',
              boxShadow: style.border.includes('FFD700') ? '0 0 15px #FFD700' : '0 2px 4px rgba(0,0,0,0.3)',
            }}
            title={`${cell.id} (${cell.x}, ${cell.y}) - ${TERRAIN_CONFIG[cell.terrain]?.name ?? '未知'}`}
          >
            {/* 地形名称 */}
            <div style={{ 
              fontSize: 10, 
              color: '#FFF', 
              textShadow: '0 1px 2px rgba(0,0,0,0.8)',
              position: 'absolute',
              top: 2,
              left: 2,
            }}>
              {(TERRAIN_CONFIG[cell.terrain]?.name ?? '未知').slice(0, 2)}
            </div>

            {/* 图标 */}
            <div style={{ 
              display: 'flex', 
              gap: 2, 
              flexWrap: 'wrap',
              justifyContent: 'center',
              fontSize: 20,
            }}>
              {icons.map((icon, idx) => (
                <span key={idx}>{icon}</span>
              ))}
            </div>

            {/* 海拔指示器 */}
            {cell.elevation! > 0 && (
              <div style={{ 
                fontSize: 9, 
                color: '#FFF', 
                position: 'absolute',
                bottom: 2,
                right: 2,
              }}>
                {'▲'.repeat(cell.elevation!)}
              </div>
            )}

            {/* 当前位置标记 */}
            {cell.id === currentCellId && (
              <div style={{
                position: 'absolute',
                bottom: 2,
                left: 2,
                fontSize: 12,
                color: '#FFD700',
                fontWeight: 'bold',
              }}>
                ★ 你在这里
              </div>
            )}
          </div>
        );
      }
      grid.push(
        <div key={`row_${y}`} style={{ display: 'flex', gap: 4 }}>
          {row}
        </div>
      );
    }
    return grid;
  };

  // 渲染格子详情面板
  const renderCellDetail = () => {
    if (!selectedCell) return null;

    const terrain = TERRAIN_CONFIG[selectedCell.terrain] ?? {
      name: '未知地形',
      color: '#888',
      gradient: 'linear-gradient(135deg, #ccc 0%, #999 100%)',
      moveCost: 1,
      encounterRate: 0,
      description: '神秘的地形',
    };
    const isRevealed = revealedCells.includes(selectedCell.id) || selectedCell.isRevealed;
    const isCurrent = selectedCell.id === currentCellId;
    const isNeighbor = neighbors.includes(selectedCell.id);

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={() => setSelectedCell(null)}
      >
        <div
          style={{
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
            borderRadius: 16,
            padding: 24,
            maxWidth: 500,
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto',
            border: '2px solid #FFD700',
            boxShadow: '0 0 30px rgba(255,215,0,0.3)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 标题 */}
          <h2 style={{ 
            margin: '0 0 16px 0', 
            color: '#FFD700',
            fontSize: 24,
            textAlign: 'center',
          }}>
            {isCurrent ? '★ ' : ''}{selectedCell.id}
          </h2>

          {/* 地形信息 */}
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            borderRadius: 8,
            padding: 12,
            marginBottom: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 24 }}>{terrain.color === '#90EE90' ? '🌾' : 
                terrain.color === '#228B22' ? '🌲' :
                terrain.color === '#8B7355' ? '⛰️' :
                terrain.color === '#4682B4' ? '🌊' :
                terrain.color === '#556B2F' ? '🐊' :
                terrain.color === '#F4A460' ? '🏜️' :
                terrain.color === '#F0F8FF' ? '❄️' :
                terrain.color === '#FF4500' ? '🌋' : '☁️'}</span>
              <div>
                <div style={{ color: '#FFF', fontSize: 18, fontWeight: 'bold' }}>{terrain.name}</div>
                <div style={{ color: '#AAA', fontSize: 12 }}>{terrain.description}</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 14 }}>
              <div style={{ color: '#CCC' }}>移动消耗：<span style={{ color: '#FFD700' }}>{terrain.moveCost} 天</span></div>
              <div style={{ color: '#CCC' }}>遇敌概率：<span style={{ color: '#FF6B6B' }}>{Math.round(terrain.encounterRate * 100)}%</span></div>
              <div style={{ color: '#CCC' }}>海拔：<span style={{ color: '#AAA' }}>{'▲'.repeat(selectedCell.elevation || 0) || '平原'}</span></div>
              <div style={{ color: '#CCC' }}>状态：<span style={{ color: isRevealed ? '#90EE90' : '#FF6B6B' }}>{isRevealed ? '已探索' : '未探索'}</span></div>
            </div>
          </div>

          {/* 格子内容 */}
          <h3 style={{ color: '#FFF', fontSize: 16, margin: '0 0 12px 0' }}>📍 格子内容</h3>
          {!isRevealed && !isCurrent ? (
            <div style={{ color: '#999', textAlign: 'center', padding: 20 }}>
              ❓ 未探索区域，移动至此以揭示内容
            </div>
          ) : selectedCell.features.length === 0 ? (
            <div style={{ color: '#999', textAlign: 'center', padding: 20 }}>
              🌾 空旷地带，暂无特殊内容
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {selectedCell.features.map((feature) => (
                <div
                  key={feature.id}
                  onClick={() => {
                    onCellFeatureClick(feature, selectedCell);
                    setSelectedCell(null);
                  }}
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: 8,
                    padding: 12,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    border: '1px solid transparent',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                    e.currentTarget.style.borderColor = '#FFD700';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                    e.currentTarget.style.borderColor = 'transparent';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 20 }}>{feature.icon}</span>
                    <div>
                      <div style={{ color: '#FFF', fontSize: 14, fontWeight: 'bold' }}>{feature.label}</div>
                      <div style={{ color: '#AAA', fontSize: 11 }}>类型：{
                        feature.type === 'npc' ? 'NPC' :
                        feature.type === 'monster' ? '怪物' :
                        feature.type === 'event' ? '事件' :
                        feature.type === 'random' ? '随机奇遇' :
                        feature.type === 'resource' ? '采集点' :
                        feature.type === 'dungeon' ? '副本' :
                        feature.type === 'city' ? '城市' : '门派'
                      }</div>
                    </div>
                  </div>
                  {feature.description && (
                    <div style={{ color: '#CCC', fontSize: 12, marginTop: 4 }}>
                      {feature.description}
                    </div>
                  )}
                  {/* 怪物信息 */}
                  {feature.type === 'monster' && feature.monsterIds && (
                    <div style={{ color: '#FF6B6B', fontSize: 11, marginTop: 4 }}>
                      怪物：{feature.monsterIds.join(', ')} | 等级 {feature.minLevel}-{feature.maxLevel} | 刷新率 {Math.round((feature.spawnRate || 0) * 100)}%
                    </div>
                  )}
                  {/* 采集信息 */}
                  {feature.type === 'resource' && feature.gatherCount !== undefined && (
                    <div style={{ color: '#90EE90', fontSize: 11, marginTop: 4 }}>
                      可采集 {feature.gatherCount} 次
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* 操作按钮 */}
          <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
            {isNeighbor && !isCurrent && (
              <button
                onClick={() => {
                  onMoveToCell(selectedCell.id);
                  setSelectedCell(null);
                }}
                style={{
                  flex: 1,
                  padding: '12px 0',
                  background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
                  border: 'none',
                  borderRadius: 8,
                  color: '#FFF',
                  fontSize: 16,
                  fontWeight: 'bold',
                  cursor: 'pointer',
                }}
              >
                🚶 移动到此处（{calcMoveCost(currentCellId, selectedCell.id)} 天）
              </button>
            )}
            <button
              onClick={() => setSelectedCell(null)}
              style={{
                flex: isNeighbor && !isCurrent ? 0.5 : 1,
                padding: '12px 0',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid #666',
                borderRadius: 8,
                color: '#FFF',
                fontSize: 16,
                cursor: 'pointer',
              }}
            >
              ✖ 关闭
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ 
      padding: 16, 
      background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
      borderRadius: 12,
      height: '100%',
      overflowY: 'auto',
    }}>
      {/* 标题 */}
      <h2 style={{ 
        margin: '0 0 16px 0', 
        color: '#FFD700',
        fontSize: 24,
        textAlign: 'center',
        textShadow: '0 2px 4px rgba(0,0,0,0.5)',
      }}>
        🗺️ {CENTRAL_PLAIN_REGION.name}
      </h2>

      {/* 区域信息 */}
      <div style={{
        background: 'rgba(255,255,255,0.05)',
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
        fontSize: 14,
        color: '#CCC',
      }}>
        <div style={{ marginBottom: 4 }}>📊 等级范围：Lv.{CENTRAL_PLAIN_REGION.levelRange[0]} - {CENTRAL_PLAIN_REGION.levelRange[1]}</div>
        <div style={{ marginBottom: 4 }}>📍 当前位置：{currentCell?.id}（{currentCell ? (TERRAIN_CONFIG[currentCell.terrain]?.name ?? '未知') : '未知'}）</div>
        <div>🗺️ 已探索：{revealedCells.length + (currentCell ? 1 : 0)} / {CENTRAL_PLAIN_CELLS.length} 格子</div>
      </div>

      {/* 图例 */}
      <div style={{
        display: 'flex',
        gap: 12,
        marginBottom: 16,
        fontSize: 12,
        color: '#AAA',
        flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 16, height: 16, border: '3px solid #FFD700', borderRadius: 4 }} />
          <span>当前位置</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 16, height: 16, border: '2px dashed #FFF', borderRadius: 4 }} />
          <span>可移动</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 16, height: 16, background: '#666', borderRadius: 4, opacity: 0.3 }} />
          <span>未探索</span>
        </div>
      </div>

      {/* 7x7 网格 */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        alignItems: 'center',
      }}>
        {renderGrid()}
      </div>

      {/* 提示 */}
      <div style={{
        marginTop: 16,
        padding: 12,
        background: 'rgba(255,215,0,0.1)',
        borderRadius: 8,
        fontSize: 13,
        color: '#FFD700',
        border: '1px solid rgba(255,215,0,0.3)',
      }}>
        💡 提示：点击相邻格子可移动，点击远处格子查看详情。每个格子可能包含 NPC、怪物、事件、采集点等内容。
      </div>

      {/* 格子详情弹窗 */}
      {renderCellDetail()}
    </div>
  );
};
