import fs from 'node:fs/promises';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';
import { Resume } from '../types/resume.js';

/**
 * Clase encargada de transformar el contenido Markdown en datos estructurados.
 * Incluye trazabilidad completa para depuración de errores intermitentes.
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
      console.warn('[Parser] ⚠️ El contenido recibido está vacío.');
    }

    try {
      // 1. Extraer el frontmatter (YAML)
      console.log('[Parser] [Paso 1] Ejecutando gray-matter...');
      const { data, content: markdownBody } = matter(content);
      
      console.log('[Parser] [Paso 1] Datos YAML extraídos:', JSON.stringify(data, null, 2));

      // Cast a nuestra interfaz
      const resume = data as Resume;

      // 2. Procesar el Markdown del sumario profesional
      if (resume.basics?.summary) {
        console.log('[Parser] [Paso 2] Detectado summary. Procesando Markdown...');
        const originalSummary = resume.basics.summary;
        resume.basics.summary = await this.markdownToHtml(originalSummary);
        console.log(`[Parser] [Paso 2] Summary transformado: "${resume.basics.summary.substring(0, 50)}..."`);
      } else {
        console.warn('[Parser] [Paso 2] No se encontró el campo basics.summary o está vacío.');
      }

      // 3. Procesar Markdown en los highlights de la experiencia
      if (resume.work && Array.isArray(resume.work)) {
        console.log(`[Parser] [Paso 3] Procesando ${resume.work.length} puestos de trabajo...`);
        
        for (let i = 0; i < resume.work.length; i++) {
          const job = resume.work[i];
          console.log(`[Parser] [Paso 3.${i}] Empresa: ${job.company || 'Desconocida'}`);
          
          if (job.highlights && Array.isArray(job.highlights)) {
            console.log(`[Parser] [Paso 3.${i}] Procesando ${job.highlights.length} highlights...`);
            
            job.highlights = await Promise.all(
              job.highlights.map(async (h, idx) => {
                const processed = await this.markdownToHtml(h);
                // Log para detectar si un highlight sale vacío de repente
                if (!processed) console.error(`[Parser] ‼️ Highlight ${idx} en ${job.company} quedó vacío tras procesar.`);
                return processed;
              })
            );
          } else {
            console.log(`[Parser] [Paso 3.${i}] No hay highlights para esta empresa.`);
          }
        }
      } else {
        console.warn('[Parser] [Paso 3] No se encontró la sección "work" o no es un array.');
      }

      console.log('[Parser] ✅ Parseo completado con éxito.');
      return resume;

    } catch (error: any) {
      console.error('[Parser] ❌ ERROR EN PARSERAW:', error);
      // Imprimimos el stack trace para saber la línea exacta del fallo
      console.error('[Parser] Stack Trace:', error.stack);
      throw new Error(`Error en el formato YAML: ${error.message}`);
    }
  }

  private async markdownToHtml(content: string): Promise<string> {
    // 1. Si el contenido ya parece HTML (empieza por <p>), no lo procesamos
    if (content.trim().startsWith('<p>')) {
      console.log('[Parser] ℹ️ El contenido ya es HTML, omitiendo procesado.');
      return content.trim();
    }

    try {
      // 2. Limpieza de caracteres y escape de símbolos críticos
      const safeContent = content.replace(/<(\d)/g, '&lt;$1'); 
      
      const processedContent = await remark()
        .use(html)
        .process(safeContent);
      
      const result = processedContent.toString().trim();
      
      if (!result && content.length > 0) {
        console.error('[Parser] ❌ Remark falló devolviendo vacío. Retornando texto original.');
        return content; // No devolvemos vacío para no perder info
      }
      
      return result;
    } catch (err) {
      console.error('[Parser] Error en markdownToHtml:', err);
      return content;
    }
  }
}