import React, { useState, useCallback, useEffect } from 'react';
import { supabase } from './services/supabaseClient';
import { saveEbook, deleteEbook, createEmptyEbook } from './services/ebookService';
import { Layout } from './components/Layout';
// Feature Imports
import { SetupForm } from './features/setup/SetupForm';
import { WriterWorkspace } from './features/editor/WriterWorkspace';
import { SettingsModal } from './features/settings/SettingsModal';
import { AuthPage } from './features/auth/AuthPage';
import { Dashboard } from './features/dashboard/Dashboard';
// Types & Services
import { AppStep, EbookConfig, EbookData, GenerationState, ImageRegistry, UserSettings } from './types';
import * as geminiService from './services/geminiService';
import { Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // App Flow State
  const [step, setStep] = useState<AppStep>(AppStep.DASHBOARD);
  const [darkMode, setDarkMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [dashboardKey, setDashboardKey] = useState(0);
  
  // Track changes status
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // User Settings State
  const [userSettings, setUserSettings] = useState<UserSettings>({
    username: '',
    email: '',
    apiKey: '', 
    isKeyValid: false,
    language: 'id' 
  });

  // INITIAL STATE
  const [ebookData, setEbookData] = useState<EbookData>({
    title: '',
    subtitle: '',
    outline: [],
  });

  const [currentConfig, setCurrentConfig] = useState<EbookConfig>({
    topic: '',
    chapterCount: 5,
    targetAudience: 'Umum',
    tone: 'Formal Profesional',
    goal: '',
    language: 'id'
  });

  // Store generated images globally
  const [imageRegistry, setImageRegistry] = useState<ImageRegistry>({});

  const [genState, setGenState] = useState<GenerationState>({
    isGenerating: false,
    currentTask: '',
    progress: 0,
    logs: []
  });

  // --- 1. AUTH & INIT ---
  useEffect(() => {
    let initialKey = (typeof process !== 'undefined' && process.env && process.env.API_KEY) || '';
    const storedKey = localStorage.getItem('gemini_api_key');
    if (storedKey) initialKey = storedKey;

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        handleSessionUpdate(session, initialKey);
      }
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (session) {
        handleSessionUpdate(session, initialKey);
      }
      setAuthLoading(false);
      
      if (event === 'SIGNED_OUT') {
        setEbookData({ title: '', subtitle: '', outline: [] });
        setImageRegistry({});
        setStep(AppStep.DASHBOARD);
        setShowSettings(false);
        setHasUnsavedChanges(false);
        setDashboardKey(0);
        setUserSettings(prev => ({
            ...prev,
            username: '',
            email: '',
        }));
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSessionUpdate = (session: any, apiKey: string) => {
    if (session?.user) {
      setUserSettings(prev => ({
        ...prev,
        email: session.user.email || '',
        username: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
        apiKey: prev.apiKey || apiKey, 
        isKeyValid: !!(prev.apiKey || apiKey)
      }));
    }
  };

  const toggleDarkMode = () => setDarkMode(!darkMode);

  const handleApiError = (error: any, context: string) => {
    console.error(context, error);
    if (error.message === 'QUOTA_EXHAUSTED') {
      alert("⚠️ QUOTA LIMIT REACHED\n\nMaaf, kuota penggunaan API Key Anda telah habis (Error 429).");
    } else {
      const msg = error.message || 'Terjadi kesalahan tidak dikenal.';
      alert(`${context}: ${msg}`);
    }
  };

  // --- 3. CORE LOGIC: CREATE NEW PROJECT (FIXED & ROBUST) ---
  const handleCreateNewEbook = async () => {
    if (!session?.user) {
        alert("Sesi habis. Silakan login ulang.");
        return;
    }

    // A. CEK DATA LAMA: Apakah ada proyek aktif yg belum disave?
    // Kita hanya peduli jika ada ID (sedang edit) DAN ada perubahan unsaved.
    if (ebookData.id && hasUnsavedChanges) {
       const confirmMsg = "Proyek yang sedang aktif memiliki perubahan yang belum disimpan.\n\nKlik 'OK' untuk membuang perubahan dan membuat proyek BARU.\nKlik 'Cancel' untuk membatalkan.";
       if (!window.confirm(confirmMsg)) {
         return; // User batal, tetap di proyek lama
       }
    }

    setIsSaving(true);
    try {
        console.log("Starting createEmptyEbook process...");

        // B. RESET TOTAL STATE (Penting agar data lama tidak bocor)
        setEbookData({ title: '', subtitle: '', outline: [] }); // Kosongkan visual
        setImageRegistry({});
        setHasUnsavedChanges(false);
        setGenState({ // Reset status loading/progress
            isGenerating: false,
            currentTask: '',
            progress: 0,
            logs: []
        });
        
        // Reset Form Setup ke Default
        setCurrentConfig({
          topic: '',
          chapterCount: 5,
          targetAudience: 'Umum',
          tone: 'Formal Profesional',
          goal: '',
          language: userSettings.language || 'id'
        });

        // C. BUAT ENTRY BARU DI DATABASE
        // Fungsi ini akan mereturn Object baru dengan ID UNIK dari database
        const newProject = await createEmptyEbook(session.user.id);
        console.log("New Project Created with ID:", newProject.id);

        // D. SET PROJECT BARU SEBAGAI AKTIF
        setEbookData(newProject);

        // E. PINDAH KE HALAMAN SETUP
        // Gunakan setTimeout kecil untuk memastikan state react ter-flush jika perlu, 
        // tapi biasanya langsung setStep aman.
        setStep(AppStep.SETUP);

    } catch (error: any) {
        console.error("FAILED TO CREATE PROJECT:", error);
        alert(`Gagal membuat proyek baru.\n\nDetail Error: ${error.message || JSON.stringify(error)}`);
        // Jika gagal, kembalikan ke dashboard
        setStep(AppStep.DASHBOARD);
    } finally {
        setIsSaving(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!ebookData.id) return;
    if (!session?.user?.id) return;

    const message = "Apakah Anda yakin ingin menghapus proyek eBook ini?\n\nTindakan ini bersifat permanen dan tidak dapat dibatalkan.";

    if (window.confirm(message)) {
      setIsSaving(true);
      try {
        await deleteEbook(ebookData.id, session.user.id);
        
        setEbookData({ title: '', subtitle: '', outline: [] });
        setImageRegistry({});
        setHasUnsavedChanges(false);
        setStep(AppStep.DASHBOARD);
        setDashboardKey(prev => prev + 1);
        
        alert("Proyek berhasil dihapus.");
      } catch (e: any) {
        alert("Gagal menghapus proyek: " + e.message);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleCloseSession = async () => {
    if (hasUnsavedChanges) {
       if (!window.confirm("Tutup editor? Perubahan yang belum di-klik 'Save' akan hilang.")) {
         return;
       }
    }
    setEbookData({ title: '', subtitle: '', outline: [] });
    setImageRegistry({});
    setHasUnsavedChanges(false);
    setStep(AppStep.DASHBOARD);
    setDashboardKey(prev => prev + 1);
  };

  const handleOpenEbook = (ebook: EbookData) => {
    if (ebookData.id === ebook.id) {
        handleResumeDraft();
        return;
    }

    if (ebookData.outline.length > 0 && hasUnsavedChanges) {
        if (!window.confirm("Pindah ke proyek lain? Perubahan di proyek saat ini akan hilang jika belum disimpan.")) {
            return;
        }
    }
    
    setEbookData(ebook);
    setImageRegistry({});
    setHasUnsavedChanges(false);
    
    const isComplete = ebook.outline.length > 0 && ebook.outline.every(c => c.status === 'completed');
    setStep(isComplete ? AppStep.COMPLETED : AppStep.GENERATING);
  };

  // --- GENERATION FLOW ---
  const handleStart = async (config: EbookConfig) => {
    if (!userSettings.isKeyValid || !userSettings.apiKey) {
      alert("Silakan atur Google Gemini API Key di menu Pengaturan.");
      setShowSettings(true);
      return;
    }

    // Double check: Jika outline sudah ada di ebookData (sisa glitch), konfirmasi overwrite
    if (ebookData.outline.length > 0) {
       if (!window.confirm("Generate Outline akan menimpa struktur buku yang sudah ada di proyek ini. Lanjutkan?")) {
         return;
       }
    }

    setCurrentConfig(config);
    setGenState({ isGenerating: true, currentTask: 'Menyiapkan database & merancang struktur...', progress: 5, logs: [] });

    let currentId = ebookData.id;
    try {
        const initialData = {
            ...ebookData,
            title: config.topic,
            subtitle: config.goal,
            outline: []
        };
        const saved = await saveEbook(session.user.id, initialData);
        setEbookData(saved);
        currentId = saved.id;
    } catch (e: any) {
        console.warn("Pre-save failed (Offline mode?):", e);
        setEbookData(prev => ({
            ...prev,
            title: config.topic,
            subtitle: config.goal
        }));
    }

    try {
      const finalConfig = { ...config, language: userSettings.language };
      const result = await geminiService.generateOutline(finalConfig, userSettings.apiKey);
      
      const updatedData = {
        ...ebookData,
        id: currentId,
        title: result.title,
        subtitle: result.subtitle,
        outline: result.chapters
      };
      
      setEbookData(updatedData);
      
      try {
        if (session?.user?.id) {
           const saved = await saveEbook(session.user.id, updatedData);
           setEbookData(saved); 
           setHasUnsavedChanges(false);
        }
      } catch (saveError) {
        console.warn("Auto-save outline failed:", saveError);
        setHasUnsavedChanges(true);
      }
      
      setStep(AppStep.GENERATING);

    } catch (error) {
      handleApiError(error, "Gagal membuat outline");
    } finally {
      setGenState(prev => ({ ...prev, isGenerating: false }));
    }
  };

  const handleGenerateChapter = useCallback(async (chapterId: string) => {
    if (!userSettings.apiKey) {
        alert("API Key hilang. Silakan masukkan kembali di Pengaturan.");
        setShowSettings(true);
        return;
    }

    const chapterIndex = ebookData.outline.findIndex(c => c.id === chapterId);
    if (chapterIndex === -1) return;
    const chapter = ebookData.outline[chapterIndex];

    // Set UI to loading state
    setGenState(prev => ({ 
        ...prev, 
        isGenerating: true, 
        currentTask: `Menulis: ${chapter.title}...` 
    }));

    setEbookData(prev => {
        const newOutline = [...prev.outline];
        newOutline[chapterIndex] = { ...chapter, status: 'generating' };
        return { ...prev, outline: newOutline };
    });

    // --- LOGIC BARU: GENERATE DAFTAR ISI SECARA OTOMATIS (PROGRAMMATIC) ---
    // Cek apakah chapter ini adalah Daftar Isi berdasarkan judulnya
    const isTOC = chapter.title.toLowerCase().includes('daftar isi') || 
                  chapter.title.toLowerCase().includes('table of contents') ||
                  chapter.title.toLowerCase().includes('mokuji');

    if (isTOC) {
        try {
            // Simulasi delay agar terasa seperti proses generate (UX)
            await new Promise(resolve => setTimeout(resolve, 800));

            // Buat konten Daftar Isi berdasarkan struktur ebookData.outline
            let tocContent = `Berikut adalah daftar isi lengkap untuk buku ini:\n\n`;
            
            // Loop melalui outline untuk membuat list
            ebookData.outline.forEach(c => {
                // Jangan masukkan "Daftar Isi" itu sendiri ke dalam list
                if (c.id === chapterId) return;

                // Format: - **Judul Chapter**
                tocContent += `- **${c.title}**\n`;

                // Jika ada subpoints, tambahkan sebagai nested list
                if (c.subpoints && c.subpoints.length > 0) {
                    c.subpoints.forEach(sp => {
                        tocContent += `  - ${sp}\n`;
                    });
                }
            });

            // Update state dengan konten yang dibuat programmatically
            setEbookData(prev => {
                const updated = [...prev.outline];
                updated[chapterIndex] = { ...updated[chapterIndex], status: 'completed', content: tocContent };
                return { ...prev, outline: updated };
            });
            setHasUnsavedChanges(true);

        } catch (e) {
            console.error("Auto-TOC generation failed", e);
            setEbookData(prev => {
                const updated = [...prev.outline];
                updated[chapterIndex] = { ...updated[chapterIndex], status: 'error' };
                return { ...prev, outline: updated };
            });
        } finally {
            // Matikan loading state, JANGAN panggil AI
            setGenState(prev => ({ ...prev, isGenerating: false }));
        }
        return; // STOP di sini
    }

    // --- LOGIC LAMA: GENERATE CHAPTER BIASA MENGGUNAKAN AI ---
    try {
        let prevContext = "Awal Buku.";
        if (chapterIndex > 0) {
            const prevChapter = ebookData.outline[chapterIndex - 1]; // Use current state ref
            if (prevChapter.content) {
                prevContext = `Bagian sebelumnya: "${prevChapter.title}" telah selesai.`;
            }
        }

        const content = await geminiService.generateChapterContent(
          chapter, 
          ebookData.title, 
          prevContext,
          userSettings.apiKey,
          userSettings.language
        );

        setEbookData(prev => {
            const updated = [...prev.outline];
            updated[chapterIndex] = { ...updated[chapterIndex], status: 'completed', content };
            return { ...prev, outline: updated };
        });
        setHasUnsavedChanges(true);

    } catch (error) {
        console.error("Generate Chapter Error:", error);
        setEbookData(prev => {
            const updated = [...prev.outline];
            updated[chapterIndex] = { ...updated[chapterIndex], status: 'error' };
            return { ...prev, outline: updated };
        });
        handleApiError(error, `Gagal generate chapter "${chapter.title}"`);
    } finally {
        setGenState(prev => ({ ...prev, isGenerating: false }));
    }
  }, [ebookData, userSettings.apiKey, userSettings.language]);

  const handleUpdateChapter = (chapterId: string, newContent: string) => {
    setEbookData(prev => {
      const updated = prev.outline.map(ch => 
        ch.id === chapterId ? { ...ch, content: newContent } : ch
      );
      return { ...prev, outline: updated };
    });
    setHasUnsavedChanges(true);
  };

  const handleImageGenerated = useCallback((promptKey: string, base64Data: string) => {
    setImageRegistry(prev => ({ ...prev, [promptKey]: base64Data }));
    setHasUnsavedChanges(true); 
  }, []);

  const handleSaveEbook = async () => {
    if (!session?.user) return;
    setIsSaving(true);
    try {
        const savedData = await saveEbook(session.user.id, ebookData);
        setEbookData(savedData); 
        setHasUnsavedChanges(false);
        setDashboardKey(prev => prev + 1); 
    } catch (error: any) {
        alert("Gagal menyimpan: " + error.message);
    } finally {
        setIsSaving(false);
    }
  };

  const handleStepBack = () => {
    if (step === AppStep.GENERATING || step === AppStep.COMPLETED) {
        setStep(AppStep.SETUP);
    } else if (step === AppStep.SETUP) {
        setStep(AppStep.DASHBOARD);
        setDashboardKey(prev => prev + 1);
    }
  };

  const handleGoToLibrary = () => {
    setStep(AppStep.DASHBOARD);
    setDashboardKey(prev => prev + 1);
  };

  const handleResumeDraft = () => {
    if (ebookData?.outline?.length > 0) {
        const isComplete = ebookData.outline.every(c => c.status === 'completed');
        setStep(isComplete ? AppStep.COMPLETED : AppStep.GENERATING);
    } else {
        setStep(AppStep.SETUP);
    }
  };

  const handleLogout = async () => {
    // REMOVED CONFIRMATION: if (!window.confirm("Apakah Anda yakin ingin keluar dari akun?")) return;
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      // UI update is handled by onAuthStateChange listener in useEffect
    } catch (error: any) {
      console.error("Logout failed:", error);
      alert("Gagal logout: " + (error.message || "Kesalahan jaringan"));
    }
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900"><Loader2 className="animate-spin text-indigo-600" size={48} /></div>;
  if (!session) return <AuthPage />;

  return (
    <Layout 
      step={step} 
      title={ebookData.title} 
      darkMode={darkMode} 
      toggleDarkMode={toggleDarkMode}
      onOpenSettings={() => setShowSettings(true)}
      onBack={step === AppStep.DASHBOARD ? undefined : handleStepBack}
      onGoToLibrary={handleGoToLibrary}
    >
      {step === AppStep.DASHBOARD && (
          <Dashboard 
            key={dashboardKey}
            userId={session.user.id} 
            onNewEbook={handleCreateNewEbook}
            onOpenEbook={handleOpenEbook}
            activeDraft={ebookData.outline.length > 0 ? ebookData : undefined}
            onResumeDraft={handleResumeDraft}
            onCloseSession={handleCloseSession}
          />
      )}

      {step === AppStep.SETUP && (
        <SetupForm 
            onStart={handleStart} 
            isLoading={genState.isGenerating} 
            initialValues={currentConfig} 
        />
      )}
      
      {(step === AppStep.GENERATING || step === AppStep.COMPLETED) && (
        <WriterWorkspace 
            ebookData={ebookData} 
            genState={genState}
            imageRegistry={imageRegistry}
            apiKey={userSettings.apiKey}
            onGenerateChapter={handleGenerateChapter}
            onUpdateChapter={handleUpdateChapter}
            onImageGenerated={handleImageGenerated}
            onFinish={() => setStep(AppStep.COMPLETED)}
            onSave={handleSaveEbook}
            onDelete={ebookData.id ? handleDeleteProject : undefined} 
            onNewEbook={handleCreateNewEbook}
            isSaving={isSaving}
            hasUnsavedChanges={hasUnsavedChanges}
            step={step}
        />
      )}

      <SettingsModal 
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={userSettings}
        onUpdateSettings={setUserSettings}
        onLogout={handleLogout}
      />
    </Layout>
  );
};

export default App;