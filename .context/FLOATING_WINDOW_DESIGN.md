# 浮窗形态（Floating Window）技术方案

> 里程碑 8 详细设计文档
> 创建日期：2026-03-05

## 1. 概述

### 1.1 定位

浮窗是一个通过 Content Script 注入到宿主页面的全局调试工具窗口，**独立于 DevTools**。它允许开发者在不打开 DevTools 的情况下快速使用轻量级调试功能。

### 1.2 与 DevTools Panel 的差异

| 维度 | DevTools Panel | 浮窗 |
|------|---------------|------|
| 承载空间 | 整个 DevTools 面板区域（宽 ~1200px+） | 页面上的可拖拽窗口（默认 380×480px） |
| 可用 API | `chrome.devtools.*` 全套 | 无 DevTools API，走 Content Script + Background |
| 功能密度 | 高 — SplitPane、多列布局 | 低 — 单列紧凑布局，一次显示一个功能 |
| 使用场景 | 深度调试 | 快速查看/操作 |

### 1.3 核心设计原则

1. **布局优先** — 380px 宽度约束下，所有交互必须舒适可用
2. **精选功能** — 不是 DevTools Panel 的全量搬运，只挑选适合浮窗形态的功能
3. **复用底座** — 最大化复用现有 UI 组件和通信层

---

## 2. 浮窗外壳设计

### 2.1 容器技术

使用 WXT 内置的 `createShadowRootUi` 实现 Shadow DOM 隔离：

```
entrypoints/floating-window.content/
├── index.tsx          # Content Script 入口，createShadowRootUi 挂载
├── App.tsx            # 浮窗 React 根组件
└── styles.css         # 浮窗专用入口 CSS（import main.css + 覆盖）
```

关键配置：
```ts
export default defineContentScript({
  matches: ['<all_urls>'],
  cssInjectionMode: 'ui',         // CSS 注入到 Shadow DOM 内部
  runAt: 'document_idle',

  async main(ctx) {
    const ui = await createShadowRootUi(ctx, {
      name: 'debug-floating-window',      // 自定义元素名
      position: 'overlay',                 // 覆盖在页面之上
      zIndex: 2147483647,                  // 最高层级
      isolateEvents: ['keydown', 'keyup', 'keypress'],  // 防止按键事件穿透
      onMount(container) { ... },
      onRemove(root) { ... },
    });
    ui.mount();
  },
});
```

**为什么用 `createShadowRootUi`：**
- WXT 内置，自动处理 `:root` → `:host` 的 CSS 变量映射
- 自动拆分 `@property` / `@font-face` 到 document head
- 自动在 `ctx.onInvalidated` 时清理 DOM
- Tailwind v4 的所有 utility class 在 Shadow DOM 内正常工作

### 2.2 窗口外壳交互

#### 尺寸

| 属性 | 值 |
|------|-----|
| 默认宽度 | 380px |
| 默认高度 | 480px |
| 最小宽度 | 320px |
| 最小高度 | 240px |
| 最大宽度 | 600px |
| 最大高度 | 80vh |

#### 交互能力

1. **拖拽移动** — 通过标题栏拖拽（复用 SplitPane 的 mouse event 模式）
2. **折叠/展开** — 点击标题栏按钮或双击标题栏，折叠后仅显示标题栏（高度 ~36px）
3. **调整大小** — 右下角拖拽手柄（右边 + 下边 + 右下角三个方向）
4. **显示/隐藏** — Extension icon 点击或键盘快捷键切换

#### 拖拽实现

使用 Framer Motion 的 `drag` prop（项目已安装 `motion` 库但未使用）：

```tsx
<motion.div
  drag
  dragMomentum={false}
  dragConstraints={constraintsRef}  // 限制在视口内
  dragListener={false}               // 只通过 dragControls 触发
  style={{ x, y }}
>
  <div onPointerDown={startDrag}>    {/* 标题栏区域触发拖拽 */}
    ...
  </div>
  <div>{/* 内容区 */}</div>
</motion.div>
```

**为什么用 Framer Motion 而不是自定义 mouse event：**
- 项目已安装 `motion@12.34.3`，零成本引入
- 拖拽约束（视口边界）、惯性、手势处理开箱即用
- 与后续动画需求（折叠展开过渡）天然整合

#### 调整大小实现

自定义 resize handle（与 SplitPane 同风格的 mouse event 模式）：
- 右边缘、底部边缘、右下角 3 个 resize 热区
- 拖拽时实时更新 width/height state
- 受 min/max 约束

### 2.3 标题栏布局

```
┌─────────────────────────────────────┐
│ ≡ Debug Extension  [Header] [Command] ▼ │  ← 36px 高度
├─────────────────────────────────────┤
│                                     │
│           功能内容区                  │
│                                     │
└─────────────────────────────────────┘
                                    ⌟  ← resize handle
```

- **左侧**：拖拽抓手图标 + "Debug Extension" 标题
- **中间**：功能切换标签（紧凑 pill 样式）
- **右侧**：折叠按钮（ChevronDown/ChevronUp）
- 整个标题栏可拖拽（除按钮区域外）

### 2.4 位置记忆

浮窗的位置（x, y）、尺寸（width, height）、折叠状态通过 `chrome.storage.local` 持久化，复用现有 `lib/storage.ts`：

```ts
const STORAGE_KEY = 'floating-window-state';
interface FloatingWindowState {
  x: number;
  y: number;
  width: number;
  height: number;
  collapsed: boolean;
  activeTab: string;
}
```

---

## 3. 功能选型

### 3.1 筛选标准

1. **不依赖 DevTools API** — `chrome.devtools.inspectedWindow.eval` 和 `chrome.devtools.network` 在 Content Script 中不可用
2. **单列布局友好** — 380px 宽度下必须有良好的视觉呈现
3. **独立性强** — 功能自包含，不需要复杂的跨上下文通信

### 3.2 功能适配性分析

| 模板 | 依赖 DevTools API? | 适合 380px? | 独立性 | 结论 |
|------|-------------------|-------------|--------|------|
| Network Panel | ✅ `devtools.network.onRequestFinished` | ❌ 需要 SplitPane | 低 | **排除** |
| Data Viewer | ✅ `inspectedWindow.eval` | ⚠️ 可适配 | 中 | **排除**（需 eval 替代方案） |
| Command Palette | ✅ `inspectedWindow.eval` | ⚠️ 可适配 | 中 | **排除**（需 eval 替代方案） |
| DOM Inspector | ✅ `inspectedWindow.eval` | ⚠️ 可适配 | 中 | **排除**（需 eval 替代方案） |
| **Header Manager** | ❌ 走 messaging + background | ✅ 单列卡片 | ✅ | **入选** |
| WS Monitor | ⚠️ eval 注入 + messaging | ❌ 需要 SplitPane | 低 | **排除** |

### 3.3 入选功能

#### 功能 A：Header Manager（迁移适配）

**为什么最适合浮窗：**
- 零 DevTools API 依赖 — 通过 `sendRequest('APPLY_HEADER_RULES', ...)` 与 Background 通信，Background 通过 `declarativeNetRequest` 生效规则
- 天然单列布局 — Group 卡片堆叠，380px 宽度下完美展示
- 使用频率高 — 开发者经常在普通浏览时切换 Header，不想每次打开 DevTools

**适配改动：**
1. 移除对 `chrome.devtools.inspectedWindow.tabId` 的依赖 → 从 Background 获取当前 tabId
2. 组件代码几乎不变，只需替换 tabId 获取方式

#### 功能 B：Quick Eval（新功能，浮窗专属）

从 Command Palette 提取 "Quick Eval" 模块，适配为 Content Script 上下文：

- Content Script 可以直接通过 `window.eval()` 在同源页面执行 JS（或通过 Background 的 `chrome.scripting.executeScript`）
- 输入框 + 执行按钮 + 结果展示（复用 JsonViewer）
- 支持历史记录（最近 20 条）
- 单列布局天然适配

**实现方式：**
```
                         sendRequest('EVAL_IN_PAGE', { code })
浮窗 (Content Script)  ──────────────────────────────────► Background
                                                             │
                                                   chrome.scripting.executeScript
                                                             │
                                                             ▼
                                                        目标页面
```

通过 Background 的 `chrome.scripting.executeScript` API 执行，避免同源策略限制，且不需要 DevTools API。

---

## 4. 布局设计

### 4.1 整体结构

浮窗内容区采用 **TabLayout 切换** 模式，每个功能独占一个 Tab：

```
┌───────────────────────────── 380px ─────────────────────────┐
│ ☰  Debug Extension      [Headers] [Eval]              ▾    │ ← 标题栏 36px
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─ Header Groups ──────────────────── 2 active ── + ─┐   │
│  │                                                     │   │
│  │  ┌─ Group: API Auth ─────────────── [on] ─── ✕ ─┐  │   │
│  │  │  ☑ Authorization  Bearer xxx...               │  │   │
│  │  │  ☑ X-Request-ID   {{uuid}}                    │  │   │
│  │  │  + Add Header                                 │  │   │
│  │  └───────────────────────────────────────────────┘  │   │
│  │                                                     │   │
│  │  ┌─ Group: Debug ────────────────── [off] ── ✕ ─┐  │   │
│  │  │  ☐ X-Debug-Mode   true                       │  │   │
│  │  │  + Add Header                                 │  │   │
│  │  └───────────────────────────────────────────────┘  │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

```
┌───────────────────────────── 380px ─────────────────────────┐
│ ☰  Debug Extension      [Headers] [Eval]              ▾    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─ Quick Eval ─────────────────────────────────────┐      │
│  │  > document.title                          [▶ Run]│      │
│  └──────────────────────────────────────────────────┘      │
│                                                             │
│  ┌─ Result ─────────────────────────────────────────┐      │
│  │  "My Page Title"                                  │      │
│  └──────────────────────────────────────────────────┘      │
│                                                             │
│  ┌─ History ─────────────────────── 3 entries ───┐         │
│  │  > document.querySelectorAll('a').length  12ms │         │
│  │    → 42                                        │         │
│  │  > localStorage.length                     3ms │         │
│  │    → 8                                         │         │
│  │  > window.innerWidth                       1ms │         │
│  │    → 1920                                      │         │
│  └────────────────────────────────────────────────┘         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 紧凑布局适配策略

| 策略 | 说明 |
|------|------|
| **缩小间距** | padding 从 p-4 降到 p-2/p-1.5，gap 从 gap-2 降到 gap-1.5 |
| **字号降级** | 正文 text-xs (12px)，标签 text-[10px]，标题 text-sm |
| **单列堆叠** | 取消 SplitPane，所有内容单列 ScrollArea |
| **Input 精简** | Input 高度 h-6 (24px)，与 DevTools 中已使用的尺寸一致 |
| **Pill Tab** | 标题栏内的 Tab 用紧凑 pill 样式，不占用内容区空间 |

### 4.3 折叠态

折叠后仅展示标题栏（36px 高），用 Framer Motion `AnimatePresence` + `motion.div` 实现平滑过渡：

```
┌──────────────────────────────────────┐
│ ☰  Debug Extension  [Headers] [Eval]  ▴  │  ← 仅标题栏
└──────────────────────────────────────┘
```

---

## 5. 通信架构

### 5.1 TabId 获取

DevTools Panel 通过 `chrome.devtools.inspectedWindow.tabId` 获取 tabId。浮窗运行在 Content Script 上下文，没有此 API。

**方案：Content Script 通过 `browser.runtime.sendMessage` 发请求到 Background，Background 从 `sender.tab.id` 获取 tabId 并返回。**

新增消息类型：

```ts
// 新增到 RequestMap
GET_TAB_ID: { request: {}; response: { tabId: number } };
EVAL_IN_PAGE: { request: { tabId: number; code: string }; response: { result: unknown; error?: string } };
```

Background 新增 handler：

```ts
onRequest('GET_TAB_ID', (_payload, sender) => {
  return { tabId: sender.tab!.id! };
});

onRequest('EVAL_IN_PAGE', async (payload) => {
  const [result] = await chrome.scripting.executeScript({
    target: { tabId: payload.tabId },
    func: (code: string) => { try { return eval(code); } catch(e) { return { __error: e.message }; } },
    args: [payload.code],
  });
  return { result: result.result };
});
```

### 5.2 显示/隐藏控制

**方案：Background 统一调度**

1. **Extension icon 点击** → Background `onAction.addListener` → 向 tab 发送 `TOGGLE_FLOATING_WINDOW` 消息
2. **键盘快捷键** → manifest.json 注册 command → Background handler → 向 tab 发消息
3. **Content Script 收到消息** → toggle React 组件的 visible state

```ts
// manifest.json commands
"commands": {
  "toggle-floating-window": {
    "suggested_key": { "default": "Ctrl+Shift+D", "mac": "Command+Shift+D" },
    "description": "Toggle floating debug window"
  }
}
```

### 5.3 通信流程总览

```
┌─ 浮窗 (Content Script) ──────────────────────────────────────┐
│                                                                │
│  sendRequest('GET_TAB_ID')     → background → sender.tab.id   │
│  sendRequest('APPLY_HEADER_RULES', { tabId, headers })         │
│  sendRequest('EVAL_IN_PAGE', { tabId, code })                  │
│                                                                │
│  onMessage('TOGGLE_FLOATING_WINDOW') → toggle visible          │
│                                                                │
└────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─ Background ──────────────────────────────────────────────────┐
│                                                                │
│  onRequest('GET_TAB_ID')      → return sender.tab.id           │
│  onRequest('APPLY_HEADER_RULES') → declarativeNetRequest       │
│  onRequest('EVAL_IN_PAGE')    → chrome.scripting.executeScript  │
│  browser.action.onClicked     → sendMessage(TOGGLE)            │
│  commands.onCommand            → sendMessage(TOGGLE)            │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## 6. 样式隔离

### 6.1 Shadow DOM + WXT 自动处理

WXT 的 `createShadowRootUi` + `cssInjectionMode: 'ui'` 自动完成：

1. 构建时将浮窗 CSS 独立打包为 `content-scripts/floating-window.css`
2. 运行时 `fetch()` 加载 CSS，自动将 `:root` 替换为 `:host`
3. 自动拆分 `@property` 和 `@font-face` 规则到 document `<head>`
4. 在 Shadow Root 内插入 `<style>` 标签
5. 自动添加 `:host { all: initial !important; }` 防止宿主样式泄漏

### 6.2 浮窗专属 CSS

```css
/* entrypoints/floating-window.content/styles.css */
@import '../../assets/main.css';

/* 浮窗容器默认使用 dark 主题（调试工具风格） */
:host {
  color-scheme: dark;
}
```

### 6.3 主题

浮窗默认使用 dark 主题（与 DevTools 风格保持一致），通过在 Shadow Root 的容器 div 上添加 `class="dark"` 实现。项目已有完整的 `.dark` CSS 变量定义。

---

## 7. 文件结构

```
entrypoints/
├── floating-window.content/
│   ├── index.tsx           # Content Script 入口（createShadowRootUi）
│   ├── App.tsx             # 浮窗根组件（外壳 + Tab 切换）
│   ├── components/
│   │   ├── window-shell.tsx    # 窗口外壳（拖拽、resize、折叠）
│   │   ├── title-bar.tsx       # 标题栏
│   │   └── resize-handle.tsx   # 右下角 resize 手柄
│   ├── features/
│   │   ├── header-manager.tsx  # Header Manager 浮窗适配版
│   │   └── quick-eval.tsx      # Quick Eval 新功能
│   └── styles.css              # 浮窗专属 CSS 入口

lib/
├── messaging/
│   └── types.ts            # 新增 GET_TAB_ID, EVAL_IN_PAGE, TOGGLE_FLOATING_WINDOW

entrypoints/
├── background.ts           # 新增 handler: GET_TAB_ID, EVAL_IN_PAGE, action/command listener
```

### 7.1 关于模板复用的说明

浮窗内的 Header Manager **不直接 import** DevTools Panel 版本的 `templates/header-manager/index.tsx`，原因：
1. 原版硬编码了 `chrome.devtools.inspectedWindow.tabId`
2. 原版按 DevTools Panel 宽度设计，padding/gap 偏大
3. 但 `templates/header-manager/config.ts` 中的类型定义、工具函数可以直接复用

复用关系：
- ✅ 复用：`templates/header-manager/config.ts`（types + helpers）
- ✅ 复用：`lib/messaging/`、`lib/storage.ts`、`components/ui/*`
- 🔄 适配重写：UI 组件（紧凑布局版本）

---

## 8. 权限变更

```ts
// wxt.config.ts manifest 新增
{
  permissions: ['storage', 'declarativeNetRequest', 'scripting'],  // +scripting
  commands: {
    'toggle-floating-window': {
      suggested_key: { default: 'Ctrl+Shift+D', mac: 'Command+Shift+D' },
      description: 'Toggle floating debug window',
    },
  },
  action: {},  // 启用 browser action（Extension icon 点击事件）
}
```

- `scripting` — Quick Eval 功能的 `chrome.scripting.executeScript` 需要
- `action` — Extension icon 点击切换浮窗
- `commands` — 键盘快捷键支持

---

## 9. 关键技术决策摘要

| # | 决策 | 理由 |
|---|------|------|
| D1 | 使用 WXT `createShadowRootUi` 而非手动 `attachShadow` | WXT 自动处理 CSS 注入、`:root`→`:host` 映射、`@property` 拆分、生命周期清理 |
| D2 | 拖拽使用 Framer Motion `drag` 而非原生 mouse event | 项目已安装 motion；约束、惯性、动画一体化；代码更简洁 |
| D3 | Resize 使用原生 mouse event | resize 交互简单，不需要 motion 的额外能力；与 SplitPane 风格统一 |
| D4 | 首批功能只做 Header Manager + Quick Eval | Header Manager 零 DevTools 依赖，天然适配；Quick Eval 轻量新功能，填补浮窗核心使用场景 |
| D5 | 通过 `chrome.scripting.executeScript` 执行页面代码 | 比 Content Script `window.eval` 更强（不受同源限制），且不需要 DevTools API |
| D6 | 浮窗默认 dark 主题 | 与 DevTools 风格一致；深色调减少视觉干扰；项目已有完整 dark token |
| D7 | Header Manager UI 适配重写而非直接复用 | 布局差异大（380px vs ~1200px），但复用 config.ts 的类型和逻辑 |

---

## 10. 验收标准

1. ✅ 页面上出现可拖拽、可折叠、可 resize 的浮窗
2. ✅ 浮窗样式与宿主页面完全隔离（Shadow DOM）
3. ✅ Header Manager 在浮窗内正常工作（增删 Group/Header、开关、规则生效）
4. ✅ Quick Eval 可在浮窗内执行 JS 并展示结果
5. ✅ Extension icon 点击和 Ctrl+Shift+D 可切换浮窗显示/隐藏
6. ✅ 浮窗位置/尺寸/折叠状态跨页面持久化
7. ✅ 浮窗内 Tailwind 样式正常渲染，dark 主题生效
