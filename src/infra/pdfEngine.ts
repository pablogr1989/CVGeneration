import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';

export class PdfEngine {
  /**
   * Genera un PDF a partir de un archivo HTML.
   * @param inputPath Ruta del HTML de entrada.
   * @param outputPath Ruta donde se guardará el PDF.
   * @param basePath Ruta base de la aplicación para localizar el binario del navegador.
   */
  async generate(inputPath: string, outputPath: string, basePath: string): Promise<void> {
    console.log('[PdfEngine] Iniciando generación de PDF...');
    
    // Localizamos el ejecutable de Chromium dentro de la carpeta bin
    // Playwright guarda el binario en una estructura profunda: bin/playwright/chromium-XXXX/chrome-win/chrome.exe
    const playwrightBinPath = path.join(basePath, 'bin', 'playwright');
    
    // Buscamos recursivamente el chrome.exe en la carpeta bin
    const executablePath = this.findChromiumExecutable(playwrightBinPath);

    console.log(`[PdfEngine] Usando ejecutable: ${executablePath || 'Bundled por sistema'}`);

    const browser = await chromium.launch({
      executablePath: executablePath || undefined, // Si no lo encuentra, intenta usar el del sistema como fallback
      headless: true
    });

    try {
      const page = await browser.newPage();
      
      // Cargamos el archivo HTML local
      const fileUrl = `file://${path.resolve(inputPath).replace(/\\/g, '/')}`;
      await page.goto(fileUrl, { waitUntil: 'networkidle' });

      // Generamos el PDF con configuración profesional (A4)
      await page.pdf({
        path: outputPath,
        format: 'A4',
        printBackground: true,
        margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' }
      });

      console.log(`[PdfEngine] ✅ PDF generado con éxito en: ${outputPath}`);
    } catch (error) {
      console.error('[PdfEngine] ❌ Error generando PDF:', error);
      throw error;
    } finally {
      await browser.close();
    }
  }

  /**
   * Busca el ejecutable de chrome de forma recursiva en la carpeta proporcionada.
   */
  private findChromiumExecutable(dir: string): string | null {
    if (!fs.existsSync(dir)) return null;

    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        const found = this.findChromiumExecutable(fullPath);
        if (found) return found;
      } else if (file === 'chrome.exe' || (process.platform !== 'win32' && file === 'chromium')) {
        return fullPath;
      }
    }
    return null;
  }
}