import React, { useEffect, useState, useRef } from 'react';
import { EbookData } from '../../types';
import { getEbooks, deleteEbook } from '../../services/ebookService';
import { Plus, BookOpen, Calendar, Trash2, Loader2, Edit3, ArrowRight, Activity, XCircle } from 'lucide-react';

interface DashboardProps {
  userId: string; // REQUIRED: To filter data
  onNewEbook: () => Promise<void> | void; // Allow async
  onOpenEbook: (ebook: EbookData) => void;
  activeDraft?: EbookData;
  onResumeDraft?: () => void;
  onCloseSession?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  userId,
  onNewEbook, 
  onOpenEbook,
  activeDraft,
  onResumeDraft,
  onCloseSession
}) => {
  const [ebooks, setEbooks] = useState<EbookData[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false); // Track creation state
  const [deletingId, setDeletingId] = useState<string | null>(null); // Track which item is being deleted
  const isMounted = useRef(true);

  // Ambil semua proyek dari Database (Filtered by User ID)
  const fetchBooks = async () => {
    setLoading(true);
    try {
      const data = await getEbooks(userId); // Pass user ID
      if (isMounted.current) {
        setEbooks(data);
      }
    } catch (error) {
      console.error("Failed to load ebooks", error);
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    isMounted.current = true;
    if (userId) {
        fetchBooks();
    }
    return () => { isMounted.current = false; };
  }, [userId]);

  const handleCreateClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (creating) return; // Prevent double click

    setCreating(true);
    try {
        await onNewEbook();
    } catch (err) {
        console.error("Error creating ebook from dashboard:", err);
        alert("Terjadi kesalahan saat membuat proyek.");
    } finally {
        if (isMounted.current) {
             setCreating(false);
        }
    }
  };

  // Hapus Permanen - Langsung & Otomatis (Tanpa Konfirmasi)
  const handleDeleteFromDB = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Mencegah kartu terbuka saat tombol hapus diklik
    
    // Set loading pada item spesifik
    setDeletingId(id);

    try {
      // 1. Hapus dari Database / Local Storage
      await deleteEbook(id, userId);
      
      // 2. Update UI secara otomatis (Hapus dari state array)
      setEbooks(prev => prev.filter(b => b.id !== id));
      
      // 3. Jika yang dihapus adalah yang sedang aktif di banner, tutup sesi
      if (activeDraft?.id === id && onCloseSession) {
          onCloseSession(); 
      }
    } catch (error) {
      console.error("Gagal menghapus:", error);
      alert("Gagal menghapus eBook. Silakan coba lagi.");
    } finally {
      setDeletingId(null);
    }
  };

  const calculateProgress = (outline: any[]) => {
    if (!outline || outline.length === 0) return 0;
    const completed = outline.filter((c: any) => c.status === 'completed').length;
    return Math.round((completed / outline.length) * 100);
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-50 dark:bg-gray-900 p-8 transition-colors duration-200">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Perpustakaan Saya</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Kelola semua proyek eBook Anda di sini.</p>
          </div>
          {/* Tombol Buat Baru (Selalu Aktif - Instant - Multi Ebook) */}
          <button
            type="button"
            onClick={handleCreateClick}
            disabled={creating}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-600/20 transition-all hover:-translate-y-0.5 cursor-pointer disabled:opacity-70 disabled:cursor-wait"
          >
            {creating ? <Loader2 size={20} className="animate-spin"/> : <Plus size={20} />}
            <span>{creating ? 'Membuat...' : 'Buat Proyek Baru'}</span>
          </button>
        </div>

        {/* --- ACTIVE SESSION BANNER (SESSION TERAKHIR) --- */}
        {activeDraft && onResumeDraft && (
          <div className="animate-fade-in bg-gradient-to-r from-indigo-50 to-white dark:from-indigo-900/20 dark:to-gray-800 rounded-xl border border-indigo-200 dark:border-indigo-800 p-6 shadow-md relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10">
                <Activity size={100} className="text-indigo-600" />
             </div>
             <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                   <div className="flex items-center gap-2 mb-2">
                      <span className="bg-indigo-600 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-full animate-pulse">Sesi Terakhir</span>
                   </div>
                   <h3 className="text-xl font-bold text-gray-900 dark:text-white">{activeDraft.title || "Proyek Baru"}</h3>
                   <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-xl truncate">
                      {activeDraft.subtitle || "Belum ada subjudul..."}
                   </p>
                </div>
                <div className="flex flex-col gap-2 w-full sm:w-auto">
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        onResumeDraft();
                      }}
                      className="whitespace-nowrap flex items-center justify-center gap-2 px-5 py-2.5 bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-300 font-bold rounded-lg border border-indigo-100 dark:border-gray-600 shadow-sm hover:shadow-md transition-all cursor-pointer w-full"
                    >
                      <Edit3 size={18} /> Lanjutkan Menulis
                    </button>

                    {/* TOMBOL HAPUS PROYEK (ACTIVE) */}
                    {activeDraft.id && (
                        <button 
                          type="button"
                          onClick={(e) => handleDeleteFromDB(e, activeDraft.id!)}
                          disabled={deletingId === activeDraft.id}
                          className="whitespace-nowrap flex items-center justify-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer w-full text-sm disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                          {deletingId === activeDraft.id ? <Loader2 size={16} className="animate-spin"/> : <Trash2 size={16} />}
                          <span>Hapus Proyek</span>
                        </button>
                    )}
                </div>
             </div>
          </div>
        )}

        {/* --- GRID LIST EBOOKS (DATABASE) --- */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="animate-spin text-indigo-600" size={40} />
          </div>
        ) : ebooks.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
            <BookOpen size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Belum ada eBook</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Semua proyek Anda akan tersimpan aman di database.</p>
            {/* BUTTON IN EMPTY STATE */}
            <button
                type="button"
                onClick={handleCreateClick}
                disabled={creating}
                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg transition-all hover:-translate-y-0.5 cursor-pointer disabled:opacity-70"
            >
                {creating ? <Loader2 size={20} className="animate-spin"/> : <Plus size={20} />} 
                <span>{creating ? 'Membuat...' : 'Buat eBook Pertama'}</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ebooks.map((ebook) => {
              const progress = calculateProgress(ebook.outline);
              const isActive = activeDraft?.id === ebook.id;
              const isDeletingThis = deletingId === ebook.id;
              
              return (
                <div 
                  key={ebook.id}
                  onClick={() => !isDeletingThis && onOpenEbook(ebook)}
                  className={`group bg-white dark:bg-gray-800 rounded-xl border shadow-sm hover:shadow-xl hover:border-indigo-300 dark:hover:border-indigo-700 transition-all cursor-pointer relative overflow-hidden flex flex-col
                    ${isActive ? 'border-indigo-400 ring-1 ring-indigo-400 dark:border-indigo-600 dark:ring-indigo-600' : 'border-gray-200 dark:border-gray-700'}
                    ${isDeletingThis ? 'opacity-50 pointer-events-none scale-95' : ''}
                  `}
                >
                  <div className="p-6 flex-1">
                    <div className="flex justify-between items-start mb-4">
                      <div className={`p-2 rounded-lg ${isActive ? 'bg-indigo-600 text-white' : 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'}`}>
                        <BookOpen size={24} />
                      </div>
                      
                      {/* TOMBOL HAPUS PROYEK (CARD) */}
                      <button
                        type="button"
                        onClick={(e) => handleDeleteFromDB(e, ebook.id!)}
                        disabled={isDeletingThis}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 dark:text-red-400 rounded-lg transition-colors border border-red-200 dark:border-red-900/30 z-10"
                        title="Hapus Proyek Secara Permanen"
                      >
                        {isDeletingThis ? <Loader2 size={14} className="animate-spin"/> : <Trash2 size={14} />}
                        <span>{isDeletingThis ? 'Menghapus...' : 'Hapus Proyek'}</span>
                      </button>
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 leading-tight">
                      {ebook.title || "Proyek Baru"}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-4">
                      {ebook.subtitle || 'Belum ada subjudul'}
                    </p>
                    
                    <div className="flex items-center gap-2 text-xs text-gray-400 mb-4">
                      <Calendar size={14} />
                      <span>{new Date(ebook.lastUpdated!).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute:'2-digit' })}</span>
                    </div>
                  </div>

                  {/* Footer & Progress */}
                  <div className="bg-gray-50 dark:bg-gray-900/50 p-4 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex justify-between items-center text-sm mb-2">
                       <span className="font-semibold text-gray-700 dark:text-gray-300">{progress}% Selesai</span>
                       <span className="text-indigo-600 dark:text-indigo-400 flex items-center gap-1 text-xs font-bold group-hover:translate-x-1 transition-transform">
                         Buka <ArrowRight size={14}/>
                       </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-indigo-600 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};