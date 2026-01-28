# API Key Management - Setup Guide

## Overview
Setiap pengguna yang baru login ke aplikasi harus menginput Google Gemini API Key mereka sebelum menggunakan fitur generasi konten. API Key disimpan per-user di database Supabase.

## Fitur Utama
✅ **Per-User API Key Storage** - Setiap akun menyimpan API key mereka sendiri di database  
✅ **Automatic Setup Modal** - Modal otomatis muncul saat user baru login tanpa API key  
✅ **API Key Validation** - Validasi real-time terhadap Google Gemini API  
✅ **Free Tier Compatible** - Aplikasi tetap berjalan dengan API Key free tier Google  
✅ **Quota Handling** - Penanganan graceful untuk quota exhausted (error 429)

## Setup Instructions

### Step 1: Run Database Migration

1. Buka [Supabase Dashboard](https://supabase.com)
2. Navigate ke SQL Editor
3. Copy-paste semua konten dari file `DATABASE_MIGRATION.sql`
4. Klik "Run" atau tekan `Ctrl+Enter`

**Apa yang dilakukan:**
- Membuat table `user_api_keys` untuk menyimpan API key per-user
- Mengatur RLS (Row Level Security) agar user hanya bisa akses API key mereka sendiri
- Membuat index untuk performa query yang lebih baik
- Setup trigger untuk auto-update `updated_at` timestamp

### Step 2: Restart Aplikasi

Setelah migration selesai, restart dev server:
```bash
npm run dev
```

## User Flow

### Saat Login Pertama Kali
1. User login dengan email & password
2. Aplikasi cek apakah user sudah punya API key di database
3. **Jika tidak ada**: Modal `SetupApiKeyModal` otomatis tampil
4. User input API key dari Google AI Studio
5. Aplikasi validasi & simpan ke database
6. User bisa mulai membuat eBook

### Mengubah API Key
1. User klik ⚙️ Settings di dashboard
2. Pilih tab "API Key"
3. Input API key baru
4. Klik "Simpan & Verifikasi API Key"
5. API key lama tertimpa dengan yang baru

### Free Tier Compatibility
- Aplikasi menggunakan model `gemini-3-flash-preview` (free tier)
- Quota handling otomatis dengan retry exponential backoff
- Jika quota habis, user dapat update API key dengan project baru dari Google

## File Structure

```
services/
├── apiKeyService.ts          # Core service untuk API key management
├── supabaseClient.ts         # Konfigurasi Supabase client
└── geminiService.ts          # Gemini API integration

components/
├── SetupApiKeyModal.tsx      # Modal untuk setup API key pertama kali
└── SettingsModal.tsx         # Settings dengan tab untuk update API key

DATABASE_MIGRATION.sql        # SQL untuk create table di Supabase
```

## API Key Service Functions

### `getUserApiKey(userId: string)`
Ambil API key user dari database
```typescript
const apiKey = await apiKeyService.getUserApiKey(userId);
```

### `saveUserApiKey(userId: string, apiKey: string, isValid?: boolean)`
Simpan atau update API key user
```typescript
const saved = await apiKeyService.saveUserApiKey(userId, apiKey);
```

### `validateAndSaveApiKey(userId: string, apiKey: string)`
Validasi API key terhadap Google Gemini, kemudian simpan
```typescript
const result = await apiKeyService.validateAndSaveApiKey(userId, apiKey);
if (result.valid) {
  // API key valid dan tersimpan
} else {
  console.error(result.message);
}
```

### `deleteUserApiKey(userId: string)`
Hapus API key user
```typescript
await apiKeyService.deleteUserApiKey(userId);
```

## Integration dengan App Component

Di `App.tsx`, ketika user login:

1. **Check Database untuk API Key**
   ```typescript
   const dbApiKey = await apiKeyService.getUserApiKey(session.user.id);
   ```

2. **Jika tidak ada, tampilkan modal**
   ```typescript
   if (!dbApiKey && !localKey) {
     setShowApiKeyModal(true);
   }
   ```

3. **Handle Submit dari Modal**
   ```typescript
   const handleApiKeySetup = async (apiKey: string) => {
     const result = await apiKeyService.validateAndSaveApiKey(userId, apiKey);
     if (result.valid) {
       // Update state & close modal
       setShowApiKeyModal(false);
     }
   };
   ```

## Error Handling

### "API Key tidak valid"
- Pastikan API key aktif di Google AI Studio
- Pastikan API key bukan merupakan service account key
- Coba generate API key baru dari Google AI Studio

### "QUOTA_EXHAUSTED" (Error 429)
- Aplikasi otomatis mendeteksi dan menampilkan alert
- User harus generate API key baru dari project Google baru

### "Gagal menyimpan API key"
- Cek koneksi internet
- Pastikan Supabase sudah dikonfigurasi dengan benar
- Cek apakah migration sudah berjalan di Supabase

## Security Notes

⚠️ **Development Phase**: API key saat ini disimpan dalam plain text di Supabase. 

Untuk production, rekomendasikan:
1. **Encrypt** API key sebelum disimpan menggunakan pgcrypto extension Supabase
2. **Use environment variables** untuk encryption key
3. **Audit logging** untuk setiap akses API key
4. **Rate limiting** pada API calls untuk mencegah abuse

## Testing

### Test API Key Setup Flow
1. Create akun baru
2. Verify modal muncul setelah login
3. Input invalid API key → should show error
4. Input valid API key → should save & close modal
5. Try to use generator → should use saved API key

### Test API Key Update
1. Login with existing account
2. Go to Settings → API Key tab
3. Change API key
4. Verify new key digunakan untuk generation

### Test Free Tier Quota
1. Repeatedly generate content sampai quota habis
2. Verify app handles error gracefully
3. User dapat update API key untuk lanjut

## Troubleshooting

**Modal tidak muncul saat login baru?**
- Clear browser cache & cookies
- Check console untuk error messages
- Verify Supabase migration sudah berhasil

**API key error saat generate konten?**
- Pastikan API key valid dan active
- Cek kuota di Google AI Studio dashboard
- Verify internet connection

**Can't save API key?**
- Check Supabase RLS policies
- Verify user authenticated correctly
- Check browser console untuk database errors

---

Untuk bantuan lebih lanjut, lihat dokumentasi:
- [Google AI Studio](https://aistudio.google.com)
- [Supabase Documentation](https://supabase.com/docs)
- [Gemini API Reference](https://ai.google.dev/docs)
