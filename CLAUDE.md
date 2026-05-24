# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**始终使用中文回复。**

## 项目概述

WOW 团队副本规划器 — 基于 React + Konva 画布的魔兽世界战术布阵工具。支持上传副本地图作为背景，在上面放置团员、首领标记和绘制战术标注。

## 常用命令

```bash
npm run dev          # 启动开发服务器（默认 http://localhost:5173）
npm run build        # 类型检查 + 生产构建
npx vite build       # 仅构建，跳过 tsc（存在预存未使用变量告警时使用）
npm run lint         # ESLint 检查
```

构建产物输出到 `dist/`。

## 技术栈

- **React 19** + TypeScript 6
- **Konva** (`konva` + `react-konva`) — Canvas 渲染引擎，所有画布元素通过 Konva 的 Layer/Stage 体系管理
- **Zustand 5** — 全局状态管理，按功能域拆分为独立 slice
- **Tailwind CSS 4**（通过 `@tailwindcss/vite` 插件）
- **tesseract.js 5** — OCR 识别，用于从团队阵容截图中自动提取玩家姓名和职业
- **Vite 8** — 构建工具

## 架构

### 状态管理（`src/store/`）

Zustand store 由 6 个 slice 组合而成（见 `src/store/index.ts`）：

| Slice | 职责 |
|-------|------|
| `playerSlice` | 团员 CRUD、位置更新、批量位移 |
| `bossSlice` | 首领标记管理 |
| `mapSlice` | 背景地图（上传、切换、透明度、缩放、锁定、居中） |
| `annotationSlice` | 战术标注（箭头、直线、圆形、文字） |
| `canvasSlice` | 视口状态、工具切换、选中集、截图叠加 |
| `historySlice` | 撤销/重做栈（最多 50 步）、自动保存至 localStorage |

### 画布架构（`src/components/canvas/RaidCanvas.tsx`）

画布是应用核心，通过 Konva Stage 渲染。层级顺序（从底到顶）：

1. **底色层** — 深色背景矩形
2. **ScreenshotLayer** — 导入截图叠加（半透明，用于手动放置团员参考）
3. **BackgroundLayer** — 副本地图（支持独立缩放 `mapScale`）
4. **BossLayer** — 首领图标
5. **AnnotationBackLayer** — 标注下层
6. **PlayerLayer** — 团员图标（可拖拽）
7. **AnnotationFrontLayer** — 标注上层
8. **SelectionLayer** — 框选矩形

视口平移/缩放通过 Stage 的 `x/y/scaleX/scaleY` 全局控制。

### 组件层级

```
App
├── AppShell（布局容器）
│   ├── Toolbar — 工具切换（选择/平移/箭头/直线/圆形/矩形/文字/标记/橡皮擦）、撤销/重做、缩放、导入导出
│   ├── Sidebar — 四个标签面板
│   │   ├── PlayerPanel — 团员列表、导入
│   │   ├── BossPanel — 首领管理、预设选择、图标大小
│   │   ├── MapPanel — 地图管理（上传、透明度、缩放、锁定/解锁、居中）、预设选择
│   │   └── AnnotationPanel
│   └── RaidCanvas（见画布架构）
└── PlayerEditDialog — 双击团员弹出编辑窗
```

### 团员导入流程（双路径）

1. **手动导入**：上传截图 → 半透明叠加 → 点击截图位置 → 弹出浮动表单 → 填写姓名/职业
2. **OCR 自动识别**（`src/utils/screenshotAnalysis.ts`）：
   - tesseract.js 以动态 import 加载，不阻塞首屏
   - 识别中英文混合文字 → 按 Y 坐标分行 → 每行采样颜色匹配 WOW 职业色 → 处理 `Name-Server` 格式（截取 `-` 前内容）
   - 结果在 `AutoDetectDialog` 中展示，可编辑姓名/职业，勾选后一次性导入

### 设计系统

CSS 变量定义在 `src/styles/index.css` 的 `@theme` 块中，包含 6 个 WOW 主题色：
`--color-wow-gold` / `--color-wow-dark` / `--color-wow-panel` / `--color-wow-border` / `--color-wow-text` / `--color-wow-muted` / `--color-wow-accent`

所有组件内联样式使用这些 CSS 变量，不通过 Tailwind 类名。

### 职业数据

`src/data/classes.ts` — 13 种 WOW 职业定义（key、中文名、色值、图标路径）。职业图标放在 `public/class-icons/`。

### 预设数据

`src/data/raids.ts` — 12.0 至暗之夜团队副本预设（虚影尖塔 6 首领 + 梦境裂隙 1 首领 + 进军奎尔丹纳斯 2 首领）。每个首领可配置：
- `names` — 多目标首领的独立名称数组
- `defaultMapPath` — 专属作战地图（`public/maps/`）
- `defaultIconPaths` — 首领头像图标（`public/boss-icons/`）

预设选择组件 `BossPresetSelect.tsx` 使用单一下拉菜单，三级缩进：版本 → 副本 → 首领。选择新预设时弹窗确认并清除旧数据。

### 玩家数据

`src/types/player.ts`：
- `marker?: string` — 团队标记（`'star'`, `'skull'` 等 8 种），显示在职业图标上方
- `role?: PlayerRole` — 职责（`'tank'` | `'healer'` | `'dps'`），与标记并行显示

`PlayerNode` 渲染顺序：先渲染职业图标（底层），再覆盖标记和职责图标（上层），确保职责/标记覆盖职业图标的底部。

### 静态资源

```
public/
├── class-icons/     # 13 个职业图标
├── role-icons/      # 坦克/治疗/输出 3 个职责图标
├── raid-markers/    # 8 个魔兽标准团队标记
├── boss-icons/      # 15 个首领头像
├── maps/            # 9 张首领专属作战地图
└── team-screenshot.webp  # 示例截图
```

### 导出/保存

- `src/utils/serialization.ts` — 将 store 状态序列化为 JSON 文件
- `src/utils/exportPng.ts` — 将画布导出为 PNG
- `src/utils/imageResize.ts` — 上传图片尺寸限制（最大 2048px）
- 自动保存：`AUTOSAVE_DELAY` 2 秒防抖，存至 localStorage key `wow-raid-planner-autosave`

### 版本号规则

版本号定义在 `src/utils/version.ts`：

- **大版本号**（如 `1.0`）：由用户确认，当前为 `1.0`
- **小版本号**（如 `.47`）：每次代码更新时由 AI 自动递增，随机生成不重复的整数
- **显示位置**：底部状态栏最右侧，格式 `v{大版本}.{小版本} by 黑手`
- **制作者**：`by 黑手`，固定不变
- 每次功能修改或新增后，必须更新 `APP_VERSION` 中的小版本号为新的随机值
- **版本更新内容必须记录**：每次更新版本号时，在项目根目录 `CHANGELOG.md` 中新增对应版本的条目，简要描述本次更新的内容
- **部署相关文件不影响版本号**：`deploy.py`、`一键部署.bat`、`scripts/`、`web.config` 等部署/config 类文件的修改不视为功能变更，不触发版本号递增
