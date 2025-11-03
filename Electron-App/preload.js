const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    onToggleDrawing: (callback) => ipcRenderer.on('toggle-drawing', callback),
    onClearCanvas: (callback) => ipcRenderer.on('clear-canvas', callback),
    onDisplayChanged: (callback) => ipcRenderer.on('display-changed', callback),
    setIgnoreMouseEvents: (ignore) => ipcRenderer.send('set-ignore-mouse-events', ignore),
    closeDrawing: () => ipcRenderer.send('close-drawing'),
    openDrawing: () => ipcRenderer.send('open-drawing'),
    forwardKey: (keyCode) => ipcRenderer.send('forward-key', keyCode)
});
