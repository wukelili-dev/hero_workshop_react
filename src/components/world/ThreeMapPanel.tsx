// ============ Three.js 3D 地图面板 ============
// 透视相机 + 地形高度 + 悬停高亮 + 2D 图标贴图

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { 
  CENTRAL_PLAIN_CELLS, 
  TERRAIN_CONFIG,
  getCellById,
  getNeighbors,
  calcMoveCost,
  type MapCell,
  type CellFeature 
} from '../../data/cellMap';

interface ThreeMapPanelProps {
  currentCellId: string;
  revealedCells: string[];
  onMoveToCell: (cellId: string) => void;
  onCellFeatureClick: (feature: CellFeature, cell: MapCell) => void;
}

// 地形颜色映射
const TERRAIN_COLORS: Record<string, number> = {
  plains: 0x90EE90,
  forest: 0x228B22,
  mountain: 0x8B7355,
  water: 0x4682B4,
  swamp: 0x556B2F,
  desert: 0xF4A460,
  snow: 0xF0F8FF,
  volcanic: 0xFF4500,
  celestial: 0xFFD700,
};

// 海拔高度映射
const ELEVATION_HEIGHTS: Record<number, number> = {
  0: 0.5,   // 平原
  1: 1.0,   // 丘陵
  2: 1.8,   // 山地
  3: 2.5,   // 高峰
};

export const ThreeMapPanel: React.FC<ThreeMapPanelProps> = ({
  currentCellId,
  revealedCells,
  onMoveToCell,
  onCellFeatureClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());
  const cellMeshesRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const hoveredCellRef = useRef<string | null>(null);
  const animationFrameRef = useRef<number>(0);
  
  const [selectedCell, setSelectedCell] = useState<MapCell | null>(null);
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);

  const currentCell = getCellById(currentCellId);
  const neighbors = currentCell ? getNeighbors(currentCellId) : [];

  // 初始化 Three.js 场景
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 场景
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);
    scene.fog = new THREE.Fog(0x1a1a2e, 10, 50);
    sceneRef.current = scene;

    // 透视相机
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(8, 12, 12);
    camera.lookAt(3, 0, 3);
    cameraRef.current = camera;

    // 渲染器
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 灯光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    scene.add(dirLight);

    // 点光源（模拟仙气）
    const pointLight = new THREE.PointLight(0xFFD700, 0.5, 20);
    pointLight.position.set(3, 5, 0);
    scene.add(pointLight);

    // 创建格子
    const cellSize = 0.9;
    const cellGap = 0.05;

    CENTRAL_PLAIN_CELLS.forEach((cell) => {
      const elevation = cell.elevation || 0;
      const height = ELEVATION_HEIGHTS[elevation] || 0.5;
      const color = TERRAIN_COLORS[cell.terrain] || 0x888888;
      
      // 格子几何体
      const geometry = new THREE.BoxGeometry(cellSize, height, cellSize);
      // 移动几何体使底部在 y=0
      geometry.translate(0, height / 2, 0);
      
      const material = new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.8,
        metalness: 0.1,
      });
      
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(
        cell.x * (cellSize + cellGap),
        0,
        cell.y * (cellSize + cellGap)
      );
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData = { cellId: cell.id, originalColor: color };
      
      scene.add(mesh);
      cellMeshesRef.current.set(cell.id, mesh);

      // 添加格子内容图标（2D Sprite）
      if (cell.features.length > 0) {
        const feature = cell.features[0];
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d')!;
        
        // 绘制圆形背景
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.beginPath();
        ctx.arc(32, 32, 28, 0, Math.PI * 2);
        ctx.fill();
        
        // 绘制图标文字
        ctx.font = '32px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(feature.icon, 32, 32);
        
        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.position.set(
          cell.x * (cellSize + cellGap),
          height + 0.5,
          cell.y * (cellSize + cellGap)
        );
        sprite.scale.set(0.5, 0.5, 0.5);
        scene.add(sprite);
      }
    });

    // 当前位置标记
    if (currentCell) {
      const markerGeometry = new THREE.SphereGeometry(0.15, 16, 16);
      const markerMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xFFD700,
        transparent: true,
        opacity: 0.9,
      });
      const marker = new THREE.Mesh(markerGeometry, markerMaterial);
      const height = ELEVATION_HEIGHTS[currentCell.elevation || 0] || 0.5;
      marker.position.set(
        currentCell.x * (cellSize + cellGap),
        height + 0.3,
        currentCell.y * (cellSize + cellGap)
      );
      marker.userData = { isMarker: true };
      scene.add(marker);
      
      // 标记动画
      const animateMarker = () => {
        marker.position.y = height + 0.3 + Math.sin(Date.now() * 0.003) * 0.1;
        animationFrameRef.current = requestAnimationFrame(animateMarker);
      };
      animateMarker();
    }

    // 渲染循环
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    // 窗口大小调整
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameRef.current);
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, [currentCellId]);

  // 鼠标移动 - 悬停检测
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current || !cameraRef.current || !sceneRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    
    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
    const intersects = raycasterRef.current.intersectObjects(
      Array.from(cellMeshesRef.current.values())
    );
    
    if (intersects.length > 0) {
      const mesh = intersects[0].object as THREE.Mesh;
      const cellId = mesh.userData.cellId;
      
      if (hoveredCellRef.current !== cellId) {
        // 恢复之前悬停的格子
        if (hoveredCellRef.current) {
          const prevMesh = cellMeshesRef.current.get(hoveredCellRef.current);
          if (prevMesh) {
            (prevMesh.material as THREE.MeshStandardMaterial).emissive.setHex(0x000000);
          }
        }
        
        // 高亮新格子
        hoveredCellRef.current = cellId;
        setHoveredCell(cellId);
        (mesh.material as THREE.MeshStandardMaterial).emissive.setHex(0x444444);
      }
    } else {
      // 恢复悬停
      if (hoveredCellRef.current) {
        const prevMesh = cellMeshesRef.current.get(hoveredCellRef.current);
        if (prevMesh) {
          (prevMesh.material as THREE.MeshStandardMaterial).emissive.setHex(0x000000);
        }
        hoveredCellRef.current = null;
        setHoveredCell(null);
      }
    }
  }, []);

  // 点击 - 选中/移动
  const handleClick = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current || !cameraRef.current || !sceneRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    
    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
    const intersects = raycasterRef.current.intersectObjects(
      Array.from(cellMeshesRef.current.values())
    );
    
    if (intersects.length > 0) {
      const mesh = intersects[0].object as THREE.Mesh;
      const cellId = mesh.userData.cellId;
      const cell = getCellById(cellId);
      
      if (!cell) return;
      
      if (cellId === currentCellId) {
        // 点击当前格子：显示详情
        setSelectedCell(cell);
      } else if (neighbors.includes(cellId)) {
        // 点击相邻格子：移动
        const cost = calcMoveCost(currentCellId, cellId);
        if (window.confirm(`移动到 ${TERRAIN_CONFIG[cell.terrain]?.name ?? '未知'}？\n消耗 ${cost} 天`)) {
          onMoveToCell(cellId);
        }
      } else {
        // 点击远处格子：显示详情
        setSelectedCell(cell);
      }
    }
  }, [currentCellId, neighbors, onMoveToCell]);

  // 渲染格子详情弹窗
  const renderCellDetail = () => {
    if (!selectedCell) return null;
    
    const terrain = TERRAIN_CONFIG[selectedCell.terrain] ?? {
      name: '未知地形',
      color: '#888',
      moveCost: 1,
      encounterRate: 0,
      description: '神秘的地形',
    };
    const isRevealed = revealedCells.includes(selectedCell.id) || selectedCell.isRevealed;
    const isCurrent = selectedCell.id === currentCellId;
    const isNeighbor = neighbors.includes(selectedCell.id);

    return (
      <div 
        style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
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
            maxWidth: 400,
            width: '90%',
            border: '2px solid #FFD700',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <h2 style={{ color: '#FFD700', margin: '0 0 16px 0' }}>
            {isCurrent ? '★ ' : ''}{selectedCell.id}
          </h2>
          
          <div style={{ color: '#FFF', marginBottom: 8 }}>
            地形：{terrain.name}
          </div>
          <div style={{ color: '#AAA', fontSize: 14, marginBottom: 16 }}>
            {terrain.description}
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 14, color: '#CCC' }}>
            <div>移动消耗：{terrain.moveCost} 天</div>
            <div>遇敌概率：{Math.round((terrain.encounterRate || 0) * 100)}%</div>
            <div>海拔：{'▲'.repeat(selectedCell.elevation || 0) || '平原'}</div>
            <div>状态：<span style={{ color: isRevealed ? '#90EE90' : '#FF6B6B' }}>{isRevealed ? '已探索' : '未探索'}</span></div>
          </div>

          {isNeighbor && !isCurrent && (
            <button
              onClick={() => {
                onMoveToCell(selectedCell.id);
                setSelectedCell(null);
              }}
              style={{
                width: '100%',
                marginTop: 16,
                padding: 12,
                background: '#FFD700',
                border: 'none',
                borderRadius: 8,
                color: '#000',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              移动至此
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* 3D 画布容器 */}
      <div 
        ref={containerRef}
        style={{ 
          flex: 1, 
          minHeight: 0,
          cursor: hoveredCell ? 'pointer' : 'default',
        }}
        onMouseMove={handleMouseMove}
        onClick={handleClick}
      />
      
      {/* 信息面板 */}
      <div style={{
        padding: 12,
        background: 'rgba(0,0,0,0.8)',
        borderTop: '1px solid #333',
      }}>
        <div style={{ color: '#FFD700', fontSize: 14, marginBottom: 4 }}>
          🎮 3D 地图模式
        </div>
        <div style={{ color: '#AAA', fontSize: 12 }}>
          悬停高亮 | 点击选中/移动 | 金色标记为当前位置
        </div>
        {hoveredCell && (
          <div style={{ color: '#FFF', fontSize: 12, marginTop: 4 }}>
            悬停: {hoveredCell}
          </div>
        )}
      </div>

      {renderCellDetail()}
    </div>
  );
};
