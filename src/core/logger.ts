import fs from 'node:fs';
import path from 'node:path';

export class Logger {
  private logPath: string;

  constructor(basePath: string) {
    // Creamos una carpeta logs dentro de la carpeta de instalación
    const logsDir = path.join(basePath, 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    this.logPath = path.join(logsDir, 'debug.log');
  }

  info(message: string, data?: any) {
    this.write('INFO', message, data);
  }

  error(message: string, data?: any) {
    this.write('ERROR', message, data);
  }

  private write(level: string, message: string, data?: any) {
    const timestamp = new Date().toISOString();
    let logMessage = `[${timestamp}] [${level}] ${message}`;
    
    if (data) {
      logMessage += ` | Data: ${JSON.stringify(data, null, 2)}`;
    }
    
    logMessage += '\n';
    
    try {
      fs.appendFileSync(this.logPath, logMessage, 'utf-8');
    } catch (err) {
      console.error('No se pudo escribir en el log:', err);
    }
  }
}