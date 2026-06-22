# 爪印 - 项目文档

## 项目概述

基于 Electron + Vue 3 + Vite 构建的 PC 桌面爪印便签应用，支持便签管理、置顶、完成状态、主题切换等功能。

## 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Electron | ^29.0.0 | 桌面应用框架 |
| Vue 3 | ^3.4.21 | UI 框架 |
| Vite | ^5.2.0 | 构建工具 |
| electron-store | ^8.1.0 | 本地持久化存储 |
| Pinia | ^2.1.7 | 状态管理（已引入，暂未使用） |

## 目录结构

```
pawprint/
├── build/                        # 应用图标资源
│   └── icon.ico                  # 应用图标
├── dist/                         # Vite 构建产物
├── src/
│   └── renderer/                 # 渲染进程代码
│       ├── App.vue               # 主界面（管理列表 + 详情窗口）
│       ├── main.js               # Vue 入口
│       ├── style.css             # 全局样式 + CSS 变量
│       └── components/
│           └── NoteDetail.vue    # 便签详情编辑组件
├── electron-main.js              # Electron 主进程
├── electron-preload.js           # 预加载脚本（IPC 桥接）
├── electron-builder.json         # 打包配置
├── index.html                    # HTML 入口
├── package.json                  # 项目配置
└── vite.config.js                # Vite 配置
```

## 架构设计

### 进程模型

```
┌─────────────────────────────────────────────────────┐
│                   Main Process                      │
│              (electron-main.js)                      │
│                                                     │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────┐  │
│  │ mainWindow  │  │ noteWindows  │  │   Tray    │  │
│  │  (管理页)    │  │  (便签窗口)   │  │  (托盘)   │  │
│  └──────┬──────┘  └──────┬───────┘  └───────────┘  │
│         │                │                          │
│         └────────┬───────┘                          │
│                  │                                  │
│         ┌────────▼────────┐                         │
│         │  electron-store │                         │
│         │   (持久化存储)    │                         │
│         └─────────────────┘                         │
└─────────────────────┬───────────────────────────────┘
                      │ IPC (contextBridge)
┌─────────────────────▼───────────────────────────────┐
│                 Renderer Process                    │
│              (Vue 3 Application)                    │
│                                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │                  App.vue                     │   │
│  │                                              │   │
│  │  pageType === 'manager':                     │   │
│  │    ┌──────────┐ ┌──────────┐ ┌──────────┐   │   │
│  │    │ Titlebar │ │ Toolbar  │ │Note List │   │   │
│  │    └──────────┘ └──────────┘ └──────────┘   │   │
│  │                                              │   │
│  │  pageType === 'note'/'view':                 │   │
│  │    ┌──────────────────────────────────┐      │   │
│  │    │        NoteDetail.vue            │      │   │
│  │    └──────────────────────────────────┘      │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

### IPC 通信协议

| 通道 | 方向 | 说明                   |
|------|------|----------------------|
| `create-note` | Renderer → Main | 创建便签窗口（同步，返回 noteId） |
| `save-note` | Renderer → Main | 保存新便签数据（不弹窗）         |
| `update-note` | Renderer → Main | 更新便签数据               |
| `delete-note` | Renderer → Main | 删除便签                 |
| `get-notes` | Renderer → Main | 获取所有便签（同步）           |
| `notes-changed` | Main → Renderer | 通知便签数据变更             |
| `shortcut-create-note` | Main → Renderer | 快捷键触发新建              |
| `window-minimize` | Renderer → Main | 最小化窗口                |
| `window-maximize` | Renderer → Main | 最大化/还原窗口             |
| `window-close` | Renderer → Main | 隐藏窗口到托盘              |
| `window-set-always-on-top` | Renderer → Main | 设置窗口置顶               |
| `window-set-opacity` | Renderer → Main | 设置窗口透明度              |
| `save-setting` | Renderer → Main | 保存设置项                |
| `get-settings` | Renderer → Main | 获取设置（同步）             |

### 数据模型

**爪印便签数据 (notes.{noteId})**
```javascript
{
  id: "note-1718368800000",
  title: "爪印便签标题",
  content: "爪印便签内容",
  opacity: 0.95,           // 窗口透明度 0.3~1
  alwaysOnTop: false,      // 是否置顶
  completed: false,        // 是否完成
  x: 150,                  // 窗口位置
  y: 120,
  width: 320,              // 窗口尺寸
  height: 420
}
```

**设置数据 (settings.*)**
```javascript
{
  theme: "light",              // 主题：light / dark
  accentColor: "#66bb6a",      // 主题色
  sortOrder: "desc",           // 排序：desc / asc
  mainWindowPinned: false      // 主窗口置顶状态
}
```

**主窗口位置 (mainWindowBounds)**
```javascript
{ x: 100, y: 100, width: 280, height: 600 }
```

## 功能模块

### 1. 主界面 (App.vue)

**路由逻辑**：通过 URL 参数 `type` 切换视图
- `type=manager`（默认）：管理列表页
- `type=note` / `type=view`：便签详情编辑页

**标题栏**
- 左侧：Logo + 文字（可拖拽移动窗口）
- 右侧：📌 置顶 | ▼ 设置菜单 | 最小化 | 最大化 | 关闭
- 设置菜单：主题选择、主题色选择、窗口透明度

**工具栏**
- 新建便签按钮（虚线边框样式）
- 排序切换按钮（正序/倒序）

**便签列表**
- 卡片式布局，每张卡片包含：复选框 + 标题 + 内容预览
- Hover 显示操作按钮：👁 查看 | 📌 置顶 | 🗑️ 删除
- 置顶项：左侧主题色边框 + 浅色背景
- 完成项：半透明 + 删除线

**排序规则**
1. 置顶项始终在最上方
2. 非置顶项在中间
3. 完成项在最下方
4. 各分组内部按时间正序/倒序排列

**新建逻辑**
- 点击按钮或 Ctrl+N：在列表中新增空卡片
- 倒序：新卡片在置顶项下方
- 正序：新卡片在列表末尾
- 自动聚焦标题输入框
- 失焦时：有内容则保存，无内容则删除

### 2. 详情窗口 (NoteDetail.vue)

独立窗口，打开已有便签进行编辑：
- 标题栏：拖拽 + 标题输入 + 透明度/置顶/保存/关闭
- 内容区：全屏文本域
- 输入防抖保存（500ms）

### 3. 主进程 (electron-main.js)

**窗口管理**
- 主窗口：frame: false, transparent: true, 默认宽度 280px
- 便签窗口：frame: false, transparent: true, 支持独立透明度和置顶
- 关闭主窗口时隐藏到托盘，不退出应用

**托盘**
- 右键菜单：显示主窗口、新建便签、退出
- 点击显示主窗口

**全局快捷键**
- `Ctrl+N`：新建便签
- `Ctrl+Shift+S`：显示主窗口

**持久化**
- 使用 electron-store 存储所有数据
- 窗口位置/尺寸自动记忆
- 设置项（主题、颜色、排序、置顶）自动保存

### 4. 预加载脚本 (electron-preload.js)

通过 contextBridge 暴露安全的 API 到 `window.electronAPI`：
- 便签操作：createNote, saveNote, updateNote, deleteNote, getNotes
- 窗口操作：windowMinimize, windowMaximize, windowClose, windowSetAlwaysOnTop, windowSetOpacity
- 设置操作：saveSetting, getSettings
- 事件监听：onNotesChanged, onShortcutCreateNote

## 快捷键

| 快捷键 | 功能     |
|--------|--------|
| `Ctrl+N` | 新建便签   |
| `Ctrl+Shift+S` | 显示主窗口  |
| `Escape` | 关闭设置菜单 |

## 运行命令

```bash
# 安装依赖
npm install

# 开发模式（启动 Vite + Electron）
npm run electron

# 构建前端
npm run build

# 打包应用
npm run electron:package
```

## 开发注意事项

1. **端口配置**：Vite 使用 5173 端口，`strictPort: true` 防止端口冲突
2. **环境变量**：使用 `cross-env` 设置 `NODE_ENV=development`
3. **新建便签流程**：
   - 前端创建临时数据 → 用户输入 → 失焦时调用 `save-note` 保存
   - 不输入内容失焦 → 调用 `discardNewNote` 删除
4. **菜单关闭**：点击外部 + blur 事件 + ESC 键三重保障
5. **自适应高度**：内容框 `autoResize` 函数，最大 36px（约两行）

## 主题系统

通过 CSS 变量实现主题切换：

```css
:root {
  --accent: #66bb6a;        /* 主题色 */
  --accent-light: #66bb6a20; /* 主题色浅色 */
  --bg: #e8f5e9;            /* 页面背景 */
  --card-bg: #f1f8e9;       /* 卡片背景 */
  --card-border: #c5e1a5;   /* 卡片边框 */
  --text: #1b5e20;          /* 主文字 */
  --text-light: #66bb6a;    /* 浅文字 */
  --text-muted: #aed581;    /* 弱化文字 */
}

[data-theme="dark"] {
  --bg: #1a1a2e;
  --card-bg: #25253e;
  --card-border: #3a3a5c;
  --text: #e0e0e0;
  --text-light: #888;
  --text-muted: #666;
}
```

支持 6 种主题色：绿色、蓝色、紫色、橙色、红色、粉色。
