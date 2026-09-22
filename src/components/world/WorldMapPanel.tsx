import React, { useState, useMemo } from 'react';
import { CENTRAL_PLAIN_NODES, CENTRAL_PLAIN_EDGES, getNodeById, getNeighbors, findPath, calcPathDays } from '../../data/worldMap';
import type { WorldNode, NodeType, TerrainType } from '../../data/worldMap';

// ============ 类型定义 ============
interface WorldMapPanelProps {
  currentNodeId?: string;
  onMoveToNode?: (nodeId: string, path: string[], days: number) => void;
  travelState?: {
    status: string;
    destinationNodeId: string | null;
    daysRemaining: number;
  };
}

const NODE_TYPE_COLORS: Record<NodeType, string> = {
  city: '#FFD700',
  sect: '#8B4513',
  dungeon: '#696969',
  village: '#32CD32',
  resource: '#20B2AA',
  encounter: '#9370DB',
};

const NODE_TYPE_LABELS: Record<NodeType, string> = {
  city: '主城',
  sect: '门派',
  dungeon: '副本',
  village: '村镇',
  resource: '资源',
  encounter: '奇遇',
};

const TERRAIN_TEXTURES: Record<TerrainType, string> = {
  plain: 'linear-gradient(135deg, #a8d5a2 0%, #8bc34a 100%)',
  hill: 'linear-gradient(135deg, #c2b280 0%, #a0522d 100%)',
  mountain: 'linear-gradient(135deg, #8B7355 0%, #696969 100%)',
  water: 'linear-gradient(135deg, #7EC8E3 0%, #4682B4 100%)',
  forest: 'linear-gradient(135deg, #2E8B57 0%, #1B5E20 100%)',
  underworld: 'linear-gradient(135deg, #4B0082 0%, #2E0854 100%)',
  plateau: 'linear-gradient(135deg, #DAA520 0%, #B8860B 100%)',
};

// ============ 六边形节点组件 ============
const HexNode: React.FC<{
  node: WorldNode;
  isCurrent: boolean;
  isNeighbor: boolean;
  onClick: () => void;
}> = ({ node, isCurrent, isNeighbor, onClick }) => {
  const size = 32; // 六边形半径
  const x = (node.x / 6) * 100;
  const y = (node.y / 6) * 100;

  // 六边形路径
  const hexPath = `
    M ${size * 0.5} ${-size * 0.866}
    L ${size} 0
    L ${size * 0.5} ${size * 0.866}
    L ${-size * 0.5} ${size * 0.866}
    L ${-size} 0
    L ${-size * 0.5} ${-size * 0.866}
    Z
  `;

  return (
    <div
      className={`absolute cursor-pointer transition-all duration-300 ${
        isCurrent ? 'z-20 scale-125' : isNeighbor ? 'z-10 scale-110' : 'z-0 hover:scale-105'
      }`}
      style={{
        left: `${x}%`,
        top: `${y}%`,
        transform: 'translate(-50%, -50%)',
      }}
      onClick={onClick}
      title={`${node.name} (${NODE_TYPE_LABELS[node.type]})`}
    >
      {/* 六边形 SVG */}
      <svg
        width={size * 2.5}
        height={size * 2.5}
        className={`drop-shadow-lg ${isCurrent ? 'filter-brightness-125' : ''}`}
      >
        {/* 地形纹理背景 */}
        <defs>
          <pattern id={`texture-${node.id}`} patternUnits="userSpaceOnUse" width="100" height="100">
            <rect width="100" height="100" fill={TERRAIN_TEXTURES[node.terrain]} />
            {/* 根据地形加纹理图案 */}
            {node.terrain === 'mountain' && (
              <>
                <circle cx="20" cy="20" r="3" fill="rgba(255,255,255,0.2)" />
                <circle cx="60" cy="40" r="2" fill="rgba(255,255,255,0.15)" />
                <circle cx="80" cy="70" r="4" fill="rgba(255,255,255,0.1)" />
              </>
            )}
            {node.terrain === 'water' && (
              <>
                <path d="M 0 50 Q 25 40, 50 50 T 100 50" stroke="rgba(255,255,255,0.3)" fill="none" strokeWidth="2" />
                <path d="M 0 70 Q 25 60, 50 70 T 100 70" stroke="rgba(255,255,255,0.2)" fill="none" strokeWidth="1.5" />
              </>
            )}
            {node.terrain === 'forest' && (
              <>
                <circle cx="30" cy="30" r="8" fill="rgba(0,100,0,0.3)" />
                <circle cx="70" cy="60" r="6" fill="rgba(0,80,0,0.25)" />
                <circle cx="50" cy="80" r="7" fill="rgba(0,120,0,0.2)" />
              </>
            )}
          </pattern>
        </defs>

        {/* 六边形主体 */}
        <path
          d={hexPath}
          fill={`url(#texture-${node.id})`}
          stroke={isCurrent ? '#FFD700' : isNeighbor ? '#32CD32' : NODE_TYPE_COLORS[node.type]}
          strokeWidth={isCurrent ? 4 : isNeighbor ? 3 : 2}
          className={isCurrent ? 'animate-pulse' : ''}
        />

        {/* 节点类型标识（小圆点） */}
        <circle
          cx={size * 0.5}
          cy={-size * 0.3}
          r="4"
          fill={NODE_TYPE_COLORS[node.type]}
          stroke="white"
          strokeWidth="1"
        />

        {/* 文本 */}
        <text
          x={size * 0.5}
          y={size * 0.2}
          textAnchor="middle"
          className="text-[8px] font-bold fill-white drop-shadow"
          style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
        >
          {node.name.length > 4 ? node.name.slice(0, 4) : node.name}
        </text>
        <text
          x={size * 0.5}
          y={size * 0.6}
          textAnchor="middle"
          className="text-[6px] fill-white opacity-80"
        >
          Lv.{node.level}+
        </text>
      </svg>

      {/* 当前节点光圈动画 */}
      {isCurrent && (
        <div className="absolute inset-0 animate-ping rounded-full opacity-30 bg-yellow-400" style={{ width: size * 2.5, height: size * 2.5 }} />
      )}
    </div>
  );
};

// ============ 世界地图面板 ============
export const WorldMapPanel: React.FC<WorldMapPanelProps> = (props) => {
  // 内部状态管理
  const [currentNodeId, setCurrentNodeId] = useState<string>('changan');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [showTravelDialog, setShowTravelDialog] = useState(false);
  const [travelPath, setTravelPath] = useState<string[]>([]);
  const [travelDays, setTravelDays] = useState(0);
  const [isTraveling, setIsTraveling] = useState(false);

  // 如果 props 传入了外部状态，使用外部的
  const actualCurrentNodeId = props.currentNodeId || currentNodeId;
  const actualOnMoveToNode = props.onMoveToNode || ((nodeId: string, path: string[], days: number) => {
    console.log('移动到:', nodeId, '路径:', path, '天数:', days);
    alert(`开始前往 ${getNodeById(nodeId)?.name}！预计 ${days} 天`);
    setIsTraveling(true);
    setTimeout(() => {
      setCurrentNodeId(nodeId);
      setIsTraveling(false);
      alert(`到达 ${getNodeById(nodeId)?.name}！`);
    }, 3000);
  });

  // 获取当前节点
  const currentNode = useMemo(() => getNodeById(actualCurrentNodeId), [actualCurrentNodeId]);

  // 获取相邻节点
  const neighborIds = useMemo(() => getNeighbors(actualCurrentNodeId), [actualCurrentNodeId]);

  // 处理节点点击
  const handleNodeClick = (nodeId: string) => {
    if (nodeId === actualCurrentNodeId) return;

    // 检查是否相邻
    if (!neighborIds.includes(nodeId)) {
      const path = findPath(actualCurrentNodeId, nodeId);
      if (!path) {
        alert('无法到达该节点！');
        return;
      }
      const days = calcPathDays(path);
      setSelectedNodeId(nodeId);
      setTravelPath(path);
      setTravelDays(days);
      setShowTravelDialog(true);
      return;
    }

    // 相邻，直接移动
    const path = [actualCurrentNodeId, nodeId];
    const edge = getEdge(actualCurrentNodeId, nodeId);
    const days = edge?.baseDays || 1;
    setSelectedNodeId(nodeId);
    setTravelPath(path);
    setTravelDays(days);
    setShowTravelDialog(true);
  };

  // 获取连接信息
  function getEdge(from: string, to: string) {
    return CENTRAL_PLAIN_EDGES.find((e: any) =>
      (e.from === from && e.to === to) ||
      (e.isBidirectional && e.from === to && e.to === from)
    );
  }

  // 确认移动
  const handleConfirmTravel = () => {
    if (selectedNodeId && travelPath.length > 0) {
      actualOnMoveToNode(selectedNodeId, travelPath, travelDays);
      setShowTravelDialog(false);
      setSelectedNodeId(null);
    }
  };

  // 取消移动
  const handleCancelTravel = () => {
    setShowTravelDialog(false);
    setSelectedNodeId(null);
  };

  return (
    <div className="world-map-panel p-4 bg-gradient-to-br from-amber-50 to-yellow-100 rounded-lg min-h-screen">
      {/* 标题 */}
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-amber-900 mb-2" style={{ fontFamily: 'serif' }}>
          🗺️ 中原地区 · 世界地图
        </h2>
        <p className="text-sm text-amber-700">
          太吾绘卷风格 · 点击节点探索世界
        </p>
      </div>

      {/* 当前状态 */}
      <div className="mb-4 p-4 bg-white/80 backdrop-blur rounded-lg shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-yellow-500 animate-pulse" />
            <span className="text-sm text-gray-600">当前位置：</span>
            <span className="font-bold text-gray-800">{currentNode?.name || '未知'}</span>
          </div>
          {isTraveling && (
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" />
              前往 {selectedNodeId}：旅途中...
            </div>
          )}
        </div>
      </div>

      {/* 地图容器 */}
      <div className="relative bg-white/60 backdrop-blur rounded-xl shadow-xl p-6" style={{ minHeight: '600px' }}>
        {/* 区域标注 */}
        <div className="absolute top-4 left-4 text-4xl font-bold text-amber-900/20" style={{ fontFamily: 'serif', writingMode: 'vertical-rl' }}>
          中原
        </div>
        <div className="absolute top-4 right-4 text-2xl font-bold text-blue-900/20" style={{ fontFamily: 'serif' }}>
          东海
        </div>

        {/* 连接线（简化版，实际应该用 SVG 画） */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
          {/* 这里应该画连接线，但为了简化先省略 */}
        </svg>

        {/* 节点 */}
        <div className="relative" style={{ zIndex: 2, minHeight: '600px' }}>
          {CENTRAL_PLAIN_NODES.map((node) => (
            <HexNode
              key={node.id}
              node={node}
              isCurrent={node.id === actualCurrentNodeId}
              isNeighbor={neighborIds.includes(node.id)}
              onClick={() => handleNodeClick(node.id)}
            />
          ))}
        </div>
      </div>

      {/* 图例 */}
      <div className="mt-6 grid grid-cols-3 gap-3 text-sm">
        {Object.entries(NODE_TYPE_LABELS).map(([type, label]) => (
          <div key={type} className="flex items-center gap-2 p-2 bg-white/70 rounded-lg">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: NODE_TYPE_COLORS[type as NodeType] }}
            />
            <span className="text-gray-700">{label}</span>
          </div>
        ))}
      </div>

      {/* 地形图例 */}
      <div className="mt-4 grid grid-cols-4 gap-2 text-xs">
        {Object.entries(TERRAIN_TEXTURES).map(([terrain, _]) => (
          <div key={terrain} className="flex items-center gap-1 p-1 bg-white/50 rounded">
            <div
              className="w-3 h-3 rounded-full"
              style={{ background: TERRAIN_TEXTURES[terrain as TerrainType] }}
            />
            <span className="text-gray-600">{terrain}</span>
          </div>
        ))}
      </div>

      {/* 旅行确认对话框 */}
      {showTravelDialog && selectedNodeId && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-amber-50 to-yellow-100 rounded-2xl p-8 max-w-lg w-full mx-4 shadow-2xl border-2 border-amber-300">
            <h3 className="text-2xl font-bold text-amber-900 mb-6 text-center" style={{ fontFamily: 'serif' }}>
              🏯 确认行程
            </h3>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">目的地：</span>
                <span className="font-bold text-xl text-gray-800">
                  {getNodeById(selectedNodeId)?.name || '未知'}
                </span>
              </div>

              <div>
                <span className="text-gray-600">路径：</span>
                <div className="mt-2 p-3 bg-white/70 rounded-lg">
                  {travelPath.map((nodeId, index) => (
                    <span key={nodeId} className="inline-flex items-center gap-1">
                      <span className="font-medium text-gray-700">
                        {getNodeById(nodeId)?.name || nodeId}
                      </span>
                      {index < travelPath.length - 1 && (
                        <span className="text-amber-600 mx-1">→</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-600">预计天数：</span>
                <span className="font-bold text-2xl text-blue-600">{travelDays} 天</span>
              </div>

              <div className="p-3 bg-amber-100/70 rounded-lg text-sm text-amber-800">
                ⚠️ 路上可能遭遇敌人、商人或特殊事件，请做好准备！
              </div>
            </div>

            <div className="flex gap-4 justify-center">
              <button
                onClick={handleCancelTravel}
                className="px-6 py-3 text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors font-medium"
              >
                取消
              </button>
              <button
                onClick={handleConfirmTravel}
                className="px-6 py-3 text-sm bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white rounded-lg transition-all shadow-md hover:shadow-lg font-medium"
              >
                确认出发 🚀
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
