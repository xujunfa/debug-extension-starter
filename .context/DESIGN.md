# Debug Extension Starter — 设计文档

## 愿景

一个专为调试提效而设计的 Chrome Extension 脚手架。开发者可以基于此脚手架，快速构建各种形态（DevTools Panel、页面浮窗、侧边栏）的调试工具扩展，将日常在 Chrome DevTools 中重复性的调试操作封装成高效、可复用的可视化工具。

## 问题陈述

在日常前端开发调试中，开发者频繁需要：
- 在 Console 中重复输入相同的命令
- 逐级展开深层嵌套的全局变量来查找特定数据
- 在 Network 面板中手动过滤和查看特定接口的请求/响应数据
- 在 Elements 面板中反复 inspect 高频使用的 DOM 元素

这些操作重复、低效，且无法跨会话复用。Chrome Extension 天然适合解决这类问题，但每次从零搭建扩展的成本较高，缺乏一个面向调试场景的专用脚手架。

## 目标用户

- 初期：个人使用，快速迭代验证
- 后续：推广至团队，降低团队成员构建调试工具的门槛

关键特征：有一定前端开发经验，熟悉 Chrome DevTools，希望将重复调试操作工具化。

## 核心功能

### P0 — 必须有

- **DevTools Panel 形态**：作为 Chrome DevTools 中的独立面板，优先实现的 UI 入口
- **统一消息总线**：跨上下文通信（DevTools panel ↔ background service worker ↔ content script），支持 request/response 模式和事件订阅
- **共享 UI 组件体系**：基于 shadcn/ui 的设计系统，包含调试工具常用组件
- **调试布局模板（Pattern Library）**：
  - 网络请求面板 — 监控特定业务接口，直观高亮关键请求/响应数据字段
  - 数据查看器 — 树形展开全局变量/对象
  - 命令面板 — 预设常用 Console 命令一键执行
  - DOM 检查器 — 高亮/监控特定 DOM 元素

### P1 — 应该有

- **页面浮窗形态**：通过 content script 注入的全局浮窗，不依赖 DevTools 打开
- **底座能力复用**：浮窗形态复用 P0 阶段沉淀的通信层和 UI 组件

### P2 — 最好有

- **侧边栏 Side Panel 形态**：Chrome Side Panel API 支持
- **CLI 工具**：`create-debug-extension` 命令行工具，快速初始化新的调试扩展项目

## 技术决策

- **Extension 框架**：WXT — 内置多入口管理、HMR、自动 manifest 生成，大幅降低 Chrome Extension 开发复杂度
- **UI 框架**：React + TypeScript
- **样式方案**：Tailwind CSS
- **组件库**：shadcn/ui（高质量、可定制、适合构建设计系统）
- **图标库**：Lucide Icons
- **动画库**：Framer Motion（motion.dev）
- **架构模式**：
  - 单仓库，三种 UI 形态共享底座能力
  - 消息总线模式处理跨上下文通信
  - 模板仓库为主入口，目录结构为未来 CLI 工具预留扩展点

## 非目标

- 不是一个通用的 Chrome Extension 脚手架，专注于调试提效场景
- 不负责具体业务调试逻辑的实现，只提供框架和模板
- 初期不做 CLI 工具发布（但预留结构）
- 不涉及扩展的发布/分发流程（Chrome Web Store）

## 成功标准

1. 基于脚手架，能在 30 分钟内搭建出一个可用的 DevTools Panel 调试工具
2. 新增一种调试布局模板（如网络请求面板），只需描述场景即可匹配到合适的模板并快速实现
3. 三种 UI 形态共享同一套通信层和 UI 组件，无需重复开发
4. 代码结构清晰，新人能快速理解并上手扩展
