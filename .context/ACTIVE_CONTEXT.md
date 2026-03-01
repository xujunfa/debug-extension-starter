# Active Context

## 当前状态
- 阶段：execute
- 里程碑：4 — DevTools Panel 调试布局模板
- 状态：未开始

## 里程碑进度

### 已完成
- [x] 里程碑 1：项目脚手架与 DevTools Panel 空壳
- [x] 里程碑 2：通信层（消息总线）
- [x] 里程碑 3：共享 UI 组件体系
  - `components/ui/button.tsx` `badge.tsx` `input.tsx` `tabs.tsx` `scroll-area.tsx` `tooltip.tsx` — shadcn/ui 组件
  - `components/debug/json-viewer.tsx` — 可折叠/展开的 JSON 树形查看器，支持 maxDepth、类型着色
  - `components/debug/kv-display.tsx` — Key-Value 展示，支持高亮行、分组折叠
  - `components/debug/code-block.tsx` — 代码块展示，支持行号、复制、语言标签
  - `components/layout/panel-layout.tsx` — 头/内容/尾固定布局
  - `components/layout/split-pane.tsx` — 可拖拽分割面板，支持水平/垂直
  - `components/layout/tab-layout.tsx` — 标签页布局，基于 shadcn Tabs
  - `entrypoints/devtools-panel/pages/showcase.tsx` — 组件展示页
  - `entrypoints/devtools-panel/App.tsx` — 添加 Home/Components 导航标签

### 待完成
- [ ] 里程碑 4：DevTools Panel 调试布局模板
- [ ] 里程碑 5：页面浮窗形态（P1）
- [ ] 里程碑 6：侧边栏形态（P2）

## 交接备注
- App.tsx 现在使用 Tabs 组件切换 Home（连接状态）和 Components（组件展示页）
- shadcn/ui 使用 new-york style，Tailwind v4 + CSS variables 主题
- 新增依赖：`radix-ui`、`class-variance-authority`（shadcn/ui CLI 安装 + 手动补装）
- 所有 debug 组件导出了类型和组件，可直接在模板中复用
- SplitPane 使用 mouse event 实现拖拽，无外部依赖
- `pnpm build` / `pnpm lint` / `pnpm compile` 全部通过

## 最近变更
- 2026-03-01 完成里程碑 3 全部 6 项任务
- 2026-03-01 安装 shadcn/ui 组件 + class-variance-authority
- 2026-03-01 创建 debug 组件（json-viewer、kv-display、code-block）
- 2026-03-01 创建 layout 组件（panel-layout、split-pane、tab-layout）
- 2026-03-01 创建组件展示页，App.tsx 添加 tab 导航
