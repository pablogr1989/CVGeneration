import { chromium } from 'playwright';
import path from 'node:path';

export class PdfEngine {
  async generate(htmlPath: string, pdfPath: string): Promise<void> {
    const browser = await chromium.launch({ headless: true });
    try {
      const page = await browser.newPage();
      
      // CONVERSIÓN CRÍTICA PARA WINDOWS: file:///C:/ruta/archivo.html
      const absolutePath = path.resolve(htmlPath).replace(/\\/g, '/');
      const fileUrl = `file:///${absolutePath}`;
      
      console.log(`[PDF] Cargando URL: ${fileUrl}`);
      
      await page.goto(fileUrl, { waitUntil: 'networkidle' });

      await page.pdf({
        path: pdfPath,
        format: 'A4',
        printBackground: true,
        preferCSSPageSize: true,
        margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' }
      });
    } finally {
      await browser.close();
    }
  }
}