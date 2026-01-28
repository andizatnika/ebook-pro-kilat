import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { BookOpen, Loader2, Mail, Lock, ArrowRight, AlertCircle, Eye, EyeOff } from 'lucide-react';

export const AuthPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Gunakan pengecekan dari supabaseClient
    if (!isSupabaseConfigured) {
      setErrorMsg("Konfigurasi Supabase URL & Key belum dipasang. Silakan cek file services/supabaseClient.ts.");
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setSuccessMsg('Registrasi berhasil! Silakan cek INBOX email Anda (termasuk Spam) untuk verifikasi agar bisa login.');
        setMode('login'); // Switch to login after signup
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        // Session handling is done in App.tsx via onAuthStateChange
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      // Friendly error mapping
      let msg = error.message || 'Terjadi kesalahan saat autentikasi.';
      
      // Common Supabase Errors
      if (msg.includes('placeholder')) msg = "Koneksi database belum dikonfigurasi.";
      if (msg.includes('fetch')) msg = "Gagal terhubung ke server. Cek koneksi internet atau konfigurasi database.";
      if (msg.includes('Invalid login credentials')) msg = "Email atau password salah.";
      if (msg.includes('Email not confirmed')) msg = "Email belum diverifikasi. Silakan cek inbox/spam email Anda atau matikan fitur 'Confirm Email' di dashboard Supabase.";
      
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center items-center p-4 transition-colors duration-200">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-3 rounded-xl text-white shadow-lg shadow-indigo-600/20">
              <BookOpen size={32} />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">Pro Ebook Kilat</h1>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {mode === 'login' ? 'Selamat Datang Kembali' : 'Buat Akun Baru'}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8">
              {mode === 'login' 
                ? 'Masuk untuk melanjutkan penulisan eBook Anda.' 
                : 'Mulai perjalanan menulis eBook profesional dengan AI.'}
            </p>

            {errorMsg && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-lg flex items-start gap-3">
                <AlertCircle size={20} className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                <p className="text-sm text-red-800 dark:text-red-200">{errorMsg}</p>
              </div>
            )}

            {successMsg && (
              <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-lg flex items-start gap-3">
                <div className="text-sm text-green-800 dark:text-green-200">{successMsg}</div>
              </div>
            )}

            <form onSubmit={handleAuth} className="space-y-5">
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Email</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    placeholder="nama@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <Mail size={18} className="absolute left-3 top-3.5 text-gray-400" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    className="w-full pl-10 pr-12 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <Lock size={18} className="absolute left-3 top-3.5 text-gray-400" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none p-1"
                    title={showPassword ? "Sembunyikan Password" : "Lihat Password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-lg font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg hover:shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    {mode === 'login' ? 'Masuk' : 'Daftar'} <ArrowRight size={20} />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900/50 p-4 text-center border-t border-gray-100 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {mode === 'login' ? 'Belum punya akun?' : 'Sudah punya akun?'}
              <button
                onClick={() => {
                  setMode(mode === 'login' ? 'signup' : 'login');
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className="ml-1 font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                {mode === 'login' ? 'Daftar Sekarang' : 'Login di sini'}
              </button>
            </p>
          </div>
        </div>
        
        {!isSupabaseConfigured && (
          <div className="mt-8 p-4 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm text-center">
            <strong>Konfigurasi Diperlukan:</strong> Pastikan Anda telah mengatur <code>SUPABASE_URL</code> dan <code>SUPABASE_ANON_KEY</code> di file <code>services/supabaseClient.ts</code>.
          </div>
        )}
      </div>
    </div>
  );
};