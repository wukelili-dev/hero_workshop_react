# 勇者工坊 Hero Workshop

放置类 RPG，React + TypeScript 重写版。

## 技术栈

- React 18 + TypeScript
- Vite
- Zustand（状态管理）
- Tailwind CSS
- Radix UI（Dialog / Tabs / Tooltip / Switch / Collapsible / DropdownMenu / Select / Progress / Separator）
- framer-motion（动画）
- react-icons（图标）
- sonner（Toast 通知）
- 自建 `useCountUp` hook（数字滚动动画，`react-countup` 因 ESM/CJS 兼容问题已弃用）

## 功能模块

| 模块 | 状态 |
|------|------|
| 战斗系统 | ✅ 完整 |
| 背包 / 商店 | ✅ 完整 |
| 农场 | ✅ 完整 |
| 牧场 | ✅ 完整 |
| 锻造 | ✅ 完整 |
| 工厂 | ✅ 完整 |
| 存档系统 | ✅ 完整（localStorage） |

## 启动

```bash
npm install
npm run dev
```

生产构建：

```bash
npm run build
```

## 图标系统

所有导航图标统一使用 `react-icons/fa6`（优先）和 `react-icons/fa`，不再使用 emoji。

Tab 图标映射（`AppShell.tsx` → `TABS` 数组）：

| Tab | 图标组件 | 来源 |
|-----|-----------|------|
| 武器 | `FaSword` | fa6 |
| 护甲 | `FaShieldHalved` | fa6 |
| 杂货 | `FaGift` | fa |
| 背包 | `FaBagShopping` | fa6 |
| 材料 | `FaCube` | fa |
| 酒馆 | `FaBeerMugEmpty` | fa6 |
| 农场 | `FaWheatAwn` | fa6 |
| 工厂 | `FaIndustry` | fa6 |
| 牧场 | `FaPaw` | fa6 |
| 锻造 | `FaHammer` | fa |
| 图鉴 | `FaBookOpen` | fa6 |

移动端底部导航（`MOBILE_NAV`）：

| 视图 | 图标组件 | 来源 |
|------|-----------|------|
| 主城 | `FaCastle` | fa6 |
| 战斗 | `FaSkullCrossbones` | fa |
| 背包 | `FaBagShopping` | fa6 |
| 锻造 | `FaHammer` | fa |
| 牧场 | `FaPaw` | fa6 |

底部操作栏按钮：

| 按钮 | 图标组件 | 来源 |
|------|-----------|------|
| 存档 | `FaFloppyDisk` | fa6 |
| 读档 | `FaFolderOpen` | fa6 |
| 图鉴 | `FaBookOpen` | fa6 |
| 帮助 | `FaQuestionCircle` | fa6 |

> 新增图标时优先从 `react-icons/fa6` 选取，fa6 没有再回退到 `react-icons/fa`。
> `TabBar.tsx` 的 `TabConfig.icon` 类型为 `React.ReactNode`，直接传入 JSX 组件即可。

## 原版

Python MUD 版存档于 [idle-game](https://github.com/wukelili-dev/idle-game)。
