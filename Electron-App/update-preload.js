const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    onDownloadProgress: (callback) => ipcRenderer.on('download-progress', (event, percent, speed) => callback(percent, speed))
});
