# Active Context

## 当前状态
- 阶段：execute
- 里程碑：6 — 页面浮窗形态（P1）
- 状态：未开始

## 里程碑进度

### 已完成
- [x] 里程碑 1：项目脚手架与 DevTools Panel 空壳
- [x] 里程碑 2：通信层（消息总线）
- [x] 里程碑 3：共享 UI 组件体系
- [x] 里程碑 4：DevTools Panel 调试布局模板
- [x] 里程碑 5：调试模板增强（Pro 功能）

### 待完成
- [ ] 里程碑 6：页面浮窗形态（P1）
- [ ] 里程碑 7：侧边栏形态（P2）

## 交接备注
- manifest 已声明 `permissions: ['storage']`
- `lib/storage.ts` — 通用 typed get/set/remove 封装 `chrome.storage.local`
- TemplatesPage 使用 absolute + visible/invisible 保持所有模板组件 mounted（切换 tab 不丢失状态）
- Network Panel: Saved Views（Pill 标签条 + contains/regex 过滤切换 + 持久化），Highlight Rules（Response 上方 Tag 条 + JsonViewer 高亮自动展开 + 持久化）
- Data Viewer: per-expression Snapshot timeline（每个 WatchCard 独立快照历史，展开后显示 diff）
- Command Palette: Built-in + User Scripts 分区（CRUD + HTML5 拖拽排序 + 持久化），选中 Script 可过滤 History
- DOM Inspector: per-element Monitor 按钮 → 注入 MutationObserver + ResizeObserver + 轮询，Timeline 面板显示元素标识 + removed 事件
- 所有持久化 key 定义在各 template 的 config.ts 中
- `pnpm build` / `pnpm lint` / `pnpm compile` 全部通过

## 最近变更
- 2026-03-01 完成里程碑 5 全部任务 + 多轮 bugfix（持久化权限、滚动、状态保持等）
