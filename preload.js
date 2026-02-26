const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    loadConfig: () => ipcRenderer.invoke('load-config'),
    saveConfig: (config) => ipcRenderer.invoke('save-config', config),
    resizeWindow: (width, height) => ipcRenderer.invoke('resize-window', width, height),
    minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
    toggleAlwaysOnTop: () => ipcRenderer.invoke('toggle-always-on-top'),
    getAlwaysOnTop: () => ipcRenderer.invoke('get-always-on-top'),
    flashWindow: () => ipcRenderer.invoke('flash-window'),
    onShortcut: (callback) => ipcRenderer.on('shortcut', (event, action) => callback(action))
});
