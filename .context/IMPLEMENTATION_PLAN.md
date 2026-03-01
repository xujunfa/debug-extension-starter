# 实施计划

## 概览
- 项目：Chrome Extension Debug Tool Scaffold
- 里程碑总数：8
- 创建日期：2026-02-28

---

## 里程碑 1：项目脚手架与 DevTools Panel 空壳

**目标**：WXT 项目初始化完成，所有依赖就绪，扩展可加载到 Chrome 并在 DevTools 中看到自定义 Panel 标签页。

### 任务
- [x] 1.1 使用 WXT 初始化项目（React + TypeScript 模板）
  - 文件：`package.json`、`wxt.config.ts`、`tsconfig.json`
- [x] 1.2 配置 Tailwind CSS v4
  - 文件：`assets/main.css`（使用 @tailwindcss/vite 插件，无需 postcss.config.js）
- [x] 1.3 集成 shadcn/ui 基础配置
  - 文件：`components.json`、`lib/utils.ts`、`assets/main.css`（CSS 变量）
- [x] 1.4 安装 Lucide Icons 和 Framer Motion
  - 文件：`package.json`
- [x] 1.5 创建 DevTools Panel 入口（空壳页面，显示项目名称）
  - 文件：`entrypoints/devtools/index.html`、`entrypoints/devtools/main.ts`、`entrypoints/devtools-panel/index.html`、`entrypoints/devtools-panel/main.tsx`、`entrypoints/devtools-panel/App.tsx`
- [x] 1.6 创建 background service worker 入口（空壳）
  - 文件：`entrypoints/background.ts`
- [x] 1.7 设计目录结构，为三种形态和未来 CLI 工具预留扩展点
  - 文件：`lib/`、`components/`、`templates/`、`hooks/` 等目录
- [x] 1.8 初始化 Git 仓库，配置 .gitignore 和基础 lint 规则
  - 文件：`.gitignore`、`eslint.config.js`、`.prettierrc`

### 验收标准
- `pnpm dev` 启动后扩展可加载到 Chrome
- 打开 DevTools 可见自定义 Panel 标签页
- Panel 页面正常渲染（Tailwind 样式生效、shadcn/ui 组件可用）

---

## 里程碑 2：通信层（消息总线）

**目标**：类型安全的跨上下文消息总线就绪，DevTools Panel 中可验证 panel ↔ background ↔ content script 的双向通信。

### 任务
- [x] 2.1 设计消息总线 API 和类型定义（消息类型枚举、payload 类型、响应类型）
  - 文件：`lib/messaging/types.ts`
- [x] 2.2 实现 request/response 模式（发送请求并等待响应）
  - 文件：`lib/messaging/request.ts`
- [x] 2.3 实现事件订阅模式（发布/订阅，支持多监听者）
  - 文件：`lib/messaging/events.ts`
- [x] 2.4 实现 background service worker 消息中继（代理 DevTools panel 与 content script 之间的通信）
  - 文件：`entrypoints/background.ts`、`lib/messaging/relay.ts`
- [x] 2.5 创建 content script 入口，注册消息监听
  - 文件：`entrypoints/content.ts`
- [x] 2.6 在 DevTools Panel 中添加连接状态指示器和 ping/pong 测试
  - 文件：`entrypoints/devtools-panel/App.tsx`
- [x] 2.7 封装统一的消息总线导出（对外暴露简洁 API）
  - 文件：`lib/messaging/index.ts`

### 验收标准
- DevTools Panel 显示与 background / content script 的连接状态
- Panel 发送 ping → content script 收到 → 返回 pong → Panel 显示结果
- 消息类型有完整的 TypeScript 类型推导

---

## 里程碑 3：共享 UI 组件体系

**目标**：面向调试场景的 UI 组件库就绪，DevTools Panel 中可查看组件展示页。

### 任务
- [x] 3.1 引入 shadcn/ui 基础组件（Button、Input、Tabs、ScrollArea、Badge、Tooltip 等）
  - 文件：`components/ui/*.tsx`
- [x] 3.2 构建 JSON/对象树形查看器组件
  - 文件：`components/debug/json-viewer.tsx`
- [x] 3.3 构建 Key-Value 数据展示组件（支持高亮、折叠）
  - 文件：`components/debug/kv-display.tsx`
- [x] 3.4 构建代码块/命令展示组件
  - 文件：`components/debug/code-block.tsx`
- [x] 3.5 构建布局原语（PanelLayout、SplitPane、TabLayout）
  - 文件：`components/layout/panel-layout.tsx`、`components/layout/split-pane.tsx`、`components/layout/tab-layout.tsx`
- [x] 3.6 在 DevTools Panel 中创建组件展示页（Component Showcase）
  - 文件：`entrypoints/devtools-panel/pages/showcase.tsx`

### 验收标准
- 组件展示页在 DevTools Panel 中正常渲染
- JSON 树形查看器可展开/折叠多层嵌套对象
- 布局组件支持灵活组合
- 所有组件风格统一，Tailwind 主题一致

---

## 里程碑 4：DevTools Panel 调试布局模板

**目标**：四种调试布局模板在 DevTools Panel 中可用，可通过 Tab 切换体验各模板功能。

### 任务
- [x] 4.1 设计模板注册机制（模板元数据、路由、懒加载）
  - 文件：`lib/templates/registry.ts`、`lib/templates/types.ts`
- [x] 4.2 实现网络请求面板模板（拦截特定接口、高亮关键字段、请求/响应对比）
  - 文件：`templates/network-panel/index.tsx`、`templates/network-panel/config.ts`
- [x] 4.3 实现数据查看器模板（绑定全局变量路径、自动刷新、搜索过滤）
  - 文件：`templates/data-viewer/index.tsx`、`templates/data-viewer/config.ts`
- [x] 4.4 实现命令面板模板（命令列表、一键执行、结果展示、命令历史）
  - 文件：`templates/command-palette/index.tsx`、`templates/command-palette/config.ts`
- [x] 4.5 实现 DOM 检查器模板（CSS 选择器输入、元素高亮、属性/样式查看）
  - 文件：`templates/dom-inspector/index.tsx`、`templates/dom-inspector/config.ts`
- [x] 4.6 在 DevTools Panel 中集成模板切换导航
  - 文件：`entrypoints/devtools-panel/App.tsx`、`entrypoints/devtools-panel/pages/templates.tsx`

### 验收标准
- 四种模板可通过 Tab/导航切换
- 网络请求面板：能捕获页面网络请求并按配置过滤展示
- 数据查看器：能读取页面全局变量并树形展示
- 命令面板：能执行预设命令并显示结果
- DOM 检查器：能高亮指定 CSS 选择器匹配的元素

---

## 里程碑 5：调试模板增强（Pro 功能）

**目标**：增强四个调试模板的实用性 — 保存视图、JSON 高亮、快照对比、脚本持久化、变更时间线。

### 任务
- [x] 5.0 通用基础设施 — 持久化存储工具
  - 文件：`lib/storage.ts`
  - 封装 `chrome.storage.local`，提供 typed get/set/remove；各模板的 storage key 定义在各自 config.ts
- [x] 5.1 Network Panel — Saved Views（请求视图）
  - 文件：`templates/network-panel/config.ts`、`templates/network-panel/index.tsx`
  - 类型：`View { id, name, filterType: 'contains' | 'regex', pattern }`
  - UI：Filter Input 右侧 "Save" 按钮 → 保存当前 filter 为 View；Filter Input 下方横向 Pill 标签条，点击即应用（单选互斥，再点取消），每个 Pill 有 x 删除按钮
  - 选中 View 时 filter input 同步显示 pattern，过滤逻辑根据 filterType 分支（contains / regex）
  - 持久化 key：`network-views`
- [x] 5.2 Network Panel — Response JSON Highlight Rules
  - 文件：`components/debug/json-viewer.tsx`（增强 props）、`templates/network-panel/index.tsx`
  - JsonViewer 新增 `highlightKeys?: HighlightRule[]` prop；匹配 key 的行高亮背景 + 自动展开到对应路径层级
  - UI：RequestDetail Response tab 结果上方常驻 Tag 条 — 每个 HighlightRule 渲染为一个 Tag（显示 key 名 + x 删除 + 点击 toggle 启用/禁用），末尾 "+" 按钮添加新 key
  - 持久化 key：`network-highlight-rules`
- [x] 5.3 Data Viewer — Snapshots & History（快照与历史）
  - 文件：`templates/data-viewer/config.ts`、`templates/data-viewer/index.tsx`
  - 类型：`Snapshot { id, timestamp, label?, entries: { expressionId, expression, label?, value, error? }[] }`
  - UI：工具栏增加 "Take Snapshot" 按钮；底部 Snapshots 折叠面板（时间倒序列表，点击查看详情）；Checkbox 选 2 个出现 "Compare" 按钮 → 逐表达式 Diff（before/after 标红绿）
  - 持久化 key：`data-viewer-snapshots`（限最近 50 条）
- [x] 5.4 Command Palette — 脚本持久化 + 拖拽排序
  - 文件：`templates/command-palette/config.ts`、`templates/command-palette/index.tsx`
  - 类型：`UserScript { id, name, description, script, enabled, order }`
  - 左栏重构：Built-in Commands 分区（不可编辑）+ User Scripts 分区（CRUD + HTML5 拖拽排序 + enable/disable toggle）；底部保留快速 eval 输入框
  - 右栏：执行历史增加 flat / grouped by command name 视图切换
  - 持久化 key：`command-user-scripts`
- [x] 5.5 DOM Inspector — 元素变更时间线
  - 文件：`templates/dom-inspector/config.ts`、`templates/dom-inspector/index.tsx`
  - 通过 `inspectedWindow.eval` 注入 MutationObserver + ResizeObserver + getBoundingClientRect/computedStyle 轮询到页面；变更写入 `window.__debugTimeline`，DevTools panel 每 500ms 通过 eval 读取并清空
  - 类型：`TimelineEvent { timestamp, type: 'attribute'|'style'|'resize'|'position', selector, detail: { property, before, after } }`
  - UI：查询结果后出现 "Monitor" 按钮 → 开始监控；下方 SplitPane 垂直展示 Timeline（Pause/Resume/Clear + 事件列表 + 类型筛选 toggle）
  - 离开或取消监控时清理注入的 observer

### 验收标准
- Network Panel：Views 可保存/切换/删除，刷新后持久化；选中 View 后列表按规则过滤
- Network Panel：Highlight Tags 常驻 Response 结果上方，匹配 key 在 JSON 中高亮且自动展开到对应路径
- Data Viewer：Take Snapshot 保存当前全部表达式结果；历史列表可查看详情；选 2 个可 Diff
- Command Palette：自定义脚本 CRUD + 拖拽排序 + enable/disable；内置/用户脚本分区清晰；排序持久化
- DOM Inspector：监控选中元素的 attribute/style/size/position 变化；Timeline 正确显示 before/after
- `pnpm build` / `pnpm lint` / `pnpm compile` 通过

---

## 里程碑 6：页面浮窗形态（P1）

**目标**：通过 Content Script 注入的全局浮窗独立于 DevTools 工作，复用消息总线和 UI 组件。

### 任务
- [ ] 6.1 创建 Content Script UI 入口，使用 Shadow DOM 隔离样式
  - 文件：`entrypoints/overlay.content/index.tsx`
- [ ] 6.2 实现浮窗外壳（可拖拽、可折叠/展开、可调整大小）
  - 文件：`components/overlay/floating-widget.tsx`
- [ ] 6.3 接入消息总线，复用通信层
  - 文件：`entrypoints/overlay.content/App.tsx`
- [ ] 6.4 支持在浮窗中加载布局模板（复用里程碑 4 的模板）
  - 文件：`entrypoints/overlay.content/App.tsx`
- [ ] 6.5 实现浮窗的显示/隐藏控制（通过 background 消息或快捷键）
  - 文件：`entrypoints/background.ts`

### 验收标准
- 页面上出现可拖拽的浮窗
- 浮窗内可展示至少一种调试模板
- 浮窗样式与宿主页面完全隔离（Shadow DOM）
- 可通过快捷键或扩展图标控制浮窗显示/隐藏

---

## 里程碑 7：侧边栏形态（P2）

**目标**：Side Panel 形态可用，复用底座能力。

### 任务
- [ ] 7.1 配置 Side Panel manifest 和权限
  - 文件：`wxt.config.ts`、`entrypoints/sidepanel/index.html`
- [ ] 7.2 创建 Side Panel 入口页面，复用 UI 组件和布局模板
  - 文件：`entrypoints/sidepanel/main.tsx`、`entrypoints/sidepanel/App.tsx`
- [ ] 7.3 接入消息总线
  - 文件：`entrypoints/sidepanel/App.tsx`
- [ ] 7.4 实现 Side Panel 的打开方式（扩展图标点击或快捷键）
  - 文件：`entrypoints/background.ts`

### 验收标准
- 点击扩展图标可打开 Side Panel
- Side Panel 中可展示调试模板
- 通信层正常工作
