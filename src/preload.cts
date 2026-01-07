const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  loadCV: () => ipcRenderer.invoke('load-cv'),
  saveCV: (content: string) => ipcRenderer.invoke('save-cv', content),
  generatePDF: (content: string, templateName: string, targetDir: string) => 
    ipcRenderer.invoke('generate-pdf', content, templateName, targetDir),
  openPDF: (path: string) => ipcRenderer.invoke('open-pdf', path),
  renderPreview: (content: string, templateName: string) => 
    ipcRenderer.invoke('render-preview', content, templateName),
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  sendLog: (level: string, message: string, data?: any) => 
    ipcRenderer.send('log-from-renderer', { level, message, data })
});