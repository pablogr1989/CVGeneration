import { app, BrowserWindow, ipcMain, shell } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runGeneration, getRenderedHtml } from './index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const cvPath = path.join(projectRoot, 'data', 'cv.md');

function createWindow() {
  const win = new BrowserWindow({
    width: 1400, height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false
    },
    title: "CV Generator"
  });
  win.loadFile(path.join(projectRoot, 'src/renderer/index.html'));
}

// Forzamos lectura en UTF-8 siempre
ipcMain.handle('load-cv', () => fs.readFileSync(cvPath, 'utf-8'));
ipcMain.handle('save-cv', (_, content) => fs.writeFileSync(cvPath, content, 'utf-8'));
ipcMain.handle('generate-pdf', () => runGeneration());
ipcMain.handle('open-pdf', (_, p) => shell.openPath(p));

ipcMain.handle('render-preview', async (_, content) => {
  try {
    const html = await getRenderedHtml(content);
    return { success: true, html };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
});

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });