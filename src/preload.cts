const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  loadCV: () => ipcRenderer.invoke('load-cv'),
  saveCV: (content: string) => ipcRenderer.invoke('save-cv', content),
  generatePDF: () => ipcRenderer.invoke('generate-pdf'),
  openPDF: (path: string) => ipcRenderer.invoke('open-pdf', path),
  renderPreview: (content: string) => ipcRenderer.invoke('render-preview', content)
});