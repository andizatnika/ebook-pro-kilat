# Setup API Key di Backend - Panduan Lengkap

## 🎯 Overview

API Key Gemini sekarang dipasang di **backend** untuk keamanan maksimal. Frontend tidak pernah menyimpan atau mengakses API key secara langsung.

## 📁 Struktur Baru

```
ebook-pro-kilat/
├── api/                          # Vercel serverless functions (production)
│   ├── generate-outline.js       # Backend endpoint untuk generate outline
│   └── generate-chapter.js       # Backend endpoint untuk generate chapter
├── server.js                     # Development backend server (local testing)
├── .env                          # Environment variables (TIDAK di-commit)
├── .env.example                  # Template environment variables
└── services/
    └── geminiService.ts          # Frontend service (call backend API)
```

## 🔑 Environment Variables

### File `.env` (Local Development):
```env
# Backend API Key (tidak pakai VITE_ prefix)
GEMINI_API_KEY=your_actual_api_key_here

# Frontend (Supabase credentials)
VITE_SUPABASE_URL=https://ciwxblwbxqxmdvdbgjwu.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Vercel Production Environment:
1. Buka [Vercel Dashboard](https://vercel.com)
2. Pilih project **ebook-pro-kilat**
3. Settings → Environment Variables
4. Tambahkan:
   - Name: `GEMINI_API_KEY`
   - Value: `AIzaSyC7fC4cXH6YoR5L_mPq2kSVu6lDL0fJuOM`
   - Environment: Production, Preview, Development (centang semua)

## 🚀 Development (Local Testing)

### Option 1: Dual Server Mode (Recommended)
Jalankan frontend + backend bersamaan:

```bash
npm run dev:full
```

Ini akan start:
- Backend API di `http://localhost:3002`
- Frontend di `http://localhost:5173`

### Option 2: Manual Mode
Terminal 1 - Backend:
```bash
npm run dev:backend
```

Terminal 2 - Frontend:
```bash
npm run dev
```

### Test Backend API:
```bash
# Health check
curl http://localhost:3002/api/health

# Test outline generation
curl -X POST http://localhost:3002/api/generate-outline \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Test", "systemInstruction": "You are a helpful assistant"}'
```

## 📦 Production Deployment (Vercel)

### Langkah-langkah:

1. **Commit semua changes:**
```bash
git add .
git commit -m "feat: move API key to backend with serverless functions"
git push origin main
```

2. **Deploy ke Vercel:**
   - Vercel akan otomatis detect `api/` folder
   - Serverless functions akan di-deploy otomatis
   - Frontend akan build dan di-serve dari CDN

3. **Set Environment Variable:**
   - Masuk Vercel Dashboard → Settings → Environment Variables
   - Add `GEMINI_API_KEY` dengan value API key kamu
   - **Penting:** TIDAK pakai prefix `VITE_` karena ini backend-only

4. **Redeploy (jika perlu):**
```bash
vercel --prod
```

## 🔐 Security Benefits

### ✅ Sebelumnya (Frontend):
```typescript
// ❌ API Key terekspose di browser
const apiKey = "AIzaSy..."; 
const ai = new GoogleGenAI({ apiKey });
```

### ✅ Sekarang (Backend):
```typescript
// ✅ Frontend hanya call backend endpoint
const response = await fetch('/api/generate-outline', {
  method: 'POST',
  body: JSON.stringify({ prompt, systemInstruction })
});

// ✅ Backend access API key dari server environment
const apiKey = process.env.GEMINI_API_KEY; // Server-side only
const ai = new GoogleGenAI({ apiKey });
```

## 🛠 Troubleshooting

### Issue: "API Key tidak ditemukan"
**Solution:** Pastikan file `.env` ada dan berisi `GEMINI_API_KEY`

### Issue: "Backend tidak responding"
**Solution:** 
```bash
# Check backend server running
npm run dev:backend

# Check port 3002 tidak dipakai aplikasi lain
netstat -ano | findstr :3002
```

### Issue: "CORS error"
**Solution:** Backend sudah include CORS middleware. Pastikan:
- Backend running di port 3002
- Frontend call `http://localhost:3002/api/...`

### Issue: Vercel deployment error
**Solution:**
- Pastikan `vercel.json` sudah ada
- Environment variable `GEMINI_API_KEY` sudah di-set di Vercel
- Check build logs di Vercel dashboard

## 📊 Architecture Flow

```
User Browser
    ↓
Frontend (React)
    ↓
[Fetch API Call]
    ↓
Backend Serverless Function (api/generate-*.js)
    ↓
[Process.env.GEMINI_API_KEY]
    ↓
Gemini AI API
    ↓
[Response]
    ↓
Frontend (Display Result)
```

## 🎓 Key Concepts

1. **Serverless Functions:** File di folder `api/` otomatis jadi API endpoints di Vercel
2. **Environment Variables:** 
   - `VITE_` prefix = Frontend accessible (public)
   - No prefix = Backend only (secure)
3. **Development vs Production:**
   - Dev: `server.js` di port 3002
   - Prod: Vercel serverless functions otomatis

## 📝 Next Steps

1. ✅ API key sudah di backend
2. ✅ Frontend call backend endpoint
3. ✅ Development server ready
4. ⏳ Deploy ke Vercel
5. ⏳ Set environment variable di Vercel dashboard
6. ⏳ Test production deployment

## 🔗 Resources

- [Vercel Serverless Functions](https://vercel.com/docs/functions)
- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)
- [Google Gemini API Docs](https://ai.google.dev/docs)
