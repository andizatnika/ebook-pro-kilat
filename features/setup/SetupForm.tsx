import React, { useState, useEffect } from 'react';
import { EbookConfig } from '../../types';
import { ArrowRight, Wand2 } from 'lucide-react';

interface SetupFormProps {
  onStart: (config: EbookConfig) => void;
  isLoading: boolean;
  initialValues: EbookConfig; // Prop baru untuk data lama
}

export const SetupForm: React.FC<SetupFormProps> = ({ onStart, isLoading, initialValues }) => {
  const [config, setConfig] = useState<EbookConfig>(initialValues);

  // Sync jika initialValues berubah (misal saat back navigation)
  useEffect(() => {
    setConfig(initialValues);
  }, [initialValues]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStart(config);
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-6 transition-colors duration-200">
      <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors duration-200">
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 p-8 text-white">
          <h2 className="text-3xl font-bold mb-2">Mulai Masterpiece Anda</h2>
          <p className="text-indigo-100 opacity-90">Tentukan parameter eBook Anda, dan biarkan AI menyusun struktur profesional untuk Anda.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Topik eBook</label>
            <input
              required
              type="text"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
              placeholder="Contoh: Strategi Digital Marketing untuk UMKM Indonesia"
              value={config.topic}
              onChange={(e) => setConfig({ ...config, topic: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Jumlah Bab (Chapter)</label>
              <input
                type="number"
                min={3}
                max={20}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                value={config.chapterCount}
                onChange={(e) => setConfig({ ...config, chapterCount: parseInt(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Target Pembaca</label>
              <input
                type="text"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Contoh: Mahasiswa, Pemilik Bisnis"
                value={config.targetAudience}
                onChange={(e) => setConfig({ ...config, targetAudience: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Tone & Gaya Bahasa</label>
              <select
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                value={config.tone}
                onChange={(e) => setConfig({ ...config, tone: e.target.value })}
              >
                <option value="Formal Profesional">Formal Profesional</option>
                <option value="Santai dan Sahabat">Santai dan Bersahabat</option>
                <option value="Inspiratif dan Motivasi">Inspiratif dan Motivasi</option>
                <option value="Teknis dan Detail">Teknis dan Detail</option>
                <option value="Akademis">Akademis</option>
              </select>
            </div>

             <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Tujuan Utama</label>
              <input
                type="text"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Contoh: Memberikan panduan praktis step-by-step"
                value={config.goal}
                onChange={(e) => setConfig({ ...config, goal: e.target.value })}
              />
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-4 rounded-xl flex items-center justify-center gap-2 font-bold text-lg transition-all shadow-lg hover:shadow-xl ${
                isLoading 
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed' 
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:-translate-y-0.5'
              }`}
            >
              {isLoading ? (
                <>
                  <Wand2 className="animate-spin" /> Sedang Menyusun Outline...
                </>
              ) : (
                <>
                  Buat Blueprint Buku <ArrowRight size={20} />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};