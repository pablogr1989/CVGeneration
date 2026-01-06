export interface Resume {
  basics: {
    name: string;
    label: string;
    email: string;
    phone: string;
    location: string;
    website: string;
    linkedin: string;
    github: string; // Campo añadido
    summary: string;
  };
  work: Array<{
    company: string;
    position: string;
    location: string;
    startDate: string;
    endDate: string;
    summary?: string;
    highlights: string[];
  }>;
  education: Array<{
    institution: string;
    area: string;
    studyType: string;
    startDate: string;
    endDate: string;
    description?: string;
  }>;
  skills: Array<{
    category: string;
    keywords: string[];
  }>;
  languages: Array<{
    language: string;
    fluency: string;
  }>;
}