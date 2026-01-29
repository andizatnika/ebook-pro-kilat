import React, { useState, useEffect } from 'react';
import { X, User, Globe, LogOut, CheckCircle } from 'lucide-react';
import { LanguageCode, UserSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onUpdateSettings: (newSettings: UserSettings) => void;
  onLogout: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  settings, 
  onUpdateSettings,
  onLogout 
}) => {
  const [activeTab, setActiveTab] = useState<'account' | 'lang'>('lang');

  // Sync state when modal opens
  useEffect(() => {
    if (isOpen) {
      // Modal opened
    }
  }, [isOpen]);

  const languages: { code: LanguageCode; label: string; flag: string }[] = [
    { code: 'id', label: 'Bahasa Indonesia', flag: '🇮🇩' },
    { code: 'en-US', label: 'English (US)', flag: '🇺🇸' },
    { code: 'en-UK', label: 'English (UK)', flag: '🇬🇧' },
    { code: 'ja', label: '日本語 (Japanese)', flag: '🇯🇵' },
    { code: 'ko', label: '한국어 (Korean)', flag: '🇰🇷' },
    { code: 'zh', label: '中文 (Chinese)', flag: '🇨🇳' },
    { code: 'es', label: 'Español', flag: '🇪🇸' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
    { code: 'ar', label: 'العربية (Arabic)', flag: '🇸🇦' },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            Pengaturan Aplikasi
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar Tabs */}
          <div className="w-1/3 bg-gray-50 dark:bg-gray-900/50 border-r border-gray-100 dark:border-gray-700 p-4 space-y-2">
            <button 
              onClick={() => setActiveTab('lang')}
              className={`w-full flex items-center gap-3 p-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'lang' ? 'bg-white dark:bg-gray-800 shadow text-indigo-600 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
            >
              <Globe size={18} /> Bahasa
            </button>
            <button 
              onClick={() => setActiveTab('account')}
              className={`w-full flex items-center gap-3 p-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'account' ? 'bg-white dark:bg-gray-800 shadow text-indigo-600 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
            >
              <User size={18} /> Akun
            </button>
            
            <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
              <button 
                onClick={onLogout}
                className="w-full flex items-center gap-3 p-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
              >
                <LogOut size={18} /> Logout
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 p-6 overflow-y-auto bg-white dark:bg-gray-800">
            
            {/* Language Section */}
            {activeTab === 'lang' && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Bahasa Output</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Pilih bahasa utama untuk hasil eBook yang digenerate.</p>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => onUpdateSettings({ ...settings, language: lang.code })}
                      className={`flex items-center justify-between p-4 rounded-xl border transition-all ${settings.language === lang.code ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 ring-1 ring-indigo-500' : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700'}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{lang.flag}</span>
                        <span className={`font-medium ${settings.language === lang.code ? 'text-indigo-900 dark:text-indigo-100' : 'text-gray-700 dark:text-gray-300'}`}>
                          {lang.label}
                        </span>
                      </div>
                      {settings.language === lang.code && <CheckCircle size={20} className="text-indigo-600 dark:text-indigo-400" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Account Section */}
            {activeTab === 'account' && (
              <div className="space-y-6 animate-fade-in">
                 <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Informasi Akun</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Detail akun pengguna saat ini (Read-only).</p>
                </div>

                <div className="space-y-4">
                  <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Nama Pengguna</label>
                    <div className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <User size={16} className="text-gray-400"/> {settings.username}
                    </div>
                  </div>
                   <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Email</label>
                    <div className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                       <span className="text-gray-400">@</span> {settings.email}
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-100 dark:border-yellow-800 text-sm text-yellow-800 dark:text-yellow-200">
                  Info akun diambil dari sesi login Anda dan tidak dapat diubah di sini.
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};