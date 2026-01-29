# Konfigurasi Environment Variables untuk Vercel

## Setup API Key di Vercel

### 1. Login ke Vercel Dashboard
Buka: https://vercel.com/dashboard

### 2. Pilih Project
- Klik project "ebook-pro-kilat"
- Masuk ke tab **Settings**

### 3. Tambahkan Environment Variable
- Klik **Environment Variables**
- Tambahkan variable baru:

```
Name: VITE_GEMINI_API_KEY
Value: [Your Google Gemini API Key]
Environment: Production, Preview, Development (pilih semua)
```

### 4. Redeploy Application
Setelah menambahkan environment variable:
- Kembali ke tab **Deployments**
- Klik **... (three dots)** pada deployment terakhir
- Pilih **Redeploy**
- Centang "Use existing Build Cache"
- Klik **Redeploy**

---

## Development Local

### 1. Buat file .env
```bash
cp .env.example .env
```

### 2. Isi .env dengan API Key
```env
VITE_GEMINI_API_KEY=AIzaSy...your_key_here
```

### 3. Restart Dev Server
```bash
npm run dev
```

---

## Cara Mendapatkan Google Gemini API Key

1. Buka: https://aistudio.google.com/apikey
2. Klik **Get API Key** atau **Create API Key**
3. Pilih atau buat Google Cloud project
4. Copy API key yang dihasilkan
5. Paste ke environment variables

---

## Keamanan

✅ **DO:**
- Simpan API key di environment variables
- Gunakan .env untuk development local
- Pastikan .env tidak ter-commit (ada di .gitignore)
- Setup API key di Vercel dashboard untuk production

❌ **DON'T:**
- Jangan hardcode API key di code
- Jangan commit .env ke Git
- Jangan share API key di public
- Jangan expose API key di frontend code

---

## Verifikasi

Cek apakah environment variable sudah tersedia:

```typescript
// Di geminiService.ts
const getApiKey = (): string => {
  const key = import.meta.env.VITE_GEMINI_API_KEY;
  if (!key) {
    throw new Error("API Key tidak ditemukan di environment variables");
  }
  return key;
};
```

Jika API key tidak ditemukan, akan muncul error yang jelas.

---

## Troubleshooting

### Error: "API Key tidak ditemukan di environment variables"

**Solusi:**
1. Pastikan file .env ada di root project
2. Restart dev server (`npm run dev`)
3. Di Vercel, pastikan environment variable sudah disave
4. Redeploy aplikasi di Vercel

### API Key tidak bekerja di production

**Solusi:**
1. Verifikasi API key valid di Google AI Studio
2. Pastikan environment variable di Vercel sudah benar
3. Pastikan nama variable: `VITE_GEMINI_API_KEY` (dengan prefix VITE_)
4. Redeploy setelah menambahkan environment variable

---

## Notes

- Prefix `VITE_` penting! Tanpa prefix, variable tidak akan exposed ke client
- Environment variables hanya di-load saat build time
- Perubahan .env memerlukan restart dev server
- Perubahan di Vercel memerlukan redeploy
