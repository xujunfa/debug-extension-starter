## Skills 使用指南

按需加载，不要同时加载全部 Skills。仅加载与当前任务匹配的 Skill。

### 本项目相关 Skills

#### Chrome Extension Skills（按层级选择）

| 任务类型 | Skill | 定位 |
|---|---|---|
| 项目搭建、WXT 配置、入口文件、构建部署 | `chrome-extension-wxt` | 框架层 |
| 扩展 UI（popup/side panel/content script UI、无障碍） | `chrome-extension-ui` | 设计约束层 |
| 逻辑代码审查、性能优化、消息传递、storage | `chrome-extension` | 代码质量层 |
| 架构决策、安全、发布、跨浏览器兼容 | `chrome-extension-development` | 通用原则层 |

常见组合：
- 端到端新功能：`chrome-extension-wxt` + `chrome-extension-ui`
- 性能审计：仅 `chrome-extension`
- 快速原型：仅 `chrome-extension-wxt`

避免：
- 不要同时加载 `chrome-extension-development` 和 `chrome-extension`（后者是前者的超集，前者仅额外覆盖发布/i18n）

#### UI/UX 设计 Skills

| Skill | 用途 | 使用场景 |
|---|---|---|
| `ui-ux-pro-max` | 通用 UI/UX 设计系统（配色、字体、风格、布局） | 设计新页面/组件、选择配色与字体 |
| `tailwind-v4-shadcn` | Tailwind v4 + shadcn/ui 初始化配置 | 项目初始化阶段配置 Tailwind 和 shadcn/ui |
| `framer-motion-animator` | Framer Motion 动画实现 | 添加动画、过渡效果、微交互 |

`ui-ux-pro-max` 与 `chrome-extension-ui` 的区分：
- `chrome-extension-ui`：扩展特有约束（popup 尺寸、side panel 行为、Shadow DOM 隔离）
- `ui-ux-pro-max`：通用视觉设计（配色、字体搭配、设计风格）
- 从零设计扩展界面时两者组合使用

`ui-ux-pro-max` CLI 工具：
```bash
python3 skills/ui-ux-pro-max/scripts/search.py "<关键词>" --design-system -p "项目名"
python3 skills/ui-ux-pro-max/scripts/search.py "<关键词>" --domain <领域>
python3 skills/ui-ux-pro-max/scripts/search.py "<关键词>" --stack <技术栈>
```

#### 开发流程 Skills

| Skill | 用途 | 使用场景 |
|---|---|---|
| `workflow` | 项目工作流管理（brainstorm → plan → execute） | 每次会话开始时通过 `/workflow` 进入 |
| `test-driven-development` | TDD 方法论 | 实现功能前先写测试 |
| `systematic-debugging` | 系统化排查方法 | 遇到 bug 或测试失败时 |

#### 里程碑与 Skills 对应关系

| 里程碑 | 推荐 Skills |
|---|---|
| 1. 项目脚手架 | `chrome-extension-wxt` + `tailwind-v4-shadcn` |
| 2. 消息总线 | `chrome-extension-wxt` + `chrome-extension` |
| 3. UI 组件体系 | `ui-ux-pro-max` + `chrome-extension-ui` |
| 4. 调试布局模板 | `chrome-extension-wxt` + `chrome-extension-ui` |
| 5. 页面浮窗 | `chrome-extension-ui` + `chrome-extension` |
| 6. 侧边栏 | `chrome-extension-ui` + `chrome-extension` |

### 与本项目无关的 Skills（不要加载）

`react-flow`、`react-flow-advanced`、`tanstack-query-best-practices`、`jotai-expert`、`tauri-v2`、`ai-sdk`、`vercel-react-best-practices`、`openclaw-cron-creator`、`agent-browser`、`tuistory`
