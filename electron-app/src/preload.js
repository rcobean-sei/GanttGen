// GanttGen Electron - Preload Script
// This script runs in a sandboxed context with limited Node.js access
// It exposes specific APIs to the renderer process via contextBridge

const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    // Palette operations
    getPaletteInfo: () => ipcRenderer.invoke('get-palette-info'),

    // File operations
    validateInputFile: (path) => ipcRenderer.invoke('validate-input-file', path),
    openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
    openDirectoryDialog: () => ipcRenderer.invoke('open-directory-dialog'),

    // Generation
    generateGantt: (options) => ipcRenderer.invoke('generate-gantt', options),
    onGenerationProgress: (callback) => {
        ipcRenderer.on('generation-progress', (event, data) => callback(data));
    },

    // Shell operations
    shellOpen: (path) => ipcRenderer.invoke('shell-open', path),
    getDirname: (path) => ipcRenderer.invoke('get-dirname', path),

    // Manual entry
    createTempJsonFile: (data) => ipcRenderer.invoke('create-temp-json', data)
});
