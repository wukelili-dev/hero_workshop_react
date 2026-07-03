// 修改 AppShell.tsx 以集成 CellMapPanel
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/components/layout/AppShell.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. 在 useState 后面添加地图状态
const stateInsertion = `
  // 地图状态
  const [currentCellId, setCurrentCellId] = useState<string>('cp_3_0'); // 起始位置：长安城
  const [revealedCells, setRevealedCells] = useState<string[]>(['cp_3_0']); // 已探索的格子
`;

const targetLine = 'const [showApp, setShowApp] = useState(false);';
if (content.includes(targetLine)) {
  content = content.replace(targetLine, targetLine + stateInsertion);
  console.log('✅ 添加地图状态');
} else {
  console.log('❌ 找不到目标行');
}

// 2. 替换 WorldMapPanel 为 CellMapPanel
const oldRender = "case 'world': return <WorldMapPanel />;";
const newRender = `case 'world': return (
    <CellMapPanel
      currentCellId={currentCellId}
      revealedCells={revealedCells}
      onMoveToCell={(cellId) => {
        setCurrentCellId(cellId);
        setRevealedCells(prev => [...prev, cellId]);
      }}
      onCellFeatureClick={(feature, cell) => {
        console.log('Feature click:', feature, cell);
        // TODO: 处理格子内容点击（NPC对话、战斗、事件等）
      }}
    />
  );`;

if (content.includes(oldRender)) {
  content = content.replace(oldRender, newRender);
  console.log('✅ 替换 WorldMapPanel 为 CellMapPanel');
} else {
  console.log('❌ 找不到渲染代码');
}

// 保存
fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ AppShell.tsx 修改完成');
