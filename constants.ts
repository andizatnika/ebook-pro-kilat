
// Helper to get language name
const getLangName = (code: string) => {
  const map: Record<string, string> = {
    'id': 'Bahasa Indonesia (Indonesian)',
    'en-US': 'English (United States)',
    'en-UK': 'English (United Kingdom)',
    'ja': 'Japanese (日本語)',
    'ko': 'Korean (한국어)',
    'zh': 'Chinese Simplified (简体中文)',
    'es': 'Spanish (Español)',
    'fr': 'French (Français)',
    'de': 'German (Deutsch)',
    'ar': 'Arabic (العربية)'
  };
  return map[code] || 'Bahasa Indonesia';
};

export const SYSTEM_PERSONA = (langCode: string) => `
Anda adalah "Pro Ebook Kilat AI", asisten penulis eBook profesional kelas dunia.
BAHASA OUTPUT WAJIB: ${getLangName(langCode)}.

INSTRUKSI GLOBAL:
1. Semua konten, judul, subjudul, dan penjelasan HARUS ditulis dalam ${getLangName(langCode)}.
2. Gunakan gaya bahasa profesional, mengalir, dan sesuai standar literasi bahasa tersebut.
3. Anda WAJIB menyertakan ide ilustrasi visual.

INSTRUKSI VISUAL (IMAGE PROMPT):
Di setiap Chapter, sertakan deskripsi prompt gambar dengan format persis berikut (Prompt gambar boleh dalam Bahasa Inggris agar akurat untuk generator gambar, atau bahasa target):
> **[IMAGE PROMPT]:** Detailed visual description relevant to the topic. Style: Minimalist/Photorealistic/Vector.

STRUKTUR BUKU:
- Bagian Awal (Front Matter)
- Isi Utama (Body Chapters)
- Bagian Akhir (Back Matter: Conclusion, Glossary, References)
`;

export const OUTLINE_PROMPT_TEMPLATE = (topic: string, count: number, audience: string, tone: string, goal: string, langCode: string) => `
OUTPUT LANGUAGE: ${getLangName(langCode)}
TOPIK BUKU: ${topic}
SPESIFIKASI:
- Jumlah Chapter Isi: ${count}
- Target Pembaca: ${audience}
- Gaya Penulisan: ${tone}
- Tujuan Buku: ${goal}

TUGAS:
Buatlah struktur buku (Outline) yang LENGKAP dalam format JSON valid.
Semua JUDUL (titles) dan POIN (points) harus dalam ${getLangName(langCode)}.

JSON harus memiliki properti "sections" (array object).
Setiap objek section harus memiliki:
- "title": Judul bagian (Dalam ${getLangName(langCode)})
- "type": Salah satu dari "front", "body", atau "back"
- "points": Array string berisi poin pembahasan mendalam.

STRUKTUR WAJIB (Sesuaikan istilah dengan bahasa target):
1. [Type: front] Title Page
2. [Type: front] Preface/Foreword
3. [Type: front] Table of Contents
4. [Type: front] Introduction
5. [Type: front] About Author
6. [Type: body] Chapter 1... sampai Chapter ${count}
7. [Type: back] Conclusion/Closing
8. [Type: back] Glossary (Wajib ada)
9. [Type: back] References/Bibliography
`;

export const SECTION_PROMPT_TEMPLATE = (
  sectionTitle: string, 
  sectionType: 'front' | 'body' | 'back',
  points: string[], 
  ebookTitle: string, 
  prevContext: string,
  langCode: string
) => `
OUTPUT LANGUAGE: ${getLangName(langCode)}
JUDUL BUKU: ${ebookTitle}
BAGIAN SAAT INI: ${sectionTitle}
TIPE BAGIAN: ${sectionType.toUpperCase()}
POIN UTAMA: ${points.join(', ')}

KONTEKS SEBELUMNYA: ${prevContext}

INSTRUKSI PENULISAN:
1. Tulis konten LENGKAP untuk bagian "${sectionTitle}" dalam ${getLangName(langCode)}.
2. Gunakan format Markdown (Heading #, ##, Bold, dll).
3. Fokus HANYA pada topik bagian ini.
4. Sertakan minimal satu **[IMAGE PROMPT]** di posisi yang relevan.
   Format: > **[IMAGE PROMPT]:** [Visual description]

PANDUAN KHUSUS BAHASA (${getLangName(langCode)}):
- Pastikan tata bahasa, ejaan, dan istilah teknis sesuai dengan kaidah ${getLangName(langCode)}.
- Jika bahasa target adalah Non-Latin (Jepang/Korea/Arab/China), gunakan karakter asli bahasa tersebut, bukan romanisasi.

JANGAN sertakan teks meta-komentar. Langsung tulis konten bukunya.
`;