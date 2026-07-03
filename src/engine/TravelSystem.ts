import { WorldNode, WorldEdge, TERRAIN_NAMES } from '../data/worldMap';

// ============ 旅行状态 ============
export type TravelStatus = 'idle' | 'traveling' | 'arrived';

export interface TravelState {
  status: TravelStatus;
  currentNodeId: string;
  destinationNodeId: string | null;
  path: string[]; // 路径节点 ID 列表
  currentLeg: number; // 当前在第几段 (0-based)
  daysRemaining: number;
  events: TravelEvent[];
}

// ============ 旅行事件 ============
export type TravelEventType = 'enemy' | 'merchant' | 'event' | 'resource' | 'nothing';

export interface TravelEvent {
  type: TravelEventType;
  title: string;
  description: string;
  resolved: boolean;
  result?: string;
}

// ============ 初始状态 ============
export function createInitialTravelState(startNodeId: string): TravelState {
  return {
    status: 'idle',
    currentNodeId: startNodeId,
    destinationNodeId: null,
    path: [],
    currentLeg: 0,
    daysRemaining: 0,
    events: [],
  };
}

// ============ 开始旅行 ============
export function startTravel(
  state: TravelState,
  destinationId: string,
  path: string[],
  totalDays: number
): TravelState {
  if (state.status !== 'idle') {
    return state; // 已在旅行中
  }

  return {
    ...state,
    status: 'traveling',
    destinationNodeId: destinationId,
    path: path,
    currentLeg: 0,
    daysRemaining: totalDays,
    events: [],
  };
}

// ============ 推进一天 ============
export function advanceDay(state: TravelState): TravelState {
  if (state.status !== 'traveling') {
    return state;
  }

  const newDaysRemaining = state.daysRemaining - 1;
  const newEvents = [...state.events];

  // 每天有 30% 概率触发事件
  if (Math.random() < 0.3) {
    const event = generateTravelEvent(state);
    newEvents.push(event);
  }

  // 检查是否到达
  if (newDaysRemaining <= 0) {
    return {
      ...state,
      status: 'arrived',
      currentNodeId: state.destinationNodeId!,
      daysRemaining: 0,
      events: newEvents,
    };
  }

  return {
    ...state,
    daysRemaining: newDaysRemaining,
    events: newEvents,
  };
}

// ============ 生成旅行事件 ============
function generateTravelEvent(state: TravelState): TravelEvent {
  const roll = Math.random();
  const currentNode = getCurrentNode(state);
  const terrain = currentNode?.terrain || 'plain';

  if (roll < 0.15) {
    // 15% 遇敌
    return {
      type: 'enemy',
      title: '遭遇敌人！',
      description: `在${TERRAIN_NAMES[terrain]}地形中，你遇到了敌人！`,
      resolved: false,
    };
  } else if (roll < 0.3) {
    // 15% 遇到商人
    return {
      type: 'merchant',
      title: '路过商队',
      description: '一支商队路过，你可以购买一些补给。',
      resolved: false,
    };
  } else if (roll < 0.4) {
    // 10% 发现资源
    return {
      type: 'resource',
      title: '发现资源点',
      description: '你发现了一个可以采集资源的地方。',
      resolved: false,
    };
  } else if (roll < 0.5) {
    // 10% 特殊事件
    return {
      type: 'event',
      title: '路途轶事',
      description: '路上发生了一件有趣的事...',
      resolved: false,
    };
  } else {
    // 50% 无事发生
    return {
      type: 'nothing',
      title: '平安无事',
      description: '今天路途平静，没有什么特别的事情发生。',
      resolved: true,
    };
  }
}

// ============ 获取当前节点 ============
function getCurrentNode(state: TravelState): WorldNode | undefined {
  // 简化：返回路径中当前 leg 对应的节点
  if (state.path.length > 0 && state.currentLeg < state.path.length) {
    // 这里需要导入 getNodeById，但为避免循环依赖，先返回 undefined
    return undefined;
  }
  return undefined;
}

// ============ 解析旅行事件 ============
export function resolveTravelEvent(
  state: TravelState,
  eventIndex: number,
  choice: 'fight' | 'flee' | 'trade' | 'gather' | 'ignore'
): TravelState {
  const newEvents = [...state.events];
  const event = newEvents[eventIndex];

  if (!event || event.resolved) {
    return state;
  }

  switch (event.type) {
    case 'enemy':
      if (choice === 'fight') {
        event.result = '你击败了敌人，获得了战利品！';
        // 这里应该触发战斗，暂时只记录结果
      } else if (choice === 'flee') {
        event.result = '你成功逃脱了，但损失了一些时间。';
        // 可以增加 daysRemaining
      }
      break;

    case 'merchant':
      if (choice === 'trade') {
        event.result = '你从商队购买了一些补给。';
        // 这里应该打开交易界面
      } else {
        event.result = '你拒绝了交易。';
      }
      break;

    case 'resource':
      if (choice === 'gather') {
        event.result = '你采集了一些资源。';
        // 这里应该添加资源到玩家背包
      } else {
        event.result = '你决定继续赶路。';
      }
      break;

    case 'event':
      event.result = '你经历了一件有趣的事，获得了一些启示。';
      break;

    default:
      event.result = '无事发生。';
      break;
  }

  event.resolved = true;
  return { ...state, events: newEvents };
}

// ============ 完成旅行 ============
export function finishTravel(state: TravelState): TravelState {
  if (state.status !== 'arrived') {
    return state;
  }

  return {
    ...state,
    status: 'idle',
    destinationNodeId: null,
    path: [],
    currentLeg: 0,
    events: [],
  };
}

// ============ 取消旅行 ============
export function cancelTravel(state: TravelState): TravelState {
  if (state.status !== 'traveling') {
    return state;
  }

  return {
    ...state,
    status: 'idle',
    destinationNodeId: null,
    path: [],
    currentLeg: 0,
    daysRemaining: 0,
    events: [],
  };
}
