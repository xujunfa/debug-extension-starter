# 决策日志

## [DEC-001] Tailwind CSS v4 使用 Vite 插件而非 PostCSS
- **日期**：2026-03-01
- **里程碑**：1 — 项目脚手架
- **背景**：WXT 内部使用 Vite 构建，需要选择 Tailwind v4 的集成方式
- **备选方案**：
  1. @tailwindcss/vite — 通过 WXT 的 `vite` 配置选项集成，零额外配置
  2. @tailwindcss/postcss — 需要单独的 postcss.config.js，可能有插件兼容性问题
- **决策**：使用 @tailwindcss/vite
- **理由**：官方推荐 Vite 项目使用 Vite 插件；WXT 原生支持自定义 Vite 插件；省去 PostCSS 配置复杂度

## [DEC-002] ESLint 9 flat config + eslint-config-prettier
- **日期**：2026-03-01
- **里程碑**：1 — 项目脚手架
- **背景**：需要配置代码质量工具
- **备选方案**：
  1. ESLint 9 flat config — 新标准，与 WXT peer dependency 兼容
  2. ESLint 10 — 最新版但与 WXT/react-hooks 插件存在 peer dependency 冲突
- **决策**：ESLint 9 + typescript-eslint + react-hooks + prettier
- **理由**：ESLint 9 满足 WXT 的 peer dependency 要求，flat config 是未来标准

## [DEC-003] 消息总线使用原生 Chrome API 而非第三方库
- **日期**：2026-03-01
- **里程碑**：2 — 通信层
- **背景**：需要实现 DevTools panel ↔ background ↔ content script 的跨上下文通信
- **备选方案**：
  1. 原生 `browser.runtime.sendMessage` + `browser.runtime.connect` — 零依赖，完全控制消息格式
  2. @webext-core/messaging — WXT 生态库，自动类型推导
- **决策**：使用原生 API 封装自定义消息总线
- **理由**：脚手架定位要求对通信层有完整控制；原生 API 更透明，便于使用者理解和扩展；避免额外依赖

## [DEC-004] 消息路由采用 background 中心化转发模式
- **日期**：2026-03-01
- **里程碑**：2 — 通信层
- **背景**：DevTools panel 无法直接与 content script 通信
- **决策**：所有消息通过 background relay 路由。DevTools panel 通过 `forwardToTab` 字段指示 background 转发到指定 tab 的 content script
- **理由**：Chrome 扩展架构要求 DevTools panel 必须通过 background 中转；中心化路由逻辑清晰，便于调试和扩展

## [DEC-006] 调试模板使用 DevTools API 而非消息总线
- **日期**：2026-03-01
- **里程碑**：4 — DevTools Panel 调试布局模板
- **背景**：四个调试模板需要与页面交互（执行 JS、读取 DOM、捕获网络请求），可以通过消息总线经 content script 或直接使用 DevTools API
- **备选方案**：
  1. DevTools API（`chrome.devtools.inspectedWindow.eval`、`chrome.devtools.network`）— DevTools panel 直接访问，无需 content script 参与
  2. 消息总线 — 通过 content script 代理所有页面操作
- **决策**：使用 DevTools API
- **理由**：DevTools panel 上下文天然可用这些 API；避免 content script 膨胀；减少消息传递开销；eval API 可直接执行任意 JS 并获取结果；网络面板使用 HAR 标准格式

## [DEC-005] onMessage 异步响应使用 sendResponse 回调而非 Promise return
- **日期**：2026-03-01
- **里程碑**：2 — 通信层
- **背景**：初版使用 `return Promise` 方式处理异步响应，`sendMessage` 始终收到 `undefined`
- **备选方案**：
  1. `sendResponse` 回调 + `return true` — Chrome 原生 API 标准模式
  2. `return Promise` — webextension-polyfill 扩展语法，`@wxt-dev/browser` 不完整支持
- **决策**：使用 `sendResponse` + `return true`
- **理由**：`@wxt-dev/browser` 对 Promise return 的支持不完整；`sendResponse` 是 Chrome API 标准，兼容性最好

## [DEC-007] 持久化存储封装为极简 typed 工具函数
- **日期**：2026-03-01
- **里程碑**：5 — 调试模板增强
- **背景**：多个模板需要持久化数据到 `chrome.storage.local`
- **备选方案**：
  1. 每个模板直接调用 `chrome.storage.local` — 重复代码
  2. `lib/storage.ts` 封装 typed get/set/remove — 最小抽象
  3. 引入 zustand/jotai + chrome storage 适配器 — 过度工程化
- **决策**：方案 2 — 3 个简单函数，各模板 storage key 定义在各自 config.ts
- **理由**：当前只需 get/set/remove，不需要响应式状态管理。保持简单，后续有需要再升级

## [DEC-008] DOM Inspector 时间线通过 eval 注入 observer + 轮询读取
- **日期**：2026-03-01
- **里程碑**：5 — 调试模板增强
- **背景**：DevTools Panel 无法直接访问页面 DOM，需要通过 `inspectedWindow.eval` 注入
- **备选方案**：
  1. Content Script 注入 + 消息总线传事件 — 需要修改 content script，增加消息类型
  2. `inspectedWindow.eval` 注入 + 轮询 `window.__debugTimeline` — 自包含，不依赖消息总线
- **决策**：方案 2
- **理由**：独立于消息总线，实现更简洁；500ms 轮询间隔足够捕获大多数变化；离开时清理注入的 observer 避免内存泄漏

## [DEC-009] 模板组件常驻 mounted，CSS 切换可见性
- **日期**：2026-03-01
- **里程碑**：5 — 调试模板增强
- **背景**：切换模板 tab 时组件卸载导致所有 React 状态丢失（request list、filter、views 选中态等）
- **备选方案**：
  1. 条件渲染（当前方案）— 切换即卸载，状态全丢
  2. 所有模板同时 mounted + absolute/visible-invisible 切换 — 状态保持，内存代价可接受
  3. 状态提升到父组件或全局 store — 工程量大，过度设计
- **决策**：方案 2
- **理由**：四个模板组件轻量，常驻 mounted 内存开销可忽略；invisible 的组件不参与布局和事件，对性能无影响；避免了为每个模板维护外部状态的复杂度

## [DEC-011] WebSocket 消息捕获使用 inspectedWindow.eval 注入
- **日期**：2026-03-05
- **里程碑**：7 — WebSocket Monitor
- **背景**：需要捕获页面 WebSocket 消息，候选方案有 chrome.debugger API、Content Script 注入、inspectedWindow.eval 注入
- **备选方案**：
  1. `chrome.debugger` API — 能力最强（含已建立连接），但页面顶部出现调试横幅
  2. Content Script 注入 monkey-patch — 无横幅，但受 CSP 限制，需额外处理 MAIN world 注入
  3. `inspectedWindow.eval` 注入 monkey-patch — 无横幅、绕过 CSP、无额外权限，但只能捕获注入后新建的连接
- **决策**：方案 3
- **理由**：项目已有 eval 注入先例（DOM Inspector）；DevTools 上下文天然可用；调试场景下刷新页面即可捕获所有连接，限制可接受

## [DEC-012] WS Monitor 消息传回采用 postMessage + messaging bus 实时推送
- **日期**：2026-03-05
- **里程碑**：7 — WebSocket Monitor
- **背景**：注入脚本捕获的 WS 消息需要传回 DevTools Panel
- **备选方案**：
  1. `window.postMessage` → Content Script → messaging bus → DevTools — 实时推送
  2. 注入脚本缓存到全局数组 + eval 轮询读取 — 同 DOM Inspector 模式，有延迟
- **决策**：方案 1
- **理由**：WebSocket 消息是实时流式数据，轮询延迟不可接受；复用现有 messaging bus 体系

## [DEC-010] Data Viewer 快照改为 per-expression 维度
- **日期**：2026-03-01
- **里程碑**：5 — 调试模板增强
- **背景**：初版的全局快照面板（底部折叠 + 选两个 Diff）交互复杂且不直观
- **决策**：每个 WatchCard 内嵌自己的 snapshot timeline，展开后显示时间序列 diff
- **理由**：与 DOM Inspector 的 per-element Monitor 交互一致；数据粒度更细；无需全局选择 + Diff 的复杂流程
