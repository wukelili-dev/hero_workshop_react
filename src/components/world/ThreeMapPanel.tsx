// ============ Three.js 3D 地图面板 ============
// 太吾绘卷风格：等距视角 + 地形细节 + 暗色描边 + 金色玩家标记 + 头像浮标 + NPC光柱 + 未探索迷雾

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

// ---------- 颜色常量 ----------
const TERRAIN_COLORS: Record<string, number> = {
  plains:    0x7ec850,
  forest:    0x2d7a2d,
  mountain:  0x7a6a4a,
  water:     0x2a6ba0,
  swamp:     0x5a6b3e,
  desert:    0xc4a050,
  snow:      0xc8d8e0,
  volcanic:  0x6a2010,
  celestial: 0xd0b840,
};

const ELEVATION_HEIGHTS: Record<number, number> = {
  0: 0.25,
  1: 0.50,
  2: 0.85,
  3: 1.20,
};

// ---------- 地形装饰物 ----------
function createTerrainDecorations(cell: MapCell, cellSize: number, height: number): THREE.Group {
  const group = new THREE.Group();
  const half = cellSize * 0.35;

  switch (cell.terrain) {
    case 'forest': {
      // 3-4 棵树（树干 + 树冠）
      const treeCount = 3 + Math.floor(Math.random() * 2);
      for (let i = 0; i < treeCount; i++) {
        const tg = new THREE.Group();
        const trunk = new THREE.Mesh(
          new THREE.CylinderGeometry(0.025, 0.04, 0.18, 5),
          new THREE.MeshStandardMaterial({ color: 0x5a3a1a, roughness: 0.9 })
        );
        trunk.position.y = 0.09;
        tg.add(trunk);
        const crown = new THREE.Mesh(
          new THREE.ConeGeometry(0.10 + Math.random() * 0.06, 0.18 + Math.random() * 0.06, 5),
          new THREE.MeshStandardMaterial({ color: 0x2a6a2a, roughness: 0.85 })
        );
        crown.position.y = 0.26;
        tg.add(crown);
        tg.position.set((Math.random() - 0.5) * half, height, (Math.random() - 0.5) * half);
        group.add(tg);
      }
      break;
    }
    case 'mountain': {
      // 主峰
      const peak = new THREE.Mesh(
        new THREE.ConeGeometry(0.22, 0.38, 5),
        new THREE.MeshStandardMaterial({ color: 0x7a6a4a, roughness: 0.95 })
      );
      peak.position.set(0.04, height + 0.19, -0.03);
      group.add(peak);
      // 雪顶（雪原添加白色尖顶）
      if (cell.elevation && cell.elevation >= 2) {
        const snowCap = new THREE.Mesh(
          new THREE.ConeGeometry(0.08, 0.12, 5),
          new THREE.MeshStandardMaterial({ color: 0xf0f8ff, roughness: 0.8 })
        );
        snowCap.position.set(0.04, height + 0.39, -0.03);
        group.add(snowCap);
      }
      // 碎石
      for (let i = 0; i < 3; i++) {
        const peb = new THREE.Mesh(
          new THREE.DodecahedronGeometry(0.025 + Math.random() * 0.02),
          new THREE.MeshStandardMaterial({ color: 0x6a5a3a, roughness: 0.9 })
        );
        peb.position.set((Math.random() - 0.5) * half, height + 0.02, (Math.random() - 0.5) * half);
        group.add(peb);
      }
      break;
    }
    case 'water': {
      // 水流波纹（透明平面加浅色线条做装饰）
      for (let i = 0; i < 4; i++) {
        const wave = new THREE.Mesh(
          new THREE.PlaneGeometry(0.15, 0.02),
          new THREE.MeshBasicMaterial({ color: 0x6aaee0, transparent: true, opacity: 0.3, side: THREE.DoubleSide })
        );
        wave.rotation.x = -Math.PI / 2;
        wave.position.set((Math.random() - 0.5) * half, height + 0.01, (Math.random() - 0.5) * half);
        group.add(wave);
      }
      break;
    }
    case 'swamp': {
      // 枯木桩
      for (let i = 0; i < 2; i++) {
        const stump = new THREE.Mesh(
          new THREE.CylinderGeometry(0.015, 0.035, 0.12, 5),
          new THREE.MeshStandardMaterial({ color: 0x3a2a1a, roughness: 1.0 })
        );
        stump.position.set((Math.random() - 0.5) * half, height + 0.06, (Math.random() - 0.5) * half);
        group.add(stump);
      }
      // 气泡
      for (let i = 0; i < 3; i++) {
        const bubble = new THREE.Mesh(
          new THREE.SphereGeometry(0.015, 4, 4),
          new THREE.MeshBasicMaterial({ color: 0x88aa66, transparent: true, opacity: 0.3 })
        );
        bubble.position.set((Math.random() - 0.5) * half, height + 0.01, (Math.random() - 0.5) * half);
        group.add(bubble);
      }
      break;
    }
    case 'desert': {
      // 仙人掌
      const cacti = new THREE.Mesh(
        new THREE.CylinderGeometry(0.018, 0.04, 0.22, 5),
        new THREE.MeshStandardMaterial({ color: 0x3a6a2a, roughness: 0.9 })
      );
      cacti.position.set(0.06, height + 0.11, -0.04);
      group.add(cacti);
      // 小沙丘（半球）
      const dune = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 6, 4),
        new THREE.MeshStandardMaterial({ color: 0xb89050, roughness: 0.9 })
      );
      dune.scale.set(1, 0.3, 1);
      dune.position.set(-0.06, height + 0.02, 0.05);
      group.add(dune);
      break;
    }
    case 'snow': {
      // 雪堆
      for (let i = 0; i < 3; i++) {
        const ball = new THREE.Mesh(
          new THREE.SphereGeometry(0.04 + Math.random() * 0.03, 4, 4),
          new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 })
        );
        ball.scale.set(1, 0.4, 1);
        ball.position.set((Math.random() - 0.5) * half, height + 0.01, (Math.random() - 0.5) * half);
        group.add(ball);
      }
      break;
    }
    case 'volcanic': {
      // 火山锥
      const cone = new THREE.Mesh(
        new THREE.ConeGeometry(0.18, 0.32, 6),
        new THREE.MeshStandardMaterial({ color: 0x3a1010, roughness: 0.95 })
      );
      cone.position.set(0, height + 0.16, 0);
      group.add(cone);
      // 岩浆发光
      const lava = new THREE.Mesh(
        new THREE.SphereGeometry(0.05, 6, 6),
        new THREE.MeshBasicMaterial({ color: 0xff5500 })
      );
      lava.position.set(0, height + 0.36, 0);
      group.add(lava);
      break;
    }
    case 'celestial': {
      // 飘浮光点
      for (let i = 0; i < 5; i++) {
        const dot = new THREE.Mesh(
          new THREE.SphereGeometry(0.025, 4, 4),
          new THREE.MeshBasicMaterial({ color: 0xffd700, transparent: true, opacity: 0.5 })
        );
        const angle = (i / 5) * Math.PI * 2;
        const r = 0.18;
        dot.position.set(Math.cos(angle) * r, height + 0.12 + Math.sin(angle * 2) * 0.05, Math.sin(angle) * r);
        group.add(dot);
      }
      // 底座光晕
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.05, 0.2, 12),
        new THREE.MeshBasicMaterial({ color: 0xffd700, transparent: true, opacity: 0.15, side: THREE.DoubleSide })
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(0, height + 0.01, 0);
      group.add(ring);
      break;
    }
    default: break;
  }

  // 城市/门派建筑
  if (cell.features.some(f => f.type === 'city')) {
    const building = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.22, 0.18),
      new THREE.MeshStandardMaterial({ color: 0xc0a060, roughness: 0.7 })
    );
    building.position.set(0, height + 0.11, 0);
    group.add(building);
    // 屋顶
    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(0.14, 0.12, 4),
      new THREE.MeshStandardMaterial({ color: 0x8a3020, roughness: 0.6 })
    );
    roof.position.set(0, height + 0.28, 0);
    roof.rotation.y = Math.PI / 4;
    group.add(roof);
  }
  if (cell.features.some(f => f.type === 'sect')) {
    const hall = new THREE.Mesh(
      new THREE.BoxGeometry(0.20, 0.18, 0.16),
      new THREE.MeshStandardMaterial({ color: 0xcc8844, roughness: 0.7 })
    );
    hall.position.set(0, height + 0.09, 0);
    group.add(hall);
    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(0.16, 0.14, 4),
      new THREE.MeshStandardMaterial({ color: 0xaa4422, roughness: 0.6 })
    );
    roof.position.set(0, height + 0.25, 0);
    group.add(roof);
  }

  return group;
}

// ---------- NPC/怪物光柱 ----------
function createNpcPillar(height: number): THREE.Group {
  const group = new THREE.Group();
  const pillar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.05, 0.55, 6),
    new THREE.MeshBasicMaterial({ color: 0x44aaff, transparent: true, opacity: 0.25, depthWrite: false })
  );
  pillar.position.y = height + 0.275;
  group.add(pillar);
  const light = new THREE.Mesh(
    new THREE.SphereGeometry(0.05, 6, 6),
    new THREE.MeshBasicMaterial({ color: 0x88ccff })
  );
  light.position.y = height + 0.58;
  group.add(light);
  return group;
}

// ---------- 创建头像 Sprite ----------
function createAvatarSprite(size: number = 64): THREE.Sprite {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d')!;
  
  // 金色光环
  ctx.shadowColor = '#FFD700';
  ctx.shadowBlur = 12;
  ctx.fillStyle = '#FFD700';
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  
  // 白色内圈
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2 - 6, 0, Math.PI * 2);
  ctx.fill();
  
  // 头像 emoji
  ctx.font = `${size * 0.5}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🧑', size / 2, size / 2 + 1);
  
  const texture = new THREE.CanvasTexture(c);
  const mat = new THREE.SpriteMaterial({ map: texture, depthTest: true });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(0.6, 0.6, 0.6);
  return sprite;
}

// ---------- 创建特征 Sprite ----------
function createFeatureSprite(feature: CellFeature): THREE.Sprite {
  const c = document.createElement('canvas');
  c.width = 48;
  c.height = 48;
  const ctx = c.getContext('2d')!;
  
  // 半透明圆形背景
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.arc(24, 24, 20, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.font = '26px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(feature.icon, 24, 25);
  
  const texture = new THREE.CanvasTexture(c);
  const mat = new THREE.SpriteMaterial({ map: texture, depthTest: true });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(0.35, 0.35, 0.35);
  return sprite;
}

// ============ 主组件 ============
const ThreeMapPanelInner: React.FC<ThreeMapPanelProps> = ({
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
  const cellGroupsRef = useRef<Map<string, THREE.Group>>(new Map());
  const hoveredCellRef = useRef<string | null>(null);
  const animationFrameRef = useRef<number>(0);
  const timeRef = useRef<number>(0);
  const avatarSpriteRef = useRef<THREE.Sprite | null>(null);
  const avatarGlowRef = useRef<THREE.Mesh | null>(null);
  const currentBorderRef = useRef<THREE.Mesh | null>(null);

  const [selectedCell, setSelectedCell] = useState<MapCell | null>(null);
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);

  const currentCell = getCellById(currentCellId);
  const neighbors = currentCell ? getNeighbors(currentCellId) : [];

  // 存储 revealedCells 为 ref 以避免闭包过时
  const revealedRef = useRef(revealedCells);
  revealedRef.current = revealedCells;

  // ---------- 初始化 Three.js 场景 ----------
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let width = container.clientWidth || 500;
    let height = container.clientHeight || 400;

    // 场景
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0c0c1a);
    scene.fog = new THREE.Fog(0x0c0c1a, 12, 25);
    sceneRef.current = scene;

    // 等距透视相机
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 1000);
    camera.position.set(5, 8, 10);
    camera.lookAt(3, 0, 3);
    cameraRef.current = camera;

    // 渲染器
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 灯光
    const ambient = new THREE.AmbientLight(0x404060, 0.5);
    scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xffeedd, 0.8);
    sun.position.set(6, 12, 4);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    scene.add(sun);

    const fill = new THREE.DirectionalLight(0x4488ff, 0.3);
    fill.position.set(-4, 6, -6);
    scene.add(fill);

    // 底部大气光
    const rim = new THREE.DirectionalLight(0x6644ff, 0.2);
    rim.position.set(0, -5, 8);
    scene.add(rim);

    // ---------- 创建格子 ----------
    const cellSize = 0.85;
    const cellGap = 0.10;

    CENTRAL_PLAIN_CELLS.forEach((cell) => {
      const elev = cell.elevation || 0;
      const h = ELEVATION_HEIGHTS[elev] || 0.25;
      const color = TERRAIN_COLORS[cell.terrain] || 0x666666;
      const isRevealed = revealedRef.current.includes(cell.id) || cell.isRevealed;

      const group = new THREE.Group();
      const px = cell.x * (cellSize + cellGap);
      const pz = cell.y * (cellSize + cellGap);
      group.position.set(px, 0, pz);

      // 基底方块
      const baseGeo = new THREE.BoxGeometry(cellSize, h, cellSize);
      baseGeo.translate(0, h / 2, 0);
      const baseMat = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.85,
        metalness: 0.05,
      });
      const baseMesh = new THREE.Mesh(baseGeo, baseMat);
      baseMesh.castShadow = true;
      baseMesh.receiveShadow = true;
      baseMesh.userData = { cellId: cell.id };
      group.add(baseMesh);

      // 暗色边框
      const edgeGeo = new THREE.EdgesGeometry(baseGeo);
      const edgeMat = new THREE.LineBasicMaterial({ color: 0x111122, transparent: true, opacity: 0.9 });
      const edgeLine = new THREE.LineSegments(edgeGeo, edgeMat);
      group.add(edgeLine);

      // 地形装饰
      const decor = createTerrainDecorations(cell, cellSize, h);
      group.add(decor);

      // 特征 Sprite
      if (cell.features.length > 0) {
        const sprite = createFeatureSprite(cell.features[0]);
        sprite.position.set(0, h + 0.35, 0);
        group.add(sprite);
      }

      // NPC/怪物光柱
      if (cell.features.some(f => f.type === 'npc' || f.type === 'monster')) {
        const pillar = createNpcPillar(h);
        group.add(pillar);
      }

      // 未探索迷雾（使用初始 revealedCells）
      if (!isRevealed) {
        const fogMat = new THREE.MeshBasicMaterial({
          color: 0x0c0c1a,
          transparent: true,
          opacity: 0.75,
          depthWrite: false,
        });
        const fogPlane = new THREE.Mesh(
          new THREE.PlaneGeometry(cellSize + 0.15, cellSize + 0.15),
          fogMat
        );
        fogPlane.rotation.x = -Math.PI / 2;
        fogPlane.position.y = h + 0.02;
        group.add(fogPlane);
      }

      scene.add(group);
      cellGroupsRef.current.set(cell.id, group);
    });

    // ---------- 当前位置标记 ----------
    if (currentCell) {
      const elev = currentCell.elevation || 0;
      const cellH = ELEVATION_HEIGHTS[elev] || 0.25;
      const px = currentCell.x * (cellSize + cellGap);
      const pz = currentCell.y * (cellSize + cellGap);

      // 金色边框（放在格子上方略微浮空）
      const borderGeo = new THREE.BoxGeometry(cellSize + 0.08, 0.015, cellSize + 0.08);
      const borderMat = new THREE.MeshBasicMaterial({ color: 0xffd700, transparent: true, opacity: 0.5 });
      const border = new THREE.Mesh(borderGeo, borderMat);
      border.position.set(px, cellH + 0.02, pz);
      scene.add(border);
      currentBorderRef.current = border;

      // 底部光晕
      const glowGeo = new THREE.RingGeometry(0.08, 0.28, 16);
      const glowMat = new THREE.MeshBasicMaterial({
        color: 0xffd700,
        transparent: true,
        opacity: 0.15,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const glow = new THREE.Mesh(glowGeo, glowMat);
      glow.rotation.x = -Math.PI / 2;
      glow.position.set(px, cellH + 0.01, pz);
      scene.add(glow);
      avatarGlowRef.current = glow;

      // 头像 Sprite
      const avatar = createAvatarSprite();
      avatar.position.set(px, cellH + 0.6, pz);
      scene.add(avatar);
      avatarSpriteRef.current = avatar;
    }

    // ---------- 阴影接收地面 ----------
    const shadowMat = new THREE.ShadowMaterial({ opacity: 0.15, color: 0x000022 });
    const shadowPlane = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), shadowMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.set(3, -0.05, 3);
    shadowPlane.receiveShadow = true;
    scene.add(shadowPlane);

    // ---------- 渲染循环 ----------
    const animate = () => {
      timeRef.current = Date.now() * 0.001;
      animationFrameRef.current = requestAnimationFrame(animate);

      // 头像呼吸动画
      if (avatarSpriteRef.current) {
        const float = Math.sin(timeRef.current * 2) * 0.04;
        avatarSpriteRef.current.position.y += float * 0.01;
        const baseY = avatarSpriteRef.current.position.y;
        // 直接这里做完整浮动
        const elev = (currentCell?.elevation || 0);
        const cellH = ELEVATION_HEIGHTS[elev] || 0.25;
        avatarSpriteRef.current.position.y = cellH + 0.6 + Math.sin(timeRef.current * 2) * 0.06;
      }
      if (avatarGlowRef.current) {
        avatarGlowRef.current.material.opacity = 0.1 + Math.sin(timeRef.current * 1.5) * 0.05;
      }
      if (currentBorderRef.current) {
        currentBorderRef.current.material.opacity = 0.4 + Math.sin(timeRef.current * 1.2) * 0.15;
      }

      renderer.render(scene, camera);
    };
    animate();

    // ---------- 窗口尺寸变化 ----------
    const onResize = () => {
      if (!containerRef.current || !camera || !renderer) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      if (w > 0 && h > 0) {
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }
    };
    window.addEventListener('resize', onResize);
    const ro = new ResizeObserver(onResize);
    ro.observe(container);

    return () => {
      window.removeEventListener('resize', onResize);
      ro.disconnect();
      cancelAnimationFrame(animationFrameRef.current);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []); // 仅 mount 时执行

  // ---------- 更新相机看向当前格子 ----------
  useEffect(() => {
    if (!cameraRef.current) return;
    const parts = currentCellId.split('_');
    if (parts.length < 3) return;
    const cx = parseInt(parts[1]);
    const cz = parseInt(parts[2]);
    if (!isNaN(cx) && !isNaN(cz)) {
      cameraRef.current.lookAt(cx, 0, cz);
    }
  }, [currentCellId]);

  // ---------- 鼠标移动（悬停） ----------
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const container = containerRef.current;
    const camera = cameraRef.current;
    const scene = sceneRef.current;
    if (!container || !camera || !scene) return;

    const rect = container.getBoundingClientRect();
    mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseRef.current, camera);

    // 收集所有基底 mesh
    const meshes: THREE.Object3D[] = [];
    cellGroupsRef.current.forEach(g => {
      g.children.forEach(c => {
        if (c instanceof THREE.Mesh && c.userData.cellId) meshes.push(c);
      });
    });

    const hits = raycasterRef.current.intersectObjects(meshes, false);

    if (hits.length > 0) {
      const m = hits[0].object as THREE.Mesh;
      const cellId = m.userData.cellId;
      if (hoveredCellRef.current !== cellId) {
        // 还原旧的
        if (hoveredCellRef.current) {
          const old = cellGroupsRef.current.get(hoveredCellRef.current);
          if (old) {
            old.children.forEach(c => {
              if (c instanceof THREE.Mesh && c.userData.cellId) {
                (c.material as THREE.MeshStandardMaterial).emissive.setHex(0x000000);
              }
            });
          }
        }
        // 高亮新的
        hoveredCellRef.current = cellId;
        setHoveredCell(cellId);
        const cur = cellGroupsRef.current.get(cellId);
        if (cur) {
          cur.children.forEach(c => {
            if (c instanceof THREE.Mesh && c.userData.cellId) {
              (c.material as THREE.MeshStandardMaterial).emissive.setHex(0x222233);
            }
          });
        }
      }
    } else {
      if (hoveredCellRef.current) {
        const old = cellGroupsRef.current.get(hoveredCellRef.current);
        if (old) {
          old.children.forEach(c => {
            if (c instanceof THREE.Mesh && c.userData.cellId) {
              (c.material as THREE.MeshStandardMaterial).emissive.setHex(0x000000);
            }
          });
        }
        hoveredCellRef.current = null;
        setHoveredCell(null);
      }
    }
  }, []);

  // ---------- 鼠标点击 ----------
  const handleClick = useCallback((e: React.MouseEvent) => {
    const container = containerRef.current;
    const camera = cameraRef.current;
    const scene = sceneRef.current;
    if (!container || !camera || !scene) return;

    const rect = container.getBoundingClientRect();
    mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseRef.current, camera);

    const meshes: THREE.Object3D[] = [];
    cellGroupsRef.current.forEach(g => {
      g.children.forEach(c => {
        if (c instanceof THREE.Mesh && c.userData.cellId) meshes.push(c);
      });
    });

    const hits = raycasterRef.current.intersectObjects(meshes, false);
    if (hits.length === 0) return;

    const m = hits[0].object as THREE.Mesh;
    const cellId = m.userData.cellId;
    const cell = getCellById(cellId);
    if (!cell) return;

    if (cellId === currentCellId) {
      setSelectedCell(cell);
    } else if (neighbors.includes(cellId)) {
      const cost = calcMoveCost(currentCellId, cellId);
      if (window.confirm(`移动到 ${TERRAIN_CONFIG[cell.terrain]?.name ?? '未知'}？\n消耗 ${cost} 天`)) {
        onMoveToCell(cellId);
      }
    } else {
      setSelectedCell(cell);
    }
  }, [currentCellId, neighbors, onMoveToCell]);

  // ---------- 格子详情弹窗 ----------
  const renderDetail = () => {
    if (!selectedCell) return null;
    const t = TERRAIN_CONFIG[selectedCell.terrain] ?? {
      name: '未知', color: '#888', moveCost: 1, encounterRate: 0, description: '',
    };
    const isRevealed = revealedCells.includes(selectedCell.id) || selectedCell.isRevealed;
    const isCurrent = selectedCell.id === currentCellId;
    const isNeighbor = neighbors.includes(selectedCell.id);

    return (
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
      }} onClick={() => setSelectedCell(null)}>
        <div style={{
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
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
                  {f.icon} {f.label}
                  {f.description && <span style={{ color: '#888' }}> — {f.description}</span>}
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div ref={containerRef}
        style={{
          width: '100%',
          height: 'calc(100vh - 260px)',
          minHeight: 300,
          cursor: hoveredCell ? 'pointer' : 'default',
          background: '#0c0c1a',
        }}
        onMouseMove={handleMouseMove}
        onClick={handleClick}
      />
      <div style={{ padding: '6px 10px', background: '#000', color: '#0f0', fontSize: 11, fontFamily: 'monospace' }}>
        🎮 {`${currentCellId} | 已探索 ${revealedCells.length} 格 | ${hoveredCell ?? '—'}`}
      </div>
      <div style={{
        padding: 8, background: 'rgba(0,0,0,0.85)', borderTop: '1px solid #222',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <span style={{ color: '#FFD700', fontSize: 13 }}>🗺️ 等距 3D 地图</span>
          <span style={{ color: '#666', fontSize: 11, marginLeft: 8 }}>悬停高亮 · 点击相邻移动</span>
        </div>
        <div style={{ color: '#888', fontSize: 11 }}>
          ✦ 当前位置
        </div>
      </div>
      {renderDetail()}
    </div>
  );
};

// ============ 包装组件（错误边界） ============
export const ThreeMapPanel: React.FC<ThreeMapPanelProps> = (props) => {
  const [error, setError] = useState<Error | null>(null);
  if (error) {
    return (
      <div style={{ padding: 20, color: '#ff6b6b', background: '#1a1a2e', height: '100%', overflow: 'auto' }}>
        <h3>3D 地图加载失败</h3>
        <pre style={{ fontSize: 12, whiteSpace: 'pre-wrap' }}>{error.message}</pre>
      </div>
    );
  }
  try {
    return <ThreeMapPanelInner {...props} />;
  } catch (e) {
    setError(e instanceof Error ? e : new Error(String(e)));
    return null;
  }
};
