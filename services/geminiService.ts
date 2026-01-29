import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { SYSTEM_PERSONA, OUTLINE_PROMPT_TEMPLATE, SECTION_PROMPT_TEMPLATE } from '../constants';
import { EbookConfig, Chapter, SectionType } from '../types';

const MODEL_NAME = 'gemini-3-flash-preview';
const IMAGE_MODEL_NAME = 'gemini-2.5-flash-image';

// Helper to get API key from environment
const getApiKey = (): string => {
  const key = import.meta.env.VITE_GEMINI_API_KEY;
  if (!key) {
    throw new Error("API Key tidak ditemukan di environment variables");
  }
  return key;
};

// Helper to get client with environment API key
const getClient = () => {
  const apiKey = getApiKey();
  return new GoogleGenAI({ apiKey: apiKey });
};

// Helper for exponential backoff retry
const withRetry = async <T>(fn: () => Promise<T>, retries = 3, baseDelay = 2000): Promise<T> => {
  try {
    return await fn();
  } catch (error: any) {
    const isQuotaError = error?.status === 429 || error?.code === 429 || error?.message?.includes('429') || error?.status === 'RESOURCE_EXHAUSTED' || error?.message?.includes('quota');
    const isServerError = error?.status === 503 || error?.code === 503;
    // Handle generic abort errors often caused by network instability or timeouts
    const isAbortError = error?.name === 'AbortError' || error?.message?.includes('aborted');

    if ((isQuotaError || isServerError || isAbortError) && retries > 0) {
      console.warn(`API request failed with ${error?.message || error?.status}. Retrying in ${baseDelay}ms...`);
      await new Promise(resolve => setTimeout(resolve, baseDelay));
      return withRetry(fn, retries - 1, baseDelay * 2);
    }
    
    // Enrich error message for UI if it's a quota issue
    if (isQuotaError) {
       throw new Error("QUOTA_EXHAUSTED");
    }

    throw error;
  }
};

export const validateApiKey = async (): Promise<boolean> => {
  try {
    const ai = getClient();
    // Lightweight test call
    await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: 'test',
    }));
    return true;
  } catch (error) {
    console.error("API Key Validation Failed:", error);
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
    const ai = getClient();
    const prompt = OUTLINE_PROMPT_TEMPLATE(
      config.topic,
      config.chapterCount,
      config.targetAudience,
      config.tone,
      config.goal,
      config.language
    );

    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_PERSONA(config.language),
        responseMimeType: "application/json",
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
      }
    }));

    if (!response.text) throw new Error("No response from Gemini");
    
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

  } catch (error) {
    console.error("Outline Generation Error:", error);
    throw error;
  }
};

export const generateChapterContent = async (
  chapter: Chapter, 
  ebookTitle: string,
  prevContext: string = "N/A",
  language: string
): Promise<string> => {
  try {
    const ai = getClient();
    const prompt = SECTION_PROMPT_TEMPLATE(
        chapter.title, 
        chapter.sectionType, 
        chapter.subpoints || [], 
        ebookTitle, 
        prevContext,
        language
    );

    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_PERSONA(language),
      }
    }));

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