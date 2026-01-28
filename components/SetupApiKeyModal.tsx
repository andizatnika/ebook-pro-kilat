import React, { useState, useEffect } from 'react';
import { Key, AlertCircle, CheckCircle, Loader2, X } from 'lucide-react';

interface SetupApiKeyModalProps {
  isOpen: boolean;
  onComplete: (apiKey: string) => void;
  isLoading?: boolean;
  errorMessage?: string;
}

export const SetupApiKeyModal: React.FC<SetupApiKeyModalProps> = ({
  isOpen,
  onComplete,
  isLoading = false,
  errorMessage = '',
}) => {
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [validating, setValidating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setApiKeyInput('');
      setShowKey(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKeyInput.trim()) return;

    setValidating(true);
    // Validation happens in parent component via API call
    onComplete(apiKeyInput);
    // Reset is handled by parent when modal closes
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <Key size={28} />
            <h2 className="text-2xl font-bold">Setup API Key</h2>
          </div>
          <p className="text-indigo-100">
            Diperlukan untuk menggunakan fitur generasi konten dengan AI
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Info Box */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex gap-3">
            <AlertCircle className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" size={18} />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-semibold mb-1">Bagaimana cara mendapatkan API Key?</p>
              <ol className="list-decimal ml-4 space-y-1">
                <li>Kunjungi <a href="https://aistudio.google.com" target="_blank" rel="noopener noreferrer" className="underline font-semibold hover:text-blue-700">Google AI Studio</a></li>
                <li>Login dengan akun Google Anda</li>
                <li>Klik "Create API Key" atau "Get API Key"</li>
                <li>Copy dan tempel di bawah ini</li>
              </ol>
            </div>
          </div>

          {/* Get API Key Button */}
          <a
            href="https://aistudio.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-4 rounded-lg transition-all"
          >
            <Key size={18} />
            Dapatkan API Key Google Gemini
          </a>

          {/* Free Tier Info */}
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex gap-3">
            <CheckCircle className="text-green-600 dark:text-green-400 shrink-0 mt-0.5" size={18} />
            <div className="text-sm text-green-800 dark:text-green-200">
              <p className="font-semibold">Gratis untuk Pemula!</p>
              <p className="text-xs mt-1">API Key gratis dari Google sudah cukup untuk mulai membuat eBook dengan AI.</p>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex gap-3">
              <AlertCircle className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" size={18} />
              <p className="text-sm text-red-800 dark:text-red-200">{errorMessage}</p>
            </div>
          )}

          {/* API Key Input Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Masukkan API Key
              </label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="AIzaSyDxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  disabled={isLoading || validating}
                  className="w-full px-4 py-3 pr-12 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:border-indigo-500 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed transition"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  disabled={isLoading || validating || !apiKeyInput}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 disabled:opacity-50"
                >
                  {showKey ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!apiKeyInput.trim() || isLoading || validating}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
            >
              {validating || isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Memverifikasi...
                </>
              ) : (
                <>
                  <Key size={18} />
                  Simpan & Verifikasi API Key
                </>
              )}
            </button>
          </form>

          {/* Footer Note */}
          <p className="text-xs text-center text-gray-500 dark:text-gray-400">
            API Key Anda disimpan aman di database kami dan hanya digunakan untuk permintaan generasi konten.
          </p>
        </div>
      </div>
    </div>
  );
};
