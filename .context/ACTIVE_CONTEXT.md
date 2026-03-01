# Active Context

## 当前状态
- 阶段：execute
- 里程碑：3 — 共享 UI 组件体系
- 状态：未开始

## 里程碑进度

### 已完成
- [x] 里程碑 1：项目脚手架与 DevTools Panel 空壳
- [x] 里程碑 2：通信层（消息总线）
  - `lib/messaging/types.ts` — RequestMap / EventMap 类型定义，支持模块扩充
  - `lib/messaging/request.ts` — sendRequest / onRequest / initRequestListener
  - `lib/messaging/events.ts` — LocalEventBus 本地 pub/sub + connectToBackground 跨上下文事件
  - `lib/messaging/relay.ts` — setupRelay 在 background 中路由消息、管理 DevTools 端口、跟踪 content script 生命周期
  - `lib/messaging/index.ts` — 统一导出
  - `entrypoints/content.ts` — content script 入口，注册 PING handler，通知 background 就绪
  - `entrypoints/background.ts` — 调用 setupRelay() 初始化
  - `entrypoints/devtools-panel/App.tsx` — 连接状态指示器 + ping/pong 测试按钮

### 待完成
- [ ] 里程碑 3：共享 UI 组件体系
- [ ] 里程碑 4：DevTools Panel 调试布局模板
- [ ] 里程碑 5：页面浮窗形态（P1）
- [ ] 里程碑 6：侧边栏形态（P2）

## 交接备注
- 消息总线架构：DevTools panel 通过 `browser.runtime.sendMessage` 发请求到 background，background relay 可选转发到 content script（通过 `browser.tabs.sendMessage`）
- 事件推送：DevTools panel 通过 `browser.runtime.connect` 建立长连接，background 通过端口推送事件
- Content script 加载后通过 CONTENT_SCRIPT_READY 通知 background，background 记录并推送 CONTENT_SCRIPT_STATUS 事件到 DevTools panel
- 扩展新消息类型：在 RequestMap 中添加新条目，TypeScript 会自动推导类型
- **重要**：`onMessage` 监听器必须使用 `sendResponse` 回调 + `return true` 模式（`@wxt-dev/browser` 不支持 Promise return 作为异步响应）
- `pnpm build` / `pnpm lint` / `pnpm compile` 全部通过
- 生成的 manifest.json 已包含 content_scripts 配置（matches: <all_urls>）

## 最近变更
- 2026-03-01 完成里程碑 2 全部 7 项任务
- 2026-03-01 修复 onMessage 异步响应模式，改用 sendResponse + return true
