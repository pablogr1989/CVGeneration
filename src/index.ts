import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Handlebars from 'handlebars';
import { ResumeParser } from './core/parser.js';
import { PdfEngine } from './infra/pdfEngine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function getRenderedHtml(
  markdownContent?: string, 
  templateName: string = 'classic',
  basePath?: string
): Promise<string> {
  const parser = new ResumeParser();
  const root = basePath || path.resolve(__dirname, '..');
  const templatePath = path.join(root, 'templates', templateName);
  
  if (!fs.existsSync(templatePath)) {
    throw new Error(`La plantilla '${templateName}' no existe.`);
  }

  const content = markdownContent || fs.readFileSync(path.join(root, 'data/cv.md'), 'utf-8');
  const resumeData = await parser.parseRaw(content);
  
  const fullName = resumeData.basics.name || "";
  const nameParts = fullName.split(" ");
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ") || "";

  const assetsDir = path.join(root, 'assets');
  const extensions = ['png', 'jpg', 'jpeg', 'webp'];
  const found = extensions.find(ext => fs.existsSync(path.join(assetsDir, `profile.${ext}`)));
  const profileImg = found ? `profile.${found}` : null;

  const source = fs.readFileSync(path.join(templatePath, 'layout.hbs'), 'utf-8');
  const template = Handlebars.compile(source);
  
  return template({ 
    ...resumeData, 
    firstName, 
    lastName,
    profileImg, 
    templateName,
    isPreview: true 
  });
}

export async function runGeneration(
  markdownContent?: string, 
  templateName: string = 'classic',
  basePath?: string
): Promise<string> {
  const pdfEngine = new PdfEngine();
  const root = basePath || path.resolve(__dirname, '..');
  
  const outputDir = path.join(root, 'output');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const html = await getRenderedHtml(markdownContent, templateName, root);
  const htmlPath = path.join(outputDir, 'cv.html');
  const pdfPath = path.join(outputDir, 'cv.pdf');

  const assetsDir = path.join(root, 'assets');
  const extensions = ['png', 'jpg', 'jpeg', 'webp'];
  const found = extensions.find(ext => fs.existsSync(path.join(assetsDir, `profile.${ext}`)));
  if (found) {
    fs.copyFileSync(path.join(assetsDir, `profile.${found}`), path.join(outputDir, `profile.${found}`));
  }

  const cssSource = path.join(root, 'templates', templateName, 'styles.css');
  if (fs.existsSync(cssSource)) {
    fs.copyFileSync(cssSource, path.join(outputDir, 'styles.css'));
  }
  
  fs.writeFileSync(htmlPath, html, 'utf-8');
  
  // CAMBIO: Ahora pasamos root como basePath al engine para que busque Chromium
  await pdfEngine.generate(htmlPath, pdfPath, root);
  return pdfPath;
}