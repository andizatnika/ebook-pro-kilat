# 🚀 Quick Start - Backend API Setup Complete!

## ✅ Setup Selesai!

API Key Gemini sekarang **sudah aman di backend**. Frontend tidak pernah menyimpan API key lagi.

## 📦 Apa yang Sudah Dibuat?

### 1. Backend API (Serverless Functions)
- `api/generate-outline.js` - Generate outline ebook
- `api/generate-chapter.js` - Generate konten chapter
- `server.js` - Development server untuk local testing

### 2. Frontend Service Update
- `services/geminiService.ts` - Sekarang call backend API endpoints
- Tidak ada lagi direct Gemini API call dari browser

### 3. Environment Setup
- `.env` - API key disimpan di sini (local)
- `.env.example` - Template untuk developer lain
- `BACKEND_SETUP.md` - Dokumentasi lengkap setup

## 🎮 Cara Pakai

### Development (Local):

**Terminal 1 - Backend:**
```bash
npm run dev:backend
```
Server akan run di `http://localhost:3002`

**Terminal 2 - Frontend:**
```bash
npm run dev
```
Frontend akan run di `http://localhost:3001`

**Atau jalankan keduanya sekaligus:**
```bash
npm run dev:full
```

### Test Backend API:
Buka browser: `http://localhost:3002/api/health`

Seharusnya muncul:
```json
{
  "success": true,
  "message": "Backend API is running"
}
```

## 🌐 Deploy ke Production (Vercel)

### Step 1: Push Code ke GitHub
```bash
git add .
git commit -m "feat: backend API setup with serverless functions"
git push origin main
```

### Step 2: Set Environment Variable di Vercel
1. Buka https://vercel.com
2. Pilih project kamu
3. Go to: **Settings** → **Environment Variables**
4. Add variable:
   - **Name:** `GEMINI_API_KEY`
   - **Value:** `AIzaSyC7fC4cXH6YoR5L_mPq2kSVu6lDL0fJuOM`
   - **Environments:** Pilih semua (Production, Preview, Development)
5. Klik **Save**

### Step 3: Redeploy (Optional)
Vercel akan otomatis deploy setiap push ke GitHub. Atau manual:
```bash
vercel --prod
```

## 🔐 Keamanan

### ❌ Sebelumnya (TIDAK AMAN):
```typescript
// API Key terlihat di browser DevTools
const apiKey = "AIzaSy...";
const ai = new GoogleGenAI({ apiKey });
```

### ✅ Sekarang (AMAN):
```typescript
// Frontend hanya call backend
const response = await fetch('/api/generate-outline', {
  method: 'POST',
  body: JSON.stringify({ prompt })
});

// Backend yang access API key (server-side only)
const apiKey = process.env.GEMINI_API_KEY;
```

## 🛠 Troubleshooting

### Backend tidak responding?
```bash
# Check apakah port 3002 sudah dipakai
netstat -ano | findstr :3002

# Restart backend
npm run dev:backend
```

### Frontend tidak bisa connect ke backend?
Check console browser, seharusnya call `http://localhost:3002/api/...`

### Error "GEMINI_API_KEY not found"?
Pastikan file `.env` ada dengan isi:
```env
GEMINI_API_KEY=AIzaSyC7fC4cXH6YoR5L_mPq2kSVu6lDL0fJuOM
```

## 📁 File Structure
```
ebook-pro-kilat/
├── api/                      # Vercel serverless (production)
│   ├── generate-outline.js
│   └── generate-chapter.js
├── server.js                 # Dev server (local)
├── .env                      # API key (JANGAN commit!)
├── services/
│   └── geminiService.ts      # Call backend API
└── BACKEND_SETUP.md          # Dokumentasi lengkap
```

## 📝 Next Steps

1. ✅ Backend API sudah running
2. ✅ Frontend sudah connect ke backend
3. ⏳ Test generate ebook di browser
4. ⏳ Deploy ke Vercel
5. ⏳ Set environment variable di Vercel

## 🎉 Testing

Buka `http://localhost:3001` di browser, lalu:
1. Login dengan akun Supabase
2. Fill form ebook (topic, chapters, dll)
3. Klik **Mulai Generate**
4. Backend akan process dan return hasil

Check Network tab di DevTools:
- Seharusnya ada request ke `localhost:3002/api/generate-outline`
- Tidak ada lagi request langsung ke `generativelanguage.googleapis.com`

---

**Dokumentasi Lengkap:** Lihat [BACKEND_SETUP.md](./BACKEND_SETUP.md)
