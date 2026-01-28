import React, { useState, useEffect } from 'react';
import { X, Key, User, Globe, LogOut, CheckCircle, AlertCircle, Loader2, Save } from 'lucide-react';
import { LanguageCode, UserSettings } from '../types';
import { validateApiKey } from '../services/geminiService';

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
  const [apiKeyInput, setApiKeyInput] = useState(settings.apiKey);
  const [validating, setValidating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState<'account' | 'api' | 'lang'>('api');

  // Sync state when modal opens
  useEffect(() => {
    if (isOpen) {
      setApiKeyInput(settings.apiKey);
      setErrorMsg('');
    }
  }, [isOpen, settings.apiKey]);

  const handleSaveApiKey = async () => {
    setValidating(true);
    setErrorMsg('');
    
    const isValid = await validateApiKey(apiKeyInput);
    
    setValidating(false);
    
    if (isValid) {
      // SAVE TO LOCAL STORAGE
      try {
        localStorage.setItem('gemini_api_key', apiKeyInput);
      } catch (e) {
        console.error("Could not save to local storage", e);
      }

      onUpdateSettings({
        ...settings,
        apiKey: apiKeyInput,
        isKeyValid: true
      });
      setErrorMsg(''); // clear error
    } else {
      setErrorMsg('API Key tidak valid. Pastikan key aktif dan benar.');
      onUpdateSettings({
        ...settings,
        isKeyValid: false
      });
    }
  };

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
              onClick={() => setActiveTab('api')}
              className={`w-full flex items-center gap-3 p-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'api' ? 'bg-white dark:bg-gray-800 shadow text-indigo-600 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
            >
              <Key size={18} /> API Key
            </button>
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
            
            {/* API Key Section */}
            {activeTab === 'api' && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Google Gemini API Key</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Kunci akses diperlukan untuk menggunakan fitur generasi AI.</p>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800 flex items-start gap-3">
                  <AlertCircle size={20} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800 dark:text-blue-200">
                    <p>API Key disimpan secara aman di sesi browser Anda. Kami tidak menyimpan key Anda di server kami.</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Input API Key</label>
                  <div className="relative">
                    <input 
                      type="password" 
                      value={apiKeyInput}
                      onChange={(e) => setApiKeyInput(e.target.value)}
                      placeholder="AIzaSy..."
                      className={`w-full pl-10 pr-4 py-3 rounded-lg border ${settings.isKeyValid ? 'border-green-300 focus:ring-green-500' : errorMsg ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-indigo-500'} bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 outline-none transition-all`}
                    />
                    <Key size={18} className="absolute left-3 top-3.5 text-gray-400" />
                    {settings.isKeyValid && !errorMsg && (
                      <CheckCircle size={18} className="absolute right-3 top-3.5 text-green-500" />
                    )}
                  </div>
                  {errorMsg && <p className="text-xs text-red-500 font-medium">{errorMsg}</p>}
                </div>

                <button 
                  onClick={handleSaveApiKey}
                  disabled={validating || !apiKeyInput}
                  className={`w-full py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${settings.isKeyValid ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white disabled:bg-gray-300 disabled:cursor-not-allowed'}`}
                >
                  {validating ? <Loader2 className="animate-spin" size={18}/> : settings.isKeyValid ? <CheckCircle size={18}/> : <Save size={18}/>}
                  {validating ? 'Memvalidasi...' : settings.isKeyValid ? 'Tersimpan & Aktif' : 'Simpan & Aktifkan'}
                </button>
              </div>
            )}

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