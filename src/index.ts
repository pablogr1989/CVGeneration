import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Handlebars from 'handlebars';
import { ResumeParser } from './core/parser.js';
import { PdfEngine } from './infra/pdfEngine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

export async function getRenderedHtml(markdownContent?: string, templateName: string = 'classic'): Promise<string> {
  const parser = new ResumeParser();
  // Buscamos en la carpeta específica de la plantilla
  const templatePath = path.join(projectRoot, 'templates', templateName);
  
  if (!fs.existsSync(templatePath)) {
    throw new Error(`La plantilla '${templateName}' no existe en la carpeta templates.`);
  }

  const content = markdownContent || fs.readFileSync(path.join(projectRoot, 'data/cv.md'), 'utf-8');
  const resumeData = await parser.parseRaw(content);
  
  const fullName = resumeData.basics.name || "";
  const nameParts = fullName.split(" ");
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ") || "";

  const assetsDir = path.join(projectRoot, 'assets');
  const extensions = ['png', 'jpg', 'jpeg', 'webp'];
  const found = extensions.find(ext => fs.existsSync(path.join(assetsDir, `profile.${ext}`)));
  const profileImg = found ? `profile.${found}` : null;

  // Carga del layout específico de la plantilla
  const source = fs.readFileSync(path.join(templatePath, 'layout.hbs'), 'utf-8');
  const template = Handlebars.compile(source);
  
  return template({ 
    ...resumeData, 
    firstName, 
    lastName,
    profileImg, 
    templateName, // Pasamos el nombre para posibles usos en el HBS
    isPreview: true 
  });
}

export async function runGeneration(markdownContent?: string, templateName: string = 'classic'): Promise<string> {
  const pdfEngine = new PdfEngine();
  const outputDir = path.join(projectRoot, 'output');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const html = await getRenderedHtml(markdownContent, templateName);
  const htmlPath = path.join(outputDir, 'cv.html');
  const pdfPath = path.join(outputDir, 'cv.pdf');

  const assetsDir = path.join(projectRoot, 'assets');
  const extensions = ['png', 'jpg', 'jpeg', 'webp'];
  const found = extensions.find(ext => fs.existsSync(path.join(assetsDir, `profile.${ext}`)));
  if (found) {
    fs.copyFileSync(path.join(assetsDir, `profile.${found}`), path.join(outputDir, `profile.${found}`));
  }

  // Copiamos el CSS específico de la plantilla elegida al output
  const cssSource = path.join(projectRoot, 'templates', templateName, 'styles.css');
  if (fs.existsSync(cssSource)) {
    fs.copyFileSync(cssSource, path.join(outputDir, 'styles.css'));
  }
  
  fs.writeFileSync(htmlPath, html, 'utf-8');
  
  await pdfEngine.generate(htmlPath, pdfPath);
  return pdfPath;
}