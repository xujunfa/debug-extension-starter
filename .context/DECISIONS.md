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

## [DEC-005] onMessage 异步响应使用 sendResponse 回调而非 Promise return
- **日期**：2026-03-01
- **里程碑**：2 — 通信层
- **背景**：初版使用 `return Promise` 方式处理异步响应，`sendMessage` 始终收到 `undefined`
- **备选方案**：
  1. `sendResponse` 回调 + `return true` — Chrome 原生 API 标准模式
  2. `return Promise` — webextension-polyfill 扩展语法，`@wxt-dev/browser` 不完整支持
- **决策**：使用 `sendResponse` + `return true`
- **理由**：`@wxt-dev/browser` 对 Promise return 的支持不完整；`sendResponse` 是 Chrome API 标准，兼容性最好
