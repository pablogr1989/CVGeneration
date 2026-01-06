import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Handlebars from 'handlebars';
import { ResumeParser } from './core/parser.js';
import { PdfEngine } from './infra/pdfEngine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

export async function getRenderedHtml(markdownContent?: string): Promise<string> {
  const parser = new ResumeParser();
  const templateDir = path.join(projectRoot, 'templates');
  
  // Leemos el contenido: o del editor o del archivo físico
  const content = markdownContent || fs.readFileSync(path.join(projectRoot, 'data/cv.md'), 'utf-8');
  const resumeData = await parser.parseRaw(content);
  
  // Dividimos el nombre (Pablo | Gómez Ramírez)
  const fullName = resumeData.basics.name || "";
  const nameParts = fullName.split(" ");
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ") || "";

  // Detección de imagen
  const assetsDir = path.join(projectRoot, 'assets');
  const extensions = ['png', 'jpg', 'jpeg', 'webp'];
  const found = extensions.find(ext => fs.existsSync(path.join(assetsDir, `profile.${ext}`)));
  const profileImg = found ? `profile.${found}` : null;

  const source = fs.readFileSync(path.join(templateDir, 'layout.hbs'), 'utf-8');
  const template = Handlebars.compile(source);
  
  return template({ 
    ...resumeData, 
    firstName, 
    lastName,
    profileImg, 
    isPreview: true 
  });
}

export async function runGeneration(): Promise<string> {
  const pdfEngine = new PdfEngine();
  const outputDir = path.join(projectRoot, 'output');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const html = await getRenderedHtml();
  const htmlPath = path.join(outputDir, 'cv.html');
  const pdfPath = path.join(outputDir, 'cv.pdf');

  // Copia de activos necesarios
  const assetsDir = path.join(projectRoot, 'assets');
  const extensions = ['png', 'jpg', 'jpeg', 'webp'];
  const found = extensions.find(ext => fs.existsSync(path.join(assetsDir, `profile.${ext}`)));
  if (found) {
    fs.copyFileSync(path.join(assetsDir, `profile.${found}`), path.join(outputDir, `profile.${found}`));
  }

  fs.copyFileSync(path.join(projectRoot, 'templates/styles.css'), path.join(outputDir, 'styles.css'));
  fs.writeFileSync(htmlPath, html, 'utf-8');
  
  await pdfEngine.generate(htmlPath, pdfPath);
  return pdfPath;
}