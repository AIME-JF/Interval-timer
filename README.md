# 💧 间隔时钟 — 术后滴眼药间隔计时器

[English](#english) | 中文

> 一款专为眼科术后用药设计的桌面悬浮计时器，帮助你精准管理多种眼药水的滴药间隔。

---

## ✨ 功能特性

- 🕐 **精准间隔计时** — 基于 `Date.now()` 差值计算，避免 `setInterval` 漂移，确保计时精准
- 💊 **多药水管理** — 支持添加、删除、重命名、排序多种眼药水
- 🔄 **自动状态流转** — 空闲 → 等待滴药 → 倒计时 → 提醒 → 下一种药，全流程自动引导
- 📌 **桌面悬浮窗** — 小巧置顶窗口，不遮挡工作，随时查看用药状态
- 🔔 **多重提醒** — 提示音 + 系统通知 + 任务栏闪烁，确保不错过用药时间
- 📊 **每日记录** — 自动记录每日用药次数，跨日自动重置
- ⌨️ **快捷键支持** — `Ctrl+Space` 快速确认，`Space` 快速操作
- 🎨 **护眼深色主题** — 专为术后眼睛设计的低刺激暗色界面
- 🖱️ **系统托盘** — 关闭窗口最小化到托盘，不影响使用

## 📸 界面预览

应用界面紧凑精致，主要包含以下状态：

| 状态 | 说明 |
|------|------|
| 空闲 | 显示今日用药进度，一键开始 |
| 等待滴药 | 提示当前药水名称，确认已滴药 |
| 倒计时 | 圆环进度条 + 数字倒计时，显示下一种药水 |
| 提醒 | 脉冲动画 + 提示音，提醒该滴下一种药 |
| 完成 | 本轮所有药水滴完，显示今日进度 |

## 🚀 快速开始

### 环境要求

- [Node.js](https://nodejs.org/) 16+
- npm 或 yarn

### 安装与运行

```bash
# 克隆项目
git clone https://github.com/AIME-JF/Interval-timer.git
cd Interval-timer

# 安装依赖
npm install

# 启动应用
npm start
```

### 打包发布

```bash
# 打包 Windows 安装程序
npm run build
```

## 📂 项目结构

```
间隔时钟/
├── main.js              # Electron 主进程
├── preload.js           # 预加载脚本（IPC 桥接）
├── package.json         # 项目配置
├── src/
│   ├── index.html       # 主界面 HTML
│   ├── js/
│   │   ├── app.js       # 应用主逻辑（状态机 + UI）
│   │   ├── config.js    # 配置管理（加载/保存/记录）
│   │   └── timer.js     # 精确倒计时引擎
│   └── styles/
│       └── main.css     # 护眼深色主题样式
└── build/
    └── icon.png         # 应用图标
```

## ⚙️ 设置说明

点击标题栏 ⚙ 按钮打开设置面板：

| 设置项 | 说明 |
|--------|------|
| 间隔时间 | 两种药水之间的等待时间（1-15 分钟） |
| 眼药水名称 | 支持添加、删除、重命名、上下排序 |
| 提示音 | 倒计时结束时的提示音开关 |
| 重置今日记录 | 清零今日用药计数 |

## ⌨️ 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+Space` | 全局快捷键：开始/确认滴药 |
| `Space` | 窗口内快速操作 |
| `Esc` | 关闭设置 / 暂停计时 |
| `Ctrl+Shift+T` | 显示/隐藏窗口 |

## 🛠️ 技术栈

- **[Electron](https://www.electronjs.org/)** — 跨平台桌面应用框架
- **原生 HTML/CSS/JS** — 无前端框架依赖，轻量高效
- **Web Audio API** — 程序化生成提示音，无需音频文件
- **requestAnimationFrame** — 流畅的倒计时动画

## 📄 开源协议

本项目基于 [MIT License](LICENSE) 开源。

---

<a id="english"></a>

# 💧 Interval Clock — Post-Surgery Eye Drop Timer

[中文](#) | English

> A desktop floating timer designed for post-ophthalmic-surgery medication, helping you precisely manage the intervals between multiple eye drops.

---

## ✨ Features

- 🕐 **Precise Interval Timing** — Uses `Date.now()` delta calculation to avoid `setInterval` drift
- 💊 **Multi-Medicine Management** — Add, remove, rename, and reorder multiple eye drops
- 🔄 **Automatic State Flow** — Idle → Waiting → Countdown → Alert → Next drop, fully guided
- 📌 **Desktop Floating Window** — Compact always-on-top window that won't block your work
- 🔔 **Multi-Channel Alerts** — Sound + system notification + taskbar flash
- 📊 **Daily Tracking** — Automatically tracks daily sessions, resets on new day
- ⌨️ **Keyboard Shortcuts** — `Ctrl+Space` for quick confirm, `Space` for fast action
- 🎨 **Eye-Friendly Dark Theme** — Low-stimulation dark UI designed for post-surgery eyes
- 🖱️ **System Tray** — Minimize to tray on close

## 🚀 Quick Start

### Requirements

- [Node.js](https://nodejs.org/) 16+
- npm or yarn

### Install & Run

```bash
# Clone the project
git clone https://github.com/AIME-JF/Interval-timer.git
cd Interval-timer

# Install dependencies
npm install

# Start the app
npm start
```

### Build

```bash
# Package for Windows
npm run build
```

## 📂 Project Structure

```
间隔时钟/
├── main.js              # Electron main process
├── preload.js           # Preload script (IPC bridge)
├── package.json         # Project config
├── src/
│   ├── index.html       # Main UI
│   ├── js/
│   │   ├── app.js       # App logic (state machine + UI)
│   │   ├── config.js    # Config management
│   │   └── timer.js     # Precise countdown engine
│   └── styles/
│       └── main.css     # Eye-friendly dark theme
└── build/
    └── icon.png         # App icon
```

## ⚙️ Settings

Click the ⚙ button in the title bar:

| Setting | Description |
|---------|-------------|
| Interval Time | Wait time between drops (1-15 minutes) |
| Eye Drop Names | Add, remove, rename, reorder |
| Notification Sound | Toggle countdown completion sound |
| Reset Today | Clear today's session count |

## ⌨️ Shortcuts

| Shortcut | Function |
|----------|----------|
| `Ctrl+Space` | Global: Start/Confirm drop |
| `Space` | In-window quick action |
| `Esc` | Close settings / Pause timer |
| `Ctrl+Shift+T` | Show/Hide window |

## 🛠️ Tech Stack

- **[Electron](https://www.electronjs.org/)** — Cross-platform desktop framework
- **Vanilla HTML/CSS/JS** — No frontend framework, lightweight
- **Web Audio API** — Programmatic notification sounds
- **requestAnimationFrame** — Smooth countdown animation

## 📄 License

This project is open source under the [MIT License](LICENSE).
