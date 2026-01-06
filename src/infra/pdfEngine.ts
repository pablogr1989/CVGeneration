import { chromium } from 'playwright';
import path from 'node:path';

/**
 * Clase encargada de la renderización de HTML a PDF usando Playwright.
 */
export class PdfEngine {
  /**
   * Genera un archivo PDF a partir de un archivo HTML local.
   * @param htmlPath Ruta absoluta al archivo HTML de entrada.
   * @param pdfPath Ruta absoluta donde se guardará el PDF.
   */
  async generate(htmlPath: string, pdfPath: string): Promise<void> {
    console.log('--- Iniciando motor de renderizado PDF ---');
    
    // 1. Lanzar el navegador (Chromium)
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      // 2. Cargar el archivo HTML generado
      // Usamos la URL del sistema de archivos (file://)
      const fileUrl = `file://${htmlPath}`;
      await page.goto(fileUrl, { waitUntil: 'networkidle' });

      // 3. Generar el PDF
      // Configuraciones clave para alta fidelidad:
      await page.pdf({
        path: pdfPath,
        format: 'A4',
        printBackground: true, // Crucial para que se vean los colores de fondo (sidebar)
        preferCSSPageSize: true, // Respeta el tamaño definido en el CSS (@page)
        margin: {
          top: '0px',
          right: '0px',
          bottom: '0px',
          left: '0px'
        }
      });

      console.log(`--- PDF creado exitosamente en: ${pdfPath} ---`);
    } catch (error) {
      console.error('Error durante la generación del PDF:', error);
      throw error;
    } finally {
      // 4. Cerrar el navegador pase lo que pase
      await browser.close();
    }
  }
}