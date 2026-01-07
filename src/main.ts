import { app, BrowserWindow, ipcMain, shell, dialog } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runGeneration, getRenderedHtml } from './index.js';
import { Logger } from './core/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = !app.isPackaged;
const externalPath = isDev ? path.resolve(__dirname, '..') : process.resourcesPath;
const appPath = isDev ? path.resolve(__dirname, '..') : path.resolve(__dirname, '..');

const logger = new Logger(externalPath);
logger.info('=== INICIO DE APLICACIÓN ===');

const cvPath = path.join(externalPath, 'data', 'cv.md');

process.on('uncaughtException', (err) => {
  logger.error('CRITICAL: Uncaught Exception en Main', { message: err.message, stack: err.stack });
});

function ensureDataFile() {
  try {
    const dataDir = path.dirname(cvPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    if (!fs.existsSync(cvPath)) {
      const defaultContent = `---\nbasics:\n  name: "Edita tu nombre"\n---\n# CV`;
      fs.writeFileSync(cvPath, defaultContent, 'utf-8');
    }
  } catch (err: any) {
    logger.error('Error en ensureDataFile', err.message);
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
    title: "CV Generation"
  });

  const htmlPath = path.join(appPath, 'src', 'renderer', 'index.html');
  win.loadFile(htmlPath).catch(err => {
    logger.error('Error al ejecutar win.loadFile', err.message);
  });
}

ipcMain.on('log-from-renderer', (event, { level, message, data }) => {
  if (level === 'ERROR') logger.error(`[Renderer] ${message}`, data);
  else logger.info(`[Renderer] ${message}`, data);
});

ipcMain.handle('load-cv', () => fs.readFileSync(cvPath, 'utf-8'));
ipcMain.handle('save-cv', (_, content) => fs.writeFileSync(cvPath, content, 'utf-8'));

// Nuevo: Manejador para seleccionar carpeta de destino
ipcMain.handle('select-directory', async () => {
  const result = await dialog.showOpenDialog({
    title: 'Selecciona la carpeta donde guardar el CV',
    properties: ['openDirectory', 'createDirectory']
  });
  if (result.canceled) return null;
  return result.filePaths[0];
});

// Actualizado: Ahora acepta targetDir
ipcMain.handle('generate-pdf', (_, content, templateName, targetDir) => {
  return runGeneration(content, templateName, externalPath, targetDir);
});

ipcMain.handle('open-pdf', async (_, p) => {
  logger.info('Solicitud de apertura de PDF:', p);
  if (!p || !fs.existsSync(p)) {
    const errorMsg = `La ruta no es válida o el archivo no existe: ${p}`;
    logger.error(errorMsg);
    return errorMsg;
  }
  try {
    const result = await shell.openPath(p);
    return result || '';
  } catch (err: any) {
    logger.error('Excepción al intentar abrir el PDF:', err.message);
    return err.message;
  }
});

ipcMain.handle('render-preview', async (_, content, templateName) => {
  try {
    return { success: true, html: await getRenderedHtml(content, templateName, externalPath) };
  } catch (err: any) {
    logger.error('Error en render-preview', err.message);
    return { success: false, error: err.message };
  }
});

app.whenReady().then(() => {
  ensureDataFile();
  createWindow();
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });