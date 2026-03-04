# Active Context

## 当前状态
- 阶段：execute
- 里程碑：6 — Request Header 分组管理器
- 状态：已完成

## 里程碑进度

### 已完成
- [x] 里程碑 1：项目脚手架与 DevTools Panel 空壳
- [x] 里程碑 2：通信层（消息总线）
- [x] 里程碑 3：共享 UI 组件体系
- [x] 里程碑 4：DevTools Panel 调试布局模板
- [x] 里程碑 5：调试模板增强（Pro 功能）
- [x] 里程碑 6：Request Header 分组管理器

### 待完成
- [ ] 里程碑 7：页面浮窗形态（P1）
- [ ] 里程碑 8：侧边栏形态（P2）

## 交接备注
- `templates/header-manager/config.ts` — HeaderItem/HeaderGroup 类型 + `collectActiveHeaders()` 工具函数 + 存储 key `header-groups`
- `lib/header-rules.ts` — `applyHeaderRules(tabId, headers)` / `clearHeaderRules(tabId)` 封装 declarativeNetRequest session rules
- 规则 ID 方案：全局递增计数器 + 内存 Map 跟踪每 tab 的 rule IDs（旧方案 tabId*1000+index 因 tabId 过大溢出 32-bit int 已废弃）
- `entrypoints/background.ts` — 注册了 APPLY_HEADER_RULES 和 CLEAR_HEADER_RULES 消息处理
- `wxt.config.ts` — 新增 `declarativeNetRequest` 权限和 `<all_urls>` host_permissions
- `lib/messaging/types.ts` — 新增 APPLY_HEADER_RULES / CLEAR_HEADER_RULES 消息类型
- `templates/header-manager/index.tsx` — Group 卡片列表 + Header 行，双层 toggle 控制，拖拽排序，自动持久化 + 实时规则同步
- `components/ui/switch.tsx` / `components/ui/checkbox.tsx` — 新增的 shadcn/ui 组件
- `lib/templates/registry.ts` — 注册了 header-manager 模板（icon: FileText）
- `pnpm build` / `pnpm lint` / `pnpm compile` 全部通过

## 最近变更
- 2026-03-05 插入里程碑 6（Request Header 分组管理器），原里程碑 6、7 顺延为 7、8
- 2026-03-05 完成里程碑 6 全部 6 个任务
- 2026-03-05 修复 header-rules rule ID 溢出 32-bit int 的 bug（tabId 过大导致 declarativeNetRequest 报错）
