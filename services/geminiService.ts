import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { SYSTEM_PERSONA, OUTLINE_PROMPT_TEMPLATE, SECTION_PROMPT_TEMPLATE } from '../constants';
import { EbookConfig, Chapter, SectionType } from '../types';

const MODEL_NAME = 'gemini-3-flash-preview';

// Backend API endpoints
const API_BASE = import.meta.env.PROD ? '' : 'http://localhost:3002';
const GENERATE_OUTLINE_ENDPOINT = `${API_BASE}/api/generate-outline`;
const GENERATE_CHAPTER_ENDPOINT = `${API_BASE}/api/generate-chapter`;

// Helper for exponential backoff retry
const withRetry = async <T>(fn: () => Promise<T>, retries = 3, baseDelay = 2000): Promise<T> => {
  try {
    return await fn();
  } catch (error: any) {
    const isQuotaError = error?.status === 429 || error?.code === 429 || error?.message?.includes('429') || error?.status === 'RESOURCE_EXHAUSTED' || error?.message?.includes('quota');
    const isServerError = error?.status === 503 || error?.code === 503;
    const isAbortError = error?.name === 'AbortError' || error?.message?.includes('aborted');

    if ((isQuotaError || isServerError || isAbortError) && retries > 0) {
      console.warn(`API request failed with ${error?.message || error?.status}. Retrying in ${baseDelay}ms...`);
      await new Promise(resolve => setTimeout(resolve, baseDelay));
      return withRetry(fn, retries - 1, baseDelay * 2);
    }
    
    if (isQuotaError) {
       throw new Error("QUOTA_EXHAUSTED");
    }

    throw error;
  }
};

export const validateApiKey = async (): Promise<boolean> => {
  // Validation now happens on server-side
  // Just return true if backend is reachable
  try {
    const response = await fetch(GENERATE_OUTLINE_ENDPOINT, {
      method: 'OPTIONS'
    });
    return response.ok;
  } catch (error) {
    console.error("Backend connectivity check failed:", error);
    return false;
  }
};

// IMPROVED JSON CLEANER
const cleanJson = (text: string): string => {
  if (!text) return "{}";
  // Remove markdown code blocks if present
  let cleaned = text.replace(/```json/g, '').replace(/```/g, '');
  
  // Find the first '{' and last '}' to strip surrounding text
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  
  if (firstBrace !== -1 && lastBrace !== -1) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }
  return cleaned.trim();
};

export const generateOutline = async (config: EbookConfig): Promise<{ title: string; subtitle: string; chapters: Chapter[] }> => {
  try {
    const prompt = OUTLINE_PROMPT_TEMPLATE(
      config.topic,
      config.chapterCount,
      config.targetAudience,
      config.tone,
      config.goal,
      config.language
    );

    const response = await withRetry(async () => {
      const res = await fetch(GENERATE_OUTLINE_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          systemInstruction: SYSTEM_PERSONA(config.language),
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              subtitle: { type: Type.STRING },
              sections: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    type: { 
                      type: Type.STRING,
                      description: "One of: front, body, back" 
                    },
                    points: { 
                      type: Type.ARRAY, 
                      items: { type: Type.STRING } 
                    }
                  },
                  required: ["title", "type", "points"]
                }
              }
            },
            required: ["title", "sections"]
          }
        })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to generate outline');
      }

      return res.json();
    });

    if (!response.success || !response.text) {
      throw new Error("No response from backend");
    }
    
    const cleanText = cleanJson(response.text);
    let data;
    try {
        data = JSON.parse(cleanText);
    } catch (e) {
        console.error("Failed to parse JSON:", cleanText);
        throw new Error("Received invalid JSON format from model. Please try again.");
    }
    
    const rawSections = data.sections || data.chapters;

    if (!rawSections || !Array.isArray(rawSections)) {
        console.error("Structure Error. Data received:", data);
        throw new Error("Invalid outline structure: missing sections array");
    }

    const chapters: Chapter[] = rawSections.map((sec: any, index: number) => ({
      id: `sec-${index + 1}`,
      title: sec.title || `Section ${index + 1}`,
      sectionType: (sec.type as SectionType) || 'body',
      subpoints: sec.points || sec.subpoints || [],
      status: 'pending'
    }));

    return {
      title: data.title || config.topic,
      subtitle: data.subtitle || "",
      chapters
    };
export const generateChapterContent = async (
  chapter: Chapter, 
  ebookTitle: string,
  prevContext: string = "N/A",
  language: string
): Promise<string> => {
  try {
    const prompt = SECTION_PROMPT_TEMPLATE(
        chapter.title, 
        chapter.sectionType, 
        chapter.subpoints || [], 
        ebookTitle, 
        prevContext,
        language
    );

    const response = await withRetry(async () => {
      const res = await fetch(GENERATE_CHAPTER_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          systemInstruction: SYSTEM_PERSONA(language)
        })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to generate chapter');
      }

      return res.json();
    });

    return response.text || "";
  } catch (error) {
    console.error(`Section Generation Error (${chapter.title}):`, error);
    throw error;
  }
};

export const generateIllustration = async (promptText: string): Promise<string> => {
  // Note: Gemini API tidak support native image generation saat ini
  // Returning placeholder atau bisa integrate dengan service lain seperti DALL-E, Stable Diffusion, dll
  
  console.log("Image generation prompt:", promptText);
  
  // Untuk sementara, return placeholder image dari service gratis
  // Atau bisa return empty string untuk skip image generation
  
  // Option 1: Skip image generation
  throw new Error("Image generation temporarily disabled");
  
  // Option 2: Gunakan placeholder service (uncomment jika ingin gunakan)
  // const placeholder = `https://via.placeholder.com/1200x675/6366f1/ffffff?text=${encodeURIComponent('Ilustrasi: ' + promptText.substring(0, 50))}`;
  // return placeholder;
};