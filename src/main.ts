import { app, BrowserWindow, ipcMain, shell } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runGeneration, getRenderedHtml } from './index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const cvPath = path.join(projectRoot, 'data', 'cv.md');

function ensureDataFile() {
  const dataDir = path.dirname(cvPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(cvPath)) {
    const defaultContent = `---
basics:
  name: "Tu Nombre Completo"
  label: "Tu Profesión"
  email: "tu@email.com"
  phone: "+34 600 000 000"
  location: "Madrid, España"
  summary: "Escribe aquí tu perfil profesional..."
work: []
education: []
skills: []
languages: []
---
# Tu CV
Empieza a editar aquí.
`;
    fs.writeFileSync(cvPath, defaultContent, 'utf-8');
  }
}

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

ipcMain.handle('load-cv', () => fs.readFileSync(cvPath, 'utf-8'));
ipcMain.handle('save-cv', (_, content) => fs.writeFileSync(cvPath, content, 'utf-8'));
ipcMain.handle('generate-pdf', (_, content, templateName) => runGeneration(content, templateName));
ipcMain.handle('open-pdf', (_, p) => shell.openPath(p));

ipcMain.handle('render-preview', async (_, content, templateName) => {
  try {
    const html = await getRenderedHtml(content, templateName);
    return { success: true, html };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
});

app.whenReady().then(() => {
  ensureDataFile();
  createWindow();
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });