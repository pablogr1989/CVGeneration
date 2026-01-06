import { z } from 'zod';

export const ResumeSchema = z.object({
  basics: z.object({
    name: z.string().min(1, "El nombre es obligatorio"),
    label: z.string().min(1, "El puesto/título es obligatorio"),
    email: z.string().email("Formato de email inválido"),
    phone: z.string().min(1, "El teléfono es obligatorio"),
    location: z.string().min(1, "La ubicación es obligatoria"),
    website: z.string().url().or(z.string().optional()),
    linkedin: z.string().optional(),
    github: z.string().optional(),
    summary: z.string().min(1, "El perfil profesional es obligatorio"),
  }),
  work: z.array(z.object({
    company: z.string(),
    position: z.string(),
    location: z.string(),
    startDate: z.string(),
    endDate: z.string(),
    summary: z.string().optional(),
    highlights: z.array(z.string())
  })),
  education: z.array(z.object({
    institution: z.string(),
    area: z.string(),
    studyType: z.string(),
    startDate: z.string(),
    endDate: z.string(),
    description: z.string().optional()
  })),
  skills: z.array(z.object({
    category: z.string(),
    keywords: z.array(z.string())
  })),
  languages: z.array(z.object({
    language: z.string(),
    fluency: z.string()
  }))
});

export type Resume = z.infer<typeof ResumeSchema>;