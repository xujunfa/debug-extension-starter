# 实施计划

## 概览
- 项目：Chrome Extension Debug Tool Scaffold
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

**目标**：通过 Content Script 注入的全局浮窗独立于 DevTools 工作，复用消息总线和 UI 组件。

### 任务
- [ ] 8.1 创建 Content Script UI 入口，使用 Shadow DOM 隔离样式
- [ ] 8.2 实现浮窗外壳（可拖拽、可折叠/展开、可调整大小）
- [ ] 8.3 接入消息总线，复用通信层
- [ ] 8.4 支持在浮窗中加载布局模板
- [ ] 8.5 实现浮窗的显示/隐藏控制（通过 background 消息或快捷键）

### 验收标准
- 页面上出现可拖拽的浮窗
- 浮窗内可展示至少一种调试模板
- 浮窗样式与宿主页面完全隔离（Shadow DOM）
- 可通过快捷键或扩展图标控制浮窗显示/隐藏

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
