# 实施计划

## 概览
- 项目：Debug Extension Starter
- 里程碑总数：9
- 创建日期：2026-02-28
- 最近更新：2026-03-05

---

## 里程碑 1：项目脚手架与 DevTools Panel 空壳 ✅

WXT + React + TypeScript 项目初始化，Tailwind CSS v4、shadcn/ui、Lucide Icons 集成，DevTools Panel 空壳页面和 background service worker 入口就绪。

---

## 里程碑 2：通信层（消息总线） ✅

类型安全的跨上下文消息总线（panel ↔ background ↔ content script），支持 request/response 和事件订阅两种模式。核心文件：`lib/messaging/`。

---

## 里程碑 3：共享 UI 组件体系 ✅

面向调试场景的 UI 组件库：JsonViewer、KvDisplay、CodeBlock、布局原语（PanelLayout、SplitPane、TabLayout），含组件展示页。

---

## 里程碑 4：DevTools Panel 调试布局模板 ✅

四种调试模板可用：网络请求面板、数据查看器、命令面板、DOM 检查器，通过模板注册机制（`lib/templates/registry.ts`）管理，Tab 切换导航。

---

## 里程碑 5：调试模板增强（Pro 功能） ✅

- Network Panel：Saved Views + Response JSON Highlight Rules
- Data Viewer：Per-expression Snapshots & Diff
- Command Palette：用户脚本持久化 + 拖拽排序
- DOM Inspector：元素变更时间线（MutationObserver + ResizeObserver）
- 通用：`lib/storage.ts` 持久化存储工具

---

## 里程碑 6：Request Header 分组管理器 ✅

Header Manager 模板：以 Group 为单元管理自定义 Request Header，双层开关控制（Group toggle + Header checkbox），通过 `declarativeNetRequest` session rules 对当前 tab 生效。

---

## 里程碑 7：WebSocket Monitor ✅

WS Monitor 模板：通过 `inspectedWindow.eval` 注入 WebSocket monkey-patch，实时捕获页面 WS 连接收发消息。通信链路：injected script → postMessage → content script → background → DevTools panel。

**7+ UI 优化** ✅：
- 连接指示器：Open 连接 `animate-ping` 呼吸动画，Closed 灰色静态
- 搜索高亮：消息列表、连接 URL、JSON 详情、纯文本详情均支持关键词黄色高亮
- 方向过滤：↑ Sent / ↓ Received 快捷 toggle
- 自动滚动：新消息到达自动滚到底部，可开关
- 一键复制：详情面板 Copy 按钮
- 消息计数：每个连接旁显示消息数
- 新增共享工具：`lib/highlight.tsx`（`highlightText` 函数）
- JsonViewer 增强：`searchText` prop，值搜索高亮 + 自动展开匹配节点

---

## 里程碑 8：页面浮窗形态（P1）

> 详细技术方案：`.context/FLOATING_WINDOW_DESIGN.md`

---

### 里程碑 8.1：浮窗外壳 + 基础通信 ✅

**目标**：页面上出现可拖拽、可折叠、可 resize 的空浮窗，样式与宿主页面完全隔离，可通过 Extension icon 或快捷键控制显隐。

#### 任务
- [x] 8.1.1 创建 Content Script UI 入口（`createShadowRootUi` + Shadow DOM 隔离）
  - 文件：`entrypoints/floating-window.content/index.tsx`、`entrypoints/floating-window.content/styles.css`
- [x] 8.1.2 实现窗口外壳组件（Framer Motion 拖拽 + 原生 mouse event resize）
  - 文件：`entrypoints/floating-window.content/components/window-shell.tsx`、`resize-handle.tsx`
- [x] 8.1.3 实现标题栏（Tab 切换 pill、拖拽抓手、折叠按钮）
  - 文件：`entrypoints/floating-window.content/components/title-bar.tsx`
- [x] 8.1.4 实现折叠/展开动画（Framer Motion `AnimatePresence`）
  - 文件：`window-shell.tsx` 内完成
- [x] 8.1.5 实现显示/隐藏控制（Extension icon 点击 + `Ctrl+Shift+D` 快捷键）
  - 文件：`entrypoints/background.ts`、`wxt.config.ts`（新增 commands + action）
- [x] 8.1.6 实现位置/尺寸/折叠状态持久化（`chrome.storage.local`）
  - 文件：`entrypoints/floating-window.content/App.tsx`、复用 `lib/storage.ts`
- [x] 8.1.7 Background 新增 `GET_TAB_ID` handler
  - 文件：`lib/messaging/types.ts`、`entrypoints/background.ts`

#### 验收标准
- 页面上出现 380×480px 的浮窗，dark 主题
- 可通过标题栏拖拽移动，受视口边界约束
- 可通过右下角拖拽调整大小（受 min/max 约束）
- 折叠/展开有平滑动画过渡
- Extension icon 点击和 `Ctrl+Shift+D` 可切换显隐
- 刷新页面后浮窗位置/尺寸/折叠状态恢复
- 浮窗样式与宿主页面完全隔离（Shadow DOM）
- Tailwind utility class 在 Shadow DOM 内正常工作

---

### 里程碑 8.2：Header Manager 浮窗适配

**目标**：浮窗内 Header Manager 功能完整可用（增删 Group/Header、开关、规则生效）。

#### 任务
- [x] 8.2.1 提取 Header Manager 可复用逻辑（types + helpers）
  - 文件：确认 `templates/header-manager/config.ts` 的复用点
- [x] 8.2.2 编写紧凑布局版 Header Manager UI（380px 宽度优化：缩小间距、字号降级、单列堆叠）
  - 文件：`entrypoints/floating-window.content/features/header-manager.tsx`
- [x] 8.2.3 接入消息总线，通过 `GET_TAB_ID` 获取 tabId，调用 `APPLY_HEADER_RULES`
  - 文件：`header-manager.tsx` 内完成
- [x] 8.2.4 在 App.tsx 中注册 Headers Tab
  - 文件：`entrypoints/floating-window.content/App.tsx`

#### 验收标准
- 浮窗 Headers Tab 内可创建/删除 Group
- 可在 Group 内添加/删除 Header 条目
- Group toggle 和 Header checkbox 正常工作
- 规则通过 `declarativeNetRequest` 对当前 tab 生效
- 380px 宽度下布局紧凑、无溢出、交互舒适

---

### 里程碑 8.3：Quick Eval 新功能

**目标**：浮窗内可执行 JS 并展示结果，支持执行历史。

#### 任务
- [x] 8.3.1 Background 新增 `EVAL_IN_PAGE` handler（`chrome.scripting.executeScript`）
  - 文件：`lib/messaging/types.ts`、`entrypoints/background.ts`
- [x] 8.3.2 `wxt.config.ts` 新增 `scripting` 权限
  - 文件：`wxt.config.ts`
- [x] 8.3.3 编写 Quick Eval UI（输入框 + 执行按钮 + 结果展示，复用 JsonViewer）
  - 文件：`entrypoints/floating-window.content/features/quick-eval.tsx`
- [x] 8.3.4 实现执行历史（最近 20 条，`chrome.storage.local` 持久化）
  - 文件：`quick-eval.tsx` 内完成
- [x] 8.3.5 在 App.tsx 中注册 Eval Tab
  - 文件：`entrypoints/floating-window.content/App.tsx`

#### 验收标准
- 输入 JS 表达式点击 Run 后执行并展示结果
- 结果为对象/数组时使用 JsonViewer 展示
- 执行出错时显示错误信息
- 历史记录显示表达式、执行时间、结果摘要
- 点击历史条目可回填到输入框重新执行
- 刷新页面后历史记录保留

---

### 里程碑 8.4：浮窗 UI 组件展示页

**目标**：浮窗内新增常驻 Showcase Tab，展示浮窗场景下的紧凑 UI 组件效果，验证 Shadow DOM 渲染正确性。

#### 任务
- [x] 8.4.1 创建 Showcase 页面，展示浮窗内所有可用的 UI 组件
  - 文件：`entrypoints/floating-window.content/features/showcase.tsx`
- [x] 8.4.2 展示组件清单：Button（各尺寸/变体）、Badge、Input、Switch、Checkbox、JsonViewer、KvDisplay、CodeBlock
  - 文件：`showcase.tsx` 内完成
- [x] 8.4.3 在 App.tsx 中注册 Showcase Tab
  - 文件：`entrypoints/floating-window.content/App.tsx`

#### 验收标准
- 浮窗内 Showcase Tab 正常展示所有组件
- 所有组件在 Shadow DOM + dark 主题下渲染正确
- 380px 宽度下布局紧凑、无溢出
- 组件交互正常（按钮点击、Switch 切换、JsonViewer 展开/折叠等）

---

## 里程碑 9：侧边栏形态（P2）

**目标**：Side Panel 形态可用，复用底座能力。

### 任务
- [ ] 9.1 配置 Side Panel manifest 和权限
- [ ] 9.2 创建 Side Panel 入口页面，复用 UI 组件和布局模板
- [ ] 9.3 接入消息总线
- [ ] 9.4 实现 Side Panel 的打开方式（扩展图标点击或快捷键）

### 验收标准
- 点击扩展图标可打开 Side Panel
- Side Panel 中可展示调试模板
- 通信层正常工作
