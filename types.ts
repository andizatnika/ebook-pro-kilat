
export enum AppStep {
  DASHBOARD = 'DASHBOARD',
  SETUP = 'SETUP',
  OUTLINE = 'OUTLINE',
  GENERATING = 'GENERATING',
  COMPLETED = 'COMPLETED'
}

export type SectionType = 'front' | 'body' | 'back';

export type LanguageCode = 'id' | 'en-US' | 'en-UK' | 'ja' | 'ko' | 'zh' | 'es' | 'fr' | 'de' | 'ar';

export interface EbookConfig {
  topic: string;
  chapterCount: number;
  targetAudience: string;
  tone: string;
  goal: string;
  language: LanguageCode;
}

export interface Chapter {
  id: string;
  title: string;
  sectionType: SectionType;
  subpoints: string[];
  status: 'pending' | 'generating' | 'completed' | 'error';
  content?: string;
}

export interface EbookData {
  id?: string; // Supabase UUID
  title: string;
  subtitle: string;
  outline: Chapter[];
  lastUpdated?: string;
}

export interface GenerationState {
  isGenerating: boolean;
  currentTask: string;
  progress: number;
  logs: string[];
}

export interface UserSettings {
  username: string;
  email: string;
  language: LanguageCode;
}

// Map: promptString -> base64Image
export type ImageRegistry = Record<string, string>;
