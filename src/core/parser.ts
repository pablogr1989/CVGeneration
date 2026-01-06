import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';
import { Resume } from '../types/resume.js';

/**
 * Clase encargada de transformar el archivo Markdown en datos estructurados.
 */
export class ResumeParser {
  /**
   * Lee el archivo Markdown y lo convierte en un objeto Resume.
   * @param filePath Ruta al archivo cv.md
   */
  async parse(filePath: string): Promise<Resume> {
    try {
      // 1. Leer el contenido del archivo
      const fileContent = await fs.readFile(filePath, 'utf-8');

      // 2. Extraer el frontmatter (YAML) y el contenido
      const { data } = matter(fileContent);

      // Cast de los datos brutos a nuestra interfaz Resume
      const resume = data as Resume;

      // 3. Procesar el Markdown del sumario profesional (si existe)
      if (resume.basics?.summary) {
        resume.basics.summary = await this.markdownToHtml(resume.basics.summary);
      }

      // 4. Opcional: Procesar Markdown en los highlights de la experiencia
      if (resume.work) {
        for (const job of resume.work) {
          if (job.highlights) {
            job.highlights = await Promise.all(
              job.highlights.map(h => this.markdownToHtml(h))
            );
          }
        }
      }

      return resume;
    } catch (error) {
      console.error('Error parseando el archivo CV:', error);
      throw new Error('No se pudo procesar el archivo Markdown. Revisa el formato YAML.');
    }
  }

  /**
   * Utilidad para convertir pequeños fragmentos de Markdown a HTML.
   */
  private async markdownToHtml(content: string): Promise<string> {
    const processedContent = await remark()
      .use(html)
      .process(content);
    
    // El resultado suele venir envuelto en <p>, lo limpiamos para evitar saltos de línea extra
    return processedContent.toString().trim();
  }
}