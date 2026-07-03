import React, { useState, useMemo } from 'react';
import { CENTRAL_PLAIN_NODES, getNodeById, getNeighbors, findPath, calcPathDays, TERRAIN_COLORS } from '../../data/worldMap';
import type { WorldNode, NodeType } from '../../data/worldMap';

// ============ 类型定义 ============
interface WorldMapPanelProps {
  // 所有 props 都是可选的，组件内部自己管理状态
  currentNodeId?: string;
  onMoveToNode?: (nodeId: string, path: string[], days: number) => void;
  travelState?: {
    status: string;
    destinationNodeId: string | null;
    daysRemaining: number;
  };
}

const NODE_TYPE_COLORS: Record<NodeType, string> = {
  city: '#FFD700', // 金色
  sect: '#8B4513', //  saddlebrown
  dungeon: '#696969', //  dimgray
  village: '#32CD32', //  limegreen
  resource: '#20B2AA', //  lightseagreen
  encounter: '#9370DB', //  mediumpurple
};

const NODE_TYPE_LABELS: Record<NodeType, string> = {
  city: '主城',
  sect: '门派',
  dungeon: '副本',
  village: '村镇',
  resource: '资源',
  encounter: '奇遇',
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
    // 模拟旅行：3秒后到达
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
    if (nodeId === actualCurrentNodeId) return; // 不能点当前节点

    // 检查是否相邻
    if (!neighborIds.includes(nodeId)) {
      // 不相邻，计算路径
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

  // 获取连接信息（辅助函数）
  function getEdge(from: string, to: string) {
    // 简化：从 CENTRAL_PLAIN_EDGES 查找
    const { CENTRAL_PLAIN_EDGES } = require('../../data/worldMap');
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
    <div className="world-map-panel p-4 bg-gray-50 rounded-lg">
      <h2 className="text-lg font-bold text-gray-800 mb-4">🌍 世界地图 (中原地区)</h2>

      {/* 当前状态 */}
      <div className="mb-4 p-3 bg-white rounded-lg shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm text-gray-500">当前位置：</span>
            <span className="font-bold text-gray-800">{currentNode?.name || '未知'}</span>
          </div>
          {isTraveling && (
            <div className="text-sm text-blue-600">
              前往 {selectedNodeId}：旅途中...
            </div>
          )}
        </div>
      </div>

      {/* 节点网格 */}
      <div className="relative bg-white rounded-lg shadow-sm p-4" style={{ minHeight: '500px' }}>
        {/* 连接线 */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
          {/* 这里应该画连接线，但为了简化，先省略 */}
        </svg>

        {/* 节点 */}
        {CENTRAL_PLAIN_NODES.map((node) => {
          const isCurrent = node.id === actualCurrentNodeId;
          const isNeighbor = neighborIds.includes(node.id);
          const x = (node.x / 6) * 100;
          const y = (node.y / 6) * 100;

          return (
            <div
              key={node.id}
              className={`absolute w-16 h-16 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 ${
                isCurrent
                  ? 'ring-4 ring-blue-500 scale-110'
                  : isNeighbor
                  ? 'ring-2 ring-green-400 hover:scale-105'
                  : 'hover:scale-105 opacity-80'
              }`}
              style={{
                left: `${x}%`,
                top: `${y}%`,
                transform: 'translate(-50%, -50%)',
                backgroundColor: NODE_TYPE_COLORS[node.type],
                zIndex: 2,
              }}
              onClick={() => handleNodeClick(node.id)}
              title={`${node.name} (${NODE_TYPE_LABELS[node.type]})`}
            >
              <div className="text-center">
                <div className="text-xs font-bold text-white drop-shadow">{node.name}</div>
                <div className="text-[10px] text-white opacity-80">{node.level}+</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 图例 */}
      <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
        {Object.entries(NODE_TYPE_LABELS).map(([type, label]) => (
          <div key={type} className="flex items-center gap-1">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: NODE_TYPE_COLORS[type as NodeType] }}
            />
            <span className="text-gray-600">{label}</span>
          </div>
        ))}
      </div>

      {/* 旅行确认对话框 */}
      {showTravelDialog && selectedNodeId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-800 mb-4">🗺️ 确认行程</h3>

            <div className="space-y-3 mb-4">
              <div>
                <span className="text-sm text-gray-500">目的地：</span>
                <span className="font-bold text-gray-800">
                  {getNodeById(selectedNodeId)?.name || '未知'}
                </span>
              </div>

              <div>
                <span className="text-sm text-gray-500">路径：</span>
                <div className="text-sm text-gray-700 mt-1">
                  {travelPath.map((nodeId, index) => (
                    <span key={nodeId}>
                      {getNodeById(nodeId)?.name || nodeId}
                      {index < travelPath.length - 1 && ' → '}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-sm text-gray-500">预计天数：</span>
                <span className="font-bold text-blue-600">{travelDays} 天</span>
              </div>

              <div className="text-sm text-gray-500">
                * 路上可能遭遇敌人、商人或特殊事件
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancelTravel}
                className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleConfirmTravel}
                className="px-4 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                确认出发
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
