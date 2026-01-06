import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Handlebars from 'handlebars';
import { ResumeParser } from './core/parser.js';
import { PdfEngine } from './infra/pdfEngine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const parser = new ResumeParser();
  const pdfEngine = new PdfEngine();
  
  // Definición de rutas absolutas para evitar ambigüedad
  const dataPath = path.join(__dirname, '../data/cv.md');
  const assetsDir = path.join(__dirname, '../assets');
  const templateDir = path.join(__dirname, '../templates');
  const outputDir = path.join(__dirname, '../output');

  console.log('--- PROYECTO APP PRESUPUESTOS: GENERADOR DE CV ---');

  // 1. Preparar carpeta de salida antes de procesar nada
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 2. Parsear datos del currículum
  const resumeData = await parser.parse(dataPath);

  // 3. Lógica robusta de imagen de perfil
  const extensions = ['jpg', 'jpeg', 'png', 'webp'];
  const foundExtension = extensions.find(ext => 
    fs.existsSync(path.join(assetsDir, `profile.${ext}`))
  );

  let profileImgFilename: string | null = null;
  if (foundExtension) {
    profileImgFilename = `profile.${foundExtension}`;
    // Copiamos la imagen al directorio de salida
    fs.copyFileSync(
      path.join(assetsDir, profileImgFilename), 
      path.join(outputDir, profileImgFilename)
    );
    console.log(`> Imagen detectada y copiada: ${profileImgFilename}`);
  } else {
    console.warn('> Advertencia: No se encontró imagen de perfil en assets/');
  }

  // 4. Copiar estilos CSS (obligatorio para el diseño B2)
  const cssPath = path.join(templateDir, 'styles.css');
  if (fs.existsSync(cssPath)) {
    fs.copyFileSync(cssPath, path.join(outputDir, 'styles.css'));
  } else {
    throw new Error('Archivo styles.css no encontrado en la carpeta de plantillas.');
  }

  // 5. Renderizar HTML con Handlebars
  const source = fs.readFileSync(path.join(templateDir, 'layout.hbs'), 'utf-8');
  const template = Handlebars.compile(source);
  
  // Inyectamos los datos. Nota: profileImg es el nombre del fichero en la carpeta output.
  const html = template({ 
    ...resumeData, 
    profileImg: profileImgFilename 
  });

  const htmlPath = path.join(outputDir, 'cv.html');
  const pdfPath = path.join(outputDir, 'cv.pdf');

  fs.writeFileSync(htmlPath, html);
  console.log('> HTML generado exitosamente.');

  // 6. GENERACIÓN FINAL DEL PDF
  // El motor ahora encontrará cv.html, styles.css y profile.xxx en la misma carpeta
  await pdfEngine.generate(htmlPath, pdfPath);

  console.log('--- PROCESO FINALIZADO CON ÉXITO ---');
  console.log(`Resultado: ${pdfPath}`);
}

main().catch((err) => {
  console.error('Error crítico en el proceso de generación:', err);
  process.exit(1);
});