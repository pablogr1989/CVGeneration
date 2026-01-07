# CV Generation

**CV Generation** es una aplicación de escritorio avanzada diseñada para transformar currículums escritos en formato Markdown (con metadatos en YAML) en documentos PDF de alta fidelidad profesional. La herramienta utiliza una interfaz moderna construida con Electron y un motor de renderizado basado en Playwright para garantizar resultados precisos y elegantes.

## 🚀 Características Principales

- **Edición Basada en Datos:** Separación clara entre contenido (Markdown/YAML) y presentación (Handlebars/CSS).
- **Validación Estricta:** Implementación de esquemas con Zod para asegurar que los datos del CV cumplan con los requisitos necesarios antes de la generación.
- **Motor de Renderizado Profesional:** Uso de Playwright (Chromium) para generar archivos PDF en formato A4 con soporte completo para estilos CSS complejos.
- **Previsualización en Tiempo Real:** Capacidad de visualizar los cambios en el diseño antes de exportar el documento final.
- **Arquitectura Limpia:** Código organizado en capas (Core, Infra, Types, Renderer) para facilitar la mantenibilidad y escalabilidad.
- **Exportación Organizada**: Al generar un PDF, el sistema solicita una ubicación y crea automáticamente una subcarpeta con marca de tiempo (`CV_DD-MM-AAAA_HH-mm`), manteniendo un historial ordenado de tus versiones.

## 🛠️ Stack Tecnológico

- **Runtime:** Node.js & Electron  
- **Lenguaje:** TypeScript (tipado estricto para mayor seguridad)  
- **Procesamiento de Texto:** Remark & Gray-matter  
- **Plantillas:** Handlebars  
- **Generación de PDF:** Playwright  
- **Validación de Datos:** Zod  

## 📂 Estructura del Proyecto

```text
├── assets/               # Recursos estáticos (imágenes, logos)
├── bin/                  # Binarios de Playwright (autocontenidos)
├── data/                 # Almacenamiento del archivo cv.md
├── src/
│   ├── core/             # Lógica de negocio (Parser, Logger)
│   ├── infra/            # Adaptadores de infraestructura (Motor PDF)
│   ├── renderer/         # Interfaz de usuario (HTML/JS de Electron)
│   ├── types/            # Definiciones de tipos y esquemas Zod
│   ├── index.ts          # Punto de entrada de la lógica de generación
│   ├── main.ts           # Proceso principal de Electron
│   └── preload.cts       # Script de puente (Bridge) para IPC
├── templates/            # Plantillas Handlebars (Classic, Modern)
└── package.json          # Configuración y dependencias
```

## ⚙️ Instalación y Configuración

```bash
npm install
```

Instalar el runtime de Playwright:

```bash
npm run install-runtime
```

## 🛠️ Scripts de Desarrollo

- `npm run dev` – Inicia el entorno de desarrollo con tsx en modo watch  
- `npm run electron:dev` – Compila el código TypeScript y lanza la aplicación Electron  
- `npm run build` – Compila el proyecto usando el compilador de TypeScript (tsc)  
- `npm run start` – Lanza la aplicación Electron ya compilada  
- `npm run dist` – Empaqueta la aplicación para distribución (Windows/NSIS)  

## 📝 Formato del CV (Markdown + YAML)

```yaml
---
basics:
  name: "Tu Nombre"
  label: "Puesto Profesional"
  email: "correo@ejemplo.com"
  phone: "+34 600 000 000"
  location: "Ciudad, País"
  summary: "Breve descripción profesional en **Markdown**."
work:
  - company: "Empresa"
    position: "Senior Dev"
    startDate: "2020"
    endDate: "Actual"
    highlights:
      - "Logro 1 en **Markdown**"
---
# Contenido adicional opcional
```

## 🎨 Sistema de Plantillas

El proyecto soporta múltiples diseños mediante plantillas Handlebars (`.hbs`) y archivos CSS.

- **Classic:** Diseño sobrio con barra lateral  
- **Modern:** Diseño contemporáneo configurable en `templates/`

## 🔒 Seguridad y Robustez

- **Context Isolation:** `contextIsolation: true` y `nodeIntegration: false`
- **Manejo de Errores:** Sistema de logging detallado
- **Validación de Esquema:** Errores detectados inmediatamente por Zod

---

**Autor:** Pablo Gómez Ramírez  
**Licencia:** MIT
