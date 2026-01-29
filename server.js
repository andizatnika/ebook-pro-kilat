import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3002;

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Backend API is running' });
});

// Generate outline endpoint
app.post('/api/generate-outline', async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ 
        success: false, 
        error: 'GEMINI_API_KEY not found in environment variables' 
      });
    }

    const { prompt, systemInstruction, responseSchema } = req.body;

    if (!prompt) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required field: prompt' 
      });
    }

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema
      }
    });

    return res.status(200).json({ 
      success: true, 
      text: response.text 
    });

  } catch (error) {
    console.error('Outline generation error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Internal server error' 
    });
  }
});

// Generate chapter endpoint
app.post('/api/generate-chapter', async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ 
        success: false, 
        error: 'GEMINI_API_KEY not found in environment variables' 
      });
    }

    const { prompt, systemInstruction } = req.body;

    if (!prompt) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required field: prompt' 
      });
    }

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction
      }
    });

    return res.status(200).json({ 
      success: true, 
      text: response.text 
    });

  } catch (error) {
    console.error('Chapter generation error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Internal server error' 
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Backend API server running on http://localhost:${PORT}`);
  console.log(`📝 Endpoints:`);
  console.log(`   GET  /api/health`);
  console.log(`   POST /api/generate-outline`);
  console.log(`   POST /api/generate-chapter`);
});
