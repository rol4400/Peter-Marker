const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    onToggleDrawing: (callback) => ipcRenderer.on('toggle-drawing', callback),
    onClearCanvas: (callback) => ipcRenderer.on('clear-canvas', callback),
    onDisplayChanged: (callback) => ipcRenderer.on('display-changed', callback),
    onDownloadProgress: (callback) => ipcRenderer.on('download-progress', (event, percent) => callback(percent)),
    setIgnoreMouseEvents: (ignore) => ipcRenderer.send('set-ignore-mouse-events', ignore),
    closeDrawing: () => ipcRenderer.send('close-drawing'),
    openDrawing: () => ipcRenderer.send('open-drawing'),
    toggleDrawing: () => ipcRenderer.send('toggle-drawing'),
    forwardKey: (keyCode) => ipcRenderer.send('forward-key', keyCode)
});
