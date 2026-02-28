# 实施计划

## 概览
- 项目：Chrome Extension Debug Tool Scaffold
- 里程碑总数：6
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
- [ ] 2.1 设计消息总线 API 和类型定义（消息类型枚举、payload 类型、响应类型）
  - 文件：`lib/messaging/types.ts`
- [ ] 2.2 实现 request/response 模式（发送请求并等待响应）
  - 文件：`lib/messaging/request.ts`
- [ ] 2.3 实现事件订阅模式（发布/订阅，支持多监听者）
  - 文件：`lib/messaging/events.ts`
- [ ] 2.4 实现 background service worker 消息中继（代理 DevTools panel 与 content script 之间的通信）
  - 文件：`entrypoints/background.ts`、`lib/messaging/relay.ts`
- [ ] 2.5 创建 content script 入口，注册消息监听
  - 文件：`entrypoints/content.ts`
- [ ] 2.6 在 DevTools Panel 中添加连接状态指示器和 ping/pong 测试
  - 文件：`entrypoints/devtools-panel/App.tsx`
- [ ] 2.7 封装统一的消息总线导出（对外暴露简洁 API）
  - 文件：`lib/messaging/index.ts`

### 验收标准
- DevTools Panel 显示与 background / content script 的连接状态
- Panel 发送 ping → content script 收到 → 返回 pong → Panel 显示结果
- 消息类型有完整的 TypeScript 类型推导

---

## 里程碑 3：共享 UI 组件体系

**目标**：面向调试场景的 UI 组件库就绪，DevTools Panel 中可查看组件展示页。

### 任务
- [ ] 3.1 引入 shadcn/ui 基础组件（Button、Input、Tabs、ScrollArea、Badge、Tooltip 等）
  - 文件：`components/ui/*.tsx`
- [ ] 3.2 构建 JSON/对象树形查看器组件
  - 文件：`components/debug/json-viewer.tsx`
- [ ] 3.3 构建 Key-Value 数据展示组件（支持高亮、折叠）
  - 文件：`components/debug/kv-display.tsx`
- [ ] 3.4 构建代码块/命令展示组件
  - 文件：`components/debug/code-block.tsx`
- [ ] 3.5 构建布局原语（PanelLayout、SplitPane、TabLayout）
  - 文件：`components/layout/panel-layout.tsx`、`components/layout/split-pane.tsx`、`components/layout/tab-layout.tsx`
- [ ] 3.6 在 DevTools Panel 中创建组件展示页（Component Showcase）
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
- [ ] 4.1 设计模板注册机制（模板元数据、路由、懒加载）
  - 文件：`lib/templates/registry.ts`、`lib/templates/types.ts`
- [ ] 4.2 实现网络请求面板模板（拦截特定接口、高亮关键字段、请求/响应对比）
  - 文件：`templates/network-panel/index.tsx`、`templates/network-panel/config.ts`
- [ ] 4.3 实现数据查看器模板（绑定全局变量路径、自动刷新、搜索过滤）
  - 文件：`templates/data-viewer/index.tsx`、`templates/data-viewer/config.ts`
- [ ] 4.4 实现命令面板模板（命令列表、一键执行、结果展示、命令历史）
  - 文件：`templates/command-palette/index.tsx`、`templates/command-palette/config.ts`
- [ ] 4.5 实现 DOM 检查器模板（CSS 选择器输入、元素高亮、属性/样式查看）
  - 文件：`templates/dom-inspector/index.tsx`、`templates/dom-inspector/config.ts`
- [ ] 4.6 在 DevTools Panel 中集成模板切换导航
  - 文件：`entrypoints/devtools-panel/App.tsx`、`entrypoints/devtools-panel/pages/templates.tsx`

### 验收标准
- 四种模板可通过 Tab/导航切换
- 网络请求面板：能捕获页面网络请求并按配置过滤展示
- 数据查看器：能读取页面全局变量并树形展示
- 命令面板：能执行预设命令并显示结果
- DOM 检查器：能高亮指定 CSS 选择器匹配的元素

---

## 里程碑 5：页面浮窗形态（P1）

**目标**：通过 Content Script 注入的全局浮窗独立于 DevTools 工作，复用消息总线和 UI 组件。

### 任务
- [ ] 5.1 创建 Content Script UI 入口，使用 Shadow DOM 隔离样式
  - 文件：`entrypoints/overlay.content/index.tsx`
- [ ] 5.2 实现浮窗外壳（可拖拽、可折叠/展开、可调整大小）
  - 文件：`components/overlay/floating-widget.tsx`
- [ ] 5.3 接入消息总线，复用通信层
  - 文件：`entrypoints/overlay.content/App.tsx`
- [ ] 5.4 支持在浮窗中加载布局模板（复用里程碑 4 的模板）
  - 文件：`entrypoints/overlay.content/App.tsx`
- [ ] 5.5 实现浮窗的显示/隐藏控制（通过 background 消息或快捷键）
  - 文件：`entrypoints/background.ts`

### 验收标准
- 页面上出现可拖拽的浮窗
- 浮窗内可展示至少一种调试模板
- 浮窗样式与宿主页面完全隔离（Shadow DOM）
- 可通过快捷键或扩展图标控制浮窗显示/隐藏

---

## 里程碑 6：侧边栏形态（P2）

**目标**：Side Panel 形态可用，复用底座能力。

### 任务
- [ ] 6.1 配置 Side Panel manifest 和权限
  - 文件：`wxt.config.ts`、`entrypoints/sidepanel/index.html`
- [ ] 6.2 创建 Side Panel 入口页面，复用 UI 组件和布局模板
  - 文件：`entrypoints/sidepanel/main.tsx`、`entrypoints/sidepanel/App.tsx`
- [ ] 6.3 接入消息总线
  - 文件：`entrypoints/sidepanel/App.tsx`
- [ ] 6.4 实现 Side Panel 的打开方式（扩展图标点击或快捷键）
  - 文件：`entrypoints/background.ts`

### 验收标准
- 点击扩展图标可打开 Side Panel
- Side Panel 中可展示调试模板
- 通信层正常工作
