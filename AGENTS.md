# 勇者工坊 · 协作约定

## 提交（最重要）

- **只 `git commit`，不要 `git push`** —— 推送由项目所有者自己决定。
- **小改动不要反问，直接改并 commit**：改数字/文案、清未使用 import、修 typo、补默认值、补注释这类，直接动手。只有涉及玩法方向、数据结构大改、删除文件/改写历史等不可逆或影响面大的事，才先确认。
- **`docs/` 下的文档一律不进版本库**（本地参考稿）：改文档、加文档都不要 `git add` / commit，`.gitignore` 已忽略整个 `docs/`。
- commit message 用 conventional commits + 中文：`feat(scope): 摘要` / `fix(scope): 摘要` / `docs:` / `chore:`；正文用多个 `-m` 分段写清"改了什么、为什么"。
- 工作区里已有的、与本次任务无关的改动不要顺手提交；`git add` 只加本次相关路径。

## 改完必做的校验

- 类型检查：`npx tsc -p tsconfig.app.json --noEmit`（必须 0 错误）。
- 跑起来看：`npm run dev`（默认 http://127.0.0.1:5173/），浏览器实跑无 console 异常再提交。
- 动过数值/怪物/成长曲线后：`node scripts/balance-sim.mjs`，确认 Lv1→60 没有出现"无可刷地图"的卡点。

## 美术与风格

- 全项目水墨风，颜色只用 `src/index.css` 里的令牌：`--paper / --paper-2 / --paper-3 / --ink / --ink-2 / --ink-3 / --line / --cinnabar / --gold / --azure / --violet`，字体用 `--font-kai`（标题）/ `--font-song`（正文）。
- 组件只用既有样式类：`.ink-panel`、`.ink-frame`、`.ink-head`、`.ink-title`、`.ink-btn`、`.ink-btn-seal`、`.ink-tag`、`.ink-rule`。不要再新增彩色 Tailwind 类（如 `bg-blue-500`）。
- 旧组件的彩色类由 `index.css` 末尾的「旧界面水墨化桥接层」统一压制；新组件直接写 ink 令牌。
- **不引入外部图片/字体素材**：地图、图标、纸纹、印章全部用 SVG/CSS 程序化生成。

## 数据与设计原则

- 内容做成"数据驱动 + 运行时求值"，不要把文案和规则硬编码进组件。
- NPC 生态：静态定义放 `src/data/npcEcology.ts`（手写覆盖 `NPC_ECO` + `buildEco()` 自动生成，`ecoDef()` 三层解析并缓存）；运行时状态放 `src/store/useNpcEcoStore.ts`；对话一律走 `src/engine/NpcDialogue.ts` 的条件引擎（作者规则 > 模板矩阵 > 兜底）。
- 存档兼容：新增字段必须给默认值，老档能直接读；版本号在 `src/store/saveUtils.ts` 里递增并写迁移。
- 世界时间：1 游戏日 = `DAY_MS`（2 分钟真实时间），日推进时触发 NPC 自主行为与每日事件。

## 文档

- `docs/` 整个目录都是本地参考稿（设计稿、实现文档、交接文档），已列入 `.gitignore`，**不要提交任何文档**；需要留档就放在本地，或直接贴进对话。
