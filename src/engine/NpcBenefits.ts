/** NPC 与地图互动的实际回报：采集点、关系带来的便利 */
import { getCellById } from '../data/cellMap';
import { useGameStore } from '../store/useGameStore';
import { useWorldStore } from '../store/useWorldStore';

/** 资源点产出表（key 为 cellMap 里的 resourceType） */
const RESOURCE_YIELD: Record<string, { key: string; name: string; min: number; max: number }> = {
  iron_ore: { key: 'iron', name: '铁矿', min: 3, max: 6 },
  herbs: { key: 'herb', name: '药草', min: 3, max: 7 },
  crystal: { key: 'stone', name: '石头', min: 2, max: 5 },
  fish: { key: 'herb', name: '药草', min: 2, max: 4 },
  pearl: { key: 'stone', name: '石头', min: 3, max: 6 },
};

/** 采集：每个资源点每游戏日可采一次，消耗 1 天 */
export function gatherAtCell(cellId: string): string {
  const world = useWorldStore.getState();
  const day = Math.floor(world.day);
  const cell = getCellById(cellId);
  const feature = cell?.features.find((f) => f.type === 'resource');
  if (!feature) return '此地没有可采集的东西。';
  if ((world.gathered[cellId] ?? -1) >= day) return `${feature.label}今天已经采过了，明日再来。`;

  const y = RESOURCE_YIELD[feature.resourceType ?? ''] ?? { key: 'wood', name: '木材', min: 2, max: 5 };
  const amount = y.min + Math.floor(Math.random() * (y.max - y.min + 1));
  useGameStore.getState().addResource(y.key, amount);
  useWorldStore.getState().markGathered(cellId);
  useWorldStore.getState().advanceDays(1);
  useGameStore.getState().addGameLog(`在${feature.label}采集，获得${y.name}×${amount}（耗 1 天）`);
  return `采集：${y.name} ×${amount}（耗 1 天）`;
}
