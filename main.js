const { app, BrowserWindow, globalShortcut, ipcMain, Tray, Menu, nativeImage, screen } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow = null;
let tray = null;
let isQuitting = false;

// 配置文件路径
const configPath = path.join(app.getPath('userData'), 'config.json');
const defaultConfig = {
  medicines: ['玻璃酸钠滴眼液', '氯替泼诺混悬滴眼液', '聚乙二醇滴眼液', '环孢素滴眼液'],
  intervalMinutes: 5,
  dailySessions: 4,
  soundEnabled: true,
  todayRecord: { date: '', completedSessions: 0 },
  windowPosition: null
};

function loadConfig() {
  try {
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, 'utf-8');
      return { ...defaultConfig, ...JSON.parse(data) };
    }
  } catch (e) {
    console.error('读取配置失败:', e);
  }
  return { ...defaultConfig };
}

function saveConfig(config) {
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
  } catch (e) {
    console.error('保存配置失败:', e);
  }
}

function createWindow() {
  const config = loadConfig();
  const display = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = display.workAreaSize;

  // 默认位置：屏幕右下角
  const defaultX = screenWidth - 300;
  const defaultY = screenHeight - 220;

  const pos = config.windowPosition || { x: defaultX, y: defaultY };

  mainWindow = new BrowserWindow({
    width: 280,
    height: 200,
    x: pos.x,
    y: pos.y,
    alwaysOnTop: true,
    frame: false,
    transparent: true,
    resizable: false,
    skipTaskbar: false,
    show: false,
    icon: path.join(__dirname, 'build', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // 记忆窗口位置
  mainWindow.on('moved', () => {
    if (mainWindow) {
      const bounds = mainWindow.getBounds();
      const config = loadConfig();
      config.windowPosition = { x: bounds.x, y: bounds.y };
      saveConfig(config);
    }
  });

  // 点击关闭时最小化到托盘
  mainWindow.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });
}

function createTray() {
  tray = new Tray(nativeImage.createFromDataURL(createTrayIconDataURL()));

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示/隐藏窗口',
      click: () => {
        if (mainWindow.isVisible()) {
          mainWindow.hide();
        } else {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setToolTip('间隔时钟 - 滴眼药计时器');
  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

function createTrayIconDataURL() {
  // 生成一个 16x16 的绿色圆形图标作为托盘图标
  const size = 16;
  const canvas = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <circle cx="8" cy="8" r="7" fill="#7fdbca" stroke="#1a1a2e" stroke-width="1"/>
    <text x="8" y="11" text-anchor="middle" font-size="8" font-weight="bold" fill="#1a1a2e">⏱</text>
  </svg>`;
  const base64 = Buffer.from(canvas).toString('base64');
  return `data:image/svg+xml;base64,${base64}`;
}

function registerShortcuts() {
  // Ctrl+Space: 确认已滴药
  globalShortcut.register('CommandOrControl+Space', () => {
    if (mainWindow) {
      mainWindow.webContents.send('shortcut', 'confirm');
      if (!mainWindow.isVisible()) {
        mainWindow.show();
      }
    }
  });

  // Ctrl+Shift+T: 显示/隐藏窗口
  globalShortcut.register('CommandOrControl+Shift+T', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });
}

// IPC 处理
ipcMain.handle('load-config', () => {
  return loadConfig();
});

ipcMain.handle('save-config', (event, config) => {
  saveConfig(config);
  return true;
});

ipcMain.handle('resize-window', (event, width, height) => {
  if (mainWindow) {
    mainWindow.setSize(width, height, true);
  }
});

ipcMain.handle('minimize-window', () => {
  if (mainWindow) {
    mainWindow.hide();
  }
});

ipcMain.handle('toggle-always-on-top', () => {
  if (mainWindow) {
    const current = mainWindow.isAlwaysOnTop();
    mainWindow.setAlwaysOnTop(!current);
    return !current;
  }
  return true;
});

ipcMain.handle('get-always-on-top', () => {
  if (mainWindow) {
    return mainWindow.isAlwaysOnTop();
  }
  return true;
});

ipcMain.handle('flash-window', () => {
  if (mainWindow) {
    mainWindow.flashFrame(true);
    setTimeout(() => mainWindow.flashFrame(false), 3000);
  }
});

app.whenReady().then(() => {
  createWindow();
  createTray();
  registerShortcuts();
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
