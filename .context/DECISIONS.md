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
