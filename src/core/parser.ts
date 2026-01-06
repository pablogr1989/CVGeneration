import fs from 'node:fs/promises';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';
import { Resume, ResumeSchema } from '../types/resume.js';

/**
 * Clase encargada de transformar el contenido Markdown en datos estructurados.
 * Incluye validación de esquema y transformación de Markdown a HTML.
 */
export class ResumeParser {
  
  async parse(filePath: string): Promise<Resume> {
    console.log(`[Parser] 📂 Intentando leer archivo físico: ${filePath}`);
    try {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      console.log(`[Parser] ✅ Archivo leído con éxito (${fileContent.length} bytes)`);
      return await this.parseRaw(fileContent);
    } catch (error) {
      console.error('[Parser] ❌ Error crítico leyendo el archivo:', error);
      throw new Error('No se pudo leer el archivo Markdown.');
    }
  }

  async parseRaw(content: string): Promise<Resume> {
    console.log('[Parser] ⚙️ Iniciando parseo de contenido raw...');
    
    if (!content || content.trim() === '') {
      throw new Error('El contenido del CV está vacío.');
    }

    try {
      // 1. Extraer el frontmatter (YAML)
      console.log('[Parser] [Paso 1] Ejecutando gray-matter...');
      const { data, content: markdownBody } = matter(content);
      
      // 2. Validar esquema con Zod
      console.log('[Parser] [Paso 2] Validando esquema de datos...');
      const validation = ResumeSchema.safeParse(data);
      
      if (!validation.success) {
        const errorMsg = validation.error.errors
          .map(e => `${e.path.join('.')}: ${e.message}`)
          .join(', ');
        throw new Error(`Error de validación en el YAML: ${errorMsg}`);
      }

      const resume = validation.data;

      // 3. Procesar el Markdown del sumario profesional
      if (resume.basics?.summary) {
        console.log('[Parser] [Paso 3] Procesando Markdown del summary...');
        resume.basics.summary = await this.markdownToHtml(resume.basics.summary);
      }

      // 4. Procesar Markdown en los highlights de la experiencia
      if (resume.work && Array.isArray(resume.work)) {
        console.log(`[Parser] [Paso 4] Procesando ${resume.work.length} puestos de trabajo...`);
        
        for (let i = 0; i < resume.work.length; i++) {
          const job = resume.work[i];
          if (job.highlights && Array.isArray(job.highlights)) {
            job.highlights = await Promise.all(
              job.highlights.map(async (h) => await this.markdownToHtml(h))
            );
          }
        }
      }

      console.log('[Parser] ✅ Parseo y validación completados con éxito.');
      return resume;

    } catch (error: any) {
      console.error('[Parser] ❌ ERROR EN PARSERAW:', error.message);
      throw error;
    }
  }

  private async markdownToHtml(content: string): Promise<string> {
    if (content.trim().startsWith('<p>')) {
      return content.trim();
    }

    try {
      const safeContent = content.replace(/<(\d)/g, '&lt;$1'); 
      const processedContent = await remark()
        .use(html)
        .process(safeContent);
      
      return processedContent.toString().trim();
    } catch (err) {
      console.error('[Parser] Error en markdownToHtml:', err);
      return content;
    }
  }
}